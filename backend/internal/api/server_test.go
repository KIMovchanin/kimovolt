package api_test

import (
	"bytes"
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"net/http/cookiejar"
	"net/http/httptest"
	"path/filepath"
	"strings"
	"testing"

	"kimovolt-lab/backend/internal/api"
	"kimovolt-lab/backend/internal/db"
	"kimovolt-lab/backend/internal/web"
)

func setupTestServer(t *testing.T) (*httptest.Server, *http.Client) {
	t.Helper()
	dbPath := filepath.Join(t.TempDir(), "test.db")
	conn, err := db.Open(dbPath)
	if err != nil {
		t.Fatalf("db.Open: %v", err)
	}
	t.Cleanup(func() { _ = conn.Close() })

	logger := slog.New(slog.NewTextHandler(io.Discard, nil))
	mux := http.NewServeMux()
	srv := api.NewServer(conn, logger, false)
	srv.RegisterRoutes(mux)
	web.RegisterStaticAndSEO(mux, "", "https://kimovolt.example")

	ts := httptest.NewServer(api.SecurityHeadersMiddleware(mux))
	t.Cleanup(ts.Close)

	jar, _ := cookiejar.New(nil)
	client := &http.Client{Jar: jar}
	return ts, client
}

func TestBackendIntegrationFlow(t *testing.T) {
	ts, client := setupTestServer(t)

	// 1. Health & Security Headers
	res, err := client.Get(ts.URL + "/api/v1/health")
	if err != nil {
		t.Fatalf("health GET: %v", err)
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		t.Fatalf("expected 200 health, got %d", res.StatusCode)
	}
	if res.Header.Get("X-Content-Type-Options") != "nosniff" {
		t.Fatalf("missing nosniff header")
	}

	// 2. Guest /me returns null user cleanly
	meGuest, _ := client.Get(ts.URL + "/api/v1/auth/me")
	var mePayload map[string]any
	_ = json.NewDecoder(meGuest.Body).Decode(&mePayload)
	meGuest.Body.Close()
	if mePayload["user"] != nil {
		t.Fatalf("expected guest user nil, got %v", mePayload["user"])
	}

	// 3. Register with weak password rejected
	badReg, _ := client.Post(
		ts.URL+"/api/v1/auth/register",
		"application/json",
		strings.NewReader(`{"email":"maker@kimovolt.lab","password":"123","displayName":"Maker"}`),
	)
	badReg.Body.Close()
	if badReg.StatusCode != http.StatusBadRequest {
		t.Fatalf("expected 400 weak password, got %d", badReg.StatusCode)
	}

	// 4. Register valid user
	regRes, err := client.Post(
		ts.URL+"/api/v1/auth/register",
		"application/json",
		strings.NewReader(`{"email":"maker@kimovolt.lab","password":"StrongPassword123","displayName":"Kim Maker"}`),
	)
	if err != nil {
		t.Fatalf("register POST: %v", err)
	}
	var regBody struct {
		User      api.AuthUser `json:"user"`
		CSRFToken string       `json:"csrfToken"`
	}
	_ = json.NewDecoder(regRes.Body).Decode(&regBody)
	regRes.Body.Close()
	if regRes.StatusCode != http.StatusCreated || regBody.CSRFToken == "" {
		t.Fatalf("expected 201 + csrfToken, got %d", regRes.StatusCode)
	}

	// 5. CSRF enforcement blocks mutating request without X-CSRF-Token
	reqNoCSRF, _ := http.NewRequest(
		http.MethodPut,
		ts.URL+"/api/v1/progress",
		strings.NewReader(`{"progress":{"xp":50,"streakDays":1,"lessons":{},"skills":{},"achievements":[],"misconceptionCounts":{},"notebook":[],"inspectedComponentTypes":[],"easterEggsFound":[]}}`),
	)
	reqNoCSRF.Header.Set("Content-Type", "application/json")
	noCsrfRes, _ := client.Do(reqNoCSRF)
	noCsrfRes.Body.Close()
	if noCsrfRes.StatusCode != http.StatusForbidden {
		t.Fatalf("expected 403 CSRF missing, got %d", noCsrfRes.StatusCode)
	}

	// 6. Guest -> Account migration succeeds with CSRF token
	migPayload := `{
		"progress": {
			"xp": 120,
			"streakDays": 2,
			"lastActiveDate": "2026-11-19",
			"lessons": {"m0-first-led": {"lessonId":"m0-first-led","status":"completed","bestScore":100}},
			"skills": {"closed_loop": {"skillId":"closed_loop","mastery":90}},
			"achievements": ["FIRST_SPARK"],
			"misconceptionCounts": {},
			"notebook": [{"id":"takeaway-m0-first-led","kind":"takeaway","title":"First LED","body":"Loop closed"}],
			"inspectedComponentTypes": ["resistor"],
			"easterEggsFound": []
		},
		"circuits": [{
			"id": "circ-guest-1",
			"name": "Guest Blink",
			"document": {"schemaVersion":1,"id":"c1","name":"Guest Blink","viewMode":"schematic","components":[],"wires":[]},
			"updatedAt": "2026-11-19T01:00:00Z"
		}]
	}`
	migReq, _ := http.NewRequest(http.MethodPost, ts.URL+"/api/v1/sync/migrate-guest", strings.NewReader(migPayload))
	migReq.Header.Set("Content-Type", "application/json")
	migReq.Header.Set("X-CSRF-Token", regBody.CSRFToken)
	migRes, err := client.Do(migReq)
	if err != nil {
		t.Fatalf("migrate POST: %v", err)
	}
	var migOut struct {
		Progress struct {
			XP           int      `json:"xp"`
			Achievements []string `json:"achievements"`
		} `json:"progress"`
		Circuits []api.SavedCircuitRecord `json:"circuits"`
	}
	_ = json.NewDecoder(migRes.Body).Decode(&migOut)
	migRes.Body.Close()
	if migRes.StatusCode != http.StatusOK || migOut.Progress.XP != 120 || len(migOut.Circuits) != 1 {
		t.Fatalf("unexpected migration output: status=%d xp=%d circuits=%d", migRes.StatusCode, migOut.Progress.XP, len(migOut.Circuits))
	}

	// 7. Oversized circuit (>256 KB) rejected
	oversizeDoc := strings.Repeat("a", 270*1024)
	bigReq, _ := http.NewRequest(http.MethodPost, ts.URL+"/api/v1/circuits", bytes.NewBufferString(oversizeDoc))
	bigReq.Header.Set("Content-Type", "application/json")
	bigReq.Header.Set("X-CSRF-Token", regBody.CSRFToken)
	bigRes, _ := client.Do(bigReq)
	bigRes.Body.Close()
	if bigRes.StatusCode != http.StatusBadRequest {
		t.Fatalf("expected 400 oversized payload, got %d", bigRes.StatusCode)
	}

	// 8. Logout & verify login works with Argon2id
	outReq, _ := http.NewRequest(http.MethodPost, ts.URL+"/api/v1/auth/logout", nil)
	outReq.Header.Set("X-CSRF-Token", regBody.CSRFToken)
	outRes, _ := client.Do(outReq)
	outRes.Body.Close()
	if outRes.StatusCode != http.StatusOK {
		t.Fatalf("logout failed: %d", outRes.StatusCode)
	}

	loginRes, _ := client.Post(
		ts.URL+"/api/v1/auth/login",
		"application/json",
		strings.NewReader(`{"email":"maker@kimovolt.lab","password":"StrongPassword123"}`),
	)
	loginRes.Body.Close()
	if loginRes.StatusCode != http.StatusOK {
		t.Fatalf("expected login 200, got %d", loginRes.StatusCode)
	}

	// 9. SEO endpoints robots.txt and sitemap.xml
	robotsRes, _ := client.Get(ts.URL + "/robots.txt")
	robotsBytes, _ := io.ReadAll(robotsRes.Body)
	robotsRes.Body.Close()
	if !strings.Contains(string(robotsBytes), "Disallow: /profile") || !strings.Contains(string(robotsBytes), "https://kimovolt.example/sitemap.xml") {
		t.Fatalf("unexpected robots.txt: %s", string(robotsBytes))
	}
}

func TestClientIPBehindLoopbackProxy(t *testing.T) {
	req1, _ := http.NewRequest(http.MethodGet, "/", nil)
	req1.RemoteAddr = "127.0.0.1:54321"
	req1.Header.Set("X-Real-IP", "203.0.113.10")
	if got := api.ClientIP(req1); got != "203.0.113.10" {
		t.Fatalf("expected X-Real-IP from loopback proxy, got %q", got)
	}

	req2, _ := http.NewRequest(http.MethodGet, "/", nil)
	req2.RemoteAddr = "[::1]:54321"
	req2.Header.Set("X-Forwarded-For", "198.51.100.7, 127.0.0.1")
	if got := api.ClientIP(req2); got != "198.51.100.7" {
		t.Fatalf("expected first X-Forwarded-For IP from IPv6 loopback proxy, got %q", got)
	}

	req3, _ := http.NewRequest(http.MethodGet, "/", nil)
	req3.RemoteAddr = "198.51.100.20:4444"
	req3.Header.Set("X-Real-IP", "203.0.113.10")
	req3.Header.Set("X-Forwarded-For", "203.0.113.11")
	if got := api.ClientIP(req3); got != "198.51.100.20" {
		t.Fatalf("expected direct remote IP when peer is non-loopback, got %q", got)
	}

	req4, _ := http.NewRequest(http.MethodGet, "/", nil)
	req4.RemoteAddr = "127.0.0.1:54321"
	if got := api.ClientIP(req4); got != "127.0.0.1" {
		t.Fatalf("expected 127.0.0.1 without proxy headers, got %q", got)
	}
}

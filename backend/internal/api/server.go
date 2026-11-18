package api

import (
	"database/sql"
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net"
	"net/http"
	"net/mail"
	"strings"
	"time"

	"kimovolt-lab/backend/internal/auth"
)

const (
	SessionCookieName = "kv_session"
	SessionTTL        = 14 * 24 * time.Hour
	MaxCircuitBytes   = 256 * 1024
	MaxSyncBytes      = 512 * 1024
)

type AuthUser struct {
	ID          string `json:"id"`
	Email       string `json:"email"`
	DisplayName string `json:"displayName"`
	CreatedAt   string `json:"createdAt"`
}

type SavedCircuitRecord struct {
	ID        string          `json:"id"`
	Name      string          `json:"name"`
	Document  json.RawMessage `json:"document"`
	UpdatedAt string          `json:"updatedAt"`
}

type Server struct {
	db           *sql.DB
	logger       *slog.Logger
	cookieSecure bool
	authLimiter  *auth.RateLimiter
	writeLimiter *auth.RateLimiter
}

func NewServer(db *sql.DB, logger *slog.Logger, cookieSecure bool) *Server {
	return &Server{
		db:           db,
		logger:       logger,
		cookieSecure: cookieSecure,
		authLimiter:  auth.NewRateLimiter(20, time.Minute),
		writeLimiter: auth.NewRateLimiter(120, time.Minute),
	}
}

func (s *Server) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/v1/health", s.handleHealth)
	mux.HandleFunc("POST /api/v1/auth/register", s.handleRegister)
	mux.HandleFunc("POST /api/v1/auth/login", s.handleLogin)
	mux.HandleFunc("POST /api/v1/auth/logout", s.handleLogout)
	mux.HandleFunc("GET /api/v1/auth/me", s.handleMe)
	mux.HandleFunc("POST /api/v1/sync/migrate-guest", s.handleMigrateGuest)
	mux.HandleFunc("GET /api/v1/progress", s.handleGetProgress)
	mux.HandleFunc("PUT /api/v1/progress", s.handleSaveProgress)
	mux.HandleFunc("GET /api/v1/circuits", s.handleListCircuits)
	mux.HandleFunc("POST /api/v1/circuits", s.handleUpsertCircuit)
	mux.HandleFunc("DELETE /api/v1/circuits/{id}", s.handleDeleteCircuit)
}

func SecurityHeadersMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
		w.Header().Set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
		w.Header().Set(
			"Content-Security-Policy",
			"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; worker-src 'self' blob:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'",
		)
		next.ServeHTTP(w, r)
	})
}

func clientIP(r *http.Request) string {
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err == nil && host != "" {
		return host
	}
	return r.RemoteAddr
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func writeErr(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}

func readLimitedJSON(w http.ResponseWriter, r *http.Request, maxBytes int64, dst any) error {
	r.Body = http.MaxBytesReader(w, r.Body, maxBytes)
	dec := json.NewDecoder(r.Body)
	if err := dec.Decode(dst); err != nil {
		var maxErr *http.MaxBytesError
		if errors.As(err, &maxErr) {
			return errors.New("request body too large")
		}
		return errors.New("invalid JSON payload")
	}
	var extra any
	if err := dec.Decode(&extra); err != io.EOF {
		return errors.New("unexpected trailing JSON content")
	}
	return nil
}

func (s *Server) handleHealth(w http.ResponseWriter, _ *http.Request) {
	var ok int
	if err := s.db.QueryRow("SELECT 1").Scan(&ok); err != nil {
		writeErr(w, http.StatusServiceUnavailable, "database unavailable")
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{
		"status":  "ok",
		"service": "kimovolt-lab",
		"version": "1.0.0",
	})
}

type sessionInfo struct {
	User      AuthUser
	CSRFToken string
	TokenHash string
}

func (s *Server) authenticate(r *http.Request) (*sessionInfo, error) {
	c, err := r.Cookie(SessionCookieName)
	if err != nil || strings.TrimSpace(c.Value) == "" {
		return nil, sql.ErrNoRows
	}
	tokenHash := auth.HashSessionToken(c.Value)
	var info sessionInfo
	var expiresAt string
	err = s.db.QueryRow(`
		SELECT u.id, u.email, u.display_name, u.created_at, s.csrf_token, s.expires_at
		FROM sessions s
		JOIN users u ON u.id = s.user_id
		WHERE s.token_hash = ?
	`, tokenHash).Scan(
		&info.User.ID,
		&info.User.Email,
		&info.User.DisplayName,
		&info.User.CreatedAt,
		&info.CSRFToken,
		&expiresAt,
	)
	if err != nil {
		return nil, err
	}
	exp, err := time.Parse(time.RFC3339, expiresAt)
	if err != nil || time.Now().UTC().After(exp) {
		_, _ = s.db.Exec(`DELETE FROM sessions WHERE token_hash = ?`, tokenHash)
		return nil, sql.ErrNoRows
	}
	info.TokenHash = tokenHash
	return &info, nil
}

func (s *Server) requireAuth(w http.ResponseWriter, r *http.Request, checkCSRF bool) (*sessionInfo, bool) {
	info, err := s.authenticate(r)
	if err != nil {
		writeErr(w, http.StatusUnauthorized, "authentication required")
		return nil, false
	}
	if checkCSRF {
		gotCSRF := r.Header.Get("X-CSRF-Token")
		if gotCSRF == "" || gotCSRF != info.CSRFToken {
			writeErr(w, http.StatusForbidden, "invalid or missing CSRF token")
			return nil, false
		}
	}
	return info, true
}

func (s *Server) issueSession(w http.ResponseWriter, userID string) (string, error) {
	rawToken, err := auth.RandomToken(32)
	if err != nil {
		return "", err
	}
	csrfToken, err := auth.RandomToken(24)
	if err != nil {
		return "", err
	}
	tokenHash := auth.HashSessionToken(rawToken)
	now := time.Now().UTC()
	exp := now.Add(SessionTTL)

	if _, err := s.db.Exec(`
		INSERT INTO sessions (token_hash, user_id, csrf_token, expires_at, created_at)
		VALUES (?, ?, ?, ?, ?)
	`, tokenHash, userID, csrfToken, exp.Format(time.RFC3339), now.Format(time.RFC3339)); err != nil {
		return "", err
	}

	http.SetCookie(w, &http.Cookie{
		Name:     SessionCookieName,
		Value:    rawToken,
		Path:     "/",
		Expires:  exp,
		MaxAge:   int(SessionTTL.Seconds()),
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Secure:   s.cookieSecure,
	})
	w.Header().Set("X-CSRF-Token", csrfToken)
	return csrfToken, nil
}

func (s *Server) handleRegister(w http.ResponseWriter, r *http.Request) {
	if !s.authLimiter.Allow("reg:" + clientIP(r)) {
		writeErr(w, http.StatusTooManyRequests, "too many attempts; please wait")
		return
	}

	var req struct {
		Email       string `json:"email"`
		Password    string `json:"password"`
		DisplayName string `json:"displayName"`
	}
	if err := readLimitedJSON(w, r, 16*1024, &req); err != nil {
		writeErr(w, http.StatusBadRequest, err.Error())
		return
	}

	email := strings.ToLower(strings.TrimSpace(req.Email))
	addr, err := mail.ParseAddress(email)
	if err != nil || addr.Address != email || len(email) > 120 {
		writeErr(w, http.StatusBadRequest, "invalid email address")
		return
	}
	displayName := strings.TrimSpace(req.DisplayName)
	if len(displayName) < 2 || len(displayName) > 48 {
		writeErr(w, http.StatusBadRequest, "display name must be 2 to 48 characters")
		return
	}
	pwHash, err := auth.HashPassword(req.Password)
	if err != nil {
		writeErr(w, http.StatusBadRequest, err.Error())
		return
	}

	userID, err := auth.RandomToken(16)
	if err != nil {
		writeErr(w, http.StatusInternalServerError, "failed to generate user id")
		return
	}
	now := time.Now().UTC().Format(time.RFC3339)

	tx, err := s.db.Begin()
	if err != nil {
		writeErr(w, http.StatusInternalServerError, "database error")
		return
	}
	if _, err := tx.Exec(`
		INSERT INTO users (id, email, display_name, password_hash, created_at)
		VALUES (?, ?, ?, ?, ?)
	`, userID, email, displayName, pwHash, now); err != nil {
		_ = tx.Rollback()
		if strings.Contains(strings.ToLower(err.Error()), "unique") {
			writeErr(w, http.StatusConflict, "account with this email already exists")
			return
		}
		writeErr(w, http.StatusInternalServerError, "failed to create user")
		return
	}

	emptyProgress := `{"xp":0,"streakDays":0,"lastActiveDate":null,"lessons":{},"skills":{},"achievements":[],"misconceptionCounts":{},"notebook":[],"inspectedComponentTypes":[],"easterEggsFound":[]}`
	if _, err := tx.Exec(`
		INSERT INTO user_progress (user_id, xp, streak_days, progress_json, updated_at)
		VALUES (?, 0, 0, ?, ?)
	`, userID, emptyProgress, now); err != nil {
		_ = tx.Rollback()
		writeErr(w, http.StatusInternalServerError, "failed to initialize progress")
		return
	}
	if err := tx.Commit(); err != nil {
		writeErr(w, http.StatusInternalServerError, "commit failed")
		return
	}

	csrf, err := s.issueSession(w, userID)
	if err != nil {
		writeErr(w, http.StatusInternalServerError, "session error")
		return
	}

	s.logger.Info("user registered", "userId", userID)
	writeJSON(w, http.StatusCreated, map[string]any{
		"user": AuthUser{
			ID:          userID,
			Email:       email,
			DisplayName: displayName,
			CreatedAt:   now,
		},
		"csrfToken": csrf,
	})
}

func (s *Server) handleLogin(w http.ResponseWriter, r *http.Request) {
	if !s.authLimiter.Allow("login:" + clientIP(r)) {
		writeErr(w, http.StatusTooManyRequests, "too many login attempts")
		return
	}

	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := readLimitedJSON(w, r, 16*1024, &req); err != nil {
		writeErr(w, http.StatusBadRequest, err.Error())
		return
	}
	email := strings.ToLower(strings.TrimSpace(req.Email))

	var u AuthUser
	var pwHash string
	err := s.db.QueryRow(`
		SELECT id, email, display_name, password_hash, created_at
		FROM users WHERE email = ?
	`, email).Scan(&u.ID, &u.Email, &u.DisplayName, &pwHash, &u.CreatedAt)
	if err != nil || !auth.VerifyPassword(req.Password, pwHash) {
		writeErr(w, http.StatusUnauthorized, "invalid email or password")
		return
	}

	csrf, err := s.issueSession(w, u.ID)
	if err != nil {
		writeErr(w, http.StatusInternalServerError, "session error")
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"user":      u,
		"csrfToken": csrf,
	})
}

func (s *Server) handleLogout(w http.ResponseWriter, r *http.Request) {
	info, ok := s.requireAuth(w, r, true)
	if !ok {
		return
	}
	_, _ = s.db.Exec(`DELETE FROM sessions WHERE token_hash = ?`, info.TokenHash)
	http.SetCookie(w, &http.Cookie{
		Name:     SessionCookieName,
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Secure:   s.cookieSecure,
	})
	writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
}

func (s *Server) handleMe(w http.ResponseWriter, r *http.Request) {
	info, err := s.authenticate(r)
	if err != nil {
		writeJSON(w, http.StatusOK, map[string]any{"user": nil})
		return
	}
	w.Header().Set("X-CSRF-Token", info.CSRFToken)
	writeJSON(w, http.StatusOK, map[string]any{
		"user":      info.User,
		"csrfToken": info.CSRFToken,
	})
}

type progressDTO struct {
	XP                      int                        `json:"xp"`
	StreakDays              int                        `json:"streakDays"`
	LastActiveDate          *string                    `json:"lastActiveDate"`
	Lessons                 map[string]json.RawMessage `json:"lessons"`
	Skills                  map[string]json.RawMessage `json:"skills"`
	Achievements            []string                   `json:"achievements"`
	MisconceptionCounts     map[string]int             `json:"misconceptionCounts"`
	Notebook                []json.RawMessage          `json:"notebook"`
	InspectedComponentTypes []string                   `json:"inspectedComponentTypes"`
	EasterEggsFound         []string                   `json:"easterEggsFound"`
}

func mergeProgress(existingRaw string, guest progressDTO) (string, progressDTO) {
	var cur progressDTO
	if err := json.Unmarshal([]byte(existingRaw), &cur); err != nil {
		cur = progressDTO{
			Lessons:             map[string]json.RawMessage{},
			Skills:              map[string]json.RawMessage{},
			MisconceptionCounts: map[string]int{},
		}
	}
	if cur.Lessons == nil {
		cur.Lessons = map[string]json.RawMessage{}
	}
	if cur.Skills == nil {
		cur.Skills = map[string]json.RawMessage{}
	}
	if cur.MisconceptionCounts == nil {
		cur.MisconceptionCounts = map[string]int{}
	}

	if guest.XP > cur.XP {
		cur.XP = guest.XP
	}
	if guest.StreakDays > cur.StreakDays {
		cur.StreakDays = guest.StreakDays
	}
	if guest.LastActiveDate != nil && (cur.LastActiveDate == nil || *guest.LastActiveDate > *cur.LastActiveDate) {
		cur.LastActiveDate = guest.LastActiveDate
	}

	for lid, ljson := range guest.Lessons {
		if _, exists := cur.Lessons[lid]; !exists {
			cur.Lessons[lid] = ljson
		} else {
			var gRec, cRec struct {
				Status    string `json:"status"`
				BestScore int    `json:"bestScore"`
			}
			_ = json.Unmarshal(ljson, &gRec)
			_ = json.Unmarshal(cur.Lessons[lid], &cRec)
			if (gRec.Status == "completed" && cRec.Status != "completed") || gRec.BestScore > cRec.BestScore {
				cur.Lessons[lid] = ljson
			}
		}
	}

	for sid, sjson := range guest.Skills {
		if _, exists := cur.Skills[sid]; !exists {
			cur.Skills[sid] = sjson
		} else {
			var gSk, cSk struct {
				Mastery int `json:"mastery"`
			}
			_ = json.Unmarshal(sjson, &gSk)
			_ = json.Unmarshal(cur.Skills[sid], &cSk)
			if gSk.Mastery > cSk.Mastery {
				cur.Skills[sid] = sjson
			}
		}
	}

	mergeSet := func(a, b []string) []string {
		seen := map[string]bool{}
		var out []string
		for _, v := range append(a, b...) {
			if !seen[v] {
				seen[v] = true
				out = append(out, v)
			}
		}
		if out == nil {
			return []string{}
		}
		return out
	}

	cur.Achievements = mergeSet(cur.Achievements, guest.Achievements)
	cur.InspectedComponentTypes = mergeSet(cur.InspectedComponentTypes, guest.InspectedComponentTypes)
	cur.EasterEggsFound = mergeSet(cur.EasterEggsFound, guest.EasterEggsFound)

	for k, v := range guest.MisconceptionCounts {
		if v > cur.MisconceptionCounts[k] {
			cur.MisconceptionCounts[k] = v
		}
	}

	// Deduplicate notebook entries by ID
	seenNotes := map[string]bool{}
	var mergedNotes []json.RawMessage
	for _, nRaw := range append(cur.Notebook, guest.Notebook...) {
		var meta struct {
			ID string `json:"id"`
		}
		if json.Unmarshal(nRaw, &meta) == nil && meta.ID != "" {
			if !seenNotes[meta.ID] {
				seenNotes[meta.ID] = true
				mergedNotes = append(mergedNotes, nRaw)
			}
		}
	}
	if mergedNotes == nil {
		mergedNotes = []json.RawMessage{}
	}
	cur.Notebook = mergedNotes

	outBytes, _ := json.Marshal(cur)
	return string(outBytes), cur
}

func (s *Server) handleGetProgress(w http.ResponseWriter, r *http.Request) {
	info, ok := s.requireAuth(w, r, false)
	if !ok {
		return
	}
	var raw string
	err := s.db.QueryRow(`SELECT progress_json FROM user_progress WHERE user_id = ?`, info.User.ID).Scan(&raw)
	if err != nil {
		writeErr(w, http.StatusNotFound, "progress not found")
		return
	}
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	_, _ = w.Write([]byte(`{"progress":` + raw + `}`))
}

func (s *Server) handleSaveProgress(w http.ResponseWriter, r *http.Request) {
	if !s.writeLimiter.Allow("prog:" + clientIP(r)) {
		writeErr(w, http.StatusTooManyRequests, "rate limit exceeded")
		return
	}
	info, ok := s.requireAuth(w, r, true)
	if !ok {
		return
	}
	var req struct {
		Progress progressDTO `json:"progress"`
	}
	if err := readLimitedJSON(w, r, MaxSyncBytes, &req); err != nil {
		writeErr(w, http.StatusBadRequest, err.Error())
		return
	}
	rawBytes, err := json.Marshal(req.Progress)
	if err != nil {
		writeErr(w, http.StatusBadRequest, "invalid progress object")
		return
	}
	now := time.Now().UTC().Format(time.RFC3339)
	_, err = s.db.Exec(`
		INSERT INTO user_progress (user_id, xp, streak_days, progress_json, updated_at)
		VALUES (?, ?, ?, ?, ?)
		ON CONFLICT(user_id) DO UPDATE SET
			xp = excluded.xp,
			streak_days = excluded.streak_days,
			progress_json = excluded.progress_json,
			updated_at = excluded.updated_at
	`, info.User.ID, req.Progress.XP, req.Progress.StreakDays, string(rawBytes), now)
	if err != nil {
		writeErr(w, http.StatusInternalServerError, "failed to save progress")
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
}

func (s *Server) handleMigrateGuest(w http.ResponseWriter, r *http.Request) {
	if !s.writeLimiter.Allow("mig:" + clientIP(r)) {
		writeErr(w, http.StatusTooManyRequests, "rate limit exceeded")
		return
	}
	info, ok := s.requireAuth(w, r, true)
	if !ok {
		return
	}

	var req struct {
		Progress progressDTO          `json:"progress"`
		Circuits []SavedCircuitRecord `json:"circuits"`
	}
	if err := readLimitedJSON(w, r, MaxSyncBytes, &req); err != nil {
		writeErr(w, http.StatusBadRequest, err.Error())
		return
	}

	var existingRaw string
	_ = s.db.QueryRow(`SELECT progress_json FROM user_progress WHERE user_id = ?`, info.User.ID).Scan(&existingRaw)
	mergedJSON, mergedDTO := mergeProgress(existingRaw, req.Progress)
	now := time.Now().UTC().Format(time.RFC3339)

	tx, err := s.db.Begin()
	if err != nil {
		writeErr(w, http.StatusInternalServerError, "db error")
		return
	}
	if _, err := tx.Exec(`
		INSERT INTO user_progress (user_id, xp, streak_days, progress_json, updated_at)
		VALUES (?, ?, ?, ?, ?)
		ON CONFLICT(user_id) DO UPDATE SET
			xp = excluded.xp,
			streak_days = excluded.streak_days,
			progress_json = excluded.progress_json,
			updated_at = excluded.updated_at
	`, info.User.ID, mergedDTO.XP, mergedDTO.StreakDays, mergedJSON, now); err != nil {
		_ = tx.Rollback()
		writeErr(w, http.StatusInternalServerError, "failed to merge progress")
		return
	}

	for _, c := range req.Circuits {
		if len(c.Document) > MaxCircuitBytes || strings.TrimSpace(c.ID) == "" || len(c.ID) > 80 {
			continue
		}
		name := strings.TrimSpace(c.Name)
		if name == "" {
			name = "Untitled Circuit"
		}
		upd := c.UpdatedAt
		if upd == "" {
			upd = now
		}
		if _, err := tx.Exec(`
			INSERT INTO user_circuits (id, user_id, name, circuit_json, updated_at)
			VALUES (?, ?, ?, ?, ?)
			ON CONFLICT(user_id, id) DO NOTHING
		`, c.ID, info.User.ID, name, string(c.Document), upd); err != nil {
			_ = tx.Rollback()
			writeErr(w, http.StatusInternalServerError, "failed to migrate circuits")
			return
		}
	}
	if err := tx.Commit(); err != nil {
		writeErr(w, http.StatusInternalServerError, "commit failed")
		return
	}

	circuits, err := s.loadUserCircuits(info.User.ID)
	if err != nil {
		writeErr(w, http.StatusInternalServerError, "failed to list migrated circuits")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"progress": mergedDTO,
		"circuits": circuits,
	})
}

func (s *Server) loadUserCircuits(userID string) ([]SavedCircuitRecord, error) {
	rows, err := s.db.Query(`
		SELECT id, name, circuit_json, updated_at
		FROM user_circuits
		WHERE user_id = ?
		ORDER BY updated_at DESC
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := []SavedCircuitRecord{}
	for rows.Next() {
		var rec SavedCircuitRecord
		var rawDoc string
		if err := rows.Scan(&rec.ID, &rec.Name, &rawDoc, &rec.UpdatedAt); err != nil {
			return nil, err
		}
		rec.Document = json.RawMessage(rawDoc)
		out = append(out, rec)
	}
	return out, rows.Err()
}

func (s *Server) handleListCircuits(w http.ResponseWriter, r *http.Request) {
	info, ok := s.requireAuth(w, r, false)
	if !ok {
		return
	}
	list, err := s.loadUserCircuits(info.User.ID)
	if err != nil {
		writeErr(w, http.StatusInternalServerError, "failed to list circuits")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"circuits": list})
}

func (s *Server) handleUpsertCircuit(w http.ResponseWriter, r *http.Request) {
	if !s.writeLimiter.Allow("circ:" + clientIP(r)) {
		writeErr(w, http.StatusTooManyRequests, "rate limit exceeded")
		return
	}
	info, ok := s.requireAuth(w, r, true)
	if !ok {
		return
	}
	var rec SavedCircuitRecord
	if err := readLimitedJSON(w, r, MaxCircuitBytes, &rec); err != nil {
		writeErr(w, http.StatusBadRequest, err.Error())
		return
	}
	rec.ID = strings.TrimSpace(rec.ID)
	rec.Name = strings.TrimSpace(rec.Name)
	if rec.ID == "" || len(rec.ID) > 80 {
		writeErr(w, http.StatusBadRequest, "invalid circuit id")
		return
	}
	if rec.Name == "" || len(rec.Name) > 120 {
		writeErr(w, http.StatusBadRequest, "circuit name must be 1 to 120 characters")
		return
	}
	if !json.Valid(rec.Document) {
		writeErr(w, http.StatusBadRequest, "invalid circuit document JSON")
		return
	}
	rec.UpdatedAt = time.Now().UTC().Format(time.RFC3339)

	if _, err := s.db.Exec(`
		INSERT INTO user_circuits (id, user_id, name, circuit_json, updated_at)
		VALUES (?, ?, ?, ?, ?)
		ON CONFLICT(user_id, id) DO UPDATE SET
			name = excluded.name,
			circuit_json = excluded.circuit_json,
			updated_at = excluded.updated_at
	`, rec.ID, info.User.ID, rec.Name, string(rec.Document), rec.UpdatedAt); err != nil {
		writeErr(w, http.StatusInternalServerError, "failed to save circuit")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"circuit": rec})
}

func (s *Server) handleDeleteCircuit(w http.ResponseWriter, r *http.Request) {
	info, ok := s.requireAuth(w, r, true)
	if !ok {
		return
	}
	id := strings.TrimSpace(r.PathValue("id"))
	if id == "" {
		writeErr(w, http.StatusBadRequest, "missing circuit id")
		return
	}
	if _, err := s.db.Exec(`DELETE FROM user_circuits WHERE user_id = ? AND id = ?`, info.User.ID, id); err != nil {
		writeErr(w, http.StatusInternalServerError, "delete failed")
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
}

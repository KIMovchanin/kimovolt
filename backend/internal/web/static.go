package web

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

func RegisterStaticAndSEO(mux *http.ServeMux, staticDir, publicOrigin string) {
	origin := strings.TrimRight(strings.TrimSpace(publicOrigin), "/")
	if origin == "" {
		origin = "https://kimovolt.lab"
	}

	mux.HandleFunc("GET /robots.txt", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "text/plain; charset=utf-8")
		_, _ = fmt.Fprintf(w, `User-agent: *
Allow: /
Allow: /learn
Allow: /reference
Allow: /projects
Disallow: /profile
Disallow: /progress
Disallow: /api/

Sitemap: %s/sitemap.xml
`, origin)
	})

	mux.HandleFunc("GET /sitemap.xml", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/xml; charset=utf-8")
		routes := []string{"/", "/learn", "/lab", "/projects", "/reference"}
		var sb strings.Builder
		sb.WriteString(`<?xml version="1.0" encoding="UTF-8"?>` + "\n")
		sb.WriteString(`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` + "\n")
		for _, r := range routes {
			sb.WriteString("  <url><loc>" + origin + r + "</loc></url>\n")
		}
		sb.WriteString(`</urlset>` + "\n")
		_, _ = w.Write([]byte(sb.String()))
	})

	if staticDir == "" {
		return
	}
	absDir, err := filepath.Abs(staticDir)
	if err != nil {
		return
	}
	fileServer := http.FileServer(http.Dir(absDir))

	mux.HandleFunc("GET /", func(w http.ResponseWriter, r *http.Request) {
		if strings.HasPrefix(r.URL.Path, "/api/") {
			http.NotFound(w, r)
			return
		}
		clean := filepath.Clean(strings.TrimPrefix(r.URL.Path, "/"))
		candidate := filepath.Join(absDir, clean)
		if clean != "." && !strings.HasPrefix(candidate, absDir) {
			http.Error(w, "invalid path", http.StatusBadRequest)
			return
		}

		// Prevent caching HTML shell while caching hashed assets
		if st, err := os.Stat(candidate); err == nil && !st.IsDir() {
			if strings.HasPrefix(r.URL.Path, "/assets/") {
				w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
			}
			fileServer.ServeHTTP(w, r)
			return
		}

		indexPath := filepath.Join(absDir, "index.html")
		if _, err := os.Stat(indexPath); err != nil {
			http.Error(w, "frontend assets not built", http.StatusNotFound)
			return
		}
		w.Header().Set("Cache-Control", "no-store")
		// Do not index private account / progress routes
		if strings.HasPrefix(r.URL.Path, "/profile") || strings.HasPrefix(r.URL.Path, "/progress") {
			w.Header().Set("X-Robots-Tag", "noindex, nofollow")
		}
		http.ServeFile(w, r, indexPath)
	})
}

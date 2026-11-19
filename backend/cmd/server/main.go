package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"kimovolt-lab/backend/internal/api"
	"kimovolt-lab/backend/internal/db"
	"kimovolt-lab/backend/internal/web"
)

func envOr(key, fallback string) string {
	if v := strings.TrimSpace(os.Getenv(key)); v != "" {
		return v
	}
	return fallback
}

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))

	bindAddr := envOr("BIND_ADDR", "")
	port := envOr("PORT", "8080")
	dbPath := envOr("DB_PATH", "./kimovolt.db")
	staticDir := envOr("STATIC_DIR", "./frontend/dist")
	publicOrigin := envOr("PUBLIC_ORIGIN", "https://kimovolt.com")
	cookieSecure := strings.EqualFold(envOr("COOKIE_SECURE", "false"), "true")

	database, err := db.Open(dbPath)
	if err != nil {
		logger.Error("failed to initialize database", "error", err)
		os.Exit(1)
	}
	defer database.Close()

	mux := http.NewServeMux()
	srv := api.NewServer(database, logger, cookieSecure)
	srv.RegisterRoutes(mux)
	web.RegisterStaticAndSEO(mux, staticDir, publicOrigin)

	httpServer := &http.Server{
		Addr:              bindAddr + ":" + port,
		Handler:           api.SecurityHeadersMiddleware(mux),
		ReadHeaderTimeout: 10 * time.Second,
		ReadTimeout:       20 * time.Second,
		WriteTimeout:      30 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	errCh := make(chan error, 1)
	go func() {
		logger.Info("KIMOVOLT LAB server starting", "addr", httpServer.Addr, "db", dbPath, "staticDir", staticDir)
		if err := httpServer.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			errCh <- err
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	select {
	case err := <-errCh:
		logger.Error("server terminated unexpectedly", "error", err)
		os.Exit(1)
	case sig := <-stop:
		logger.Info("shutdown signal received", "signal", sig.String())
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := httpServer.Shutdown(ctx); err != nil {
		logger.Error("graceful shutdown failed", "error", err)
	}
	logger.Info("KIMOVOLT LAB server stopped cleanly")
}

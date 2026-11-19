package db

import (
	"database/sql"
	"embed"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"

	_ "modernc.org/sqlite"
)

//go:embed migrations/*.sql
var migrationsFS embed.FS

// Open opens a pure-Go SQLite database configured with WAL mode, foreign keys, and busy timeout,
// and executes embedded SQL migrations idempotently.
func Open(path string) (*sql.DB, error) {
	if path != ":memory:" && !strings.HasPrefix(path, "file:") {
		dir := filepath.Dir(path)
		if dir != "" && dir != "." {
			if err := os.MkdirAll(dir, 0o750); err != nil {
				return nil, fmt.Errorf("create db directory: %w", err)
			}
		}
	}

	conn, err := sql.Open("sqlite", path)
	if err != nil {
		return nil, fmt.Errorf("open sqlite: %w", err)
	}
	// Single writer pool avoids SQLITE_BUSY contention under concurrent HTTP writes.
	conn.SetMaxOpenConns(1)

	pragmas := []string{
		"PRAGMA journal_mode=WAL;",
		"PRAGMA foreign_keys=ON;",
		"PRAGMA busy_timeout=5000;",
		"PRAGMA synchronous=NORMAL;",
	}
	for _, p := range pragmas {
		if _, err := conn.Exec(p); err != nil {
			_ = conn.Close()
			return nil, fmt.Errorf("apply pragma %q: %w", p, err)
		}
	}

	if err := runMigrations(conn); err != nil {
		_ = conn.Close()
		return nil, err
	}
	return conn, nil
}

func runMigrations(conn *sql.DB) error {
	if _, err := conn.Exec(`
		CREATE TABLE IF NOT EXISTS schema_migrations (
			filename TEXT PRIMARY KEY,
			applied_at TEXT NOT NULL DEFAULT (datetime('now'))
		);
	`); err != nil {
		return fmt.Errorf("create schema_migrations: %w", err)
	}

	entries, err := migrationsFS.ReadDir("migrations")
	if err != nil {
		return fmt.Errorf("read embedded migrations: %w", err)
	}
	var names []string
	for _, e := range entries {
		if !e.IsDir() && strings.HasSuffix(e.Name(), ".sql") {
			names = append(names, e.Name())
		}
	}
	sort.Strings(names)

	for _, name := range names {
		var exists int
		err := conn.QueryRow(`SELECT COUNT(1) FROM schema_migrations WHERE filename = ?`, name).Scan(&exists)
		if err != nil {
			return fmt.Errorf("check migration %s: %w", name, err)
		}
		if exists > 0 {
			continue
		}

		sqlBytes, err := migrationsFS.ReadFile("migrations/" + name)
		if err != nil {
			return fmt.Errorf("read migration %s: %w", name, err)
		}
		tx, err := conn.Begin()
		if err != nil {
			return fmt.Errorf("begin migration %s: %w", name, err)
		}
		if _, err := tx.Exec(string(sqlBytes)); err != nil {
			_ = tx.Rollback()
			return fmt.Errorf("exec migration %s: %w", name, err)
		}
		if _, err := tx.Exec(`INSERT INTO schema_migrations (filename) VALUES (?)`, name); err != nil {
			_ = tx.Rollback()
			return fmt.Errorf("record migration %s: %w", name, err)
		}
		if err := tx.Commit(); err != nil {
			return fmt.Errorf("commit migration %s: %w", name, err)
		}
	}
	return nil
}

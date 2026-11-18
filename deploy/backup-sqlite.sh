#!/usr/bin/env bash
set -euo pipefail

DB_PATH="${DB_PATH:-/opt/kimovolt-lab/data/kimovolt.db}"
BACKUP_DIR="${BACKUP_DIR:-/opt/kimovolt-lab/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"

mkdir -p "$BACKUP_DIR"
STAMP="$(date -u +%Y%m%d-%H%M%S)"
TARGET="$BACKUP_DIR/kimovolt-${STAMP}.db"

if command -v sqlite3 >/dev/null 2>&1; then
  sqlite3 "$DB_PATH" ".backup '$TARGET'"
else
  # Fallback consistent copy when WAL checkpointed
  cp "$DB_PATH" "$TARGET"
fi

gzip -f "$TARGET"
find "$BACKUP_DIR" -name "kimovolt-*.db.gz" -mtime +"$RETENTION_DAYS" -delete
echo "Backup created: ${TARGET}.gz"

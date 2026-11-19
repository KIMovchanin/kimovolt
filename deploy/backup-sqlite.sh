#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${ENV_FILE:-/opt/kimovolt-lab/.env}"
if [ -r "$ENV_FILE" ]; then
  while IFS= read -r line || [ -n "$line" ]; do
    case "$line" in
      ''|\#*) continue ;;
    esac
    key="${line%%=*}"
    val="${line#*=}"
    key="${key//[[:space:]]/}"
    val="${val#\"}"
    val="${val%\"}"
    val="${val#\'}"
    val="${val%\'}"
    if [[ "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] && [ -z "${!key+x}" ]; then
      export "$key=$val"
    fi
  done < "$ENV_FILE"
fi

DB_PATH="${DB_PATH:-/opt/kimovolt-lab/data/kimovolt.db}"
BACKUP_DIR="${BACKUP_DIR:-/opt/kimovolt-lab/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"

if [ ! -f "$DB_PATH" ]; then
  echo "No SQLite database found at $DB_PATH; skipping backup."
  exit 0
fi

mkdir -p "$BACKUP_DIR"
cd "$BACKUP_DIR"
STAMP="$(date -u +%Y%m%d-%H%M%S)"
TARGET="$BACKUP_DIR/kimovolt-${STAMP}.db"

if command -v sqlite3 >/dev/null 2>&1; then
  sqlite3 "$DB_PATH" ".backup '$TARGET'"
else
  echo "Warning: sqlite3 CLI not found; falling back to file copy." >&2
  cp "$DB_PATH" "$TARGET"
fi

gzip -f "$TARGET"
find . -maxdepth 1 -name "kimovolt-*.db.gz" -mtime +"$RETENTION_DAYS" -delete
echo "Backup created: ${TARGET}.gz"

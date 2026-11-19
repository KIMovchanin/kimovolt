#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/opt/kimovolt-lab"
ENV_FILE="$APP_DIR/.env"
if [ -r "$ENV_FILE" ]; then
  set -a
  # shellcheck source=/dev/null
  source "$ENV_FILE"
  set +a
fi

HEALTH_URL="http://127.0.0.1:${PORT:-8080}/api/v1/health"

echo "Backing up SQLite before update..."
if [ "$(id -un)" != "kimovolt" ] && id kimovolt >/dev/null 2>&1; then
  sudo -u kimovolt "$APP_DIR/deploy/backup-sqlite.sh"
else
  "$APP_DIR/deploy/backup-sqlite.sh"
fi

echo "Restarting systemd service..."
sudo systemctl restart kimovolt-lab
sudo systemctl is-active --quiet kimovolt-lab

echo "Health check ($HEALTH_URL)..."
for _ in $(seq 1 20); do
  if curl -fs "$HEALTH_URL"; then
    echo ""
    exit 0
  fi
  sleep 0.5
done

echo "Health check failed after 10s: $HEALTH_URL" >&2
sudo systemctl status kimovolt-lab --no-pager >&2 || true
exit 1

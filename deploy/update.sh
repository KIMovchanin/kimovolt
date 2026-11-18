#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/opt/kimovolt-lab"
echo "Backing up SQLite before update..."
"$APP_DIR/deploy/backup-sqlite.sh" || true

echo "Restarting systemd service..."
sudo systemctl restart kimovolt-lab
sudo systemctl status kimovolt-lab --no-pager

echo "Health check..."
curl -fsS http://127.0.0.1:8080/api/v1/health
echo ""

#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_DIR="$ROOT_DIR/backups"
mkdir -p "$BACKUP_DIR"
STAMP="$(date +%Y%m%d-%H%M%S)"
cp "$ROOT_DIR/backend/data/helpdesk.db" "$BACKUP_DIR/helpdesk-$STAMP.db" 2>/dev/null || true
echo "Backup selesai: $BACKUP_DIR/helpdesk-$STAMP.db"

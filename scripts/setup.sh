#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR/backend"

mkdir -p data uploads

if [ ! -f .env ] && [ -f .env.example ]; then
  cp .env.example .env
fi

npm install
npm run migrate
npm run seed

echo "[OK] Backend initialized"
echo "Default admin: admin / admin123"

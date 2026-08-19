#!/usr/bin/env bash
set -euo pipefail
echo "=== Khang Hoc Code Deploy ==="
npm install
npm run build
npx wrangler deploy
echo "Done. Frontend deployed as Worker assets (SPA)."
echo "Admin: khanhgia971@gmail.com / kendepzai (after API+D1 seeded)"

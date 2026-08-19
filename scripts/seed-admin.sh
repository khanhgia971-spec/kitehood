#!/usr/bin/env bash
set -euo pipefail
echo "Seeding admin: khanhgia971@gmail.com"
npx wrangler d1 execute online-ide-db --remote --file=./database/migrations/0002_seed_admin.sql
echo "Done. Login with khanhgia971@gmail.com / kendepzai then open /admin"

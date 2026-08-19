#!/usr/bin/env bash
set -euo pipefail
npx wrangler d1 execute online-ide-db --local --file=./database/migrations/0002_seed_admin.sql
echo "Local admin seeded"

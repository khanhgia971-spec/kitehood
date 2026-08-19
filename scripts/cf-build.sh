#!/bin/bash
set -e
npm install
npm run build --workspace=@khang-hoc-code/web
# ensure dist exists
test -d apps/web/dist
echo "Build OK: apps/web/dist ready"

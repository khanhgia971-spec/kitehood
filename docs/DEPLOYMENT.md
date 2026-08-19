# Cloudflare Deployment Guide

## Prerequisites
- Cloudflare account
- Node.js 20+
- Wrangler CLI (`npm i -g wrangler`)

## 1. Create resources

```bash
npx wrangler d1 create online-ide-db
npx wrangler r2 bucket create online-ide-files
npx wrangler kv:namespace create KV
npx wrangler kv:namespace create KV --preview
```

Copy the IDs into `wrangler.toml` and each worker’s `wrangler.toml`.

## 2. Secrets

```bash
npx wrangler secret put JWT_SECRET
npx wrangler secret put TURNSTILE_SECRET_KEY
npx wrangler secret put GITHUB_CLIENT_ID
npx wrangler secret put GITHUB_CLIENT_SECRET
# ... Google, Microsoft, etc.
```

## 3. Database

```bash
npx wrangler d1 execute online-ide-db --file=./database/schema/001_initial.sql --remote
# or use migrations
npx wrangler d1 migrations apply online-ide-db --remote
```

## 4. Deploy

```bash
./scripts/deploy.sh
```

## 5. Pages custom domain + CORS
Set your domain in Cloudflare Pages and update CORS origin in the API Worker if needed.

## Execution sandboxes
Deploy the Docker images to a container platform that Workers can call (Cloudflare Containers when available, or external Firecracker service / your own VPS with API).

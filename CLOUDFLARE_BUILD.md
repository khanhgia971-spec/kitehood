# Cloudflare Workers / Pages — Build settings

## Workers (wrangler assets)

**Root directory:** `/` (repo root)

**Build command:**
```bash
npm install && npm run build
```
hoặc nếu dùng bun (mặc định CF):
```bash
bun install && npm run build
```

**Deploy command:** `npx wrangler deploy`

**Output / assets:** `apps/web/dist` (đã set trong `wrangler.toml` `[assets]`)

## Biến môi trường / Secrets
```bash
npx wrangler secret put JWT_SECRET
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put GITHUB_CLIENT_SECRET
```

## Lưu ý Monaco
Build có thể mất 1–3 phút ở bước `transforming...` vì monaco-editor lớn — **không phải treo**. Chờ đến khi thấy `✓ built in …`.

Nếu OOM trên plan nhỏ:
- Settings → Build → tăng Node memory: `NODE_OPTIONS=--max-old-space-size=4096`
- Build command: `NODE_OPTIONS=--max-old-space-size=4096 npm run build`

## Compatibility
`nodejs_compat` + `run_worker_first = true` trong wrangler.toml.

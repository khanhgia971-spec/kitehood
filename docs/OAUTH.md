# Google + GitHub Login

## 1. Google Cloud Console
- OAuth Client → Web application
- Authorized redirect URI:
  `https://YOUR_DOMAIN/api/auth/callback/google`

## 2. GitHub OAuth App
- Callback URL:
  `https://YOUR_DOMAIN/api/auth/callback/github`

## 3. Secrets
```bash
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put GITHUB_CLIENT_ID
npx wrangler secret put GITHUB_CLIENT_SECRET
npx wrangler secret put JWT_SECRET
```

## 4. KV + deploy
```bash
npx wrangler kv:namespace create KV
# dán id vào wrangler.toml
npm run build && npx wrangler deploy
```

## Endpoints
- GET /api/auth/google
- GET /api/auth/callback/google
- GET /api/auth/github
- GET /api/auth/callback/github

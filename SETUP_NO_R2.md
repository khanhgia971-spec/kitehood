# Setup Khang Hoc Code (không cần R2)

## Tài nguyên đã tạo sẵn (account của bạn)

| Resource | ID |
|----------|-----|
| D1 `online-ide-db` | `3d8d3226-1cd0-4034-a144-0fa9ec454ae8` |
| KV | `8b48518269414899a9eb2d1c4713c598` |
| KV preview | `ba0de42769f848648b34aea59b586941` |

File `workers/api/wrangler.toml` đã điền sẵn các ID trên.

## Bước 1 — Chạy schema (trong folder project)

```bash
cd C:\Users\PV\Đường\dẫn\kitehood

npx wrangler d1 execute online-ide-db --remote --file=./database/schema/001_initial.sql
npx wrangler d1 execute online-ide-db --remote --file=./database/migrations/0002_seed_admin.sql
npx wrangler d1 execute online-ide-db --remote --file=./database/migrations/0003_content_in_d1.sql
```

## Bước 2 — Secrets

```bash
cd workers\api
npx wrangler secret put JWT_SECRET
```

Tạo secret trong PowerShell:
```powershell
[guid]::NewGuid().ToString() + [guid]::NewGuid().ToString()
```

(Tùy chọn cho run Python/Java/...)
```bash
npx wrangler secret put JUDGE0_API_KEY
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put GITHUB_CLIENT_SECRET
```

## Bước 3 — Deploy API

```bash
cd workers\api
npx wrangler deploy
```

Copy URL dạng `https://kitehood-api.xxxx.workers.dev`

## Bước 4 — Frontend

```bash
cd apps\web
npm install
npm run dev
```

Vào Settings trong IDE → dán API URL: `https://kitehood-api.xxxx.workers.dev/api`

Hoặc set sẵn trong `apps/web/src/stores/apiConfig.ts` field `baseUrl`.

## Admin

- Email: `khanhgia971@gmail.com`
- Password: `kendepzai`
- Route: `/admin`

## Chức năng không cần R2

- Login / Register / OAuth (Google+GitHub khi có secret)
- Save project + files → D1
- Explorer, tabs, Monaco, Terminal, Preview HTML
- Run JS/TS trên Worker
- Run ngôn ngữ khác: gắn JUDGE0_API_KEY

## OAuth redirect (khi deploy)

Google / GitHub callback:
```
https://kitehood-api.xxxx.workers.dev/api/auth/google/callback
https://kitehood-api.xxxx.workers.dev/api/auth/github/callback
```

# API đã gắn sẵn cùng web

Web + API chạy **chung 1 Worker** (`kitehood`).

- Frontend: `/`
- API login: `POST /api/auth/login`
- API register: `POST /api/auth/register`

## Việc bạn cần làm (1 lần)

```bash
# 1. Tạo KV
npx wrangler kv:namespace create KV

# 2. Mở wrangler.toml, thay PASTE_YOUR_KV_ID_HERE bằng id vừa tạo

# 3. Deploy
npm run build
npx wrangler deploy
```

## Admin (tự seed trên KV)
- Email: khanhgia971@gmail.com
- Password: kendepzai

Không cần paste URL API trên Settings nữa (mặc định `/api`).

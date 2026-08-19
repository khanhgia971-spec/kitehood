# Hướng dẫn Deploy lên Cloudflare – Khang Hoc Code

Domain hiện tại của bạn: **kitehood.khanhgia971.workers.dev**

Google Client ID:
```
469913799005-vi26moai41brfunj75c7nh517372bcmu.apps.googleusercontent.com
```

---

## Bước 0 – Cài tool trên máy

Cần Node.js 20+:

```bash
# Cài wrangler (Cloudflare CLI)
npm install -g wrangler

# Đăng nhập Cloudflare
wrangler login
```

Mở browser login Cloudflare account của bạn.

---

## Bước 1 – Giải nén & cài package

```bash
# Giải nén file ZIP mình gửi
cd kitehood-deploy

# Cài dependencies
npm install
```

---

## Bước 2 – Build frontend

```bash
cd apps/web
npm install
npm run build
cd ../..
```

Sau bước này sẽ có thư mục `apps/web/dist`.

---

## Bước 3 – Đăng ký Redirect URI (QUAN TRỌNG)

### Google Cloud Console
1. https://console.cloud.google.com/apis/credentials
2. Chọn OAuth Client ID của bạn
3. **Authorized redirect URIs** → Add đúng URL này (copy nguyên, không thêm gì):

```
https://kitehood.khanhgia971.workers.dev/api/auth/google/callback
```

4. **Authorized JavaScript origins**:

```
https://kitehood.khanhgia971.workers.dev
```

5. Save

### GitHub OAuth App
1. https://github.com/settings/developers → OAuth Apps
2. **Authorization callback URL**:

```
https://kitehood.khanhgia971.workers.dev/api/auth/github/callback
```

3. Update

---

## Bước 4 – Set Secrets trên Cloudflare

Chạy từng lệnh, paste secret khi được hỏi:

```bash
# Bắt buộc
npx wrangler secret put JWT_SECRET
# (tạo chuỗi ngẫu nhiên dài, ví dụ: openssl rand -hex 32)

npx wrangler secret put GOOGLE_CLIENT_SECRET
# (lấy trong Google Cloud Console → Client secret)

npx wrangler secret put GITHUB_CLIENT_SECRET
# (lấy trong GitHub OAuth App → Client secrets)
```

Optional (chạy Java/Python tốt hơn, không bắt buộc – đã có Piston free):
```bash
npx wrangler secret put JUDGE0_API_KEY
```

---

## Bước 5 – Deploy

Có 2 cách tùy cấu trúc project của bạn:

### Cách A – Deploy Worker chính (khuyến nghị)

```bash
# Từ thư mục gốc project
npx wrangler deploy --config workers/api/wrangler.toml
```

Hoặc nếu dùng wrangler.toml gốc:

```bash
npx wrangler deploy
```

### Cách B – Build frontend rồi gắn assets

```bash
cd apps/web && npm run build && cd ../..
# Copy dist vào public của worker nếu cần
mkdir -p workers/api/public
cp -r apps/web/dist/* workers/api/public/
npx wrangler deploy --config workers/api/wrangler.toml
```

Sau khi deploy xong, URL sẽ là:
```
https://kitehood.khanhgia971.workers.dev
```

---

## Bước 6 – Database (D1) nếu chưa có bảng

```bash
# Apply schema (nếu có file trong database/)
npx wrangler d1 execute online-ide-db --file=./database/schema/schema.sql
# hoặc
npx wrangler d1 execute online-ide-db --file=./admin/seed.sql
```

---

## Checklist lỗi thường gặp

| Lỗi | Nguyên nhân | Sửa |
|-----|-------------|-----|
| redirect_uri_mismatch | URI trên console ≠ URI app gửi | Copy đúng URL ở Bước 3, chỉ 1 lần https:// |
| Invalid redirect / TLD | Dán sai `https://https://...` | Xóa, dán lại đúng |
| GOOGLE_CLIENT_SECRET empty | Chưa set secret | `wrangler secret put GOOGLE_CLIENT_SECRET` |
| Java không chạy | Cũ | Đã fix Piston, deploy lại file executions.ts |

---

## Upload nhanh qua Cloudflare Dashboard (không dùng CLI)

1. Vào https://dash.cloudflare.com → Workers & Pages
2. Tìm worker `kitehood` / `kitehood-api`
3. Settings → Variables → thêm secrets (JWT_SECRET, GOOGLE_CLIENT_SECRET, GITHUB_CLIENT_SECRET)
4. Deploy qua Git (nếu đã connect repo) hoặc dùng Wrangler CLI như trên

Cloudflare **không** cho upload ZIP trực tiếp cho Worker TypeScript phức tạp như project này — **bắt buộc dùng Wrangler** (hoặc Git integration).

---

## Tóm tắt lệnh nhanh

```bash
wrangler login
cd kitehood-deploy
npm install
cd apps/web && npm install && npm run build && cd ../..
npx wrangler secret put JWT_SECRET
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put GITHUB_CLIENT_SECRET
npx wrangler deploy --config workers/api/wrangler.toml
```

Xong → mở https://kitehood.khanhgia971.workers.dev và test login Google/GitHub.

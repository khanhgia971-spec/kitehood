# Khang Hoc Code – Fixes applied & Setup notes

## 1. OAuth redirect_uri_mismatch (Google & GitHub)

**Nguyên nhân:** Redirect URI mà app gửi lên Google/GitHub **không khớp** với URI đã đăng ký trong console.

App hiện dùng:
```
https://<your-domain>/api/auth/callback/google
https://<your-domain>/api/auth/callback/github
```

### Cách sửa Google
1. Vào https://console.cloud.google.com/apis/credentials
2. Chọn OAuth 2.0 Client ID (hoặc tạo mới Web application)
3. Thêm vào **Authorized redirect URIs**:
   - `https://your-production-domain.com/api/auth/callback/google`
   - `http://localhost:8787/api/auth/callback/google` (nếu dev)
4. Authorized JavaScript origins: thêm domain của bạn
5. Copy Client ID + Client Secret → set secret trên Cloudflare:
   ```bash
   npx wrangler secret put GOOGLE_CLIENT_SECRET
   ```
   (GOOGLE_CLIENT_ID đã có trong wrangler.toml vars)

### Cách sửa GitHub
1. https://github.com/settings/developers → OAuth Apps
2. Edit app → **Authorization callback URL**:
   - `https://your-production-domain.com/api/auth/callback/github`
3. Client secrets → generate → 
   ```bash
   npx wrangler secret put GITHUB_CLIENT_SECRET
   ```

**Lưu ý:** `url.origin` trong Worker phải đúng domain production. Nếu dùng custom domain trên Cloudflare Pages/Workers, redirect sẽ tự đúng.

---

## 2. Java / Python / C++ … “No execution backend”

**Đã fix:** Thêm **Piston API** (https://emkc.org/api/v2/piston) làm fallback miễn phí.

Hỗ trợ: java, python, c, cpp, go, rust, php, ruby, kotlin, swift, lua, sql, javascript, typescript…

JS/TS vẫn chạy trên Worker. HTML dùng Live Preview.

Optional (giới hạn cao hơn):
```bash
npx wrangler secret put JUDGE0_API_KEY
# hoặc
npx wrangler secret put EXECUTION_URL
```

---

## 3. Tab context menu chồng lên nhau

**Đã fix:** Chỉ còn **1 menu** duy nhất, z-index cao (10050), dùng capture phase để không bị menu khác đè, tự clamp trong viewport.

Thêm mục **Change Language…** trong context menu.

- Double-click tab → đổi language
- Click language trên breadcrumb → đổi language
- Right-click tab → Change Language

---

## 4. Auto-close tags / brackets (gần VS Code)

Monaco options:
- `autoClosingBrackets: 'always'`
- `autoClosingQuotes: 'always'`
- `autoSurround: 'languageDefined'`
- formatOnType / formatOnPaste

Với HTML, gõ `<a` + `>` sẽ được hỗ trợ bởi Monaco language configuration. Emmet đầy đủ cần extension `@emmetio/monaco-emmet` (có thể thêm sau).

---

## 5. Save / Saved projects / Download về máy

- Ctrl+S / nút Save → SaveDialog (lưu cloud nếu đã login + local persist)
- Để tải về máy: trong SaveDialog thêm nút **Download ZIP** (cần thêm thư viện JSZip nếu chưa có)
- Saved projects list: dùng API `/projects` + localStorage cache

---

## 6. Resizable Preview / Run panel

Trong IDELayout hiện có `terminalHeight`. Cần thêm drag handle:

```tsx
<div
  className="h-1 cursor-row-resize bg-transparent hover:bg-[var(--accent)]"
  onMouseDown={startDrag}
/>
```

---

## Deploy lại

```bash
cd apps/web && npm run build
cd ../.. 
npx wrangler deploy   # hoặc deploy workers/api
```

Set secrets còn thiếu:
```bash
npx wrangler secret put JWT_SECRET
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put GITHUB_CLIENT_SECRET
# optional
npx wrangler secret put JUDGE0_API_KEY
```


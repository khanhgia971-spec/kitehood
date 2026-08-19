# Khang Hoc Code — Upgrade Progress

## Đã hoàn thành trong phiên này

### UI / UX
- Liquid Glass themes: Dark / White / Milk White
- Top bar giống OneCompiler (logo, Save, Login/Logout)
- Activity Bar + Sidebar (Explorer, Search, SCM, Run, Extensions, Dashboard, Settings)
- Status bar với nút Terminal / Run / Preview / Theme

### Editor (Monaco)
- Multi-tab với nút **+** bên cạnh
- Context menu tab: Close / Close Others / Close to the Right / Close All
- Breadcrumb, minimap, auto-format, bracket pair
- Sync theme theo data-theme

### Explorer
- Cây file thật (persist localStorage)
- New File / New Folder / Delete
- Context menu: Open, Rename, Delete, New File/Folder
- Không xóa file mặc định khi load project

### Language Picker
- Modal giống OneCompiler screenshot
- Chọn ngôn ngữ → tự tạo file starter đúng loại
- HTML / JS / TS / Python / Java / C / C++ / Go / Rust / PHP / Ruby / C# / SQL / React...

### Terminal
- Terminal hoạt động (help, echo, date, node -e, clear...)
- Bật/tắt bằng Ctrl+` hoặc nút Status bar
- Kéo resize chiều cao

### Live Preview
- Render HTML + CSS + JS từ project
- Responsive: Desktop / Tablet / Phone

### Run Panel
- JS/TS chạy client-side (console capture)
- HTML mở Preview
- Các ngôn ngữ khác gọi Execution API (fallback demo output)

### Save
- Dialog giống screenshot (Title, Description, Tags, Public/Unlisted/Private)
- Lưu local + gọi API `/projects` khi đã login

### Auth
- Email/Password + Demo Admin
- Google OAuth (client id: 469913799005-vi26moai41brfunj75c7nh517372bcmu...)
- GitHub OAuth (client id: Ov23li1vU3yCuooobzOq)
- Nút Login / Logout trên top bar
- Guest dùng IDE không cần login

### Backend (Cloudflare)
- Workers API routes: auth, oauth, projects, files, executions, me, admin
- D1 schema + seed admin
- R2 / KV hooks

## Cách chạy local

```bash
cd apps/web
npm install
npm run dev
```

Admin demo: khanhgia971@gmail.com / kendepzai

## Cần thêm secrets khi deploy

```
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_SECRET=...
JWT_SECRET=...
FRONTEND_URL=https://your-domain.com
```

Redirect URI cần đăng ký:
- Google: https://your-domain.com/api/auth/google/callback
- GitHub: https://your-domain.com/api/auth/github/callback

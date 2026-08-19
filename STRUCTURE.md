# Cấu trúc Khang Hoc Code

```
online-ide/                    ← cd vào đây để deploy
├── admin/                     ← Tài liệu + seed admin
│   ├── README.md
│   └── seed.sql
├── apps/web/                  ← Frontend React (Pages)
│   └── src/components/admin/  ← AdminDashboard.tsx  ★ UI admin
├── workers/api/               ← API Worker
│   └── src/routes/admin.ts    ← API admin ★
├── infra/                     ← Cấu hình Cloudflare
│   └── cloudflare/
│       ├── wrangler.example.toml
│       ├── pages.toml
│       └── env.example
├── database/
│   ├── schema/001_initial.sql
│   └── migrations/
│       ├── 0001_initial.sql
│       └── 0002_seed_admin.sql
├── scripts/
│   ├── deploy.sh
│   └── seed-admin.sh
├── docs/
├── docker/
├── wrangler.toml
└── package.json
```

## Admin UI
- File: `apps/web/src/components/admin/AdminDashboard.tsx`
- Route: `/admin` (cần login role=admin)

## Admin API
- File: `workers/api/src/routes/admin.ts`

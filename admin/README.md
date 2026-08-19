# Khang Hoc Code – Admin

## Truy cập
Sau khi login với tài khoản admin:
- URL: `/admin`
- Component: `apps/web/src/components/admin/AdminDashboard.tsx`

## Tài khoản seed
- Email: khanhgia971@gmail.com
- Password: kendepzai
- Role: admin

## API admin (Worker)
- GET  /api/admin/stats
- GET  /api/admin/users
- POST /api/admin/users/:id/ban
- GET  /api/admin/login-history

Chỉ JWT có `role=admin` mới gọi được.

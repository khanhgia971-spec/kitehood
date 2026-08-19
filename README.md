# KiteHood — Online IDE giáo dục

IDE web học lập trình giống VS Code: Monaco Editor, Live Preview, chạy đa ngôn ngữ (Piston), AI Agent, lộ trình bài tập + XP, cloud sync (Cloudflare KV + D1).

## Stack
- **Frontend:** React 18 + Vite + TypeScript + Tailwind + Zustand + Monaco + Framer Motion
- **Backend:** Cloudflare Worker (`src/index.ts`) + Assets
- **DB:** D1 + KV (không bắt buộc R2)
- **Run:** JS sandbox trình duyệt · HTML Preview · Python/Java/C++/… qua Piston (emkc.org)

## Tính năng nổi bật
| Module | Mô tả |
|--------|--------|
| Editor | Multi-tab Monaco, dirty, rename, context menu, auto-close tags |
| Preview | Resolve local CSS/JS, giữ Google Fonts/CDN, multi-page nav |
| Run | HTML→Preview, JS sandbox, còn lại → Piston API |
| AI Agent | Multi conversation, auto-detect provider, apply code |
| Học tập | Chương/bài, AI dạy, AI chấm → +XP nếu ≥60 |
| Templates | 8 mẫu (HTML, React CDN, Python, Java, C++, Go, Todo…) |
| Search | Tìm trong toàn bộ file project |
| Terminal | Ảo: ls/cd/cat/tree/node — không npm thật |
| Cloud | Pull/Push KV+D1, không upload API key AI |
| Auth | Email + Google/GitHub OAuth, admin ban/inbox |
| UX | Liquid Glass, 3 theme, tiếng gõ phím, cursor Mac |

## Bắt đầu
```bash
npm install
npm run build:web
npx wrangler deploy
```

Chi tiết: `HUONG_DAN_DEPLOY.md`, `CHANGELOG.md`, `FIXES_AND_SETUP.md`.

Brand: **KiteHood** · Target: Cloudflare Workers + Assets.

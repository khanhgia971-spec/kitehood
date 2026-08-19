# Architecture

## Overview

Online IDE is a Cloudflare-native application designed for production scale.

### Frontend
- React 18 + Vite
- Monaco Editor (full features)
- xterm.js for terminal
- Zustand for state
- Tailwind + custom Liquid Glass CSS
- Code splitting + virtual lists for RAM target (<300MB)

### Backend
- **Cloudflare Pages** → static assets + SPA
- **Workers** → API, Auth, Execution, Realtime
- **D1** → metadata (users, projects, files meta, sessions, logs)
- **R2** → file content + versions + zip exports
- **KV** → sessions cache, rate limits, recent items
- **Durable Objects** → real-time workspace collaboration & presence
- **Queues** → async code execution jobs

### Code Execution Flow
1. Client sends run request → API Worker
2. API authenticates + checks quota
3. Job pushed to Queue or direct to Execution Worker
4. Execution Worker spins Docker sandbox (or Firecracker)
5. Result (stdout/stderr/memory/cpu/exit) streamed back via WebSocket or SSE
6. Result stored in D1 executions table

### Security
- JWT (HS256 or RS256)
- OAuth providers
- Cloudflare Turnstile
- RBAC
- Strict CSP
- Rate limiting via KV
- Audit logs
- No compiler binaries in browser

### Performance Targets
- Browser RAM: 150–300 MB
- Lazy load panels, unload inactive Monaco models
- Virtualized file tree & terminal history

# CHANGELOG — KiteHood Ultimate

## 2026-08-15 — Ultimate pack (~10MB)

### AI Agent 2.0
- **Streaming** trả lời từng chữ (SSE)
- UI bubble gradient, markdown code blocks
- Quick actions: Giải thích, Tìm lỗi, Sửa, Cải thiện, Dạy bài, Đố vui, Viết code, Tạo file
- Áp dụng code block → file editor
- Multi-conversation pin/delete, gắn nhiều file
- Auto-detect Groq / OpenRouter / OpenAI / xAI / Gemini

### GUI Liquid Glass v2
- Mesh động, glass blur 40px, status/activity glow
- Welcome glass-strong, nút accent 2 tông

### Tính năng
- Preview inline (HTML/CSS/JS tab đang mở)
- Run Piston + AI chấm ≥60 XP
- Templates ×8, Search, Prefs, Keyboard sound
- **Đố vui code** (Activity → puzzle icon)
- Samples + Knowledge base + media packs

### Cloudflare build
```
NODE_OPTIONS=--max-old-space-size=4096 npm install && npm run build
```

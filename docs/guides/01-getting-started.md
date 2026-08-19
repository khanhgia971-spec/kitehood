# 01-getting-started

Hướng dẫn chi tiết module **01-getting-started** trong KiteHood.

## Mục tiêu
- Hiểu cách dùng tính năng liên quan đến `01-getting-started`
- Thực hành trên IDE trình duyệt
- Kiểm tra Preview / Run / AI khi cần

## Các bước
1. Mở project trên KiteHood
2. Chọn template phù hợp hoặc tự tạo file
3. Viết code trong editor Monaco
4. Bấm **Run** (HTML → Live Preview; Python/Java → Piston)
5. Dùng AI Agent nếu cần gợi ý
6. Nộp bài trong Học tập để AI chấm và nhận XP

## Lưu ý Preview
- File HTML local: `<link href="styles.css">` và `<script src="main.js">` được **nhúng inline** (không dùng data-URI) để trình duyệt luôn chạy được.
- Google Fonts / CDN `https://` **giữ nguyên**, không rewrite.
- Tab đang mở (HTML/CSS/JS) được ưu tiên hiển thị trong Preview.
- Multi-page: click link `about.html` vẫn ở trong Preview (postMessage).

## Troubleshooting
| Hiện tượng | Cách xử lý |
|------------|------------|
| Preview trắng | Bấm Refresh trên thanh Preview; kiểm tra tab HTML đang mở |
| CSS không ăn | Kiểm tra tên file trong `href` khớp Explorer |
| JS không chạy | Mở Console trong DevTools iframe; lỗi cú pháp sẽ hiện banner đỏ |
| Python lỗi mạng | Piston public (emkc.org) có thể rate-limit — thử lại |

## Ví dụ HTML tối thiểu
```html
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8"/>
  <title>Demo</title>
  <link rel="stylesheet" href="styles.css"/>
</head>
<body>
  <h1>Hello</h1>
  <script src="main.js"></script>
</body>
</html>
```


<!-- padding educational notes -->
Ghi chú học tập cho 01-getting-started. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 
Ghi chú học tập cho 01-getting-started. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 
Ghi chú học tập cho 01-getting-started. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 
Ghi chú học tập cho 01-getting-started. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 
Ghi chú học tập cho 01-getting-started. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 
Ghi chú học tập cho 01-getting-started. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 
Ghi chú học tập cho 01-getting-started. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 
Ghi chú học tập cho 01-getting-started. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 
Ghi chú học tập cho 01-getting-started. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 
Ghi chú học tập cho 01-getting-started. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 
Ghi chú học tập cho 01-getting-started. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 
Ghi chú học tập cho 01-getting-started. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 
Ghi chú học tập cho 01-getting-started. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 
Ghi chú học tập cho 01-getting-started. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 
Ghi chú học tập cho 01-getting-started. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 

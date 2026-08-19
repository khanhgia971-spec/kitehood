/**
 * Project templates — starter kits for learners.
 */

export type TemplateFile = {
  path: string;
  content: string;
  language?: string;
};

export type ProjectTemplate = {
  id: string;
  name: string;
  description: string;
  tags: string[];
  icon: string;
  files: TemplateFile[];
};

export const TEMPLATES: ProjectTemplate[] = [
  {
    id: 'html-basic',
    name: 'HTML cơ bản',
    description: 'Trang Xin chào KiteHood 🪁 với HTML5 + CSS inline',
    tags: ['html', 'beginner'],
    icon: '🌐',
    files: [
      {
        path: 'index.html',
        language: 'html',
        content: `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Xin chào KiteHood</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <main class="card">
    <h1>Xin chào 👋</h1>
    <p>Đây là trang đầu tiên của bạn trên <strong>KiteHood</strong>.</p>
    <button id="btn">Bấm tôi!</button>
    <p id="msg"></p>
  </main>
  <script src="main.js"></script>
</body>
</html>
`,
      },
      {
        path: 'styles.css',
        language: 'css',
        content: `* { box-sizing: border-box; }
body {
  margin: 0;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: system-ui, sans-serif;
  background: linear-gradient(135deg, #0f172a, #1e293b);
  color: #e2e8f0;
}
.card {
  background: rgba(255,255,255,0.06);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 16px;
  padding: 2rem 2.5rem;
  text-align: center;
  max-width: 420px;
}
h1 { margin-top: 0; }
button {
  background: #6366f1;
  color: white;
  border: none;
  padding: 0.6rem 1.4rem;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
}
button:hover { background: #818cf8; }
`,
      },
      {
        path: 'main.js',
        language: 'javascript',
        content: `const btn = document.getElementById('btn');
const msg = document.getElementById('msg');
btn.addEventListener('click', () => {
  msg.textContent = 'Bạn đã bấm nút! Tiếp tục học nhé 🚀';
});
`,
      },
    ],
  },
  {
    id: 'multi-page',
    name: 'Website nhiều trang',
    description: 'index + about + shared CSS — test navigation Preview',
    tags: ['html', 'css', 'multi-page'],
    icon: '📄',
    files: [
      {
        path: 'index.html',
        language: 'html',
        content: `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <title>Trang chủ</title>
  <link rel="stylesheet" href="common.css" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet" />
</head>
<body>
  <nav>
    <a href="index.html">Trang chủ</a>
    <a href="about.html">Giới thiệu</a>
  </nav>
  <h1>Trang chủ</h1>
  <p style="font-family: Inter, sans-serif">Google Fonts Inter đang hoạt động.</p>
</body>
</html>
`,
      },
      {
        path: 'about.html',
        language: 'html',
        content: `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <title>Giới thiệu</title>
  <link rel="stylesheet" href="common.css" />
</head>
<body>
  <nav>
    <a href="index.html">Trang chủ</a>
    <a href="about.html">Giới thiệu</a>
  </nav>
  <h1>Về KiteHood</h1>
  <p>IDE học lập trình ngay trên trình duyệt.</p>
</body>
</html>
`,
      },
      {
        path: 'common.css',
        language: 'css',
        content: `body { font-family: system-ui; max-width: 720px; margin: 2rem auto; padding: 0 1rem; }
nav { display: flex; gap: 1rem; margin-bottom: 1.5rem; }
nav a { color: #6366f1; text-decoration: none; font-weight: 600; }
nav a:hover { text-decoration: underline; }
`,
      },
    ],
  },
  {
    id: 'python-basic',
    name: 'Python Hello',
    description: 'Script Python chạy qua Piston API',
    tags: ['python', 'beginner'],
    icon: '🐍',
    files: [
      {
        path: 'main.py',
        language: 'python',
        content: `# Python trên KiteHood (Piston)
name = input("Tên bạn: ") if False else "Học viên"
print(f"Xin chào, {name}!")
print("1 + 1 =", 1 + 1)

# Tính tổng 1..10
s = sum(range(1, 11))
print("Tổng 1..10 =", s)
`,
      },
    ],
  },
  {
    id: 'react-cdn',
    name: 'React (CDN)',
    description: 'React 18 qua CDN + Babel standalone — không cần build',
    tags: ['react', 'javascript'],
    icon: '⚛️',
    files: [
      {
        path: 'index.html',
        language: 'html',
        content: `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <title>React CDN</title>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    body { font-family: system-ui; display: flex; justify-content: center; padding: 2rem; background: #0f172a; color: #e2e8f0; }
    button { margin: 0 4px; padding: 8px 14px; border-radius: 8px; border: none; background: #6366f1; color: white; cursor: pointer; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    function Counter() {
      const [n, setN] = React.useState(0);
      return (
        <div>
          <h1>Đếm: {n}</h1>
          <button onClick={() => setN(n + 1)}>+1</button>
          <button onClick={() => setN(n - 1)}>-1</button>
          <button onClick={() => setN(0)}>Reset</button>
        </div>
      );
    }
    ReactDOM.createRoot(document.getElementById('root')).render(<Counter />);
  </script>
</body>
</html>
`,
      },
    ],
  },
  {
    id: 'java-basic',
    name: 'Java Hello',
    description: 'Java class chạy qua Piston',
    tags: ['java'],
    icon: '☕',
    files: [
      {
        path: 'Main.java',
        language: 'java',
        content: `public class Main {
  public static void main(String[] args) {
    System.out.println("Xin chào từ Java!");
    int a = 5, b = 7;
    System.out.println("a + b = " + (a + b));
  }
}
`,
      },
    ],
  },
  {
    id: 'cpp-basic',
    name: 'C++ Hello',
    description: 'Chương trình C++ đơn giản',
    tags: ['cpp', 'c++'],
    icon: '⚙️',
    files: [
      {
        path: 'main.cpp',
        language: 'cpp',
        content: `#include <iostream>
using namespace std;

int main() {
  cout << "Xin chao C++!" << endl;
  int x = 10;
  cout << "x * 2 = " << (x * 2) << endl;
  return 0;
}
`,
      },
    ],
  },
  {
    id: 'todo-js',
    name: 'Todo App (JS)',
    description: 'Ứng dụng Todo list thuần HTML/CSS/JS',
    tags: ['javascript', 'dom'],
    icon: '✅',
    files: [
      {
        path: 'index.html',
        language: 'html',
        content: `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <title>Todo</title>
  <link rel="stylesheet" href="todo.css" />
</head>
<body>
  <div class="app">
    <h1>Todo List</h1>
    <form id="form">
      <input id="input" placeholder="Việc cần làm..." autocomplete="off" />
      <button type="submit">Thêm</button>
    </form>
    <ul id="list"></ul>
  </div>
  <script src="todo.js"></script>
</body>
</html>
`,
      },
      {
        path: 'todo.css',
        language: 'css',
        content: `body { font-family: system-ui; background: #111827; color: #f3f4f6; display: flex; justify-content: center; padding: 2rem; }
.app { width: 100%; max-width: 420px; }
input { flex: 1; padding: 0.6rem; border-radius: 8px; border: 1px solid #374151; background: #1f2937; color: inherit; }
form { display: flex; gap: 0.5rem; }
button { background: #10b981; color: white; border: none; padding: 0.6rem 1rem; border-radius: 8px; cursor: pointer; }
ul { list-style: none; padding: 0; }
li { display: flex; justify-content: space-between; padding: 0.6rem; background: #1f2937; margin: 0.4rem 0; border-radius: 8px; }
li.done span { text-decoration: line-through; opacity: 0.5; }
li button { background: #ef4444; font-size: 0.8rem; padding: 0.3rem 0.6rem; }
`,
      },
      {
        path: 'todo.js',
        language: 'javascript',
        content: `const form = document.getElementById('form');
const input = document.getElementById('input');
const list = document.getElementById('list');
let todos = JSON.parse(localStorage.getItem('todos') || '[]');

function save() { localStorage.setItem('todos', JSON.stringify(todos)); }

function render() {
  list.innerHTML = '';
  todos.forEach((t, i) => {
    const li = document.createElement('li');
    if (t.done) li.classList.add('done');
    li.innerHTML = \`<span>\${t.text}</span>\`;
    li.querySelector('span').onclick = () => { todos[i].done = !todos[i].done; save(); render(); };
    const del = document.createElement('button');
    del.textContent = 'Xóa';
    del.onclick = () => { todos.splice(i, 1); save(); render(); };
    li.appendChild(del);
    list.appendChild(li);
  });
}

form.onsubmit = (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  todos.push({ text, done: false });
  input.value = '';
  save();
  render();
};

render();
`,
      },
    ],
  },
  {
    id: 'go-basic',
    name: 'Go Hello',
    description: 'Chương trình Go đơn giản qua Piston',
    tags: ['go'],
    icon: '🐹',
    files: [
      {
        path: 'main.go',
        language: 'go',
        content: `package main

import "fmt"

func main() {
  fmt.Println("Xin chào từ Go!")
  sum := 0
  for i := 1; i <= 10; i++ {
    sum += i
  }
  fmt.Println("Tổng 1..10 =", sum)
}
`,
      },
    ],
  },
];

export function getTemplate(id: string) {
  return TEMPLATES.find((t) => t.id === id);
}

import { useMemo, useState } from 'react';
import { Search, BookOpen, Copy, Check } from 'lucide-react';

type DocItem = { name: string; sig?: string; desc: string; example?: string };
type DocSection = { title: string; items: DocItem[] };
type LangDoc = { id: string; label: string; sections: DocSection[] };

const DOCS: LangDoc[] = [
  {
    id: 'html',
    label: 'HTML',
    sections: [
      {
        title: 'Cấu trúc',
        items: [
          { name: '!DOCTYPE', desc: 'Khai báo phiên bản HTML5', example: '<!DOCTYPE html>' },
          { name: 'html / head / body', desc: 'Khung trang: metadata + nội dung hiển thị' },
          { name: 'meta charset', desc: 'Bảng mã UTF-8', example: '<meta charset="UTF-8" />' },
          { name: 'title', desc: 'Tiêu đề tab trình duyệt' },
        ],
      },
      {
        title: 'Văn bản & liên kết',
        items: [
          { name: 'h1–h6', desc: 'Tiêu đề cấp 1→6' },
          { name: 'p, span, div', desc: 'Đoạn văn, inline, khối container' },
          { name: 'a', sig: 'href', desc: 'Liên kết nội bộ/ngoài', example: '<a href="page.html">Go</a>' },
          { name: 'strong / em', desc: 'In đậm / nghiêng ngữ nghĩa' },
        ],
      },
      {
        title: 'Media & form',
        items: [
          { name: 'img', sig: 'src alt', desc: 'Ảnh', example: '<img src="a.png" alt="..." />' },
          { name: 'video / audio', desc: 'Phát media, có controls' },
          { name: 'form / input / button', desc: 'Biểu mẫu nhập liệu' },
          { name: 'label', desc: 'Gắn nhãn cho input (for = id)' },
        ],
      },
      {
        title: 'Liên kết tài nguyên',
        items: [
          { name: 'link', sig: 'rel href', desc: 'CSS', example: '<link rel="stylesheet" href="styles.css" />' },
          { name: 'script', sig: 'src', desc: 'JS', example: '<script src="main.js"></script>' },
        ],
      },
    ],
  },
  {
    id: 'css',
    label: 'CSS',
    sections: [
      {
        title: 'Selector',
        items: [
          { name: '.class / #id', desc: 'Chọn theo class hoặc id' },
          { name: 'element', desc: 'Chọn theo thẻ (div, p, a…)' },
          { name: 'parent > child', desc: 'Con trực tiếp' },
          { name: ':hover :focus', desc: 'Trạng thái tương tác' },
        ],
      },
      {
        title: 'Box & layout',
        items: [
          { name: 'display', sig: 'flex | grid | block | none', desc: 'Kiểu bố cục' },
          { name: 'flex', example: 'display:flex; gap:8px; align-items:center;', desc: 'Hàng/cột linh hoạt' },
          { name: 'grid', example: 'display:grid; grid-template-columns:1fr 1fr;', desc: 'Lưới' },
          { name: 'margin / padding', desc: 'Khoảng ngoài / trong' },
          { name: 'position', sig: 'relative | absolute | fixed', desc: 'Định vị' },
        ],
      },
      {
        title: 'Màu & chữ',
        items: [
          { name: 'color / background', desc: 'Màu chữ / nền' },
          { name: 'font-size / font-weight', desc: 'Cỡ & độ đậm chữ' },
          { name: 'border-radius', desc: 'Bo góc' },
          { name: 'box-shadow', desc: 'Đổ bóng' },
          { name: '@media', desc: 'Responsive theo màn hình' },
        ],
      },
    ],
  },
  {
    id: 'javascript',
    label: 'JavaScript',
    sections: [
      {
        title: 'Biến & kiểu',
        items: [
          { name: 'let / const', desc: 'Khai báo biến (const không gán lại)' },
          { name: 'typeof', desc: 'Kiểm tra kiểu' },
          { name: 'Array / Object', desc: 'Mảng & đối tượng' },
        ],
      },
      {
        title: 'DOM',
        items: [
          { name: 'querySelector', sig: '(css)', desc: 'Tìm 1 phần tử', example: "document.querySelector('#app')" },
          { name: 'querySelectorAll', desc: 'Tìm tất cả khớp selector' },
          { name: 'getElementById', sig: '(id)', desc: 'Tìm theo id' },
          { name: 'textContent / innerHTML', desc: 'Đọc/ghi nội dung' },
          { name: 'classList.add/remove/toggle', desc: 'Sửa class CSS' },
          { name: 'addEventListener', sig: "('click', fn)", desc: 'Lắng nghe sự kiện', example: "btn.addEventListener('click', () => {})" },
          { name: 'createElement / appendChild', desc: 'Tạo & chèn node' },
        ],
      },
      {
        title: 'Bất đồng bộ',
        items: [
          { name: 'fetch', sig: '(url)', desc: 'Gọi HTTP API', example: "const r = await fetch('/api'); const j = await r.json();" },
          { name: 'Promise / async await', desc: 'Xử lý bất đồng bộ' },
          { name: 'setTimeout / setInterval', desc: 'Trì hoãn / lặp theo thời gian' },
          { name: 'JSON.parse / stringify', desc: 'Đổi JSON ↔ object' },
          { name: 'localStorage', desc: 'Lưu trình duyệt', example: "localStorage.setItem('k', 'v')" },
        ],
      },
      {
        title: 'Mảng hữu ích',
        items: [
          { name: 'map / filter / find', desc: 'Biến đổi / lọc / tìm phần tử' },
          { name: 'forEach / reduce', desc: 'Duyệt / gộp giá trị' },
          { name: 'push / pop / slice', desc: 'Thêm / bớt / cắt mảng' },
        ],
      },
    ],
  },
  {
    id: 'python',
    label: 'Python',
    sections: [
      {
        title: 'Cơ bản',
        items: [
          { name: 'print', sig: '(*args)', desc: 'In ra console', example: 'print("Hello", 123)' },
          { name: 'input', sig: '(prompt)', desc: 'Nhập từ bàn phím' },
          { name: 'len / type / range', desc: 'Độ dài, kiểu, dãy số' },
          { name: 'if / for / while', desc: 'Điều kiện & vòng lặp' },
          { name: 'def', sig: 'name(args):', desc: 'Định nghĩa hàm' },
          { name: 'list / dict / set', desc: 'Cấu trúc dữ liệu' },
        ],
      },
      {
        title: 'Chuỗi & list',
        items: [
          { name: 'str.split / join', desc: 'Tách / nối chuỗi' },
          { name: 'list.append / pop', desc: 'Thêm / lấy phần tử' },
          { name: 'list comprehension', example: '[x*2 for x in range(5)]', desc: 'Tạo list ngắn gọn' },
        ],
      },
      {
        title: 'Module hay dùng',
        items: [
          { name: 'import math', desc: 'Toán: sqrt, sin, pi…' },
          { name: 'import json', desc: 'Xử lý JSON' },
          { name: 'import random', desc: 'Số ngẫu nhiên' },
          { name: 'open / with', desc: 'Đọc ghi file' },
        ],
      },
    ],
  },
  {
    id: 'java',
    label: 'Java',
    sections: [
      {
        title: 'Cơ bản',
        items: [
          { name: 'public class Main', desc: 'Lớp chính, method main' },
          { name: 'System.out.println', desc: 'In ra console' },
          { name: 'int / double / String / boolean', desc: 'Kiểu dữ liệu' },
          { name: 'if / for / while', desc: 'Điều khiển luồng' },
          { name: 'new ArrayList<>()', desc: 'Danh sách động' },
        ],
      },
    ],
  },
  {
    id: 'cpp',
    label: 'C / C++',
    sections: [
      {
        title: 'Cơ bản',
        items: [
          { name: 'iostream', example: '#include <iostream>\nusing namespace std;', desc: 'Nhập xuất C++' },
          { name: 'cout / cin', desc: 'In / đọc', example: 'cout << "Hi"; cin >> x;' },
          { name: 'printf / scanf', desc: 'Nhập xuất kiểu C' },
          { name: 'vector', example: '#include <vector>\nvector<int> a;', desc: 'Mảng động C++' },
          { name: 'for / while / if', desc: 'Vòng lặp & điều kiện' },
        ],
      },
    ],
  },
  {
    id: 'sql',
    label: 'SQL',
    sections: [
      {
        title: 'Truy vấn',
        items: [
          { name: 'SELECT', example: 'SELECT * FROM users WHERE id = 1;', desc: 'Lấy dữ liệu' },
          { name: 'INSERT', example: "INSERT INTO users(name) VALUES('An');", desc: 'Thêm dòng' },
          { name: 'UPDATE', example: "UPDATE users SET name='B' WHERE id=1;", desc: 'Cập nhật' },
          { name: 'DELETE', example: 'DELETE FROM users WHERE id=1;', desc: 'Xóa dòng' },
          { name: 'JOIN', desc: 'Nối bảng (INNER / LEFT)' },
          { name: 'ORDER BY / LIMIT', desc: 'Sắp xếp / giới hạn kết quả' },
          { name: 'CREATE TABLE', desc: 'Tạo bảng' },
        ],
      },
    ],
  },
  {
    id: 'typescript',
    label: 'TypeScript',
    sections: [
      {
        title: 'Kiểu',
        items: [
          { name: ': string | number | boolean', desc: 'Gán kiểu biến' },
          { name: 'interface / type', desc: 'Định nghĩa shape object' },
          { name: 'Array<T> / T[]', desc: 'Mảng kiểu T' },
          { name: 'optional ?', desc: 'Thuộc tính tùy chọn' },
          { name: 'as / satisfies', desc: 'Ép kiểu / kiểm tra' },
        ],
      },
    ],
  },
  {
    id: 'go',
    label: 'Go',
    sections: [
      {
        title: 'Cơ bản',
        items: [
          { name: 'package main', desc: 'Entry package' },
          { name: 'fmt.Println', desc: 'In ra' },
          { name: 'func', desc: 'Khai báo hàm' },
          { name: ':= ', desc: 'Khai báo ngắn biến' },
          { name: 'goroutine go fn()', desc: 'Chạy song song' },
        ],
      },
    ],
  },
  {
    id: 'rust',
    label: 'Rust',
    sections: [
      {
        title: 'Cơ bản',
        items: [
          { name: 'fn main()', desc: 'Hàm chính' },
          { name: 'println!', desc: 'Macro in' },
          { name: 'let / let mut', desc: 'Immutable / mutable' },
          { name: 'Result / Option', desc: 'Xử lý lỗi & giá trị tùy chọn' },
        ],
      },
    ],
  },
  {
    id: 'php',
    label: 'PHP',
    sections: [
      {
        title: 'Cơ bản',
        items: [
          { name: 'echo / print', desc: 'In chuỗi' },
          { name: '$_GET / $_POST', desc: 'Dữ liệu request' },
          { name: 'array / foreach', desc: 'Mảng & duyệt' },
          { name: 'function', desc: 'Định nghĩa hàm' },
        ],
      },
    ],
  },
  {
    id: 'ruby',
    label: 'Ruby',
    sections: [
      {
        title: 'Cơ bản',
        items: [
          { name: 'puts / print', desc: 'In ra' },
          { name: 'def ... end', desc: 'Hàm' },
          { name: 'each', desc: 'Duyệt collection' },
          { name: 'class ... end', desc: 'Lớp' },
        ],
      },
    ],
  },
];

function CopyBtn({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      className="icon-btn"
      title="Copy"
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setOk(true);
          setTimeout(() => setOk(false), 1200);
        });
      }}
    >
      {ok ? <Check size={12} /> : <Copy size={12} />}
    </button>
  );
}

export function LangDocs() {
  const [lang, setLang] = useState('javascript');
  const [q, setQ] = useState('');

  const current = DOCS.find((d) => d.id === lang) || DOCS[0];

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return current.sections;
    return current.sections
      .map((s) => ({
        ...s,
        items: s.items.filter(
          (it) =>
            it.name.toLowerCase().includes(query) ||
            it.desc.toLowerCase().includes(query) ||
            (it.example || '').toLowerCase().includes(query)
        ),
      }))
      .filter((s) => s.items.length > 0);
  }, [current, q]);

  return (
    <div className="flex flex-col h-full text-[13px]">
      <div className="p-3 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2 mb-2" style={{ color: 'var(--text-secondary)' }}>
          <BookOpen size={14} />
          <span className="text-[11px] font-semibold uppercase tracking-wider">Language Docs</span>
        </div>
        <div className="relative mb-2">
          <Search size={13} className="absolute left-2.5 top-2.5 opacity-50" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm hàm, ví dụ…"
            className="w-full pl-8 pr-2 py-1.5 text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-1 max-h-[72px] overflow-auto">
          {DOCS.map((d) => (
            <button
              key={d.id}
              onClick={() => setLang(d.id)}
              className="px-2 py-0.5 rounded-md text-[11px]"
              style={{
                background: lang === d.id ? 'var(--accent)' : 'var(--hover)',
                color: lang === d.id ? '#fff' : 'var(--text-secondary)',
              }}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-3 space-y-4">
        {filtered.map((sec) => (
          <div key={sec.title}>
            <div className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--accent)' }}>
              {sec.title}
            </div>
            <div className="space-y-2">
              {sec.items.map((it) => (
                <div
                  key={it.name + it.desc}
                  className="rounded-lg p-2.5 border"
                  style={{ borderColor: 'var(--border)', background: 'var(--hover)' }}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-[12px] font-semibold text-[var(--accent)]">
                        {it.name}
                        {it.sig && (
                          <span className="opacity-70 font-normal"> {it.sig}</span>
                        )}
                      </div>
                      <div className="text-[12px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                        {it.desc}
                      </div>
                    </div>
                    {it.example && <CopyBtn text={it.example} />}
                  </div>
                  {it.example && (
                    <pre
                      className="mt-2 text-[11px] font-mono p-2 rounded overflow-x-auto"
                      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                    >
                      {it.example}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-sm py-8" style={{ color: 'var(--text-secondary)' }}>
            Không tìm thấy
          </p>
        )}
      </div>
    </div>
  );
}

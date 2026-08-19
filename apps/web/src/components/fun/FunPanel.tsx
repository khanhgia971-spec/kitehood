import { useMemo, useState } from 'react';
import { Dice5, Gamepad2, Lightbulb, Rocket, Sparkles, Trophy } from 'lucide-react';

const QUIZZES = [
  { q: 'Thẻ HTML tiêu đề lớn nhất?', options: ['<h1>', '<header>', '<title>', '<big>'], answer: 0, tip: 'h1 là heading cấp 1.' },
  { q: 'Python lặp 0..9?', options: ['for i in 10', 'for i in range(10)', 'loop(10)', 'for i to 10'], answer: 1, tip: 'range(10) → 0..9.' },
  { q: 'C: in ra màn hình?', options: ['cout', 'printf', 'print', 'echo'], answer: 1, tip: 'C dùng printf từ stdio.h.' },
  { q: 'C++ thêm phần tử vector?', options: ['push', 'push_back', 'add', 'append'], answer: 1, tip: 'v.push_back(x).' },
  { q: 'JS so sánh nghiêm?', options: ['==', '===', '=', '!='], answer: 1, tip: '=== không ép kiểu.' },
  { q: 'HTTP 404?', options: ['OK', 'Unauthorized', 'Not Found', 'Server Error'], answer: 2, tip: '404 = không tìm thấy.' },
  { q: 'Git lưu snapshot local?', options: ['git push', 'git commit', 'git pull', 'git clone'], answer: 1, tip: 'commit local; push remote.' },
  { q: 'CSS flex căn trục chính?', options: ['align-items', 'justify-content', 'flex-center', 'text-align'], answer: 1, tip: 'justify-content = main axis.' },
];

const TIPS = [
  'Preview cũng chạy được C/C++/Python — không chỉ HTML.',
  'Set default chỉ khi F5; đổi tab + Preview để xem file khác.',
  'Connect link gắn CSS/JS vào <head> HTML.',
  'Snippets (icon nhánh) có mẫu C/C++/Java/Python.',
  'stdin trong panel Run để nhập dữ liệu cho cin/scanf.',
];

const JOKES = [
  'Dark mode: vì light thu hút bug!',
  '0 lỗi compile ≠ chạy đúng.',
  'Có 10 loại người: hiểu binary và không.',
  'git commit -m "fix" — kinh điển.',
];

const CHALLENGES = [
  { title: 'In 1→10', desc: 'In các số 1..10 mỗi số một dòng (C/Python/JS…).' },
  { title: 'Tổng 1→n', desc: 'Nhập n, in tổng 1+…+n.' },
  { title: 'FizzBuzz', desc: '1..30: ÷3 Fizz, ÷5 Buzz, cả hai FizzBuzz.' },
  { title: 'Đảo chuỗi', desc: 'Nhập chuỗi, in đảo ngược.' },
];

export function FunPanel() {
  const [tab, setTab] = useState<'quiz' | 'fun'>('quiz');
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [tipIdx, setTipIdx] = useState(0);
  const [joke, setJoke] = useState(JOKES[0]);
  const [localXp, setLocalXp] = useState(() => {
    try {
      return parseInt(localStorage.getItem('mhc-fun-xp') || '0', 10) || 0;
    } catch {
      return 0;
    }
  });
  const quiz = QUIZZES[idx % QUIZZES.length];
  const challenge = useMemo(() => CHALLENGES[localXp % CHALLENGES.length], [localXp]);

  function addXp(n: number) {
    const v = localXp + n;
    setLocalXp(v);
    try {
      localStorage.setItem('mhc-fun-xp', String(v));
    } catch {
      /* */
    }
  }

  function pick(i: number) {
    if (picked !== null) return;
    setPicked(i);
    if (i === quiz.answer) {
      setScore((s) => s + 10);
      addXp(3);
    }
  }

  return (
    <div className="flex flex-col h-full text-[13px]">
      <div className="p-2 border-b flex gap-1" style={{ borderColor: 'var(--border)' }}>
        <button
          className={`flex-1 text-[11px] py-1.5 rounded-lg ${tab === 'quiz' ? 'btn-accent' : 'btn-glass'}`}
          onClick={() => setTab('quiz')}
        >
          <Gamepad2 size={12} className="inline mr-1" /> Đố vui
        </button>
        <button
          className={`flex-1 text-[11px] py-1.5 rounded-lg ${tab === 'fun' ? 'btn-accent' : 'btn-glass'}`}
          onClick={() => setTab('fun')}
        >
          <Sparkles size={12} className="inline mr-1" /> Góc vui
        </button>
      </div>

      {tab === 'quiz' && (
        <div className="p-3 space-y-3 overflow-auto flex-1">
          <div className="flex items-center gap-2 text-[11px] opacity-70">
            <Trophy size={14} className="text-amber-400" /> Điểm: {score} · XP vui: {localXp}
          </div>
          <p className="font-medium text-[13px]">{quiz.q}</p>
          <div className="space-y-1.5">
            {quiz.options.map((op, i) => {
              let cls = 'btn-glass w-full text-left px-3 py-2 rounded-lg text-[12px]';
              if (picked !== null) {
                if (i === quiz.answer) cls += ' ring-1 ring-emerald-400';
                else if (i === picked) cls += ' ring-1 ring-red-400 opacity-70';
              }
              return (
                <button key={i} className={cls} onClick={() => pick(i)} disabled={picked !== null}>
                  {op}
                </button>
              );
            })}
          </div>
          {picked !== null && (
            <div className="text-[11px] opacity-80 space-y-2">
              <p>{picked === quiz.answer ? '✓ Đúng!' : '✕ Sai rồi.'} {quiz.tip}</p>
              <button
                className="btn-accent text-[11px] px-3 py-1.5 rounded-lg"
                onClick={() => {
                  setPicked(null);
                  setIdx((i) => i + 1);
                }}
              >
                Câu tiếp
              </button>
            </div>
          )}
        </div>
      )}

      {tab === 'fun' && (
        <div className="p-3 space-y-3 overflow-auto flex-1">
          <div className="p-3 rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--hover)' }}>
            <div className="flex items-center gap-2 mb-1">
              <Lightbulb size={14} className="text-amber-400" />
              <b className="text-[12px]">Mẹo</b>
            </div>
            <p className="text-[12px]">{TIPS[tipIdx % TIPS.length]}</p>
            <button className="btn-glass text-[10px] mt-2 px-2 py-1 rounded-lg" onClick={() => { setTipIdx((i) => i + 1); addXp(1); }}>
              Mẹo khác
            </button>
          </div>

          <div className="p-3 rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--hover)' }}>
            <div className="flex items-center gap-2 mb-1">
              <Trophy size={14} className="text-yellow-400" />
              <b className="text-[12px]">Thử thách</b>
            </div>
            <p className="text-[12px] font-semibold">{challenge.title}</p>
            <p className="text-[11px] opacity-70">{challenge.desc}</p>
            <button className="btn-accent text-[10px] mt-2 px-2 py-1 rounded-lg" onClick={() => addXp(5)}>
              Đã xong (+5 XP)
            </button>
          </div>

          <div className="p-3 rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--hover)' }}>
            <div className="flex items-center gap-2 mb-1">
              <Dice5 size={14} className="text-pink-400" />
              <b className="text-[12px]">Joke</b>
            </div>
            <p className="text-[12px]">{joke}</p>
            <button
              className="btn-glass text-[10px] mt-2 px-2 py-1 rounded-lg"
              onClick={() => {
                setJoke(JOKES[Math.floor(Math.random() * JOKES.length)]);
                addXp(1);
              }}
            >
              Joke khác
            </button>
          </div>

          <div className="p-3 rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--hover)' }}>
            <div className="flex items-center gap-2 mb-1">
              <Rocket size={14} className="text-sky-400" />
              <b className="text-[12px]">Gợi ý dùng IDE</b>
            </div>
            <ul className="text-[11px] space-y-1 opacity-80 list-disc pl-4">
              <li>Mở file .c → bấm <b>Preview</b> để xem stdout ngay</li>
              <li>Panel Run vẫn có stdin cho bài nhập liệu</li>
              <li>Snippets + TODO để gõ nhanh hơn</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

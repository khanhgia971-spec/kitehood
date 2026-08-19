import { Link } from 'react-router-dom';
import { ArrowRight, Code2, Rocket, BookOpen, Cloud, Sparkles } from 'lucide-react';

const LANGS = {
  Popular: ['HTML', 'Python', 'JavaScript', 'Java', 'C', 'C++', 'PHP', 'C#', 'SQL', 'Go', 'Rust', 'TypeScript'],
  Programming: ['Kotlin', 'Swift', 'Ruby', 'Scala', 'Dart', 'Lua', 'Perl', 'R', 'Haskell', 'Elixir', 'Zig', 'Nim'],
  Web: ['React', 'Vue', 'Angular', 'Svelte', 'NodeJS', 'Tailwind', 'Bootstrap', 'jQuery'],
  Databases: ['MySQL', 'PostgreSQL', 'MongoDB', 'SQLite', 'Redis'],
};

const FEATURES = [
  {
    title: 'Editor nhúng & thử thách',
    desc: 'Mở IDE ngay trên trình duyệt — Monaco, tab, explorer giống VS Code.',
    icon: Code2,
  },
  {
    title: 'Chạy code đa ngôn ngữ',
    desc: 'C, C++, Python, Java, Go, Rust… qua backend công cộng; HTML live preview.',
    icon: Rocket,
  },
  {
    title: 'AI Agent + học tập',
    desc: 'Dán API key (OpenAI, Gemini, Groq…), lộ trình Learn, snippets, đố vui.',
    icon: Sparkles,
  },
  {
    title: 'Deploy & cloud',
    desc: 'Đóng gói Cloudflare Workers, lưu project local / sync khi đăng nhập.',
    icon: Cloud,
  },
];

export function LandingPage() {
  return (
    <div className="landing-root">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#070a12]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-6">
          <Link to="/" className="flex items-baseline gap-0.5 shrink-0">
            <span className="brand-kite text-xl text-white">Kite</span>
            <span className="brand-hood text-3xl">Hood</span>
          </Link>
          <nav className="landing-nav hidden md:flex items-center gap-5 flex-1">
            <a href="#pricing">Pricing</a>
            <a href="#learn">Learn</a>
            <Link to="/code">Code</Link>
            <a href="#deploy">Deploy</a>
            <a href="#more">More</a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Link
              to="/login"
              className="text-sm text-slate-400 hover:text-white px-3 py-1.5"
            >
              Đăng nhập
            </Link>
            <Link
              to="/code"
              className="text-sm font-semibold px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white"
            >
              Bắt đầu code
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-16 pb-12 text-center">
        <p className="text-indigo-300/90 text-sm font-medium mb-3 tracking-wide">
          IDE online · AI · Preview · Deploy
        </p>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-4">
          Code online với{' '}
          <span className="brand-kite">Kite</span>
          <span className="brand-hood text-5xl md:text-7xl align-middle">Hood</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-8">
          Viết và chạy code trên trình duyệt — học lập trình, AI Agent, live preview HTML,
          và workflow giống VS Code trong một sản phẩm mượt.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            to="/code"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white font-semibold shadow-lg shadow-indigo-500/25"
          >
            Mở IDE <ArrowRight size={18} />
          </Link>
          <a
            href="#langs"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl border border-white/10 hover:bg-white/5 text-slate-200 font-medium"
          >
            Xem ngôn ngữ
          </a>
        </div>
      </section>

      {/* Lang grid */}
      <section id="langs" className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-white mb-2 text-center">Chọn ngôn ngữ & bắt đầu</h2>
        <p className="text-slate-500 text-center text-sm mb-8">Popular · Programming · Web · Databases</p>
        {Object.entries(LANGS).map(([group, list]) => (
          <div key={group} className="mb-6">
            <h3 className="text-xs uppercase tracking-wider text-slate-500 mb-2">{group}</h3>
            <div className="flex flex-wrap gap-2">
              {list.map((name) => (
                <Link key={name} to="/code" className="lang-chip text-slate-200">
                  {name}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Features */}
      <section id="learn" className="max-w-6xl mx-auto px-4 py-14">
        <h2 className="text-2xl font-bold text-white mb-8 text-center">Xây sản phẩm & học nhanh hơn</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="p-5 rounded-2xl border border-white/8 bg-white/[0.03] hover:bg-white/[0.05] transition-colors"
            >
              <f.icon className="text-indigo-400 mb-3" size={22} />
              <h3 className="font-semibold text-white mb-1">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Deploy */}
      <section id="deploy" className="max-w-6xl mx-auto px-4 py-12">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-500/10 to-fuchsia-500/5 p-8 md:p-10">
          <div className="flex items-center gap-2 text-indigo-300 text-sm font-medium mb-2">
            <Cloud size={16} /> Deploy
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Cloudflare-ready</h2>
          <p className="text-slate-400 max-w-xl mb-6 text-sm leading-relaxed">
            Build tĩnh + Worker, không bắt buộc R2. Lưu project trên trình duyệt; đăng nhập để sync.
            Phù hợp học tập và prototype nhanh.
          </p>
          <Link to="/code" className="text-indigo-300 hover:text-white text-sm font-semibold inline-flex items-center gap-1">
            Vào workspace <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* Pricing placeholder */}
      <section id="pricing" className="max-w-6xl mx-auto px-4 py-14">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Pricing</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { name: 'Free', price: '0đ', items: ['IDE đầy đủ', 'Chạy code cơ bản', 'AI bằng key của bạn'] },
            { name: 'Student', price: 'Sắp có', items: ['Lớp học / org', 'Thử thách', 'Ưu tiên support'] },
            { name: 'Team', price: 'Sắp có', items: ['Không gian riêng', 'Chat & assign', 'API embed'] },
          ].map((p) => (
            <div key={p.name} className="p-6 rounded-2xl border border-white/10 bg-white/[0.03]">
              <div className="text-slate-400 text-sm">{p.name}</div>
              <div className="text-3xl font-bold text-white my-2">{p.price}</div>
              <ul className="text-sm text-slate-400 space-y-1.5">
                {p.items.map((i) => (
                  <li key={i}>• {i}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* More */}
      <section id="more" className="max-w-6xl mx-auto px-4 py-10 border-t border-white/5">
        <div className="flex flex-wrap gap-4 text-sm text-slate-500 justify-center">
          <span>Cheatsheets</span>
          <span>·</span>
          <span>Tutorials</span>
          <span>·</span>
          <Link to="/code" className="text-indigo-400 hover:text-indigo-300">Studio / IDE</Link>
          <span>·</span>
          <span>AI Tools</span>
          <span>·</span>
          <Link to="/login" className="hover:text-white">Account</Link>
        </div>
      </section>

      <footer className="border-t border-white/5 py-10 text-center text-xs text-slate-600">
        <div className="mb-2">
          <span className="brand-kite text-white text-sm">Kite</span>
          <span className="brand-hood text-2xl">Hood</span>
        </div>
        <p>© {new Date().getFullYear()} KiteHood · Học code online</p>
        <p className="mt-1 opacity-70">Không liên kết với One Compiler Pvt. Ltd.</p>
      </footer>
    </div>
  );
}

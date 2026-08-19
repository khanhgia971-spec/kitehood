import { runSqlDemo } from './sqlDemo';
/**
 * Multi-backend remote runner.
 * Piston public API whitelist-only từ 2/2026 → dùng Judge0 CE + Wandbox.
 */

export type RunResult = {
  stdout: string;
  stderr: string;
  exitCode: number;
  backend: string;
  timeMs?: number;
};

const JUDGE0_LANG: Record<string, number> = {
  c: 50,
  cpp: 54,
  'c++': 54,
  csharp: 51,
  python: 71,
  java: 62,
  javascript: 63,
  typescript: 74,
  nodejs: 63,
  go: 60,
  rust: 73,
  php: 68,
  ruby: 72,
  kotlin: 78,
  swift: 83,
  lua: 64,
  sql: 82,
  bash: 46,
  shell: 46,
  perl: 85,
  r: 80,
  dart: 69,
  scala: 81,
  haskell: 61,
  elixir: 57,
  erlang: 58,
  clojure: 86,
  fsharp: 87,
  fortran: 59,
  pascal: 67,
  'objective-c': 79,
  assembly: 45,
  cobol: 77,
  groovy: 88,
  brainfuck: 47,
  cobol: 77,
  octave: 66,
  prolog: 69,
  scheme: 55,
  lisp: 55,
  ocaml: 65,

};

const WANDBOX_COMPILERS: Record<string, string> = {
  c: 'gcc-13.2.0-c',
  cpp: 'gcc-13.2.0',
  'c++': 'gcc-13.2.0',
  python: 'cpython-3.12.1',
  ruby: 'ruby-3.2.2',
  php: 'php-8.2.9',
  lua: 'lua-5.4.6',
  haskell: 'ghc-9.6.3',
  rust: 'rust-1.75.0',
  go: 'go-1.21.5',
  java: 'openjdk-21',
  javascript: 'nodejs-20.10.0',
  typescript: 'typescript-5.3.3',
  nodejs: 'nodejs-20.10.0',
  csharp: 'csharp-9.0',
  swift: 'swift-5.9.2',
  kotlin: 'kotlin-1.9.22',
  scala: 'scala-3.3.1',
  perl: 'perl-5.38.0',
  bash: 'bash',
  shell: 'bash',
};

export function canRunRemote(lang: string): boolean {
  const l = (lang || '').toLowerCase();
  return !!(JUDGE0_LANG[l] || WANDBOX_COMPILERS[l]);
}

async function runJudge0(lang: string, code: string, stdin: string): Promise<RunResult | null> {
  const language_id = JUDGE0_LANG[lang];
  if (!language_id) return null;
  const t0 = performance.now();
  try {
    const res = await fetch('https://ce.judge0.com/submissions?base64_encoded=false&wait=true', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source_code: code,
        language_id,
        stdin: stdin || '',
        cpu_time_limit: 5,
        wall_time_limit: 12,
      }),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => '');
      return {
        stdout: '',
        stderr: `Judge0 HTTP ${res.status}: ${t.slice(0, 240)}`,
        exitCode: 1,
        backend: 'judge0',
        timeMs: Math.round(performance.now() - t0),
      };
    }
    const data = await res.json();
    const stdout = (data.stdout || '').trim();
    const stderr = [data.compile_output, data.stderr, data.message].filter(Boolean).join('\n').trim();
    const statusId = data?.status?.id;
    const exitCode =
      typeof data.exit_code === 'number' ? data.exit_code : statusId === 3 ? 0 : stderr ? 1 : 0;
    return {
      stdout,
      stderr,
      exitCode,
      backend: 'judge0-ce',
      timeMs: Math.round(performance.now() - t0),
    };
  } catch (e: any) {
    return {
      stdout: '',
      stderr: e?.message || String(e),
      exitCode: 1,
      backend: 'judge0',
      timeMs: Math.round(performance.now() - t0),
    };
  }
}

async function runWandbox(lang: string, code: string, stdin: string): Promise<RunResult | null> {
  const compiler = WANDBOX_COMPILERS[lang];
  if (!compiler) return null;
  const t0 = performance.now();
  try {
    const res = await fetch('https://wandbox.org/api/compile.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        compiler,
        stdin: stdin || '',
        options: '',
      }),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => '');
      return {
        stdout: '',
        stderr: `Wandbox HTTP ${res.status}: ${t.slice(0, 240)}`,
        exitCode: 1,
        backend: 'wandbox',
        timeMs: Math.round(performance.now() - t0),
      };
    }
    const data = await res.json();
    const stdout = (data.program_output || '').trim();
    const stderr = [data.compiler_error, data.program_error, data.compiler_message]
      .filter(Boolean)
      .join('\n')
      .trim();
    const status = data.status;
    const exitCode = status === '0' || status === 0 ? 0 : stderr && !stdout ? 1 : status ? 1 : 0;
    return {
      stdout,
      stderr,
      exitCode: exitCode === 0 || (stdout && !stderr) ? 0 : exitCode,
      backend: 'wandbox',
      timeMs: Math.round(performance.now() - t0),
    };
  } catch (e: any) {
    return {
      stdout: '',
      stderr: e?.message || String(e),
      exitCode: 1,
      backend: 'wandbox',
      timeMs: Math.round(performance.now() - t0),
    };
  }
}

function isHardFail(r: RunResult | null): boolean {
  if (!r) return true;
  const s = r.stderr || '';
  return (
    s.includes('HTTP 401') ||
    s.includes('HTTP 403') ||
    s.includes('HTTP 429') ||
    s.includes('HTTP 502') ||
    s.includes('HTTP 503') ||
    s.includes('Failed to fetch') ||
    s.includes('NetworkError') ||
    s.includes('whitelist')
  );
}

/** Alias used by RunPanel */
export async function runRemoteCode(
  lang: string,
  code: string,
  stdin: string
): Promise<RunResult> {
  return runCodeRemote(lang, code, stdin);
}

export async function runCodeRemote(
  lang: string,
  code: string,
  stdin: string
): Promise<RunResult> {
  const l = (lang || '').toLowerCase();

  const SQL_DIALECTS: Record<string, string> = {
    sql: 'SQL',
    sqlite: 'SQLite',
    mysql: 'MySQL',
    postgresql: 'PostgreSQL',
    postgres: 'PostgreSQL',
    mariadb: 'MariaDB',
    oracle: 'Oracle',
    mssql: 'SQL Server',
    'sql-server': 'SQL Server',
    plsql: 'PL/SQL',
    'pl/sql': 'PL/SQL',
    cassandra: 'Cassandra',
    questdb: 'QuestDB',
    duckdb: 'DuckDB',
    surrealdb: 'SurrealDB',
    firebird: 'Firebird',
    clickhouse: 'ClickHouse',
    mongodb: 'MongoDB',
    redis: 'Redis',
  };
  if (SQL_DIALECTS[l]) {
    const r = runSqlDemo(code, SQL_DIALECTS[l]);
    return { ...r, backend: 'sql-demo', timeMs: 1 };
  }


  // Prefer Wandbox first for C/C++ (stable, no whitelist)
  if (l === 'c' || l === 'cpp' || l === 'c++') {
    const wb = await runWandbox(l === 'c++' ? 'cpp' : l, code, stdin);
    if (wb && !isHardFail(wb)) return wb;
    const j0 = await runJudge0(l === 'c++' ? 'cpp' : l, code, stdin);
    if (j0 && !isHardFail(j0)) return j0;
    return (
      wb ||
      j0 || {
        stdout: '',
        stderr: 'C/C++: Wandbox + Judge0 đều không chạy được. Kiểm tra mạng.',
        exitCode: 1,
        backend: 'none',
      }
    );
  }

  const j0 = await runJudge0(l, code, stdin);
  if (j0 && !isHardFail(j0) && (j0.stdout || j0.exitCode === 0 || j0.stderr)) {
    // compile errors still useful
    if (!isHardFail(j0)) return j0;
  }

  const wb = await runWandbox(l, code, stdin);
  if (wb && !isHardFail(wb)) return wb;

  if (j0 && !isHardFail(j0)) return j0;
  if (wb) return wb;
  if (j0) return j0;

  return {
    stdout: '',
    stderr:
      'Không chạy được trên backend công cộng (Judge0 CE / Wandbox).\n' +
      'Piston emkc.org đã khóa whitelist. Thử lại sau hoặc chạy HTML/JS local.',
    exitCode: 1,
    backend: 'none',
  };
}

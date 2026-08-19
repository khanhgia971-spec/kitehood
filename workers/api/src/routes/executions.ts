import { Env } from '../index';
import { jsonResponse, errorResponse } from '../utils/response';
import { JwtPayload } from '../../../../packages/shared/src/types';

/** Map language → Judge0 language_id (optional cloud runner) */
const JUDGE0_LANG: Record<string, number> = {
  javascript: 63,
  nodejs: 63,
  typescript: 74,
  python: 71,
  java: 62,
  c: 50,
  cpp: 54,
  csharp: 51,
  go: 60,
  rust: 73,
  php: 68,
  ruby: 72,
  kotlin: 78,
  swift: 83,
  lua: 64,
  sql: 82,
};

/** Map our language ids → Piston language names */
const PISTON_LANG: Record<string, string> = {
  javascript: 'javascript',
  nodejs: 'javascript',
  typescript: 'typescript',
  python: 'python',
  java: 'java',
  c: 'c',
  cpp: 'c++',
  csharp: 'csharp',
  go: 'go',
  rust: 'rust',
  php: 'php',
  ruby: 'ruby',
  kotlin: 'kotlin',
  swift: 'swift',
  lua: 'lua',
  sql: 'sqlite3',
  sqlite: 'sqlite3',
  mysql: 'sqlite3',
  postgresql: 'sqlite3',
  bash: 'bash',
  shell: 'bash',
  perl: 'perl',
  r: 'r',
  dart: 'dart',
  scala: 'scala',
  groovy: 'groovy',
  haskell: 'haskell',
  elixir: 'elixir',
  erlang: 'erlang',
  clojure: 'clojure',
  fsharp: 'fsharp',
  fortran: 'fortran',
  pascal: 'pascal',
  'objective-c': 'objective-c',
  julia: 'julia',
  zig: 'zig',
  nim: 'nim',
  crystal: 'crystal',
  coffeescript: 'coffeescript',
  deno: 'typescript',
  bun: 'typescript',
  vb: 'basic',
  assembly: 'nasm',
};

export async function handleExecutions(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  user: JwtPayload
): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/executions', '');

  // POST /api/executions
  if (request.method === 'POST' && (path === '' || path === '/')) {
    const body = (await request.json()) as {
      projectId?: string;
      language: string;
      code?: string;
      files?: Array<{ name: string; content: string; language?: string }>;
      stdin?: string;
    };

    if (!body.language) return errorResponse('language required');

    const source =
      body.code ||
      body.files?.[0]?.content ||
      body.files?.find((f) => f.language === body.language)?.content ||
      body.files?.find((f) => !f.name.endsWith('.css') && !f.name.endsWith('.html'))?.content ||
      '';

    const id = crypto.randomUUID();
    const start = Date.now();

    // Log job
    try {
      await env.DB.prepare(
        `INSERT INTO executions (id, project_id, user_id, language, status, stdin)
         VALUES (?, ?, ?, ?, 'running', ?)`
      )
        .bind(id, body.projectId || null, user.sub, body.language, body.stdin || null)
        .run();
    } catch {
      // table may differ — ignore log failure
    }

    // ── 1) Optional external runner (Judge0)
    const runnerUrl = (env as any).EXECUTION_URL as string | undefined;
    const judge0Key = (env as any).JUDGE0_API_KEY as string | undefined;

    if (judge0Key && JUDGE0_LANG[body.language]) {
      try {
        const res = await fetch(
          'https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-RapidAPI-Key': judge0Key,
              'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
            },
            body: JSON.stringify({
              language_id: JUDGE0_LANG[body.language],
              source_code: source,
              stdin: body.stdin || '',
            }),
          }
        );
        const data = (await res.json()) as any;
        const result = {
          id,
          stdout: data.stdout || '',
          stderr: data.stderr || data.compile_output || '',
          exitCode: data.status?.id === 3 ? 0 : 1,
          timeMs: Math.round((parseFloat(data.time) || 0) * 1000),
          memoryKb: data.memory || 0,
          status: data.status?.id === 3 ? 'success' : 'error',
        };
        await updateExec(env, id, result);
        return jsonResponse(result);
      } catch (e: any) {
        console.error('Judge0 error', e?.message);
      }
    }

    if (runnerUrl) {
      try {
        const token = (env as any).EXECUTION_TOKEN || '';
        const res = await fetch(runnerUrl.replace(/\/$/, '') + '/run', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            language: body.language,
            code: source,
            stdin: body.stdin || '',
            files: body.files,
          }),
        });
        const data = (await res.json()) as any;
        const result = {
          id,
          stdout: data.stdout || data.output || '',
          stderr: data.stderr || data.error || '',
          exitCode: data.exitCode ?? data.exit_code ?? 0,
          timeMs: data.timeMs ?? Date.now() - start,
          memoryKb: data.memoryKb ?? 0,
          status: (data.exitCode ?? 0) === 0 ? 'success' : 'error',
        };
        await updateExec(env, id, result);
        return jsonResponse(result);
      } catch (e: any) {
        console.error('Runner error', e?.message);
      }
    }

    // ── 2) Built-in: JavaScript / TypeScript (Worker-side, limited)
    if (['javascript', 'nodejs', 'typescript'].includes(body.language)) {
      try {
        const logs: string[] = [];
        const fakeConsole = {
          log: (...a: any[]) => logs.push(a.map(String).join(' ')),
          error: (...a: any[]) => logs.push('[error] ' + a.map(String).join(' ')),
          warn: (...a: any[]) => logs.push('[warn] ' + a.map(String).join(' ')),
          info: (...a: any[]) => logs.push(a.map(String).join(' ')),
        };
        const fn = new Function('console', 'stdin', source);
        const ret = fn(fakeConsole, body.stdin || '');
        if (ret !== undefined) logs.push(String(ret));
        const result = {
          id,
          stdout: logs.join('\n') || '(no output)',
          stderr: '',
          exitCode: 0,
          timeMs: Date.now() - start,
          memoryKb: Math.round(source.length / 10),
          status: 'success',
        };
        await updateExec(env, id, result);
        return jsonResponse(result);
      } catch (e: any) {
        const result = {
          id,
          stdout: '',
          stderr: e?.message || String(e),
          exitCode: 1,
          timeMs: Date.now() - start,
          memoryKb: 0,
          status: 'error',
        };
        await updateExec(env, id, result);
        return jsonResponse(result);
      }
    }

    // ── 3) Free Piston API fallback (https://emkc.org/api/v2/piston) — no key required
    const pistonLang = PISTON_LANG[body.language];
    if (pistonLang) {
      try {
        const res = await fetch('https://emkc.org/api/v2/piston/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            language: pistonLang,
            version: '*',
            files: [{ content: source }],
            stdin: body.stdin || '',
            run_timeout: 10000,
            compile_timeout: 10000,
          }),
        });
        const data = (await res.json()) as any;
        if (data.message && !data.run) {
          // rate limit or error
          throw new Error(data.message);
        }
        const run = data.run || {};
        const compile = data.compile || {};
        const stderr = [compile.stderr, run.stderr].filter(Boolean).join('\n');
        const stdout = run.stdout || '';
        const exitCode = run.code ?? (stderr ? 1 : 0);
        const result = {
          id,
          stdout,
          stderr,
          exitCode,
          timeMs: Date.now() - start,
          memoryKb: 0,
          status: exitCode === 0 ? 'success' : 'error',
        };
        await updateExec(env, id, result);
        return jsonResponse(result);
      } catch (e: any) {
        console.error('Piston error', e?.message);
        const result = {
          id,
          stdout: '',
          stderr: `Piston execution failed: ${e?.message || e}\n\nYou can also set JUDGE0_API_KEY for higher limits.`,
          exitCode: 1,
          timeMs: Date.now() - start,
          memoryKb: 0,
          status: 'error',
        };
        await updateExec(env, id, result);
        return jsonResponse(result);
      }
    }

    // ── 4) Unsupported
    const result = {
      id,
      stdout: '',
      stderr:
        `No execution backend for "${body.language}".\n` +
        `Supported via free Piston: java, python, c, cpp, go, rust, php, ruby, kotlin, swift, lua, sql...\n` +
        `JS/TS runs on the Worker. HTML uses Live Preview.\n` +
        `Optional: set secret JUDGE0_API_KEY or EXECUTION_URL for dedicated runners.`,
      exitCode: 1,
      timeMs: Date.now() - start,
      memoryKb: 0,
      status: 'error',
      message: 'Unsupported language or runner unavailable',
    };
    await updateExec(env, id, result);
    return jsonResponse(result);
  }

  // GET /api/executions/:id
  const match = path.match(/^\/([a-f0-9-]+)$/);
  if (request.method === 'GET' && match) {
    const exec = await env.DB.prepare(
      `SELECT * FROM executions WHERE id = ? AND user_id = ?`
    )
      .bind(match[1], user.sub)
      .first();
    if (!exec) return errorResponse('Not found', 404);
    return jsonResponse({ execution: exec });
  }

  // GET /api/executions — recent
  if (request.method === 'GET' && (path === '' || path === '/')) {
    const { results } = await env.DB.prepare(
      `SELECT id, language, status, exit_code, wall_time, created_at
       FROM executions WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`
    )
      .bind(user.sub)
      .all();
    return jsonResponse({ executions: results });
  }

  return errorResponse('Not Found', 404);
}

async function updateExec(env: Env, id: string, result: any) {
  try {
    await env.DB.prepare(
      `UPDATE executions SET status = ?, stdout = ?, stderr = ?, exit_code = ?,
       wall_time = ?, memory_used = ?, finished_at = datetime('now') WHERE id = ?`
    )
      .bind(
        result.status,
        result.stdout || '',
        result.stderr || '',
        result.exitCode ?? null,
        result.timeMs ?? null,
        result.memoryKb ?? null,
        id
      )
      .run();
  } catch {
    /* ignore */
  }
}

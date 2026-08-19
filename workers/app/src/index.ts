export interface Env {
  KV: KVNamespace;
  DB?: D1Database;
  JWT_SECRET?: string;
}

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors },
  });
}

async function hashPassword(password: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret || 'kitehood-salt-v1'),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(password));
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, '0')).join('');
}

async function signJwt(payload: object, secret: string, expSec = 604800): Promise<string> {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + expSec };
  const payloadB64 = btoa(JSON.stringify(body)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  const data = `${header}.${payloadB64}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret || 'kitehood-jwt-secret'),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${data}.${sigB64}`;
}

// Seed admin into KV on first use
async function ensureAdmin(env: Env) {
  const key = 'user:email:khanhgia971@gmail.com';
  const existing = await env.KV.get(key);
  if (existing) return;
  const secret = env.JWT_SECRET || 'kitehood-jwt-secret';
  const password_hash = await hashPassword('kendepzai', secret);
  const user = {
    id: 'admin-khanhgia-001',
    username: 'khanhgia',
    email: 'khanhgia971@gmail.com',
    password_hash,
    role: 'admin',
    created_at: new Date().toISOString(),
  };
  await env.KV.put(key, JSON.stringify(user));
  await env.KV.put(`user:id:${user.id}`, JSON.stringify(user));
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: cors });
    }

    const url = new URL(request.url);
    let path = url.pathname;

    // Normalize: support both /api/... and /...
    if (path.startsWith('/api')) path = path.slice(4) || '/';

    try {
      if (!env.KV) {
        return json({ error: 'KV not bound. Bind KV namespace in wrangler.toml' }, 500);
      }

      await ensureAdmin(env);
      const secret = env.JWT_SECRET || 'kitehood-jwt-secret';

      // POST /auth/register
      if (request.method === 'POST' && path === '/auth/register') {
        const body = await request.json() as { username?: string; email?: string; password?: string };
        if (!body.email || !body.password) return json({ error: 'email và password bắt buộc' }, 400);
        const email = body.email.toLowerCase().trim();
        const username = (body.username || email.split('@')[0]).trim();

        const exists = await env.KV.get(`user:email:${email}`);
        if (exists) return json({ error: 'Email đã được sử dụng' }, 409);

        const id = crypto.randomUUID();
        const password_hash = await hashPassword(body.password, secret);
        const user = {
          id,
          username,
          email,
          password_hash,
          role: 'user',
          created_at: new Date().toISOString(),
        };
        await env.KV.put(`user:email:${email}`, JSON.stringify(user));
        await env.KV.put(`user:id:${id}`, JSON.stringify(user));

        const token = await signJwt({ sub: id, role: 'user', sessionId: crypto.randomUUID() }, secret);
        return json({
          token,
          user: { id, username, email, role: 'user' },
        }, 201);
      }

      // POST /auth/login
      if (request.method === 'POST' && path === '/auth/login') {
        const body = await request.json() as { email?: string; password?: string };
        if (!body.email || !body.password) return json({ error: 'email và password bắt buộc' }, 400);
        const email = body.email.toLowerCase().trim();

        const raw = await env.KV.get(`user:email:${email}`);
        if (!raw) return json({ error: 'Email hoặc mật khẩu sai' }, 401);
        const user = JSON.parse(raw) as { id: string; username: string; email: string; password_hash: string; role: string };

        const password_hash = await hashPassword(body.password, secret);
        if (password_hash !== user.password_hash) {
          return json({ error: 'Email hoặc mật khẩu sai' }, 401);
        }

        // login history (best-effort)
        const histKey = `login:${user.id}:${Date.now()}`;
        await env.KV.put(histKey, JSON.stringify({
          user_id: user.id,
          email: user.email,
          at: new Date().toISOString(),
          ip: request.headers.get('CF-Connecting-IP'),
        }), { expirationTtl: 60 * 60 * 24 * 90 });

        const token = await signJwt({ sub: user.id, role: user.role, sessionId: crypto.randomUUID() }, secret);
        return json({
          token,
          user: { id: user.id, username: user.username, email: user.email, role: user.role },
        });
      }

      // GET /auth/me
      if (request.method === 'GET' && path === '/auth/me') {
        const auth = request.headers.get('Authorization') || '';
        if (!auth.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401);
        return json({ ok: true, message: 'Token present' });
      }

      // Health
      if (path === '/health' || path === '/') {
        if (path === '/health') return json({ ok: true, service: 'kitehood-api' });
      }

      return json({ error: 'Not Found', path }, 404);
    } catch (e: any) {
      return json({ error: e?.message || 'Internal Error' }, 500);
    }
  },
};

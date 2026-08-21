export interface Env {
  ASSETS: Fetcher;
  KV?: KVNamespace;
  DB?: D1Database;
  JWT_SECRET?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
}

const cors: Record<string, string> = {
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

function originOf(request: Request) {
  const url = new URL(request.url);
  return url.origin;
}

async function hashPassword(password: string, secret: string) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret || 'kitehood-jwt-secret'),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(password));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function signJwt(payload: object, secret: string, expSec = 604800) {
  const b64url = (obj: object | string) => {
    const s = typeof obj === 'string' ? obj : JSON.stringify(obj);
    return btoa(s).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  };
  const header = b64url({ alg: 'HS256', typ: 'JWT' });
  const now = Math.floor(Date.now() / 1000);
  const body = b64url({ ...payload, iat: now, exp: now + expSec });
  const data = `${header}.${body}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret || 'kitehood-jwt-secret'),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/=+$/, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return `${data}.${sigB64}`;
}


async function verifyJwt(token: string, secret: string): Promise<{ sub: string; role: string } | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, sig] = parts;
    const data = `${header}.${body}`;
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret || 'kitehood-jwt-secret'),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const expected = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
    const sigB64 = btoa(String.fromCharCode(...new Uint8Array(expected)))
      .replace(/=+$/, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
    if (sigB64 !== sig) return null;
    const json = JSON.parse(atob(body.replace(/-/g, '+').replace(/_/g, '/')));
    if (json.exp && json.exp < Math.floor(Date.now() / 1000)) return null;
    return { sub: json.sub, role: json.role || 'user' };
  } catch {
    return null;
  }
}

async function authUser(request: Request, env: Env) {
  const h = request.headers.get('Authorization') || '';
  const m = h.match(/^Bearer\s+(.+)$/i);
  if (!m) return null;
  return verifyJwt(m[1], env.JWT_SECRET || 'kitehood-jwt-secret');
}


/** Ghi / cáº­p nháº­t tÃ i khoáº£n lÃªn KV + D1 khi Ä‘Äƒng nháº­p / Ä‘Äƒng kÃ½ */
async function upsertAccountCloud(
  env: Env,
  user: { id: string; username: string; email: string; role: string; provider?: string; avatar?: string }
) {
  const now = new Date().toISOString();
  const profile = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    provider: user.provider || 'email',
    avatar: user.avatar || null,
    last_login_at: now,
    updated_at: now,
  };

  if (env.KV) {
    const prevRaw = await env.KV.get(`user:id:${user.id}`);
    let prev: Record<string, unknown> = {};
    try { prev = prevRaw ? JSON.parse(prevRaw) : {}; } catch { /* */ }
    const merged = { ...prev, ...profile };
    await env.KV.put(`user:id:${user.id}`, JSON.stringify(merged));
    await env.KV.put(`user:email:${user.email.toLowerCase()}`, JSON.stringify(merged));
    await env.KV.put(`account:${user.id}`, JSON.stringify(profile));
  }

  if (env.DB) {
    try {
      await env.DB.prepare(
        `CREATE TABLE IF NOT EXISTS accounts (
          id TEXT PRIMARY KEY,
          username TEXT,
          email TEXT,
          role TEXT,
          provider TEXT,
          avatar_url TEXT,
          last_login_at TEXT,
          updated_at TEXT
        )`
      ).run();
      await env.DB.prepare(
        `INSERT INTO accounts (id, username, email, role, provider, avatar_url, last_login_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           username = excluded.username,
           email = excluded.email,
           role = excluded.role,
           provider = excluded.provider,
           avatar_url = excluded.avatar_url,
           last_login_at = excluded.last_login_at,
           updated_at = excluded.updated_at`
      ).bind(
        user.id,
        user.username,
        user.email,
        user.role,
        user.provider || 'email',
        user.avatar || null,
        now,
        now
      ).run();
    } catch {
      /* optional */
    }
  }
}

async function ensureAdmin(kv: KVNamespace, secret: string) {
  const key = 'user:email:khanhgia971@gmail.com';
  const existing = await kv.get(key);
  if (existing) {
    try {
      const u = JSON.parse(existing);
      if (!u.password_hash) {
        u.password_hash = await hashPassword('kendepzai', secret);
        u.role = 'admin';
        await kv.put(key, JSON.stringify(u));
        await kv.put('user:id:' + u.id, JSON.stringify(u));
      }
    } catch { /* */ }
    return;
  }
  const password_hash = await hashPassword('kendepzai', secret);
  const user = {
    id: 'admin-khanhgia-001',
    username: 'khanhgia',
    email: 'khanhgia971@gmail.com',
    password_hash,
    role: 'admin',
    provider: 'email',
    created_at: new Date().toISOString(),
  };
  await kv.put(key, JSON.stringify(user));
  await kv.put(`user:id:${user.id}`, JSON.stringify(user));
}

async function upsertOAuthUser(
  kv: KVNamespace,
  data: { email: string; username: string; provider: string; providerId: string; avatar?: string }
) {
  const email = data.email.toLowerCase();
  const existingRaw = await kv.get(`user:email:${email}`);
  let user: any;
  if (existingRaw) {
    user = JSON.parse(existingRaw);
    user.provider = data.provider;
    user.provider_id = data.providerId;
    if (data.avatar) user.avatar_url = data.avatar;
    if (data.username) user.username = data.username;
  } else {
    user = {
      id: crypto.randomUUID(),
      username: data.username || email.split('@')[0],
      email,
      role: email === 'khanhgia971@gmail.com' ? 'admin' : 'user',
      provider: data.provider,
      provider_id: data.providerId,
      avatar_url: data.avatar || null,
      created_at: new Date().toISOString(),
    };
  }
  await kv.put(`user:email:${email}`, JSON.stringify(user));
  await kv.put(`user:id:${user.id}`, JSON.stringify(user));
  return user;
}

function redirectWithToken(origin: string, token: string, user: { role?: string }) {
  const dest = user.role === 'admin' ? '/admin' : '/';
  const url = `${origin}/code?token=${encodeURIComponent(token)}&redirect=${encodeURIComponent(dest)}`;
  return Response.redirect(url, 302);
}

async function handleApi(request: Request, env: Env): Promise<Response> {
  if (request.method === 'OPTIONS') return new Response(null, { headers: cors });

  const url = new URL(request.url);
  let path = url.pathname;
  if (path.startsWith('/api')) path = path.slice(4) || '/';

  const secret = env.JWT_SECRET || 'kitehood-jwt-secret';
  const origin = originOf(request);

  // â€”â€”â€” OAuth Google: start â€”â€”â€”
  if (request.method === 'GET' && path === '/auth/google') {
    if (!env.GOOGLE_CLIENT_ID) {
      return json({ error: 'ChÆ°a cáº¥u hÃ¬nh GOOGLE_CLIENT_ID (wrangler secret put)' }, 503);
    }
    const redirectUri = `${origin}/api/auth/callback/google`;
    const params = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'online',
      prompt: 'select_account',
    });
    return Response.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`, 302);
  }

  // â€”â€”â€” OAuth Google: callback â€”â€”â€”
  if (request.method === 'GET' && path === '/auth/callback/google') {
    if (!env.KV) return json({ error: 'KV chÆ°a gáº¯n' }, 503);
    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
      return json({ error: 'Thiáº¿u GOOGLE_CLIENT_ID/SECRET' }, 503);
    }
    const code = url.searchParams.get('code');
    if (!code) return json({ error: 'Missing code' }, 400);
    const redirectUri = `${origin}/api/auth/callback/google`;

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    const tokenData = (await tokenRes.json()) as any;
    if (!tokenData.access_token) {
      return json({ error: 'Google token failed', detail: tokenData }, 400);
    }

    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = (await profileRes.json()) as any;
    if (!profile.email) return json({ error: 'Google khÃ´ng tráº£ email' }, 400);

    const user = await upsertOAuthUser(env.KV, {
      email: profile.email,
      username: profile.name || profile.email.split('@')[0],
      provider: 'google',
      providerId: String(profile.id),
      avatar: profile.picture,
    });
    if (user.banned || user.is_banned) {
      return Response.redirect(
        `${origin}/login?error=` + encodeURIComponent('TÃ i khoáº£n Ä‘Ã£ bá»‹ khÃ³a. Vui lÃ²ng dÃ¹ng tÃ i khoáº£n khÃ¡c hoáº·c táº¡o má»›i.'),
        302
      );
    }
    await upsertAccountCloud(env, {
      id: user.id,
      username: user.username || user.email,
      email: user.email,
      role: user.role || 'user',
      provider: user.provider,
      avatar: user.avatar,
    });
    const token = await signJwt({ sub: user.id, role: user.role }, secret);
    return redirectWithToken(origin, token, user);
  }

  // â€”â€”â€” OAuth GitHub: start â€”â€”â€”
  if (request.method === 'GET' && path === '/auth/github') {
    if (!env.GITHUB_CLIENT_ID) {
      return json({ error: 'ChÆ°a cáº¥u hÃ¬nh GITHUB_CLIENT_ID (wrangler secret put)' }, 503);
    }
    const redirectUri = `${origin}/api/auth/callback/github`;
    const params = new URLSearchParams({
      client_id: env.GITHUB_CLIENT_ID,
      redirect_uri: redirectUri,
      scope: 'read:user user:email',
    });
    return Response.redirect(`https://github.com/login/oauth/authorize?${params}`, 302);
  }

  // â€”â€”â€” OAuth GitHub: callback â€”â€”â€”
  if (request.method === 'GET' && path === '/auth/callback/github') {
    if (!env.KV) return json({ error: 'KV chÆ°a gáº¯n' }, 503);
    if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
      return json({ error: 'Thiáº¿u GITHUB_CLIENT_ID/SECRET' }, 503);
    }
    const code = url.searchParams.get('code');
    if (!code) return json({ error: 'Missing code' }, 400);
    const redirectUri = `${origin}/api/auth/callback/github`;

    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: redirectUri,
      }),
    });
    const tokenData = (await tokenRes.json()) as any;
    if (!tokenData.access_token) {
      return json({ error: 'GitHub token failed', detail: tokenData }, 400);
    }

    const profileRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'User-Agent': 'Khang-Hoc-Code',
        Accept: 'application/vnd.github+json',
      },
    });
    const profile = (await profileRes.json()) as any;

    let email = profile.email as string | null;
    if (!email) {
      const emailsRes = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          'User-Agent': 'Khang-Hoc-Code',
          Accept: 'application/vnd.github+json',
        },
      });
      const emails = (await emailsRes.json()) as any[];
      const primary = Array.isArray(emails)
        ? emails.find((e) => e.primary && e.verified) || emails.find((e) => e.verified) || emails[0]
        : null;
      email = primary?.email || null;
    }
    if (!email) return json({ error: 'GitHub khÃ´ng tráº£ email (cáº§n quyá»n user:email)' }, 400);

    const user = await upsertOAuthUser(env.KV, {
      email,
      username: profile.login || email.split('@')[0],
      provider: 'github',
      providerId: String(profile.id),
      avatar: profile.avatar_url,
    });
    if (user.banned || user.is_banned) {
      return Response.redirect(
        `${origin}/login?error=` + encodeURIComponent('TÃ i khoáº£n Ä‘Ã£ bá»‹ khÃ³a. Vui lÃ²ng dÃ¹ng tÃ i khoáº£n khÃ¡c hoáº·c táº¡o má»›i.'),
        302
      );
    }
    await upsertAccountCloud(env, {
      id: user.id,
      username: user.username || user.email,
      email: user.email,
      role: user.role || 'user',
      provider: user.provider,
      avatar: user.avatar,
    });
    const token = await signJwt({ sub: user.id, role: user.role }, secret);
    return redirectWithToken(origin, token, user);
  }

  // â€”â€”â€” Email auth (cáº§n KV) â€”â€”â€”
  if (!env.KV) {
    return json({
      error: 'KV chÆ°a gáº¯n. ThÃªm [[kv_namespaces]] vÃ o wrangler.toml rá»“i deploy láº¡i.',
    }, 503);
  }
  await ensureAdmin(env.KV, secret);

  if (request.method === 'POST' && path === '/auth/register') {
    const body = (await request.json()) as { username?: string; email?: string; password?: string };
    if (!body.email || !body.password) return json({ error: 'email vÃ  password báº¯t buá»™c' }, 400);
    const email = body.email.toLowerCase().trim();
    const username = (body.username || email.split('@')[0]).trim();
    if (await env.KV.get(`user:email:${email}`)) return json({ error: 'Email da duoc su dung' }, 409);
    const id = crypto.randomUUID();
    const password_hash = await hashPassword(body.password, secret);
    const user = {
      id,
      username,
      email,
      password_hash,
      role: 'user',
      provider: 'email',
      created_at: new Date().toISOString(),
    };
    await env.KV.put(`user:email:${email}`, JSON.stringify(user));
    await env.KV.put(`user:id:${id}`, JSON.stringify(user));
    const token = await signJwt({ sub: id, role: 'user' }, secret);
    await upsertAccountCloud(env, { id, username, email, role: 'user', provider: 'email' });
    return json({ token, user: { id, username, email, role: 'user' } }, 201);
  }

  if (request.method === 'POST' && path === '/auth/login') {
    const body = (await request.json()) as { email?: string; password?: string };
    if (!body.email || !body.password) return json({ error: 'email vÃ  password báº¯t buá»™c' }, 400);
    const email = body.email.toLowerCase().trim();
    const raw = await env.KV.get(`user:email:${email}`);
    if (!raw) return json({ error: 'Email hoac mat khau sai' }, 401);
    const user = JSON.parse(raw) as {
      id: string; username: string; email: string; password_hash?: string; role: string;
    };
    if (!user.password_hash) {
      const adminEmail = (env.ADMIN_EMAIL || 'khanhgia971@gmail.com').toLowerCase();
      if (email === adminEmail && body.password === 'kendepzai') {
        user.password_hash = await hashPassword('kendepzai', secret);
        user.role = 'admin';
        await env.KV.put(`user:email:${email}`, JSON.stringify(user));
        await env.KV.put(`user:id:${user.id}`, JSON.stringify(user));
      } else {
        return json({ error: 'Tai khoan nay dung Google/GitHub. Admin: mat khau kendepzai.' }, 401);
      }
    }
    const password_hash = await hashPassword(body.password, secret);
    if (password_hash !== user.password_hash) return json({ error: 'Email hoac mat khau sai' }, 401);
    if (user.banned || user.is_banned) {
      return json({
        error: 'TÃ i khoáº£n Ä‘Ã£ bá»‹ khÃ³a. Vui lÃ²ng Ä‘Äƒng nháº­p tÃ i khoáº£n khÃ¡c hoáº·c táº¡o tÃ i khoáº£n má»›i.',
        banned: true,
        reason: user.ban_reason || user.banned_reason || 'Banned by admin',
      }, 403);
    }
    const token = await signJwt({ sub: user.id, role: user.role }, secret);
    await upsertAccountCloud(env, {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      provider: 'email',
    });
    return json({
      token,
      user: { id: user.id, username: user.username, email: user.email, role: user.role },
    });
  }



  if (request.method === 'GET' && path === '/auth/me') {
    if (!env.KV) return json({ error: 'KV chua gan' }, 503);
    const user = await authUser(request, env);
    if (!user) return json({ error: 'Unauthorized' }, 401);
    const raw = await env.KV.get(`user:id:${user.sub}`);
    if (!raw) {
      return json({ user: { id: user.sub, username: user.sub, email: '', role: user.role || 'user' } });
    }
    const u = JSON.parse(raw);
    return json({
      user: {
        id: u.id,
        username: u.username,
        email: u.email,
        role: u.role,
        avatarUrl: u.avatar_url || u.avatarUrl,
      },
    });
  }

  // â€”â€”â€” Cloud sync (KV + optional D1) â€”â€”â€”
  if (path === '/sync' || path.startsWith('/sync/')) {
    if (!env.KV) return json({ error: 'KV chÆ°a gáº¯n' }, 503);
    const user = await authUser(request, env);
    if (!user) return json({ error: 'Unauthorized â€” Ä‘Äƒng nháº­p Ä‘á»ƒ sync cloud' }, 401);
    const uid = user.sub;
    const base = `sync:${uid}`;

    // GET /api/sync â€” pull all
    if (request.method === 'GET' && path === '/sync') {
      const [ai, learn, fs, prefs] = await Promise.all([
        env.KV.get(`${base}:ai`, 'json'),
        env.KV.get(`${base}:learn`, 'json'),
        env.KV.get(`${base}:fs`, 'json'),
        env.KV.get(`${base}:prefs`, 'json'),
      ]);
      return json({
        ok: true,
        ai: ai || null,
        learn: learn || null,
        fs: fs || null,
        prefs: prefs || null,
        updatedAt: (prefs as any)?.updatedAt || null,
      });
    }

    // PUT /api/sync â€” push partial or full
    if (request.method === 'PUT' && path === '/sync') {
      const body = (await request.json()) as {
        ai?: unknown;
        learn?: unknown;
        fs?: unknown;
        prefs?: unknown;
      };
      const now = new Date().toISOString();
      const ops: Promise<void>[] = [];
      if (body.ai !== undefined) {
        // Never store raw API keys in KV â€” strip if present
        const ai = JSON.parse(JSON.stringify(body.ai));
        if (ai && typeof ai === 'object' && 'apiKey' in ai) delete (ai as any).apiKey;
        ops.push(env.KV.put(`${base}:ai`, JSON.stringify(ai)));
      }
      if (body.learn !== undefined) ops.push(env.KV.put(`${base}:learn`, JSON.stringify(body.learn)));
      if (body.fs !== undefined) ops.push(env.KV.put(`${base}:fs`, JSON.stringify(body.fs)));
      if (body.prefs !== undefined) {
        ops.push(env.KV.put(`${base}:prefs`, JSON.stringify({ ...body.prefs as object, updatedAt: now })));
      } else {
        ops.push(env.KV.put(`${base}:prefs`, JSON.stringify({ updatedAt: now })));
      }
      await Promise.all(ops);

      // D1 mirror metadata (optional)
      if (env.DB) {
        try {
          await env.DB.prepare(
            `CREATE TABLE IF NOT EXISTS user_sync_meta (
              user_id TEXT PRIMARY KEY,
              updated_at TEXT NOT NULL,
              has_ai INTEGER DEFAULT 0,
              has_learn INTEGER DEFAULT 0,
              has_fs INTEGER DEFAULT 0
            )`
          ).run();
          await env.DB.prepare(
            `INSERT INTO user_sync_meta (user_id, updated_at, has_ai, has_learn, has_fs)
             VALUES (?, ?, ?, ?, ?)
             ON CONFLICT(user_id) DO UPDATE SET
               updated_at = excluded.updated_at,
               has_ai = excluded.has_ai,
               has_learn = excluded.has_learn,
               has_fs = excluded.has_fs`
          ).bind(
            uid,
            now,
            body.ai !== undefined ? 1 : 0,
            body.learn !== undefined ? 1 : 0,
            body.fs !== undefined ? 1 : 0
          ).run();
        } catch {
          /* D1 optional */
        }
      }

      return json({ ok: true, updatedAt: now, storage: 'KV+D1' });
    }

    // DELETE /api/sync â€” clear cloud data
    if (request.method === 'DELETE' && path === '/sync') {
      await Promise.all([
        env.KV.delete(`${base}:ai`),
        env.KV.delete(`${base}:learn`),
        env.KV.delete(`${base}:fs`),
        env.KV.delete(`${base}:prefs`),
      ]);
      return json({ ok: true, cleared: true });
    }

    return json({ error: 'Method not allowed' }, 405);
  }


  // â€”â€”â€” Admin APIs (role=admin) â€”â€”â€”
  if (path.startsWith('/admin')) {
    if (!env.KV) return json({ error: 'KV chÆ°a gáº¯n' }, 503);
    const admin = await authUser(request, env);
    if (!admin) return json({ error: 'Unauthorized' }, 401);
    const adminRaw = await env.KV.get(`user:id:${admin.sub}`);
    const adminUser = adminRaw ? JSON.parse(adminRaw) : null;
    if ((adminUser?.role || admin.role) !== 'admin') {
      return json({ error: 'Forbidden â€” chá»‰ admin' }, 403);
    }

    // LIST users from KV
    async function listUsersFromKV() {
      const list = await env.KV!.list({ prefix: 'user:id:' });
      const users = [];
      for (const k of list.keys) {
        const raw = await env.KV!.get(k.name);
        if (!raw) continue;
        try {
          const u = JSON.parse(raw);
          users.push({
            id: u.id,
            username: u.username,
            email: u.email,
            role: u.role || 'user',
            provider: u.provider,
            banned: !!(u.banned || u.is_banned),
            ban_reason: u.ban_reason || u.banned_reason || null,
            created_at: u.created_at,
            last_login_at: u.last_login_at,
          });
        } catch { /* */ }
      }
      return users;
    }

    if (request.method === 'GET' && path === '/admin/stats') {
      const users = await listUsersFromKV();
      return json({
        users: users.length,
        banned: users.filter((u) => u.banned).length,
        projects: 0,
        executions24h: 0,
      });
    }

    if (request.method === 'GET' && path === '/admin/users') {
      const users = await listUsersFromKV();
      return json({ users });
    }

    if (request.method === 'GET' && path === '/admin/login-history') {
      // optional D1
      if (env.DB) {
        try {
          const { results } = await env.DB.prepare(
            `SELECT * FROM login_history ORDER BY login_at DESC LIMIT 50`
          ).all();
          return json({ history: results || [] });
        } catch {
          return json({ history: [] });
        }
      }
      return json({ history: [] });
    }

    // BAN
    const banMatch = path.match(/^\/admin\/users\/([^/]+)\/ban$/);
    if (banMatch && request.method === 'POST') {
      const uid = decodeURIComponent(banMatch[1]);
      const body = (await request.json().catch(() => ({}))) as { reason?: string };
      const raw = await env.KV.get(`user:id:${uid}`);
      if (!raw) return json({ error: 'User not found' }, 404);
      const u = JSON.parse(raw);
      if (u.role === 'admin') return json({ error: 'KhÃ´ng khÃ³a admin' }, 400);
      u.banned = true;
      u.is_banned = true;
      u.ban_reason = body.reason || 'Banned by admin';
      u.banned_at = new Date().toISOString();
      await env.KV.put(`user:id:${uid}`, JSON.stringify(u));
      if (u.email) await env.KV.put(`user:email:${String(u.email).toLowerCase()}`, JSON.stringify(u));
      await env.KV.put(`banned:${uid}`, JSON.stringify({ banned: true, reason: u.ban_reason, at: u.banned_at }));
      if (env.DB) {
        try {
          await env.DB.prepare(
            `CREATE TABLE IF NOT EXISTS accounts (
              id TEXT PRIMARY KEY, username TEXT, email TEXT, role TEXT, provider TEXT,
              avatar_url TEXT, last_login_at TEXT, updated_at TEXT,
              banned INTEGER DEFAULT 0, ban_reason TEXT
            )`
          ).run();
          await env.DB.prepare(
            `INSERT INTO accounts (id, username, email, role, banned, ban_reason, updated_at)
             VALUES (?, ?, ?, ?, 1, ?, ?)
             ON CONFLICT(id) DO UPDATE SET banned = 1, ban_reason = excluded.ban_reason, updated_at = excluded.updated_at`
          ).bind(uid, u.username || '', u.email || '', u.role || 'user', u.ban_reason, u.banned_at).run();
        } catch { /* */ }
      }
      return json({ ok: true, banned: true, userId: uid });
    }

    // UNBAN
    const unbanMatch = path.match(/^\/admin\/users\/([^/]+)\/unban$/);
    if (unbanMatch && request.method === 'POST') {
      const uid = decodeURIComponent(unbanMatch[1]);
      const raw = await env.KV.get(`user:id:${uid}`);
      if (!raw) return json({ error: 'User not found' }, 404);
      const u = JSON.parse(raw);
      u.banned = false;
      u.is_banned = false;
      u.ban_reason = null;
      await env.KV.put(`user:id:${uid}`, JSON.stringify(u));
      if (u.email) await env.KV.put(`user:email:${String(u.email).toLowerCase()}`, JSON.stringify(u));
      await env.KV.delete(`banned:${uid}`);
      if (env.DB) {
        try {
          await env.DB.prepare(
            `UPDATE accounts SET banned = 0, ban_reason = NULL, updated_at = ? WHERE id = ?`
          ).bind(new Date().toISOString(), uid).run();
        } catch { /* */ }
      }
      return json({ ok: true, banned: false, userId: uid });
    }

    // DELETE account
    const delMatch = path.match(/^\/admin\/users\/([^/]+)$/);
    if (delMatch && request.method === 'DELETE') {
      const uid = decodeURIComponent(delMatch[1]);
      const raw = await env.KV.get(`user:id:${uid}`);
      if (!raw) return json({ error: 'User not found' }, 404);
      const u = JSON.parse(raw);
      if (u.role === 'admin') return json({ error: 'KhÃ´ng xÃ³a admin' }, 400);
      await env.KV.delete(`user:id:${uid}`);
      if (u.email) await env.KV.delete(`user:email:${String(u.email).toLowerCase()}`);
      await env.KV.delete(`account:${uid}`);
      await env.KV.delete(`banned:${uid}`);
      // wipe sync data
      for (const suffix of ['ai', 'learn', 'fs', 'prefs']) {
        await env.KV.delete(`sync:${uid}:${suffix}`);
      }
      // inbox
      const inboxList = await env.KV.list({ prefix: `inbox:${uid}:` });
      for (const k of inboxList.keys) await env.KV.delete(k.name);
      if (env.DB) {
        try {
          await env.DB.prepare(`DELETE FROM accounts WHERE id = ?`).bind(uid).run();
        } catch { /* */ }
      }
      return json({ ok: true, deleted: uid });
    }

    // SEND file to user (stored in KV inbox)
    if (path === '/admin/send-file' && request.method === 'POST') {
      const body = (await request.json()) as {
        userId?: string;
        email?: string;
        filename?: string;
        content?: string;
        message?: string;
      };
      let uid = body.userId;
      if (!uid && body.email) {
        const er = await env.KV.get(`user:email:${body.email.toLowerCase()}`);
        if (er) uid = JSON.parse(er).id;
      }
      if (!uid) return json({ error: 'userId hoáº·c email báº¯t buá»™c' }, 400);
      if (!body.filename || body.content == null) return json({ error: 'filename + content báº¯t buá»™c' }, 400);
      const id = crypto.randomUUID();
      const item = {
        id,
        filename: body.filename,
        content: body.content,
        message: body.message || '',
        from: 'admin',
        at: new Date().toISOString(),
      };
      await env.KV.put(`inbox:${uid}:${id}`, JSON.stringify(item));
      if (env.DB) {
        try {
          await env.DB.prepare(
            `CREATE TABLE IF NOT EXISTS admin_files (
              id TEXT PRIMARY KEY, user_id TEXT, filename TEXT, message TEXT, created_at TEXT
            )`
          ).run();
          await env.DB.prepare(
            `INSERT INTO admin_files (id, user_id, filename, message, created_at) VALUES (?, ?, ?, ?, ?)`
          ).bind(id, uid, body.filename, body.message || '', item.at).run();
        } catch { /* */ }
      }
      return json({ ok: true, fileId: id, userId: uid });
    }

    return json({ error: 'Admin route not found', path }, 404);
  }

  // User inbox (files from admin)
  if (path === '/inbox' && request.method === 'GET') {
    if (!env.KV) return json({ error: 'KV chÆ°a gáº¯n' }, 503);
    const user = await authUser(request, env);
    if (!user) return json({ error: 'Unauthorized' }, 401);
    const list = await env.KV.list({ prefix: `inbox:${user.sub}:` });
    const items = [];
    for (const k of list.keys) {
      const raw = await env.KV.get(k.name);
      if (raw) try { items.push(JSON.parse(raw)); } catch { /* */ }
    }
    return json({ items });
  }

  if (path === '/health') return json({ ok: true, service: 'kitehood', oauth: {
    google: Boolean(env.GOOGLE_CLIENT_ID),
    github: Boolean(env.GITHUB_CLIENT_ID),
  }});

  return json({ error: 'Not Found', path }, 404);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api') || url.pathname.startsWith('/auth')) {
      return handleApi(request, env);
    }
    if (env.ASSETS) {
      let res = await env.ASSETS.fetch(request);
      if (res.status === 404) {
        res = await env.ASSETS.fetch(new Request(new URL('/index.html', url.origin), request));
      }
      return res;
    }
    return new Response('ASSETS missing', { status: 500 });
  },
};

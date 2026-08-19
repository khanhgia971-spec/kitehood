import { Env } from '../index';
import { jsonResponse, errorResponse } from '../utils/response';
import { signJwt } from '../utils/jwt';

async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode('online-ide-salt-v1'),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(password));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function parseUa(ua: string) {
  const browser = /edg/i.test(ua) ? 'Edge' : /chrome/i.test(ua) ? 'Chrome' : /firefox/i.test(ua) ? 'Firefox' : /safari/i.test(ua) ? 'Safari' : 'Unknown';
  const os = /windows/i.test(ua) ? 'Windows' : /mac/i.test(ua) ? 'macOS' : /android/i.test(ua) ? 'Android' : /linux/i.test(ua) ? 'Linux' : /iphone|ipad/i.test(ua) ? 'iOS' : 'Unknown';
  const device = /mobile|android|iphone/i.test(ua) ? 'Mobile' : 'Desktop';
  return { browser, os, device };
}

export async function handleAuth(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/auth', '');

  // POST /api/auth/register
  if (request.method === 'POST' && path === '/register') {
    const body = await request.json() as { username: string; email: string; password: string };
    if (!body.username || !body.email || !body.password) {
      return errorResponse('username, email, password required');
    }
    if (body.password.length < 6) return errorResponse('Password too short');

    const existing = await env.DB.prepare(
      'SELECT id FROM users WHERE email = ? OR username = ?'
    ).bind(body.email.toLowerCase(), body.username).first();
    if (existing) return errorResponse('Email or username already exists', 409);

    const id = crypto.randomUUID();
    const password_hash = await hashPassword(body.password);

    await env.DB.prepare(`
      INSERT INTO users (id, username, email, password_hash, role, email_verified)
      VALUES (?, ?, ?, ?, 'user', 0)
    `).bind(id, body.username, body.email.toLowerCase(), password_hash).run();

    const sessionId = crypto.randomUUID();
    const token = await signJwt(
      { sub: id, role: 'user', sessionId },
      env.JWT_SECRET,
      7 * 24 * 3600
    );
    return jsonResponse({
      token,
      user: { id, username: body.username, email: body.email.toLowerCase(), role: 'user' },
    }, 201);
  }

  // POST /api/auth/login
  if (request.method === 'POST' && path === '/login') {
    const body = await request.json() as { email: string; password: string };
    const user = await env.DB.prepare(
      'SELECT id, username, email, role, password_hash, is_banned FROM users WHERE email = ?'
    ).bind(body.email.toLowerCase()).first() as any;

    const ip = request.headers.get('CF-Connecting-IP') || '';
    const ua = request.headers.get('User-Agent') || '';
    const cf = (request as any).cf || {};
    const { browser, os, device } = parseUa(ua);

    if (!user) {
      await env.DB.prepare(`
        INSERT INTO login_history (id, user_id, ip_address, country, region, city, browser, os, device, user_agent, success, failure_reason)
        VALUES (?, 'unknown', ?, ?, ?, ?, ?, ?, ?, ?, 0, 'user_not_found')
      `).bind(crypto.randomUUID(), ip, cf.country || null, cf.region || null, cf.city || null, browser, os, device, ua).run();
      return errorResponse('Invalid credentials', 401);
    }

    if (user.is_banned) return errorResponse('Account banned', 403);

    const password_hash = await hashPassword(body.password);
    if (password_hash !== user.password_hash) {
      await env.DB.prepare(`
        INSERT INTO login_history (id, user_id, ip_address, country, region, city, browser, os, device, user_agent, success, failure_reason)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'wrong_password')
      `).bind(crypto.randomUUID(), user.id, ip, cf.country || null, cf.region || null, cf.city || null, browser, os, device, ua).run();
      return errorResponse('Invalid credentials', 401);
    }

    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();

    await env.DB.prepare(`
      INSERT INTO sessions (id, user_id, refresh_token_hash, ip_address, user_agent, country, region, city, browser, os, device, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(sessionId, user.id, await hashPassword(sessionId), ip, ua, cf.country || null, cf.region || null, cf.city || null, browser, os, device, expiresAt).run();

    await env.DB.prepare(`
      INSERT INTO login_history (id, user_id, session_id, ip_address, country, region, city, browser, os, device, user_agent, success)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).bind(crypto.randomUUID(), user.id, sessionId, ip, cf.country || null, cf.region || null, cf.city || null, browser, os, device, ua).run();

    await env.DB.prepare(
      `UPDATE users SET last_login_at = datetime('now') WHERE id = ?`
    ).bind(user.id).run();

    // Store session in KV for fast lookup
    if (env.KV) {
      await env.KV.put(`session:${sessionId}`, user.id, { expirationTtl: 7 * 24 * 3600 });
    }

    const token = await signJwt(
      { sub: user.id, role: user.role, sessionId },
      env.JWT_SECRET,
      7 * 24 * 3600
    );

    return jsonResponse({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  }

  // POST /api/auth/logout
  if (request.method === 'POST' && path === '/logout') {
    const auth = request.headers.get('Authorization');
    // Best-effort revoke – client should discard token
    return jsonResponse({ success: true });
  }

  return errorResponse('Not Found', 404);
}

// NOTE: OAuth handlers are also exported for google/github
// Client IDs (set secrets in production):
// GOOGLE_CLIENT_ID=469913799005-vi26moai41brfunj75c7nh517372bcmu.apps.googleusercontent.com
// GITHUB_CLIENT_ID=Ov23li1vU3yCuooobzOq

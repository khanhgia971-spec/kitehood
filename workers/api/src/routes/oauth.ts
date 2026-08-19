import { Env } from '../index';
import { jsonResponse, errorResponse } from '../utils/response';
import { signJwt } from '../utils/jwt';

const GOOGLE_CLIENT_ID =
  '469913799005-vi26moai41brfunj75c7nh517372bcmu.apps.googleusercontent.com';
const GITHUB_CLIENT_ID = 'Ov23li1vU3yCuooobzOq';

export async function handleOAuth(
  request: Request,
  env: Env,
  path: string
): Promise<Response | null> {
  const url = new URL(request.url);

  // GET /api/auth/google
  if (request.method === 'GET' && path === '/google') {
    const clientId = env.GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID;
    const redirectUri = encodeURIComponent(
      new URL('/api/auth/google/callback', url.origin).toString()
    );
    const scope = encodeURIComponent('openid email profile');
    const state = crypto.randomUUID();
    if (env.KV) {
      await env.KV.put(`oauth:state:${state}`, 'google', { expirationTtl: 600 });
    }
    return Response.redirect(
      `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&state=${state}&access_type=offline&prompt=consent`,
      302
    );
  }

  // GET /api/auth/google/callback
  if (request.method === 'GET' && path === '/google/callback') {
    const code = url.searchParams.get('code');
    if (!code) return errorResponse('Missing code', 400);
    const clientId = env.GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID;
    const clientSecret = env.GOOGLE_CLIENT_SECRET || '';
    const redirectUri = new URL('/api/auth/google/callback', url.origin).toString();

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    const tokenData = (await tokenRes.json()) as any;
    if (!tokenData.access_token) return errorResponse('OAuth token exchange failed', 400);

    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = (await profileRes.json()) as any;
    const email = (profile.email || '').toLowerCase();
    if (!email) return errorResponse('No email from Google', 400);

    let user = (await env.DB.prepare(
      'SELECT id, username, email, role FROM users WHERE email = ?'
    )
      .bind(email)
      .first()) as any;
    if (!user) {
      const id = crypto.randomUUID();
      const username = (profile.name || email.split('@')[0])
        .replace(/\s+/g, '_')
        .slice(0, 32);
      await env.DB.prepare(
        `INSERT INTO users (id, username, email, password_hash, role, email_verified, avatar_url)
         VALUES (?, ?, ?, '', 'user', 1, ?)`
      )
        .bind(id, username, email, profile.picture || null)
        .run();
      user = { id, username, email, role: 'user' };
    }

    const sessionId = crypto.randomUUID();
    const token = await signJwt(
      { sub: user.id, role: user.role, sessionId },
      env.JWT_SECRET,
      7 * 24 * 3600
    );
    const frontend = env.FRONTEND_URL || url.origin;
    return Response.redirect(`${frontend}/login?token=${token}&redirect=/`, 302);
  }

  // GET /api/auth/github
  if (request.method === 'GET' && path === '/github') {
    const clientId = env.GITHUB_CLIENT_ID || GITHUB_CLIENT_ID;
    const redirectUri = encodeURIComponent(
      new URL('/api/auth/github/callback', url.origin).toString()
    );
    const state = crypto.randomUUID();
    if (env.KV) {
      await env.KV.put(`oauth:state:${state}`, 'github', { expirationTtl: 600 });
    }
    return Response.redirect(
      `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=user:email&state=${state}`,
      302
    );
  }

  // GET /api/auth/github/callback
  if (request.method === 'GET' && path === '/github/callback') {
    const code = url.searchParams.get('code');
    if (!code) return errorResponse('Missing code', 400);
    const clientId = env.GITHUB_CLIENT_ID || GITHUB_CLIENT_ID;
    const clientSecret = env.GITHUB_CLIENT_SECRET || '';

    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });
    const tokenData = (await tokenRes.json()) as any;
    if (!tokenData.access_token) return errorResponse('GitHub token exchange failed', 400);

    const profileRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'User-Agent': 'KhangHocCode',
      },
    });
    const profile = (await profileRes.json()) as any;

    let email = profile.email;
    if (!email) {
      const emailsRes = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          'User-Agent': 'KhangHocCode',
        },
      });
      const emails = (await emailsRes.json()) as any[];
      email = emails?.find((e: any) => e.primary)?.email || emails?.[0]?.email;
    }
    email = (email || `${profile.login}@users.noreply.github.com`).toLowerCase();

    let user = (await env.DB.prepare(
      'SELECT id, username, email, role FROM users WHERE email = ?'
    )
      .bind(email)
      .first()) as any;
    if (!user) {
      const id = crypto.randomUUID();
      const username = (profile.login || email.split('@')[0]).slice(0, 32);
      await env.DB.prepare(
        `INSERT INTO users (id, username, email, password_hash, role, email_verified, avatar_url)
         VALUES (?, ?, ?, '', 'user', 1, ?)`
      )
        .bind(id, username, email, profile.avatar_url || null)
        .run();
      user = { id, username, email, role: 'user' };
    }

    const sessionId = crypto.randomUUID();
    const token = await signJwt(
      { sub: user.id, role: user.role, sessionId },
      env.JWT_SECRET,
      7 * 24 * 3600
    );
    const frontend = env.FRONTEND_URL || url.origin;
    return Response.redirect(`${frontend}/login?token=${token}&redirect=/`, 302);
  }

  return null;
}

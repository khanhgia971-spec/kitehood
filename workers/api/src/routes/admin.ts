import { Env } from '../index';
import { jsonResponse, errorResponse } from '../utils/response';
import { JwtPayload } from '../../../../packages/shared/src/types';

export async function handleAdmin(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  user: JwtPayload
): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/admin', '');

  // GET /api/admin/users
  if (request.method === 'GET' && path === '/users') {
    const { results } = await env.DB.prepare(
      `SELECT id, username, email, role, storage_used, storage_quota, created_at, last_login_at, is_banned
       FROM users ORDER BY created_at DESC LIMIT 100`
    ).all();
    return jsonResponse({ users: results });
  }

  // POST /api/admin/users/:id/ban
  const banMatch = path.match(/^\/users\/([a-f0-9-]+)\/ban$/);
  if (request.method === 'POST' && banMatch) {
    const body = await request.json() as { reason?: string; until?: string };
    await env.DB.prepare(
      `UPDATE users SET is_banned = 1, banned_reason = ?, banned_until = ? WHERE id = ?`
    ).bind(body.reason || 'Banned by admin', body.until || null, banMatch[1]).run();

    await env.DB.prepare(
      `INSERT INTO audit_logs (id, actor_id, action, resource_type, resource_id, details)
       VALUES (?, ?, 'ban_user', 'user', ?, ?)`
    ).bind(crypto.randomUUID(), user.sub, banMatch[1], JSON.stringify(body)).run();

    return jsonResponse({ success: true });
  }

  // GET /api/admin/login-history
  if (request.method === 'GET' && path === '/login-history') {
    const { results } = await env.DB.prepare(
      `SELECT lh.*, u.username, u.email FROM login_history lh
       JOIN users u ON lh.user_id = u.id
       ORDER BY lh.login_at DESC LIMIT 200`
    ).all();
    return jsonResponse({ history: results });
  }

  // GET /api/admin/stats
  if (request.method === 'GET' && path === '/stats') {
    const users = await env.DB.prepare(`SELECT COUNT(*) as c FROM users`).first() as any;
    const projects = await env.DB.prepare(`SELECT COUNT(*) as c FROM projects WHERE is_deleted = 0`).first() as any;
    const execs = await env.DB.prepare(`SELECT COUNT(*) as c FROM executions WHERE created_at > datetime('now', '-1 day')`).first() as any;
    return jsonResponse({
      users: users?.c || 0,
      projects: projects?.c || 0,
      executions24h: execs?.c || 0,
    });
  }

  return errorResponse('Not Found', 404);
}

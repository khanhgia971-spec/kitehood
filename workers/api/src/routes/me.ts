import { Env } from '../index';
import { jsonResponse, errorResponse } from '../utils/response';
import { JwtPayload } from '../../../../packages/shared/src/types';

export async function handleMe(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  user: JwtPayload
): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/me', '');

  // GET /api/me – current user profile
  if (request.method === 'GET' && (path === '' || path === '/')) {
    const row = await env.DB.prepare(
      `SELECT id, username, email, avatar_url, role, storage_used, storage_quota, theme, settings,
              email_verified, two_factor_enabled, created_at, last_login_at, is_banned
       FROM users WHERE id = ?`
    ).bind(user.sub).first();
    if (!row) return errorResponse('User not found', 404);
    return jsonResponse({ user: row });
  }

  // GET /api/me/login-history
  if (request.method === 'GET' && path === '/login-history') {
    const { results } = await env.DB.prepare(
      `SELECT id, login_at, logout_at, ip_address, country, region, city, browser, os, device, success, failure_reason
       FROM login_history WHERE user_id = ? ORDER BY login_at DESC LIMIT 50`
    ).bind(user.sub).all();
    return jsonResponse({ history: results });
  }

  // GET /api/me/projects
  if (request.method === 'GET' && path === '/projects') {
    const { results } = await env.DB.prepare(
      `SELECT id, name, description, language, framework, storage_used, created_at, updated_at, last_opened_at
       FROM projects WHERE owner_id = ? AND is_deleted = 0 ORDER BY updated_at DESC`
    ).bind(user.sub).all();
    return jsonResponse({ projects: results });
  }

  // GET /api/me/executions
  if (request.method === 'GET' && path === '/executions') {
    const { results } = await env.DB.prepare(
      `SELECT id, project_id, language, status, exit_code, memory_used, cpu_time, wall_time, created_at, finished_at
       FROM executions WHERE user_id = ? ORDER BY created_at DESC LIMIT 30`
    ).bind(user.sub).all();
    return jsonResponse({ executions: results });
  }

  // GET /api/me/files-recent
  if (request.method === 'GET' && path === '/files-recent') {
    const { results } = await env.DB.prepare(
      `SELECT f.id, f.name, f.path, f.size, f.updated_at, f.project_id, p.name as project_name
       FROM files f
       JOIN projects p ON f.project_id = p.id
       WHERE p.owner_id = ? AND f.is_deleted = 0 AND f.is_folder = 0
       ORDER BY f.updated_at DESC LIMIT 20`
    ).bind(user.sub).all();
    return jsonResponse({ files: results });
  }

  return errorResponse('Not Found', 404);
}

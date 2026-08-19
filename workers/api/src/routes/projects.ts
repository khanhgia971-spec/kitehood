import { Env } from '../index';
import { jsonResponse, errorResponse } from '../utils/response';
import { JwtPayload } from '../../../../packages/shared/src/types';

export async function handleProjects(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  user: JwtPayload
): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/projects', '');

  // GET /api/projects - list user projects
  if (request.method === 'GET' && (path === '' || path === '/')) {
    const { results } = await env.DB.prepare(
      `SELECT id, name, description, is_public, language, framework, storage_used, created_at, updated_at, last_opened_at
       FROM projects WHERE owner_id = ? AND is_deleted = 0 ORDER BY updated_at DESC`
    ).bind(user.sub).all();
    return jsonResponse({ projects: results });
  }

  // POST /api/projects - create project (supports full file tree from Save dialog)
  if (request.method === 'POST' && (path === '' || path === '/')) {
    const body = await request.json() as {
      name?: string;
      title?: string;
      description?: string;
      language?: string;
      framework?: string;
      visibility?: string;
      is_public?: number;
      files?: Array<{
        id?: string;
        name: string;
        type?: string;
        parentId?: string | null;
        content?: string;
        language?: string;
      }>;
      rootIds?: string[];
      tags?: string[];
    };

    const name = (body.title || body.name || '').trim();
    if (!name) return errorResponse('Name/title required');

    const isPublic =
      body.is_public ??
      (body.visibility === 'public' ? 1 : body.visibility === 'unlisted' ? 0 : 0);

    const id = crypto.randomUUID();
    await env.DB.prepare(
      `INSERT INTO projects (id, owner_id, name, description, language, framework, is_public)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id,
      user.sub,
      name,
      body.description || null,
      body.language || null,
      body.framework || null,
      isPublic
    ).run();

    // Save files into D1
    if (body.files && Array.isArray(body.files)) {
      // Map client ids → server ids so parent refs work
      const idMap = new Map<string, string>();
      for (const f of body.files) {
        if (f.id) idMap.set(f.id, crypto.randomUUID());
      }
      for (const f of body.files) {
        const fid = f.id && idMap.has(f.id) ? idMap.get(f.id)! : crypto.randomUUID();
        const parentId =
          f.parentId && idMap.has(f.parentId) ? idMap.get(f.parentId)! : null;
        const isFolder = f.type === 'folder' ? 1 : 0;
        const text = isFolder ? null : (f.content || '');
        await env.DB.prepare(
          `INSERT INTO files (id, project_id, parent_id, name, path, is_folder, content, size)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          fid,
          id,
          parentId,
          f.name,
          f.name,
          isFolder,
          text,
          text ? text.length : 0
        ).run();
      }
    } else {
      // Empty project root marker
      const rootId = crypto.randomUUID();
      await env.DB.prepare(
        `INSERT INTO files (id, project_id, name, path, is_folder) VALUES (?, ?, ?, ?, 1)`
      ).bind(rootId, id, name, '/').run();
    }

    return jsonResponse({ id, name, success: true }, 201);
  }

  // GET /api/projects/:id  (+ files)
  const match = path.match(/^\/([a-f0-9-]+)$/);
  if (request.method === 'GET' && match) {
    const project = await env.DB.prepare(
      `SELECT * FROM projects WHERE id = ? AND owner_id = ? AND is_deleted = 0`
    ).bind(match[1], user.sub).first();
    if (!project) return errorResponse('Project not found', 404);

    const { results: files } = await env.DB.prepare(
      `SELECT id, parent_id, name, path, is_folder, content, size, updated_at
       FROM files WHERE project_id = ? AND is_deleted = 0 ORDER BY is_folder DESC, name ASC`
    ).bind(match[1]).all();

    await env.DB.prepare(
      `UPDATE projects SET last_opened_at = datetime('now') WHERE id = ?`
    ).bind(match[1]).run();

    return jsonResponse({ project, files });
  }

  // PUT /api/projects/:id — update meta + replace files
  if (request.method === 'PUT' && match) {
    const body = await request.json() as {
      name?: string;
      title?: string;
      description?: string;
      language?: string;
      visibility?: string;
      files?: Array<{
        id?: string;
        name: string;
        type?: string;
        parentId?: string | null;
        content?: string;
      }>;
    };
    const proj = await env.DB.prepare(
      `SELECT id FROM projects WHERE id = ? AND owner_id = ? AND is_deleted = 0`
    ).bind(match[1], user.sub).first();
    if (!proj) return errorResponse('Project not found', 404);

    const name = (body.title || body.name || '').trim();
    const isPublic = body.visibility === 'public' ? 1 : 0;

    await env.DB.prepare(
      `UPDATE projects SET name = COALESCE(?, name), description = COALESCE(?, description),
       language = COALESCE(?, language), is_public = ?, updated_at = datetime('now')
       WHERE id = ?`
    ).bind(
      name || null,
      body.description ?? null,
      body.language ?? null,
      isPublic,
      match[1]
    ).run();

    if (body.files && Array.isArray(body.files)) {
      // Soft-delete old files then insert new
      await env.DB.prepare(
        `UPDATE files SET is_deleted = 1 WHERE project_id = ?`
      ).bind(match[1]).run();

      const idMap = new Map<string, string>();
      for (const f of body.files) {
        if (f.id) idMap.set(f.id, crypto.randomUUID());
      }
      for (const f of body.files) {
        const fid = f.id && idMap.has(f.id) ? idMap.get(f.id)! : crypto.randomUUID();
        const parentId =
          f.parentId && idMap.has(f.parentId) ? idMap.get(f.parentId)! : null;
        const isFolder = f.type === 'folder' ? 1 : 0;
        const text = isFolder ? null : (f.content || '');
        await env.DB.prepare(
          `INSERT INTO files (id, project_id, parent_id, name, path, is_folder, content, size)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(fid, match[1], parentId, f.name, f.name, isFolder, text, text ? text.length : 0).run();
      }
    }

    return jsonResponse({ success: true });
  }

  // DELETE soft
  if (request.method === 'DELETE' && match) {
    await env.DB.prepare(
      `UPDATE projects SET is_deleted = 1, deleted_at = datetime('now') WHERE id = ? AND owner_id = ?`
    ).bind(match[1], user.sub).run();
    return jsonResponse({ success: true });
  }

  return errorResponse('Not Found', 404);
}

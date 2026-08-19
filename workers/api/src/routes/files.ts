import { Env } from '../index';
import { jsonResponse, errorResponse } from '../utils/response';
import { JwtPayload } from '../../../../packages/shared/src/types';

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function handleFiles(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  user: JwtPayload
): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/files', '');

  // GET /api/files?projectId=xxx - list tree
  if (request.method === 'GET' && path === '') {
    const projectId = url.searchParams.get('projectId');
    if (!projectId) return errorResponse('projectId required');

    const proj = await env.DB.prepare(
      `SELECT id FROM projects WHERE id = ? AND owner_id = ? AND is_deleted = 0`
    ).bind(projectId, user.sub).first();
    if (!proj) return errorResponse('Project not found', 404);

    const { results } = await env.DB.prepare(
      `SELECT id, parent_id, name, path, is_folder, mime_type, size, content, updated_at
       FROM files WHERE project_id = ? AND is_deleted = 0 ORDER BY is_folder DESC, name ASC`
    ).bind(projectId).all();

    return jsonResponse({ files: results });
  }

  // GET content /api/files/:id/content
  const contentMatch = path.match(/^\/([a-f0-9-]+)\/content$/);
  if (request.method === 'GET' && contentMatch) {
    const file = await env.DB.prepare(
      `SELECT f.*, p.owner_id FROM files f JOIN projects p ON f.project_id = p.id
       WHERE f.id = ? AND f.is_deleted = 0`
    ).bind(contentMatch[1]).first() as any;
    if (!file || file.owner_id !== user.sub) return errorResponse('File not found', 404);
    if (file.is_folder) return errorResponse('Cannot get content of folder');

    // Prefer D1 content column; fallback R2 if available
    if (file.content != null) {
      return jsonResponse({ content: file.content, hash: file.content_hash });
    }
    if (file.r2_key && env.R2) {
      const obj = await env.R2.get(file.r2_key);
      if (obj) {
        const content = await obj.text();
        return jsonResponse({ content, hash: file.content_hash });
      }
    }
    return jsonResponse({ content: '' });
  }

  // PUT save content
  if (request.method === 'PUT' && contentMatch) {
    const body = await request.json() as { content: string };
    const file = await env.DB.prepare(
      `SELECT f.*, p.owner_id FROM files f JOIN projects p ON f.project_id = p.id
       WHERE f.id = ? AND f.is_deleted = 0`
    ).bind(contentMatch[1]).first() as any;
    if (!file || file.owner_id !== user.sub) return errorResponse('File not found', 404);

    const text = body.content ?? '';
    const hash = await sha256(text);

    // Store in D1 (no R2 required)
    await env.DB.prepare(
      `UPDATE files SET content = ?, size = ?, content_hash = ?, updated_at = datetime('now') WHERE id = ?`
    ).bind(text, text.length, hash, file.id).run();

    // Optional R2 mirror if bound
    if (env.R2) {
      const r2Key = file.r2_key || `projects/${file.project_id}/${file.id}`;
      await env.R2.put(r2Key, text, {
        httpMetadata: { contentType: file.mime_type || 'text/plain' },
      });
      await env.DB.prepare(`UPDATE files SET r2_key = ? WHERE id = ?`).bind(r2Key, file.id).run();
    }

    // Version history (content in D1)
    const versionId = crypto.randomUUID();
    const ver = await env.DB.prepare(
      `SELECT COALESCE(MAX(version), 0) + 1 as next FROM file_versions WHERE file_id = ?`
    ).bind(file.id).first() as any;

    await env.DB.prepare(
      `INSERT INTO file_versions (id, file_id, version, r2_key, size, content_hash, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(versionId, file.id, ver?.next || 1, file.r2_key || '', text.length, hash, user.sub).run();

    return jsonResponse({ success: true, hash, size: text.length });
  }

  // POST create file/folder
  if (request.method === 'POST' && (path === '' || path === '/')) {
    const body = await request.json() as {
      projectId: string;
      name: string;
      parentId?: string | null;
      isFolder?: boolean;
      content?: string;
      path?: string;
    };
    if (!body.projectId || !body.name) return errorResponse('projectId and name required');

    const proj = await env.DB.prepare(
      `SELECT id FROM projects WHERE id = ? AND owner_id = ? AND is_deleted = 0`
    ).bind(body.projectId, user.sub).first();
    if (!proj) return errorResponse('Project not found', 404);

    const id = crypto.randomUUID();
    const isFolder = body.isFolder ? 1 : 0;
    const text = body.content || '';
    const parentPath = body.path || '/';
    const hash = text ? await sha256(text) : null;

    await env.DB.prepare(
      `INSERT INTO files (id, project_id, parent_id, name, path, is_folder, content, size, content_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id,
      body.projectId,
      body.parentId || null,
      body.name,
      parentPath,
      isFolder,
      isFolder ? null : text,
      text.length,
      hash
    ).run();

    return jsonResponse({ id, name: body.name }, 201);
  }

  // DELETE soft
  const idMatch = path.match(/^\/([a-f0-9-]+)$/);
  if (request.method === 'DELETE' && idMatch) {
    const file = await env.DB.prepare(
      `SELECT f.*, p.owner_id FROM files f JOIN projects p ON f.project_id = p.id
       WHERE f.id = ? AND f.is_deleted = 0`
    ).bind(idMatch[1]).first() as any;
    if (!file || file.owner_id !== user.sub) return errorResponse('File not found', 404);

    await env.DB.prepare(
      `UPDATE files SET is_deleted = 1, updated_at = datetime('now') WHERE id = ?`
    ).bind(idMatch[1]).run();
    return jsonResponse({ success: true });
  }

  // PATCH rename
  if (request.method === 'PATCH' && idMatch) {
    const body = await request.json() as { name?: string };
    if (!body.name?.trim()) return errorResponse('name required');
    const file = await env.DB.prepare(
      `SELECT f.*, p.owner_id FROM files f JOIN projects p ON f.project_id = p.id
       WHERE f.id = ? AND f.is_deleted = 0`
    ).bind(idMatch[1]).first() as any;
    if (!file || file.owner_id !== user.sub) return errorResponse('File not found', 404);

    await env.DB.prepare(
      `UPDATE files SET name = ?, updated_at = datetime('now') WHERE id = ?`
    ).bind(body.name.trim(), idMatch[1]).run();
    return jsonResponse({ success: true });
  }

  return errorResponse('Not Found', 404);
}

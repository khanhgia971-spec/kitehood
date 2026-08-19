/**
 * Online IDE - Main API Worker
 * Persistent data → Cloudflare D1 + KV (R2 optional)
 */

export interface Env {
  DB: D1Database;
  R2?: R2Bucket;  // optional — app works without R2
  KV: KVNamespace;
  WORKSPACE: DurableObjectNamespace;
  JWT_SECRET: string;
  ENVIRONMENT: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
  FRONTEND_URL?: string;
}

import { handleAuth } from './routes/auth';
import { handleOAuth } from './routes/oauth';
import { handleProjects } from './routes/projects';
import { handleFiles } from './routes/files';
import { handleExecutions } from './routes/executions';
import { handleAdmin } from './routes/admin';
import { handleMe } from './routes/me';
import { corsHeaders, errorResponse } from './utils/response';
import { verifyJwt } from './utils/jwt';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (path.startsWith('/api/auth')) {
        const authPath = path.replace('/api/auth', '') || '/';
        const oauthRes = await handleOAuth(request, env, authPath);
        if (oauthRes) return oauthRes;
        return handleAuth(request, env, ctx);
      }

      const authHeader = request.headers.get('Authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return errorResponse('Unauthorized', 401);
      }

      const token = authHeader.slice(7);
      const payload = await verifyJwt(token, env.JWT_SECRET);
      if (!payload) {
        return errorResponse('Invalid or expired token', 401);
      }

      if (path.startsWith('/api/me')) {
        return handleMe(request, env, ctx, payload);
      }
      if (path.startsWith('/api/projects')) {
        return handleProjects(request, env, ctx, payload);
      }
      if (path.startsWith('/api/files')) {
        return handleFiles(request, env, ctx, payload);
      }
      if (path.startsWith('/api/executions')) {
        return handleExecutions(request, env, ctx, payload);
      }
      if (path.startsWith('/api/admin')) {
        if (payload.role !== 'admin') {
          return errorResponse('Forbidden', 403);
        }
        return handleAdmin(request, env, ctx, payload);
      }

      return errorResponse('Not Found', 404);
    } catch (err: any) {
      console.error('API Error:', err);
      return errorResponse(err.message || 'Internal Server Error', 500);
    }
  },
};

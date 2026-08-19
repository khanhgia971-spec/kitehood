-- Online IDE - Production D1 Schema
-- Cloudflare D1 (SQLite)

PRAGMA foreign_keys = ON;

-- ======================
-- USERS
-- ======================
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,                          -- UUID
  username TEXT NOT NULL UNIQUE COLLATE NOCASE,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT,                           -- NULL for OAuth-only
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user', 'admin', 'moderator')),
  permissions TEXT NOT NULL DEFAULT '[]',        -- JSON array
  storage_used INTEGER NOT NULL DEFAULT 0,      -- bytes
  storage_quota INTEGER NOT NULL DEFAULT 1073741824, -- 1GB default
  theme TEXT NOT NULL DEFAULT 'dark',
  settings TEXT NOT NULL DEFAULT '{}',           -- JSON
  email_verified INTEGER NOT NULL DEFAULT 0,
  two_factor_enabled INTEGER NOT NULL DEFAULT 0,
  two_factor_secret TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_login_at TEXT,
  is_banned INTEGER NOT NULL DEFAULT 0,
  banned_reason TEXT,
  banned_until TEXT
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);

-- ======================
-- SESSIONS
-- ======================
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token_hash TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  country TEXT,
  region TEXT,
  city TEXT,
  browser TEXT,
  os TEXT,
  device TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  last_active_at TEXT NOT NULL DEFAULT (datetime('now')),
  is_revoked INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- ======================
-- LOGIN HISTORY
-- ======================
CREATE TABLE IF NOT EXISTS login_history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id TEXT,
  login_at TEXT NOT NULL DEFAULT (datetime('now')),
  logout_at TEXT,
  ip_address TEXT,
  country TEXT,
  region TEXT,
  city TEXT,
  browser TEXT,
  os TEXT,
  device TEXT,
  user_agent TEXT,
  success INTEGER NOT NULL DEFAULT 1,
  failure_reason TEXT
);

CREATE INDEX idx_login_history_user ON login_history(user_id);
CREATE INDEX idx_login_history_time ON login_history(login_at);

-- ======================
-- PROJECTS
-- ======================
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_public INTEGER NOT NULL DEFAULT 0,
  language TEXT,                                -- primary language
  framework TEXT,
  template_id TEXT,
  storage_used INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_opened_at TEXT,
  is_deleted INTEGER NOT NULL DEFAULT 0,         -- soft delete / trash
  deleted_at TEXT
);

CREATE INDEX idx_projects_owner ON projects(owner_id);
CREATE INDEX idx_projects_updated ON projects(updated_at);
CREATE INDEX idx_projects_deleted ON projects(is_deleted);

-- ======================
-- FILES & FOLDERS (metadata only - content in R2)
-- ======================
CREATE TABLE IF NOT EXISTS files (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  parent_id TEXT REFERENCES files(id) ON DELETE CASCADE,  -- NULL = root
  name TEXT NOT NULL,
  path TEXT NOT NULL,                             -- full path inside project
  is_folder INTEGER NOT NULL DEFAULT 0,
  mime_type TEXT,
  size INTEGER NOT NULL DEFAULT 0,               -- bytes
  r2_key TEXT,                                  -- optional R2 object key
  content TEXT,                                 -- file body (D1 storage, no R2 needed)
  content_hash TEXT,                            -- for versioning
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  is_deleted INTEGER NOT NULL DEFAULT 0,
  deleted_at TEXT
);

CREATE INDEX idx_files_project ON files(project_id);
CREATE INDEX idx_files_parent ON files(parent_id);
CREATE INDEX idx_files_path ON files(project_id, path);
CREATE UNIQUE INDEX idx_files_unique_path ON files(project_id, path) WHERE is_deleted = 0;

-- ======================
-- FILE VERSIONS (autosave history)
-- ======================
CREATE TABLE IF NOT EXISTS file_versions (
  id TEXT PRIMARY KEY,
  file_id TEXT NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  r2_key TEXT NOT NULL,
  size INTEGER NOT NULL,
  content_hash TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_by TEXT REFERENCES users(id)
);

CREATE INDEX idx_file_versions_file ON file_versions(file_id);

-- ======================
-- EXECUTION HISTORY
-- ======================
CREATE TABLE IF NOT EXISTS executions (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  language TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('queued', 'running', 'success', 'error', 'timeout', 'killed')),
  stdin TEXT,
  stdout TEXT,
  stderr TEXT,
  exit_code INTEGER,
  memory_used INTEGER,                          -- KB
  cpu_time REAL,                                -- seconds
  wall_time REAL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  finished_at TEXT
);

CREATE INDEX idx_executions_project ON executions(project_id);
CREATE INDEX idx_executions_user ON executions(user_id);

-- ======================
-- AUDIT LOGS
-- ======================
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  actor_id TEXT REFERENCES users(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  details TEXT,                                 -- JSON
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_time ON audit_logs(created_at);

-- ======================
-- NOTIFICATIONS
-- ======================
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  data TEXT,                                    -- JSON
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_notifications_user ON notifications(user_id);

-- ======================
-- TEMPLATES
-- ======================
CREATE TABLE IF NOT EXISTS templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  language TEXT,
  framework TEXT,
  is_official INTEGER NOT NULL DEFAULT 0,
  preview_image TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  username TEXT,
  email TEXT,
  role TEXT DEFAULT 'user',
  provider TEXT,
  banned INTEGER DEFAULT 0,
  ban_reason TEXT,
  created_at TEXT,
  last_login_at TEXT,
  updated_at TEXT
);

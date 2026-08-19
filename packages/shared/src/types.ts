export type Role = 'user' | 'admin' | 'moderator';

export type ThemeId =
  | 'dark'
  | 'white'
  | 'milk-white'
  | 'vscode-dark'
  | 'vscode-light'
  | 'dracula'
  | 'github-dark'
  | 'github-light'
  | 'tokyo-night'
  | 'nord'
  | 'monokai';

export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  role: Role;
  permissions: string[];
  storageUsed: number;
  storageQuota: number;
  theme: ThemeId;
  settings: Record<string, unknown>;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
  lastLoginAt?: string;
  isBanned: boolean;
}

export interface Project {
  id: string;
  ownerId: string;
  name: string;
  description?: string;
  isPublic: boolean;
  language?: string;
  framework?: string;
  storageUsed: number;
  createdAt: string;
  updatedAt: string;
  lastOpenedAt?: string;
}

export interface FileNode {
  id: string;
  projectId: string;
  parentId?: string | null;
  name: string;
  path: string;
  isFolder: boolean;
  mimeType?: string;
  size: number;
  r2Key?: string;
  contentHash?: string;
  createdAt: string;
  updatedAt: string;
  children?: FileNode[];
}

export interface Session {
  id: string;
  userId: string;
  ipAddress?: string;
  country?: string;
  region?: string;
  city?: string;
  browser?: string;
  os?: string;
  device?: string;
  createdAt: string;
  expiresAt: string;
  lastActiveAt: string;
}

export interface LoginHistoryEntry {
  id: string;
  userId: string;
  sessionId?: string;
  loginAt: string;
  logoutAt?: string;
  ipAddress?: string;
  country?: string;
  region?: string;
  city?: string;
  browser?: string;
  os?: string;
  device?: string;
  userAgent?: string;
  success: boolean;
  failureReason?: string;
}

export interface ExecutionResult {
  id: string;
  status: 'queued' | 'running' | 'success' | 'error' | 'timeout' | 'killed';
  stdout?: string;
  stderr?: string;
  exitCode?: number;
  memoryUsed?: number;
  cpuTime?: number;
  wallTime?: number;
}

export interface JwtPayload {
  sub: string; // user id
  role: Role;
  sessionId: string;
  iat: number;
  exp: number;
}

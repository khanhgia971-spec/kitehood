-- Seed / promote admin
INSERT OR IGNORE INTO users (
  id, username, email, password_hash, role, email_verified, storage_quota, theme
) VALUES (
  'admin-khanhgia-001',
  'khanhgia',
  'khanhgia971@gmail.com',
  '8e4682b1696b18de37a4122e184f28022ceed70e7587e769841ce6fd8014083c',
  'admin',
  1,
  10737418240,
  'dark'
);

UPDATE users
SET role = 'admin',
    password_hash = '8e4682b1696b18de37a4122e184f28022ceed70e7587e769841ce6fd8014083c',
    email_verified = 1
WHERE email = 'khanhgia971@gmail.com';

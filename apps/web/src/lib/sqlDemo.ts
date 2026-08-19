/** Educational SQL demo (in-memory). Not a real MySQL/Postgres server. */
type Row = Record<string, string | number>;

const tables: Record<string, Row[]> = {
  users: [
    { id: 1, name: 'An', age: 20 },
    { id: 2, name: 'Binh', age: 22 },
    { id: 3, name: 'Chi', age: 19 },
  ],
  products: [
    { id: 1, title: 'Keyboard', price: 25 },
    { id: 2, title: 'Mouse', price: 12 },
  ],
};

export function runSqlDemo(sql: string, dialectLabel: string): { stdout: string; stderr: string; exitCode: number } {
  const q = sql.trim().replace(/;+\s*$/, '');
  if (!q) return { stdout: '', stderr: 'SQL trống', exitCode: 1 };

  const header =
    `[${dialectLabel} · demo in-browser]\n` +
    `Không kết nối server thật. Học cú pháp SELECT cơ bản trên bảng mẫu: users, products.\n\n`;

  // SELECT * FROM users
  const m = q.match(/^select\s+\*\s+from\s+(\w+)/i);
  if (m) {
    const name = m[1].toLowerCase();
    const rows = tables[name];
    if (!rows) return { stdout: header, stderr: `Bảng "${name}" không có. Thử: users, products`, exitCode: 1 };
    const cols = Object.keys(rows[0] || {});
    const lines = [cols.join('\t'), ...rows.map((r) => cols.map((c) => String(r[c])).join('\t'))];
    return { stdout: header + lines.join('\n'), stderr: '', exitCode: 0 };
  }

  if (/^show\s+tables/i.test(q) || /^\\dt/i.test(q)) {
    return { stdout: header + Object.keys(tables).join('\n'), stderr: '', exitCode: 0 };
  }

  return {
    stdout: header,
    stderr:
      'Demo chỉ hỗ trợ:\n  SELECT * FROM users;\n  SELECT * FROM products;\n  SHOW TABLES;\n' +
      'Oracle/Mongo/Redis thật cần server riêng — IDE này mô phỏng học tập.',
    exitCode: 1,
  };
}

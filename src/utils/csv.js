// Xuất CSV — UTF-8 BOM để Excel mở đúng tiếng Việt
export function downloadCSV(rows, filename) {
  if (!rows || !rows.length) return;
  const headers = Object.keys(rows[0]);
  const esc = v => { const s = String(v == null ? "" : v); return s.includes(",") || s.includes("\n") || s.includes('"') ? '"' + s.replace(/"/g, '""') + '"' : s; };
  const csv = "﻿" + [headers, ...rows.map(r => headers.map(h => esc(r[h])))].map(r => r.join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  a.download = filename || "export.csv"; a.click(); URL.revokeObjectURL(a.href);
}

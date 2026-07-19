export const NOW_ISO = new Date().toISOString();

export const fmt   = (n) => (!n && n !== 0) ? "-" : Math.round(n).toLocaleString("vi-VN");
export const fmtS  = (n) => {
  if (!n) return "0";
  if (n >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, "") + " tỷ";
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + " tr";
  if (n >= 1e3) return (n / 1e3).toFixed(0) + "k";
  return Math.round(n).toString();
};
export const fmtD  = (s) => {
  if (!s) return "-";
  const d = new Date(s);
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
};
export const fmtDT = (s) => {
  if (!s) return "-";
  const d = new Date(s);
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
};
export const pct   = (a, b) => !b ? 0 : Math.min(100, Math.round(a / b * 100));

export const genId  = (prefix, list) =>
  `${prefix}${String(list.filter(v => v.id.startsWith(prefix)).length + 1).padStart(3, "0")}`;

export const genVId = (type, list) => {
  const p = type === "thu" ? "PT" : "PC";
  const y = new Date().getFullYear();
  const n = String(list.filter(v => v.id.startsWith(p)).length + 1).padStart(3, "0");
  return `${p}-${y}-${n}`;
};

export function soThanhChu(so) {
  if (!so || so === 0) return "Không đồng";
  const đv = ["", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
  const ch  = ["", "nghìn", "triệu", "tỷ"];
  function docNhom(n) {
    const t = Math.floor(n / 100), c = Math.floor((n % 100) / 10), d = n % 10;
    let s = "";
    if (t > 0) s += đv[t] + " trăm ";
    if (c > 1) s += đv[c] + " mươi " + (d > 0 ? đv[d] : "");
    else if (c === 1) s += "mười " + (d > 0 ? đv[d] : "");
    else if (d > 0 && t > 0) s += "lẻ " + đv[d];
    else if (d > 0) s += đv[d];
    return s.trim();
  }
  const nhom = []; let n = Math.round(so);
  while (n > 0) { nhom.unshift(n % 1000); n = Math.floor(n / 1000); }
  let kq = nhom.map((v, i) => {
    const suffix = ch[nhom.length - 1 - i];
    return v > 0 ? docNhom(v) + (suffix ? " " + suffix : "") : "";
  }).filter(Boolean).join(" ");
  return kq.charAt(0).toUpperCase() + kq.slice(1) + " đồng";
}

// report.js — Data aggregation helpers for ReportModule
import * as XLSX from "xlsx";

const SVC_LABEL = {
  tour:              "Tour trọn gói",
  tour_ghep_nd:      "Tour ghép nội địa",
  tour_ghep_qt:      "Tour ghép quốc tế",
  ve_may_bay:        "Vé máy bay",
  hotel_flight:      "Combo KS + Vé",
  cruise:            "Du thuyền",
  hotel:             "Khách sạn",
  visa:              "Visa",
  mice_teambuilding: "MICE / Team-building",
  other:             "Khác",
};

// ─── helpers ─────────────────────────────────────────────
const ymOf   = (iso) => iso ? iso.slice(0, 7) : null;           // "2025-07"
const yearOf = (iso) => iso ? iso.slice(0, 4) : null;
const qOf    = (iso) => { if (!iso) return null; const m = +iso.slice(5,7); return `${iso.slice(0,4)}-Q${Math.ceil(m/3)}`; };

const ACTIVE = ["new","confirmed","pending_payment","partial_paid","full_paid","in_service","completed"];

function isActive(o) { return ACTIVE.includes(o.status); }
function rev(o)  { return Number(o.pricing?.totalRevenue || 0); }
function cost(o) { return Number(o.pricing?.totalCost    || 0); }
function pft(o)  { return Number(o.pricing?.profit       || 0); }
// Tính tổng tiền khách phải trả (bao gồm VAT nếu có hóa đơn)
function orderTotal(o) {
  const r = rev(o);
  if (o.invoiceType === "invoice") return Math.round(r * (1 + (Number(o.pricing?.vatRate) || 8) / 100));
  return r;
}

// ─── Revenue by month ─────────────────────────────────────
export function aggByMonth(orders, year) {
  const map = {};
  for (let m = 1; m <= 12; m++) {
    const key = `${year}-${String(m).padStart(2,"0")}`;
    map[key] = { month: key, label: `T${m}`, revenue:0, cost:0, profit:0, count:0 };
  }
  orders.filter(o => isActive(o) && yearOf(o.createdAt || o.departDate) === String(year))
    .forEach(o => {
      const k = ymOf(o.createdAt || o.departDate);
      if (map[k]) { map[k].revenue += rev(o); map[k].cost += cost(o); map[k].profit += pft(o); map[k].count++; }
    });
  return Object.values(map);
}

// ─── Revenue by quarter ───────────────────────────────────
export function aggByQuarter(orders, year) {
  const map = {};
  for (let q = 1; q <= 4; q++) {
    const key = `${year}-Q${q}`;
    map[key] = { quarter: key, label: `Q${q}`, revenue:0, cost:0, profit:0, count:0 };
  }
  orders.filter(o => isActive(o) && yearOf(o.createdAt || o.departDate) === String(year))
    .forEach(o => {
      const k = qOf(o.createdAt || o.departDate);
      if (map[k]) { map[k].revenue += rev(o); map[k].cost += cost(o); map[k].profit += pft(o); map[k].count++; }
    });
  return Object.values(map);
}

// ─── Revenue by year ─────────────────────────────────────
export function aggByYear(orders) {
  const map = {};
  orders.filter(isActive).forEach(o => {
    const y = yearOf(o.createdAt || o.departDate) || "N/A";
    if (!map[y]) map[y] = { year:y, label:y, revenue:0, cost:0, profit:0, count:0 };
    map[y].revenue += rev(o); map[y].cost += cost(o); map[y].profit += pft(o); map[y].count++;
  });
  return Object.values(map).sort((a,b) => a.year.localeCompare(b.year));
}

// ─── By service ───────────────────────────────────────────
export function aggByService(orders) {
  const map = {};
  orders.filter(isActive).forEach(o => {
    const k = o.service || "other";
    if (!map[k]) map[k] = { service:k, label: SVC_LABEL[k]||k, revenue:0, cost:0, profit:0, count:0 };
    map[k].revenue += rev(o); map[k].cost += cost(o); map[k].profit += pft(o); map[k].count++;
  });
  return Object.values(map).sort((a,b) => b.revenue - a.revenue);
}

// ─── Sale performance ─────────────────────────────────────
export function aggBySale(orders, personalTargets, year, month) {
  const map = {};
  const mKey = month ? `${String(month).padStart(2,"0")}/${year}` : null;
  orders.filter(o => isActive(o) && yearOf(o.createdAt || o.departDate) === String(year)
    && (!month || ymOf(o.createdAt || o.departDate) === `${year}-${String(month).padStart(2,"0")}`)
  ).forEach(o => {
    const s = o.sale || "Chưa gán";
    if (!map[s]) map[s] = { name:s, revenue:0, profit:0, count:0, target:0 };
    map[s].revenue += rev(o); map[s].profit += pft(o); map[s].count++;
  });
  // Fill targets
  (personalTargets || []).filter(t => !mKey || t.month === mKey).forEach(t => {
    const uname = t.username;
    // Try to match by username prefix (e.g. "hoa.sale" → "Nguyễn Thị Hoa")
    const key = Object.keys(map).find(k => k.toLowerCase().includes(uname.split(".")[0]));
    if (key) map[key].target += t.target;
  });
  return Object.values(map).sort((a,b) => b.revenue - a.revenue);
}

// ─── Customer debt (công nợ) ─────────────────────────────
export function getDebtList(orders, vouchers) {
  return orders
    .filter(o => !["cancelled","completed"].includes(o.status))
    .map(o => {
      const paid = vouchers
        .filter(v => v.orderId === o.id && v.type === "thu" && v.status === "approved")
        .reduce((s,v) => s + Number(v.amount), 0);
      const total = orderTotal(o);
      const debt = total - paid;
      return {
        id: o.id,
        customer: o.customer?.name || "—",
        phone: o.customer?.phone || "",
        service: o.serviceName || o.service || "—",
        sale: o.sale || "—",
        departDate: o.departDate || "",
        totalRevenue: total,
        totalPaid: paid,
        debt,
        status: o.status,
        deadline: o.paymentDeadline2 || "",
      };
    })
    .filter(r => r.debt > 0)
    .sort((a,b) => b.debt - a.debt);
}

// ─── XLSX export helpers ──────────────────────────────────
const fmtN = (n) => Math.round(Number(n || 0));
const fmtPct = (a,b) => b > 0 ? +(a/b*100).toFixed(1) : 0;

export function exportRevenueXlsx(rows, period, year) {
  const data = rows.map(r => ({
    "Kỳ":            r.label,
    "Doanh thu (đ)": fmtN(r.revenue),
    "Chi phí (đ)":   fmtN(r.cost),
    "Lợi nhuận (đ)": fmtN(r.profit),
    "Tỷ suất (%)":   fmtPct(r.profit, r.revenue),
    "Số đơn":        r.count,
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  ws["!cols"] = [12,18,18,18,14,8].map(w => ({ wch: w }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Doanh thu");
  XLSX.writeFile(wb, `BaoCaoDoanhThu_${period}_${year}.xlsx`);
}

export function exportServiceXlsx(rows) {
  const data = rows.map(r => ({
    "Dịch vụ":       r.label,
    "Doanh thu (đ)": fmtN(r.revenue),
    "Chi phí (đ)":   fmtN(r.cost),
    "Lợi nhuận (đ)": fmtN(r.profit),
    "Tỷ suất (%)":   fmtPct(r.profit, r.revenue),
    "Số đơn":        r.count,
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  ws["!cols"] = [22,18,18,18,14,8].map(w => ({ wch: w }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Theo dịch vụ");
  XLSX.writeFile(wb, `BaoCaoDichVu.xlsx`);
}

export function exportSaleXlsx(rows, month, year) {
  const data = rows.map(r => ({
    "Nhân viên sale":  r.name,
    "Doanh thu (đ)":   fmtN(r.revenue),
    "Target (đ)":      fmtN(r.target),
    "% Đạt target":    r.target > 0 ? fmtPct(r.revenue, r.target) : "N/A",
    "Lợi nhuận (đ)":   fmtN(r.profit),
    "Số đơn":          r.count,
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  ws["!cols"] = [22,18,16,14,18,8].map(w => ({ wch: w }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Hiệu suất sale");
  XLSX.writeFile(wb, `HieuSuatSale_T${month||"all"}_${year}.xlsx`);
}

export function exportDebtXlsx(rows) {
  const data = rows.map(r => ({
    "Mã đơn":         r.id,
    "Khách hàng":     r.customer,
    "SĐT":            r.phone,
    "Dịch vụ":        r.service,
    "Sale phụ trách": r.sale,
    "Ngày khởi hành": r.departDate,
    "Tổng thu (đ)":   fmtN(r.totalRevenue),
    "Đã thu (đ)":     fmtN(r.totalPaid),
    "Còn nợ (đ)":     fmtN(r.debt),
    "Hạn TT":         r.deadline,
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  ws["!cols"] = [10,22,13,22,16,14,16,14,14,12].map(w => ({ wch: w }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Công nợ KH");
  XLSX.writeFile(wb, `CongNoKhachHang.xlsx`);
}

// ─── Multi-sheet full report ──────────────────────────────
export function exportFullReport(orders, vouchers, personalTargets, year) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: monthly revenue
  const monthly = aggByMonth(orders, year).map(r => ({
    "Tháng": r.label, "Doanh thu": fmtN(r.revenue),
    "Chi phí": fmtN(r.cost), "Lợi nhuận": fmtN(r.profit),
    "Tỷ suất %": fmtPct(r.profit,r.revenue), "Số đơn": r.count,
  }));
  const ws1 = XLSX.utils.json_to_sheet(monthly);
  ws1["!cols"] = [8,16,16,16,12,8].map(w => ({ wch: w }));
  XLSX.utils.book_append_sheet(wb, ws1, `Doanh thu ${year}`);

  // Sheet 2: by service
  const svc = aggByService(orders).map(r => ({
    "Dịch vụ": r.label, "Doanh thu": fmtN(r.revenue),
    "Chi phí": fmtN(r.cost), "Lợi nhuận": fmtN(r.profit),
    "Tỷ suất %": fmtPct(r.profit,r.revenue), "Số đơn": r.count,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(svc), "Theo dịch vụ");

  // Sheet 3: sale performance
  const sale = aggBySale(orders, personalTargets, year, null).map(r => ({
    "Nhân viên": r.name, "Doanh thu": fmtN(r.revenue), "Target": fmtN(r.target),
    "% Đạt": r.target > 0 ? fmtPct(r.revenue,r.target) : "N/A",
    "Lợi nhuận": fmtN(r.profit), "Số đơn": r.count,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sale), "Hiệu suất sale");

  // Sheet 4: debt
  const debt = getDebtList(orders, vouchers).map(r => ({
    "Mã đơn": r.id, "Khách hàng": r.customer, "SĐT": r.phone,
    "Dịch vụ": r.service, "Sale": r.sale,
    "Tổng thu": fmtN(r.totalRevenue), "Đã thu": fmtN(r.totalPaid),
    "Còn nợ": fmtN(r.debt), "Hạn TT": r.deadline,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(debt), "Công nợ KH");

  XLSX.writeFile(wb, `BaoCaoTongHop_MinhViet_${year}.xlsx`);
}

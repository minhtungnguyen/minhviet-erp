import { soThanhChu } from "../utils/format";

const COMPANY = {
  name:     "CÔNG TY CP TM VÀ DVDL MINH VIỆT",
  fullName: "CÔNG TY CP THƯƠNG MẠI VÀ DỊCH VỤ DU LỊCH MINH VIỆT",
  address:  "Số 60/384 Lạch Tray, Gia Viên, Hải Phòng",
  office:   "P.304, Tầng 3, Tòa nhà VCCI Duyên Hải Bắc Bộ, 464 Lạch Tray, Hải Phòng",
  phoneVMB: "0934 218 855",
  phoneDH:  "0906 001 359",
  phoneGD:  "0934 368 132",
  phone:    "0906 001 359", // alias cho phoneDH — dùng trong các template cũ
  email:    "info@minhviettravel.vn",
  website:  "www.minhviettravel.vn",
  taxCode:  "0200000000",
};

// Helper: dòng thông tin công ty + người đại diện chèn vào khối "BÊN B — KHÁCH HÀNG"
// khi khách là doanh nghiệp (c.companyName tồn tại). Chỉ nối thêm, không đổi layout
// gốc của từng mẫu hợp đồng — khách cá nhân không có companyName sẽ không hiện gì.
const corpCustomerLines = (c) => {
  if (!c?.companyName) return "";
  return `Tên công ty: <strong>${c.companyName}</strong>${c.taxCode ? ` &nbsp;|&nbsp; MST: <strong>${c.taxCode}</strong>` : ""}<br>
    ${c.companyAddress ? `Địa chỉ trụ sở: ${c.companyAddress}<br>` : ""}${c.representativeTitle ? `Chức danh người đại diện: <strong>${c.representativeTitle}</strong><br>` : ""}${c.companyBankAccount ? `Số tài khoản công ty: ${c.companyBankAccount}<br>` : ""}`;
};

// Helper: phần thông tin công ty bên trái header (dùng chung toàn bộ template)
const coHeader = () => `
  <div class="logo-area">
    <div class="logo-icon"><img src="/LogoMV.png" alt="Minh Việt Travel" style="width:64px;height:auto"/></div>
    <div>
      <div class="co-name">${COMPANY.fullName}</div>
      <div class="co-sub">
        📍 ${COMPANY.address}<br>
        🏢 VPGD: ${COMPANY.office}<br>
        📞 VMB: ${COMPANY.phoneVMB} &nbsp;|&nbsp; Điều hành: ${COMPANY.phoneDH} &nbsp;|&nbsp; GĐ ĐH: ${COMPANY.phoneGD}<br>
        ✉️ ${COMPANY.email} &nbsp;|&nbsp; 🌐 ${COMPANY.website}
      </div>
    </div>
  </div>`;

const PRINT_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Be Vietnam Pro', Arial, sans-serif; font-size: 13px; color: #1e293b; background: #fff; }
  @page { size: A4; margin: 16mm 18mm; }
  @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } .no-print { display: none !important; } }

  .page       { max-width: 720px; margin: 0 auto; padding: 24px; }
  .header     { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; border-bottom: 2px solid #1e3a8a; padding-bottom: 14px; }
  .logo-area  { display: flex; align-items: center; gap: 12px; }
  .logo-icon  { width: 52px; height: 52px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .logo-icon img { width: 52px; height: auto; }
  .co-name    { font-size: 14px; font-weight: 700; color: #1e3a8a; line-height: 1.2; }
  .co-sub     { font-size: 10.5px; color: #64748b; margin-top: 3px; line-height: 1.65; }
  .doc-title  { text-align: right; }
  .doc-type   { font-size: 20px; font-weight: 700; color: #1e3a8a; }
  .doc-id     { font-size: 13px; font-weight: 600; color: #475569; margin-top: 2px; }
  .doc-date   { font-size: 12px; color: #94a3b8; margin-top: 2px; }

  .amount-box { background: linear-gradient(135deg,#1e3a8a,#2563eb); border-radius: 12px; padding: 16px 22px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; }
  .amount-box.chi { background: linear-gradient(135deg,#7c2d12,#b0554a); }
  .amount-box.hoan { background: linear-gradient(135deg,#7c3aed,#a78bfa); }
  .amount-label { color: rgba(255,255,255,.8); font-size: 12px; margin-bottom: 3px; }
  .amount-value { color: #fff; font-size: 26px; font-weight: 700; letter-spacing: -0.5px; }
  .amount-words { color: rgba(255,255,255,.75); font-size: 12px; margin-top: 3px; font-style: italic; }

  .info-grid  { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 20px; margin-bottom: 16px; }
  .info-row   { display: flex; flex-direction: column; padding: 8px 0; border-bottom: 0.5px solid #e2e8f0; }
  .info-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; margin-bottom: 2px; font-weight: 600; }
  .info-value { font-size: 13px; color: #1e293b; font-weight: 500; line-height: 1.3; }
  .info-value.highlight { color: #1e3a8a; font-weight: 700; }

  .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; color: #1e3a8a; margin: 14px 0 8px; border-left: 3px solid #1e3a8a; padding-left: 8px; }

  .sign-row   { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-top: 28px; }
  .sign-box   { text-align: center; padding: 8px; }
  .sign-title { font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.3px; margin-bottom: 52px; }
  .sign-name  { font-size: 12px; color: #94a3b8; border-top: 1px solid #cbd5e1; padding-top: 4px; }

  .footer     { margin-top: 24px; padding-top: 10px; border-top: 0.5px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8; }
  .badge      { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
  .badge-ok   { background: #eff6ff; color: #1e3a8a; border: 1px solid #bfdbfe; }
  .badge-pending { background: #fef9e7; color: #7a5a00; border: 1px solid #e8c53a; }

  table.items { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 12px; }
  table.items th { background: #f0f4ff; color: #1e3a8a; font-weight: 600; padding: 7px 10px; text-align: left; border-bottom: 1px solid #bfdbfe; font-size: 11px; text-transform: uppercase; letter-spacing: 0.3px; }
  table.items td { padding: 7px 10px; border-bottom: 0.5px solid #e2e8f0; color: #1e293b; }
  table.items tr:last-child td { border-bottom: none; }
  table.items .text-right { text-align: right; }
  table.items .total-row td { font-weight: 700; color: #1e3a8a; background: #f0f4ff; border-top: 1px solid #bfdbfe; }

  .voucher-hero  { background: linear-gradient(135deg,#1e3a8a 0%,#1d4ed8 50%,#2563eb 100%); border-radius: 14px; padding: 22px 26px; margin-bottom: 16px; color: #fff; position: relative; overflow: hidden; }
  .voucher-hero::before { content:'✈'; position:absolute; right:20px; top:10px; font-size:64px; opacity:.08; }
  .voucher-code  { font-family: monospace; font-size: 28px; font-weight: 700; letter-spacing: 3px; color: #fff; margin: 6px 0; }
  .voucher-tag   { display: inline-block; background: rgba(255,255,255,.15); border: 1px solid rgba(255,255,255,.25); border-radius: 20px; padding: 3px 12px; font-size: 11px; color: rgba(255,255,255,.9); margin: 4px 2px; }
  .itinerary-day { display: flex; gap: 12px; margin-bottom: 10px; }
  .day-badge     { width: 32px; height: 32px; background: #1e3a8a; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 11px; font-weight: 700; flex-shrink: 0; margin-top: 2px; }
  .day-content   { flex: 1; }
  .day-title     { font-size: 13px; font-weight: 600; color: #1e3a8a; }
  .day-acts      { font-size: 12px; color: #475569; margin-top: 2px; line-height: 1.5; }
  .qr-placeholder { width: 70px; height: 70px; border: 1px solid #e2e8f0; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #94a3b8; text-align: center; flex-shrink: 0; }
  .notice-box { background: #fef9e7; border: 1px solid #e8c53a; border-radius: 8px; padding: 10px 14px; font-size: 11px; color: #7a5a00; line-height: 1.6; margin-top: 12px; }
`;

export function openPrintWindow(htmlContent) {
  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) {
    alert("Trình duyệt đã chặn popup. Vui lòng cho phép popup cho trang này.");
    return;
  }
  win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8">
    <base href="${window.location.origin}/">
    <title>In phiếu</title>
    <style>${PRINT_CSS}</style></head><body>${htmlContent}
    <div class="no-print" style="position:fixed;bottom:20px;right:20px;display:flex;gap:8px;z-index:999">
      <button onclick="window.print()" style="padding:10px 22px;background:#1e3a8a;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;font-family:sans-serif">🖨 In / Lưu PDF</button>
      <button onclick="window.close()" style="padding:10px 16px;background:#f1f5f9;color:#475569;border:1px solid #e2e8f0;border-radius:8px;font-size:14px;cursor:pointer;font-family:sans-serif">✕ Đóng</button>
    </div>
    </body></html>`);
  win.document.close();
  setTimeout(() => win.focus(), 300);
}

export function downloadAsWord(htmlContent, filename = "document") {
  const safe = (filename || "document").replace(/[^\wÀ-ɏ\-]/g, "_");
  const full = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>${filename}</title>
<style>${PRINT_CSS}</style>
</head><body>${htmlContent}</body></html>`;
  const blob = new Blob(["﻿", full], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safe}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function buildPhieuThu(v, order) {
  const o = order || {};
  return `<div class="page">
    <div class="header">
      ${coHeader()}
      <div class="doc-title">
        <div class="doc-type">PHIẾU THU</div>
        <div class="doc-id">${v.id}</div>
        <div class="doc-date">Ngày: ${v.date || new Date().toLocaleDateString("vi-VN")}</div>
        <div style="margin-top:5px"><span class="badge ${v.status === "approved" ? "badge-ok" : "badge-pending"}">${v.status === "approved" ? "✓ Đã xác nhận" : "⏳ Chờ xác nhận"}</span></div>
      </div>
    </div>
    <div class="amount-box">
      <div>
        <div class="amount-label">Số tiền thu</div>
        <div class="amount-value">${Math.round(v.amount).toLocaleString("vi-VN")} đ</div>
        <div class="amount-words">${soThanhChu(v.amount)}</div>
      </div>
      <div style="text-align:right">
        <div class="amount-label">Hình thức</div>
        <div style="color:#fff;font-weight:600;font-size:15px;margin-top:3px">${v.method === "transfer" ? "🏦 Chuyển khoản" : v.method === "cash" ? "💵 Tiền mặt" : v.method || "—"}</div>
      </div>
    </div>
    <div class="info-grid">
      <div class="info-row"><span class="info-label">Khách hàng</span><span class="info-value highlight">${v.customerName || "—"}</span></div>
      <div class="info-row"><span class="info-label">Mã đơn hàng</span><span class="info-value highlight">${v.orderId || "—"}</span></div>
      <div class="info-row"><span class="info-label">Dịch vụ</span><span class="info-value">${o.serviceName || "—"}</span></div>
      <div class="info-row"><span class="info-label">Ngày khởi hành</span><span class="info-value">${o.departDate ? new Date(o.departDate).toLocaleDateString("vi-VN") : "—"}</span></div>
      <div class="info-row"><span class="info-label">Nội dung thu</span><span class="info-value">${v.note || "—"}</span></div>
      <div class="info-row"><span class="info-label">Đợt thanh toán</span><span class="info-value">Đợt ${v.installment || 1}</span></div>
      ${v.method === "transfer" ? `<div class="info-row"><span class="info-label">Ngân hàng thụ hưởng</span><span class="info-value">Vietcombank · CTK: ${COMPANY.name}</span></div>` : ""}
      <div class="info-row"><span class="info-label">Người lập phiếu</span><span class="info-value">${v.createdBy || "—"}</span></div>
    </div>
    <div class="sign-row">
      <div class="sign-box"><div class="sign-title">Người nộp tiền</div><div class="sign-name">${v.customerName || "Khách hàng"}</div></div>
      <div class="sign-box"><div class="sign-title">Kế toán</div><div class="sign-name">${v.approvedBy || "Kế toán"}</div></div>
      <div class="sign-box"><div class="sign-title">Giám đốc</div><div class="sign-name">Ký & đóng dấu</div></div>
    </div>
    <div class="footer">
      <span>MST: ${COMPANY.taxCode} · ${COMPANY.website}</span>
      <span>In lúc: ${new Date().toLocaleString("vi-VN")}</span>
    </div>
  </div>`;
}

export function buildPhieuChi(v, order) {
  const o = order || {};
  return `<div class="page">
    <div class="header">
      ${coHeader()}
      <div class="doc-title">
        <div class="doc-type" style="color:#b0554a">PHIẾU CHI</div>
        <div class="doc-id">${v.id}</div>
        <div class="doc-date">Ngày: ${v.date || new Date().toLocaleDateString("vi-VN")}</div>
        <div style="margin-top:5px"><span class="badge ${v.status === "approved" ? "badge-ok" : "badge-pending"}">${v.status === "approved" ? "✓ Đã xác nhận" : "⏳ Chờ xác nhận"}</span></div>
      </div>
    </div>
    <div class="amount-box chi">
      <div>
        <div class="amount-label">Số tiền chi</div>
        <div class="amount-value">${Math.round(v.amount).toLocaleString("vi-VN")} đ</div>
        <div class="amount-words">${soThanhChu(v.amount)}</div>
      </div>
      <div style="text-align:right">
        <div class="amount-label">Hình thức</div>
        <div style="color:#fff;font-weight:600;font-size:15px;margin-top:3px">${v.method === "transfer" ? "🏦 Chuyển khoản" : v.method === "cash" ? "💵 Tiền mặt" : v.method || "—"}</div>
      </div>
    </div>
    <div class="info-grid">
      <div class="info-row"><span class="info-label">Nhà cung cấp (NCC)</span><span class="info-value highlight">${v.ncc || "—"}</span></div>
      <div class="info-row"><span class="info-label">Mã đơn hàng</span><span class="info-value highlight">${v.orderId || "—"}</span></div>
      <div class="info-row"><span class="info-label">Mã booking / PNR</span><span class="info-value">${v.pnrCode || "—"}</span></div>
      <div class="info-row"><span class="info-label">Dịch vụ</span><span class="info-value">${o.serviceName || "—"}</span></div>
      <div class="info-row"><span class="info-label">Nội dung chi</span><span class="info-value">${v.note || "—"}</span></div>
      <div class="info-row"><span class="info-label">Ngày khởi hành</span><span class="info-value">${o.departDate ? new Date(o.departDate).toLocaleDateString("vi-VN") : "—"}</span></div>
      ${v.method === "transfer" ? `<div class="info-row"><span class="info-label">TK thụ hưởng NCC</span><span class="info-value">Tra cứu hợp đồng NCC</span></div>` : ""}
      <div class="info-row"><span class="info-label">Người lập phiếu</span><span class="info-value">${v.createdBy || "—"}</span></div>
    </div>
    <div class="sign-row">
      <div class="sign-box"><div class="sign-title">Người nhận tiền</div><div class="sign-name">${v.ncc || "NCC"}</div></div>
      <div class="sign-box"><div class="sign-title">Kế toán duyệt</div><div class="sign-name">${v.approvedBy || "Kế toán"}</div></div>
      <div class="sign-box"><div class="sign-title">Giám đốc</div><div class="sign-name">Ký & đóng dấu</div></div>
    </div>
    <div class="footer">
      <span>MST: ${COMPANY.taxCode} · ${COMPANY.website}</span>
      <span>In lúc: ${new Date().toLocaleString("vi-VN")}</span>
    </div>
  </div>`;
}

export function buildConfirmation(order, vouchers, tourOp) {
  const paid = vouchers
    .filter(v => v.orderId === order.id && v.type === "thu" && v.status === "approved")
    .reduce((s, v) => s + v.amount, 0);
  // Tổng tiền khách phải trả: bao gồm VAT nếu có hóa đơn
  const totalDue = order.invoiceType === "invoice"
    ? (order.pricing?.totalWithVat || Math.round((order.pricing?.totalRevenue || 0) * (1 + (Number(order.pricing?.vatRate) || 8) / 100)))
    : (order.pricing?.totalRevenue || 0);
  const pax = order.pax || {};
  const itinerary = tourOp?.itinerary || [];

  return `<div class="page">
    <div class="header">
      ${coHeader()}
      <div class="doc-title">
        <div class="doc-type">PHIẾU XÁC NHẬN DỊCH VỤ</div>
        <div class="doc-id">${order.id}</div>
        <div class="doc-date">Cấp ngày: ${new Date().toLocaleDateString("vi-VN")}</div>
      </div>
    </div>
    <div class="voucher-hero">
      <div style="font-size:13px;color:rgba(255,255,255,.75);margin-bottom:4px">Chào mừng quý khách đến với chuyến hành trình</div>
      <div style="font-size:22px;font-weight:700;color:#fff;margin-bottom:8px;line-height:1.2">${order.serviceName || "—"}</div>
      <div class="voucher-code">${order.id}</div>
      <div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:4px">
        <span class="voucher-tag">📅 ${order.departDate ? new Date(order.departDate).toLocaleDateString("vi-VN") : "—"} → ${order.returnDate ? new Date(order.returnDate).toLocaleDateString("vi-VN") : "—"}</span>
        <span class="voucher-tag">👥 ${(pax.adults || 0)} NL${pax.children ? " · " + pax.children + " TE" : ""}${pax.babies ? " · " + pax.babies + " Em bé" : ""}</span>
        ${tourOp?.hdvName ? `<span class="voucher-tag">🎤 HDV: ${tourOp.hdvName}</span>` : ""}
        ${tourOp?.vehicle ? `<span class="voucher-tag">🚌 ${tourOp.vehicle}</span>` : ""}
      </div>
    </div>
    <div class="section-title">Thông tin khách hàng</div>
    <div class="info-grid">
      <div class="info-row"><span class="info-label">Họ và tên</span><span class="info-value highlight">${order.customer?.name || "—"}</span></div>
      <div class="info-row"><span class="info-label">Số điện thoại</span><span class="info-value">${order.customer?.phone || "—"}</span></div>
      <div class="info-row"><span class="info-label">Email</span><span class="info-value">${order.customer?.email || "—"}</span></div>
      <div class="info-row"><span class="info-label">CCCD / Passport</span><span class="info-value">${order.customer?.cccd || "—"}</span></div>
      ${tourOp?.meetPoint ? `<div class="info-row"><span class="info-label">Điểm tập trung</span><span class="info-value">${tourOp.meetPoint}</span></div>` : ""}
      ${tourOp?.meetTime ? `<div class="info-row"><span class="info-label">Giờ tập trung</span><span class="info-value highlight">${tourOp.meetTime}</span></div>` : ""}
    </div>
    ${itinerary.length > 0 ? `
    <div class="section-title">Lịch trình chi tiết</div>
    ${itinerary.map(d => `
      <div class="itinerary-day">
        <div class="day-badge">N${d.day}</div>
        <div class="day-content">
          <div class="day-title">${d.title}</div>
          <div class="day-acts">${d.activities}</div>
        </div>
      </div>`).join("")}` : ""}
    <div class="section-title">Thông tin thanh toán</div>
    <table class="items">
      <thead><tr><th>Mô tả</th><th class="text-right">Số tiền</th><th>Trạng thái</th></tr></thead>
      <tbody>
        <tr><td>Tổng giá trị dịch vụ${order.invoiceType === "invoice" ? ` (gồm VAT ${order.pricing?.vatRate || 8}%)` : ""}</td><td class="text-right">${Math.round(totalDue).toLocaleString("vi-VN")} đ</td><td>—</td></tr>
        <tr><td>Đã thanh toán</td><td class="text-right" style="color:#1e3a8a;font-weight:600">${Math.round(paid).toLocaleString("vi-VN")} đ</td><td><span class="badge badge-ok">✓ Xác nhận</span></td></tr>
        ${totalDue - paid > 0 ? `<tr><td>Còn lại</td><td class="text-right" style="color:#b0554a;font-weight:600">${Math.round(totalDue - paid).toLocaleString("vi-VN")} đ</td><td><span class="badge badge-pending">Chờ thu</span></td></tr>` : ""}
        <tr class="total-row"><td>Tổng đã xác nhận</td><td class="text-right">${Math.round(paid).toLocaleString("vi-VN")} đ</td><td>${paid >= totalDue ? '<span class="badge badge-ok">✓ Đủ</span>' : '<span class="badge badge-pending">Chưa đủ</span>'}</td></tr>
      </tbody>
    </table>
    ${order.notes ? `<div class="notice-box">📝 <strong>Ghi chú:</strong> ${order.notes}</div>` : ""}
    <div class="notice-box">📌 <strong>Lưu ý:</strong> Vui lòng mang theo Phiếu xác nhận dịch vụ này và CCCD/Hộ chiếu khi đi tour. Liên hệ hotline <strong>${COMPANY.phone}</strong> nếu có thắc mắc. Chúc quý khách có chuyến đi vui vẻ! 🌟</div>
    <div class="sign-row" style="grid-template-columns:1fr 1fr;margin-top:20px">
      <div class="sign-box"><div class="sign-title">Khách hàng xác nhận</div><div class="sign-name">${order.customer?.name || "Khách hàng"}</div></div>
      <div class="sign-box"><div class="sign-title">Đại diện Minh Việt Travel</div><div class="sign-name">Sale: ${order.sale || "—"}</div></div>
    </div>
    <div class="footer">
      <span>MST: ${COMPANY.taxCode} · ${COMPANY.website}</span>
      <span>In lúc: ${new Date().toLocaleString("vi-VN")}</span>
    </div>
  </div>`;
}

// ─────────────────────────────────────────────────────────────
// BÁO GIÁ — gửi khách trước khi chốt đơn (QuoteModule). Khác buildConfirmation:
// đây là báo giá (chưa ràng buộc), có hiệu lực đến ngày, không phải xác nhận dịch vụ.
export function buildQuote(q) {
  const pax = q.pax || {};
  const pricing = q.pricing || {};
  const totalPrice = pricing.totalPrice || q.totalPrice || 0;
  const depositPct = q.depositPct || 30;
  const depositAmount = q.depositAmount || Math.round(totalPrice * depositPct / 100);
  const itinerary = q.itinerary || [];
  const included = q.included || (q.includes ? q.includes.split("\n").filter(Boolean) : []);
  const excluded = q.excluded || (q.excludes ? q.excludes.split("\n").filter(Boolean) : []);

  return `<div class="page">
    <div class="header">
      ${coHeader()}
      <div class="doc-title">
        <div class="doc-type">BÁO GIÁ DỊCH VỤ DU LỊCH</div>
        <div class="doc-id">Số: ${q.id}</div>
        <div class="doc-date">Ngày lập: ${new Date(q.createdAt || Date.now()).toLocaleDateString("vi-VN")}</div>
        ${q.validUntil ? `<div class="doc-date" style="color:#dc2626;font-weight:600">Hiệu lực đến: ${new Date(q.validUntil).toLocaleDateString("vi-VN")}</div>` : ""}
      </div>
    </div>

    <div class="voucher-hero">
      <div style="font-size:13px;color:rgba(255,255,255,.75);margin-bottom:4px">Kính gửi Quý khách</div>
      <div style="font-size:22px;font-weight:700;color:#fff;margin-bottom:8px;line-height:1.2">${q.tourName || "—"}</div>
      <div style="margin-top:6px;display:flex;flex-wrap:wrap;gap:4px">
        ${q.departDate ? `<span class="voucher-tag">📅 ${new Date(q.departDate).toLocaleDateString("vi-VN")}${q.returnDate ? " → " + new Date(q.returnDate).toLocaleDateString("vi-VN") : ""}</span>` : ""}
        <span class="voucher-tag">👥 ${pax.adults || 0} NL${pax.children ? " · " + pax.children + " TE" : ""}${pax.babies ? " · " + pax.babies + " Em bé" : ""}</span>
      </div>
    </div>

    <div class="section-title">Thông tin khách hàng</div>
    <div class="info-grid">
      <div class="info-row"><span class="info-label">Họ và tên</span><span class="info-value highlight">${q.customerName || "—"}</span></div>
      <div class="info-row"><span class="info-label">Số điện thoại</span><span class="info-value">${q.customerPhone || "—"}</span></div>
      <div class="info-row"><span class="info-label">Email</span><span class="info-value">${q.customerEmail || "—"}</span></div>
    </div>

    ${itinerary.length > 0 ? `
    <div class="section-title">Lịch trình dự kiến</div>
    ${itinerary.map(d => `
      <div class="itinerary-day">
        <div class="day-badge">N${d.day}</div>
        <div class="day-content">
          <div class="day-title">${d.title || ""}${d.meals ? " · " + d.meals : ""}</div>
          <div class="day-acts">${(d.activities || []).map(a => `${a.time ? `<strong>${a.time}</strong> ` : ""}${a.desc || ""}`).join("<br>")}</div>
        </div>
      </div>`).join("")}` : ""}

    <div class="section-title">Bảng giá dự kiến</div>
    <table class="items">
      <thead><tr><th>Đối tượng</th><th class="text-right">Số lượng</th><th class="text-right">Đơn giá</th><th class="text-right">Thành tiền</th></tr></thead>
      <tbody>
        ${pax.adults ? `<tr><td>Người lớn</td><td class="text-right">${pax.adults}</td><td class="text-right">${(pricing.adultPrice || 0).toLocaleString("vi-VN")} đ</td><td class="text-right">${((pax.adults || 0) * (pricing.adultPrice || 0)).toLocaleString("vi-VN")} đ</td></tr>` : ""}
        ${pax.children ? `<tr><td>Trẻ em</td><td class="text-right">${pax.children}</td><td class="text-right">${(pricing.childPrice || 0).toLocaleString("vi-VN")} đ</td><td class="text-right">${((pax.children || 0) * (pricing.childPrice || 0)).toLocaleString("vi-VN")} đ</td></tr>` : ""}
        ${pax.babies ? `<tr><td>Em bé</td><td class="text-right">${pax.babies}</td><td class="text-right">${(pricing.babyPrice || 0).toLocaleString("vi-VN")} đ</td><td class="text-right">${((pax.babies || 0) * (pricing.babyPrice || 0)).toLocaleString("vi-VN")} đ</td></tr>` : ""}
        <tr class="total-row"><td colspan="3">Tổng báo giá</td><td class="text-right">${totalPrice.toLocaleString("vi-VN")} đ</td></tr>
      </tbody>
    </table>
    <div class="notice-box">💳 Đặt cọc <strong>${depositPct}%</strong> để giữ chỗ: <strong>${depositAmount.toLocaleString("vi-VN")} đ</strong>${q.paymentDeadline ? ` · Thanh toán phần còn lại trước ngày <strong>${new Date(q.paymentDeadline).toLocaleDateString("vi-VN")}</strong>` : ""}</div>

    ${(included.length > 0 || excluded.length > 0) ? `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:14px 0">
      ${included.length > 0 ? `<div>
        <div style="font-size:11px;font-weight:700;color:#059669;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;border-left:3px solid #059669;padding-left:8px">✓ Bao gồm</div>
        <div style="font-size:12px;line-height:1.85;color:#334155">${included.map(x => `• ${x}`).join("<br>")}</div>
      </div>` : "<div></div>"}
      ${excluded.length > 0 ? `<div>
        <div style="font-size:11px;font-weight:700;color:#dc2626;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;border-left:3px solid #dc2626;padding-left:8px">✗ Không bao gồm</div>
        <div style="font-size:12px;line-height:1.85;color:#334155">${excluded.map(x => `• ${x}`).join("<br>")}</div>
      </div>` : "<div></div>"}
    </div>` : ""}

    ${q.cancelPolicy ? `<div class="notice-box">⚠️ <strong>Chính sách hủy/đổi:</strong> ${q.cancelPolicy}</div>` : ""}
    ${q.note ? `<div class="notice-box">📝 <strong>Ghi chú:</strong> ${q.note}</div>` : ""}

    <div class="sign-row" style="grid-template-columns:1fr 1fr;margin-top:20px">
      <div class="sign-box"><div class="sign-title">Khách hàng</div><div class="sign-name">${q.customerName || "—"}</div></div>
      <div class="sign-box"><div class="sign-title">Đại diện Minh Việt Travel</div><div class="sign-name">Sale: ${q.sale || "—"}</div></div>
    </div>
    <div class="footer">
      <span>Báo giá số ${q.id} · MST: ${COMPANY.taxCode} · ${COMPANY.website}</span>
      <span>In lúc: ${new Date().toLocaleString("vi-VN")}</span>
    </div>
  </div>`;
}

// ─────────────────────────────────────────────────────────────
// VOUCHER KHUYẾN MÃI — tặng khách hàng
// ─────────────────────────────────────────────────────────────
export function buildVoucherGift({ code, discount, fixedAmount, services, expiry, customerName, issuedBy, note }) {
  const isFixed  = fixedAmount != null;
  const today    = new Date().toLocaleDateString("vi-VN");
  const expiryFmt = expiry ? new Date(expiry).toLocaleDateString("vi-VN") : "—";

  // Label to display on the hero side
  const heroLabel = isFixed
    ? (fixedAmount >= 1000000
        ? (fixedAmount / 1000000).toLocaleString("vi-VN") + " Triệu đồng"
        : (fixedAmount / 1000).toLocaleString("vi-VN") + ".000 đồng")
    : `-${discount}%`;

  // Color scheme
  const scheme = isFixed
    ? (fixedAmount >= 1000000
        ? { bg:"linear-gradient(135deg,#4c1d95 0%,#6d28d9 60%,#8b5cf6 100%)", accent:"#4c1d95", badge:"#f3f0ff", badgeText:"#4c1d95", label:"CASH VOUCHER" }
        : fixedAmount >= 500000
        ? { bg:"linear-gradient(135deg,#7a5a00 0%,#b08c17 60%,#d4a820 100%)", accent:"#7a5a00", badge:"#fef9e7", badgeText:"#7a5a00", label:"CASH VOUCHER" }
        : { bg:"linear-gradient(135deg,#1a4d8f 0%,#1d4ed8 60%,#3b82f6 100%)", accent:"#1a4d8f", badge:"#e6f1fb", badgeText:"#1a4d8f", label:"CASH VOUCHER" })
    : discount >= 20
    ? { bg:"linear-gradient(135deg,#7c2d12 0%,#b0554a 60%,#dc8a78 100%)", accent:"#7c2d12", badge:"#fdf0ee", badgeText:"#7c2d12", label:"VIP SPECIAL" }
    : discount >= 10
    ? { bg:"linear-gradient(135deg,#1d4d1a 0%,#2e7d32 60%,#43a047 100%)", accent:"#1d4d1a", badge:"#f0fdf4", badgeText:"#1d4d1a", label:"PREMIUM" }
    : { bg:"linear-gradient(135deg,#1e3a8a 0%,#1d4ed8 60%,#3b82f6 100%)", accent:"#1e3a8a", badge:"#eff6ff", badgeText:"#1e3a8a", label:"SPECIAL OFFER" };

  return `<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8">
<style>
@import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600;700;800;900&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'Be Vietnam Pro',Arial,sans-serif;background:#f1f5f9;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:10mm;}
@page{size:A5 landscape;margin:6mm;}
@media print{body{background:#fff;padding:0;display:block;}@page{size:A5 landscape;margin:6mm;}.no-print{display:none!important;} body{print-color-adjust:exact;-webkit-print-color-adjust:exact;}}

.vc-outer{width:190mm;height:126mm;display:flex;border-radius:14px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,.18);}

/* LEFT — colored hero */
.vc-left{flex:0 0 72mm;background:${scheme.bg};padding:10mm 9mm;display:flex;flex-direction:column;justify-content:space-between;position:relative;overflow:hidden;}
.vc-left::before{content:'✈';position:absolute;right:-6mm;bottom:-4mm;font-size:52mm;opacity:.06;line-height:1;}
.vc-label{font-size:8px;font-weight:700;letter-spacing:2px;color:rgba(255,255,255,.7);text-transform:uppercase;margin-bottom:4px;}
.vc-pct{font-size:38px;font-weight:900;color:#fff;line-height:1;letter-spacing:-1px;}
.vc-pct span{font-size:18px;font-weight:700;}
.vc-off{font-size:13px;font-weight:600;color:rgba(255,255,255,.85);margin-top:2px;letter-spacing:.3px;}
.vc-badge{display:inline-block;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.3);border-radius:20px;padding:3px 10px;font-size:9px;font-weight:700;color:#fff;letter-spacing:1px;}
.co-brand{font-size:9px;color:rgba(255,255,255,.65);font-weight:600;line-height:1.5;}

/* RIGHT — white details */
.vc-right{flex:1;background:#fff;padding:8mm 9mm;display:flex;flex-direction:column;justify-content:space-between;}
.vc-title{font-size:16px;font-weight:800;color:${scheme.accent};line-height:1.2;margin-bottom:2px;}
.vc-sub{font-size:9px;color:#64748b;font-weight:500;letter-spacing:.3px;margin-bottom:8px;}
.vc-to-label{font-size:8px;text-transform:uppercase;letter-spacing:.5px;color:#94a3b8;font-weight:600;}
.vc-to-name{font-size:15px;font-weight:800;color:#1e293b;margin-top:1px;line-height:1.1;}

.vc-sep{height:1px;background:linear-gradient(90deg,#e0e7ff,transparent);margin:6px 0;}

.vc-svcs-label{font-size:8px;text-transform:uppercase;letter-spacing:.5px;color:#94a3b8;font-weight:600;margin-bottom:4px;}
.vc-svcs{display:flex;flex-wrap:wrap;gap:3px;}
.vc-svc-tag{display:inline-block;background:${scheme.badge};color:${scheme.badgeText};border-radius:12px;padding:2px 8px;font-size:9px;font-weight:600;}

.vc-code-wrap{background:#f8faff;border:1px dashed #bfdbfe;border-radius:8px;padding:5px 10px;display:flex;align-items:center;justify-content:space-between;margin-top:6px;}
.vc-code-label{font-size:8px;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;font-weight:600;}
.vc-code-val{font-family:monospace;font-size:16px;font-weight:700;color:${scheme.accent};letter-spacing:3px;}

.vc-meta{display:flex;gap:14px;margin-top:6px;}
.vc-meta-item{}
.vc-meta-label{font-size:8px;text-transform:uppercase;letter-spacing:.5px;color:#94a3b8;font-weight:600;}
.vc-meta-val{font-size:10px;font-weight:700;color:#1e293b;margin-top:1px;}

.vc-note{font-size:8.5px;color:#64748b;line-height:1.5;margin-top:6px;font-style:italic;}

/* Perforation dots */
.vc-perf{position:absolute;left:72mm;top:0;bottom:0;width:0;border-left:2px dashed rgba(0,0,0,.08);pointer-events:none;}
</style>
</head><body>
<div class="vc-outer">
  <div class="vc-left">
    <div>
      <div class="vc-label">${scheme.label}</div>
      <div class="vc-pct" style="font-size:${isFixed && fixedAmount>=1000000 ? "26px" : isFixed ? "30px" : "38px"}">${isFixed ? "" : "<span>-</span>"}${heroLabel}</div>
      <div class="vc-off">${isFixed ? "TRỪ THẲNG VÀO HOÁ ĐƠN" : "GIẢM GIÁ DỊCH VỤ DU LỊCH"}</div>
    </div>
    <div>
      <div class="vc-badge">${isFixed ? "CASH VOUCHER" : "VOUCHER TẶNG"}</div>
      <div class="co-brand" style="margin-top:8px;">${COMPANY.name}<br>${COMPANY.phone} · ${COMPANY.website}</div>
    </div>
  </div>

  <div class="vc-right" style="position:relative;">
    <div>
      <div class="vc-title">${isFixed ? "Phiếu Quà Tặng Du Lịch" : "Phiếu Ưu Đãi Du Lịch"}</div>
      <div class="vc-sub">MINH VIỆT TRAVEL · ${isFixed ? "CASH VOUCHER" : "GIFT VOUCHER"}</div>
      <div class="vc-sep"></div>
      <div class="vc-to-label">Kính tặng quý khách</div>
      <div class="vc-to-name">${customerName || "Quý Khách Hàng"}</div>
    </div>

    <div>
      <div class="vc-svcs-label">Áp dụng cho dịch vụ</div>
      <div class="vc-svcs">
        ${(services||[]).map(s=>`<span class="vc-svc-tag">${s}</span>`).join("") || '<span class="vc-svc-tag">Tất cả dịch vụ</span>'}
      </div>
    </div>

    <div>
      <div class="vc-code-wrap">
        <div><div class="vc-code-label">Mã voucher</div><div class="vc-code-val">${code}</div></div>
        <svg width="52" height="52" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="52" height="52" rx="6" fill="${scheme.badge}"/>
          <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-size="28" fill="${scheme.accent}">🎁</text>
        </svg>
      </div>

      <div class="vc-meta">
        <div class="vc-meta-item"><div class="vc-meta-label">Ngày cấp</div><div class="vc-meta-val">${today}</div></div>
        <div class="vc-meta-item"><div class="vc-meta-label">Hạn sử dụng</div><div class="vc-meta-val">${expiryFmt}</div></div>
        ${issuedBy ? `<div class="vc-meta-item"><div class="vc-meta-label">Người cấp</div><div class="vc-meta-val">${issuedBy}</div></div>` : ""}
      </div>

      ${note
        ? `<div class="vc-note">* ${note}</div>`
        : isFixed
        ? `<div class="vc-note">* Voucher trị giá ${heroLabel} · Áp dụng 1 lần · Không quy đổi thành tiền mặt · Liên hệ ${COMPANY.phone} để đặt dịch vụ.</div>`
        : `<div class="vc-note">* Voucher chỉ áp dụng 1 lần · Không quy đổi thành tiền mặt · Liên hệ ${COMPANY.phone} để đặt dịch vụ.</div>`}
    </div>
  </div>
</div>

<div class="no-print" style="text-align:center;margin-top:16px;display:flex;gap:10px;justify-content:center;">
  <button onclick="window.print()" style="padding:9px 24px;background:#1e3a8a;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;">🖨 In Voucher</button>
  <button onclick="window.close()" style="padding:9px 20px;background:#f1f5f9;color:#475569;border:1px solid #e2e8f0;border-radius:8px;font-size:13px;cursor:pointer;">Đóng</button>
</div>
</body></html>`;
}

// ─────────────────────────────────────────────────────────────
// HỢP ĐỒNG & TÀI LIỆU HẬU HỢP ĐỒNG
// ─────────────────────────────────────────────────────────────

const CONTRACT_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'Be Vietnam Pro',Arial,sans-serif;font-size:13px;color:#1e293b;background:#fff;}
@page{size:A4;margin:20mm 18mm;}
@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact;}.no-print{display:none!important;}}
.page{max-width:720px;margin:0 auto;padding:28px;}
.header{text-align:center;margin-bottom:20px;padding-bottom:16px;border-bottom:2.5px solid #1e3a8a;}
.co-name{font-size:15px;font-weight:700;color:#1e3a8a;text-transform:uppercase;letter-spacing:.3px;}
.co-info{font-size:11px;color:#64748b;margin-top:4px;line-height:1.7;}
.doc-title{font-size:20px;font-weight:800;color:#1e3a8a;text-transform:uppercase;letter-spacing:1px;margin:18px 0 4px;}
.doc-sub{font-size:12px;color:#475569;margin-bottom:2px;}
.doc-num{font-size:12px;color:#94a3b8;}
.section{margin:16px 0;}
.section-title{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#1e3a8a;border-left:3px solid #1e3a8a;padding-left:8px;margin-bottom:10px;}
.party-box{background:#f0f4ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px 16px;margin-bottom:10px;}
.party-label{font-size:10px;font-weight:700;color:#1e3a8a;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;}
.party-row{display:flex;gap:6px;margin-bottom:3px;font-size:12.5px;line-height:1.5;}
.party-key{color:#64748b;min-width:110px;flex-shrink:0;}
.party-val{font-weight:500;color:#1e293b;}
table.items{width:100%;border-collapse:collapse;margin-bottom:12px;font-size:12px;}
table.items th{background:#f0f4ff;color:#1e3a8a;font-weight:600;padding:7px 10px;text-align:left;border-bottom:1px solid #bfdbfe;font-size:11px;text-transform:uppercase;}
table.items td{padding:7px 10px;border-bottom:0.5px solid #e2e8f0;vertical-align:top;}
table.items tr:last-child td{border-bottom:none;}
table.items .num{text-align:right;font-variant-numeric:tabular-nums;}
table.items .total-row td{font-weight:700;color:#1e3a8a;background:#f0f4ff;border-top:1px solid #bfdbfe;}
.terms p{font-size:12px;line-height:1.8;color:#334155;margin-bottom:6px;}
.terms li{font-size:12px;line-height:1.8;color:#334155;margin-left:16px;margin-bottom:3px;}
.sign-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:32px;}
.sign-box{text-align:center;}
.sign-title{font-size:12px;font-weight:700;text-transform:uppercase;color:#475569;margin-bottom:4px;}
.sign-name{font-size:11px;color:#94a3b8;}
.sign-space{height:60px;border-bottom:1px solid #cbd5e1;margin:8px 24px;}
.footer{margin-top:24px;padding-top:10px;border-top:0.5px solid #e2e8f0;display:flex;justify-content:space-between;font-size:10px;color:#94a3b8;}
.highlight-box{background:linear-gradient(135deg,#1e3a8a,#2563eb);border-radius:10px;padding:14px 18px;color:#fff;margin:12px 0;}
.hl-label{font-size:10px;opacity:.8;text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px;}
.hl-value{font-size:22px;font-weight:800;letter-spacing:-0.5px;}
.hl-sub{font-size:11px;opacity:.75;margin-top:2px;font-style:italic;}
.no-print-bar{position:fixed;bottom:0;left:0;right:0;background:#1e3a8a;padding:10px;display:flex;justify-content:center;gap:10px;z-index:999;}
`;

const printBase = (title, body, contractNo) => `<!DOCTYPE html><html lang="vi"><head>
<meta charset="UTF-8">
<base href="${typeof window!=="undefined"?window.location.origin+"/":""}">
<title>${title}</title>
<style>${CONTRACT_CSS}</style></head><body>
${body}
<div class="no-print-bar">
  <button onclick="window.print()" style="padding:9px 28px;background:#fff;color:#1e3a8a;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;">🖨 In / Lưu PDF</button>
  <button onclick="window.close()" style="padding:9px 20px;background:rgba(255,255,255,.15);color:#fff;border:1px solid rgba(255,255,255,.3);border-radius:8px;font-size:13px;cursor:pointer;">Đóng</button>
</div>
</body></html>`;

const fmtMoney = n => n ? Number(n).toLocaleString("vi-VN") : "0";
const fmtDate  = s => s ? new Date(s).toLocaleDateString("vi-VN") : "—";

// ── 1. Hợp đồng cung cấp dịch vụ Vé máy bay ──────────────
export function buildContractAirline({ order, contractNo, extraTerms, issuerName }) {
  const c       = order.customer || {};
  const pricing = order.pricing  || {};
  const pax     = order.pax      || {};
  const adultQty   = pax.adults   || order.adultQty   || 1;
  const child10Qty = pax.child10  || order.child10Qty  || 0;
  const infantQty  = pax.infant   || order.infantQty   || 0;
  const totalPax   = Number(adultQty) + Number(child10Qty) + Number(infantQty);
  const totalRev   = order.totalPrice || pricing.totalRevenue || 0;
  const depositAmt = order.depositAmount || Math.round(totalRev * 0.3);
  const finalAmt   = totalRev - depositAmt;
  const cNo        = contractNo || ("HĐMB-" + order.id);
  const today      = new Date().toLocaleDateString("vi-VN");
  const adultPrice   = pricing.adultPrice   || order.adultPrice   || (adultQty > 0 ? Math.round(totalRev / totalPax) : 0);
  const child10Price = pricing.child10Price  || order.child10Price  || 0;
  const infantPrice  = pricing.infantPrice   || order.infantPrice   || 0;

  const body = `<div class="page">
  <div class="header">
    ${coHeader()}
    <div class="doc-title">
      <div class="doc-type" style="font-size:16px">HỢP ĐỒNG CUNG CẤP</div>
      <div class="doc-type" style="font-size:16px">DỊCH VỤ VÉ MÁY BAY</div>
      <div class="doc-id">Số: ${cNo}</div>
      <div class="doc-date">Ngày ký: ${today}</div>
    </div>
  </div>

  <div style="font-size:12px;line-height:1.85;color:#334155;background:#f8fafc;border-radius:8px;padding:12px 16px;margin-bottom:14px">
    <em>Căn cứ Bộ luật Dân sự số 91/2015/QH13 ngày 24/11/2015; Căn cứ Luật Hàng không dân dụng Việt Nam số 66/2006/QH11;
    Căn cứ Luật Du lịch số 09/2017/QH14; Nghị định 168/2017/NĐ-CP quy định chi tiết một số điều của Luật Du lịch và các văn bản pháp luật hiện hành có liên quan.<br>
    Hôm nay, ngày ${today}, tại ${COMPANY.office}, hai bên gồm:</em>
  </div>

  <div class="section-title">BÊN A — ĐƠN VỊ CUNG CẤP DỊCH VỤ</div>
  <div style="background:#f0f4ff;border-radius:8px;padding:12px 16px;margin-bottom:12px;font-size:13px;line-height:1.9">
    Tên công ty: <strong>${COMPANY.fullName}</strong><br>
    Địa chỉ: ${COMPANY.address}<br>
    VPGD: ${COMPANY.office}<br>
    Điện thoại: ${COMPANY.phoneDH} &nbsp;|&nbsp; ${COMPANY.phoneVMB}<br>
    Email: ${COMPANY.email} &nbsp;|&nbsp; Website: ${COMPANY.website}<br>
    Mã số thuế: <strong>${COMPANY.taxCode}</strong><br>
    Đại diện: <strong>${issuerName || "……………………………………"}</strong> &nbsp;|&nbsp; Chức vụ: ………………………………
  </div>

  <div class="section-title">BÊN B — KHÁCH HÀNG</div>
  <div style="background:#f8fafc;border-radius:8px;padding:12px 16px;margin-bottom:14px;font-size:13px;line-height:1.9">
    ${corpCustomerLines(c)}
    ${c.companyName ? "Người đại diện" : "Họ và tên"}: <strong>${c.name || order.customerName || "……………………………………"}</strong><br>
    CCCD/CMND/Hộ chiếu: <strong>${c.cccd || order.customerCccd || "………………………"}</strong>
    &nbsp;|&nbsp; Ngày sinh: ${c.dob ? new Date(c.dob).toLocaleDateString("vi-VN") : "…………………………"}<br>
    Điện thoại: <strong>${c.phone || order.customerPhone || "………………………"}</strong>
    &nbsp;|&nbsp; Email: ${c.email || order.customerEmail || "……………………………………"}<br>
    Địa chỉ thường trú: ${c.address || c.province || order.customerAddress || "……………………………………………………………"}
  </div>

  <div style="font-size:12px;color:#334155;margin-bottom:14px">
    Hai bên thống nhất ký kết hợp đồng cung cấp dịch vụ vé máy bay với các điều khoản và điều kiện sau:
  </div>

  <div class="section-title">ĐIỀU 1. THÔNG TIN HÀNH TRÌNH VÀ GIÁ VÉ</div>
  <table class="items">
    <thead>
      <tr>
        <th>Hành trình</th>
        <th style="text-align:center">Ngày bay</th>
        <th style="text-align:center">Đối tượng</th>
        <th style="text-align:center">Số lượng</th>
        <th style="text-align:right">Đơn giá (đ)</th>
        <th style="text-align:right">Thành tiền (đ)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td rowspan="${(child10Qty>0?1:0)+(infantQty>0?1:0)+1}" style="font-weight:600">${order.tourName || order.serviceName || "………………………………………"}</td>
        <td style="text-align:center" rowspan="${(child10Qty>0?1:0)+(infantQty>0?1:0)+1}">${fmtDate(order.departDate)}</td>
        <td style="text-align:center">Người lớn (≥12 tuổi)</td>
        <td style="text-align:center">${adultQty}</td>
        <td style="text-align:right">${fmtMoney(adultPrice)}</td>
        <td style="text-align:right;font-weight:600">${fmtMoney(Number(adultQty)*adultPrice)}</td>
      </tr>
      ${Number(child10Qty)>0 ? `<tr>
        <td style="text-align:center">Trẻ em (2–12 tuổi)</td>
        <td style="text-align:center">${child10Qty}</td>
        <td style="text-align:right">${fmtMoney(child10Price)}</td>
        <td style="text-align:right;font-weight:600">${fmtMoney(Number(child10Qty)*child10Price)}</td>
      </tr>` : ""}
      ${Number(infantQty)>0 ? `<tr>
        <td style="text-align:center">Em bé (&lt;2 tuổi, không ghế)</td>
        <td style="text-align:center">${infantQty}</td>
        <td style="text-align:right">${fmtMoney(infantPrice)}</td>
        <td style="text-align:right;font-weight:600">${fmtMoney(Number(infantQty)*infantPrice)}</td>
      </tr>` : ""}
      <tr class="total-row">
        <td colspan="5" style="text-align:right">TỔNG GIÁ TRỊ HỢP ĐỒNG</td>
        <td style="text-align:right;color:#1e3a8a;font-size:15px">${fmtMoney(totalRev)} đ</td>
      </tr>
    </tbody>
  </table>
  <div style="font-size:12px;color:#64748b;font-style:italic;margin-bottom:4px">
    Bằng chữ: <em>${soThanhChu(totalRev)}</em>
  </div>
  <div style="font-size:11.5px;color:#64748b;margin-bottom:14px">
    ⚠ Giá vé đã bao gồm: thuế, phí sân bay, phí an ninh hàng không. <strong>Không bao gồm:</strong> phí hành lý ký gửi, phí chọn chỗ ngồi, bữa ăn trên máy bay (trừ khi có ghi chú), các khoản phụ thu phát sinh theo quy định của hãng hàng không.
  </div>

  <div class="section-title">ĐIỀU 2. PHƯƠNG THỨC THANH TOÁN</div>
  <table class="items">
    <thead><tr><th>Đợt</th><th>Nội dung</th><th style="text-align:right">Số tiền (đ)</th><th>Hạn thanh toán</th></tr></thead>
    <tbody>
      <tr>
        <td><strong>Đợt 1</strong></td>
        <td>Đặt cọc (${totalRev>0?Math.round(depositAmt/totalRev*100):30}% giá trị HĐ)</td>
        <td style="text-align:right;font-weight:700;color:#1e3a8a">${fmtMoney(depositAmt)} đ</td>
        <td>Ngay khi ký hợp đồng</td>
      </tr>
      <tr>
        <td><strong>Đợt 2</strong></td>
        <td>Thanh toán phần còn lại (${totalRev>0?Math.round(finalAmt/totalRev*100):70}%)</td>
        <td style="text-align:right;font-weight:700;color:#1e3a8a">${fmtMoney(finalAmt)} đ</td>
        <td>Trước ngày bay <strong>tối thiểu 03 ngày làm việc</strong></td>
      </tr>
    </tbody>
    <tfoot>
      <tr class="total-row"><td colspan="2" style="text-align:right">Tổng cộng</td><td style="text-align:right">${fmtMoney(totalRev)} đ</td><td></td></tr>
    </tfoot>
  </table>
  <div style="font-size:12px;color:#334155;line-height:1.8;margin-bottom:14px">
    <strong>Hình thức thanh toán:</strong> Chuyển khoản ngân hàng hoặc tiền mặt tại văn phòng công ty.<br>
    <strong>Nội dung chuyển khoản:</strong> <em>[Họ tên Bên B] – ${order.id} – Dat coc ve may bay</em><br>
    Sau khi chuyển khoản, Bên B vui lòng chụp ảnh biên lai và gửi xác nhận về số điện thoại: <strong>${COMPANY.phoneDH}</strong> (Zalo/Viber).
  </div>

  <div class="section-title">ĐIỀU 3. NGHĨA VỤ CỦA BÊN A</div>
  <div style="font-size:12.5px;line-height:1.9;color:#334155;margin-bottom:12px">
    3.1. Đặt vé máy bay đúng theo thông tin do Bên B cung cấp, đảm bảo vé chính hãng, hợp lệ.<br>
    3.2. Gửi mã đặt chỗ (PNR/booking code) cho Bên B trong vòng 24 giờ sau khi thanh toán đặt cọc.<br>
    3.3. Hỗ trợ Bên B các thủ tục đổi, hủy vé theo đúng chính sách của hãng hàng không tương ứng.<br>
    3.4. Thông báo kịp thời cho Bên B nếu có thay đổi lịch bay do hãng hàng không điều chỉnh.<br>
    3.5. Cấp hóa đơn/chứng từ hợp lệ theo yêu cầu của Bên B trong vòng 07 ngày làm việc kể từ khi thanh toán đủ.
  </div>

  <div class="section-title">ĐIỀU 4. NGHĨA VỤ CỦA BÊN B</div>
  <div style="font-size:12.5px;line-height:1.9;color:#334155;margin-bottom:12px">
    4.1. Cung cấp đầy đủ và chính xác thông tin cá nhân: họ tên (đúng hộ chiếu/CCCD), ngày sinh, số giấy tờ tùy thân trước khi đặt vé. Bên A không chịu trách nhiệm với các sai sót do Bên B cung cấp thông tin sai.<br>
    4.2. Thanh toán đúng hạn theo lịch trình thanh toán tại Điều 2.<br>
    4.3. Chủ động kiểm tra giờ bay, cổng ra tàu và thực hiện check-in trực tuyến (nếu hãng yêu cầu) ít nhất 24 giờ trước giờ cất cánh.<br>
    4.4. Tự chịu trách nhiệm về thị thực nhập cảnh (visa), hộ chiếu còn hiệu lực ít nhất 06 tháng, và các quy định hải quan của nước đến.<br>
    4.5. Có mặt tại sân bay trước giờ cất cánh ít nhất 02 giờ (nội địa) hoặc 03 giờ (quốc tế).
  </div>

  <div class="section-title">ĐIỀU 5. CHÍNH SÁCH HỦY, ĐỔI VÉ</div>
  <div style="font-size:12.5px;line-height:1.9;color:#334155;margin-bottom:6px">
    5.1. Chính sách hủy/đổi vé tuân theo quy định của từng hãng hàng không tương ứng. Bên A sẽ thông báo chi tiết cho Bên B khi phát sinh nhu cầu.<br>
    5.2. Phí dịch vụ xử lý hủy/đổi vé của Bên A: <strong>150.000đ – 300.000đ/giao dịch</strong> (tùy mức độ phức tạp), chưa bao gồm phí hủy/đổi của hãng.<br>
    5.3. Vé đã xuất (issued): Phần hoàn tiền (nếu có) được thực hiện sau khi hãng hàng không xử lý hoàn, thường trong vòng <strong>30–90 ngày</strong> theo chính sách hãng.<br>
    5.4. Trường hợp bất khả kháng (thiên tai, dịch bệnh, chiến tranh, quyết định của cơ quan nhà nước): Hai bên thỏa thuận giải quyết trên tinh thần hợp tác, ưu tiên đổi ngày bay hoặc hoàn tiền theo chính sách hãng.
  </div>

  <div class="section-title">ĐIỀU 6. GIẢI QUYẾT TRANH CHẤP</div>
  <div style="font-size:12.5px;line-height:1.9;color:#334155;margin-bottom:14px">
    6.1. Hợp đồng có hiệu lực kể từ ngày ký và kết thúc khi các bên hoàn thành đầy đủ nghĩa vụ.<br>
    6.2. Mọi sửa đổi, bổ sung hợp đồng phải được lập thành văn bản, có chữ ký của cả hai bên.<br>
    6.3. Hai bên cam kết giải quyết tranh chấp phát sinh thông qua thương lượng, hòa giải. Nếu không đạt được thỏa thuận, đưa ra Tòa án nhân dân có thẩm quyền tại thành phố Hải Phòng để giải quyết theo quy định pháp luật Việt Nam.<br>
    6.4. Hợp đồng được lập thành <strong>02 bản</strong> bằng tiếng Việt, có giá trị pháp lý như nhau, mỗi bên giữ <strong>01 bản</strong>.<br>
    ${extraTerms ? `6.5. ${extraTerms}` : ""}
  </div>

  <div class="sign-row" style="grid-template-columns:1fr 1fr;margin-top:20px">
    <div class="sign-box">
      <div class="sign-title">BÊN B — KHÁCH HÀNG<br><span style="font-weight:400;font-size:10px">(Ký, ghi rõ họ tên)</span></div>
      <div class="sign-name" style="margin-top:60px">${c.name || order.customerName || "……………………………"}</div>
    </div>
    <div class="sign-box">
      <div class="sign-title">BÊN A — ĐẠI DIỆN CÔNG TY<br><span style="font-weight:400;font-size:10px">(Ký, đóng dấu)</span></div>
      <div class="sign-name" style="margin-top:60px">${issuerName || "……………………………"}</div>
    </div>
  </div>

  <div class="footer">
    <span>HĐ số: ${cNo} · MST: ${COMPANY.taxCode} · ${COMPANY.website}</span>
    <span>In lúc: ${new Date().toLocaleString("vi-VN")}</span>
  </div>
</div>`;

  return printBase(`Hợp đồng vé máy bay – ${order.id}`, body, cNo);
}

export function buildContractTour({ order, contractNo, extraTerms, issuerName }) {
  const c       = order.customer || {};
  const pricing = order.pricing  || {};
  const pax     = order.pax      || {};
  const adultQty   = pax.adults   || order.adultQty   || 1;
  const child10Qty = pax.child10  || order.child10Qty  || 0;
  const child5Qty  = pax.child5   || order.child5Qty   || 0;
  const infantQty  = pax.infant   || order.infantQty   || 0;
  const totalPax   = Number(adultQty)+Number(child10Qty)+Number(child5Qty)+Number(infantQty);
  const totalRev   = order.totalPrice || pricing.totalRevenue || 0;
  const depositAmt = order.depositAmount || Math.round(totalRev * 0.3);
  const finalAmt   = totalRev - depositAmt;
  const cNo        = contractNo || ("HĐTOUR-" + order.id);
  const today      = new Date().toLocaleDateString("vi-VN");
  const nights     = (order.departDate && order.returnDate)
    ? Math.max(1, Math.round((new Date(order.returnDate)-new Date(order.departDate))/86400000)) : 0;
  const adultPrice   = pricing.adultPrice   || order.adultPrice   || 0;
  const child10Price = pricing.child10Price  || order.child10Price  || 0;
  const child5Price  = pricing.child5Price   || order.child5Price   || 0;
  const infantPrice  = pricing.infantPrice   || order.infantPrice   || 0;

  const body = `<div class="page">
  <div class="header">
    ${coHeader()}
    <div class="doc-title">
      <div class="doc-type" style="font-size:16px">HỢP ĐỒNG LỮ HÀNH</div>
      <div class="doc-type" style="font-size:13px;color:#059669">CUNG CẤP DỊCH VỤ DU LỊCH TRỌN GÓI</div>
      <div class="doc-id">Số: ${cNo}</div>
      <div class="doc-date">Ngày ký: ${today}</div>
    </div>
  </div>

  <div style="font-size:12px;line-height:1.85;color:#334155;background:#f0fdf4;border-radius:8px;padding:12px 16px;margin-bottom:14px;border-left:3px solid #059669">
    <em>Căn cứ Bộ luật Dân sự số 91/2015/QH13; Luật Du lịch số 09/2017/QH14; Nghị định 168/2017/NĐ-CP quy định chi tiết một số điều của Luật Du lịch; Thông tư 13/2019/TT-BVHTTDL về quản lý hoạt động kinh doanh lữ hành và các văn bản pháp luật có liên quan hiện hành.
    Hôm nay, ngày ${today}, tại ${COMPANY.office}, chúng tôi gồm:</em>
  </div>

  <div class="section-title">BÊN A — ĐƠN VỊ KINH DOANH LỮ HÀNH</div>
  <div style="background:#f0f4ff;border-radius:8px;padding:12px 16px;margin-bottom:12px;font-size:13px;line-height:2">
    Tên công ty: <strong>${COMPANY.fullName}</strong><br>
    Địa chỉ đăng ký: ${COMPANY.address}<br>
    Văn phòng giao dịch: ${COMPANY.office}<br>
    Điện thoại: ${COMPANY.phoneDH} &nbsp;|&nbsp; ${COMPANY.phoneVMB} &nbsp;|&nbsp; Email: ${COMPANY.email}<br>
    Mã số thuế: <strong>${COMPANY.taxCode}</strong> &nbsp;|&nbsp; Giấy phép kinh doanh lữ hành: ………………………………<br>
    Đại diện: <strong>${issuerName || "……………………………………"}</strong> &nbsp;|&nbsp; Chức vụ: Sale / Điều hành
  </div>

  <div class="section-title">BÊN B — KHÁCH HÀNG (TRƯỞNG ĐOÀN)</div>
  <div style="background:#f8fafc;border-radius:8px;padding:12px 16px;margin-bottom:14px;font-size:13px;line-height:2">
    ${corpCustomerLines(c)}
    ${c.companyName ? "Người đại diện" : "Họ và tên"}: <strong>${c.name || order.customerName || "……………………………………"}</strong><br>
    CCCD/CMND/Hộ chiếu số: <strong>${c.cccd || order.customerCccd || "………………………"}</strong>
    &nbsp;|&nbsp; Ngày cấp: ………………… &nbsp;|&nbsp; Nơi cấp: …………………………<br>
    Ngày sinh: ${c.dob ? new Date(c.dob).toLocaleDateString("vi-VN") : "……………………"}
    &nbsp;|&nbsp; Giới tính: ………………………<br>
    Điện thoại: <strong>${c.phone || order.customerPhone || "………………………"}</strong>
    &nbsp;|&nbsp; Email: ${c.email || order.customerEmail || "……………………………………"}<br>
    Địa chỉ thường trú: ${c.address || c.province || order.customerAddress || "…………………………………………………………………………"}
  </div>

  <div style="font-size:12px;color:#334155;margin-bottom:14px">
    Hai bên thống nhất ký kết hợp đồng lữ hành theo đúng quy định của Luật Du lịch 2017 với nội dung cụ thể như sau:
  </div>

  <div class="section-title">ĐIỀU 1. CHƯƠNG TRÌNH TOUR VÀ DỊCH VỤ</div>
  <table class="items" style="margin-bottom:8px">
    <tbody>
      <tr><td style="width:160px;color:#94a3b8;font-size:11px;text-transform:uppercase;font-weight:600">Tên chương trình</td><td><strong style="font-size:14px;color:#1e3a8a">${order.tourName || order.serviceName || "……………………………………………"}</strong></td></tr>
      <tr><td style="color:#94a3b8;font-size:11px;text-transform:uppercase;font-weight:600">Mã đơn hàng</td><td><strong>${order.id}</strong></td></tr>
      <tr><td style="color:#94a3b8;font-size:11px;text-transform:uppercase;font-weight:600">Ngày khởi hành</td><td><strong>${fmtDate(order.departDate)}</strong></td></tr>
      <tr><td style="color:#94a3b8;font-size:11px;text-transform:uppercase;font-weight:600">Ngày kết thúc</td><td><strong>${fmtDate(order.returnDate)}</strong></td></tr>
      <tr><td style="color:#94a3b8;font-size:11px;text-transform:uppercase;font-weight:600">Thời gian</td><td><strong>${nights > 0 ? `${nights} ngày ${nights-1} đêm` : "…… ngày …… đêm"}</strong></td></tr>
      <tr><td style="color:#94a3b8;font-size:11px;text-transform:uppercase;font-weight:600">Điểm khởi hành</td><td>${order.departFrom || "Hải Phòng"}</td></tr>
      <tr><td style="color:#94a3b8;font-size:11px;text-transform:uppercase;font-weight:600">Điểm đến</td><td>${order.destination || "Theo lịch trình"}</td></tr>
      <tr><td style="color:#94a3b8;font-size:11px;text-transform:uppercase;font-weight:600">Phương tiện</td><td>${order.vehicle || "Xe ô tô / Máy bay theo chương trình"}</td></tr>
      <tr><td style="color:#94a3b8;font-size:11px;text-transform:uppercase;font-weight:600">Số khách</td><td><strong>${totalPax} người</strong> (${adultQty} NL${Number(child10Qty)>0?", "+child10Qty+" TE 10-18t":""}${Number(child5Qty)>0?", "+child5Qty+" TE 5-10t":""}${Number(infantQty)>0?", "+infantQty+" em bé":""})</td></tr>
      <tr><td style="color:#94a3b8;font-size:11px;text-transform:uppercase;font-weight:600">Hướng dẫn viên</td><td>${order.hdvName || "Bố trí bởi Bên A"}</td></tr>
    </tbody>
  </table>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">
    <div>
      <div style="font-size:11px;font-weight:700;color:#059669;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;border-left:3px solid #059669;padding-left:8px">✓ DỊCH VỤ BAO GỒM</div>
      <div style="font-size:12px;line-height:1.85;color:#334155">
        • Vận chuyển đưa đón theo chương trình (xe đời mới, điều hòa)<br>
        • Khách sạn tiêu chuẩn theo chương trình (02 người/phòng)<br>
        • Bữa ăn theo chương trình (Sáng/Trưa/Tối theo lịch)<br>
        • Hướng dẫn viên tiếng Việt kinh nghiệm<br>
        • Vé tham quan các điểm trong chương trình<br>
        • Bảo hiểm du lịch (hạn mức 50 triệu đ/người)<br>
        • Nước uống trên xe (02 chai/người/ngày)<br>
        • Chi phí điều hành, quản lý đoàn
      </div>
    </div>
    <div>
      <div style="font-size:11px;font-weight:700;color:#dc2626;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;border-left:3px solid #dc2626;padding-left:8px">✗ KHÔNG BAO GỒM</div>
      <div style="font-size:12px;line-height:1.85;color:#334155">
        • Chi phí cá nhân: điện thoại, giặt ủi, dịch vụ phòng<br>
        • Đồ uống, ăn uống ngoài chương trình<br>
        • Visa, phí nhập cảnh (nếu đi nước ngoài)<br>
        • Phụ thu phòng đơn (nếu có nhu cầu)<br>
        • Tiền tip cho HDV, lái xe (tự nguyện)<br>
        • Chi phí phát sinh do trễ/hủy chuyến bay<br>
        • Dịch vụ tự chọn thêm ngoài chương trình<br>
        • Thuế VAT (nếu khách có yêu cầu xuất hóa đơn)
      </div>
    </div>
  </div>

  <div class="section-title">ĐIỀU 2. GIÁ DỊCH VỤ VÀ PHƯƠNG THỨC THANH TOÁN</div>
  <table class="items">
    <thead>
      <tr><th>Đối tượng</th><th style="text-align:center">Số lượng</th><th style="text-align:right">Đơn giá (đ/người)</th><th style="text-align:right">Thành tiền (đ)</th></tr>
    </thead>
    <tbody>
      <tr><td>Người lớn (≥18 tuổi)</td><td style="text-align:center">${adultQty}</td><td style="text-align:right">${fmtMoney(adultPrice)}</td><td style="text-align:right;font-weight:600">${fmtMoney(Number(adultQty)*adultPrice)}</td></tr>
      ${Number(child10Qty)>0?`<tr><td>Trẻ em (10–18 tuổi, tính 70% giá)</td><td style="text-align:center">${child10Qty}</td><td style="text-align:right">${fmtMoney(child10Price)}</td><td style="text-align:right;font-weight:600">${fmtMoney(Number(child10Qty)*child10Price)}</td></tr>`:""}
      ${Number(child5Qty)>0?`<tr><td>Trẻ em (5–10 tuổi, tính 50% giá)</td><td style="text-align:center">${child5Qty}</td><td style="text-align:right">${fmtMoney(child5Price)}</td><td style="text-align:right;font-weight:600">${fmtMoney(Number(child5Qty)*child5Price)}</td></tr>`:""}
      ${Number(infantQty)>0?`<tr><td>Em bé (&lt;5 tuổi, không tính ghế)</td><td style="text-align:center">${infantQty}</td><td style="text-align:right">${fmtMoney(infantPrice)}</td><td style="text-align:right;font-weight:600">${fmtMoney(Number(infantQty)*infantPrice)}</td></tr>`:""}
      <tr class="total-row"><td colspan="3" style="text-align:right">TỔNG GIÁ TRỊ HỢP ĐỒNG</td><td style="text-align:right;color:#1e3a8a;font-size:15px">${fmtMoney(totalRev)} đ</td></tr>
    </tbody>
  </table>
  <div style="font-size:12px;color:#64748b;font-style:italic;margin-bottom:8px">Bằng chữ: <em>${soThanhChu(totalRev)}</em></div>

  <table class="items" style="margin-bottom:8px">
    <thead><tr><th>Đợt thanh toán</th><th>Nội dung</th><th style="text-align:right">Số tiền (đ)</th><th>Hạn chót</th></tr></thead>
    <tbody>
      <tr><td><strong>Đợt 1 — Đặt cọc</strong></td><td>${totalRev>0?Math.round(depositAmt/totalRev*100):30}% giá trị HĐ</td><td style="text-align:right;font-weight:700;color:#1e3a8a">${fmtMoney(depositAmt)} đ</td><td>Ngay khi ký hợp đồng</td></tr>
      <tr><td><strong>Đợt 2 — Thanh toán đủ</strong></td><td>Phần còn lại (${totalRev>0?Math.round(finalAmt/totalRev*100):70}%)</td><td style="text-align:right;font-weight:700;color:#1e3a8a">${fmtMoney(finalAmt)} đ</td><td>Trước khởi hành <strong>07 ngày</strong></td></tr>
    </tbody>
    <tfoot><tr class="total-row"><td colspan="2" style="text-align:right">Tổng cộng</td><td style="text-align:right">${fmtMoney(totalRev)} đ</td><td></td></tr></tfoot>
  </table>
  <div style="font-size:12px;color:#334155;margin-bottom:14px;line-height:1.8">
    <strong>Hình thức:</strong> Chuyển khoản hoặc tiền mặt tại văn phòng.<br>
    <strong>Nội dung CK:</strong> <em>[Họ tên] – ${order.id} – Dat coc tour</em> &nbsp;|&nbsp; <strong>ĐT xác nhận:</strong> ${COMPANY.phoneDH}
  </div>

  <div class="section-title">ĐIỀU 3. QUYỀN VÀ NGHĨA VỤ BÊN A</div>
  <div style="font-size:12.5px;line-height:1.9;color:#334155;margin-bottom:12px">
    3.1. Tổ chức tour đúng chương trình đã thỏa thuận, đảm bảo chất lượng dịch vụ.<br>
    3.2. Bố trí HDV kinh nghiệm, nhiệt tình; phương tiện vận chuyển đạt tiêu chuẩn an toàn.<br>
    3.3. Thông báo cho Bên B ít nhất <strong>48 giờ</strong> trước khởi hành về điểm tập trung, giờ giấc, HDV phụ trách.<br>
    3.4. Trong trường hợp bất khả kháng phải điều chỉnh chương trình, Bên A bố trí dịch vụ thay thế tương đương hoặc hoàn tiền phần dịch vụ không thực hiện được.<br>
    3.5. Mua bảo hiểm du lịch cho toàn bộ khách trong đoàn theo quy định pháp luật.<br>
    3.6. Cấp phiếu xác nhận dịch vụ, hóa đơn/chứng từ hợp lệ theo yêu cầu của Bên B.
  </div>

  <div class="section-title">ĐIỀU 4. QUYỀN VÀ NGHĨA VỤ BÊN B</div>
  <div style="font-size:12.5px;line-height:1.9;color:#334155;margin-bottom:12px">
    4.1. Thanh toán đúng hạn và đúng số tiền theo Điều 2.<br>
    4.2. Cung cấp đầy đủ thông tin cá nhân (họ tên đầy đủ theo CCCD/Hộ chiếu, ngày sinh, số CCCD/HC, SĐT) của tất cả thành viên trong đoàn trước ngày khởi hành <strong>ít nhất 72 giờ</strong>.<br>
    4.3. Mang theo CCCD/Hộ chiếu bản gốc còn hiệu lực trong suốt chuyến đi. Hộ chiếu phải còn hiệu lực ít nhất <strong>06 tháng</strong> kể từ ngày nhập cảnh (tour quốc tế).<br>
    4.4. Tự chịu trách nhiệm xin thị thực (visa) trước ngày khởi hành đối với tour nước ngoài yêu cầu visa.<br>
    4.5. Tuân thủ nội quy, lịch trình của đoàn và hướng dẫn của HDV. Có mặt đúng giờ tại điểm tập trung.<br>
    4.6. Tôn trọng văn hóa, phong tục tập quán địa phương nơi đến; không mang theo vật phẩm cấm.
  </div>

  <div class="section-title">ĐIỀU 5. CHÍNH SÁCH HỦY TOUR VÀ HOÀN TIỀN</div>
  <table class="items">
    <thead><tr><th>Thời điểm hủy (trước ngày khởi hành)</th><th style="text-align:center">Phí hủy</th><th>Ghi chú</th></tr></thead>
    <tbody>
      <tr><td>Từ <strong>30 ngày</strong> trở lên</td><td style="text-align:center;color:#059669;font-weight:600">Hoàn 100% tiền cọc</td><td style="font-size:11px;color:#64748b">Trừ phí chuyển khoản (nếu có)</td></tr>
      <tr><td>Từ <strong>15 đến 29 ngày</strong></td><td style="text-align:center;color:#d97706;font-weight:600">Phí hủy 30% giá trị HĐ</td><td style="font-size:11px;color:#64748b">Hoàn 70% còn lại</td></tr>
      <tr><td>Từ <strong>8 đến 14 ngày</strong></td><td style="text-align:center;color:#d97706;font-weight:600">Phí hủy 50% giá trị HĐ</td><td style="font-size:11px;color:#64748b">Hoàn 50% còn lại</td></tr>
      <tr><td>Từ <strong>4 đến 7 ngày</strong></td><td style="text-align:center;color:#dc2626;font-weight:600">Phí hủy 70% giá trị HĐ</td><td style="font-size:11px;color:#64748b">Hoàn 30% còn lại</td></tr>
      <tr><td>Từ <strong>1 đến 3 ngày</strong></td><td style="text-align:center;color:#dc2626;font-weight:600">Phí hủy 90% giá trị HĐ</td><td style="font-size:11px;color:#64748b">Hoàn 10% còn lại</td></tr>
      <tr><td><strong>Trong ngày khởi hành / Không báo</strong></td><td style="text-align:center;color:#dc2626;font-weight:700">Mất toàn bộ 100%</td><td style="font-size:11px;color:#64748b">Không hoàn</td></tr>
      <tr><td>Bất khả kháng (có xác nhận cơ quan chức năng)</td><td style="text-align:center;color:#7c3aed;font-weight:600">Hai bên thỏa thuận</td><td style="font-size:11px;color:#64748b">Ưu tiên đổi ngày</td></tr>
    </tbody>
  </table>
  <div style="font-size:11.5px;color:#64748b;margin-bottom:12px">⚠ Mọi yêu cầu hủy tour phải thông báo bằng văn bản (Zalo/email/fax) và được Bên A xác nhận. Thời điểm tính phí hủy là thời điểm Bên A nhận được thông báo.</div>

  <div class="section-title">ĐIỀU 6. TRÁCH NHIỆM VÀ GIẢI QUYẾT TRANH CHẤP</div>
  <div style="font-size:12.5px;line-height:1.9;color:#334155;margin-bottom:14px">
    6.1. Bên A không chịu trách nhiệm đối với thiệt hại do bất khả kháng: thiên tai, bão lụt, dịch bệnh, quyết định của cơ quan nhà nước, hoặc sự cố nằm ngoài tầm kiểm soát hợp lý của Bên A.<br>
    6.2. Bên A chịu trách nhiệm bồi thường thiệt hại trực tiếp phát sinh do lỗi của Bên A, giới hạn ở mức <strong>tương đương giá trị hợp đồng</strong>.<br>
    6.3. Bên B tự chịu trách nhiệm về tài sản cá nhân, sức khỏe trong suốt chuyến đi.<br>
    6.4. Mọi khiếu nại phải được gửi bằng văn bản trong vòng <strong>30 ngày</strong> kể từ ngày kết thúc tour.<br>
    6.5. Tranh chấp ưu tiên giải quyết bằng thương lượng, hòa giải. Nếu không thành, đưa ra <strong>Tòa án nhân dân thành phố Hải Phòng</strong> theo quy định pháp luật Việt Nam.<br>
    6.6. Hợp đồng có hiệu lực kể từ ngày ký, lập thành <strong>02 bản</strong> tiếng Việt có giá trị pháp lý ngang nhau, mỗi bên giữ <strong>01 bản</strong>.<br>
    ${extraTerms ? `6.7. ${extraTerms}` : ""}
  </div>

  <div class="sign-row" style="grid-template-columns:1fr 1fr;margin-top:20px">
    <div class="sign-box">
      <div class="sign-title">BÊN B — KHÁCH HÀNG<br><span style="font-weight:400;font-size:10px">(Ký, ghi rõ họ tên)</span></div>
      <div class="sign-name" style="margin-top:64px">${c.name || order.customerName || "……………………………"}</div>
    </div>
    <div class="sign-box">
      <div class="sign-title">BÊN A — ĐẠI DIỆN CÔNG TY<br><span style="font-weight:400;font-size:10px">(Ký tên, đóng dấu)</span></div>
      <div class="sign-name" style="margin-top:64px">${issuerName || "……………………………"}</div>
    </div>
  </div>

  <div class="footer">
    <span>HĐ số: ${cNo} · Giấy phép lữ hành: ………… · MST: ${COMPANY.taxCode}</span>
    <span>In lúc: ${new Date().toLocaleString("vi-VN")}</span>
  </div>
</div>`;

  return printBase(`Hợp đồng tour – ${order.id}`, body, cNo);
}

export function buildCostStatement({ order, items, contractNo, issuerName }) {
  const rows     = (items || []);
  const c        = order.customer || {};
  const totalRev = order.totalPrice || order.pricing?.totalRevenue || 0;
  const today    = new Date().toLocaleDateString("vi-VN");

  // Phân loại chi phí theo nhóm
  const CAT_LABEL = {
    transport:"Vận chuyển", hotel:"Lưu trú / Khách sạn",
    meals:"Ăn uống", entrance:"Vé tham quan",
    hdv_fee:"Thù lao HDV", tip:"Tiền tip",
    insurance:"Bảo hiểm", other:"Khác",
  };
  const grouped = {};
  rows.forEach(r => {
    const cat = r.category || r.budgetLine || "other";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(r);
  });
  const total      = rows.reduce((s,r) => s+(Number(r.amount)||0), 0);
  const profit     = totalRev - total;
  const profitPct  = totalRev > 0 ? (profit/totalRev*100).toFixed(1) : 0;

  const body = `<div class="page">
  <div class="header">
    ${coHeader()}
    <div class="doc-title">
      <div class="doc-type" style="font-size:15px">BẢNG KÊ CHI PHÍ</div>
      <div class="doc-type" style="font-size:12px;color:#7c3aed">QUYẾT TOÁN DỊCH VỤ DU LỊCH</div>
      <div class="doc-id">Đơn: ${order.id}</div>
      <div class="doc-date">Ngày lập: ${today}</div>
    </div>
  </div>

  <!-- Thông tin đơn hàng -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;background:#f8fafc;border-radius:10px;padding:14px 18px;margin-bottom:14px;font-size:13px;line-height:1.9">
    <div>
      <span style="font-size:10px;color:#94a3b8;text-transform:uppercase;font-weight:600">Dịch vụ / Tour</span><br>
      <strong style="color:#1e3a8a">${order.tourName || order.serviceName || "—"}</strong>
    </div>
    <div>
      <span style="font-size:10px;color:#94a3b8;text-transform:uppercase;font-weight:600">Mã đơn hàng</span><br>
      <strong>${order.id}</strong>
    </div>
    <div>
      <span style="font-size:10px;color:#94a3b8;text-transform:uppercase;font-weight:600">Khách hàng</span><br>
      <strong>${c.name || order.customerName || "—"}</strong> · ${c.phone || order.customerPhone || "—"}
    </div>
    <div>
      <span style="font-size:10px;color:#94a3b8;text-transform:uppercase;font-weight:600">Thời gian</span><br>
      ${fmtDate(order.departDate)} → ${fmtDate(order.returnDate)}
    </div>
    <div>
      <span style="font-size:10px;color:#94a3b8;text-transform:uppercase;font-weight:600">Người lập</span><br>
      ${issuerName || "—"}
    </div>
    <div>
      <span style="font-size:10px;color:#94a3b8;text-transform:uppercase;font-weight:600">HĐ liên quan</span><br>
      ${contractNo || "—"}
    </div>
  </div>

  <!-- Bảng chi phí chi tiết -->
  <div class="section-title">BẢNG KÊ CHI PHÍ PHÁT SINH CHI TIẾT</div>
  <table class="items">
    <thead>
      <tr>
        <th style="width:32px;text-align:center">STT</th>
        <th>Khoản mục chi phí</th>
        <th style="text-align:center;width:50px">SL</th>
        <th style="text-align:center;width:55px">ĐV</th>
        <th style="text-align:right;width:110px">Đơn giá (đ)</th>
        <th style="text-align:right;width:110px">Thành tiền (đ)</th>
        <th style="width:100px">NCC / Ghi chú</th>
      </tr>
    </thead>
    <tbody>
      ${rows.length > 0 ? rows.map((r,i) => `
      <tr>
        <td style="text-align:center">${i+1}</td>
        <td>
          <strong>${r.name || r.ncc || "—"}</strong>
          ${r.ncc && r.ncc !== r.name ? `<br><span style="font-size:11px;color:#64748b">NCC: ${r.ncc}</span>` : ""}
          ${r.note ? `<br><span style="font-size:10.5px;color:#94a3b8">${r.note}</span>` : ""}
        </td>
        <td style="text-align:center">${r.qty || 1}</td>
        <td style="text-align:center">${r.unit || "lần"}</td>
        <td style="text-align:right">${fmtMoney(r.unitPrice || r.amount)}</td>
        <td style="text-align:right;font-weight:600">${fmtMoney(r.amount)}</td>
        <td style="font-size:11px;color:#64748b">${r.ncc || r.supplier || ""}</td>
      </tr>`).join("")
      : `<tr><td colspan="7" style="text-align:center;color:#94a3b8;padding:24px">Chưa có chi phí phát sinh</td></tr>`}
    </tbody>
    <tfoot>
      <tr class="total-row">
        <td colspan="5" style="text-align:right">TỔNG CHI PHÍ PHÁT SINH</td>
        <td style="text-align:right;font-size:15px;color:#7c3aed">${fmtMoney(total)} đ</td>
        <td></td>
      </tr>
    </tfoot>
  </table>
  <div style="font-size:12px;color:#64748b;font-style:italic;margin-bottom:14px">
    Bằng chữ: <em>${soThanhChu(total)}</em>
  </div>

  <!-- Tổng kết lợi nhuận -->
  <div class="section-title">TỔNG KẾT DOANH THU — CHI PHÍ — LỢI NHUẬN</div>
  <table class="items" style="margin-bottom:14px">
    <tbody>
      <tr style="background:#eff6ff">
        <td style="font-weight:600">💰 Doanh thu (giá bán khách)</td>
        <td style="text-align:right;font-weight:700;color:#1e3a8a;font-size:14px">${fmtMoney(totalRev)} đ</td>
      </tr>
      <tr style="background:#faf5ff">
        <td style="font-weight:600">📤 Tổng chi phí phát sinh</td>
        <td style="text-align:right;font-weight:700;color:#7c3aed;font-size:14px">${fmtMoney(total)} đ</td>
      </tr>
      <tr class="total-row" style="background:${profit>=0?"#ecfdf5":"#fee2e2"}">
        <td><strong>${profit>=0?"📈 LỢI NHUẬN ƯỚC TÍNH":"📉 LỖ ƯỚC TÍNH"}</strong></td>
        <td style="text-align:right;font-size:16px;font-weight:800;color:${profit>=0?"#059669":"#dc2626"}">${fmtMoney(Math.abs(profit))} đ <span style="font-size:12px;font-weight:500">(${profitPct}%)</span></td>
      </tr>
    </tbody>
  </table>

  <div style="background:#fef9e7;border:1px solid #e8c53a;border-radius:8px;padding:10px 14px;font-size:12px;color:#7a5a00;margin-bottom:16px;line-height:1.7">
    📌 <strong>Lưu ý:</strong> Bảng kê này được lập dựa trên các phiếu chi, hóa đơn đã được kế toán phê duyệt.
    Số liệu chi phí phản ánh tình hình thực tế phát sinh trong quá trình tổ chức dịch vụ.
    Làm căn cứ để đối chiếu, quyết toán với khách hàng và nội bộ công ty.
  </div>

  <div class="sign-row" style="grid-template-columns:1fr 1fr 1fr">
    <div class="sign-box">
      <div class="sign-title">Người lập bảng kê</div>
      <div class="sign-name" style="margin-top:52px">${issuerName || "——————"}</div>
    </div>
    <div class="sign-box">
      <div class="sign-title">Kế toán kiểm tra</div>
      <div class="sign-name" style="margin-top:52px">——————</div>
    </div>
    <div class="sign-box">
      <div class="sign-title">Giám đốc duyệt</div>
      <div class="sign-name" style="margin-top:52px">——————</div>
    </div>
  </div>

  <div class="footer">
    <span>Đơn hàng: ${order.id} · Người lập: ${issuerName||"—"} · MST: ${COMPANY.taxCode}</span>
    <span>In lúc: ${new Date().toLocaleString("vi-VN")}</span>
  </div>
</div>`;

  return printBase(`Bảng kê chi phí – ${order.id}`, body, contractNo);
}

// Giữ nguyên phần dấu phẩy cũ để không break

export function buildPaymentRequest({ order, requestNo, stage, requestAmount, dueDate, bankAccount, note, issuerName }) {
  const c        = order.customer || {};
  const totalRev = order.totalPrice || order.pricing?.totalRevenue || 0;
  const isDeposit = stage !== "final";
  const stageLabel = isDeposit ? "Đặt cọc — Đợt 1" : "Thanh toán đợt 2 — Quyết toán";
  const reqAmt   = requestAmount || (isDeposit ? Math.round(totalRev*0.3) : totalRev);
  const pct      = totalRev > 0 ? Math.round(reqAmt/totalRev*100) : 0;
  const rNo      = requestNo || ("YCTT-" + order.id + (isDeposit?"-1":"-2"));
  const today    = new Date().toLocaleDateString("vi-VN");
  const dueDateFmt = dueDate ? new Date(dueDate).toLocaleDateString("vi-VN")
    : isDeposit ? "Ngay khi ký hợp đồng"
    : (order.departDate ? `Trước ngày ${new Date(new Date(order.departDate)-7*86400000).toLocaleDateString("vi-VN")} (07 ngày trước khởi hành)` : "Theo thỏa thuận");

  const body = `<div class="page">
  <div class="header">
    ${coHeader()}
    <div class="doc-title">
      <div class="doc-type" style="font-size:15px">GIẤY YÊU CẦU THANH TOÁN</div>
      <div class="doc-type" style="font-size:12px;color:${isDeposit?"#d97706":"#dc2626"}">${stageLabel}</div>
      <div class="doc-id">Số: ${rNo}</div>
      <div class="doc-date">Ngày: ${today}</div>
    </div>
  </div>

  <div style="font-size:13px;line-height:1.8;color:#334155;margin-bottom:14px">
    Kính gửi: <strong>${c.name || order.customerName || "Quý khách hàng"}</strong><br>
    <span style="font-size:12px;color:#64748b">Điện thoại: ${c.phone || order.customerPhone || "—"} &nbsp;|&nbsp; Email: ${c.email || order.customerEmail || "—"}</span>
  </div>

  <!-- Highlight số tiền -->
  <div style="background:linear-gradient(135deg,${isDeposit?"#d97706,#92400e":"#dc2626,#7f1d1d"});border-radius:14px;padding:20px 26px;margin-bottom:18px;display:flex;justify-content:space-between;align-items:center">
    <div>
      <div style="color:rgba(255,255,255,.75);font-size:12px;margin-bottom:6px;text-transform:uppercase;letter-spacing:.5px">Số tiền yêu cầu thanh toán (${stageLabel})</div>
      <div style="color:#fff;font-size:28px;font-weight:800;letter-spacing:-0.5px">${fmtMoney(reqAmt)} đồng</div>
      <div style="color:rgba(255,255,255,.7);font-size:12px;margin-top:4px;font-style:italic">${soThanhChu(reqAmt)}</div>
    </div>
    <div style="text-align:right">
      <div style="color:rgba(255,255,255,.7);font-size:11px;margin-bottom:4px">Tỷ lệ</div>
      <div style="color:#fff;font-size:24px;font-weight:700">${pct}%</div>
      <div style="color:rgba(255,255,255,.6);font-size:11px">giá trị HĐ</div>
    </div>
  </div>

  <!-- Thông tin dịch vụ -->
  <div class="section-title">THÔNG TIN DỊCH VỤ</div>
  <table class="items" style="margin-bottom:14px">
    <tbody>
      <tr><td style="width:160px;color:#94a3b8;font-size:11px;text-transform:uppercase;font-weight:600">Dịch vụ / Tour</td><td><strong>${order.tourName || order.serviceName || "—"}</strong></td></tr>
      <tr><td style="color:#94a3b8;font-size:11px;text-transform:uppercase;font-weight:600">Mã đơn hàng</td><td><strong>${order.id}</strong></td></tr>
      <tr><td style="color:#94a3b8;font-size:11px;text-transform:uppercase;font-weight:600">Ngày khởi hành</td><td><strong>${fmtDate(order.departDate)}</strong>  ${order.returnDate ? ` → <strong>${fmtDate(order.returnDate)}</strong>` : ""}</td></tr>
      <tr><td style="color:#94a3b8;font-size:11px;text-transform:uppercase;font-weight:600">Số khách</td><td>${order.adultQty||order.pax?.adults||1} người lớn${(order.child10Qty||0)>0?", "+(order.child10Qty)+" trẻ em":""}</td></tr>
    </tbody>
  </table>

  <!-- Cơ cấu thanh toán tổng thể -->
  <div class="section-title">CƠ CẤU THANH TOÁN TOÀN HỢP ĐỒNG</div>
  <table class="items" style="margin-bottom:14px">
    <thead><tr><th>Đợt</th><th>Nội dung</th><th style="text-align:right">Số tiền (đ)</th><th style="text-align:center">Tỷ lệ</th><th style="text-align:center">Trạng thái</th></tr></thead>
    <tbody>
      <tr ${isDeposit?"style=\"background:#fffbeb\""  :""}>
        <td><strong>Đợt 1</strong></td>
        <td>Đặt cọc khi ký hợp đồng</td>
        <td style="text-align:right;font-weight:600">${fmtMoney(isDeposit?reqAmt:Math.round(totalRev*0.3))} đ</td>
        <td style="text-align:center">${isDeposit?pct:Math.round((isDeposit?reqAmt:Math.round(totalRev*0.3))/totalRev*100)}%</td>
        <td style="text-align:center"><span style="background:${isDeposit?"#fef3c7":"#dcfce7"};color:${isDeposit?"#d97706":"#059669"};padding:2px 8px;border-radius:20px;font-size:11px;font-weight:600">${isDeposit?"🔴 Cần thanh toán":"✅ Đã thanh toán"}</span></td>
      </tr>
      <tr ${!isDeposit?"style=\"background:#fef2f2\""  :""}>
        <td><strong>Đợt 2</strong></td>
        <td>Thanh toán đủ (trước ${order.departDate ? "07 ngày khởi hành" : "ngày quy định"})</td>
        <td style="text-align:right;font-weight:600">${fmtMoney(!isDeposit?reqAmt:totalRev-Math.round(totalRev*0.3))} đ</td>
        <td style="text-align:center">${!isDeposit?pct:Math.round((!isDeposit?reqAmt:totalRev-Math.round(totalRev*0.3))/totalRev*100)}%</td>
        <td style="text-align:center"><span style="background:${!isDeposit?"#fee2e2":"#f1f5f9"};color:${!isDeposit?"#dc2626":"#94a3b8"};padding:2px 8px;border-radius:20px;font-size:11px;font-weight:600">${!isDeposit?"🔴 Cần thanh toán":"⏳ Chưa đến hạn"}</span></td>
      </tr>
    </tbody>
    <tfoot><tr class="total-row"><td colspan="2" style="text-align:right">Tổng giá trị hợp đồng</td><td style="text-align:right">${fmtMoney(totalRev)} đ</td><td colspan="2"></td></tr></tfoot>
  </table>

  <!-- Thông tin chuyển khoản -->
  <div class="section-title">THÔNG TIN CHUYỂN KHOẢN</div>
  <div style="background:linear-gradient(135deg,#f0f4ff,#e8f0ff);border-radius:12px;padding:16px 20px;margin-bottom:14px">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:13px;line-height:1.9">
      <div>
        <span style="font-size:10px;color:#94a3b8;text-transform:uppercase;font-weight:600">Tên tài khoản</span><br>
        <strong>${bankAccount?.accountName || COMPANY.name}</strong>
      </div>
      <div>
        <span style="font-size:10px;color:#94a3b8;text-transform:uppercase;font-weight:600">Ngân hàng</span><br>
        <strong>${bankAccount?.bankName || "Vietcombank"}</strong> ${bankAccount?.branch ? `– ${bankAccount.branch}` : ""}
      </div>
      <div style="grid-column:1/-1">
        <span style="font-size:10px;color:#94a3b8;text-transform:uppercase;font-weight:600">Số tài khoản</span><br>
        <strong style="font-family:monospace;font-size:20px;color:#1e3a8a;letter-spacing:2px">${bankAccount?.accountNo || "……………………………………"}</strong>
      </div>
      <div style="grid-column:1/-1">
        <span style="font-size:10px;color:#94a3b8;text-transform:uppercase;font-weight:600">Nội dung chuyển khoản (bắt buộc ghi đúng)</span><br>
        <strong style="color:#1e3a8a;font-size:14px">${(c.name||order.customerName||"KH").split(" ").pop()} ${order.id} ${isDeposit?"DatCoc":"ThanhToan2"}</strong>
      </div>
    </div>
  </div>

  <!-- Hạn thanh toán -->
  <div style="background:#fee2e2;border:1px solid #fca5a5;border-radius:10px;padding:14px 18px;margin-bottom:14px">
    <div style="font-size:12px;color:#7f1d1d;font-weight:600;margin-bottom:4px;text-transform:uppercase;letter-spacing:.5px">⏰ Hạn thanh toán</div>
    <div style="font-size:18px;font-weight:800;color:#dc2626">${dueDateFmt}</div>
    ${note?`<div style="font-size:12px;color:#7f1d1d;margin-top:6px">📝 Ghi chú: ${note}</div>`:""}
  </div>

  <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:10px 14px;font-size:12px;color:#166534;margin-bottom:16px;line-height:1.7">
    ✅ Sau khi chuyển khoản, vui lòng chụp ảnh biên lai gửi về: <strong>${COMPANY.phoneDH}</strong> (Zalo/Viber/SMS) để được xác nhận kịp thời.<br>
    📞 Thắc mắc về thanh toán: <strong>${COMPANY.phoneDH}</strong> &nbsp;|&nbsp; ✉️ <strong>${COMPANY.email}</strong><br>
    🏢 Hoặc đến trực tiếp: ${COMPANY.office}
  </div>

  <div class="sign-row" style="grid-template-columns:1fr 1fr">
    <div class="sign-box">
      <div class="sign-title">Khách hàng xác nhận<br><span style="font-weight:400;font-size:10px">(Ký, ghi rõ họ tên)</span></div>
      <div class="sign-name" style="margin-top:52px">${c.name || order.customerName || "——————————"}</div>
    </div>
    <div class="sign-box">
      <div class="sign-title">Đại diện ${COMPANY.name.split(" ").slice(-2).join(" ")}<br><span style="font-weight:400;font-size:10px">(Ký, đóng dấu)</span></div>
      <div class="sign-name" style="margin-top:52px">${issuerName || "——————————"}</div>
    </div>
  </div>

  <div class="footer">
    <span>YCTT số: ${rNo} · Đơn: ${order.id} · MST: ${COMPANY.taxCode}</span>
    <span>In lúc: ${new Date().toLocaleString("vi-VN")}</span>
  </div>
</div>`;

  return printBase(`Yêu cầu thanh toán – ${order.id}`, body, rNo);
}

// ── 5. Biên bản thanh lý hợp đồng ─────────────────────────
export function buildLiquidation({ order, contractNo, totalPaid, deductions, refundAmount, note, issuerName }) {
  const c        = order.customer || {};
  const totalRev = order.totalPrice || order.pricing?.totalRevenue || 0;
  const paid     = totalPaid || order.totalPaid || 0;
  const dedRows  = deductions || [];
  const totalDed = dedRows.reduce((s,d) => s+(Number(d.amount)||0), 0);
  const adjustedRev = totalRev - totalDed;
  const balance  = paid - adjustedRev; // > 0 → thừa; < 0 → thiếu
  const cNo      = contractNo || ("BBTL-" + order.id);
  const today    = new Date().toLocaleDateString("vi-VN");

  const body = `<div class="page">
  <div class="header">
    ${coHeader()}
    <div class="doc-title">
      <div class="doc-type" style="font-size:16px">BIÊN BẢN THANH LÝ</div>
      <div class="doc-type" style="font-size:13px;color:#dc2626">HỢP ĐỒNG DỊCH VỤ DU LỊCH</div>
      <div class="doc-id">Số: ${cNo}</div>
      <div class="doc-date">Ngày: ${today}</div>
    </div>
  </div>

  <div style="font-size:12px;line-height:1.85;color:#334155;background:#fef9f0;border-radius:8px;padding:12px 16px;margin-bottom:14px;border-left:3px solid #d97706">
    <em>Căn cứ Bộ luật Dân sự số 91/2015/QH13; Luật Du lịch số 09/2017/QH14 và các quy định pháp luật hiện hành.<br>
    Căn cứ Hợp đồng cung cấp dịch vụ du lịch số <strong>${contractNo || "………………………"}</strong> đã ký giữa hai bên.<br>
    Hôm nay, ngày ${today}, tại văn phòng ${COMPANY.name}, hai bên gồm:</em>
  </div>

  <div class="section-title">BÊN A — ĐƠN VỊ KINH DOANH LỮ HÀNH</div>
  <div style="background:#f0f4ff;border-radius:8px;padding:12px 16px;margin-bottom:12px;font-size:13px;line-height:1.9">
    Tên công ty: <strong>${COMPANY.fullName}</strong> &nbsp;|&nbsp; MST: <strong>${COMPANY.taxCode}</strong><br>
    Địa chỉ: ${COMPANY.address} &nbsp;|&nbsp; Điện thoại: ${COMPANY.phoneDH}<br>
    Đại diện: <strong>${issuerName || "……………………………………"}</strong> &nbsp;|&nbsp; Chức vụ: ………………………
  </div>

  <div class="section-title">BÊN B — KHÁCH HÀNG</div>
  <div style="background:#f8fafc;border-radius:8px;padding:12px 16px;margin-bottom:14px;font-size:13px;line-height:1.9">
    Họ và tên: <strong>${c.name || order.customerName || "……………………………………"}</strong>
    &nbsp;|&nbsp; CCCD/HC: ${c.cccd || order.customerCccd || "………………………"}<br>
    Điện thoại: <strong>${c.phone || order.customerPhone || "………………………"}</strong>
    &nbsp;|&nbsp; Địa chỉ: ${c.address || c.province || "……………………………………"}
  </div>

  <div style="font-size:12px;color:#334155;margin-bottom:14px">
    Hai bên thống nhất lập biên bản thanh lý hợp đồng với các nội dung sau:
  </div>

  <div class="section-title">ĐIỀU 1. THÔNG TIN HỢP ĐỒNG THANH LÝ</div>
  <table class="items" style="margin-bottom:14px">
    <tbody>
      <tr><td style="width:180px;color:#94a3b8;font-size:11px;text-transform:uppercase;font-weight:600">Dịch vụ</td><td><strong>${order.tourName || order.serviceName || "—"}</strong></td></tr>
      <tr><td style="color:#94a3b8;font-size:11px;text-transform:uppercase;font-weight:600">Mã đơn hàng</td><td><strong>${order.id}</strong></td></tr>
      <tr><td style="color:#94a3b8;font-size:11px;text-transform:uppercase;font-weight:600">Ngày khởi hành</td><td>${fmtDate(order.departDate)}</td></tr>
      <tr><td style="color:#94a3b8;font-size:11px;text-transform:uppercase;font-weight:600">Ngày về</td><td>${fmtDate(order.returnDate)}</td></tr>
      <tr><td style="color:#94a3b8;font-size:11px;text-transform:uppercase;font-weight:600">Số khách</td><td>${order.adultQty||order.pax?.adults||1} người lớn${(order.child10Qty||0)>0?", "+(order.child10Qty||0)+" trẻ em":""}</td></tr>
    </tbody>
  </table>

  <div class="section-title">ĐIỀU 2. QUYẾT TOÁN TÀI CHÍNH</div>
  <table class="items">
    <thead><tr><th>Khoản mục</th><th style="text-align:right">Số tiền (đ)</th><th>Ghi chú</th></tr></thead>
    <tbody>
      <tr>
        <td>Giá trị hợp đồng ban đầu</td>
        <td style="text-align:right;font-weight:600">${fmtMoney(totalRev)} đ</td>
        <td style="font-size:11px;color:#64748b">Theo HĐ số ${contractNo||"……………"}</td>
      </tr>
      ${dedRows.map(d=>`
      <tr>
        <td style="color:#dc2626">${d.name||"Khấu trừ"}${d.note?` <span style="font-size:11px;color:#94a3b8">— ${d.note}</span>`:""}</td>
        <td style="text-align:right;color:#dc2626;font-weight:600">– ${fmtMoney(d.amount)} đ</td>
        <td style="font-size:11px;color:#64748b">${d.reason||""}</td>
      </tr>`).join("")}
      ${totalDed>0?`<tr style="background:#fef9f0"><td><strong>Giá trị dịch vụ thực tế</strong></td><td style="text-align:right;font-weight:700">${fmtMoney(adjustedRev)} đ</td><td></td></tr>`:""}
      <tr style="background:#ecfdf5">
        <td><strong>Tổng tiền Bên B đã thanh toán</strong></td>
        <td style="text-align:right;font-weight:700;color:#059669">${fmtMoney(paid)} đ</td>
        <td style="font-size:11px;color:#64748b">Theo phiếu thu đã duyệt</td>
      </tr>
      <tr class="total-row" style="${balance>0?"background:#ecfdf5":"background:#fee2e2"}">
        <td><strong>${balance>0?"💚 BÊN A HOÀN TRẢ BÊN B":"❤️ BÊN B CÒN PHẢI THANH TOÁN"}</strong></td>
        <td style="text-align:right;font-size:16px;font-weight:800;color:${balance>0?"#059669":"#dc2626"}">${fmtMoney(Math.abs(balance>0?balance:(refundAmount||0)))} đ</td>
        <td style="font-size:11px">${balance>0?"Hoàn trong 07 ngày làm việc":"Thanh toán ngay"}</td>
      </tr>
    </tbody>
  </table>
  <div style="font-size:12px;color:#64748b;font-style:italic;margin-bottom:14px">
    Bằng chữ: <em>${soThanhChu(Math.abs(balance>0?balance:(refundAmount||0)))}</em>
  </div>

  <div class="section-title">ĐIỀU 3. ĐÁNH GIÁ THỰC HIỆN HỢP ĐỒNG</div>
  <table class="items" style="margin-bottom:14px">
    <thead><tr><th>Hạng mục dịch vụ</th><th style="text-align:center">Đã thực hiện</th><th>Ghi chú</th></tr></thead>
    <tbody>
      <tr><td>Vận chuyển đúng lịch trình</td><td style="text-align:center">☐ Đúng &nbsp; ☐ Không đúng</td><td></td></tr>
      <tr><td>Khách sạn đúng tiêu chuẩn cam kết</td><td style="text-align:center">☐ Đúng &nbsp; ☐ Không đúng</td><td></td></tr>
      <tr><td>Bữa ăn đúng số lượng và chất lượng</td><td style="text-align:center">☐ Đúng &nbsp; ☐ Không đúng</td><td></td></tr>
      <tr><td>Hướng dẫn viên phục vụ chuyên nghiệp</td><td style="text-align:center">☐ Đúng &nbsp; ☐ Không đúng</td><td></td></tr>
      <tr><td>Vé tham quan đầy đủ theo lịch</td><td style="text-align:center">☐ Đúng &nbsp; ☐ Không đúng</td><td></td></tr>
      <tr><td>Bảo hiểm du lịch đã mua</td><td style="text-align:center">☐ Có &nbsp; ☐ Không</td><td></td></tr>
    </tbody>
  </table>

  <div style="margin-bottom:14px">
    <div style="font-size:12px;font-weight:600;color:#334155;margin-bottom:6px">Nhận xét của Bên B về chất lượng dịch vụ:</div>
    <div style="border:1px solid #e2e8f0;border-radius:8px;padding:10px;min-height:48px;font-size:13px;color:#334155">
      ${note || "………………………………………………………………………………………………………………………………………………………"}
    </div>
  </div>

  <div class="section-title">ĐIỀU 4. CAM KẾT VÀ HIỆU LỰC</div>
  <div style="font-size:12.5px;line-height:1.9;color:#334155;margin-bottom:14px">
    4.1. Hai bên xác nhận số liệu tài chính tại Điều 2 là chính xác và đã được đối chiếu, kiểm tra kỹ lưỡng.<br>
    4.2. Sau khi ký biên bản thanh lý này, hợp đồng số ${contractNo||"……………………"} được coi là đã hoàn thành. Hai bên không còn nghĩa vụ tài chính và pháp lý nào khác liên quan đến hợp đồng này, <strong>ngoại trừ khoản hoàn trả (nếu có) tại Điều 2</strong>.<br>
    4.3. Biên bản này có hiệu lực kể từ ngày ký, lập thành <strong>02 bản</strong> bằng tiếng Việt có giá trị pháp lý như nhau, mỗi bên giữ <strong>01 bản</strong>.
  </div>

  <div class="sign-row" style="grid-template-columns:1fr 1fr;margin-top:20px">
    <div class="sign-box">
      <div class="sign-title">BÊN B — KHÁCH HÀNG<br><span style="font-weight:400;font-size:10px">(Ký, ghi rõ họ tên)</span></div>
      <div class="sign-name" style="margin-top:60px">${c.name || order.customerName || "——————————"}</div>
    </div>
    <div class="sign-box">
      <div class="sign-title">BÊN A — ĐẠI DIỆN CÔNG TY<br><span style="font-weight:400;font-size:10px">(Ký tên, đóng dấu)</span></div>
      <div class="sign-name" style="margin-top:60px">${issuerName || "——————————"}</div>
    </div>
  </div>

  <div class="footer">
    <span>BB số: ${cNo} · HĐ gốc: ${contractNo||"……………"} · MST: ${COMPANY.taxCode}</span>
    <span>In lúc: ${new Date().toLocaleString("vi-VN")}</span>
  </div>
</div>`;

  return printBase(`Thanh lý hợp đồng – ${order.id}`, body, cNo);
}

// ── 6. Phiếu điều tour ────────────────────────────────────
export function buildDispatch({ order, hdv, vehicle, hotels = [], meetPoint, meetTime, notes, issuerName }) {
  const pax = order.pax || {};
  const totalPax = (pax.adults || 0) + (pax.children || 0) + (pax.babies || 0);
  const itinerary = order.itinerary || [];

  const body = `
  <div style="text-align:center;margin-bottom:4px;">
    <div class="doc-title">Phiếu điều tour</div>
    <div class="doc-sub">Mã đơn: <strong>${order.id}</strong></div>
    <div class="doc-num">Ngày lập: ${new Date().toLocaleDateString("vi-VN")}</div>
  </div>

  <div class="section">
    <div class="section-title">Thông tin chuyến đi</div>
    <div class="party-box">
      <div class="party-row"><span class="party-key">Tên tour:</span><span class="party-val">${order.serviceName || order.tourName || "—"}</span></div>
      <div class="party-row"><span class="party-key">Ngày khởi hành:</span><span class="party-val">${fmtDate(order.departDate)}</span></div>
      <div class="party-row"><span class="party-key">Ngày kết thúc:</span><span class="party-val">${fmtDate(order.returnDate)}</span></div>
      <div class="party-row"><span class="party-key">Điểm tập trung:</span><span class="party-val">${meetPoint || "—"}</span></div>
      <div class="party-row"><span class="party-key">Giờ tập trung:</span><span class="party-val">${meetTime || "—"}</span></div>
      <div class="party-row"><span class="party-key">Số khách:</span><span class="party-val">${totalPax} khách (${pax.adults || 0} NL · ${pax.children || 0} TE · ${pax.babies || 0} em bé)</span></div>
      <div class="party-row"><span class="party-key">Khách hàng:</span><span class="party-val">${order.customerName || order.customer?.name || "—"}</span></div>
      <div class="party-row"><span class="party-key">SĐT liên hệ:</span><span class="party-val">${order.customerPhone || order.customer?.phone || "—"}</span></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Hướng dẫn viên phụ trách</div>
    <div class="party-box">
      <div class="party-row"><span class="party-key">Họ và tên:</span><span class="party-val">${hdv?.name || "—"}</span></div>
      <div class="party-row"><span class="party-key">Điện thoại:</span><span class="party-val">${hdv?.phone || "—"}</span></div>
      <div class="party-row"><span class="party-key">Chứng chỉ HDV:</span><span class="party-val">${hdv?.license || "—"}</span></div>
      <div class="party-row"><span class="party-key">Chuyên ngôn ngữ:</span><span class="party-val">${(hdv?.lang || []).join(", ") || "Tiếng Việt"}</span></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Phương tiện vận chuyển</div>
    <div class="party-box">
      <div class="party-row"><span class="party-key">Loại xe:</span><span class="party-val">${vehicle?.type || "—"}</span></div>
      <div class="party-row"><span class="party-key">Biển số xe:</span><span class="party-val">${vehicle?.plate || "—"}</span></div>
      <div class="party-row"><span class="party-key">Tài xế:</span><span class="party-val">${vehicle?.driverName || "—"}</span></div>
      <div class="party-row"><span class="party-key">SĐT tài xế:</span><span class="party-val">${vehicle?.driverPhone || "—"}</span></div>
      <div class="party-row"><span class="party-key">Nhà xe / NCC:</span><span class="party-val">${vehicle?.supplier || "—"}</span></div>
    </div>
  </div>

  ${hotels.length > 0 ? `
  <div class="section">
    <div class="section-title">Khách sạn / Cơ sở lưu trú</div>
    <table class="items">
      <thead><tr><th>Tên cơ sở</th><th>Địa chỉ</th><th>Check-in</th><th>Check-out</th><th class="num">Số phòng</th></tr></thead>
      <tbody>
        ${hotels.map(h => `<tr>
          <td>${h.name || "—"}</td>
          <td>${h.address || "—"}</td>
          <td>${h.checkin ? fmtDate(h.checkin) : "—"}</td>
          <td>${h.checkout ? fmtDate(h.checkout) : "—"}</td>
          <td class="num">${h.rooms || 1}</td>
        </tr>`).join("")}
      </tbody>
    </table>
  </div>` : ""}

  ${itinerary.length > 0 ? `
  <div class="section">
    <div class="section-title">Lịch trình hành trình</div>
    ${itinerary.map(d => `
      <div class="itinerary-day">
        <div class="day-badge">N${d.day}</div>
        <div class="day-content">
          <div class="day-title">${d.title || ""} ${d.meals ? `<span style="color:#64748b;font-weight:400;font-size:11px">(Bữa: ${d.meals})</span>` : ""}</div>
          <div class="day-acts">${(d.activities || []).map(a => typeof a === "string" ? a : `${a.time ? a.time + " — " : ""}${a.desc}`).join("<br>")}</div>
        </div>
      </div>`).join("")}
  </div>` : ""}

  ${notes ? `
  <div class="section">
    <div class="section-title">Yêu cầu đặc biệt / Ghi chú</div>
    <div style="font-size:12.5px;line-height:1.8;color:#334155;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;">${notes}</div>
  </div>` : ""}

  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-top:32px;">
    <div class="sign-box">
      <div class="sign-title">Hướng dẫn viên</div>
      <div class="sign-name">${hdv?.name || "——————————"}</div>
      <div class="sign-space"></div>
      <div class="sign-name">Ký xác nhận nhận tour</div>
    </div>
    <div class="sign-box">
      <div class="sign-title">Bộ phận điều hành</div>
      <div class="sign-name">${issuerName || "——————————"}</div>
      <div class="sign-space"></div>
      <div class="sign-name">Ký duyệt</div>
    </div>
    <div class="sign-box">
      <div class="sign-title">Giám đốc</div>
      <div class="sign-name">——————————</div>
      <div class="sign-space"></div>
      <div class="sign-name">Ký, đóng dấu</div>
    </div>
  </div>`;

  return printBase(`Phiếu điều tour – ${order.id}`, body, order.id);
}

// ── 7. Hợp đồng hướng dẫn viên ────────────────────────────
export function buildGuideContract({ order, hdv, dailyFee, totalFee, advanceAmount, contractNo, tourDays, issuerName }) {
  const pax = order.pax || {};
  const totalPax = (pax.adults || 0) + (pax.children || 0);

  const body = `
  <div style="text-align:center;margin-bottom:4px;">
    <div class="doc-title">Hợp đồng hướng dẫn viên du lịch</div>
    <div class="doc-sub">Số hợp đồng: <strong>${contractNo || "…………………………"}</strong></div>
    <div class="doc-num">Ngày ký: ……/……/………… &nbsp;|&nbsp; Tại: Hải Phòng</div>
  </div>

  <div class="section">
    <p style="font-size:12px;line-height:1.8;color:#334155;">
      Căn cứ Bộ luật Dân sự 2015; Luật Du lịch 2017; Nghị định 168/2017/NĐ-CP về hướng dẫn viên du lịch.<br>
      Hai bên cùng thỏa thuận và ký kết hợp đồng hướng dẫn viên với các điều khoản sau:
    </p>
  </div>

  <div class="section">
    <div class="section-title">Bên A — Đơn vị lữ hành</div>
    <div class="party-box">
      <div class="party-row"><span class="party-key">Tên công ty:</span><span class="party-val">${COMPANY.fullName}</span></div>
      <div class="party-row"><span class="party-key">Địa chỉ:</span><span class="party-val">${COMPANY.address}</span></div>
      <div class="party-row"><span class="party-key">Điện thoại:</span><span class="party-val">${COMPANY.phone}</span></div>
      <div class="party-row"><span class="party-key">MST:</span><span class="party-val">${COMPANY.taxCode}</span></div>
      <div class="party-row"><span class="party-key">Đại diện:</span><span class="party-val">${issuerName || "Giám đốc"}</span></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Bên B — Hướng dẫn viên</div>
    <div class="party-box">
      <div class="party-row"><span class="party-key">Họ và tên:</span><span class="party-val">${hdv?.name || "—"}</span></div>
      <div class="party-row"><span class="party-key">CCCD:</span><span class="party-val">${hdv?.cccd || hdv?.idCard || "—"}</span></div>
      <div class="party-row"><span class="party-key">Số thẻ HDV:</span><span class="party-val">${hdv?.license || hdv?.licenseNo || "—"}</span></div>
      <div class="party-row"><span class="party-key">Điện thoại:</span><span class="party-val">${hdv?.phone || "—"}</span></div>
      <div class="party-row"><span class="party-key">Địa chỉ:</span><span class="party-val">${hdv?.address || "—"}</span></div>
      <div class="party-row"><span class="party-key">Số TK ngân hàng:</span><span class="party-val">${hdv?.bankAccount || "—"} · ${hdv?.bankName || "—"}</span></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Điều 1 — Thông tin tour</div>
    <table class="items">
      <thead><tr><th>Hạng mục</th><th>Chi tiết</th></tr></thead>
      <tbody>
        <tr><td>Tên tour</td><td><strong>${order.serviceName || order.tourName || "—"}</strong></td></tr>
        <tr><td>Mã đơn</td><td>${order.id}</td></tr>
        <tr><td>Ngày khởi hành</td><td>${fmtDate(order.departDate)}</td></tr>
        <tr><td>Ngày kết thúc</td><td>${fmtDate(order.returnDate)}</td></tr>
        <tr><td>Số ngày / đêm</td><td>${tourDays || "—"}</td></tr>
        <tr><td>Số khách phụ trách</td><td>${totalPax} khách</td></tr>
        <tr><td>Lộ trình</td><td>${order.route || order.tourRoute || "Theo chương trình tour"}</td></tr>
      </tbody>
    </table>
  </div>

  <div class="section">
    <div class="section-title">Điều 2 — Thù lao & tạm ứng</div>
    <div class="highlight-box">
      <div class="hl-label">Tổng thù lao hướng dẫn tour</div>
      <div class="hl-value">${fmtMoney(totalFee || 0)} đồng</div>
      <div class="hl-sub">${tourDays} ngày × ${fmtMoney(dailyFee || 0)} đ/ngày</div>
    </div>
    <div class="terms">
      <p>• Tạm ứng chi phí tour: <strong>${fmtMoney(advanceAmount || 0)} đồng</strong> (nhận trước ngày khởi hành).</p>
      <p>• Thù lao được thanh toán sau khi HDV hoàn tất quyết toán tour, chậm nhất <strong>5 ngày làm việc</strong> sau khi kết thúc tour.</p>
      <p>• Hình thức thanh toán: Chuyển khoản ngân hàng.</p>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Điều 3 — Trách nhiệm của hướng dẫn viên (Bên B)</div>
    <div class="terms">
      <p>• Có mặt đúng giờ tại điểm tập trung và đảm bảo lịch trình chuyến đi.</p>
      <p>• Hướng dẫn, chăm sóc và đảm bảo an toàn cho đoàn khách trong suốt hành trình.</p>
      <p>• Giữ gìn uy tín và hình ảnh thương hiệu ${COMPANY.name}; ứng xử chuyên nghiệp với khách hàng.</p>
      <p>• Sử dụng kinh phí tạm ứng đúng mục đích; lưu giữ hóa đơn, chứng từ hợp lệ.</p>
      <p>• Nộp quyết toán tour (kèm chứng từ) trong vòng <strong>3 ngày làm việc</strong> sau khi kết thúc tour.</p>
      <p>• Bảo mật thông tin khách hàng; không chia sẻ dữ liệu với bên thứ ba.</p>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Điều 4 — Trách nhiệm của Bên A</div>
    <div class="terms">
      <p>• Cung cấp đầy đủ thông tin tour, danh sách khách, phiếu điều tour trước ngày khởi hành tối thiểu <strong>2 ngày</strong>.</p>
      <p>• Hỗ trợ xử lý các phát sinh trong tour theo quy trình nội bộ.</p>
      <p>• Thanh toán thù lao và hoàn ứng đúng hạn theo thỏa thuận.</p>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Điều 5 — Điều khoản chung</div>
    <div class="terms">
      <p>• Hợp đồng có hiệu lực từ ngày ký, lập thành 02 bản có giá trị pháp lý như nhau, mỗi bên giữ 01 bản.</p>
      <p>• Trường hợp hủy tour do bất khả kháng: hai bên thỏa thuận theo từng trường hợp cụ thể.</p>
      <p>• Mọi tranh chấp được giải quyết theo pháp luật Việt Nam tại tòa án có thẩm quyền tại Hải Phòng.</p>
    </div>
  </div>

  <div class="sign-grid">
    <div class="sign-box">
      <div class="sign-title">Bên B (Hướng dẫn viên)</div>
      <div class="sign-name">${hdv?.name || "——————————"}</div>
      <div class="sign-space"></div>
      <div class="sign-name">Ký và ghi rõ họ tên</div>
    </div>
    <div class="sign-box">
      <div class="sign-title">Bên A (Đại diện Công ty)</div>
      <div class="sign-name">${issuerName || "——————————"}</div>
      <div class="sign-space"></div>
      <div class="sign-name">Ký, đóng dấu</div>
    </div>
  </div>`;

  return printBase(`Hợp đồng HDV – ${order.id}`, body, contractNo);
}

// ── 8. Quyết toán tour ─────────────────────────────────────
export function buildTourSettlement({ order, hdv, advanceAmount, expenseItems = [], additionalItems = [], totalCollected, contractNo, issuerName }) {
  const totalExpenses = expenseItems.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const balance = (advanceAmount || 0) - totalExpenses;
  const hdvFeeItem = expenseItems.find(e => e.category === "hdv_fee");
  const hdvFee = hdvFeeItem ? hdvFeeItem.amount : 0;
  const netBalance = balance - hdvFee;

  const CATEGORY_LABEL = {
    transport: "Vận chuyển", hotel: "Lưu trú", meals: "Ăn uống",
    entrance: "Vé tham quan", hdv_fee: "Thù lao HDV", tip: "Tiền tip",
    other: "Phát sinh khác",
  };

  const body = `
  <div style="text-align:center;margin-bottom:4px;">
    <div class="doc-title">Bảng quyết toán tour</div>
    <div class="doc-sub">Tour: <strong>${order.serviceName || order.tourName || "—"}</strong> · Mã đơn: ${order.id}</div>
    <div class="doc-num">Ngày quyết toán: ${new Date().toLocaleDateString("vi-VN")} &nbsp;|&nbsp; HDV: ${hdv?.name || "—"}</div>
  </div>

  <div class="section">
    <div class="section-title">Thông tin chuyến đi</div>
    <div class="party-box">
      <div class="party-row"><span class="party-key">Tên tour:</span><span class="party-val">${order.serviceName || order.tourName || "—"}</span></div>
      <div class="party-row"><span class="party-key">Ngày đi / về:</span><span class="party-val">${fmtDate(order.departDate)} → ${fmtDate(order.returnDate)}</span></div>
      <div class="party-row"><span class="party-key">Số khách:</span><span class="party-val">${((order.pax?.adults||0)+(order.pax?.children||0))} khách</span></div>
      <div class="party-row"><span class="party-key">Hướng dẫn viên:</span><span class="party-val">${hdv?.name || "—"}</span></div>
      <div class="party-row"><span class="party-key">Doanh thu khách đã nộp:</span><span class="party-val" style="font-weight:700;color:#1e3a8a">${fmtMoney(totalCollected || 0)} đ</span></div>
      <div class="party-row"><span class="party-key">Tạm ứng được cấp:</span><span class="party-val" style="font-weight:700;color:#1e3a8a">${fmtMoney(advanceAmount || 0)} đ</span></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Chi tiết chi phí thực tế</div>
    <table class="items">
      <thead><tr><th style="width:32px">STT</th><th>Khoản mục</th><th>Danh mục</th><th class="num">Số tiền</th><th>Ghi chú</th></tr></thead>
      <tbody>
        ${expenseItems.length > 0 ? expenseItems.map((e, i) => `
        <tr>
          <td style="text-align:center">${i + 1}</td>
          <td>${e.name || e.ncc || "—"}</td>
          <td>${CATEGORY_LABEL[e.category || e.type] || e.category || "Khác"}</td>
          <td class="num">${fmtMoney(e.amount)} đ</td>
          <td style="font-size:11px;color:#64748b">${e.note || e.orderId || ""}</td>
        </tr>`).join("") : `<tr><td colspan="5" style="text-align:center;color:#94a3b8;padding:16px">Chưa có chi phí</td></tr>`}
        <tr class="total-row">
          <td colspan="3"><strong>Tổng chi phí thực tế</strong></td>
          <td class="num"><strong>${fmtMoney(totalExpenses)} đ</strong></td>
          <td></td>
        </tr>
      </tbody>
    </table>
  </div>

  ${additionalItems.length > 0 ? `
  <div class="section">
    <div class="section-title">Dịch vụ bổ sung phát sinh</div>
    <table class="items">
      <thead><tr><th>Dịch vụ</th><th class="num">Số lượng</th><th class="num">Đơn giá</th><th class="num">Thành tiền</th></tr></thead>
      <tbody>
        ${additionalItems.map(a => `<tr><td>${a.name}</td><td class="num">${a.qty || 1} ${a.unit || ""}</td><td class="num">${fmtMoney(a.unitPrice || a.totalPrice)} đ</td><td class="num">${fmtMoney(a.totalPrice)} đ</td></tr>`).join("")}
      </tbody>
    </table>
  </div>` : ""}

  <div class="section">
    <div class="highlight-box" style="background:${balance >= 0 ? "linear-gradient(135deg,#1d4d1a,#2e7d32)" : "linear-gradient(135deg,#7c2d12,#b0554a)"}">
      <div class="hl-label">${balance >= 0 ? "Số tiền HDV hoàn lại Công ty" : "Công ty hoàn thêm cho HDV"}</div>
      <div class="hl-value">${fmtMoney(Math.abs(balance))} đồng</div>
      <div class="hl-sub">Tạm ứng ${fmtMoney(advanceAmount||0)} đ − Chi phí thực tế ${fmtMoney(totalExpenses)} đ</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Danh mục chứng từ kèm theo</div>
    <div class="terms">
      <p>☐ Hóa đơn / biên lai vận chuyển</p>
      <p>☐ Hóa đơn / biên lai khách sạn</p>
      <p>☐ Hóa đơn / biên lai ăn uống</p>
      <p>☐ Vé tham quan (nếu có)</p>
      <p>☐ Hóa đơn dịch vụ phát sinh</p>
      <p>☐ Sổ ký nhận của khách (nếu có)</p>
    </div>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-top:28px;">
    <div class="sign-box">
      <div class="sign-title">Hướng dẫn viên</div>
      <div class="sign-name">${hdv?.name || "——————————"}</div>
      <div class="sign-space"></div>
      <div class="sign-name">Ký xác nhận quyết toán</div>
    </div>
    <div class="sign-box">
      <div class="sign-title">Kế toán duyệt</div>
      <div class="sign-name">——————————</div>
      <div class="sign-space"></div>
      <div class="sign-name">Ký duyệt</div>
    </div>
    <div class="sign-box">
      <div class="sign-title">Giám đốc</div>
      <div class="sign-name">——————————</div>
      <div class="sign-space"></div>
      <div class="sign-name">Ký, đóng dấu</div>
    </div>
  </div>`;

  return printBase(`Quyết toán tour – ${order.id}`, body, contractNo);
}

// ── PHIẾU HOÀN TRẢ TIỀN ──────────────────────────────────
export function buildRefundVoucher({
  order = {},
  refundNo,
  refundDate,
  customerName,
  customerPhone,
  customerBank,        // { bankName, accountNo, accountName }
  totalPaid = 0,       // tổng đã thu
  refundAmount = 0,    // số tiền hoàn trả
  deductAmount = 0,    // phí khấu trừ (phí hủy, phí dịch vụ...)
  deductReason = "",   // lý do khấu trừ
  refundReason = "",   // lý do hoàn tiền (tiền thừa / hủy tour / dịch vụ không xảy ra...)
  refundMethod = "transfer", // "transfer" | "cash"
  refundType = "overpay",  // "overpay" | "cancel" | "partial"
  issuerName = "",
  note = "",
}) {
  const voucherNo  = refundNo  || ("PHT-" + Date.now().toString().slice(-6));
  const dateStr    = refundDate || new Date().toLocaleDateString("vi-VN");
  const cName      = customerName || order?.customerName || "—";
  const cPhone     = customerPhone || order?.customerPhone || "—";
  const orderId    = order?.id || "—";
  const tourName   = order?.tourName || order?.serviceName || "—";
  const departDate = order?.departDate ? new Date(order.departDate).toLocaleDateString("vi-VN") : "—";
  const grossRefund = refundAmount + deductAmount; // tổng trước khi trừ phí

  const refundTypeLabel = {
    overpay: "Hoàn tiền thừa",
    cancel:  "Hoàn tiền hủy tour / dịch vụ",
    partial: "Hoàn tiền một phần dịch vụ",
  }[refundType] || "Hoàn trả tiền";

  const body = `<div class="page">

  <div class="header">
    ${coHeader()}
    <div class="doc-title">
      <div class="doc-type" style="color:#7c3aed">PHIẾU HOÀN TRẢ TIỀN</div>
      <div class="doc-id">Số: ${voucherNo}</div>
      <div class="doc-date">Ngày: ${dateStr}</div>
      <div style="margin-top:6px">
        <span class="badge" style="background:#f5f3ff;color:#7c3aed;border:1px solid #c4b5fd">${refundTypeLabel}</span>
      </div>
    </div>
  </div>

  <!-- Số tiền hoàn trả (highlight box) -->
  <div class="amount-box hoan">
    <div>
      <div class="amount-label">Số tiền hoàn trả cho khách</div>
      <div class="amount-value">${Math.round(refundAmount).toLocaleString("vi-VN")} đ</div>
      <div class="amount-words">${soThanhChu(refundAmount)}</div>
    </div>
    <div style="text-align:right">
      <div class="amount-label">Hình thức hoàn</div>
      <div style="color:#fff;font-weight:600;font-size:15px;margin-top:3px">
        ${refundMethod === "transfer" ? "🏦 Chuyển khoản" : "💵 Tiền mặt"}
      </div>
    </div>
  </div>

  <!-- Thông tin khách hàng -->
  <div class="section-title">Thông tin khách hàng</div>
  <div class="info-grid">
    <div class="info-row">
      <span class="info-label">Họ và tên</span>
      <span class="info-value highlight">${cName}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Số điện thoại</span>
      <span class="info-value">${cPhone}</span>
    </div>
    ${customerBank?.accountNo ? `
    <div class="info-row" style="grid-column:1/-1">
      <span class="info-label">Tài khoản nhận hoàn trả</span>
      <span class="info-value">${customerBank.bankName || ""} &nbsp;|&nbsp; STK: <strong>${customerBank.accountNo}</strong> &nbsp;|&nbsp; Chủ TK: ${customerBank.accountName || cName}</span>
    </div>` : ""}
  </div>

  <!-- Thông tin đơn hàng -->
  <div class="section-title">Thông tin đơn hàng liên quan</div>
  <div class="info-grid">
    <div class="info-row">
      <span class="info-label">Mã đơn hàng</span>
      <span class="info-value highlight">${orderId}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Ngày khởi hành</span>
      <span class="info-value">${departDate}</span>
    </div>
    <div class="info-row" style="grid-column:1/-1">
      <span class="info-label">Dịch vụ</span>
      <span class="info-value">${tourName}</span>
    </div>
    <div class="info-row" style="grid-column:1/-1">
      <span class="info-label">Lý do hoàn tiền</span>
      <span class="info-value">${refundReason || "—"}</span>
    </div>
  </div>

  <!-- Bảng tính toán -->
  <div class="section-title">Chi tiết tính toán</div>
  <table class="items">
    <thead>
      <tr>
        <th>Khoản mục</th>
        <th class="text-right">Số tiền (đ)</th>
        <th>Ghi chú</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Tổng tiền đã thu của khách</td>
        <td class="text-right">${Math.round(totalPaid).toLocaleString("vi-VN")}</td>
        <td style="color:#64748b;font-size:11px">Theo phiếu thu</td>
      </tr>
      ${deductAmount > 0 ? `
      <tr>
        <td style="color:#b91c1c">Phí khấu trừ</td>
        <td class="text-right" style="color:#b91c1c">– ${Math.round(deductAmount).toLocaleString("vi-VN")}</td>
        <td style="color:#64748b;font-size:11px">${deductReason || "Phí hủy theo chính sách"}</td>
      </tr>` : ""}
      <tr class="total-row">
        <td>💜 Số tiền hoàn trả cho khách</td>
        <td class="text-right" style="color:#7c3aed;font-size:15px">${Math.round(refundAmount).toLocaleString("vi-VN")}</td>
        <td style="color:#7c3aed;font-weight:600;font-size:11px">${soThanhChu(refundAmount)}</td>
      </tr>
    </tbody>
  </table>

  ${note ? `<div style="background:#faf5ff;border:1px solid #e9d5ff;border-radius:8px;padding:10px 14px;font-size:12px;color:#6d28d9;margin-bottom:16px">
    📌 <strong>Ghi chú:</strong> ${note}
  </div>` : ""}

  <div style="background:#fef9e7;border:1px solid #e8c53a;border-radius:8px;padding:10px 14px;font-size:11.5px;color:#7a5a00;margin-bottom:20px;line-height:1.7">
    ✅ Phiếu này xác nhận việc hoàn trả tiền cho khách hàng.<br>
    Vui lòng kiểm tra số tiền trước khi ký nhận. Sau khi ký, mọi khiếu nại về số tiền sẽ không được giải quyết.<br>
    Thắc mắc liên hệ: <strong>${COMPANY.phone}</strong> &nbsp;|&nbsp; <strong>${COMPANY.email}</strong>
  </div>

  <!-- Chữ ký -->
  <div class="sign-row" style="grid-template-columns:1fr 1fr 1fr 1fr">
    <div class="sign-box">
      <div class="sign-title">Khách hàng<br><span style="font-weight:400;font-size:10px">(Ký, ghi rõ họ tên)</span></div>
      <div class="sign-name" style="margin-top:56px">${cName}</div>
    </div>
    <div class="sign-box">
      <div class="sign-title">Người lập phiếu</div>
      <div class="sign-name" style="margin-top:56px">${issuerName || "——————"}</div>
    </div>
    <div class="sign-box">
      <div class="sign-title">Kế toán<br><span style="font-weight:400;font-size:10px">(Duyệt chi)</span></div>
      <div class="sign-name" style="margin-top:56px">——————</div>
    </div>
    <div class="sign-box">
      <div class="sign-title">Giám đốc<br><span style="font-weight:400;font-size:10px">(Ký, đóng dấu)</span></div>
      <div class="sign-name" style="margin-top:56px">——————</div>
    </div>
  </div>

  <div class="footer">
    <span>MST: ${COMPANY.taxCode} &nbsp;|&nbsp; ${COMPANY.website}</span>
    <span>In lúc: ${new Date().toLocaleString("vi-VN")} &nbsp;|&nbsp; Số phiếu: ${voucherNo}</span>
  </div>

</div>`;

  return printBase(`Phiếu hoàn trả tiền – ${orderId}`, body, voucherNo);
}

// ══════════════════════════════════════════════════════════════
// #9 — DANH SÁCH HÀNH KHÁCH
// Gửi NCC / HDV / Khách sạn trước ngày khởi hành
// ══════════════════════════════════════════════════════════════
export function buildPassengerList({ order, passengers = [], hdv, vehicle, issuerName }) {
  const fmtDate = d => d ? new Date(d).toLocaleDateString("vi-VN") : "—";
  const paxList = passengers.length > 0 ? passengers
    : (order?.passengers || []).length > 0 ? order.passengers
    : [];

  // Nếu chưa có danh sách hành khách → tạo dòng trống theo pax count
  const adultQty  = order?.adultQty  || order?.pax?.adults   || order?.pax || 1;
  const child10Qty = order?.child10Qty || order?.pax?.child10 || 0;
  const infantQty = order?.infantQty  || order?.pax?.infant  || 0;
  const totalPax  = Number(adultQty) + Number(child10Qty) + Number(infantQty);

  const rows = paxList.length > 0
    ? paxList.map((p, i) => `
      <tr>
        <td style="text-align:center">${i + 1}</td>
        <td style="font-weight:600">${p.name || p.fullName || "—"}</td>
        <td style="text-align:center">${p.dob ? fmtDate(p.dob) : (p.birthYear || "—")}</td>
        <td style="text-align:center">${p.gender === "male" ? "Nam" : p.gender === "female" ? "Nữ" : (p.sex || "—")}</td>
        <td>${p.cccd || p.passport || "—"}</td>
        <td style="text-align:center">${p.type === "child" || p.type === "child10" ? "TE" : p.type === "infant" || p.type === "baby" ? "Em bé" : "NL"}</td>
        <td style="color:#64748b;font-size:11px">${p.note || p.specialRequest || ""}</td>
      </tr>`)
    : Array.from({length: Math.max(totalPax, 1)}, (_, i) => `
      <tr style="height:28px">
        <td style="text-align:center">${i + 1}</td>
        <td></td><td></td><td></td><td></td>
        <td style="text-align:center">${i < adultQty ? "NL" : i < Number(adultQty)+Number(child10Qty) ? "TE" : "Em bé"}</td>
        <td></td>
      </tr>`);

  const body = `<div class="page">
  <div class="header">
    ${coHeader()}
    <div class="doc-title">
      <div class="doc-type">DANH SÁCH HÀNH KHÁCH</div>
      <div class="doc-id">Đoàn: ${order?.id || "—"}</div>
      <div class="doc-date">Ngày lập: ${new Date().toLocaleDateString("vi-VN")}</div>
    </div>
  </div>

  <!-- Thông tin đoàn -->
  <div style="background:#f0f4ff;border-radius:10px;padding:14px 18px;margin-bottom:16px;display:grid;grid-template-columns:1fr 1fr;gap:8px">
    <div><span style="font-size:10px;color:#94a3b8;text-transform:uppercase;font-weight:600">Tour / Dịch vụ</span><br>
      <strong style="font-size:14px;color:#1e3a8a">${order?.tourName || order?.serviceName || "—"}</strong></div>
    <div><span style="font-size:10px;color:#94a3b8;text-transform:uppercase;font-weight:600">Mã đơn hàng</span><br>
      <strong style="font-size:14px;color:#1e3a8a">${order?.id || "—"}</strong></div>
    <div><span style="font-size:10px;color:#94a3b8;text-transform:uppercase;font-weight:600">Ngày khởi hành</span><br>
      <strong>${fmtDate(order?.departDate)}</strong></div>
    <div><span style="font-size:10px;color:#94a3b8;text-transform:uppercase;font-weight:600">Ngày về</span><br>
      <strong>${fmtDate(order?.returnDate)}</strong></div>
    <div><span style="font-size:10px;color:#94a3b8;text-transform:uppercase;font-weight:600">Hướng dẫn viên</span><br>
      <strong>${hdv?.name || order?.hdvName || "Chưa phân công"}</strong>
      ${(hdv?.phone || order?.hdvPhone) ? `<span style="color:#64748b;font-size:12px"> — ${hdv?.phone || order?.hdvPhone}</span>` : ""}
    </div>
    <div><span style="font-size:10px;color:#94a3b8;text-transform:uppercase;font-weight:600">Phương tiện</span><br>
      <strong>${vehicle || order?.vehicle || "—"}</strong></div>
    <div><span style="font-size:10px;color:#94a3b8;text-transform:uppercase;font-weight:600">Số khách</span><br>
      <strong>${totalPax} người</strong>
      <span style="color:#64748b;font-size:12px"> (${adultQty} NL${Number(child10Qty)>0?" · "+child10Qty+" TE":""}${Number(infantQty)>0?" · "+infantQty+" Em bé":""})</span>
    </div>
    <div><span style="font-size:10px;color:#94a3b8;text-transform:uppercase;font-weight:600">Điểm khởi hành</span><br>
      <strong>${order?.departFrom || "—"}</strong></div>
  </div>

  <!-- Bảng hành khách -->
  <table class="items" style="font-size:12px">
    <thead>
      <tr>
        <th style="width:32px;text-align:center">STT</th>
        <th>Họ và tên</th>
        <th style="width:90px;text-align:center">Ngày sinh</th>
        <th style="width:45px;text-align:center">GT</th>
        <th style="width:130px">CCCD / Hộ chiếu</th>
        <th style="width:55px;text-align:center">Loại</th>
        <th>Yêu cầu đặc biệt / Ghi chú</th>
      </tr>
    </thead>
    <tbody>
      ${rows.join("")}
    </tbody>
    <tfoot>
      <tr class="total-row">
        <td colspan="5" style="text-align:right">Tổng số hành khách:</td>
        <td colspan="2"><strong>${totalPax} người</strong> (${adultQty} NL${Number(child10Qty)>0?", "+child10Qty+" TE":""}${Number(infantQty)>0?", "+infantQty+" Em bé":""})</td>
      </tr>
    </tfoot>
  </table>

  <div style="background:#fef9e7;border:1px solid #e8c53a;border-radius:8px;padding:10px 14px;font-size:11.5px;color:#7a5a00;margin:16px 0;line-height:1.7">
    ⚠️ <strong>Lưu ý:</strong> Danh sách này là tài liệu nội bộ dùng để điều phối chuyến đi.
    Hành khách cần mang theo CCCD/Hộ chiếu bản gốc. Mọi thay đổi phải thông báo cho điều hành trước
    <strong>24 giờ</strong> trước giờ khởi hành. Liên hệ: <strong>${COMPANY.phoneDH}</strong>
  </div>

  <div class="sign-row" style="grid-template-columns:1fr 1fr 1fr 1fr;margin-top:20px">
    <div class="sign-box">
      <div class="sign-title">Hướng dẫn viên</div>
      <div class="sign-name" style="margin-top:52px">${hdv?.name || order?.hdvName || "——————"}</div>
    </div>
    <div class="sign-box">
      <div class="sign-title">Điều hành</div>
      <div class="sign-name" style="margin-top:52px">${issuerName || "——————"}</div>
    </div>
    <div class="sign-box">
      <div class="sign-title">Kế toán</div>
      <div class="sign-name" style="margin-top:52px">——————</div>
    </div>
    <div class="sign-box">
      <div class="sign-title">Giám đốc</div>
      <div class="sign-name" style="margin-top:52px">——————</div>
    </div>
  </div>

  <div class="footer">
    <span>MST: ${COMPANY.taxCode} · ${COMPANY.website} · ĐT: ${COMPANY.phoneDH}</span>
    <span>In lúc: ${new Date().toLocaleString("vi-VN")} · Đoàn: ${order?.id || "—"}</span>
  </div>
</div>`;

  return printBase(`Danh sách hành khách – ${order?.id || ""}`, body, order?.id);
}


// ══════════════════════════════════════════════════════════════
// #10 — VOUCHER DỊCH VỤ (gửi NCC / khách sạn / hãng bay)
// Xác nhận booking với nhà cung cấp
// ══════════════════════════════════════════════════════════════
export function buildServiceVoucher({
  order,
  booking = {},          // NCC booking record
  supplier = {},         // NCC info
  voucherNo,
  serviceType = "hotel", // "hotel" | "flight" | "cruise" | "transport" | "ticket" | "other"
  checkIn, checkOut,
  roomType, roomCount,
  mealPlan,              // "BB" | "HB" | "FB" | "AI"
  specialRequests,
  flightNo, seatClass,
  paxCount,
  issuerName,
  note,
}) {
  const fmtDate = d => d ? new Date(d).toLocaleDateString("vi-VN") : "—";
  const vid = voucherNo || booking?.id || ("VCH-" + Date.now().toString().slice(-6));
  const today = new Date().toLocaleDateString("vi-VN");

  const pax = paxCount || booking?.pax || order?.pax?.adults || order?.adultQty || 1;
  const ci  = checkIn  || booking?.checkIn  || order?.departDate;
  const co  = checkOut || booking?.checkOut || order?.returnDate;
  const svc = supplier?.name || supplier?.ten || booking?.nccName || "—";

  const typeConfig = {
    hotel:     { icon:"🏨", label:"VOUCHER ĐẶT PHÒNG KHÁCH SẠN",  accentColor:"#0369a1" },
    flight:    { icon:"✈️", label:"VOUCHER VÉ MÁY BAY",             accentColor:"#1e3a8a" },
    cruise:    { icon:"🚢", label:"VOUCHER ĐẶT PHÒNG DU THUYỀN",   accentColor:"#1e40af" },
    transport: { icon:"🚌", label:"VOUCHER ĐẶT XE / VẬN CHUYỂN",  accentColor:"#166534" },
    ticket:    { icon:"🎟", label:"VOUCHER VÉ THAM QUAN",           accentColor:"#7c3aed" },
    other:     { icon:"📋", label:"VOUCHER DỊCH VỤ",                accentColor:"#374151" },
  }[serviceType] || { icon:"📋", label:"VOUCHER DỊCH VỤ", accentColor:"#374151" };

  const mealPlanLabel = { BB:"Breakfast (Ăn sáng)", HB:"Half Board (Sáng + Tối)", FB:"Full Board (3 bữa)", AI:"All Inclusive" }[mealPlan] || "";

  const body = `<div class="page">
  <div class="header">
    ${coHeader()}
    <div class="doc-title">
      <div class="doc-type" style="color:${typeConfig.accentColor}">${typeConfig.icon} ${typeConfig.label}</div>
      <div class="doc-id">Số: ${vid}</div>
      <div class="doc-date">Ngày cấp: ${today}</div>
      <div style="margin-top:6px">
        <span class="badge" style="background:#ecfdf5;color:#065f46;border:1px solid #a7f3d0">✓ ĐÃ XÁC NHẬN ĐẶT DỊCH VỤ</span>
      </div>
    </div>
  </div>

  <!-- Hero box -->
  <div style="background:linear-gradient(135deg,${typeConfig.accentColor},${typeConfig.accentColor}cc);border-radius:12px;padding:18px 22px;margin-bottom:18px;color:#fff;position:relative;overflow:hidden">
    <div style="position:absolute;right:18px;top:12px;font-size:52px;opacity:.15">${typeConfig.icon}</div>
    <div style="font-size:11px;color:rgba(255,255,255,.7);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Nhà cung cấp</div>
    <div style="font-size:20px;font-weight:700;color:#fff;margin-bottom:10px">${svc}</div>
    <div style="display:flex;flex-wrap:wrap;gap:8px;font-size:12px">
      <span style="background:rgba(255,255,255,.15);border-radius:20px;padding:3px 12px">📋 Đoàn: ${order?.id || "—"}</span>
      <span style="background:rgba(255,255,255,.15);border-radius:20px;padding:3px 12px">👥 ${pax} khách</span>
      ${ci ? `<span style="background:rgba(255,255,255,.15);border-radius:20px;padding:3px 12px">📅 ${fmtDate(ci)}${co ? " → " + fmtDate(co) : ""}</span>` : ""}
    </div>
  </div>

  <!-- Thông tin đặt dịch vụ -->
  <div class="section-title">Thông tin đặt dịch vụ</div>
  <div class="info-grid">
    <div class="info-row">
      <span class="info-label">Mã voucher</span>
      <span class="info-value highlight" style="font-family:monospace;font-size:15px">${vid}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Mã đơn hàng</span>
      <span class="info-value highlight">${order?.id || "—"}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Tên đoàn / Tour</span>
      <span class="info-value">${order?.tourName || order?.serviceName || "—"}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Số lượng khách</span>
      <span class="info-value"><strong>${pax} người</strong></span>
    </div>
    ${serviceType === "hotel" || serviceType === "cruise" ? `
    <div class="info-row">
      <span class="info-label">Ngày nhận phòng (Check-in)</span>
      <span class="info-value highlight">${fmtDate(ci)}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Ngày trả phòng (Check-out)</span>
      <span class="info-value highlight">${fmtDate(co)}</span>
    </div>
    ${roomType ? `<div class="info-row"><span class="info-label">Loại phòng</span><span class="info-value">${roomType}</span></div>` : ""}
    ${roomCount ? `<div class="info-row"><span class="info-label">Số lượng phòng</span><span class="info-value"><strong>${roomCount} phòng</strong></span></div>` : ""}
    ${mealPlanLabel ? `<div class="info-row"><span class="info-label">Chế độ ăn</span><span class="info-value">${mealPlanLabel}</span></div>` : ""}
    ` : ""}
    ${serviceType === "flight" ? `
    <div class="info-row">
      <span class="info-label">Số hiệu chuyến bay</span>
      <span class="info-value highlight">${flightNo || booking?.pnrCode || "—"}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Ngày bay</span>
      <span class="info-value">${fmtDate(ci)}</span>
    </div>
    ${seatClass ? `<div class="info-row"><span class="info-label">Hạng ghế</span><span class="info-value">${seatClass}</span></div>` : ""}
    <div class="info-row">
      <span class="info-label">Mã PNR / Booking</span>
      <span class="info-value highlight" style="font-family:monospace">${booking?.pnrCode || "—"}</span>
    </div>
    ` : ""}
    ${booking?.amount ? `
    <div class="info-row">
      <span class="info-label">Giá trị booking</span>
      <span class="info-value" style="color:#1e3a8a;font-weight:700">${Math.round(booking.amount).toLocaleString("vi-VN")} đ</span>
    </div>
    ` : ""}
    ${booking?.timeLimit ? `
    <div class="info-row">
      <span class="info-label">Hạn xác nhận (Time limit)</span>
      <span class="info-value" style="color:#dc2626;font-weight:600">${fmtDate(booking.timeLimit)}</span>
    </div>
    ` : ""}
  </div>

  <!-- Thông tin khách hàng -->
  <div class="section-title">Thông tin khách hàng chính</div>
  <div class="info-grid">
    <div class="info-row">
      <span class="info-label">Họ và tên</span>
      <span class="info-value highlight">${order?.customerName || "—"}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Điện thoại</span>
      <span class="info-value">${order?.customerPhone || "—"}</span>
    </div>
    ${order?.customerEmail ? `<div class="info-row"><span class="info-label">Email</span><span class="info-value">${order.customerEmail}</span></div>` : ""}
    ${specialRequests ? `<div class="info-row" style="grid-column:1/-1"><span class="info-label">Yêu cầu đặc biệt</span><span class="info-value" style="color:#d97706">${specialRequests}</span></div>` : ""}
  </div>

  <!-- Thông tin liên hệ công ty -->
  <div class="section-title">Đơn vị đặt dịch vụ</div>
  <div style="background:#f8fafc;border-radius:8px;padding:14px;margin-bottom:16px;font-size:13px;line-height:1.9">
    <strong>${COMPANY.fullName}</strong><br>
    📍 ${COMPANY.address}<br>
    🏢 VPGD: ${COMPANY.office}<br>
    📞 Điều hành: <strong>${COMPANY.phoneDH}</strong> &nbsp;|&nbsp; VMB: ${COMPANY.phoneVMB}<br>
    ✉️ ${COMPANY.email} &nbsp;|&nbsp; 🌐 ${COMPANY.website}<br>
    MST: ${COMPANY.taxCode}
  </div>

  ${note ? `<div class="notice-box">📌 <strong>Ghi chú:</strong> ${note}</div>` : ""}

  <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px 16px;font-size:12px;color:#166534;margin:14px 0;line-height:1.7">
    ✅ Voucher này xác nhận đặt dịch vụ hợp lệ từ <strong>${COMPANY.name}</strong>.<br>
    Nhà cung cấp vui lòng xác nhận lại bằng văn bản hoặc email trước <strong>${booking?.timeLimit ? fmtDate(booking.timeLimit) : "ngày khởi hành"}</strong>.<br>
    Mọi thắc mắc vui lòng liên hệ: <strong>${COMPANY.phoneDH}</strong> (giờ hành chính).
  </div>

  <div class="sign-row" style="grid-template-columns:1fr 1fr">
    <div class="sign-box">
      <div class="sign-title">Nhà cung cấp xác nhận<br><span style="font-weight:400;font-size:10px">(Ký, đóng dấu)</span></div>
      <div class="sign-name" style="margin-top:52px">${svc}</div>
    </div>
    <div class="sign-box">
      <div class="sign-title">Đại diện ${COMPANY.name.split(" ").slice(-2).join(" ")}<br><span style="font-weight:400;font-size:10px">Điều hành / Sale</span></div>
      <div class="sign-name" style="margin-top:52px">${issuerName || order?.sale || "——————"}</div>
    </div>
  </div>

  <div class="footer">
    <span>MST: ${COMPANY.taxCode} · ${COMPANY.website}</span>
    <span>Voucher: ${vid} · In lúc: ${new Date().toLocaleString("vi-VN")}</span>
  </div>
</div>`;

  return printBase(`Voucher dịch vụ – ${vid}`, body, vid);
}


// ══════════════════════════════════════════════════════════════
// #11 — HỢP ĐỒNG DỊCH VỤ TỔNG HỢP (cho Combo)
// Khi đơn hàng có nhiều loại dịch vụ khác nhau
// ══════════════════════════════════════════════════════════════
export function buildContractCombo({ order, contractNo, issuerName, extraTerms }) {
  const fmtDate  = d => d ? new Date(d).toLocaleDateString("vi-VN") : "…………………";
  const fmtMoney = n => Math.round(n || 0).toLocaleString("vi-VN");
  const cNo = contractNo || ("HĐ-TH-" + (order?.id || Date.now().toString().slice(-6)));
  const today = new Date().toLocaleDateString("vi-VN");
  const c = order?.customer || {};
  const totalPrice = order?.totalPrice || order?.pricing?.totalRevenue || 0;
  const depositAmt = order?.depositAmount || Math.round(totalPrice * 0.3);
  const finalAmt   = totalPrice - depositAmt;

  // Danh sách thành phần combo
  const comboItems = order?.comboComponents
    ? Object.entries(order.comboComponents)
        .filter(([, v]) => v?.enabled && Number(v?.priceAdult) > 0)
        .map(([k, v]) => ({
          key: k,
          label: { flight:"Vé máy bay", tour_ghep:"Tour ghép", cruise:"Du thuyền", hotel:"Khách sạn", ticket:"Vé tham quan" }[k] || k,
          priceAdult: Number(v.priceAdult) || 0,
        }))
    : [];
  const discount = Number(order?.comboDiscount) || 0;

  const body = `<div class="page">
  <div class="header">
    ${coHeader()}
    <div class="doc-title">
      <div class="doc-type" style="font-size:17px">HỢP ĐỒNG DỊCH VỤ</div>
      <div class="doc-type" style="font-size:13px;color:#7c3aed">TỔNG HỢP (COMBO)</div>
      <div class="doc-id">Số: ${cNo}</div>
      <div class="doc-date">Ngày: ${today}</div>
    </div>
  </div>

  <div style="text-align:center;margin:10px 0 18px">
    <span style="background:#f5f3ff;color:#7c3aed;border:1px solid #c4b5fd;border-radius:20px;padding:4px 18px;font-size:12px;font-weight:600">
      📦 GÓI DỊCH VỤ COMBO: ${order?.comboName || order?.tourName || "—"}
    </span>
  </div>

  <!-- Bên A -->
  <div class="section-title">BÊN A — ĐƠN VỊ CUNG CẤP DỊCH VỤ</div>
  <div style="background:#f0f4ff;border-radius:8px;padding:14px 18px;margin-bottom:14px;font-size:13px;line-height:1.9">
    <strong>${COMPANY.fullName}</strong><br>
    📍 Địa chỉ: ${COMPANY.address}<br>
    🏢 VPGD: ${COMPANY.office}<br>
    📞 Điện thoại: ${COMPANY.phoneDH} &nbsp;|&nbsp; ${COMPANY.phoneVMB}<br>
    ✉️ Email: ${COMPANY.email} &nbsp;|&nbsp; MST: ${COMPANY.taxCode}<br>
    Đại diện: <strong>${issuerName || "…………………………………"}</strong> &nbsp;|&nbsp; Chức vụ: Sale / Điều hành
  </div>

  <!-- Bên B -->
  <div class="section-title">BÊN B — KHÁCH HÀNG</div>
  <div style="background:#f8fafc;border-radius:8px;padding:14px 18px;margin-bottom:14px;font-size:13px;line-height:1.9">
    ${corpCustomerLines(c)}
    ${c.companyName ? "Người đại diện" : "Họ và tên"}: <strong>${c.name || order?.customerName || "…………………………………"}</strong><br>
    Điện thoại: <strong>${c.phone || order?.customerPhone || "…………………"}</strong>
    &nbsp;|&nbsp; Email: ${c.email || order?.customerEmail || "…………………………………"}<br>
    CCCD/CMND: ${c.cccd || order?.customerCccd || "………………………"}&nbsp;|&nbsp;
    Địa chỉ: ${c.address || order?.customerAddress || "…………………………………"}
  </div>

  <!-- Điều 1: Dịch vụ -->
  <div class="section-title">ĐIỀU 1. NỘI DUNG GÓI DỊCH VỤ</div>
  <table class="items">
    <thead>
      <tr>
        <th style="width:32px;text-align:center">STT</th>
        <th>Hạng mục dịch vụ</th>
        <th style="text-align:right">Đơn giá / NL (đ)</th>
        <th style="text-align:right">Thành tiền (đ)</th>
      </tr>
    </thead>
    <tbody>
      ${comboItems.length > 0
        ? comboItems.map((item, i) => `
          <tr>
            <td style="text-align:center">${i + 1}</td>
            <td>${item.label}</td>
            <td style="text-align:right">${fmtMoney(item.priceAdult)}</td>
            <td style="text-align:right;font-weight:600">${fmtMoney(item.priceAdult * (order?.adultQty || 1))}</td>
          </tr>`).join("")
        : `<tr><td style="text-align:center">1</td>
           <td colspan="3">${order?.tourName || order?.serviceName || "Gói dịch vụ tổng hợp"}</td></tr>`
      }
      ${discount > 0 ? `
      <tr style="color:#059669">
        <td colspan="2" style="font-style:italic">Chiết khấu Combo</td>
        <td colspan="2" style="text-align:right;font-weight:600">– ${fmtMoney(discount)} đ</td>
      </tr>` : ""}
    </tbody>
    <tfoot>
      <tr class="total-row">
        <td colspan="3" style="text-align:right">TỔNG GIÁ TRỊ HỢP ĐỒNG</td>
        <td style="text-align:right;color:#7c3aed;font-size:16px;font-weight:800">${fmtMoney(totalPrice)} đ</td>
      </tr>
    </tfoot>
  </table>

  <div style="font-size:12px;color:#64748b;font-style:italic;margin-bottom:16px">
    Bằng chữ: <em>${soThanhChu(totalPrice)}</em>
  </div>

  <!-- Điều 2: Lịch trình -->
  <div class="section-title">ĐIỀU 2. THỜI GIAN THỰC HIỆN</div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;background:#f8fafc;border-radius:8px;padding:14px 18px;margin-bottom:14px;font-size:13px;line-height:2">
    <div>Ngày khởi hành: <strong>${fmtDate(order?.departDate)}</strong></div>
    <div>Ngày kết thúc: <strong>${fmtDate(order?.returnDate)}</strong></div>
    <div>Số lượng khách: <strong>${order?.adultQty || 1} người lớn${order?.child10Qty>0?" · "+order.child10Qty+" trẻ em":""}</strong></div>
    <div>Địa điểm: <strong>${order?.destination || "—"}</strong></div>
  </div>

  <!-- Điều 3: Thanh toán -->
  <div class="section-title">ĐIỀU 3. PHƯƠNG THỨC THANH TOÁN</div>
  <table class="items">
    <thead>
      <tr><th>Đợt</th><th>Nội dung</th><th style="text-align:right">Số tiền (đ)</th><th>Hạn thanh toán</th></tr>
    </thead>
    <tbody>
      <tr>
        <td>Đợt 1</td>
        <td>Đặt cọc (${totalPrice > 0 ? Math.round(depositAmt/totalPrice*100) : 30}% giá trị HĐ)</td>
        <td style="text-align:right;font-weight:600;color:#1e3a8a">${fmtMoney(depositAmt)}</td>
        <td>Khi ký hợp đồng</td>
      </tr>
      <tr>
        <td>Đợt 2</td>
        <td>Thanh toán phần còn lại</td>
        <td style="text-align:right;font-weight:600;color:#1e3a8a">${fmtMoney(finalAmt)}</td>
        <td>Trước ngày đi <strong>07 ngày</strong></td>
      </tr>
    </tbody>
    <tfoot>
      <tr class="total-row">
        <td colspan="2" style="text-align:right">Tổng cộng</td>
        <td style="text-align:right">${fmtMoney(totalPrice)}</td>
        <td></td>
      </tr>
    </tfoot>
  </table>
  <div style="font-size:12px;color:#64748b;margin-bottom:14px">
    Hình thức: Chuyển khoản hoặc tiền mặt tại văn phòng.
    Nội dung CK: <em>[Họ tên] – ${order?.id || "Mã đơn"} – Dat coc / Thanh toan</em>
  </div>

  <!-- Điều 4: Quyền & Nghĩa vụ -->
  <div class="section-title">ĐIỀU 4. QUYỀN VÀ NGHĨA VỤ CÁC BÊN</div>
  <div style="font-size:12.5px;line-height:1.9;margin-bottom:14px">
    <strong>4.1. Bên A có nghĩa vụ:</strong>
    <ul style="margin:4px 0 8px 18px;color:#374151">
      <li>Cung cấp đầy đủ các dịch vụ trong gói Combo như đã thỏa thuận.</li>
      <li>Thông báo kịp thời các thay đổi về lịch trình, dịch vụ (nếu có) trước ít nhất 24 giờ.</li>
      <li>Cấp phiếu xác nhận, voucher cho từng hạng mục dịch vụ.</li>
      <li>Hoàn lại tiền cho Bên B theo chính sách hủy trong trường hợp dịch vụ không được thực hiện do lỗi của Bên A.</li>
    </ul>
    <strong>4.2. Bên B có nghĩa vụ:</strong>
    <ul style="margin:4px 0 0 18px;color:#374151">
      <li>Thanh toán đúng hạn và đúng số tiền theo hợp đồng.</li>
      <li>Cung cấp thông tin cá nhân chính xác (họ tên, CCCD/Passport, ngày sinh) trước 72 giờ khởi hành.</li>
      <li>Có mặt đúng giờ, đúng điểm tập trung theo thông báo của Bên A.</li>
      <li>Mang theo tài liệu gốc (CCCD/Hộ chiếu) trong suốt chuyến đi.</li>
    </ul>
  </div>

  <!-- Điều 5: Chính sách hủy -->
  <div class="section-title">ĐIỀU 5. CHÍNH SÁCH HỦY VÀ HOÀN TIỀN</div>
  <table class="items" style="font-size:12px">
    <thead>
      <tr><th>Thời gian hủy trước ngày đi</th><th style="text-align:right">Phí hủy</th></tr>
    </thead>
    <tbody>
      <tr><td>Từ 30 ngày trở lên</td><td style="text-align:right">Hoàn cọc 100% (trừ phí chuyển khoản)</td></tr>
      <tr><td>Từ 15 đến dưới 30 ngày</td><td style="text-align:right">Phí hủy 30% giá trị HĐ</td></tr>
      <tr><td>Từ 7 đến dưới 15 ngày</td><td style="text-align:right">Phí hủy 50% giá trị HĐ</td></tr>
      <tr><td>Từ 3 đến dưới 7 ngày</td><td style="text-align:right">Phí hủy 70% giá trị HĐ</td></tr>
      <tr><td>Dưới 3 ngày / Không báo</td><td style="text-align:right">Phí hủy 100% giá trị HĐ</td></tr>
    </tbody>
  </table>

  <!-- Điều 6: Điều khoản chung -->
  <div class="section-title">ĐIỀU 6. ĐIỀU KHOẢN CHUNG</div>
  <div style="font-size:12px;line-height:1.85;color:#374151;margin-bottom:16px">
    6.1. Hợp đồng có hiệu lực kể từ ngày ký và kết thúc khi các bên hoàn thành nghĩa vụ.<br>
    6.2. Mọi thay đổi, bổ sung phải được lập thành phụ lục có chữ ký của cả hai bên.<br>
    6.3. Tranh chấp phát sinh được giải quyết bằng thương lượng. Nếu không thành, đưa ra TAND có thẩm quyền tại Hải Phòng.<br>
    6.4. Hợp đồng được lập thành <strong>02 bản</strong> có giá trị pháp lý như nhau, mỗi bên giữ <strong>01 bản</strong>.<br>
    ${extraTerms ? `6.5. ${extraTerms}` : ""}
  </div>

  <div class="sign-row" style="grid-template-columns:1fr 1fr;margin-top:20px">
    <div class="sign-box">
      <div class="sign-title">BÊN B — KHÁCH HÀNG<br><span style="font-weight:400;font-size:10px">(Ký, ghi rõ họ tên)</span></div>
      <div class="sign-name" style="margin-top:60px">${c.name || order?.customerName || "——————————"}</div>
    </div>
    <div class="sign-box">
      <div class="sign-title">BÊN A — ${COMPANY.name.split(" ").slice(-2).join(" ")}<br><span style="font-weight:400;font-size:10px">(Ký, đóng dấu)</span></div>
      <div class="sign-name" style="margin-top:60px">${issuerName || "——————————"}</div>
    </div>
  </div>

  <div class="footer">
    <span>HĐ số: ${cNo} · MST: ${COMPANY.taxCode} · ${COMPANY.website}</span>
    <span>In lúc: ${new Date().toLocaleString("vi-VN")}</span>
  </div>
</div>`;

  return printBase(`Hợp đồng tổng hợp Combo – ${order?.id || ""}`, body, cNo);
}


export function PrintBtn({ onClick, label = "🖨 In phiếu", small = false }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        padding: small ? "5px 11px" : "7px 14px",
        borderRadius: 8, border: "1px solid #bfdbfe",
        background: "#eff6ff", color: "#1e3a8a",
        fontSize: small ? 11 : 12, fontWeight: 600,
        cursor: "pointer", whiteSpace: "nowrap",
        transition: "background .15s",
      }}
      onMouseEnter={e => e.currentTarget.style.background = "#dbeafe"}
      onMouseLeave={e => e.currentTarget.style.background = "#eff6ff"}
    >
      {label}
    </button>
  );
}

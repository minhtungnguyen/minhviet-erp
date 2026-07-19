// Bộ in ấn cũ hơn cho Phiếu thu / Phiếu chi / Phiếu xác nhận dịch vụ.
// Tồn tại song song với ./index.jsx (bộ in mới hơn, dùng cho hợp đồng/thanh lý...).
// Hai bộ này KHÁC NHAU về nội dung (COMPANY ở đây thiếu VPGD/số điện thoại phụ,
// và openPrintWindow ở ./index.jsx có thêm <base> tag để logo load đúng trong popup) —
// giữ nguyên hành vi hiện tại khi tách file, CHƯA gộp 2 bộ vì cần người phụ trách
// nghiệp vụ xác nhận nội dung nào là đúng trước khi thay đổi chứng từ tài chính.
import { soThanhChu } from "../utils/format.js";

const COMPANY = {
  name:    "CÔNG TY TNHH DU LỊCH MINH VIỆT",
  address: "Hải Phòng, Việt Nam",
  phone:   "0906 001 359",
  email:   "info@minhviettravel.vn",
  website: "www.minhviettravel.vn",
  taxCode: "0200000000",
};

// Shared CSS cho tất cả loại phiếu
const PRINT_CSS = `
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
  .co-sub     { font-size: 11px; color: #64748b; margin-top: 2px; line-height: 1.6; }
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

  /* Voucher tour styles */
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

// Mở cửa sổ in
export function openPrintWindow(htmlContent) {
  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) { alert("Trình duyệt đã chặn popup. Vui lòng cho phép popup cho trang này."); return; }
  win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>In phiếu</title>
    <style>${PRINT_CSS}</style></head><body>${htmlContent}
    <div class="no-print" style="position:fixed;bottom:20px;right:20px;display:flex;gap:8px;z-index:999">
      <button onclick="window.print()" style="padding:10px 22px;background:#1e3a8a;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;font-family:sans-serif">🖨 In / Lưu PDF</button>
      <button onclick="window.close()" style="padding:10px 16px;background:#f1f5f9;color:#475569;border:1px solid #e2e8f0;border-radius:8px;font-size:14px;cursor:pointer;font-family:sans-serif">✕ Đóng</button>
    </div>
    </body></html>`);
  win.document.close();
  setTimeout(() => win.focus(), 300);
}

// ── PHIẾU THU ────────────────────────────────────────────
export function buildPhieuThu(v, order) {
  const o = order || {};
  return `<div class="page">
    <div class="header">
      <div class="logo-area">
        <div class="logo-icon"><img src="/LogoMV.png" alt="MV"/></div>
        <div>
          <div class="co-name">${COMPANY.name}</div>
          <div class="co-sub">📍 ${COMPANY.address}<br>📞 ${COMPANY.phone} · ✉️ ${COMPANY.email}</div>
        </div>
      </div>
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

// ── PHIẾU CHI ────────────────────────────────────────────
export function buildPhieuChi(v, order) {
  const o = order || {};
  return `<div class="page">
    <div class="header">
      <div class="logo-area">
        <div class="logo-icon"><img src="/LogoMV.png" alt="MV"/></div>
        <div>
          <div class="co-name">${COMPANY.name}</div>
          <div class="co-sub">📍 ${COMPANY.address}<br>📞 ${COMPANY.phone} · ✉️ ${COMPANY.email}</div>
        </div>
      </div>
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

// ── PHIẾU XÁC NHẬN DỊCH VỤ CHO KHÁCH ────────────────────────────────
export function buildConfirmation(order, vouchers, tourOp) {
  const paid = vouchers
    .filter(v => v.orderId === order.id && v.type === "thu" && v.status === "approved")
    .reduce((s, v) => s + v.amount, 0);
  const customerName  = order.customerName  || order.customer?.name  || "—";
  const customerPhone = order.customerPhone || order.customer?.phone || "—";
  const customerEmail = order.customerEmail || order.customer?.email || "—";
  const totalPrice    = order.totalPrice    || order.pricing?.totalPrice || 0;
  const balance       = Math.max(0, totalPrice - paid);
  const totalPaxNum   = typeof order.pax === "number" ? order.pax
    : (order.adultQty||0)+(order.child10Qty||0)+(order.child5Qty||0)+(order.child2Qty||0)+(order.infantQty||0) || 1;
  const itinerary = tourOp?.itinerary || [];
  return `<div class="page">
    <div class="header">
      <div class="logo-area">
        <div class="logo-icon"><img src="/LogoMV.png" alt="MV"/></div>
        <div>
          <div class="co-name">${COMPANY.name}</div>
          <div class="co-sub">📍 ${COMPANY.address}<br>📞 ${COMPANY.phone} · ${COMPANY.website}</div>
        </div>
      </div>
      <div class="doc-title">
        <div class="doc-type">PHIẾU XÁC NHẬN DỊCH VỤ</div>
        <div class="doc-id">${order.id}</div>
        <div class="doc-date">Cấp ngày: ${new Date().toLocaleDateString("vi-VN")}</div>
      </div>
    </div>
    <div class="voucher-hero">
      <div style="font-size:13px;color:rgba(255,255,255,.75);margin-bottom:4px">Chào mừng quý khách đến với chuyến hành trình</div>
      <div style="font-size:22px;font-weight:700;color:#fff;margin-bottom:8px;line-height:1.2">${order.serviceName || order.tourName || "—"}</div>
      <div class="voucher-code">${order.id}</div>
      <div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:4px">
        <span class="voucher-tag">📅 ${order.departDate ? new Date(order.departDate).toLocaleDateString("vi-VN") : "—"} → ${order.returnDate ? new Date(order.returnDate).toLocaleDateString("vi-VN") : "—"}</span>
        <span class="voucher-tag">👥 ${totalPaxNum} khách</span>
        ${tourOp?.hdvName ? `<span class="voucher-tag">🎤 HDV: ${tourOp.hdvName}</span>` : ""}
        ${tourOp?.vehicle  ? `<span class="voucher-tag">🚌 ${tourOp.vehicle}</span>` : ""}
      </div>
    </div>
    <div class="section-title">Thông tin khách hàng</div>
    <div class="info-grid">
      <div class="info-row"><span class="info-label">Họ và tên</span><span class="info-value highlight">${customerName}</span></div>
      <div class="info-row"><span class="info-label">Số điện thoại</span><span class="info-value">${customerPhone}</span></div>
      <div class="info-row"><span class="info-label">Email</span><span class="info-value">${customerEmail}</span></div>
      ${tourOp?.meetPoint ? `<div class="info-row"><span class="info-label">Điểm tập trung</span><span class="info-value">${tourOp.meetPoint}</span></div>` : ""}
      ${tourOp?.meetTime  ? `<div class="info-row"><span class="info-label">Giờ tập trung</span><span class="info-value highlight">${tourOp.meetTime}</span></div>` : ""}
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
        <tr><td>Tổng giá trị dịch vụ</td><td class="text-right">${Math.round(totalPrice).toLocaleString("vi-VN")} đ</td><td>—</td></tr>
        <tr><td>Đã thanh toán</td><td class="text-right" style="color:#1e3a8a;font-weight:600">${Math.round(paid).toLocaleString("vi-VN")} đ</td><td><span class="badge badge-ok">✓ Xác nhận</span></td></tr>
        ${balance > 0 ? `<tr><td>Còn lại</td><td class="text-right" style="color:#b0554a;font-weight:600">${Math.round(balance).toLocaleString("vi-VN")} đ</td><td><span class="badge badge-pending">Chờ thu</span></td></tr>` : ""}
        <tr class="total-row"><td>Tổng đã xác nhận</td><td class="text-right">${Math.round(paid).toLocaleString("vi-VN")} đ</td><td>${paid >= totalPrice ? '<span class="badge badge-ok">✓ Đủ</span>' : '<span class="badge badge-pending">Chưa đủ</span>'}</td></tr>
      </tbody>
    </table>
    ${order.notes ? `<div class="notice-box">📝 <strong>Ghi chú:</strong> ${order.notes}</div>` : ""}
    <div class="notice-box">📌 <strong>Lưu ý:</strong> Vui lòng mang theo Phiếu xác nhận dịch vụ này và CCCD/Hộ chiếu khi đi tour. Liên hệ hotline <strong>${COMPANY.phone}</strong> nếu có thắc mắc. Chúc quý khách có chuyến đi vui vẻ! 🌟</div>
    <div class="sign-row" style="grid-template-columns:1fr 1fr;margin-top:20px">
      <div class="sign-box"><div class="sign-title">Khách hàng xác nhận</div><div class="sign-name">${customerName}</div></div>
      <div class="sign-box"><div class="sign-title">Đại diện Minh Việt Travel</div><div class="sign-name">Sale: ${order.sale || "—"}</div></div>
    </div>
    <div class="footer">
      <span>MST: ${COMPANY.taxCode} · ${COMPANY.website}</span>
      <span>In lúc: ${new Date().toLocaleString("vi-VN")}</span>
    </div>
  </div>`;
}

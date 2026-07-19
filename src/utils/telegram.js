// telegram.js — Gửi cảnh báo qua Telegram Bot API
// Không cần backend: gọi thẳng từ browser (Telegram hỗ trợ CORS)

const TG_CONFIG_KEY = "mv_erp_tg_config";

export function loadTgConfig() {
  try {
    const raw = localStorage.getItem(TG_CONFIG_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function saveTgConfig(cfg) {
  localStorage.setItem(TG_CONFIG_KEY, JSON.stringify(cfg));
}

export function clearTgConfig() {
  localStorage.removeItem(TG_CONFIG_KEY);
}

// Gửi 1 tin nhắn, trả về true/false
export async function sendTelegram(text, opts = {}) {
  const cfg = opts.cfg || loadTgConfig();
  if (!cfg?.enabled || !cfg.token || !cfg.chatId) return false;

  // Kiểm tra loại event có được bật không
  if (opts.event && cfg.events && !cfg.events.includes(opts.event)) return false;

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${cfg.token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: cfg.chatId,
          text,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      }
    );
    const json = await res.json();
    return json.ok === true;
  } catch (e) {
    console.warn("[Telegram] Lỗi gửi tin:", e);
    return false;
  }
}

// Gửi tin test để xác nhận cấu hình đúng
export async function testTelegram(token, chatId) {
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: "✅ <b>Minh Việt ERP</b>\n\nKết nối Telegram thành công! 🎉\nBạn sẽ nhận thông báo tại đây.",
          parse_mode: "HTML",
        }),
      }
    );
    const json = await res.json();
    if (!json.ok) throw new Error(json.description || "Lỗi không xác định");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// Template tin nhắn theo từng loại sự kiện
export const TG_MSG = {
  newOrder: (o) =>
    `🆕 <b>ĐƠN HÀNG MỚI</b>\n` +
    `📋 Mã: <code>${o.id}</code>\n` +
    `👤 KH: ${o.customer?.name || "—"} · ${o.customer?.phone || ""}\n` +
    `🗺 Dịch vụ: ${o.serviceName || "—"}\n` +
    `📅 Ngày đi: ${o.departDate || "—"}\n` +
    `💰 Doanh thu: ${Number(o.pricing?.totalRevenue || 0).toLocaleString("vi-VN")} đ\n` +
    `👤 Sale: ${o.sale || "—"}`,

  newVoucherThu: (v) =>
    `💳 <b>PHIẾU THU MỚI — Chờ duyệt</b>\n` +
    `📋 Mã: <code>${v.id}</code>\n` +
    `👤 KH: ${v.customerName || "—"}\n` +
    `💵 Số tiền: ${Number(v.amount).toLocaleString("vi-VN")} đ\n` +
    `💬 Nội dung: ${v.note || "—"}\n` +
    `🏦 Hình thức: ${v.method || "—"}`,

  newVoucherChi: (v) =>
    `📤 <b>YÊU CẦU CHI — Chờ duyệt</b>\n` +
    `📋 Mã: <code>${v.id}</code>\n` +
    `🏢 NCC: ${v.ncc || "—"}\n` +
    `💵 Số tiền: ${Number(v.amount).toLocaleString("vi-VN")} đ\n` +
    `💬 Nội dung: ${v.note || "—"}`,

  voucherApproved: (v) =>
    `✅ <b>PHIẾU ĐÃ ĐƯỢC DUYỆT</b>\n` +
    `📋 Mã: <code>${v.id}</code>\n` +
    `💵 ${Number(v.amount).toLocaleString("vi-VN")} đ — ${v.type === "thu" ? "Thu" : "Chi"}\n` +
    `👤 Người duyệt: ${v.approvedBy || "KT"}`,

  voucherRejected: (v) =>
    `❌ <b>PHIẾU BỊ TỪ CHỐI</b>\n` +
    `📋 Mã: <code>${v.id}</code>\n` +
    `💵 ${Number(v.amount).toLocaleString("vi-VN")} đ\n` +
    `💬 Vui lòng liên hệ kế toán`,

  expenseNeedsGD: (e) =>
    `⚠️ <b>CHI PHÍ CHỜ GIÁM ĐỐC DUYỆT</b>\n` +
    `📋 Mã: <code>${e.id}</code>\n` +
    `🏢 NCC: ${e.ncc || "—"}\n` +
    `💵 Số tiền: ${Number(e.amount).toLocaleString("vi-VN")} đ`,

  refundCreated: (r) =>
    `🔄 <b>YÊU CẦU HOÀN TIỀN MỚI</b>\n` +
    `📋 Mã: <code>${r.id}</code>\n` +
    `👤 KH: ${r.customerName || "—"}\n` +
    `💵 Hoàn: ${Number(r.refundAmount).toLocaleString("vi-VN")} đ\n` +
    `📋 Lý do: ${r.reason || "—"}`,

  paymentDeadline: (o, daysLeft) =>
    `⏰ <b>NHẮC HẠN THANH TOÁN</b>\n` +
    `📋 Đơn: <code>${o.id}</code>\n` +
    `👤 KH: ${o.customer?.name || "—"} · ${o.customer?.phone || ""}\n` +
    `💵 Còn lại: ${Number(o._remaining || 0).toLocaleString("vi-VN")} đ\n` +
    `⏳ Hạn: ${o.paymentDeadline2 || "—"} (còn ${daysLeft} ngày)`,

  tourDeparture: (o, daysLeft) =>
    `✈️ <b>TOUR SẮP KHỞI HÀNH</b>\n` +
    `📋 Đơn: <code>${o.id}</code>\n` +
    `🗺 Tour: ${o.serviceName || "—"}\n` +
    `👤 KH: ${o.customer?.name || "—"}\n` +
    `📅 Ngày đi: ${o.departDate} (còn ${daysLeft} ngày)\n` +
    `👥 Đoàn: ${(o.pax?.adults||0) + (o.pax?.children||0)} khách`,

  callThankReminder: (t) =>
    `📞 <b>NHẮC GỌI CẢM ƠN KHÁCH HÀNG</b>\n` +
    `👤 KH: ${t.customerName} — ${t.customerPhone}\n` +
    `🗺 Tour: ${t.serviceName || "—"}\n` +
    `📅 Ngày về: ${t.returnDate || "—"} (đã về 3 ngày)\n` +
    `🧑‍💼 Sale phụ trách: ${t.sale || "—"}\n` +
    `💬 Nhắc: Hỏi thăm chuyến đi, mời đánh giá 5⭐`,

  birthdayVoucher: (t) =>
    `🎂 <b>SINH NHẬT KHÁCH HÀNG HÔM NAY</b>\n` +
    `👤 KH: ${t.customerName} — ${t.customerPhone}\n` +
    `🎁 Mã voucher: <code>${t.voucherCode}</code>\n` +
    `💵 Giá trị: ${Number(t.voucherValue||0).toLocaleString("vi-VN")} đ\n` +
    `⏰ HSD: ${t.voucherExpiry || "31/12 năm nay"}\n` +
    `🧑‍💼 Sale phụ trách: ${t.sale || "Chưa gán"}`,
};

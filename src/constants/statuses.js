export const ORDER_STATUS = {
  pending_payment:{ label:"Chờ thu tiền",  color:"#7a5a00", bg:"#fef9e7", dot:"#e8c53a" },
  confirmed:      { label:"Đã xác nhận",   color:"#1d6b4f", bg:"#e8f5ef", dot:"#34b27c" },
  partial_paid:   { label:"Đã cọc",        color:"#2563eb", bg:"#eff6ff", dot:"#3b82f6" },
  full_paid:      { label:"Đã thu đủ",     color:"#1a4d8f", bg:"#e6f1fb", dot:"#3a8bd4" },
  in_service:     { label:"Đang dịch vụ",  color:"#5c2eb0", bg:"#f3f0ff", dot:"#8b5cf6" },
  completed:      { label:"Hoàn thành",    color:"#444",    bg:"#f0f4ff", dot:"#888"    },
  cancelled:      { label:"Đã hủy",        color:"#8b2a1a", bg:"#fdf0ee", dot:"#e07060" },
  locked:         { label:"Khóa đơn",      color:"#b0554a", bg:"#fdf0ee", dot:"#f87171" },
};

export const VOUCHER_STATUS = {
  pending:  { label:"Chờ duyệt",   color:"#7a5a00", bg:"#fef9e7" },
  approved: { label:"Đã duyệt",    color:"#1a4d8f", bg:"#e6f1fb" },
  rejected: { label:"Từ chối",     color:"#8b2a1a", bg:"#fdf0ee" },
};

export const PRICE_APPROVAL_STATUS = {
  draft_price:     { label:"Chờ xác nhận giá", color:"#7a5a00", bg:"#fef9e7", dot:"#e8c53a", icon:"⏳" },
  pending_review:  { label:"KT đã trình GĐ",   color:"#1a4d8f", bg:"#e6f1fb", dot:"#3b82f6", icon:"📋" },
  approved:        { label:"GĐ đã duyệt",       color:"#1d6b4f", bg:"#e8f5ef", dot:"#34b27c", icon:"✅" },
  returned:        { label:"Trả về sửa lại",    color:"#8b2a1a", bg:"#fdf0ee", dot:"#e07060", icon:"↩️" },
};

export const EXP_PIPELINE_STATUS = {
  draft:       { label:"Nháp",              color:"#888",    bg:"#f0f4ff",  dot:"#ccc"    },
  pending_kt:  { label:"Chờ KT Trưởng",    color:"#7a5a00", bg:"#fef9e7",  dot:"#e8c53a" },
  pending_gd:  { label:"Chờ Giám đốc",     color:"#5c2eb0", bg:"#f3f0ff",  dot:"#8b5cf6" },
  pending_pay: { label:"Chờ chuyển tiền",  color:"#1a4d8f", bg:"#e6f1fb",  dot:"#3a8bd4" },
  paid:        { label:"Đã chuyển tiền",   color:"#2563eb", bg:"#eff6ff",  dot:"#3b82f6" },
  rejected:    { label:"Bị từ chối",       color:"#8b2a1a", bg:"#fdf0ee",  dot:"#e07060" },
};

export const REFUND_STATUS = {
  draft:          { label:"Nháp",             color:"#888",    bg:"#f0f4ff", dot:"#ccc"    },
  pending_approve:{ label:"Chờ duyệt",        color:"#7a5a00", bg:"#fef9e7", dot:"#e8c53a" },
  approved:       { label:"Đã duyệt — chờ CK",color:"#1a4d8f", bg:"#e6f1fb", dot:"#3a8bd4" },
  paid:           { label:"Đã hoàn tiền",     color:"#2563eb", bg:"#eff6ff", dot:"#3b82f6" },
  rejected:       { label:"Từ chối",          color:"#8b2a1a", bg:"#fdf0ee", dot:"#e07060" },
};

export const CREDIT_STATUS = {
  active:      { label:"Đang bảo lưu",    color:"#1e3a8a", bg:"#eff6ff",  dot:"#3b82f6" },
  partial:     { label:"Đã dùng một phần",color:"#7a5a00", bg:"#fef9e7",  dot:"#e8c53a" },
  used:        { label:"Đã dùng hết",      color:"#2563eb", bg:"#eff6ff",  dot:"#93c5fd" },
  expired:     { label:"Hết hạn",          color:"#8b2a1a", bg:"#fdf0ee",  dot:"#e07060" },
  transferred: { label:"Đã chuyển KH khác",color:"#5c2eb0", bg:"#f3f0ff",  dot:"#a78bfa" },
};

export const TOUR_OP_STATUS = {
  planning:  { label:"Đang chuẩn bị", color:"#7a5a00", bg:"#fef9e7", dot:"#e8c53a" },
  confirmed: { label:"Đã xác nhận",   color:"#2563eb", bg:"#eff6ff", dot:"#3b82f6" },
  departed:  { label:"Đang đi tour",  color:"#5c2eb0", bg:"#f3f0ff", dot:"#8b5cf6" },
  completed: { label:"Đã kết thúc",   color:"#444",    bg:"#f0f4ff", dot:"#888"    },
  cancelled: { label:"Đã hủy",        color:"#8b2a1a", bg:"#fdf0ee", dot:"#e07060" },
};

export const BK_STATUS = {
  hold:      { label:"Đang giữ chỗ",  color:"#7a5a00", bg:"#fef9e7", dot:"#e8c53a" },
  confirmed: { label:"Đã xác nhận",   color:"#2563eb", bg:"#eff6ff", dot:"#3b82f6" },
  ticketed:  { label:"Đã xuất vé",    color:"#1a4d8f", bg:"#e6f1fb", dot:"#3a8bd4" },
  cancelled: { label:"Đã hủy",        color:"#8b2a1a", bg:"#fdf0ee", dot:"#e07060" },
  expired:   { label:"Hết time limit",color:"#8b2a1a", bg:"#fdf0ee", dot:"#e07060" },
};

export const INVOICE_TYPES = {
  invoice:    { label:"Có hóa đơn VAT",   icon:"🧾", color:"#1e3a8a", bg:"#eff6ff" },
  no_invoice: { label:"Không có hóa đơn", icon:"📝", color:"#7a5a00", bg:"#fef9e7" },
};

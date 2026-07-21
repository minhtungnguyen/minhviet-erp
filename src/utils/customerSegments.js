// Phân khúc RFM (Recency/Frequency/Monetary) cho khách hàng — nguồn sự thật duy
// nhất, dùng chung giữa tab "Phân khúc RFM" và các biểu đồ hiệu quả khách hàng,
// để không lệch định nghĩa segment giữa 2 nơi.

// Khớp đơn hàng với 1 khách hàng — theo customerId (chắc chắn nhất), rồi tới
// SĐT, rồi tới tên đầy đủ (dự phòng cho đơn tạo trước khi có liên kết customerId).
export function ordersForCustomer(customer, orders) {
  if (!customer) return [];
  const name = (customer.name || "").trim().toLowerCase();
  return (orders || []).filter((o) =>
    o.customerId === customer.id ||
    (customer.phone && o.customerPhone === customer.phone) ||
    (name && o.customerName && o.customerName.trim().toLowerCase() === name)
  );
}

export const RFM_SEGMENTS = [
  { id: "vip",     label: "VIP",            color: "#7c3aed", bg: "#f5f3ff", desc: "≥4 đơn & ≥50 triệu" },
  { id: "loyal",   label: "Thân thiết",     color: "#0284c7", bg: "#e0f2fe", desc: "≥2 đơn, <180 ngày" },
  { id: "active",  label: "Đang hoạt động", color: "#15803d", bg: "#dcfce7", desc: "Đơn gần nhất <90 ngày" },
  { id: "atrisk",  label: "Có rủi ro",      color: "#d97706", bg: "#fef3c7", desc: "90–365 ngày vắng" },
  { id: "dormant", label: "Ngủ đông",       color: "#dc2626", bg: "#fee2e2", desc: ">365 ngày vắng" },
  { id: "new",     label: "Khách mới",      color: "#64748b", bg: "#f1f5f9", desc: "Mới 1 đơn" },
];

// Doanh thu thật của 1 khách — total_revenue trên hồ sơ chưa từng được cập nhật
// sau khi tạo (luôn 0) nên luôn ưu tiên tính lại từ đơn hàng thật khi có thể.
export function customerRevenue(customer, orders) {
  const myOrds = ordersForCustomer(customer, orders);
  const computed = myOrds.reduce((s, o) => s + (o.totalPrice || 0), 0);
  return customer?.totalRevenue || computed;
}

export function classifyRFM(customer, orders, now = new Date()) {
  const myOrds = ordersForCustomer(customer, orders);
  const n = myOrds.length;
  const rev = customerRevenue(customer, orders);
  const lastDate = customer?.lastOrderDate
    ? new Date(customer.lastOrderDate)
    : (myOrds.length ? new Date(Math.max(...myOrds.map((o) => new Date(o.createdAt || o.departDate || 0)))) : null);
  const daysSince = lastDate ? Math.round((now - lastDate) / 86400000) : 9999;
  if (n >= 4 && rev >= 50e6) return "vip";
  if (n >= 2 && daysSince <= 180) return "loyal";
  if (daysSince <= 90) return "active";
  if (daysSince <= 365) return "atrisk";
  if (daysSince > 365 && n > 0) return "dormant";
  return "new";
}

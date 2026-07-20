// Tìm khách hàng CRM theo số điện thoại — dùng để chống tạo trùng hồ sơ
// khi tiếp nhận yêu cầu mới (CrmModule, TaskModule...).
export function findCustomerByPhone(customers, phone) {
  const p = (phone || "").trim();
  if (!p) return null;
  return (customers || []).find((c) => (c.phone || "").trim() === p) || null;
}

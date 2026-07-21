// Tìm khách hàng CRM theo số điện thoại — dùng để chống tạo trùng hồ sơ
// khi tiếp nhận yêu cầu mới (CrmModule, TaskModule...).
export function findCustomerByPhone(customers, phone) {
  const p = (phone || "").trim();
  if (!p) return null;
  return (customers || []).find((c) => (c.phone || "").trim() === p) || null;
}

// Tên dùng để sắp xếp "Theo tên" — người Việt tra cứu/xưng hô theo tên riêng
// (từ cuối họ tên đầy đủ, VD "An" trong "Nguyễn Văn An"), không phải Họ (từ đầu)
// như khi so sánh chuỗi thô sẽ vô tình làm. Khách doanh nghiệp giữ nguyên tên
// công ty vì không theo cấu trúc Họ-[Tên đệm]-Tên.
export function vietnameseGivenName(customer) {
  const name = (customer?.name || "").trim();
  if (!name) return "";
  if (customer?.type === "corp" || customer?.type === "corporate") return name;
  const parts = name.split(/\s+/);
  return parts[parts.length - 1];
}

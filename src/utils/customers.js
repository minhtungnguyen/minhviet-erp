// Tìm khách hàng CRM theo số điện thoại — dùng để chống tạo trùng hồ sơ
// khi tiếp nhận yêu cầu mới (CrmModule, TaskModule...).
export function findCustomerByPhone(customers, phone) {
  const p = (phone || "").trim();
  if (!p) return null;
  return (customers || []).find((c) => (c.phone || "").trim() === p) || null;
}

// Tên hiển thị đại diện cho 1 khách hàng — khách doanh nghiệp dùng TÊN CÔNG TY
// (không phải tên người đại diện) vì đó mới là danh tính chính đang giao dịch;
// khách cá nhân dùng họ tên. Dùng thống nhất ở mọi nơi hiển thị/tìm/sắp xếp
// khách hàng (danh sách, phân khúc RFM, sự kiện sắp tới...).
export function customerDisplayName(customer) {
  const isCorp = customer?.type === "corp" || customer?.type === "corporate";
  if (isCorp) return (customer?.companyName || customer?.name || "").trim();
  return (customer?.name || "").trim();
}

// Tên dùng để sắp xếp "Theo tên" — người Việt tra cứu/xưng hô theo tên riêng
// (từ cuối họ tên đầy đủ, VD "An" trong "Nguyễn Văn An"), không phải Họ (từ đầu)
// như khi so sánh chuỗi thô sẽ vô tình làm. Khách doanh nghiệp giữ nguyên tên
// công ty vì không theo cấu trúc Họ-[Tên đệm]-Tên.
export function vietnameseGivenName(customer) {
  const isCorp = customer?.type === "corp" || customer?.type === "corporate";
  const name = customerDisplayName(customer);
  if (!name) return "";
  if (isCorp) return name;
  const parts = name.split(/\s+/);
  return parts[parts.length - 1];
}

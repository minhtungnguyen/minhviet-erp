// Tính tổng thu/chi đã duyệt của 1 đơn hàng từ danh sách phiếu thu/chi (vouchers).
// Dùng chung bởi OrderDetail, CloseOrderModule (2 nơi trước đây định nghĩa y hệt nhau).
export function calcVoucherTotals(vouchers, orderId) {
  const ovs = (vouchers || []).filter((v) => v.orderId === orderId);
  const totalPaid = ovs
    .filter((v) => v.type === "thu" && ["approved", "confirmed"].includes(v.status))
    .reduce((s, v) => s + (v.amount || 0), 0);
  const totalChi = ovs
    .filter((v) => v.type === "chi" && ["approved", "confirmed"].includes(v.status))
    .reduce((s, v) => s + (v.amount || 0), 0);
  return { totalPaid, totalChi };
}

// Công nợ nhà cung cấp: phần CÒN THIẾU của booking chưa hủy/chưa thanh toán xong
// (không phải tổng giá trị booking — 1 booking có thể đã cọc 1 phần, remaining là
// phần thực sự còn nợ NCC). Fallback về amount cho dữ liệu cũ chưa có remaining.
export function calcNccDebt(bookings, orderId) {
  return (bookings || [])
    .filter((b) => b.orderId === orderId && b.status !== "cancelled" && b.status !== "paid")
    .reduce((s, b) => s + (b.remaining != null ? b.remaining : (b.amount || 0)), 0);
}

// Bộ số liệu tài chính đầy đủ của 1 đơn: công nợ khách, lợi nhuận, công nợ NCC.
export function calcOrderFinancials(order, vouchers, bookings) {
  const { totalPaid, totalChi } = calcVoucherTotals(vouchers, order?.id);
  const totalPrice = order?.totalPrice || 0;
  const debt = totalPrice - totalPaid;
  const profit = totalPrice - totalChi - (order?.costPrice || 0);
  const profitPct = totalPrice ? (profit / totalPrice) * 100 : 0;
  const nccDebt = calcNccDebt(bookings, order?.id);
  return { totalPaid, totalChi, debt, profit, profitPct, nccDebt };
}

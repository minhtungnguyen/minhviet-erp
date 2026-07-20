import { calcVoucherTotals } from "./orderFinancials.js";

// Số tiền theo từng giai đoạn thanh toán — dùng để hiển thị block "Tài liệu & In ấn"
// trong OrderDetail (yêu cầu TT đặt cọc / còn lại / hoàn tiền thu thừa).
export function calcPaymentStages(order, vouchers) {
  const { totalPaid } = calcVoucherTotals(vouchers, order?.id);
  const totalPrice = order?.totalPrice || 0;
  const depositAmt = order?.depositAmount || Math.round(totalPrice * 0.3);
  const remainingAmt = Math.max(0, totalPrice - totalPaid);
  const overpayAmt = Math.max(0, totalPaid - totalPrice);
  const finalPayAmt = Math.max(0, totalPrice - depositAmt);
  return { totalPaid, totalPrice, depositAmt, remainingAmt, overpayAmt, finalPayAmt };
}

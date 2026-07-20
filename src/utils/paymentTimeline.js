// Tiến độ thanh toán của 1 đơn (đã bao gồm dịch vụ bổ sung) — dùng bởi FinancePanel.
export function calcPaymentTimeline(order, vouchers) {
  const approved = (vouchers || []).filter(
    (v) => v.orderId === order.id && v.type === "thu" && ["approved", "confirmed"].includes(v.status)
  );
  const totalPaid = approved.reduce((s, v) => s + (v.amount || 0), 0);
  const addonTotal = (order.additionalItems || []).reduce((s, i) => s + (i.totalPrice || 0), 0);
  const grandTotal = (order.totalPrice || 0) + addonTotal;
  const remaining = grandTotal - totalPaid;
  const paidPct = grandTotal > 0 ? Math.min(100, Math.round((totalPaid / grandTotal) * 100)) : 0;
  return { totalPaid, addonTotal, grandTotal, remaining, paidPct };
}

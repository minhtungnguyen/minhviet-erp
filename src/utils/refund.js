import { REFUND_POLICY } from "../constants/refundPolicy.js";

// Nghiệp vụ hoàn tiền (RefundModule): áp chính sách hủy theo số ngày còn lại tới ngày khởi hành.
export function daysUntilDepart(departDateStr) {
  const now = new Date();
  const depart = new Date(departDateStr);
  return Math.max(0, Math.ceil((depart - now) / 86400000));
}

export function calcRefundPolicy(departDateStr, totalPrice) {
  const days = daysUntilDepart(departDateStr);
  // REFUND_POLICY luôn có mốc minDays:0 và days không bao giờ âm (daysUntilDepart clamp về 0)
  // nên find() luôn khớp — fallback dưới đây chỉ để phòng thủ nếu REFUND_POLICY bị sửa thiếu mốc 0.
  /* v8 ignore next */
  const rule = REFUND_POLICY.find((r) => days >= r.minDays) || REFUND_POLICY[REFUND_POLICY.length - 1];
  return { days, pct: rule.pct, label: rule.label, amount: Math.round((totalPrice || 0) * rule.pct / 100) };
}

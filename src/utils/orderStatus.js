// Máy trạng thái vòng đời đơn hàng — nguồn sự thật duy nhất cho các bước chuyển hợp lệ.
// Khớp với ORDER_STATUS trong src/constants/statuses.js.
export const NEXT_STATUSES = {
  pending_payment: ["confirmed", "cancelled"],
  confirmed: ["in_progress", "cancelled"],
  in_progress: ["closed", "cancelled"],
  closed: [],
  cancelled: [],
};

export function getNextStatuses(status) {
  return NEXT_STATUSES[status] || [];
}

export function canTransitionTo(status, next) {
  return getNextStatuses(status).includes(next);
}

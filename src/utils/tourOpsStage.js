// Nghiệp vụ vận hành tour (TourOpsModule): mốc tiến độ giao HDV → khởi hành → về → quyết toán.
export function getOpsStage(order) {
  const m = order.opsMilestones || {};
  if (m.settled) return 4;
  if (m.returned) return 3;
  if (m.departed) return 2;
  if (m.assigned || order.hdvName) return 1;
  return 0;
}

export function daysToDepart(departDate) {
  return departDate ? Math.ceil((new Date(departDate) - new Date()) / 86400000) : null;
}

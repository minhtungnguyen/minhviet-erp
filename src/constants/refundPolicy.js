// Khớp với chính sách hủy nêu trong hợp đồng combo (xem src/print/index.jsx, ĐIỀU 5. CHÍNH SÁCH HỦY VÀ HOÀN TIỀN)
export const REFUND_POLICY = [
  { minDays:30, pct:100, label:"Hủy trước ≥30 ngày — hoàn cọc 100%" },
  { minDays:15, pct:70,  label:"Hủy trước 15–29 ngày — phí hủy 30%" },
  { minDays:7,  pct:50,  label:"Hủy trước 7–14 ngày — phí hủy 50%" },
  { minDays:3,  pct:30,  label:"Hủy trước 3–6 ngày — phí hủy 70%" },
  { minDays:0,  pct:0,   label:"Hủy dưới 3 ngày / không báo — phí hủy 100%" },
];

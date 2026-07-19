export const PROFIT_THRESHOLD = {
  tour:          8,   // Tour trọn gói: cảnh báo < 8%
  tour_ghep_nd:  8,   // Tour ghép nội địa
  tour_ghep_qt:  8,   // Tour ghép quốc tế
  ve_may_bay:    2,   // Vé máy bay: cảnh báo < 2%
  hotel_flight:  3,   // Combo KS+Vé: cảnh báo < 3%
  cruise:        5,   // Du thuyền
  khach_san:     5,   // Khách sạn
  ve_tham_quan:  5,   // Vé tham quan
  default:       5,   // Tất cả loại còn lại
};

export function getProfitThreshold(serviceId){
  return PROFIT_THRESHOLD[serviceId] || PROFIT_THRESHOLD.default;
}

export function getProfitStatus(profitPct, serviceId){
  const threshold = getProfitThreshold(serviceId);
  if(profitPct < 0)         return {level:"loss",    color:"#8b2a1a", bg:"#fdf0ee", label:"Lỗ",              icon:"🔴"};
  if(profitPct < threshold) return {level:"warning",  color:"#7a5a00", bg:"#fef9e7", label:`Thấp (< ${threshold}%)`, icon:"⚠️"};
  if(profitPct < threshold*1.5) return {level:"ok",   color:"#1e3a8a", bg:"#eff6ff", label:"Bình thường",    icon:"🟡"};
  return                           {level:"good",     color:"#1d6b4f", bg:"#e8f5ef", label:"Tốt",            icon:"🟢"};
}

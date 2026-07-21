// Nguồn sự thật duy nhất cho loại hình dịch vụ dùng khi tạo Đơn hàng/Báo giá —
// OrderForm, QuickSaleForm, SupplierModule, QuoteModule đều import từ đây,
// tránh mỗi nơi tự khai 1 danh sách riêng lệch nhau (đã từng xảy ra).
export const SERVICE_TYPES=[
  {id:"flight",       label:"Vé máy bay",    icon:"✈️"},
  {id:"tour_package", label:"Tour trọn gói", icon:"🧳"},
  {id:"tour_ghep",    label:"Tour ghép",     icon:"🔗"},
  {id:"cruise",       label:"Du thuyền",     icon:"🚢"},
  {id:"hotel",        label:"Khách sạn",     icon:"🏨"},
  {id:"ticket",       label:"Vé tham quan",  icon:"🎡"},
  {id:"combo",        label:"Combo",         icon:"📦"},
  {id:"thue_xe",      label:"Xe du lịch",    icon:"🚗"},
];

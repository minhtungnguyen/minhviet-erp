export const COMPANY = {
  name:    "CÔNG TY TNHH DU LỊCH MINH VIỆT",
  address: "Hải Phòng, Việt Nam",
  phone:   "0906 001 359",
  email:   "info@minhviettravel.vn",
  website: "www.minhviettravel.vn",
  taxCode: "0200000000",
};

export const PROVINCES = [
  "Hà Nội","TP. Hồ Chí Minh","Hải Phòng","Đà Nẵng","Cần Thơ",
  "Quảng Ninh","Thừa Thiên Huế","Khánh Hòa","Lâm Đồng","Kiên Giang",
];

export const SALE_STAFF = [
  "Nguyễn Thị Hoa","Trần Văn Nam","Lê Thị Mai","Phạm Quốc Hùng","Đỗ Thị Lan",
];

export const KT_STAFF = [
  "Kế toán Quỹ – Minh","Kế toán Trưởng – Liên","Giám đốc – Mr. Tùng",
];

export const NCC_LIST = [
  "Vietnam Airlines","Vietjet Air","Bamboo Airways","Booking.com","Agoda",
  "KS Mường Thanh","KS Vinpearl","Saigon Tourist","BenThanh Tourist",
];

export const METHODS = [
  { v:"transfer",    l:"Chuyển khoản"  },
  { v:"cash",        l:"Tiền mặt"      },
  { v:"momo",        l:"MoMo"          },
  { v:"vnpay",       l:"VNPay"         },
  { v:"card",        l:"Quẹt thẻ"     },
  { v:"credit_note", l:"Bảo lưu vé"   },
];

// Ngưỡng chi phí cần Giám đốc duyệt (20 triệu)
export const GD_APPROVAL_THRESHOLD = 20_000_000;

// Roles
export const ROLES = {
  sale:       { label:"Sale",          color:"#2563eb" },
  accountant: { label:"Kế toán",       color:"#1d6b4f" },
  manager:    { label:"Giám đốc",      color:"#7c2d12" },
  dieu_hanh:  { label:"Điều hành",     color:"#5c2eb0" },
};

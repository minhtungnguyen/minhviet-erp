import { useSupabase } from "./useSupabase.js";
import { AppShell, Sidebar, TopBar } from "./components/Layout.jsx";
import LoginPage from "./components/LoginPage.jsx";
import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  buildContractAirline, buildContractTour, buildCostStatement,
  buildPaymentRequest, buildLiquidation, buildVoucherGift,
  buildDispatch, buildGuideContract, buildTourSettlement,
  buildRefundVoucher, buildPassengerList, buildServiceVoucher, buildContractCombo,
  downloadAsWord, PrintBtn,
} from "./print/index.jsx";
import { openPrintWindow, buildPhieuThu, buildPhieuChi, buildConfirmation } from "./print/legacy.jsx";
import { soThanhChu } from "./utils/format.js";
import { parsePassengersFromFile, downloadPassengerTemplate, exportCustomersToExcel, exportPassengersToExcel } from "./utils/importExcel.js";
import { downloadCSV } from "./utils/csv.js";
import { PERMISSION_GROUPS, ALL_PERM_KEYS, PERM_LABEL, ROLE_DEFAULT_PERMS, isBanGiamDoc, getEffectivePerms } from "./utils/permissions.js";
import ReportModule from "./modules/ReportModule.jsx";
import SaleDashboard from "./modules/SaleDashboard.jsx";
import DirectorDashboard from "./modules/DirectorDashboard.jsx";
import AccountantDashboard from "./modules/AccountantDashboard.jsx";
import CrmModule from "./modules/CrmModule.jsx";
import ApprovalsModule from "./modules/ApprovalsModule.jsx";



// ═══════════════════════════════════════════════════════════

// PDF PRINT ENGINE — In phiếu thu / chi / phiếu xác nhận dịch vụ

// Dùng HTML iframe + window.print() — không cần thư viện ngoài

// ═══════════════════════════════════════════════════════════

// ── Global number utilities ──────────────────────────────────
// Hiển thị số đầy đủ: 5.250.000đ (không viết tắt)
const fmtCurrency = (n) => (Math.round(n||0)).toLocaleString("vi-VN") + "đ";
// Hiển thị số không có đơn vị: 5.250.000
const fmtNum = (n) => (Math.round(n||0)).toLocaleString("vi-VN");
// Parse chuỗi số có dấu chấm phân cách về số nguyên
const parseNum = (s) => parseInt(String(s).replace(/\./g,"").replace(/[^\d]/g,""),10)||0;
// Format số khi nhập: tự thêm dấu chấm mỗi 3 chữ số
const formatInputNum = (s) => {
  const raw = String(s).replace(/\./g,"").replace(/[^\d]/g,"");
  return raw ? parseInt(raw,10).toLocaleString("vi-VN") : "";
};
// Component input số tự format
const NumberInput = ({value, onChange, placeholder="0", style={}, disabled=false, min=0}) => {
  const [display, setDisplay] = React.useState(value ? fmtNum(value) : "");
  React.useEffect(()=>{ setDisplay(value ? fmtNum(value) : ""); },[value]);
  return (
    <input
      type="text"
      inputMode="numeric"
      value={display}
      disabled={disabled}
      placeholder={placeholder}
      style={style}
      onChange={e=>{
        const raw = e.target.value.replace(/\./g,"").replace(/[^\d]/g,"");
        const num = parseInt(raw,10)||0;
        if(min!==undefined&&num<min) return;
        setDisplay(raw ? num.toLocaleString("vi-VN") : "");
        onChange(num);
      }}
    />
  );
};


// ═══════════════════════════════════════════════════════════

// CONSTANTS & SEED DATA

// ═══════════════════════════════════════════════════════════

const SERVICES = [

  { id:"ve_may_bay",        label:"Vé máy bay",          icon:"✈"  },

  { id:"tour",              label:"Tour trọn gói",        icon:"🗺"  },

  { id:"tour_ghep_nd",      label:"Tour ghép nội địa",   icon:"🚌"  },

  { id:"tour_ghep_qt",      label:"Tour ghép quốc tế",   icon:"🌏"  },

  { id:"cruise",            label:"Du thuyền",            icon:"🚢"  },

  { id:"hotel_flight",      label:"Combo KS+Vé",         icon:"🏨"  },

  { id:"ve_tham_quan",      label:"Vé tham quan",        icon:"🎟"  },

  { id:"khach_san",         label:"Khách sạn",            icon:"🏩"  },

  { id:"visa",              label:"Visa",                 icon:"🛂"  },

  { id:"bao_hiem",          label:"Bảo hiểm du lịch",    icon:"🛡"  },

  { id:"thue_xe",           label:"Thuê xe",              icon:"🚗"  },

  { id:"mice_teambuilding", label:"MICE / Teambuilding",  icon:"🎯"  },

];



// ─── Checklist templates theo loại dịch vụ ───────────────

const CHECKLIST_TEMPLATES = {

  ve_may_bay: [

    // Phase 1 — Ngay sau xuất vé

    { id:"c1", phase:"Ngay sau xuất vé",   label:"Kiểm tra thông tin vé (tên, ngày, chặng, hạng vé)", req:true },

    { id:"c2", phase:"Ngay sau xuất vé",   label:"Gửi vé cho khách (Zalo/Facebook/Email/SMS)",        req:true },

    { id:"c3", phase:"Ngay sau xuất vé",   label:"Khách xác nhận đã nhận vé",                         req:true },

    { id:"c4", phase:"Ngay sau xuất vé",   label:"Nhập mã booking (PNR) vào đơn",                    req:true },

    // Phase 2 — Trước ngày bay

    { id:"c5", phase:"Trước ngày bay",     label:"Check-in online cho khách (cửa sổ 2h–24h trước bay)", req:true },

    { id:"c6", phase:"Trước ngày bay",     label:"Nhắc khách mang CCCD/Hộ chiếu bản gốc",            req:true },

    { id:"c7", phase:"Trước ngày bay",     label:"Xác nhận hành lý (nếu khách có yêu cầu ký gửi)",   req:false },

    // Phase 3 — Ngày bay

    { id:"c8", phase:"Ngày bay",           label:"Nhắc giờ có mặt sân bay (nội địa 1.5–2h, QT 3h)",  req:true },

    { id:"c9", phase:"Ngày bay",           label:"Xác nhận khách đã check-in thành công",              req:false },

    // Chiều về — chỉ với vé khứ hồi

    { id:"c10",phase:"Chiều về (khứ hồi)",label:"Check-in online chiều về",                           req:false },

    { id:"c11",phase:"Chiều về (khứ hồi)",label:"Nhắc giờ có mặt sân bay chiều về",                  req:false },

    // Transit — chỉ khi có nối chuyến

    { id:"c12",phase:"Thông tin transit",  label:"Ghi rõ thời gian nối chuyến + sân bay trung chuyển",req:false },

    { id:"c13",phase:"Thông tin transit",  label:"Nhắc khách không ra khỏi khu vực transit",          req:false },

  ],



  tour: [

    { id:"t1", phase:"D-7 Chuẩn bị",    label:"Danh sách đoàn đủ CCCD/Hộ chiếu",                    req:true },

    { id:"t2", phase:"D-7 Chuẩn bị",    label:"Confirm khách sạn (voucher đã nhận)",                 req:true },

    { id:"t3", phase:"D-7 Chuẩn bị",    label:"Confirm xe (biển số, tài xế, SĐT)",                   req:true },

    { id:"t4", phase:"D-7 Chuẩn bị",    label:"Briefing HDV (lịch trình, yêu cầu đặc biệt)",         req:true },

    { id:"t5", phase:"D-7 Chuẩn bị",    label:"Thanh toán NCC đủ chưa",                              req:true },

    { id:"t6", phase:"D-7 Chuẩn bị",    label:"Kiểm tra vé tham quan/entry fee các điểm",            req:false },

    { id:"t7", phase:"D-1 Nhắc khách",  label:"Gửi lịch trình chi tiết cho khách",                   req:true },

    { id:"t8", phase:"D-1 Nhắc khách",  label:"Nhắc giờ tập trung + địa điểm + cách đi",             req:true },

    { id:"t9", phase:"D-1 Nhắc khách",  label:"HDV xác nhận sẵn sàng",                               req:true },

    { id:"t10",phase:"Ngày khởi hành",  label:"Điểm danh đủ khách",                                   req:true },

    { id:"t11",phase:"Ngày khởi hành",  label:"Phát tài liệu/mũ/phụ kiện tour",                      req:false },

    { id:"t12",phase:"Ngày khởi hành",  label:"Khởi hành đúng giờ",                                  req:true },

    { id:"t13",phase:"Trong tour",      label:"Check-in khách sạn OK (số phòng đã cấp)",              req:true },

    { id:"t14",phase:"Trong tour",      label:"Các điểm tham quan theo đúng lịch trình",              req:false },

    { id:"t15",phase:"Kết thúc tour",   label:"Toàn bộ khách về an toàn",                             req:true },

    { id:"t16",phase:"Kết thúc tour",   label:"Quyết toán HDV",                                       req:true },

    { id:"t17",phase:"Kết thúc tour",   label:"Thu feedback từ khách",                                req:false },

  ],



  cruise: [

    { id:"cr1", phase:"Chuẩn bị",       label:"Xác định loại tàu (tàu ngày / tàu đêm)",               req:true },

    { id:"cr2", phase:"Chuẩn bị",       label:"Confirm cảng đón + giờ check-in tàu",                  req:true },

    { id:"cr3", phase:"Chuẩn bị",       label:"Gửi danh sách khách + CCCD cho tàu",                   req:true },

    { id:"cr4", phase:"Chuẩn bị",       label:"Thanh toán đủ theo deadline tàu quy định",             req:true },

    { id:"cr5", phase:"Chuẩn bị",       label:"[Tàu đêm] Confirm cabin (số phòng, loại phòng)",       req:false },

    { id:"cr6", phase:"Chuẩn bị",       label:"Xác nhận meal plan + activities đã included",          req:true },

    { id:"cr7", phase:"Chuẩn bị",       label:"Ghi nhận yêu cầu đặc biệt (ăn chay, dị ứng...)",       req:false },

    { id:"cr8", phase:"D-1 Nhắc khách", label:"Nhắc điểm tập trung + giờ (trước 30 phút)",            req:true },

    { id:"cr9", phase:"D-1 Nhắc khách", label:"Nhắc mang CCCD bản gốc",                               req:true },

    { id:"cr10",phase:"Ngày đi",        label:"Xác nhận khách đã lên tàu đầy đủ",                     req:true },

    { id:"cr11",phase:"Kết thúc",       label:"Xác nhận khách về an toàn",                             req:true },

    { id:"cr12",phase:"Kết thúc",       label:"Quyết toán với tàu",                                    req:true },

  ],



  tour_ghep_nd: [

    { id:"tg1", phase:"D-7 Confirm",    label:"Gửi danh sách khách cho đơn vị tổ chức",               req:true },

    { id:"tg2", phase:"D-7 Confirm",    label:"Nhận xác nhận chỗ từ đơn vị tổ chức",                  req:true },

    { id:"tg3", phase:"D-7 Confirm",    label:"Xác nhận điểm đón + giờ đón chính xác",                req:true },

    { id:"tg4", phase:"D-7 Confirm",    label:"Lấy SĐT đầu mối bên đơn vị tổ chức",                   req:true },

    { id:"tg5", phase:"D-7 Confirm",    label:"Thanh toán cho đơn vị tổ chức",                        req:true },

    { id:"tg6", phase:"D-1 Nhắc khách",label:"Nhắc khách điểm đón + giờ đón",                         req:true },

    { id:"tg7", phase:"D-1 Nhắc khách",label:"Gửi SĐT đầu mối/HDV cho khách liên lạc",               req:true },

    { id:"tg8", phase:"Kết thúc",       label:"Xác nhận khách về an toàn",                             req:true },

    { id:"tg9", phase:"Kết thúc",       label:"Thu feedback",                                          req:false },

  ],



  ve_tham_quan: [

    { id:"vt1", phase:"Đặt vé",         label:"Xác nhận loại vé (NL/TE/combo) + số lượng",            req:true },

    { id:"vt2", phase:"Đặt vé",         label:"Xác nhận ngày sử dụng + giờ vào (nếu có slot)",        req:true },

    { id:"vt3", phase:"Đặt vé",         label:"Thanh toán + nhận vé (giấy hoặc điện tử)",             req:true },

    { id:"vt4", phase:"Đặt vé",         label:"Ghi nhận hạn sử dụng vé",                              req:true },

    { id:"vt5", phase:"Giao vé",        label:"Gửi vé cho khách (ảnh chụp/file PDF/QR code)",         req:true },

    { id:"vt6", phase:"Giao vé",        label:"Khách xác nhận đã nhận vé",                            req:true },

    { id:"vt7", phase:"Nhắc nhở",       label:"Nhắc khách ngày sử dụng vé + giờ vào",                 req:false },

  ],



  khach_san: [

    { id:"ks1", phase:"Đặt phòng",      label:"Confirm booking (voucher KS đã nhận)",                  req:true },

    { id:"ks2", phase:"Đặt phòng",      label:"Xác nhận loại phòng, tên đặt, số đêm",                 req:true },

    { id:"ks1", phase:"Đặt phòng",      label:"Confirm booking (voucher KS đã nhận)",                  req:true },
    { id:"ks4", phase:"Đặt phòng",      label:"Cọc NCC: đã thanh toán chưa + deadline còn lại",       req:true },

    { id:"ks5", phase:"Trước check-in", label:"Gửi voucher KS cho khách",                             req:true },

    { id:"ks6", phase:"Trước check-in", label:"Nhắc giờ check-in (standard 14h, early nếu có)",       req:true },

    { id:"ks7", phase:"Trước check-in", label:"Xác nhận early check-in / late check-out nếu cần",     req:false },

    { id:"ks8", phase:"Sau check-in",   label:"Khách check-in thành công",                            req:true },

    { id:"ks9", phase:"Checkout",       label:"Khách checkout OK + không phát sinh",                   req:false },

  ],



  visa: [

    { id:"v1",  phase:"Nhận hồ sơ",    label:"Nhận đủ hồ sơ từ khách (passport, ảnh, form...)",      req:true },

    { id:"v2",  phase:"Nhận hồ sơ",    label:"Kiểm tra hộ chiếu còn hạn đủ 6 tháng",                 req:true },

    { id:"v3",  phase:"Nộp hồ sơ",     label:"Nộp hồ sơ cho công ty dịch vụ visa",                   req:true },

    { id:"v4",  phase:"Nộp hồ sơ",     label:"Ghi nhận ngày nộp + ngày nhận dự kiến",                req:true },

    { id:"v5",  phase:"Theo dõi",      label:"Theo dõi trạng thái hồ sơ",                             req:true },

    { id:"v6",  phase:"Nhận visa",     label:"Nhận visa từ công ty dịch vụ",                          req:true },

    { id:"v7",  phase:"Nhận visa",     label:"Kiểm tra thông tin visa (tên, ngày, loại)",              req:true },

    { id:"v8",  phase:"Giao khách",    label:"Gửi/giao visa cho khách",                               req:true },

    { id:"v9",  phase:"Giao khách",    label:"Khách xác nhận đã nhận",                                req:true },

  ],



  bao_hiem: [

    { id:"bh1", phase:"Phát hành",     label:"Chọn đối tác (MIC / PTI-DBV)",                          req:true },

    { id:"bh2", phase:"Phát hành",     label:"Xác nhận gói bảo hiểm + quyền lợi",                    req:true },

    { id:"bh3", phase:"Phát hành",     label:"Thu thập thông tin khách (tên, CCCD, ngày sinh)",       req:true },

    { id:"bh4", phase:"Phát hành",     label:"Phát hành hợp đồng/thẻ bảo hiểm",                      req:true },

    { id:"bh5", phase:"Phát hành",     label:"Ghi nhận số hợp đồng + ngày hiệu lực → hết hạn",       req:true },

    { id:"bh6", phase:"Giao khách",    label:"Gửi hợp đồng/thẻ BH cho khách",                        req:true },

    { id:"bh7", phase:"Giao khách",    label:"Thông báo số hotline claim cho khách",                  req:true },

    { id:"bh8", phase:"Giao khách",    label:"Khách xác nhận đã nhận",                                req:true },

  ],



  thue_xe: [

    { id:"tx1", phase:"Đặt xe",        label:"Xác nhận loại xe + số chỗ",                             req:true },

    { id:"tx2", phase:"Đặt xe",        label:"Confirm tài xế (tên + SĐT)",                            req:true },

    { id:"tx3", phase:"Đặt xe",        label:"Biển số xe",                                            req:true },

    { id:"tx4", phase:"Đặt xe",        label:"Giờ đón + địa điểm đón chính xác",                      req:true },

    { id:"tx5", phase:"Đặt xe",        label:"Lộ trình + điểm trả cuối",                              req:true },

    { id:"tx6", phase:"Đặt xe",        label:"Thanh toán (cọc + còn lại khi nào)",                    req:true },

    { id:"tx7", phase:"Nhắc khách",    label:"Gửi thông tin xe + tài xế cho khách",                   req:true },

    { id:"tx8", phase:"Ngày thực hiện",label:"Xác nhận xe đón đúng giờ",                              req:true },

    { id:"tx9", phase:"Hoàn thành",    label:"Khách về an toàn + thanh toán đủ",                      req:true },

  ],



  mice_teambuilding: [

    { id:"m1",  phase:"Khởi động",     label:"Xác nhận số lượng người tham dự chính thức",            req:true },

    { id:"m2",  phase:"Khởi động",     label:"Confirm địa điểm tổ chức (voucher/hợp đồng)",           req:true },

    { id:"m3",  phase:"Khởi động",     label:"Chương trình activities đã duyệt",                      req:true },

    { id:"m4",  phase:"Khởi động",     label:"Catering/tiệc đã confirm (menu, số suất)",              req:true },

    { id:"m5",  phase:"Khởi động",     label:"Thiết bị (âm thanh, ánh sáng, backdrop, máy chiếu...)",req:true },

    { id:"m6",  phase:"Khởi động",     label:"Nhân sự MC/Trainer/Facilitator đã confirm",             req:true },

    { id:"m7",  phase:"Khởi động",     label:"Thanh toán NCC các hạng mục",                           req:true },

    { id:"m8",  phase:"Chuẩn bị",      label:"Danh sách đoàn gửi cho địa điểm",                       req:true },

    { id:"m9",  phase:"Chuẩn bị",      label:"In ấn: tên bảng, backdrop, tài liệu...",                req:false },

    { id:"m10", phase:"Chuẩn bị",      label:"Quà tặng/phần thưởng đã chuẩn bị",                     req:false },

    { id:"m11", phase:"D-1 Chạy thử",  label:"Chạy thử chương trình + setup địa điểm",               req:true },

    { id:"m12", phase:"D-1 Chạy thử",  label:"Kiểm tra thiết bị âm thanh/ánh sáng",                  req:true },

    { id:"m13", phase:"D-1 Chạy thử",  label:"Confirm lại toàn bộ nhân sự",                           req:true },

    { id:"m14", phase:"Ngày sự kiện",  label:"Check-in đoàn",                                         req:true },

    { id:"m15", phase:"Ngày sự kiện",  label:"Chương trình diễn ra đúng kế hoạch",                    req:true },

    { id:"m16", phase:"Ngày sự kiện",  label:"Xử lý phát sinh (nếu có)",                              req:false },

    { id:"m17", phase:"Kết thúc",      label:"Quyết toán tất cả NCC",                                 req:true },

    { id:"m18", phase:"Kết thúc",      label:"Thu feedback từ khách hàng",                            req:true },

  ],

};



// Tour ghép quốc tế = checklist tour ghép nội địa

CHECKLIST_TEMPLATES.tour_ghep_qt = CHECKLIST_TEMPLATES.tour_ghep_nd;

// Combo = KS + vé máy bay

CHECKLIST_TEMPLATES.hotel_flight = [

  ...CHECKLIST_TEMPLATES.ve_may_bay.map(c=>({...c,id:"hf_v_"+c.id})),

  ...CHECKLIST_TEMPLATES.khach_san.map(c=>({...c,id:"hf_k_"+c.id})),

];

const PROVINCES = [
  "An Giang","Bà Rịa - Vũng Tàu","Bắc Giang","Bắc Kạn","Bạc Liêu",
  "Bắc Ninh","Bến Tre","Bình Định","Bình Dương","Bình Phước","Bình Thuận",
  "Cà Mau","Cần Thơ","Cao Bằng","Đà Nẵng","Đắk Lắk","Đắk Nông","Điện Biên",
  "Đồng Nai","Đồng Tháp","Gia Lai","Hà Giang","Hà Nam","Hà Nội","Hà Tĩnh",
  "Hải Dương","Hải Phòng","Hậu Giang","Hòa Bình","Hưng Yên","Khánh Hòa",
  "Kiên Giang","Kon Tum","Lai Châu","Lâm Đồng","Lạng Sơn","Lào Cai",
  "Long An","Nam Định","Nghệ An","Ninh Bình","Ninh Thuận","Phú Thọ",
  "Phú Yên","Phú Quốc","Quảng Bình","Quảng Nam","Quảng Ngãi","Quảng Ninh",
  "Quảng Trị","Sóc Trăng","Sơn La","Tây Ninh","Thái Bình","Thái Nguyên",
  "Thanh Hóa","Thừa Thiên Huế","Tiền Giang","TP. Hồ Chí Minh","Trà Vinh",
  "Tuyên Quang","Vĩnh Long","Vĩnh Phúc","Yên Bái","Quốc tế"
];

const SALE_STAFF = ["Nguyễn Thị Hoa","Trần Văn Nam","Lê Thị Mai","Phạm Quốc Hùng","Đỗ Thị Lan"];

// ── PERMISSION REGISTRY — danh mục chức năng có thể tích/bỏ cho từng User ──

const KT_STAFF   = ["Kế toán Quỹ – Minh","Kế toán Trưởng – Liên","Giám đốc – Mr. Tùng"];

const NCC_LIST   = ["Vietnam Airlines","Vietjet Air","Bamboo Airways","Booking.com","Agoda","KS Mường Thanh","KS Vinpearl","Saigon Tourist","BenThanh Tourist"];

const METHODS    = [{v:"transfer",l:"Chuyển khoản"},{v:"cash",l:"Tiền mặt"},{v:"momo",l:"MoMo"},{v:"vnpay",l:"VNPay"},{v:"card",l:"Quẹt thẻ"}];

const USER_ACCOUNTS = [
  { id:"U1", username:"hoa.sale", password:"mv2025", name:"Nguyễn Thị Hoa", email:"hoa.sale@minhviettravel.vn", phone:"0901234561", role:"sale", avatar:"H", active:true, canViewTourGhep:false },
  { id:"U2", username:"nam.sale", password:"mv2025", name:"Trần Văn Nam", email:"nam.sale@minhviettravel.vn", phone:"0901234562", role:"sale", avatar:"N", active:true, canViewTourGhep:false },
  { id:"U3", username:"lien.kt", password:"mv2025", name:"Kế toán Trưởng – Liên", email:"lien.kt@minhviettravel.vn", phone:"0901234563", role:"accountant", avatar:"L", active:true, canViewTourGhep:true },
  { id:"U4", username:"minh.qk", password:"mv2025", name:"Kế toán Quỹ – Minh", email:"minh.qk@minhviettravel.vn", phone:"0901234564", role:"cashier", avatar:"M", active:true, canViewTourGhep:false },
  { id:"U5", username:"tung.gd", password:"mv@admin", name:"Giám đốc – Mr. Tùng", email:"tung.gd@minhviettravel.vn", phone:"0901234565", role:"manager", avatar:"T", active:true, canViewTourGhep:true },
  { id:"U6", username:"van.dh", password:"mv2025", name:"Đỗ Văn Điều Hành", email:"van.dh@minhviettravel.vn", phone:"0901234566", role:"dieu_hanh", avatar:"V", active:true, canViewTourGhep:true },
];

const canSeeTourGhepSensitive = (user) => {
  if (!user) return false;
  if (["manager","accountant","dieu_hanh"].includes(user.role)) return true;
  return user.canViewTourGhep === true;
};
const canAccessTourGhep = (user) => {
  if (!user) return false;
  if (["manager","accountant","dieu_hanh"].includes(user.role)) return true;
  return user.canViewTourGhep === true;
};



// ─── Tài khoản ngân hàng ─────────────────────────────────

const SEED_BANK_ACCOUNTS = [

  {

    id:"TK001", active:true,

    bankName:"HDBank",

    branch:"PGD Hải Đăng",

    accountNo:"203704077777777",

    accountName:"CÔNG TY CỔ PHẦN THƯƠNG MẠI VÀ DỊCH VỤ DU LỊCH MINH VIỆT",

    type:"company",        // company | personal

    useFor:["invoice","no_invoice"], // dùng cho cả 2 loại đơn

    note:"TK chủ đạo — dùng cho đơn có HĐ VAT",

    shortName:"HDBank Công ty",

    color:"#1e3a8a",

    balance: 487500000,

  },

  {

    id:"TK002", active:true,

    bankName:"Vietcombank",

    branch:"Chi nhánh Nam Hải Phòng",

    accountNo:"1031000077777",

    accountName:"Nguyễn Thị Thùy Anh",

    type:"personal",

    useFor:["invoice","no_invoice"], // dùng được cả 2

    note:"TK cá nhân ủy quyền — dùng cho cọc và chi nhỏ lẻ",

    shortName:"VCB Thùy Anh",

    color:"#1d6b4f",

    balance: 152000000,

  },

  {

    id:"TK003", active:false, // chưa kích hoạt

    bankName:"",

    branch:"",

    accountNo:"",

    accountName:"",

    type:"personal",

    useFor:["no_invoice"],

    note:"TK cá nhân riêng cho đơn không HĐ — sẽ bổ sung sau",

    shortName:"TK Cá nhân (sắp có)",

    color:"#94a3b8",

  },

];



// Loại đơn — có hoặc không có hóa đơn VAT

const INVOICE_TYPES = {

  invoice:    { label:"Có hóa đơn VAT",    icon:"🧾", color:"#1e3a8a", bg:"#eff6ff" },

  no_invoice: { label:"Không có hóa đơn",  icon:"📝", color:"#7a5a00", bg:"#fef9e7" },

};





// ─── Mục tiêu doanh thu cá nhân theo tháng ───────────────

const SEED_PERSONAL_TARGETS = [

  { username:"hoa.sale",  month:"06/2025", target:150000000 },

  { username:"hung.sale", month:"06/2025", target:200000000 }, // Nguyễn Minh Thành

  { username:"nam.sale",  month:"06/2025", target:100000000 },

  { username:"mai.sale",  month:"06/2025", target: 80000000 },

  { username:"lan.sale",  month:"06/2025", target: 70000000 },

  { username:"hoa.sale",  month:"05/2025", target:140000000 },

  { username:"hung.sale", month:"05/2025", target:180000000 },

  { username:"nam.sale",  month:"05/2025", target: 90000000 },

  { username:"mai.sale",  month:"05/2025", target: 80000000 },

  { username:"lan.sale",  month:"05/2025", target: 70000000 },

];



// ─── Chương trình tour ───────────────────────────────────

const COST_GROUPS = [

  { id:"transport",  label:"Vận chuyển",    icon:"🚌" },

  { id:"hotel",      label:"Lưu trú",       icon:"🏨" },

  { id:"food",       label:"Ăn uống",       icon:"🍽" },

  { id:"sightseeing",label:"Tham quan",     icon:"🎟" },

  { id:"guide",      label:"HDV & Nhân sự", icon:"👤" },

  { id:"event",      label:"Sự kiện / MICE",icon:"🎭" },

  { id:"accessory",  label:"Phụ kiện",      icon:"🎁" },

  { id:"other",      label:"Chi phí khác",  icon:"💰" },

];



const SEED_TOUR_PROGRAMS = [

  {

    id:"TP-001",

    name:"HÀNH TRÌNH VỀ NGUỒN & TRẢI NGHIỆM VĂN HÓA",

    route:"HẢI PHÒNG – NAM ĐỊNH – NINH BÌNH",

    days:2, nights:1,

    type:"mice_teambuilding",

    theme:"Hào khí Đông A – Tinh hoa Cố đô",

    targetGroup:"Đoàn doanh nghiệp",

    organizer:"Minh Việt Travel",

    status:"approved",

    paxFrom:25, paxTo:50,

    purpose:"Dâng hương tại cụm di tích Đền Trần - Chùa Phổ Minh, gắn kết nội bộ qua BBQ và đốt lửa trại.",

    itinerary:[

      { day:1, title:"HẢI PHÒNG – NAM ĐỊNH – CÚC PHƯƠNG MINERAL", meals:"Trưa+Tối",

        activities:[

          { time:"06:30", desc:"Xe và HDV đón đoàn tại điểm hẹn, khởi hành đi Nam Định" },

          { time:"08:30", desc:"Đoàn làm lễ dâng hương tại Đền Trần (Thiên Trường, Cố Trạch, Trùng Hoa)" },

          { time:"09:30", desc:"Tham quan Chùa Tháp Phổ Minh, chiêm bái Bảo tháp 700 năm tuổi" },

          { time:"12:00", desc:"Ăn trưa tại Nhà hàng Hiếu Tròn, TP. Ninh Bình (200k/suất)" },

          { time:"13:15", desc:"Di chuyển về Cúc Phương Mineral Retreat" },

          { time:"14:00", desc:"Nhận phòng, nghỉ ngơi. Tự do: đạp xe, Pickleball, tắm khoáng nóng" },

          { time:"18:30", desc:"Tiệc tối BBQ ngoài trời + Giao lưu văn nghệ + Đốt lửa trại (theo option)" },

        ]

      },

      { day:2, title:"CÚC PHƯƠNG MINERAL – CỐ ĐÔ HOA LƯ – HẢI PHÒNG", meals:"Sáng+Trưa",

        activities:[

          { time:"07:00", desc:"Ăn sáng tại khu nghỉ dưỡng. Tự do: thưởng trà, chèo kayak, dạo rừng thông" },

          { time:"10:00", desc:"Làm thủ tục Check-out" },

          { time:"10:30", desc:"Tham quan Cố đô Hoa Lư – Dâng hương đền Vua Đinh Tiên Hoàng & Vua Lê Đại Hành" },

          { time:"12:00", desc:"Ăn trưa tại nhà hàng đặc sản dê núi Ninh Bình (250k/suất)" },

          { time:"13:30", desc:"Mua sắm đặc sản: cơm cháy, rượu cần, dứa Đồng Giao" },

          { time:"14:30", desc:"Khởi hành về Hải Phòng" },

          { time:"17:00", desc:"Về đến điểm hẹn, kết thúc hành trình" },

        ]

      },

    ],

    costItems:[

      { id:"ci1", group:"transport",  name:"Xe du lịch 35 chỗ đời mới",        unit:"chuyến", qty:1, priceNormal:8000000,  priceWeekend:9500000,  pricePeak:12000000 },

      { id:"ci2", group:"hotel",      name:"Phòng đôi tại Cúc Phương Mineral", unit:"phòng",  qty:17,priceNormal:800000,   priceWeekend:1100000,  pricePeak:1500000  },

      { id:"ci3", group:"food",       name:"Bữa trưa ngày 1",                  unit:"suất",   qty:1, priceNormal:200000,   priceWeekend:200000,   pricePeak:200000   },

      { id:"ci4", group:"food",       name:"Tiệc tối BBQ",                     unit:"suất",   qty:1, priceNormal:350000,   priceWeekend:350000,   pricePeak:400000   },

      { id:"ci5", group:"food",       name:"Bữa sáng ngày 2",                  unit:"suất",   qty:1, priceNormal:150000,   priceWeekend:150000,   pricePeak:150000   },

      { id:"ci6", group:"food",       name:"Bữa trưa ngày 2",                  unit:"suất",   qty:1, priceNormal:250000,   priceWeekend:250000,   pricePeak:250000   },

      { id:"ci7", group:"sightseeing",name:"Vé Cố đô Hoa Lư",                 unit:"vé",     qty:1, priceNormal:20000,    priceWeekend:20000,    pricePeak:20000    },

      { id:"ci8", group:"guide",      name:"HDV chuyên nghiệp suốt tuyến",     unit:"ngày",   qty:2, priceNormal:800000,   priceWeekend:1000000,  pricePeak:1200000  },

      { id:"ci9", group:"accessory",  name:"Nước uống 2 chai/người/ngày",      unit:"người",  qty:1, priceNormal:14000,    priceWeekend:14000,    pricePeak:14000    },

      { id:"ci10",group:"accessory",  name:"Mũ du lịch Minh Việt Travel",      unit:"cái",    qty:1, priceNormal:25000,    priceWeekend:25000,    pricePeak:25000    },

      { id:"ci11",group:"accessory",  name:"Bảo hiểm du lịch 100tr/người",     unit:"người",  qty:1, priceNormal:5000,     priceWeekend:5000,     pricePeak:5000     },

    ],

    priceOptions:[

      { id:"opt1", name:"Option 1 — Ấm cúng & Gắn kết",        adultPrice:2550000, childPrice:1800000, babyPrice:0, vatRate:8, note:"Loa kéo + lửa trại cơ bản" },

      { id:"opt2", name:"Option 2 — Chuyên nghiệp & Bùng nổ",  adultPrice:2780000, childPrice:2000000, babyPrice:0, vatRate:8, note:"Âm thanh chuyên nghiệp + ca sĩ + backdrop" },

    ],

    included:[

      "Xe du lịch đời mới, máy lạnh, lái xe kinh nghiệm suốt tuyến",

      "01 đêm tại Cúc Phương Mineral Retreat, 2-3 khách/phòng (bao gồm vé bể khoáng nóng/lạnh)",

      "Ăn uống: 01 trưa + 01 tối BBQ + 01 sáng + 01 trưa theo lịch trình",

      "Vé tham quan Cố đô Hoa Lư",

      "Mũ du lịch thương hiệu Minh Việt Travel tặng mỗi thành viên",

      "Bảo hiểm du lịch 100.000.000 VNĐ/người/vụ",

      "Nước uống 2 chai 500ml/người/ngày",

      "HDV chuyên nghiệp suốt hành trình",

    ],

    excluded:[

      "Ăn sáng Ngày 1 (quý khách tự túc)",

      "Dịch vụ cá nhân tại resort: ngâm bùn khoáng, massage",

      "Đồ uống: nước ngọt, bia, rượu gọi thêm",

      "Thuế VAT 8% nếu đoàn có nhu cầu xuất hóa đơn",

      "Chi phí cá nhân: điện thoại, giặt là và dịch vụ ngoài chương trình",

    ],

    paymentPolicy:{

      deposit:70,

      depositNote:"Đặt cọc 70% tổng giá trị tour ngay sau khi xác nhận dịch vụ",

      finalNote:"Thanh toán 100% phần còn lại sau khi kết thúc tour hoặc theo thỏa thuận hợp đồng",

    },

    cancelPolicy:[

      { before:"Trước 03 ngày khởi hành", fee:50 },

      { before:"Trong vòng 48 giờ trước khởi hành", fee:80 },

      { before:"Trong vòng 24 giờ hoặc ngay ngày khởi hành", fee:100 },

    ],

    paxPolicy:"Chốt số lượng khách chính xác trước 12h00 ngày trước khởi hành. Nếu giảm quá 10% so với dự kiến ban đầu, đơn giá có thể điều chỉnh.",

    slogan:"KHÁM PHÁ CẢM XÚC BẤT TẬN",

    createdBy:"dieu.hanh", createdAt:"2025-06-01T09:00:00", updatedAt:"2025-06-10T14:00:00",

  },

];



// ─── Thông tin công ty ───────────────────────────────────

const COMPANY_INFO = {

  name:     "CÔNG TY CP THƯƠNG MẠI VÀ DỊCH VỤ DU LỊCH MINH VIỆT",

  shortName:"Minh Việt Travel",

  address:  "Phòng 304, Tầng 3, Tòa nhà VCCI Duyên Hải Bắc Bộ, số 464 Lạch Tray, GV, Hải Phòng",

  hotlines: ["0934.368.132","0906.001.359","0934.218.855"],

  email:    "minhvietbooking@gmail.com",

  website:  "minhviettravel.com",

  slogan:   "KHÁM PHÁ CẢM XÚC BẤT TẬN",

  logo:     "/LogoMV.png",

};



const PROFIT_THRESHOLD = {

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



function getProfitThreshold(serviceId){

  return PROFIT_THRESHOLD[serviceId] || PROFIT_THRESHOLD.default;

}



function getProfitStatus(profitPct, serviceId){

  const threshold = getProfitThreshold(serviceId);

  if(profitPct < 0)         return {level:"loss",    color:"#8b2a1a", bg:"#fdf0ee", label:"Lỗ",              icon:"🔴"};

  if(profitPct < threshold) return {level:"warning",  color:"#7a5a00", bg:"#fef9e7", label:`Thấp (< ${threshold}%)`, icon:"⚠️"};

  if(profitPct < threshold*1.5) return {level:"ok",   color:"#1e3a8a", bg:"#eff6ff", label:"Bình thường",    icon:"🟡"};

  return                           {level:"good",     color:"#1d6b4f", bg:"#e8f5ef", label:"Tốt",            icon:"🟢"};

}



// ─── Trạng thái duyệt giá ─────────────────────────────────

const PRICE_APPROVAL_STATUS = {

  draft_price:     { label:"Chờ xác nhận giá", color:"#7a5a00", bg:"#fef9e7", dot:"#e8c53a", icon:"⏳" },

  pending_review:  { label:"KT đã trình GĐ",   color:"#1a4d8f", bg:"#e6f1fb", dot:"#3b82f6", icon:"📋" },

  approved:        { label:"GĐ đã duyệt",       color:"#1d6b4f", bg:"#e8f5ef", dot:"#34b27c", icon:"✅" },

  returned:        { label:"Trả về sửa lại",    color:"#8b2a1a", bg:"#fdf0ee", dot:"#e07060", icon:"↩️" },

};

const ORDER_STATUS = {

  pending_payment:{ label:"Chờ thu tiền",  color:"#7a5a00", bg:"#fef9e7", dot:"#e8c53a" },

  partial_paid:   { label:"Đã cọc",        color:"#2563eb", bg:"#eff6ff", dot:"#3b82f6" },

  full_paid:      { label:"Đã thu đủ",     color:"#1a4d8f", bg:"#e6f1fb", dot:"#3a8bd4" },

  in_service:     { label:"Đang dịch vụ",  color:"#5c2eb0", bg:"#f3f0ff", dot:"#8b5cf6" },

  completed:      { label:"Hoàn thành",    color:"#444",    bg:"#f0f4ff", dot:"#888"    },

  cancelled:      { label:"Đã hủy",        color:"#8b2a1a", bg:"#fdf0ee", dot:"#e07060" },

  locked:         { label:"Khóa đơn",      color:"#b0554a", bg:"#fdf0ee", dot:"#f87171" },

};

const VOUCHER_STATUS = {

  pending:  { label:"Chờ duyệt",   color:"#7a5a00", bg:"#fef9e7" },

  approved: { label:"Đã duyệt",    color:"#1a4d8f", bg:"#e6f1fb" },

  rejected: { label:"Từ chối",     color:"#8b2a1a", bg:"#fdf0ee" },

};



const SEED_ORDERS = [

  { id:"DH0012", invoiceType:"invoice",

    customer:{name:"Nguyễn Văn An",phone:"0912345678",email:"an.nguyen@gmail.com",dob:"1985-03-12",address:"45 Lê Lợi, Hải Phòng",province:"Hải Phòng",cccd:"031085012345",cccdImg:null},

    service:"tour", serviceName:"Tour Phú Quốc 3N2Đ", departDate:"2025-07-15", returnDate:"2025-07-17",

    pax:{adults:2,children:1,babies:0}, pricing:{adultPrice:6800000,childPrice:4500000,babyPrice:0,totalRevenue:18100000,totalCost:15900000,profit:2200000,profitPct:12.2},

    payments:[], totalPaid:5000000, status:"partial_paid", sale:"Nguyễn Thị Hoa", createdAt:"2025-06-01T09:30:00", notes:"Phòng view biển", validationErrors:[], paymentDeadline2:"2025-07-10" },

  { id:"DH0011", invoiceType:"no_invoice",

    customer:{name:"Trần Thị Bích",phone:"0987654321",email:"bich.tran@yahoo.com",dob:"1990-11-25",address:"12 Hoàng Diệu, Hà Nội",province:"Hà Nội",cccd:"001090123456",cccdImg:null},

    service:"ve_may_bay", serviceName:"Vé HAN-SGN khứ hồi", departDate:"2025-07-20", returnDate:"2025-07-25",

    pax:{adults:1,children:0,babies:0}, pricing:{adultPrice:3200000,childPrice:0,babyPrice:0,totalRevenue:3200000,totalCost:2900000,profit:300000,profitPct:10.3},

    payments:[], totalPaid:3200000, status:"full_paid", sale:"Trần Văn Nam", createdAt:"2025-06-03T14:10:00", notes:"", validationErrors:[] },

  { id:"DH0010", invoiceType:"no_invoice",

    customer:{name:"Lê Minh Tuấn",phone:"0356789012",email:"",dob:"1978-07-04",address:"Quận 7, TP.HCM",province:"TP. Hồ Chí Minh",cccd:"",cccdImg:null},

    service:"cruise", serviceName:"Du thuyền Hạ Long 2N1Đ", departDate:"2025-07-10", returnDate:"2025-07-11",

    pax:{adults:4,children:2,babies:1}, pricing:{adultPrice:4200000,childPrice:2800000,babyPrice:500000,totalRevenue:23100000,totalCost:22000000,profit:1100000,profitPct:4.8},

    payments:[], totalPaid:0, status:"pending_payment", sale:"Lê Thị Mai", createdAt:"2025-06-04T11:00:00", notes:"Thiếu CCCD — cần bổ sung", validationErrors:["low_profit"], paymentDeadline2:"" },

  { id:"DH0009", invoiceType:"invoice",

    customer:{name:"Phạm Thùy Linh",phone:"0778901234",email:"linh.pham@company.vn",dob:"1995-02-18",address:"15 Trần Phú, Đà Nẵng",province:"Đà Nẵng",cccd:"048095056789",cccdImg:null},

    service:"hotel_flight", serviceName:"Combo Bangkok 4N3Đ", departDate:"2025-08-01", returnDate:"2025-08-04",

    pax:{adults:2,children:0,babies:0}, pricing:{adultPrice:15900000,childPrice:0,babyPrice:0,totalRevenue:31800000,totalCost:30000000,profit:1800000,profitPct:5.7},

    payments:[], totalPaid:10000000, status:"partial_paid", sale:"Phạm Quốc Hùng", createdAt:"2025-06-05T08:45:00", notes:"", validationErrors:[], paymentDeadline2:"2025-07-25" },

];

// SEED_ORDERS dùng schema lồng (customer:{}, pricing:{}, pax:{}) — chuẨn hóa sang field phẳng mà các module UI đọc trực tiếp.
const STATUS_MAP_LEGACY={pending_payment:"pending_payment",partial_paid:"confirmed",full_paid:"confirmed",completed:"closed",cancelled:"cancelled"};
function normalizeOrder(o){
  if(!o) return o;
  if(o.customerName!==undefined) return o; // already flat
  const pax=o.pax&&typeof o.pax==="object"?( (o.pax.adults||0)+(o.pax.children||0)+(o.pax.babies||0) ):(o.pax||1);
  const totalPrice=o.pricing?.totalRevenue ?? o.totalPrice ?? 0;
  return {
    ...o,
    customerName:o.customer?.name||o.customerName||"",
    customerPhone:o.customer?.phone||o.customerPhone||"",
    customerEmail:o.customer?.email||o.customerEmail||"",
    tourName:o.serviceName||o.tourName||o.service||"",
    service:o.service||o.tourName||"",
    pax,
    totalPrice,
    costPrice:o.pricing?.totalCost||o.costPrice||0,
    totalPaid:o.totalPaid||0,
    status:STATUS_MAP_LEGACY[o.status]||o.status||"pending_payment",
    source:o.source||"Khác",
    note:o.notes||o.note||"",
  };
}
const SEED_ORDERS_FLAT = SEED_ORDERS.map(normalizeOrder);



const SEED_VOUCHERS = [

  { id:"PT-2025-001", type:"thu", orderId:"DH0012", customerName:"Nguyễn Văn An", amount:5000000,  method:"transfer", bankAccountId:"TK002", note:"Cọc 50% Tour Phú Quốc", date:"2025-06-01", status:"approved", approvedBy:"Kế toán Quỹ – Minh", billImg:null, createdBy:"Nguyễn Thị Hoa", installment:1 },

  { id:"PT-2025-002", type:"thu", orderId:"DH0011", customerName:"Trần Thị Bích",  amount:3200000,  method:"transfer", bankAccountId:"TK002", note:"Thanh toán 100% vé máy bay", date:"2025-06-03", status:"approved", approvedBy:"Kế toán Quỹ – Minh", billImg:null, createdBy:"Trần Văn Nam", installment:1 },

  { id:"PT-2025-003", type:"thu", orderId:"DH0009", customerName:"Phạm Thùy Linh", amount:10000000, method:"transfer", bankAccountId:"TK001", note:"Cọc 30% Combo Bangkok", date:"2025-06-05", status:"approved", approvedBy:"Kế toán Quỹ – Minh", billImg:null, createdBy:"Phạm Quốc Hùng", installment:1 },

  { id:"PC-2025-001", type:"chi", orderId:"DH0011", ncc:"Vietnam Airlines", amount:2600000, method:"transfer", bankAccountId:"TK002", note:"Thanh toán vé HAN-SGN", date:"2025-06-04", status:"approved", approvedBy:"Kế toán Trưởng – Liên", pnrCode:"VN-2024-ABC123", billImg:null, createdBy:"Trần Văn Nam" },

  { id:"PC-2025-002", type:"chi", orderId:"DH0012", ncc:"KS Vinpearl",      amount:3200000, method:"transfer", bankAccountId:"TK002", note:"Đặt cọc 40% phòng KS Phú Quốc", date:"2025-06-02", status:"approved", approvedBy:"Kế toán Trưởng – Liên", pnrCode:"VPQ-2025-001", billImg:null, createdBy:"Nguyễn Thị Hoa" },

  { id:"PC-2025-003", type:"chi", orderId:"DH0012", ncc:"KS Vinpearl",      amount:4800000, method:"transfer", bankAccountId:"TK001", note:"Thanh toán còn lại 60% KS Phú Quốc", date:"2025-06-10", status:"pending", approvedBy:null, pnrCode:"VPQ-2025-001", billImg:null, createdBy:"Nguyễn Thị Hoa" },

  { id:"PC-2025-004", type:"chi", orderId:"DH0009", ncc:"Booking.com",      amount:8000000, method:"transfer", bankAccountId:"TK002", note:"Cọc 30% KS Bangkok", date:"2025-06-06", status:"pending", approvedBy:null, pnrCode:"BKK-25-XYZ", billImg:null, createdBy:"Phạm Quốc Hùng" },

];



const SEED_NOTIFS = [

  { id:1, type:"payment", msg:"PT-2025-003: Phạm Thùy Linh cọc 10.000.000 đ — chờ xác nhận", time:"2025-06-05T08:46:00", read:false, role:"accountant" },

  { id:2, type:"expense", msg:"PC-2025-002: KS Vinpearl 3.200.000 đ — chờ KT Trưởng duyệt",   time:"2025-06-02T10:12:00", read:false, role:"accountant" },

  { id:3, type:"expense", msg:"PC-2025-003: Booking.com 8.000.000 đ — chờ KT Trưởng duyệt",   time:"2025-06-06T09:00:00", read:false, role:"accountant" },

  { id:4, type:"lock",    msg:"DH0010: Đơn bị khóa — thiếu CCCD, lợi nhuận < 5%",             time:"2025-06-04T11:01:00", read:true,  role:"manager"   },

];



// ─── Approval pipeline config ────────────────────────────

// Ngưỡng tự động chuyển lên cấp cao hơn

const APPROVAL_RULES = {

  thresholds: {

    kt_truong: 0,          // tất cả phiếu chi đều qua KT Trưởng

    giam_doc:  20000000,   // >= 20tr thì phải lên GĐ

  },

  levels: [

    { id:"sale",      label:"Sale tạo",          role:"sale",        icon:"👤" },

    { id:"kt_truong", label:"KT Trưởng duyệt",   role:"accountant",  icon:"🧾" },

    { id:"giam_doc",  label:"Giám đốc phê duyệt", role:"manager",    icon:"👑" },

    { id:"kt_quy",    label:"KT Quỹ chuyển tiền", role:"accountant", icon:"💸" },

  ],

};






// Expense request — replaces simple "chi" vouchers with full pipeline

const SEED_EXPENSES = [

  {

    id:"PC-2025-001",

    orderId:"DH0011", orderName:"Vé HAN-SGN khứ hồi",

    ncc:"Vietnam Airlines", nccBank:"VCB - 0021000123456",

    pnrCode:"VN-2024-ABC123",

    amount:2600000, method:"transfer",

    note:"Thanh toán 100% vé HAN-SGN khứ hồi — sau khi xuất vé",

    budgetLine:2900000,  // từ pricing.totalCost đơn

    status:"paid",

    createdBy:"Trần Văn Nam", createdAt:"2025-06-04T09:00:00",

    attachments:[],

    auditLog:[

      { ts:"2025-06-04T09:00:00", actor:"Trần Văn Nam",       role:"sale",      action:"created",   note:"Tạo yêu cầu chi" },

      { ts:"2025-06-04T10:15:00", actor:"Kế toán Trưởng – Liên", role:"accountant", action:"approved", note:"Đã đối chiếu PNR, giá Net khớp" },

      { ts:"2025-06-04T14:00:00", actor:"Kế toán Quỹ – Minh",    role:"accountant", action:"paid",     note:"Đã CK 2.600.000đ. Ref: VCB-2025-0604" },

    ],

  },

  {

    id:"PC-2025-002",

    orderId:"DH0012", orderName:"Tour Phú Quốc 3N2Đ",

    ncc:"KS Vinpearl PQ", nccBank:"VCB - 0071000234567",

    pnrCode:"VPQ-2025-001",

    amount:3200000, method:"transfer",

    note:"Cọc 50% phòng Superior Sea View × 2 đêm 15-17/07",

    budgetLine:15900000,

    status:"pending_kt",

    createdBy:"Nguyễn Thị Hoa", createdAt:"2025-06-02T10:00:00",

    attachments:[],

    auditLog:[

      { ts:"2025-06-02T10:00:00", actor:"Nguyễn Thị Hoa", role:"sale", action:"created", note:"Tạo yêu cầu chi cọc KS" },

    ],

  },

  {

    id:"PC-2025-003",

    orderId:"DH0009", orderName:"Combo Bangkok 4N3Đ",

    ncc:"Booking.com", nccBank:"Payoneer",

    pnrCode:"BKK-25-XYZ",

    amount:8000000, method:"transfer",

    note:"Cọc 30% Anantara Riverside Bangkok × 3 đêm 01-04/08",

    budgetLine:30000000,

    status:"pending_kt",

    createdBy:"Phạm Quốc Hùng", createdAt:"2025-06-06T08:00:00",

    attachments:[],

    auditLog:[

      { ts:"2025-06-06T08:00:00", actor:"Phạm Quốc Hùng", role:"sale", action:"created", note:"Tạo yêu cầu chi cọc KS Bangkok" },

    ],

  },

  {

    id:"PC-2025-004",

    orderId:"DH0009", orderName:"Combo Bangkok 4N3Đ",

    ncc:"Vietjet Air", nccBank:"ACB - 0123456789",

    pnrCode:"VJ-2025-BKK001",

    amount:25000000, method:"transfer",

    note:"Thanh toán 100% vé VJ890 HAN→BKK + VJ891 BKK→HAN × 2 người",

    budgetLine:30000000,

    status:"pending_gd",  // vượt 20tr → cần GĐ

    createdBy:"Phạm Quốc Hùng", createdAt:"2025-06-06T09:30:00",

    attachments:[],

    auditLog:[

      { ts:"2025-06-06T09:30:00", actor:"Phạm Quốc Hùng",        role:"sale",       action:"created",  note:"Tạo yêu cầu chi vé máy bay" },

      { ts:"2025-06-06T10:00:00", actor:"Kế toán Trưởng – Liên", role:"accountant", action:"approved", note:"Đã kiểm tra PNR, giá Net khớp. Chuyển GĐ vì > 20tr" },

    ],

  },

];
const SEED_EXPENSES_FLAT = SEED_EXPENSES.map(e=>({...e,type:e.type||"chi",status:e.status||"pending_kt",createdBy:e.createdBy||e.sale||"—",createdAt:e.createdAt||new Date().toISOString(),nccName:e.ncc||e.nccName||"",pipelineLog:e.pipelineLog||[]}));



// ─── Bảo lưu vé máy bay (Credit) ────────────────────────

const CREDIT_STATUS = {

  active:      { label:"Đang bảo lưu",   color:"#1e3a8a", bg:"#eff6ff",  dot:"#3b82f6" },

  partial:     { label:"Đã dùng một phần",color:"#7a5a00", bg:"#fef9e7",  dot:"#e8c53a" },

  used:        { label:"Đã dùng hết",     color:"#2563eb", bg:"#eff6ff",  dot:"#93c5fd" },

  expired:     { label:"Hết hạn",         color:"#8b2a1a", bg:"#fdf0ee",  dot:"#e07060" },

  transferred: { label:"Đã chuyển KH khác",color:"#5c2eb0",bg:"#f3f0ff", dot:"#a78bfa" },

};



const AIRLINES = [

  {v:"VN", l:"Vietnam Airlines"},

  {v:"VJ", l:"Vietjet Air"},

  {v:"BL", l:"Bamboo Airways"},

  {v:"QH", l:"Vietravel Airlines"},

  {v:"VU", l:"Vietravel Airlines"},

  {v:"other", l:"Hãng khác"},

];



const SEED_CREDITS = [

  {

    id:"BL-2025-001",

    orderId:"DH0011",

    customerName:"Trần Thị Bích",

    customerPhone:"0987654321",

    airline:"VN",

    airlineName:"Vietnam Airlines",

    route:"HAN → DAD",

    ticketNo:"738-2345678901",

    pnr:"ABCDEF",

    originalAmount:3500000,

    feeDeducted:500000,

    creditAmount:3000000,

    usedAmount:0,

    remainingAmount:3000000,

    issueDate:"2025-06-05",

    expiryDate:"2026-06-05",

    status:"active",

    conditions:"Áp dụng cho mọi chặng VNA. Không hoàn tiền mặt.",

    notes:"KH bận việc đột xuất, không bay được chuyến 20/06",

    usageHistory:[],

    createdBy:"Trần Văn Nam",

    createdAt:"2025-06-05T14:00:00",

  },

  {

    id:"BL-2025-002",

    orderId:"DH0009",

    customerName:"Phạm Thùy Linh",

    customerPhone:"0778901234",

    airline:"VJ",

    airlineName:"Vietjet Air",

    route:"HAN → SGN",

    ticketNo:"VJ-9876543210",

    pnr:"XYZABC",

    originalAmount:1800000,

    feeDeducted:200000,

    creditAmount:1600000,

    usedAmount:1100000,

    remainingAmount:500000,

    issueDate:"2025-05-10",

    expiryDate:"2026-05-10",

    status:"partial",

    conditions:"Chỉ dùng cho chặng nội địa VietJet.",

    notes:"Đã dùng 1.100.000đ mua vé HAN-DAD ngày 25/05",

    usageHistory:[

      {date:"2025-05-25",amount:1100000,newRoute:"HAN → DAD",newPnr:"PQR123",note:"Đặt vé mới HAN-DAD"}

    ],

    createdBy:"Phạm Quốc Hùng",

    createdAt:"2025-05-10T09:00:00",

  },

];



// ─── Refund — flexible manual entry ─────────────────────

// Không có chính sách cứng — nhân viên tự nhập số tiền

// dựa trên điều kiện thực tế từng NCC / từng trường hợp



const REFUND_SERVICE_TYPES = [

  {v:"tour",       l:"Tour trọn gói",  hint:"Phí hủy theo HĐ với NCC — thường 30–100% tùy thời điểm"},

  {v:"ve_may_bay", l:"Vé máy bay",     hint:"Có thể bảo lưu, đổi ngày, hoặc hoàn theo hãng (0–90%)"},

  {v:"khach_san",  l:"Khách sạn",      hint:"Non-refundable hoặc hoàn nếu hủy trước X ngày"},

  {v:"cruise",     l:"Du thuyền",      hint:"Thường phí hủy cao, phụ thuộc từng tàu"},

  {v:"combo",      l:"Combo KS+Vé",    hint:"Tính riêng từng phần: vé + KS theo chính sách riêng"},

  {v:"other",      l:"Loại khác",      hint:"Nhập tay theo thỏa thuận"},

];



const REFUND_FEE_PRESETS = [

  {label:"Không mất phí",  feePct:0},

  {label:"Phí 10%",        feePct:10},

  {label:"Phí 20%",        feePct:20},

  {label:"Phí 30%",        feePct:30},

  {label:"Phí 50%",        feePct:50},

  {label:"Phí 100% (mất trắng)", feePct:100},

];



const REFUND_STATUS = {

  draft:          { label:"Nháp",             color:"#888",    bg:"#f0f4ff", dot:"#ccc"    },

  pending_approve:{ label:"Chờ duyệt",        color:"#7a5a00", bg:"#fef9e7", dot:"#e8c53a" },

  approved:       { label:"Đã duyệt — chờ CK",color:"#1a4d8f", bg:"#e6f1fb", dot:"#3a8bd4" },

  paid:           { label:"Đã hoàn tiền",     color:"#2563eb", bg:"#eff6ff", dot:"#3b82f6" },

  rejected:       { label:"Từ chối",          color:"#8b2a1a", bg:"#fdf0ee", dot:"#e07060" },

};



// daysUntilDepart vẫn giữ để dùng ở chỗ khác

function daysUntilDepart(departDateStr){

  const now    = new Date(NOW_ISO);

  const depart = new Date(departDateStr);

  return Math.max(0, Math.ceil((depart - now) / 86400000));

}



// ─── Hóa đơn đầu ra (xuất cho khách) ────────────────────

const SEED_OUTPUT_INVOICES = [

  { id:"HDDR-001", orderId:"DH0012", invoiceNo:"0001234", symbol:"1C25TAA",

    issueDate:"2025-06-02", customerName:"Nguyễn Văn An", customerTax:"",

    serviceDesc:"Tour Phú Quốc 3N2Đ", amountBeforeVat:16760000, vatRate:8,

    vatAmount:1340800, totalAmount:18100800, status:"issued",

    note:"", createdBy:"lien.kt" },

  { id:"HDDR-002", orderId:"DH0009", invoiceNo:"0001235", symbol:"1C25TAA",

    issueDate:"2025-06-06", customerName:"Công ty CP Công nghệ ABC",

    customerTax:"0400123456", serviceDesc:"Combo Bangkok 4N3Đ",

    amountBeforeVat:29444444, vatRate:8, vatAmount:2355556,

    totalAmount:31800000, status:"issued", note:"", createdBy:"lien.kt" },

];



// ─── Hóa đơn đầu vào (nhận từ NCC) ──────────────────────

// docType: "vat" | "retail" | "none"

const SEED_INPUT_INVOICES = [

  { id:"HDVV-001", voucherId:"PC-2025-001", orderId:"DH0011",

    docType:"vat", invoiceNo:"VN2025001234", symbol:"1C25TAB",

    issueDate:"2025-06-04", supplierName:"Vietnam Airlines",

    supplierTax:"0100107518", serviceDesc:"Vé máy bay HAN-SGN",

    amountBeforeVat:2407407, vatRate:8, vatAmount:192593,

    totalAmount:2600000, status:"received", note:"", createdBy:"lien.kt" },

  { id:"HDVV-002", voucherId:"PC-2025-002", orderId:"DH0012",

    docType:"retail", invoiceNo:"BL-2025-0891", symbol:"",

    issueDate:"2025-06-02", supplierName:"KS Vinpearl Phú Quốc",

    supplierTax:"0313752498", serviceDesc:"Đặt cọc 40% phòng KS",

    amountBeforeVat:3200000, vatRate:0, vatAmount:0,

    totalAmount:3200000, status:"received", note:"Hóa đơn bán lẻ", createdBy:"lien.kt" },

  { id:"HDVV-003", voucherId:"PC-2025-004", orderId:"DH0009",

    docType:"none", invoiceNo:"", symbol:"",

    issueDate:"2025-06-06", supplierName:"Booking.com",

    supplierTax:"", serviceDesc:"Cọc 30% KS Bangkok",

    amountBeforeVat:8000000, vatRate:0, vatAmount:0,

    totalAmount:8000000, status:"received",

    note:"Không có chứng từ — thanh toán qua cổng online", createdBy:"lien.kt" },

];



const SEED_REFUNDS = [

  {

    id:"HT-2025-001",

    orderId:"DH0011",

    orderName:"Vé HAN-SGN khứ hồi",

    customerName:"Trần Thị Bích",

    customerPhone:"0987654321",

    serviceType:"ve_may_bay",

    reason:"cancel_personal",

    reasonNote:"Khách có việc đột xuất, không đi được. Vietnam Airlines giữ 30% phí hủy.",

    policyNote:"Vietnam Airlines: Hủy trước 15 ngày — phí 30% giá vé",

    totalPaid:3200000,

    feeAmount:960000,

    refundAmount:2240000,

    nccRecovery:0,

    nccRecoveryNote:"Vé đã xuất — không thu hồi được từ Vietnam Airlines",

    netLoss:960000,

    method:"transfer",

    bankInfo:"Vietcombank - 0012345678 - Trần Thị Bích",

    status:"approved",

    createdBy:"Trần Văn Nam",

    createdAt:"2025-06-05T14:00:00",

    approvedBy:"Kế toán Trưởng – Liên",

    approvedAt:"2025-06-05T16:30:00",

    paidAt:null,

    auditLog:[

      {ts:"2025-06-05T14:00:00", actor:"Trần Văn Nam",          role:"sale",       action:"created",  note:"Khách yêu cầu hủy toàn bộ vé. Phí hủy VNA 30%."},

      {ts:"2025-06-05T16:30:00", actor:"Kế toán Trưởng – Liên", role:"accountant", action:"approved", note:"Đã xác nhận với VNA. Hoàn 2.240.000đ cho khách."},

    ],

  },

  {

    id:"HT-2025-002",

    orderId:"DH0012",

    orderName:"Tour Phú Quốc 3N2Đ",

    customerName:"Nguyễn Văn An",

    customerPhone:"0912345678",

    serviceType:"tour",

    reason:"cancel_partial",

    reasonNote:"Hủy 1 người lớn, giữ lại 2 người còn lại. NCC giữ 10% phần hủy.",

    policyNote:"Saigon Tourist: Hủy trước 30 ngày — phí 10%",

    totalPaid:5000000,

    feeAmount:170000,

    refundAmount:1530000,

    nccRecovery:0,

    nccRecoveryNote:"NCC chưa thu cọc cho phần hủy này",

    netLoss:170000,

    method:"transfer",

    bankInfo:"Techcombank - 9988776655 - Nguyễn Văn An",

    status:"pending_approve",

    createdBy:"Nguyễn Thị Hoa",

    createdAt:"2025-06-06T09:00:00",

    approvedBy:null,

    approvedAt:null,

    paidAt:null,

    auditLog:[

      {ts:"2025-06-06T09:00:00", actor:"Nguyễn Thị Hoa", role:"sale", action:"created", note:"Hủy 1 NL — phí hủy NCC 10% phần cọc tương ứng ~170.000đ"},

    ],

  },

];



const CANCEL_REASONS = [

  {v:"cancel_personal", l:"Lý do cá nhân"},

  {v:"cancel_visa",     l:"Không có visa"},

  {v:"cancel_health",   l:"Sức khỏe / bệnh"},

  {v:"cancel_partial",  l:"Hủy một phần khách"},

  {v:"cancel_company",  l:"Minh Việt hủy tour"},

  {v:"cancel_other",    l:"Lý do khác"},

];



// ─── Monthly P&L seed data (6 tháng gần nhất) ────────────

// ─── Tour Operations ─────────────────────────────────────


const SEED_TOUR_GHEP_PRODUCTS = [];

const HDV_LIST = [

  {id:"HDV001",name:"Nguyễn Hữu Thắng", phone:"0901111111", lang:["vi","en"],    speciality:"Miền Nam, Phú Quốc",    available:true},

  {id:"HDV002",name:"Trần Thị Ngọc",    phone:"0902222222", lang:["vi","fr"],    speciality:"Châu Âu, Du thuyền",    available:true},

  {id:"HDV003",name:"Lê Văn Sơn",       phone:"0903333333", lang:["vi","zh"],    speciality:"Trung Quốc, Nhật Bản",  available:false},

  {id:"HDV004",name:"Phạm Minh Khoa",   phone:"0904444444", lang:["vi","en","ko"],speciality:"Hàn Quốc, Thái Lan",  available:true},

  {id:"HDV005",name:"Đỗ Thị Hương",     phone:"0905555555", lang:["vi","en"],    speciality:"Miền Bắc, Hạ Long",    available:true},

];



const TOUR_OP_STATUS = {

  planning:   {label:"Đang chuẩn bị",  color:"#7a5a00", bg:"#fef9e7", dot:"#e8c53a"},

  confirmed:  {label:"Đã xác nhận",    color:"#2563eb", bg:"#eff6ff", dot:"#3b82f6"},

  departed:   {label:"Đang đi tour",   color:"#5c2eb0", bg:"#f3f0ff", dot:"#8b5cf6"},

  completed:  {label:"Đã kết thúc",    color:"#444",    bg:"#f0f4ff", dot:"#888"   },

  cancelled:  {label:"Đã hủy",         color:"#8b2a1a", bg:"#fdf0ee", dot:"#e07060"},

};



const DEFAULT_CHECKLIST = [

  {id:"cl01", cat:"Trước tour",  item:"Xác nhận danh sách khách và CCCD",       done:false},

  {id:"cl02", cat:"Trước tour",  item:"Xác nhận booking KS / vé máy bay",       done:false},

  {id:"cl03", cat:"Trước tour",  item:"Chuẩn bị phù hiệu và tài liệu tour",    done:false},

  {id:"cl04", cat:"Trước tour",  item:"Liên hệ HDV và giao itinerary",          done:false},

  {id:"cl05", cat:"Trước tour",  item:"Gửi thông tin khởi hành cho khách",      done:false},

  {id:"cl06", cat:"Trong tour",  item:"Check-in khách sạn đủ phòng",            done:false},

  {id:"cl07", cat:"Trong tour",  item:"Xác nhận bữa ăn theo kế hoạch",          done:false},

  {id:"cl08", cat:"Trong tour",  item:"Báo cáo tình hình hàng ngày về văn phòng",done:false},

  {id:"cl09", cat:"Sau tour",    item:"Thu thập phản hồi từ khách",             done:false},

  {id:"cl10", cat:"Sau tour",    item:"Hoàn trả tài liệu và phù hiệu",          done:false},

  {id:"cl11", cat:"Sau tour",    item:"Quyết toán chi phí phát sinh",           done:false},

];



const SEED_TOUR_OPS = [

  {

    id:"TOP001", orderId:"DH0012", tourName:"Tour Phú Quốc 3N2Đ",

    departDate:"2025-07-15", returnDate:"2025-07-17",

    pax:{adults:2,children:1,babies:0},

    hdvId:"HDV001", hdvName:"Nguyễn Hữu Thắng",

    vehicle:"Xe 16 chỗ - 51B-12345", meetPoint:"Sân bay Tân Sơn Nhất, cửa ra T2",

    meetTime:"05:30", status:"planning",

    itinerary:[

      {day:1, title:"Hà Nội → Phú Quốc", activities:"Bay VN225 06:00 · Nhận phòng KS Vinpearl · Tham quan Dinh Cậu buổi chiều · BBQ hải sản tối"},

      {day:2, title:"Khám phá đảo",       activities:"Tour tham quan 3 đảo bằng tàu · Snorkeling · Ăn trưa trên tàu · Chiều tự do nghỉ resort"},

      {day:3, title:"Phú Quốc → Hà Nội", activities:"Sáng tự do · Check-out 12:00 · Bay VN226 14:00 về Hà Nội"},

    ],

    checklist: DEFAULT_CHECKLIST.map(c=>({...c,done:["cl01","cl02"].includes(c.id)})),

    notes:"Khách yêu cầu phòng view biển, bé 3 tuổi cần cũi",

    createdAt:"2025-06-01T10:00:00",

  },

  {

    id:"TOP002", orderId:"DH0009", tourName:"Combo Bangkok 4N3Đ",

    departDate:"2025-08-01", returnDate:"2025-08-04",

    pax:{adults:2,children:0,babies:0},

    hdvId:"HDV004", hdvName:"Phạm Minh Khoa",

    vehicle:"Transfer xe riêng tại Bangkok", meetPoint:"Sân bay Nội Bài, cửa quốc tế",

    meetTime:"06:00", status:"planning",

    itinerary:[

      {day:1, title:"Hà Nội → Bangkok",    activities:"Bay VJ890 07:00 · Nhận phòng Anantara Riverside · Chiều tham quan Chùa Wat Pho"},

      {day:2, title:"Bangkok City Tour",   activities:"Khám phá Chatuchak Market · Asiatique The Riverfront tối"},

      {day:3, title:"Ayutthaya Day Trip",  activities:"Tour Ayutthaya cả ngày · Tham quan đền cổ · Về Bangkok tối"},

      {day:4, title:"Bangkok → Hà Nội",   activities:"Mua sắm Siam Paragon · Check-out 11:00 · Bay VJ891 15:00"},

    ],

    checklist: DEFAULT_CHECKLIST.map(c=>({...c,done:false})),

    notes:"",

    createdAt:"2025-06-06T09:00:00",

  },

];



// ─── CRM — Customer profiles ─────────────────────────────




const SEED_CUSTOMERS = [

  // Khách cá nhân

  { id:"KH001", type:"personal", name:"Nguyễn Văn An", phone:"0912345678", email:"an.nguyen@gmail.com",

    dob:"1985-03-12", province:"Hải Phòng", cccd:"031085012345",

    tags:["vip","loyal"], assignedSale:"Nguyễn Thị Hoa",

    totalOrders:5, totalRevenue:72400000, totalProfit:9800000,

    lastOrderDate:"2025-06-01", firstOrderDate:"2023-08-15",

    notes:"Khách hay đi tour hè với gia đình, thích resort cao cấp.",

    source:"Referral",

    events:[

      {id:"e1",type:"birthday",   date:"1985-03-12",  label:"Sinh nhật",         yearly:true},

      {id:"e2",type:"anniversary",date:"2023-08-15",  label:"Kỷ niệm hợp tác",  yearly:true},

    ],

    interactions:[

      {ts:"2025-06-01T09:30:00",type:"order", note:"Đặt Tour Phú Quốc 3N2Đ"},

      {ts:"2025-05-10T14:00:00",type:"call",  note:"Tư vấn tour hè Phú Quốc"},

      {ts:"2025-02-14T10:00:00",type:"order", note:"Tour Đà Nẵng 4N3Đ dịp Tết"},

    ],

  },

  { id:"KH002", type:"personal", name:"Trần Thị Bích", phone:"0987654321", email:"bich.tran@yahoo.com",

    dob:"1990-11-25", province:"Hà Nội", cccd:"001090123456",

    tags:["loyal"], assignedSale:"Trần Văn Nam",

    totalOrders:3, totalRevenue:18600000, totalProfit:2200000,

    lastOrderDate:"2025-06-03", firstOrderDate:"2024-01-20",

    notes:"Hay đi một mình, ưu tiên vé máy bay giá tốt.",

    source:"Google",

    events:[{id:"e3",type:"birthday",date:"1990-11-25",label:"Sinh nhật",yearly:true}],

    interactions:[

      {ts:"2025-06-03T14:10:00",type:"order", note:"Vé HAN-SGN khứ hồi"},

      {ts:"2025-03-08T09:00:00",type:"email", note:"Gửi ưu đãi 8/3"},

    ],

  },

  { id:"KH003", type:"personal", name:"Lê Minh Tuấn", phone:"0356789012", email:"",

    dob:"1978-07-04", province:"TP. Hồ Chí Minh", cccd:"",

    tags:["risk","new"], assignedSale:"Lê Thị Mai",

    totalOrders:1, totalRevenue:23100000, totalProfit:1100000,

    lastOrderDate:"2025-06-04", firstOrderDate:"2025-06-04",

    notes:"Thiếu CCCD, đơn bị khóa. Cần follow-up.",

    source:"Walk-in",

    events:[{id:"e4",type:"birthday",date:"1978-07-04",label:"Sinh nhật",yearly:true}],

    interactions:[

      {ts:"2025-06-04T11:00:00",type:"order", note:"Du thuyền Hạ Long — đơn bị khóa"},

    ],

  },

  // Khách cá nhân VIP

  { id:"KH005", type:"personal", name:"Hoàng Minh Đức", phone:"0901234567", email:"duc.hoang@vip.vn",

    dob:"1972-08-30", province:"Hà Nội", cccd:"001072088888",

    tags:["vip","corp"], assignedSale:"Nguyễn Thị Hoa",

    totalOrders:12, totalRevenue:387000000, totalProfit:52000000,

    lastOrderDate:"2025-05-20", firstOrderDate:"2022-03-01",

    notes:"CEO công ty TM. Luôn đặt phòng hạng sang.",

    source:"Direct",

    events:[

      {id:"e5",type:"birthday",   date:"1972-08-30", label:"Sinh nhật",        yearly:true},

      {id:"e6",type:"anniversary",date:"2022-03-01", label:"Kỷ niệm hợp tác", yearly:true},

    ],

    interactions:[

      {ts:"2025-05-20T09:00:00",type:"order", note:"Du thuyền Hạ Long 3N2Đ hạng Deluxe"},

      {ts:"2025-04-10T11:00:00",type:"call",  note:"Tư vấn tour châu Âu hè"},

      {ts:"2025-03-01T15:00:00",type:"meet",  note:"Gặp mặt tri ân khách VIP"},

    ],

  },

  // Khách doanh nghiệp

  { id:"KH004", type:"business",

    name:"Phạm Thùy Linh",

    companyName:"Công ty CP Công nghệ ABC",

    taxCode:"0400123456",

    director:"Nguyễn Văn Bình",

    foundingDate:"2010-11-10",

    companySize:"50-200 nhân viên",

    industry:"Công nghệ thông tin",

    companyPhone:"028 3888 9999",

    companyEmail:"info@abc-tech.vn",

    companyAddress:"123 Nguyễn Huệ, Q.1, TP.HCM",

    phone:"0778901234", email:"linh.pham@company.vn",

    dob:"1995-02-18", province:"Đà Nẵng", cccd:"048095056789",

    tags:["corp","loyal","vip"], assignedSale:"Phạm Quốc Hùng",

    totalOrders:4, totalRevenue:98200000, totalProfit:12400000,

    lastOrderDate:"2025-06-05", firstOrderDate:"2023-11-10",

    notes:"Đặt tour teambuilding cho công ty, hay book combo KS+vé. Thường tổ chức 2 lần/năm.",

    source:"Referral",

    events:[

      {id:"e7",type:"founding",       date:"2010-11-10", label:"Kỷ niệm thành lập công ty",yearly:true},

      {id:"e8",type:"contract_anniv", date:"2023-11-10", label:"Kỷ niệm hợp đồng đầu tiên",yearly:true},

      {id:"e9",type:"birthday",       date:"1995-02-18", label:"Sinh nhật người phụ trách",yearly:true},

    ],

    interactions:[

      {ts:"2025-06-05T08:45:00",type:"order", note:"Combo Bangkok 4N3Đ"},

      {ts:"2025-04-01T10:30:00",type:"meet",  note:"Gặp tư vấn tour Nhật tháng 8"},

      {ts:"2025-01-15T14:00:00",type:"order", note:"Tour Teambuilding Đà Lạt 2N1Đ"},

    ],

  },

  { id:"KH006", type:"business",

    name:"Nguyễn Thế Anh",

    companyName:"Tập đoàn Bất động sản XYZ",

    taxCode:"0300987654",

    director:"Nguyễn Thế Anh",

    foundingDate:"2005-09-01",

    companySize:">500 nhân viên",

    industry:"Bất động sản",

    companyPhone:"028 3999 8888",

    companyEmail:"contact@xyz-group.vn",

    companyAddress:"88 Lý Tự Trọng, Q.1, TP.HCM",

    phone:"0933445566", email:"theanh@xyz-group.vn",

    dob:"1968-05-15", province:"TP. Hồ Chí Minh", cccd:"079068012345",

    tags:["vip","corp","potential"], assignedSale:"Nguyễn Thị Hoa",

    totalOrders:2, totalRevenue:156000000, totalProfit:22000000,

    lastOrderDate:"2025-04-20", firstOrderDate:"2024-09-01",

    notes:"Hay tổ chức du lịch khen thưởng nhân viên cuối năm. Ngân sách lớn.",

    source:"Direct",

    events:[

      {id:"e10",type:"founding",      date:"2005-09-01", label:"Ngày thành lập tập đoàn",yearly:true},

      {id:"e11",type:"contract_anniv",date:"2024-09-01", label:"Kỷ niệm hợp tác",       yearly:true},

      {id:"e12",type:"birthday",      date:"1968-05-15", label:"Sinh nhật ông Thế Anh",  yearly:true},

    ],

    interactions:[

      {ts:"2025-04-20T10:00:00",type:"order", note:"Du lịch khen thưởng Phú Quốc 50 người"},

      {ts:"2025-03-15T14:00:00",type:"meet",  note:"Gặp đề xuất gói du lịch cuối năm 2025"},

    ],

  },

];



// ─── NCC Master list ──────────────────────────────────────

const SEED_NCC_MASTER = [

  { id:"NCC001", name:"Vietnam Airlines",  cat:"hang_bay",   contact:"sales@vietnamairlines.com", phone:"1900 1100", bank:"VCB - 0021000123456", taxCode:"0100107518", address:"Sân bay Nội Bài, Hà Nội",  note:"" },

  { id:"NCC002", name:"Vietjet Air",       cat:"hang_bay",   contact:"b2b@vietjetair.com",        phone:"1900 1886", bank:"ACB - 0123456789",   taxCode:"0102182292", address:"19 Cộng Hòa, TP.HCM",    note:"" },

  { id:"NCC003", name:"Bamboo Airways",    cat:"hang_bay",   contact:"partner@bambooairways.com", phone:"1900 1166", bank:"BIDV - 26110000001", taxCode:"0106943668", address:"189 Trường Chinh, Hà Nội", note:"" },

  { id:"NCC004", name:"KS Vinpearl PQ",   cat:"khach_san",  contact:"booking.pq@vinpearl.com",   phone:"0297 3599 999", bank:"VCB - 0071000234567", taxCode:"0101245678", address:"Phú Quốc, Kiên Giang", note:"" },

  { id:"NCC005", name:"KS Mường Thanh",   cat:"khach_san",  contact:"sales@muongthanh.vn",       phone:"024 3974 3333", bank:"AGRI - 4000201234567", taxCode:"0100109876", address:"Hà Nội",              note:"" },

  { id:"NCC006", name:"Booking.com",       cat:"khach_san",  contact:"partner@booking.com",       phone:"1800 5555",  bank:"Payoneer",           taxCode:"N/A",       address:"Amsterdam, Netherlands",  note:"Thanh toán qua Payoneer" },

  { id:"NCC007", name:"Saigon Tourist",   cat:"lu_hanh",    contact:"inbound@saigontourist.net", phone:"028 3827 9279", bank:"VCB - 0071000345678", taxCode:"0301456789", address:"45 Lê Thánh Tôn, TP.HCM", note:"" },

  { id:"NCC008", name:"BenThanh Tourist", cat:"lu_hanh",    contact:"sales@benhthanhtravel.com", phone:"028 3836 8172", bank:"TCB - 19031234567890", taxCode:"0302567890", address:"1 Lê Lợi, TP.HCM",    note:"" },

  { id:"NCC009", name:"Emeraude Cruises", cat:"du_thuyen",  contact:"res@emeraude-cruises.com",  phone:"024 3935 1888", bank:"VCB - 0011000456789", taxCode:"0100987654", address:"Hạ Long, Quảng Ninh",  note:"" },

  { id:"NCC010", name:"Indochina Sails",  cat:"du_thuyen",  contact:"sales@indochinasails.com",  phone:"024 3826 2580", bank:"MB - 0012345678",    taxCode:"0100876543", address:"Hạ Long, Quảng Ninh",  note:"" },

];



const NCC_CAT = {

  // Vận chuyển

  hang_bay:       { label:"Hãng bay",               icon:"✈",  color:"#1a4d8f", bg:"#e6f1fb", group:"Vận chuyển"    },

  dai_ly_ve_may_bay:{ label:"Đại lý vé máy bay",    icon:"🎫", color:"#1d4ed8", bg:"#dbeafe", group:"Vận chuyển"    },

  xe_van_chuyen:  { label:"Xe vận chuyển / Thuê xe", icon:"🚌", color:"#374151", bg:"#f3f4f6", group:"Vận chuyển"    },

  tau_bien:       { label:"Tàu biển / Phà",          icon:"⛴", color:"#0e7490", bg:"#ecfeff", group:"Vận chuyển"    },



  // Lưu trú

  khach_san:      { label:"Khách sạn / Resort",      icon:"🏨", color:"#5c2eb0", bg:"#f3f0ff", group:"Lưu trú"      },

  homestay:       { label:"Homestay / Villa",        icon:"🏡", color:"#059669", bg:"#ecfdf5", group:"Lưu trú"      },

  du_thuyen:      { label:"Du thuyền",               icon:"🚢", color:"#7a5a00", bg:"#fef9e7", group:"Lưu trú"      },



  // Điểm đến & Vui chơi

  khu_du_lich:    { label:"Khu du lịch / Tham quan", icon:"🗺", color:"#2563eb", bg:"#eff6ff", group:"Điểm đến"     },

  diem_tham_quan: { label:"Di tích / Bảo tàng",      icon:"🏛", color:"#7c2d12", bg:"#fff7ed", group:"Điểm đến"     },

  khu_vui_choi:   { label:"Khu vui chơi / Giải trí", icon:"🎡", color:"#be185d", bg:"#fdf2f8", group:"Điểm đến"     },

  ve_su_kien:     { label:"Vé sự kiện / Show",        icon:"🎭", color:"#6d28d9", bg:"#f5f3ff", group:"Điểm đến"     },



  // Ăn uống & Dịch vụ

  nha_hang:       { label:"Nhà hàng / Ẩm thực",      icon:"🍽", color:"#b45309", bg:"#fffbeb", group:"Dịch vụ"      },

  hdv_freelance:  { label:"HDV Freelance",            icon:"🎤", color:"#0f766e", bg:"#f0fdfa", group:"Dịch vụ"      },

  bao_hiem:       { label:"Bảo hiểm du lịch",         icon:"🛡", color:"#1e40af", bg:"#eff6ff", group:"Dịch vụ"      },

  spa_massage:    { label:"Spa / Massage",            icon:"💆", color:"#9d174d", bg:"#fdf2f8", group:"Dịch vụ"      },



  // Đại lý & Nền tảng

  ota_platform:   { label:"OTA / Nền tảng online",   icon:"💻", color:"#0369a1", bg:"#f0f9ff", group:"Đại lý"       },

  dai_ly_cap_1:   { label:"Đại lý cấp 1",             icon:"🏢", color:"#1e3a8a", bg:"#eff6ff", group:"Đại lý"       },

  dai_ly_cap_2:   { label:"Đại lý cấp 2 / GSA",       icon:"🤝", color:"#3730a3", bg:"#eef2ff", group:"Đại lý"       },



  lu_hanh:        { label:"Công ty lữ hành / Inbound",icon:"🧭", color:"#0e7490", bg:"#ecfeff", group:"Đại lý"       },

  // Khác

  khac:           { label:"Khác / Tự định nghĩa",    icon:"📦", color:"#64748b", bg:"#f8fafc", group:"Khác"         },

};



// Nhóm các loại NCC để hiển thị trong form

const NCC_CAT_GROUPS = [

  { key:"Vận chuyển", icon:"✈" },

  { key:"Lưu trú",    icon:"🏨" },

  { key:"Điểm đến",   icon:"🗺" },

  { key:"Dịch vụ",    icon:"🛎" },

  { key:"Đại lý",     icon:"🏢" },

  { key:"Khác",       icon:"📦" },

];



// Now -> simulated "current time" for time-limit countdown

const NOW_ISO = new Date().toISOString();



const SEED_NCC_BOOKINGS = [

  {

    id:"BK001", orderId:"DH0012", nccId:"NCC004", nccName:"KS Vinpearl PQ",

    serviceType:"khach_san", serviceName:"Phòng Superior Sea View × 2 đêm",

    pnrCode:"VPQ-2025-001", checkIn:"2025-07-15", checkOut:"2025-07-17",

    netPrice:3200000, totalNet:6400000,

    deposit:3200000, depositDate:"2025-06-02", depositPaid:true,

    remaining:3200000, deadline:"2025-07-08",

    timeLimit:"2025-06-08T17:00:00",

    status:"confirmed", notes:"Yêu cầu tầng cao, view biển",

    createdBy:"Nguyễn Thị Hoa", createdAt:"2025-06-02T10:00:00",

    payments:[{date:"2025-06-02",amount:3200000,method:"transfer",note:"Cọc 50%",voucherId:"PC-2025-002"}],

  },

  {

    id:"BK002", orderId:"DH0011", nccId:"NCC001", nccName:"Vietnam Airlines",

    serviceType:"hang_bay", serviceName:"VN123 HAN→SGN 20/07 + VN124 SGN→HAN 25/07",

    pnrCode:"VN-2024-ABC123", checkIn:"2025-07-20", checkOut:"2025-07-25",

    netPrice:2600000, totalNet:2600000,

    deposit:2600000, depositDate:"2025-06-04", depositPaid:true,

    remaining:0, deadline:"2025-07-10",

    timeLimit:"2025-06-05T23:59:00",

    status:"ticketed", notes:"",

    createdBy:"Trần Văn Nam", createdAt:"2025-06-04T09:00:00",

    payments:[{date:"2025-06-04",amount:2600000,method:"transfer",note:"Thanh toán 100% vé",voucherId:"PC-2025-001"}],

  },

  {

    id:"BK003", orderId:"DH0009", nccId:"NCC006", nccName:"Booking.com",

    serviceType:"khach_san", serviceName:"Anantara Riverside Bangkok × 3 đêm",

    pnrCode:"BKK-25-XYZ", checkIn:"2025-08-01", checkOut:"2025-08-04",

    netPrice:4000000, totalNet:12000000,

    deposit:4000000, depositDate:"2025-06-06", depositPaid:false,

    remaining:8000000, deadline:"2025-07-25",

    timeLimit:"2025-06-08T12:00:00",

    status:"hold", notes:"",

    createdBy:"Phạm Quốc Hùng", createdAt:"2025-06-06T08:00:00",

    payments:[],

  },

  {

    id:"BK004", orderId:"DH0009", nccId:"NCC002", nccName:"Vietjet Air",

    serviceType:"hang_bay", serviceName:"VJ890 HAN→BKK 01/08 + VJ891 BKK→HAN 04/08",

    pnrCode:"VJ-2025-BKK001", checkIn:"2025-08-01", checkOut:"2025-08-04",

    netPrice:3200000, totalNet:6400000,

    deposit:0, depositDate:null, depositPaid:false,

    remaining:6400000, deadline:"2025-07-20",

    timeLimit:"2025-06-06T11:15:00",

    status:"hold", notes:"Chưa đặt cọc",

    createdBy:"Phạm Quốc Hùng", createdAt:"2025-06-06T09:30:00",

    payments:[],

  },

];



const BK_STATUS = {

  hold:      { label:"Đang giữ chỗ", color:"#7a5a00", bg:"#fef9e7", dot:"#e8c53a" },

  confirmed: { label:"Đã xác nhận",  color:"#2563eb", bg:"#eff6ff", dot:"#3b82f6" },

  ticketed:  { label:"Đã xuất vé",   color:"#1a4d8f", bg:"#e6f1fb", dot:"#3a8bd4" },

  cancelled: { label:"Đã hủy",       color:"#8b2a1a", bg:"#fdf0ee", dot:"#e07060" },

  expired:   { label:"Hết time limit",color:"#8b2a1a", bg:"#fdf0ee", dot:"#e07060" },

};



// ═══════════════════════════════════════════════════════════

// HELPERS

// ═══════════════════════════════════════════════════════════

const fmt     = (n) => (!n&&n!==0)?"-":Math.round(n).toLocaleString("vi-VN");

const fmtS    = (n) => { if(!n)return"0"; if(n>=1e9)return(n/1e9).toFixed(1).replace(/\.0$/,"")+" tỷ"; if(n>=1e6)return(n/1e6).toFixed(1).replace(/\.0$/,"")+" tr"; if(n>=1e3)return(n/1e3).toFixed(0)+"k"; return Math.round(n).toString(); };

const fmtD    = (s) => { if(!s)return"-"; const d=new Date(s); return`${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`; };

const fmtDT   = (s) => { if(!s)return"-"; const d=new Date(s); return`${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`; };

const genId   = (prefix,list) => `${prefix}${String(list.filter(v=>v.id.startsWith(prefix)).length+1).padStart(3,"0")}`;

const genVId  = (type,list) => { const p=type==="thu"?"PT":"PC"; const y=new Date().getFullYear(); const n=String(list.filter(v=>v.id.startsWith(p)).length+1).padStart(3,"0"); return`${p}-${y}-${n}`; };

const validateOrder = (o) => {
  const e = [];
  if(!o.serviceName)     e.push({code:"missing_service",msg:"Chưa chọn dịch vụ",   level:"error"});

  const threshold = getProfitThreshold(o.service);

  if(!o.serviceName)     e.push({code:"missing_service",msg:"Chưa chọn dịch vụ",   level:"error"});
  return e;

};



// ═══════════════════════════════════════════════════════════

// SHARED UI ATOMS

// ═══════════════════════════════════════════════════════════

const SBadge = ({status,cfg,size="md"}) => {
  const c=cfg[status]||{label:status,color:"#888",bg:"#eee"};
  return <span style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:size==="sm"?10:11,fontWeight:600,padding:size==="sm"?"2px 7px":"3px 10px",borderRadius:20,background:c.bg,color:c.color,border:`1px solid ${c.color}30`,whiteSpace:"nowrap"}}>
    {"dot" in c&&<span style={{width:6,height:6,borderRadius:"50%",background:c.dot,flexShrink:0}}/>}{c.label}
  </span>;

};

const Toast = ({msg,type}) => {

  const c={success:{bg:"#eff6ff",border:"#3b82f6",text:"#1e3a8a",icon:"✓"},error:{bg:"#fdf0ee",border:"#e07060",text:"#8b2a1a",icon:"✕"},warning:{bg:"#fef9e7",border:"#e8c53a",text:"#7a5a00",icon:"⚠"}}[type]||{bg:"#eff6ff",border:"#3b82f6",text:"#1e3a8a",icon:"✓"};

  return <div style={{background:c.bg,border:`1px solid ${c.border}`,borderRadius:10,padding:"10px 16px",display:"flex",alignItems:"center",gap:10,minWidth:280,boxShadow:"0 4px 16px rgba(0,0,0,0.12)"}}>

    <span style={{fontSize:13,color:c.border,fontWeight:700}}>{c.icon}</span>

    <span style={{fontSize:13,color:c.text}}>{msg}</span>

  </div>;

};

const Card = ({children,style={}}) => <div style={{background:"#fff",borderRadius:12,border:"1px solid #e8e6df",padding:"18px 20px",...style}}>{children}</div>;

const Row  = ({label,value,hi,danger}) => <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:"1px solid #f0efe8",fontSize:13}}>
  <span style={{color:"#888"}}>{label}</span>
  <span style={{fontWeight:hi?600:400,color:danger?"#b0554a":"#1e293b"}}>{value}</span>
</div>;

const Sel  = ({children,...p}) => <select {...p} style={{width:"100%",padding:"9px 12px",border:"1px solid #d5d3cb",borderRadius:8,fontSize:13,background:"#f8faff",color:"#1e293b",boxSizing:"border-box",...(p.style||{})}}>{children}</select>;

const Btn  = ({children,variant="primary",size="md",...p}) => {
  const v={primary:{background:"linear-gradient(135deg,#1e3a8a,#172554)",color:"#fff",padding:size==="sm"?"6px 14px":"9px 20px"},outline:{background:"#fff",color:"#444",border:"1px solid #d5d3cb",padding:size==="sm"?"5px 12px":"8px 18px"},danger:{background:"#fdf0ee",color:"#b0554a",border:"1px solid #f5c0b5",padding:size==="sm"?"5px 12px":"8px 18px"},success:{background:"#eff6ff",color:"#2563eb",border:"1px solid #bfdbfe",padding:size==="sm"?"5px 12px":"8px 18px"}}[variant];
  return <button {...p} style={{...v,borderRadius:8,fontWeight:600,cursor:"pointer",border:"none",fontSize:13,transition:"opacity .2s",...(p.style||{})}}>{children}</button>;
};

const FieldWrap = ({label,req,err,children}) => <div style={{marginBottom:14}}>
  {label&&<label style={{fontSize:12,fontWeight:600,color:"#475569",display:"block",marginBottom:5}}>{label}{req&&<span style={{color:"#ef4444"}}>*</span>}</label>}
  {children}
  {err&&<div style={{fontSize:11,color:"#b0554a",marginTop:3}}>⚠ {err}</div>}
</div>;

const ProgBar = ({value,color}) => <div style={{height:7,background:"#dbeafe",borderRadius:4,overflow:"hidden"}}>

  <div style={{width:`${value}%`,height:"100%",background:color||"#2563eb",borderRadius:4,transition:"width .4s"}}/>

</div>;

const Divider = ({label}) => <div style={{display:"flex",alignItems:"center",gap:10,margin:"14px 0 10px"}}>

  <div style={{flex:1,height:1,background:"#dbeafe"}}/>

  {label&&<span style={{fontSize:11,color:"#aaa",textTransform:"uppercase",letterSpacing:.5,whiteSpace:"nowrap"}}>{label}</span>}

  <div style={{flex:1,height:1,background:"#dbeafe"}}/>

</div>;



// ═══════════════════════════════════════════════════════════

// FINANCE PANEL — Kế toán view inside an order

// ═══════════════════════════════════════════════════════════

function calcOrderTotal(order){ return (order?.totalPrice||0); }
function calcDebt(order, vouchers){ return (order?.totalPrice||0) - (order?.totalPaid||0); }
const loadSession = () => { try { const s = sessionStorage.getItem("mv_user"); return s ? JSON.parse(s) : null; } catch(e){ return null; } };
const saveSession = (u) => { try { if(u) sessionStorage.setItem("mv_user", JSON.stringify(u)); else sessionStorage.removeItem("mv_user"); } catch(e){} };




function CloseOrderModule({orders,vouchers,expenses,refunds,onCloseOrder,pushNotif,currentRole,currentUser}){
  const [search,setSearch]=React.useState("");
  const [selected,setSelected]=React.useState(null);
  const [confirm,setConfirm]=React.useState(false);

  const closeable=orders.filter(o=>["confirmed","in_progress"].includes(o.status));
  const filtered=closeable.filter(o=>{
    const q=search.toLowerCase();
    return !q||o.id?.toLowerCase().includes(q)||o.customerName?.toLowerCase().includes(q)||o.tourName?.toLowerCase().includes(q);
  });

  const fmtMoney=(n)=>(n||0).toLocaleString("vi-VN")+"₫";

  const getFinancials=(o)=>{
    const ovs=(vouchers||[]).filter(v=>v.orderId===o.id);
    const totalPaid=ovs.filter(v=>v.type==="thu"&&["approved","confirmed"].includes(v.status)).reduce((s,v)=>s+(v.amount||0),0);
    const totalChi=ovs.filter(v=>v.type==="chi"&&["approved","confirmed"].includes(v.status)).reduce((s,v)=>s+(v.amount||0),0);
    const debt=(o.totalPrice||0)-totalPaid;
    const profit=(o.totalPrice||0)-totalChi-(o.costPrice||0);
    return {totalPaid,totalChi,debt,profit};
  };

  const doClose=()=>{
    if(!selected) return;
    onCloseOrder({...selected,status:"closed",closedBy:currentUser?.name,closedAt:new Date().toISOString()});
    pushNotif&&pushNotif("Đã đóng đơn "+selected.id+" — quyết toán xong","success");
    setSelected(null); setConfirm(false);
  };

  if(selected){
    const fin=getFinancials(selected);
    return(
      <div style={{padding:24,maxWidth:640,margin:"0 auto"}}>
        <button onClick={()=>{setSelected(null);setConfirm(false);}} style={{background:"none",border:"none",color:"#2563eb",cursor:"pointer",fontSize:14,marginBottom:16}}>← Quay lại</button>
        <div style={{background:"#fff",borderRadius:16,padding:24,boxShadow:"0 2px 12px rgba(0,0,0,.08)"}}>
          <h3 style={{margin:"0 0 4px"}}>{selected.id}</h3>
          <div style={{fontSize:13,color:"#64748b",marginBottom:20}}>{selected.customerName} · {selected.tourName||selected.service}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
            {[["Giá bán",fmtMoney(selected.totalPrice),"#1e293b"],["Đã thu",fmtMoney(fin.totalPaid),"#16a34a"],["Còn nợ",fmtMoney(fin.debt),fin.debt>0?"#dc2626":"#16a34a"],["Chi phí NCC",fmtMoney(fin.totalChi),"#d97706"],["Lợi nhuận ước tính",fmtMoney(fin.profit),fin.profit>=0?"#7c3aed":"#dc2626"]].map(([k,v,c])=>(
              <div key={k} style={{background:"#f8fafc",borderRadius:10,padding:14}}>
                <div style={{fontSize:12,color:"#64748b"}}>{k}</div>
                <div style={{fontSize:16,fontWeight:800,color:c,marginTop:2}}>{v}</div>
              </div>
            ))}
          </div>
          {fin.debt>0&&<div style={{background:"#fef9c3",borderRadius:10,padding:12,marginBottom:16,fontSize:13,color:"#92400e"}}>⚠️ Khách còn nợ {fmtMoney(fin.debt)} — nên thu nốt trước khi đóng</div>}
          {!confirm
            ? <button onClick={()=>setConfirm(true)} style={{width:"100%",background:"#2563eb",color:"#fff",border:"none",borderRadius:10,padding:13,cursor:"pointer",fontWeight:700,fontSize:15}}>Quyết toán & Đóng đơn</button>
            : <div style={{background:"#fef2f2",borderRadius:10,padding:16}}>
                <div style={{fontWeight:700,marginBottom:12,color:"#dc2626"}}>Xác nhận đóng đơn {selected.id}?</div>
                <div style={{fontSize:13,color:"#64748b",marginBottom:16}}>Sau khi đóng sẽ không thể chỉnh sửa phiếu thu/chi. Hành động này không thể hoàn tác.</div>
                <div style={{display:"flex",gap:10}}>
                  <button onClick={doClose} style={{flex:1,background:"#dc2626",color:"#fff",border:"none",borderRadius:10,padding:12,cursor:"pointer",fontWeight:700}}>Đồng ý đóng</button>
                  <button onClick={()=>setConfirm(false)} style={{flex:1,background:"#f1f5f9",border:"none",borderRadius:10,padding:12,cursor:"pointer",fontWeight:600}}>Hủy</button>
                </div>
              </div>}
        </div>
      </div>
    );
  }

  return(
    <div style={{padding:24}}>
      <h2 style={{margin:"0 0 4px",fontSize:20,fontWeight:800}}>Quyết toán & Đóng đơn</h2>
      <div style={{fontSize:13,color:"#64748b",marginBottom:20}}>{closeable.length} đơn sẵn sàng đóng</div>
      <div style={{position:"relative",marginBottom:16}}>
        <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"#94a3b8"}}>🔍</span>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Tìm đơn hàng..." style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:10,padding:"10px 12px 10px 32px",fontSize:13,boxSizing:"border-box"}}/>
      </div>
      <div style={{display:"grid",gap:10}}>
        {filtered.length===0&&<div style={{textAlign:"center",color:"#94a3b8",padding:48}}>Không có đơn nào cần quyết toán</div>}
        {filtered.map(o=>{
          const fin=getFinancials(o);
          return(
            <div key={o.id} onClick={()=>setSelected(o)} style={{background:"#fff",borderRadius:12,padding:16,boxShadow:"0 1px 4px rgba(0,0,0,.07)",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",transition:"box-shadow .15s"}}
              onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,.1)"} onMouseLeave={e=>e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,.07)"}>
              <div>
                <div style={{fontWeight:700}}>{o.id} <span style={{fontSize:12,color:"#64748b",fontWeight:400}}>· {o.customerName}</span></div>
                <div style={{fontSize:12,color:"#64748b",marginTop:3}}>{o.tourName||o.service} · {o.departDate?new Date(o.departDate).toLocaleDateString("vi-VN"):"—"}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontWeight:700,fontSize:14}}>{fmtMoney(o.totalPrice)}</div>
                {fin.debt>0&&<div style={{fontSize:12,color:"#dc2626"}}>Nợ: {fmtMoney(fin.debt)}</div>}
                {fin.debt<=0&&<div style={{fontSize:12,color:"#16a34a"}}>✓ Đã thu đủ</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
function QuoteModule({ quotes, onUpdate, orders, tourPrograms, currentUser, pushNotif, onCreateOrder }){
  const BLANK_FORM={
    customerName:"",customerPhone:"",customerEmail:"",
    service:"tour",tourName:"",tourProgramId:"",
    departDate:"",returnDate:"",
    pax:{adults:1,children:0,babies:0},
    pricing:{adultPrice:0,childPrice:0,babyPrice:0,totalPrice:0},
    includes:"",excludes:"",cancelPolicy:"",
    validUntil:"",depositPct:30,paymentDeadline:"",
    note:"",sale:currentUser?.name||""
  };
  const [subView,setSubView]=React.useState("list");
  const [form,setForm]=React.useState(BLANK_FORM);
  const [reviseModal,setReviseModal]=React.useState(null);
  const [revisePrice,setRevisePrice]=React.useState("");
  const [reviseNote,setReviseNote]=React.useState("");

  const fmtMoney=(n)=>(n||0).toLocaleString("vi-VN")+"₫";
  const lbl={display:"block",fontSize:12,fontWeight:600,marginBottom:4,color:"#374151"};
  const inp={width:"100%",border:"1px solid #e2e8f0",borderRadius:8,padding:"9px 12px",fontSize:13,boxSizing:"border-box"};

  const calcTotal=(f)=>
    (f.pax.adults*(f.pricing.adultPrice||0))+
    (f.pax.children*(f.pricing.childPrice||0))+
    (f.pax.babies*(f.pricing.babyPrice||0));

  const setPax=(k,v)=>setForm(f=>({...f,pax:{...f.pax,[k]:Number(v)||0}}));
  const setPrice=(k,v)=>{
    setForm(f=>{
      const p={...f.pricing,[k]:Number(v)||0};
      p.totalPrice=(f.pax.adults*(k==="adultPrice"?Number(v)||0:p.adultPrice))+
                   (f.pax.children*(k==="childPrice"?Number(v)||0:p.childPrice))+
                   (f.pax.babies*(k==="babyPrice"?Number(v)||0:p.babyPrice));
      return {...f,pricing:p};
    });
  };

  // Auto-expire on mount
  React.useEffect(()=>{
    const today=new Date().toISOString().slice(0,10);
    const hasExpired=(quotes||[]).some(q=>q.validUntil&&q.validUntil<today&&["draft","sent","negotiating"].includes(q.status));
    if(hasExpired){
      onUpdate&&onUpdate((quotes||[]).map(q=>
        q.validUntil&&q.validUntil<today&&["draft","sent","negotiating"].includes(q.status)
          ?{...q,status:"expired"}:q
      ));
    }
  },[]);

  const daysLeft=(validUntil)=>{
    if(!validUntil) return null;
    return Math.ceil((new Date(validUntil)-new Date())/86400000);
  };

  const saveQuote=()=>{
    if(!form.customerName) return pushNotif&&pushNotif("Nhập tên khách","error");
    if(!form.tourName)     return pushNotif&&pushNotif("Nhập tên dịch vụ","error");
    if(!form.validUntil)   return pushNotif&&pushNotif("Nhập hạn hiệu lực báo giá","error");
    if(form.pricing.totalPrice<=0) return pushNotif&&pushNotif("Nhập giá dịch vụ","error");
    const newId="BG"+new Date().getFullYear()+"-"+String(Date.now()).slice(-4);
    const q={
      ...form,
      id:newId,version:1,status:"draft",
      depositAmount:Math.round(form.pricing.totalPrice*form.depositPct/100),
      versions:[],
      createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),
      createdBy:currentUser?.name,convertedOrderId:null
    };
    onUpdate&&onUpdate([q,...(quotes||[])]);
    pushNotif&&pushNotif("Đã tạo báo giá "+newId);
    setForm({...BLANK_FORM,sale:currentUser?.name||""});
    setSubView("list");
  };

  const sendQuote=(q)=>{
    onUpdate&&onUpdate((quotes||[]).map(x=>x.id===q.id?{...x,status:"sent",sentAt:new Date().toISOString(),updatedAt:new Date().toISOString()}:x));
    pushNotif&&pushNotif("Đã gửi báo giá "+q.id);
  };

  const reviseAndResend=()=>{
    const q=reviseModal;
    if(!revisePrice||Number(revisePrice)<=0) return pushNotif&&pushNotif("Nhập giá mới","error");
    const updated={
      ...q,
      version:q.version+1,
      pricing:{...q.pricing,totalPrice:Number(revisePrice)},
      depositAmount:Math.round(Number(revisePrice)*q.depositPct/100),
      status:"sent",
      sentAt:new Date().toISOString(),updatedAt:new Date().toISOString(),
      versions:[...(q.versions||[]),{version:q.version,totalPrice:q.pricing?.totalPrice||q.totalPrice,sentAt:q.sentAt,note:reviseNote||"Phiên bản "+q.version}],
    };
    onUpdate&&onUpdate((quotes||[]).map(x=>x.id===q.id?updated:x));
    pushNotif&&pushNotif("Đã gửi lại báo giá "+q.id+" v"+updated.version);
    setReviseModal(null);setRevisePrice("");setReviseNote("");
  };

  const convertToOrder=(q)=>{
    const totalPrc=q.pricing?.totalPrice||q.totalPrice||0;
    const orderData={
      customerId:q.customerId,
      customerName:q.customerName,customerPhone:q.customerPhone,customerEmail:q.customerEmail,
      service:q.service,tourName:q.tourName,tourProgramId:q.tourProgramId,
      departDate:q.departDate,returnDate:q.returnDate,
      paxAdults:q.pax?.adults||q.pax||1,paxChildren:q.pax?.children||0,paxBabies:q.pax?.babies||0,
      pax:(q.pax?.adults||1)+(q.pax?.children||0)+(q.pax?.babies||0),
      adultPrice:q.pricing?.adultPrice||0,childPrice:q.pricing?.childPrice||0,babyPrice:q.pricing?.babyPrice||0,
      totalPrice:totalPrc,
      depositAmount:q.depositAmount||Math.round(totalPrc*(q.depositPct||30)/100),
      paymentDeadline:q.paymentDeadline,
      includes:q.includes,excludes:q.excludes,cancelPolicy:q.cancelPolicy,
      note:q.note,
      source:"Báo giá "+q.id,quoteId:q.id,
      sale:q.sale||currentUser?.name,
      status:"pending_payment",totalPaid:0,
      additionalItems:[],paymentSchedule:[],
    };
    onCreateOrder&&onCreateOrder(orderData);
    onUpdate&&onUpdate((quotes||[]).map(x=>x.id===q.id?{...x,status:"converted",convertedOrderId:null,updatedAt:new Date().toISOString()}:x));
    pushNotif&&pushNotif("Đã tạo đơn hàng từ báo giá "+q.id,"success");
  };

  const STATUS={draft:{bg:"#f1f5f9",c:"#475569",label:"Nháp"},sent:{bg:"#dbeafe",c:"#1d4ed8",label:"Đã gửi"},negotiating:{bg:"#fef9c3",c:"#ca8a04",label:"Đang thương lượng"},converted:{bg:"#dcfce7",c:"#15803d",label:"Đã chốt"},expired:{bg:"#fee2e2",c:"#dc2626",label:"Hết hạn"},lost:{bg:"#fee2e2",c:"#9f1239",label:"Mất"}};
  const SERVICE_LABEL={tour:"Tour trọn gói",cruise:"Du thuyền",ve_may_bay:"Vé máy bay",hotel_flight:"Combo KS+Vé",hotel:"Khách sạn",ve:"Vé tham quan"};

  if(subView==="new") return(
    <div style={{padding:24,maxWidth:720,margin:"0 auto"}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24}}>
        <button onClick={()=>setSubView("list")} style={{background:"none",border:"none",cursor:"pointer",fontSize:20,color:"#64748b"}}>←</button>
        <h2 style={{margin:0,fontSize:20,fontWeight:800}}>Tạo báo giá mới</h2>
      </div>
      <div style={{background:"#fff",borderRadius:14,padding:24,boxShadow:"0 1px 6px rgba(0,0,0,.07)"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          {/* Thông tin khách */}
          <div><label style={lbl}>Tên khách *</label><input value={form.customerName} onChange={e=>setForm(f=>({...f,customerName:e.target.value}))} style={inp}/></div>
          <div><label style={lbl}>SĐT</label><input value={form.customerPhone} onChange={e=>setForm(f=>({...f,customerPhone:e.target.value}))} style={inp}/></div>
          <div><label style={lbl}>Email</label><input value={form.customerEmail} onChange={e=>setForm(f=>({...f,customerEmail:e.target.value}))} style={inp}/></div>

          {/* Loại dịch vụ */}
          <div><label style={lbl}>Loại dịch vụ *</label>
            <select value={form.service} onChange={e=>setForm(f=>({...f,service:e.target.value}))} style={inp}>
              <option value="tour">Tour trọn gói</option>
              <option value="cruise">Du thuyền</option>
              <option value="ve_may_bay">Vé máy bay</option>
              <option value="hotel_flight">Combo KS + Vé</option>
              <option value="hotel">Khách sạn</option>
              <option value="ve">Vé tham quan / Vui chơi</option>
            </select>
          </div>

          {/* Chọn tour program */}
          <div>
            <label style={lbl}>Chương trình có sẵn</label>
            <select value={form.tourProgramId} onChange={e=>{const t=(tourPrograms||[]).find(x=>x.id===e.target.value);setForm(f=>({...f,tourProgramId:e.target.value,tourName:t?t.name:f.tourName}));}} style={inp}>
              <option value="">-- Chọn hoặc nhập tay --</option>
              {(tourPrograms||[]).map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div><label style={lbl}>Tên dịch vụ / Tour *</label><input value={form.tourName} onChange={e=>setForm(f=>({...f,tourName:e.target.value}))} style={inp}/></div>

          {/* Ngày */}
          <div><label style={lbl}>Ngày khởi hành</label><input type="date" value={form.departDate} onChange={e=>setForm(f=>({...f,departDate:e.target.value}))} style={inp}/></div>
          <div><label style={lbl}>Ngày về</label><input type="date" value={form.returnDate} onChange={e=>setForm(f=>({...f,returnDate:e.target.value}))} style={inp}/></div>

          {/* Số khách */}
          <div><label style={lbl}>Người lớn</label><input type="number" min={0} value={form.pax.adults} onChange={e=>{setPax("adults",e.target.value);setForm(f=>{const p={...f.pricing};p.totalPrice=calcTotal({...f,pax:{...f.pax,adults:Number(e.target.value)||0}});return{...f,pax:{...f.pax,adults:Number(e.target.value)||0},pricing:p};})}} style={inp}/></div>
          <div><label style={lbl}>Trẻ em</label><input type="number" min={0} value={form.pax.children} onChange={e=>{setForm(f=>{const p={...f.pricing};const pax2={...f.pax,children:Number(e.target.value)||0};p.totalPrice=calcTotal({...f,pax:pax2});return{...f,pax:pax2,pricing:p};})}} style={inp}/></div>
          <div><label style={lbl}>Em bé</label><input type="number" min={0} value={form.pax.babies} onChange={e=>{setForm(f=>{const p={...f.pricing};const pax2={...f.pax,babies:Number(e.target.value)||0};p.totalPrice=calcTotal({...f,pax:pax2});return{...f,pax:pax2,pricing:p};})}} style={inp}/></div>
        </div>

        {/* Giá theo loại khách */}
        <div style={{marginTop:14,padding:"14px 16px",background:"#f8fafc",borderRadius:10,border:"1px solid #e2e8f0"}}>
          <div style={{fontSize:12,fontWeight:700,color:"#374151",marginBottom:10}}>Giá dịch vụ (₫/người)</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
            <div><label style={{...lbl,fontSize:11}}>Người lớn</label><NumberInput value={form.pricing.adultPrice||0} onChange={v=>setPrice("adultPrice",v)} placeholder="VD: 1.500.000" style={inp}/></div>
            <div><label style={{...lbl,fontSize:11}}>Trẻ em</label><NumberInput value={form.pricing.childPrice||0} onChange={v=>setPrice("childPrice",v)} placeholder="VD: 1.000.000" style={inp}/></div>
            <div><label style={{...lbl,fontSize:11}}>Em bé</label><NumberInput value={form.pricing.babyPrice||0} onChange={v=>setPrice("babyPrice",v)} placeholder="VD: 300.000" style={inp}/></div>
          </div>
          <div style={{marginTop:10,padding:"10px 14px",background:"#eff6ff",borderRadius:8,fontSize:13}}>
            Tổng báo giá: <strong>{form.pricing.totalPrice.toLocaleString("vi-VN")} ₫</strong>
            &nbsp;·&nbsp; Cọc {form.depositPct}%: <strong>{Math.round(form.pricing.totalPrice*form.depositPct/100).toLocaleString("vi-VN")} ₫</strong>
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginTop:14}}>
          {/* Điều kiện */}
          <div style={{gridColumn:"1/-1"}}><label style={lbl}>Bao gồm dịch vụ</label><textarea rows={2} value={form.includes} onChange={e=>setForm(f=>({...f,includes:e.target.value}))} placeholder="Ăn sáng, xe đưa đón, HDV, bảo hiểm..." style={{...inp,resize:"vertical"}}/></div>
          <div style={{gridColumn:"1/-1"}}><label style={lbl}>Không bao gồm</label><textarea rows={2} value={form.excludes} onChange={e=>setForm(f=>({...f,excludes:e.target.value}))} placeholder="Vé máy bay, visa, chi phí cá nhân..." style={{...inp,resize:"vertical"}}/></div>

          {/* Thời hạn & cọc */}
          <div>
            <label style={lbl}>Hiệu lực đến ngày * <span style={{color:"#dc2626"}}>(bắt buộc)</span></label>
            <input type="date" value={form.validUntil} onChange={e=>setForm(f=>({...f,validUntil:e.target.value}))} min={new Date().toISOString().slice(0,10)} style={inp}/>
          </div>
          <div>
            <label style={lbl}>% Đặt cọc</label>
            <input type="number" min={0} max={100} value={form.depositPct} onChange={e=>setForm(f=>({...f,depositPct:Number(e.target.value)||0}))} style={inp}/>
          </div>
          <div>
            <label style={lbl}>Hạn thanh toán còn lại</label>
            <input type="date" value={form.paymentDeadline} onChange={e=>setForm(f=>({...f,paymentDeadline:e.target.value}))} style={inp}/>
          </div>

          {/* Ghi chú */}
          <div style={{gridColumn:"1/-1"}}><label style={lbl}>Ghi chú</label><textarea value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))} rows={2} style={{...inp,resize:"vertical"}}/></div>
        </div>

        <div style={{display:"flex",gap:10,marginTop:18}}>
          <button onClick={saveQuote} style={{flex:2,background:"#2563eb",color:"#fff",border:"none",borderRadius:10,padding:12,cursor:"pointer",fontWeight:700,fontSize:14}}>Tạo báo giá</button>
          <button onClick={()=>setSubView("list")} style={{flex:1,background:"#f1f5f9",border:"none",borderRadius:10,padding:12,cursor:"pointer",fontWeight:600}}>Hủy</button>
        </div>
      </div>
    </div>
  );

  return(
    <div style={{padding:24}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div>
          <h2 style={{margin:0,fontSize:20,fontWeight:800}}>Báo giá</h2>
          <div style={{fontSize:13,color:"#64748b",marginTop:2}}>{(quotes||[]).length} báo giá · {(quotes||[]).filter(q=>q.status==="sent").length} đang chờ phản hồi</div>
        </div>
        <button onClick={()=>setSubView("new")} style={{background:"#2563eb",color:"#fff",border:"none",borderRadius:9,padding:"9px 20px",cursor:"pointer",fontWeight:700,fontSize:14}}>+ Tạo báo giá</button>
      </div>
      <div style={{background:"#fff",borderRadius:14,boxShadow:"0 1px 6px rgba(0,0,0,.07)",overflow:"hidden"}}>
        {(!quotes||quotes.length===0)&&<div style={{textAlign:"center",color:"#94a3b8",padding:48}}>Chưa có báo giá nào</div>}
        {(quotes||[]).map(q=>{
          const sc=STATUS[q.status]||STATUS.draft;
          const totalPrc=q.pricing?.totalPrice||q.totalPrice||0;
          const days=daysLeft(q.validUntil);
          return(
            <div key={q.id} style={{padding:"14px 16px",borderBottom:"1px solid #f8fafc"}}>
              <div style={{display:"flex",alignItems:"flex-start",gap:12}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:14}}>{q.id} — {q.customerName}</div>
                  <div style={{fontSize:12,color:"#64748b",marginTop:2}}>
                    {SERVICE_LABEL[q.service]||q.service||"Tour"} · {q.tourName}
                    {q.pax?.adults!=null?` · ${q.pax.adults}NL${q.pax.children?"+"+q.pax.children+"TE":""}`:q.pax?` · ${q.pax} khách`:""}
                    {q.departDate?" · "+new Date(q.departDate).toLocaleDateString("vi-VN"):""}
                  </div>
                  {q.versions?.length>0&&<div style={{fontSize:11,color:"#94a3b8",marginTop:2}}>v{q.version} · {q.versions.length} lần sửa giá</div>}
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{fontWeight:700,color:"#2563eb",fontSize:14}}>{fmtMoney(totalPrc)}</div>
                  <span style={{fontSize:11,background:sc.bg,color:sc.c,borderRadius:20,padding:"2px 8px",fontWeight:600}}>{sc.label}</span>
                  {days!==null&&q.status!=="converted"&&q.status!=="expired"&&q.status!=="lost"&&(
                    <div style={{fontSize:11,fontWeight:600,marginTop:3,color:days<=1?"#dc2626":days<=3?"#d97706":"#16a34a"}}>
                      {days<=0?"Hết hạn hôm nay":"Còn "+days+" ngày"}
                    </div>
                  )}
                </div>
              </div>
              <div style={{display:"flex",gap:6,marginTop:10}}>
                {q.status==="draft"&&<button onClick={()=>sendQuote(q)} style={{background:"#2563eb",color:"#fff",border:"none",borderRadius:7,padding:"6px 12px",cursor:"pointer",fontSize:12,fontWeight:600}}>Gửi KH</button>}
                {(q.status==="draft"||q.status==="sent"||q.status==="negotiating")&&<button onClick={()=>convertToOrder(q)} style={{background:"#16a34a",color:"#fff",border:"none",borderRadius:7,padding:"6px 12px",cursor:"pointer",fontSize:12,fontWeight:600}}>Chốt đơn</button>}
                {(q.status==="sent"||q.status==="negotiating")&&<button onClick={()=>{setReviseModal(q);setRevisePrice(String(totalPrc));}} style={{background:"#d97706",color:"#fff",border:"none",borderRadius:7,padding:"6px 12px",cursor:"pointer",fontSize:12,fontWeight:600}}>Sửa giá & Gửi lại</button>}
                {(q.status==="draft"||q.status==="sent"||q.status==="negotiating")&&<button onClick={()=>onUpdate&&onUpdate((quotes||[]).map(x=>x.id===q.id?{...x,status:"lost",updatedAt:new Date().toISOString()}:x))} style={{background:"none",color:"#9f1239",border:"1px solid #fecdd3",borderRadius:7,padding:"6px 12px",cursor:"pointer",fontSize:12,fontWeight:600}}>Mất đơn</button>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal sửa giá & gửi lại */}
      {reviseModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.4)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9000}} onClick={e=>{if(e.target===e.currentTarget){setReviseModal(null);}}}>
          <div style={{background:"#fff",borderRadius:14,padding:24,width:400,boxShadow:"0 8px 32px rgba(0,0,0,.15)"}}>
            <div style={{fontWeight:800,fontSize:16,marginBottom:16}}>Sửa giá & Gửi lại — {reviseModal.id}</div>
            <div style={{marginBottom:12}}>
              <label style={lbl}>Giá mới (₫)</label>
              <input type="number" value={revisePrice} onChange={e=>setRevisePrice(e.target.value)} style={inp} autoFocus/>
            </div>
            <div style={{marginBottom:16}}>
              <label style={lbl}>Ghi chú lý do sửa giá</label>
              <input value={reviseNote} onChange={e=>setReviseNote(e.target.value)} placeholder="VD: Giảm 5% theo yêu cầu KH" style={inp}/>
            </div>
            {reviseModal.versions?.length>0&&(
              <div style={{background:"#f8fafc",borderRadius:8,padding:10,marginBottom:14,fontSize:12}}>
                <div style={{fontWeight:600,color:"#374151",marginBottom:6}}>Lịch sử giá:</div>
                {reviseModal.versions.map((v,i)=><div key={i} style={{color:"#64748b",marginBottom:2}}>v{v.version}: {(v.totalPrice||0).toLocaleString("vi-VN")}₫ — {v.note}</div>)}
              </div>
            )}
            <div style={{display:"flex",gap:8}}>
              <button onClick={reviseAndResend} style={{flex:1,background:"#d97706",color:"#fff",border:"none",borderRadius:8,padding:"10px",cursor:"pointer",fontWeight:700}}>Gửi lại</button>
              <button onClick={()=>setReviseModal(null)} style={{flex:1,background:"#f1f5f9",border:"none",borderRadius:8,padding:"10px",cursor:"pointer",fontWeight:600}}>Hủy</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TourProgramForm({ initial, onSave, onCancel, pushNotif, tourPrograms }){
  const [form,setForm]=React.useState(initial||{name:"",route:"",days:2,nights:1,type:"standard",targetGroup:"",organizer:"Minh Việt Travel",highlights:"",includes:"",excludes:"",note:""});
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const save=()=>{
    if(!form.name.trim()) return pushNotif&&pushNotif("Nhập tên chương trình","error");
    const prog={...form,id:initial?.id||"TP-"+Date.now(),days:Number(form.days)||2,nights:Number(form.nights)||1};
    onSave(prog);
  };
  return(
    <div style={{background:"#fff",borderRadius:14,padding:24,boxShadow:"0 1px 6px rgba(0,0,0,.07)"}}>
      <h3 style={{margin:"0 0 20px",fontSize:16,fontWeight:800}}>{initial?"Sửa chương trình":"Thêm chương trình mới"}</h3>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        {[["Tên chương trình *","name"],["Lộ trình","route"],["Nhóm đối tượng","targetGroup"],["Đơn vị tổ chức","organizer"]].map(([label,key])=>(
          <div key={key}>
            <label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:4,color:"#374151"}}>{label}</label>
            <input value={form[key]||""} onChange={e=>set(key,e.target.value)} style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:8,padding:"9px 12px",fontSize:13,boxSizing:"border-box"}}/>
          </div>
        ))}
        <div>
          <label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:4,color:"#374151"}}>Số ngày</label>
          <input type="number" min={1} value={form.days} onChange={e=>set("days",e.target.value)} style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:8,padding:"9px 12px",fontSize:13,boxSizing:"border-box"}}/>
        </div>
        <div>
          <label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:4,color:"#374151"}}>Số đêm</label>
          <input type="number" min={0} value={form.nights} onChange={e=>set("nights",e.target.value)} style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:8,padding:"9px 12px",fontSize:13,boxSizing:"border-box"}}/>
        </div>
        <div>
          <label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:4,color:"#374151"}}>Loại tour</label>
          <select value={form.type} onChange={e=>set("type",e.target.value)} style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:8,padding:"9px 12px",fontSize:13}}>
            {["standard","mice_teambuilding","incentive","luxury","family","ghep"].map(t=><option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>
      {[["Điểm nổi bật","highlights"],["Bao gồm","includes"],["Không bao gồm","excludes"],["Ghi chú","note"]].map(([label,key])=>(
        <div key={key} style={{marginTop:12}}>
          <label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:4,color:"#374151"}}>{label}</label>
          <textarea value={form[key]||""} onChange={e=>set(key,e.target.value)} rows={2} style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:8,padding:"9px 12px",fontSize:13,boxSizing:"border-box",resize:"vertical"}}/>
        </div>
      ))}
      <div style={{display:"flex",gap:10,marginTop:18}}>
        <button onClick={save} style={{flex:2,background:"#2563eb",color:"#fff",border:"none",borderRadius:10,padding:12,cursor:"pointer",fontWeight:700}}>Lưu</button>
        <button onClick={onCancel} style={{flex:1,background:"#f1f5f9",border:"none",borderRadius:10,padding:12,cursor:"pointer",fontWeight:600}}>Hủy</button>
      </div>
    </div>
  );
}

function TourProgramModule({ tourPrograms, onUpdate, currentRole, pushNotif, currentUser }){
  const [search,setSearch]=React.useState("");
  const [showForm,setShowForm]=React.useState(false);
  const [editProg,setEditProg]=React.useState(null);
  const [detail,setDetail]=React.useState(null);

  const canEdit=currentRole==="manager"||currentRole==="dieu_hanh";
  const filtered=(tourPrograms||[]).filter(t=>{
    const q=search.toLowerCase();
    return !q||t.name?.toLowerCase().includes(q)||t.route?.toLowerCase().includes(q);
  });

  const saveProg=(prog)=>{
    if(editProg) onUpdate((tourPrograms||[]).map(t=>t.id===prog.id?prog:t));
    else onUpdate([prog,...(tourPrograms||[])]);
    pushNotif&&pushNotif(editProg?"Đã cập nhật chương trình":"Đã thêm chương trình");
    setShowForm(false); setEditProg(null);
  };

  const deleteProg=(id)=>{
    if(!window.confirm("Xóa chương trình này?")) return;
    onUpdate((tourPrograms||[]).filter(t=>t.id!==id));
    pushNotif&&pushNotif("Đã xóa");
  };

  if(detail) return(
    <div style={{padding:24,maxWidth:800,margin:"0 auto"}}>
      <button onClick={()=>setDetail(null)} style={{background:"none",border:"none",color:"#2563eb",cursor:"pointer",fontSize:14,marginBottom:16}}>← Danh sách</button>
      <div style={{background:"#fff",borderRadius:16,padding:24,boxShadow:"0 2px 12px rgba(0,0,0,.08)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:"#7c3aed",letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>{detail.type}</div>
            <h2 style={{margin:0,fontSize:18,fontWeight:800}}>{detail.name}</h2>
            <div style={{fontSize:13,color:"#64748b",marginTop:4}}>📍 {detail.route} · {detail.days}N{detail.nights}Đ · {detail.targetGroup}</div>
          </div>
          {canEdit&&<button onClick={()=>{setEditProg(detail);setShowForm(true);setDetail(null);}} style={{background:"#f1f5f9",border:"none",borderRadius:8,padding:"7px 14px",cursor:"pointer",fontSize:13,fontWeight:600}}>✏️ Sửa</button>}
        </div>
        {[["✨ Điểm nổi bật",detail.highlights],["✅ Bao gồm",detail.includes],["❌ Không bao gồm",detail.excludes],["📝 Ghi chú",detail.note]].map(([label,content])=>content&&(
          <div key={label} style={{marginBottom:16}}>
            <div style={{fontWeight:700,fontSize:13,marginBottom:6,color:"#374151"}}>{label}</div>
            <div style={{fontSize:13,color:"#475569",lineHeight:1.7,whiteSpace:"pre-wrap"}}>{content}</div>
          </div>
        ))}
      </div>
    </div>
  );

  return(
    <div style={{padding:24}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div>
          <h2 style={{margin:0,fontSize:20,fontWeight:800}}>Chương trình Tour</h2>
          <div style={{fontSize:13,color:"#64748b",marginTop:2}}>{(tourPrograms||[]).length} chương trình</div>
        </div>
        {canEdit&&!showForm&&<button onClick={()=>{setEditProg(null);setShowForm(true);}} style={{background:"#2563eb",color:"#fff",border:"none",borderRadius:9,padding:"9px 20px",cursor:"pointer",fontWeight:700,fontSize:14}}>+ Thêm chương trình</button>}
      </div>
      {showForm&&<div style={{marginBottom:20}}><TourProgramForm initial={editProg} onSave={saveProg} onCancel={()=>{setShowForm(false);setEditProg(null);}} pushNotif={pushNotif} tourPrograms={tourPrograms}/></div>}
      <div style={{position:"relative",marginBottom:16}}>
        <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"#94a3b8"}}>🔍</span>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Tìm tên chương trình, lộ trình..." style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:10,padding:"10px 12px 10px 32px",fontSize:13,boxSizing:"border-box"}}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:14}}>
        {filtered.length===0&&<div style={{textAlign:"center",color:"#94a3b8",padding:48,gridColumn:"1/-1"}}>Chưa có chương trình nào</div>}
        {filtered.map(t=>(
          <div key={t.id} style={{background:"#fff",borderRadius:14,padding:18,boxShadow:"0 1px 6px rgba(0,0,0,.07)",cursor:"pointer",transition:"box-shadow .15s"}}
            onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,.1)"} onMouseLeave={e=>e.currentTarget.style.boxShadow="0 1px 6px rgba(0,0,0,.07)"}
            onClick={()=>setDetail(t)}>
            <div style={{fontSize:11,fontWeight:700,color:"#7c3aed",letterSpacing:1,textTransform:"uppercase",marginBottom:6}}>{t.type}</div>
            <div style={{fontWeight:800,fontSize:15,marginBottom:4,color:"#1e293b"}}>{t.name}</div>
            <div style={{fontSize:12,color:"#64748b"}}>📍 {t.route||"—"}</div>
            <div style={{fontSize:12,color:"#64748b",marginTop:2}}>🕐 {t.days}N{t.nights}Đ · {t.targetGroup||"Tất cả"}</div>
            {canEdit&&<div style={{display:"flex",gap:6,marginTop:12}} onClick={e=>e.stopPropagation()}>
              <button onClick={()=>{setEditProg(t);setShowForm(true);}} style={{background:"#eff6ff",color:"#2563eb",border:"none",borderRadius:7,padding:"5px 12px",cursor:"pointer",fontSize:12,fontWeight:600}}>Sửa</button>
              <button onClick={()=>deleteProg(t.id)} style={{background:"#fef2f2",color:"#dc2626",border:"none",borderRadius:7,padding:"5px 12px",cursor:"pointer",fontSize:12,fontWeight:600}}>Xóa</button>
            </div>}
          </div>
        ))}
      </div>
    </div>
  );
}
// ═══════════════════════════════════════════════════════════


function BankAccountModule({ bankAccounts, onUpdate, pushNotif }){
  const [showForm,setShowForm]=React.useState(false);
  const [editAcc,setEditAcc]=React.useState(null);
  const [form,setForm]=React.useState({bankName:"",accountNumber:"",accountName:"",branch:"",balance:"",note:""});
  const save=()=>{
    if(!form.bankName||!form.accountNumber) return pushNotif&&pushNotif("Nhập tên ngân hàng và số tài khoản","error");
    const payload={...form,balance:form.balance!==""?Number(form.balance):undefined};
    if(editAcc){
      onUpdate((bankAccounts||[]).map(a=>a.id===editAcc.id?{...a,...payload}:a));
      pushNotif&&pushNotif("Đã cập nhật tài khoản");
    } else {
      onUpdate([...(bankAccounts||[]),{...payload,id:"BA"+Date.now(),active:true}]);
      pushNotif&&pushNotif("Đã thêm tài khoản ngân hàng");
    }
    setShowForm(false); setEditAcc(null); setForm({bankName:"",accountNumber:"",accountName:"",branch:"",balance:"",note:""});
  };
  return(
    <div style={{padding:24}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <h2 style={{margin:0,fontSize:20,fontWeight:800}}>Tài khoản ngân hàng ({(bankAccounts||[]).length})</h2>
        <button onClick={()=>{setEditAcc(null);setForm({bankName:"",accountNumber:"",accountName:"",branch:"",note:""});setShowForm(true);}} style={{background:"#2563eb",color:"#fff",border:"none",borderRadius:9,padding:"9px 18px",cursor:"pointer",fontWeight:700,fontSize:14}}>+ Thêm TK</button>
      </div>
      {showForm&&(
        <div style={{background:"#fff",borderRadius:14,padding:20,marginBottom:20,boxShadow:"0 1px 6px rgba(0,0,0,.07)"}}>
          <h3 style={{margin:"0 0 16px",fontSize:15}}>{editAcc?"Sửa tài khoản":"Thêm tài khoản"}</h3>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            {[["Ngân hàng *","bankName"],["Số tài khoản *","accountNumber"],["Tên tài khoản","accountName"],["Chi nhánh","branch"]].map(([label,key])=>(
              <div key={key}>
                <label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:4,color:"#374151"}}>{label}</label>
                <input value={form[key]||""} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))} style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:8,padding:"9px 12px",fontSize:13,boxSizing:"border-box"}}/>
              </div>
            ))}
            <div>
              <label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:4,color:"#374151"}}>Số dư hiện tại (₫)</label>
              <input type="number" value={form.balance} onChange={e=>setForm(f=>({...f,balance:e.target.value}))} placeholder="Để trống nếu chưa biết" style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:8,padding:"9px 12px",fontSize:13,boxSizing:"border-box"}}/>
            </div>
          </div>
          <div style={{marginTop:12}}>
            <label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:4,color:"#374151"}}>Ghi chú</label>
            <input value={form.note||""} onChange={e=>setForm(f=>({...f,note:e.target.value}))} style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:8,padding:"9px 12px",fontSize:13,boxSizing:"border-box"}}/>
          </div>
          <div style={{display:"flex",gap:8,marginTop:14}}>
            <button onClick={save} style={{background:"#16a34a",color:"#fff",border:"none",borderRadius:8,padding:"9px 20px",cursor:"pointer",fontWeight:700}}>Lưu</button>
            <button onClick={()=>setShowForm(false)} style={{background:"#6b7280",color:"#fff",border:"none",borderRadius:8,padding:"9px 20px",cursor:"pointer",fontWeight:600}}>Hủy</button>
          </div>
        </div>
      )}
      <div style={{display:"grid",gap:10}}>
        {(bankAccounts||[]).length===0&&<div style={{textAlign:"center",color:"#94a3b8",padding:48}}>Chưa có tài khoản nào</div>}
        {(bankAccounts||[]).map(a=>(
          <div key={a.id} style={{background:"#fff",borderRadius:12,padding:18,boxShadow:"0 1px 4px rgba(0,0,0,.07)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontWeight:800,fontSize:16,color:"#1e293b"}}>{a.shortName||a.bankName}</div>
              <div style={{fontFamily:"monospace",fontSize:15,fontWeight:700,color:"#2563eb",marginTop:4,letterSpacing:2}}>{a.accountNumber||a.accountNo}</div>
              <div style={{fontSize:12,color:"#64748b",marginTop:2}}>{a.accountName} {a.branch?"· "+a.branch:""}</div>
              {a.note&&<div style={{fontSize:12,color:"#94a3b8",marginTop:2}}>{a.note}</div>}
            </div>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              {a.balance!=null&&<div style={{textAlign:"right"}}><div style={{fontSize:11,color:"#94a3b8"}}>Số dư</div><div style={{fontWeight:800,fontSize:15,color:"#15803d"}}>{(a.balance||0).toLocaleString("vi-VN")}₫</div></div>}
              <button onClick={()=>{setEditAcc(a);setForm({bankName:a.bankName||"",accountNumber:a.accountNumber||a.accountNo||"",accountName:a.accountName||"",branch:a.branch||"",balance:a.balance!=null?String(a.balance):"",note:a.note||""});setShowForm(true);}} style={{background:"#f1f5f9",border:"none",borderRadius:8,padding:"7px 14px",cursor:"pointer",fontSize:13,fontWeight:600}}>Sửa</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
function AccountingDashboard({orders=[],vouchers=[],expenses=[],refunds=[],bankAccounts=[],onUpdateBankAccounts,
  outputInvoices=[],onUpdateOutputInvoices,inputInvoices=[],onUpdateInputInvoices,suppliers=[],pushNotif}){
  const [tab,setTab]=React.useState("overview");
  const [period,setPeriod]=React.useState("month");
  const [invTab,setInvTab]=React.useState("output");
  const [showForm,setShowForm]=React.useState(false);
  const [form,setForm]=React.useState({orderId:"",invoiceNo:"",taxCode:"",companyName:"",amount:"",vatRate:10,date:new Date().toISOString().slice(0,10)});

  const now=new Date();
  const fmtMoney=(n)=>(Math.round(n||0)).toLocaleString("vi-VN")+"₫";
  const fmtM=(n)=>{const a=Math.abs(n||0),s=(n||0)<0?"-":"";if(a>=1e9)return s+(a/1e9).toFixed(1)+" tỷ";return s+Math.round(a).toLocaleString("vi-VN")+"₫";};
  const fmtDate=d=>d?new Date(d).toLocaleDateString("vi-VN"):"—";
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));

  const inPeriod=(d)=>{
    if(!d) return false; const x=new Date(d);
    if(period==="all") return true;
    if(period==="month") return x.getMonth()===now.getMonth()&&x.getFullYear()===now.getFullYear();
    if(period==="quarter"){const q=Math.floor(now.getMonth()/3);return Math.floor(x.getMonth()/3)===q&&x.getFullYear()===now.getFullYear();}
    if(period==="year") return x.getFullYear()===now.getFullYear();
    return true;
  };

  // ── Số liệu tài chính ──
  const apprThu=(vouchers||[]).filter(v=>v.type==="thu"&&["approved","confirmed"].includes(v.status));
  const apprChi=(vouchers||[]).filter(v=>v.type==="chi"&&["approved","confirmed"].includes(v.status));
  const paidExp=(expenses||[]).filter(e=>e.status==="paid");
  const thuKy=apprThu.filter(v=>inPeriod(v.date||v.createdAt)).reduce((s,v)=>s+(v.amount||0),0);
  const chiKy=apprChi.filter(v=>inPeriod(v.date||v.createdAt)).reduce((s,v)=>s+(v.amount||0),0)+paidExp.filter(e=>inPeriod(e.createdAt)).reduce((s,e)=>s+(e.amount||0),0);
  const tonQuy=apprThu.reduce((s,v)=>s+(v.amount||0),0)-apprChi.reduce((s,v)=>s+(v.amount||0),0)-paidExp.reduce((s,e)=>s+(e.amount||0),0);
  const doanhThu=orders.filter(o=>o.status==="closed"&&inPeriod(o.closedAt||o.departDate)).reduce((s,o)=>s+(o.totalPrice||0),0);

  // Công nợ phải thu (đơn chưa đóng còn nợ)
  const phaiThu=orders.filter(o=>!["closed","cancelled"].includes(o.status)).map(o=>({...o,debt:Math.max(0,(o.totalPrice||0)-(o.totalPaid||0))})).filter(o=>o.debt>0).sort((a,b)=>new Date(a.departDate||0)-new Date(b.departDate||0));
  const totalPhaiThu=phaiThu.reduce((s,o)=>s+o.debt,0);
  // Công nợ phải trả (NCC cong_no + phiếu chi/expense chờ)
  const pendingChi=(vouchers||[]).filter(v=>v.type==="chi"&&v.status==="pending");
  const pendingExp=(expenses||[]).filter(e=>["pending_kt","pending_gd","pending_pay"].includes(e.status));
  const nccDebt=(suppliers||[]).filter(s=>(s.cong_no||0)>0);
  const totalPhaiTra=pendingChi.reduce((s,v)=>s+(v.amount||0),0)+pendingExp.reduce((s,e)=>s+(e.amount||0),0)+nccDebt.reduce((s,n)=>s+(n.cong_no||0),0);

  // VAT
  const outVat=outputInvoices.filter(i=>inPeriod(i.date)).reduce((s,i)=>s+(i.vatAmount||0),0);
  const inVat=inputInvoices.filter(i=>inPeriod(i.date)).reduce((s,i)=>s+(i.vatAmount||0),0);
  const vatPhaiNop=outVat-inVat;

  // Sổ thu chi — gộp thu+chi theo thời gian, tính số dư lũy kế
  const cashbook=React.useMemo(()=>{
    const rows=[
      ...apprThu.map(v=>({date:v.date||v.createdAt,type:"thu",desc:v.note||(v.customerName?("Thu "+v.customerName):"Phiếu thu"),ref:v.id,amount:v.amount||0})),
      ...apprChi.map(v=>({date:v.date||v.createdAt,type:"chi",desc:v.note||(v.ncc?("Chi "+v.ncc):"Phiếu chi"),ref:v.id,amount:v.amount||0})),
      ...paidExp.map(e=>({date:e.createdAt,type:"chi",desc:e.note||(e.ncc?("Chi NCC "+e.ncc):"Chi phí"),ref:e.id,amount:e.amount||0})),
    ].filter(r=>inPeriod(r.date)).sort((a,b)=>new Date(a.date||0)-new Date(b.date||0));
    let bal=0;
    return rows.map(r=>{bal+=r.type==="thu"?r.amount:-r.amount;return{...r,balance:bal};});
  },[vouchers,expenses,period]);

  const saveInv=()=>{
    if(!form.invoiceNo||!form.amount) return pushNotif&&pushNotif("Nhập số hóa đơn và số tiền","error");
    const inv={...form,id:(invTab==="output"?"HD":"HDV")+Date.now(),amount:Number(form.amount),vatAmount:Math.round(Number(form.amount)*Number(form.vatRate)/100),createdAt:new Date().toISOString()};
    if(invTab==="output") onUpdateOutputInvoices([inv,...outputInvoices]);
    else onUpdateInputInvoices([inv,...inputInvoices]);
    pushNotif&&pushNotif("Đã ghi nhận hóa đơn "+form.invoiceNo);
    setShowForm(false); setForm({orderId:"",invoiceNo:"",taxCode:"",companyName:"",amount:"",vatRate:10,date:new Date().toISOString().slice(0,10)});
  };
  const invList=invTab==="output"?outputInvoices:inputInvoices;

  const card={background:"#fff",borderRadius:14,padding:18,boxShadow:"0 2px 10px rgba(0,0,0,.07)"};
  const TABS=[
    {k:"overview",label:"Tổng quan",icon:"ti-chart-pie"},
    {k:"cashbook",label:"Sổ thu chi",icon:"ti-book"},
    {k:"receivable",label:"Phải thu",icon:"ti-arrow-down-circle"},
    {k:"payable",label:"Phải trả",icon:"ti-arrow-up-circle"},
    {k:"vat",label:"Hóa đơn VAT",icon:"ti-receipt-tax"},
    {k:"bank",label:"Quỹ & NH",icon:"ti-building-bank"},
  ];

  return(
    <div style={{padding:24,background:"#f1f5f9",minHeight:"100vh"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18,flexWrap:"wrap",gap:12}}>
        <h2 style={{margin:0,fontSize:22,fontWeight:800,color:"#0f172a",display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:40,height:40,borderRadius:12,background:"linear-gradient(135deg,#0891b2,#0e7490)",display:"flex",alignItems:"center",justifyContent:"center"}}><i className="ti ti-calculator" style={{fontSize:22,color:"#fff"}}/></div>
          Kế toán
        </h2>
        <div style={{display:"flex",gap:6}}>
          {[["month","Tháng"],["quarter","Quý"],["year","Năm"],["all","Tất cả"]].map(([k,l])=>(
            <button key={k} onClick={()=>setPeriod(k)} style={{padding:"7px 14px",borderRadius:9,border:"none",cursor:"pointer",fontWeight:600,fontSize:13,background:period===k?"#0891b2":"#fff",color:period===k?"#fff":"#64748b",boxShadow:period===k?"0 2px 8px rgba(8,145,178,.3)":"0 1px 4px rgba(0,0,0,.06)"}}>{l}</button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:4,background:"#fff",borderRadius:14,padding:6,marginBottom:18,boxShadow:"0 1px 6px rgba(0,0,0,.07)",flexWrap:"wrap"}}>
        {TABS.map(t=>(
          <button key={t.k} onClick={()=>setTab(t.k)} style={{padding:"9px 16px",border:"none",borderRadius:10,cursor:"pointer",fontWeight:600,fontSize:13,display:"flex",alignItems:"center",gap:6,background:tab===t.k?"linear-gradient(135deg,#0891b2,#0e7490)":"transparent",color:tab===t.k?"#fff":"#64748b"}}>
            <i className={`ti ${t.icon}`} style={{fontSize:16}}/>{t.label}
          </button>
        ))}
      </div>

      {/* ── TỔNG QUAN ── */}
      {tab==="overview"&&(<>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:14}}>
          {[
            {label:"Tổng thu kỳ này",val:fmtM(thuKy),bg:"linear-gradient(135deg,#059669,#047857)",icon:"ti-arrow-down-circle"},
            {label:"Tổng chi kỳ này",val:fmtM(chiKy),bg:"linear-gradient(135deg,#dc2626,#b91c1c)",icon:"ti-arrow-up-circle"},
            {label:"Tồn quỹ (Thu−Chi)",val:fmtM(tonQuy),bg:tonQuy>=0?"linear-gradient(135deg,#2563eb,#1d4ed8)":"linear-gradient(135deg,#dc2626,#b91c1c)",icon:"ti-wallet"},
          ].map(k=>(
            <div key={k.label} style={{background:k.bg,borderRadius:14,padding:"18px 20px",boxShadow:"0 4px 14px rgba(0,0,0,.13)",position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",right:14,top:12,fontSize:30,opacity:.2}}><i className={`ti ${k.icon}`}/></div>
              <div style={{fontSize:12,color:"rgba(255,255,255,.75)",fontWeight:600,marginBottom:6}}>{k.label}</div>
              <div style={{fontSize:24,fontWeight:800,color:"#fff"}}>{k.val}</div>
            </div>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:16}}>
          {[
            {label:"Doanh thu (đơn đóng)",val:fmtM(doanhThu),color:"#2563eb",onClick:null},
            {label:"Công nợ phải thu",val:fmtM(totalPhaiThu),color:"#d97706",onClick:()=>setTab("receivable"),sub:`${phaiThu.length} đơn`},
            {label:"Công nợ phải trả",val:fmtM(totalPhaiTra),color:"#dc2626",onClick:()=>setTab("payable"),sub:`${pendingChi.length+pendingExp.length+nccDebt.length} khoản`},
            {label:"VAT phải nộp",val:fmtM(vatPhaiNop),color:vatPhaiNop>=0?"#7c3aed":"#059669",onClick:()=>setTab("vat")},
          ].map(k=>(
            <div key={k.label} onClick={k.onClick} style={{...card,padding:"14px 16px",cursor:k.onClick?"pointer":"default"}}>
              <div style={{fontSize:12,color:"#64748b",fontWeight:600}}>{k.label}</div>
              <div style={{fontSize:18,fontWeight:800,color:k.color,marginTop:4}}>{k.val}</div>
              {k.sub&&<div style={{fontSize:11,color:"#94a3b8",marginTop:2}}>{k.sub}</div>}
            </div>
          ))}
        </div>
        <div style={card}>
          <div style={{fontWeight:700,fontSize:15,marginBottom:12,color:"#0f172a"}}>Cân đối nhanh</div>
          {[
            ["Doanh thu ghi nhận",doanhThu,"#2563eb"],
            ["Đã thực thu",apprThu.reduce((s,v)=>s+(v.amount||0),0),"#059669"],
            ["Đã thực chi",apprChi.reduce((s,v)=>s+(v.amount||0),0)+paidExp.reduce((s,e)=>s+(e.amount||0),0),"#dc2626"],
            ["Lợi nhuận gộp ước tính",doanhThu-(apprChi.reduce((s,v)=>s+(v.amount||0),0)+paidExp.reduce((s,e)=>s+(e.amount||0),0)),"#7c3aed"],
          ].map(([l,v,c])=>(
            <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid #f8fafc"}}>
              <span style={{fontSize:13,color:"#374151"}}>{l}</span>
              <span style={{fontSize:15,fontWeight:700,color:c}}>{fmtMoney(v)}</span>
            </div>
          ))}
        </div>
      </>)}

      {/* ── SỔ THU CHI ── */}
      {tab==="cashbook"&&(
        <div style={card}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div style={{fontWeight:700,fontSize:15,color:"#0f172a"}}>Sổ thu chi — {cashbook.length} giao dịch</div>
            <button onClick={()=>downloadCSV(cashbook.map(r=>({Ngày:r.date?new Date(r.date).toLocaleDateString("vi-VN"):"",Diễn_giải:r.desc,Mã_CT:r.ref,Loại:r.type==="thu"?"Thu":"Chi",Số_tiền:r.amount,Số_dư:r.balance})),"so-thu-chi.csv")} style={{background:"#059669",color:"#fff",border:"none",borderRadius:8,padding:"7px 14px",fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>📊 Xuất CSV</button>
          </div>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
              <thead><tr style={{background:"#f8fafc"}}>
                {["Ngày","Diễn giải","Mã CT","Thu","Chi","Số dư"].map(h=><th key={h} style={{padding:"10px 12px",textAlign:h==="Thu"||h==="Chi"||h==="Số dư"?"right":"left",fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",borderBottom:"1px solid #f1f5f9"}}>{h}</th>)}
              </tr></thead>
              <tbody>
                {cashbook.length===0&&<tr><td colSpan={6} style={{textAlign:"center",padding:32,color:"#94a3b8"}}>Chưa có giao dịch trong kỳ</td></tr>}
                {cashbook.map((r,i)=>(
                  <tr key={i} style={{borderBottom:"1px solid #f8fafc"}}>
                    <td style={{padding:"9px 12px",color:"#64748b"}}>{fmtDate(r.date)}</td>
                    <td style={{padding:"9px 12px",fontWeight:500}}>{r.desc}</td>
                    <td style={{padding:"9px 12px",color:"#94a3b8",fontSize:12}}>{r.ref}</td>
                    <td style={{padding:"9px 12px",textAlign:"right",color:"#059669",fontWeight:600}}>{r.type==="thu"?fmtMoney(r.amount):""}</td>
                    <td style={{padding:"9px 12px",textAlign:"right",color:"#dc2626",fontWeight:600}}>{r.type==="chi"?fmtMoney(r.amount):""}</td>
                    <td style={{padding:"9px 12px",textAlign:"right",fontWeight:700,color:r.balance>=0?"#1e293b":"#dc2626"}}>{fmtMoney(r.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── PHẢI THU ── */}
      {tab==="receivable"&&(
        <div style={card}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div style={{fontWeight:700,fontSize:15,color:"#0f172a"}}>Công nợ phải thu</div>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <button onClick={()=>downloadCSV(phaiThu.map(o=>({Mã_đơn:o.id,Khách_hàng:o.customerName||"",SĐT:o.customerPhone||"",Ngày_đi:o.departDate?new Date(o.departDate).toLocaleDateString("vi-VN"):"",Giá_trị:o.totalPrice||0,Đã_thu:o.totalPaid||0,Còn_nợ:o.debt})),"cong-no-phai-thu.csv")} style={{background:"#d97706",color:"#fff",border:"none",borderRadius:8,padding:"6px 12px",fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>📊 Xuất CSV</button>
              <div style={{fontSize:15,fontWeight:800,color:"#d97706"}}>{fmtMoney(totalPhaiThu)}</div>
            </div>
          </div>
          {phaiThu.length===0?<div style={{textAlign:"center",color:"#059669",padding:24,fontWeight:600}}>✓ Không có công nợ phải thu</div>:
          <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
            <thead><tr style={{background:"#f8fafc"}}>{["Đơn","Khách hàng","Ngày đi","Giá trị","Đã thu","Còn nợ"].map(h=><th key={h} style={{padding:"10px 12px",textAlign:["Giá trị","Đã thu","Còn nợ"].includes(h)?"right":"left",fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",borderBottom:"1px solid #f1f5f9"}}>{h}</th>)}</tr></thead>
            <tbody>{phaiThu.map(o=>{const dl=o.departDate?Math.ceil((new Date(o.departDate)-now)/86400000):null;const hot=dl!==null&&dl<=7;return(
              <tr key={o.id} style={{borderBottom:"1px solid #f8fafc",background:hot?"#fff7ed":"#fff"}}>
                <td style={{padding:"9px 12px",fontWeight:600,color:"#2563eb"}}>{o.id}</td>
                <td style={{padding:"9px 12px"}}>{o.customerName||"—"}</td>
                <td style={{padding:"9px 12px",color:hot?"#dc2626":"#64748b",fontWeight:hot?700:400}}>{fmtDate(o.departDate)}{hot&&dl>=0&&` (${dl}n)`}</td>
                <td style={{padding:"9px 12px",textAlign:"right"}}>{fmtMoney(o.totalPrice)}</td>
                <td style={{padding:"9px 12px",textAlign:"right",color:"#059669"}}>{fmtMoney(o.totalPaid)}</td>
                <td style={{padding:"9px 12px",textAlign:"right",fontWeight:700,color:"#d97706"}}>{fmtMoney(o.debt)}</td>
              </tr>);})}</tbody>
          </table></div>}
        </div>
      )}

      {/* ── PHẢI TRẢ ── */}
      {tab==="payable"&&(
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={card}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
              <div style={{fontWeight:700,fontSize:15,color:"#0f172a"}}>Phiếu chi / chi phí chờ thanh toán</div>
              <div style={{fontSize:15,fontWeight:800,color:"#dc2626"}}>{fmtMoney(pendingChi.reduce((s,v)=>s+(v.amount||0),0)+pendingExp.reduce((s,e)=>s+(e.amount||0),0))}</div>
            </div>
            {[...pendingChi.map(v=>({id:v.id,ncc:v.ncc,amount:v.amount,note:v.note,kind:"Phiếu chi"})),...pendingExp.map(e=>({id:e.id,ncc:e.ncc,amount:e.amount,note:e.note,kind:"Chi phí"}))].length===0
              ?<div style={{textAlign:"center",color:"#059669",padding:20,fontWeight:600}}>✓ Không có khoản chờ thanh toán</div>
              :[...pendingChi.map(v=>({id:v.id,ncc:v.ncc,amount:v.amount,note:v.note,kind:"Phiếu chi"})),...pendingExp.map(e=>({id:e.id,ncc:e.ncc,amount:e.amount,note:e.note,kind:"Chi phí"}))].map((r,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid #f8fafc"}}>
                  <div><div style={{fontSize:13,fontWeight:600}}>{r.ncc||r.note||r.id}</div><div style={{fontSize:11,color:"#94a3b8"}}>{r.kind} · {r.id}</div></div>
                  <div style={{fontSize:15,fontWeight:700,color:"#dc2626"}}>{fmtMoney(r.amount)}</div>
                </div>
              ))}
          </div>
          {nccDebt.length>0&&(
            <div style={card}>
              <div style={{fontWeight:700,fontSize:15,marginBottom:12,color:"#0f172a"}}>Công nợ nhà cung cấp</div>
              {nccDebt.map(n=>(
                <div key={n.id} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid #f8fafc"}}>
                  <span style={{fontSize:13,fontWeight:600}}>{n.ten||n.name}</span>
                  <span style={{fontSize:15,fontWeight:700,color:"#dc2626"}}>{fmtMoney(n.cong_no)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── HÓA ĐƠN VAT ── */}
      {tab==="vat"&&(<>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:14}}>
          {[["VAT đầu ra",outVat,"#059669"],["VAT đầu vào",inVat,"#2563eb"],["VAT phải nộp",vatPhaiNop,vatPhaiNop>=0?"#7c3aed":"#059669"]].map(([l,v,c])=>(
            <div key={l} style={{...card,padding:"14px 16px"}}><div style={{fontSize:12,color:"#64748b",fontWeight:600}}>{l}</div><div style={{fontSize:18,fontWeight:800,color:c,marginTop:4}}>{fmtMoney(v)}</div></div>
          ))}
        </div>
        <div style={card}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:8}}>
            <div style={{display:"flex",gap:4,background:"#f1f5f9",borderRadius:10,padding:4}}>
              {[["output","Đầu ra (bán)"],["input","Đầu vào (mua)"]].map(([k,l])=>(
                <button key={k} onClick={()=>setInvTab(k)} style={{padding:"7px 14px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:600,fontSize:13,background:invTab===k?"#fff":"transparent",color:invTab===k?"#1e293b":"#64748b",boxShadow:invTab===k?"0 1px 4px rgba(0,0,0,.1)":"none"}}>{l}</button>
              ))}
            </div>
            <button onClick={()=>setShowForm(true)} style={{background:"#2563eb",color:"#fff",border:"none",borderRadius:9,padding:"8px 16px",cursor:"pointer",fontWeight:700,fontSize:13}}>+ Ghi hóa đơn</button>
          </div>
          {showForm&&(
            <div style={{background:"#f8fafc",borderRadius:12,padding:16,marginBottom:16,border:"1px solid #e2e8f0"}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                {invTab==="output"&&(
                  <div><label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:4,color:"#374151"}}>Đơn hàng</label>
                  <select value={form.orderId} onChange={e=>set("orderId",e.target.value)} style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:8,padding:"9px 12px",fontSize:13}}>
                    <option value="">-- Chọn đơn --</option>{orders.map(o=><option key={o.id} value={o.id}>{o.id} - {o.customerName||"—"}</option>)}
                  </select></div>
                )}
                {[["Số hóa đơn *","invoiceNo"],["Mã số thuế","taxCode"],["Tên công ty/khách","companyName"]].map(([label,key])=>(
                  <div key={key}><label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:4,color:"#374151"}}>{label}</label>
                  <input value={form[key]||""} onChange={e=>set(key,e.target.value)} style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:8,padding:"9px 12px",fontSize:13,boxSizing:"border-box"}}/></div>
                ))}
                <div><label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:4,color:"#374151"}}>Số tiền trước VAT (₫) *</label>
                <NumberInput value={form.amount||0} onChange={v=>set("amount",v)} placeholder="VD: 5.000.000" style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:8,padding:"9px 12px",fontSize:13,boxSizing:"border-box"}}/></div>
                <div><label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:4,color:"#374151"}}>Thuế VAT (%)</label>
                <select value={form.vatRate} onChange={e=>set("vatRate",e.target.value)} style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:8,padding:"9px 12px",fontSize:13}}><option value={0}>0%</option><option value={5}>5%</option><option value={8}>8%</option><option value={10}>10%</option></select></div>
                <div><label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:4,color:"#374151"}}>Ngày xuất</label>
                <input type="date" value={form.date} onChange={e=>set("date",e.target.value)} style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:8,padding:"9px 12px",fontSize:13,boxSizing:"border-box"}}/></div>
              </div>
              {form.amount>0&&<div style={{marginTop:10,fontSize:13,color:"#64748b"}}>Tổng cộng (gồm VAT): <b style={{color:"#1e293b"}}>{fmtMoney(Number(form.amount)*(1+Number(form.vatRate)/100))}</b></div>}
              <div style={{display:"flex",gap:8,marginTop:14}}>
                <button onClick={saveInv} style={{background:"#16a34a",color:"#fff",border:"none",borderRadius:8,padding:"9px 20px",cursor:"pointer",fontWeight:700}}>Lưu</button>
                <button onClick={()=>setShowForm(false)} style={{background:"#6b7280",color:"#fff",border:"none",borderRadius:8,padding:"9px 20px",cursor:"pointer",fontWeight:600}}>Hủy</button>
              </div>
            </div>
          )}
          {invList.length===0?<div style={{textAlign:"center",color:"#94a3b8",padding:32}}>Chưa có hóa đơn nào</div>:
            invList.map(inv=>(
              <div key={inv.id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:"1px solid #f8fafc"}}>
                <div style={{flex:1}}><div style={{fontWeight:700,fontSize:14}}>{inv.invoiceNo} {inv.orderId&&"· "+inv.orderId}</div><div style={{fontSize:12,color:"#64748b",marginTop:2}}>{inv.companyName||"—"} {inv.taxCode?"· MST: "+inv.taxCode:""} · {fmtDate(inv.date)}</div></div>
                <div style={{textAlign:"right"}}><div style={{fontWeight:800,fontSize:15,color:"#1e293b"}}>{fmtMoney(inv.amount)}</div><div style={{fontSize:12,color:"#d97706"}}>VAT {inv.vatRate}%: {fmtMoney(inv.vatAmount)}</div></div>
              </div>
            ))}
        </div>
      </>)}

      {/* ── QUỸ & NGÂN HÀNG ── */}
      {tab==="bank"&&(
        <div style={card}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
            <div style={{fontWeight:700,fontSize:15,color:"#0f172a"}}>Tài khoản & tồn quỹ</div>
            <div style={{fontSize:15,fontWeight:800,color:"#2563eb"}}>{fmtMoney(tonQuy)}</div>
          </div>
          <div style={{padding:"12px 16px",background:"#eff6ff",borderRadius:10,marginBottom:12,display:"flex",justifyContent:"space-between"}}>
            <span style={{fontSize:13,fontWeight:600,color:"#1e40af"}}>💰 Tồn quỹ tổng (Thu − Chi toàn bộ)</span>
            <span style={{fontSize:16,fontWeight:800,color:tonQuy>=0?"#2563eb":"#dc2626"}}>{fmtMoney(tonQuy)}</span>
          </div>
          {(bankAccounts||[]).length===0?<div style={{textAlign:"center",color:"#94a3b8",padding:20,fontSize:13}}>Chưa khai báo tài khoản ngân hàng</div>:
            bankAccounts.map(b=>(
              <div key={b.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:"1px solid #f8fafc"}}>
                <div><div style={{fontSize:13,fontWeight:600}}>{b.bankName||b.name||"—"}</div><div style={{fontSize:11,color:"#94a3b8",fontFamily:"monospace"}}>{b.accountNo||b.so_tk||""} · {b.accountName||b.chu_tk||""}</div></div>
                <div style={{fontSize:15,fontWeight:700,color:"#1e293b"}}>{b.balance!=null?fmtMoney(b.balance):"—"}</div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
const SERVICE_TYPES=[
  {id:"flight",       label:"Vé máy bay",    icon:"✈️"},
  {id:"tour_package", label:"Tour trọn gói", icon:"🧳"},
  {id:"tour_ghep",    label:"Tour ghép",     icon:"🔗"},
  {id:"cruise",       label:"Du thuyền",     icon:"🚢"},
  {id:"hotel",        label:"Khách sạn",     icon:"🏨"},
  {id:"ticket",       label:"Vé tham quan",  icon:"🎡"},
  {id:"combo",        label:"Combo",         icon:"📦"},
];

const COMBO_COMPONENTS_DEFAULT = {
  flight:    { enabled:false, priceAdult:"", label:"Vé máy bay",   icon:"✈️" },
  tour_ghep: { enabled:false, priceAdult:"", label:"Tour ghép",    icon:"🔗" },
  cruise:    { enabled:false, priceAdult:"", label:"Du thuyền",    icon:"🚢" },
  hotel:     { enabled:false, priceAdult:"", label:"Khách sạn",    icon:"🏨" },
  ticket:    { enabled:false, priceAdult:"", label:"Vé tham quan", icon:"🎡" },
};

const COMBO_SHORT_NAMES = {
  flight:"Máy bay", tour_ghep:"Tour ghép", cruise:"Du thuyền",
  hotel:"Khách sạn", ticket:"Vé tham quan",
};

function OrderForm({onSave,onCancel,pushNotif,defaultSale=SALE_STAFF[0],currentRole="sale",customers=[],onCreateCustomer,tourPrograms=[],tourGhepProducts=[],initialData=null,orders=[],currentUser=null,userAccounts=[]}){
  const [step,setStep]=React.useState(1);
  // Danh sách nhân viên phụ trách — gồm sale, điều hành + người đang đăng nhập
  const staffOptions = React.useMemo(()=>{
    const fromUsers = (userAccounts||[])
      .filter(u=>u.active!==false && ["sale","dieu_hanh","manager"].includes(u.role))
      .map(u=>u.name);
    const merged = [...new Set([currentUser?.name, ...fromUsers, ...SALE_STAFF].filter(Boolean))];
    return merged;
  },[userAccounts,currentUser]);
  const [form,setForm]=React.useState(initialData||{
    invoiceType:"no_invoice",customerType:"personal",
    customerName:"",customerPhone:"",customerEmail:"",customerProvince:"",customerId:"",
    cccd:"",cccdImg:"",companyName:"",taxCode:"",companyAddress:"",
    service:"tour_package",tourName:"",departDate:"",returnDate:"",sale:defaultSale,
    adultQty:1,adultPrice:"",child10Qty:0,child10Price:"",child5Qty:0,child5Price:"",child2Qty:0,child2Price:"",infantQty:0,infantPrice:"",
    costPrice:"",depositAmount:"",note:"",source:"Facebook",passengers:[],
    comboComponents:{...COMBO_COMPONENTS_DEFAULT},comboDiscount:"",comboName:"",
    tourGhepProductId:"",tourGhepProductName:"",
  });
  const [custSearch,setCustSearch]=React.useState("");
  const [showCustDrop,setShowCustDrop]=React.useState(false);
  const [errors,setErrors]=React.useState({});

  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const fmtNum=(s)=>Number(String(s).replace(/[^\d]/g,""))||0;
  const fmtMoney=(n)=>(n||0).toLocaleString("vi-VN")+"đ";

  const isCombo = form.service === "combo";
  const isTourGhep = form.service === "tour_ghep";

  // Combo: sum of enabled components × adult qty, minus discount
  const comboEnabledItems = Object.entries(form.comboComponents||{}).filter(([,c])=>c.enabled);
  const comboRaw = comboEnabledItems.reduce((s,[,c])=>s+fmtNum(c.priceAdult)*fmtNum(form.adultQty),0);
  const comboTotal = Math.max(0, comboRaw - fmtNum(form.comboDiscount||0));

  // Auto-name combo from enabled components
  const autoComboName = comboEnabledItems.length >= 2
    ? "Combo " + comboEnabledItems.map(([k])=>COMBO_SHORT_NAMES[k]||k).join(" + ")
    : "";

  const setComboComp = (compKey, field, value) =>
    setForm(f=>({...f, comboComponents:{...f.comboComponents,[compKey]:{...f.comboComponents[compKey],[field]:value}}}));

  const totalPrice = isCombo
    ? comboTotal
    : fmtNum(form.adultQty)*fmtNum(form.adultPrice)+fmtNum(form.child10Qty)*fmtNum(form.child10Price)+fmtNum(form.child5Qty)*fmtNum(form.child5Price)+fmtNum(form.child2Qty)*fmtNum(form.child2Price)+fmtNum(form.infantQty)*fmtNum(form.infantPrice);
  const pax=fmtNum(form.adultQty)+fmtNum(form.child10Qty)+fmtNum(form.child5Qty)+fmtNum(form.child2Qty)+fmtNum(form.infantQty);
  const profit=totalPrice-fmtNum(form.costPrice);
  const profitPct=totalPrice?(profit/totalPrice*100):0;

  const canViewGhepCost = currentUser?.canViewTourGhep === true;

  const filteredCust=React.useMemo(()=>{
    if(!custSearch.trim()) return [];
    const q=custSearch.toLowerCase();
    return customers.filter(c=>c.name?.toLowerCase().includes(q)||c.phone?.includes(q)).slice(0,6);
  },[customers,custSearch]);

  const dupOrder=React.useMemo(()=>{
    if(!form.customerPhone||!form.departDate) return null;
    return orders.find(o=>o.customerPhone===form.customerPhone&&o.departDate===form.departDate&&!["cancelled"].includes(o.status));
  },[form.customerPhone,form.departDate,orders]);

  // ── Checklist tiêu chí (KIỂM TRA NHANH) ──────────────────
  const checklist=[
    {label:"Họ tên",ok:!!form.customerName.trim()},
    {label:"SĐT",ok:!!form.customerPhone.trim()},
    {label:"CCCD",ok:!!form.cccd.trim()},
    {label:"Tên dịch vụ",ok:!!form.tourName.trim()},
    {label:"Ngày đi",ok:!!form.departDate},
    {label:"Email",ok:!!form.customerEmail.trim()},
    {label:"Lợi nhuận ≥ 5%",ok:profitPct>=5},
    {label:"Loại hóa đơn",ok:!!form.invoiceType},
    {label:"MST (DN có HĐ)",ok:!(form.invoiceType==="invoice"&&form.customerType==="corporate")||!!form.taxCode.trim()},
  ];
  const checklistDone=checklist.filter(c=>c.ok).length;

  const STEPS=[{n:1,label:"Thông tin khách"},{n:2,label:"Dịch vụ & Giá"},{n:3,label:"Kiểm soát"}];

  const validateStep=(s)=>{
    const e={};
    if(s===1){
      if(!form.customerName.trim()) e.customerName="Bắt buộc";
      if(!form.customerPhone.trim()) e.customerPhone="Bắt buộc";
      if(form.invoiceType==="invoice"&&form.customerType==="corporate"){
        if(!form.companyName.trim()) e.companyName="Bắt buộc khi xuất HĐ doanh nghiệp";
        if(!form.taxCode.trim()) e.taxCode="Bắt buộc khi xuất HĐ doanh nghiệp";
      }
    }
    if(s===2){
      if(isCombo){
        if(!(form.comboName.trim()||autoComboName)) e.tourName="Bắt buộc";
      } else {
        if(!form.tourName.trim()) e.tourName="Bắt buộc";
      }
      if(!form.departDate) e.departDate="Bắt buộc";
      if(isCombo){
        const enabled=Object.values(form.comboComponents||{}).filter(c=>c.enabled);
        if(enabled.length<2) e.combo="Chọn ít nhất 2 thành phần Combo";
        else if(enabled.some(c=>!(fmtNum(c.priceAdult)>0))) e.combo="Nhập giá cho mỗi thành phần đã chọn";
        else if(fmtNum(form.comboDiscount||0)<0) e.combo="Chiết khấu không được âm";
      } else {
        if(totalPrice<=0) e.adultPrice="Nhập ít nhất 1 đơn giá và số lượng";
      }
    }
    setErrors(e); return Object.keys(e).length===0;
  };

  const goNext=()=>{ if(validateStep(step)) setStep(s=>Math.min(3,s+1)); };
  const goBack=()=>setStep(s=>Math.max(1,s-1));

  const handleSave=()=>{
    if(!validateStep(1)||!validateStep(2)) return;
    if(dupOrder&&!window.confirm("Khách này đã có đơn "+dupOrder.id+" cùng ngày khởi hành. Vẫn tạo đơn mới?")) return;
    // Auto-upsert khách vào CRM — check trùng SĐT trước
    if(onCreateCustomer&&form.customerPhone.trim()){
      const existingCustomer=customers?.find(c=>c.phone===form.customerPhone.trim()||c.sdt===form.customerPhone.trim());
      if(existingCustomer){
        onCreateCustomer({...existingCustomer,
          email:existingCustomer.email||form.customerEmail||"",
          cccd:existingCustomer.cccd||form.cccd||"",
          province:existingCustomer.province||form.customerProvince||"",
          totalOrders:(existingCustomer.totalOrders||0)+1,
          lastOrderDate:new Date().toISOString().slice(0,10),
        });
      } else if(!form.customerId){
        onCreateCustomer({
          id:"KH-"+Date.now(),
          type:"personal",
          customerType:form.customerType||"personal",
          invoiceType:form.invoiceType||"no_invoice",
          name:form.customerName,
          phone:form.customerPhone,
          email:form.customerEmail||"",
          province:form.customerProvince||"",
          cccd:form.cccd||"",
          companyName:form.companyName||"",
          taxCode:form.taxCode||"",
          source:form.source||"Khác",
          tags:[],notes:"",
          totalOrders:1,totalRevenue:0,totalProfit:0,
          firstOrderDate:new Date().toISOString().slice(0,10),
          lastOrderDate:new Date().toISOString().slice(0,10),
          createdAt:new Date().toISOString(),
        });
      }
    }
    const svcLabel = SERVICE_TYPES.find(s=>s.id===form.service)?.label||form.service;
    const resolvedName = isCombo ? (form.comboName.trim()||autoComboName||"Combo") : form.tourName;
    onSave({
      ...form,
      service: form.service,
      serviceName: resolvedName,
      serviceLabel: isCombo ? `[Combo] ${(form.comboName.trim()||autoComboName||"Combo").replace(/^Combo\s*/,"").trim()||resolvedName}` : svcLabel,
      tourName: resolvedName,
      totalPrice, pax, costPrice:fmtNum(form.costPrice),
      depositAmount:fmtNum(form.depositAmount),
      status:"pending_payment", totalPaid:0,
      invoiceType:form.invoiceType,
      customerType:form.customerType,
      companyName:form.companyName,
      taxCode:form.taxCode,
      companyAddress:form.companyAddress,
      ...(isCombo ? {
        comboComponents: form.comboComponents,
        comboDiscount: fmtNum(form.comboDiscount||0),
        comboName: form.comboName.trim()||autoComboName,
        comboRaw, comboTotal,
      } : {}),
      ...(isTourGhep ? {
        tourGhepProductId: form.tourGhepProductId,
        tourGhepProductName: form.tourGhepProductName,
      } : {}),
    });
  };

  const inputStyle=(key)=>({width:"100%",border:"1px solid "+(errors[key]?"#ef4444":"#e2e8f0"),borderRadius:8,padding:"9px 12px",fontSize:13,boxSizing:"border-box",outline:"none"});
  const labelStyle={display:"block",fontSize:11,fontWeight:700,letterSpacing:.3,marginBottom:5,color:"#64748b",textTransform:"uppercase"};

  return(
    <div style={{maxWidth:1000,margin:"0 auto"}}>
      {/* Stepper */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:0,marginBottom:24,background:"#fff",borderRadius:14,padding:"18px 24px",boxShadow:"0 1px 6px rgba(0,0,0,.07)"}}>
        {STEPS.map((s,i)=>(
          <React.Fragment key={s.n}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:30,height:30,borderRadius:"50%",background:step>s.n?"#16a34a":step===s.n?"#1e3a8a":"#f1f5f9",color:step>=s.n?"#fff":"#94a3b8",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:13}}>
                {step>s.n?"✓":s.n}
              </div>
              <span style={{fontWeight:700,fontSize:13,color:step===s.n?"#1e293b":step>s.n?"#16a34a":"#94a3b8"}}>{s.label}</span>
            </div>
            {i<STEPS.length-1&&<div style={{width:60,height:2,background:step>s.n?"#16a34a":"#e2e8f0",margin:"0 16px"}}/>}
          </React.Fragment>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 300px",gap:16}}>
        <div style={{background:"#fff",borderRadius:14,padding:24,boxShadow:"0 1px 6px rgba(0,0,0,.07)"}}>
          {step===1&&(
            <div>
              {/* BƯỚC 0: Hóa đơn VAT */}
              <div style={{marginBottom:20}}>
                <label style={labelStyle}>Khách có lấy hóa đơn VAT không? *</label>
                <div style={{display:"flex",gap:10,marginTop:6}}>
                  {[
                    {val:"no_invoice",label:"Không lấy hóa đơn",desc:"TK thu: VCB Thùy Anh",color:"#0F6E56",bg:"#E1F5EE"},
                    {val:"invoice",label:"Có lấy hóa đơn VAT",desc:"TK thu: HDBank Công ty",color:"#185FA5",bg:"#E6F1FB"},
                  ].map(opt=>(
                    <button key={opt.val} type="button" onClick={()=>set("invoiceType",opt.val)} style={{flex:1,padding:"12px 16px",borderRadius:10,cursor:"pointer",border:"1.5px solid "+(form.invoiceType===opt.val?opt.color:"#e2e8f0"),background:form.invoiceType===opt.val?opt.bg:"#fff",textAlign:"left"}}>
                      <div style={{fontWeight:600,fontSize:13,color:form.invoiceType===opt.val?opt.color:"#374151"}}>{opt.label}</div>
                      <div style={{fontSize:11,color:"#64748b",marginTop:3}}>{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
              {/* Loại khách — chỉ hiện khi có HĐ */}
              {form.invoiceType==="invoice"&&(
                <div style={{marginBottom:16}}>
                  <label style={labelStyle}>Loại khách hàng</label>
                  <div style={{display:"flex",gap:8,marginTop:6}}>
                    {[
                      {val:"personal",label:"Cá nhân",icon:"👤"},
                      {val:"corporate",label:"Doanh nghiệp / Tổ chức",icon:"🏢"},
                    ].map(opt=>(
                      <button key={opt.val} type="button" onClick={()=>set("customerType",opt.val)} style={{flex:1,padding:"10px 14px",borderRadius:8,cursor:"pointer",border:"1.5px solid "+(form.customerType===opt.val?"#534AB7":"#e2e8f0"),background:form.customerType===opt.val?"#EEEDFE":"#fff",display:"flex",alignItems:"center",gap:8}}>
                        <span style={{fontSize:16}}>{opt.icon}</span>
                        <span style={{fontSize:13,fontWeight:600,color:form.customerType===opt.val?"#534AB7":"#374151"}}>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div style={{fontWeight:700,marginBottom:16,fontSize:15,color:"#1e293b"}}>👤 Thông tin khách hàng</div>
              <div style={{position:"relative",marginBottom:14}}>
                <label style={labelStyle}>Tìm khách có sẵn</label>
                <input value={custSearch} onChange={e=>{setCustSearch(e.target.value);setShowCustDrop(true);}} onFocus={()=>setShowCustDrop(true)} placeholder="Nhập tên hoặc SĐT..." style={inputStyle("search")}/>
                {showCustDrop&&filteredCust.length>0&&(
                  <div style={{position:"absolute",top:"100%",left:0,right:0,background:"#fff",border:"1px solid #e2e8f0",borderRadius:8,boxShadow:"0 4px 16px rgba(0,0,0,.1)",zIndex:100,maxHeight:200,overflowY:"auto"}}>
                    {filteredCust.map(c=>(
                      <div key={c.id} onClick={()=>{set("customerName",c.name);set("customerPhone",c.phone);set("customerEmail",c.email||"");set("customerId",c.id);setCustSearch(c.name);setShowCustDrop(false);}}
                        style={{padding:"10px 14px",cursor:"pointer",fontSize:13,borderBottom:"1px solid #f1f5f9",display:"flex",justifyContent:"space-between"}}
                        onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"} onMouseLeave={e=>e.currentTarget.style.background=""}>
                        <span style={{fontWeight:600}}>{c.name}</span><span style={{color:"#64748b"}}>{c.phone}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                <div><label style={labelStyle}>Họ tên *</label><input value={form.customerName} onChange={e=>set("customerName",e.target.value)} style={inputStyle("customerName")}/></div>
                <div><label style={labelStyle}>SĐT *</label><input value={form.customerPhone} onChange={e=>set("customerPhone",e.target.value)} style={inputStyle("customerPhone")}/></div>
                <div><label style={labelStyle}>Email</label><input value={form.customerEmail} onChange={e=>set("customerEmail",e.target.value)} style={inputStyle("customerEmail")}/></div>
                <div>
                  <label style={labelStyle}>Nguồn</label>
                  <select value={form.source} onChange={e=>set("source",e.target.value)} style={inputStyle("source")}>
                    {["Facebook","Zalo","TikTok","Giới thiệu","Website","Khác"].map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                <div><label style={labelStyle}>Số CCCD/CMND</label><input value={form.cccd} onChange={e=>set("cccd",e.target.value)} style={inputStyle("cccd")}/></div>
                <div>
                  <label style={labelStyle}>Ảnh CCCD / Hộ chiếu <span style={{fontWeight:400,color:"#94a3b8"}}>(tùy chọn)</span></label>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:form.cccdImg?"6px":0}}>
                    <label style={{display:"inline-flex",alignItems:"center",gap:5,padding:"7px 12px",background:"#eff6ff",color:"#1e40af",border:"1px solid #bfdbfe",borderRadius:7,cursor:"pointer",fontSize:12,fontWeight:600,flexShrink:0}}>
                      📎 Tải ảnh lên
                      <input type="file" accept="image/*,.pdf" style={{display:"none"}} onChange={e=>{
                        const file=e.target.files?.[0];
                        if(!file) return;
                        if(file.size>5*1024*1024){alert("File tối đa 5MB");return;}
                        const reader=new FileReader();
                        reader.onload=(ev)=>set("cccdImg",ev.target.result);
                        reader.readAsDataURL(file);
                      }}/>
                    </label>
                    {form.cccdImg&&(
                      form.cccdImg.startsWith("data:")?(
                        <img src={form.cccdImg} alt="CCCD" onClick={()=>window.open(form.cccdImg)} style={{height:34,borderRadius:5,cursor:"zoom-in",border:"1px solid #e2e8f0",objectFit:"cover"}}/>
                      ):(
                        <a href={form.cccdImg} target="_blank" rel="noreferrer" style={{fontSize:12,color:"#2563eb"}}>🔗 Xem ảnh</a>
                      )
                    )}
                    {form.cccdImg&&<button type="button" onClick={()=>set("cccdImg","")} style={{background:"none",border:"none",color:"#dc2626",cursor:"pointer",fontSize:12,padding:0}}>✕</button>}
                  </div>
                  {!form.cccdImg&&<input value={form.cccdImg} onChange={e=>set("cccdImg",e.target.value)} placeholder="hoặc dán link Google Drive..." style={{...inputStyle("cccdImg"),fontSize:11,padding:"5px 10px",marginTop:4}}/>}
                </div>
              </div>
              {/* Fields doanh nghiệp — chỉ hiện khi có HĐ + corporate */}
              {form.invoiceType==="invoice"&&form.customerType==="corporate"&&(
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginTop:14,paddingTop:14,borderTop:"1px solid #e2e8f0"}}>
                  <div style={{gridColumn:"1/-1"}}>
                    <div style={{fontSize:12,color:"#534AB7",fontWeight:700,marginBottom:10}}>Thông tin xuất hóa đơn</div>
                  </div>
                  <div style={{gridColumn:"1/-1"}}>
                    <label style={labelStyle}>Tên công ty / Tổ chức *</label>
                    <input value={form.companyName} onChange={e=>set("companyName",e.target.value)} placeholder="VD: Công ty CP ABC" style={inputStyle("companyName")}/>
                    {errors.companyName&&<span style={{color:"#ef4444",fontSize:11}}>{errors.companyName}</span>}
                  </div>
                  <div>
                    <label style={labelStyle}>Mã số thuế *</label>
                    <input value={form.taxCode} onChange={e=>set("taxCode",e.target.value)} placeholder="VD: 0312345678" style={inputStyle("taxCode")}/>
                    {errors.taxCode&&<span style={{color:"#ef4444",fontSize:11}}>{errors.taxCode}</span>}
                  </div>
                  <div>
                    <label style={labelStyle}>Tỉnh / Thành phố</label>
                    <input value={form.customerProvince} onChange={e=>set("customerProvince",e.target.value)} style={inputStyle("customerProvince")}/>
                  </div>
                  <div style={{gridColumn:"1/-1"}}>
                    <label style={labelStyle}>Địa chỉ xuất hóa đơn</label>
                    <input value={form.companyAddress} onChange={e=>set("companyAddress",e.target.value)} placeholder="Địa chỉ đăng ký kinh doanh" style={inputStyle("companyAddress")}/>
                  </div>
                </div>
              )}
            </div>
          )}

          {step===2&&(
            <div>
              <div style={{fontWeight:700,marginBottom:16,fontSize:15,color:"#1e293b"}}>🧳 Dịch vụ & Cấu trúc giá</div>

              {/* 7 nút loại dịch vụ */}
              <label style={labelStyle}>Loại dịch vụ *</label>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:16}}>
                {SERVICE_TYPES.map(s=>(
                  <button key={s.id} onClick={()=>{set("service",s.id);if(s.id!=="combo")set("comboComponents",{...COMBO_COMPONENTS_DEFAULT});}} style={{display:"flex",alignItems:"center",gap:7,padding:"10px 12px",borderRadius:9,border:"1.5px solid "+(form.service===s.id?(s.id==="combo"?"#7c3aed":"#1e3a8a"):"#e2e8f0"),background:form.service===s.id?(s.id==="combo"?"#f5f3ff":"#eff6ff"):"#fff",cursor:"pointer",fontWeight:form.service===s.id?700:500,fontSize:13,color:form.service===s.id?(s.id==="combo"?"#7c3aed":"#1e3a8a"):"#374151",transition:"all .15s"}}>
                    <span>{s.icon}</span>{s.label}
                  </button>
                ))}
              </div>

              {/* ── PANEL COMBO ĐỘNG ── */}
              {isCombo&&(
                <div style={{background:"#faf5ff",border:"1.5px solid #c4b5fd",borderRadius:12,padding:18,marginBottom:16}}>
                  <div style={{fontWeight:700,fontSize:13,color:"#7c3aed",marginBottom:14,display:"flex",alignItems:"center",gap:6}}>
                    📦 Thành phần Combo
                    {errors.combo&&<span style={{marginLeft:8,color:"#dc2626",fontWeight:600,fontSize:12}}>⚠ {errors.combo}</span>}
                  </div>
                  {Object.entries(form.comboComponents||{}).map(([key,comp])=>(
                    <div key={key} style={{display:"grid",gridTemplateColumns:"auto 1fr auto",gap:12,alignItems:"center",marginBottom:10,padding:"10px 12px",background:comp.enabled?"#fff":"#f5f3ff",borderRadius:8,border:"1px solid "+(comp.enabled?"#c4b5fd":"transparent"),transition:"all .15s"}}>
                      <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",minWidth:140}}>
                        <input type="checkbox" checked={comp.enabled} onChange={e=>setComboComp(key,"enabled",e.target.checked)} style={{width:16,height:16,accentColor:"#7c3aed",cursor:"pointer"}}/>
                        <span style={{fontSize:13,fontWeight:comp.enabled?600:400,color:comp.enabled?"#1e293b":"#94a3b8"}}>{comp.icon} {comp.label}</span>
                      </label>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <span style={{fontSize:11,color:"#94a3b8",whiteSpace:"nowrap"}}>Giá NL:</span>
                        <NumberInput value={comp.priceAdult||0} onChange={v=>setComboComp(key,"priceAdult",v)} placeholder="Giá NL" disabled={!comp.enabled} style={{flex:1,border:"1px solid "+(comp.enabled?"#c4b5fd":"#e2e8f0"),borderRadius:7,padding:"6px 10px",fontSize:13,background:comp.enabled?"#fff":"#f8fafc",color:comp.enabled?"#1e293b":"#94a3b8"}}/>
                      </div>
                      {comp.enabled&&fmtNum(comp.priceAdult)>0&&(
                        <span style={{fontSize:11,color:"#7c3aed",fontWeight:600,whiteSpace:"nowrap"}}>{fmtMoney(fmtNum(comp.priceAdult)*fmtNum(form.adultQty))}</span>
                      )}
                      {(!comp.enabled||!fmtNum(comp.priceAdult))&&<span/>}
                    </div>
                  ))}
                  <div style={{borderTop:"1px dashed #c4b5fd",paddingTop:12,marginTop:4}}>
                    <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:12,alignItems:"center",marginBottom:8}}>
                      <label style={{fontSize:13,color:"#374151"}}>Chiết khấu Combo (₫)</label>
                      <input type="number" min={0} value={form.comboDiscount} onChange={e=>set("comboDiscount",Math.max(0,Number(e.target.value)))} placeholder="0" style={{width:140,border:"1px solid #c4b5fd",borderRadius:7,padding:"6px 10px",fontSize:13,textAlign:"right"}}/>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:"#ede9fe",borderRadius:8,padding:"10px 14px"}}>
                      <span style={{fontWeight:700,fontSize:13,color:"#7c3aed"}}>Tổng Combo (NL × {fmtNum(form.adultQty)} khách):</span>
                      <span style={{fontWeight:800,fontSize:16,color:"#7c3aed"}}>{fmtMoney(comboTotal)}</span>
                    </div>
                  </div>
                  <div style={{marginTop:12}}>
                    <label style={labelStyle}>Tên Combo (tự động sinh — có thể sửa)</label>
                    <input value={form.comboName||autoComboName} onChange={e=>set("comboName",e.target.value)} placeholder={autoComboName||"Combo …"} style={inputStyle("comboName")}/>
                  </div>
                </div>
              )}

              {/* ── TOUR GHÉP: chọn từ danh mục ── */}
              {isTourGhep&&(()=>{
                const [ghepSearch, setGhepSearch] = [form._ghepSearch||"", v=>set("_ghepSearch",v)];
                const activeProducts = tourGhepProducts.filter(p=>p.active!==false);
                const filteredProducts = ghepSearch.trim()
                  ? activeProducts.filter(p=>(p.name||"").toLowerCase().includes(ghepSearch.toLowerCase())||(p.destination||"").toLowerCase().includes(ghepSearch.toLowerCase())||(p.partnerName||"").toLowerCase().includes(ghepSearch.toLowerCase()))
                  : activeProducts;
                const selectedProduct = tourGhepProducts.find(p=>p.id===form.tourGhepProductId);

                const applyPrices = (sell,buy) => {
                  set("adultPrice", sell?.adult||"");
                  set("child10Price", sell?.child||sell?.child10||"");
                  set("child5Price", sell?.child5||"");
                  set("infantPrice", sell?.infant||"");
                  if(canViewGhepCost) set("costPrice", buy?.adult||"");
                };
                const selectProduct = (p) => {
                  set("tourGhepProductId", p.id);
                  set("tourGhepProductName", p.name);
                  set("tourName", p.name);
                  const deps = Array.isArray(p.departures)?p.departures:[];
                  if(p.useSchedule && deps.length){
                    const d0 = deps[0];
                    set("tourGhepDepartureId", d0.id);
                    set("tourGhepDepartureLabel", d0.label||"");
                    applyPrices(d0.sell, d0.buy);
                  } else {
                    set("tourGhepDepartureId","");
                    set("tourGhepDepartureLabel","");
                    applyPrices(p.sellPrices, p.buyPrices);
                  }
                  set("_ghepSearch","");
                };
                const selectDeparture = (depId) => {
                  const p = selectedProduct; if(!p) return;
                  const d = (p.departures||[]).find(x=>x.id===depId);
                  if(!d) return;
                  set("tourGhepDepartureId", d.id);
                  set("tourGhepDepartureLabel", d.label||"");
                  applyPrices(d.sell, d.buy);
                };

                return(
                  <div style={{background:"linear-gradient(135deg,#f0f9ff,#e0f2fe)",border:"2px solid #7dd3fc",borderRadius:14,padding:16,marginBottom:16}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                      <span style={{fontSize:18}}>🔗</span>
                      <div style={{fontWeight:700,fontSize:14,color:"#0369a1"}}>Chọn sản phẩm Tour ghép</div>
                      {activeProducts.length===0&&<span style={{fontSize:12,color:"#dc2626",fontWeight:600}}>⚠ Chưa có sản phẩm — Admin cần nhập trong module Tour ghép trước</span>}
                      {activeProducts.length>0&&<span style={{fontSize:12,color:"#64748b"}}>{activeProducts.length} sản phẩm</span>}
                    </div>

                    {/* Sản phẩm đã chọn */}
                    {selectedProduct&&(
                      <div style={{background:"#fff",borderRadius:10,padding:14,marginBottom:12,border:"2px solid #0891b2",position:"relative"}}>
                        <div style={{position:"absolute",top:10,right:10}}>
                          <button onClick={()=>{set("tourGhepProductId","");set("tourGhepProductName","");set("tourName","");}} style={{background:"#fee2e2",color:"#dc2626",border:"none",borderRadius:6,padding:"3px 8px",fontSize:11,cursor:"pointer",fontWeight:600}}>✕ Bỏ chọn</button>
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                          <span style={{background:"#0891b2",color:"#fff",borderRadius:6,padding:"2px 8px",fontSize:11,fontWeight:700}}>✓ Đã chọn</span>
                          <span style={{fontWeight:800,fontSize:15,color:"#0c4a6e"}}>{selectedProduct.name}</span>
                        </div>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,fontSize:12}}>
                          <div><span style={{color:"#64748b"}}>Điểm đến:</span><br/><b>{selectedProduct.destination||"—"}</b></div>
                          <div><span style={{color:"#64748b"}}>Đối tác/NCC:</span><br/><b>{selectedProduct.partnerName||"—"}</b></div>
                          <div><span style={{color:"#64748b"}}>Thời gian:</span><br/><b>{selectedProduct.duration||"—"}</b></div>
                          <div><span style={{color:"#64748b"}}>Giá bán NL:</span><br/><b style={{color:"#2563eb"}}>{(selectedProduct.sellPrices?.adult||0).toLocaleString("vi-VN")}₫</b></div>
                          {canViewGhepCost&&<div><span style={{color:"#64748b"}}>Giá mua NCC:</span><br/><b style={{color:"#dc2626"}}>{(selectedProduct.buyPrices?.adult||0).toLocaleString("vi-VN")}₫</b></div>}
                          {canViewGhepCost&&<div><span style={{color:"#64748b"}}>Biên LN NL:</span><br/><b style={{color:"#059669"}}>{selectedProduct.sellPrices?.adult&&selectedProduct.buyPrices?.adult?Math.round((selectedProduct.sellPrices.adult-selectedProduct.buyPrices.adult)/selectedProduct.sellPrices.adult*100)+"%" :"—"}</b></div>}
                        </div>
                        {selectedProduct.useSchedule&&Array.isArray(selectedProduct.departures)&&selectedProduct.departures.length>0&&(
                          <div style={{marginTop:12,paddingTop:12,borderTop:"1px dashed #cbd5e1"}}>
                            <div style={{fontSize:12,fontWeight:700,color:"#9a3412",marginBottom:6}}>📅 Chọn đợt khởi hành (giá tự điền theo đợt)</div>
                            <select value={form.tourGhepDepartureId||""} onChange={e=>selectDeparture(e.target.value)}
                              style={{width:"100%",border:"1.5px solid #fed7aa",borderRadius:9,padding:"9px 12px",fontSize:13,background:"#fff7ed",outline:"none",boxSizing:"border-box"}}>
                              {selectedProduct.departures.map(d=>(
                                <option key={d.id} value={d.id}>
                                  {(d.label||"Đợt")}{d.dates?` — ${d.dates}`:""}{d.sell?.adult?` · ${(d.sell.adult).toLocaleString("vi-VN")}đ/NL`:""}
                                </option>
                              ))}
                            </select>
                            <div style={{fontSize:11,color:"#9a3412",marginTop:5}}>Nhớ chọn đúng ngày khởi hành ở ô "Ngày khởi hành" bên dưới cho khớp đợt.</div>
                          </div>
                        )}
                        {!canViewGhepCost&&<div style={{marginTop:8,fontSize:11,color:"#94a3b8"}}>💡 Giá mua NCC chỉ hiển thị với người có quyền xem Tour ghép</div>}
                      </div>
                    )}

                    {/* Search + danh sách */}
                    {activeProducts.length>0&&(
                      <>
                        <div style={{position:"relative",marginBottom:10}}>
                          <i className="ti ti-search" style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"#94a3b8",fontSize:15}}/>
                          <input value={ghepSearch} onChange={e=>setGhepSearch(e.target.value)}
                            placeholder="Tìm theo tên tour, điểm đến, đối tác..."
                            style={{width:"100%",border:"1.5px solid #bae6fd",borderRadius:9,padding:"9px 12px 9px 34px",fontSize:13,outline:"none",background:"#fff",boxSizing:"border-box"}}/>
                        </div>
                        {!selectedProduct&&(
                          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,maxHeight:240,overflowY:"auto"}}>
                            {filteredProducts.length===0&&<div style={{gridColumn:"1/-1",textAlign:"center",color:"#94a3b8",padding:16,fontSize:13}}>Không tìm thấy sản phẩm</div>}
                            {filteredProducts.map(p=>(
                              <div key={p.id} onClick={()=>selectProduct(p)}
                                style={{background:"#fff",borderRadius:9,padding:12,cursor:"pointer",border:"1.5px solid #e2e8f0",transition:"all .15s"}}
                                onMouseEnter={e=>{e.currentTarget.style.border="1.5px solid #0891b2";e.currentTarget.style.background="#f0f9ff";}}
                                onMouseLeave={e=>{e.currentTarget.style.border="1.5px solid #e2e8f0";e.currentTarget.style.background="#fff";}}>
                                <div style={{fontWeight:700,fontSize:13,color:"#0c4a6e",marginBottom:4}}>{p.name}</div>
                                <div style={{fontSize:11,color:"#64748b",marginBottom:6}}>{p.destination||""}{p.duration?` · ${p.duration}`:""}{p.partnerName?` · ${p.partnerName}`:""}</div>
                                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                                  <span style={{fontSize:13,fontWeight:700,color:"#2563eb"}}>{(p.sellPrices?.adult||0).toLocaleString("vi-VN")}₫/NL</span>
                                  <span style={{background:"#eff6ff",color:"#2563eb",borderRadius:99,fontSize:10,padding:"2px 6px",fontWeight:600}}>{p.type==="international"?"🌍 QT":"🏔 NĐ"}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })()}

              {/* Tên dịch vụ */}
              <label style={labelStyle}>{isCombo?"Tên Combo (đã tự sinh ở trên)":"Tên dịch vụ / Tour"} *</label>
              <input value={isCombo?(form.comboName||autoComboName):form.tourName} onChange={e=>isCombo?set("comboName",e.target.value):set("tourName",e.target.value)} placeholder={isCombo?(autoComboName||"Nhập tên combo…"):"Nhập tên dịch vụ / tour…"} style={{...inputStyle("tourName"),marginBottom:14}}/>
              {errors.tourName&&<div style={{color:"#ef4444",fontSize:11,marginTop:-10,marginBottom:10}}>{errors.tourName}</div>}

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:16}}>
                <div>
                  <label style={labelStyle}>Ngày khởi hành *</label>
                  <input type="date" value={form.departDate} onChange={e=>set("departDate",e.target.value)} style={inputStyle("departDate")}/>
                  {errors.departDate&&<div style={{color:"#ef4444",fontSize:11,marginTop:3}}>{errors.departDate}</div>}
                </div>
                <div><label style={labelStyle}>Ngày về</label><input type="date" value={form.returnDate} onChange={e=>set("returnDate",e.target.value)} style={inputStyle("returnDate")}/></div>
                <div>
                  <label style={labelStyle}>Nhân viên phụ trách</label>
                  <select value={form.sale} onChange={e=>set("sale",e.target.value)} style={inputStyle("sale")}>
                    {staffOptions.map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Số lượng & đơn giá — ẩn input đơn giá khi là Combo (đã có panel combo) */}
              <div style={{background:"#f8fafc",borderRadius:10,padding:16,marginBottom:16}}>
                <div style={{fontWeight:700,fontSize:13,marginBottom:12,color:"#374151"}}>
                  {isCombo?"Số lượng khách":"Số lượng & Đơn giá khách"}
                </div>
                {[["Người lớn (≥18t)","adultQty","adultPrice"],["Trẻ em 10–18t","child10Qty","child10Price"],["Trẻ em 5–10t","child5Qty","child5Price"],["Trẻ em 2–5t","child2Qty","child2Price"],["Em bé <2t","infantQty","infantPrice"]].map(([label,qKey,pKey])=>(
                  <div key={qKey} style={{display:"grid",gridTemplateColumns:"140px 80px"+(isCombo?"":" 1fr"),gap:10,alignItems:"center",marginBottom:8}}>
                    <span style={{fontSize:13,color:"#374151"}}>{label}</span>
                    <input type="number" min={0} value={form[qKey]} onChange={e=>set(qKey,e.target.value)} style={{border:"1px solid #e2e8f0",borderRadius:7,padding:"6px 8px",fontSize:13,width:"100%"}}/>
                    {!isCombo&&<NumberInput value={fmtNum(form[pKey])?parseNum(fmtNum(form[pKey])):0} onChange={v=>set(pKey,v)} placeholder="Đơn giá (VD: 1.500.000)" style={{...inputStyle(pKey)}}/>}
                  </div>
                ))}
                {errors.adultPrice&&!isCombo&&<div style={{color:"#ef4444",fontSize:11,marginTop:4}}>{errors.adultPrice}</div>}
                <div style={{display:"flex",justifyContent:"space-between",marginTop:10,paddingTop:10,borderTop:"1px solid #e2e8f0"}}>
                  <span style={{fontWeight:700,fontSize:13}}>{isCombo?"Tổng Combo":"Tổng cộng tạm tính"}</span>
                  <span style={{fontWeight:800,fontSize:15,color:isCombo?"#7c3aed":"#1e3a8a"}}>{fmtMoney(totalPrice)}</span>
                </div>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                <div>
                  <label style={labelStyle}>Giá vốn (NCC dự kiến){isTourGhep&&!canViewGhepCost&&<span style={{color:"#dc2626",fontWeight:400}}> — ẩn</span>}</label>
                  {(!isTourGhep||canViewGhepCost)
                    ? <NumberInput value={form.costPrice||0} onChange={v=>set("costPrice",v)} placeholder="VD: 1.200.000" style={{...inputStyle("costPrice")}}/>
                    : <div style={{padding:"9px 12px",background:"#f1f5f9",borderRadius:8,fontSize:13,color:"#94a3b8"}}>Bạn không có quyền xem giá vốn tour ghép</div>
                  }
                </div>
                <div><label style={labelStyle}>Tiền cọc ban đầu</label><NumberInput value={form.depositAmount||0} onChange={v=>set("depositAmount",v)} placeholder="VD: 500.000" style={{...inputStyle("depositAmount")}}/></div>
              </div>
              {dupOrder&&(
                <div style={{background:"#fef9c3",borderRadius:8,padding:"10px 14px",marginTop:14,fontSize:12,color:"#92400e",fontWeight:600}}>
                  ⚠️ Khách đã có đơn {dupOrder.id} cùng ngày khởi hành
                </div>
              )}
            </div>
          )}

          {step===3&&(
            <div>
              <div style={{fontWeight:700,marginBottom:16,fontSize:15,color:"#1e293b"}}>🔍 Kiểm soát trước khi tạo đơn</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
                {[
                  ["Khách hàng",form.customerName],
                  ["SĐT",form.customerPhone],
                  ["Loại dịch vụ",SERVICE_TYPES.find(s=>s.id===form.service)?.label],
                  ["Tên",isCombo?(form.comboName||autoComboName||"—"):form.tourName],
                  ["Ngày đi",form.departDate||"—"],
                  ["Số khách",pax+" người"],
                  ["Tổng tiền",(totalPrice||0).toLocaleString("vi-VN")+"đ"],
                  ["Nhân viên",form.sale],
                ].map(([k,v])=>(
                  <div key={k} style={{background:"#f8fafc",borderRadius:8,padding:"10px 12px"}}>
                    <div style={{fontSize:11,color:"#94a3b8"}}>{k}</div>
                    <div style={{fontSize:13,fontWeight:600,marginTop:2}}>{v||"—"}</div>
                  </div>
                ))}
              </div>

              {/* Combo breakdown */}
              {isCombo&&comboEnabledItems.length>0&&(
                <div style={{background:"#faf5ff",border:"1px solid #e9d5ff",borderRadius:10,padding:14,marginBottom:16}}>
                  <div style={{fontWeight:700,fontSize:12,color:"#7c3aed",marginBottom:10}}>📦 Chi tiết Combo</div>
                  {comboEnabledItems.map(([key,comp])=>(
                    <div key={key} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid #f3e8ff",fontSize:13}}>
                      <span style={{color:"#374151"}}>{comp.icon} {comp.label}</span>
                      <span style={{fontWeight:600,color:"#7c3aed"}}>{fmtMoney(fmtNum(comp.priceAdult)*fmtNum(form.adultQty))}</span>
                    </div>
                  ))}
                  {fmtNum(form.comboDiscount||0)>0&&(
                    <div style={{display:"flex",justifyContent:"space-between",padding:"5px 0",fontSize:13,color:"#dc2626"}}>
                      <span>Chiết khấu</span>
                      <span>−{fmtMoney(fmtNum(form.comboDiscount||0))}</span>
                    </div>
                  )}
                  <div style={{display:"flex",justifyContent:"space-between",paddingTop:8,marginTop:4,borderTop:"1px solid #e9d5ff",fontWeight:800,fontSize:14,color:"#7c3aed"}}>
                    <span>Tổng Combo</span>
                    <span>{fmtMoney(comboTotal)}</span>
                  </div>
                </div>
              )}

              <textarea value={form.note} onChange={e=>set("note",e.target.value)} rows={3} placeholder="Ghi chú nội bộ: yêu cầu đặc biệt, dị ứng, phòng..." style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:8,padding:"10px 12px",fontSize:13,boxSizing:"border-box",resize:"vertical"}}/>
              {checklistDone<checklist.length&&(
                <div style={{background:"#fef9c3",borderRadius:8,padding:"10px 14px",marginTop:14,fontSize:12,color:"#92400e",fontWeight:600}}>
                  ⚠️ Còn {checklist.length-checklistDone} tiêu chí chưa hoàn thành — xem cột bên phải
                </div>
              )}
            </div>
          )}

          <div style={{display:"flex",gap:10,marginTop:24,paddingTop:20,borderTop:"1px solid #f1f5f9"}}>
            {step>1?<button onClick={goBack} style={{background:"#f1f5f9",border:"none",borderRadius:9,padding:"11px 22px",cursor:"pointer",fontWeight:600,fontSize:13}}>← Quay lại</button>
              :<button onClick={onCancel} style={{background:"#f1f5f9",border:"none",borderRadius:9,padding:"11px 22px",cursor:"pointer",fontWeight:600,fontSize:13}}>Hủy</button>}
            <div style={{flex:1}}/>
            {step<3?<button onClick={goNext} style={{background:"#1e3a8a",color:"#fff",border:"none",borderRadius:9,padding:"11px 26px",cursor:"pointer",fontWeight:700,fontSize:13}}>Tiếp tục →</button>
              :<button onClick={handleSave} style={{background:"#16a34a",color:"#fff",border:"none",borderRadius:9,padding:"11px 26px",cursor:"pointer",fontWeight:700,fontSize:13}}>✓ Tạo đơn hàng</button>}
          </div>
        </div>

        {/* Right sidebar */}
        <div>
          <div style={{background:"#fff",borderRadius:14,padding:18,boxShadow:"0 1px 6px rgba(0,0,0,.07)",marginBottom:14}}>
            <div style={{fontSize:11,fontWeight:700,color:"#94a3b8",letterSpacing:.5,marginBottom:12,textTransform:"uppercase"}}>Kiểm tra nhanh</div>
            {checklist.map(c=>(
              <div key={c.label} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 0",fontSize:13}}>
                <span style={{color:c.ok?"#16a34a":"#dc2626",fontWeight:800}}>{c.ok?"✓":"✗"}</span>
                <span style={{color:c.ok?"#374151":"#94a3b8"}}>{c.label}</span>
              </div>
            ))}
          </div>
          <div style={{background:"#fff",borderRadius:14,padding:18,boxShadow:"0 1px 6px rgba(0,0,0,.07)",marginBottom:14}}>
            <div style={{fontSize:11,fontWeight:700,color:"#94a3b8",letterSpacing:.5,marginBottom:8,textTransform:"uppercase"}}>Doanh thu dự kiến</div>
            <div style={{fontSize:24,fontWeight:800,color:isCombo?"#7c3aed":"#1e3a8a"}}>{fmtMoney(totalPrice)}</div>
            <div style={{fontSize:12,color:"#64748b",marginTop:4}}>đồng · Lãi {profitPct.toFixed(0)}%</div>
            <div style={{background:"#f1f5f9",borderRadius:6,height:8,marginTop:10}}>
              <div style={{background:profitPct>=15?"#16a34a":profitPct>=5?"#d97706":"#dc2626",height:8,borderRadius:6,width:Math.min(100,Math.max(0,profitPct*2))+"%",transition:"width .4s"}}/>
            </div>
          </div>
          {/* Combo mini-summary in sidebar */}
          {isCombo&&comboEnabledItems.length>0&&(
            <div style={{background:"#faf5ff",border:"1px solid #e9d5ff",borderRadius:12,padding:14}}>
              <div style={{fontSize:11,fontWeight:700,color:"#7c3aed",letterSpacing:.5,marginBottom:10,textTransform:"uppercase"}}>Thành phần Combo</div>
              {comboEnabledItems.map(([key,comp])=>(
                <div key={key} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontSize:12}}>
                  <span style={{color:"#374151"}}>{comp.icon} {comp.label}</span>
                  <span style={{fontWeight:600,color:"#7c3aed"}}>{fmtMoney(fmtNum(comp.priceAdult))}<span style={{fontSize:10,color:"#94a3b8"}}>/NL</span></span>
                </div>
              ))}
              {fmtNum(form.comboDiscount||0)>0&&(
                <div style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontSize:12,color:"#dc2626"}}>
                  <span>CK</span><span>−{fmtMoney(fmtNum(form.comboDiscount||0))}</span>
                </div>
              )}
              <div style={{borderTop:"1px solid #e9d5ff",marginTop:6,paddingTop:6,display:"flex",justifyContent:"space-between",fontWeight:700,fontSize:13,color:"#7c3aed"}}>
                <span>Tổng × {fmtNum(form.adultQty)} NL</span>
                <span>{fmtMoney(comboTotal)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function QuickSaleForm({onSave,onCancel,customers=[],suppliers=[],currentUser,userAccounts=[],tourGhepProducts=[]}){
  const QUICK_SERVICES = SERVICE_TYPES.filter(s=>["flight","hotel","cruise","ticket","tour_ghep"].includes(s.id));
  const [f,setF] = React.useState({
    service:"flight", customerName:"", customerPhone:"", customerId:"",
    desc:"", departDate:"", guests:1, nccId:"", nccName:"",
    sellTotal:0, costTotal:0, depositAmount:0, sale:currentUser?.name||"",
    tgpId:"", tgpDepId:"",
  });
  const set=(k,v)=>setF(p=>({...p,[k]:v}));
  const profit=(Number(f.sellTotal)||0)-(Number(f.costTotal)||0);
  const [nccSearch,setNccSearch]=React.useState("");

  // Lọc NCC theo loại dịch vụ đang chọn
  const SERVICE_NCC_TYPES={
    flight:["Hàng không"],
    hotel:["Khách sạn","Resort","Villa","Homestay","Farmstay","Bungalow","Nhà nghỉ","Khu sinh thái"],
    cruise:["Du thuyền ngày","Du thuyền đêm"],
    ticket:["Vé tham quan","Vé vui chơi / Giải trí"],
    tour_ghep:["Tour ghép Quốc tế","Tour ghép Nội địa","Landtour Quốc tế","Landtour Nội địa"],
  };
  const filteredSuppliers=React.useMemo(()=>{
    const want=SERVICE_NCC_TYPES[f.service]||[];
    let list=(suppliers||[]);
    const byType=list.filter(s=>{
      const lh=Array.isArray(s.loai_hinh)?s.loai_hinh:(s.loai_hinh?[s.loai_hinh]:[]);
      return lh.some(t=>want.includes(t));
    });
    let base=byType.length?byType:list; // không có NCC khớp loại → hiện tất cả để không bị kẹt
    if(nccSearch.trim()){const q=nccSearch.toLowerCase();base=base.filter(s=>((s.ten||s.name||"")).toLowerCase().includes(q));}
    return base;
  },[suppliers,f.service,nccSearch]);

  const canSeeGhepCost=canSeeTourGhepSensitive(currentUser);
  // Áp giá tour ghép theo sản phẩm + đợt + số khách
  const applyTgp=(prod,depId,guests)=>{
    if(!prod){return;}
    const g=Number(guests)||1;
    const deps=Array.isArray(prod.departures)?prod.departures:[];
    let sell=prod.sellPrices,buy=prod.buyPrices;
    if(prod.useSchedule&&deps.length){
      const d=deps.find(x=>x.id===depId)||deps[0];
      sell=d.sell;buy=d.buy;depId=d.id;
    }
    setF(p=>({...p,
      tgpId:prod.id, tgpDepId:depId||"",
      desc:prod.name||p.desc,
      nccName:prod.partnerName||p.nccName,
      guests:g,
      sellTotal:(sell?.adult||0)*g,
      costTotal:canSeeGhepCost?((buy?.adult||0)*g):0,
    }));
  };
  const selectedTgp=(tourGhepProducts||[]).find(p=>p.id===f.tgpId);

  const staffOptions = React.useMemo(()=>{
    const names = (userAccounts||[]).filter(u=>u.active!==false&&["sale","dieu_hanh","manager","pho_giam_doc"].includes(u.role)).map(u=>u.name);
    if(currentUser?.name&&!names.includes(currentUser.name)) names.unshift(currentUser.name);
    return [...new Set(names)];
  },[userAccounts,currentUser]);

  const suggestions = f.customerName.trim().length>=1 && !f.customerId
    ? (customers||[]).filter(c=>(c.name||"").toLowerCase().includes(f.customerName.toLowerCase())||(c.phone||"").includes(f.customerName)).slice(0,5)
    : [];
  const pickCustomer=(c)=>setF(p=>({...p,customerId:c.id,customerName:c.name,customerPhone:c.phone||""}));

  const DESC_PH={ flight:"VD: Vé HAN-SGN khứ hồi · VN · 05/07", hotel:"VD: KS Vinpearl Phú Quốc · 2 đêm · phòng Deluxe", cruise:"VD: Du thuyền Hạ Long 2N1Đ · cabin Deluxe", ticket:"VD: Vé Sun World Bà Nà · 2 vé" };

  const lbl={display:"block",fontSize:11,fontWeight:700,letterSpacing:.3,marginBottom:5,color:"#64748b",textTransform:"uppercase"};
  const inp={width:"100%",border:"1px solid #e2e8f0",borderRadius:8,padding:"9px 12px",fontSize:13,boxSizing:"border-box",outline:"none"};

  const save=()=>{
    if(!f.customerName.trim()){alert("Nhập tên khách hàng");return;}
    if(!f.desc.trim()){alert("Nhập mô tả dịch vụ");return;}
    if(!(Number(f.sellTotal)>0)){alert("Nhập giá bán");return;}
    const label=QUICK_SERVICES.find(s=>s.id===f.service)?.label||f.service;
    onSave({
      service:f.service, serviceName:f.desc, serviceLabel:label, tourName:f.desc,
      customerName:f.customerName.trim(), customerPhone:f.customerPhone.trim(), customerId:f.customerId||null,
      adultQty:Number(f.guests)||1, pax:{adult:Number(f.guests)||1},
      totalPrice:Number(f.sellTotal)||0, costPrice:Number(f.costTotal)||0,
      depositAmount:Number(f.depositAmount)||0, sale:f.sale||currentUser?.name,
      departDate:f.departDate||null, nccId:f.nccId||null, nccName:f.nccName||null,
      status:"pending_payment", invoiceType:"no_invoice", customerType:"personal", source:"Bán nhanh",
      ...(f.service==="tour_ghep"&&f.tgpId ? {
        tourGhepProductId:f.tgpId, tourGhepProductName:selectedTgp?.name||f.desc,
        tourGhepDepartureId:f.tgpDepId||null, tourGhepDepartureLabel:(selectedTgp?.departures||[]).find(d=>d.id===f.tgpDepId)?.label||null,
      } : {}),
    });
  };

  return(
    <div style={{padding:24,maxWidth:760,margin:"0 auto"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
        <i className="ti ti-bolt" style={{fontSize:22,color:"#2563eb"}}/>
        <h2 style={{margin:0,fontSize:20,fontWeight:700}}>Bán nhanh</h2>
        <span style={{marginLeft:"auto",fontSize:12,color:"#94a3b8"}}>1 màn hình · vé bay / khách sạn / du thuyền / vé lẻ</span>
      </div>
      <div style={{fontSize:13,color:"#64748b",marginBottom:18}}>Đơn ít khách, dịch vụ đơn giản. Tour đoàn đông vẫn dùng "Tạo đơn" 3 bước.</div>

      <div style={{background:"#fff",borderRadius:14,padding:22,boxShadow:"0 1px 6px rgba(0,0,0,.07)"}}>
        {/* Chọn loại dịch vụ */}
        <div style={{display:"flex",gap:8,marginBottom:18,flexWrap:"wrap"}}>
          {QUICK_SERVICES.map(s=>{
            const on=f.service===s.id;
            return <button key={s.id} type="button" onClick={()=>{setNccSearch("");setF(p=>({...p,service:s.id,nccId:"",nccName:"",tgpId:"",tgpDepId:""}));}}
              style={{flex:1,minWidth:120,padding:"10px 0",borderRadius:9,cursor:"pointer",fontSize:13,fontWeight:600,
                border:`2px solid ${on?"#2563eb":"#e2e8f0"}`,background:on?"#eff6ff":"#fff",color:on?"#1d4ed8":"#64748b"}}>
              {s.icon} {s.label}</button>;
          })}
        </div>

        {/* Khách hàng */}
        <div style={{marginBottom:14,position:"relative"}}>
          <label style={lbl}>Khách hàng (gõ tên/SĐT — gợi ý từ CRM)</label>
          <div style={{display:"flex",gap:8}}>
            <input value={f.customerName} onChange={e=>setF(p=>({...p,customerName:e.target.value,customerId:""}))} placeholder="Nguyễn Văn An" style={{...inp,flex:2}}/>
            <input value={f.customerPhone} onChange={e=>set("customerPhone",e.target.value)} placeholder="0912 345 678" style={{...inp,flex:1}}/>
          </div>
          {suggestions.length>0&&(
            <div style={{position:"absolute",zIndex:20,left:0,right:0,background:"#fff",border:"1px solid #e2e8f0",borderRadius:8,marginTop:4,boxShadow:"0 4px 14px rgba(0,0,0,.1)",overflow:"hidden"}}>
              {suggestions.map(c=>(
                <div key={c.id} onClick={()=>pickCustomer(c)} style={{padding:"8px 12px",cursor:"pointer",fontSize:13,borderBottom:"0.5px solid #f1f5f9"}}
                  onMouseEnter={e=>e.currentTarget.style.background="#f0f9ff"} onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
                  <b>{c.name}</b> <span style={{color:"#94a3b8"}}>· {c.phone||"—"}</span>
                </div>
              ))}
            </div>
          )}
          {f.customerId&&<div style={{fontSize:11,color:"#16a34a",marginTop:4}}>✓ Khách có sẵn trong CRM</div>}
        </div>

        {/* Chọn sản phẩm Tour ghép (chỉ khi loại = Tour ghép) */}
        {f.service==="tour_ghep"&&(
          <div style={{background:"#f0f9ff",border:"1.5px solid #7dd3fc",borderRadius:10,padding:14,marginBottom:14}}>
            <label style={{...lbl,color:"#0369a1"}}>🔗 Chọn sản phẩm Tour ghép (giá tự tính theo số khách)</label>
            <select value={f.tgpId} onChange={e=>{const prod=(tourGhepProducts||[]).find(x=>x.id===e.target.value);applyTgp(prod,"",f.guests);}} style={inp}>
              <option value="">— Chọn tour ghép —</option>
              {(tourGhepProducts||[]).filter(p=>p.active!==false).map(p=>(
                <option key={p.id} value={p.id}>{p.type==="international"?"🌍":"🏔"} {p.name} · {(p.sellPrices?.adult||0).toLocaleString("vi-VN")}đ/khách</option>
              ))}
            </select>
            {selectedTgp&&selectedTgp.useSchedule&&Array.isArray(selectedTgp.departures)&&selectedTgp.departures.length>0&&(
              <select value={f.tgpDepId} onChange={e=>applyTgp(selectedTgp,e.target.value,f.guests)} style={{...inp,marginTop:8,background:"#fff7ed",border:"1.5px solid #fed7aa"}}>
                {selectedTgp.departures.map(d=>(
                  <option key={d.id} value={d.id}>{(d.label||"Đợt")}{d.dates?` — ${d.dates}`:""}{d.sell?.adult?` · ${(d.sell.adult).toLocaleString("vi-VN")}đ/khách`:""}</option>
                ))}
              </select>
            )}
            {selectedTgp&&<div style={{fontSize:11,color:"#0369a1",marginTop:6}}>💡 Phù hợp khách mua lẻ 2-3 người. Đổi "Số khách" bên dưới, giá tự nhân lại.</div>}
          </div>
        )}

        {/* Mô tả dịch vụ */}
        <div style={{marginBottom:14}}>
          <label style={lbl}>Mô tả dịch vụ *</label>
          <input value={f.desc} onChange={e=>set("desc",e.target.value)} placeholder={DESC_PH[f.service]} style={inp}/>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:14}}>
          <div><label style={lbl}>Ngày khởi hành/sử dụng</label><input type="date" value={f.departDate} onChange={e=>set("departDate",e.target.value)} style={inp}/></div>
          <div><label style={lbl}>Số khách</label><input type="number" min={1} value={f.guests} onChange={e=>{const g=e.target.value; if(f.service==="tour_ghep"&&selectedTgp){applyTgp(selectedTgp,f.tgpDepId,g);}else{set("guests",g);}}} style={inp}/></div>
          <div>
            <label style={lbl}>Nhà cung cấp <span style={{color:"#94a3b8",fontWeight:400,textTransform:"none"}}>({filteredSuppliers.length})</span></label>
            <input value={nccSearch} onChange={e=>setNccSearch(e.target.value)} placeholder="Tìm NCC…" style={{...inp,marginBottom:6,fontSize:12}}/>
            <select value={f.nccId} onChange={e=>{const s=(suppliers||[]).find(x=>x.id===e.target.value);setF(p=>({...p,nccId:e.target.value,nccName:s?(s.ten||s.name||""):""}));}} style={inp}>
              <option value="">— Chọn NCC —</option>
              {filteredSuppliers.map(s=><option key={s.id} value={s.id}>{s.ten||s.name}</option>)}
            </select>
          </div>
        </div>

        {/* Tiền */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:14,alignItems:"end"}}>
          <div><label style={{...lbl,color:"#A32D2D"}}>Tổng giá vốn (NCC)</label><NumberInput value={f.costTotal} onChange={v=>set("costTotal",v)} placeholder="VD: 2.600.000" style={inp}/></div>
          <div><label style={{...lbl,color:"#0F6E56"}}>Tổng giá bán (KH) *</label><NumberInput value={f.sellTotal} onChange={v=>set("sellTotal",v)} placeholder="VD: 3.200.000" style={inp}/></div>
          <div style={{background:profit>=0?"#FAEEDA":"#fee2e2",borderRadius:8,padding:"8px 12px",textAlign:"right"}}>
            <div style={{fontSize:11,color:profit>=0?"#854F0B":"#dc2626",fontWeight:700}}>LÃI TẠM TÍNH</div>
            <div style={{fontSize:17,fontWeight:800,color:profit>=0?"#854F0B":"#dc2626"}}>{profit>=0?"+":""}{profit.toLocaleString("vi-VN")}đ</div>
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
          <div><label style={lbl}>Thu/cọc ngay (tùy chọn)</label><NumberInput value={f.depositAmount} onChange={v=>set("depositAmount",v)} placeholder="VD: 1.000.000" style={inp}/></div>
          <div><label style={lbl}>Phụ trách</label>
            <select value={f.sale} onChange={e=>set("sale",e.target.value)} style={inp}>
              {staffOptions.map(n=><option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>

        <div style={{display:"flex",gap:10}}>
          <button type="button" onClick={save} style={{flex:1,background:"#2563eb",color:"#fff",border:"none",borderRadius:10,padding:"12px 0",cursor:"pointer",fontSize:14,fontWeight:700}}>
            ✓ Lưu đơn (1 phát xong)
          </button>
          <button type="button" onClick={onCancel} style={{padding:"12px 22px",background:"#f1f5f9",border:"none",borderRadius:10,cursor:"pointer",fontSize:14,fontWeight:600}}>Hủy</button>
        </div>
      </div>
    </div>
  );
}

function OrderList({orders,vouchers,onView,onCreate,onQuickSale,currentRole,currentUser}){
  const [search,setSearch]=React.useState("");
  const [filterStatus,setFilterStatus]=React.useState("all");
  const [sortBy,setSortBy]=React.useState("newest");

  const STATUS_LABEL={pending_payment:"Chờ thanh toán",partial_paid:"Đã cọc",full_paid:"Đã thu đủ",confirmed:"Đã xác nhận",in_progress:"Đang chạy",closed:"Đã đóng",cancelled:"Đã hủy"};
  const STATUS_COLOR={pending_payment:{bg:"#fef9c3",color:"#92400e"},partial_paid:{bg:"#eff6ff",color:"#2563eb"},full_paid:{bg:"#dcfce7",color:"#166534"},confirmed:{bg:"#dbeafe",color:"#1d4ed8"},in_progress:{bg:"#dcfce7",color:"#15803d"},closed:{bg:"#f1f5f9",color:"#475569"},cancelled:{bg:"#fee2e2",color:"#dc2626"}};

  const myOrders=React.useMemo(()=>{
    let list=[...orders];
    if(currentRole==="sale") list=list.filter(o=>o.sale===currentUser?.name);
    if(search.trim()){const q=search.toLowerCase();list=list.filter(o=>o.id?.toLowerCase().includes(q)||o.customerName?.toLowerCase().includes(q)||o.customerPhone?.includes(q)||o.tourName?.toLowerCase().includes(q));}
    if(filterStatus!=="all") list=list.filter(o=>o.status===filterStatus);
    if(sortBy==="newest") list.sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0));
    else if(sortBy==="depart") list.sort((a,b)=>new Date(a.departDate||0)-new Date(b.departDate||0));
    else if(sortBy==="value") list.sort((a,b)=>(b.totalPrice||0)-(a.totalPrice||0));
    return list;
  },[orders,search,filterStatus,sortBy,currentRole,currentUser]);

  const summary=React.useMemo(()=>{
    const base=currentRole==="sale"?orders.filter(o=>o.sale===currentUser?.name):orders;
    return {
      total:base.length,
      pending:base.filter(o=>o.status==="pending_payment").length,
      active:base.filter(o=>["confirmed","in_progress"].includes(o.status)).length,
      revenue:base.filter(o=>o.status==="closed").reduce((s,o)=>s+(o.totalPrice||0),0),
    };
  },[orders,currentRole,currentUser]);

  const fmtM=(n)=>{const a=Math.abs(n||0),s=(n||0)<0?"-":"";if(a>=1e9)return s+(a/1e9).toFixed(1)+"tỷ";return s+Math.round(a).toLocaleString("vi-VN")+"đ";};
  const debt=(o)=>(o.totalPrice||o.pricing?.totalRevenue||0)-(o.totalPaid||0);

  return(
    <div style={{padding:24}}>
      {/* Summary cards */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
        {[["Tổng đơn",summary.total,"#2563eb"],["Chờ thu",summary.pending,"#d97706"],["Đang chạy",summary.active,"#16a34a"],["Doanh thu",fmtM(summary.revenue)+"₫","#7c3aed"]].map(([label,val,color])=>(
          <div key={label} style={{background:"#fff",borderRadius:12,padding:"16px 18px",boxShadow:"0 1px 6px rgba(0,0,0,.07)"}}>
            <div style={{fontSize:12,color:"#64748b",fontWeight:600}}>{label}</div>
            <div style={{fontSize:22,fontWeight:800,color,marginTop:4}}>{val}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
        <div style={{position:"relative",flex:1,minWidth:200}}>
          <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"#94a3b8"}}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Tìm mã đơn, tên khách, SĐT, tour..."
            style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:9,padding:"9px 12px 9px 32px",fontSize:13,boxSizing:"border-box"}}/>
        </div>
        <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={{border:"1px solid #e2e8f0",borderRadius:9,padding:"9px 12px",fontSize:13,background:"#fff"}}>
          <option value="all">Tất cả trạng thái</option>
          {Object.entries(STATUS_LABEL).map(([k,v])=><option key={k} value={k}>{v}</option>)}
        </select>
        <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{border:"1px solid #e2e8f0",borderRadius:9,padding:"9px 12px",fontSize:13,background:"#fff"}}>
          <option value="newest">Mới nhất</option>
          <option value="depart">Ngày đi gần nhất</option>
          <option value="value">Giá trị cao nhất</option>
        </select>
        {onQuickSale&&<button onClick={onQuickSale} style={{background:"#fff",color:"#2563eb",border:"2px solid #2563eb",borderRadius:9,padding:"9px 16px",cursor:"pointer",fontWeight:700,fontSize:13,whiteSpace:"nowrap"}}>
          ⚡ Bán nhanh
        </button>}
        <button onClick={onCreate} style={{background:"#2563eb",color:"#fff",border:"none",borderRadius:9,padding:"9px 18px",cursor:"pointer",fontWeight:700,fontSize:13,whiteSpace:"nowrap"}}>
          + Tạo đơn
        </button>
      </div>

      {/* Table */}
      <div style={{background:"#fff",borderRadius:14,boxShadow:"0 1px 6px rgba(0,0,0,.07)",overflow:"hidden"}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead>
            <tr style={{background:"#f8fafc"}}>
              {["Mã đơn","Khách hàng","Tour / Dịch vụ","Ngày đi","Pax","Giá bán","Còn nợ","Trạng thái",""].map(h=>(
                <th key={h} style={{padding:"11px 14px",textAlign:"left",fontSize:12,fontWeight:700,color:"#64748b",whiteSpace:"nowrap"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {myOrders.length===0&&(
              <tr><td colSpan={9} style={{textAlign:"center",color:"#94a3b8",padding:48,fontSize:14}}>
                {search||filterStatus!=="all"?"Không có đơn nào khớp điều kiện lọc":"Chưa có đơn hàng nào"}
              </td></tr>
            )}
            {myOrders.map(o=>{
              const sc=STATUS_COLOR[o.status]||{bg:"#f1f5f9",color:"#475569"};
              const d=debt(o);
              return(
                <tr key={o.id} style={{borderTop:"1px solid #f1f5f9",cursor:"pointer",transition:"background .1s"}}
                  onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"}
                  onMouseLeave={e=>e.currentTarget.style.background=""}
                  onClick={()=>onView(o)}>
                  <td style={{padding:"12px 14px"}}>
                    <div style={{fontWeight:700,fontSize:13,color:"#2563eb"}}>{o.id}</div>
                    <div style={{fontSize:11,color:"#94a3b8"}}>{o.sale}</div>
                  </td>
                  <td style={{padding:"12px 14px"}}>
                    <div style={{fontWeight:600,fontSize:13}}>{o.customerName||(o.customer?.name)||"—"}</div>
                    <div style={{fontSize:11,color:"#94a3b8"}}>{o.customerPhone||(o.customer?.phone)||""}</div>
                  </td>
                  <td style={{padding:"12px 14px",fontSize:13,maxWidth:180}}>
                    <div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.serviceName||o.tourName||o.service||"—"}</div>
                  </td>
                  <td style={{padding:"12px 14px",fontSize:12,color:"#64748b",whiteSpace:"nowrap"}}>{o.departDate?new Date(o.departDate).toLocaleDateString("vi-VN"):"—"}</td>
                  <td style={{padding:"12px 14px",fontSize:13,textAlign:"center"}}>{typeof o.pax==="number"?o.pax:(o.adultQty||0)+(o.child10Qty||0)+(o.child5Qty||0)+(o.child2Qty||0)+(o.infantQty||0)||(o.pax?.adults||0)+(o.pax?.children||0)+(o.pax?.babies||0)||1}</td>
                  <td style={{padding:"12px 14px",fontSize:13,fontWeight:700,color:"#1e293b",whiteSpace:"nowrap"}}>{(o.totalPrice||o.pricing?.totalRevenue||0).toLocaleString("vi-VN")}₫</td>
                  <td style={{padding:"12px 14px",fontSize:13,fontWeight:700,color:d>0?"#dc2626":"#16a34a",whiteSpace:"nowrap"}}>{d>0?d.toLocaleString("vi-VN")+"₫":"✓"}</td>
                  <td style={{padding:"12px 14px"}}>
                    <span style={{background:sc.bg,color:sc.color,borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:700,whiteSpace:"nowrap"}}>
                      {STATUS_LABEL[o.status]||o.status}
                    </span>
                  </td>
                  <td style={{padding:"12px 14px"}}>
                    <button onClick={e=>{e.stopPropagation();onView(o);}} style={{background:"#eff6ff",color:"#2563eb",border:"none",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontSize:12,fontWeight:600}}>Xem →</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{textAlign:"right",fontSize:12,color:"#94a3b8",marginTop:8}}>{myOrders.length} đơn</div>
    </div>
  );
}

function PassengerPanel({order,onUpdate,pushNotif,customers=[]}){
  const EMPTY={name:"",dob:"",cccd:"",cccdImg:"",phone:"",type:"adult",gender:"",nationality:"Việt Nam",note:"",heightGroup:""};
  const TYPE_LABEL={adult:"Người lớn",child_10plus:"Trẻ em 10–18t",child_5to10:"Trẻ em 5–10t",child_2to5:"Trẻ em 2–5t",infant:"Em bé <2t"};
  const TYPE_COLOR={adult:"#185FA5",child_10plus:"#0F6E56",child_5to10:"#854F0B",child_2to5:"#534AB7",infant:"#A32D2D"};
  const TYPE_BG={adult:"#E6F1FB",child_10plus:"#E1F5EE",child_5to10:"#FAEEDA",child_2to5:"#EEE9FF",infant:"#FCEBEB"};
  const CCCD_REQUIRED=["adult","child_10plus"];
  const CCCD_WARN=["child_5to10"];
  const HEIGHT_OPTS=[["","— Không áp dụng"],["under1m","Dưới 1m"],["1to1.4m","1m – 1,4m"],["over1.4m","Trên 1,4m"]];

  const passengers=order?.passengers||[];
  const [panel,setPanel]=React.useState("list"); // "list"|"add"|"import"
  const [editIdx,setEditIdx]=React.useState(null);
  const [form,setForm]=React.useState({...EMPTY});
  const [custSearch,setCustSearch]=React.useState("");
  const [custOpen,setCustOpen]=React.useState(false);
  const [importRows,setImportRows]=React.useState(null); // null | parsed[]
  const [importErr,setImportErr]=React.useState("");
  const [lightbox,setLightbox]=React.useState(null); // base64 or URL to show fullscreen

  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const fmtDate=(s)=>s?new Date(s).toLocaleDateString("vi-VN"):"—";

  const suggestType=(dob)=>{
    if(!dob||!order?.departDate) return null;
    const y=(new Date(order.departDate)-new Date(dob))/(365.25*864e5);
    if(y>=18) return "adult";
    if(y>=10) return "child_10plus";
    if(y>=5) return "child_5to10";
    if(y>=2) return "child_2to5";
    return "infant";
  };

  const missingCccdReq=passengers.filter(p=>CCCD_REQUIRED.includes(p.type)&&!p.cccd).length;
  const missingCccdWarn=passengers.filter(p=>CCCD_WARN.includes(p.type)&&!p.cccd).length;
  const missingDob=passengers.filter(p=>!p.dob).length;
  const adults=passengers.filter(p=>p.type==="adult").length;
  const children=passengers.filter(p=>["child_10plus","child_5to10","child_2to5"].includes(p.type)).length;
  const babies=passengers.filter(p=>p.type==="infant").length;

  const custResults=custSearch.trim().length>=1
    ? customers.filter(c=>{
        const q=custSearch.toLowerCase();
        return (c.name||"").toLowerCase().includes(q)||(c.phone||"").includes(q)||(c.cccd||"").includes(q);
      }).slice(0,8)
    : [];

  const fillFromCustomer=(c)=>{
    setForm(f=>({...f,
      name: c.name||f.name,
      phone: c.phone||f.phone,
      cccd: c.cccd||f.cccd,
      dob: c.dob||f.dob,
      gender: c.gender||f.gender,
      nationality: c.nationality||f.nationality||"Việt Nam",
    }));
    setCustSearch("");
    setCustOpen(false);
  };

  const openAdd=()=>{setEditIdx(null);setForm({...EMPTY});setCustSearch("");setCustOpen(false);setPanel("add");};
  const openEdit=(i)=>{setEditIdx(i);setForm({...EMPTY,...passengers[i]});setCustSearch("");setCustOpen(false);setPanel("add");};
  const openFromCustomer=()=>{
    setEditIdx(null);
    setForm({...EMPTY,
      name: order?.customerName||"",
      phone: order?.customerPhone||"",
      cccd: order?.customerCccd||"",
      dob: order?.customerDob||"",
      type: "adult",
    });
    setPanel("add");
  };
  const cancelForm=()=>{setPanel("list");setEditIdx(null);};

  const save=()=>{
    if(!form.name.trim()) return pushNotif&&pushNotif("Nhập họ tên hành khách","error");
    if(CCCD_REQUIRED.includes(form.type)&&!form.cccd.trim()&&!window.confirm("Hành khách "+form.name+" chưa có CCCD/Hộ chiếu — vẫn lưu?")) return;
    const list=[...passengers];
    if(editIdx!==null) list[editIdx]={...form};
    else list.push({...form});
    onUpdate&&onUpdate({...order,passengers:list});
    pushNotif&&pushNotif(editIdx!==null?"Đã cập nhật hành khách":"Đã thêm hành khách");
    setPanel("list");setEditIdx(null);
  };

  const remove=(i)=>{
    if(!window.confirm("Xóa hành khách "+passengers[i].name+"?")) return;
    onUpdate&&onUpdate({...order,passengers:passengers.filter((_,j)=>j!==i)});
    pushNotif&&pushNotif("Đã xóa");
  };

  // CCCD image upload → base64
  const handleCccdUpload=(e)=>{
    const file=e.target.files?.[0];
    if(!file) return;
    if(file.size>5*1024*1024) return pushNotif&&pushNotif("File tối đa 5MB","error");
    const reader=new FileReader();
    reader.onload=(ev)=>set("cccdImg",ev.target.result);
    reader.readAsDataURL(file);
  };

  // Excel import
  const handleImportFile=(e)=>{
    const file=e.target.files?.[0];
    if(!file) return;
    setImportErr("");
    parsePassengersFromFile(file).then(rows=>{
      setImportRows(rows);
    }).catch(err=>setImportErr("Không đọc được file: "+err.message));
  };

  const confirmImport=()=>{
    if(!importRows) return;
    const valid=importRows.filter(r=>!r._errors?.length).map(({_row,_errors,...r})=>({...EMPTY,...r}));
    if(!valid.length) return pushNotif&&pushNotif("Không có hàng hợp lệ","error");
    onUpdate&&onUpdate({...order,passengers:[...passengers,...valid]});
    pushNotif&&pushNotif("Đã import "+valid.length+" hành khách");
    setImportRows(null);setPanel("list");
  };

  const inp={width:"100%",border:"1px solid #e2e8f0",borderRadius:7,padding:"7px 10px",fontSize:13,boxSizing:"border-box"};

  return(
    <div style={{background:"#fff",borderRadius:14,padding:20,boxShadow:"0 1px 6px rgba(0,0,0,.07)"}}>

      {/* ── LIGHTBOX ── */}
      {lightbox&&(
        <div onClick={()=>setLightbox(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",cursor:"zoom-out"}}>
          <img src={lightbox} alt="CCCD" style={{maxWidth:"90vw",maxHeight:"90vh",borderRadius:8,boxShadow:"0 8px 40px rgba(0,0,0,.5)"}}/>
          <button onClick={()=>setLightbox(null)} style={{position:"absolute",top:20,right:28,background:"rgba(255,255,255,.15)",border:"none",color:"#fff",borderRadius:"50%",width:36,height:36,fontSize:20,cursor:"pointer"}}>×</button>
        </div>
      )}

      {/* ── HEADER BAR ── */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:8}}>
        <div>
          <div style={{fontWeight:800,fontSize:15,color:"#1e293b"}}>🪪 Danh sách hành khách ({passengers.length}/{typeof order?.pax==="object"?(order.adultQty||1):( order?.pax||"?")})</div>
          {passengers.length>0&&<div style={{fontSize:12,color:"#64748b",marginTop:2,display:"flex",gap:8,flexWrap:"wrap"}}>
            <span>{adults} NL · {children} TE · {babies} EB</span>
            {missingDob>0&&<span style={{color:"#854F0B",fontWeight:600}}>· {missingDob} thiếu ngày sinh</span>}
            {missingCccdReq>0&&<span style={{color:"#A32D2D",fontWeight:600}}>· {missingCccdReq} thiếu CCCD</span>}
            {missingCccdWarn>0&&<span style={{color:"#854F0B",fontWeight:600}}>· {missingCccdWarn} nên có CCCD</span>}
          </div>}
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          <button onClick={openAdd} style={{background:"#2563eb",color:"#fff",border:"none",borderRadius:8,padding:"7px 14px",cursor:"pointer",fontSize:12,fontWeight:700}}>+ Thêm khách</button>
          {order?.customerName&&<button onClick={openFromCustomer} style={{background:"#f0f9ff",color:"#0369a1",border:"1px solid #bae6fd",borderRadius:8,padding:"7px 14px",cursor:"pointer",fontSize:12,fontWeight:600}} title="Điền sẵn từ thông tin người mua">👤 Từ thông tin KH</button>}
          <button onClick={()=>{setPanel("import");setImportRows(null);setImportErr("");}} style={{background:"#f0fdf4",color:"#15803d",border:"1px solid #bbf7d0",borderRadius:8,padding:"7px 14px",cursor:"pointer",fontSize:12,fontWeight:600}}>📥 Import Excel</button>
          <button onClick={downloadPassengerTemplate} style={{background:"#f8fafc",color:"#475569",border:"1px solid #e2e8f0",borderRadius:8,padding:"7px 14px",cursor:"pointer",fontSize:12,fontWeight:600}}>⬇ Tải mẫu Excel</button>
          {passengers.length>0&&<button onClick={()=>exportPassengersToExcel(passengers,order)} style={{background:"#faf5ff",color:"#7c3aed",border:"1px solid #e9d5ff",borderRadius:8,padding:"7px 14px",cursor:"pointer",fontSize:12,fontWeight:600}}>📊 Xuất Excel</button>}
        </div>
      </div>

      {(missingCccdReq>0||missingCccdWarn>0||missingDob>0)&&panel==="list"&&(
        <div style={{background:"#fef9c3",borderRadius:8,padding:"8px 12px",marginBottom:12,fontSize:12,color:"#92400e",fontWeight:600,display:"flex",flexDirection:"column",gap:2}}>
          {missingCccdReq>0&&<span>⚠️ {missingCccdReq} hành khách (NL/TE≥10t) chưa có CCCD/hộ chiếu — bắt buộc bổ sung</span>}
          {missingCccdWarn>0&&<span>📋 {missingCccdWarn} trẻ em 5–10t chưa có CCCD — nên bổ sung (nếu đã làm)</span>}
          {missingDob>0&&<span>📅 {missingDob} hành khách chưa có ngày sinh</span>}
        </div>
      )}

      {/* ── FORM THÊM / SỬA ── */}
      {panel==="add"&&(
        <div style={{background:"#f8fafc",borderRadius:12,padding:16,marginBottom:16,border:"1px solid #e2e8f0"}}>
          <div style={{fontWeight:700,fontSize:13,marginBottom:12,color:"#1e293b"}}>{editIdx!==null?"✏️ Sửa thông tin hành khách":"➕ Thêm hành khách mới"}</div>
          <div style={{position:"relative",marginBottom:14,paddingBottom:14,borderBottom:"1px dashed #e2e8f0"}}>
            <label style={{display:"block",fontSize:11,fontWeight:600,marginBottom:3,color:"#374151"}}>
              Tìm hành khách từ danh sách khách hàng
              <span style={{fontWeight:400,color:"#94a3b8",marginLeft:4}}>(gõ tên, SĐT hoặc CCCD)</span>
            </label>
            <div style={{position:"relative"}}>
              <span style={{position:"absolute",left:9,top:"50%",transform:"translateY(-50%)",fontSize:13,color:"#0369a1",pointerEvents:"none"}}>🔍</span>
              <input
                value={custSearch}
                onChange={e=>{setCustSearch(e.target.value);setCustOpen(true);}}
                onFocus={()=>setCustOpen(true)}
                onBlur={()=>setTimeout(()=>setCustOpen(false),200)}
                placeholder="VD: Nguyễn Minh Tùng / 0906001359 / 031085..."
                style={{...inp,paddingLeft:30,background:"#f0f9ff",borderColor:"#bae6fd"}}
              />
            </div>
            {custOpen&&custSearch.trim().length>=1&&(
              <div style={{position:"absolute",top:"100%",left:0,right:0,background:"#fff",border:"1px solid #bae6fd",borderRadius:8,boxShadow:"0 4px 16px rgba(0,0,0,.12)",zIndex:200,maxHeight:240,overflowY:"auto",marginTop:2}}>
                {custResults.length>0?(
                  custResults.map(c=>(
                    <div key={c.id} onMouseDown={()=>fillFromCustomer(c)}
                      style={{padding:"10px 14px",cursor:"pointer",borderBottom:"1px solid #f1f5f9",display:"flex",justifyContent:"space-between",alignItems:"center"}}
                      onMouseEnter={e=>e.currentTarget.style.background="#f0f9ff"}
                      onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
                      <div>
                        <div style={{fontWeight:600,fontSize:13,color:"#1e293b"}}>{c.name}</div>
                        <div style={{fontSize:11,color:"#64748b",marginTop:1}}>{[c.phone,c.cccd,c.dob?new Date(c.dob).toLocaleDateString("vi-VN"):""].filter(Boolean).join(" · ")}</div>
                      </div>
                      <span style={{fontSize:11,color:"#0369a1",background:"#e0f2fe",borderRadius:4,padding:"3px 8px",flexShrink:0,marginLeft:8}}>Chọn →</span>
                    </div>
                  ))
                ):(
                  <div style={{padding:"14px 16px",fontSize:12,color:"#94a3b8",display:"flex",flexDirection:"column",gap:4}}>
                    <span>Không tìm thấy trong danh sách khách hàng</span>
                    <span style={{color:"#64748b"}}>Điền thông tin thủ công bên dưới để thêm hành khách mới</span>
                  </div>
                )}
              </div>
            )}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
            <div style={{gridColumn:"1/3"}}>
              <label style={{display:"block",fontSize:11,fontWeight:600,marginBottom:3,color:"#374151"}}>Họ và tên *</label>
              <input value={form.name} onChange={e=>set("name",e.target.value)} placeholder="Nguyễn Văn An" style={inp}/>
            </div>
            <div>
              <label style={{display:"block",fontSize:11,fontWeight:600,marginBottom:3,color:"#374151"}}>Ngày sinh</label>
              <input type="date" value={form.dob} onChange={e=>{
                set("dob",e.target.value);
                const suggested=suggestType(e.target.value);
                if(suggested&&suggested!==form.type) set("type",suggested);
              }} style={inp}/>
            </div>
            <div>
              <label style={{display:"block",fontSize:11,fontWeight:600,marginBottom:3,color:"#374151"}}>Loại khách (theo tuổi)</label>
              <select value={form.type} onChange={e=>set("type",e.target.value)} style={inp}>
                <option value="adult">Người lớn (≥18t)</option>
                <option value="child_10plus">Trẻ em 10–18t</option>
                <option value="child_5to10">Trẻ em 5–10t</option>
                <option value="child_2to5">Trẻ em 2–5t</option>
                <option value="infant">Em bé dưới 2t</option>
              </select>
              {form.dob&&suggestType(form.dob)&&suggestType(form.dob)!==form.type&&(
                <div style={{fontSize:10,color:"#854F0B",marginTop:2}}>
                  ⚠️ Theo ngày sinh nên là <b>{TYPE_LABEL[suggestType(form.dob)]}</b>
                  <button onMouseDown={()=>set("type",suggestType(form.dob))} style={{marginLeft:4,fontSize:10,color:"#185FA5",background:"none",border:"none",cursor:"pointer",padding:0,textDecoration:"underline"}}>Áp dụng</button>
                </div>
              )}
            </div>
            <div>
              <label style={{display:"block",fontSize:11,fontWeight:600,marginBottom:3,color:"#374151"}}>Giới tính</label>
              <select value={form.gender} onChange={e=>set("gender",e.target.value)} style={inp}>
                <option value="">-- Chọn --</option>
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
              </select>
            </div>
            <div>
              <label style={{display:"block",fontSize:11,fontWeight:600,marginBottom:3,color:"#374151"}}>Quốc tịch</label>
              <input value={form.nationality} onChange={e=>set("nationality",e.target.value)} placeholder="Việt Nam" style={inp}/>
            </div>
            <div>
              <label style={{display:"block",fontSize:11,fontWeight:600,marginBottom:3,color:"#374151"}}>Nhóm chiều cao <span style={{fontWeight:400,color:"#94a3b8"}}>(khu vui chơi)</span></label>
              <select value={form.heightGroup||""} onChange={e=>set("heightGroup",e.target.value)} style={inp}>
                {HEIGHT_OPTS.map(([v,l])=><option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label style={{display:"block",fontSize:11,fontWeight:600,marginBottom:3,color:"#374151"}}>SĐT</label>
              <input value={form.phone} onChange={e=>set("phone",e.target.value)} placeholder="09xx..." style={inp}/>
            </div>
            <div style={{gridColumn:"1/3"}}>
              <label style={{display:"block",fontSize:11,fontWeight:600,marginBottom:3,color:"#374151"}}>Số CCCD / CMND / Hộ chiếu{form.type!=="baby"?" *":""}</label>
              <input value={form.cccd} onChange={e=>set("cccd",e.target.value)} placeholder={form.type==="baby"?"Không bắt buộc":"Nhập số CCCD 12 số hoặc số HC"} style={{...inp,borderColor:form.type!=="baby"&&!form.cccd?"#fca5a5":"#e2e8f0"}}/>
            </div>
            <div>
              <label style={{display:"block",fontSize:11,fontWeight:600,marginBottom:3,color:"#374151"}}>Ảnh CCCD / Hộ chiếu</label>
              <div style={{display:"flex",gap:6,alignItems:"center"}}>
                <label style={{display:"inline-flex",alignItems:"center",gap:4,padding:"6px 10px",background:"#eff6ff",color:"#1e3a8a",border:"1px solid #bfdbfe",borderRadius:7,cursor:"pointer",fontSize:11,fontWeight:600,flexShrink:0}}>
                  📎 Upload
                  <input type="file" accept="image/*,.pdf" onChange={handleCccdUpload} style={{display:"none"}}/>
                </label>
                {form.cccdImg&&(form.cccdImg.startsWith("data:")?(
                  <img src={form.cccdImg} alt="CCCD" onClick={()=>setLightbox(form.cccdImg)} style={{height:32,borderRadius:4,cursor:"zoom-in",border:"1px solid #e2e8f0"}}/>
                ):(
                  <a href={form.cccdImg} target="_blank" rel="noreferrer" style={{fontSize:11,color:"#2563eb",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:100}}>🔗 Xem ảnh</a>
                ))}
                {form.cccdImg&&<button onClick={()=>set("cccdImg","")} style={{background:"none",border:"none",color:"#dc2626",cursor:"pointer",fontSize:11}}>✕</button>}
              </div>
              <div style={{marginTop:4}}>
                <input value={form.cccdImg&&!form.cccdImg.startsWith("data:")?form.cccdImg:""} onChange={e=>set("cccdImg",e.target.value)} placeholder="hoặc dán link Google Drive..." style={{...inp,fontSize:11,padding:"5px 8px"}}/>
              </div>
            </div>
          </div>
          <div style={{marginTop:10}}>
            <label style={{display:"block",fontSize:11,fontWeight:600,marginBottom:3,color:"#374151"}}>Ghi chú (ăn chay, dị ứng, yêu cầu đặc biệt...)</label>
            <input value={form.note} onChange={e=>set("note",e.target.value)} placeholder="VD: Ăn chay, dị ứng hải sản, cần xe lăn..." style={inp}/>
          </div>
          <div style={{display:"flex",gap:8,marginTop:12}}>
            <button onClick={save} style={{background:"#16a34a",color:"#fff",border:"none",borderRadius:7,padding:"8px 20px",cursor:"pointer",fontSize:13,fontWeight:700}}>✓ Lưu</button>
            <button onClick={cancelForm} style={{background:"#f1f5f9",color:"#475569",border:"none",borderRadius:7,padding:"8px 16px",cursor:"pointer",fontSize:13,fontWeight:600}}>Hủy</button>
          </div>
        </div>
      )}

      {/* ── IMPORT EXCEL ── */}
      {panel==="import"&&(
        <div style={{background:"#f0fdf4",borderRadius:12,padding:16,marginBottom:16,border:"1px solid #bbf7d0"}}>
          <div style={{fontWeight:700,fontSize:13,marginBottom:8,color:"#15803d"}}>📥 Import danh sách hành khách từ Excel</div>
          <div style={{fontSize:12,color:"#166534",marginBottom:10}}>File Excel cần có các cột: <b>Họ tên, Loại, Ngày sinh, CCCD, SĐT, Giới tính, Ghi chú</b>.<br/>
            Loại chấp nhận: "Người lớn" / "Trẻ em" / "Em bé". Ngày sinh định dạng DD/MM/YYYY.
          </div>
          {!importRows?(
            <label style={{display:"inline-flex",alignItems:"center",gap:6,padding:"9px 18px",background:"#15803d",color:"#fff",borderRadius:8,cursor:"pointer",fontWeight:600,fontSize:13}}>
              📂 Chọn file Excel (.xlsx, .xls)
              <input type="file" accept=".xlsx,.xls,.csv" onChange={handleImportFile} style={{display:"none"}}/>
            </label>
          ):(
            <div>
              <div style={{fontWeight:600,fontSize:13,marginBottom:8,color:"#15803d"}}>{importRows.length} dòng đọc được — {importRows.filter(r=>!r._errors?.length).length} hợp lệ · {importRows.filter(r=>r._errors?.length>0).length} lỗi</div>
              <div style={{overflowX:"auto",marginBottom:12}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                  <thead><tr style={{background:"#dcfce7"}}>
                    <th style={{padding:"6px 8px",textAlign:"left",borderBottom:"1px solid #bbf7d0"}}>Họ tên</th>
                    <th style={{padding:"6px 8px",textAlign:"left",borderBottom:"1px solid #bbf7d0"}}>Loại</th>
                    <th style={{padding:"6px 8px",textAlign:"left",borderBottom:"1px solid #bbf7d0"}}>Ngày sinh</th>
                    <th style={{padding:"6px 8px",textAlign:"left",borderBottom:"1px solid #bbf7d0"}}>CCCD</th>
                    <th style={{padding:"6px 8px",textAlign:"left",borderBottom:"1px solid #bbf7d0"}}>SĐT</th>
                    <th style={{padding:"6px 8px",textAlign:"left",borderBottom:"1px solid #bbf7d0"}}>Trạng thái</th>
                  </tr></thead>
                  <tbody>
                    {importRows.map((r,i)=>(
                      <tr key={i} style={{background:r._errors?.length?"#fef2f2":"#fff",borderBottom:"1px solid #e2e8f0"}}>
                        <td style={{padding:"6px 8px"}}>{r.name||<span style={{color:"#dc2626"}}>—</span>}</td>
                        <td style={{padding:"6px 8px"}}>{TYPE_LABEL[r.type]||r.type}</td>
                        <td style={{padding:"6px 8px"}}>{r.dob?new Date(r.dob).toLocaleDateString("vi-VN"):"—"}</td>
                        <td style={{padding:"6px 8px",fontFamily:"monospace"}}>{r.cccd||"—"}</td>
                        <td style={{padding:"6px 8px"}}>{r.phone||"—"}</td>
                        <td style={{padding:"6px 8px"}}>
                          {r._errors?.length>0?(
                            <span style={{color:"#dc2626",fontSize:11}}>⚠️ {r._errors.join(", ")}</span>
                          ):(
                            <span style={{color:"#16a34a",fontWeight:600}}>✓ OK</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={confirmImport} style={{background:"#16a34a",color:"#fff",border:"none",borderRadius:7,padding:"8px 18px",cursor:"pointer",fontSize:13,fontWeight:700}}>✓ Import {importRows.filter(r=>!r._errors?.length).length} hành khách</button>
                <button onClick={()=>{setImportRows(null);}} style={{background:"#f1f5f9",color:"#475569",border:"none",borderRadius:7,padding:"8px 14px",cursor:"pointer",fontSize:13}}>Chọn lại</button>
                <button onClick={()=>{setPanel("list");setImportRows(null);}} style={{background:"#f1f5f9",color:"#475569",border:"none",borderRadius:7,padding:"8px 14px",cursor:"pointer",fontSize:13}}>Hủy</button>
              </div>
            </div>
          )}
          {importErr&&<div style={{color:"#dc2626",fontSize:12,marginTop:8}}>{importErr}</div>}
        </div>
      )}

      {/* ── DANH SÁCH HÀNH KHÁCH ── */}
      {passengers.length===0?(
        <div style={{textAlign:"center",padding:"32px 0",color:"#94a3b8"}}>
          <div style={{fontSize:32,marginBottom:8}}>🧳</div>
          <div style={{fontSize:13}}>Chưa có hành khách nào — nhập tay hoặc import từ Excel</div>
        </div>
      ):(
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
            <thead>
              <tr style={{background:"#f8fafc",borderBottom:"2px solid #e2e8f0"}}>
                <th style={{padding:"8px 10px",textAlign:"left",fontWeight:600,color:"#64748b",fontSize:11,textTransform:"uppercase",letterSpacing:.3,width:28}}>#</th>
                <th style={{padding:"8px 10px",textAlign:"left",fontWeight:600,color:"#64748b",fontSize:11,textTransform:"uppercase",letterSpacing:.3}}>Họ và tên</th>
                <th style={{padding:"8px 10px",textAlign:"left",fontWeight:600,color:"#64748b",fontSize:11,textTransform:"uppercase",letterSpacing:.3}}>Loại</th>
                <th style={{padding:"8px 10px",textAlign:"left",fontWeight:600,color:"#64748b",fontSize:11,textTransform:"uppercase",letterSpacing:.3}}>Ngày sinh</th>
                <th style={{padding:"8px 10px",textAlign:"left",fontWeight:600,color:"#64748b",fontSize:11,textTransform:"uppercase",letterSpacing:.3}}>CCCD / HC</th>
                <th style={{padding:"8px 10px",textAlign:"center",fontWeight:600,color:"#64748b",fontSize:11,textTransform:"uppercase",letterSpacing:.3}}>Ảnh</th>
                <th style={{padding:"8px 10px",textAlign:"left",fontWeight:600,color:"#64748b",fontSize:11,textTransform:"uppercase",letterSpacing:.3}}>SĐT</th>
                <th style={{padding:"8px 10px",textAlign:"left",fontWeight:600,color:"#64748b",fontSize:11,textTransform:"uppercase",letterSpacing:.3}}>Ghi chú</th>
                <th style={{padding:"8px 10px",textAlign:"right",fontWeight:600,color:"#64748b",fontSize:11,textTransform:"uppercase",letterSpacing:.3}}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {passengers.map((p,i)=>(
                <tr key={i} style={{borderBottom:"1px solid #f1f5f9",background:editIdx===i&&panel==="add"?"#eff6ff":CCCD_REQUIRED.includes(p.type)&&!p.cccd?"#fef2f2":"#fff"}}>
                  <td style={{padding:"10px 10px",color:"#94a3b8",fontSize:12}}>{i+1}</td>
                  <td style={{padding:"10px 10px"}}>
                    <div style={{fontWeight:700,color:"#1e293b"}}>{p.name}</div>
                    {p.gender&&<div style={{fontSize:11,color:"#64748b"}}>{p.gender} · {p.nationality||"VN"}</div>}
                  </td>
                  <td style={{padding:"10px 10px"}}>
                    <span style={{display:"inline-block",background:TYPE_BG[p.type]||"#f1f5f9",color:TYPE_COLOR[p.type]||"#475569",borderRadius:12,padding:"2px 8px",fontSize:11,fontWeight:700}}>{TYPE_LABEL[p.type]||p.type}</span>
                  </td>
                  <td style={{padding:"10px 10px",color:"#475569",fontSize:12}}>{p.dob?fmtDate(p.dob):"—"}</td>
                  <td style={{padding:"10px 10px"}}>
                    {["child_2to5","infant"].includes(p.type)?(
                      <span style={{fontSize:11,color:"#94a3b8"}}>Không bắt buộc</span>
                    ):p.cccd?(
                      <span style={{fontFamily:"monospace",fontSize:12,color:"#1e293b",fontWeight:600}}>{p.cccd}</span>
                    ):CCCD_WARN.includes(p.type)?(
                      <span style={{color:"#854F0B",fontSize:11,fontWeight:600}}>📋 Nên bổ sung</span>
                    ):(
                      <span style={{color:"#A32D2D",fontSize:11,fontWeight:700}}>⚠️ Chưa có</span>
                    )}
                  </td>
                  <td style={{padding:"10px 10px",textAlign:"center"}}>
                    {p.cccdImg?(
                      p.cccdImg.startsWith("data:")?(
                        <img src={p.cccdImg} alt="CCCD" onClick={()=>setLightbox(p.cccdImg)} style={{width:36,height:26,objectFit:"cover",borderRadius:4,cursor:"zoom-in",border:"1px solid #e2e8f0"}}/>
                      ):(
                        <a href={p.cccdImg} target="_blank" rel="noreferrer" title="Xem ảnh CCCD" style={{color:"#2563eb",fontSize:16}}>🖼</a>
                      )
                    ):(
                      <label style={{cursor:"pointer",fontSize:16,opacity:.35}} title="Upload ảnh CCCD">
                        📎
                        <input type="file" accept="image/*,.pdf" style={{display:"none"}} onChange={e=>{
                          const file=e.target.files?.[0];
                          if(!file) return;
                          if(file.size>5*1024*1024) return pushNotif&&pushNotif("File tối đa 5MB","error");
                          const reader=new FileReader();
                          reader.onload=(ev)=>{
                            const list=[...passengers];
                            list[i]={...list[i],cccdImg:ev.target.result};
                            onUpdate&&onUpdate({...order,passengers:list});
                          };
                          reader.readAsDataURL(file);
                        }}/>
                      </label>
                    )}
                  </td>
                  <td style={{padding:"10px 10px",color:"#475569",fontSize:12}}>{p.phone||"—"}</td>
                  <td style={{padding:"10px 10px",color:"#64748b",fontSize:12,maxWidth:120}}><span title={p.note} style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",display:"block"}}>{p.note||"—"}</span></td>
                  <td style={{padding:"10px 10px",textAlign:"right"}}>
                    <div style={{display:"flex",gap:4,justifyContent:"flex-end"}}>
                      <button onClick={()=>openEdit(i)} style={{background:"#eff6ff",color:"#2563eb",border:"none",borderRadius:5,padding:"3px 9px",cursor:"pointer",fontSize:11,fontWeight:600}}>Sửa</button>
                      <button onClick={()=>remove(i)} style={{background:"#fef2f2",color:"#dc2626",border:"none",borderRadius:5,padding:"3px 9px",cursor:"pointer",fontSize:11,fontWeight:600}}>Xóa</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── SUMMARY FOOTER ── */}
      {passengers.length>0&&(
        <div style={{marginTop:12,padding:"10px 12px",background:"#f8fafc",borderRadius:8,display:"flex",gap:20,fontSize:12,color:"#64748b",flexWrap:"wrap"}}>
          <span>Tổng: <b style={{color:"#1e293b"}}>{passengers.length}</b> khách</span>
          {adults>0&&<span>Người lớn: <b style={{color:"#2563eb"}}>{adults}</b></span>}
          {children>0&&<span>Trẻ em: <b style={{color:"#d97706"}}>{children}</b></span>}
          {babies>0&&<span>Em bé: <b style={{color:"#7c3aed"}}>{babies}</b></span>}
          {missingCccdReq>0&&<span style={{color:"#dc2626",fontWeight:700}}>⚠️ {missingCccdReq} thiếu CCCD</span>}
          {missingCccdReq===0&&passengers.filter(p=>p.type!=="baby"&&p.type!=="infant").length>0&&<span style={{color:"#16a34a",fontWeight:700}}>✓ Đủ CCCD</span>}
        </div>
      )}
    </div>
  );
}

function OrderDetail({order,vouchers,expenses=[],refunds=[],onBack,onUpdate,onDelete,onAddVoucher,onApprove,onReject,pushNotif,currentRole,bankAccounts=[],currentUser,hdvList=[],credits=[],onUpdateCredits,bookings=[],customers=[],suppliers=[],onAddSupplier}){
  const [showDeleteConfirm,setShowDeleteConfirm]=React.useState(false);
  const [activeTab,setActiveTab]=React.useState("info");
  const [showStatusMenu,setShowStatusMenu]=React.useState(false);

  const STATUS_LABEL={pending_payment:"Chờ thanh toán",confirmed:"Đã xác nhận",in_progress:"Đang chạy",closed:"Đã đóng",cancelled:"Đã hủy"};
  const STATUS_COLOR={pending_payment:"#d97706",confirmed:"#2563eb",in_progress:"#16a34a",closed:"#475569",cancelled:"#dc2626"};
  const STATUS_BG={pending_payment:"#fef9c3",confirmed:"#dbeafe",in_progress:"#dcfce7",closed:"#f1f5f9",cancelled:"#fee2e2"};
  const NEXT_STATUSES={pending_payment:["confirmed","cancelled"],confirmed:["in_progress","cancelled"],in_progress:["closed","cancelled"],closed:[],cancelled:[]};

  const orderVouchers=(vouchers||[]).filter(v=>v.orderId===order?.id);
  const totalPaid=orderVouchers.filter(v=>v.type==="thu"&&["approved","confirmed"].includes(v.status)).reduce((s,v)=>s+(v.amount||0),0);
  const totalChi=orderVouchers.filter(v=>v.type==="chi"&&["approved","confirmed"].includes(v.status)).reduce((s,v)=>s+(v.amount||0),0);
  const nccDebt=(bookings||[]).filter(b=>b.orderId===order?.id&&b.status!=="cancelled"&&b.status!=="paid").reduce((s,b)=>s+(b.amount||0),0);
  const debt=(order?.totalPrice||0)-totalPaid;
  const profit=(order?.totalPrice||0)-totalChi-(order?.costPrice||0);
  const profitPct=order?.totalPrice?(profit/order.totalPrice*100):0;
  const profitStatus=getProfitStatus(profitPct,order?.service);
  const passengerCount=(order?.passengers||[]).length;
  const missingCccdCount=(order?.passengers||[]).filter(p=>p.type!=="baby"&&!p.cccd).length;

  const changeStatus=(status)=>{
    if(status==="confirmed"&&missingCccdCount>0){
      if(!window.confirm("Còn "+missingCccdCount+" khách thiếu CCCD. Vẫn xác nhận đơn?")) return;
    }
    onUpdate&&onUpdate({...order,status});
    setShowStatusMenu(false);
    pushNotif&&pushNotif("Cập nhật trạng thái: "+STATUS_LABEL[status]);
  };

  const fmtMoney=(n)=>(n||0).toLocaleString("vi-VN")+"₫";
  const fmtDate=(s)=>s?new Date(s).toLocaleDateString("vi-VN"):"—";

  const tabs=["info","passengers","finance","audit"];
  const totalPaxCount = typeof order?.pax==="object"
    ? (order.pax.adults||0)+(order.pax.child10||0)+(order.pax.child5||0)+(order.pax.child2||0)+(order.pax.infant||0)||(order.adultQty||1)
    : (order?.adultQty||order?.pax||1);
  const tabLabel={"info":"📋 Thông tin","passengers":"🪪 Hành khách ("+passengerCount+"/"+totalPaxCount+")","finance":"💰 Thu chi","audit":"📜 Lịch sử"};

  return(
    <div style={{padding:24,maxWidth:960,margin:"0 auto"}}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20,flexWrap:"wrap"}}>
        <button onClick={onBack} style={{background:"none",border:"none",cursor:"pointer",fontSize:20,color:"#64748b"}}>←</button>
        <div style={{flex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
            <h2 style={{margin:0,fontSize:20,fontWeight:800,color:"#1e293b"}}>{order?.id}</h2>
            <div style={{position:"relative"}}>
              <button onClick={()=>setShowStatusMenu(v=>!v)} style={{background:STATUS_BG[order?.status]||"#f1f5f9",color:STATUS_COLOR[order?.status]||"#475569",border:"none",borderRadius:20,padding:"5px 14px",cursor:"pointer",fontWeight:700,fontSize:12}}>
                {STATUS_LABEL[order?.status]||order?.status} ▾
              </button>
              {showStatusMenu&&(NEXT_STATUSES[order?.status]||[]).length>0&&(
                <div style={{position:"absolute",top:"100%",left:0,background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,boxShadow:"0 4px 16px rgba(0,0,0,.12)",zIndex:100,marginTop:4,minWidth:160}}>
                  {(NEXT_STATUSES[order?.status]||[]).map(s=>(
                    <div key={s} onClick={()=>changeStatus(s)} style={{padding:"10px 16px",cursor:"pointer",fontSize:13,fontWeight:600,color:STATUS_COLOR[s]||"#475569"}}
                      onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"} onMouseLeave={e=>e.currentTarget.style.background=""}>
                      → {STATUS_LABEL[s]}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {missingCccdCount>0&&(
              <span style={{background:"#fee2e2",color:"#dc2626",borderRadius:20,padding:"4px 12px",fontSize:11,fontWeight:700}}>⚠️ Thiếu {missingCccdCount} CCCD</span>
            )}
          </div>
          <div style={{fontSize:13,color:"#64748b",marginTop:2}}>Tạo: {fmtDate(order?.createdAt)} · NV: {order?.sale}</div>
        </div>
        {/* Nút xóa đơn — chỉ Giám đốc */}
        {currentRole==="manager"&&onDelete&&(
          <button onClick={()=>setShowDeleteConfirm(true)} style={{background:"#fef2f2",color:"#dc2626",border:"1px solid #fecaca",borderRadius:9,padding:"8px 16px",cursor:"pointer",fontWeight:700,fontSize:13,display:"flex",alignItems:"center",gap:6}}>
            <i className="ti ti-trash" style={{fontSize:16}}/> Xóa đơn
          </button>
        )}
      </div>

      {/* Modal xác nhận xóa */}
      {showDeleteConfirm&&(
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowDeleteConfirm(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{background:"#fff",borderRadius:16,padding:28,width:420,maxWidth:"90vw",textAlign:"center",boxShadow:"0 20px 60px rgba(0,0,0,.25)"}}>
            <div style={{fontSize:40,marginBottom:12}}>🗑️</div>
            <div style={{fontSize:18,fontWeight:800,color:"#0f172a",marginBottom:8}}>Xóa đơn {order?.id}?</div>
            <div style={{fontSize:14,color:"#64748b",marginBottom:8,lineHeight:1.6}}>
              Đơn của <strong>{order?.customerName}</strong> — {order?.tourName||order?.serviceName}<br/>
              Giá trị: <strong style={{color:"#dc2626"}}>{fmtMoney(order?.totalPrice)}</strong>
            </div>
            <div style={{fontSize:13,color:"#dc2626",background:"#fef2f2",borderRadius:8,padding:"10px 14px",marginBottom:20,fontWeight:600}}>
              ⚠️ Hành động này KHÔNG thể hoàn tác. Đơn sẽ bị xóa vĩnh viễn khỏi hệ thống.
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setShowDeleteConfirm(false)} style={{flex:1,padding:"11px",border:"1.5px solid #e2e8f0",borderRadius:10,background:"#fff",fontWeight:600,fontSize:14,cursor:"pointer",color:"#64748b"}}>Hủy</button>
              <button onClick={()=>{setShowDeleteConfirm(false);onDelete(order);}} style={{flex:1,padding:"11px",border:"none",borderRadius:10,background:"#dc2626",color:"#fff",fontWeight:700,fontSize:14,cursor:"pointer"}}>Xóa vĩnh viễn</button>
            </div>
          </div>
        </div>
      )}

      {/* KPI bar */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:12,marginBottom:20}}>
        {[["Doanh thu",fmtMoney(order?.totalPrice),"#2563eb"],["Đã thu (duyệt)",fmtMoney(totalPaid),"#16a34a"],["Công nợ KH",fmtMoney(debt),debt>0?"#dc2626":"#16a34a"],["Công nợ NCC",fmtMoney(nccDebt),nccDebt>0?"#dc2626":"#16a34a"],["Lợi nhuận",fmtMoney(profit),profit>0?"#7c3aed":"#dc2626"]].map(([label,val,color])=>(
          <div key={label} style={{background:"#fff",borderRadius:12,padding:"14px 16px",boxShadow:"0 1px 6px rgba(0,0,0,.07)"}}>
            <div style={{fontSize:11,color:"#64748b",fontWeight:600}}>{label}</div>
            <div style={{fontSize:17,fontWeight:800,color,marginTop:4}}>{val}</div>
          </div>
        ))}
        <div style={{background:profitStatus.bg,borderRadius:12,padding:"14px 16px",boxShadow:"0 1px 6px rgba(0,0,0,.07)"}}>
          <div style={{fontSize:11,color:profitStatus.color,fontWeight:600}}>Tỷ suất LN {profitStatus.icon}</div>
          <div style={{fontSize:17,fontWeight:800,color:profitStatus.color,marginTop:4}}>{profitPct.toFixed(1)}% · {profitStatus.label}</div>
        </div>
      </div>

      {/* Quick links bar */}
      {(()=>{
        const qlBtn=(bg,color)=>({display:"inline-flex",alignItems:"center",gap:5,padding:"5px 12px",borderRadius:20,fontSize:12,fontWeight:500,background:bg,color,border:"none",cursor:"pointer"});
        const orderBookings=(bookings||[]).filter(b=>b.orderId===order?.id&&b.status!=="cancelled");
        const orderExpenses=(expenses||[]).filter(e=>e.orderId===order?.id);
        const pendingExp=orderExpenses.filter(e=>["pending_kt","pending_gd","pending_pay"].includes(e.status));
        return(
          <div style={{display:"flex",gap:8,flexWrap:"wrap",padding:"10px 0",borderBottom:"0.5px solid #e2e8f0",marginBottom:16}}>
            {order?.customerPhone&&(()=>{
              const c=(customers||[]).find(x=>x.phone===order.customerPhone||x.sdt===order.customerPhone);
              return(<button onClick={()=>c?pushNotif?.("Xem hồ sơ KH trong CRM","info"):pushNotif?.("Khách hàng chưa có hồ sơ trong CRM","warn")} style={qlBtn("#E6F1FB","#185FA5")}><i className="ti ti-user" style={{fontSize:14}}/>Hồ sơ KH</button>);
            })()}
            {orderBookings.length===0
              ?<button onClick={()=>pushNotif?.("Chưa có booking NCC — vào module NCC để tạo","warn")} style={qlBtn("#FCEBEB","#A32D2D")}><i className="ti ti-building-off" style={{fontSize:14}}/>Chưa booking NCC</button>
              :<span style={{...qlBtn("#E1F5EE","#085041"),cursor:"default"}}><i className="ti ti-building-check" style={{fontSize:14}}/>{orderBookings.length} NCC đã booking</span>
            }
            {order?.hdvId
              ?<span style={{...qlBtn("#EEEDFE","#534AB7"),cursor:"default"}}><i className="ti ti-user-check" style={{fontSize:14}}/>HDV: {order.hdvName||(hdvList||[]).find(h=>h.id===order.hdvId)?.name||order.hdvId}</span>
              :<span style={{...qlBtn("#f8fafc","#94a3b8"),cursor:"default"}}><i className="ti ti-user-off" style={{fontSize:14}}/>Chưa có HDV</span>
            }
            {pendingExp.length>0&&<span style={{...qlBtn("#FAEEDA","#633806"),cursor:"default"}}><i className="ti ti-clock" style={{fontSize:14}}/>{pendingExp.length} phiếu chi chờ duyệt</span>}
            {pendingExp.length===0&&orderExpenses.length>0&&<span style={{...qlBtn("#E1F5EE","#085041"),cursor:"default"}}><i className="ti ti-check" style={{fontSize:14}}/>{orderExpenses.length} phiếu chi đã xử lý</span>}
          </div>
        );
      })()}

      {/* Tabs */}
      <div style={{display:"flex",gap:4,marginBottom:16,borderBottom:"2px solid #e2e8f0",paddingBottom:0}}>
        {tabs.map(t=>(
          <button key={t} onClick={()=>setActiveTab(t)} style={{padding:"10px 18px",border:"none",background:"none",cursor:"pointer",fontWeight:600,fontSize:13,color:activeTab===t?"#2563eb":"#64748b",borderBottom:activeTab===t?"2px solid #2563eb":"2px solid transparent",marginBottom:-2,transition:"all .15s"}}>
            {tabLabel[t]}
          </button>
        ))}
      </div>

      {/* INFO TAB */}
      {activeTab==="info"&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          <div style={{background:"#fff",borderRadius:14,padding:20,boxShadow:"0 1px 6px rgba(0,0,0,.07)"}}>
            <div style={{fontWeight:700,marginBottom:14,fontSize:14,color:"#374151"}}>👤 Khách hàng</div>
            {[["Họ tên",order?.customerName||order?.customer],["SĐT",order?.customerPhone],["Email",order?.customerEmail||"—"],["Nguồn",order?.source||"—"]].map(([k,v])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid #f1f5f9",fontSize:13}}>
                <span style={{color:"#64748b"}}>{k}</span><span style={{fontWeight:600}}>{v||"—"}</span>
              </div>
            ))}
          </div>
          {(()=>{
            const svc=(order?.service||order?.serviceType||"").toLowerCase();
            const isAirline=svc.includes("ve_may_bay")||svc.includes("may_bay");
            const isCruise=svc.includes("cruise")||svc.includes("thuyen");
            const isCombo=svc.includes("hotel_flight")||svc.includes("combo");
            const isHotel=!isCombo&&(svc.includes("hotel")||svc.includes("khach_san"));
            // pax có thể là số hoặc object {adults,children,babies}
            const paxStr=typeof order?.pax==="object"&&order?.pax!==null
              ? [order.pax.adults&&`${order.pax.adults} NL`,order.pax.children&&`${order.pax.children} TE`,order.pax.babies&&`${order.pax.babies} Em bé`].filter(Boolean).join(" · ")||"—"
              : (order?.pax||"—");
            const nights=(order?.departDate&&order?.returnDate)
              ? Math.round((new Date(order.returnDate)-new Date(order.departDate))/(86400000))
              : null;

            let icon,title,rows;
            if(isAirline){
              icon="✈️"; title="Chi tiết vé máy bay";
              rows=[
                ["Hành trình",   order?.serviceName||order?.tourName||"—"],
                ["Ngày đi",      fmtDate(order?.departDate)],
                ["Ngày về",      fmtDate(order?.returnDate)],
                ["Số khách",     paxStr],
                ["Hạng vé",      order?.seatClass||"—"],
                ["Mã PNR",       order?.pnrCode||order?.pnr||"—"],
                ["Hành lý ký gửi",order?.baggage||"—"],
              ];
            } else if(isCruise){
              icon="🛳️"; title="Chi tiết du thuyền";
              rows=[
                ["Du thuyền",    order?.serviceName||"—"],
                ["Hành trình",   order?.route||"—"],
                ["Ngày đi",      fmtDate(order?.departDate)],
                ["Ngày về",      fmtDate(order?.returnDate)],
                nights?["Số đêm",`${nights} đêm`]:null,
                ["Số khách",     paxStr],
                ["Loại cabin",   order?.cabinType||"—"],
              ].filter(Boolean);
            } else if(isCombo){
              icon="🌏"; title="Chi tiết combo";
              rows=[
                ["Dịch vụ",      order?.serviceName||"—"],
                ["Ngày đi",      fmtDate(order?.departDate)],
                ["Ngày về",      fmtDate(order?.returnDate)],
                nights?["Số đêm",`${nights} đêm`]:null,
                ["Số khách",     paxStr],
                ["Điểm đến",     order?.destination||"—"],
                ["Khách sạn",    order?.hotelName||"—"],
              ].filter(Boolean);
            } else if(isHotel){
              icon="🏨"; title="Chi tiết khách sạn";
              rows=[
                ["Khách sạn",    order?.serviceName||"—"],
                ["Check-in",     fmtDate(order?.departDate)],
                ["Check-out",    fmtDate(order?.returnDate)],
                nights?["Số đêm",`${nights} đêm`]:null,
                ["Số khách",     paxStr],
                ["Loại phòng",   order?.roomType||"—"],
                ["Số phòng",     order?.roomCount||"—"],
              ].filter(Boolean);
            } else {
              // Tour trọn gói (mặc định)
              icon="🗺️"; title="Chi tiết tour";
              rows=[
                ["Tour",         order?.tourName||order?.serviceName||"—"],
                ["Ngày đi",      fmtDate(order?.departDate)],
                ["Ngày về",      fmtDate(order?.returnDate)],
                nights?["Số đêm",`${nights} đêm`]:null,
                ["Số khách",     paxStr],
                ["HDV",          order?.hdvName||"Chưa phân công"],
              ].filter(Boolean);
            }
            const muted="#94a3b8";
            return(
              <div style={{background:"#fff",borderRadius:14,padding:20,boxShadow:"0 1px 6px rgba(0,0,0,.07)"}}>
                <div style={{fontWeight:700,marginBottom:14,fontSize:14,color:"#374151"}}>{icon} {title}</div>
                {rows.map(([k,v])=>(
                  <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid #f1f5f9",fontSize:13}}>
                    <span style={{color:"#64748b"}}>{k}</span>
                    <span style={{fontWeight:600,color:v==="—"||v==="Chưa phân công"?muted:"#1e293b"}}>{v}</span>
                  </div>
                ))}
              </div>
            );
          })()}
          {order?.note&&(
            <div style={{gridColumn:"1/-1",background:"#fffbeb",borderRadius:12,padding:16,border:"1px solid #fde68a"}}>
              <div style={{fontSize:12,fontWeight:700,color:"#92400e",marginBottom:4}}>📝 GHI CHÚ</div>
              <div style={{fontSize:13,color:"#78350f"}}>{order.note}</div>
            </div>
          )}
          {/* ── TÀI LIỆU IN ── */}
          {(()=>{
            // ── Tính toán số tiền theo từng giai đoạn ──────────
            const orderVouchers = (vouchers||[]).filter(v=>v.orderId===order?.id&&v.type==="thu"&&["approved","confirmed"].includes(v.status));
            const totalPaid     = orderVouchers.reduce((s,v)=>s+(v.amount||0),0);
            const totalPrice    = order?.totalPrice||0;
            const depositAmt    = order?.depositAmount||Math.round(totalPrice*0.3); // Dùng số cọc thực tế từ đơn
            const remainingAmt  = Math.max(0, totalPrice - totalPaid);              // Còn phải thu
            const overpayAmt    = Math.max(0, totalPaid - totalPrice);              // Thu thừa
            const refundRecord  = (refunds||[]).find(r=>r.orderId===order?.id);

            // Số tiền yêu cầu TT lần 2: còn lại sau khi đã cọc
            const finalPayAmt = Math.max(0, totalPrice - depositAmt);

            // Tên file
            const fid = order?.orderNo||order?.id||"";
            const isTour = ["tour","tour_package","tour_ghep"].includes(order?.service)||
                           (order?.tourName||order?.serviceName||"").toLowerCase().includes("tour");

            // Params dùng chung
            const baseOrder = {
              ...order,
              pricing:{ ...order?.pricing, totalRevenue: totalPrice },
              customer:{ name:order?.customerName, phone:order?.customerPhone, email:order?.customerEmail },
            };

            const DocBtn = ({label, bg, color, border, onClick, onWord, wordFile}) => (
              <div style={{display:"inline-flex",alignItems:"stretch",borderRadius:8,overflow:"hidden",border:`1px solid ${border}`}}>
                <button onClick={onClick} style={{padding:"8px 12px",background:bg,color,border:"none",borderRight:`1px solid ${border}`,cursor:"pointer",fontSize:12,fontWeight:600,display:"inline-flex",alignItems:"center",gap:4}}>
                  {label} &nbsp;🖨
                </button>
                <button onClick={onWord} style={{padding:"8px 10px",background:bg,color,border:"none",cursor:"pointer",fontSize:12,fontWeight:600,opacity:.8}}>
                  📝 Word
                </button>
              </div>
            );

            return (
              <div style={{gridColumn:"1/-1",background:"#fff",borderRadius:14,padding:20,boxShadow:"0 1px 6px rgba(0,0,0,.07)"}}>
                <div style={{fontWeight:700,marginBottom:4,fontSize:14,color:"#374151"}}>🖨️ Tài liệu & In ấn</div>

                {/* Tóm tắt số tiền theo giai đoạn */}
                <div style={{display:"flex",gap:10,marginBottom:14,padding:"10px 14px",background:"#f8fafc",borderRadius:10,fontSize:12,flexWrap:"wrap"}}>
                  {[
                    {label:"Giá trị đơn",   val:totalPrice,   color:"#1e3a8a"},
                    {label:"Tiền cọc",       val:depositAmt,   color:"#d97706"},
                    {label:"Còn lại đợt 2",  val:finalPayAmt,  color:"#7c3aed"},
                    {label:"Đã thu thực tế", val:totalPaid,    color:"#059669"},
                    {label:"Còn phải thu",   val:remainingAmt, color:remainingAmt>0?"#dc2626":"#059669"},
                    ...(overpayAmt>0?[{label:"Thu thừa (cần hoàn)", val:overpayAmt, color:"#9333ea"}]:[]),
                  ].map(k=>(
                    <div key={k.label} style={{textAlign:"center",minWidth:90}}>
                      <div style={{fontSize:10,color:"#94a3b8",fontWeight:600,textTransform:"uppercase",marginBottom:2}}>{k.label}</div>
                      <div style={{fontSize:13,fontWeight:700,color:k.color}}>{(k.val||0).toLocaleString("vi-VN")}đ</div>
                    </div>
                  ))}
                </div>

                <div style={{display:"flex",flexWrap:"wrap",gap:8}}>

                  {/* 1. Phiếu xác nhận — luôn hiển thị */}
                  <DocBtn label="📋 Phiếu xác nhận dịch vụ" bg="#eff6ff" color="#1e3a8a" border="#bfdbfe"
                    onClick={()=>openPrintWindow(buildConfirmation(order,vouchers,null))}
                    onWord={()=>downloadAsWord(buildConfirmation(order,vouchers,null),"Phieu-xac-nhan-"+fid)}/>

                  {/* 2. Hợp đồng — chọn đúng loại */}
                  {isTour ? (
                    <DocBtn label="📝 Hợp đồng tour" bg="#f0fdf4" color="#15803d" border="#bbf7d0"
                      onClick={()=>openPrintWindow(buildContractTour({order:baseOrder,issuerName:currentUser?.name}))}
                      onWord={()=>downloadAsWord(buildContractTour({order:baseOrder,issuerName:currentUser?.name}),"HopDong-Tour-"+fid)}/>
                  ):(
                    <DocBtn label="📝 Hợp đồng dịch vụ" bg="#f0fdf4" color="#15803d" border="#bbf7d0"
                      onClick={()=>openPrintWindow(buildContractAirline({order:baseOrder,issuerName:currentUser?.name}))}
                      onWord={()=>downloadAsWord(buildContractAirline({order:baseOrder,issuerName:currentUser?.name}),"HopDong-DichVu-"+fid)}/>
                  )}

                  {/* 3. Yêu cầu TT đặt cọc — dùng đúng số tiền cọc từ đơn */}
                  <DocBtn label={`💳 YCTT đặt cọc (${depositAmt.toLocaleString("vi-VN")}đ)`}
                    bg="#fef9c3" color="#92400e" border="#fde68a"
                    onClick={()=>openPrintWindow(buildPaymentRequest({order:baseOrder,stage:"deposit",requestAmount:depositAmt,issuerName:currentUser?.name}))}
                    onWord={()=>downloadAsWord(buildPaymentRequest({order:baseOrder,stage:"deposit",requestAmount:depositAmt,issuerName:currentUser?.name}),"YCTT-DatCoc-"+fid)}/>

                  {/* 4. Yêu cầu TT đợt 2 — hiển thị khi còn tiền phải thu */}
                  {remainingAmt>0&&(
                    <DocBtn label={`💳 YCTT còn lại (${remainingAmt.toLocaleString("vi-VN")}đ)`}
                      bg="#fff7ed" color="#9a3412" border="#fed7aa"
                      onClick={()=>openPrintWindow(buildPaymentRequest({order:baseOrder,stage:"final",requestAmount:remainingAmt,issuerName:currentUser?.name}))}
                      onWord={()=>downloadAsWord(buildPaymentRequest({order:baseOrder,stage:"final",requestAmount:remainingAmt,issuerName:currentUser?.name}),"YCTT-ConLai-"+fid)}/>
                  )}

                  {/* 5. Bảng kê chi phí — nội bộ */}
                  <DocBtn label="🧾 Bảng kê chi phí" bg="#faf5ff" color="#7c3aed" border="#e9d5ff"
                    onClick={()=>openPrintWindow(buildCostStatement({order:baseOrder,items:expenses.filter(e=>e.orderId===order?.id),issuerName:currentUser?.name}))}
                    onWord={()=>downloadAsWord(buildCostStatement({order:baseOrder,items:expenses.filter(e=>e.orderId===order?.id),issuerName:currentUser?.name}),"BangKe-ChiPhi-"+fid)}/>

                  {/* 6. Biên bản thanh lý — dùng số tiền đã thu thực tế */}
                  <DocBtn label="📃 Biên bản thanh lý HĐ" bg="#fff1f2" color="#be123c" border="#fecdd3"
                    onClick={()=>openPrintWindow(buildLiquidation({order:baseOrder,totalPaid,issuerName:currentUser?.name}))}
                    onWord={()=>downloadAsWord(buildLiquidation({order:baseOrder,totalPaid,issuerName:currentUser?.name}),"BienBan-ThanhLy-"+fid)}/>

                  {/* 9. Danh sách hành khách */}
                  <DocBtn label="👥 Danh sách hành khách" bg="#f0fdf4" color="#166534" border="#bbf7d0"
                    onClick={()=>openPrintWindow(buildPassengerList({order,passengers:order?.passengers||[],issuerName:currentUser?.name}))}
                    onWord={()=>downloadAsWord(buildPassengerList({order,passengers:order?.passengers||[],issuerName:currentUser?.name}),"DanhSach-HanhKhach-"+fid)}/>

                  {/* 10. Voucher dịch vụ NCC */}
                  {(()=>{
                    const bk=(bookings||[]).find(b=>b.orderId===order?.id&&b.status!=="cancelled");
                    const sup=bk?.supplierId?(suppliers||[]).find(s=>s.id===bk.supplierId):null;
                    const svcType=order?.service==="hotel"?"hotel":order?.service==="flight"?"flight":order?.service==="cruise"?"cruise":"other";
                    const vParams={order,booking:bk||{},supplier:sup||{},serviceType:svcType,issuerName:currentUser?.name,paxCount:order?.adultQty||1};
                    return(
                      <DocBtn label="🎫 Voucher dịch vụ NCC" bg="#ecfdf5" color="#065f46" border="#6ee7b7"
                        onClick={()=>openPrintWindow(buildServiceVoucher(vParams))}
                        onWord={()=>downloadAsWord(buildServiceVoucher(vParams),"Voucher-DichVu-"+fid)}/>
                    );
                  })()}

                  {/* 11. Hợp đồng tổng hợp Combo */}
                  {order?.service==="combo"&&(
                    <DocBtn label="📦 HĐ tổng hợp (Combo)" bg="#faf5ff" color="#6d28d9" border="#ddd6fe"
                      onClick={()=>openPrintWindow(buildContractCombo({order:baseOrder,issuerName:currentUser?.name}))}
                      onWord={()=>downloadAsWord(buildContractCombo({order:baseOrder,issuerName:currentUser?.name}),"HopDong-Combo-"+fid)}/>
                  )}

                  {/* 7. Phiếu hoàn trả — chỉ hiện khi thu thừa hoặc có refund record */}
                  {(overpayAmt>0||refundRecord)&&(()=>{
                    const params={
                      order, issuerName:currentUser?.name,
                      customerName:order?.customerName, customerPhone:order?.customerPhone,
                      totalPaid,
                      refundAmount: refundRecord?.refundAmount || overpayAmt,
                      deductAmount: refundRecord?.feeAmount || 0,
                      deductReason: refundRecord?.policyNote || "",
                      refundReason: refundRecord?.reasonNote || (overpayAmt>0?"Khách chuyển khoản thừa":"Hoàn tiền theo yêu cầu"),
                      refundMethod: refundRecord?.method || "transfer",
                      refundType:   refundRecord ? (order?.status==="cancelled"?"cancel":"partial") : "overpay",
                      note: refundRecord?.note || "",
                    };
                    return(
                      <DocBtn label={`💜 Phiếu hoàn trả (${(params.refundAmount||0).toLocaleString("vi-VN")}đ)`}
                        bg="#f5f3ff" color="#7c3aed" border="#c4b5fd"
                        onClick={()=>openPrintWindow(buildRefundVoucher(params))}
                        onWord={()=>downloadAsWord(buildRefundVoucher(params),"PhieuHoanTra-"+fid)}/>
                    );
                  })()}

                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* PASSENGERS TAB */}
      {activeTab==="passengers"&&(
        <PassengerPanel order={order} onUpdate={onUpdate} pushNotif={pushNotif} customers={customers}/>
      )}

      {/* FINANCE TAB */}
      {activeTab==="finance"&&(
        <FinancePanel order={order} vouchers={vouchers} onAddVoucher={onAddVoucher} onApprove={onApprove} onReject={onReject} pushNotif={pushNotif} currentRole={currentRole} currentUser={currentUser} bankAccounts={bankAccounts} expenses={expenses} suppliers={suppliers} onAddSupplier={onAddSupplier}/>
      )}

      {/* AUDIT TAB */}
      {activeTab==="audit"&&(
        <div style={{background:"#fff",borderRadius:14,padding:20,boxShadow:"0 1px 6px rgba(0,0,0,.07)"}}>
          <div style={{fontWeight:700,marginBottom:14}}>Lịch sử thao tác</div>
          {(order?.auditLog||[]).length===0&&<div style={{color:"#94a3b8",textAlign:"center",padding:32}}>Chưa có lịch sử</div>}
          {(order?.auditLog||[]).map((log,i)=>(
            <div key={i} style={{padding:"10px 0",borderBottom:"1px solid #f1f5f9",fontSize:13}}>
              <span style={{color:"#64748b"}}>{new Date(log.ts||log.time||0).toLocaleString("vi-VN")}</span>
              <span style={{marginLeft:12,fontWeight:600}}>{log.by||log.user}</span>
              <span style={{marginLeft:8,color:"#475569"}}>{log.action||log.note}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
function ProfilePage({ currentUser, onUpdate, onBack, pushNotif, verifyLogin }){
  const [form,setForm]=React.useState({name:currentUser?.name||"",email:currentUser?.email||"",phone:currentUser?.phone||"",avatar:currentUser?.avatar||""});
  const [pwForm,setPwForm]=React.useState({current:"",next:"",confirm:""});
  const [pwBusy,setPwBusy]=React.useState(false);
  const [tab,setTab]=React.useState("info");
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const saveInfo=()=>{
    if(!form.name.trim()) return pushNotif&&pushNotif("Nhập tên","error");
    onUpdate&&onUpdate({...currentUser,...form});
    pushNotif&&pushNotif("Đã cập nhật thông tin");
  };
  const changePw=async()=>{
    if(pwForm.next.length<6) return pushNotif&&pushNotif("Mật khẩu mới tối thiểu 6 ký tự","error");
    if(pwForm.next!==pwForm.confirm) return pushNotif&&pushNotif("Xác nhận mật khẩu không khớp","error");
    setPwBusy(true);
    try{
      const verified = await verifyLogin?.(currentUser?.username, pwForm.current);
      if(!verified){ pushNotif&&pushNotif("Mật khẩu hiện tại không đúng","error"); return; }
      onUpdate&&onUpdate({...currentUser,password:pwForm.next});
      pushNotif&&pushNotif("Đã đổi mật khẩu thành công");
      setPwForm({current:"",next:"",confirm:""});
    }catch(e){
      pushNotif&&pushNotif("Không thể đổi mật khẩu: "+e.message,"error");
    }finally{
      setPwBusy(false);
    }
  };
  const ROLE_LABEL={manager:"Giám đốc",pho_giam_doc:"Phó Giám đốc",accountant:"Kế toán",cashier:"Thu ngân",sale:"Sale",dieu_hanh:"Điều hành"};
  return(
    <div style={{padding:24,maxWidth:560,margin:"0 auto"}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24}}>
        <button onClick={onBack} style={{background:"none",border:"none",cursor:"pointer",fontSize:20,color:"#64748b"}}>←</button>
        <h2 style={{margin:0,fontSize:20,fontWeight:800}}>Hồ sơ cá nhân</h2>
      </div>
      <div style={{background:"#fff",borderRadius:16,padding:24,boxShadow:"0 2px 12px rgba(0,0,0,.08)",marginBottom:16,textAlign:"center"}}>
        <div style={{width:72,height:72,borderRadius:"50%",background:"linear-gradient(135deg,#2563eb,#7c3aed)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,fontWeight:800,color:"#fff",margin:"0 auto 12px"}}>{currentUser?.name?.[0]?.toUpperCase()||"U"}</div>
        <div style={{fontSize:18,fontWeight:800}}>{currentUser?.name}</div>
        <div style={{fontSize:13,color:"#64748b",marginTop:4}}>{ROLE_LABEL[currentUser?.role]||currentUser?.role} · {currentUser?.email}</div>
      </div>
      <div style={{display:"flex",gap:4,marginBottom:16,background:"#f1f5f9",borderRadius:10,padding:4}}>
        {[["info","Thông tin"],["password","Đổi mật khẩu"]].map(([k,label])=>(
          <button key={k} onClick={()=>setTab(k)} style={{flex:1,padding:"8px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:600,fontSize:13,background:tab===k?"#fff":"transparent",color:tab===k?"#1e293b":"#64748b",boxShadow:tab===k?"0 1px 4px rgba(0,0,0,.1)":"none"}}>{label}</button>
        ))}
      </div>
      {tab==="info"&&(
        <div style={{background:"#fff",borderRadius:14,padding:20,boxShadow:"0 1px 6px rgba(0,0,0,.07)"}}>
          {[["Họ tên","name","text"],["Email","email","email"],["SĐT","phone","tel"]].map(([label,key,type])=>(
            <div key={key} style={{marginBottom:14}}>
              <label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:4,color:"#374151"}}>{label}</label>
              <input type={type} value={form[key]||""} onChange={e=>set(key,e.target.value)} style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:8,padding:"9px 12px",fontSize:13,boxSizing:"border-box"}}/>
            </div>
          ))}
          <button onClick={saveInfo} style={{width:"100%",background:"#2563eb",color:"#fff",border:"none",borderRadius:10,padding:12,cursor:"pointer",fontWeight:700,fontSize:14}}>Lưu thông tin</button>
        </div>
      )}
      {tab==="password"&&(
        <div style={{background:"#fff",borderRadius:14,padding:20,boxShadow:"0 1px 6px rgba(0,0,0,.07)"}}>
          {[["Mật khẩu hiện tại","current"],["Mật khẩu mới","next"],["Xác nhận mật khẩu mới","confirm"]].map(([label,key])=>(
            <div key={key} style={{marginBottom:14}}>
              <label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:4,color:"#374151"}}>{label}</label>
              <input type="password" value={pwForm[key]} onChange={e=>setPwForm(f=>({...f,[key]:e.target.value}))} style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:8,padding:"9px 12px",fontSize:13,boxSizing:"border-box"}}/>
            </div>
          ))}
          <button onClick={changePw} disabled={pwBusy} style={{width:"100%",background:pwBusy?"#94a3b8":"#2563eb",color:"#fff",border:"none",borderRadius:10,padding:12,cursor:pwBusy?"not-allowed":"pointer",fontWeight:700,fontSize:14}}>{pwBusy?"Đang kiểm tra...":"Đổi mật khẩu"}</button>
        </div>
      )}
    </div>
  );
}

const DEPARTMENTS=["Ban lãnh đạo","Sale","Kế toán","Điều hành tour","Marketing","Nhân sự","Chăm sóc khách hàng"];

function UserManagementPage({ userAccounts, onUpdateAccounts, saveUser, removeUser, currentUser, pushNotif, personalTargets=[], onUpdateTargets, approvalThreshold=20000000, onUpdateThreshold }){
  const [showForm,setShowForm]=React.useState(false);
  const [editUser,setEditUser]=React.useState(null);
  const [form,setForm]=React.useState({name:"",username:"",email:"",phone:"",role:"sale",department:DEPARTMENTS[0],jobTitle:"",password:"123456",active:true,photoUrl:"",canViewTourGhep:false,perms:null});
  const [threshold,setThreshold]=React.useState(approvalThreshold/1e6);
  const ROLE_LABEL={manager:"Giám đốc",pho_giam_doc:"Phó Giám đốc",accountant:"Kế toán",cashier:"Thu ngân",sale:"Sale",dieu_hanh:"Điều hành"};
  const ROLE_COLOR={manager:"#7c3aed",pho_giam_doc:"#6d28d9",accountant:"#0891b2",cashier:"#d97706",sale:"#2563eb",dieu_hanh:"#16a34a"};

  const handlePhotoUpload=(e)=>{
    const file=e.target.files?.[0];
    if(!file) return;
    if(file.size>3*1024*1024) return pushNotif&&pushNotif("Ảnh tối đa 3MB","error");
    const reader=new FileReader();
    reader.onload=()=>setForm(f=>({...f,photoUrl:reader.result}));
    reader.readAsDataURL(file);
  };

  const save=()=>{
    if(!form.name||!form.email) return pushNotif&&pushNotif("Nhập họ tên và email","error");
    // Auto-generate username từ email nếu để trống
    const username = form.username.trim() || form.email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g,".");
    if(editUser){
      const updated={...editUser,...form, username};
      onUpdateAccounts((userAccounts||[]).map(u=>u.id===editUser.id?updated:u));
      saveUser?.(updated).catch(e=>{
        console.error("saveUser failed",e);
        pushNotif&&pushNotif("⚠ Lưu lên server thất bại: "+e.message,"error");
      });
      pushNotif&&pushNotif("Đã cập nhật tài khoản "+form.name);
    } else {
      if((userAccounts||[]).some(u=>u.email===form.email)) return pushNotif&&pushNotif("Email đã tồn tại","error");
      const newUser={...form, username, id:"U"+Date.now(), avatar:form.name?.[0]?.toUpperCase()||"?"};
      onUpdateAccounts([...(userAccounts||[]),newUser]);
      saveUser?.(newUser).catch(e=>{
        console.error("saveUser failed",e);
        pushNotif&&pushNotif("⚠ Lưu lên server thất bại: "+e.message,"error");
      });
      pushNotif&&pushNotif("Đã tạo tài khoản "+form.name+" · username: "+username);
    }
    setShowForm(false); setEditUser(null);
    setForm({name:"",username:"",email:"",phone:"",role:"sale",department:DEPARTMENTS[0],jobTitle:"",password:"123456",active:true,photoUrl:"",canViewTourGhep:false});
  };

  const toggleActive=(u)=>{
    const updated={...u,active:!u.active};
    onUpdateAccounts((userAccounts||[]).map(x=>x.id===u.id?updated:x));
    saveUser?.(updated).catch(e=>console.error("saveUser failed",e));
    pushNotif&&pushNotif((u.active?"Đã vô hiệu hóa":"Đã kích hoạt")+" tài khoản "+u.name);
  };

  const saveThreshold=()=>{
    onUpdateThreshold&&onUpdateThreshold(Number(threshold)*1e6);
    pushNotif&&pushNotif("Đã cập nhật ngưỡng duyệt: "+threshold+"M");
  };

  // ── Giao chỉ tiêu (KPI) ──
  const now=new Date();
  const [kpiMonth,setKpiMonth]=React.useState(`${String(now.getMonth()+1).padStart(2,"0")}/${now.getFullYear()}`);
  const saleUsers=(userAccounts||[]).filter(u=>u.active!==false);
  const ROLE_VN={manager:"Giám đốc",pho_giam_doc:"Phó Giám đốc",accountant:"Kế toán",cashier:"Thủ quỹ",sale:"Sale",dieu_hanh:"Điều hành"};
  const getTarget=(name)=>(personalTargets||[]).find(t=>(t.name===name||t.username===name)&&t.month===kpiMonth)?.target||0;
  const setTarget=(user,value)=>{
    const exist=(personalTargets||[]).find(t=>(t.name===user.name||t.username===user.username)&&t.month===kpiMonth);
    let next;
    if(exist) next=(personalTargets||[]).map(t=>t===exist?{...t,target:value}:t);
    else next=[...(personalTargets||[]),{id:"KPI-"+Date.now(),name:user.name,username:user.username,month:kpiMonth,target:value}];
    onUpdateTargets&&onUpdateTargets(next);
  };

  return(
    <div style={{padding:24}}>
      <h2 style={{margin:"0 0 20px",fontSize:20,fontWeight:800}}>Quản lý người dùng</h2>

      {/* Giao chỉ tiêu KPI */}
      <div style={{background:"#fff",borderRadius:14,padding:18,marginBottom:20,boxShadow:"0 1px 6px rgba(0,0,0,.07)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:10}}>
          <div>
            <div style={{fontWeight:700,fontSize:15,display:"flex",alignItems:"center",gap:8}}>🎯 Giao chỉ tiêu doanh thu (KPI)</div>
            <div style={{fontSize:12,color:"#64748b",marginTop:2}}>Đặt mục tiêu doanh thu tháng cho toàn bộ nhân viên — mọi bộ phận đều có thể gánh doanh số</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:13,color:"#64748b",fontWeight:600}}>Tháng:</span>
            <input value={kpiMonth} onChange={e=>setKpiMonth(e.target.value)} placeholder="MM/YYYY" style={{width:100,border:"1px solid #e2e8f0",borderRadius:8,padding:"7px 10px",fontSize:13,fontWeight:600,textAlign:"center"}}/>
          </div>
        </div>
        {saleUsers.length===0?(
          <div style={{textAlign:"center",color:"#94a3b8",padding:16,fontSize:13}}>Chưa có nhân viên nào</div>
        ):(
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:12}}>
            {saleUsers.map(u=>(
              <div key={u.id} style={{background:"#f8fafc",borderRadius:10,padding:"12px 14px",border:"1px solid #f1f5f9"}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                  <div style={{width:30,height:30,borderRadius:"50%",background:"#2563eb",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:"#fff"}}>{(u.name||"?")[0].toUpperCase()}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:700,color:"#0f172a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.name}</div>
                    <div style={{fontSize:10,color:"#64748b",fontWeight:600}}>{ROLE_VN[u.role]||u.role}</div>
                  </div>
                </div>
                <label style={{fontSize:11,color:"#64748b",fontWeight:600,display:"block",marginBottom:4}}>Chỉ tiêu tháng {kpiMonth} (₫)</label>
                <NumberInput value={getTarget(u.name)} onChange={v=>setTarget(u,v)} placeholder="VD: 150.000.000" style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:8,padding:"8px 12px",fontSize:13,boxSizing:"border-box",fontWeight:600}}/>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Threshold setting */}
      <div style={{background:"#fff",borderRadius:14,padding:18,marginBottom:20,boxShadow:"0 1px 6px rgba(0,0,0,.07)",display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
        <div style={{flex:1}}>
          <div style={{fontWeight:700,marginBottom:4}}>Ngưỡng phê duyệt tự động</div>
          <div style={{fontSize:12,color:"#64748b"}}>Phiếu chi vượt ngưỡng này cần Giám đốc duyệt</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <input type="number" value={threshold} onChange={e=>setThreshold(e.target.value)} style={{width:80,border:"1px solid #e2e8f0",borderRadius:8,padding:"7px 10px",fontSize:14,fontWeight:700,textAlign:"center"}}/>
          <span style={{fontWeight:700}}>triệu ₫</span>
          <button onClick={saveThreshold} style={{background:"#2563eb",color:"#fff",border:"none",borderRadius:8,padding:"7px 14px",cursor:"pointer",fontSize:13,fontWeight:600}}>Lưu</button>
        </div>
      </div>

      {/* User list */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div style={{fontWeight:700,fontSize:15}}>Tài khoản ({(userAccounts||[]).length})</div>
        <button onClick={()=>{setEditUser(null);setForm({name:"",username:"",email:"",phone:"",role:"sale",department:DEPARTMENTS[0],jobTitle:"",password:"123456",active:true,photoUrl:"",canViewTourGhep:false});setShowForm(true);}} style={{background:"#2563eb",color:"#fff",border:"none",borderRadius:9,padding:"8px 18px",cursor:"pointer",fontWeight:700,fontSize:13}}>+ Thêm</button>
      </div>

      {showForm&&(
        <div style={{background:"#fff",borderRadius:14,padding:20,marginBottom:16,boxShadow:"0 1px 6px rgba(0,0,0,.07)"}}>
          <h3 style={{margin:"0 0 16px"}}>{editUser?"Sửa tài khoản":"Tạo tài khoản mới"}</h3>

          <div style={{display:"flex",alignItems:"center",gap:16,background:"#f8fafc",borderRadius:10,padding:16,marginBottom:16}}>
            <div style={{width:64,height:64,borderRadius:"50%",background:form.photoUrl?"transparent":"#cbd5e1",overflow:"hidden",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
              {form.photoUrl?<img src={form.photoUrl} alt="avatar" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{color:"#fff",fontWeight:800,fontSize:22}}>{form.name?.[0]?.toUpperCase()||"?"}</span>}
            </div>
            <div>
              <div style={{fontWeight:700,fontSize:13,marginBottom:6}}>Ảnh đại diện</div>
              <div style={{display:"flex",gap:8}}>
                <label style={{background:"#eff6ff",color:"#2563eb",border:"none",borderRadius:7,padding:"6px 14px",cursor:"pointer",fontSize:12,fontWeight:600}}>
                  📷 Tải ảnh
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{display:"none"}}/>
                </label>
                {form.photoUrl&&<button onClick={()=>setForm(f=>({...f,photoUrl:""}))} style={{background:"#fef2f2",color:"#dc2626",border:"none",borderRadius:7,padding:"6px 14px",cursor:"pointer",fontSize:12,fontWeight:600}}>🗑 Xóa</button>}
              </div>
              <div style={{fontSize:11,color:"#94a3b8",marginTop:5}}>JPG, PNG, WEBP · Tối đa 3MB</div>
            </div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            {[["Họ tên đầy đủ *","name","text"],["Tên đăng nhập","username","text"],["Mật khẩu","password","text"],["Email *","email","email"]].map(([label,key,type])=>(
              <div key={key}>
                <label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:4,color:"#374151"}}>{label}</label>
                <input type={type} value={form[key]||""} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))} style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:8,padding:"9px 12px",fontSize:13,boxSizing:"border-box"}}/>
              </div>
            ))}
            <div>
              <label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:4,color:"#374151"}}>Phòng ban</label>
              <select value={form.department} onChange={e=>setForm(f=>({...f,department:e.target.value}))} style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:8,padding:"9px 12px",fontSize:13}}>
                {DEPARTMENTS.map(d=><option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:4,color:"#374151"}}>Chức danh</label>
              <input value={form.jobTitle||""} onChange={e=>setForm(f=>({...f,jobTitle:e.target.value}))} placeholder="VD: Tổng Giám đốc" style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:8,padding:"9px 12px",fontSize:13,boxSizing:"border-box"}}/>
            </div>
            <div>
              <label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:4,color:"#374151"}}>SĐT</label>
              <input value={form.phone||""} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:8,padding:"9px 12px",fontSize:13,boxSizing:"border-box"}}/>
            </div>
            <div>
              <label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:4,color:"#374151"}}>Vai trò (quyền hệ thống)</label>
              <select value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value,perms:null}))} style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:8,padding:"9px 12px",fontSize:13}}>
                {Object.entries(ROLE_LABEL).map(([k,v])=><option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>

          {/* ── MA TRẬN PHÂN QUYỀN ── */}
          {(()=>{
            const effective = Array.isArray(form.perms) ? form.perms : (ROLE_DEFAULT_PERMS[form.role]||[]);
            const isCustom = Array.isArray(form.perms);
            const toggle=(key)=>{
              const cur = Array.isArray(form.perms) ? [...form.perms] : [...(ROLE_DEFAULT_PERMS[form.role]||[])];
              const next = cur.includes(key) ? cur.filter(k=>k!==key) : [...cur,key];
              setForm(f=>({...f,perms:next}));
            };
            return(
              <div style={{marginTop:14,padding:"14px 16px",borderRadius:10,background:"#f8fafc",border:"1px solid #e2e8f0"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,flexWrap:"wrap",gap:8}}>
                  <div>
                    <div style={{fontSize:13,fontWeight:700,color:"#0f172a"}}>🔐 Phân quyền chức năng</div>
                    <div style={{fontSize:11,color:"#64748b",marginTop:2}}>
                      {isCustom?"Đang dùng quyền TÙY CHỈNH riêng":"Đang dùng quyền MẶC ĐỊNH theo vai trò"}
                    </div>
                  </div>
                  {isCustom&&<button type="button" onClick={()=>setForm(f=>({...f,perms:null}))} style={{background:"#eff6ff",color:"#2563eb",border:"1px solid #bfdbfe",borderRadius:7,padding:"5px 12px",cursor:"pointer",fontSize:12,fontWeight:600}}>↺ Về mặc định</button>}
                </div>
                {PERMISSION_GROUPS.map(grp=>(
                  <div key={grp.group} style={{marginBottom:10}}>
                    <div style={{fontSize:11,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:.5,marginBottom:6}}>{grp.group}</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                      {grp.items.map(it=>{
                        const checked=effective.includes(it.key);
                        return(
                          <label key={it.key} style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",padding:"7px 10px",background:checked?"#eff6ff":"#fff",borderRadius:7,border:`1px solid ${checked?"#bfdbfe":"#e2e8f0"}`,fontSize:12.5}}>
                            <input type="checkbox" checked={checked} onChange={()=>toggle(it.key)} style={{width:15,height:15,cursor:"pointer",accentColor:"#2563eb"}}/>
                            <span style={{color:checked?"#1e40af":"#475569",fontWeight:checked?600:400}}>{it.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
          {form.role==="sale"&&(
            <div style={{gridColumn:"1/-1",marginTop:10}}>
              <div style={{padding:"14px 16px",borderRadius:10,background:"#FAEEDA",border:"0.5px solid #EF9F27"}}>
                <div style={{fontSize:13,fontWeight:600,color:"#633806",marginBottom:10}}>Phân quyền đặc biệt</div>
                <label style={{display:"flex",alignItems:"flex-start",gap:10,cursor:"pointer",padding:"10px 12px",background:"#fff",borderRadius:8,border:`1.5px solid ${form.canViewTourGhep?"#0F6E56":"#e2e8f0"}`}}>
                  <input type="checkbox" checked={form.canViewTourGhep||false} onChange={e=>setForm(f=>({...f,canViewTourGhep:e.target.checked}))} style={{marginTop:2,flexShrink:0,width:16,height:16,cursor:"pointer"}}/>
                  <div>
                    <div style={{fontSize:13,fontWeight:600,color:form.canViewTourGhep?"#0F6E56":"#374151"}}>
                      Xem được Module Tour Ghép
                      {form.canViewTourGhep&&<span style={{marginLeft:8,fontSize:11,padding:"2px 8px",background:"#E1F5EE",color:"#085041",borderRadius:999,fontWeight:500}}>Đã bật</span>}
                    </div>
                    <div style={{fontSize:12,color:"#64748b",marginTop:3,lineHeight:1.5}}>
                      {form.canViewTourGhep?"Sale này thấy: tên NCC, giá mua, tỷ suất lãi, bảng giá đối tác.":"Mặc định: sale chỉ thấy tên tour + giá bán, không thấy NCC và giá vốn."}
                    </div>
                  </div>
                </label>
                {form.canViewTourGhep&&(
                  <div style={{marginTop:8,padding:"8px 12px",background:"#FCEBEB",borderRadius:8,fontSize:12,color:"#791F1F",display:"flex",gap:6,alignItems:"flex-start"}}>
                    <span style={{flexShrink:0}}>⚠️</span>
                    <span>Sale này sẽ thấy tên nhà cung cấp và giá mua. Chỉ bật cho nhân viên đáng tin cậy.</span>
                  </div>
                )}
              </div>
            </div>
          )}
          <div style={{display:"flex",gap:8,marginTop:14}}>
            <button onClick={save} style={{background:"#16a34a",color:"#fff",border:"none",borderRadius:8,padding:"9px 20px",cursor:"pointer",fontWeight:700}}>Lưu</button>
            <button onClick={()=>setShowForm(false)} style={{background:"#6b7280",color:"#fff",border:"none",borderRadius:8,padding:"9px 20px",cursor:"pointer",fontWeight:600}}>Hủy</button>
          </div>
        </div>
      )}

      <div style={{background:"#fff",borderRadius:14,boxShadow:"0 1px 6px rgba(0,0,0,.07)",overflow:"hidden"}}>
        {(userAccounts||[]).map(u=>(
          <div key={u.id} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",borderBottom:"1px solid #f8fafc",opacity:u.active===false?.5:1}}>
            <div style={{width:40,height:40,borderRadius:"50%",background:u.photoUrl?"transparent":(ROLE_COLOR[u.role]||"#64748b"),overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:16,flexShrink:0}}>
              {u.photoUrl?<img src={u.photoUrl} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:(u.name?.[0]?.toUpperCase()||"U")}
            </div>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:14}}>{u.name} {u.jobTitle&&<span style={{fontWeight:400,color:"#94a3b8",fontSize:12}}>— {u.jobTitle}</span>}</div>
              <div style={{fontSize:12,color:"#64748b"}}>{u.email} {u.phone?"· "+u.phone:""} {u.department?"· "+u.department:""}</div>
            </div>
            <span style={{background:ROLE_COLOR[u.role]+"22",color:ROLE_COLOR[u.role]||"#64748b",borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:700}}>{ROLE_LABEL[u.role]||u.role}</span>
            {u.role==="sale"&&u.canViewTourGhep&&<span style={{background:"#E1F5EE",color:"#085041",borderRadius:20,padding:"3px 8px",fontSize:10,fontWeight:600}}>Tour Ghép ✓</span>}
            <div style={{display:"flex",gap:6}}>
              <button onClick={()=>{setEditUser(u);setForm({name:u.name||"",username:u.username||"",email:u.email||"",phone:u.phone||"",role:u.role||"sale",department:u.department||DEPARTMENTS[0],jobTitle:u.jobTitle||"",password:u.password||"",active:u.active!==false,photoUrl:u.photoUrl||"",canViewTourGhep:u.canViewTourGhep||false,perms:Array.isArray(u.perms)?u.perms:null});setShowForm(true);}} style={{background:"#f1f5f9",border:"none",borderRadius:7,padding:"5px 10px",cursor:"pointer",fontSize:12,fontWeight:600}}>Sửa</button>
              {u.id!==currentUser?.id&&<button onClick={()=>toggleActive(u)} style={{background:u.active===false?"#dcfce7":"#fee2e2",color:u.active===false?"#16a34a":"#dc2626",border:"none",borderRadius:7,padding:"5px 10px",cursor:"pointer",fontSize:12,fontWeight:600}}>{u.active===false?"Bật":"Tắt"}</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════

// GLOBAL SEARCH — Tìm kiếm toàn cục


// ── Constants ────────────────────────────────────────────────
const TOUR_GHEP_REGIONS = [
  "Đông Bắc Á","Đông Nam Á","Châu Âu","Châu Mỹ",
  "Châu Úc","Trung Đông","Nam Á","Nội địa",
];

// ── TourGhepProductForm (defined OUTSIDE TourGhepModule) ─────
function TourGhepProductForm({ initial, onSave, onCancel, suppliers, isClone=false }) {
  const empty = {
    type:"domestic", active:true,
    name:"", destination:"", region:"", duration:"",
    partnerId:"", partnerName:"", partnerCode:"",
    priceType:"fixed",
    buyPrices:  { adult:0, child:0, infant:0 },
    sellPrices: { adult:0, child:0, infant:0 },
    ageLabels:  { adult:"Người lớn", child:"Trẻ em", infant:"Em bé" },
    useSchedule:false, departures:[],
    links: { program:"", images:"", pricelist:"", other:"" },
    includes:"", excludes:"",
    visaRequired:false, visaNote:"",
    typicalSchedule:"", depositPolicy:"", cancelPolicy:"",
    notes:"",
  };
  const [form, setForm] = React.useState(initial ? {
    ...empty, ...initial,
    buyPrices:  { adult:0, child:0, infant:0, ...(initial.buyPrices  || {}) },
    sellPrices: { adult:0, child:0, infant:0, ...(initial.sellPrices || {}) },
    ageLabels:  { ...empty.ageLabels, ...(initial.ageLabels || {}) },
    departures: Array.isArray(initial.departures) ? initial.departures : [],
    links:      { program:"", images:"", pricelist:"", other:"", ...(initial.links || {}) },
  } : empty);

  const set     = (k,v) => setForm(f=>({...f,[k]:v}));
  const setLink = (k,v) => setForm(f=>({...f, links:{...f.links,[k]:v}}));
  const setBuy  = (k,v) => setForm(f=>({...f, buyPrices:{...f.buyPrices,[k]:Number(v)}}));
  const setSell = (k,v) => setForm(f=>({...f, sellPrices:{...f.sellPrices,[k]:Number(v)}}));
  const setAge  = (k,v) => setForm(f=>({...f, ageLabels:{...f.ageLabels,[k]:v}}));
  // Departures (đợt khởi hành theo lịch)
  const addDeparture = () => setForm(f=>({...f, departures:[...(f.departures||[]),
    { id:"dep-"+Date.now(), label:"", dates:"", slots:"",
      sell:{adult:0,child:0,infant:0}, buy:{adult:0,child:0,infant:0}, note:"" }]}));
  const removeDeparture = (id) => setForm(f=>({...f, departures:(f.departures||[]).filter(d=>d.id!==id)}));
  const setDep = (id,k,v) => setForm(f=>({...f, departures:(f.departures||[]).map(d=>d.id===id?{...d,[k]:v}:d)}));
  const setDepPrice = (id,grp,k,v) => setForm(f=>({...f, departures:(f.departures||[]).map(d=>d.id===id?{...d,[grp]:{...d[grp],[k]:Number(v)}}:d)}));

  const lbl = { display:"block", fontSize:12, fontWeight:600, marginBottom:4, color:"#374151" };
  const inp = { width:"100%", border:"0.5px solid #e2e8f0", borderRadius:8, padding:"9px 12px", fontSize:13, boxSizing:"border-box", outline:"none" };
  const th  = { padding:"9px 12px", textAlign:"left", fontSize:11, fontWeight:600, borderBottom:"0.5px solid #e2e8f0", color:"#374151" };
  const td  = { padding:"9px 12px", borderBottom:"0.5px solid #f1f5f9" };
  const secLbl = { gridColumn:"1/-1", fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:".7px", color:"#94a3b8", paddingBottom:6, borderBottom:"0.5px solid #f1f5f9", marginTop:4 };

  return (
    <div style={{ background:"#fff", borderRadius:14, padding:24, border:"0.5px solid #e2e8f0", marginBottom:20 }}>
      <h3 style={{ margin:"0 0 20px", fontSize:15, fontWeight:600 }}>
        {isClone ? "Nhân bản sản phẩm — chỉ sửa phần khác biệt" : initial ? "Sửa sản phẩm" : "Thêm sản phẩm tour ghép"}
      </h3>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>

        <div style={secLbl}>Thông tin cơ bản</div>

        <div style={{ gridColumn:"1/-1" }}>
          <label style={lbl}>Loại tour *</label>
          <div style={{ display:"flex", gap:8 }}>
            {[
              { val:"domestic",      label:"🏔 Quốc nội", color:"#0F6E56", bg:"#E1F5EE" },
              { val:"international", label:"🌍 Quốc tế",  color:"#534AB7", bg:"#EEEDFE" },
            ].map(o => (
              <button key={o.val} type="button" onClick={()=>set("type",o.val)}
                style={{ flex:1, padding:"10px 0", borderRadius:8, cursor:"pointer",
                  border:`1.5px solid ${form.type===o.val?o.color:"#e2e8f0"}`,
                  background:form.type===o.val?o.bg:"#fff",
                  fontSize:13, fontWeight:600,
                  color:form.type===o.val?o.color:"#64748b" }}>
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ gridColumn:"1/-1" }}>
          <label style={lbl}>Tên tour *</label>
          <input value={form.name} onChange={e=>set("name",e.target.value)}
            placeholder="VD: Nhật Bản Tokyo - Kyoto - Osaka 6N5Đ" style={inp} />
        </div>

        <div>
          <label style={lbl}>Điểm đến *</label>
          <input value={form.destination} onChange={e=>set("destination",e.target.value)}
            placeholder="VD: Nhật Bản, Đà Lạt" style={inp} />
        </div>
        <div>
          <label style={lbl}>Khu vực</label>
          <select value={form.region} onChange={e=>set("region",e.target.value)} style={inp}>
            <option value="">— Chọn khu vực —</option>
            {TOUR_GHEP_REGIONS.map(r=><option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div>
          <label style={lbl}>Thời gian</label>
          <input value={form.duration} onChange={e=>set("duration",e.target.value)}
            placeholder="VD: 6N5Đ" style={inp} />
        </div>
        <div>
          <label style={lbl}>Lịch khởi hành thường</label>
          <input value={form.typicalSchedule} onChange={e=>set("typicalSchedule",e.target.value)}
            placeholder="VD: Thứ 6 hàng tuần" style={inp} />
        </div>

        <div style={secLbl}>Đối tác cung cấp</div>

        <div>
          <label style={lbl}>Đối tác / NCC *</label>
          <select value={form.partnerId}
            onChange={e=>{
              const s=(suppliers||[]).find(x=>x.id===e.target.value);
              set("partnerId",e.target.value);
              set("partnerName",s?.name||s?.ten||e.target.options[e.target.selectedIndex]?.text||"");
            }} style={inp}>
            <option value="">— Chọn đối tác —</option>
            {(suppliers||[]).map(s=>(
              <option key={s.id} value={s.id}>{s.name||s.ten}</option>
            ))}
            <option value="__manual">— Nhập tên thủ công —</option>
          </select>
          {(form.partnerId==="__manual"||(!form.partnerId&&form.partnerName))&&(
            <input value={form.partnerName} onChange={e=>set("partnerName",e.target.value)}
              placeholder="Tên đối tác" style={{...inp,marginTop:6}}/>
          )}
        </div>
        <div>
          <label style={lbl}>Mã tour của đối tác</label>
          <input value={form.partnerCode} onChange={e=>set("partnerCode",e.target.value)}
            placeholder="VD: VTR-NB-6N" style={inp} />
        </div>

        <div style={secLbl}>Phân loại độ tuổi (tùy NCC quy định)</div>

        <div style={{ gridColumn:"1/-1", display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
          <div>
            <label style={lbl}>Nhãn "Người lớn"</label>
            <input value={form.ageLabels.adult} onChange={e=>setAge("adult",e.target.value)}
              placeholder="VD: Người lớn (≥12t)" style={inp} />
          </div>
          <div>
            <label style={lbl}>Nhãn "Trẻ em"</label>
            <input value={form.ageLabels.child} onChange={e=>setAge("child",e.target.value)}
              placeholder="VD: Trẻ em 2-11 tuổi" style={inp} />
          </div>
          <div>
            <label style={lbl}>Nhãn "Em bé"</label>
            <input value={form.ageLabels.infant} onChange={e=>setAge("infant",e.target.value)}
              placeholder="VD: Em bé < 24 tháng" style={inp} />
          </div>
          <div style={{ gridColumn:"1/-1", fontSize:11, color:"#64748b", marginTop:-4 }}>
            💡 Mỗi NCC quy định độ tuổi khác nhau — sửa nhãn cho đúng tour này. Nhãn sẽ hiển thị ở bảng giá, báo giá và hợp đồng.
          </div>
        </div>

        <div style={secLbl}>Giá tham khảo</div>

        <div style={{ gridColumn:"1/-1" }}>
          <div style={{ display:"flex", gap:8, marginBottom:12 }}>
            {[
              { val:false, label:"Một mức giá", desc:"Tour có 1 bảng giá cố định" },
              { val:true,  label:"Theo lịch khởi hành", desc:"Giá khác nhau theo tháng / ngày đi" },
            ].map(o=>(
              <button key={String(o.val)} type="button" onClick={()=>set("useSchedule",o.val)}
                style={{ flex:1, padding:"10px 14px", borderRadius:8, cursor:"pointer",
                  border:`1.5px solid ${!!form.useSchedule===o.val?"#185FA5":"#e2e8f0"}`,
                  background:!!form.useSchedule===o.val?"#E6F1FB":"#fff", textAlign:"left" }}>
                <div style={{ fontSize:13, fontWeight:600, color:!!form.useSchedule===o.val?"#185FA5":"#374151" }}>{o.label}</div>
                <div style={{ fontSize:11, color:"#64748b", marginTop:2 }}>{o.desc}</div>
              </button>
            ))}
          </div>

          {!form.useSchedule ? (
          <table style={{ width:"100%", borderCollapse:"separate", borderSpacing:0, border:"0.5px solid #e2e8f0", borderRadius:10, overflow:"hidden", fontSize:13 }}>
            <thead>
              <tr style={{ background:"#f8fafc" }}>
                <th style={th}>Loại khách</th>
                <th style={{ ...th, color:"#A32D2D" }}>Giá mua (NCC)</th>
                <th style={{ ...th, color:"#0F6E56" }}>Giá bán (KH)</th>
                <th style={{ ...th, color:"#854F0B" }}>Lãi / suất</th>
              </tr>
            </thead>
            <tbody>
              {[
                { key:"adult",  label:form.ageLabels.adult },
                { key:"child",  label:form.ageLabels.child },
                { key:"infant", label:form.ageLabels.infant },
              ].map(row=>{
                const profit=(form.sellPrices[row.key]||0)-(form.buyPrices[row.key]||0);
                return (
                  <tr key={row.key}>
                    <td style={td}><strong>{row.label}</strong></td>
                    <td style={td}>
                      <input type="number" min={0}
                        value={form.buyPrices[row.key]||""}
                        onChange={e=>setBuy(row.key,e.target.value)}
                        style={{ width:"100%", padding:"7px 10px", borderRadius:6, border:"0.5px solid #fecaca", textAlign:"right", fontSize:13, background:"#fff5f5", boxSizing:"border-box" }}
                        placeholder="0" />
                    </td>
                    <td style={td}>
                      <input type="number" min={0}
                        value={form.sellPrices[row.key]||""}
                        onChange={e=>setSell(row.key,e.target.value)}
                        style={{ width:"100%", padding:"7px 10px", borderRadius:6, border:"0.5px solid #bbf7d0", textAlign:"right", fontSize:13, background:"#f0fdf4", boxSizing:"border-box" }}
                        placeholder="0" />
                    </td>
                    <td style={{ ...td, fontWeight:600, textAlign:"right",
                      color:profit>0?"#854F0B":profit<0?"#A32D2D":"#94a3b8" }}>
                      {profit>0?"+":""}{profit.toLocaleString("vi-VN")}đ
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          ) : (
          <div>
            {(form.departures||[]).length===0&&(
              <div style={{ padding:16, textAlign:"center", color:"#94a3b8", fontSize:13, border:"1px dashed #cbd5e1", borderRadius:10, marginBottom:10 }}>
                Chưa có đợt khởi hành nào. Bấm "+ Thêm đợt" để khai báo theo tháng/ngày.
              </div>
            )}
            {(form.departures||[]).map((d,idx)=>(
              <div key={d.id} style={{ border:"0.5px solid #e2e8f0", borderRadius:10, padding:14, marginBottom:10, background:"#fafdff" }}>
                <div style={{ display:"flex", gap:8, marginBottom:10, alignItems:"flex-end" }}>
                  <div style={{ flex:1.2 }}>
                    <label style={lbl}>Nhãn đợt</label>
                    <input value={d.label} onChange={e=>setDep(d.id,"label",e.target.value)}
                      placeholder="VD: Tháng 7 · hoặc Quốc Khánh" style={inp} />
                  </div>
                  <div style={{ flex:2 }}>
                    <label style={lbl}>Ngày khởi hành</label>
                    <input value={d.dates} onChange={e=>setDep(d.id,"dates",e.target.value)}
                      placeholder="VD: 11, 18, 25/07/2026" style={inp} />
                  </div>
                  <div style={{ flex:.8 }}>
                    <label style={lbl}>Số chỗ</label>
                    <input value={d.slots} onChange={e=>setDep(d.id,"slots",e.target.value)}
                      placeholder="VD: 40" style={inp} />
                  </div>
                  <button type="button" onClick={()=>removeDeparture(d.id)}
                    style={{ background:"#fef2f2", color:"#dc2626", border:"0.5px solid #fca5a5", borderRadius:8, padding:"9px 12px", cursor:"pointer", fontSize:12, fontWeight:600, whiteSpace:"nowrap" }}>🗑 Xóa đợt</button>
                </div>
                <table style={{ width:"100%", borderCollapse:"separate", borderSpacing:0, border:"0.5px solid #e2e8f0", borderRadius:8, overflow:"hidden", fontSize:12 }}>
                  <thead><tr style={{ background:"#f1f5f9" }}>
                    <th style={{...th,fontSize:10}}>Loại khách</th>
                    <th style={{...th,fontSize:10,color:"#A32D2D"}}>Giá mua</th>
                    <th style={{...th,fontSize:10,color:"#0F6E56"}}>Giá bán</th>
                  </tr></thead>
                  <tbody>
                    {[{key:"adult",label:form.ageLabels.adult},{key:"child",label:form.ageLabels.child},{key:"infant",label:form.ageLabels.infant}].map(row=>(
                      <tr key={row.key}>
                        <td style={{...td,fontWeight:600}}>{row.label}</td>
                        <td style={td}><input type="number" min={0} value={(d.buy&&d.buy[row.key])||""} onChange={e=>setDepPrice(d.id,"buy",row.key,e.target.value)}
                          style={{ width:"100%", padding:"6px 8px", borderRadius:6, border:"0.5px solid #fecaca", textAlign:"right", fontSize:12, background:"#fff5f5", boxSizing:"border-box" }} placeholder="0" /></td>
                        <td style={td}><input type="number" min={0} value={(d.sell&&d.sell[row.key])||""} onChange={e=>setDepPrice(d.id,"sell",row.key,e.target.value)}
                          style={{ width:"100%", padding:"6px 8px", borderRadius:6, border:"0.5px solid #bbf7d0", textAlign:"right", fontSize:12, background:"#f0fdf4", boxSizing:"border-box" }} placeholder="0" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <input value={d.note||""} onChange={e=>setDep(d.id,"note",e.target.value)}
                  placeholder="Ghi chú đợt (vd: phụ thu lễ, bao gồm gì thêm...)" style={{ ...inp, marginTop:8, fontSize:12 }} />
              </div>
            ))}
            <button type="button" onClick={addDeparture}
              style={{ width:"100%", background:"#eff6ff", color:"#2563eb", border:"1px dashed #93c5fd", borderRadius:8, padding:"10px", cursor:"pointer", fontSize:13, fontWeight:700 }}>
              + Thêm đợt khởi hành
            </button>
          </div>
          )}
        </div>

        <div style={secLbl}>Links tài liệu (Google Drive của đối tác)</div>

        <div style={{ gridColumn:"1/-1" }}>
          <div style={{ padding:"10px 14px", background:"#E6F1FB", borderRadius:8, fontSize:12, color:"#0C447C", marginBottom:10 }}>
            💡 Paste link Google Drive của đối tác — không cần upload file lên server.
          </div>
        </div>

        {[
          { key:"program",   label:"Chương trình hành trình", placeholder:"https://drive.google.com/... (PDF/Word chương trình tour)" },
          { key:"images",    label:"Thư mục ảnh tour",        placeholder:"https://drive.google.com/... (thư mục ảnh)" },
          { key:"pricelist", label:"Bảng giá đối tác",        placeholder:"https://drive.google.com/... (Excel/PDF bảng giá NCC)" },
          { key:"other",     label:"File khác",               placeholder:"https://drive.google.com/... (điều kiện, form đăng ký...)" },
        ].map(l=>(
          <div key={l.key} style={{ gridColumn:"1/-1" }}>
            <label style={lbl}>{l.label}</label>
            <div style={{ display:"flex", gap:8 }}>
              <input value={form.links[l.key]||""}
                onChange={e=>setLink(l.key,e.target.value)}
                placeholder={l.placeholder}
                style={{ ...inp, flex:1,
                  fontFamily:form.links[l.key]?"monospace":"inherit",
                  fontSize:form.links[l.key]?11:13 }} />
              {form.links[l.key]&&(
                <a href={form.links[l.key]} target="_blank" rel="noreferrer"
                  style={{ padding:"9px 14px", borderRadius:8, background:"#E6F1FB",
                    color:"#185FA5", fontSize:12, fontWeight:600,
                    textDecoration:"none", whiteSpace:"nowrap",
                    display:"flex", alignItems:"center", gap:4 }}>
                  ↗ Mở
                </a>
              )}
            </div>
          </div>
        ))}

        <div style={secLbl}>Dịch vụ & Chính sách</div>

        <div style={{ gridColumn:"1/-1" }}>
          <label style={lbl}>Bao gồm dịch vụ</label>
          <textarea value={form.includes} onChange={e=>set("includes",e.target.value)}
            rows={2} placeholder="Vé MB, KS 4★, ăn sáng, HDV tiếng Việt..."
            style={{ ...inp, resize:"vertical" }} />
        </div>
        <div style={{ gridColumn:"1/-1" }}>
          <label style={lbl}>Không bao gồm</label>
          <textarea value={form.excludes} onChange={e=>set("excludes",e.target.value)}
            rows={2} placeholder="Visa, bữa trưa/tối, chi phí cá nhân..."
            style={{ ...inp, resize:"vertical" }} />
        </div>

        <div style={{ gridColumn:"1/-1" }}>
          <label style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, fontWeight:600, cursor:"pointer" }}>
            <input type="checkbox" checked={form.visaRequired||false}
              onChange={e=>set("visaRequired",e.target.checked)} />
            Tour cần Visa
          </label>
          {form.visaRequired&&(
            <input value={form.visaNote||""} onChange={e=>set("visaNote",e.target.value)}
              placeholder="VD: Visa Nhật tự túc, MV hỗ trợ hồ sơ"
              style={{ ...inp, marginTop:8 }} />
          )}
        </div>

        <div>
          <label style={lbl}>Chính sách cọc với NCC</label>
          <input value={form.depositPolicy||""} onChange={e=>set("depositPolicy",e.target.value)}
            placeholder="VD: Cọc 30% khi booking" style={inp} />
        </div>
        <div>
          <label style={lbl}>Chính sách hủy</label>
          <input value={form.cancelPolicy||""} onChange={e=>set("cancelPolicy",e.target.value)}
            placeholder="VD: Hủy trước 15 ngày hoàn 80%" style={inp} />
        </div>

        <div style={{ gridColumn:"1/-1" }}>
          <label style={lbl}>Ghi chú nội bộ</label>
          <textarea value={form.notes||""} onChange={e=>set("notes",e.target.value)}
            rows={2} placeholder="VD: Tour cao cấp, ưu tiên khách VIP..."
            style={{ ...inp, resize:"vertical" }} />
        </div>

        <div style={{ gridColumn:"1/-1" }}>
          <label style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, fontWeight:600, cursor:"pointer" }}>
            <input type="checkbox" checked={form.active!==false}
              onChange={e=>set("active",e.target.checked)} />
            Đang kinh doanh (hiển thị trong danh mục)
          </label>
        </div>

      </div>

      <div style={{ display:"flex", gap:8, marginTop:24 }}>
        <button type="button" onClick={()=>{
          if(!form.name.trim()) { alert("Nhập tên tour"); return; }
          if(!form.partnerId&&!form.partnerName) { alert("Chọn hoặc nhập tên đối tác"); return; }
          const id = (initial?.id && !isClone) || (
            "TG-"+(form.type==="international"?"QT":"QN")+"-"+String(Date.now()).slice(-4)
          );
          onSave({ ...form, id, updatedAt:new Date().toISOString() });
        }}
          style={{ background:"#0F6E56", color:"#fff", border:"none", borderRadius:8,
            padding:"10px 28px", cursor:"pointer", fontSize:13, fontWeight:600 }}>
          {isClone ? "Tạo bản sao" : initial ? "Lưu thay đổi" : "Thêm sản phẩm"}
        </button>
        <button type="button" onClick={onCancel}
          style={{ background:"#f1f5f9", border:"none", borderRadius:8,
            padding:"10px 20px", cursor:"pointer", fontSize:13 }}>
          Hủy
        </button>
      </div>
    </div>
  );
}

// ── TourGhepProductCard (defined OUTSIDE TourGhepModule) ─────
function TourGhepProductCard({ product:p, onEdit, onClone, onSelect, orderCount, canSeeSecret, canEdit }) {
  const deps = Array.isArray(p.departures) ? p.departures : [];
  const hasSchedule = p.useSchedule && deps.length>0;
  const depSells = deps.map(d=>(d.sell&&d.sell.adult)||0).filter(x=>x>0);
  const depBuys  = deps.map(d=>(d.buy&&d.buy.adult)||0).filter(x=>x>0);
  const dispSell = hasSchedule ? (depSells.length?Math.min(...depSells):0) : (p.sellPrices?.adult||0);
  const dispBuy  = hasSchedule ? (depBuys.length?Math.min(...depBuys):0)  : (p.buyPrices?.adult||0);
  const profit = dispSell-dispBuy;
  const margin = dispSell>0 ? (profit/dispSell*100).toFixed(1) : 0;
  const linkBtn = { display:"inline-flex", alignItems:"center", gap:4, padding:"4px 10px",
    borderRadius:6, fontSize:11, fontWeight:500, background:"#E6F1FB",
    color:"#185FA5", textDecoration:"none" };

  return (
    <div style={{ background:"#fff", borderRadius:12,
      border:`0.5px solid ${p.active?"#e2e8f0":"#f1f5f9"}`,
      opacity:p.active?1:0.6, display:"flex", flexDirection:"column",
      boxShadow:"0 1px 4px rgba(0,0,0,.06)" }}>

      <div style={{ height:3, borderRadius:"12px 12px 0 0",
        background:p.type==="international"?"#534AB7":"#0F6E56" }} />

      <div style={{ padding:"14px 16px", flex:1, display:"flex", flexDirection:"column", gap:10 }}>

        <div>
          <div style={{ fontSize:10, fontWeight:600, letterSpacing:".5px",
            textTransform:"uppercase", marginBottom:4,
            color:p.type==="international"?"#534AB7":"#0F6E56" }}>
            {p.type==="international"?"🌍 Quốc tế":"🏔 Quốc nội"}
            {p.region&&` · ${p.region}`}
          </div>
          <div style={{ fontWeight:600, fontSize:14, color:"#1e293b", lineHeight:1.3 }}>
            {p.name}
          </div>
          <div style={{ fontSize:12, color:"#64748b", marginTop:2 }}>
            {p.duration}{p.typicalSchedule&&` · ${p.typicalSchedule}`}
          </div>
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 10px",
          background:"#f8fafc", borderRadius:8, fontSize:12 }}>
          <span style={{ fontSize:13, color:"#64748b" }}>🏢</span>
          {canSeeSecret
            ? <span><strong>{p.partnerName||"—"}</strong>{p.partnerCode&&<span style={{ color:"#94a3b8", fontFamily:"monospace", marginLeft:6, fontSize:11 }}>{p.partnerCode}</span>}</span>
            : <span style={{ color:"#94a3b8", fontStyle:"italic" }}>Đối tác uy tín</span>
          }
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
          {canSeeSecret ? (
            <div style={{ padding:"8px 10px", background:"#fff5f5", borderRadius:8, fontSize:11 }}>
              <div style={{ color:"#94a3b8", marginBottom:2 }}>Giá mua NL{hasSchedule&&" (từ)"}</div>
              <div style={{ fontWeight:600, color:"#A32D2D" }}>
                {dispBuy.toLocaleString("vi-VN")}đ
              </div>
            </div>
          ) : (
            <div style={{ padding:"8px 10px", background:"#f8fafc", borderRadius:8, fontSize:11 }}>
              <div style={{ color:"#94a3b8", marginBottom:2 }}>Giá vốn</div>
              <div style={{ fontWeight:600, color:"#94a3b8", letterSpacing:3 }}>••••••</div>
            </div>
          )}
          <div style={{ padding:"8px 10px", background:"#f0fdf4", borderRadius:8, fontSize:11 }}>
            <div style={{ color:"#94a3b8", marginBottom:2 }}>Giá bán NL{hasSchedule&&" (từ)"}</div>
            <div style={{ fontWeight:600, color:"#0F6E56" }}>
              {dispSell.toLocaleString("vi-VN")}đ
            </div>
          </div>
        </div>

        {hasSchedule&&(
          <div style={{ background:"#fff7ed", border:"0.5px solid #fed7aa", borderRadius:8, padding:"8px 10px", fontSize:11 }}>
            <div style={{ color:"#9a3412", fontWeight:700, marginBottom:4 }}>📅 Lịch khởi hành ({deps.length} đợt)</div>
            <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
              {deps.slice(0,4).map(d=>(
                <div key={d.id} style={{ color:"#7c2d12" }}>
                  <b>{d.label||"Đợt"}</b>{d.dates?`: ${d.dates}`:""}
                </div>
              ))}
              {deps.length>4&&<div style={{ color:"#9a3412" }}>… +{deps.length-4} đợt khác</div>}
            </div>
          </div>
        )}

        {canSeeSecret&&(
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:12 }}>
            <span style={{ color:"#64748b" }}>Lãi / suất NL</span>
            <span style={{ fontWeight:700, color: profit>0?"#854F0B":"#A32D2D" }}>
              {profit>0?"+":""}{profit.toLocaleString("vi-VN")}đ ({margin}%)
            </span>
          </div>
        )}

        {p.visaRequired&&(
          <div style={{ fontSize:11, color:"#534AB7", background:"#EEEDFE",
            borderRadius:6, padding:"4px 8px" }}>
            🛂 Visa bắt buộc{p.visaNote&&` · ${p.visaNote}`}
          </div>
        )}

        {(p.links?.program||p.links?.images||p.links?.pricelist)&&(
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {p.links?.program&&(
              <a href={p.links.program} target="_blank" rel="noreferrer" style={linkBtn}>
                📋 Chương trình
              </a>
            )}
            {p.links?.images&&(
              <a href={p.links.images} target="_blank" rel="noreferrer" style={linkBtn}>
                🖼 Ảnh tour
              </a>
            )}
            {canSeeSecret&&p.links?.pricelist&&(
              <a href={p.links.pricelist} target="_blank" rel="noreferrer"
                style={{ ...linkBtn, background:"#FAEEDA", color:"#633806" }}>
                💰 Bảng giá NCC
              </a>
            )}
            {canSeeSecret&&p.links?.other&&(
              <a href={p.links.other} target="_blank" rel="noreferrer"
                style={{ ...linkBtn, background:"#f1f5f9", color:"#374151" }}>
                📎 File khác
              </a>
            )}
          </div>
        )}

        {orderCount>0&&(
          <div style={{ fontSize:11, color:"#64748b" }}>Đã bán {orderCount} đơn</div>
        )}

        {p.notes&&(
          <div style={{ fontSize:11, color:"#633806", padding:"4px 8px",
            background:"#fef9e7", borderRadius:6, borderLeft:"2px solid #e8c53a" }}>
            {p.notes}
          </div>
        )}
      </div>

      <div style={{ padding:"10px 16px", borderTop:"0.5px solid #f1f5f9", display:"flex", gap:8 }}>
        <button type="button" onClick={()=>onSelect(p)}
          style={{ flex:1, background:"#0F6E56", color:"#fff", border:"none",
            borderRadius:8, padding:"8px 0", cursor:"pointer", fontSize:12, fontWeight:600 }}>
          Tạo đơn
        </button>
        {canEdit&&(
          <button type="button" onClick={()=>onClone(p)} title="Tạo bản sao tour này để sửa nhanh"
            style={{ padding:"8px 12px", background:"#E1F5EE",
              border:"0.5px solid #b6e3d4", borderRadius:8,
              cursor:"pointer", fontSize:12, color:"#085041", fontWeight:600 }}>
            ⧉ Nhân bản
          </button>
        )}
        {canEdit&&(
          <button type="button" onClick={()=>onEdit(p)}
            style={{ padding:"8px 14px", background:"#f8fafc",
              border:"0.5px solid #e2e8f0", borderRadius:8,
              cursor:"pointer", fontSize:12, color:"#374151" }}>
            Sửa
          </button>
        )}
      </div>
    </div>
  );
}

// ── TourGhepModule (main) ────────────────────────────────────
function TourGhepModule({ tourGhepProducts=[], onUpdateTourGhepProducts,
                          orders=[], suppliers=[], onCreateOrder,
                          pushNotif, currentRole, currentUser }) {

  const [search,        setSearch]        = React.useState("");
  const [filterType,    setFilterType]    = React.useState("all");
  const [filterPartner, setFilterPartner] = React.useState("");
  const [filterPrice,   setFilterPrice]   = React.useState("");
  const [showInactive,  setShowInactive]  = React.useState(false);
  const [showForm,      setShowForm]      = React.useState(false);
  const [editProduct,   setEditProduct]   = React.useState(null);
  const [cloneMode,     setCloneMode]     = React.useState(false);

  const handleClone = (p) => {
    const { id, createdAt, createdBy, ...rest } = p;
    setEditProduct({ ...rest, name:(p.name||"")+" (bản sao)", active:true });
    setCloneMode(true);
    setShowForm(true);
    if(typeof window!=="undefined") window.scrollTo({top:0,behavior:"smooth"});
  };

  const canSeeSecret = canSeeTourGhepSensitive(currentUser);
  const canEdit      = ["manager","dieu_hanh"].includes(currentRole);

  const filtered = React.useMemo(()=>{
    return (tourGhepProducts||[]).filter(p=>{
      if(!showInactive&&!p.active) return false;
      if(search){
        const q=search.toLowerCase();
        const hay=[p.name,p.destination,p.partnerName,p.partnerCode,p.region].join(" ").toLowerCase();
        if(!hay.includes(q)) return false;
      }
      if(filterType!=="all"&&p.type!==filterType) return false;
      if(filterPartner&&p.partnerName!==filterPartner) return false;
      const price=p.sellPrices?.adult||0;
      if(filterPrice==="under5"  &&price>=5e6)              return false;
      if(filterPrice==="5to15"   &&(price<5e6||price>=15e6)) return false;
      if(filterPrice==="15to30"  &&(price<15e6||price>=30e6))return false;
      if(filterPrice==="over30"  &&price<30e6)               return false;
      return true;
    });
  },[tourGhepProducts,search,filterType,filterPartner,filterPrice,showInactive]);

  const handleSave = (product) => {
    const list = tourGhepProducts||[];
    const exists = list.find(p=>p.id===product.id);
    const updated = exists
      ? list.map(p=>p.id===product.id?product:p)
      : [...list, { ...product, createdAt:new Date().toISOString(), createdBy:currentUser?.username }];
    onUpdateTourGhepProducts(updated);
    setShowForm(false);
    setEditProduct(null);
    pushNotif&&pushNotif(exists?"Đã cập nhật sản phẩm":"Đã thêm sản phẩm "+product.name,"success");
  };

  const handleSelect = (product) => {
    if(onCreateOrder) {
      onCreateOrder({
        service:           "tour_ghep",
        tourGhepProductId: product.id,
        tourType:          product.type,
        tourName:          product.name,
        partnerName:       product.partnerName,
        partnerCode:       product.partnerCode,
        buyPriceAdult:     product.buyPrices?.adult||0,
        buyPriceChild:     product.buyPrices?.child||0,
        buyPriceInfant:    product.buyPrices?.infant||0,
        adultPrice:        product.sellPrices?.adult||0,
        childPrice:        product.sellPrices?.child||0,
        babyPrice:         product.sellPrices?.infant||0,
        visaRequired:      product.visaRequired||false,
        visaNote:          product.visaNote||"",
        includes:          product.includes||"",
        excludes:          product.excludes||"",
        cancelPolicy:      product.cancelPolicy||"",
      });
    }
  };

  const partnerList = [...new Set((tourGhepProducts||[]).map(p=>p.partnerName).filter(Boolean))].sort();

  return (
    <div style={{ padding:24 }}>

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
        <div>
          <h2 style={{ margin:0, fontSize:18, fontWeight:500, color:"#1e293b" }}>Tour Ghép</h2>
          <div style={{ fontSize:13, color:"#64748b", marginTop:3 }}>
            {(tourGhepProducts||[]).filter(p=>p.type==="international"&&p.active).length} quốc tế ·{" "}
            {(tourGhepProducts||[]).filter(p=>p.type==="domestic"&&p.active).length} quốc nội ·{" "}
            {(tourGhepProducts||[]).filter(p=>p.active).length} đang kinh doanh
          </div>
        </div>
        {canEdit&&!showForm&&(
          <button type="button" onClick={()=>{setEditProduct(null);setCloneMode(false);setShowForm(true);}}
            style={{ background:"#0F6E56", color:"#fff", border:"none",
              borderRadius:9, padding:"9px 20px", cursor:"pointer",
              fontWeight:600, fontSize:13 }}>
            + Thêm sản phẩm
          </button>
        )}
      </div>

      {showForm&&(
        <TourGhepProductForm
          initial={editProduct}
          isClone={cloneMode}
          onSave={(prod)=>{handleSave(prod);setCloneMode(false);}}
          onCancel={()=>{setShowForm(false);setEditProduct(null);setCloneMode(false);}}
          suppliers={suppliers}
        />
      )}

      <input placeholder="Tìm tên tour, điểm đến, đối tác, mã tour..."
        value={search} onChange={e=>setSearch(e.target.value)}
        style={{ width:"100%", padding:"10px 14px", borderRadius:10,
          border:"0.5px solid #e2e8f0", fontSize:13, marginBottom:12,
          boxSizing:"border-box", outline:"none" }} />

      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:16 }}>
        {[
          {val:"all",label:"Tất cả"},
          {val:"international",label:"🌍 Quốc tế"},
          {val:"domestic",label:"🏔 Quốc nội"},
        ].map(f=>(
          <button key={f.val} type="button" onClick={()=>setFilterType(f.val)}
            style={{ padding:"6px 14px", borderRadius:20, border:"none", cursor:"pointer",
              fontSize:12, fontWeight:600,
              background:filterType===f.val?"#1e293b":"#f1f5f9",
              color:filterType===f.val?"#fff":"#64748b" }}>
            {f.label}
          </button>
        ))}

        {partnerList.length>0&&(
          <select value={filterPartner} onChange={e=>setFilterPartner(e.target.value)}
            style={{ padding:"6px 12px", borderRadius:20, border:"0.5px solid #e2e8f0",
              fontSize:12, background:"#fff", cursor:"pointer" }}>
            <option value="">Tất cả đối tác</option>
            {partnerList.map(n=><option key={n} value={n}>{n}</option>)}
          </select>
        )}

        <select value={filterPrice} onChange={e=>setFilterPrice(e.target.value)}
          style={{ padding:"6px 12px", borderRadius:20, border:"0.5px solid #e2e8f0",
            fontSize:12, background:"#fff", cursor:"pointer" }}>
          <option value="">Mọi mức giá</option>
          <option value="under5">Dưới 5 triệu</option>
          <option value="5to15">5 – 15 triệu</option>
          <option value="15to30">15 – 30 triệu</option>
          <option value="over30">Trên 30 triệu</option>
        </select>

        <button type="button" onClick={()=>setShowInactive(!showInactive)}
          style={{ padding:"6px 14px", borderRadius:20, fontSize:12, fontWeight:600,
            border:"0.5px solid #e2e8f0", cursor:"pointer",
            background:showInactive?"#FAEEDA":"#fff",
            color:showInactive?"#633806":"#64748b" }}>
          {showInactive?"Ẩn tour dừng":"Hiện tour dừng"}
        </button>
      </div>

      {filtered.length===0?(
        <div style={{ textAlign:"center", padding:48, color:"#94a3b8" }}>
          <div style={{ fontSize:32, marginBottom:8 }}>📦</div>
          <div style={{ fontSize:14, fontWeight:500, marginBottom:4 }}>
            {search||filterPartner||filterPrice||(!(tourGhepProducts||[]).length)
              ?"Không tìm thấy sản phẩm phù hợp"
              :"Chưa có sản phẩm tour ghép"}
          </div>
          {canEdit&&!(tourGhepProducts||[]).length&&(
            <div style={{ fontSize:13, color:"#64748b" }}>
              Nhấn "+ Thêm sản phẩm" để bắt đầu xây dựng danh mục
            </div>
          )}
        </div>
      ):(
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:14 }}>
          {filtered.map(p=>(
            <TourGhepProductCard
              key={p.id}
              product={p}
              onEdit={(p)=>{setEditProduct(p);setCloneMode(false);setShowForm(true);}}
              onClone={handleClone}
              onSelect={handleSelect}
              orderCount={(orders||[]).filter(o=>o.tourGhepProductId===p.id).length}
              canSeeSecret={canSeeSecret}
              canEdit={canEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const NCC_SERVICE_TYPES = {
  // Vận chuyển
  HANG_KHONG:      "Hàng không",
  DUONG_BO:        "Đường bộ",
  DUONG_SAT:       "Đường sắt",
  DUONG_THUY:      "Đường thủy",
  TAU_CAO_TOC:     "Tàu cao tốc / Speedboat",
  // Lưu trú
  KHACH_SAN:       "Khách sạn",
  RESORT:          "Resort",
  VILLA:           "Villa",
  HOMESTAY:        "Homestay",
  FARMSTAY:        "Farmstay",
  BUNGALOW:        "Bungalow",
  NHA_NGHI:        "Nhà nghỉ",
  KHU_SINH_THAI:   "Khu sinh thái",
  // Du thuyền
  DU_THUYEN_NGAY:  "Du thuyền ngày",
  DU_THUYEN_DEM:   "Du thuyền đêm",
  // Điểm đến & Dịch vụ
  NHA_HANG:        "Nhà hàng",
  VE_THAM_QUAN:    "Vé tham quan",
  VE_VUI_CHOI:     "Vé vui chơi / Giải trí",
  HUONG_DAN_VIEN:  "Hướng dẫn viên",
  BAO_HIEM:        "Bảo hiểm",
  SPA:             "Spa & Wellness",
  VISA:            "Dịch vụ visa",
  GOLF:            "Golf",
  // Lữ hành / Land tour
  TOUR_GHEP_QT:    "Tour ghép Quốc tế",
  TOUR_GHEP_ND:    "Tour ghép Nội địa",
  LANDTOUR_QT:     "Landtour Quốc tế",
  LANDTOUR_ND:     "Landtour Nội địa",
  KHAC:            "Khác",
};

const NCC_SERVICE_GROUPS = {
  "Vận chuyển":   ["Hàng không","Đường bộ","Đường sắt","Đường thủy","Tàu cao tốc / Speedboat"],
  "Lưu trú":      ["Khách sạn","Resort","Villa","Homestay","Farmstay","Bungalow","Nhà nghỉ","Khu sinh thái"],
  "Du thuyền":    ["Du thuyền ngày","Du thuyền đêm"],
  "Ăn uống":      ["Nhà hàng"],
  "Lữ hành / Land tour": ["Tour ghép Quốc tế","Tour ghép Nội địa","Landtour Quốc tế","Landtour Nội địa"],
  "Dịch vụ":      ["Vé tham quan","Vé vui chơi / Giải trí","Hướng dẫn viên","Bảo hiểm","Spa & Wellness","Dịch vụ visa","Golf","Khác"],
};

const ALL_NCC_SERVICE_TYPES = Object.values(NCC_SERVICE_TYPES);

const SEED_SUPPLIERS = [
  {
    id:"ncc-001", ma_ncc:"NCC-001", ten:"Vietnam Airlines",
    loai_hinh:["Hàng không"],
    khu_vuc_hoat_dong:["Hà Nội","TP. Hồ Chí Minh","Đà Nẵng","Phú Quốc"],
    sdt:"1900 1100", email:"agency@vietnamairlines.com", nguoi_lien_he:"Phòng đại lý",
    tai_khoan_ngan_hang:{ ngan_hang:"Vietcombank", so_tk:"0011001234567", chu_tk:"TỔNG CÔNG TY HÀNG KHÔNG VN" },
    cong_no:0, trang_thai_hop_dong:"chua", nguoi_phu_trach:"", danh_gia_noi_bo:4, ghi_chu_uu_tien:"",
    dich_vu:[{
      id:"sv-001-1", loai:"Hàng không", ten_dich_vu:"Vietnam Airlines — Nội địa",
      khu_vuc:{ tinh_thanh:["Hà Nội","TP. Hồ Chí Minh","Đà Nẵng","Phú Quốc"], vung_mien:"Bắc", loai:"Nội địa" },
      phan_khuc:"Mid-range",
      gia_tham_khao:{ tu:800000, den:3500000, don_vi:"người", ghi_chu:"Chưa bao gồm thuế phí" },
      mua_cao_diem:"Tết, Hè (tháng 6–8), 30/4–1/5",
      chinh_sach_huy:"Hoàn vé trước 24h, phí 10–30% tùy hạng vé",
      dieu_kien_booking:"Xuất vé trong 24h sau khi giữ chỗ",
      active:true,
      meta:{ hang_bay:"Vietnam Airlines", duong_bay:"Tất cả nội địa", hang_ve:["Economy","Business"] }
    }],
    created_at:"2024-01-01T00:00:00Z", updated_at:"2024-01-01T00:00:00Z",
  },
  {
    id:"ncc-002", ma_ncc:"NCC-002", ten:"Vietjet Air",
    loai_hinh:["Hàng không"],
    khu_vuc_hoat_dong:["Hà Nội","TP. Hồ Chí Minh","Đà Nẵng"],
    sdt:"1900 1886", email:"b2b@vietjetair.com", nguoi_lien_he:"Phòng B2B",
    tai_khoan_ngan_hang:{ ngan_hang:"Techcombank", so_tk:"19034567891011", chu_tk:"CÔNG TY CP HÀNG KHÔNG VIETJET" },
    cong_no:0, trang_thai_hop_dong:"chua", nguoi_phu_trach:"", danh_gia_noi_bo:3, ghi_chu_uu_tien:"",
    dich_vu:[{
      id:"sv-002-1", loai:"Hàng không", ten_dich_vu:"Vietjet Air — Nội địa",
      khu_vuc:{ tinh_thanh:["Hà Nội","TP. Hồ Chí Minh","Đà Nẵng"], vung_mien:"Bắc", loai:"Nội địa" },
      phan_khuc:"Budget",
      gia_tham_khao:{ tu:299000, den:1500000, don_vi:"người", ghi_chu:"Giá flash sale đến giá thông thường" },
      mua_cao_diem:"Tết, Hè",
      chinh_sach_huy:"Không hoàn vé, chỉ đổi tên/ngày có phí",
      dieu_kien_booking:"Thanh toán ngay khi booking",
      active:true,
      meta:{ hang_bay:"Vietjet Air", duong_bay:"Tất cả nội địa", hang_ve:["Economy","SkyBoss"] }
    }],
    created_at:"2024-01-01T00:00:00Z", updated_at:"2024-01-01T00:00:00Z",
  },
  {
    id:"ncc-005", ma_ncc:"NCC-005", ten:"KS Vinpearl Phú Quốc",
    loai_hinh:["Lưu trú","Spa & Wellness","Vé tham quan"],
    khu_vuc_hoat_dong:["Phú Quốc"],
    sdt:"0297 3599 999", email:"b2b.pq@vinpearl.com", nguoi_lien_he:"Ms. Lan — Sales Manager",
    tai_khoan_ngan_hang:{ ngan_hang:"BIDV", so_tk:"31410000123456", chu_tk:"CÔNG TY CP VINPEARL" },
    cong_no:0, trang_thai_hop_dong:"co", nguoi_phu_trach:"", danh_gia_noi_bo:5,
    ghi_chu_uu_tien:"Ưu tiên dùng cho tour cao cấp Phú Quốc. Liên hệ Ms. Lan trước 3 ngày.",
    dich_vu:[
      {
        id:"sv-005-1", loai:"Khách sạn", ten_dich_vu:"Vinpearl Resort & Spa Phú Quốc",
        khu_vuc:{ tinh_thanh:["Phú Quốc"], vung_mien:"Nam", loai:"Nội địa" },
        phan_khuc:"Cao cấp",
        gia_tham_khao:{ tu:2500000, den:8000000, don_vi:"đêm", ghi_chu:"Tùy loại phòng, chưa bao gồm ăn sáng" },
        mua_cao_diem:"Tháng 11 – tháng 4",
        chinh_sach_huy:"Hủy trước 7 ngày miễn phí, sau đó mất 1 đêm",
        dieu_kien_booking:"Đặt cọc 30% trong 24h",
        active:true,
        meta:{ hang_sao:5, loai_phong:["Deluxe","Premier","Suite","Villa"], so_phong:750, extra_bed:true, an_sang:false, tien_ich:["Hồ bơi","Spa","Gym","Bãi biển riêng","Nhà hàng"] }
      },
      {
        id:"sv-005-2", loai:"Spa & Wellness", ten_dich_vu:"Vinpearl Spa Phú Quốc",
        khu_vuc:{ tinh_thanh:["Phú Quốc"], vung_mien:"Nam", loai:"Nội địa" },
        phan_khuc:"Cao cấp",
        gia_tham_khao:{ tu:500000, den:2000000, don_vi:"người", ghi_chu:"Tùy gói dịch vụ" },
        mua_cao_diem:"", chinh_sach_huy:"Hủy trước 4h miễn phí", dieu_kien_booking:"Đặt lịch trước 1 ngày",
        active:true, meta:{}
      },
      {
        id:"sv-005-3", loai:"Vé tham quan", ten_dich_vu:"Vinpearl Safari & Vinpearl Land",
        khu_vuc:{ tinh_thanh:["Phú Quốc"], vung_mien:"Nam", loai:"Nội địa" },
        phan_khuc:"Mid-range",
        gia_tham_khao:{ tu:350000, den:900000, don_vi:"người", ghi_chu:"Người lớn/trẻ em có giá khác nhau" },
        mua_cao_diem:"Tết, Hè", chinh_sach_huy:"Không hoàn vé đã xuất", dieu_kien_booking:"Đặt trước ít nhất 1 ngày cho đoàn",
        active:true, meta:{}
      }
    ],
    created_at:"2024-01-01T00:00:00Z", updated_at:"2024-01-01T00:00:00Z",
  },
  {
    id:"ncc-008", ma_ncc:"NCC-008", ten:"Du thuyền Paradise Elegance",
    loai_hinh:["Du thuyền đêm"],
    khu_vuc_hoat_dong:["Quảng Ninh"],
    sdt:"0203 3648 888", email:"booking@paradise-cruises.vn", nguoi_lien_he:"Mr. Đức — Reservation",
    tai_khoan_ngan_hang:{ ngan_hang:"Vietcombank", so_tk:"0021009876543", chu_tk:"CÔNG TY CP DU THUYỀN PARADISE" },
    cong_no:0, trang_thai_hop_dong:"co", nguoi_phu_trach:"", danh_gia_noi_bo:4,
    ghi_chu_uu_tien:"Hạ Long — ưu tiên cho tour cao cấp. Cần xác nhận sớm mùa cao điểm.",
    dich_vu:[{
      id:"sv-008-1", loai:"Du thuyền đêm", ten_dich_vu:"Paradise Elegance — Hạ Long 2N1Đ",
      khu_vuc:{ tinh_thanh:["Quảng Ninh"], vung_mien:"Bắc", loai:"Nội địa" },
      phan_khuc:"Cao cấp",
      gia_tham_khao:{ tu:3800000, den:7500000, don_vi:"người", ghi_chu:"Đã bao gồm ăn uống và tham quan" },
      mua_cao_diem:"Tháng 3–5, Tháng 9–11",
      chinh_sach_huy:"Hủy trước 30 ngày hoàn 80%, trước 15 ngày hoàn 50%",
      dieu_kien_booking:"Đặt cọc 50% khi xác nhận",
      active:true,
      meta:{ ten_thuyen:"Paradise Elegance", hang_thuyen:"Paradise Cruises", hanh_trinh:"Hạ Long – Hang Sửng Sốt – Làng chài Cửa Vạn", loai_cabin:["Deluxe Ocean View","Suite","Premium Suite"], so_cabin:22, dich_vu_kem:["Kayak","Đạp xe","Nấu ăn","Tắm hang động"] }
    }],
    created_at:"2024-01-01T00:00:00Z", updated_at:"2024-01-01T00:00:00Z",
  },
];

// ══════════════════════════════════════════════════════════════
// HELPER SUB-COMPONENTS (defined outside SupplierModule)
// ══════════════════════════════════════════════════════════════

function StarRating({ value=0, onChange, size=18 }){
  const [hover,setHover]=React.useState(0);
  return(
    <span style={{display:"inline-flex",gap:2}}>
      {[1,2,3,4,5].map(i=>(
        <span key={i} style={{fontSize:size,cursor:onChange?"pointer":"default",color:(hover||value)>=i?"#f59e0b":"#d1d5db",transition:"color .1s"}}
          onMouseEnter={()=>onChange&&setHover(i)} onMouseLeave={()=>onChange&&setHover(0)}
          onClick={()=>onChange&&onChange(i)}>★</span>
      ))}
    </span>
  );
}

function ContractBadge({ status }){
  const MAP={co:{bg:"#dcfce7",c:"#15803d",label:"Có HĐ"},chua:{bg:"#fee2e2",c:"#dc2626",label:"Thiếu HĐ"},het_han:{bg:"#fef9c3",c:"#92400e",label:"Hết hạn"}};
  const s=MAP[status]||MAP.chua;
  return <span style={{background:s.bg,color:s.c,borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:700}}>{s.label}</span>;
}

function ServiceTypeBadge({ loai }){
  const colors={"Hàng không":"#dbeafe","Khách sạn":"#fce7f3","Resort":"#fce7f3","Villa":"#fce7f3","Homestay":"#dcfce7","Farmstay":"#dcfce7","Bungalow":"#f0fdf4","Nhà nghỉ":"#f0fdf4","Khu sinh thái":"#dcfce7","Du thuyền ngày":"#ede9fe","Du thuyền đêm":"#ede9fe","Tàu cao tốc / Speedboat":"#e0f2fe","Spa & Wellness":"#fdf4ff","Nhà hàng":"#fef3c7","Vé tham quan":"#ecfdf5","Vé vui chơi / Giải trí":"#fef9c3","Đường bộ":"#fff7ed","Đường thủy":"#e0f2fe","Đường sắt":"#f3f4f6","Hướng dẫn viên":"#f0fdf4","Bảo hiểm":"#eff6ff","Dịch vụ visa":"#f5f3ff","Golf":"#f0fdf4","Khác":"#f8fafc"};
  const textColors={"Hàng không":"#1d4ed8","Khách sạn":"#9d174d","Resort":"#be185d","Villa":"#be185d","Homestay":"#15803d","Farmstay":"#166534","Bungalow":"#14532d","Nhà nghỉ":"#14532d","Khu sinh thái":"#15803d","Du thuyền ngày":"#6d28d9","Du thuyền đêm":"#6d28d9","Tàu cao tốc / Speedboat":"#0369a1","Spa & Wellness":"#7e22ce","Nhà hàng":"#92400e","Vé tham quan":"#065f46","Vé vui chơi / Giải trí":"#713f12","Đường bộ":"#9a3412","Đường thủy":"#075985","Đường sắt":"#374151","Hướng dẫn viên":"#14532d","Bảo hiểm":"#1e40af","Dịch vụ visa":"#4c1d95","Golf":"#14532d","Khác":"#475569"};
  return(
    <span style={{background:colors[loai]||"#f1f5f9",color:textColors[loai]||"#475569",fontSize:11,borderRadius:4,padding:"2px 7px",fontWeight:600,display:"inline-block"}}>{loai}</span>
  );
}

function fmtMoneyK(n){
  if(!n) return "—";
  if(n>=1000000) return (n/1000000).toFixed(n%1000000===0?0:1)+"tr";
  if(n>=1000) return Math.round(n/1000)+"k";
  return n.toLocaleString("vi-VN");
}

function ServiceMetaFields({ loai, meta={}, onChange }){
  const upd=(k,v)=>onChange({...meta,[k]:v});
  const tog=(arr=[],v)=>arr.includes(v)?arr.filter(x=>x!==v):[...arr,v];

  if(["Hàng không"].includes(loai)) return(
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
      <label style={{gridColumn:"1/-1"}}>
        <div style={lbl}>Hãng bay</div>
        <input value={meta.hang_bay||""} onChange={e=>upd("hang_bay",e.target.value)} style={inp}/>
      </label>
      <label style={{gridColumn:"1/-1"}}>
        <div style={lbl}>Đường bay</div>
        <input value={meta.duong_bay||""} onChange={e=>upd("duong_bay",e.target.value)} style={inp}/>
      </label>
      <div style={{gridColumn:"1/-1"}}>
        <div style={lbl}>Hạng vé</div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:4}}>
          {["Economy","Business","First","SkyBoss"].map(v=>(
            <label key={v} style={{display:"flex",alignItems:"center",gap:4,fontSize:13,cursor:"pointer"}}>
              <input type="checkbox" checked={(meta.hang_ve||[]).includes(v)} onChange={()=>upd("hang_ve",tog(meta.hang_ve,v))}/>
              {v}
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  if(["Khách sạn","Villa","Homestay","Bungalow","Nhà nghỉ"].includes(loai)) return(
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
      <div style={{gridColumn:"1/-1"}}>
        <div style={lbl}>Hạng sao</div>
        <StarRating value={meta.hang_sao||0} onChange={v=>upd("hang_sao",v)} size={22}/>
      </div>
      <label>
        <div style={lbl}>Số phòng</div>
        <input type="number" value={meta.so_phong||""} onChange={e=>upd("so_phong",+e.target.value)} style={inp}/>
      </label>
      <div style={{display:"flex",gap:16,alignItems:"center",paddingTop:18}}>
        <label style={{display:"flex",gap:4,alignItems:"center",fontSize:13,cursor:"pointer"}}>
          <input type="checkbox" checked={!!meta.extra_bed} onChange={e=>upd("extra_bed",e.target.checked)}/> Extra bed
        </label>
        <label style={{display:"flex",gap:4,alignItems:"center",fontSize:13,cursor:"pointer"}}>
          <input type="checkbox" checked={!!meta.an_sang} onChange={e=>upd("an_sang",e.target.checked)}/> Ăn sáng
        </label>
      </div>
      <label style={{gridColumn:"1/-1"}}>
        <div style={lbl}>Loại phòng (cách nhau bởi dấu phẩy)</div>
        <input value={(meta.loai_phong||[]).join(",")} onChange={e=>upd("loai_phong",e.target.value.split(",").map(x=>x.trim()).filter(Boolean))} style={inp}/>
      </label>
      <label style={{gridColumn:"1/-1"}}>
        <div style={lbl}>Tiện ích (cách nhau bởi dấu phẩy)</div>
        <input value={(meta.tien_ich||[]).join(",")} onChange={e=>upd("tien_ich",e.target.value.split(",").map(x=>x.trim()).filter(Boolean))} style={inp}/>
      </label>
    </div>
  );

  if(["Du thuyền ngày","Du thuyền đêm"].includes(loai)) return(
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
      <label><div style={lbl}>Tên thuyền</div><input value={meta.ten_thuyen||""} onChange={e=>upd("ten_thuyen",e.target.value)} style={inp}/></label>
      <label><div style={lbl}>Hãng thuyền</div><input value={meta.hang_thuyen||""} onChange={e=>upd("hang_thuyen",e.target.value)} style={inp}/></label>
      <label style={{gridColumn:"1/-1"}}><div style={lbl}>Hành trình</div><input value={meta.hanh_trinh||""} onChange={e=>upd("hanh_trinh",e.target.value)} style={inp}/></label>
      <label><div style={lbl}>Số cabin</div><input type="number" value={meta.so_cabin||""} onChange={e=>upd("so_cabin",+e.target.value)} style={inp}/></label>
      <label><div style={lbl}>Loại cabin (phẩy phân cách)</div><input value={(meta.loai_cabin||[]).join(",")} onChange={e=>upd("loai_cabin",e.target.value.split(",").map(x=>x.trim()).filter(Boolean))} style={inp}/></label>
      <label style={{gridColumn:"1/-1"}}><div style={lbl}>Dịch vụ kèm (phẩy phân cách)</div><input value={(meta.dich_vu_kem||[]).join(",")} onChange={e=>upd("dich_vu_kem",e.target.value.split(",").map(x=>x.trim()).filter(Boolean))} style={inp}/></label>
    </div>
  );

  if(["Nhà hàng"].includes(loai)) return(
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
      <label><div style={lbl}>Loại ẩm thực</div><input value={meta.loai_am_thuc||""} onChange={e=>upd("loai_am_thuc",e.target.value)} style={inp}/></label>
      <label><div style={lbl}>Sức chứa (khách)</div><input type="number" value={meta.suc_chua_khach||""} onChange={e=>upd("suc_chua_khach",+e.target.value)} style={inp}/></label>
      <label style={{gridColumn:"1/-1"}}><div style={lbl}>Menu set (phẩy phân cách)</div><input value={(meta.menu_set||[]).join(",")} onChange={e=>upd("menu_set",e.target.value.split(",").map(x=>x.trim()).filter(Boolean))} style={inp}/></label>
    </div>
  );

  if(["Hướng dẫn viên"].includes(loai)) return(
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
      <label><div style={lbl}>Ngôn ngữ (phẩy phân cách)</div><input value={(meta.ngon_ngu||[]).join(",")} onChange={e=>upd("ngon_ngu",e.target.value.split(",").map(x=>x.trim()).filter(Boolean))} style={inp}/></label>
      <label><div style={lbl}>Cấp chứng chỉ</div><input value={meta.cap_chung_chi||""} onChange={e=>upd("cap_chung_chi",e.target.value)} style={inp}/></label>
      <label><div style={lbl}>Kinh nghiệm (năm)</div><input type="number" value={meta.kinh_nghiem_nam||""} onChange={e=>upd("kinh_nghiem_nam",+e.target.value)} style={inp}/></label>
    </div>
  );

  return null;
}

const lbl={fontSize:12,color:"#64748b",marginBottom:3,fontWeight:600};
const inp={width:"100%",border:"1px solid #e2e8f0",borderRadius:8,padding:"8px 10px",fontSize:13,fontFamily:"inherit",boxSizing:"border-box",outline:"none"};

function ServiceEntryForm({ entry, onSave, onCancel }){
  const blank={id:"sv-"+Date.now(),loai:"Hàng không",ten_dich_vu:"",khu_vuc:{tinh_thanh:[],vung_mien:"Bắc",loai:"Nội địa"},phan_khuc:"Mid-range",gia_tham_khao:{tu:0,den:0,don_vi:"người",ghi_chu:""},mua_cao_diem:"",chinh_sach_huy:"",dieu_kien_booking:"",active:true,meta:{}};
  const [form,setForm]=React.useState(entry||blank);
  const [provinceSearch,setProvinceSearch]=React.useState("");

  const upd=(k,v)=>setForm(f=>({...f,[k]:v}));
  const updKv=(k,sub,v)=>setForm(f=>({...f,[k]:{...f[k],[sub]:v}}));
  const updGia=(sub,v)=>updKv("gia_tham_khao",sub,sub==="tu"||sub==="den"?Number(v):v);
  const togProv=(p)=>{
    const cur=form.khu_vuc.tinh_thanh||[];
    updKv("khu_vuc","tinh_thanh",cur.includes(p)?cur.filter(x=>x!==p):[...cur,p]);
  };

  const filtProv=PROVINCES.filter(p=>!provinceSearch||p.toLowerCase().includes(provinceSearch.toLowerCase()));

  return(
    <div style={{background:"#f8fafc",borderRadius:12,padding:16,border:"1px solid #e2e8f0",marginTop:8}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <label style={{gridColumn:"1/-1"}}>
          <div style={lbl}>Loại dịch vụ *</div>
          <select value={form.loai} onChange={e=>{upd("loai",e.target.value);upd("meta",{});}} style={{...inp}}>
            {ALL_NCC_SERVICE_TYPES.map(t=><option key={t}>{t}</option>)}
          </select>
        </label>
        <label style={{gridColumn:"1/-1"}}>
          <div style={lbl}>Tên dịch vụ cụ thể *</div>
          <input value={form.ten_dich_vu} onChange={e=>upd("ten_dich_vu",e.target.value)} placeholder="VD: Vietnam Airlines HAN–DAD" style={inp}/>
        </label>
        <label>
          <div style={lbl}>Vùng miền</div>
          <select value={form.khu_vuc.vung_mien} onChange={e=>updKv("khu_vuc","vung_mien",e.target.value)} style={inp}>
            {["Bắc","Trung","Nam","Quốc tế"].map(v=><option key={v}>{v}</option>)}
          </select>
        </label>
        <label>
          <div style={lbl}>Nội địa / Quốc tế</div>
          <select value={form.khu_vuc.loai} onChange={e=>updKv("khu_vuc","loai",e.target.value)} style={inp}>
            <option>Nội địa</option><option>Quốc tế</option>
          </select>
        </label>

        <div style={{gridColumn:"1/-1"}}>
          <div style={lbl}>Tỉnh/thành hoạt động</div>
          <input value={provinceSearch} onChange={e=>setProvinceSearch(e.target.value)} placeholder="Tìm tỉnh/thành..." style={{...inp,marginBottom:6}}/>
          <div style={{display:"flex",flexWrap:"wrap",gap:4,maxHeight:120,overflowY:"auto",background:"#fff",borderRadius:8,border:"1px solid #e2e8f0",padding:8}}>
            {filtProv.map(p=>{
              const sel=(form.khu_vuc.tinh_thanh||[]).includes(p);
              return(
                <button key={p} onClick={()=>togProv(p)} style={{padding:"3px 10px",borderRadius:20,border:"1px solid",fontSize:12,cursor:"pointer",fontWeight:600,background:sel?"#2563eb":"transparent",color:sel?"#fff":"#64748b",borderColor:sel?"#2563eb":"#e2e8f0"}}>
                  {p}
                </button>
              );
            })}
          </div>
          {(form.khu_vuc.tinh_thanh||[]).length>0&&<div style={{fontSize:11,color:"#2563eb",marginTop:4}}>Đã chọn: {form.khu_vuc.tinh_thanh.join(", ")}</div>}
        </div>

        <label>
          <div style={lbl}>Phân khúc</div>
          <select value={form.phan_khuc} onChange={e=>upd("phan_khuc",e.target.value)} style={inp}>
            {["Budget","Mid-range","Cao cấp"].map(v=><option key={v}>{v}</option>)}
          </select>
        </label>
        <label>
          <div style={lbl}>Đơn vị giá</div>
          <select value={form.gia_tham_khao.don_vi} onChange={e=>updGia("don_vi",e.target.value)} style={inp}>
            {["người","đêm","chuyến","cabin","xe","vé","gói"].map(v=><option key={v}>{v}</option>)}
          </select>
        </label>
        <label>
          <div style={lbl}>Giá từ (VNĐ)</div>
          <input type="number" value={form.gia_tham_khao.tu||""} onChange={e=>updGia("tu",e.target.value)} style={inp}/>
        </label>
        <label>
          <div style={lbl}>Giá đến (VNĐ)</div>
          <input type="number" value={form.gia_tham_khao.den||""} onChange={e=>updGia("den",e.target.value)} style={inp}/>
        </label>
        <label style={{gridColumn:"1/-1"}}>
          <div style={lbl}>Ghi chú giá</div>
          <input value={form.gia_tham_khao.ghi_chu||""} onChange={e=>updGia("ghi_chu",e.target.value)} style={inp}/>
        </label>
        <label>
          <div style={lbl}>Mùa cao điểm</div>
          <input value={form.mua_cao_diem||""} onChange={e=>upd("mua_cao_diem",e.target.value)} style={inp}/>
        </label>
        <label style={{display:"flex",alignItems:"center",gap:8,paddingTop:18}}>
          <input type="checkbox" checked={form.active} onChange={e=>upd("active",e.target.checked)}/>
          <span style={{fontSize:13,fontWeight:600}}>Đang hoạt động</span>
        </label>
        <label style={{gridColumn:"1/-1"}}>
          <div style={lbl}>Chính sách hủy</div>
          <textarea value={form.chinh_sach_huy||""} onChange={e=>upd("chinh_sach_huy",e.target.value)} rows={2} style={{...inp,resize:"vertical"}}/>
        </label>
        <label style={{gridColumn:"1/-1"}}>
          <div style={lbl}>Điều kiện booking</div>
          <textarea value={form.dieu_kien_booking||""} onChange={e=>upd("dieu_kien_booking",e.target.value)} rows={2} style={{...inp,resize:"vertical"}}/>
        </label>
      </div>

      {/* Dynamic meta fields */}
      {["Hàng không","Khách sạn","Villa","Homestay","Bungalow","Nhà nghỉ","Du thuyền ngày","Du thuyền đêm","Nhà hàng","Hướng dẫn viên"].includes(form.loai)&&(
        <div style={{marginTop:12,padding:12,background:"#fff",borderRadius:8,border:"1px solid #e2e8f0"}}>
          <div style={{fontSize:12,color:"#2563eb",fontWeight:700,marginBottom:8}}>Chi tiết theo loại — {form.loai}</div>
          <ServiceMetaFields loai={form.loai} meta={form.meta||{}} onChange={m=>upd("meta",m)}/>
        </div>
      )}

      <div style={{display:"flex",gap:8,marginTop:14,justifyContent:"flex-end"}}>
        <button onClick={onCancel} style={{padding:"8px 20px",borderRadius:8,border:"1px solid #e2e8f0",background:"#fff",color:"#475569",cursor:"pointer",fontWeight:600,fontSize:13}}>Hủy</button>
        <button onClick={()=>onSave(form)} style={{padding:"8px 20px",borderRadius:8,border:"none",background:"#2563eb",color:"#fff",cursor:"pointer",fontWeight:700,fontSize:13}}>Lưu dịch vụ</button>
      </div>
    </div>
  );
}

function QuickFindModal({ suppliers, onClose, onSelect }){
  const [q,setQ]=React.useState("");
  const ref=React.useRef(null);
  React.useEffect(()=>{ ref.current?.focus(); },[]);

  const scored=React.useMemo(()=>{
    if(!q.trim()) return suppliers.slice(0,8).map(s=>({s,matches:[]}));
    const lq=q.toLowerCase();
    const results=[];
    suppliers.forEach(sup=>{
      const matches=[];
      let score=0;
      if(sup.ten.toLowerCase().includes(lq)){score+=10;matches.push("name");}
      sup.dich_vu.filter(d=>d.active).forEach(d=>{
        if(d.loai.toLowerCase().includes(lq)){score+=5;matches.push("loai");}
        if((d.khu_vuc.tinh_thanh||[]).some(p=>p.toLowerCase().includes(lq))){score+=4;matches.push("kv");}
        if(d.phan_khuc.toLowerCase().includes(lq)){score+=3;matches.push("phk");}
        if(d.ten_dich_vu.toLowerCase().includes(lq)){score+=3;matches.push("tdv");}
        if(d.meta?.hang_sao){
          const starMatch=lq.match(/(\d)\s*sao/);
          if(starMatch&&+starMatch[1]===d.meta.hang_sao){score+=6;matches.push("star");}
        }
        Object.entries(NCC_SERVICE_GROUPS).forEach(([group,types])=>{
          if(group.toLowerCase().includes(lq)&&types.includes(d.loai)){score+=4;matches.push("group");}
        });
      });
      if(score>0) results.push({s:sup,score,matches});
    });
    return results.sort((a,b)=>b.score-a.score).slice(0,8);
  },[q,suppliers]);

  const fmtM=(n)=>{const a=Math.abs(n||0),s=(n||0)<0?"-":"";if(a>=1e9)return s+(a/1e9).toFixed(1)+"tỷ";return s+Math.round(a).toLocaleString("vi-VN")+"đ";};

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:9999,display:"flex",alignItems:"flex-start",justifyContent:"center",paddingTop:80}} onClick={onClose}>
      <div style={{background:"#fff",borderRadius:16,width:"100%",maxWidth:560,boxShadow:"0 20px 60px rgba(0,0,0,.3)",overflow:"hidden"}} onClick={e=>e.stopPropagation()}>
        <div style={{padding:"14px 16px",borderBottom:"1px solid #f1f5f9",display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:18}}>🔍</span>
          <input ref={ref} value={q} onChange={e=>setQ(e.target.value)}
            placeholder="Tìm NCC: nhập tên, loại dịch vụ, tỉnh thành, phân khúc, 3 sao..."
            style={{flex:1,border:"none",outline:"none",fontSize:15,fontFamily:"inherit"}}/>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:"#94a3b8",fontSize:20}}>✕</button>
        </div>
        <div style={{maxHeight:420,overflowY:"auto"}}>
          {scored.length===0&&<div style={{textAlign:"center",color:"#94a3b8",padding:32}}>Không tìm thấy NCC phù hợp</div>}
          {scored.map(({s})=>{
            const activeSvs=s.dich_vu.filter(d=>d.active);
            return(
              <div key={s.id} style={{padding:"14px 16px",borderBottom:"1px solid #f8fafc",cursor:"pointer",transition:"background .1s"}}
                onMouseEnter={ev=>ev.currentTarget.style.background="#f8fafc"}
                onMouseLeave={ev=>ev.currentTarget.style.background=""}
                onClick={()=>onSelect(s)}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                  <span style={{fontWeight:700,fontSize:14}}>{s.ten}</span>
                  <ContractBadge status={s.trang_thai_hop_dong}/>
                </div>
                {activeSvs.slice(0,3).map(d=>(
                  <div key={d.id} style={{display:"flex",gap:8,alignItems:"center",marginTop:3}}>
                    <ServiceTypeBadge loai={d.loai}/>
                    {d.meta?.hang_sao>0&&<StarRating value={d.meta.hang_sao} size={12}/>}
                    <span style={{fontSize:12,color:"#64748b"}}>{d.phan_khuc} · {(d.khu_vuc.tinh_thanh||[]).slice(0,3).join(", ")}</span>
                    <span style={{fontSize:12,color:"#16a34a",marginLeft:"auto",fontWeight:700}}>
                      {d.gia_tham_khao.tu>0&&fmtM(d.gia_tham_khao.tu)+"–"+fmtM(d.gia_tham_khao.den)+"/"+d.gia_tham_khao.don_vi}
                    </span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
        <div style={{padding:"8px 16px",background:"#f8fafc",fontSize:11,color:"#94a3b8",textAlign:"center"}}>Nhấn Enter để chọn · Esc để đóng · Ctrl+K để mở</div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// SUPPLIER MODULE (replaces NCCDashboard)
// ══════════════════════════════════════════════════════════════

function SupplierModule({ suppliers=[], onAddSupplier, onUpdateSupplier, onDeleteSupplier, orders=[], vouchers=[], expenses=[], pushNotif, currentRole, currentUser, bookings:bookingsProp=[], onUpdateBookings, onCreateExpense }){
  // --- State ---
  const [tab,setTab]=React.useState("suppliers");
  const [search,setSearch]=React.useState("");
  const [filterGroup,setFilterGroup]=React.useState("all");
  const [filterProv,setFilterProv]=React.useState("");
  const [filterPhanKhuc,setFilterPhanKhuc]=React.useState("all");
  const [filterSao,setFilterSao]=React.useState("all");
  const [filterHD,setFilterHD]=React.useState("all");
  const [selected,setSelected]=React.useState(null);
  const [editMode,setEditMode]=React.useState(false);
  const [showAdd,setShowAdd]=React.useState(false);
  const [editingSv,setEditingSv]=React.useState(null); // null | "new" | serviceEntry id
  const [expandedSv,setExpandedSv]=React.useState({});
  const [showQuickFind,setShowQuickFind]=React.useState(false);
  const [bookings,setBookings]=React.useState(bookingsProp||[]);

  // Booking state (preserved from old NCCDashboard)
  const [showBkForm,setShowBkForm]=React.useState(false);
  const [bkForm,setBkForm]=React.useState({orderId:"",supplierId:"",nccId:"",nccName:"",service:"",amount:"",pnrCode:"",timeLimit:"",note:""});
  const BK_STATUS={pending:{bg:"#fef9c3",c:"#92400e",label:"Chờ xác nhận"},confirmed:{bg:"#dbeafe",c:"#1d4ed8",label:"Đã xác nhận"},paid:{bg:"#dcfce7",c:"#15803d",label:"Đã thanh toán"},cancelled:{bg:"#fee2e2",c:"#dc2626",label:"Đã hủy"}};

  const syncBookings=(list)=>{setBookings(list);onUpdateBookings&&onUpdateBookings(list);};

  React.useEffect(()=>{
    const handler=(e)=>{if((e.ctrlKey||e.metaKey)&&e.key==="k"){e.preventDefault();setShowQuickFind(v=>!v);}if(e.key==="Escape")setShowQuickFind(false);};
    window.addEventListener("keydown",handler);
    return()=>window.removeEventListener("keydown",handler);
  },[]);

  const fmtMoney=(n)=>(n||0).toLocaleString("vi-VN")+"₫";

  // ── Form state for add/edit NCC ──
  const blankNcc=()=>({
    ma_ncc:"NCC-"+(String(suppliers.length+1).padStart(3,"0")),
    ten:"",loai_hinh:[],khu_vuc_hoat_dong:[],
    sdt:"",email:"",nguoi_lien_he:"",
    ma_so_thue:"",dia_chi:"",hop_dong_file:"",hop_dong_ten:"",
    tai_khoan_ngan_hang:{ngan_hang:"",so_tk:"",chu_tk:""},
    cong_no:0,trang_thai_hop_dong:"chua",nguoi_phu_trach:"",
    danh_gia_noi_bo:3,ghi_chu_uu_tien:"",dich_vu:[],
  });
  const [form,setForm]=React.useState(blankNcc());
  const updF=(k,v)=>setForm(f=>({...f,[k]:v}));
  const updBank=(k,v)=>setForm(f=>({...f,tai_khoan_ngan_hang:{...f.tai_khoan_ngan_hang,[k]:v}}));

  // Load selected into form when editing
  React.useEffect(()=>{
    if(selected&&editMode) setForm({...selected});
  },[selected,editMode]);

  // ── Filter logic ──
  const filteredSuppliers=React.useMemo(()=>{
    const lq=search.toLowerCase();
    return suppliers.filter(s=>{
      if(lq&&!s.ten.toLowerCase().includes(lq)&&!s.ma_ncc.toLowerCase().includes(lq)&&!(s.nguoi_lien_he||"").toLowerCase().includes(lq)&&!(s.sdt||"").includes(lq)) return false;
      if(filterHD!=="all"&&s.trang_thai_hop_dong!==filterHD) return false;

      const activeDv=s.dich_vu.filter(d=>d.active);
      if(filterGroup!=="all"){
        // filterGroup có thể là tên loai_hinh cụ thể (vd "Hàng không") hoặc nhóm (vd "Vận chuyển")
        const groupTypes=NCC_SERVICE_GROUPS[filterGroup]||[filterGroup];
        const matchLoaiHinh=(s.loai_hinh||[]).some(l=>groupTypes.includes(l)||l===filterGroup);
        const matchDvLoai=activeDv.some(d=>groupTypes.includes(d.loai)||d.loai===filterGroup);
        if(!matchLoaiHinh&&!matchDvLoai) return false;
      }
      if(filterProv){
        const dvMatch=activeDv.some(d=>(d.khu_vuc.tinh_thanh||[]).includes(filterProv));
        const nccMatch=(s.khu_vuc_hoat_dong||[]).includes(filterProv);
        if(!dvMatch&&!nccMatch) return false;
      }
      if(filterPhanKhuc!=="all"){
        if(!activeDv.some(d=>d.phan_khuc===filterPhanKhuc)) return false;
      }
      if(filterSao!=="all"){
        const sao=+filterSao;
        if(!activeDv.some(d=>d.meta?.hang_sao===sao)) return false;
      }
      return true;
    });
  },[suppliers,search,filterGroup,filterProv,filterPhanKhuc,filterSao,filterHD]);

  const totalDebt=suppliers.reduce((s,n)=>s+(n.cong_no||0),0);

  // ── Save NCC ──
  const saveNcc=()=>{
    if(!form.ten.trim()) return pushNotif&&pushNotif("Nhập tên NCC","error");
    const kv=[...new Set(form.dich_vu.flatMap(d=>d.khu_vuc?.tinh_thanh||[]))];
    const loaiHinh=[...new Set(form.dich_vu.map(d=>d.loai))];
    const ncc={...form,khu_vuc_hoat_dong:kv.length?kv:form.khu_vuc_hoat_dong,loai_hinh:loaiHinh.length?loaiHinh:form.loai_hinh};
    if(selected&&editMode){ onUpdateSupplier&&onUpdateSupplier(selected.id,ncc);setSelected({...selected,...ncc,updated_at:new Date().toISOString()}); }
    else { onAddSupplier&&onAddSupplier(ncc); }
    setEditMode(false); setShowAdd(false); setEditingSv(null);
    pushNotif&&pushNotif(editMode?"Đã cập nhật NCC "+ncc.ten:"Đã thêm NCC "+ncc.ten,"success");
  };

  const deleteNcc=(s)=>{
    if(s.cong_no>0) return pushNotif&&pushNotif("Không thể xóa: còn công nợ "+fmtMoney(s.cong_no),"error");
    const hasActive=bookings.some(b=>b.supplierId===s.id&&!["cancelled","paid"].includes(b.status));
    if(hasActive) return pushNotif&&pushNotif("Không thể xóa: còn booking đang active","error");
    onDeleteSupplier&&onDeleteSupplier(s.id);
    if(selected?.id===s.id){setSelected(null);setEditMode(false);}
    pushNotif&&pushNotif("Đã xóa NCC "+s.ten,"success");
  };

  // ── Service entry helpers ──
  const saveSv=(sv)=>{
    const existing=form.dich_vu.find(d=>d.id===sv.id);
    const updated=existing?form.dich_vu.map(d=>d.id===sv.id?sv:d):[...form.dich_vu,sv];
    setForm(f=>({...f,dich_vu:updated}));
    setEditingSv(null);
  };
  const deleteSv=(id)=>setForm(f=>({...f,dich_vu:f.dich_vu.filter(d=>d.id!==id)}));
  const togSvExpand=(id)=>setExpandedSv(p=>({...p,[id]:!p[id]}));

  // ── Booking save ──
  const saveBooking=()=>{
    const nccId=bkForm.supplierId||bkForm.nccId;
    const sup=suppliers.find(s=>s.id===nccId);
    const bk={
      id:"BK"+String(Date.now()).slice(-4),
      orderId:bkForm.orderId,
      nccId,
      nccName:bkForm.nccName||sup?.name||sup?.ten||nccId,
      service:bkForm.service,
      amount:Number(bkForm.amount)||0,
      pnrCode:bkForm.pnrCode,
      timeLimit:bkForm.timeLimit,
      note:bkForm.note,
      status:"pending",
      createdBy:currentUser?.name||"",
      createdAt:new Date().toISOString(),
    };
    syncBookings([bk,...bookings]);
    if(onCreateExpense){
      onCreateExpense({id:"EXP"+Date.now(),orderId:bkForm.orderId,type:"chi",amount:bk.amount,note:"NCC: "+(bk.nccName)+" - "+bk.service,status:"pending_kt",method:"transfer",createdBy:currentUser?.name,createdAt:new Date().toISOString(),nccName:bk.nccName});
    }
    setBkForm({orderId:"",supplierId:"",nccId:"",nccName:"",service:"",amount:"",pnrCode:"",timeLimit:"",note:""});
    setShowBkForm(false);
    pushNotif&&pushNotif("Đã tạo booking "+bk.id,"success");
  };

  const updateBkStatus=(id,status)=>syncBookings(bookings.map(b=>b.id===id?{...b,status}:b));

  // ─────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────

  const showLuuTruFilter=filterGroup==="all"||filterGroup==="Lưu trú";

  return(
    <div style={{display:"flex",flexDirection:"column",height:"100%",minHeight:0}}>
      {showQuickFind&&<QuickFindModal suppliers={suppliers} onClose={()=>setShowQuickFind(false)} onSelect={s=>{setSelected(s);setShowQuickFind(false);setTab("suppliers");}}/>}

      {/* Header */}
      <div style={{padding:"16px 24px",borderBottom:"1px solid #f1f5f9",background:"#fff",display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
        <div>
          <h2 style={{margin:0,fontSize:20,fontWeight:900}}>Nhà cung cấp (NCC)</h2>
          <div style={{fontSize:12,color:"#64748b",marginTop:1}}>{suppliers.length} NCC · Tổng công nợ: <strong style={{color:totalDebt>0?"#dc2626":"#16a34a"}}>{fmtMoney(totalDebt)}</strong></div>
        </div>
        <div style={{flex:1}}/>
        <button onClick={()=>setShowQuickFind(true)} style={{background:"#f1f5f9",border:"1px solid #e2e8f0",borderRadius:8,padding:"7px 14px",cursor:"pointer",fontSize:13,color:"#475569",fontWeight:600,display:"flex",alignItems:"center",gap:6}}>
          🔍 Tìm nhanh <kbd style={{background:"#e2e8f0",borderRadius:4,padding:"1px 5px",fontSize:11}}>Ctrl+K</kbd>
        </button>
        <button onClick={()=>{setShowAdd(true);setSelected(null);setEditMode(false);setForm(blankNcc());setEditingSv(null);}} style={{background:"#2563eb",color:"#fff",border:"none",borderRadius:8,padding:"8px 18px",cursor:"pointer",fontWeight:700,fontSize:13}}>+ Thêm NCC</button>
        <button onClick={()=>setShowBkForm(true)} style={{background:"#7c3aed",color:"#fff",border:"none",borderRadius:8,padding:"8px 18px",cursor:"pointer",fontWeight:700,fontSize:13}}>+ Tạo booking</button>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:4,padding:"10px 24px 0",background:"#fff",borderBottom:"1px solid #f1f5f9"}}>
        {[["suppliers","Danh sách NCC",suppliers.length],["bookings","Booking",bookings.length]].map(([k,label,cnt])=>(
          <button key={k} onClick={()=>setTab(k)} style={{padding:"8px 18px",borderRadius:"8px 8px 0 0",border:"1px solid",borderBottom:"none",cursor:"pointer",fontWeight:600,fontSize:13,background:tab===k?"#fff":"#f8fafc",borderColor:tab===k?"#e2e8f0":"transparent",color:tab===k?"#1e293b":"#64748b",marginBottom:tab===k?-1:0}}>
            {label} {cnt>0&&<span style={{background:"#e2e8f0",color:"#475569",borderRadius:20,padding:"0 6px",fontSize:11,marginLeft:4}}>{cnt}</span>}
          </button>
        ))}
      </div>

      {/* ══ SUPPLIERS TAB ══ */}
      {tab==="suppliers"&&(
        <div style={{display:"flex",flex:1,minHeight:0,overflow:"hidden"}}>

          {/* Left panel — search + list — thu nhỏ khi có NCC được chọn */}
          <div style={{width:selected||showAdd?"340px":"100%",minWidth:selected||showAdd?"280px":"100%",flexShrink:0,borderRight:selected||showAdd?"1px solid #e2e8f0":"none",display:"flex",flexDirection:"column",background:"#fafafa",transition:"width .3s ease"}}>
            {/* Search */}
            <div style={{padding:"12px 12px 0"}}>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍  Tìm tên, mã, SĐT, người LH..."
                style={{width:"100%",border:"1px solid #e2e8f0",borderRadius:8,padding:"8px 12px",fontSize:13,fontFamily:"inherit",boxSizing:"border-box",background:"#fff"}}/>
            </div>

            {/* Filters */}
            <div style={{padding:"10px 12px",borderBottom:"1px solid #f1f5f9",display:"flex",flexDirection:"column",gap:6}}>
              {/* Tab lĩnh vực — mỗi loai_hinh = 1 tab riêng, không nhóm */}
              {(()=>{
                // Lấy tất cả loai_hinh unique theo đúng thứ tự trong NCC_SERVICE_TYPES
                const orderedTypes = Object.values(NCC_SERVICE_TYPES);
                const allLoaiHinh = orderedTypes.filter(t=>
                  (suppliers||[]).some(s=>(s.loai_hinh||[]).includes(t))
                );
                // Màu theo loại
                const TAG_COLOR = {
                  "Hàng không":"#1d4ed8","Đường bộ":"#9a3412","Đường sắt":"#374151","Đường thủy":"#075985","Tàu cao tốc / Speedboat":"#0369a1",
                  "Khách sạn":"#9d174d","Resort":"#be185d","Villa":"#be185d","Homestay":"#15803d","Farmstay":"#166534","Bungalow":"#14532d","Nhà nghỉ":"#14532d","Khu sinh thái":"#15803d",
                  "Du thuyền ngày":"#6d28d9","Du thuyền đêm":"#4c1d95",
                  "Nhà hàng":"#92400e","Vé tham quan":"#065f46","Vé vui chơi / Giải trí":"#713f12",
                  "Hướng dẫn viên":"#14532d","Bảo hiểm":"#1e40af","Spa & Wellness":"#7e22ce","Dịch vụ visa":"#4c1d95","Golf":"#166534","Khác":"#475569",
                };
                return(
                  <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                    <button onClick={()=>setFilterGroup("all")}
                      style={{padding:"5px 14px",borderRadius:99,border:"1.5px solid",fontSize:12,cursor:"pointer",fontWeight:700,
                        background:filterGroup==="all"?"#0f172a":"transparent",
                        color:filterGroup==="all"?"#fff":"#64748b",
                        borderColor:filterGroup==="all"?"#0f172a":"#e2e8f0"}}>
                      Tất cả · {(suppliers||[]).length}
                    </button>
                    {allLoaiHinh.map(lh=>{
                      const isActive=filterGroup===lh;
                      const count=(suppliers||[]).filter(s=>(s.loai_hinh||[]).includes(lh)).length;
                      const c=TAG_COLOR[lh]||"#475569";
                      return(
                        <button key={lh} onClick={()=>setFilterGroup(isActive?"all":lh)}
                          style={{padding:"5px 12px",borderRadius:99,border:`1.5px solid ${isActive?c:c+"55"}`,fontSize:12,cursor:"pointer",fontWeight:600,
                            background:isActive?c:"transparent",
                            color:isActive?"#fff":c,
                            display:"flex",alignItems:"center",gap:5,transition:"all .15s"}}>
                          <span>{lh}</span>
                          <span style={{background:isActive?"rgba(255,255,255,.3)":"rgba(0,0,0,.1)",borderRadius:99,padding:"1px 6px",fontSize:10,fontWeight:700}}>{count}</span>
                        </button>
                      );
                    })}
                  </div>
                );
              })()}
              {/* Row 2 */}
              <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
                <select value={filterProv} onChange={e=>setFilterProv(e.target.value)} style={{border:"1px solid #e2e8f0",borderRadius:6,padding:"4px 8px",fontSize:12,fontFamily:"inherit",background:"#fff",color:"#475569"}}>
                  <option value="">Khu vực (tất cả)</option>
                  {PROVINCES.map(p=><option key={p}>{p}</option>)}
                </select>
                <select value={filterPhanKhuc} onChange={e=>setFilterPhanKhuc(e.target.value)} style={{border:"1px solid #e2e8f0",borderRadius:6,padding:"4px 8px",fontSize:12,fontFamily:"inherit",background:"#fff",color:"#475569"}}>
                  <option value="all">Phân khúc</option>
                  {["Budget","Mid-range","Cao cấp"].map(v=><option key={v}>{v}</option>)}
                </select>
                <select value={filterHD} onChange={e=>setFilterHD(e.target.value)} style={{border:"1px solid #e2e8f0",borderRadius:6,padding:"4px 8px",fontSize:12,fontFamily:"inherit",background:"#fff",color:"#475569"}}>
                  <option value="all">Hợp đồng</option>
                  <option value="co">Có HĐ</option>
                  <option value="chua">Thiếu HĐ</option>
                  <option value="het_han">Hết hạn</option>
                </select>
                {showLuuTruFilter&&(
                  <select value={filterSao} onChange={e=>setFilterSao(e.target.value)} style={{border:"1px solid #e2e8f0",borderRadius:6,padding:"4px 8px",fontSize:12,fontFamily:"inherit",background:"#fff",color:"#475569"}}>
                    <option value="all">Hạng sao</option>
                    {[1,2,3,4,5].map(n=><option key={n} value={n}>{n}★</option>)}
                  </select>
                )}
              </div>
              <div style={{fontSize:11,color:"#94a3b8"}}>{filteredSuppliers.length} kết quả</div>
            </div>

            {/* List — dạng card grid khi chưa chọn NCC, dạng list khi đã chọn */}
            <div style={{flex:1,overflowY:"auto",padding:selected||showAdd?"0":"16px"}}>
              {filteredSuppliers.length===0&&<div style={{textAlign:"center",color:"#94a3b8",padding:48,fontSize:14}}>🏢<br/>Không tìm thấy NCC nào</div>}

              {/* Card grid — full width khi chưa chọn */}
              {!(selected||showAdd)&&(
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:14}}>
                  {filteredSuppliers.map(s=>{
                    const activeDv=(s.dich_vu||[]).filter(d=>d.active);
                    const maxSao=Math.max(0,...activeDv.map(d=>d.meta?.hang_sao||0));
                    const hdColor={co:"#059669",chua:"#dc2626",het_han:"#d97706"}[s.trang_thai_hop_dong]||"#94a3b8";
                    const hdBg={co:"#ecfdf5",chua:"#fef2f2",het_han:"#fffbeb"}[s.trang_thai_hop_dong]||"#f8fafc";
                    return(
                      <div key={s.id} onClick={()=>{setSelected(s);setEditMode(false);setShowAdd(false);setEditingSv(null);}}
                        style={{background:"#fff",borderRadius:14,padding:18,cursor:"pointer",boxShadow:"0 2px 10px rgba(0,0,0,.07)",border:"1.5px solid #f1f5f9",transition:"all .15s"}}
                        onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 6px 24px rgba(37,99,235,.15)";e.currentTarget.style.borderColor="#bfdbfe";}}
                        onMouseLeave={e=>{e.currentTarget.style.boxShadow="0 2px 10px rgba(0,0,0,.07)";e.currentTarget.style.borderColor="#f1f5f9";}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                          <div style={{fontWeight:800,fontSize:15,color:"#0f172a",flex:1,paddingRight:8}}>{s.ten}</div>
                          <span style={{background:hdBg,color:hdColor,borderRadius:99,fontSize:11,fontWeight:700,padding:"3px 10px",flexShrink:0}}>
                            {s.trang_thai_hop_dong==="co"?"✓ Có HĐ":s.trang_thai_hop_dong==="het_han"?"⚠ Hết hạn":"Thiếu HĐ"}
                          </span>
                        </div>
                        <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:10}}>
                          {(s.loai_hinh||[]).map(l=><ServiceTypeBadge key={l} loai={l}/>)}
                        </div>
                        <div style={{fontSize:13,color:"#64748b",lineHeight:1.8}}>
                          {s.sdt&&<div>📞 {s.sdt}</div>}
                          {s.nguoi_lien_he&&<div>👤 {s.nguoi_lien_he}</div>}
                          {(s.khu_vuc_hoat_dong||[]).length>0&&<div>📍 {s.khu_vuc_hoat_dong.slice(0,3).join(" · ")}</div>}
                        </div>
                        {maxSao>0&&<div style={{marginTop:8}}><StarRating value={maxSao} size={14}/></div>}
                        {s.cong_no>0&&(
                          <div style={{marginTop:10,padding:"6px 10px",background:"#fee2e2",borderRadius:8,fontSize:12,color:"#dc2626",fontWeight:700}}>
                            💳 Công nợ: {fmtMoney(s.cong_no)}
                          </div>
                        )}
                        {activeDv.length>0&&(
                          <div style={{marginTop:8,fontSize:11,color:"#94a3b8"}}>{activeDv.length} dịch vụ đang cung cấp</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* List dạng row khi đã chọn NCC (sidebar nhỏ) */}
              {(selected||showAdd)&&filteredSuppliers.map(s=>{
                const isActive=selected?.id===s.id;
                return(
                  <div key={s.id} onClick={()=>{setSelected(s);setEditMode(false);setShowAdd(false);setEditingSv(null);}}
                    style={{padding:"11px 14px",borderBottom:"1px solid #f1f5f9",cursor:"pointer",background:isActive?"#eff6ff":"#fff",borderLeft:isActive?"3px solid #2563eb":"3px solid transparent",transition:"all .1s"}}>
                    <div style={{fontWeight:700,fontSize:13,color:"#0f172a",marginBottom:3}}>{s.ten}</div>
                    <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:4}}>
                      {(s.loai_hinh||[]).slice(0,2).map(l=><ServiceTypeBadge key={l} loai={l}/>)}
                    </div>
                    <div style={{fontSize:11,color:"#64748b"}}>{s.sdt||"—"}</div>
                    {s.cong_no>0&&<div style={{fontSize:11,color:"#dc2626",fontWeight:600,marginTop:2}}>Nợ: {fmtMoney(s.cong_no)}</div>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right panel — detail / form */}
          <div style={{flex:1,overflowY:"auto",padding:24}}>
            {/* Add new NCC form */}
            {showAdd&&!selected&&(
              <SupplierForm form={form} updF={updF} updBank={updBank} editingSv={editingSv} setEditingSv={setEditingSv} expandedSv={expandedSv} togSvExpand={togSvExpand} saveSv={saveSv} deleteSv={deleteSv} onSave={saveNcc} onCancel={()=>setShowAdd(false)} isNew={true}/>
            )}

            {/* Selected NCC detail */}
            {selected&&!showAdd&&(
              editMode
              ? <SupplierForm form={form} updF={updF} updBank={updBank} editingSv={editingSv} setEditingSv={setEditingSv} expandedSv={expandedSv} togSvExpand={togSvExpand} saveSv={saveSv} deleteSv={deleteSv} onSave={saveNcc} onCancel={()=>setEditMode(false)} isNew={false}/>
              : <SupplierDetail supplier={selected} onEdit={()=>setEditMode(true)} onDelete={()=>deleteNcc(selected)} fmtMoney={fmtMoney} expenses={expenses}/>
            )}

            {/* Empty state */}
            {!selected&&!showAdd&&(
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",color:"#94a3b8",gap:12}}>
                <div style={{fontSize:48}}>🏢</div>
                <div style={{fontSize:16,fontWeight:600}}>Chọn NCC từ danh sách bên trái</div>
                <div style={{fontSize:13}}>hoặc nhấn <strong>+ Thêm NCC</strong> để tạo mới</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ BOOKINGS TAB ══ */}
      {tab==="bookings"&&(
        <div style={{flex:1,overflowY:"auto",padding:24}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <h3 style={{margin:0,fontSize:16,fontWeight:800}}>Booking NCC</h3>
            <button onClick={()=>setShowBkForm(v=>!v)} style={{background:"#7c3aed",color:"#fff",border:"none",borderRadius:8,padding:"8px 18px",cursor:"pointer",fontWeight:700,fontSize:13}}>+ Tạo booking</button>
          </div>
          {showBkForm&&(()=>{
            const selectedOrder=orders.find(o=>o.id===bkForm.orderId);
            const selectedNCC=(suppliers||[]).find(s=>s.id===bkForm.supplierId||s.id===bkForm.nccId);
            return (
              <div style={{background:"#fff",borderRadius:14,padding:24,marginBottom:20,border:"0.5px solid #e2e8f0",boxShadow:"0 2px 8px rgba(0,0,0,.06)"}}>
                <div style={{fontWeight:600,fontSize:15,marginBottom:20,color:"#1e293b"}}>Tạo booking NCC mới</div>

                {/* Bước 1: Chọn đơn hàng */}
                <div style={{marginBottom:16}}>
                  <label style={lbl}>Chọn đơn hàng *<span style={{fontSize:11,fontWeight:400,color:"#64748b",marginLeft:6}}>(chọn đơn để xem thông tin và gắn booking)</span></label>
                  <select value={bkForm.orderId||""} onChange={e=>{const o=orders.find(x=>x.id===e.target.value);setBkForm(f=>({...f,orderId:e.target.value,service:o?.tourName||o?.serviceName||o?.service||"",amount:o?.costPrice||o?.pricing?.costPrice||""}));}} style={{...inp,fontSize:13}}>
                    <option value="">— Chọn đơn hàng —</option>
                    {orders.filter(o=>!["closed","cancelled"].includes(o.status)).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).map(o=>(
                      <option key={o.id} value={o.id}>{o.id} · {o.customerName} · {o.tourName||o.service} · {o.departDate?new Date(o.departDate).toLocaleDateString("vi-VN"):"Chưa có ngày"}</option>
                    ))}
                  </select>
                </div>

                {/* Panel thông tin đơn */}
                {selectedOrder&&(
                  <div style={{padding:"14px 16px",borderRadius:10,marginBottom:16,background:"#f0fdf4",border:"0.5px solid #bbf7d0"}}>
                    <div style={{fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:".6px",color:"#0F6E56",marginBottom:10}}>Thông tin đơn hàng</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                      {[
                        {label:"Khách hàng",val:selectedOrder.customerName},
                        {label:"SĐT",val:selectedOrder.customerPhone||"—"},
                        {label:"Dịch vụ",val:selectedOrder.tourName||selectedOrder.serviceName||selectedOrder.service},
                        {label:"Ngày khởi hành",val:selectedOrder.departDate?new Date(selectedOrder.departDate).toLocaleDateString("vi-VN"):"—"},
                        {label:"Ngày về",val:selectedOrder.returnDate?new Date(selectedOrder.returnDate).toLocaleDateString("vi-VN"):"—"},
                        {label:"Số khách",val:`${selectedOrder.paxAdults||selectedOrder.pax?.adults||0} NL`+(selectedOrder.paxChildren||selectedOrder.pax?.children?` · ${selectedOrder.paxChildren||selectedOrder.pax?.children} TE`:"")},
                        {label:"Doanh thu",val:(selectedOrder.totalPrice||0).toLocaleString("vi-VN")+"đ",color:"#0F6E56"},
                        {label:"Giá vốn",val:(selectedOrder.costPrice||selectedOrder.pricing?.costPrice||0).toLocaleString("vi-VN")+"đ",color:"#A32D2D"},
                        {label:"Sale phụ trách",val:selectedOrder.sale||"—"},
                      ].map(item=>(
                        <div key={item.label}>
                          <div style={{fontSize:11,color:"#64748b",marginBottom:2}}>{item.label}</div>
                          <div style={{fontSize:13,fontWeight:500,color:item.color||"#1e293b"}}>{item.val}</div>
                        </div>
                      ))}
                    </div>
                    {selectedOrder.note&&<div style={{marginTop:8,fontSize:12,color:"#633806",padding:"6px 10px",background:"#fef9e7",borderRadius:6,borderLeft:"2px solid #e8c53a"}}>Ghi chú: {selectedOrder.note}</div>}
                  </div>
                )}

                {/* Bước 2: Chọn NCC */}
                <div style={{marginBottom:16}}>
                  <label style={lbl}>Nhà cung cấp (NCC) *<span style={{fontSize:11,fontWeight:400,color:"#64748b",marginLeft:6}}>(NCC sẽ cung cấp dịch vụ cho đơn này)</span></label>
                  <select value={bkForm.supplierId||bkForm.nccId||""} onChange={e=>{const s=(suppliers||[]).find(x=>x.id===e.target.value);setBkForm(f=>({...f,supplierId:e.target.value,nccId:e.target.value,nccName:s?.name||s?.ten||""}));}} style={{...inp,fontSize:13}}>
                    <option value="">— Chọn NCC —</option>
                    {(suppliers||[]).map(s=><option key={s.id} value={s.id}>{s.name||s.ten}{s.phone||s.sdt?` · ${s.phone||s.sdt}`:""}</option>)}
                  </select>
                </div>

                {/* Panel thông tin NCC */}
                {selectedNCC&&(
                  <div style={{padding:"12px 16px",borderRadius:10,marginBottom:16,background:"#faf9f6",border:"0.5px solid #e8e6df"}}>
                    <div style={{fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:".6px",color:"#854F0B",marginBottom:8}}>Thông tin NCC</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,fontSize:13}}>
                      <div><span style={{color:"#64748b",fontSize:11}}>Tên: </span><strong>{selectedNCC.name||selectedNCC.ten}</strong></div>
                      <div><span style={{color:"#64748b",fontSize:11}}>SĐT: </span><a href={`tel:${selectedNCC.phone||selectedNCC.sdt}`} style={{color:"#185FA5",textDecoration:"none",fontWeight:500}}>{selectedNCC.phone||selectedNCC.sdt||"—"}</a></div>
                      {(selectedNCC.bank||selectedNCC.taiKhoanNganHang)&&(
                        <div style={{gridColumn:"1/-1"}}><span style={{color:"#64748b",fontSize:11}}>TK Ngân hàng: </span><span style={{fontFamily:"monospace",fontWeight:500,fontSize:12}}>{selectedNCC.bank||(selectedNCC.taiKhoanNganHang?`${selectedNCC.taiKhoanNganHang.nganHang} - ${selectedNCC.taiKhoanNganHang.soTk} - ${selectedNCC.taiKhoanNganHang.chuTk}`:"—")}</span></div>
                      )}
                      {(selectedNCC.nguoiLienHe||selectedNCC.contact)&&<div><span style={{color:"#64748b",fontSize:11}}>Người LH: </span><span>{selectedNCC.nguoiLienHe||selectedNCC.contact}</span></div>}
                    </div>
                  </div>
                )}

                {/* Bước 3: Chi tiết booking */}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
                  <div>
                    <label style={lbl}>Dịch vụ booking</label>
                    <input value={bkForm.service||""} onChange={e=>setBkForm(f=>({...f,service:e.target.value}))} placeholder="VD: Vé MB HAN-DAD, Phòng Superior 3 đêm..." style={inp}/>
                    {selectedOrder&&bkForm.service!==(selectedOrder.tourName||selectedOrder.service)&&(
                      <div style={{fontSize:11,color:"#64748b",marginTop:3}}>Từ đơn: {selectedOrder.tourName||selectedOrder.service}<button type="button" onClick={()=>setBkForm(f=>({...f,service:selectedOrder.tourName||selectedOrder.service||""}))} style={{marginLeft:6,fontSize:11,color:"#185FA5",background:"none",border:"none",cursor:"pointer",padding:0}}>← Dùng lại</button></div>
                    )}
                  </div>
                  <div>
                    <label style={lbl}>Số tiền *{selectedOrder&&(selectedOrder.costPrice||selectedOrder.pricing?.costPrice)&&(<button type="button" onClick={()=>setBkForm(f=>({...f,amount:selectedOrder.costPrice||selectedOrder.pricing?.costPrice||0}))} style={{marginLeft:8,fontSize:11,color:"#185FA5",background:"none",border:"none",cursor:"pointer",fontWeight:400,textDecoration:"underline"}}>Gợi ý: {(selectedOrder.costPrice||selectedOrder.pricing?.costPrice||0).toLocaleString("vi-VN")}đ</button>)}</label>
                    <NumberInput value={bkForm.amount||0} onChange={v=>setBkForm(f=>({...f,amount:v}))} placeholder="VD: 2.500.000" style={{...inp,textAlign:"right"}}/>
                  </div>
                  <div>
                    <label style={lbl}>Mã PNR / Booking code</label>
                    <input value={bkForm.pnrCode||""} onChange={e=>setBkForm(f=>({...f,pnrCode:e.target.value}))} placeholder="VD: VN-ABC123, VPQ-2025-001" style={inp}/>
                  </div>
                  <div>
                    <label style={lbl}>Time Limit<span style={{fontSize:11,fontWeight:400,color:"#64748b",marginLeft:4}}>(hạn giữ chỗ với NCC)</span></label>
                    <input type="datetime-local" value={bkForm.timeLimit||""} onChange={e=>setBkForm(f=>({...f,timeLimit:e.target.value}))} style={inp}/>
                  </div>
                  <div style={{gridColumn:"1/-1"}}>
                    <label style={lbl}>Ghi chú</label>
                    <textarea value={bkForm.note||""} onChange={e=>setBkForm(f=>({...f,note:e.target.value}))} rows={2} placeholder="VD: Phòng nhìn ra biển, tầng cao · Yêu cầu ăn chay..." style={{...inp,resize:"vertical",minHeight:48}}/>
                  </div>
                </div>

                <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
                  <button type="button" onClick={()=>{setShowBkForm(false);setBkForm({orderId:"",supplierId:"",nccId:"",nccName:"",service:"",amount:"",pnrCode:"",timeLimit:"",note:"",});}} style={{padding:"9px 20px",borderRadius:8,border:"0.5px solid #e2e8f0",background:"#fff",cursor:"pointer",fontSize:13}}>Hủy</button>
                  <button type="button" onClick={()=>{if(!bkForm.orderId)return pushNotif?.("Chọn đơn hàng","error");if(!bkForm.supplierId&&!bkForm.nccId)return pushNotif?.("Chọn NCC","error");if(!(bkForm.amount>0))return pushNotif?.("Nhập số tiền","error");saveBooking();}} style={{padding:"9px 24px",borderRadius:8,border:"none",background:"#7c3aed",color:"#fff",cursor:"pointer",fontWeight:600,fontSize:13}}>Lưu booking</button>
                </div>
              </div>
            );
          })()}
          <div style={{background:"#fff",borderRadius:12,boxShadow:"0 1px 4px rgba(0,0,0,.07)",overflow:"hidden"}}>
            {bookings.length===0&&<div style={{textAlign:"center",color:"#94a3b8",padding:48}}>Chưa có booking nào</div>}
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
              {bookings.length>0&&<thead><tr style={{background:"#f8fafc"}}>{["Mã","NCC / Dịch vụ","Đơn hàng","Số tiền","PNR","Time Limit","Trạng thái",""].map(h=><th key={h} style={{padding:"10px 12px",textAlign:"left",fontWeight:700,color:"#475569",fontSize:12,whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>}
              <tbody>
                {bookings.map(b=>{
                  const bs=BK_STATUS[b.status]||BK_STATUS.pending;
                  const tl=b.timeLimit?new Date(b.timeLimit):null;
                  const tlExpired=tl&&tl<new Date();
                  return(
                    <tr key={b.id} style={{borderTop:"1px solid #f8fafc"}}>
                      <td style={{padding:"10px 12px",fontWeight:700}}>{b.id}</td>
                      <td style={{padding:"10px 12px"}}><div style={{fontWeight:600}}>{b.nccName||"—"}</div><div style={{fontSize:11,color:"#64748b"}}>{b.service||""}</div></td>
                      <td style={{padding:"10px 12px"}}>{b.orderId||"—"}</td>
                      <td style={{padding:"10px 12px",fontWeight:700,color:"#dc2626"}}>{(b.amount||0).toLocaleString("vi-VN")}₫</td>
                      <td style={{padding:"10px 12px",fontSize:12}}>{b.pnrCode||"—"}</td>
                      <td style={{padding:"10px 12px",fontSize:12,color:tlExpired?"#dc2626":"#16a34a"}}>{tl?tl.toLocaleDateString("vi-VN"):"—"}</td>
                      <td style={{padding:"10px 12px"}}><span style={{background:bs.bg,color:bs.c,borderRadius:20,padding:"2px 8px",fontSize:11,fontWeight:700}}>{bs.label}</span></td>
                      <td style={{padding:"10px 12px"}}>
                        {b.status==="pending"&&<select value={b.status} onChange={e=>updateBkStatus(b.id,e.target.value)} style={{border:"1px solid #e2e8f0",borderRadius:6,padding:"3px 6px",fontSize:11,fontFamily:"inherit"}}>
                          <option value="pending">Cập nhật</option>
                          <option value="confirmed">Xác nhận</option>
                          <option value="paid">Đã thanh toán</option>
                          <option value="cancelled">Hủy</option>
                        </select>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SupplierDetail — view-only panel ───────────────────────
function SupplierDetail({ supplier:s, onEdit, onDelete, fmtMoney, expenses=[] }){
  const nccExpenses=expenses.filter(e=>e.nccName===s.ten||e.nha_cung_cap_id===s.id);
  const totalChi=nccExpenses.filter(e=>e.type==="chi"&&e.status==="paid").reduce((sum,e)=>sum+(e.amount||0),0);

  return(
    <div style={{maxWidth:680}}>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
        <div>
          <div style={{fontSize:11,color:"#94a3b8",fontWeight:700,letterSpacing:1}}>{s.ma_ncc}</div>
          <h2 style={{margin:"2px 0 4px",fontSize:22,fontWeight:900}}>{s.ten}</h2>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            <ContractBadge status={s.trang_thai_hop_dong}/>
            {(s.loai_hinh||[]).map(l=><ServiceTypeBadge key={l} loai={l}/>)}
          </div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={onEdit} style={{background:"#2563eb",color:"#fff",border:"none",borderRadius:8,padding:"8px 18px",cursor:"pointer",fontWeight:700,fontSize:13}}>✏ Sửa</button>
          <button onClick={onDelete} style={{background:"#fff",color:"#dc2626",border:"1px solid #dc2626",borderRadius:8,padding:"8px 14px",cursor:"pointer",fontWeight:700,fontSize:13}}>🗑</button>
        </div>
      </div>

      {/* Star rating */}
      <div style={{marginBottom:16,display:"flex",alignItems:"center",gap:8}}>
        <StarRating value={s.danh_gia_noi_bo||0} size={20}/>
        <span style={{fontSize:13,color:"#64748b"}}>Đánh giá nội bộ</span>
      </div>

      {s.ghi_chu_uu_tien&&<div style={{background:"#fef9c3",borderRadius:10,padding:"10px 14px",fontSize:13,color:"#92400e",marginBottom:16}}>⭐ {s.ghi_chu_uu_tien}</div>}

      {/* Info grid */}
      <div style={{background:"#f8fafc",borderRadius:12,overflow:"hidden",marginBottom:16}}>
        {[["Người liên hệ",s.nguoi_lien_he||"—"],["SĐT",s.sdt||"—"],["Email",s.email||"—"],["Khu vực",(s.khu_vuc_hoat_dong||[]).join(", ")||"—"],["Phụ trách",s.nguoi_phu_trach||"—"]].map(([k,v])=>(
          <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"10px 14px",borderBottom:"1px solid #f1f5f9",fontSize:13}}>
            <span style={{color:"#64748b"}}>{k}</span><span style={{fontWeight:600}}>{v}</span>
          </div>
        ))}
      </div>

      {/* Bank */}
      <div style={{background:"#f0f9ff",borderRadius:10,padding:"12px 14px",marginBottom:16,fontSize:13}}>
        <div style={{fontWeight:700,color:"#1e3a5f",marginBottom:6}}>🏦 Tài khoản ngân hàng</div>
        <div style={{color:"#334155"}}>{s.tai_khoan_ngan_hang?.ngan_hang||"—"} · {s.tai_khoan_ngan_hang?.so_tk||"—"} · {s.tai_khoan_ngan_hang?.chu_tk||"—"}</div>
      </div>

      {/* Debt */}
      <div style={{background:totalChi>0?"#fef2f2":"#f0fdf4",borderRadius:10,padding:"12px 14px",marginBottom:20,fontSize:13}}>
        <div style={{fontWeight:700,color:totalChi>0?"#991b1b":"#14532d",marginBottom:4}}>💳 Công nợ</div>
        <div style={{fontSize:18,fontWeight:900,color:totalChi>0?"#dc2626":"#16a34a"}}>{fmtMoney(s.cong_no||0)}</div>
        <div style={{fontSize:11,color:"#6b7280",marginTop:2}}>Tổng đã chi (paid): {fmtMoney(totalChi)}</div>
      </div>

      {/* Services */}
      <div>
        <div style={{fontSize:13,fontWeight:800,color:"#1e293b",marginBottom:10}}>Danh mục dịch vụ ({s.dich_vu.length})</div>
        {s.dich_vu.length===0&&<div style={{color:"#94a3b8",fontSize:13}}>Chưa có dịch vụ nào</div>}
        {s.dich_vu.map(d=>{
          const gia=d.gia_tham_khao;
          return(
            <div key={d.id} style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,marginBottom:10,overflow:"hidden",opacity:d.active?1:.55}}>
              <div style={{padding:"12px 14px",display:"flex",gap:10,alignItems:"center"}}>
                <ServiceTypeBadge loai={d.loai}/>
                {d.meta?.hang_sao>0&&<StarRating value={d.meta.hang_sao} size={14}/>}
                <span style={{flex:1,fontWeight:700,fontSize:13}}>{d.ten_dich_vu}</span>
                <span style={{fontSize:12,color:"#64748b"}}>{d.phan_khuc}</span>
                {gia.tu>0&&<span style={{fontSize:12,color:"#16a34a",fontWeight:700}}>{fmtMoneyK(gia.tu)}–{fmtMoneyK(gia.den)}/{gia.don_vi}</span>}
                {!d.active&&<span style={{fontSize:11,color:"#94a3b8",background:"#f1f5f9",borderRadius:4,padding:"1px 6px"}}>Ẩn</span>}
              </div>
              {(d.chinh_sach_huy||d.dieu_kien_booking||d.ghi_chu_uu_tien)&&(
                <div style={{borderTop:"1px solid #f1f5f9",padding:"8px 14px",fontSize:12,color:"#64748b",display:"grid",gap:4}}>
                  {d.chinh_sach_huy&&<div>📋 Hủy: {d.chinh_sach_huy}</div>}
                  {d.dieu_kien_booking&&<div>🔖 Booking: {d.dieu_kien_booking}</div>}
                  {d.mua_cao_diem&&<div>📅 Cao điểm: {d.mua_cao_diem}</div>}
                  {(d.gia_tham_khao?.ghi_chu)&&<div>💬 {d.gia_tham_khao.ghi_chu}</div>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── SupplierForm — add/edit form ───────────────────────────
function SupplierForm({ form, updF, updBank, editingSv, setEditingSv, expandedSv, togSvExpand, saveSv, deleteSv, onSave, onCancel, isNew }){
  return(
    <div style={{maxWidth:680}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <h3 style={{margin:0,fontSize:18,fontWeight:900}}>{isNew?"Thêm NCC mới":"Chỉnh sửa NCC"}</h3>
        <div style={{display:"flex",gap:8}}>
          <button onClick={onCancel} style={{padding:"8px 18px",borderRadius:8,border:"1px solid #e2e8f0",background:"#fff",cursor:"pointer",fontWeight:600,fontSize:13}}>Hủy</button>
          <button onClick={onSave} style={{padding:"8px 22px",borderRadius:8,border:"none",background:"#16a34a",color:"#fff",cursor:"pointer",fontWeight:700,fontSize:13}}>💾 Lưu NCC</button>
        </div>
      </div>

      {/* Section 1 — Thông tin chung */}
      <SectionCard title="1. Thông tin chung">
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <label><div style={lbl}>Mã NCC</div><input value={form.ma_ncc||""} onChange={e=>updF("ma_ncc",e.target.value)} style={inp}/></label>
          <label style={{gridColumn:"1/-1"}}><div style={lbl}>Tên NCC *</div><input value={form.ten||""} onChange={e=>updF("ten",e.target.value)} placeholder="VD: Vietnam Airlines" style={inp}/></label>
          <label><div style={lbl}>Người liên hệ</div><input value={form.nguoi_lien_he||""} onChange={e=>updF("nguoi_lien_he",e.target.value)} style={inp}/></label>
          <label><div style={lbl}>SĐT *</div><input value={form.sdt||""} onChange={e=>updF("sdt",e.target.value)} style={inp}/></label>
          <label><div style={lbl}>Email</div><input value={form.email||""} onChange={e=>updF("email",e.target.value)} style={inp}/></label>
          <label><div style={lbl}>Mã số thuế</div><input value={form.ma_so_thue||""} onChange={e=>updF("ma_so_thue",e.target.value)} placeholder="VD: 0312345678" style={inp}/></label>
          <label style={{gridColumn:"1/-1"}}><div style={lbl}>Địa chỉ</div><input value={form.dia_chi||""} onChange={e=>updF("dia_chi",e.target.value)} placeholder="Địa chỉ đăng ký kinh doanh" style={inp}/></label>
          <label style={{gridColumn:"1/-1"}}><div style={lbl}>Ghi chú ưu tiên</div><textarea value={form.ghi_chu_uu_tien||""} onChange={e=>updF("ghi_chu_uu_tien",e.target.value)} rows={2} style={{...inp,resize:"vertical"}}/></label>
          <div>
            <div style={lbl}>Đánh giá nội bộ</div>
            <StarRating value={form.danh_gia_noi_bo||0} onChange={v=>updF("danh_gia_noi_bo",v)} size={22}/>
          </div>
          <label>
            <div style={lbl}>Trạng thái hợp đồng</div>
            <select value={form.trang_thai_hop_dong||"chua"} onChange={e=>updF("trang_thai_hop_dong",e.target.value)} style={inp}>
              <option value="co">Có HĐ</option>
              <option value="chua">Thiếu HĐ</option>
              <option value="het_han">Hết hạn</option>
            </select>
          </label>
          {/* Upload hợp đồng ký kết */}
          <div style={{gridColumn:"1/-1"}}>
            <div style={lbl}>Hợp đồng ký kết (PDF/ảnh)</div>
            {form.hop_dong_file?(
              <div style={{display:"flex",alignItems:"center",gap:10,background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:10,padding:"10px 14px"}}>
                <span style={{fontSize:22}}>📄</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:600,color:"#15803d",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{form.hop_dong_ten||"Hợp đồng đã tải"}</div>
                  <a href={form.hop_dong_file} target="_blank" rel="noreferrer" style={{fontSize:11,color:"#2563eb"}}>Xem / Tải về</a>
                </div>
                <button type="button" onClick={()=>{updF("hop_dong_file","");updF("hop_dong_ten","");}} style={{background:"#fee2e2",color:"#dc2626",border:"none",borderRadius:7,padding:"6px 12px",cursor:"pointer",fontSize:12,fontWeight:600}}>✕ Xóa</button>
              </div>
            ):(
              <label style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,border:"2px dashed #cbd5e1",borderRadius:10,padding:"14px",cursor:"pointer",background:"#f8fafc",color:"#64748b",fontSize:13,fontWeight:600}}>
                📎 Tải lên hợp đồng (PDF hoặc ảnh, tối đa 8MB)
                <input type="file" accept="image/*,.pdf" style={{display:"none"}} onChange={e=>{
                  const file=e.target.files?.[0];
                  if(!file) return;
                  if(file.size>8*1024*1024){alert("File tối đa 8MB");return;}
                  const reader=new FileReader();
                  reader.onload=(ev)=>{updF("hop_dong_file",ev.target.result);updF("hop_dong_ten",file.name);};
                  reader.readAsDataURL(file);
                }}/>
              </label>
            )}
          </div>
        </div>
      </SectionCard>

      {/* Section 2 — Ngân hàng */}
      <SectionCard title="2. Tài khoản ngân hàng">
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <label><div style={lbl}>Ngân hàng</div><input value={form.tai_khoan_ngan_hang?.ngan_hang||""} onChange={e=>updBank("ngan_hang",e.target.value)} style={inp}/></label>
          <label><div style={lbl}>Số tài khoản</div><input value={form.tai_khoan_ngan_hang?.so_tk||""} onChange={e=>updBank("so_tk",e.target.value)} style={inp}/></label>
          <label style={{gridColumn:"1/-1"}}><div style={lbl}>Chủ tài khoản</div><input value={form.tai_khoan_ngan_hang?.chu_tk||""} onChange={e=>updBank("chu_tk",e.target.value)} style={inp}/></label>
        </div>
      </SectionCard>

      {/* Section 3 — Dịch vụ */}
      <SectionCard title={`3. Danh mục dịch vụ (${(form.dich_vu||[]).length})`}>
        {(form.dich_vu||[]).map(d=>{
          const isEditing=editingSv===d.id;
          return(
            <div key={d.id} style={{border:"1px solid #e2e8f0",borderRadius:10,marginBottom:8,overflow:"hidden"}}>
              <div style={{display:"flex",gap:8,alignItems:"center",padding:"10px 12px",background:"#f8fafc",cursor:"pointer",opacity:d.active?1:.6}} onClick={()=>togSvExpand(d.id)}>
                <span style={{fontSize:13}}>{expandedSv[d.id]?"▼":"▶"}</span>
                <ServiceTypeBadge loai={d.loai}/>
                <span style={{flex:1,fontWeight:700,fontSize:13}}>{d.ten_dich_vu||"(chưa đặt tên)"}</span>
                <span style={{fontSize:12,color:"#64748b"}}>{d.phan_khuc} · {d.khu_vuc?.loai}</span>
                {d.gia_tham_khao?.tu>0&&<span style={{fontSize:12,color:"#16a34a",fontWeight:700}}>{fmtMoneyK(d.gia_tham_khao.tu)}/{d.gia_tham_khao.don_vi}</span>}
                <button onClick={e=>{e.stopPropagation();setEditingSv(isEditing?null:d.id);}} style={{background:"#eff6ff",color:"#2563eb",border:"none",borderRadius:6,padding:"3px 10px",cursor:"pointer",fontSize:12,fontWeight:700}}>Sửa</button>
                <button onClick={e=>{e.stopPropagation();deleteSv(d.id);}} style={{background:"#fff",color:"#dc2626",border:"1px solid #fca5a5",borderRadius:6,padding:"3px 8px",cursor:"pointer",fontSize:12}}>🗑</button>
              </div>
              {(isEditing)&&<ServiceEntryForm entry={d} onSave={saveSv} onCancel={()=>setEditingSv(null)}/>}
            </div>
          );
        })}
        {editingSv==="new"&&<ServiceEntryForm entry={null} onSave={sv=>{saveSv(sv);setEditingSv(null);}} onCancel={()=>setEditingSv(null)}/>}
        {editingSv!=="new"&&(
          <button onClick={()=>setEditingSv("new")} style={{marginTop:8,background:"#eff6ff",color:"#2563eb",border:"1px dashed #93c5fd",borderRadius:8,padding:"9px 16px",cursor:"pointer",fontSize:13,fontWeight:700,width:"100%"}}>+ Thêm dịch vụ</button>
        )}
      </SectionCard>
    </div>
  );
}

function SectionCard({ title, children }){
  const [open,setOpen]=React.useState(true);
  return(
    <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:12,marginBottom:14,overflow:"hidden"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 16px",background:"#f8fafc",cursor:"pointer",borderBottom:open?"1px solid #e2e8f0":"none"}} onClick={()=>setOpen(v=>!v)}>
        <span style={{fontWeight:700,fontSize:14,color:"#1e293b"}}>{title}</span>
        <span style={{color:"#94a3b8",fontSize:13}}>{open?"▲":"▼"}</span>
      </div>
      {open&&<div style={{padding:16}}>{children}</div>}
    </div>
  );
}

function PaymentTimeline({order,vouchers}){
  const approved=(vouchers||[]).filter(v=>v.orderId===order.id&&v.type==="thu"&&["approved","confirmed"].includes(v.status));
  const totalPaid=approved.reduce((s,v)=>s+(v.amount||0),0);
  const addonTotal=(order.additionalItems||[]).reduce((s,i)=>s+(i.totalPrice||0),0);
  const grandTotal=(order.totalPrice||0)+addonTotal;
  const remaining=grandTotal-totalPaid;
  const paidPct=grandTotal>0?Math.min(100,Math.round(totalPaid/grandTotal*100)):0;
  return(
    <div style={{padding:"14px 16px",background:"#f8fafc",borderRadius:10,marginBottom:16,border:"1px solid #e2e8f0"}}>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:6}}>
        <span style={{fontWeight:600}}>Tiến độ thanh toán</span>
        <span style={{color:paidPct>=100?"#16a34a":"#d97706",fontWeight:700}}>{paidPct}%</span>
      </div>
      <div style={{background:"#e2e8f0",borderRadius:4,height:8,marginBottom:10}}>
        <div style={{width:paidPct+"%",height:8,borderRadius:4,background:paidPct>=100?"#16a34a":"#2563eb",transition:"width .4s"}}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
        {[["Tổng đơn",grandTotal,"#1e293b"],["Đã thu",totalPaid,"#16a34a"],["Còn lại",remaining,remaining>0?"#dc2626":"#16a34a"]].map(([label,val,color])=>(
          <div key={label} style={{textAlign:"center"}}>
            <div style={{fontSize:11,color:"#64748b"}}>{label}</div>
            <div style={{fontWeight:700,fontSize:13,color}}>{(val||0).toLocaleString("vi-VN")} ₫</div>
          </div>
        ))}
      </div>
      {remaining>0&&order.paymentDeadline&&new Date(order.paymentDeadline)<new Date()&&(
        <div style={{marginTop:8,padding:"6px 10px",background:"#fee2e2",borderRadius:6,fontSize:12,color:"#dc2626",fontWeight:600}}>
          ⚠ Quá hạn thanh toán: {new Date(order.paymentDeadline).toLocaleDateString("vi-VN")}
        </div>
      )}
    </div>
  );
}

function FinancePanel({order,vouchers,onAddVoucher,onApprove,onReject,onUpdate,pushNotif,currentRole,currentUser,bankAccounts=[],expenses=[],suppliers=[],onAddSupplier}){
  const [showQuickNcc,setShowQuickNcc]=React.useState(false);
  const [quickNccName,setQuickNccName]=React.useState("");
  const [tab,setTab]=React.useState("thu");
  const [showForm,setShowForm]=React.useState(false);
  const [showAddonForm,setShowAddonForm]=React.useState(false);
  const [vForm,setVForm]=React.useState({type:"thu",purpose:"deposit",amount:"",method:"cash",note:"",bankId:"",date:new Date().toISOString().slice(0,10),billImg:"",nccId:"",nccName:""});
  const [billLightbox,setBillLightbox]=React.useState(null);
  const handleBillUpload=(e)=>{
    const file=e.target.files?.[0];
    if(!file) return;
    if(file.size>5*1024*1024) return pushNotif&&pushNotif("Ảnh tối đa 5MB","error");
    const reader=new FileReader();
    reader.onload=(ev)=>setVForm(f=>({...f,billImg:ev.target.result}));
    reader.readAsDataURL(file);
  };
  const [addonForm,setAddonForm]=React.useState({name:"",category:"other",unitPrice:0,qty:1,unit:"người",totalPrice:0,note:""});

  const orderVouchers=(vouchers||[]).filter(v=>v.orderId===order?.id);
  const thuList=orderVouchers.filter(v=>v.type==="thu");
  const chiList=orderVouchers.filter(v=>v.type==="chi");
  const totalThu=thuList.filter(v=>["approved","confirmed"].includes(v.status)).reduce((s,v)=>s+(v.amount||0),0);
  const totalChi=chiList.filter(v=>["approved","confirmed"].includes(v.status)).reduce((s,v)=>s+(v.amount||0),0);

  const saveVoucher=()=>{
    if(!vForm.amount||Number(vForm.amount)<=0) return pushNotif&&pushNotif("Nhập số tiền","error");
    if(vForm.type==="chi"&&!vForm.nccId&&!vForm.nccName) return pushNotif&&pushNotif("Chọn nhà cung cấp nhận tiền","error");
    const prefix=vForm.type==="thu"?"PT":"PC";
    const newV={
      id:prefix+"-"+new Date().getFullYear()+"-"+String(Date.now()).slice(-4),
      orderId:order?.id,type:vForm.type,purpose:vForm.purpose||"deposit",
      amount:Number(vForm.amount),method:vForm.method,note:vForm.note,date:vForm.date,
      billImg:vForm.billImg||"",
      ncc:vForm.nccName||"", nccId:vForm.nccId||"",
      customerName:vForm.type==="thu"?(order?.customerName||""):"",
      status:"pending",createdBy:currentUser?.name,createdAt:new Date().toISOString()
    };
    onAddVoucher&&onAddVoucher(newV);
    pushNotif&&pushNotif("Đã tạo phiếu - chờ duyệt","success");
    setShowForm(false);
    setVForm({type:"thu",purpose:"deposit",amount:"",method:"cash",note:"",bankId:"",date:new Date().toISOString().slice(0,10),billImg:"",nccId:"",nccName:""});
  };
  const createQuickNcc=()=>{
    if(!quickNccName.trim()) return pushNotif&&pushNotif("Nhập tên NCC","error");
    const id="ncc-"+Date.now();
    const newNcc={id,ma_ncc:"NCC-"+String(Date.now()).slice(-4),ten:quickNccName.trim(),loai_hinh:[],khu_vuc_hoat_dong:[],sdt:"",email:"",nguoi_lien_he:"",ma_so_thue:"",dia_chi:"",tai_khoan_ngan_hang:{ngan_hang:"",so_tk:"",chu_tk:""},cong_no:0,trang_thai_hop_dong:"chua",danh_gia_noi_bo:3,dich_vu:[]};
    onAddSupplier&&onAddSupplier(newNcc);
    setVForm(f=>({...f,nccId:id,nccName:newNcc.ten}));
    setQuickNccName(""); setShowQuickNcc(false);
    pushNotif&&pushNotif("Đã tạo NCC: "+newNcc.ten,"success");
  };

  const saveAddon=()=>{
    if(!addonForm.name||addonForm.totalPrice<=0) return pushNotif&&pushNotif("Nhập tên và giá dịch vụ bổ sung","error");
    const newItem={
      id:"ADD-"+Date.now(),orderId:order.id,...addonForm,
      addedBy:currentUser?.name,addedAt:new Date().toISOString(),voucherId:null
    };
    onUpdate&&onUpdate({
      ...order,
      additionalItems:[...(order.additionalItems||[]),newItem],
      auditLog:[...(order.auditLog||[]),{ts:new Date().toISOString(),by:currentUser?.name,action:"Thêm dịch vụ bổ sung: "+newItem.name+" — "+newItem.totalPrice.toLocaleString("vi-VN")+" ₫"}],
    });
    setShowAddonForm(false);
    setAddonForm({name:"",category:"other",unitPrice:0,qty:1,unit:"người",totalPrice:0,note:""});
    pushNotif&&pushNotif("Đã thêm dịch vụ bổ sung","success");
  };

  const createAddonVoucher=(item)=>{
    const newV={
      id:"PT-"+new Date().getFullYear()+"-"+String(Date.now()).slice(-4),
      orderId:order.id,type:"thu",purpose:"addon",
      amount:item.totalPrice,method:"bank",
      note:"Thu bổ sung: "+item.name,
      date:new Date().toISOString().slice(0,10),
      status:"pending",createdBy:currentUser?.name,createdAt:new Date().toISOString()
    };
    onAddVoucher&&onAddVoucher(newV);
    onUpdate&&onUpdate({
      ...order,
      additionalItems:(order.additionalItems||[]).map(i=>i.id===item.id?{...i,voucherId:newV.id}:i),
    });
    pushNotif&&pushNotif("Đã tạo "+newV.id+" — chờ kế toán duyệt","success");
  };

  const statusBadge=(s)=>{
    const map={pending:{bg:"#fef9c3",color:"#ca8a04",label:"Chờ duyệt"},approved:{bg:"#dcfce7",color:"#16a34a",label:"Đã duyệt"},rejected:{bg:"#fee2e2",color:"#dc2626",label:"Từ chối"},confirmed:{bg:"#dbeafe",color:"#2563eb",label:"Đã xác nhận"}};
    const c=map[s]||{bg:"#f1f5f9",color:"#64748b",label:s};
    return <span style={{fontSize:11,borderRadius:6,padding:"2px 8px",background:c.bg,color:c.color,fontWeight:600}}>{c.label}</span>;
  };

  const PURPOSE_LABEL={deposit:"Đặt cọc",final_payment:"TT còn lại",addon:"Bổ sung",other:"Khác"};
  const inp11={width:"100%",border:"1px solid #e2e8f0",borderRadius:8,padding:"7px 10px",fontSize:13,boxSizing:"border-box"};

  const addonTotal=(order.additionalItems||[]).reduce((s,i)=>s+(i.totalPrice||0),0);

  return(
    <div style={{marginTop:16}}>
      <PaymentTimeline order={order} vouchers={vouchers}/>

      {/* Tabs */}
      <div style={{display:"flex",gap:8,marginBottom:16,borderBottom:"2px solid #e2e8f0",paddingBottom:8}}>
        {[["thu","Phiếu thu"],["chi","Phiếu chi"],["addon","Dịch vụ bổ sung"]].map(([k,label])=>(
          <button key={k} onClick={()=>setTab(k)} style={{padding:"6px 18px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:600,background:tab===k?"#2563eb":"transparent",color:tab===k?"#fff":"#64748b",display:"flex",alignItems:"center",gap:4}}>
            {label}
            {k==="addon"&&(order.additionalItems||[]).length>0&&<span style={{background:"#dc2626",color:"#fff",borderRadius:999,fontSize:10,padding:"1px 5px"}}>{(order.additionalItems||[]).length}</span>}
          </button>
        ))}
        <div style={{flex:1}}/>
        <div style={{fontSize:13,color:"#64748b"}}>Thu: <b style={{color:"#16a34a"}}>{totalThu.toLocaleString("vi-VN")}₫</b> | Chi: <b style={{color:"#dc2626"}}>{totalChi.toLocaleString("vi-VN")}₫</b></div>
      </div>

      {/* TAB: Phiếu thu / Phiếu chi */}
      {(tab==="thu"||tab==="chi")&&(
        <>
          {/* Phiếu thu: sale/điều hành/GĐ (+KT,thủ quỹ) — sau khi cấp dịch vụ xong | Phiếu chi: GĐ/kế toán/thủ quỹ — đã thanh toán NCC */}
          {((tab==="thu"&&["sale","dieu_hanh","manager","accountant","cashier"].includes(currentRole))
            ||(tab==="chi"&&["manager","accountant","cashier"].includes(currentRole)))&&(
            <button onClick={()=>{
              // Khi bấm nút, đặt cứng type theo tab đang ở
              setVForm(f=>({...f, type:tab, purpose:tab==="thu"?"deposit":"ncc_payment"}));
              setShowForm(true);
            }} style={{marginBottom:12,background:tab==="thu"?"#2563eb":"#dc2626",color:"#fff",border:"none",borderRadius:8,padding:"7px 16px",cursor:"pointer",fontSize:13}}>
              + Tạo phiếu {tab==="thu"?"thu":"chi"}
            </button>
          )}
          {showForm&&(
            <div style={{background:"#f8fafc",borderRadius:12,padding:16,marginBottom:16,border:"1px solid #e2e8f0"}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                {/* Loại phiếu — cứng theo tab đang chọn, không cho đổi */}
                <div style={{gridColumn:"1/-1"}}>
                  <div style={{
                    padding:"10px 14px",borderRadius:8,fontWeight:700,fontSize:14,
                    background:vForm.type==="thu"?"#eff6ff":"#fff1f2",
                    color:vForm.type==="thu"?"#1e40af":"#be123c",
                    border:`1.5px solid ${vForm.type==="thu"?"#bfdbfe":"#fecdd3"}`,
                    display:"flex",alignItems:"center",gap:8
                  }}>
                    <i className={`ti ${vForm.type==="thu"?"ti-arrow-down-circle":"ti-arrow-up-circle"}`} style={{fontSize:18}}/>
                    {vForm.type==="thu"?"Phiếu thu — Ghi nhận tiền khách hàng thanh toán":"Phiếu chi — Ghi nhận chi phí / thanh toán NCC"}
                  </div>
                </div>
                {/* Thu: hiện tên KH | Chi: chọn NCC nhận tiền */}
                {vForm.type==="thu"&&order?.customerName&&(
                  <div style={{gridColumn:"1/-1"}}>
                    <label style={{fontSize:12,fontWeight:600,display:"block",marginBottom:4}}>Khách hàng đóng góp doanh thu</label>
                    <div style={{padding:"9px 12px",background:"#eff6ff",borderRadius:8,fontSize:13,fontWeight:600,color:"#1e40af"}}>👤 {order.customerName}{order.customerPhone?` · ${order.customerPhone}`:""}</div>
                  </div>
                )}
                {vForm.type==="chi"&&(
                  <div style={{gridColumn:"1/-1"}}>
                    <label style={{fontSize:12,fontWeight:600,display:"block",marginBottom:4}}>Nhà cung cấp nhận tiền * <span style={{fontWeight:400,color:"#94a3b8"}}>(ghi nhận chi phí cho NCC)</span></label>
                    {showQuickNcc?(
                      <div style={{display:"flex",gap:6}}>
                        <input value={quickNccName} onChange={e=>setQuickNccName(e.target.value)} placeholder="Tên NCC mới..." autoFocus style={{...inp11,flex:1}}/>
                        <button onClick={createQuickNcc} style={{background:"#16a34a",color:"#fff",border:"none",borderRadius:8,padding:"0 14px",cursor:"pointer",fontSize:13,fontWeight:600}}>Tạo</button>
                        <button onClick={()=>{setShowQuickNcc(false);setQuickNccName("");}} style={{background:"#f1f5f9",color:"#64748b",border:"none",borderRadius:8,padding:"0 12px",cursor:"pointer",fontSize:13}}>Hủy</button>
                      </div>
                    ):(
                      <div style={{display:"flex",gap:6}}>
                        <select value={vForm.nccId} onChange={e=>{const s=suppliers.find(x=>x.id===e.target.value);setVForm(f=>({...f,nccId:e.target.value,nccName:s?.ten||""}));}} style={{...inp11,flex:1}}>
                          <option value="">-- Chọn nhà cung cấp --</option>
                          {suppliers.map(s=><option key={s.id} value={s.id}>{s.ten}{s.loai_hinh?.length?` (${s.loai_hinh[0]})`:""}</option>)}
                        </select>
                        <button onClick={()=>setShowQuickNcc(true)} style={{background:"#eff6ff",color:"#2563eb",border:"1px solid #bfdbfe",borderRadius:8,padding:"0 14px",cursor:"pointer",fontSize:13,fontWeight:600,whiteSpace:"nowrap"}}>+ NCC mới</button>
                      </div>
                    )}
                  </div>
                )}
                {/* Mục đích — phân theo loại thu/chi */}
                <div>
                  <label style={{fontSize:12,fontWeight:600,display:"block",marginBottom:4}}>
                    {vForm.type==="thu"?"Mục đích thu":"Mục đích chi"}
                  </label>
                  <select value={vForm.purpose} onChange={e=>setVForm(f=>({...f,purpose:e.target.value}))} style={inp11}>
                    {vForm.type==="thu" ? (<>
                      <option value="deposit">Đặt cọc (một phần)</option>
                      <option value="full_payment">Thanh toán đủ 100%</option>
                      <option value="final_payment">Thanh toán phần còn lại</option>
                      <option value="addon">Dịch vụ bổ sung</option>
                      <option value="other">Khác</option>
                    </>) : (<>
                      <option value="ncc_payment">Thanh toán NCC</option>
                      <option value="hdv_fee">Thù lao HDV</option>
                      <option value="transport">Vận chuyển</option>
                      <option value="refund">Hoàn tiền KH</option>
                      <option value="other">Khác</option>
                    </>)}
                  </select>
                </div>
                <div>
                  <label style={{fontSize:12,fontWeight:600,display:"block",marginBottom:4}}>Số tiền (₫)</label>
                  <NumberInput
                    value={vForm.amount||0}
                    onChange={v=>setVForm(f=>({...f,amount:v}))}
                    placeholder="VD: 1.500.000"
                    style={inp11}
                  />
                </div>
                <div>
                  <label style={{fontSize:12,fontWeight:600,display:"block",marginBottom:4}}>Hình thức</label>
                  <select value={vForm.method} onChange={e=>setVForm(f=>({...f,method:e.target.value}))} style={inp11}>
                    <option value="cash">Tiền mặt</option><option value="bank">Chuyển khoản</option>
                  </select>
                </div>
                <div>
                  <label style={{fontSize:12,fontWeight:600,display:"block",marginBottom:4}}>Ngày</label>
                  <input type="date" value={vForm.date} onChange={e=>setVForm(f=>({...f,date:e.target.value}))} style={inp11}/>
                </div>
                <div style={{gridColumn:"1/-1"}}>
                  <label style={{fontSize:12,fontWeight:600,display:"block",marginBottom:4}}>Ghi chú</label>
                  <input value={vForm.note} onChange={e=>setVForm(f=>({...f,note:e.target.value}))} style={inp11}/>
                </div>
                {/* Upload ảnh bill / biên lai */}
                <div style={{gridColumn:"1/-1"}}>
                  <label style={{fontSize:12,fontWeight:600,display:"block",marginBottom:6}}>
                    {vForm.type==="thu"?"📸 Ảnh bill nhận tiền":"📸 Ảnh bill chuyển tiền"} <span style={{fontWeight:400,color:"#94a3b8"}}>(biên lai CK / phiếu thu tiền mặt)</span>
                  </label>
                  {vForm.billImg?(
                    <div style={{display:"flex",alignItems:"center",gap:12,background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:10,padding:10}}>
                      <img src={vForm.billImg} alt="bill" onClick={()=>setBillLightbox(vForm.billImg)} style={{width:64,height:64,objectFit:"cover",borderRadius:8,cursor:"zoom-in",border:"1px solid #e2e8f0"}}/>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,fontWeight:600,color:"#15803d"}}>✓ Đã đính kèm ảnh bill</div>
                        <div style={{fontSize:11,color:"#64748b",marginTop:2}}>Bấm ảnh để xem to</div>
                      </div>
                      <button onClick={()=>setVForm(f=>({...f,billImg:""}))} style={{background:"#fee2e2",color:"#dc2626",border:"none",borderRadius:7,padding:"6px 12px",cursor:"pointer",fontSize:12,fontWeight:600}}>✕ Xóa</button>
                    </div>
                  ):(
                    <label style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,border:"2px dashed #cbd5e1",borderRadius:10,padding:"16px",cursor:"pointer",background:"#f8fafc",color:"#64748b",fontSize:13,fontWeight:600}}>
                      📎 Bấm để tải ảnh bill (tối đa 5MB)
                      <input type="file" accept="image/*" onChange={handleBillUpload} style={{display:"none"}}/>
                    </label>
                  )}
                </div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={saveVoucher} style={{background:"#16a34a",color:"#fff",border:"none",borderRadius:8,padding:"7px 18px",cursor:"pointer",fontSize:13}}>Lưu</button>
                <button onClick={()=>setShowForm(false)} style={{background:"#6b7280",color:"#fff",border:"none",borderRadius:8,padding:"7px 18px",cursor:"pointer",fontSize:13}}>Hủy</button>
              </div>
            </div>
          )}
          {/* Lightbox xem ảnh bill */}
          {billLightbox&&(
            <div onClick={()=>setBillLightbox(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",cursor:"zoom-out"}}>
              <img src={billLightbox} alt="bill" style={{maxWidth:"90vw",maxHeight:"90vh",borderRadius:8}}/>
              <button onClick={()=>setBillLightbox(null)} style={{position:"absolute",top:20,right:28,background:"rgba(255,255,255,.15)",border:"none",color:"#fff",borderRadius:"50%",width:36,height:36,fontSize:20,cursor:"pointer"}}>×</button>
            </div>
          )}
          {(tab==="thu"?thuList:chiList).length===0&&<div style={{textAlign:"center",color:"#9ca3af",padding:24,fontSize:13}}>Chưa có phiếu nào</div>}
          {(tab==="thu"?thuList:chiList).map(v=>(
            <div key={v.id} style={{background:"#fff",borderRadius:10,padding:14,marginBottom:8,border:"1px solid #e2e8f0",display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
              {v.billImg&&<img src={v.billImg} alt="bill" onClick={()=>setBillLightbox(v.billImg)} style={{width:44,height:44,objectFit:"cover",borderRadius:8,cursor:"zoom-in",border:"1px solid #e2e8f0",flexShrink:0}} title="Xem ảnh bill"/>}
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:600,fontSize:14}}>{v.id} — {v.method==="cash"?"Tiền mặt":"CK"}{v.billImg&&<span style={{marginLeft:6,fontSize:11,color:"#15803d"}}>📎 Có bill</span>}</div>
                <div style={{fontSize:12,color:"#64748b"}}>{v.date}{v.note&&" · "+v.note}</div>
                {v.purpose&&<span style={{fontSize:11,background:"#f1f5f9",color:"#475569",borderRadius:4,padding:"1px 6px",display:"inline-block",marginTop:2}}>{PURPOSE_LABEL[v.purpose]||v.purpose}</span>}
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{fontWeight:700,fontSize:15,color:v.type==="thu"?"#16a34a":"#dc2626"}}>{(v.amount||0).toLocaleString("vi-VN")}₫</div>
                <div style={{marginTop:4,display:"flex",gap:6,flexWrap:"wrap",justifyContent:"flex-end"}}>
                  {statusBadge(v.status)}
                  <div style={{display:"inline-flex",alignItems:"stretch",borderRadius:6,overflow:"hidden",border:"1px solid #bfdbfe"}}>
                    <button onClick={()=>openPrintWindow(v.type==="thu"?buildPhieuThu(v,order):buildPhieuChi(v,order))} style={{padding:"2px 8px",fontSize:11,fontWeight:600,background:"#eff6ff",color:"#1e3a8a",border:"none",borderRight:"1px solid #bfdbfe",cursor:"pointer"}}>🖨 PDF</button>
                    <button onClick={()=>downloadAsWord(v.type==="thu"?buildPhieuThu(v,order):buildPhieuChi(v,order),(v.type==="thu"?"PhieuThu":"PhieuChi")+"-"+(v.id||""))} style={{padding:"2px 8px",fontSize:11,fontWeight:600,background:"#dbeafe",color:"#1e3a8a",border:"none",cursor:"pointer"}}>📝 Word</button>
                  </div>
                </div>
                {v.status==="pending"&&(currentRole==="accountant"||currentRole==="manager")&&(
                  <div style={{display:"flex",gap:6,marginTop:6}}>
                    <button onClick={()=>onApprove&&onApprove(v.id)} style={{background:"#16a34a",color:"#fff",border:"none",borderRadius:6,padding:"3px 10px",fontSize:11,cursor:"pointer"}}>Duyệt</button>
                    <button onClick={()=>onReject&&onReject(v.id)} style={{background:"#dc2626",color:"#fff",border:"none",borderRadius:6,padding:"3px 10px",fontSize:11,cursor:"pointer"}}>Từ chối</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </>
      )}

      {/* TAB: Dịch vụ bổ sung */}
      {tab==="addon"&&(
        <div>
          <div style={{padding:"10px 14px",background:"#fef9e7",borderRadius:8,marginBottom:12,fontSize:13}}>
            Dịch vụ gốc: <strong>{(order.totalPrice||0).toLocaleString("vi-VN")} ₫</strong>
            {(order.additionalItems||[]).length>0&&(
              <>&nbsp;+ Bổ sung: <strong style={{color:"#d97706"}}>{addonTotal.toLocaleString("vi-VN")} ₫</strong>
              &nbsp;= Tổng mới: <strong style={{color:"#1d6b4f"}}>{((order.totalPrice||0)+addonTotal).toLocaleString("vi-VN")} ₫</strong></>
            )}
          </div>
          {(currentRole==="cashier"||currentRole==="accountant"||currentRole==="manager")&&(
            <button onClick={()=>setShowAddonForm(true)} style={{marginBottom:12,background:"#d97706",color:"#fff",border:"none",borderRadius:8,padding:"7px 16px",cursor:"pointer",fontSize:13}}>+ Thêm dịch vụ bổ sung</button>
          )}
          {showAddonForm&&(
            <div style={{background:"#fff7ed",borderRadius:12,padding:16,marginBottom:16,border:"1px solid #fed7aa"}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div style={{gridColumn:"1/-1"}}>
                  <label style={{fontSize:12,fontWeight:600,display:"block",marginBottom:4}}>Tên dịch vụ bổ sung *</label>
                  <input value={addonForm.name} onChange={e=>setAddonForm(f=>({...f,name:e.target.value}))} placeholder="VD: Nâng phòng Superior lên Deluxe" style={inp11}/>
                </div>
                <div>
                  <label style={{fontSize:12,fontWeight:600,display:"block",marginBottom:4}}>Đơn giá (₫)</label>
                  <NumberInput value={addonForm.unitPrice||0} onChange={v=>setAddonForm(f=>({...f,unitPrice:v,totalPrice:v*(f.qty||1)}))} placeholder="VD: 500.000" style={inp11}/>
                </div>
                <div>
                  <label style={{fontSize:12,fontWeight:600,display:"block",marginBottom:4}}>Số lượng</label>
                  <input type="number" min={1} value={addonForm.qty} onChange={e=>setAddonForm(f=>({...f,qty:Number(e.target.value)||1,totalPrice:(f.unitPrice||0)*(Number(e.target.value)||1)}))} style={inp11}/>
                </div>
                <div>
                  <label style={{fontSize:12,fontWeight:600,display:"block",marginBottom:4}}>Đơn vị</label>
                  <select value={addonForm.unit} onChange={e=>setAddonForm(f=>({...f,unit:e.target.value}))} style={inp11}>
                    <option value="người">người</option><option value="đêm">đêm</option><option value="lần">lần</option><option value="vé">vé</option><option value="suất">suất</option>
                  </select>
                </div>
                <div>
                  <label style={{fontSize:12,fontWeight:600,display:"block",marginBottom:4}}>Thành tiền</label>
                  <div style={{padding:"8px 10px",background:"#f1f5f9",borderRadius:8,fontWeight:700,fontSize:13}}>{(addonForm.totalPrice||0).toLocaleString("vi-VN")} ₫</div>
                </div>
                <div style={{gridColumn:"1/-1"}}>
                  <label style={{fontSize:12,fontWeight:600,display:"block",marginBottom:4}}>Ghi chú</label>
                  <input value={addonForm.note} onChange={e=>setAddonForm(f=>({...f,note:e.target.value}))} style={inp11}/>
                </div>
              </div>
              <div style={{display:"flex",gap:8,marginTop:12}}>
                <button onClick={saveAddon} style={{background:"#d97706",color:"#fff",border:"none",borderRadius:8,padding:"7px 18px",cursor:"pointer",fontWeight:600,fontSize:13}}>Lưu bổ sung</button>
                <button onClick={()=>setShowAddonForm(false)} style={{background:"#f1f5f9",border:"none",borderRadius:8,padding:"7px 18px",cursor:"pointer",fontSize:13}}>Hủy</button>
              </div>
            </div>
          )}
          {(order.additionalItems||[]).length===0&&<div style={{textAlign:"center",color:"#9ca3af",padding:24,fontSize:13}}>Chưa có dịch vụ bổ sung</div>}
          {(order.additionalItems||[]).map(item=>(
            <div key={item.id} style={{background:"#fff",borderRadius:10,padding:14,marginBottom:8,border:"1px solid #fed7aa",display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:600,fontSize:14}}>{item.name}</div>
                <div style={{fontSize:12,color:"#64748b",marginTop:2}}>
                  {(item.unitPrice||0).toLocaleString("vi-VN")} ₫ × {item.qty} {item.unit}
                  {item.note&&" · "+item.note}
                </div>
                <div style={{fontSize:11,color:"#94a3b8",marginTop:2}}>Thêm bởi {item.addedBy} · {item.addedAt?new Date(item.addedAt).toLocaleDateString("vi-VN"):""}</div>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{fontWeight:700,fontSize:15,color:"#d97706"}}>+{(item.totalPrice||0).toLocaleString("vi-VN")} ₫</div>
                {!item.voucherId?(
                  <button onClick={()=>createAddonVoucher(item)} style={{marginTop:6,background:"#2563eb",color:"#fff",border:"none",borderRadius:6,padding:"3px 10px",fontSize:11,cursor:"pointer"}}>Tạo phiếu thu</button>
                ):(
                  <span style={{fontSize:11,color:"#16a34a",display:"block",marginTop:4}}>✓ {item.voucherId}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
function HDVModule({ hdvList=[], onUpdate, orders=[], pushNotif, currentRole }) {
  const EMPTY={name:'',phone:'',speciality:'',lang:[],available:true,cardNo:'',cardType:'domestic',cardExpiry:'',cccd:'',cccdDate:'',cccdPlace:'Cục Cảnh sát QLHCVTTXH',cccdImg:null,photo:null,facebook:'',zalo:'',email:'',dob:'',address:'',dailyRate:0,type:'freelance',notes:'',ratings:[]};
  const [showForm,setShowForm]=React.useState(false);
  const [editHdv,setEditHdv]=React.useState(null);
  const [filterLang,setFilterLang]=React.useState("all");
  const [form,setForm]=React.useState(EMPTY);
  const [contractHdv,setContractHdv]=React.useState(null);
  const [cf,setCf]=React.useState({tourName:'',startDate:'',endDate:'',days:1,dailyRate:0,mealAllowance:0,accommodation:0,transport:0,notes:''});
  const [addRatingHdv,setAddRatingHdv]=React.useState(null);
  const [ratingForm,setRatingForm]=React.useState({score:5,note:'',tourName:''});

  const LANG_LABEL={vi:"Tiếng Việt",en:"English",fr:"Français",zh:"中文",ko:"한국어",ja:"日本語"};
  const CARD_TYPE_OPTS=[["domestic","Quốc nội"],["international","Quốc tế"]];
  const HDV_TYPE_OPTS=[["freelance","Freelance"],["partner","Cộng tác viên"],["fulltime","Toàn thời gian"]];
  const allLangs=[...new Set(hdvList.flatMap(h=>h.lang||[]))];
  const inp={width:'100%',border:'1px solid #e2e8f0',borderRadius:8,padding:'9px 12px',fontSize:13,boxSizing:'border-box'};
  const lbl={display:'block',marginBottom:4,fontSize:12,fontWeight:600,color:"#374151"};
  const canEdit=currentRole==='manager'||currentRole==='dieu_hanh';

  const expiringHdvs=React.useMemo(()=>{
    const now=new Date(); const soon=new Date(now); soon.setDate(soon.getDate()+30);
    return hdvList.filter(h=>{
      if(!h.cardExpiry) return false;
      const exp=new Date(h.cardExpiry);
      return exp<=soon;
    }).map(h=>({...h,_daysLeft:Math.round((new Date(h.cardExpiry)-now)/86400000)}));
  },[hdvList]);

  const avgRating=(h)=>{
    const r=h.ratings||[]; if(!r.length) return null;
    return (r.reduce((s,x)=>s+x.score,0)/r.length).toFixed(1);
  };
  const starStr=(avg)=>avg==null?"":("★").repeat(Math.round(avg))+("☆").repeat(5-Math.round(avg));

  const addRating=()=>{
    if(!addRatingHdv) return;
    const r={score:ratingForm.score,note:ratingForm.note,tourName:ratingForm.tourName,by:currentRole,date:new Date().toISOString().slice(0,10)};
    onUpdate(hdvList.map(h=>h.id===addRatingHdv.id?{...h,ratings:[...(h.ratings||[]),r]}:h));
    pushNotif&&pushNotif("Đã lưu đánh giá cho "+addRatingHdv.name);
    setAddRatingHdv(null); setRatingForm({score:5,note:'',tourName:''});
  };

  const activeAssignments=React.useMemo(()=>{
    const m={};
    orders.filter(o=>["confirmed","in_progress"].includes(o.status)&&o.hdvId).forEach(o=>{
      if(!m[o.hdvId]) m[o.hdvId]=[];
      m[o.hdvId].push(o);
    });
    return m;
  },[orders]);

  React.useEffect(()=>{
    if(cf.startDate&&cf.endDate){
      const d=Math.max(1,Math.round((new Date(cf.endDate)-new Date(cf.startDate))/86400000)+1);
      setCf(f=>({...f,days:d}));
    }
  },[cf.startDate,cf.endDate]);

  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const setCfField=(k,v)=>setCf(f=>({...f,[k]:v}));
  const toggleLang=(l)=>set('lang',(form.lang||[]).includes(l)?form.lang.filter(x=>x!==l):[...(form.lang||[]),l]);
  const handleImg=(field,e)=>{
    const file=e.target.files[0]; if(!file) return;
    const reader=new FileReader();
    reader.onload=ev=>set(field,ev.target.result);
    reader.readAsDataURL(file);
  };

  const save=()=>{
    if(!form.name.trim()) return pushNotif('Nhập tên HDV','error');
    if(editHdv){
      onUpdate(hdvList.map(h=>h.id===editHdv.id?{...h,...form}:h));
      pushNotif('Đã cập nhật HDV');
    } else {
      onUpdate([...hdvList,{...form,id:'HDV'+Date.now()}]);
      pushNotif('Đã thêm HDV mới');
    }
    setShowForm(false); setForm(EMPTY); setEditHdv(null);
  };

  const toggleAvailable=(h)=>{
    onUpdate(hdvList.map(x=>x.id===h.id?{...x,available:!x.available}:x));
    pushNotif&&pushNotif(h.available?"Đã chuyển "+h.name+" sang Bận":"Đã chuyển "+h.name+" sang Rảnh");
  };

  const openEdit=(h)=>{setEditHdv(h);setForm({...EMPTY,...h});setShowForm(true);};
  const openContract=(h)=>{
    setCf({tourName:'',groupName:'',route:'',startDate:'',endDate:'',paxCount:0,vehicle:'Ô tô',totalFee:h.dailyRate||0,paymentMethod:'chuyển khoản / tiền mặt',notes:''});
    setContractHdv(h);
  };

  const printContract=()=>{
    if(!contractHdv) return;
    const h=contractHdv;
    const now=new Date();
    const dd=String(now.getDate()).padStart(2,'0');
    const mm=String(now.getMonth()+1).padStart(2,'0');
    const yyyy=now.getFullYear();
    const contractNo=`${dd}${mm}/HĐ-HDV/${yyyy}`;
    const dateStr=`ngày ${dd} tháng ${mm} năm ${yyyy}`;
    const fmtDate=d=>d?new Date(d).toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric'}):'..............';
    const cardTypeLabel=h.cardType==='international'?'Quốc Tế':'Nội Địa';
    const html=`<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"><title>HĐ HDV - ${h.name}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Times New Roman',Times,serif;font-size:13pt;line-height:1.8;color:#000;background:#fff}
.page{max-width:800px;margin:0 auto;padding:36px 48px}
.header-table{width:100%;border-collapse:collapse;margin-bottom:8px}
.header-table td{vertical-align:top;font-size:12pt}
.col-left{width:48%;text-align:center;font-weight:bold;text-transform:uppercase;font-size:12pt}
.col-right{width:52%;text-align:center}
.col-right .title{font-weight:bold;font-size:13pt}
.col-right .subtitle{font-size:12pt}
.divider{text-align:center;font-size:11pt;margin-top:2px}
h1{text-align:center;font-size:15pt;text-transform:uppercase;font-weight:bold;margin:18px 0 2px;letter-spacing:1px}
h2{text-align:center;font-size:13pt;font-weight:normal;margin-bottom:14px}
.legal-basis{margin:10px 0 14px;font-size:12pt}
.legal-basis p{margin:3px 0}
.party-label{font-weight:bold;text-transform:uppercase;margin-bottom:4px}
.party-block{margin:10px 0;font-size:12.5pt}
.party-block p{margin:2px 0}
.article{margin:12px 0}
.article-title{font-weight:bold;text-decoration:underline}
.article-body{margin:4px 0 4px 16px}
.article-body p{margin:3px 0}
.sign-row{display:flex;justify-content:space-between;margin-top:48px;text-align:center}
.sign-col{width:46%}
.sign-name{margin-top:64px;font-weight:bold}
.note-box{border:1px solid #999;padding:8px 14px;margin:12px 0;font-size:12pt}
@media print{.no-print{display:none}body{-webkit-print-color-adjust:exact}}
</style></head>
<body><div class="page">

<table class="header-table"><tr>
  <td class="col-left">CÔNG TY CỔ PHẦN THƯƠNG MẠI<br/>VÀ DỊCH VỤ DU LỊCH MINH VIỆT<br/><span style="border-top:1px solid #000;display:inline-block;margin-top:4px;padding-top:2px;font-size:11pt;font-weight:normal">------------------</span></td>
  <td style="width:4%"></td>
  <td class="col-right">
    <div class="title">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
    <div class="subtitle">Độc lập - Tự do - Hạnh phúc</div>
    <div class="divider">------o0o------</div>
  </td>
</tr></table>

<h1>Hợp đồng thuê hướng dẫn viên du lịch</h1>
<h2>Số: ${contractNo}</h2>

<div class="legal-basis">
<p>- Căn cứ theo Luật dân sự số 33/2005/QH khoá 11 của nước Cộng Hoà XHCN Việt Nam ban hành ngày 14/06/2005 có hiệu lực từ ngày 01/01/2006</p>
<p>- Căn cứ Luật Du lịch số 09/2017/QH14 ngày 19/6/2017;</p>
<p>- Căn cứ nhu cầu công việc và năng lực chuyên môn của hai bên;</p>
</div>

<p>Hôm nay, ${dateStr} tại Hải Phòng, chúng tôi gồm:</p>

<div class="party-block">
<p class="party-label">Bên A: Bên thuê (Đơn vị tổ chức tour)</p>
<p>Tên đơn vị: <strong>CÔNG TY CỔ PHẦN THƯƠNG MẠI VÀ DỊCH VỤ DU LỊCH MINH VIỆT</strong></p>
<p>Địa chỉ: Số 60/384 Lạch Tray, phường Lạch Tray, quận Ngô Quyền, thành phố Hải Phòng</p>
<p>Mã số thuế: <strong>0201320592</strong></p>
<p>Đại diện: (Ông) <strong>NGUYỄN MINH TÙNG</strong> &nbsp;&nbsp;&nbsp; Chức vụ: Giám đốc</p>
<p>Điện thoại: 0906001359</p>
<p>Số TK: 2037.040.7777.7777 tại ngân hàng: TMCP Phát triển thành phố Hồ Chí Minh - PGD Hải Đăng</p>
<p>Giấy phép Kinh doanh Dịch vụ lữ hành Nội Địa số GP: 31-0062/2022/SDL-GP LHND</p>
</div>

<div class="party-block">
<p class="party-label">Bên B: Bên được thuê (Hướng dẫn viên)</p>
<p>Họ và tên: <strong>${h.name||'...........................'}</strong></p>
<p>Năm sinh: ${h.dob?new Date(h.dob).toLocaleDateString('vi-VN'):'...........................'}</p>
<p>Số CCCD: <strong>${h.cccd||'...........................'}</strong> cấp ngày ${h.cccdDate?new Date(h.cccdDate).toLocaleDateString('vi-VN'):'...............'} tại ${h.cccdPlace||'Cục Cảnh sát QLHCVTTXH'}</p>
<p>Địa chỉ: ${h.address||'...........................................................................................'}</p>
<p>Điện thoại: ${h.phone||'...........................'}</p>
<p>Số thẻ HDV ${cardTypeLabel}: <strong>${h.cardNo||'...........................'}</strong> có giá trị đến ${h.cardExpiry?fmtDate(h.cardExpiry):'...............'}</p>
</div>

<div class="article">
<p class="article-title">Điều 1. Nội dung hợp đồng</p>
<p style="margin:6px 0 4px">Bên B đồng ý nhận công việc hướng dẫn viên du lịch theo tour của Bên A như sau:</p>
<div class="article-body">
<p>. Tên tour: <strong>${cf.tourName||'...........................................................................................'}</strong></p>
<p>. Nội dung tour: Được đính kèm theo hợp đồng này</p>
<p>. Đoàn khách: <strong>${cf.groupName||'...........................................................................................'}</strong></p>
<p>. Thời gian tour: từ ngày ${fmtDate(cf.startDate)} đến ngày ${fmtDate(cf.endDate)}</p>
<p>. Tuyến điểm: ${cf.route||'...........................................................................................'}</p>
<p>. Số lượng khách: <strong>${cf.paxCount||'......'}</strong> người (Theo danh sách đính kèm)</p>
<p>. Phương tiện di chuyển: ${cf.vehicle||'Ô tô'}</p>
</div>
</div>

<div class="article">
<p class="article-title">Điều 2. Trách nhiệm của Bên B</p>
<div class="article-body">
<p>. Thực hiện đầy đủ nghĩa vụ hướng dẫn, thuyết minh, chăm sóc đoàn theo đúng chương trình.</p>
<p>. Tuân thủ pháp luật, nội quy của Bên A và các quy định về nghề hướng dẫn viên.</p>
<p>. Bảo mật thông tin tour, khách hàng và không tự ý thay đổi lịch trình nếu không có sự đồng ý của Bên A.</p>
<p>. Báo cáo tình hình tour khi kết thúc.</p>
</div>
</div>

<div class="article">
<p class="article-title">Điều 3. Trách nhiệm của Bên A</p>
<div class="article-body">
<p>. Cung cấp đầy đủ thông tin tour, giấy tờ, tài liệu, công văn hoặc các công cụ, dụng cụ phục vụ đoàn (nếu có), cũng như phương tiện cần thiết khác để Bên B thực hiện công việc theo đúng yêu cầu.</p>
<p>. Chi trả đầy đủ thù lao và chi phí liên quan đến công việc theo điều khoản hợp đồng.</p>
</div>
</div>

<div class="article">
<p class="article-title">Điều 4. Thù lao và thanh toán</p>
<div class="article-body">
<p>. Tổng Mức thù lao: <strong>${Number(cf.totalFee||0).toLocaleString('vi-VN')} đồng/tour</strong> (Đã bao gồm toàn bộ tiền công hướng dẫn, công tác phí, chi phí ăn ở, đi lại trong tour. Bên A không chịu thêm bất kỳ khoản phát sinh nào ngoài mức thù lao này).</p>
<p>. Hình thức thanh toán: ${cf.paymentMethod||'chuyển khoản / tiền mặt'}</p>
<p>. Thời điểm thanh toán: sau khi kết thúc tour và nhận đủ biên bản nghiệm thu.</p>
</div>
</div>

<div class="article">
<p class="article-title">Điều 5. Điều khoản chung</p>
<div class="article-body">
<p>. Hợp đồng có hiệu lực từ ngày ký đến khi hai bên hoàn thành nghĩa vụ.</p>
<p>. Hai bên cam kết thực hiện đúng nội dung. Mọi sửa đổi phải lập thành văn bản.</p>
<p>. Hợp đồng lập thành 02 bản, mỗi bên giữ 01 bản có giá trị pháp lý như nhau.</p>
</div>
</div>

${cf.notes?`<div class="note-box"><strong>Ghi chú:</strong> ${cf.notes}</div>`:''}

<div class="sign-row">
  <div class="sign-col"><strong>ĐẠI DIỆN BÊN A</strong><br/><em>(Ký, ghi rõ họ tên, đóng dấu)</em><div class="sign-name">NGUYỄN MINH TÙNG</div></div>
  <div class="sign-col"><strong>ĐẠI DIỆN BÊN B</strong><br/><em>(Ký, ghi rõ họ tên)</em><div class="sign-name">${h.name}</div></div>
</div>

<div class="no-print" style="text-align:center;margin-top:40px;padding-top:20px;border-top:1px dashed #ccc">
  <button onclick="window.print()" style="padding:10px 32px;font-size:14px;cursor:pointer;background:#2563eb;color:#fff;border:none;border-radius:8px;font-weight:700">🖨 In hợp đồng</button>
</div>
</div></body></html>`;
    const w=window.open('','_blank'); w.document.write(html); w.document.close(); w.focus();
    setContractHdv(null);
  };

  const filtered=filterLang==="all"?hdvList:hdvList.filter(h=>(h.lang||[]).includes(filterLang));

  return (
    <div style={{padding:24}}>
      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20,flexWrap:"wrap",gap:12}}>
        <div>
          <h2 style={{margin:0,fontSize:20,fontWeight:800}}>Hướng dẫn viên ({hdvList.length})</h2>
          <div style={{fontSize:13,color:"#64748b",marginTop:2}}>{hdvList.filter(h=>h.available).length} đang rảnh · {hdvList.filter(h=>!h.available).length} đang bận</div>
        </div>
        {canEdit&&<button onClick={()=>{setEditHdv(null);setForm(EMPTY);setShowForm(true)}} style={{background:'#2563eb',color:'#fff',border:'none',borderRadius:9,padding:'9px 18px',cursor:'pointer',fontWeight:700,fontSize:14}}>+ Thêm HDV</button>}
      </div>

      {/* Expiry warning banner */}
      {expiringHdvs.length>0&&(
        <div style={{background:"#fef2f2",border:"1px solid #fca5a5",borderRadius:10,padding:"12px 16px",marginBottom:16,display:"flex",alignItems:"flex-start",gap:12}}>
          <div style={{fontSize:20,flexShrink:0}}>🚨</div>
          <div>
            <div style={{fontWeight:700,color:"#dc2626",fontSize:14,marginBottom:4}}>Thẻ HDV sắp hết hạn — cần gia hạn ngay!</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
              {expiringHdvs.map(h=>(
                <span key={h.id} style={{background:"#fee2e2",color:"#b91c1c",borderRadius:6,padding:"3px 10px",fontSize:12,fontWeight:600}}>
                  {h.name} — {h._daysLeft<=0?"ĐÃ HẾT HẠN":h._daysLeft+" ngày nữa"} ({new Date(h.cardExpiry).toLocaleDateString("vi-VN")})
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Edit / Add form */}
      {showForm&&(
        <div style={{background:'#fff',borderRadius:14,padding:24,marginBottom:20,boxShadow:'0 1px 6px rgba(0,0,0,.07)'}}>
          <h3 style={{marginTop:0,marginBottom:16}}>{editHdv?'Sửa HDV':'Thêm HDV mới'}</h3>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div><label style={lbl}>Họ tên *</label><input value={form.name} onChange={e=>set('name',e.target.value)} style={inp}/></div>
            <div><label style={lbl}>SĐT</label><input value={form.phone} onChange={e=>set('phone',e.target.value)} style={inp}/></div>
            <div><label style={lbl}>Số thẻ HDV</label><input value={form.cardNo||''} onChange={e=>set('cardNo',e.target.value)} placeholder="VD: 0123456789" style={inp}/></div>
            <div><label style={lbl}>Loại thẻ</label>
              <select value={form.cardType||'domestic'} onChange={e=>set('cardType',e.target.value)} style={inp}>
                {CARD_TYPE_OPTS.map(([k,v])=><option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div><label style={lbl}>Ngày hết hạn thẻ</label><input type="date" value={form.cardExpiry||''} onChange={e=>set('cardExpiry',e.target.value)} style={inp}/></div>
            <div><label style={lbl}>Số CCCD</label><input value={form.cccd||''} onChange={e=>set('cccd',e.target.value)} style={inp}/></div>
            <div><label style={lbl}>Ngày cấp CCCD</label><input type="date" value={form.cccdDate||''} onChange={e=>set('cccdDate',e.target.value)} style={inp}/></div>
            <div><label style={lbl}>Nơi cấp CCCD</label><input value={form.cccdPlace||''} onChange={e=>set('cccdPlace',e.target.value)} placeholder="Cục Cảnh sát QLHCVTTXH" style={inp}/></div>
            <div><label style={lbl}>Ngày sinh</label><input type="date" value={form.dob||''} onChange={e=>set('dob',e.target.value)} style={inp}/></div>
            <div style={{gridColumn:"1/-1"}}><label style={lbl}>Địa chỉ thường trú</label><input value={form.address||''} onChange={e=>set('address',e.target.value)} placeholder="VD: Thôn Trà Lâm, Thuận Thành, Bắc Ninh" style={inp}/></div>
            <div><label style={lbl}>Email</label><input value={form.email||''} onChange={e=>set('email',e.target.value)} style={inp}/></div>
            <div><label style={lbl}>Loại hợp tác</label>
              <select value={form.type||'freelance'} onChange={e=>set('type',e.target.value)} style={inp}>
                {HDV_TYPE_OPTS.map(([k,v])=><option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div><label style={lbl}>Mức thù lao / ngày (đ)</label><input type="number" value={form.dailyRate||0} onChange={e=>set('dailyRate',Number(e.target.value))} style={inp}/></div>
            <div><label style={lbl}>Chuyên môn / vùng tour</label><input value={form.speciality||''} onChange={e=>set('speciality',e.target.value)} placeholder="VD: Miền Nam, Phú Quốc" style={inp}/></div>
            <div><label style={lbl}>Facebook (URL hoặc tên)</label><input value={form.facebook||''} onChange={e=>set('facebook',e.target.value)} placeholder="facebook.com/ten" style={inp}/></div>
            <div><label style={lbl}>Zalo (SĐT Zalo)</label><input value={form.zalo||''} onChange={e=>set('zalo',e.target.value)} placeholder="SĐT đăng ký Zalo" style={inp}/></div>
            <div style={{gridColumn:"1/-1"}}>
              <label style={lbl}>Ngôn ngữ</label>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {Object.entries(LANG_LABEL).map(([k,v])=>(
                  <button key={k} onClick={()=>toggleLang(k)} style={{padding:"6px 14px",borderRadius:20,border:"none",cursor:"pointer",fontSize:12,fontWeight:600,background:(form.lang||[]).includes(k)?"#2563eb":"#f1f5f9",color:(form.lang||[]).includes(k)?"#fff":"#64748b"}}>{v}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={lbl}>Ảnh đại diện</label>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                {form.photo&&<img src={form.photo} alt="" style={{width:52,height:52,borderRadius:"50%",objectFit:"cover",border:"2px solid #e2e8f0"}}/>}
                <label style={{padding:"7px 14px",background:"#f1f5f9",border:"1px dashed #cbd5e1",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:600}}>
                  {form.photo?"Đổi ảnh":"📷 Tải ảnh lên"}<input type="file" accept="image/*" onChange={e=>handleImg('photo',e)} style={{display:"none"}}/>
                </label>
                {form.photo&&<button onClick={()=>set('photo',null)} style={{border:"none",background:"none",cursor:"pointer",color:"#ef4444",fontSize:12}}>Xóa</button>}
              </div>
            </div>
            <div>
              <label style={lbl}>Ảnh CCCD</label>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                {form.cccdImg&&<img src={form.cccdImg} alt="" style={{width:80,height:50,borderRadius:6,objectFit:"cover",border:"2px solid #e2e8f0"}}/>}
                <label style={{padding:"7px 14px",background:"#f1f5f9",border:"1px dashed #cbd5e1",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:600}}>
                  {form.cccdImg?"Đổi CCCD":"📄 Tải CCCD lên"}<input type="file" accept="image/*" onChange={e=>handleImg('cccdImg',e)} style={{display:"none"}}/>
                </label>
                {form.cccdImg&&<button onClick={()=>set('cccdImg',null)} style={{border:"none",background:"none",cursor:"pointer",color:"#ef4444",fontSize:12}}>Xóa</button>}
              </div>
            </div>
            <div style={{gridColumn:"1/-1"}}><label style={lbl}>Ghi chú nội bộ</label><textarea rows={2} value={form.notes||''} onChange={e=>set('notes',e.target.value)} style={{...inp,resize:"vertical"}}/></div>
          </div>
          <div style={{display:'flex',gap:8,marginTop:16}}>
            <button onClick={save} style={{background:'#16a34a',color:'#fff',border:'none',borderRadius:8,padding:'9px 20px',cursor:'pointer',fontWeight:700}}>Lưu</button>
            <button onClick={()=>{setShowForm(false);setEditHdv(null);}} style={{background:'#6b7280',color:'#fff',border:'none',borderRadius:8,padding:'9px 20px',cursor:'pointer',fontWeight:600}}>Hủy</button>
          </div>
        </div>
      )}

      {/* Contract modal */}
      {contractHdv&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={e=>e.target===e.currentTarget&&setContractHdv(null)}>
          <div style={{background:"#fff",borderRadius:16,padding:28,width:"min(660px,95vw)",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 8px 40px rgba(0,0,0,.22)"}}>
            <h3 style={{marginTop:0,marginBottom:4}}>📄 Tạo hợp đồng — {contractHdv.name}</h3>
            <div style={{fontSize:12,color:"#64748b",marginBottom:16}}>Điền thông tin tour rồi bấm Xuất HĐ để mở trang in</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div style={{gridColumn:"1/-1"}}><label style={lbl}>Tên tour / chương trình *</label>
                <input value={cf.tourName} onChange={e=>setCfField('tourName',e.target.value)} placeholder="VD: HÀNH TRÌNH HẢI PHÒNG - MAI CHÂU 2N1Đ" style={inp}/>
              </div>
              <div style={{gridColumn:"1/-1"}}><label style={lbl}>Đoàn khách (tên công ty / nhóm)</label>
                <input value={cf.groupName||''} onChange={e=>setCfField('groupName',e.target.value)} placeholder="VD: Công ty CP Đông Dương Logistics" style={inp}/>
              </div>
              <div><label style={lbl}>Ngày bắt đầu</label><input type="date" value={cf.startDate} onChange={e=>setCfField('startDate',e.target.value)} style={inp}/></div>
              <div><label style={lbl}>Ngày kết thúc</label><input type="date" value={cf.endDate} onChange={e=>setCfField('endDate',e.target.value)} style={inp}/></div>
              <div style={{gridColumn:"1/-1"}}><label style={lbl}>Tuyến điểm</label>
                <input value={cf.route||''} onChange={e=>setCfField('route',e.target.value)} placeholder="VD: Hải Phòng - Hòa Bình - Mai Châu - Hải Phòng" style={inp}/>
              </div>
              <div><label style={lbl}>Số lượng khách</label><input type="number" min={0} value={cf.paxCount||0} onChange={e=>setCfField('paxCount',Number(e.target.value))} style={inp}/></div>
              <div><label style={lbl}>Phương tiện</label>
                <select value={cf.vehicle||'Ô tô'} onChange={e=>setCfField('vehicle',e.target.value)} style={inp}>
                  {["Ô tô","Xe máy","Tàu hỏa","Máy bay","Tàu thuyền","Khác"].map(v=><option key={v}>{v}</option>)}
                </select>
              </div>
              <div><label style={lbl}>Tổng thù lao ALL-IN (đ) *</label><input type="number" min={0} value={cf.totalFee||0} onChange={e=>setCfField('totalFee',Number(e.target.value))} style={inp}/></div>
              <div><label style={lbl}>Hình thức thanh toán</label>
                <select value={cf.paymentMethod||'chuyển khoản / tiền mặt'} onChange={e=>setCfField('paymentMethod',e.target.value)} style={inp}>
                  {["chuyển khoản / tiền mặt","chuyển khoản","tiền mặt"].map(v=><option key={v}>{v}</option>)}
                </select>
              </div>
              <div style={{gridColumn:"1/-1"}}><label style={lbl}>Ghi chú bổ sung</label><textarea rows={2} value={cf.notes} onChange={e=>setCfField('notes',e.target.value)} style={{...inp,resize:"vertical"}}/></div>
            </div>
            <div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:10,padding:"12px 16px",marginTop:12}}>
              <div style={{fontWeight:700,color:"#15803d",fontSize:16}}>
                Thù lao hợp đồng: {Number(cf.totalFee||0).toLocaleString("vi-VN")}đ
              </div>
              <div style={{fontSize:12,color:"#64748b",marginTop:2}}>All-in — bao gồm công hướng dẫn, ăn ở, đi lại trong tour</div>
            </div>
            <div style={{display:'flex',gap:8,marginTop:16}}>
              <button onClick={printContract} style={{background:'#2563eb',color:'#fff',border:'none',borderRadius:8,padding:'10px 22px',cursor:'pointer',fontWeight:700,fontSize:14}}>🖨 Xuất &amp; In HĐ</button>
              <button onClick={()=>setContractHdv(null)} style={{background:'#6b7280',color:'#fff',border:'none',borderRadius:8,padding:'10px 20px',cursor:'pointer',fontWeight:600}}>Hủy</button>
            </div>
          </div>
        </div>
      )}

      {/* Rating modal */}
      {addRatingHdv&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={e=>e.target===e.currentTarget&&setAddRatingHdv(null)}>
          <div style={{background:"#fff",borderRadius:16,padding:28,width:"min(460px,95vw)",boxShadow:"0 8px 40px rgba(0,0,0,.22)"}}>
            <h3 style={{marginTop:0,marginBottom:4}}>⭐ Chấm điểm — {addRatingHdv.name}</h3>
            {(addRatingHdv.ratings||[]).length>0&&<div style={{fontSize:12,color:"#64748b",marginBottom:16}}>Trung bình hiện tại: {avgRating(addRatingHdv)} ★ ({(addRatingHdv.ratings||[]).length} lần)</div>}
            <div style={{marginBottom:12}}><label style={lbl}>Tour / chuyến đi</label><input value={ratingForm.tourName} onChange={e=>setRatingForm(f=>({...f,tourName:e.target.value}))} placeholder="VD: Tour Phú Quốc 3N2Đ" style={inp}/></div>
            <div style={{marginBottom:12}}>
              <label style={lbl}>Điểm đánh giá</label>
              <div style={{display:"flex",gap:6,marginTop:4}}>
                {[1,2,3,4,5].map(s=>(
                  <button key={s} onClick={()=>setRatingForm(f=>({...f,score:s}))} style={{width:44,height:44,borderRadius:8,border:"none",cursor:"pointer",fontSize:20,background:ratingForm.score>=s?"#fbbf24":"#f1f5f9",transition:"all .15s"}}>★</button>
                ))}
                <span style={{alignSelf:"center",marginLeft:6,fontWeight:700,fontSize:16,color:"#92400e"}}>{ratingForm.score}/5</span>
              </div>
              <div style={{fontSize:11,color:"#94a3b8",marginTop:4}}>{["","⚠ Không phù hợp","↓ Cần cải thiện","↗ Đạt yêu cầu","✓ Tốt","★ Xuất sắc — tour cao cấp"][ratingForm.score]}</div>
            </div>
            <div style={{marginBottom:16}}><label style={lbl}>Nhận xét</label><textarea rows={2} value={ratingForm.note} onChange={e=>setRatingForm(f=>({...f,note:e.target.value}))} placeholder="VD: Dẫn đoàn chuyên nghiệp, khách hài lòng..." style={{...inp,resize:"vertical"}}/></div>
            <div style={{display:'flex',gap:8}}>
              <button onClick={addRating} style={{flex:1,background:'#f59e0b',color:'#fff',border:'none',borderRadius:8,padding:'9px 0',cursor:'pointer',fontWeight:700,fontSize:14}}>Lưu đánh giá</button>
              <button onClick={()=>setAddRatingHdv(null)} style={{background:'#6b7280',color:'#fff',border:'none',borderRadius:8,padding:'9px 16px',cursor:'pointer',fontWeight:600}}>Hủy</button>
            </div>
          </div>
        </div>
      )}

      {/* Language filter */}
      {allLangs.length>0&&(
        <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
          <button onClick={()=>setFilterLang("all")} style={{padding:"6px 14px",borderRadius:20,border:"none",cursor:"pointer",fontSize:12,fontWeight:600,background:filterLang==="all"?"#1e293b":"#f1f5f9",color:filterLang==="all"?"#fff":"#64748b"}}>Tất cả ngôn ngữ</button>
          {allLangs.map(l=>(
            <button key={l} onClick={()=>setFilterLang(l)} style={{padding:"6px 14px",borderRadius:20,border:"none",cursor:"pointer",fontSize:12,fontWeight:600,background:filterLang===l?"#1e293b":"#f1f5f9",color:filterLang===l?"#fff":"#64748b"}}>{LANG_LABEL[l]||l}</button>
          ))}
        </div>
      )}

      {/* Cards */}
      <div style={{display:'grid',gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:14}}>
        {filtered.length===0&&<div style={{textAlign:'center',color:'#9ca3af',padding:40,gridColumn:"1/-1"}}>Chưa có HDV nào</div>}
        {filtered.map(h=>{
          const assignments=activeAssignments[h.id]||[];
          const initials=(h.name||"?").split(" ").slice(-2).map(w=>w[0]).join("").toUpperCase();
          const HTYPE={freelance:"Freelance",partner:"Cộng tác viên",fulltime:"Toàn thời gian"};
          const expiryInfo=expiringHdvs.find(x=>x.id===h.id);
          const isExpiring=!!expiryInfo;
          const avg=avgRating(h);
          return(
            <div key={h.id} style={{background:'#fff',borderRadius:14,padding:18,boxShadow:'0 1px 5px rgba(0,0,0,.08)',display:"flex",flexDirection:"column",gap:0,border:isExpiring?"2px solid #fca5a5":"2px solid transparent"}}>
              {/* Avatar + name row */}
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
                {h.photo
                  ?<img src={h.photo} alt="" style={{width:52,height:52,borderRadius:"50%",objectFit:"cover",border:h.available?"2px solid #86efac":"2px solid #fca5a5",flexShrink:0}}/>
                  :<div style={{width:52,height:52,borderRadius:"50%",background:h.available?"#dbeafe":"#fee2e2",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,fontWeight:800,color:h.available?"#1d4ed8":"#dc2626",flexShrink:0}}>{initials}</div>
                }
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:15,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:4}}>{h.name}</div>
                  <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                    <span onClick={()=>canEdit&&toggleAvailable(h)} style={{background:h.available?"#dcfce7":"#fee2e2",color:h.available?"#15803d":"#dc2626",borderRadius:20,padding:"2px 9px",fontSize:10,fontWeight:700,cursor:canEdit?"pointer":"default",whiteSpace:"nowrap"}}>{h.available?"● Rảnh":"● Bận"}</span>
                    {h.cardType&&<span style={{background:h.cardType==="international"?"#fef3c7":"#eff6ff",color:h.cardType==="international"?"#92400e":"#1d4ed8",borderRadius:20,padding:"2px 9px",fontSize:10,fontWeight:700}}>{h.cardType==="international"?"🌍 Quốc tế":"🏠 Quốc nội"}</span>}
                    {h.type&&<span style={{background:"#f5f3ff",color:"#6d28d9",borderRadius:20,padding:"2px 9px",fontSize:10,fontWeight:600}}>{HTYPE[h.type]||h.type}</span>}
                  </div>
                </div>
              </div>
              {/* Info */}
              <div style={{fontSize:12,color:'#4b5563',display:"flex",flexDirection:"column",gap:3,marginBottom:8}}>
                {h.phone&&<div>📞 {h.phone}</div>}
                {h.email&&<div>✉ {h.email}</div>}
                {h.cardNo&&<div>🪪 Thẻ HDV: <strong>{h.cardNo}</strong>{h.cardExpiry&&<span style={{marginLeft:6,color:isExpiring?"#dc2626":"#64748b",fontWeight:isExpiring?700:400}}>· HH: {new Date(h.cardExpiry).toLocaleDateString("vi-VN")}{isExpiring&&<span style={{marginLeft:4,background:"#fee2e2",color:"#b91c1c",borderRadius:4,padding:"0 5px"}}>{expiryInfo._daysLeft<=0?"ĐÃ HẾT HẠN":expiryInfo._daysLeft+"ngày"}</span>}</span>}</div>}
                {h.cccd&&<div>🆔 CCCD: {h.cccd}</div>}
                {h.dob&&<div>🎂 {new Date(h.dob).toLocaleDateString("vi-VN")}</div>}
                {h.speciality&&<div>🗺 {h.speciality}</div>}
                {h.dailyRate>0&&<div>💰 {Number(h.dailyRate).toLocaleString("vi-VN")}đ/ngày</div>}
                {avg!=null&&<div style={{color:"#92400e",fontWeight:600}}>⭐ {avg}/5 &nbsp;<span style={{letterSpacing:-1,color:"#fbbf24"}}>{starStr(avg)}</span>&nbsp;<span style={{color:"#94a3b8",fontWeight:400}}>({(h.ratings||[]).length} lần)</span></div>}
              </div>
              {/* Social */}
              {(h.facebook||h.zalo)&&(
                <div style={{display:"flex",gap:6,marginBottom:8,flexWrap:"wrap"}}>
                  {h.facebook&&<a href={h.facebook.startsWith('http')?h.facebook:'https://'+h.facebook} target="_blank" rel="noopener noreferrer" style={{fontSize:11,background:"#eff6ff",color:"#1d4ed8",borderRadius:6,padding:"3px 10px",textDecoration:"none",fontWeight:600}}>📘 Facebook</a>}
                  {h.zalo&&<span style={{fontSize:11,background:"#ecfdf5",color:"#065f46",borderRadius:6,padding:"3px 10px",fontWeight:600}}>💬 Zalo: {h.zalo}</span>}
                </div>
              )}
              {/* CCCD preview */}
              {h.cccdImg&&<img src={h.cccdImg} alt="CCCD" style={{width:"100%",maxHeight:80,objectFit:"cover",borderRadius:6,marginBottom:8,border:"1px solid #e2e8f0"}}/>}
              {/* Languages */}
              {(h.lang||[]).length>0&&(
                <div style={{display:"flex",gap:4,marginBottom:8,flexWrap:"wrap"}}>
                  {h.lang.map(l=><span key={l} style={{fontSize:10,background:"#eff6ff",color:"#1d4ed8",borderRadius:5,padding:"2px 7px",fontWeight:600}}>{LANG_LABEL[l]||l}</span>)}
                </div>
              )}
              {/* Assignments */}
              {assignments.length>0&&(
                <div style={{marginBottom:10,paddingTop:8,borderTop:"1px solid #f1f5f9"}}>
                  <div style={{fontSize:11,color:"#94a3b8",fontWeight:700,marginBottom:4,letterSpacing:.5}}>ĐANG PHỤ TRÁCH</div>
                  {assignments.map(o=>(
                    <div key={o.id} style={{fontSize:12,color:"#374151"}}>• {o.id} — {o.serviceName||o.tourName||o.service} ({o.departDate?new Date(o.departDate).toLocaleDateString("vi-VN"):"—"})</div>
                  ))}
                </div>
              )}
              {/* Actions */}
              {canEdit&&(
                <div style={{display:"flex",gap:6,marginTop:"auto",paddingTop:10,borderTop:"1px solid #f1f5f9"}}>
                  <button onClick={()=>openEdit(h)} style={{flex:1,background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:7,padding:'7px 0',cursor:'pointer',fontSize:12,fontWeight:600}}>✏ Sửa</button>
                  <button onClick={()=>openContract(h)} style={{flex:1,background:'#eff6ff',color:'#2563eb',border:'1px solid #bfdbfe',borderRadius:7,padding:'7px 0',cursor:'pointer',fontSize:12,fontWeight:700}}>📄 Tạo HĐ</button>
                  <button onClick={()=>{setAddRatingHdv(h);setRatingForm({score:5,note:'',tourName:''});}} style={{flex:1,background:'#fffbeb',color:'#92400e',border:'1px solid #fde68a',borderRadius:7,padding:'7px 0',cursor:'pointer',fontSize:12,fontWeight:700}}>⭐ Chấm</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TASK MODULE — Quản lý công việc nội bộ
// ═══════════════════════════════════════════════════════════
function TaskModule({ tasks=[], onUpdateTasks, orders=[], customers=[], currentUser, currentRole, userAccounts=[], pushNotif }) {
  const [view, setView] = React.useState("kanban"); // kanban | list | mine
  const [showForm, setShowForm] = React.useState(false);
  const [selectedTask, setSelectedTask] = React.useState(null);
  const [filterAssignee, setFilterAssignee] = React.useState("all");
  const [filterPriority, setFilterPriority] = React.useState("all");
  const [searchQ, setSearchQ] = React.useState("");

  const today = new Date().toISOString().slice(0, 10);
  const fmtDate = d => d ? new Date(d).toLocaleDateString("vi-VN", {day:"2-digit",month:"2-digit",year:"numeric"}) : "—";
  const daysLeft = d => d ? Math.ceil((new Date(d) - new Date()) / 86400000) : null;

  const PRIORITY = {
    urgent: { label:"Khẩn",       color:"#dc2626", bg:"#fee2e2", icon:"ti-flame" },
    normal: { label:"Bình thường", color:"#2563eb", bg:"#eff6ff", icon:"ti-point" },
    low:    { label:"Thấp",        color:"#64748b", bg:"#f1f5f9", icon:"ti-arrow-down" },
  };
  const STATUS = {
    new:            { label:"Mới",            color:"#64748b", bg:"#f8fafc",  border:"#e2e8f0" },
    in_progress:    { label:"Đang làm",       color:"#2563eb", bg:"#eff6ff",  border:"#bfdbfe" },
    pending_review: { label:"Chờ xác nhận",  color:"#d97706", bg:"#fffbeb",  border:"#fde68a" },
    done:           { label:"Hoàn thành",     color:"#059669", bg:"#ecfdf5",  border:"#6ee7b7" },
  };
  const COLUMNS = ["new","in_progress","pending_review","done"];

  // Tạo task mới
  const BLANK = { id:"", title:"", description:"", priority:"normal", status:"new",
    assignee:"", dueDate:"", orderId:"", customerId:"", tags:[], comments:[] };
  const [form, setForm] = React.useState({...BLANK});
  const setF = (k,v) => setForm(f=>({...f,[k]:v}));

  const saveTask = () => {
    if (!form.title.trim()) return;
    const isNew = !form.id;
    const t = { ...form,
      id: form.id || "T-" + Date.now(),
      createdBy: currentUser?.name,
      createdAt: form.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onUpdateTasks(prev => isNew ? [t, ...prev] : prev.map(x => x.id===t.id ? t : x));
    pushNotif?.(isNew ? `Đã tạo việc: ${t.title}` : `Đã cập nhật: ${t.title}`, "success");
    setShowForm(false);
    setSelectedTask(null);
    setForm({...BLANK});
  };

  const updateStatus = (taskId, newStatus) => {
    onUpdateTasks(prev => prev.map(t => t.id===taskId
      ? { ...t, status:newStatus, updatedAt:new Date().toISOString(),
          completedAt: newStatus==="done" ? new Date().toISOString() : t.completedAt }
      : t));
  };

  const addComment = (taskId, text) => {
    if (!text.trim()) return;
    onUpdateTasks(prev => prev.map(t => t.id===taskId
      ? { ...t, comments:[...(t.comments||[]), { id:Date.now(), by:currentUser?.name, text, ts:new Date().toISOString() }] }
      : t));
    setSelectedTask(prev => prev ? {...prev, comments:[...(prev.comments||[]), {id:Date.now(),by:currentUser?.name,text,ts:new Date().toISOString()}]} : prev);
  };

  const deleteTask = (taskId) => {
    if (!window.confirm("Xóa công việc này?")) return;
    onUpdateTasks(prev => prev.filter(t => t.id !== taskId));
    setSelectedTask(null);
  };

  // Lọc
  const filtered = tasks.filter(t => {
    if (view==="mine" && t.assignee !== currentUser?.name) return false;
    if (filterAssignee !== "all" && t.assignee !== filterAssignee) return false;
    if (filterPriority !== "all" && t.priority !== filterPriority) return false;
    if (searchQ.trim()) {
      const q = searchQ.toLowerCase();
      return t.title?.toLowerCase().includes(q) || t.assignee?.toLowerCase().includes(q) || t.orderId?.toLowerCase().includes(q);
    }
    return true;
  });

  // Stats
  const overdue   = tasks.filter(t => t.dueDate && t.dueDate < today && t.status !== "done");
  const dueToday  = tasks.filter(t => t.dueDate === today && t.status !== "done");
  const inProgress= tasks.filter(t => t.status === "in_progress");
  const doneThis  = tasks.filter(t => t.completedAt && t.completedAt.slice(0,7) === today.slice(0,7));

  const staffList = [...new Set([
    ...userAccounts.filter(u=>u.active!==false).map(u=>u.name),
    ...tasks.map(t=>t.assignee).filter(Boolean),
  ])].filter(Boolean);

  // Style helpers
  const card = { background:"#fff", borderRadius:14, boxShadow:"0 2px 12px rgba(0,0,0,.07)", overflow:"hidden" };

  // ── FORM TẠO/SỬA TASK ──────────────────────────────────
  const TaskForm = () => (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&(setShowForm(false),setForm({...BLANK}))}>
      <div style={{background:"#fff",borderRadius:20,width:580,maxWidth:"95vw",maxHeight:"90vh",overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 20px 60px rgba(0,0,0,.2)"}}>
        {/* Header */}
        <div style={{padding:"20px 24px",background:"linear-gradient(135deg,#1e40af,#3b82f6)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{fontSize:18,fontWeight:800}}>{form.id?"Sửa công việc":"Tạo công việc mới"}</div>
            <div style={{fontSize:13,color:"rgba(255,255,255,.7)",marginTop:2}}>Giao việc, đặt deadline, theo dõi tiến độ</div>
          </div>
          <button onClick={()=>{setShowForm(false);setForm({...BLANK});}} style={{background:"rgba(255,255,255,.2)",border:"none",borderRadius:10,width:36,height:36,color:"#fff",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
        </div>
        <div style={{padding:"20px 24px",overflowY:"auto",flex:1,display:"flex",flexDirection:"column",gap:16}}>
          {/* Tiêu đề */}
          <div>
            <label style={{fontSize:12,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:.5,display:"block",marginBottom:6}}>Tiêu đề công việc *</label>
            <input value={form.title} onChange={e=>setF("title",e.target.value)}
              placeholder="VD: Xác nhận khách sạn cho đoàn 4/7..." autoFocus
              style={{width:"100%",border:"2px solid #e2e8f0",borderRadius:10,padding:"12px 14px",fontSize:15,fontWeight:500,outline:"none",boxSizing:"border-box",transition:"border .15s"}}
              onFocus={e=>e.target.style.borderColor="#3b82f6"}
              onBlur={e=>e.target.style.borderColor="#e2e8f0"}/>
          </div>
          {/* Mô tả */}
          <div>
            <label style={{fontSize:12,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:.5,display:"block",marginBottom:6}}>Mô tả chi tiết</label>
            <textarea value={form.description} onChange={e=>setF("description",e.target.value)}
              placeholder="Thêm thông tin, yêu cầu cụ thể..." rows={3}
              style={{width:"100%",border:"2px solid #e2e8f0",borderRadius:10,padding:"12px 14px",fontSize:14,outline:"none",resize:"vertical",boxSizing:"border-box",fontFamily:"inherit"}}
              onFocus={e=>e.target.style.borderColor="#3b82f6"}
              onBlur={e=>e.target.style.borderColor="#e2e8f0"}/>
          </div>
          {/* Giao cho + Ưu tiên */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div>
              <label style={{fontSize:12,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:.5,display:"block",marginBottom:6}}>Giao cho</label>
              <select value={form.assignee} onChange={e=>setF("assignee",e.target.value)}
                style={{width:"100%",border:"2px solid #e2e8f0",borderRadius:10,padding:"11px 14px",fontSize:14,outline:"none",background:"#fff",boxSizing:"border-box"}}>
                <option value="">-- Chọn nhân viên --</option>
                {staffList.map(n=><option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label style={{fontSize:12,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:.5,display:"block",marginBottom:6}}>Mức độ ưu tiên</label>
              <div style={{display:"flex",gap:8}}>
                {Object.entries(PRIORITY).map(([k,p])=>(
                  <button key={k} onClick={()=>setF("priority",k)}
                    style={{flex:1,padding:"10px 8px",borderRadius:10,border:`2px solid ${form.priority===k?p.color:"#e2e8f0"}`,background:form.priority===k?p.bg:"#fff",color:form.priority===k?p.color:"#94a3b8",fontWeight:700,fontSize:12,cursor:"pointer",transition:"all .15s"}}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {/* Deadline + Trạng thái */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div>
              <label style={{fontSize:12,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:.5,display:"block",marginBottom:6}}>Deadline</label>
              <input type="date" value={form.dueDate} onChange={e=>setF("dueDate",e.target.value)}
                style={{width:"100%",border:"2px solid #e2e8f0",borderRadius:10,padding:"11px 14px",fontSize:14,outline:"none",boxSizing:"border-box"}}/>
            </div>
            <div>
              <label style={{fontSize:12,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:.5,display:"block",marginBottom:6}}>Trạng thái</label>
              <select value={form.status} onChange={e=>setF("status",e.target.value)}
                style={{width:"100%",border:"2px solid #e2e8f0",borderRadius:10,padding:"11px 14px",fontSize:14,outline:"none",background:"#fff",boxSizing:"border-box"}}>
                {Object.entries(STATUS).map(([k,s])=><option key={k} value={k}>{s.label}</option>)}
              </select>
            </div>
          </div>
          {/* Liên kết đơn hàng */}
          <div>
            <label style={{fontSize:12,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:.5,display:"block",marginBottom:6}}>Liên kết đơn hàng (tuỳ chọn)</label>
            <select value={form.orderId} onChange={e=>setF("orderId",e.target.value)}
              style={{width:"100%",border:"2px solid #e2e8f0",borderRadius:10,padding:"11px 14px",fontSize:14,outline:"none",background:"#fff",boxSizing:"border-box"}}>
              <option value="">-- Không liên kết --</option>
              {orders.slice(0,50).map(o=><option key={o.id} value={o.id}>{o.id} · {o.customerName} · {o.tourName||o.service}</option>)}
            </select>
          </div>
        </div>
        {/* Footer */}
        <div style={{padding:"16px 24px",borderTop:"1px solid #f1f5f9",display:"flex",gap:10,justifyContent:"flex-end",background:"#fafafa"}}>
          <button onClick={()=>{setShowForm(false);setForm({...BLANK});}}
            style={{padding:"11px 22px",border:"1.5px solid #e2e8f0",borderRadius:10,background:"#fff",fontSize:14,fontWeight:600,cursor:"pointer",color:"#64748b"}}>
            Hủy
          </button>
          <button onClick={saveTask} disabled={!form.title.trim()}
            style={{padding:"11px 28px",border:"none",borderRadius:10,background:form.title.trim()?"linear-gradient(135deg,#1e40af,#3b82f6)":"#e2e8f0",color:form.title.trim()?"#fff":"#94a3b8",fontSize:14,fontWeight:700,cursor:form.title.trim()?"pointer":"not-allowed",boxShadow:form.title.trim()?"0 4px 12px rgba(59,130,246,.4)":"none"}}>
            {form.id?"Lưu thay đổi":"Tạo công việc"}
          </button>
        </div>
      </div>
    </div>
  );

  // ── TASK DETAIL PANEL ────────────────────────────────────
  const [commentText, setCommentText] = React.useState("");
  const TaskDetail = ({t}) => {
    if (!t) return null;
    const dl = daysLeft(t.dueDate);
    const isOverdue = dl !== null && dl < 0 && t.status !== "done";
    const p = PRIORITY[t.priority] || PRIORITY.normal;
    const s = STATUS[t.status] || STATUS.new;
    const linkedOrder = orders.find(o=>o.id===t.orderId);
    return (
      <div style={{position:"fixed",inset:0,zIndex:500,display:"flex",justifyContent:"flex-end"}} onClick={e=>e.target===e.currentTarget&&setSelectedTask(null)}>
        <div style={{width:480,maxWidth:"95vw",height:"100vh",background:"#fff",boxShadow:"-8px 0 40px rgba(0,0,0,.15)",display:"flex",flexDirection:"column",animation:"slideInRight .25s ease"}}>
          <style>{`@keyframes slideInRight{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>
          {/* Header */}
          <div style={{padding:"20px 22px",borderBottom:"1px solid #f1f5f9",display:"flex",alignItems:"flex-start",gap:12}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",gap:8,marginBottom:8,flexWrap:"wrap"}}>
                <span style={{background:p.bg,color:p.color,borderRadius:99,fontSize:11,fontWeight:700,padding:"3px 10px",display:"inline-flex",alignItems:"center",gap:4}}>
                  <i className={`ti ${p.icon}`} style={{fontSize:12}}/>{p.label}
                </span>
                <span style={{background:s.bg,color:s.color,borderRadius:99,fontSize:11,fontWeight:700,padding:"3px 10px",border:`1px solid ${s.border}`}}>{s.label}</span>
                {isOverdue&&<span style={{background:"#fee2e2",color:"#dc2626",borderRadius:99,fontSize:11,fontWeight:700,padding:"3px 10px"}}>⚠ Trễ {Math.abs(dl)} ngày</span>}
              </div>
              <div style={{fontSize:17,fontWeight:800,color:"#0f172a",lineHeight:1.3}}>{t.title}</div>
              <div style={{fontSize:12,color:"#94a3b8",marginTop:6}}>Tạo bởi {t.createdBy||"—"} · {t.createdAt?new Date(t.createdAt).toLocaleDateString("vi-VN"):""}</div>
            </div>
            <button onClick={()=>setSelectedTask(null)} style={{background:"#f1f5f9",border:"none",borderRadius:10,width:36,height:36,fontSize:18,cursor:"pointer",color:"#64748b",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
          </div>
          {/* Body */}
          <div style={{flex:1,overflowY:"auto",padding:"18px 22px",display:"flex",flexDirection:"column",gap:16}}>
            {/* Info grid */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {[
                ["Giao cho",    t.assignee||"Chưa giao", "ti-user"],
                ["Deadline",   t.dueDate?`${fmtDate(t.dueDate)}${dl!==null?" ("+( dl===0?"Hôm nay":dl>0?`còn ${dl} ngày`:`trễ ${Math.abs(dl)} ngày`)+")":""}` : "Không có", "ti-calendar"],
              ].map(([k,v,ic])=>(
                <div key={k} style={{background:"#f8fafc",borderRadius:10,padding:"12px 14px"}}>
                  <div style={{fontSize:11,color:"#94a3b8",fontWeight:600,textTransform:"uppercase",marginBottom:4,display:"flex",alignItems:"center",gap:4}}><i className={`ti ${ic}`}/>{k}</div>
                  <div style={{fontSize:14,fontWeight:600,color:"#0f172a"}}>{v}</div>
                </div>
              ))}
            </div>
            {/* Mô tả */}
            {t.description&&(
              <div style={{background:"#f8fafc",borderRadius:10,padding:"14px 16px"}}>
                <div style={{fontSize:11,color:"#94a3b8",fontWeight:600,textTransform:"uppercase",marginBottom:8}}>Mô tả</div>
                <div style={{fontSize:14,color:"#374151",lineHeight:1.7,whiteSpace:"pre-wrap"}}>{t.description}</div>
              </div>
            )}
            {/* Đơn hàng liên kết */}
            {linkedOrder&&(
              <div style={{background:"#eff6ff",borderRadius:10,padding:"12px 16px",display:"flex",alignItems:"center",gap:10}}>
                <i className="ti ti-file-text" style={{fontSize:20,color:"#2563eb"}}/>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,color:"#2563eb",fontWeight:600}}>{linkedOrder.id}</div>
                  <div style={{fontSize:13,color:"#374151"}}>{linkedOrder.customerName} · {linkedOrder.tourName||linkedOrder.service}</div>
                </div>
              </div>
            )}
            {/* Đổi trạng thái */}
            <div>
              <div style={{fontSize:12,fontWeight:700,color:"#64748b",textTransform:"uppercase",marginBottom:8}}>Cập nhật trạng thái</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {Object.entries(STATUS).map(([k,s])=>(
                  <button key={k} onClick={()=>{updateStatus(t.id,k);setSelectedTask(prev=>({...prev,status:k}));}}
                    style={{padding:"8px 14px",borderRadius:99,border:`1.5px solid ${t.status===k?s.color:"#e2e8f0"}`,background:t.status===k?s.bg:"#fff",color:t.status===k?s.color:"#94a3b8",fontWeight:700,fontSize:12,cursor:"pointer"}}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            {/* Comments */}
            <div>
              <div style={{fontSize:12,fontWeight:700,color:"#64748b",textTransform:"uppercase",marginBottom:10}}>Cập nhật tiến độ ({(t.comments||[]).length})</div>
              <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:12}}>
                {(t.comments||[]).map(c=>(
                  <div key={c.id} style={{background:"#f8fafc",borderRadius:10,padding:"10px 14px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                      <span style={{fontSize:12,fontWeight:700,color:"#1e40af"}}>{c.by}</span>
                      <span style={{fontSize:11,color:"#94a3b8"}}>{new Date(c.ts).toLocaleString("vi-VN",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})}</span>
                    </div>
                    <div style={{fontSize:13,color:"#374151",lineHeight:1.6}}>{c.text}</div>
                  </div>
                ))}
                {(t.comments||[]).length===0&&<div style={{textAlign:"center",color:"#94a3b8",padding:"16px 0",fontSize:13}}>Chưa có cập nhật nào</div>}
              </div>
              <div style={{display:"flex",gap:8}}>
                <input value={commentText} onChange={e=>setCommentText(e.target.value)}
                  onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();addComment(t.id,commentText);setCommentText("");}}}
                  placeholder="Nhập cập nhật, Enter để gửi..."
                  style={{flex:1,border:"1.5px solid #e2e8f0",borderRadius:10,padding:"10px 14px",fontSize:13,outline:"none",fontFamily:"inherit"}}
                  onFocus={e=>e.target.style.borderColor="#3b82f6"}
                  onBlur={e=>e.target.style.borderColor="#e2e8f0"}/>
                <button onClick={()=>{addComment(t.id,commentText);setCommentText("");}} disabled={!commentText.trim()}
                  style={{padding:"10px 16px",background:commentText.trim()?"#2563eb":"#e2e8f0",color:commentText.trim()?"#fff":"#94a3b8",border:"none",borderRadius:10,fontWeight:700,fontSize:13,cursor:commentText.trim()?"pointer":"not-allowed"}}>
                  Gửi
                </button>
              </div>
            </div>
          </div>
          {/* Footer actions */}
          <div style={{padding:"14px 22px",borderTop:"1px solid #f1f5f9",display:"flex",gap:8,background:"#fafafa"}}>
            <button onClick={()=>{setForm({...t});setShowForm(true);setSelectedTask(null);}}
              style={{flex:1,padding:"11px",background:"#eff6ff",color:"#2563eb",border:"none",borderRadius:10,fontWeight:700,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
              <i className="ti ti-edit" style={{fontSize:16}}/>Sửa
            </button>
            <button onClick={()=>deleteTask(t.id)}
              style={{padding:"11px 18px",background:"#fee2e2",color:"#dc2626",border:"none",borderRadius:10,fontWeight:700,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
              <i className="ti ti-trash" style={{fontSize:16}}/>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ── TASK CARD (dùng trong Kanban & List) ─────────────────
  const TaskCard = ({t, compact=false}) => {
    const p  = PRIORITY[t.priority] || PRIORITY.normal;
    const s  = STATUS[t.status]     || STATUS.new;
    const dl = daysLeft(t.dueDate);
    const isOverdue = dl!==null && dl<0 && t.status!=="done";
    const isDueToday = t.dueDate===today && t.status!=="done";
    const avatar = (t.assignee||"?")[0].toUpperCase();
    const avatarColor = { "Nguyễn Thị Hoa":"#059669","Trần Văn Nam":"#2563eb","Lê Thị Mai":"#7c3aed","Phạm Quốc Hùng":"#d97706" }[t.assignee]||"#64748b";

    return (
      <div onClick={()=>setSelectedTask(t)}
        style={{background:"#fff",borderRadius:12,padding:"14px 16px",cursor:"pointer",borderLeft:`3px solid ${p.color}`,boxShadow:"0 2px 8px rgba(0,0,0,.07)",transition:"all .15s",marginBottom:8}}
        onMouseEnter={e=>e.currentTarget.style.boxShadow="0 6px 20px rgba(0,0,0,.12)"}
        onMouseLeave={e=>e.currentTarget.style.boxShadow="0 2px 8px rgba(0,0,0,.07)"}>
        {/* Title */}
        <div style={{fontSize:14,fontWeight:700,color:"#0f172a",marginBottom:8,lineHeight:1.4}}>{t.title}</div>
        {/* Tags row */}
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
          <span style={{background:p.bg,color:p.color,borderRadius:99,fontSize:11,fontWeight:700,padding:"2px 8px"}}>{p.label}</span>
          {t.orderId&&<span style={{background:"#eff6ff",color:"#2563eb",borderRadius:99,fontSize:11,fontWeight:600,padding:"2px 8px",display:"flex",alignItems:"center",gap:3}}><i className="ti ti-file-text" style={{fontSize:11}}/>{t.orderId}</span>}
          {isOverdue&&<span style={{background:"#fee2e2",color:"#dc2626",borderRadius:99,fontSize:11,fontWeight:700,padding:"2px 8px"}}>Trễ {Math.abs(dl)}n</span>}
          {isDueToday&&!isOverdue&&<span style={{background:"#fef3c7",color:"#d97706",borderRadius:99,fontSize:11,fontWeight:700,padding:"2px 8px"}}>Hôm nay</span>}
        </div>
        {/* Footer */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <div style={{width:26,height:26,borderRadius:"50%",background:avatarColor,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:"#fff"}}>{avatar}</div>
            <span style={{fontSize:12,color:"#64748b",fontWeight:500}}>{t.assignee||"Chưa giao"}</span>
          </div>
          {t.dueDate&&(
            <div style={{display:"flex",alignItems:"center",gap:4,fontSize:12,color:isOverdue?"#dc2626":isDueToday?"#d97706":"#94a3b8",fontWeight:isOverdue||isDueToday?700:400}}>
              <i className="ti ti-calendar" style={{fontSize:13}}/>
              {fmtDate(t.dueDate)}
            </div>
          )}
        </div>
        {t.comments?.length>0&&(
          <div style={{display:"flex",alignItems:"center",gap:4,marginTop:8,fontSize:11,color:"#94a3b8"}}>
            <i className="ti ti-message-circle" style={{fontSize:13}}/>{t.comments.length} cập nhật
          </div>
        )}
      </div>
    );
  };

  // ── KANBAN VIEW ──────────────────────────────────────────
  const KanbanView = () => (
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,alignItems:"start"}}>
      {COLUMNS.map(col=>{
        const s = STATUS[col];
        const colTasks = filtered.filter(t=>t.status===col);
        return(
          <div key={col} style={{background:"#f8fafc",borderRadius:14,padding:"14px",minHeight:200}}>
            {/* Column header */}
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
              <div style={{width:10,height:10,borderRadius:"50%",background:s.color,flexShrink:0}}/>
              <span style={{fontWeight:700,fontSize:14,color:"#0f172a",flex:1}}>{s.label}</span>
              <span style={{background:s.bg,color:s.color,borderRadius:99,fontSize:12,fontWeight:700,padding:"2px 9px",border:`1px solid ${s.border}`}}>{colTasks.length}</span>
            </div>
            {/* Cards */}
            {colTasks.map(t=><TaskCard key={t.id} t={t}/>)}
            {colTasks.length===0&&(
              <div style={{textAlign:"center",color:"#cbd5e1",padding:"24px 0",fontSize:13}}>
                <i className="ti ti-inbox" style={{fontSize:28,display:"block",marginBottom:6}}/>
                Không có
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  // ── LIST VIEW ───────────────────────────────────────────
  const ListView = () => (
    <div style={{background:"#fff",borderRadius:14,overflow:"hidden",boxShadow:"0 2px 12px rgba(0,0,0,.07)"}}>
      <table style={{width:"100%",borderCollapse:"collapse"}}>
        <thead>
          <tr style={{background:"#f8fafc"}}>
            {["Công việc","Giao cho","Ưu tiên","Trạng thái","Deadline","Đơn hàng"].map(h=>(
              <th key={h} style={{padding:"12px 16px",textAlign:"left",fontSize:12,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:.5,borderBottom:"1px solid #f1f5f9"}}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map((t,idx)=>{
            const p=PRIORITY[t.priority]||PRIORITY.normal;
            const s=STATUS[t.status]||STATUS.new;
            const dl=daysLeft(t.dueDate);
            const isOverdue=dl!==null&&dl<0&&t.status!=="done";
            return(
              <tr key={t.id} onClick={()=>setSelectedTask(t)}
                style={{borderBottom:"1px solid #f8fafc",cursor:"pointer",background:idx%2===0?"#fff":"#fafafa"}}
                onMouseEnter={e=>e.currentTarget.style.background="#eff6ff"}
                onMouseLeave={e=>e.currentTarget.style.background=idx%2===0?"#fff":"#fafafa"}>
                <td style={{padding:"12px 16px"}}>
                  <div style={{fontWeight:600,fontSize:14,color:"#0f172a"}}>{t.title}</div>
                  {t.comments?.length>0&&<div style={{fontSize:11,color:"#94a3b8",marginTop:2}}><i className="ti ti-message-circle" style={{fontSize:11}}/> {t.comments.length}</div>}
                </td>
                <td style={{padding:"12px 16px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <div style={{width:28,height:28,borderRadius:"50%",background:"#2563eb",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:"#fff"}}>{(t.assignee||"?")[0]}</div>
                    <span style={{fontSize:13,color:"#374151"}}>{t.assignee||"Chưa giao"}</span>
                  </div>
                </td>
                <td style={{padding:"12px 16px"}}><span style={{background:p.bg,color:p.color,borderRadius:99,fontSize:12,fontWeight:700,padding:"3px 10px"}}>{p.label}</span></td>
                <td style={{padding:"12px 16px"}}><span style={{background:s.bg,color:s.color,borderRadius:99,fontSize:12,fontWeight:700,padding:"3px 10px",border:`1px solid ${s.border}`}}>{s.label}</span></td>
                <td style={{padding:"12px 16px",fontSize:13,color:isOverdue?"#dc2626":"#374151",fontWeight:isOverdue?700:400}}>
                  {t.dueDate?fmtDate(t.dueDate):"—"}
                  {isOverdue&&<span style={{fontSize:11,marginLeft:6,color:"#dc2626"}}>({Math.abs(dl)}n trễ)</span>}
                </td>
                <td style={{padding:"12px 16px"}}>
                  {t.orderId?<span style={{background:"#eff6ff",color:"#2563eb",borderRadius:8,fontSize:12,padding:"3px 8px",fontWeight:600}}>{t.orderId}</span>:"—"}
                </td>
              </tr>
            );
          })}
          {filtered.length===0&&(
            <tr><td colSpan={6} style={{textAlign:"center",padding:"48px",color:"#94a3b8",fontSize:14}}>
              <i className="ti ti-clipboard-off" style={{fontSize:36,display:"block",marginBottom:8}}/>
              Không có công việc nào
            </td></tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div style={{padding:24,background:"#f1f5f9",minHeight:"100vh"}}>

      {/* HEADER */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
        <div>
          <h2 style={{margin:0,fontSize:22,fontWeight:800,color:"#0f172a",display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:40,height:40,borderRadius:12,background:"linear-gradient(135deg,#1e40af,#3b82f6)",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <i className="ti ti-checklist" style={{fontSize:22,color:"#fff"}}/>
            </div>
            Quản lý công việc
          </h2>
          <div style={{fontSize:14,color:"#64748b",marginTop:4,marginLeft:50}}>{tasks.length} công việc · {inProgress.length} đang thực hiện</div>
        </div>
        <button onClick={()=>{setForm({...BLANK});setShowForm(true);}}
          style={{background:"linear-gradient(135deg,#1e40af,#3b82f6)",color:"#fff",border:"none",borderRadius:12,padding:"12px 22px",fontWeight:700,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",gap:8,boxShadow:"0 4px 14px rgba(59,130,246,.4)"}}>
          <i className="ti ti-plus" style={{fontSize:18}}/>
          Tạo công việc
        </button>
      </div>

      {/* KPI CARDS */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:20}}>
        {[
          {label:"Tổng công việc",  val:tasks.length,      icon:"ti-list",        bg:"linear-gradient(135deg,#1e40af,#3b82f6)",    sub:`${doneThis.length} hoàn thành tháng này`},
          {label:"Đang thực hiện",  val:inProgress.length, icon:"ti-loader",      bg:"linear-gradient(135deg,#7c3aed,#a78bfa)",    sub:`${filtered.filter(t=>t.status==="new").length} chờ bắt đầu`},
          {label:"Đến hạn hôm nay", val:dueToday.length,   icon:"ti-clock",       bg:"linear-gradient(135deg,#d97706,#fbbf24)",    sub:"Cần xử lý ngay"},
          {label:"Trễ deadline",    val:overdue.length,    icon:"ti-alert-circle", bg:`linear-gradient(135deg,${overdue.length>0?"#dc2626,#ef4444":"#059669,#34d399"})`, sub:overdue.length>0?"Cần ưu tiên":"Không có"},
        ].map(k=>(
          <div key={k.label} style={{background:k.bg,borderRadius:14,padding:"18px 20px",boxShadow:"0 4px 14px rgba(0,0,0,.12)",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",right:14,top:14,opacity:.2,fontSize:36}}><i className={`ti ${k.icon}`}/></div>
            <div style={{fontSize:12,color:"rgba(255,255,255,.75)",fontWeight:600,marginBottom:6,textTransform:"uppercase",letterSpacing:.5}}>{k.label}</div>
            <div style={{fontSize:30,fontWeight:800,color:"#fff",lineHeight:1,marginBottom:4}}>{k.val}</div>
            <div style={{fontSize:12,color:"rgba(255,255,255,.65)"}}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* TOOLBAR */}
      <div style={{display:"flex",gap:10,marginBottom:16,alignItems:"center",flexWrap:"wrap"}}>
        {/* View tabs */}
        <div style={{display:"flex",gap:2,background:"#fff",borderRadius:12,padding:4,boxShadow:"0 1px 6px rgba(0,0,0,.07)"}}>
          {[{k:"kanban",icon:"ti-layout-kanban",label:"Kanban"},{k:"list",icon:"ti-list",label:"Danh sách"},{k:"mine",icon:"ti-user",label:"Của tôi"}].map(v=>(
            <button key={v.k} onClick={()=>setView(v.k)}
              style={{padding:"8px 16px",border:"none",borderRadius:9,background:view===v.k?"linear-gradient(135deg,#1e40af,#3b82f6)":"transparent",color:view===v.k?"#fff":"#64748b",fontWeight:700,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",gap:6,transition:"all .15s"}}>
              <i className={`ti ${v.icon}`} style={{fontSize:16}}/>{v.label}
            </button>
          ))}
        </div>
        {/* Search */}
        <div style={{position:"relative",flex:1,minWidth:200}}>
          <i className="ti ti-search" style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"#94a3b8",fontSize:16}}/>
          <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Tìm công việc, nhân viên..."
            style={{width:"100%",border:"1.5px solid #e2e8f0",borderRadius:10,padding:"10px 12px 10px 38px",fontSize:14,outline:"none",background:"#fff",boxSizing:"border-box"}}/>
        </div>
        {/* Filters */}
        <select value={filterAssignee} onChange={e=>setFilterAssignee(e.target.value)}
          style={{border:"1.5px solid #e2e8f0",borderRadius:10,padding:"10px 14px",fontSize:14,background:"#fff",outline:"none",minWidth:160}}>
          <option value="all">Tất cả nhân viên</option>
          {staffList.map(n=><option key={n} value={n}>{n}</option>)}
        </select>
        <select value={filterPriority} onChange={e=>setFilterPriority(e.target.value)}
          style={{border:"1.5px solid #e2e8f0",borderRadius:10,padding:"10px 14px",fontSize:14,background:"#fff",outline:"none"}}>
          <option value="all">Mọi ưu tiên</option>
          {Object.entries(PRIORITY).map(([k,p])=><option key={k} value={k}>{p.label}</option>)}
        </select>
      </div>

      {/* MAIN VIEW */}
      {(view==="kanban") && KanbanView()}
      {(view==="list" || view==="mine") && ListView()}

      {/* MODALS — gọi function trực tiếp, không dùng JSX component để tránh unmount */}
      {showForm && TaskForm({})}
      {selectedTask && TaskDetail({t:selectedTask})}

    </div>
  );
}

function AfterSaleModule({ careTasks=[], onUpdateTasks, orders=[], customers=[], currentUser, currentRole, pushNotif }) {
  const [showForm, setShowForm] = React.useState(false);
  const [filterType, setFilterType] = React.useState("all");
  const [form, setForm] = React.useState({ orderId:'', customerName:'', type:'call', note:'', dueDate:'' });

  const myTasks = currentRole==='manager' ? careTasks : careTasks.filter(t=>t.assignee===currentUser?.name);
  const TYPE_LABEL={call:"Gọi điện",review:"Xin review",birthday:"Sinh nhật",pre_trip:"Nhắc trước tour",upsell:"Chốt tour mới",other:"Khác"};
  const TYPE_ICON={call:"📞",review:"⭐",birthday:"🎂",pre_trip:"🧳",upsell:"🎯",other:"📌"};

  const fmtDate=(d)=>d?new Date(d).toLocaleDateString("vi-VN"):"—";
  const daysBetween=(a,b)=>Math.round((new Date(b)-new Date(a))/86400000);

  // ── Gợi ý tự động ────────────────────────────────────────
  const suggestions = React.useMemo(()=>{
    const now=new Date();
    const list=[];
    const existsTask=(orderId,type)=>careTasks.some(t=>t.orderId===orderId&&t.type===type);

    // 1) Sinh nhật khách trong 14 ngày tới
    customers.forEach(c=>{
      (c.events||[]).filter(e=>e.type==="birthday").forEach(e=>{
        const bday=new Date(e.date);
        const thisYear=new Date(now.getFullYear(),bday.getMonth(),bday.getDate());
        let diff=daysBetween(now,thisYear);
        if(diff<0) diff=daysBetween(now,new Date(now.getFullYear()+1,bday.getMonth(),bday.getDate()));
        if(diff>=0&&diff<=14&&!existsTask(c.id,"birthday")){
          list.push({key:"bday-"+c.id,type:"birthday",orderId:c.id,customerName:c.name,reason:"Sinh nhật trong "+diff+" ngày nữa",dueDate:thisYear.toISOString().slice(0,10),note:"Chúc mừng sinh nhật + ưu đãi nhỏ"});
        }
      });
    });

    // 2) Đơn đã đóng trong 7 ngày qua → xin review
    orders.filter(o=>o.status==="closed").forEach(o=>{
      const closedAt=o.closedAt||o.departDate;
      if(!closedAt) return;
      const diff=daysBetween(closedAt,now);
      if(diff>=1&&diff<=7&&!existsTask(o.id,"review")){
        list.push({key:"review-"+o.id,type:"review",orderId:o.id,customerName:o.customerName,reason:"Tour kết thúc "+diff+" ngày trước",dueDate:now.toISOString().slice(0,10),note:"Xin đánh giá 5⭐ trên Google/Facebook"});
      }
    });

    // 3) Đơn khởi hành trong 3 ngày tới → gọi xác nhận
    orders.filter(o=>["confirmed"].includes(o.status)).forEach(o=>{
      if(!o.departDate) return;
      const diff=daysBetween(now,o.departDate);
      if(diff>=0&&diff<=3&&!existsTask(o.id,"pre_trip")){
        list.push({key:"pretrip-"+o.id,type:"pre_trip",orderId:o.id,customerName:o.customerName,reason:"Khởi hành trong "+diff+" ngày",dueDate:now.toISOString().slice(0,10),note:"Gọi xác nhận giờ đón, số khách, yêu cầu đặc biệt"});
      }
    });

    // 4) Đơn đã đóng 30-120 ngày trước → upsell tour tiếp theo
    orders.filter(o=>o.status==="closed").forEach(o=>{
      const closedAt=o.closedAt||o.departDate;
      if(!closedAt) return;
      const diff=daysBetween(closedAt,now);
      if(diff>=30&&diff<=120&&!existsTask(o.id,"upsell")){
        const nextDue=new Date(now); nextDue.setDate(nextDue.getDate()+3);
        list.push({key:"upsell-"+o.id,type:"upsell",orderId:o.id,customerName:o.customerName,reason:"Tour kết thúc "+diff+" ngày trước — khách sẵn sàng đặt lại",dueDate:nextDue.toISOString().slice(0,10),note:"Tư vấn tour phù hợp, ưu đãi khách quen"});
      }
    });

    return list;
  },[customers,orders,careTasks]);

  const acceptSuggestion = (s) => {
    onUpdateTasks([...careTasks, {id:'CARE'+Date.now(), orderId:s.orderId, type:s.type, note:s.note, dueDate:s.dueDate, done:false, assignee:currentUser?.name, createdAt:new Date().toISOString(), fromSuggestion:true}]);
    pushNotif&&pushNotif("Đã tạo task: "+TYPE_LABEL[s.type]+" — "+(s.customerName||s.orderId));
  };

  const save = () => {
    if (!form.orderId) return pushNotif('Chọn đơn hàng','error');
    onUpdateTasks([...careTasks, {...form, id:'CARE'+Date.now(), done:false, assignee:currentUser?.name, createdAt:new Date().toISOString()}]);
    pushNotif('Đã tạo task chăm sóc');
    setShowForm(false);
    setForm({orderId:'',customerName:'',type:'call',note:'',dueDate:''});
  };
  const toggle = (id) => onUpdateTasks(careTasks.map(t=>t.id===id?{...t,done:!t.done}:t));

  const filteredTasks = filterType==="all"?myTasks:myTasks.filter(t=>t.type===filterType);
  const sorted = [...filteredTasks].sort((a,b)=>{
    if(a.done!==b.done) return a.done?1:-1;
    return new Date(a.dueDate||0)-new Date(b.dueDate||0);
  });

  const isOverdue=(t)=>!t.done&&t.dueDate&&new Date(t.dueDate)<new Date(new Date().toDateString());

  return (
    <div style={{padding:24}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20,flexWrap:"wrap",gap:12}}>
        <h2 style={{margin:0,fontSize:20,fontWeight:800}}>Chăm sóc sau bán ({myTasks.filter(t=>!t.done).length} chưa xong)</h2>
        <button onClick={()=>setShowForm(true)} style={{background:'#2563eb',color:'#fff',border:'none',borderRadius:9,padding:'9px 18px',cursor:'pointer',fontWeight:700,fontSize:13}}>+ Tạo task</button>
      </div>

      {suggestions.length>0&&(
        <div style={{background:"#fff",borderRadius:14,padding:18,marginBottom:20,boxShadow:"0 1px 6px rgba(0,0,0,.07)",border:"1px solid #fde68a"}}>
          <div style={{fontWeight:700,marginBottom:10,color:"#92400e",fontSize:14}}>💡 Gợi ý tự động ({suggestions.length})</div>
          <div style={{display:"grid",gap:8}}>
            {suggestions.map(s=>(
              <div key={s.key} style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:"#fffbeb",borderRadius:10,padding:"10px 14px"}}>
                <div>
                  <div style={{fontWeight:600,fontSize:13}}>{TYPE_ICON[s.type]} {TYPE_LABEL[s.type]} — {s.customerName||s.orderId}</div>
                  <div style={{fontSize:12,color:"#92400e",marginTop:2}}>{s.reason}</div>
                </div>
                <button onClick={()=>acceptSuggestion(s)} style={{background:"#d97706",color:"#fff",border:"none",borderRadius:8,padding:"6px 14px",cursor:"pointer",fontSize:12,fontWeight:700,whiteSpace:"nowrap"}}>+ Tạo task</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <div style={{background:'#fff',borderRadius:14,padding:20,marginBottom:16,boxShadow:'0 1px 6px rgba(0,0,0,.07)'}}>
          <h3 style={{marginTop:0,marginBottom:16}}>Task chăm sóc mới</h3>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div>
              <label style={{display:'block',marginBottom:4,fontSize:12,fontWeight:600,color:"#374151"}}>Đơn hàng</label>
              <select value={form.orderId} onChange={e=>{const o=orders.find(x=>x.id===e.target.value);setForm(f=>({...f,orderId:e.target.value,customerName:o?.customerName||""}));}} style={{width:'100%',border:'1px solid #e2e8f0',borderRadius:8,padding:'9px 12px',fontSize:13}}>
                <option value=''>-- Chọn đơn --</option>
                {orders.map(o=><option key={o.id} value={o.id}>{o.id} - {o.customerName||(typeof o.customer==="object"?o.customer?.name:o.customer)||"—"}</option>)}
              </select>
            </div>
            <div>
              <label style={{display:'block',marginBottom:4,fontSize:12,fontWeight:600,color:"#374151"}}>Loại</label>
              <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))} style={{width:'100%',border:'1px solid #e2e8f0',borderRadius:8,padding:'9px 12px',fontSize:13}}>
                {Object.entries(TYPE_LABEL).map(([k,v])=><option key={k} value={k}>{TYPE_ICON[k]} {v}</option>)}
              </select>
            </div>
            <div>
              <label style={{display:'block',marginBottom:4,fontSize:12,fontWeight:600,color:"#374151"}}>Ngày hẹn</label>
              <input type='date' value={form.dueDate} onChange={e=>setForm(f=>({...f,dueDate:e.target.value}))} style={{width:"100%",border:'1px solid #e2e8f0',borderRadius:8,padding:'9px 12px',fontSize:13,boxSizing:"border-box"}}/>
            </div>
          </div>
          <div style={{marginTop:12}}>
            <label style={{display:'block',marginBottom:4,fontSize:12,fontWeight:600,color:"#374151"}}>Ghi chú</label>
            <textarea value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))} rows={2} style={{width:'100%',border:'1px solid #e2e8f0',borderRadius:8,padding:'9px 12px',fontSize:13,boxSizing:'border-box',resize:"vertical"}}/>
          </div>
          <div style={{display:'flex',gap:8,marginTop:14}}>
            <button onClick={save} style={{background:'#16a34a',color:'#fff',border:'none',borderRadius:8,padding:'9px 20px',cursor:'pointer',fontWeight:700}}>Lưu</button>
            <button onClick={()=>setShowForm(false)} style={{background:'#6b7280',color:'#fff',border:'none',borderRadius:8,padding:'9px 20px',cursor:'pointer',fontWeight:600}}>Hủy</button>
          </div>
        </div>
      )}

      <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
        <button onClick={()=>setFilterType("all")} style={{padding:"6px 14px",borderRadius:20,border:"none",cursor:"pointer",fontSize:12,fontWeight:600,background:filterType==="all"?"#1e293b":"#f1f5f9",color:filterType==="all"?"#fff":"#64748b"}}>Tất cả</button>
        {Object.entries(TYPE_LABEL).map(([k,v])=>(
          <button key={k} onClick={()=>setFilterType(k)} style={{padding:"6px 14px",borderRadius:20,border:"none",cursor:"pointer",fontSize:12,fontWeight:600,background:filterType===k?"#1e293b":"#f1f5f9",color:filterType===k?"#fff":"#64748b"}}>{TYPE_ICON[k]} {v}</button>
        ))}
      </div>

      <div style={{display:'grid',gap:8}}>
        {sorted.length===0 && <div style={{textAlign:'center',color:'#9ca3af',padding:40}}>Không có task nào</div>}
        {sorted.map(t=>(
          <div key={t.id} style={{background:t.done?"#f8fafc":'#fff',borderRadius:12,padding:16,boxShadow:'0 1px 4px rgba(0,0,0,.07)',display:'flex',gap:12,alignItems:'flex-start',border:isOverdue(t)?"1px solid #fecaca":"1px solid transparent"}}>
            <input type='checkbox' checked={!!t.done} onChange={()=>toggle(t.id)} style={{marginTop:3,width:16,height:16,cursor:'pointer'}}/>
            <div style={{flex:1}}>
              <div style={{fontWeight:600,textDecoration:t.done?"line-through":"none",color:t.done?"#94a3b8":"#1e293b"}}>{TYPE_ICON[t.type]} {t.orderId} — {TYPE_LABEL[t.type]||t.type}</div>
              {t.note && <div style={{fontSize:13,color:'#64748b',marginTop:2}}>{t.note}</div>}
              <div style={{fontSize:12,marginTop:4,color:isOverdue(t)?"#dc2626":"#94a3b8",fontWeight:isOverdue(t)?700:400}}>
                {isOverdue(t)&&"⚠️ Quá hạn · "}Hẹn: {fmtDate(t.dueDate)} · {t.assignee}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TourOpsModule({ orders=[], pushNotif, currentUser, currentRole, hdvList=[], onUpdateOrder }) {
  const [selected,setSelected]=React.useState(null);
  const [assignHdv,setAssignHdv]=React.useState("");

  const activeOrders = orders.filter(o=>['confirmed','in_progress'].includes(o.status));
  const fmtDate=(d)=>d?new Date(d).toLocaleDateString("vi-VN"):"—";
  const daysTo=(d)=>d?Math.ceil((new Date(d)-new Date())/86400000):null;

  const MILESTONES=["assigned","departed","returned","settled"];
  const MILESTONE_LABEL={assigned:"Đã giao HDV",departed:"Đã khởi hành",returned:"Đã về điểm cuối",settled:"Đã quyết toán"};
  const MILESTONE_ICON={assigned:"🧑‍🦯",departed:"🚌",returned:"🏁",settled:"✅"};

  const getStage=(o)=>{
    const m=o.opsMilestones||{};
    if(m.settled) return 4;
    if(m.returned) return 3;
    if(m.departed) return 2;
    if(m.assigned||o.hdvName) return 1;
    return 0;
  };

  const toggleMilestone=(o,key)=>{
    const m={...(o.opsMilestones||{})};
    m[key]=!m[key];
    onUpdateOrder&&onUpdateOrder({...o,opsMilestones:m});
    pushNotif&&pushNotif(m[key]?"Đã đánh dấu: "+MILESTONE_LABEL[key]:"Đã bỏ đánh dấu: "+MILESTONE_LABEL[key]);
  };

  const doAssignHdv=(o)=>{
    if(!assignHdv) return pushNotif&&pushNotif("Chọn HDV","error");
    const hdv=hdvList.find(h=>h.id===assignHdv);
    const m={...(o.opsMilestones||{}),assigned:true};
    onUpdateOrder&&onUpdateOrder({...o,hdvName:hdv?.name,hdvId:hdv?.id,opsMilestones:m});
    pushNotif&&pushNotif("Đã giao "+(hdv?.name||"")+" cho đơn "+o.id);
    setAssignHdv("");
    if(selected?.id===o.id) setSelected({...o,hdvName:hdv?.name,hdvId:hdv?.id,opsMilestones:m});
  };

  const urgentSoon=activeOrders.filter(o=>{
    const d=daysTo(o.departDate);
    return d!==null&&d>=0&&d<=2&&getStage(o)<1;
  });

  if(selected){
    const stage=getStage(selected);
    return(
      <div style={{padding:24,maxWidth:680,margin:"0 auto"}}>
        <button onClick={()=>setSelected(null)} style={{background:"none",border:"none",color:"#2563eb",cursor:"pointer",fontSize:14,marginBottom:16}}>← Danh sách tour</button>
        <div style={{background:"#fff",borderRadius:16,padding:24,boxShadow:"0 1px 6px rgba(0,0,0,.07)",marginBottom:16}}>
          <div style={{fontSize:19,fontWeight:800}}>{selected.id} — {selected.tourName||selected.service}</div>
          <div style={{fontSize:13,color:"#64748b",marginTop:4}}>{selected.customerName||(typeof selected.customer==="object"?selected.customer?.name:selected.customer)||""} · {typeof selected.pax==="object"?(selected.pax.adults||0)+(selected.pax.children||0)+(selected.pax.babies||0):selected.pax||1} khách</div>
          <div style={{fontSize:13,color:"#64748b",marginTop:2}}>📅 Khởi hành: {fmtDate(selected.departDate)} {selected.returnDate?"→ "+fmtDate(selected.returnDate):""}</div>

          <div style={{marginTop:18}}>
            <div style={{fontWeight:700,fontSize:13,marginBottom:10,color:"#374151"}}>Hướng dẫn viên</div>
            {selected.hdvName?(
              <div style={{background:"#dcfce7",borderRadius:8,padding:"8px 12px",fontSize:13,color:"#15803d",fontWeight:600}}>🧑‍🦯 {selected.hdvName}</div>
            ):(
              <div style={{display:"flex",gap:8}}>
                <select value={assignHdv} onChange={e=>setAssignHdv(e.target.value)} style={{flex:1,border:"1px solid #e2e8f0",borderRadius:8,padding:"9px 12px",fontSize:13}}>
                  <option value="">-- Chọn HDV --</option>
                  {hdvList.map(h=><option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
                <button onClick={()=>doAssignHdv(selected)} style={{background:"#2563eb",color:"#fff",border:"none",borderRadius:8,padding:"9px 16px",cursor:"pointer",fontWeight:700,fontSize:13}}>Giao</button>
              </div>
            )}
          </div>
        </div>

        {/* ── TÀI LIỆU IN ── */}
        <div style={{background:"#fff",borderRadius:16,padding:20,boxShadow:"0 1px 6px rgba(0,0,0,.07)",marginBottom:16}}>
          <div style={{fontWeight:700,marginBottom:12,fontSize:14,color:"#374151"}}>🖨️ Tài liệu điều hành</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
            {/* Phiếu điều tour */}
            {(()=>{const hdvObj=hdvList.find(h=>h.id===selected.hdvId)||{name:selected.hdvName};const html=buildDispatch({order:selected,hdv:hdvObj,meetPoint:selected.meetPoint,meetTime:selected.meetTime,notes:selected.note,issuerName:currentUser?.name});return(
              <div style={{display:"inline-flex",alignItems:"stretch",borderRadius:8,overflow:"hidden",border:"1px solid #bfdbfe"}}>
                <button onClick={()=>openPrintWindow(html)} style={{padding:"8px 12px",background:"#eff6ff",color:"#1e3a8a",border:"none",borderRight:"1px solid #bfdbfe",cursor:"pointer",fontSize:12,fontWeight:600,display:"inline-flex",alignItems:"center",gap:4}}>🗂 Phiếu điều tour &nbsp;🖨</button>
                <button onClick={()=>downloadAsWord(html,"PhieuDieuTour-"+(selected.id||""))} style={{padding:"8px 10px",background:"#dbeafe",color:"#1e3a8a",border:"none",cursor:"pointer",fontSize:12,fontWeight:600}}>📝 Word</button>
              </div>
            );})()}
            {/* Hợp đồng HDV */}
            {selected.hdvId&&(()=>{const hdvObj=hdvList.find(h=>h.id===selected.hdvId)||{name:selected.hdvName};const days=selected.departDate&&selected.returnDate?Math.max(1,Math.ceil((new Date(selected.returnDate)-new Date(selected.departDate))/86400000)):1;const html=buildGuideContract({order:selected,hdv:hdvObj,dailyFee:hdvObj.dailyFee||800000,totalFee:(hdvObj.dailyFee||800000)*days,advanceAmount:Math.round(((hdvObj.dailyFee||800000)*days)*0.5),tourDays:days+"N"+(days-1)+"Đ",issuerName:currentUser?.name});return(
              <div style={{display:"inline-flex",alignItems:"stretch",borderRadius:8,overflow:"hidden",border:"1px solid #bbf7d0"}}>
                <button onClick={()=>openPrintWindow(html)} style={{padding:"8px 12px",background:"#f0fdf4",color:"#15803d",border:"none",borderRight:"1px solid #bbf7d0",cursor:"pointer",fontSize:12,fontWeight:600,display:"inline-flex",alignItems:"center",gap:4}}>📝 Hợp đồng HDV &nbsp;🖨</button>
                <button onClick={()=>downloadAsWord(html,"HopDong-HDV-"+(selected.id||""))} style={{padding:"8px 10px",background:"#dcfce7",color:"#15803d",border:"none",cursor:"pointer",fontSize:12,fontWeight:600}}>📝 Word</button>
              </div>
            );})()}
            {/* Quyết toán tour */}
            {(selected.opsMilestones||{}).returned&&(()=>{const hdvObj=hdvList.find(h=>h.id===selected.hdvId)||{name:selected.hdvName};const html=buildTourSettlement({order:selected,hdv:hdvObj,advanceAmount:selected.advanceAmount||0,expenseItems:[],totalCollected:selected.totalPaid||0,issuerName:currentUser?.name});return(
              <div style={{display:"inline-flex",alignItems:"stretch",borderRadius:8,overflow:"hidden",border:"1px solid #e9d5ff"}}>
                <button onClick={()=>openPrintWindow(html)} style={{padding:"8px 12px",background:"#faf5ff",color:"#7c3aed",border:"none",borderRight:"1px solid #e9d5ff",cursor:"pointer",fontSize:12,fontWeight:600,display:"inline-flex",alignItems:"center",gap:4}}>📊 Quyết toán tour &nbsp;🖨</button>
                <button onClick={()=>downloadAsWord(html,"QuyetToan-Tour-"+(selected.id||""))} style={{padding:"8px 10px",background:"#ede9fe",color:"#7c3aed",border:"none",cursor:"pointer",fontSize:12,fontWeight:600}}>📝 Word</button>
              </div>
            );})()}
          </div>
        </div>

        <div style={{background:"#fff",borderRadius:16,padding:24,boxShadow:"0 1px 6px rgba(0,0,0,.07)"}}>
          <div style={{fontWeight:700,marginBottom:16}}>Tiến độ vận hành</div>
          <div style={{display:"flex",flexDirection:"column",gap:0}}>
            {MILESTONES.map((key,i)=>{
              const done=!!(selected.opsMilestones||{})[key];
              const isCurrent=i===stage;
              return(
                <div key={key} style={{display:"flex",gap:12,alignItems:"flex-start",position:"relative",paddingBottom:i<MILESTONES.length-1?28:0}}>
                  {i<MILESTONES.length-1&&<div style={{position:"absolute",left:13,top:28,bottom:0,width:2,background:done?"#16a34a":"#e2e8f0"}}/>}
                  <div onClick={()=>toggleMilestone(selected,key)} style={{width:28,height:28,borderRadius:"50%",background:done?"#16a34a":"#fff",border:"2px solid "+(done?"#16a34a":"#cbd5e1"),display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0,zIndex:1}}>
                    {done?<span style={{color:"#fff",fontWeight:800,fontSize:13}}>✓</span>:<span style={{fontSize:13}}>{MILESTONE_ICON[key]}</span>}
                  </div>
                  <div style={{paddingTop:4}}>
                    <div style={{fontWeight:700,fontSize:14,color:done?"#16a34a":isCurrent?"#1e293b":"#94a3b8"}}>{MILESTONE_LABEL[key]}</div>
                    {isCurrent&&!done&&<div style={{fontSize:12,color:"#d97706",fontWeight:600}}>Đang chờ xác nhận bước này</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{background:"#fff",borderRadius:16,padding:24,boxShadow:"0 1px 6px rgba(0,0,0,.07)",marginTop:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div style={{fontWeight:700}}>Checklist công việc</div>
            <div style={{fontSize:12,color:"#64748b",fontWeight:600}}>
              {(()=>{const cl=selected.checklist||DEFAULT_CHECKLIST;return cl.filter(c=>c.done).length+"/"+cl.length+" hoàn thành";})()}
            </div>
          </div>
          {(()=>{
            const checklist=selected.checklist||DEFAULT_CHECKLIST;
            const cats=[...new Set(checklist.map(c=>c.cat))];
            const toggleItem=(id)=>{
              const updated=checklist.map(c=>c.id===id?{...c,done:!c.done}:c);
              onUpdateOrder&&onUpdateOrder({...selected,checklist:updated});
              setSelected({...selected,checklist:updated});
            };
            return cats.map(cat=>(
              <div key={cat} style={{marginBottom:16}}>
                <div style={{fontSize:12,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:.5,marginBottom:8}}>{cat}</div>
                {checklist.filter(c=>c.cat===cat).map(item=>(
                  <div key={item.id} onClick={()=>toggleItem(item.id)} style={{display:"flex",gap:10,alignItems:"center",padding:"7px 0",cursor:"pointer"}}>
                    <div style={{width:18,height:18,borderRadius:5,border:"2px solid "+(item.done?"#16a34a":"#cbd5e1"),background:item.done?"#16a34a":"#fff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      {item.done&&<span style={{color:"#fff",fontSize:11,fontWeight:800}}>✓</span>}
                    </div>
                    <span style={{fontSize:13,color:item.done?"#94a3b8":"#374151",textDecoration:item.done?"line-through":"none"}}>{item.item}</span>
                  </div>
                ))}
              </div>
            ));
          })()}
        </div>
      </div>
    );
  }

  return (
    <div style={{padding:24}}>
      <h2 style={{margin:"0 0 4px",fontSize:20,fontWeight:800}}>Điều hành Tour</h2>
      <div style={{fontSize:13,color:"#64748b",marginBottom:20}}>{activeOrders.length} đơn đang trong quy trình vận hành</div>

      {urgentSoon.length>0&&(
        <div style={{background:"#fee2e2",borderRadius:10,padding:"12px 16px",marginBottom:16,fontSize:13,color:"#dc2626",fontWeight:600}}>
          🚨 {urgentSoon.length} tour khởi hành trong 48h <b>chưa giao HDV</b> — xử lý ngay
        </div>
      )}

      <div style={{display:'grid',gap:12}}>
        {activeOrders.length===0 && <div style={{textAlign:'center',color:'#9ca3af',padding:40}}>Không có tour nào đang chạy</div>}
        {activeOrders.map(o=>{
          const stage=getStage(o);
          const d=daysTo(o.departDate);
          const isUrgent=d!==null&&d>=0&&d<=2&&stage<1;
          return(
            <div key={o.id} onClick={()=>setSelected(o)} style={{background:'#fff',borderRadius:12,padding:16,boxShadow:'0 1px 4px rgba(0,0,0,.07)',cursor:"pointer",border:isUrgent?"1px solid #fecaca":"1px solid transparent",transition:"box-shadow .15s"}}
              onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 14px rgba(0,0,0,.1)"} onMouseLeave={e=>e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,.07)"}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                <div>
                  <div style={{fontWeight:700,fontSize:15}}>{o.id} — {o.tourName||o.service}</div>
                  <div style={{fontSize:13,color:'#64748b',marginTop:4}}>Khách: {o.customerName||(typeof o.customer==="object"?o.customer?.name:o.customer)||""} · Pax: {typeof o.pax==="object"?(o.pax.adults||0)+(o.pax.children||0)+(o.pax.babies||0):o.pax||1}</div>
                  <div style={{fontSize:13,color:'#64748b'}}>Khởi hành: {fmtDate(o.departDate)} {d!==null&&d>=0&&<span style={{color:d<=2?"#dc2626":"#64748b",fontWeight:600}}>({d===0?"hôm nay":"còn "+d+" ngày"})</span>} · HDV: {o.hdvName||<span style={{color:"#dc2626"}}>Chưa phân công</span>}</div>
                </div>
                <span style={{background:o.status==='in_progress'?'#dcfce7':'#fef9c3',color:o.status==='in_progress'?'#16a34a':'#ca8a04',borderRadius:6,padding:'4px 10px',fontSize:12,fontWeight:600,whiteSpace:"nowrap"}}>
                  {o.status==='in_progress'?'Đang chạy':'Đã xác nhận'}
                </span>
              </div>
              <div style={{display:"flex",gap:4,marginTop:12}}>
                {MILESTONES.map((key,i)=>(
                  <div key={key} style={{flex:1,height:5,borderRadius:3,background:i<=stage-1||(!!(o.opsMilestones||{})[key])?"#16a34a":"#e2e8f0"}}/>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function calcRefundPolicy(departDateStr,totalPrice){
  const days=daysUntilDepart?daysUntilDepart(departDateStr):Math.ceil((new Date(departDateStr)-new Date())/86400000);
  const rule=REFUND_POLICY.find(r=>days>=r.minDays)||REFUND_POLICY[REFUND_POLICY.length-1];
  return {days,pct:rule.pct,label:rule.label,amount:Math.round((totalPrice||0)*rule.pct/100)};
}

function RefundModule({ orders=[], vouchers=[], refunds=[], onRefundUpdate, onRefundCreate, pushNotif, currentRole, currentUser }) {
  const [showForm, setShowForm] = React.useState(false);
  const [form, setForm] = React.useState({ orderId:'', amount:'', reason:'', method:'cash' });
  const selectedOrder=orders.find(o=>o.id===form.orderId);
  const policyCalc=selectedOrder?.departDate?calcRefundPolicy(selectedOrder.departDate,selectedOrder.totalPrice):null;

  const applyPolicyAmount=()=>{
    if(policyCalc) setForm(f=>({...f,amount:String(policyCalc.amount)}));
  };

  const save = () => {
    if (!form.orderId||!form.amount) return pushNotif('Điền đủ thông tin','error');
    const rec = {...form, id:'RF'+Date.now(), amount:Number(form.amount), status:'pending', createdAt:new Date().toISOString(), createdBy:currentUser?.name, policyPct:policyCalc?.pct};
    onRefundCreate(rec);
    pushNotif('Tạo phiếu hoàn tiền thành công');
    setShowForm(false);
    setForm({orderId:'',amount:'',reason:'',method:'cash'});
  };
  return (
    <div style={{padding:24}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <h2 style={{margin:0}}>Hoàn tiền / Refund ({refunds.length})</h2>
        {(currentRole==='manager'||currentRole==='accountant'||currentRole==='cashier') &&
          <button onClick={()=>setShowForm(true)} style={{background:'#2563eb',color:'#fff',border:'none',borderRadius:8,padding:'8px 18px',cursor:'pointer'}}>+ Tạo phiếu hoàn</button>}
      </div>
      {showForm && (
        <div style={{background:'#fff',borderRadius:12,padding:20,marginBottom:16,boxShadow:'0 2px 8px rgba(0,0,0,.1)'}}>
          <h3 style={{marginTop:0}}>Phiếu hoàn tiền mới</h3>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div>
              <label style={{display:'block',marginBottom:4,fontSize:13,fontWeight:600}}>Đơn hàng</label>
              <select value={form.orderId} onChange={e=>setForm(f=>({...f,orderId:e.target.value}))} style={{width:'100%',border:'1px solid #e2e8f0',borderRadius:8,padding:'8px 12px'}}>
                <option value=''>-- Chon don --</option>
                {orders.map(o=><option key={o.id} value={o.id}>{o.id}</option>)}
              </select>
              {policyCalc&&(
                <div onClick={applyPolicyAmount} style={{marginTop:6,background:"#eff6ff",borderRadius:7,padding:"7px 10px",fontSize:12,color:"#1d4ed8",cursor:"pointer",fontWeight:600}}>
                  📋 Chính sách: {policyCalc.label} → hoàn {policyCalc.pct}% = {policyCalc.amount.toLocaleString("vi-VN")}₫ <span style={{textDecoration:"underline"}}>(bấm để áp dụng)</span>
                </div>
              )}
            </div>
            <div>
              <label style={{display:'block',marginBottom:4,fontSize:13,fontWeight:600}}>Số tiền hoàn (đ)</label>
              <NumberInput value={form.amount||0} onChange={v=>setForm(f=>({...f,amount:v}))} placeholder="VD: 3.000.000" style={{width:'100%',border:'1px solid #e2e8f0',borderRadius:8,padding:'8px 12px',boxSizing:'border-box'}}/>
            </div>
            <div>
              <label style={{display:'block',marginBottom:4,fontSize:13,fontWeight:600}}>Hình thức</label>
              <select value={form.method} onChange={e=>setForm(f=>({...f,method:e.target.value}))} style={{width:'100%',border:'1px solid #e2e8f0',borderRadius:8,padding:'8px 12px'}}>
                <option value='cash'>Tiền mặt</option>
                <option value='bank'>Chuyển khoản</option>
              </select>
            </div>
            <div>
              <label style={{display:'block',marginBottom:4,fontSize:13,fontWeight:600}}>Lý do</label>
              <input value={form.reason} onChange={e=>setForm(f=>({...f,reason:e.target.value}))} style={{width:'100%',border:'1px solid #e2e8f0',borderRadius:8,padding:'8px 12px',boxSizing:'border-box'}}/>
            </div>
          </div>
          <div style={{display:'flex',gap:8,marginTop:12}}>
            <button onClick={save} style={{background:'#16a34a',color:'#fff',border:'none',borderRadius:8,padding:'8px 20px',cursor:'pointer'}}>Lưu</button>
            <button onClick={()=>setShowForm(false)} style={{background:'#6b7280',color:'#fff',border:'none',borderRadius:8,padding:'8px 20px',cursor:'pointer'}}>Hủy</button>
          </div>
        </div>
      )}
      <div style={{display:'grid',gap:8}}>
        {refunds.length===0 && <div style={{textAlign:'center',color:'#9ca3af',padding:40}}>Không có phiếu hoàn nào</div>}
        {refunds.map(r=>(
          <div key={r.id} style={{background:'#fff',borderRadius:12,padding:16,boxShadow:'0 1px 4px rgba(0,0,0,.07)',display:'flex',justifyContent:'space-between',alignItems:'center',gap:12}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:700}}>{r.id} — {r.orderId}</div>
              <div style={{fontSize:13,color:'#64748b'}}>{r.reason||'—'} · {r.method==='cash'?'Tiền mặt':'Chuyển khoản'}</div>
              {r.createdBy&&<div style={{fontSize:11,color:'#94a3b8',marginTop:2}}>Tạo bởi: {r.createdBy}</div>}
            </div>
            <div style={{textAlign:'right',flexShrink:0}}>
              <div style={{fontWeight:700,color:'#dc2626',fontSize:15}}>{(r.amount||0).toLocaleString('vi-VN')}₫</div>
              <span style={{fontSize:12,background:r.status==='approved'?'#dcfce7':r.status==='rejected'?'#fee2e2':'#fef9c3',color:r.status==='approved'?'#16a34a':r.status==='rejected'?'#dc2626':'#ca8a04',borderRadius:6,padding:'2px 8px',display:'inline-block',marginTop:4}}>
                {r.status==='approved'?'Đã duyệt':r.status==='rejected'?'Từ chối':'Chờ duyệt'}
              </span>
              {r.status==='pending'&&(currentRole==='accountant'||currentRole==='manager')&&(
                <div style={{display:'flex',gap:6,marginTop:8,justifyContent:'flex-end'}}>
                  <button onClick={()=>onRefundUpdate&&onRefundUpdate({...r,status:'approved',approvedBy:currentUser?.name,approvedAt:new Date().toISOString()})} style={{background:'#16a34a',color:'#fff',border:'none',borderRadius:6,padding:'4px 12px',fontSize:12,cursor:'pointer',fontWeight:600}}>Duyệt</button>
                  <button onClick={()=>onRefundUpdate&&onRefundUpdate({...r,status:'rejected',rejectedBy:currentUser?.name,rejectedAt:new Date().toISOString()})} style={{background:'#dc2626',color:'#fff',border:'none',borderRadius:6,padding:'4px 12px',fontSize:12,cursor:'pointer',fontWeight:600}}>Từ chối</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CreditModule({ orders=[], pushNotif, credits=[], onUpdateCredits, currentUser }) {
  const [showForm,setShowForm]=React.useState(false);
  const [selected,setSelected]=React.useState(null);
  const [useAmount,setUseAmount]=React.useState("");
  const [useOrderId,setUseOrderId]=React.useState("");
  const [form,setForm]=React.useState({orderId:"",customerName:"",customerPhone:"",airlineName:"",route:"",ticketNo:"",pnr:"",originalAmount:"",feeDeducted:"",expiryDate:"",conditions:"",notes:""});

  const fmtMoney=(n)=>(n||0).toLocaleString("vi-VN")+"₫";
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));

  const daysToExpiry=(d)=>Math.ceil((new Date(d)-new Date())/86400000);

  const sync=(list)=>onUpdateCredits&&onUpdateCredits(list);

  const computeStatus=(c)=>{
    if(daysToExpiry(c.expiryDate)<0) return "expired";
    if(c.remainingAmount<=0) return "used";
    if(c.usedAmount>0) return "partial";
    return "active";
  };
  const STATUS={active:{bg:"#dcfce7",c:"#15803d",label:"Còn hiệu lực"},partial:{bg:"#dbeafe",c:"#1d4ed8",label:"Đã dùng 1 phần"},used:{bg:"#f1f5f9",c:"#475569",label:"Đã dùng hết"},expired:{bg:"#fee2e2",c:"#dc2626",label:"Đã hết hạn"}};

  const decorated=credits.map(c=>({...c,_status:computeStatus(c)}));
  const totalRemaining=decorated.filter(c=>c._status==="active"||c._status==="partial").reduce((s,c)=>s+(c.remainingAmount||0),0);
  const expiringSoon=decorated.filter(c=>(c._status==="active"||c._status==="partial")&&daysToExpiry(c.expiryDate)<=30&&daysToExpiry(c.expiryDate)>=0);

  const saveNew=()=>{
    if(!form.customerName||!form.originalAmount) return pushNotif&&pushNotif("Nhập tên khách và số tiền gốc","error");
    const original=Number(form.originalAmount)||0;
    const fee=Number(form.feeDeducted)||0;
    const creditAmount=Math.max(0,original-fee);
    const rec={...form,id:"BL"+Date.now(),originalAmount:original,feeDeducted:fee,creditAmount,usedAmount:0,remainingAmount:creditAmount,issueDate:new Date().toISOString().slice(0,10),status:"active",usageHistory:[],createdBy:currentUser?.name};
    sync([rec,...credits]);
    pushNotif&&pushNotif("Đã tạo bảo lưu vé "+rec.id+" — còn "+fmtMoney(creditAmount));
    setShowForm(false);
    setForm({orderId:"",customerName:"",customerPhone:"",airlineName:"",route:"",ticketNo:"",pnr:"",originalAmount:"",feeDeducted:"",expiryDate:"",conditions:"",notes:""});
  };

  const applyCredit=()=>{
    if(!selected) return;
    const amt=Number(useAmount)||0;
    if(amt<=0||amt>selected.remainingAmount) return pushNotif&&pushNotif("Số tiền sử dụng không hợp lệ","error");
    if(!useOrderId.trim()) return pushNotif&&pushNotif("Nhập mã đơn áp dụng","error");
    const usage={ts:new Date().toISOString(),orderId:useOrderId,amount:amt,by:currentUser?.name};
    const updated={...selected,usedAmount:(selected.usedAmount||0)+amt,remainingAmount:selected.remainingAmount-amt,usageHistory:[...(selected.usageHistory||[]),usage]};
    sync(credits.map(c=>c.id===selected.id?updated:c));
    setSelected(updated);
    pushNotif&&pushNotif("Đã áp dụng "+fmtMoney(amt)+" cho đơn "+useOrderId);
    setUseAmount(""); setUseOrderId("");
  };

  const fieldStyle={width:"100%",border:"1px solid #e2e8f0",borderRadius:8,padding:"9px 12px",fontSize:13,boxSizing:"border-box"};
  const labelStyle={display:"block",fontSize:12,fontWeight:600,marginBottom:4,color:"#374151"};

  if(selected){
    const sc=STATUS[selected._status];
    const days=daysToExpiry(selected.expiryDate);
    return(
      <div style={{padding:24,maxWidth:640,margin:"0 auto"}}>
        <button onClick={()=>setSelected(null)} style={{background:"none",border:"none",color:"#2563eb",cursor:"pointer",fontSize:14,marginBottom:16}}>← Danh sách bảo lưu</button>
        <div style={{background:"#fff",borderRadius:16,padding:24,boxShadow:"0 1px 6px rgba(0,0,0,.07)",marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div>
              <div style={{fontSize:19,fontWeight:800}}>{selected.id}</div>
              <div style={{fontSize:13,color:"#64748b",marginTop:4}}>{selected.customerName} · {selected.customerPhone}</div>
            </div>
            <span style={{background:sc.bg,color:sc.c,borderRadius:20,padding:"5px 14px",fontWeight:700,fontSize:12}}>{sc.label}</span>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:18}}>
            {[["Hãng bay",selected.airlineName],["Chặng",selected.route],["Số vé",selected.ticketNo],["PNR",selected.pnr],["Ngày cấp",new Date(selected.issueDate).toLocaleDateString("vi-VN")],["Hạn dùng",new Date(selected.expiryDate).toLocaleDateString("vi-VN")+(days>=0?" ("+days+" ngày nữa)":" (đã hết hạn)")]].map(([k,v])=>(
              <div key={k} style={{background:"#f8fafc",borderRadius:8,padding:"8px 12px"}}>
                <div style={{fontSize:11,color:"#64748b"}}>{k}</div>
                <div style={{fontSize:13,fontWeight:600}}>{v||"—"}</div>
              </div>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginTop:14}}>
            <div style={{background:"#eff6ff",borderRadius:10,padding:12,textAlign:"center"}}>
              <div style={{fontSize:11,color:"#1d4ed8"}}>Giá trị bảo lưu</div>
              <div style={{fontSize:16,fontWeight:800,color:"#1d4ed8"}}>{fmtMoney(selected.creditAmount)}</div>
            </div>
            <div style={{background:"#fef9c3",borderRadius:10,padding:12,textAlign:"center"}}>
              <div style={{fontSize:11,color:"#92400e"}}>Đã dùng</div>
              <div style={{fontSize:16,fontWeight:800,color:"#92400e"}}>{fmtMoney(selected.usedAmount)}</div>
            </div>
            <div style={{background:"#dcfce7",borderRadius:10,padding:12,textAlign:"center"}}>
              <div style={{fontSize:11,color:"#15803d"}}>Còn lại</div>
              <div style={{fontSize:16,fontWeight:800,color:"#15803d"}}>{fmtMoney(selected.remainingAmount)}</div>
            </div>
          </div>
          {selected.conditions&&<div style={{fontSize:12,color:"#64748b",marginTop:14,fontStyle:"italic"}}>Điều kiện: {selected.conditions}</div>}
        </div>

        {selected._status!=="expired"&&selected._status!=="used"&&(
          <div style={{background:"#fff",borderRadius:16,padding:20,boxShadow:"0 1px 6px rgba(0,0,0,.07)",marginBottom:16}}>
            <div style={{fontWeight:700,marginBottom:12}}>Áp dụng bảo lưu cho đơn mới</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div>
                <label style={labelStyle}>Mã đơn áp dụng</label>
                <select value={useOrderId} onChange={e=>setUseOrderId(e.target.value)} style={fieldStyle}>
                  <option value="">-- Chọn đơn --</option>
                  {orders.map(o=><option key={o.id} value={o.id}>{o.id} - {o.customerName}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Số tiền áp dụng (tối đa {fmtMoney(selected.remainingAmount)})</label>
                <input type="number" max={selected.remainingAmount} value={useAmount} onChange={e=>setUseAmount(e.target.value)} style={fieldStyle}/>
              </div>
            </div>
            <button onClick={applyCredit} style={{marginTop:12,background:"#2563eb",color:"#fff",border:"none",borderRadius:8,padding:"9px 20px",cursor:"pointer",fontWeight:700,fontSize:13}}>Áp dụng</button>
          </div>
        )}

        <div style={{background:"#fff",borderRadius:16,padding:20,boxShadow:"0 1px 6px rgba(0,0,0,.07)"}}>
          <div style={{fontWeight:700,marginBottom:12}}>Lịch sử sử dụng</div>
          {(selected.usageHistory||[]).length===0&&<div style={{textAlign:"center",color:"#94a3b8",padding:20,fontSize:13}}>Chưa sử dụng lần nào</div>}
          {(selected.usageHistory||[]).map((u,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid #f1f5f9",fontSize:13}}>
              <span>{u.orderId} · {u.by}</span>
              <span style={{fontWeight:700,color:"#1d4ed8"}}>{fmtMoney(u.amount)}</span>
              <span style={{color:"#94a3b8",fontSize:11}}>{new Date(u.ts).toLocaleDateString("vi-VN")}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{padding:24}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:12}}>
        <div>
          <h2 style={{margin:0,fontSize:20,fontWeight:800}}>Bảo lưu vé máy bay</h2>
          <div style={{fontSize:13,color:"#64748b",marginTop:2}}>{credits.length} phiếu · Tổng giá trị còn lại: <b style={{color:"#15803d"}}>{fmtMoney(totalRemaining)}</b></div>
        </div>
        <button onClick={()=>setShowForm(true)} style={{background:"#2563eb",color:"#fff",border:"none",borderRadius:9,padding:"9px 20px",cursor:"pointer",fontWeight:700,fontSize:14}}>+ Tạo bảo lưu</button>
      </div>

      {expiringSoon.length>0&&(
        <div style={{background:"#fef9c3",borderRadius:10,padding:"12px 16px",marginBottom:16,fontSize:13,color:"#92400e"}}>
          ⚠️ <b>{expiringSoon.length} phiếu</b> sắp hết hạn trong 30 ngày tới — nhắc khách sử dụng trước khi mất giá trị
        </div>
      )}

      {showForm&&(
        <div style={{background:"#fff",borderRadius:14,padding:20,marginBottom:20,boxShadow:"0 1px 6px rgba(0,0,0,.07)"}}>
          <h3 style={{margin:"0 0 16px"}}>Tạo phiếu bảo lưu vé mới</h3>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            {[["Tên khách *","customerName"],["SĐT","customerPhone"],["Hãng bay","airlineName"],["Chặng bay","route"],["Số vé","ticketNo"],["Mã PNR","pnr"]].map(([label,key])=>(
              <div key={key}>
                <label style={labelStyle}>{label}</label>
                <input value={form[key]} onChange={e=>set(key,e.target.value)} style={fieldStyle}/>
              </div>
            ))}
            <div>
              <label style={labelStyle}>Giá trị vé gốc (₫) *</label>
              <input type="number" value={form.originalAmount} onChange={e=>set("originalAmount",e.target.value)} style={fieldStyle}/>
            </div>
            <div>
              <label style={labelStyle}>Phí huỷ/đổi bị trừ (₫)</label>
              <input type="number" value={form.feeDeducted} onChange={e=>set("feeDeducted",e.target.value)} style={fieldStyle}/>
            </div>
            <div>
              <label style={labelStyle}>Hạn sử dụng *</label>
              <input type="date" value={form.expiryDate} onChange={e=>set("expiryDate",e.target.value)} style={fieldStyle}/>
            </div>
          </div>
          {form.originalAmount&&<div style={{marginTop:10,fontSize:13,color:"#1d4ed8",fontWeight:600}}>Giá trị bảo lưu thực tế: {fmtMoney(Math.max(0,(Number(form.originalAmount)||0)-(Number(form.feeDeducted)||0)))}</div>}
          <div style={{marginTop:12}}>
            <label style={labelStyle}>Điều kiện sử dụng</label>
            <input value={form.conditions} onChange={e=>set("conditions",e.target.value)} placeholder="VD: Áp dụng mọi chặng, không hoàn tiền mặt..." style={fieldStyle}/>
          </div>
          <div style={{display:"flex",gap:8,marginTop:14}}>
            <button onClick={saveNew} style={{background:"#16a34a",color:"#fff",border:"none",borderRadius:8,padding:"9px 20px",cursor:"pointer",fontWeight:700}}>Tạo phiếu</button>
            <button onClick={()=>setShowForm(false)} style={{background:"#6b7280",color:"#fff",border:"none",borderRadius:8,padding:"9px 20px",cursor:"pointer",fontWeight:600}}>Hủy</button>
          </div>
        </div>
      )}

      <div style={{display:"grid",gap:10}}>
        {decorated.length===0&&<div style={{textAlign:"center",color:"#94a3b8",padding:48}}>Chưa có phiếu bảo lưu nào</div>}
        {decorated.map(c=>{
          const sc=STATUS[c._status];
          const days=daysToExpiry(c.expiryDate);
          return(
            <div key={c.id} onClick={()=>setSelected(c)} style={{background:"#fff",borderRadius:12,padding:16,boxShadow:"0 1px 4px rgba(0,0,0,.07)",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",transition:"box-shadow .15s"}}
              onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 14px rgba(0,0,0,.1)"} onMouseLeave={e=>e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,.07)"}>
              <div>
                <div style={{fontWeight:700}}>{c.id} — {c.customerName}</div>
                <div style={{fontSize:12,color:"#64748b",marginTop:3}}>{c.airlineName} {c.route?"· "+c.route:""} {(c._status==="active"||c._status==="partial")&&days>=0&&<span style={{color:days<=30?"#dc2626":"#64748b"}}> · còn {days} ngày</span>}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontWeight:700,fontSize:14,color:"#15803d"}}>{fmtMoney(c.remainingAmount)}</div>
                <span style={{fontSize:11,background:sc.bg,color:sc.c,borderRadius:20,padding:"2px 8px",fontWeight:600}}>{sc.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NotifPanel({notifs=[],onClose,onMarkRead,onNav,currentRole,currentUser}){
  const fmtTime=(t)=>{
    const d=new Date(t); const diff=(Date.now()-d.getTime())/60000;
    if(diff<1) return "Vừa xong";
    if(diff<60) return Math.floor(diff)+" phút trước";
    if(diff<1440) return Math.floor(diff/60)+" giờ trước";
    return d.toLocaleDateString("vi-VN");
  };
  const ICON={success:"✅",error:"❌",warning:"⚠️",info:"ℹ️"};
  const canViewOrder=(n)=>{
    if(!n.orderId) return false;
    if(["manager","accountant","dieu_hanh"].includes(currentRole)) return true;
    if(currentRole==="sale"&&(n.sale===currentUser?.name||n.createdBy===currentUser?.name)) return true;
    return false;
  };
  return(
    <div style={{position:"fixed",inset:0,zIndex:1500}} onClick={onClose}>
      <div className="anim-scale" onClick={e=>e.stopPropagation()} style={{position:"absolute",top:64,right:16,width:380,maxHeight:500,background:"#fff",borderRadius:14,boxShadow:"0 8px 32px rgba(0,0,0,.18)",overflow:"hidden",display:"flex",flexDirection:"column",transformOrigin:"top right"}}>
        <div style={{padding:"14px 18px",borderBottom:"1px solid #f1f5f9",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontWeight:700,fontSize:14}}>Thông báo</div>
          {notifs.some(n=>!n.read)&&<button onClick={onMarkRead} style={{background:"none",border:"none",color:"#185FA5",fontSize:12,cursor:"pointer",fontWeight:600}}>Đánh dấu đã đọc</button>}
        </div>
        <div style={{overflowY:"auto",flex:1}}>
          {notifs.filter(n=>!n.targetRole||n.targetRole===currentRole||(n.targetRole==="manager"&&currentRole==="pho_giam_doc")).length===0&&<div style={{textAlign:"center",color:"#94a3b8",padding:40,fontSize:13}}>Không có thông báo nào</div>}
          {notifs.filter(n=>!n.targetRole||n.targetRole===currentRole||(n.targetRole==="manager"&&currentRole==="pho_giam_doc")).slice(0,30).map(n=>{
            const canView=canViewOrder(n);
            return(
              <div key={n.id}
                style={{display:"flex",gap:10,padding:"12px 18px",borderBottom:"1px solid #f8fafc",background:n.read?"#fff":"#E6F1FB",cursor:canView?"pointer":"default",transition:"background .15s"}}
                onClick={()=>{ if(canView&&onNav) onNav(n.orderId); }}
                onMouseEnter={e=>{if(canView) e.currentTarget.style.background=n.read?"#f8fafc":"#dbeafe";}}
                onMouseLeave={e=>{e.currentTarget.style.background=n.read?"#fff":"#E6F1FB";}}>
                <span style={{fontSize:16,flexShrink:0,marginTop:1}}>{ICON[n.type]||"📌"}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:n.read?400:600,color:"#1e293b"}}>{n.msg}</div>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginTop:3}}>
                    <span style={{fontSize:11,color:"#94a3b8"}}>{fmtTime(n.time)}</span>
                    {n.createdBy&&<span style={{fontSize:11,color:"#94a3b8"}}>· {n.createdBy}</span>}
                  </div>
                  {canView&&<div style={{fontSize:11,color:"#185FA5",fontWeight:600,marginTop:3}}>Xem đơn hàng →</div>}
                  {n.orderId&&!canView&&<div style={{fontSize:11,color:"#94a3b8",marginTop:3}}>Chỉ sale phụ trách và kế toán / điều hành có thể xem</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function GlobalSearch({orders=[],customers=[],suppliers=[],hdvList=[],onClose,onSelectOrder,onSelectCustomer,onSelectSupplier,setView}){
  const [q,setQ]=React.useState("");
  const inputRef=React.useRef(null);
  React.useEffect(()=>{inputRef.current?.focus();},[]);
  React.useEffect(()=>{
    const onKey=(e)=>{ if(e.key==="Escape") onClose(); };
    window.addEventListener("keydown",onKey);
    return ()=>window.removeEventListener("keydown",onKey);
  },[onClose]);

  const ql=q.trim().toLowerCase();
  const orderResults=ql?orders.filter(o=>o.id?.toLowerCase().includes(ql)||o.customerName?.toLowerCase().includes(ql)||o.customerPhone?.includes(ql)||o.tourName?.toLowerCase().includes(ql)).slice(0,6):[];
  const custResults=ql?customers.filter(c=>c.name?.toLowerCase().includes(ql)||c.phone?.includes(ql)).slice(0,6):[];
  const suppResults=ql?(suppliers||[]).filter(s=>(s.name||s.ten)?.toLowerCase().includes(ql)).slice(0,3):[];
  const hdvResults=ql?(hdvList||[]).filter(h=>h.name?.toLowerCase().includes(ql)||h.phone?.includes(ql)).slice(0,2):[];

  return(
    <div className="modal-overlay" style={{alignItems:"flex-start",paddingTop:"10vh"}} onClick={onClose}>
      <div className="anim-scale" onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:16,width:560,maxWidth:"90vw",maxHeight:"70vh",overflow:"hidden",boxShadow:"0 16px 48px rgba(0,0,0,.3)"}}>
        <div style={{padding:16,borderBottom:"1px solid #f1f5f9"}}>
          <input ref={inputRef} value={q} onChange={e=>setQ(e.target.value)} placeholder="Tìm đơn hàng, khách hàng, SĐT..." style={{width:"100%",border:"none",outline:"none",fontSize:16,padding:"6px 4px"}}/>
        </div>
        <div style={{maxHeight:"55vh",overflowY:"auto"}}>
          {ql&&orderResults.length===0&&custResults.length===0&&suppResults.length===0&&hdvResults.length===0&&<div style={{textAlign:"center",color:"#94a3b8",padding:32,fontSize:13}}>Không tìm thấy kết quả</div>}
          {orderResults.length>0&&(
            <div>
              <div style={{padding:"8px 16px",fontSize:11,fontWeight:700,color:"#94a3b8",textTransform:"uppercase"}}>Đơn hàng</div>
              {orderResults.map(o=>(
                <div key={o.id} onClick={()=>onSelectOrder(o)} style={{padding:"10px 16px",cursor:"pointer",display:"flex",justifyContent:"space-between"}}
                  onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"} onMouseLeave={e=>e.currentTarget.style.background=""}>
                  <div><span style={{fontWeight:700,fontSize:13,color:"#2563eb"}}>{o.id}</span><span style={{fontSize:13,marginLeft:8}}>{o.customerName}</span></div>
                  <span style={{fontSize:12,color:"#64748b"}}>{o.tourName||o.service}</span>
                </div>
              ))}
            </div>
          )}
          {custResults.length>0&&(
            <div>
              <div style={{padding:"8px 16px",fontSize:11,fontWeight:700,color:"#94a3b8",textTransform:"uppercase"}}>Khách hàng</div>
              {custResults.map(c=>(
                <div key={c.id} onClick={()=>onSelectCustomer(c)} style={{padding:"10px 16px",cursor:"pointer",display:"flex",justifyContent:"space-between"}}
                  onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"} onMouseLeave={e=>e.currentTarget.style.background=""}>
                  <span style={{fontWeight:700,fontSize:13}}>{c.name}</span>
                  <span style={{fontSize:12,color:"#64748b"}}>{c.phone}</span>
                </div>
              ))}
            </div>
          )}
          {suppResults.length>0&&(
            <div>
              <div style={{padding:"8px 16px",fontSize:11,fontWeight:700,color:"#94a3b8",textTransform:"uppercase"}}>Nhà cung cấp</div>
              {suppResults.map(s=>(
                <div key={s.id} onClick={()=>{if(setView)setView("ncc");onClose();}} style={{padding:"10px 16px",cursor:"pointer",display:"flex",justifyContent:"space-between"}}
                  onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"} onMouseLeave={e=>e.currentTarget.style.background=""}>
                  <span style={{fontWeight:700,fontSize:13}}>{s.name||s.ten}</span>
                  <span style={{fontSize:12,color:"#64748b"}}>{s.phone||s.sdt||""}</span>
                </div>
              ))}
            </div>
          )}
          {hdvResults.length>0&&(
            <div>
              <div style={{padding:"8px 16px",fontSize:11,fontWeight:700,color:"#94a3b8",textTransform:"uppercase"}}>Hướng dẫn viên</div>
              {hdvResults.map(h=>(
                <div key={h.id} onClick={()=>{if(setView)setView("hdv");onClose();}} style={{padding:"10px 16px",cursor:"pointer",display:"flex",justifyContent:"space-between"}}
                  onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"} onMouseLeave={e=>e.currentTarget.style.background=""}>
                  <span style={{fontWeight:700,fontSize:13}}>{h.name}</span>
                  <span style={{fontSize:12,color:"#64748b"}}>{h.phone||""}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DeployPanel({ deploySteps=[], onUpdateSteps }){
  const DEFAULT_STEPS=[{label:"Cài đặt môi trường Vercel",note:"Thêm VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY vào Environment Variables",done:false},{label:"Kết nối Supabase",note:"Tạo project Supabase, copy URL và anon key",done:false},{label:"Migrate dữ liệu seed lên Supabase",note:"Chạy script seed data",done:false},{label:"Kiểm tra đăng nhập",note:"Test tất cả role: manager, accountant, sale, dieu_hanh",done:false},{label:"Test tạo đơn hàng",note:"Tạo đơn → ghi phiếu thu → duyệt → đóng đơn",done:false},{label:"Test CRM",note:"Thêm khách, chuyển stage, ghi tương tác",done:false},{label:"Test báo cáo",note:"Kiểm tra số liệu dashboard và report",done:false},{label:"Go live",note:"Thông báo cho toàn bộ nhân viên",done:false}];
  const steps=deploySteps.length>0?deploySteps:DEFAULT_STEPS;
  const done=steps.filter(s=>s.done).length;
  const pct=steps.length?Math.round(done/steps.length*100):0;
  return(
    <div style={{padding:24,maxWidth:640,margin:"0 auto"}}>
      <h2 style={{margin:"0 0 4px",fontSize:20,fontWeight:800}}>Tiến độ triển khai hệ thống</h2>
      <div style={{fontSize:13,color:"#64748b",marginBottom:20}}>Hoàn thành {done}/{steps.length} bước · {pct}%</div>
      <div style={{background:"#e2e8f0",borderRadius:8,height:10,marginBottom:24}}>
        <div style={{background:"linear-gradient(90deg,#2563eb,#7c3aed)",height:10,borderRadius:8,width:pct+"%",transition:"width .5s"}}/>
      </div>
      <div style={{display:"grid",gap:8}}>
        {steps.map((s,i)=>(
          <div key={i} onClick={()=>onUpdateSteps&&onUpdateSteps(steps.map((x,j)=>j===i?{...x,done:!x.done}:x))} style={{background:"#fff",borderRadius:12,padding:"14px 16px",boxShadow:"0 1px 4px rgba(0,0,0,.07)",display:"flex",gap:12,alignItems:"flex-start",cursor:"pointer",opacity:s.done?.7:1,transition:"opacity .2s"}}
            onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 12px rgba(0,0,0,.1)"} onMouseLeave={e=>e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,.07)"}>
            <div style={{width:22,height:22,borderRadius:"50%",border:"2px solid "+(s.done?"#16a34a":"#e2e8f0"),background:s.done?"#16a34a":"#fff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1,transition:"all .2s"}}>
              {s.done&&<span style={{color:"#fff",fontSize:13,fontWeight:800}}>✓</span>}
            </div>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:14,textDecoration:s.done?"line-through":"none",color:s.done?"#94a3b8":"#1e293b"}}>{i+1}. {s.label}</div>
              {s.note&&<div style={{fontSize:12,color:"#64748b",marginTop:3}}>{s.note}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
export default function App(){
  const [currentUser, setCurrentUser] = React.useState(() => loadSession ? loadSession() : null);
  const [view, setView] = React.useState("dashboard");
  const {
    orders, vouchers, expenses, refunds, customers,
    users: userAccounts,
    dbNotifs,
    setOrders, setVouchers, setExpenses, setRefunds, setCustomers, setUsers: setUserAccounts,
    saveOrder, removeOrder, saveVoucher, saveExpense, saveRefund, saveCustomer, saveUser, removeUser, saveNotification,
    verifyLogin,
    loading: dbLoading,
  } = useSupabase();
  const [quotes, setQuotes] = React.useState([]);
  const [tourPrograms, setTourPrograms] = React.useState(SEED_TOUR_PROGRAMS);
  const [bankAccounts, setBankAccounts] = React.useState(SEED_BANK_ACCOUNTS);
  const [personalTargets, setPersonalTargets] = React.useState(SEED_PERSONAL_TARGETS);
  const [outputInvoices, setOutputInvoices] = React.useState(SEED_OUTPUT_INVOICES);
  const [inputInvoices, setInputInvoices] = React.useState(SEED_INPUT_INVOICES);
  const [bookings, setBookings] = React.useState(SEED_NCC_BOOKINGS);
  const [suppliers, setSuppliers] = React.useState(SEED_SUPPLIERS);

  // Load suppliers từ Supabase khi app khởi động
  React.useEffect(()=>{
    if(!import.meta.env.VITE_SUPABASE_URL) return;
    import('./db.js').then(({fetchSuppliers, upsertSupplier})=>{
      fetchSuppliers().then(async dbData=>{
        if(!dbData||dbData.length===0) return;

        // Auto-detect loai_hinh từ tên nếu chưa có
        const guessLoaiHinh = (name='') => {
          const n = name.toLowerCase();
          if(/airline|airways|air|hàng không|máy bay/i.test(n)) return ['Hàng không'];
          if(/cruises?|junk|indochina.sails|halong.bay.cruise|lan hạ.*cruise/i.test(n)) return ['Du thuyền đêm'];
          if(/speedboat|tàu cao tốc|tau cao toc|fast.boat/i.test(n)) return ['Tàu cao tốc / Speedboat'];
          if(/du thuyền ngày|day.cruise/i.test(n)) return ['Du thuyền ngày'];
          if(/sail|du thuyền/i.test(n)) return ['Du thuyền đêm'];
          if(/resort/i.test(n)) return ['Resort'];
          if(/khu sinh thái|eco|nature.park|vườn quốc gia/i.test(n)) return ['Khu sinh thái'];
          if(/farmstay|farm.stay/i.test(n)) return ['Farmstay'];
          if(/homestay/i.test(n)) return ['Homestay'];
          if(/villa/i.test(n)) return ['Villa'];
          if(/bungalow/i.test(n)) return ['Bungalow'];
          if(/hotel|ks |khách sạn|mường thanh|vinpearl|novotel|marriott|hilton|sheraton|intercontinental|pullman|mercure/i.test(n)) return ['Khách sạn'];
          if(/tourist|travel|du lịch|lữ hành|inbound|outbound|saigon.tourist/i.test(n)) return ['Dịch vụ visa'];
          if(/xe|transport|bus|car|taxi|limousine|van|vận chuyển/i.test(n)) return ['Đường bộ'];
          if(/spa|massage|wellness/i.test(n)) return ['Spa & Wellness'];
          if(/vé|ticket|tham quan|vui chơi|giải trí/i.test(n)) return ['Vé tham quan'];
          if(/nhà hàng|restaurant|ẩm thực|food/i.test(n)) return ['Nhà hàng'];
          return [];
        };

        // Merge: nếu record thiếu loai_hinh → ghép với SEED data hoặc auto-detect
        const merged = dbData.map(r=>{
          if(r.loai_hinh&&r.loai_hinh.length>0) return r; // đã có data đầy đủ
          // Tìm trong SEED theo id hoặc tên
          const seed = SEED_SUPPLIERS.find(s=>s.id===r.id||s.ten===(r.ten||r.name)||s.name===(r.ten||r.name));
          if(seed) return {...seed, ...r, loai_hinh:seed.loai_hinh||[], dich_vu:seed.dich_vu||[]};
          // Auto-detect từ tên
          const guessed = guessLoaiHinh(r.ten||r.name||'');
          return {...r, loai_hinh:guessed};
        });
        setSuppliers(merged);

        // Push SEED suppliers lên Supabase nếu chưa có data JSONB
        const needsSync = dbData.filter(r=>!r.loai_hinh||r.loai_hinh.length===0);
        if(needsSync.length>0){
          console.log('[suppliers] Syncing',needsSync.length,'records to Supabase...');
          for(const r of needsSync){
            const seed=SEED_SUPPLIERS.find(s=>s.id===r.id||s.ten===r.ten||s.ten===r.name);
            const full=seed?{...seed,...r,loai_hinh:seed.loai_hinh||[],dich_vu:seed.dich_vu||[]}:r;
            await upsertSupplier(full).catch(e=>console.warn('[sync NCC]',e.message));
          }
          console.log('[suppliers] Sync done');
        }
      }).catch(e=>console.warn('[suppliers] Load failed:',e.message));
    });
  },[]);

  const addSupplier = (s) => {
    const newS = { ...s, id: s.id||('ncc-'+Date.now()), created_at: new Date().toISOString() };
    setSuppliers(p => [...p, newS]);
    import('./db.js').then(({upsertSupplier})=>
      upsertSupplier(newS).catch(e=>{ console.error('[addSupplier]',e.message); pushToast("Lưu NCC thất bại: "+e.message,"warning"); })
    );
  };
  const updateSupplier = (id, s) => {
    setSuppliers(p => p.map(x => x.id === id ? { ...x, ...s, updated_at: new Date().toISOString() } : x));
    const updated = suppliers.find(x=>x.id===id);
    if(updated) import('./db.js').then(({upsertSupplier})=>
      upsertSupplier({...updated,...s}).catch(e=>console.error('[updateSupplier]',e.message))
    );
  };
  const deleteSupplier = (id) => {
    setSuppliers(p => p.filter(x => x.id !== id));
    import('./db.js').then(({deleteSupplierDb})=>
      deleteSupplierDb(id).catch(e=>console.error('[deleteSupplier]',e.message))
    );
  };
  const [tourGhepProducts, setTourGhepProducts] = React.useState([]);
  const [credits, setCredits] = React.useState(SEED_CREDITS);
  const [notifs, setNotifs] = React.useState([]);
  // Merge DB notifications vào notifs khi dbNotifs thay đổi (realtime)
  React.useEffect(()=>{
    if(dbNotifs && dbNotifs.length>0){
      setNotifs(prev=>{
        const prevIds = new Set(prev.map(n=>n.id));
        const newOnes = dbNotifs.filter(n=>!prevIds.has(n.id));
        if(newOnes.length===0) return prev;
        return [...newOnes, ...prev].slice(0,100);
      });
    }
  },[dbNotifs]);
  const [hdvList, setHdvList] = React.useState(HDV_LIST);
  const [products, setProducts] = React.useState([]);
  const [careTasks, setCareTasks] = React.useState([]);
  const [tasks, setTasks] = React.useState([]);
  const [msgHistory, setMsgHistory] = React.useState([]);
  const [deploySteps, setDeploySteps] = React.useState([]);
  const [approvalThreshold, setApprovalThreshold] = React.useState(20000000);
  const [showNotif, setShowNotif] = React.useState(false);
  const [showSearch, setShowSearch] = React.useState(false);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  // ── Persistence cho collections phụ (quotes/bookings/credits/tasks/careTasks/personalTargets) ──
  const collSetters = { quotes:setQuotes, bookings:setBookings, credits:setCredits, tasks:setTasks, careTasks:setCareTasks, personalTargets:setPersonalTargets, tourGhepProducts:setTourGhepProducts };
  // Load tất cả collection từ Supabase khi mount
  React.useEffect(()=>{
    if(!import.meta.env.VITE_SUPABASE_URL) return;
    import('./db.js').then(({fetchCollection})=>{
      Object.entries(collSetters).forEach(([name,setter])=>{
        fetchCollection(name).then(data=>{
          if(data&&data.length>0) setter(data);
          console.log(`[${name}] Loaded ${data?.length||0} from Supabase`);
        }).catch(e=>console.warn(`[${name}] Load failed:`,e.message));
      });
    });
  },[]);
  // Helper: lưu 1 item vào collection trên Supabase
  const persistColl = React.useCallback((collection,item)=>{
    if(!import.meta.env.VITE_SUPABASE_URL||!item?.id) return;
    import('./db.js').then(({upsertCollectionItem})=>
      upsertCollectionItem(collection,item).catch(e=>console.error(`[persist ${collection}]`,e.message))
    );
  },[]);
  const removeColl = React.useCallback((collection,id)=>{
    if(!import.meta.env.VITE_SUPABASE_URL) return;
    import('./db.js').then(({deleteCollectionItem})=>
      deleteCollectionItem(collection,id).catch(e=>console.error(`[remove ${collection}]`,e.message))
    );
  },[]);
  // Wrapper setter: cập nhật state + tự persist item thay đổi lên Supabase
  const makePersistedSetter = React.useCallback((collection, rawSetter)=>{
    return (updater)=>{
      rawSetter(prev=>{
        const next = typeof updater==="function" ? updater(prev) : updater;
        if(Array.isArray(next)&&import.meta.env.VITE_SUPABASE_URL){
          const prevMap = new Map((prev||[]).map(x=>[x.id,JSON.stringify(x)]));
          import('./db.js').then(({upsertCollectionItem,deleteCollectionItem})=>{
            // Upsert item mới hoặc đã đổi
            next.forEach(item=>{
              if(!item?.id) return;
              if(prevMap.get(item.id)!==JSON.stringify(item))
                upsertCollectionItem(collection,item).catch(e=>console.error(`[persist ${collection}]`,e.message));
            });
            // Xóa item đã bị remove
            const nextIds=new Set(next.map(x=>x.id));
            (prev||[]).forEach(old=>{ if(old?.id&&!nextIds.has(old.id)) deleteCollectionItem(collection,old.id).catch(()=>{}); });
          });
        }
        return next;
      });
    };
  },[]);
  // Persisted setters dùng thay cho raw setters khi truyền xuống module
  const setQuotesP        = React.useMemo(()=>makePersistedSetter("quotes",setQuotes),[makePersistedSetter]);
  const setBookingsP      = React.useMemo(()=>makePersistedSetter("bookings",setBookings),[makePersistedSetter]);
  const setCreditsP       = React.useMemo(()=>makePersistedSetter("credits",setCredits),[makePersistedSetter]);
  const setTasksP         = React.useMemo(()=>makePersistedSetter("tasks",setTasks),[makePersistedSetter]);
  const setCareTasksP     = React.useMemo(()=>makePersistedSetter("careTasks",setCareTasks),[makePersistedSetter]);
  const setPersonalTargetsP = React.useMemo(()=>makePersistedSetter("personalTargets",setPersonalTargets),[makePersistedSetter]);
  const setTourGhepProductsP = React.useMemo(()=>makePersistedSetter("tourGhepProducts",setTourGhepProducts),[makePersistedSetter]);
  const [selected, setSelected] = React.useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);
  const [toasts, setToasts] = React.useState([]);

  const currentRole = currentUser?.role || "sale";

  React.useEffect(()=>{
    const onKey=(e)=>{ if((e.ctrlKey||e.metaKey)&&e.key==="k"){ e.preventDefault(); setShowSearch(true); } };
    window.addEventListener("keydown",onKey);
    return ()=>window.removeEventListener("keydown",onKey);
  },[]);

  const pushToast = (msg, type="success", targetRole=null) => {
    const id = Date.now()+Math.random();
    setToasts(t => [...t, {id, msg, type, targetRole}]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  };
  const pushNotif = (msg, type="success", extra={}) => {
    const id = Date.now()+Math.random();
    setNotifs(n => [{id, msg, type, time: new Date().toISOString(), read: false, targetRole: extra.targetRole||null, ...extra}, ...n]);
    pushToast(msg, type, extra.targetRole||null);
  };

  const handleLogin = (u) => { setCurrentUser(u); saveSession && saveSession(u); };
  const doLogout = () => { setCurrentUser(null); saveSession && saveSession(null); setShowLogoutConfirm(false); };

  const handleCreateOrder = async (data) => {
    const newId = "DH"+Date.now().toString().slice(-6);
    const newOrder = {...data, id:newId, createdAt:new Date().toISOString(), status:data.status||"pending_payment", totalPaid:data.depositAmount||0, auditLog:[{ts:new Date().toISOString(),by:currentUser?.name,action:"Tạo đơn hàng"}]};
    try {
      await saveOrder(newOrder);
      const orderName = (data.tourName||data.serviceName||"");
      pushNotif("Đã tạo đơn "+newId+" — "+orderName, "success", {orderId:newId, createdBy:currentUser?.name, sale:data.sale||currentUser?.name});
      // Gửi thông báo cross-session qua Supabase
      const baseMsg = `${currentUser?.name||"Sale"} vừa tạo đơn ${newId}${orderName?" — "+orderName:""}`;
      await Promise.allSettled([
        saveNotification({ id:"N"+Date.now()+"_kt",  msg:baseMsg, type:"info", targetRole:"accountant", createdBy:currentUser?.name, orderId:newId }),
        saveNotification({ id:"N"+Date.now()+"_gd",  msg:baseMsg, type:"info", targetRole:"manager",    createdBy:currentUser?.name, orderId:newId }),
        saveNotification({ id:"N"+Date.now()+"_all", msg:baseMsg, type:"info", targetRole:null,         createdBy:currentUser?.name, orderId:newId }),
      ]);
    } catch(err) {
      pushToast("⚠️ Lưu DB lỗi: "+err.message, "error");
      console.error("[handleCreateOrder]", err);
    }
    if(data.depositAmount>0){
      saveVoucher({id:"V"+Date.now(),orderId:newId,type:"thu",amount:data.depositAmount,method:"cash",note:"Tiền cọc khi tạo đơn",date:new Date().toISOString().slice(0,10),status:"pending",bankAccountId:data.invoiceType==="invoice"?"TK001":"TK002",createdBy:currentUser?.name,createdAt:new Date().toISOString()});
    }
    if(!data.customerId&&data.customerName){
      saveCustomer({id:"KH-"+Date.now(),name:data.customerName,phone:data.customerPhone,email:data.customerEmail||"",cccd:data.cccd||"",customerType:data.customerType||"personal",source:data.source||"Khác",tags:[],notes:"",createdAt:new Date().toISOString()});
    }
    setView("orders");
  };
  const handleUpdateOrder = (updated) => {
    const prevOrder=orders.find(o=>o.id===updated.id);
    let finalOrder=updated;
    if(prevOrder&&updated.status!==prevOrder.status){
      const STATUS_LABEL={pending_payment:"Chờ thanh toán",confirmed:"Đã xác nhận",in_progress:"Đang chạy",closed:"Đã đóng",cancelled:"Đã hủy"};
      const entry={ts:new Date().toISOString(),by:currentUser?.name||"?",action:"Đổi trạng thái: "+(STATUS_LABEL[prevOrder.status]||prevOrder.status)+" → "+(STATUS_LABEL[updated.status]||updated.status)};
      finalOrder={...updated,auditLog:[...(updated.auditLog||[]),entry]};
    }
    // Đảm bảo passengers được lưu đúng vào pax.passengers cho Supabase
    if(Array.isArray(finalOrder.passengers)){
      finalOrder={...finalOrder, pax:{...(finalOrder.pax||{}), passengers:finalOrder.passengers}};
    }
    saveOrder(finalOrder).catch(e=>{
      console.error('[handleUpdateOrder] saveOrder failed:',e.message);
      pushToast("Cảnh báo: "+e.message,"warning");
    });
    setSelected(finalOrder);
  };
  const handleAddVoucher = (v) => {
    saveVoucher(v);
    const order=orders.find(o=>o.id===v.orderId);
    if(order){
      const entry={ts:new Date().toISOString(),by:currentUser?.name||"?",action:(v.type==="thu"?"Tạo phiếu thu ":"Tạo phiếu chi ")+v.id+" — "+(v.amount||0).toLocaleString("vi-VN")+"₫"};
      saveOrder({...order,auditLog:[...(order.auditLog||[]),entry]}).catch(e=>console.error("[addVoucher order]",e.message));
    }

    // ── Tự động tạo Task liên thông Công việc ──────────────
    const isThu = v.type==="thu";
    const amount = (v.amount||0).toLocaleString("vi-VN");

    // Xác định người nhận task và targetRole thông báo
    let assignee, targetRole, taskTitle, taskDesc;
    if(isThu){
      // Phiếu thu (sale tạo) → KT trưởng duyệt
      assignee = userAccounts.find(u=>u.role==="accountant"&&u.active!==false)?.name || "Kế toán";
      targetRole = "accountant";
      taskTitle = `Duyệt phiếu thu ${v.id} — ${amount}₫`;
      taskDesc = `Sale ${currentUser?.name||"—"} ghi nhận KH thanh toán.\nĐơn: ${v.orderId||"—"} · Số tiền: ${amount}₫\nHình thức: ${v.method==="cash"?"Tiền mặt":"Chuyển khoản"}\nGhi chú: ${v.note||"—"}`;
    } else {
      // Phiếu chi → TOÀN BỘ do Ban Giám đốc (GĐ + PGĐ) duyệt, không phân ngưỡng
      assignee = userAccounts.find(u=>u.role==="manager"&&u.active!==false)?.name
              || userAccounts.find(u=>u.role==="pho_giam_doc"&&u.active!==false)?.name
              || "Ban Giám đốc";
      targetRole = "manager";
      taskTitle = `Ban GĐ duyệt phiếu chi ${v.id} — ${amount}₫`;
      taskDesc = `${currentUser?.name||"—"} lập phiếu chi NCC/chi phí.\nĐơn: ${v.orderId||"—"} · NCC: ${v.ncc||"—"} · Số tiền: ${amount}₫\nGhi chú: ${v.note||"—"}`;
    }

    const autoTask = {
      id: "TASK-V-"+Date.now(),
      title: taskTitle,
      description: taskDesc,
      priority: (v.amount||0)>=5000000?"urgent":"normal",
      status: "new",
      assignee,
      orderId: v.orderId||"",
      createdBy: currentUser?.name,
      dueDate: new Date(Date.now()+86400000).toISOString().slice(0,10),
      tags: [isThu?"phieu-thu":"phieu-chi","auto"],
      comments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setTasksP(prev=>[autoTask,...(prev||[])]);

    // ── Gửi thông báo cross-session qua Supabase realtime ──
    const notifMsg = `${currentUser?.name||"—"} vừa tạo ${isThu?"phiếu thu":"phiếu chi"} ${v.id} — ${amount}₫ · Cần duyệt`;
    const ts = Date.now();
    Promise.allSettled([
      // Gửi cho đúng role cần duyệt
      saveNotification({ id:`N${ts}_${targetRole}`, msg:notifMsg, type:"info", targetRole, createdBy:currentUser?.name, orderId:v.orderId||null }),
      // Gửi thêm cho manager nếu chưa là target (để GĐ luôn biết)
      targetRole!=="manager" && saveNotification({ id:`N${ts}_mgr`, msg:notifMsg, type:"info", targetRole:"manager", createdBy:currentUser?.name, orderId:v.orderId||null }),
    ]).catch(()=>{});

    // Toast chỉ cho người tạo
    pushToast(`Đã tạo ${v.id} — Chờ ${targetRole==="manager"?"Giám đốc":"Kế toán"} duyệt`, "success");
  };
  const handleApprove = (id) => {
    let approvedV=null;
    const updatedVouchers=vouchers.map(v=>{ if(v.id===id){approvedV={...v,status:"approved"}; return approvedV;} return v; });
    if(!approvedV) return;
    saveVoucher(approvedV);
    if(approvedV.type==="thu"&&approvedV.orderId){
      const order=orders.find(o=>o.id===approvedV.orderId);
      if(order){
        const totalPaid=updatedVouchers.filter(v=>v.orderId===order.id&&v.type==="thu"&&["approved","confirmed"].includes(v.status)).reduce((s,v)=>s+(v.amount||0),0);
        // Tổng thực tế = giá gốc + addon
        const addonTotal=(order.additionalItems||[]).reduce((s,i)=>s+(i.totalPrice||0),0);
        const grandTotal=(order.totalPrice||0)+addonTotal;
        let newStatus=order.status;
        if(totalPaid>=grandTotal&&grandTotal>0) newStatus="confirmed";
        else if(totalPaid>0&&order.status==="pending_payment") newStatus="pending_payment";
        const entry={ts:new Date().toISOString(),by:currentUser?.name||"?",action:"Duyệt phiếu thu "+id+" — đã thu "+totalPaid.toLocaleString("vi-VN")+"₫ / "+grandTotal.toLocaleString("vi-VN")+"₫"+(newStatus!==order.status?" → Đơn đã xác nhận":"")};
        saveOrder({...order,totalPaid,status:newStatus,auditLog:[...(order.auditLog||[]),entry]}).catch(e=>console.error("[approve order]",e.message));
        pushToast("Phiếu thu "+id+" đã duyệt — Đơn "+order.id+" · "+totalPaid.toLocaleString("vi-VN")+"₫","success");
      }
    } else {
      pushToast("Đã duyệt phiếu "+id,"success");
    }
    if(approvedV.type==="chi") pushToast("Đã duyệt phiếu chi "+id,"success");
  };
  const handleReject = (id) => { const v=vouchers.find(x=>x.id===id); if(v) saveVoucher({...v,status:"rejected"}); pushNotif("Đã từ chối phiếu "+id,"error"); };
  const handleExpenseUpdate = (exp) => {
    saveExpense(exp);
    // Khi paid → cập nhật cong_no NCC
    if(exp.status==="paid"&&(exp.nccId||exp.supplierId)){
      const nccId=exp.nccId||exp.supplierId;
      const supplier=suppliers.find(s=>s.id===nccId);
      if(supplier){
        const nccExpenses=expenses.map(e=>e.id===exp.id?exp:e);
        const newDebt=nccExpenses.filter(e=>(e.nccId===nccId||e.supplierId===nccId)&&!["paid","rejected"].includes(e.status)).reduce((s,e)=>s+(e.amount||0),0);
        updateSupplier(nccId,{cong_no:newDebt});
      }
    }
    if(exp.status==="pending_pay") pushToast("Phiếu chi "+exp.id+" đã duyệt — KT Quỹ cần chuyển tiền","info","cashier");
    if(exp.status==="pending_gd") pushToast("Phiếu chi "+exp.id+" cần GĐ phê duyệt","warn","manager");
  };
  const handleDeleteOrder = (o) => {
    if(currentRole!=="manager"){ pushToast("Chỉ Giám đốc mới được xóa đơn","error"); return; }
    removeOrder(o.id).catch(e=>{ console.error("[deleteOrder]",e.message); pushToast("Xóa lỗi: "+e.message,"error"); });
    pushToast("Đã xóa đơn "+o.id,"success");
    setSelected(null);
    setView("orders");
  };
  const handleCloseOrder = (o) => {
    saveOrder(o).catch(e=>{ console.error("[closeOrder]",e.message); pushToast("Cảnh báo lưu: "+e.message,"warning"); });
    // Giải phóng HDV nếu có
    if(o.hdvId){
      const hdv=hdvList.find(h=>h.id===o.hdvId);
      if(hdv){
        setHdvList(prev=>prev.map(h=>h.id===o.hdvId?{...h,available:true}:h));
        pushToast("HDV "+hdv.name+" đã sẵn sàng nhận tour mới","info","dieu_hanh");
      }
    }
    // Tự động tạo care task
    const newTask={id:"TASK-"+Date.now(),orderId:o.id,customer:o.customerName,type:"feedback",title:"Xin phản hồi sau tour — "+(o.tourName||o.service),dueDate:new Date(Date.now()+3*86400000).toISOString().slice(0,10),assignee:o.sale,done:false,note:"Tự động tạo khi đóng đơn",createdAt:new Date().toISOString()};
    setCareTasksP(prev=>[...(prev||[]),newTask]);
    setSelected(null);
    setView("closeorders");
  };
  const handleRefundCreate = (r) => saveRefund(r);
  const handleRefundUpdate = (r) => {
    saveRefund(r);
    // Khi hoàn tiền paid → order chuyển cancelled
    if(r.status==="paid"&&r.orderId){
      const order=orders.find(o=>o.id===r.orderId);
      if(order&&order.status!=="cancelled"){
        saveOrder({...order,status:"cancelled",cancelledAt:new Date().toISOString(),cancelReason:r.reason||"Hoàn tiền",
          auditLog:[...(order.auditLog||[]),{ts:new Date().toISOString(),by:currentUser?.name||"?",action:"Đơn hủy — Hoàn tiền "+(r.refundAmount||0).toLocaleString("vi-VN")+"₫ · Ref: "+r.id}]}).catch(e=>console.error("[refundUpdate]",e.message));
        pushToast("Đơn "+order.id+" đã hủy sau khi hoàn tiền "+(r.refundAmount||0).toLocaleString("vi-VN")+"đ","info","sale");
      }
    }
  };
  const handleUpdateCurrentUser = (u) => { setCurrentUser(u); saveUser(u)?.catch?.(e=>console.error("[updateProfile]",e.message)); saveSession && saveSession(u); };

  const pendingApprovals = expenses.filter(e=>["pending_kt","pending_gd","pending_pay"].includes(e.status)).length + vouchers.filter(v=>v.status==="pending").length;
  const pendingRefunds = (refunds||[]).filter(r=>r.status==="pending").length;
  const pendingCare = (careTasks||[]).filter(t=>!t.done).length;
  const unreadCount = notifs.filter(n=>(!n.targetRole||n.targetRole===currentRole||(n.targetRole==="manager"&&currentRole==="pho_giam_doc"))&&!n.read).length;

  if(dbLoading && !orders.length){
    return(
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",flexDirection:"column",gap:12}}>
        <div style={{width:36,height:36,border:"3px solid #bfdbfe",borderTop:"3px solid #1e3a8a",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
        <div style={{fontSize:14,color:"#64748b"}}>Đang tải dữ liệu...</div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if(!currentUser){
    return <LoginPage onLogin={handleLogin} onVerify={verifyLogin}/>;
  }

  return (
    <AppShell
      sidebarOpen={sidebarOpen}
      onCloseSidebar={()=>setSidebarOpen(false)}
      sidebar={<Sidebar view={view} setView={setView} currentRole={currentRole} currentUser={currentUser} pendingApprovals={pendingApprovals} pendingRefunds={pendingRefunds} pendingCare={pendingCare} pendingThu={vouchers.filter(v=>v.type==="thu"&&v.status==="pending").length} pendingPay={expenses.filter(e=>e.status==="pending_pay").length} activeOrders={orders.filter(o=>o.sale===currentUser?.name&&!["closed","cancelled"].includes(o.status)).length} expiringQuotes={(quotes||[]).filter(q=>{if(!q.validUntil||q.status!=="sent")return false;const d=Math.ceil((new Date(q.validUntil)-new Date())/86400000);return d>=0&&d<=3;}).length} isOpen={sidebarOpen} onClose={()=>setSidebarOpen(false)} perms={getEffectivePerms(currentUser)}/>}
      topbar={<TopBar currentUser={currentUser} currentRole={currentRole} unreadCount={unreadCount} onNotif={()=>setShowNotif(v=>!v)} onSearch={()=>setShowSearch(true)} onProfile={()=>setView("profile")} onLogout={()=>setShowLogoutConfirm(true)} onMenuToggle={()=>setSidebarOpen(v=>!v)}/>}
    >
    <div key={view} className="page-enter">
      {view==="dashboard"&&isBanGiamDoc(currentRole)&&<DirectorDashboard orders={orders} vouchers={vouchers} expenses={expenses} personalTargets={personalTargets} onUpdateTargets={setPersonalTargetsP} userAccounts={userAccounts} customers={customers} setView={setView} setSelected={setSelected} bankAccounts={bankAccounts} bookings={bookings} quotes={quotes||[]}/>}
      {view==="dashboard"&&(currentRole==="accountant"||currentRole==="cashier")&&<AccountantDashboard orders={orders} vouchers={vouchers} expenses={expenses} refunds={refunds} credits={credits||[]} bankAccounts={bankAccounts} setView={setView} onViewOrder={(o)=>{setSelected(o);setView("detail");}}/>}
      {view==="dashboard"&&(currentRole==="sale"||currentRole==="dieu_hanh")&&<SaleDashboard currentUser={currentUser} orders={orders} vouchers={vouchers} quotes={quotes} personalTargets={personalTargets} careTasks={careTasks} bookings={bookings} setView={setView} setSelected={setSelected}/>}

      {view==="orders"&&<OrderList orders={orders} vouchers={vouchers} onView={o=>{setSelected(o);setView("detail");}} onCreate={()=>setView("create")} onQuickSale={()=>setView("quicksale")} currentRole={currentRole} currentUser={currentUser}/>}
      {view==="create"&&<OrderForm onSave={handleCreateOrder} onCancel={()=>setView("orders")} pushNotif={pushToast} defaultSale={currentUser.name} currentRole={currentRole} customers={customers} onCreateCustomer={saveCustomer} tourPrograms={tourPrograms} tourGhepProducts={tourGhepProducts||[]} orders={orders} currentUser={currentUser} userAccounts={userAccounts}/>}
      {view==="quicksale"&&<QuickSaleForm onSave={(d)=>{handleCreateOrder(d);}} onCancel={()=>setView("orders")} customers={customers} suppliers={suppliers} currentUser={currentUser} userAccounts={userAccounts} tourGhepProducts={tourGhepProducts||[]}/>}
      {view==="detail"&&selected&&<OrderDetail order={selected} vouchers={vouchers} expenses={expenses} refunds={refunds} onBack={()=>setView("orders")} onUpdate={handleUpdateOrder} onDelete={handleDeleteOrder} onAddVoucher={handleAddVoucher} onApprove={handleApprove} onReject={handleReject} pushNotif={pushToast} currentRole={currentRole} bankAccounts={bankAccounts} currentUser={currentUser} hdvList={hdvList} credits={credits} onUpdateCredits={setCreditsP} bookings={bookings} customers={customers} suppliers={suppliers} onAddSupplier={addSupplier}/>}

      {view==="crm"&&<CrmModule orders={orders} pushNotif={pushToast} customers={customers} onUpdateCustomers={setCustomers} currentUser={currentUser} msgHistory={msgHistory} onLogMessage={rec=>setMsgHistory(h=>[rec,...h].slice(0,500))} onCreateOrderFromLead={()=>setView("create")} onViewOrder={(o)=>{setSelected(o);setView("detail");}}/>}
      {view==="tourops"&&<TourOpsModule orders={orders} pushNotif={pushToast} currentUser={currentUser} currentRole={currentRole} hdvList={hdvList} onUpdateOrder={handleUpdateOrder}/>}
      {view==="tourprogram"&&<TourProgramModule tourPrograms={tourPrograms} onUpdate={setTourPrograms} currentRole={currentRole} pushNotif={pushToast} currentUser={currentUser}/>}
      {view==="hdv"&&<HDVModule hdvList={hdvList} onUpdate={setHdvList} orders={orders} pushNotif={pushToast} currentRole={currentRole}/>}
      {view==="quotes"&&<QuoteModule quotes={quotes} onUpdate={setQuotesP} orders={orders} tourPrograms={tourPrograms} currentUser={currentUser} pushNotif={pushToast} onCreateOrder={(data)=>{handleCreateOrder(data);}}/>}
      {(view==="accounting"||view==="finance")&&<AccountingDashboard orders={orders} vouchers={vouchers} expenses={expenses} refunds={refunds} bankAccounts={bankAccounts} onUpdateBankAccounts={setBankAccounts} outputInvoices={outputInvoices} onUpdateOutputInvoices={setOutputInvoices} inputInvoices={inputInvoices} onUpdateInputInvoices={setInputInvoices} suppliers={suppliers} pushNotif={pushToast}/>}
      {view==="ncc"&&<SupplierModule suppliers={suppliers} onAddSupplier={addSupplier} onUpdateSupplier={updateSupplier} onDeleteSupplier={deleteSupplier} orders={orders} vouchers={vouchers} expenses={expenses} pushNotif={pushToast} currentRole={currentRole} currentUser={currentUser} bookings={bookings} onUpdateBookings={setBookingsP} onCreateExpense={(exp)=>{saveExpense(exp);pushToast("Phiếu chi "+exp.id+" chờ KT duyệt","warning");}}/>}
      {view==="approvals"&&<ApprovalsModule orders={orders} expenses={expenses} vouchers={vouchers} onExpenseUpdate={handleExpenseUpdate} onVoucherUpdate={saveVoucher} pushNotif={pushToast} currentRole={currentRole} currentUser={currentUser} approvalThreshold={approvalThreshold}/>}
      {view==="refunds"&&<RefundModule orders={orders} vouchers={vouchers} refunds={refunds} onRefundUpdate={handleRefundUpdate} onRefundCreate={handleRefundCreate} pushNotif={pushToast} currentRole={currentRole} currentUser={currentUser}/>}
      {view==="credits"&&<CreditModule orders={orders} pushNotif={pushToast} credits={credits} onUpdateCredits={setCreditsP} currentUser={currentUser}/>}
      {view==="closeorders"&&<CloseOrderModule orders={orders} vouchers={vouchers} expenses={expenses} refunds={refunds} onCloseOrder={handleCloseOrder} pushNotif={pushToast} currentRole={currentRole} currentUser={currentUser}/>}
      {view==="users"&&getEffectivePerms(currentUser).includes("users")&&<UserManagementPage userAccounts={userAccounts} onUpdateAccounts={setUserAccounts} saveUser={saveUser} removeUser={removeUser} currentUser={currentUser} pushNotif={pushToast} personalTargets={personalTargets} onUpdateTargets={setPersonalTargetsP} approvalThreshold={approvalThreshold} onUpdateThreshold={setApprovalThreshold}/>}
      {view==="reports"&&<ReportModule orders={orders} vouchers={vouchers} expenses={expenses} personalTargets={personalTargets} currentRole={currentRole} hdvList={hdvList} customers={customers} userAccounts={userAccounts} bookings={bookings}/>}
      {view==="tourghep"&&canAccessTourGhep(currentUser)&&<TourGhepModule tourGhepProducts={tourGhepProducts} onUpdateTourGhepProducts={setTourGhepProductsP} orders={orders} suppliers={suppliers} onCreateOrder={(prefill)=>{ handleCreateOrder(prefill); }} pushNotif={pushToast} currentRole={currentRole} currentUser={currentUser}/>}
      {view==="tourghep"&&!canAccessTourGhep(currentUser)&&<div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"60vh",gap:12,color:"#94a3b8"}}><div style={{fontSize:48}}>🔒</div><div style={{fontSize:16,fontWeight:600}}>Bạn không có quyền truy cập Module Tour Ghép</div><div style={{fontSize:13}}>Liên hệ Giám đốc để được cấp quyền.</div></div>}
      {view==="aftercare"&&<AfterSaleModule careTasks={careTasks} onUpdateTasks={setCareTasksP} orders={orders} customers={customers} currentUser={currentUser} currentRole={currentRole} pushNotif={pushToast}/>}
      {view==="tasks"&&<TaskModule tasks={tasks} onUpdateTasks={setTasksP} orders={orders} customers={customers} currentUser={currentUser} currentRole={currentRole} userAccounts={userAccounts} pushNotif={pushToast}/>}
      {view==="deploy"&&getEffectivePerms(currentUser).includes("deploy")&&<DeployPanel deploySteps={deploySteps} onUpdateSteps={setDeploySteps}/>}
      {view==="profile"&&<ProfilePage currentUser={currentUser} onUpdate={handleUpdateCurrentUser} onBack={()=>setView("dashboard")} pushNotif={pushToast} verifyLogin={verifyLogin}/>}
      {view==="banks"&&<BankAccountModule bankAccounts={bankAccounts} onUpdate={setBankAccounts} pushNotif={pushToast}/>}
    </div>

      {showNotif&&(
        <NotifPanel notifs={notifs} onClose={()=>setShowNotif(false)} onMarkRead={()=>setNotifs(n=>n.map(x=>({...x,read:true})))} currentRole={currentRole} currentUser={currentUser}
          onNav={(orderId)=>{
            const o=orders.find(x=>x.id===orderId);
            if(o){setSelected(o);setView("detail");}
            setShowNotif(false);
            setNotifs(n=>n.map(x=>x.orderId===orderId?{...x,read:true}:x));
          }}/>
      )}
      {showSearch&&(
        <GlobalSearch orders={orders} customers={customers} suppliers={suppliers} hdvList={hdvList} onClose={()=>setShowSearch(false)}
          onSelectOrder={(o)=>{setSelected(o);setView("detail");setShowSearch(false);}}
          onSelectCustomer={()=>{setView("crm");setShowSearch(false);}}
          setView={(v)=>{setView(v);setShowSearch(false);}}/>
      )}

      {showLogoutConfirm&&(
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowLogoutConfirm(false)}>
          <div className="modal-panel" style={{padding:28,width:360,textAlign:"center"}}>
            <div style={{fontSize:32,marginBottom:12}}>🚪</div>
            <div style={{fontWeight:700,fontSize:16,marginBottom:8}}>Đăng xuất khỏi hệ thống?</div>
            <div style={{fontSize:13,color:"#64748b",marginBottom:20}}>Bạn sẽ cần đăng nhập lại để tiếp tục sử dụng.</div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={doLogout} style={{flex:1,background:"#ef4444",color:"#fff",border:"none",borderRadius:10,padding:11,cursor:"pointer",fontWeight:700,transition:"transform .12s"}} onMouseDown={e=>e.currentTarget.style.transform="scale(.96)"} onMouseUp={e=>e.currentTarget.style.transform="scale(1)"}>Đăng xuất</button>
              <button onClick={()=>setShowLogoutConfirm(false)} style={{flex:1,background:"#f1f5f9",border:"none",borderRadius:10,padding:11,cursor:"pointer",fontWeight:600,transition:"transform .12s"}} onMouseDown={e=>e.currentTarget.style.transform="scale(.96)"} onMouseUp={e=>e.currentTarget.style.transform="scale(1)"}>Hủy</button>
            </div>
          </div>
        </div>
      )}

      <div style={{position:"fixed",bottom:24,right:24,zIndex:9999,display:"flex",flexDirection:"column",gap:10,alignItems:"flex-end"}}>
        {toasts.filter(t=>!t.targetRole||t.targetRole===currentRole||(t.targetRole==="manager"&&currentRole==="pho_giam_doc")).map(t => (
          <div key={t.id} className="toast-enter" style={{background:t.type==="error"?"#ef4444":t.type==="warning"?"#d97706":t.type==="info"?"#0284c7":"#16a34a",color:"#fff",padding:"12px 20px",borderRadius:10,boxShadow:"0 8px 24px rgba(0,0,0,.18)",fontSize:13,fontWeight:600,maxWidth:340,display:"flex",alignItems:"center",gap:8}}>
            <span>{t.type==="error"?"❌":t.type==="warning"?"⚠️":t.type==="info"?"ℹ️":"✅"}</span>{t.msg}
          </div>
        ))}
      </div>
    </AppShell>
  );
}
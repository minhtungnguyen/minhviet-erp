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
import { DEFAULT_CHECKLIST } from "./constants/checklist.js";
import { PERMISSION_GROUPS, ALL_PERM_KEYS, PERM_LABEL, ROLE_DEFAULT_PERMS, isBanGiamDoc, getEffectivePerms, canSeeTourGhepSensitive, canAccessTourGhep } from "./utils/permissions.js";
import { NumberInput, fmtNum } from "./components/ui.jsx";
import CloseOrderModule from "./modules/CloseOrderModule.jsx";
import QuoteModule from "./modules/QuoteModule.jsx";
import TourProgramModule from "./modules/TourProgramModule.jsx";
import BankAccountModule from "./modules/BankAccountModule.jsx";
import TourGhepModule from "./modules/TourGhepModule.jsx";
import SupplierModule from "./modules/SupplierModule.jsx";
import HDVModule from "./modules/HDVModule.jsx";
import TaskModule from "./modules/TaskModule.jsx";
import AfterSaleModule from "./modules/AfterSaleModule.jsx";
import TourOpsModule from "./modules/TourOpsModule.jsx";
import RefundModule from "./modules/RefundModule.jsx";
import CreditModule from "./modules/CreditModule.jsx";
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
// Parse chuỗi số có dấu chấm phân cách về số nguyên
const parseNum = (s) => parseInt(String(s).replace(/\./g,"").replace(/[^\d]/g,""),10)||0;
// Format số khi nhập: tự thêm dấu chấm mỗi 3 chữ số
const formatInputNum = (s) => {
  const raw = String(s).replace(/\./g,"").replace(/[^\d]/g,"");
  return raw ? parseInt(raw,10).toLocaleString("vi-VN") : "";
};
// NumberInput moved to src/components/ui.jsx (shared, used across many modules)


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

// canSeeTourGhepSensitive / canAccessTourGhep moved to ./utils/permissions.js



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

// FINANCE PANEL — Kế toán view inside an order

// ═══════════════════════════════════════════════════════════

function calcOrderTotal(order){ return (order?.totalPrice||0); }
function calcDebt(order, vouchers){ return (order?.totalPrice||0) - (order?.totalPaid||0); }
const loadSession = () => { try { const s = sessionStorage.getItem("mv_user"); return s ? JSON.parse(s) : null; } catch(e){ return null; } };
const saveSession = (u) => { try { if(u) sessionStorage.setItem("mv_user", JSON.stringify(u)); else sessionStorage.removeItem("mv_user"); } catch(e){} };




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
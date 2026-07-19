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
import { SERVICE_TYPES } from "./constants/serviceTypes.js";
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
import NotifPanel from "./modules/NotifPanel.jsx";
import GlobalSearch from "./modules/GlobalSearch.jsx";
import DeployPanel from "./modules/DeployPanel.jsx";
import AccountingDashboard from "./modules/AccountingDashboard.jsx";
import OrderForm from "./modules/OrderForm.jsx";
import QuickSaleForm from "./modules/QuickSaleForm.jsx";
import OrderList from "./modules/OrderList.jsx";
import OrderDetail from "./modules/OrderDetail.jsx";
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

const loadSession = () => { try { const s = sessionStorage.getItem("mv_user"); return s ? JSON.parse(s) : null; } catch(e){ return null; } };
const saveSession = (u) => { try { if(u) sessionStorage.setItem("mv_user", JSON.stringify(u)); else sessionStorage.removeItem("mv_user"); } catch(e){} };








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
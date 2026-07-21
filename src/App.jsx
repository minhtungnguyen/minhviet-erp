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
import { ORDER_STATUS } from "./constants/statuses.js";
import { PERMISSION_GROUPS, ALL_PERM_KEYS, PERM_LABEL, ROLE_DEFAULT_PERMS, isBanGiamDoc, getEffectivePerms, canSeeTourGhepSensitive, canAccessTourGhep } from "./utils/permissions.js";
import { isNotifRead, isNotifVisible } from "./utils/notifications.js";
import { overlayCloseHandlers } from "./utils/modalOverlay.js";
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
import ProfilePage from "./modules/ProfilePage.jsx";
import UserManagementPage from "./modules/UserManagementPage.jsx";
import ReportModule from "./modules/ReportModule.jsx";
import SaleDashboard from "./modules/SaleDashboard.jsx";
import DirectorDashboard from "./modules/DirectorDashboard.jsx";
import AccountantDashboard from "./modules/AccountantDashboard.jsx";
import CrmModule from "./modules/CrmModule.jsx";
import ApprovalsModule from "./modules/ApprovalsModule.jsx";



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
const HDV_LIST = [];

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

const loadSession = () => { try { const s = sessionStorage.getItem("mv_user"); return s ? JSON.parse(s) : null; } catch(e){ return null; } };
const saveSession = (u) => { try { if(u) sessionStorage.setItem("mv_user", JSON.stringify(u)); else sessionStorage.removeItem("mv_user"); } catch(e){} };

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
    saveOrder, removeOrder, saveVoucher, saveExpense, saveRefund, saveCustomer, saveUser, removeUser, saveNotification, markNotifRead,
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
  const collSetters = { quotes:setQuotes, bookings:setBookings, credits:setCredits, tasks:setTasks, careTasks:setCareTasks, personalTargets:setPersonalTargets, tourGhepProducts:setTourGhepProducts, hdvList:setHdvList };
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
  const setHdvListP       = React.useMemo(()=>makePersistedSetter("hdvList",setHdvList),[makePersistedSetter]);
  const [selected, setSelected] = React.useState(null);
  const [taskPrefill, setTaskPrefill] = React.useState(null);
  const [openTaskId, setOpenTaskId] = React.useState(null);
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
    if(data.customerName&&data.customerPhone){
      const existingCustomer=customers.find(c=>c.phone===data.customerPhone||c.sdt===data.customerPhone);
      if(existingCustomer){
        saveCustomer({...existingCustomer,
          email:existingCustomer.email||data.customerEmail||"",
          cccd:existingCustomer.cccd||data.cccd||"",
          province:existingCustomer.province||data.customerProvince||"",
          totalOrders:(existingCustomer.totalOrders||0)+1,
          lastOrderDate:new Date().toISOString().slice(0,10),
        });
      } else if(!data.customerId){
        saveCustomer({
          id:"KH-"+Date.now(),
          type:"personal",
          customerType:data.customerType||"personal",
          invoiceType:data.invoiceType||"no_invoice",
          name:data.customerName,
          phone:data.customerPhone,
          email:data.customerEmail||"",
          province:data.customerProvince||"",
          cccd:data.cccd||"",
          companyName:data.companyName||"",
          taxCode:data.taxCode||"",
          source:data.source||"Khác",
          tags:[],notes:"",
          totalOrders:1,totalRevenue:0,totalProfit:0,
          firstOrderDate:new Date().toISOString().slice(0,10),
          lastOrderDate:new Date().toISOString().slice(0,10),
          createdAt:new Date().toISOString(),
        });
      }
    }
    setView("orders");
  };
  const handleUpdateOrder = (updated) => {
    const prevOrder=orders.find(o=>o.id===updated.id);
    let finalOrder=updated;
    if(prevOrder&&updated.status!==prevOrder.status){
      const entry={ts:new Date().toISOString(),by:currentUser?.name||"?",action:"Đổi trạng thái: "+(ORDER_STATUS[prevOrder.status]?.label||prevOrder.status)+" → "+(ORDER_STATUS[updated.status]?.label||updated.status)};
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
    // Khi paid → đồng bộ trạng thái booking liên kết (nếu không, "Công nợ NCC" trên OrderDetail vẫn tính booking là chưa trả)
    if(exp.status==="paid"&&exp.bookingId){
      setBookingsP(prev=>(prev||[]).map(b=>b.id===exp.bookingId?{...b,status:"paid"}:b));
    }
    if(exp.status==="pending_pay") pushToast("Phiếu chi "+exp.id+" đã duyệt — KT Quỹ cần chuyển tiền","info","cashier");
    if(exp.status==="pending_gd") pushToast("Phiếu chi "+exp.id+" cần GĐ phê duyệt","warn","manager");
  };
  const handleDeleteOrder = (o) => {
    if(!isBanGiamDoc(currentRole)){ pushToast("Chỉ Ban Giám đốc mới được xóa đơn","error"); return; }
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
        setHdvListP(prev=>prev.map(h=>h.id===o.hdvId?{...h,available:true}:h));
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
  const unreadCount = notifs.filter(n=>isNotifVisible(n,currentUser,currentRole)&&!isNotifRead(n)).length;

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
      {view==="detail"&&selected&&<OrderDetail order={selected} vouchers={vouchers} expenses={expenses} refunds={refunds} onBack={()=>setView("orders")} onUpdate={handleUpdateOrder} onDelete={handleDeleteOrder} onAddVoucher={handleAddVoucher} onApprove={handleApprove} onReject={handleReject} pushNotif={pushToast} currentRole={currentRole} bankAccounts={bankAccounts} currentUser={currentUser} hdvList={hdvList} credits={credits} onUpdateCredits={setCreditsP} bookings={bookings} customers={customers} suppliers={suppliers} onAddSupplier={addSupplier} tasks={tasks} onViewTasks={()=>setView("tasks")} onQuickAddTask={(prefill)=>{setTaskPrefill(prefill);setView("tasks");}}/>}

      {view==="crm"&&<CrmModule orders={orders} pushNotif={pushToast} customers={customers} onUpdateCustomers={setCustomers} currentUser={currentUser} msgHistory={msgHistory} onLogMessage={rec=>setMsgHistory(h=>[rec,...h].slice(0,500))} onCreateOrderFromLead={()=>setView("create")} onViewOrder={(o)=>{setSelected(o);setView("detail");}} tasks={tasks} onViewTasks={()=>setView("tasks")} onQuickAddTask={(prefill)=>{setTaskPrefill(prefill);setView("tasks");}}/>}
      {view==="tourops"&&<TourOpsModule orders={orders} pushNotif={pushToast} currentUser={currentUser} currentRole={currentRole} hdvList={hdvList} onUpdateOrder={handleUpdateOrder}/>}
      {view==="tourprogram"&&<TourProgramModule tourPrograms={tourPrograms} onUpdate={setTourPrograms} currentRole={currentRole} pushNotif={pushToast} currentUser={currentUser}/>}
      {view==="hdv"&&<HDVModule hdvList={hdvList} onUpdate={setHdvListP} orders={orders} pushNotif={pushToast} currentRole={currentRole}/>}
      {view==="quotes"&&<QuoteModule quotes={quotes} onUpdate={setQuotesP} orders={orders} tourPrograms={tourPrograms} currentUser={currentUser} pushNotif={pushToast} onCreateOrder={(data)=>{handleCreateOrder(data);}}/>}
      {(view==="accounting"||view==="finance")&&<AccountingDashboard orders={orders} vouchers={vouchers} expenses={expenses} refunds={refunds} bankAccounts={bankAccounts} onUpdateBankAccounts={setBankAccounts} outputInvoices={outputInvoices} onUpdateOutputInvoices={setOutputInvoices} inputInvoices={inputInvoices} onUpdateInputInvoices={setInputInvoices} suppliers={suppliers} pushNotif={pushToast}/>}
      {view==="ncc"&&<SupplierModule suppliers={suppliers} onAddSupplier={addSupplier} onUpdateSupplier={updateSupplier} onDeleteSupplier={deleteSupplier} orders={orders} vouchers={vouchers} expenses={expenses} pushNotif={pushToast} currentRole={currentRole} currentUser={currentUser} bookings={bookings} onUpdateBookings={setBookingsP} onCreateExpense={(exp)=>{saveExpense(exp);pushToast("Phiếu chi "+exp.id+" chờ KT duyệt","warning");}}/>}
      {view==="approvals"&&<ApprovalsModule orders={orders} expenses={expenses} vouchers={vouchers} onExpenseUpdate={handleExpenseUpdate} onVoucherUpdate={(v)=>{ if(v.status==="approved") handleApprove(v.id); else if(v.status==="rejected") handleReject(v.id); else saveVoucher(v); }} pushNotif={pushToast} currentRole={currentRole} currentUser={currentUser} approvalThreshold={approvalThreshold}/>}
      {view==="refunds"&&<RefundModule orders={orders} vouchers={vouchers} refunds={refunds} onRefundUpdate={handleRefundUpdate} onRefundCreate={handleRefundCreate} pushNotif={pushToast} currentRole={currentRole} currentUser={currentUser}/>}
      {view==="credits"&&<CreditModule orders={orders} pushNotif={pushToast} credits={credits} onUpdateCredits={setCreditsP} currentUser={currentUser}/>}
      {view==="closeorders"&&<CloseOrderModule orders={orders} vouchers={vouchers} expenses={expenses} refunds={refunds} onCloseOrder={handleCloseOrder} pushNotif={pushToast} currentRole={currentRole} currentUser={currentUser}/>}
      {view==="users"&&getEffectivePerms(currentUser).includes("users")&&<UserManagementPage userAccounts={userAccounts} onUpdateAccounts={setUserAccounts} saveUser={saveUser} removeUser={removeUser} currentUser={currentUser} pushNotif={pushToast} personalTargets={personalTargets} onUpdateTargets={setPersonalTargetsP} approvalThreshold={approvalThreshold} onUpdateThreshold={setApprovalThreshold}/>}
      {view==="reports"&&<ReportModule orders={orders} vouchers={vouchers} expenses={expenses} personalTargets={personalTargets} currentRole={currentRole} hdvList={hdvList} customers={customers} userAccounts={userAccounts} bookings={bookings}/>}
      {view==="tourghep"&&canAccessTourGhep(currentUser)&&<TourGhepModule tourGhepProducts={tourGhepProducts} onUpdateTourGhepProducts={setTourGhepProductsP} orders={orders} suppliers={suppliers} onCreateOrder={(prefill)=>{ handleCreateOrder(prefill); }} pushNotif={pushToast} currentRole={currentRole} currentUser={currentUser}/>}
      {view==="tourghep"&&!canAccessTourGhep(currentUser)&&<div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"60vh",gap:12,color:"#94a3b8"}}><div style={{fontSize:48}}>🔒</div><div style={{fontSize:16,fontWeight:600}}>Bạn không có quyền truy cập Module Tour Ghép</div><div style={{fontSize:13}}>Liên hệ Giám đốc để được cấp quyền.</div></div>}
      {view==="aftercare"&&<AfterSaleModule careTasks={careTasks} onUpdateTasks={setCareTasksP} orders={orders} customers={customers} currentUser={currentUser} currentRole={currentRole} pushNotif={pushToast}/>}
      {view==="tasks"&&<TaskModule tasks={tasks} onUpdateTasks={setTasksP} orders={orders} customers={customers} currentUser={currentUser} currentRole={currentRole} userAccounts={userAccounts} pushNotif={pushToast} saveNotification={saveNotification} prefill={taskPrefill} onPrefillConsumed={()=>setTaskPrefill(null)} openTaskId={openTaskId} onOpenTaskConsumed={()=>setOpenTaskId(null)}/>}
      {view==="deploy"&&getEffectivePerms(currentUser).includes("deploy")&&<DeployPanel deploySteps={deploySteps} onUpdateSteps={setDeploySteps}/>}
      {view==="profile"&&<ProfilePage currentUser={currentUser} onUpdate={handleUpdateCurrentUser} onBack={()=>setView("dashboard")} pushNotif={pushToast} verifyLogin={verifyLogin}/>}
      {view==="banks"&&<BankAccountModule bankAccounts={bankAccounts} onUpdate={setBankAccounts} pushNotif={pushToast}/>}
    </div>

      {showNotif&&(() => {
        const visibleNotifs = notifs.filter(n=>isNotifVisible(n,currentUser,currentRole))
          .map(n=>({...n, read:isNotifRead(n)}));
        return (
          <NotifPanel notifs={visibleNotifs} onClose={()=>setShowNotif(false)}
            onMarkRead={()=>{
              const ids = visibleNotifs.filter(n=>!n.read).map(n=>n.id);
              setNotifs(prev=>prev.map(x=>ids.includes(x.id) ? {...x, read:true} : x));
              ids.forEach(id=>markNotifRead(id));
            }}
            currentRole={currentRole} currentUser={currentUser}
            onNav={(n)=>{
              if(n.taskId){
                setOpenTaskId(n.taskId);
                setView("tasks");
              } else if(n.orderId){
                const o=orders.find(x=>x.id===n.orderId);
                if(o){setSelected(o);setView("detail");}
              }
              setShowNotif(false);
              setNotifs(prev=>prev.map(x=>x.id===n.id ? {...x, read:true} : x));
              markNotifRead(n.id);
            }}/>
        );
      })()}
      {showSearch&&(
        <GlobalSearch orders={orders} customers={customers} suppliers={suppliers} hdvList={hdvList} onClose={()=>setShowSearch(false)}
          onSelectOrder={(o)=>{setSelected(o);setView("detail");setShowSearch(false);}}
          onSelectCustomer={()=>{setView("crm");setShowSearch(false);}}
          setView={(v)=>{setView(v);setShowSearch(false);}}/>
      )}

      {showLogoutConfirm&&(
        <div className="modal-overlay" {...overlayCloseHandlers(()=>setShowLogoutConfirm(false))}>
          <div className="modal-panel" style={{padding:28,width:360,maxWidth:"90vw",textAlign:"center"}}>
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
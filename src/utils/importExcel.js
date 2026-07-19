// importExcel.js — Parse Excel import files and generate templates
import * as XLSX from "xlsx";

// ─── Customer import ───────────────────────────────────────
// Expected columns (flexible — maps Vietnamese headers)
const CUSTOMER_COL_MAP = {
  // Vietnamese header → field key
  "tên khách hàng": "name",  "tên":       "name",  "họ tên": "name",
  "số điện thoại":  "phone", "điện thoại":"phone", "sđt":   "phone",
  "email":          "email",
  "loại":           "type",  "loại kh":  "type",
  "ngày sinh":      "dob",   "sinh ngày":"dob",    "năm sinh":"dob",
  "tỉnh thành":     "province","tỉnh":   "province","thành phố":"province",
  "cccd":           "cccd",  "cmnd":     "cccd",   "căn cước":"cccd",
  "sale":           "assignedSale", "nhân viên sale":"assignedSale","phụ trách":"assignedSale",
  "nguồn":          "source","kênh khai thác":"source",
  "tên công ty":    "companyName","công ty":"companyName",
  "ghi chú":        "notes", "note":     "notes",
};

// Normalize a single row → customer object
function parseCustomerRow(rawRow, idx) {
  const row = {};
  Object.entries(rawRow).forEach(([k, v]) => {
    const mapped = CUSTOMER_COL_MAP[k.toLowerCase().trim()];
    if (mapped) row[mapped] = String(v ?? "").trim();
  });

  const errors = [];
  if (!row.name)  errors.push("Thiếu tên khách hàng");
  if (!row.phone) errors.push("Thiếu số điện thoại");
  else if (!/^0\d{8,10}$/.test(row.phone.replace(/\s/g,"")))
    errors.push("SĐT không hợp lệ (phải bắt đầu bằng 0, 9-11 số)");

  // Normalize type
  if (row.type) {
    const t = row.type.toLowerCase();
    row.type = t.includes("cty")||t.includes("công ty")||t.includes("company") ? "company" : "personal";
  } else {
    row.type = "personal";
  }

  // Normalize dob: accept DD/MM/YYYY or YYYY-MM-DD or Excel serial number
  if (row.dob) {
    const d = row.dob.trim();
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(d)) {
      const [dd, mm, yyyy] = d.split("/");
      row.dob = `${yyyy}-${mm.padStart(2,"0")}-${dd.padStart(2,"0")}`;
    } else if (/^\d{5}$/.test(d)) {
      // Excel date serial
      const dt = XLSX.SSF.parse_date_code(+d);
      row.dob = `${dt.y}-${String(dt.m).padStart(2,"0")}-${String(dt.d).padStart(2,"0")}`;
    }
  }

  return { _row: idx + 2, _errors: errors, ...row };
}

export function parseCustomersFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: "binary", cellDates: false });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json(ws, { defval: "" });
        if (!raw.length) { resolve([]); return; }
        resolve(raw.map((r, i) => parseCustomerRow(r, i)));
      } catch (err) { reject(err); }
    };
    reader.onerror = reject;
    reader.readAsBinaryString(file);
  });
}

// ─── NCC import ────────────────────────────────────────────
const NCC_COL_MAP = {
  "tên ncc":        "name",     "tên nhà cung cấp":"name", "tên":    "name",
  "danh mục":       "cat",      "loại ncc":         "cat",  "loại":   "cat",
  "người liên hệ":  "contact",  "liên hệ":          "contact",
  "số điện thoại":  "phone",    "điện thoại":       "phone","sđt":    "phone",
  "ngân hàng":      "bank",     "tk ngân hàng":     "bank", "stk":    "bank",
  "mã số thuế":     "taxCode",  "mst":              "taxCode",
  "địa chỉ":        "address",
  "ghi chú":        "note",     "note":             "note",
};

const NCC_CAT_LOOKUP = {
  "hãng bay":"hang_bay","hang bay":"hang_bay","airline":"hang_bay",
  "đại lý vé":"dai_ly_ve_may_bay","vé máy bay":"dai_ly_ve_may_bay",
  "xe":"xe_van_chuyen","xe vận chuyển":"xe_van_chuyen",
  "tàu biển":"tau_bien","phà":"tau_bien",
  "khách sạn":"khach_san","resort":"khach_san","hotel":"khach_san",
  "homestay":"homestay","villa":"homestay",
  "du thuyền":"du_thuyen","tàu":"du_thuyen",
  "khu du lịch":"khu_du_lich",
  "di tích":"diem_tham_quan","bảo tàng":"diem_tham_quan",
  "khu vui chơi":"khu_vui_choi",
  "vé sự kiện":"ve_su_kien",
  "nhà hàng":"nha_hang","ẩm thực":"nha_hang",
  "hdv":"hdv_freelance","hướng dẫn viên":"hdv_freelance",
  "bảo hiểm":"bao_hiem",
  "spa":"spa_massage","massage":"spa_massage",
  "ota":"ota_platform","online":"ota_platform",
  "lữ hành":"lu_hanh","tour operator":"lu_hanh",
  "khác":"other","other":"other",
};

function parseNccRow(rawRow, idx) {
  const row = {};
  Object.entries(rawRow).forEach(([k, v]) => {
    const mapped = NCC_COL_MAP[k.toLowerCase().trim()];
    if (mapped) row[mapped] = String(v ?? "").trim();
  });

  const errors = [];
  if (!row.name) errors.push("Thiếu tên NCC");

  // Normalize cat
  if (row.cat) {
    const cl = row.cat.toLowerCase().trim();
    row.cat = NCC_CAT_LOOKUP[cl] || cl;
  } else {
    row.cat = "other";
  }

  return { _row: idx + 2, _errors: errors, ...row };
}

export function parseNccFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: "binary", cellDates: false });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json(ws, { defval: "" });
        if (!raw.length) { resolve([]); return; }
        resolve(raw.map((r, i) => parseNccRow(r, i)));
      } catch (err) { reject(err); }
    };
    reader.onerror = reject;
    reader.readAsBinaryString(file);
  });
}

// ─── Passenger import ──────────────────────────────────────
const PAX_COL_MAP = {
  "họ tên": "name",   "tên": "name",       "họ và tên": "name",  "full name": "name",
  "loại":   "type",   "loại khách": "type","type": "type",
  "ngày sinh": "dob", "sinh ngày": "dob",  "dob": "dob",
  "cccd":   "cccd",   "cmnd": "cccd",      "hộ chiếu": "cccd",  "passport": "cccd", "số cccd": "cccd", "số cmnd": "cccd",
  "sđt":    "phone",  "điện thoại": "phone","số điện thoại": "phone",
  "giới tính": "gender", "gender": "gender",
  "quốc tịch": "nationality", "nationality": "nationality",
  "nhóm chiều cao": "heightGroup", "chiều cao": "heightGroup", "height": "heightGroup",
  "ghi chú": "note",  "note": "note",      "yêu cầu đặc biệt": "note",
};

const HEIGHT_LOOKUP = {
  "dưới 1m":"under1m", "<1m":"under1m", "under1m":"under1m",
  "1m – 1,4m":"1to1.4m", "1m-1.4m":"1to1.4m", "1to1.4m":"1to1.4m",
  "trên 1,4m":"over1.4m", ">1.4m":"over1.4m", "over1.4m":"over1.4m",
};

const PAX_TYPE_LOOKUP = {
  "người lớn": "adult",       "nl": "adult",          "adult": "adult",     "≥18t": "adult",
  "trẻ em 10-18t": "child_10plus", "trẻ em >10t": "child_10plus", "te10": "child_10plus", "child_10plus": "child_10plus",
  "trẻ em 5-10t": "child_5to10",   "te5":  "child_5to10",  "child_5to10": "child_5to10",
  "trẻ em 2-5t":  "child_2to5",    "te2":  "child_2to5",   "child_2to5":  "child_2to5",
  "em bé": "infant",          "eb": "infant",         "infant": "infant",   "<2t": "infant",
  // backward compat
  "trẻ em": "child_10plus",   "te": "child_10plus",   "child": "child_10plus",
  "baby":   "infant",
};

function parsePaxRow(rawRow, idx) {
  const row = {};
  Object.entries(rawRow).forEach(([k, v]) => {
    const mapped = PAX_COL_MAP[k.toLowerCase().trim()];
    if (mapped) row[mapped] = String(v ?? "").trim();
  });
  const errors = [];
  if (!row.name) errors.push("Thiếu họ tên");
  if (row.type) {
    const tl = row.type.toLowerCase().trim();
    row.type = PAX_TYPE_LOOKUP[tl] || "adult";
  } else { row.type = "adult"; }
  if (row.heightGroup) {
    const hl = row.heightGroup.toLowerCase().trim();
    row.heightGroup = HEIGHT_LOOKUP[hl] || "";
  }
  if (row.dob) {
    const d = row.dob.trim();
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(d)) {
      const [dd, mm, yyyy] = d.split("/");
      row.dob = `${yyyy}-${mm.padStart(2,"0")}-${dd.padStart(2,"0")}`;
    } else if (/^\d{5}$/.test(d)) {
      const dt = XLSX.SSF.parse_date_code(+d);
      row.dob = `${dt.y}-${String(dt.m).padStart(2,"0")}-${String(dt.d).padStart(2,"0")}`;
    }
  }
  return { _row: idx + 2, _errors: errors, ...row };
}

export function parsePassengersFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: "binary", cellDates: false });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json(ws, { defval: "" });
        if (!raw.length) { resolve([]); return; }
        resolve(raw.map((r, i) => parsePaxRow(r, i)));
      } catch (err) { reject(err); }
    };
    reader.onerror = reject;
    reader.readAsBinaryString(file);
  });
}

export function downloadPassengerTemplate() {
  const data = [
    { "Họ tên": "Nguyễn Văn An",    "Loại": "Người lớn",      "Ngày sinh": "12/03/1985", "CCCD": "031085012345", "SĐT": "0912345678", "Giới tính": "Nam", "Quốc tịch": "Việt Nam", "Nhóm chiều cao": "",          "Ghi chú": "" },
    { "Họ tên": "Trần Thị Bích",     "Loại": "Người lớn",      "Ngày sinh": "05/08/1988", "CCCD": "031088056789", "SĐT": "",           "Giới tính": "Nữ",  "Quốc tịch": "Việt Nam", "Nhóm chiều cao": "",          "Ghi chú": "Ăn chay" },
    { "Họ tên": "Nguyễn Minh Tuấn",  "Loại": "Trẻ em 10-18t",  "Ngày sinh": "15/04/2012", "CCCD": "031012123456", "SĐT": "",           "Giới tính": "Nam", "Quốc tịch": "Việt Nam", "Nhóm chiều cao": "Trên 1,4m", "Ghi chú": "" },
    { "Họ tên": "Nguyễn Lan Anh",    "Loại": "Trẻ em 5-10t",   "Ngày sinh": "20/11/2016", "CCCD": "",             "SĐT": "",           "Giới tính": "Nữ",  "Quốc tịch": "Việt Nam", "Nhóm chiều cao": "1m – 1,4m", "Ghi chú": "" },
    { "Họ tên": "Nguyễn An Khang",   "Loại": "Trẻ em 2-5t",    "Ngày sinh": "10/06/2020", "CCCD": "",             "SĐT": "",           "Giới tính": "Nam", "Quốc tịch": "Việt Nam", "Nhóm chiều cao": "Dưới 1m",   "Ghi chú": "" },
    { "Họ tên": "Nguyễn Bảo Ngọc",   "Loại": "Em bé",           "Ngày sinh": "10/01/2024", "CCCD": "",             "SĐT": "",           "Giới tính": "Nữ",  "Quốc tịch": "Việt Nam", "Nhóm chiều cao": "",          "Ghi chú": "" },
  ];
  // Thêm sheet hướng dẫn
  const guide = [
    { "Loại khách (theo tuổi)": "Người lớn",     "Ghi chú": "≥18 tuổi, CCCD bắt buộc" },
    { "Loại khách (theo tuổi)": "Trẻ em 10-18t", "Ghi chú": "10–18 tuổi, CCCD bắt buộc" },
    { "Loại khách (theo tuổi)": "Trẻ em 5-10t",  "Ghi chú": "5–10 tuổi, nên có CCCD (từ 6t làm được)" },
    { "Loại khách (theo tuổi)": "Trẻ em 2-5t",   "Ghi chú": "2–5 tuổi, giấy khai sinh thay thế" },
    { "Loại khách (theo tuổi)": "Em bé",          "Ghi chú": "<2 tuổi (infant), không cần CCCD" },
    { "Loại khách (theo tuổi)": "", "Ghi chú": "" },
    { "Loại khách (theo tuổi)": "Nhóm chiều cao", "Ghi chú": "Dùng cho vé khu vui chơi" },
    { "Loại khách (theo tuổi)": "Dưới 1m",        "Ghi chú": "Thường miễn vé hoặc giá đặc biệt" },
    { "Loại khách (theo tuổi)": "1m – 1,4m",      "Ghi chú": "Giá trẻ em khu vui chơi" },
    { "Loại khách (theo tuổi)": "Trên 1,4m",      "Ghi chú": "Giá người lớn khu vui chơi" },
  ];
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  ws["!cols"] = [22, 14, 13, 14, 12, 10, 12, 14, 22].map(w => ({ wch: w }));
  XLSX.utils.book_append_sheet(wb, ws, "Danh sach hanh khach");
  const wsGuide = XLSX.utils.json_to_sheet(guide);
  wsGuide["!cols"] = [20, 36].map(w => ({ wch: w }));
  XLSX.utils.book_append_sheet(wb, wsGuide, "Huong dan");
  XLSX.writeFile(wb, "Mau_DanhSachHanhKhach.xlsx");
}

// ─── Template downloads ────────────────────────────────────
export function downloadCustomerTemplate() {
  const data = [
    {
      "Tên khách hàng": "Nguyễn Văn An",
      "Số điện thoại":  "0912345678",
      "Email":          "an@gmail.com",
      "Loại":           "personal",
      "Ngày sinh":      "12/03/1985",
      "Tỉnh thành":     "Hải Phòng",
      "CCCD":           "031085012345",
      "Sale":           "Nguyễn Thị Hoa",
      "Nguồn":          "Referral",
      "Tên công ty":    "",
      "Ghi chú":        "Khách VIP",
    },
    {
      "Tên khách hàng": "Công ty ABC",
      "Số điện thoại":  "0987654321",
      "Email":          "contact@abc.vn",
      "Loại":           "company",
      "Ngày sinh":      "",
      "Tỉnh thành":     "Hà Nội",
      "CCCD":           "",
      "Sale":           "Trần Văn Nam",
      "Nguồn":          "Google",
      "Tên công ty":    "Công ty TNHH ABC",
      "Ghi chú":        "",
    },
  ];
  const ws = XLSX.utils.json_to_sheet(data);
  ws["!cols"] = [22,14,22,10,12,14,14,16,12,20,20].map(w=>({wch:w}));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Khách hàng");
  XLSX.writeFile(wb, "Template_Import_KhachHang.xlsx");
}

// ─── Export to Excel ───────────────────────────────────────

export function exportCustomersToExcel(customers, filename = "DanhSachKhachHang") {
  const TYPE_LABEL = { personal: "Cá nhân", corp: "Doanh nghiệp", company: "Doanh nghiệp" };
  const data = (customers || []).map((c, i) => ({
    "STT":              i + 1,
    "Tên khách hàng":   c.name || "",
    "Loại":             TYPE_LABEL[c.type] || "Cá nhân",
    "Số điện thoại":    c.phone || "",
    "Email":            c.email || "",
    "Tỉnh thành":       c.province || "",
    "Tên công ty":      c.companyName || "",
    "Tag":              (c.tags || []).join(", "),
    "Nhân viên Sale":   c.assignedSale || "",
    "Nguồn":            c.source || "",
    "Ngày tạo":         c.createdAt ? new Date(c.createdAt).toLocaleDateString("vi-VN") : "",
    "Ghi chú":          c.notes || "",
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  ws["!cols"] = [5,22,12,14,22,14,20,16,16,12,12,20].map(w => ({ wch: w }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Khách hàng");
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportPassengersToExcel(passengers, order = {}) {
  const TYPE_LABEL = {
    adult:"Người lớn", child_10plus:"Trẻ em 10-18t",
    child_5to10:"Trẻ em 5-10t", child_2to5:"Trẻ em 2-5t", infant:"Em bé <2t",
    // backward compat
    child:"Trẻ em", baby:"Em bé",
  };
  const HEIGHT_LABEL = { under1m:"Dưới 1m", "1to1.4m":"1m – 1,4m", over1_4m:"Trên 1,4m", "over1.4m":"Trên 1,4m" };
  const data = (passengers || []).map((p, i) => ({
    "STT":                  i + 1,
    "Họ tên":               p.name || "",
    "Loại khách":           TYPE_LABEL[p.type] || p.type || "",
    "Ngày sinh":            p.dob ? new Date(p.dob).toLocaleDateString("vi-VN") : "",
    "Giới tính":            p.gender || "",
    "CCCD / Hộ chiếu":     p.cccd || "",
    "Số điện thoại":        p.phone || "",
    "Quốc tịch":            p.nationality || "Việt Nam",
    "Nhóm chiều cao":       HEIGHT_LABEL[p.heightGroup] || "",
    "Ghi chú":              p.note || "",
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  ws["!cols"] = [5,22,14,13,10,16,14,12,14,20].map(w => ({ wch: w }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Hành khách");
  const ref = order?.orderNo || order?.id || "DanhSach";
  XLSX.writeFile(wb, `HanhKhach_${ref}.xlsx`);
}

export function downloadNccTemplate() {
  const data = [
    {
      "Tên NCC":         "Vietnam Airlines",
      "Danh mục":        "Hãng bay",
      "Người liên hệ":   "sales@vietnamairlines.com",
      "Số điện thoại":   "1900 1100",
      "Ngân hàng":       "VCB - 0021000123456",
      "Mã số thuế":      "0100107518",
      "Địa chỉ":         "Sân bay Nội Bài, Hà Nội",
      "Ghi chú":         "",
    },
    {
      "Tên NCC":         "KS Vinpearl PQ",
      "Danh mục":        "Khách sạn",
      "Người liên hệ":   "booking.pq@vinpearl.com",
      "Số điện thoại":   "0297 3599 999",
      "Ngân hàng":       "VCB - 0071000234567",
      "Mã số thuế":      "0101245678",
      "Địa chỉ":         "Phú Quốc, Kiên Giang",
      "Ghi chú":         "",
    },
  ];
  const ws = XLSX.utils.json_to_sheet(data);
  ws["!cols"] = [22,14,24,14,22,14,24,16].map(w=>({wch:w}));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Nhà cung cấp");
  XLSX.writeFile(wb, "Template_Import_NCC.xlsx");
}

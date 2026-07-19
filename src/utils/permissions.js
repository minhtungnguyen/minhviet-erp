// ── PERMISSION REGISTRY — danh mục chức năng có thể tích/bỏ cho từng User ──
export const PERMISSION_GROUPS = [
  { group:"Kinh doanh", items:[
    { key:"orders",      label:"Đơn hàng" },
    { key:"quotes",      label:"Báo giá" },
    { key:"crm",         label:"Khách hàng (CRM)" },
    { key:"aftercare",   label:"Chăm sóc KH" },
    { key:"tourghep",    label:"Tour ghép" },
  ]},
  { group:"Vận hành", items:[
    { key:"tourops",     label:"Vận hành tour" },
    { key:"hdv",         label:"Hướng dẫn viên" },
    { key:"ncc",         label:"Nhà cung cấp" },
  ]},
  { group:"Tài chính", items:[
    { key:"finance",     label:"Sổ thu chi / Thu tiền" },
    { key:"approvals",   label:"Phê duyệt" },
    { key:"refunds",     label:"Hoàn tiền" },
    { key:"credits",     label:"Bảo lưu vé" },
    { key:"closeorders", label:"Đóng đơn" },
    { key:"banks",       label:"Tài khoản ngân hàng" },
  ]},
  { group:"Phân tích & Hệ thống", items:[
    { key:"reports",     label:"Báo cáo" },
    { key:"users",       label:"Nhân sự (quản lý User)" },
    { key:"deploy",      label:"Cấu hình hệ thống" },
  ]},
];
export const ALL_PERM_KEYS = PERMISSION_GROUPS.flatMap(g=>g.items.map(i=>i.key));
export const PERM_LABEL = Object.fromEntries(PERMISSION_GROUPS.flatMap(g=>g.items.map(i=>[i.key,i.label])));

// Quyền mặc định theo vai trò (khi User chưa được tùy chỉnh riêng)
export const ROLE_DEFAULT_PERMS = {
  sale:       ["orders","quotes","crm","aftercare","tourghep","tourops","hdv","ncc"],
  dieu_hanh:  ["orders","quotes","crm","aftercare","tourghep","tourops","hdv","ncc"],
  accountant: ["orders","quotes","crm","aftercare","ncc","finance","approvals","refunds","credits","closeorders","banks","reports"],
  cashier:    ["orders","quotes","crm","aftercare","finance","approvals","banks"],
  manager:    ALL_PERM_KEYS,
  pho_giam_doc: ALL_PERM_KEYS.filter(k=>!["users","deploy"].includes(k)), // PGĐ: như GĐ nhưng không quản nhân sự/cấu hình
};
// Ban Giám đốc = GĐ + PGĐ (duyệt toàn bộ chi tiền)
export const isBanGiamDoc = (role) => role==="manager" || role==="pho_giam_doc";
// Quyền hiệu lực: nếu user.perms là mảng → dùng nó; nếu không → mặc định theo role.
// dashboard + tasks luôn mở cho mọi người.
export const getEffectivePerms = (user) => {
  if(!user) return [];
  const base = Array.isArray(user.perms) ? user.perms : (ROLE_DEFAULT_PERMS[user.role]||[]);
  return ["dashboard","tasks",...base];
};

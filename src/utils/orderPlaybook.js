// "Playbook" đơn hàng — gợi ý bước tiếp theo cần làm + ai chịu trách nhiệm,
// suy ra hoàn toàn từ state sẵn có (order.status, công nợ, phiếu chờ duyệt...),
// không thêm bảng/field mới. Ưu tiên theo đúng trình tự nghiệp vụ thật:
// cọc → xác nhận → booking NCC → thanh toán NCC → thu nốt khách → đóng đơn.

const ROLE_LABEL = {
  sale: "Sale",
  dieu_hanh: "Điều hành",
  accountant: "Kế toán",
  cashier: "Thu ngân",
  manager: "Giám đốc",
  pho_giam_doc: "Phó Giám đốc",
};

const EXP_STAGE_ROLES = {
  pending_kt: ["accountant"],
  pending_gd: ["manager", "pho_giam_doc"],
  pending_pay: ["cashier"],
};

const EXP_STAGE_LABEL = {
  pending_kt: "chờ Kế toán duyệt",
  pending_gd: "chờ Ban Giám đốc duyệt",
  pending_pay: "chờ Thu ngân chuyển tiền",
};

const fmtVnd = (n) => (n || 0).toLocaleString("vi-VN") + "₫";
const rolesLabel = (roles) => roles.map((r) => ROLE_LABEL[r] || r).join(" / ");

function step(title, roles, detail) {
  return { title, roles, roleLabel: rolesLabel(roles), detail };
}

export function getOrderPlaybookStep(order, { totalPaid = 0, debt = 0, nccDebt = 0, depositAmt = 0, bookings = [], vouchers = [], expenses = [] } = {}) {
  if (!order || ["closed", "cancelled"].includes(order.status)) return null;

  const orderBookings = bookings.filter((b) => b.orderId === order.id);
  const pendingThu = vouchers.find((v) => v.orderId === order.id && v.type === "thu" && v.status === "pending");
  const pendingExpense = expenses.find((e) => e.orderId === order.id && ["pending_kt", "pending_gd", "pending_pay"].includes(e.status));

  if (order.status === "pending_payment") {
    if (pendingThu) {
      return step("Chờ duyệt phiếu thu cọc", ["accountant", "cashier", "manager", "pho_giam_doc"], `Phiếu thu ${pendingThu.id} đang chờ duyệt.`);
    }
    if (totalPaid < depositAmt) {
      return step("Thu cọc từ khách hàng", ["sale"], `Đã thu ${fmtVnd(totalPaid)} / cần cọc ${fmtVnd(depositAmt)}.`);
    }
    return step("Xác nhận đơn để bàn giao điều hành", ["sale"], "Đã đủ cọc — chuyển trạng thái sang \"Đã xác nhận\".");
  }

  if (order.status === "confirmed" || order.status === "in_progress") {
    if (pendingExpense) {
      const roles = EXP_STAGE_ROLES[pendingExpense.status] || [];
      return step(`Duyệt/chuyển tiền cho NCC (${EXP_STAGE_LABEL[pendingExpense.status]})`, roles, `Phiếu chi ${pendingExpense.id} — ${EXP_STAGE_LABEL[pendingExpense.status]}.`);
    }
    if (order.status === "confirmed" && orderBookings.length === 0) {
      return step("Đặt dịch vụ với nhà cung cấp", ["dieu_hanh"], "Chưa có booking NCC nào cho đơn này.");
    }
    if (nccDebt > 0) {
      const title = order.status === "in_progress" ? "Hoàn tất thanh toán NCC trước khi đóng đơn" : "Tạo phiếu chi thanh toán NCC";
      return step(title, ["dieu_hanh"], `Còn nợ NCC ${fmtVnd(nccDebt)}.`);
    }
    if (debt > 0) {
      const title = order.status === "in_progress" ? "Thu nốt tiền khách trước khi đóng đơn" : "Thu nốt phần còn lại của khách";
      return step(title, ["sale"], `Khách còn nợ ${fmtVnd(debt)}.`);
    }
    const title = order.status === "in_progress" ? "Đủ điều kiện đóng đơn" : "Bàn giao vận hành tour";
    const detail = order.status === "in_progress" ? "Đã tất toán 2 chiều — chuyển trạng thái \"Đã đóng\"." : "Đã đủ tiền 2 chiều — chuyển trạng thái \"Đang chạy\" khi tour khởi hành.";
    return step(title, ["dieu_hanh"], detail);
  }

  return null;
}

export function isPlaybookMyTurn(playbookStep, currentRole) {
  return !!playbookStep && playbookStep.roles.includes(currentRole);
}

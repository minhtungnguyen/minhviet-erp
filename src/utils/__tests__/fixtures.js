// Fixtures dùng chung cho test business logic — mô phỏng các trạng thái nghiệp vụ
// thực tế: đơn còn nợ / đã thu đủ / thu thừa, phiếu thu-chi nhiều trạng thái,
// booking NCC chưa thanh toán, bảo lưu vé còn hạn/sắp hết hạn/hết hạn.

export function makeOrder(overrides = {}) {
  return {
    id: "DH0001",
    customerName: "Nguyễn Văn An",
    totalPrice: 10000000,
    costPrice: 7000000,
    status: "confirmed",
    additionalItems: [],
    ...overrides,
  };
}

export function makeVoucher(overrides = {}) {
  return {
    id: "PT-0001",
    orderId: "DH0001",
    type: "thu",
    amount: 1000000,
    status: "approved",
    ...overrides,
  };
}

export function makeBooking(overrides = {}) {
  return {
    orderId: "DH0001",
    amount: 500000,
    status: "hold",
    ...overrides,
  };
}

export function makeCredit(overrides = {}) {
  return {
    id: "BL-0001",
    customerName: "Trần Thị Bích",
    originalAmount: 3500000,
    feeDeducted: 500000,
    creditAmount: 3000000,
    usedAmount: 0,
    remainingAmount: 3000000,
    expiryDate: "2099-12-31",
    ...overrides,
  };
}

export function daysFromNow(n) {
  return new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
}

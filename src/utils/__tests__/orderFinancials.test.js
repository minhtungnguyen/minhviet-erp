import { describe, it, expect } from 'vitest';
import { calcVoucherTotals, calcNccDebt, calcOrderFinancials } from '../orderFinancials.js';
import { makeOrder, makeVoucher, makeBooking } from './fixtures.js';

describe('calcVoucherTotals', () => {
  it('chỉ cộng phiếu thu/chi đã duyệt hoặc xác nhận', () => {
    const vouchers = [
      makeVoucher({ id: 'PT-1', type: 'thu', amount: 3000000, status: 'approved' }),
      makeVoucher({ id: 'PT-2', type: 'thu', amount: 2000000, status: 'confirmed' }),
      makeVoucher({ id: 'PT-3', type: 'thu', amount: 5000000, status: 'pending' }),
      makeVoucher({ id: 'PC-1', type: 'chi', amount: 1000000, status: 'approved' }),
      makeVoucher({ id: 'PC-2', type: 'chi', amount: 4000000, status: 'rejected' }),
    ];
    const { totalPaid, totalChi } = calcVoucherTotals(vouchers, 'DH0001');
    expect(totalPaid).toBe(5000000); // 3tr + 2tr, KHÔNG tính phiếu pending
    expect(totalChi).toBe(1000000); // chỉ approved, KHÔNG tính rejected
  });

  it('bỏ qua phiếu của đơn khác', () => {
    const vouchers = [
      makeVoucher({ orderId: 'DH0001', amount: 1000000 }),
      makeVoucher({ orderId: 'DH9999', amount: 999999999 }),
    ];
    const { totalPaid } = calcVoucherTotals(vouchers, 'DH0001');
    expect(totalPaid).toBe(1000000);
  });

  it('trả về 0/0 khi không có phiếu nào', () => {
    expect(calcVoucherTotals([], 'DH0001')).toEqual({ totalPaid: 0, totalChi: 0 });
  });

  it('chịu được vouchers undefined', () => {
    expect(calcVoucherTotals(undefined, 'DH0001')).toEqual({ totalPaid: 0, totalChi: 0 });
  });

  it('phiếu thu amount=null/undefined không làm NaN tổng', () => {
    const vouchers = [makeVoucher({ type: 'thu', amount: undefined }), makeVoucher({ type: 'thu', amount: 1000000 })];
    expect(calcVoucherTotals(vouchers, 'DH0001').totalPaid).toBe(1000000);
  });

  it('phiếu chi amount=null/undefined không làm NaN tổng', () => {
    const vouchers = [makeVoucher({ type: 'chi', amount: undefined }), makeVoucher({ type: 'chi', amount: 500000 })];
    expect(calcVoucherTotals(vouchers, 'DH0001').totalChi).toBe(500000);
  });
});

describe('calcNccDebt', () => {
  it('cộng booking chưa hủy và chưa thanh toán xong', () => {
    const bookings = [
      makeBooking({ amount: 2000000, status: 'hold' }),
      makeBooking({ amount: 3000000, status: 'confirmed' }),
      makeBooking({ amount: 5000000, status: 'cancelled' }),
      makeBooking({ amount: 7000000, status: 'paid' }),
    ];
    expect(calcNccDebt(bookings, 'DH0001')).toBe(5000000); // 2tr + 3tr
  });

  it('trả về 0 khi không có booking nào', () => {
    expect(calcNccDebt([], 'DH0001')).toBe(0);
  });

  it('chịu được bookings undefined', () => {
    expect(calcNccDebt(undefined, 'DH0001')).toBe(0);
  });

  it('booking amount=null/undefined không làm NaN tổng', () => {
    const bookings = [makeBooking({ amount: undefined }), makeBooking({ amount: 1000000 })];
    expect(calcNccDebt(bookings, 'DH0001')).toBe(1000000);
  });
});

describe('calcOrderFinancials — công nợ & lợi nhuận đơn hàng', () => {
  it('đơn còn nợ khách: debt > 0', () => {
    const order = makeOrder({ totalPrice: 10000000, costPrice: 6000000 });
    const vouchers = [makeVoucher({ type: 'thu', amount: 4000000, status: 'approved' })];
    const fin = calcOrderFinancials(order, vouchers, []);
    expect(fin.totalPaid).toBe(4000000);
    expect(fin.debt).toBe(6000000);
  });

  it('đơn đã thu đủ: debt = 0', () => {
    const order = makeOrder({ totalPrice: 10000000 });
    const vouchers = [makeVoucher({ type: 'thu', amount: 10000000, status: 'approved' })];
    expect(calcOrderFinancials(order, vouchers, []).debt).toBe(0);
  });

  it('khách trả thừa: debt < 0 (không clamp — dùng để cảnh báo hoàn tiền)', () => {
    const order = makeOrder({ totalPrice: 10000000 });
    const vouchers = [makeVoucher({ type: 'thu', amount: 12000000, status: 'approved' })];
    expect(calcOrderFinancials(order, vouchers, []).debt).toBe(-2000000);
  });

  it('tính lợi nhuận = doanh thu - chi phí NCC đã duyệt - giá vốn', () => {
    const order = makeOrder({ totalPrice: 10000000, costPrice: 3000000 });
    const vouchers = [makeVoucher({ type: 'chi', amount: 2000000, status: 'approved' })];
    const fin = calcOrderFinancials(order, vouchers, []);
    expect(fin.totalChi).toBe(2000000);
    expect(fin.profit).toBe(5000000); // 10tr - 2tr - 3tr
  });

  it('đơn lỗ: profit âm khi chi phí + giá vốn vượt doanh thu', () => {
    const order = makeOrder({ totalPrice: 5000000, costPrice: 4000000 });
    const vouchers = [makeVoucher({ type: 'chi', amount: 2000000, status: 'approved' })];
    expect(calcOrderFinancials(order, vouchers, []).profit).toBe(-1000000);
  });

  it('profitPct = 0 khi totalPrice = 0 (tránh chia cho 0)', () => {
    const order = makeOrder({ totalPrice: 0, costPrice: 0 });
    expect(calcOrderFinancials(order, [], []).profitPct).toBe(0);
  });

  it('profitPct tính đúng phần trăm lợi nhuận trên doanh thu', () => {
    const order = makeOrder({ totalPrice: 10000000, costPrice: 8000000 });
    expect(calcOrderFinancials(order, [], []).profitPct).toBeCloseTo(20, 5);
  });

  it('tính công nợ NCC kèm theo', () => {
    const order = makeOrder({ totalPrice: 10000000 });
    const bookings = [makeBooking({ amount: 1500000, status: 'hold' })];
    expect(calcOrderFinancials(order, [], bookings).nccDebt).toBe(1500000);
  });

  it('order=null không crash, trả về giá trị mặc định an toàn', () => {
    const fin = calcOrderFinancials(null, [], []);
    expect(fin.debt).toBe(0);
    expect(fin.profit).toBe(0);
    expect(fin.profitPct).toBe(0);
  });
});

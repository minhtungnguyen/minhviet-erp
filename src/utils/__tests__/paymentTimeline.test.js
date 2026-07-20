import { describe, it, expect } from 'vitest';
import { calcPaymentTimeline } from '../paymentTimeline.js';
import { makeOrder, makeVoucher } from './fixtures.js';

describe('calcPaymentTimeline — tiến độ thanh toán kèm dịch vụ bổ sung', () => {
  it('grandTotal = totalPrice + tổng dịch vụ bổ sung', () => {
    const order = makeOrder({
      totalPrice: 10000000,
      additionalItems: [{ totalPrice: 1000000 }, { totalPrice: 500000 }],
    });
    expect(calcPaymentTimeline(order, []).grandTotal).toBe(11500000);
  });

  it('paidPct làm tròn và chặn ở 100 dù thu vượt', () => {
    const order = makeOrder({ totalPrice: 10000000, additionalItems: [] });
    const vouchers = [makeVoucher({ type: 'thu', amount: 12000000, status: 'approved' })];
    expect(calcPaymentTimeline(order, vouchers).paidPct).toBe(100);
  });

  it('paidPct = 0 khi grandTotal = 0 (tránh chia cho 0)', () => {
    const order = makeOrder({ totalPrice: 0, additionalItems: [] });
    expect(calcPaymentTimeline(order, []).paidPct).toBe(0);
  });

  it('paidPct tính đúng phần trăm đã thu trên tổng', () => {
    const order = makeOrder({ totalPrice: 10000000, additionalItems: [] });
    const vouchers = [makeVoucher({ type: 'thu', amount: 5000000, status: 'approved' })];
    expect(calcPaymentTimeline(order, vouchers).paidPct).toBe(50);
  });

  it('remaining = grandTotal - totalPaid, có thể âm khi thu vượt', () => {
    const order = makeOrder({ totalPrice: 10000000, additionalItems: [] });
    const vouchers = [makeVoucher({ type: 'thu', amount: 11000000, status: 'approved' })];
    expect(calcPaymentTimeline(order, vouchers).remaining).toBe(-1000000);
  });

  it('không tính phiếu chưa duyệt vào totalPaid', () => {
    const order = makeOrder({ totalPrice: 10000000, additionalItems: [] });
    const vouchers = [makeVoucher({ type: 'thu', amount: 5000000, status: 'pending' })];
    expect(calcPaymentTimeline(order, vouchers).totalPaid).toBe(0);
  });

  it('chịu được vouchers undefined (chưa có phiếu nào)', () => {
    const order = makeOrder({ totalPrice: 10000000, additionalItems: [] });
    expect(calcPaymentTimeline(order, undefined).totalPaid).toBe(0);
  });

  it('chịu được additionalItems không tồn tại trên đơn (đơn chưa từng thêm dịch vụ bổ sung)', () => {
    const order = makeOrder({ totalPrice: 10000000 });
    delete order.additionalItems;
    expect(calcPaymentTimeline(order, []).addonTotal).toBe(0);
  });

  it('phiếu thu amount=null/undefined không làm NaN totalPaid', () => {
    const order = makeOrder({ totalPrice: 10000000, additionalItems: [] });
    const vouchers = [makeVoucher({ type: 'thu', amount: undefined, status: 'approved' }), makeVoucher({ type: 'thu', amount: 2000000, status: 'approved' })];
    expect(calcPaymentTimeline(order, vouchers).totalPaid).toBe(2000000);
  });
});

import { describe, it, expect } from 'vitest';
import { calcPaymentStages } from '../paymentStages.js';
import { makeOrder, makeVoucher } from './fixtures.js';

describe('calcPaymentStages — số tiền theo giai đoạn (dùng cho in YCTT/hoàn tiền)', () => {
  it('dùng depositAmount có sẵn trên đơn nếu có', () => {
    const order = makeOrder({ totalPrice: 10000000, depositAmount: 4000000 });
    expect(calcPaymentStages(order, []).depositAmt).toBe(4000000);
  });

  it('mặc định cọc 30% khi đơn chưa có depositAmount', () => {
    const order = makeOrder({ totalPrice: 10000000, depositAmount: undefined });
    expect(calcPaymentStages(order, []).depositAmt).toBe(3000000);
  });

  it('remainingAmt = còn phải thu, không âm dù thu vượt', () => {
    const order = makeOrder({ totalPrice: 10000000 });
    const vouchers = [makeVoucher({ type: 'thu', amount: 12000000, status: 'approved' })];
    const st = calcPaymentStages(order, vouchers);
    expect(st.remainingAmt).toBe(0);
    expect(st.overpayAmt).toBe(2000000);
  });

  it('remainingAmt > 0 khi chưa thu đủ, overpayAmt = 0', () => {
    const order = makeOrder({ totalPrice: 10000000 });
    const vouchers = [makeVoucher({ type: 'thu', amount: 3000000, status: 'approved' })];
    const st = calcPaymentStages(order, vouchers);
    expect(st.remainingAmt).toBe(7000000);
    expect(st.overpayAmt).toBe(0);
  });

  it('finalPayAmt = tổng - tiền cọc, không âm', () => {
    const order = makeOrder({ totalPrice: 10000000, depositAmount: 4000000 });
    expect(calcPaymentStages(order, []).finalPayAmt).toBe(6000000);
  });

  it('finalPayAmt = 0 khi cọc lớn hơn tổng giá trị đơn (dữ liệu bất thường)', () => {
    const order = makeOrder({ totalPrice: 5000000, depositAmount: 8000000 });
    expect(calcPaymentStages(order, []).finalPayAmt).toBe(0);
  });

  it('totalPrice = 0 khi đơn thiếu totalPrice, không NaN', () => {
    const order = makeOrder({ totalPrice: undefined, depositAmount: undefined });
    const st = calcPaymentStages(order, []);
    expect(st.totalPrice).toBe(0);
    expect(st.depositAmt).toBe(0);
  });

  it('chỉ tính phiếu thu đã duyệt/xác nhận vào totalPaid', () => {
    const order = makeOrder({ totalPrice: 10000000 });
    const vouchers = [
      makeVoucher({ type: 'thu', amount: 3000000, status: 'approved' }),
      makeVoucher({ type: 'thu', amount: 5000000, status: 'pending' }),
      makeVoucher({ type: 'chi', amount: 1000000, status: 'approved' }),
    ];
    expect(calcPaymentStages(order, vouchers).totalPaid).toBe(3000000);
  });
});

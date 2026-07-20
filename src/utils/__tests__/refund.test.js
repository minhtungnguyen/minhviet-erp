import { describe, it, expect } from 'vitest';
import { daysUntilDepart, calcRefundPolicy } from '../refund.js';
import { REFUND_POLICY } from '../../constants/refundPolicy.js';
import { daysFromNow } from './fixtures.js';

describe('daysUntilDepart', () => {
  it('trả về số ngày dương khi ngày đi ở tương lai', () => {
    expect(daysUntilDepart(daysFromNow(20))).toBeGreaterThanOrEqual(19);
  });

  it('không bao giờ âm — clamp về 0 khi ngày đi đã qua', () => {
    expect(daysUntilDepart(daysFromNow(-10))).toBe(0);
  });
});

describe('calcRefundPolicy — khớp ĐIỀU 5 hợp đồng combo (regression: REFUND_POLICY từng bị thiếu định nghĩa gây crash)', () => {
  it('hủy trước >=30 ngày: hoàn 100%', () => {
    const r = calcRefundPolicy(daysFromNow(35), 10000000);
    expect(r.pct).toBe(100);
    expect(r.amount).toBe(10000000);
  });

  it('hủy trước 15-29 ngày: phí hủy 30% (hoàn 70%)', () => {
    const r = calcRefundPolicy(daysFromNow(20), 10000000);
    expect(r.pct).toBe(70);
    expect(r.amount).toBe(7000000);
  });

  it('hủy trước 7-14 ngày: phí hủy 50% (hoàn 50%)', () => {
    const r = calcRefundPolicy(daysFromNow(10), 10000000);
    expect(r.pct).toBe(50);
    expect(r.amount).toBe(5000000);
  });

  it('hủy trước 3-6 ngày: phí hủy 70% (hoàn 30%)', () => {
    const r = calcRefundPolicy(daysFromNow(4), 10000000);
    expect(r.pct).toBe(30);
    expect(r.amount).toBe(3000000);
  });

  it('hủy dưới 3 ngày: phí hủy 100% (hoàn 0)', () => {
    const r = calcRefundPolicy(daysFromNow(1), 10000000);
    expect(r.pct).toBe(0);
    expect(r.amount).toBe(0);
  });

  it('đã qua ngày khởi hành: vẫn áp mốc thấp nhất (hoàn 0), không crash', () => {
    const r = calcRefundPolicy(daysFromNow(-5), 10000000);
    expect(r.days).toBe(0);
    expect(r.pct).toBe(0);
  });

  it('totalPrice thiếu/0 không làm crash, amount = 0', () => {
    expect(calcRefundPolicy(daysFromNow(35), undefined).amount).toBe(0);
    expect(calcRefundPolicy(daysFromNow(35), 0).amount).toBe(0);
  });

  it('luôn dùng đúng REFUND_POLICY từ constants — không tự định nghĩa lại bảng chính sách', () => {
    const r = calcRefundPolicy(daysFromNow(35), 10000000);
    expect(r.label).toBe(REFUND_POLICY[0].label);
  });
});

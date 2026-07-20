import { describe, it, expect } from 'vitest';
import { daysToExpiry, computeCreditStatus, calcCreditAmount, isValidCreditUsage } from '../creditCalc.js';
import { makeCredit, daysFromNow } from './fixtures.js';

describe('daysToExpiry', () => {
  it('trả về số dương khi hạn còn ở tương lai', () => {
    expect(daysToExpiry(daysFromNow(10))).toBeGreaterThanOrEqual(9);
  });

  it('trả về số âm khi đã hết hạn', () => {
    expect(daysToExpiry(daysFromNow(-5))).toBeLessThan(0);
  });
});

describe('computeCreditStatus', () => {
  it('expired khi đã qua hạn sử dụng, bất kể còn tiền hay không', () => {
    const credit = makeCredit({ expiryDate: daysFromNow(-1), remainingAmount: 1000000 });
    expect(computeCreditStatus(credit)).toBe('expired');
  });

  it('used khi hết tiền dù chưa hết hạn', () => {
    const credit = makeCredit({ expiryDate: daysFromNow(30), remainingAmount: 0, usedAmount: 3000000 });
    expect(computeCreditStatus(credit)).toBe('used');
  });

  it('partial khi đã dùng một phần', () => {
    const credit = makeCredit({ expiryDate: daysFromNow(30), remainingAmount: 1000000, usedAmount: 2000000 });
    expect(computeCreditStatus(credit)).toBe('partial');
  });

  it('active khi chưa dùng và còn hạn', () => {
    const credit = makeCredit({ expiryDate: daysFromNow(30), remainingAmount: 3000000, usedAmount: 0 });
    expect(computeCreditStatus(credit)).toBe('active');
  });

  it('expired được ưu tiên trước used/partial (hết hạn thì không dùng được nữa dù còn dư)', () => {
    const credit = makeCredit({ expiryDate: daysFromNow(-1), remainingAmount: 3000000, usedAmount: 0 });
    expect(computeCreditStatus(credit)).toBe('expired');
  });
});

describe('calcCreditAmount', () => {
  it('giá trị bảo lưu = giá gốc - phí hủy', () => {
    expect(calcCreditAmount(3500000, 500000)).toBe(3000000);
  });

  it('không âm khi phí hủy lớn hơn giá gốc', () => {
    expect(calcCreditAmount(1000000, 2000000)).toBe(0);
  });

  it('coi thiếu tham số như 0', () => {
    expect(calcCreditAmount(undefined, undefined)).toBe(0);
    expect(calcCreditAmount(1000000, undefined)).toBe(1000000);
  });
});

describe('isValidCreditUsage', () => {
  it('hợp lệ khi 0 < số tiền <= số dư còn lại', () => {
    expect(isValidCreditUsage(1000000, 3000000)).toBe(true);
    expect(isValidCreditUsage(3000000, 3000000)).toBe(true);
  });

  it('không hợp lệ khi số tiền <= 0', () => {
    expect(isValidCreditUsage(0, 3000000)).toBe(false);
    expect(isValidCreditUsage(-1000, 3000000)).toBe(false);
  });

  it('không hợp lệ khi vượt quá số dư còn lại', () => {
    expect(isValidCreditUsage(3000001, 3000000)).toBe(false);
  });
});

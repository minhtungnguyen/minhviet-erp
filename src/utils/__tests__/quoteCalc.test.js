import { describe, it, expect } from 'vitest';
import { calcQuoteTotal, calcDepositAmount, daysLeft } from '../quoteCalc.js';
import { daysFromNow } from './fixtures.js';

describe('calcQuoteTotal — tổng báo giá theo số khách', () => {
  it('tính đúng tổng NL + TE + em bé', () => {
    const pax = { adults: 2, children: 1, babies: 1 };
    const pricing = { adultPrice: 5000000, childPrice: 3000000, babyPrice: 500000 };
    expect(calcQuoteTotal(pax, pricing)).toBe(2 * 5000000 + 3000000 + 500000);
  });

  it('trả về 0 khi không có khách nào', () => {
    expect(calcQuoteTotal({ adults: 0, children: 0, babies: 0 }, { adultPrice: 1000000 })).toBe(0);
  });

  it('coi thiếu giá là 0, không NaN', () => {
    expect(calcQuoteTotal({ adults: 2, children: 0, babies: 0 }, {})).toBe(0);
  });

  it('chịu được pax/pricing rỗng', () => {
    expect(calcQuoteTotal(null, null)).toBe(0);
  });
});

describe('calcDepositAmount', () => {
  it('tính đúng % cọc và làm tròn', () => {
    expect(calcDepositAmount(10000000, 30)).toBe(3000000);
  });

  it('làm tròn số lẻ', () => {
    expect(calcDepositAmount(10000000, 33)).toBe(3300000);
    expect(calcDepositAmount(1000000, 15)).toBe(150000);
  });

  it('trả về 0 khi thiếu tham số', () => {
    expect(calcDepositAmount(undefined, 30)).toBe(0);
    expect(calcDepositAmount(10000000, undefined)).toBe(0);
  });
});

describe('daysLeft — hạn hiệu lực báo giá', () => {
  it('trả về null khi không có hạn', () => {
    expect(daysLeft(null)).toBeNull();
    expect(daysLeft('')).toBeNull();
  });

  it('trả về số dương khi còn hạn', () => {
    expect(daysLeft(daysFromNow(3))).toBeGreaterThanOrEqual(2);
  });

  it('trả về số <= 0 khi đã hết hạn', () => {
    expect(daysLeft(daysFromNow(-2))).toBeLessThanOrEqual(0);
  });
});

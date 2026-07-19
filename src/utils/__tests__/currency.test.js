import { describe, it, expect, beforeEach } from 'vitest';
import { CURRENCIES, loadFxRates, saveFxRates, toVND, fmtCurrency } from '../currency.js';

beforeEach(() => {
  localStorage.clear();
});

describe('CURRENCIES', () => {
  it('bao gồm VND là phần tử đầu với rate = 1', () => {
    expect(CURRENCIES[0].code).toBe('VND');
    expect(CURRENCIES[0].defaultRate).toBe(1);
  });

  it('mỗi currency có code, symbol, name, defaultRate', () => {
    CURRENCIES.forEach(c => {
      expect(c.code).toBeTruthy();
      expect(c.symbol).toBeTruthy();
      expect(c.name).toBeTruthy();
      expect(typeof c.defaultRate).toBe('number');
    });
  });

  it('có đủ 10 loại tiền tệ', () => {
    expect(CURRENCIES.length).toBe(10);
  });
});

describe('loadFxRates', () => {
  it('trả về default rates khi localStorage rỗng', () => {
    const rates = loadFxRates();
    expect(rates.VND).toBe(1);
    expect(rates.USD).toBe(25400);
    expect(rates.EUR).toBe(27500);
  });

  it('gộp saved rates với defaults', () => {
    localStorage.setItem('mv_erp_fx_rates', JSON.stringify({ USD: 26000 }));
    const rates = loadFxRates();
    expect(rates.USD).toBe(26000);
    expect(rates.VND).toBe(1);
    expect(rates.EUR).toBe(27500);
  });

  it('trả về defaults khi JSON bị lỗi', () => {
    localStorage.setItem('mv_erp_fx_rates', 'INVALID');
    const rates = loadFxRates();
    expect(rates.VND).toBe(1);
    expect(rates.USD).toBe(25400);
  });

  it('có đủ key cho tất cả currencies', () => {
    const rates = loadFxRates();
    CURRENCIES.forEach(c => {
      expect(rates[c.code]).toBeDefined();
    });
  });
});

describe('saveFxRates', () => {
  it('lưu rates vào localStorage', () => {
    saveFxRates({ USD: 26000, VND: 1 });
    const raw = localStorage.getItem('mv_erp_fx_rates');
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw);
    expect(parsed.USD).toBe(26000);
  });
});

describe('toVND', () => {
  it('trả về nguyên amount khi currency = VND', () => {
    expect(toVND(100000, 'VND', { VND: 1 })).toBe(100000);
  });

  it('trả về nguyên amount khi currency falsy', () => {
    expect(toVND(500, null, {})).toBe(500);
  });

  it('đổi USD sang VND theo rate', () => {
    const rates = { USD: 25000 };
    expect(toVND(1, 'USD', rates)).toBe(25000);
    expect(toVND(2, 'USD', rates)).toBe(50000);
  });

  it('làm tròn kết quả', () => {
    const rates = { JPY: 165 };
    expect(toVND(3, 'JPY', rates)).toBe(495);
  });

  it('fallback về 1 khi currency không có trong rates', () => {
    expect(toVND(100, 'XYZ', {})).toBe(100);
  });

  it('dùng loadFxRates khi không truyền rates', () => {
    localStorage.setItem('mv_erp_fx_rates', JSON.stringify({ EUR: 30000 }));
    expect(toVND(1, 'EUR')).toBe(30000);
  });
});

describe('fmtCurrency', () => {
  it('định dạng VND với "đ" ở cuối', () => {
    const result = fmtCurrency(1000000, 'VND');
    expect(result).toMatch(/đ$/);
  });

  it('định dạng USD với "$" ở đầu', () => {
    const result = fmtCurrency(100, 'USD');
    expect(result.startsWith('$')).toBe(true);
  });

  it('dùng symbol của CURRENCIES[0] khi currency không tìm thấy', () => {
    const result = fmtCurrency(50000, 'UNKNOWN');
    // fallback về CURRENCIES[0] (VND, symbol "đ"), nhưng chạy nhánh non-VND: "đ50.000"
    expect(result).toContain('đ');
  });

  it('định dạng EUR với "€" ở đầu', () => {
    const result = fmtCurrency(100, 'EUR');
    expect(result.startsWith('€')).toBe(true);
  });
});

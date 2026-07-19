import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fmt, fmtS, fmtD, fmtDT, pct, genId, genVId, soThanhChu } from '../format.js';

// fmt — số tiền có phân cách vi-VN
describe('fmt', () => {
  it('trả về "-" khi falsy (undefined, null, "")', () => {
    expect(fmt(undefined)).toBe('-');
    expect(fmt(null)).toBe('-');
    expect(fmt('')).toBe('-');
  });

  it('cho phép 0 vì 0 !== falsy trong hàm', () => {
    expect(fmt(0)).toBe('0');
  });

  it('định dạng số nguyên theo vi-VN', () => {
    const result = fmt(1000000);
    expect(result).toMatch(/1[.\s]000[.\s]000/);
  });

  it('làm tròn số thập phân', () => {
    const result = fmt(1500.7);
    expect(result).toMatch(/1[.\s]501/);
  });

  it('xử lý số âm', () => {
    const result = fmt(-5000);
    expect(result).toContain('5');
  });
});

// fmtS — rút gọn số lớn
describe('fmtS', () => {
  it('trả về "0" khi falsy', () => {
    expect(fmtS(0)).toBe('0');
    expect(fmtS(null)).toBe('0');
    expect(fmtS(undefined)).toBe('0');
  });

  it('tỷ: >= 1e9', () => {
    expect(fmtS(1_000_000_000)).toBe('1 tỷ');
    expect(fmtS(2_500_000_000)).toBe('2.5 tỷ');
    expect(fmtS(3_000_000_000)).toBe('3 tỷ');
  });

  it('tr: >= 1e6 < 1e9', () => {
    expect(fmtS(1_000_000)).toBe('1 tr');
    expect(fmtS(1_500_000)).toBe('1.5 tr');
    expect(fmtS(2_000_000)).toBe('2 tr');
  });

  it('k: >= 1000 < 1e6', () => {
    expect(fmtS(1000)).toBe('1k');
    expect(fmtS(5500)).toBe('6k');
  });

  it('số nhỏ: < 1000', () => {
    expect(fmtS(500)).toBe('500');
    expect(fmtS(1)).toBe('1');
  });

  it('loại bỏ .0 ở tỷ và tr', () => {
    expect(fmtS(2_000_000_000)).toBe('2 tỷ');
    expect(fmtS(3_000_000)).toBe('3 tr');
  });
});

// fmtD — định dạng ngày DD/MM/YYYY
describe('fmtD', () => {
  it('trả về "-" khi falsy', () => {
    expect(fmtD('')).toBe('-');
    expect(fmtD(null)).toBe('-');
    expect(fmtD(undefined)).toBe('-');
  });

  it('định dạng ngày ISO string', () => {
    const result = fmtD('2025-01-15');
    expect(result).toMatch(/15\/01\/2025/);
  });

  it('padding đúng cho ngày tháng 1 chữ số', () => {
    const result = fmtD('2025-03-07');
    expect(result).toMatch(/07\/03\/2025/);
  });
});

// fmtDT — định dạng ngày giờ DD/MM HH:MM
describe('fmtDT', () => {
  it('trả về "-" khi falsy', () => {
    expect(fmtDT('')).toBe('-');
    expect(fmtDT(null)).toBe('-');
    expect(fmtDT(undefined)).toBe('-');
  });

  it('định dạng đúng dạng DD/MM HH:MM', () => {
    const result = fmtDT('2025-06-15T09:05:00');
    expect(result).toMatch(/15\/06 09:05/);
  });

  it('padding giờ phút', () => {
    const result = fmtDT('2025-01-03T08:04:00');
    expect(result).toMatch(/03\/01 08:04/);
  });
});

// pct — phần trăm có cap 100
describe('pct', () => {
  it('trả về 0 khi b = 0', () => {
    expect(pct(50, 0)).toBe(0);
    expect(pct(0, 0)).toBe(0);
  });

  it('tính phần trăm bình thường', () => {
    expect(pct(1, 4)).toBe(25);
    expect(pct(3, 4)).toBe(75);
    expect(pct(1, 3)).toBe(33);
  });

  it('cap ở 100', () => {
    expect(pct(200, 100)).toBe(100);
    expect(pct(150, 100)).toBe(100);
  });

  it('làm tròn về số nguyên', () => {
    expect(pct(1, 6)).toBe(17);
  });
});

// genId — sinh ID theo prefix
describe('genId', () => {
  it('tạo ID đầu tiên khi list rỗng', () => {
    expect(genId('O', [])).toBe('O001');
    expect(genId('EXP', [])).toBe('EXP001');
  });

  it('tăng đúng số thứ tự', () => {
    const list = [{ id: 'O001' }, { id: 'O002' }];
    expect(genId('O', list)).toBe('O003');
  });

  it('chỉ đếm các item có prefix đúng', () => {
    const list = [{ id: 'O001' }, { id: 'X999' }];
    expect(genId('O', list)).toBe('O002');
  });
});

// genVId — sinh ID phiếu thu/chi
describe('genVId', () => {
  const year = new Date().getFullYear();

  it('tạo phiếu thu PT khi type = "thu"', () => {
    const id = genVId('thu', []);
    expect(id).toBe(`PT-${year}-001`);
  });

  it('tạo phiếu chi PC khi type không phải "thu"', () => {
    const id = genVId('chi', []);
    expect(id).toBe(`PC-${year}-001`);
  });

  it('tăng số đúng', () => {
    const list = [{ id: `PT-${year}-001` }, { id: `PT-${year}-002` }];
    expect(genVId('thu', list)).toBe(`PT-${year}-003`);
  });

  it('đếm độc lập PT vs PC', () => {
    const list = [{ id: `PT-${year}-001` }];
    expect(genVId('chi', list)).toBe(`PC-${year}-001`);
  });
});

// soThanhChu — đọc số thành chữ tiếng Việt
describe('soThanhChu', () => {
  it('trả về "Không đồng" khi 0 hoặc falsy', () => {
    expect(soThanhChu(0)).toBe('Không đồng');
    expect(soThanhChu(null)).toBe('Không đồng');
    expect(soThanhChu(undefined)).toBe('Không đồng');
  });

  it('đọc số nhỏ', () => {
    expect(soThanhChu(5)).toBe('Năm đồng');
    expect(soThanhChu(9)).toBe('Chín đồng');
  });

  it('đọc số hàng chục', () => {
    expect(soThanhChu(10)).toBe('Mười đồng');
    expect(soThanhChu(21)).toBe('Hai mươi một đồng');
  });

  it('đọc hàng trăm', () => {
    expect(soThanhChu(100)).toBe('Một trăm đồng');
    expect(soThanhChu(105)).toBe('Một trăm lẻ năm đồng');
  });

  it('đọc hàng nghìn', () => {
    expect(soThanhChu(1000)).toBe('Một nghìn đồng');
    expect(soThanhChu(5000)).toBe('Năm nghìn đồng');
  });

  it('đọc hàng triệu', () => {
    expect(soThanhChu(1_000_000)).toBe('Một triệu đồng');
    expect(soThanhChu(2_500_000)).toContain('triệu');
  });

  it('đọc hàng tỷ', () => {
    expect(soThanhChu(1_000_000_000)).toBe('Một tỷ đồng');
  });

  it('viết hoa chữ đầu', () => {
    const result = soThanhChu(50);
    expect(result[0]).toBe(result[0].toUpperCase());
  });

  it('kết thúc bằng " đồng"', () => {
    expect(soThanhChu(123)).toMatch(/ đồng$/);
  });

  it('đọc "mười X" khi chục = 1 và đơn vị > 0', () => {
    const result = soThanhChu(15).toLowerCase();
    expect(result).toContain('mười');
    expect(result).toContain('năm');
  });
});

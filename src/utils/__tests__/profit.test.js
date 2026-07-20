import { describe, it, expect } from 'vitest';
import { PROFIT_THRESHOLD, getProfitThreshold, getProfitStatus } from '../profit.js';

describe('getProfitThreshold', () => {
  it('trả về ngưỡng riêng của từng loại dịch vụ', () => {
    expect(getProfitThreshold('ve_may_bay')).toBe(2);
    expect(getProfitThreshold('tour')).toBe(8);
    expect(getProfitThreshold('cruise')).toBe(5);
  });

  it('fallback về default khi serviceId không xác định', () => {
    expect(getProfitThreshold('loai_dich_vu_la')).toBe(PROFIT_THRESHOLD.default);
    expect(getProfitThreshold(undefined)).toBe(PROFIT_THRESHOLD.default);
  });
});

describe('getProfitStatus — cảnh báo lợi nhuận (rủi ro cao: sale/GĐ dựa vào đây quyết định giá)', () => {
  it('lỗ khi profitPct âm, bất kể ngưỡng dịch vụ', () => {
    expect(getProfitStatus(-5, 'tour').level).toBe('loss');
    expect(getProfitStatus(-0.1, 've_may_bay').level).toBe('loss');
  });

  it('cảnh báo khi dưới ngưỡng riêng của dịch vụ', () => {
    // vé máy bay ngưỡng 2% — 1% là thấp
    expect(getProfitStatus(1, 've_may_bay').level).toBe('warning');
    // tour ngưỡng 8% — 5% là thấp
    expect(getProfitStatus(5, 'tour').level).toBe('warning');
  });

  it('bình thường khi ở giữa ngưỡng và 1.5x ngưỡng', () => {
    // tour: threshold=8, 1.5x=12 -> 10% là "ok"
    expect(getProfitStatus(10, 'tour').level).toBe('ok');
  });

  it('tốt khi từ 1.5x ngưỡng trở lên', () => {
    expect(getProfitStatus(12, 'tour').level).toBe('good');
    expect(getProfitStatus(20, 'tour').level).toBe('good');
  });

  it('ranh giới đúng ngay tại ngưỡng: bằng threshold -> không còn warning', () => {
    expect(getProfitStatus(8, 'tour').level).toBe('ok');
  });

  it('ranh giới đúng ngay tại 1.5x threshold -> good', () => {
    expect(getProfitStatus(12, 'tour').level).toBe('good');
  });

  it('dịch vụ không xác định dùng ngưỡng default (5%)', () => {
    expect(getProfitStatus(3, 'dich_vu_la').level).toBe('warning');
    expect(getProfitStatus(6, 'dich_vu_la').level).toBe('ok');
  });

  it('mỗi trạng thái đều có đủ color/bg/label/icon để render UI', () => {
    [-1, 1, 10, 20].forEach(pct => {
      const s = getProfitStatus(pct, 'tour');
      expect(s.color).toBeTruthy();
      expect(s.bg).toBeTruthy();
      expect(s.label).toBeTruthy();
      expect(s.icon).toBeTruthy();
    });
  });
});

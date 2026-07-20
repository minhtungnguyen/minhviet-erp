import { describe, it, expect } from 'vitest';
import { getOpsStage, daysToDepart } from '../tourOpsStage.js';
import { daysFromNow } from './fixtures.js';

describe('getOpsStage — tiến độ vận hành tour', () => {
  it('stage 0 khi chưa có mốc nào và chưa giao HDV', () => {
    expect(getOpsStage({ opsMilestones: {} })).toBe(0);
    expect(getOpsStage({})).toBe(0);
  });

  it('stage 1 khi đã giao HDV (opsMilestones.assigned)', () => {
    expect(getOpsStage({ opsMilestones: { assigned: true } })).toBe(1);
  });

  it('stage 1 khi có hdvName dù chưa set milestone assigned (dữ liệu cũ)', () => {
    expect(getOpsStage({ hdvName: 'Nguyễn Văn HDV', opsMilestones: {} })).toBe(1);
  });

  it('stage 2 khi đã khởi hành', () => {
    expect(getOpsStage({ opsMilestones: { assigned: true, departed: true } })).toBe(2);
  });

  it('stage 3 khi đã về điểm cuối', () => {
    expect(getOpsStage({ opsMilestones: { assigned: true, departed: true, returned: true } })).toBe(3);
  });

  it('stage 4 khi đã quyết toán — ưu tiên cao nhất', () => {
    expect(getOpsStage({ opsMilestones: { settled: true } })).toBe(4);
  });

  it('settled=true vẫn trả về 4 dù các mốc trước đó false (dữ liệu bất thường)', () => {
    expect(getOpsStage({ opsMilestones: { assigned: false, departed: false, returned: false, settled: true } })).toBe(4);
  });
});

describe('daysToDepart', () => {
  it('trả về null khi không có ngày khởi hành', () => {
    expect(daysToDepart(null)).toBeNull();
    expect(daysToDepart(undefined)).toBeNull();
    expect(daysToDepart('')).toBeNull();
  });

  it('trả về số ngày dương khi khởi hành trong tương lai', () => {
    expect(daysToDepart(daysFromNow(2))).toBeGreaterThanOrEqual(1);
  });

  it('trả về số âm/0 khi ngày khởi hành đã qua', () => {
    expect(daysToDepart(daysFromNow(-3))).toBeLessThan(0);
  });
});

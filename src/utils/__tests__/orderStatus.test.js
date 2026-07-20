import { describe, it, expect } from 'vitest';
import { NEXT_STATUSES, getNextStatuses, canTransitionTo } from '../orderStatus.js';

describe('NEXT_STATUSES — máy trạng thái đơn hàng', () => {
  it('pending_payment chỉ được sang confirmed hoặc cancelled', () => {
    expect(NEXT_STATUSES.pending_payment).toEqual(['confirmed', 'cancelled']);
  });

  it('confirmed chỉ được sang in_progress hoặc cancelled', () => {
    expect(NEXT_STATUSES.confirmed).toEqual(['in_progress', 'cancelled']);
  });

  it('in_progress chỉ được sang closed hoặc cancelled', () => {
    expect(NEXT_STATUSES.in_progress).toEqual(['closed', 'cancelled']);
  });

  it('closed và cancelled là trạng thái cuối, không đi đâu được nữa', () => {
    expect(NEXT_STATUSES.closed).toEqual([]);
    expect(NEXT_STATUSES.cancelled).toEqual([]);
  });
});

describe('getNextStatuses', () => {
  it('trả về mảng bước hợp lệ tiếp theo', () => {
    expect(getNextStatuses('confirmed')).toEqual(['in_progress', 'cancelled']);
  });

  it('trả về mảng rỗng cho trạng thái không tồn tại', () => {
    expect(getNextStatuses('unknown_status')).toEqual([]);
  });

  it('trả về mảng rỗng khi status undefined', () => {
    expect(getNextStatuses(undefined)).toEqual([]);
  });
});

describe('canTransitionTo', () => {
  it('cho phép pending_payment -> confirmed', () => {
    expect(canTransitionTo('pending_payment', 'confirmed')).toBe(true);
  });

  it('không cho phép nhảy cóc pending_payment -> in_progress', () => {
    expect(canTransitionTo('pending_payment', 'in_progress')).toBe(false);
  });

  it('không cho phép nhảy cóc pending_payment -> closed', () => {
    expect(canTransitionTo('pending_payment', 'closed')).toBe(false);
  });

  it('không cho phép chuyển tiếp từ trạng thái đã đóng', () => {
    expect(canTransitionTo('closed', 'in_progress')).toBe(false);
  });

  it('không cho phép chuyển tiếp từ trạng thái đã hủy', () => {
    expect(canTransitionTo('cancelled', 'confirmed')).toBe(false);
  });

  it('luôn cho phép hủy đơn ở bất kỳ bước nào chưa đóng/hủy', () => {
    expect(canTransitionTo('pending_payment', 'cancelled')).toBe(true);
    expect(canTransitionTo('confirmed', 'cancelled')).toBe(true);
    expect(canTransitionTo('in_progress', 'cancelled')).toBe(true);
  });
});

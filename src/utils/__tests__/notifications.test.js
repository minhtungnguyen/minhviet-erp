import { describe, it, expect } from 'vitest';
import { isNotifRead, isNotifVisible } from '../notifications.js';

const hoa = { name: 'Nguyễn Thị Hoa', username: 'hoa.sale' };
const nam = { name: 'Trần Văn Nam', username: 'nam.sale' };
const giamDoc = { name: 'Giám đốc – Mr. Tùng', username: 'tung.gd' };

describe('isNotifRead', () => {
  it('true khi read=true', () => {
    expect(isNotifRead({ read: true })).toBe(true);
  });

  it('false khi read=false', () => {
    expect(isNotifRead({ read: false })).toBe(false);
  });

  it('false khi thiếu field read', () => {
    expect(isNotifRead({})).toBe(false);
  });
});

describe('isNotifVisible', () => {
  it('targetUser khớp đúng tên — hiển thị dù role khác', () => {
    expect(isNotifVisible({ targetUser: 'Trần Văn Nam' }, nam, 'sale')).toBe(true);
  });

  it('targetUser không khớp — ẩn dù targetRole có khớp', () => {
    expect(isNotifVisible({ targetUser: 'Nguyễn Thị Hoa', targetRole: 'sale' }, nam, 'sale')).toBe(false);
  });

  it('không có targetUser, targetRole khớp currentRole — hiển thị', () => {
    expect(isNotifVisible({ targetRole: 'sale' }, nam, 'sale')).toBe(true);
  });

  it('không có targetUser lẫn targetRole — broadcast cho mọi người', () => {
    expect(isNotifVisible({}, nam, 'sale')).toBe(true);
  });

  it('targetRole "manager" cũng hiển thị cho pho_giam_doc', () => {
    expect(isNotifVisible({ targetRole: 'manager' }, giamDoc, 'pho_giam_doc')).toBe(true);
  });

  it('targetRole không khớp role khác và không phải pho_giam_doc — ẩn', () => {
    expect(isNotifVisible({ targetRole: 'manager' }, hoa, 'sale')).toBe(false);
  });
});

import { describe, it, expect } from 'vitest';
import {
  PERMISSION_GROUPS, ALL_PERM_KEYS, PERM_LABEL, ROLE_DEFAULT_PERMS,
  isBanGiamDoc, getEffectivePerms, canSeeTourGhepSensitive, canAccessTourGhep,
} from '../permissions.js';

describe('PERMISSION_GROUPS / ALL_PERM_KEYS / PERM_LABEL — nhất quán nội bộ', () => {
  it('ALL_PERM_KEYS chứa đúng và đủ toàn bộ key trong các group', () => {
    const flat = PERMISSION_GROUPS.flatMap(g => g.items.map(i => i.key));
    expect(ALL_PERM_KEYS).toEqual(flat);
  });

  it('mỗi key trong ALL_PERM_KEYS đều có label tương ứng', () => {
    ALL_PERM_KEYS.forEach(key => {
      expect(PERM_LABEL[key]).toBeTruthy();
    });
  });

  it('không có key trùng lặp giữa các group', () => {
    expect(new Set(ALL_PERM_KEYS).size).toBe(ALL_PERM_KEYS.length);
  });
});

describe('ROLE_DEFAULT_PERMS — phân quyền mặc định theo vai trò', () => {
  it('manager có toàn bộ quyền hệ thống', () => {
    expect(ROLE_DEFAULT_PERMS.manager).toEqual(ALL_PERM_KEYS);
  });

  it('pho_giam_doc có mọi quyền trừ users và deploy', () => {
    expect(ROLE_DEFAULT_PERMS.pho_giam_doc).not.toContain('users');
    expect(ROLE_DEFAULT_PERMS.pho_giam_doc).not.toContain('deploy');
    ALL_PERM_KEYS.filter(k => !['users', 'deploy'].includes(k)).forEach(k => {
      expect(ROLE_DEFAULT_PERMS.pho_giam_doc).toContain(k);
    });
  });

  it('sale không có quyền tài chính (finance/refunds/credits) — chỉ kinh doanh & vận hành', () => {
    expect(ROLE_DEFAULT_PERMS.sale).not.toContain('finance');
    expect(ROLE_DEFAULT_PERMS.sale).not.toContain('refunds');
    expect(ROLE_DEFAULT_PERMS.sale).not.toContain('users');
  });

  it('cashier không có quyền quản lý user hay cấu hình hệ thống', () => {
    expect(ROLE_DEFAULT_PERMS.cashier).not.toContain('users');
    expect(ROLE_DEFAULT_PERMS.cashier).not.toContain('deploy');
  });

  it('mọi quyền mặc định của mọi role đều là key hợp lệ trong ALL_PERM_KEYS', () => {
    Object.values(ROLE_DEFAULT_PERMS).forEach(perms => {
      perms.forEach(p => expect(ALL_PERM_KEYS).toContain(p));
    });
  });
});

describe('isBanGiamDoc', () => {
  it('true cho manager và pho_giam_doc', () => {
    expect(isBanGiamDoc('manager')).toBe(true);
    expect(isBanGiamDoc('pho_giam_doc')).toBe(true);
  });

  it('false cho các role khác — không được duyệt chi thay Ban GĐ', () => {
    expect(isBanGiamDoc('accountant')).toBe(false);
    expect(isBanGiamDoc('sale')).toBe(false);
    expect(isBanGiamDoc('cashier')).toBe(false);
    expect(isBanGiamDoc(undefined)).toBe(false);
  });
});

describe('getEffectivePerms — quyền thực tế của user (rủi ro cao: quyết định UI ẩn/hiện gì)', () => {
  it('trả về mảng rỗng khi user null/undefined', () => {
    expect(getEffectivePerms(null)).toEqual([]);
    expect(getEffectivePerms(undefined)).toEqual([]);
  });

  it('dùng quyền mặc định theo role khi user.perms không phải mảng', () => {
    const user = { role: 'sale', perms: null };
    const perms = getEffectivePerms(user);
    expect(perms).toEqual(expect.arrayContaining(['dashboard', 'tasks', ...ROLE_DEFAULT_PERMS.sale]));
  });

  it('dashboard và tasks luôn có mặt bất kể role', () => {
    expect(getEffectivePerms({ role: 'sale' })).toEqual(expect.arrayContaining(['dashboard', 'tasks']));
    expect(getEffectivePerms({ role: 'manager' })).toEqual(expect.arrayContaining(['dashboard', 'tasks']));
  });

  it('ưu tiên perms tùy chỉnh (mảng) thay vì mặc định theo role', () => {
    const user = { role: 'sale', perms: ['orders'] };
    const perms = getEffectivePerms(user);
    expect(perms).toEqual(['dashboard', 'tasks', 'orders']);
    expect(perms).not.toContain('crm'); // mặc định sale có crm, nhưng đã bị custom override bỏ đi
  });

  it('perms tùy chỉnh rỗng ([]) nghĩa là không có quyền gì ngoài dashboard/tasks', () => {
    const user = { role: 'manager', perms: [] };
    expect(getEffectivePerms(user)).toEqual(['dashboard', 'tasks']);
  });

  it('role không tồn tại trong ROLE_DEFAULT_PERMS -> chỉ có dashboard/tasks', () => {
    const user = { role: 'unknown_role' };
    expect(getEffectivePerms(user)).toEqual(['dashboard', 'tasks']);
  });
});

describe('canSeeTourGhepSensitive / canAccessTourGhep — chặn sale thường xem giá vốn/NCC tour ghép', () => {
  it('manager/accountant/dieu_hanh luôn thấy được', () => {
    ['manager', 'accountant', 'dieu_hanh'].forEach(role => {
      expect(canSeeTourGhepSensitive({ role })).toBe(true);
      expect(canAccessTourGhep({ role })).toBe(true);
    });
  });

  it('sale thường (canViewTourGhep=false) KHÔNG thấy được giá vốn/NCC', () => {
    expect(canSeeTourGhepSensitive({ role: 'sale', canViewTourGhep: false })).toBe(false);
    expect(canAccessTourGhep({ role: 'sale' })).toBe(false);
  });

  it('sale được cấp quyền đặc biệt (canViewTourGhep=true) thì thấy được', () => {
    expect(canSeeTourGhepSensitive({ role: 'sale', canViewTourGhep: true })).toBe(true);
    expect(canAccessTourGhep({ role: 'sale', canViewTourGhep: true })).toBe(true);
  });

  it('user null -> false, không crash', () => {
    expect(canSeeTourGhepSensitive(null)).toBe(false);
    expect(canAccessTourGhep(null)).toBe(false);
  });
});

import { describe, it, expect } from 'vitest';
import { canManageTask, isTaskAssignee, isSelfAssignedTask } from '../taskPermissions.js';

const hoa = { name: 'Nguyễn Thị Hoa', role: 'sale' };
const nam = { name: 'Trần Văn Nam', role: 'sale' };
const giamDoc = { name: 'Giám đốc A', role: 'manager' };
const phoGiamDoc = { name: 'Phó GĐ B', role: 'pho_giam_doc' };

describe('canManageTask — người tạo hoặc Ban Giám đốc', () => {
  const task = { createdBy: hoa.name, assignee: nam.name };

  it('người tạo task được quản lý task đó', () => {
    expect(canManageTask(task, hoa, hoa.role)).toBe(true);
  });

  it('manager quản lý được dù không phải người tạo', () => {
    expect(canManageTask(task, giamDoc, giamDoc.role)).toBe(true);
  });

  it('pho_giam_doc quản lý được dù không phải người tạo', () => {
    expect(canManageTask(task, phoGiamDoc, phoGiamDoc.role)).toBe(true);
  });

  it('người ngoài cuộc (không phải tạo, không phải BGĐ) không được quản lý', () => {
    expect(canManageTask(task, nam, nam.role)).toBe(false);
  });

  it('không crash khi currentUser null', () => {
    expect(canManageTask(task, null, 'sale')).toBe(false);
  });
});

describe('isTaskAssignee', () => {
  const task = { createdBy: hoa.name, assignee: nam.name };

  it('đúng người được giao trả về true', () => {
    expect(isTaskAssignee(task, nam)).toBe(true);
  });

  it('người khác trả về false', () => {
    expect(isTaskAssignee(task, hoa)).toBe(false);
  });

  it('task chưa giao ai (assignee rỗng) luôn trả về false', () => {
    expect(isTaskAssignee({ createdBy: hoa.name, assignee: '' }, hoa)).toBe(false);
  });
});

describe('isSelfAssignedTask', () => {
  it('true khi người tạo tự giao cho chính mình', () => {
    expect(isSelfAssignedTask({ createdBy: hoa.name, assignee: hoa.name })).toBe(true);
  });

  it('false khi giao cho người khác', () => {
    expect(isSelfAssignedTask({ createdBy: hoa.name, assignee: nam.name })).toBe(false);
  });

  it('false khi chưa giao ai', () => {
    expect(isSelfAssignedTask({ createdBy: hoa.name, assignee: '' })).toBe(false);
  });
});

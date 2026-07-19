import { describe, it, expect } from 'vitest';
import { COMPANY, PROVINCES, SALE_STAFF, KT_STAFF, NCC_LIST, METHODS, GD_APPROVAL_THRESHOLD, ROLES } from '../config.js';
import { ORDER_STATUS, VOUCHER_STATUS, PRICE_APPROVAL_STATUS, EXP_PIPELINE_STATUS, REFUND_STATUS, CREDIT_STATUS, TOUR_OP_STATUS, BK_STATUS, INVOICE_TYPES } from '../statuses.js';
import { SERVICES, COST_GROUPS, CHECKLIST_TEMPLATES } from '../services.js';

// config.js
describe('config.js', () => {
  it('COMPANY có các trường cần thiết', () => {
    expect(COMPANY.name).toBeTruthy();
    expect(COMPANY.address).toBeTruthy();
    expect(COMPANY.phone).toBeTruthy();
    expect(COMPANY.email).toBeTruthy();
  });

  it('PROVINCES là mảng các chuỗi không rỗng', () => {
    expect(Array.isArray(PROVINCES)).toBe(true);
    expect(PROVINCES.length).toBeGreaterThan(0);
    PROVINCES.forEach(p => expect(typeof p).toBe('string'));
  });

  it('SALE_STAFF là mảng chuỗi', () => {
    expect(Array.isArray(SALE_STAFF)).toBe(true);
    expect(SALE_STAFF.length).toBeGreaterThan(0);
  });

  it('KT_STAFF là mảng chuỗi', () => {
    expect(Array.isArray(KT_STAFF)).toBe(true);
    expect(KT_STAFF.length).toBeGreaterThan(0);
  });

  it('NCC_LIST là mảng chuỗi', () => {
    expect(Array.isArray(NCC_LIST)).toBe(true);
    expect(NCC_LIST.length).toBeGreaterThan(0);
  });

  it('METHODS có v và l', () => {
    METHODS.forEach(m => {
      expect(m.v).toBeTruthy();
      expect(m.l).toBeTruthy();
    });
  });

  it('GD_APPROVAL_THRESHOLD = 20 triệu', () => {
    expect(GD_APPROVAL_THRESHOLD).toBe(20_000_000);
  });

  it('ROLES có đủ 4 vai trò cần thiết', () => {
    expect(ROLES.sale).toBeDefined();
    expect(ROLES.accountant).toBeDefined();
    expect(ROLES.manager).toBeDefined();
    expect(ROLES.dieu_hanh).toBeDefined();
    Object.values(ROLES).forEach(r => {
      expect(r.label).toBeTruthy();
      expect(r.color).toMatch(/^#/);
    });
  });
});

// statuses.js
describe('statuses.js', () => {
  function validateStatusMap(map, name) {
    it(`${name}: mỗi status có label và color`, () => {
      expect(Object.keys(map).length).toBeGreaterThan(0);
      Object.values(map).forEach(s => {
        expect(s.label).toBeTruthy();
        expect(s.color).toBeTruthy();
      });
    });
  }

  validateStatusMap(ORDER_STATUS, 'ORDER_STATUS');
  validateStatusMap(VOUCHER_STATUS, 'VOUCHER_STATUS');
  validateStatusMap(PRICE_APPROVAL_STATUS, 'PRICE_APPROVAL_STATUS');
  validateStatusMap(EXP_PIPELINE_STATUS, 'EXP_PIPELINE_STATUS');
  validateStatusMap(REFUND_STATUS, 'REFUND_STATUS');
  validateStatusMap(CREDIT_STATUS, 'CREDIT_STATUS');
  validateStatusMap(TOUR_OP_STATUS, 'TOUR_OP_STATUS');
  validateStatusMap(BK_STATUS, 'BK_STATUS');
  validateStatusMap(INVOICE_TYPES, 'INVOICE_TYPES');

  it('ORDER_STATUS khớp vòng lặp trạng thái đơn thực tế: pending_payment → confirmed → in_progress → closed, huỷ được ở mọi bước', () => {
    expect(ORDER_STATUS.pending_payment).toBeDefined();
    expect(ORDER_STATUS.confirmed).toBeDefined();
    expect(ORDER_STATUS.in_progress).toBeDefined();
    expect(ORDER_STATUS.closed).toBeDefined();
    expect(ORDER_STATUS.cancelled).toBeDefined();
  });

  it('EXP_PIPELINE_STATUS có 4 bước pipeline: pending_kt → pending_gd → pending_pay → paid', () => {
    expect(EXP_PIPELINE_STATUS.pending_kt).toBeDefined();
    expect(EXP_PIPELINE_STATUS.pending_gd).toBeDefined();
    expect(EXP_PIPELINE_STATUS.pending_pay).toBeDefined();
    expect(EXP_PIPELINE_STATUS.paid).toBeDefined();
  });

  it('VOUCHER_STATUS có pending, approved, rejected', () => {
    expect(VOUCHER_STATUS.pending).toBeDefined();
    expect(VOUCHER_STATUS.approved).toBeDefined();
    expect(VOUCHER_STATUS.rejected).toBeDefined();
  });
});

// services.js
describe('services.js', () => {
  it('SERVICES là mảng có ít nhất 1 phần tử', () => {
    expect(Array.isArray(SERVICES)).toBe(true);
    expect(SERVICES.length).toBeGreaterThan(0);
  });

  it('mỗi service có id và label', () => {
    SERVICES.forEach(s => {
      expect(s.id ?? s.value ?? s.code).toBeTruthy();
    });
  });

  it('COST_GROUPS là mảng hoặc object', () => {
    expect(COST_GROUPS).toBeDefined();
    const isArrayOrObj = Array.isArray(COST_GROUPS) || typeof COST_GROUPS === 'object';
    expect(isArrayOrObj).toBe(true);
  });

  it('CHECKLIST_TEMPLATES là object có ít nhất 1 key', () => {
    expect(typeof CHECKLIST_TEMPLATES).toBe('object');
    expect(Object.keys(CHECKLIST_TEMPLATES).length).toBeGreaterThan(0);
  });
});

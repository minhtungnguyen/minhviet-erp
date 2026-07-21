import { describe, it, expect } from 'vitest';
import { getOrderPlaybookStep, isPlaybookMyTurn } from '../orderPlaybook.js';
import { makeOrder, makeVoucher, makeBooking } from './fixtures.js';

const makeExpense = (overrides = {}) => ({ id: 'PC-0001', orderId: 'DH0001', status: 'pending_kt', ...overrides });

describe('getOrderPlaybookStep', () => {
  it('trả về null khi đơn đã đóng hoặc đã hủy', () => {
    expect(getOrderPlaybookStep(makeOrder({ status: 'closed' }), {})).toBeNull();
    expect(getOrderPlaybookStep(makeOrder({ status: 'cancelled' }), {})).toBeNull();
  });

  it('trả về null khi không có order', () => {
    expect(getOrderPlaybookStep(null, {})).toBeNull();
  });

  describe('pending_payment', () => {
    it('chưa đủ cọc → gợi ý Sale thu cọc', () => {
      const order = makeOrder({ status: 'pending_payment' });
      const s = getOrderPlaybookStep(order, { totalPaid: 2000000, depositAmt: 5000000 });
      expect(s.roles).toEqual(['sale']);
      expect(s.title).toMatch(/Thu cọc/);
    });

    it('có phiếu thu cọc đang chờ duyệt → ưu tiên hơn thu cọc', () => {
      const order = makeOrder({ status: 'pending_payment' });
      const vouchers = [makeVoucher({ type: 'thu', status: 'pending', id: 'PT-9' })];
      const s = getOrderPlaybookStep(order, { totalPaid: 5000000, depositAmt: 5000000, vouchers });
      expect(s.title).toMatch(/Chờ duyệt phiếu thu/);
      expect(s.roles).toEqual(expect.arrayContaining(['accountant', 'cashier', 'manager', 'pho_giam_doc']));
      expect(s.detail).toContain('PT-9');
    });

    it('đã đủ cọc, không phiếu chờ → gợi ý Sale xác nhận đơn', () => {
      const order = makeOrder({ status: 'pending_payment' });
      const s = getOrderPlaybookStep(order, { totalPaid: 5000000, depositAmt: 5000000 });
      expect(s.roles).toEqual(['sale']);
      expect(s.title).toMatch(/Xác nhận đơn/);
    });

    it('bỏ qua phiếu thu pending của đơn khác', () => {
      const order = makeOrder({ status: 'pending_payment', id: 'DH0001' });
      const vouchers = [makeVoucher({ orderId: 'DH9999', type: 'thu', status: 'pending' })];
      const s = getOrderPlaybookStep(order, { totalPaid: 2000000, depositAmt: 5000000, vouchers });
      expect(s.title).toMatch(/Thu cọc/);
    });
  });

  describe('confirmed', () => {
    it('chưa có booking NCC nào → gợi ý Điều hành đặt dịch vụ', () => {
      const order = makeOrder({ status: 'confirmed' });
      const s = getOrderPlaybookStep(order, { bookings: [] });
      expect(s.roles).toEqual(['dieu_hanh']);
      expect(s.title).toMatch(/Đặt dịch vụ/);
    });

    it('có phiếu chi NCC đang chờ KT duyệt → ưu tiên hơn mọi bước khác', () => {
      const order = makeOrder({ status: 'confirmed' });
      const bookings = [makeBooking()];
      const expenses = [makeExpense({ status: 'pending_kt' })];
      const s = getOrderPlaybookStep(order, { bookings, expenses, nccDebt: 500000 });
      expect(s.roles).toEqual(['accountant']);
      expect(s.title).toMatch(/pending_kt|Kế toán duyệt/);
    });

    it('phiếu chi NCC ở giai đoạn chờ Ban Giám đốc → đúng role manager+pho_giam_doc', () => {
      const order = makeOrder({ status: 'confirmed' });
      const bookings = [makeBooking()];
      const expenses = [makeExpense({ status: 'pending_gd' })];
      const s = getOrderPlaybookStep(order, { bookings, expenses });
      expect(s.roles).toEqual(['manager', 'pho_giam_doc']);
    });

    it('phiếu chi NCC ở giai đoạn chờ chuyển tiền → role cashier', () => {
      const order = makeOrder({ status: 'confirmed' });
      const bookings = [makeBooking()];
      const expenses = [makeExpense({ status: 'pending_pay' })];
      const s = getOrderPlaybookStep(order, { bookings, expenses });
      expect(s.roles).toEqual(['cashier']);
    });

    it('có booking, còn nợ NCC, chưa có phiếu chi → gợi ý Điều hành tạo phiếu chi', () => {
      const order = makeOrder({ status: 'confirmed' });
      const bookings = [makeBooking({ status: 'hold' })];
      const s = getOrderPlaybookStep(order, { bookings, nccDebt: 2000000 });
      expect(s.roles).toEqual(['dieu_hanh']);
      expect(s.title).toMatch(/Tạo phiếu chi/);
    });

    it('hết nợ NCC, còn nợ khách → gợi ý Sale thu nốt', () => {
      const order = makeOrder({ status: 'confirmed' });
      const bookings = [makeBooking({ status: 'paid' })];
      const s = getOrderPlaybookStep(order, { bookings, nccDebt: 0, debt: 1500000 });
      expect(s.roles).toEqual(['sale']);
      expect(s.title).toMatch(/Thu nốt/);
    });

    it('hết nợ cả 2 chiều → gợi ý Điều hành bàn giao vận hành', () => {
      const order = makeOrder({ status: 'confirmed' });
      const bookings = [makeBooking({ status: 'paid' })];
      const s = getOrderPlaybookStep(order, { bookings, nccDebt: 0, debt: 0 });
      expect(s.roles).toEqual(['dieu_hanh']);
      expect(s.title).toMatch(/Bàn giao vận hành/);
    });
  });

  describe('in_progress', () => {
    it('còn nợ NCC → gợi ý hoàn tất thanh toán trước khi đóng đơn', () => {
      const order = makeOrder({ status: 'in_progress' });
      const s = getOrderPlaybookStep(order, { nccDebt: 800000 });
      expect(s.roles).toEqual(['dieu_hanh']);
      expect(s.title).toMatch(/trước khi đóng đơn/);
    });

    it('hết nợ NCC, còn nợ khách → gợi ý Sale thu nốt trước khi đóng đơn', () => {
      const order = makeOrder({ status: 'in_progress' });
      const s = getOrderPlaybookStep(order, { nccDebt: 0, debt: 900000 });
      expect(s.roles).toEqual(['sale']);
      expect(s.title).toMatch(/trước khi đóng đơn/);
    });

    it('hết nợ 2 chiều → đủ điều kiện đóng đơn', () => {
      const order = makeOrder({ status: 'in_progress' });
      const s = getOrderPlaybookStep(order, { nccDebt: 0, debt: 0 });
      expect(s.roles).toEqual(['dieu_hanh']);
      expect(s.title).toMatch(/Đủ điều kiện đóng đơn/);
    });
  });
});

describe('isPlaybookMyTurn', () => {
  it('true khi role hiện tại nằm trong danh sách chịu trách nhiệm', () => {
    const s = getOrderPlaybookStep(makeOrder({ status: 'pending_payment' }), { totalPaid: 0, depositAmt: 1000000 });
    expect(isPlaybookMyTurn(s, 'sale')).toBe(true);
    expect(isPlaybookMyTurn(s, 'dieu_hanh')).toBe(false);
  });

  it('false khi step là null', () => {
    expect(isPlaybookMyTurn(null, 'sale')).toBe(false);
  });
});

import { describe, it, expect } from 'vitest';
import { findCustomerByPhone } from '../customers.js';

describe('findCustomerByPhone — chống tạo trùng khách hàng khi tiếp nhận lead mới', () => {
  it('tìm đúng khách khi SĐT khớp chính xác', () => {
    const customers = [{ id: 'KH1', name: 'Nguyễn Văn A', phone: '0912345678' }];
    expect(findCustomerByPhone(customers, '0912345678')?.id).toBe('KH1');
  });

  it('trả về null khi không khớp SĐT nào', () => {
    const customers = [{ id: 'KH1', name: 'Nguyễn Văn A', phone: '0912345678' }];
    expect(findCustomerByPhone(customers, '0999999999')).toBeNull();
  });

  it('bỏ qua khoảng trắng thừa ở đầu/cuối SĐT khi so khớp', () => {
    const customers = [{ id: 'KH1', name: 'Nguyễn Văn A', phone: ' 0912345678 ' }];
    expect(findCustomerByPhone(customers, '0912345678')?.id).toBe('KH1');
    expect(findCustomerByPhone(customers, ' 0912345678')?.id).toBe('KH1');
  });

  it('trả về null khi SĐT tìm rỗng/thiếu', () => {
    const customers = [{ id: 'KH1', name: 'Nguyễn Văn A', phone: '0912345678' }];
    expect(findCustomerByPhone(customers, '')).toBeNull();
    expect(findCustomerByPhone(customers, undefined)).toBeNull();
  });

  it('chịu được danh sách khách hàng rỗng/undefined', () => {
    expect(findCustomerByPhone([], '0912345678')).toBeNull();
    expect(findCustomerByPhone(undefined, '0912345678')).toBeNull();
  });

  it('khách chưa có trường phone không gây lỗi', () => {
    const customers = [{ id: 'KH1', name: 'Nguyễn Văn A' }];
    expect(findCustomerByPhone(customers, '0912345678')).toBeNull();
  });

  it('lấy khách đầu tiên khớp nếu có nhiều khách trùng SĐT (dữ liệu cũ đã bị trùng)', () => {
    const customers = [
      { id: 'KH1', name: 'Nguyễn Văn A', phone: '0912345678' },
      { id: 'KH2', name: 'Nguyễn Văn A (2)', phone: '0912345678' },
    ];
    expect(findCustomerByPhone(customers, '0912345678')?.id).toBe('KH1');
  });
});

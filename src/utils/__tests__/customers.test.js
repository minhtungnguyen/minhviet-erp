import { describe, it, expect } from 'vitest';
import { findCustomerByPhone, vietnameseGivenName, customerDisplayName } from '../customers.js';

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

describe('customerDisplayName — khách DN hiển thị tên công ty, không phải tên người đại diện', () => {
  it('khách DN có companyName riêng biệt với name (người đại diện) → hiện companyName', () => {
    expect(customerDisplayName({ type: 'corp', name: 'Nguyễn Văn Đại Diện', companyName: 'Công ty CP ABC' })).toBe('Công ty CP ABC');
  });

  it('khách DN chưa nhập companyName → fallback về name để không hiện rỗng', () => {
    expect(customerDisplayName({ type: 'corp', name: 'Nguyễn Văn Đại Diện' })).toBe('Nguyễn Văn Đại Diện');
  });

  it('khách cá nhân luôn hiện name, bỏ qua companyName nếu có (dữ liệu lạ)', () => {
    expect(customerDisplayName({ type: 'personal', name: 'Trần Thị B', companyName: 'Không liên quan' })).toBe('Trần Thị B');
  });

  it('chịu được input rỗng/thiếu, không lỗi', () => {
    expect(customerDisplayName({})).toBe('');
    expect(customerDisplayName(undefined)).toBe('');
  });
});

describe('vietnameseGivenName — lấy tên riêng để sắp xếp "Theo tên" (không phải Họ)', () => {
  it('lấy từ cuối cùng của họ tên đầy đủ làm tên riêng', () => {
    expect(vietnameseGivenName({ name: 'Nguyễn Văn An', type: 'personal' })).toBe('An');
  });

  it('tên chỉ có 1 từ vẫn trả về đúng từ đó', () => {
    expect(vietnameseGivenName({ name: 'Lan', type: 'personal' })).toBe('Lan');
  });

  it('bỏ khoảng trắng thừa quanh tên và giữa các từ', () => {
    expect(vietnameseGivenName({ name: '  Trần   Thị   Bích  ', type: 'personal' })).toBe('Bích');
  });

  it('khách doanh nghiệp giữ nguyên tên đầy đủ (không tách từ cuối)', () => {
    expect(vietnameseGivenName({ name: 'Công ty CP Du lịch ABC', type: 'corp' })).toBe('Công ty CP Du lịch ABC');
    expect(vietnameseGivenName({ name: 'Công ty CP Du lịch ABC', type: 'corporate' })).toBe('Công ty CP Du lịch ABC');
  });

  it('khách doanh nghiệp sắp xếp theo companyName, không phải tên người đại diện', () => {
    expect(vietnameseGivenName({ type: 'corp', name: 'Nguyễn Văn Đại Diện', companyName: 'ABC Corp' })).toBe('ABC Corp');
  });

  it('trả về chuỗi rỗng khi thiếu tên, không lỗi', () => {
    expect(vietnameseGivenName({ name: '', type: 'personal' })).toBe('');
    expect(vietnameseGivenName({})).toBe('');
    expect(vietnameseGivenName(undefined)).toBe('');
  });

  it('sort theo vietnameseGivenName xếp đúng theo tên riêng, không theo Họ', () => {
    const list = [
      { name: 'Trần Văn Bình' },
      { name: 'Nguyễn Văn An' },
      { name: 'Lê Thị Cường' },
    ];
    const sorted = [...list].sort((a, b) => vietnameseGivenName(a).localeCompare(vietnameseGivenName(b), 'vi'));
    expect(sorted.map(c => c.name)).toEqual(['Nguyễn Văn An', 'Trần Văn Bình', 'Lê Thị Cường']);
  });
});

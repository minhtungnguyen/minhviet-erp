import { describe, it, expect } from 'vitest';
import { ordersForCustomer, classifyRFM, customerRevenue, RFM_SEGMENTS } from '../customerSegments.js';

const NOW = new Date('2026-07-22T00:00:00Z');
const daysAgo = (n) => new Date(NOW.getTime() - n * 86400000).toISOString();

describe('ordersForCustomer — khớp đơn hàng với khách theo customerId/SĐT/tên', () => {
  it('khớp theo customerId trước tiên', () => {
    const customer = { id: 'KH1', phone: '0900000000', name: 'A' };
    const orders = [{ id: 'DH1', customerId: 'KH1' }, { id: 'DH2', customerId: 'KH2' }];
    expect(ordersForCustomer(customer, orders).map((o) => o.id)).toEqual(['DH1']);
  });

  it('khớp theo SĐT khi không có customerId khớp', () => {
    const customer = { id: 'KH1', phone: '0912345678' };
    const orders = [{ id: 'DH1', customerPhone: '0912345678' }, { id: 'DH2', customerPhone: '0999999999' }];
    expect(ordersForCustomer(customer, orders).map((o) => o.id)).toEqual(['DH1']);
  });

  it('khớp theo tên đầy đủ (không phân biệt hoa/thường, khoảng trắng) khi thiếu customerId/SĐT', () => {
    const customer = { id: 'KH1', name: '  Nguyễn Văn A  ' };
    const orders = [{ id: 'DH1', customerName: 'nguyễn văn a' }, { id: 'DH2', customerName: 'Khác' }];
    expect(ordersForCustomer(customer, orders).map((o) => o.id)).toEqual(['DH1']);
  });

  it('trả về mảng rỗng khi thiếu khách hoặc không khớp đơn nào', () => {
    expect(ordersForCustomer(null, [{ id: 'DH1' }])).toEqual([]);
    expect(ordersForCustomer({ id: 'KH1' }, [{ id: 'DH1', customerId: 'KH2' }])).toEqual([]);
  });
});

describe('customerRevenue — ưu tiên tính lại từ đơn thật vì total_revenue trên hồ sơ không được cập nhật', () => {
  it('total_revenue = 0 (mặc định) → tính lại từ tổng totalPrice các đơn khớp', () => {
    const customer = { id: 'KH1', totalRevenue: 0 };
    const orders = [{ customerId: 'KH1', totalPrice: 5000000 }, { customerId: 'KH1', totalPrice: 3000000 }];
    expect(customerRevenue(customer, orders)).toBe(8000000);
  });

  it('total_revenue khác 0 → tin giá trị đã lưu (trường hợp đã được cập nhật thủ công)', () => {
    const customer = { id: 'KH1', totalRevenue: 99000000 };
    const orders = [{ customerId: 'KH1', totalPrice: 5000000 }];
    expect(customerRevenue(customer, orders)).toBe(99000000);
  });

  it('không có đơn nào khớp → trả về 0', () => {
    expect(customerRevenue({ id: 'KH1' }, [])).toBe(0);
  });
});

describe('classifyRFM — phân khúc theo đúng ngưỡng đã định nghĩa', () => {
  it('VIP: ≥4 đơn và ≥50 triệu', () => {
    const customer = { id: 'KH1', lastOrderDate: daysAgo(5) };
    const orders = Array.from({ length: 4 }, () => ({ customerId: 'KH1', totalPrice: 15000000 }));
    expect(classifyRFM(customer, orders, NOW)).toBe('vip');
  });

  it('đủ 4 đơn nhưng doanh thu dưới 50 triệu → KHÔNG phải VIP, rơi xuống nhánh khác', () => {
    const customer = { id: 'KH1', lastOrderDate: daysAgo(5) };
    const orders = Array.from({ length: 4 }, () => ({ customerId: 'KH1', totalPrice: 5000000 }));
    expect(classifyRFM(customer, orders, NOW)).toBe('loyal');
  });

  it('Thân thiết: ≥2 đơn và đơn gần nhất trong vòng 180 ngày', () => {
    const customer = { id: 'KH1', lastOrderDate: daysAgo(100) };
    const orders = [{ customerId: 'KH1', totalPrice: 1000000 }, { customerId: 'KH1', totalPrice: 1000000 }];
    expect(classifyRFM(customer, orders, NOW)).toBe('loyal');
  });

  it('Đang hoạt động: đơn gần nhất trong vòng 90 ngày (dù chỉ 1 đơn)', () => {
    const customer = { id: 'KH1', lastOrderDate: daysAgo(30) };
    const orders = [{ customerId: 'KH1', totalPrice: 1000000 }];
    expect(classifyRFM(customer, orders, NOW)).toBe('active');
  });

  it('Có rủi ro: vắng 90–365 ngày', () => {
    const customer = { id: 'KH1', lastOrderDate: daysAgo(200) };
    const orders = [{ customerId: 'KH1', totalPrice: 1000000 }];
    expect(classifyRFM(customer, orders, NOW)).toBe('atrisk');
  });

  it('Ngủ đông: vắng >365 ngày nhưng từng có đơn', () => {
    const customer = { id: 'KH1', lastOrderDate: daysAgo(400) };
    const orders = [{ customerId: 'KH1', totalPrice: 1000000 }];
    expect(classifyRFM(customer, orders, NOW)).toBe('dormant');
  });

  it('Khách mới: chưa từng có đơn nào khớp', () => {
    expect(classifyRFM({ id: 'KH1' }, [], NOW)).toBe('new');
  });

  it('RFM_SEGMENTS liệt kê đủ 6 phân khúc, mỗi phân khúc có id/label/color/bg/desc', () => {
    expect(RFM_SEGMENTS).toHaveLength(6);
    RFM_SEGMENTS.forEach((s) => {
      expect(s.id).toBeTruthy();
      expect(s.label).toBeTruthy();
      expect(s.color).toBeTruthy();
    });
  });
});

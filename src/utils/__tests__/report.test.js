import { describe, it, expect, vi, beforeEach } from 'vitest';
import { aggByMonth, aggByQuarter, aggByYear, aggByService, aggBySale, getDebtList, exportRevenueXlsx, exportServiceXlsx, exportSaleXlsx, exportDebtXlsx, exportFullReport } from '../report.js';

// Mock XLSX.writeFile để không tạo file thật
vi.mock('xlsx', async () => {
  const actual = await vi.importActual('xlsx');
  return {
    ...actual,
    writeFile: vi.fn(),
  };
});

// --- Test data ---
const mkOrder = (overrides) => ({
  id: 'O001',
  status: 'confirmed',
  service: 'tour',
  serviceName: 'Tour HN',
  sale: 'Hoa',
  customer: { name: 'KH', phone: '09' },
  createdAt: '2025-03-15',
  departDate: '2025-04-01',
  pricing: { totalRevenue: 10_000_000, totalCost: 7_000_000, profit: 3_000_000 },
  ...overrides,
});

describe('aggByMonth', () => {
  it('trả về 12 tháng cho năm', () => {
    const result = aggByMonth([], 2025);
    expect(result).toHaveLength(12);
    expect(result[0].label).toBe('T1');
    expect(result[11].label).toBe('T12');
  });

  it('tính doanh thu cho đơn trong năm', () => {
    const orders = [mkOrder({ createdAt: '2025-03-10' })];
    const result = aggByMonth(orders, 2025);
    const mar = result.find(r => r.label === 'T3');
    expect(mar.revenue).toBe(10_000_000);
    expect(mar.count).toBe(1);
  });

  it('bỏ qua đơn bị hủy', () => {
    const orders = [mkOrder({ status: 'cancelled', createdAt: '2025-03-10' })];
    const result = aggByMonth(orders, 2025);
    const mar = result.find(r => r.label === 'T3');
    expect(mar.revenue).toBe(0);
  });

  it('bỏ qua đơn năm khác', () => {
    const orders = [mkOrder({ createdAt: '2024-03-10' })];
    const result = aggByMonth(orders, 2025);
    expect(result.every(r => r.count === 0)).toBe(true);
  });

  it('dùng departDate khi không có createdAt', () => {
    const orders = [mkOrder({ createdAt: undefined, departDate: '2025-05-20' })];
    const result = aggByMonth(orders, 2025);
    const may = result.find(r => r.label === 'T5');
    expect(may.count).toBe(1);
  });
});

describe('aggByQuarter', () => {
  it('trả về 4 quý', () => {
    expect(aggByQuarter([], 2025)).toHaveLength(4);
  });

  it('Q1 = T1-T3', () => {
    const orders = [mkOrder({ createdAt: '2025-02-10' })];
    const result = aggByQuarter(orders, 2025);
    const q1 = result.find(r => r.label === 'Q1');
    expect(q1.count).toBe(1);
    expect(q1.revenue).toBe(10_000_000);
  });

  it('Q4 = T10-T12', () => {
    const orders = [mkOrder({ createdAt: '2025-11-15' })];
    const result = aggByQuarter(orders, 2025);
    const q4 = result.find(r => r.label === 'Q4');
    expect(q4.count).toBe(1);
  });
});

describe('aggByYear', () => {
  it('trả về mảng rỗng khi không có đơn', () => {
    expect(aggByYear([])).toEqual([]);
  });

  it('nhóm đúng theo năm', () => {
    const orders = [
      mkOrder({ id: 'A', createdAt: '2024-05-01' }),
      mkOrder({ id: 'B', createdAt: '2025-03-01' }),
    ];
    const result = aggByYear(orders);
    expect(result).toHaveLength(2);
    expect(result.find(r => r.year === '2024').count).toBe(1);
    expect(result.find(r => r.year === '2025').count).toBe(1);
  });

  it('sắp xếp theo năm tăng dần', () => {
    const orders = [
      mkOrder({ id: 'B', createdAt: '2025-01-01' }),
      mkOrder({ id: 'A', createdAt: '2023-01-01' }),
    ];
    const result = aggByYear(orders);
    expect(result[0].year).toBe('2023');
    expect(result[1].year).toBe('2025');
  });

  it('cộng dồn doanh thu cho nhiều đơn cùng năm', () => {
    const orders = [
      mkOrder({ id: 'A', createdAt: '2025-03-01' }),
      mkOrder({ id: 'B', createdAt: '2025-06-01' }),
    ];
    const result = aggByYear(orders);
    expect(result[0].count).toBe(2);
    expect(result[0].revenue).toBe(20_000_000);
  });

  it('dùng "N/A" khi không có ngày', () => {
    const orders = [mkOrder({ createdAt: undefined, departDate: undefined })];
    const result = aggByYear(orders);
    expect(result[0].year).toBe('N/A');
  });
});

describe('aggByService', () => {
  it('nhóm đúng theo service', () => {
    const orders = [
      mkOrder({ id: 'A', service: 'tour' }),
      mkOrder({ id: 'B', service: 'visa' }),
      mkOrder({ id: 'C', service: 'tour' }),
    ];
    const result = aggByService(orders);
    const tourRow = result.find(r => r.service === 'tour');
    expect(tourRow.count).toBe(2);
  });

  it('sắp xếp theo doanh thu giảm dần', () => {
    const orders = [
      mkOrder({ id: 'A', service: 'visa', pricing: { totalRevenue: 1e6, totalCost: 0, profit: 1e6 } }),
      mkOrder({ id: 'B', service: 'tour', pricing: { totalRevenue: 10e6, totalCost: 7e6, profit: 3e6 } }),
    ];
    const result = aggByService(orders);
    expect(result[0].service).toBe('tour');
  });

  it('dùng "other" khi không có service', () => {
    const orders = [mkOrder({ service: undefined })];
    const result = aggByService(orders);
    expect(result[0].service).toBe('other');
  });

  it('cộng dồn doanh thu cho nhiều đơn cùng service', () => {
    const orders = [
      mkOrder({ id: 'A', service: 'tour' }),
      mkOrder({ id: 'B', service: 'tour' }),
    ];
    const result = aggByService(orders);
    expect(result[0].count).toBe(2);
  });

  it('dùng service code làm label khi không có trong SVC_LABEL', () => {
    const orders = [mkOrder({ service: 'loai_moi' })];
    const result = aggByService(orders);
    expect(result[0].label).toBe('loai_moi');
  });
});

describe('aggBySale', () => {
  it('nhóm theo nhân viên sale', () => {
    const orders = [
      mkOrder({ id: 'A', sale: 'Hoa', createdAt: '2025-03-01' }),
      mkOrder({ id: 'B', sale: 'Nam', createdAt: '2025-03-01' }),
      mkOrder({ id: 'C', sale: 'Hoa', createdAt: '2025-03-01' }),
    ];
    const result = aggBySale(orders, [], 2025, null);
    const hoa = result.find(r => r.name === 'Hoa');
    expect(hoa.count).toBe(2);
  });

  it('lọc đúng tháng khi có month', () => {
    const orders = [
      mkOrder({ id: 'A', sale: 'Hoa', createdAt: '2025-03-01' }),
      mkOrder({ id: 'B', sale: 'Hoa', createdAt: '2025-05-01' }),
    ];
    const result = aggBySale(orders, [], 2025, 3);
    const hoa = result.find(r => r.name === 'Hoa');
    expect(hoa.count).toBe(1);
  });

  it('fill target từ personalTargets', () => {
    const orders = [mkOrder({ sale: 'Nguyễn Thị Hoa', createdAt: '2025-03-01' })];
    const targets = [{ username: 'hoa.sale', month: '03/2025', target: 50_000_000 }];
    const result = aggBySale(orders, targets, 2025, 3);
    const row = result.find(r => r.name === 'Nguyễn Thị Hoa');
    expect(row.target).toBe(50_000_000);
  });

  it('dùng "Chưa gán" khi không có sale', () => {
    const orders = [mkOrder({ sale: undefined, createdAt: '2025-03-01' })];
    const result = aggBySale(orders, [], 2025, null);
    expect(result[0].name).toBe('Chưa gán');
  });

  it('không thêm target khi username không khớp sale nào', () => {
    const orders = [mkOrder({ sale: 'Hoa', createdAt: '2025-03-01' })];
    const targets = [{ username: 'khong.ton.tai', month: '03/2025', target: 50_000_000 }];
    const result = aggBySale(orders, targets, 2025, 3);
    expect(result[0].target).toBe(0);
  });

  it('xử lý personalTargets = null', () => {
    const orders = [mkOrder({ sale: 'Hoa', createdAt: '2025-03-01' })];
    const result = aggBySale(orders, null, 2025, null);
    expect(result[0].target).toBe(0);
  });

  it('bỏ qua targets không khớp tháng khi lọc theo tháng', () => {
    const orders = [mkOrder({ sale: 'Hoa', createdAt: '2025-03-01' })];
    const targets = [{ username: 'hoa.sale', month: '05/2025', target: 50_000_000 }];
    const result = aggBySale(orders, targets, 2025, 3);
    expect(result[0].target).toBe(0);
  });
});

describe('getDebtList', () => {
  const order = mkOrder({ status: 'confirmed', pricing: { totalRevenue: 10_000_000, totalCost: 7e6, profit: 3e6 } });
  const vouchers = [
    { orderId: 'O001', type: 'thu', status: 'approved', amount: 3_000_000 },
    { orderId: 'O001', type: 'thu', status: 'pending', amount: 1_000_000 }, // chưa duyệt - không tính
    { orderId: 'O001', type: 'chi', status: 'approved', amount: 2_000_000 }, // chi - không tính
  ];

  it('tính đúng số tiền còn nợ', () => {
    const result = getDebtList([order], vouchers);
    expect(result[0].totalPaid).toBe(3_000_000);
    expect(result[0].debt).toBe(7_000_000);
  });

  it('bỏ qua đơn đã hủy và hoàn thành', () => {
    const cancelled = mkOrder({ id: 'X', status: 'cancelled' });
    const completed = mkOrder({ id: 'Y', status: 'completed' });
    expect(getDebtList([cancelled, completed], [])).toHaveLength(0);
  });

  it('bỏ qua đơn không có nợ (đã trả đủ)', () => {
    const v = [{ orderId: 'O001', type: 'thu', status: 'approved', amount: 10_000_000 }];
    expect(getDebtList([order], v)).toHaveLength(0);
  });

  it('cộng VAT cho hóa đơn VAT với vatRate chỉ định', () => {
    const vatOrder = mkOrder({ invoiceType: 'invoice', pricing: { totalRevenue: 10e6, totalCost: 7e6, profit: 3e6, vatRate: 10 } });
    const result = getDebtList([vatOrder], []);
    expect(result[0].totalRevenue).toBe(11_000_000);
  });

  it('dùng vatRate mặc định 8% khi không chỉ định vatRate', () => {
    const vatOrder = mkOrder({ invoiceType: 'invoice', pricing: { totalRevenue: 10e6, totalCost: 7e6, profit: 3e6 } });
    const result = getDebtList([vatOrder], []);
    expect(result[0].totalRevenue).toBe(10_800_000);
  });

  it('sắp xếp theo nợ giảm dần', () => {
    const o1 = mkOrder({ id: 'X1', pricing: { totalRevenue: 5e6, totalCost: 0, profit: 0 } });
    const o2 = mkOrder({ id: 'X2', pricing: { totalRevenue: 20e6, totalCost: 0, profit: 0 } });
    const result = getDebtList([o1, o2], []);
    expect(result[0].debt).toBeGreaterThan(result[1].debt);
  });

  it('hiển thị "—" khi customer không có name, phone, service, sale', () => {
    const o = mkOrder({ customer: {}, serviceName: undefined, service: undefined, sale: undefined, pricing: { totalRevenue: 5e6, totalCost: 0, profit: 0 } });
    const result = getDebtList([o], []);
    expect(result[0].customer).toBe('—');
    expect(result[0].phone).toBe('');
    expect(result[0].service).toBe('—');
    expect(result[0].sale).toBe('—');
  });

  it('dùng o.service khi serviceName không có nhưng service có', () => {
    const o = mkOrder({ serviceName: undefined, service: 'visa', pricing: { totalRevenue: 5e6, totalCost: 0, profit: 0 } });
    const result = getDebtList([o], []);
    expect(result[0].service).toBe('visa');
  });
});

describe('Export XLSX functions (mock writeFile)', () => {
  let XLSX;

  beforeEach(async () => {
    XLSX = await import('xlsx');
    XLSX.writeFile.mockClear();
  });

  it('exportRevenueXlsx gọi XLSX.writeFile', () => {
    const rows = [{ label: 'T1', revenue: 1e6, cost: 0, profit: 1e6, count: 1 }];
    exportRevenueXlsx(rows, 'month', 2025);
    expect(XLSX.writeFile).toHaveBeenCalledOnce();
    expect(XLSX.writeFile.mock.calls[0][1]).toContain('2025');
  });

  it('exportServiceXlsx gọi XLSX.writeFile', () => {
    exportServiceXlsx([{ label: 'Tour', revenue: 1e6, cost: 0, profit: 1e6, count: 1 }]);
    expect(XLSX.writeFile).toHaveBeenCalledOnce();
  });

  it('exportSaleXlsx gọi XLSX.writeFile', () => {
    exportSaleXlsx([{ name: 'Hoa', revenue: 1e6, target: 2e6, profit: 500000, count: 1 }], 3, 2025);
    expect(XLSX.writeFile).toHaveBeenCalledOnce();
  });

  it('exportDebtXlsx gọi XLSX.writeFile', () => {
    exportDebtXlsx([{ id: 'O001', customer: 'KH', phone: '09', service: 'Tour', sale: 'Hoa', departDate: '', totalRevenue: 10e6, totalPaid: 3e6, debt: 7e6, deadline: '' }]);
    expect(XLSX.writeFile).toHaveBeenCalledOnce();
  });

  it('exportFullReport gọi XLSX.writeFile 1 lần (multi-sheet)', () => {
    const orders = [mkOrder({ createdAt: '2025-03-01' })];
    exportFullReport(orders, [], [], 2025);
    expect(XLSX.writeFile).toHaveBeenCalledOnce();
    expect(XLSX.writeFile.mock.calls[0][1]).toContain('2025');
  });

  it('exportSaleXlsx hiển thị "N/A" khi target = 0', () => {
    exportSaleXlsx([{ name: 'Hoa', revenue: 1e6, target: 0, profit: 0, count: 1 }], null, 2025);
    expect(XLSX.writeFile).toHaveBeenCalledOnce();
  });
});

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { loadTgConfig, saveTgConfig, clearTgConfig, sendTelegram, testTelegram, TG_MSG } from '../telegram.js';

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

const validCfg = { enabled: true, token: 'TOKEN123', chatId: 'CHAT456', events: ['newOrder'] };

describe('loadTgConfig', () => {
  it('trả về null khi localStorage rỗng', () => {
    expect(loadTgConfig()).toBeNull();
  });

  it('trả về config đã lưu', () => {
    localStorage.setItem('mv_erp_tg_config', JSON.stringify(validCfg));
    expect(loadTgConfig()).toEqual(validCfg);
  });

  it('trả về null khi JSON bị lỗi', () => {
    localStorage.setItem('mv_erp_tg_config', 'INVALID');
    expect(loadTgConfig()).toBeNull();
  });
});

describe('saveTgConfig', () => {
  it('lưu config vào localStorage', () => {
    saveTgConfig(validCfg);
    const raw = localStorage.getItem('mv_erp_tg_config');
    expect(JSON.parse(raw)).toEqual(validCfg);
  });
});

describe('clearTgConfig', () => {
  it('xóa config khỏi localStorage', () => {
    saveTgConfig(validCfg);
    clearTgConfig();
    expect(localStorage.getItem('mv_erp_tg_config')).toBeNull();
  });
});

describe('sendTelegram', () => {
  it('trả về false khi không có config', async () => {
    expect(await sendTelegram('test')).toBe(false);
  });

  it('trả về false khi cfg.enabled = false', async () => {
    expect(await sendTelegram('test', { cfg: { enabled: false, token: 'T', chatId: 'C' } })).toBe(false);
  });

  it('trả về false khi thiếu token', async () => {
    expect(await sendTelegram('test', { cfg: { enabled: true, token: '', chatId: 'C' } })).toBe(false);
  });

  it('trả về false khi thiếu chatId', async () => {
    expect(await sendTelegram('test', { cfg: { enabled: true, token: 'T', chatId: '' } })).toBe(false);
  });

  it('trả về false khi event không nằm trong cfg.events', async () => {
    const cfg = { enabled: true, token: 'T', chatId: 'C', events: ['newOrder'] };
    expect(await sendTelegram('test', { cfg, event: 'voucherApproved' })).toBe(false);
  });

  it('gửi thành công khi fetch trả về ok=true', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ ok: true }),
    });
    const result = await sendTelegram('xin chào', { cfg: validCfg, event: 'newOrder' });
    expect(result).toBe(true);
    expect(fetch).toHaveBeenCalledOnce();
  });

  it('trả về false khi fetch trả về ok=false', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ ok: false }),
    });
    const result = await sendTelegram('test', { cfg: validCfg });
    expect(result).toBe(false);
  });

  it('trả về false khi fetch throw', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network fail'));
    const result = await sendTelegram('test', { cfg: validCfg });
    expect(result).toBe(false);
  });

  it('gửi bình thường khi không chỉ định event (không lọc events)', async () => {
    global.fetch = vi.fn().mockResolvedValue({ json: async () => ({ ok: true }) });
    const cfgNoEvents = { enabled: true, token: 'T', chatId: 'C' };
    const result = await sendTelegram('test', { cfg: cfgNoEvents });
    expect(result).toBe(true);
  });
});

describe('testTelegram', () => {
  it('trả về { ok: true } khi fetch thành công', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ ok: true }),
    });
    const result = await testTelegram('TOKEN', 'CHAT');
    expect(result).toEqual({ ok: true });
  });

  it('trả về { ok: false, error } khi fetch trả về ok=false', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ ok: false, description: 'Bad token' }),
    });
    const result = await testTelegram('BAD', 'CHAT');
    expect(result.ok).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('dùng fallback "Lỗi không xác định" khi không có description', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ ok: false }),
    });
    const result = await testTelegram('BAD', 'CHAT');
    expect(result.ok).toBe(false);
    expect(result.error).toContain('không xác định');
  });

  it('trả về { ok: false, error } khi fetch throw', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('timeout'));
    const result = await testTelegram('T', 'C');
    expect(result.ok).toBe(false);
    expect(result.error).toBe('timeout');
  });
});

describe('TG_MSG templates', () => {
  it('newOrder tạo tin nhắn chứa mã đơn', () => {
    const msg = TG_MSG.newOrder({ id: 'O001', customer: { name: 'KH', phone: '09' }, serviceName: 'Tour HN', departDate: '2025-06-01', pricing: { totalRevenue: 5000000 }, sale: 'Hoa' });
    expect(msg).toContain('O001');
    expect(msg).toContain('KH');
  });

  it('newOrder hiển thị "—" khi thiếu customer, serviceName, departDate, sale', () => {
    const msg = TG_MSG.newOrder({ id: 'X', customer: {}, pricing: {} });
    expect(msg).toContain('—');
  });

  it('newVoucherThu tạo tin nhắn chứa số tiền', () => {
    const msg = TG_MSG.newVoucherThu({ id: 'PT001', customerName: 'KH', amount: 1000000, note: 'TT cọc', method: 'transfer' });
    expect(msg).toContain('PT001');
  });

  it('newVoucherChi tạo tin nhắn chứa NCC', () => {
    const msg = TG_MSG.newVoucherChi({ id: 'PC001', ncc: 'Vietnam Airlines', amount: 2000000, note: 'Vé' });
    expect(msg).toContain('Vietnam Airlines');
  });

  it('voucherApproved phân biệt thu/chi', () => {
    const thu = TG_MSG.voucherApproved({ id: 'PT001', amount: 1e6, type: 'thu', approvedBy: 'Liên' });
    const chi = TG_MSG.voucherApproved({ id: 'PC001', amount: 1e6, type: 'chi', approvedBy: 'Liên' });
    expect(thu).toContain('Thu');
    expect(chi).toContain('Chi');
  });

  it('voucherRejected tạo tin nhắn', () => {
    const msg = TG_MSG.voucherRejected({ id: 'PT001', amount: 500000 });
    expect(msg).toContain('TỪ CHỐI');
  });

  it('expenseNeedsGD tạo tin nhắn', () => {
    const msg = TG_MSG.expenseNeedsGD({ id: 'EXP001', ncc: 'KS VIP', amount: 25000000 });
    expect(msg).toContain('EXP001');
  });

  it('refundCreated tạo tin nhắn', () => {
    const msg = TG_MSG.refundCreated({ id: 'REF001', customerName: 'KH', refundAmount: 500000, reason: 'Hủy tour' });
    expect(msg).toContain('REF001');
  });

  it('paymentDeadline tạo tin nhắn với số ngày', () => {
    const msg = TG_MSG.paymentDeadline({ id: 'O001', customer: { name: 'KH', phone: '09' }, _remaining: 2e6, paymentDeadline2: '30/06' }, 5);
    expect(msg).toContain('5 ngày');
  });

  it('tourDeparture tạo tin nhắn với số khách', () => {
    const msg = TG_MSG.tourDeparture({ id: 'O001', serviceName: 'Tour PQ', customer: { name: 'KH' }, departDate: '2025-06-20', pax: { adults: 2, children: 1 } }, 3);
    expect(msg).toContain('3 khách');
  });

  it('callThankReminder tạo tin nhắn', () => {
    const msg = TG_MSG.callThankReminder({ customerName: 'KH', customerPhone: '09', serviceName: 'Tour', returnDate: '15/06', sale: 'Hoa' });
    expect(msg).toContain('CẢM ƠN');
  });

  it('birthdayVoucher tạo tin nhắn', () => {
    const msg = TG_MSG.birthdayVoucher({ customerName: 'KH', customerPhone: '09', voucherCode: 'BDAY2025', voucherValue: 200000, voucherExpiry: '31/12/2025', sale: 'Hoa' });
    expect(msg).toContain('BDAY2025');
  });

  it('newVoucherThu hiển thị "—" khi thiếu customerName, note, method', () => {
    const msg = TG_MSG.newVoucherThu({ id: 'PT001', amount: 0 });
    expect(msg).toContain('—');
  });

  it('newVoucherChi hiển thị "—" khi thiếu ncc và note', () => {
    const msg = TG_MSG.newVoucherChi({ id: 'PC001', amount: 0 });
    expect(msg).toContain('—');
  });

  it('voucherApproved hiển thị "KT" khi không có approvedBy', () => {
    const msg = TG_MSG.voucherApproved({ id: 'PT001', amount: 0, type: 'thu' });
    expect(msg).toContain('KT');
  });

  it('expenseNeedsGD hiển thị "—" khi thiếu ncc', () => {
    const msg = TG_MSG.expenseNeedsGD({ id: 'E001', amount: 0 });
    expect(msg).toContain('—');
  });

  it('refundCreated hiển thị "—" khi thiếu customerName và reason', () => {
    const msg = TG_MSG.refundCreated({ id: 'R001', refundAmount: 0 });
    expect(msg).toContain('—');
  });

  it('paymentDeadline hiển thị "—" khi thiếu paymentDeadline2', () => {
    const msg = TG_MSG.paymentDeadline({ id: 'O001', customer: {}, _remaining: 0 }, 0);
    expect(msg).toContain('—');
  });

  it('tourDeparture hiển thị "—" khi thiếu serviceName, pax undefined', () => {
    const msg = TG_MSG.tourDeparture({ id: 'O001', customer: {}, departDate: '2025-01-01', pax: {} }, 2);
    expect(msg).toContain('0 khách');
  });

  it('callThankReminder hiển thị "—" khi thiếu serviceName, returnDate, sale', () => {
    const msg = TG_MSG.callThankReminder({ customerName: 'KH', customerPhone: '09' });
    expect(msg).toContain('—');
  });

  it('birthdayVoucher hiển thị fallback expiry khi không có voucherExpiry', () => {
    const msg = TG_MSG.birthdayVoucher({ customerName: 'KH', customerPhone: '09', voucherCode: 'X', voucherValue: 0 });
    expect(msg).toContain('31/12 năm nay');
  });

  it('birthdayVoucher hiển thị "Chưa gán" khi không có sale', () => {
    const msg = TG_MSG.birthdayVoucher({ customerName: 'KH', customerPhone: '09', voucherCode: 'X', voucherValue: 0, voucherExpiry: '31/12' });
    expect(msg).toContain('Chưa gán');
  });
});

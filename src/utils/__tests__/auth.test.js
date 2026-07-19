import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { saveSession, loadSession, clearSession, touchActivity, useSessionTimeout } from '../auth.js';

beforeEach(() => {
  sessionStorage.clear();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

const user = { id: 'u1', username: 'admin', name: 'Admin', role: 'manager', password: 'secret' };

describe('saveSession', () => {
  it('lưu session vào sessionStorage (không bao gồm password)', () => {
    saveSession(user);
    const raw = sessionStorage.getItem('mv_erp_session');
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw);
    expect(parsed.id).toBe('u1');
    expect(parsed.role).toBe('manager');
    expect(parsed.password).toBeUndefined();
  });

  it('lưu activity timestamp', () => {
    saveSession(user);
    const ts = sessionStorage.getItem('mv_erp_last_active');
    expect(ts).toBeTruthy();
    expect(Number(ts)).toBeGreaterThan(0);
  });

  it('chỉ lưu các SAFE_FIELDS', () => {
    saveSession({ ...user, secret: 'xyz', token: 'abc' });
    const parsed = JSON.parse(sessionStorage.getItem('mv_erp_session'));
    expect(parsed.secret).toBeUndefined();
    expect(parsed.token).toBeUndefined();
  });
});

describe('loadSession', () => {
  it('trả về null khi không có session', () => {
    expect(loadSession()).toBeNull();
  });

  it('trả về user khi session hợp lệ và chưa timeout', () => {
    saveSession(user);
    const loaded = loadSession();
    expect(loaded).not.toBeNull();
    expect(loaded.id).toBe('u1');
  });

  it('trả về null và xóa session khi đã timeout (30 phút)', () => {
    saveSession(user);
    vi.advanceTimersByTime(31 * 60 * 1000);
    const loaded = loadSession();
    expect(loaded).toBeNull();
    expect(sessionStorage.getItem('mv_erp_session')).toBeNull();
  });

  it('không timeout trong vòng 30 phút', () => {
    saveSession(user);
    vi.advanceTimersByTime(29 * 60 * 1000);
    expect(loadSession()).not.toBeNull();
  });

  it('trả về null khi session thiếu id', () => {
    sessionStorage.setItem('mv_erp_session', JSON.stringify({ role: 'sale' }));
    sessionStorage.setItem('mv_erp_last_active', String(Date.now()));
    expect(loadSession()).toBeNull();
  });

  it('trả về null khi session thiếu role', () => {
    sessionStorage.setItem('mv_erp_session', JSON.stringify({ id: 'x' }));
    sessionStorage.setItem('mv_erp_last_active', String(Date.now()));
    expect(loadSession()).toBeNull();
  });

  it('xóa session và trả về null khi JSON bị lỗi', () => {
    sessionStorage.setItem('mv_erp_session', 'INVALID_JSON');
    sessionStorage.setItem('mv_erp_last_active', String(Date.now()));
    expect(loadSession()).toBeNull();
    expect(sessionStorage.getItem('mv_erp_session')).toBeNull();
  });

  it('coi như đã timeout khi không có ACTIVITY_KEY', () => {
    sessionStorage.setItem('mv_erp_session', JSON.stringify({ id: 'u1', role: 'manager' }));
    // không set ACTIVITY_KEY → parseInt(null || "0") = 0 → Date.now() - 0 > TIMEOUT_MS → null
    expect(loadSession()).toBeNull();
  });

  it('gọi touchActivity sau khi load thành công', () => {
    saveSession(user);
    const tsBefore = sessionStorage.getItem('mv_erp_last_active');
    vi.advanceTimersByTime(1000);
    loadSession();
    const tsAfter = sessionStorage.getItem('mv_erp_last_active');
    expect(Number(tsAfter)).toBeGreaterThanOrEqual(Number(tsBefore));
  });
});

describe('clearSession', () => {
  it('xóa cả session lẫn activity key', () => {
    saveSession(user);
    clearSession();
    expect(sessionStorage.getItem('mv_erp_session')).toBeNull();
    expect(sessionStorage.getItem('mv_erp_last_active')).toBeNull();
  });
});

describe('touchActivity', () => {
  it('cập nhật timestamp hiện tại', () => {
    const before = Date.now();
    touchActivity();
    const ts = Number(sessionStorage.getItem('mv_erp_last_active'));
    expect(ts).toBeGreaterThanOrEqual(before);
  });
});

describe('useSessionTimeout', () => {
  it('trả về resetTimer = touchActivity và TIMEOUT_MS đúng', () => {
    const result = useSessionTimeout(() => {}, true);
    expect(typeof result.resetTimer).toBe('function');
    expect(result.TIMEOUT_MS).toBe(30 * 60 * 1000);
  });

  it('hoạt động khi disabled', () => {
    const result = useSessionTimeout(() => {}, false);
    expect(result.TIMEOUT_MS).toBeDefined();
  });
});

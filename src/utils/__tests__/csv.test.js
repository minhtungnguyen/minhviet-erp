import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { downloadCSV } from '../csv.js';

beforeEach(() => {
  URL.createObjectURL = vi.fn(() => 'blob:mock-url');
  URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('downloadCSV', () => {
  it('không làm gì khi rows rỗng', () => {
    downloadCSV([], 'test.csv');
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it('không làm gì khi rows null/undefined', () => {
    downloadCSV(null, 'test.csv');
    downloadCSV(undefined, 'test.csv');
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it('tạo và click link download khi có dữ liệu', () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    downloadCSV([{ Ten: 'Nguyễn Văn A', SoTien: 1000000 }], 'phieu-thu.csv');
    expect(URL.createObjectURL).toHaveBeenCalledOnce();
    expect(clickSpy).toHaveBeenCalledOnce();
    expect(URL.revokeObjectURL).toHaveBeenCalledOnce();
    clickSpy.mockRestore();
  });

  it('dùng "export.csv" làm tên mặc định khi không truyền filename', () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    let capturedDownload;
    const origCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      const el = origCreateElement(tag);
      if (tag === 'a') {
        Object.defineProperty(el, 'download', {
          get() { return capturedDownload; },
          set(v) { capturedDownload = v; },
        });
      }
      return el;
    });
    downloadCSV([{ A: 1 }]);
    expect(capturedDownload).toBe('export.csv');
    clickSpy.mockRestore();
  });

  it('escape giá trị chứa dấu phẩy bằng dấu ngoặc kép', () => {
    const blobSpy = vi.spyOn(globalThis, 'Blob');
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    downloadCSV([{ Note: 'Hà Nội, Việt Nam' }], 'x.csv');
    const csvContent = blobSpy.mock.calls[0][0][0];
    expect(csvContent).toContain('"Hà Nội, Việt Nam"');
  });

  it('escape giá trị chứa dấu ngoặc kép bằng cách nhân đôi', () => {
    const blobSpy = vi.spyOn(globalThis, 'Blob');
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    downloadCSV([{ Note: 'Nói "xin chào"' }], 'x.csv');
    const csvContent = blobSpy.mock.calls[0][0][0];
    expect(csvContent).toContain('""xin chào""');
  });

  it('escape giá trị chứa xuống dòng', () => {
    const blobSpy = vi.spyOn(globalThis, 'Blob');
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    downloadCSV([{ Note: 'Dòng 1\nDòng 2' }], 'x.csv');
    const csvContent = blobSpy.mock.calls[0][0][0];
    expect(csvContent).toContain('"Dòng 1\nDòng 2"');
  });

  it('giá trị null/undefined được xuất thành chuỗi rỗng, không phải "null"/"undefined"', () => {
    const blobSpy = vi.spyOn(globalThis, 'Blob');
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    downloadCSV([{ A: null, B: undefined, C: 'ok' }], 'x.csv');
    const csvContent = blobSpy.mock.calls[0][0][0];
    expect(csvContent).not.toContain('null');
    expect(csvContent).not.toContain('undefined');
  });

  it('BOM UTF-8 ở đầu file để Excel mở đúng tiếng Việt', () => {
    const blobSpy = vi.spyOn(globalThis, 'Blob');
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    downloadCSV([{ A: 'ok' }], 'x.csv');
    const csvContent = blobSpy.mock.calls[0][0][0];
    expect(csvContent.charCodeAt(0)).toBe(0xFEFF);
  });
});

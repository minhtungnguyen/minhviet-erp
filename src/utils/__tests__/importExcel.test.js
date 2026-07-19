import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as XLSX from 'xlsx';
import { parseCustomersFromFile, parseNccFromFile, downloadCustomerTemplate, downloadNccTemplate } from '../importExcel.js';

vi.mock('xlsx', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, SSF: actual.SSF, writeFile: vi.fn() };
});

// Tạo binary string XLSX từ array of row objects
function makeBinary(rows) {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  return XLSX.write(wb, { type: 'binary', bookType: 'xlsx' });
}

// Mock FileReader phải là class
function setupFileReader(binary) {
  class MockFileReader {
    readAsBinaryString() {
      Promise.resolve().then(() => this.onload({ target: { result: binary } }));
    }
  }
  vi.stubGlobal('FileReader', MockFileReader);
}

function setupFileReaderError() {
  class MockFileReaderError {
    readAsBinaryString() {
      Promise.resolve().then(() => this.onerror(new Error('read error')));
    }
  }
  vi.stubGlobal('FileReader', MockFileReaderError);
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('parseCustomersFromFile', () => {
  it('parse đúng bản ghi khách hàng cơ bản', async () => {
    setupFileReader(makeBinary([{ 'Tên khách hàng': 'Nguyễn An', 'Số điện thoại': '0912345678' }]));
    const result = await parseCustomersFromFile(new Blob([]));
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Nguyễn An');
    expect(result[0].phone).toBe('0912345678');
    expect(result[0]._errors).toHaveLength(0);
  });

  it('báo lỗi khi thiếu tên', async () => {
    setupFileReader(makeBinary([{ 'Số điện thoại': '0912345678' }]));
    const result = await parseCustomersFromFile(new Blob([]));
    expect(result[0]._errors).toContain('Thiếu tên khách hàng');
  });

  it('báo lỗi khi thiếu SĐT', async () => {
    setupFileReader(makeBinary([{ 'Tên khách hàng': 'KH' }]));
    const result = await parseCustomersFromFile(new Blob([]));
    expect(result[0]._errors).toContain('Thiếu số điện thoại');
  });

  it('báo lỗi khi SĐT sai định dạng', async () => {
    setupFileReader(makeBinary([{ 'Tên khách hàng': 'KH', 'Số điện thoại': '123abc' }]));
    const result = await parseCustomersFromFile(new Blob([]));
    expect(result[0]._errors.some(e => e.includes('SĐT'))).toBe(true);
  });

  it('tự gán type = personal khi không có cột Loại', async () => {
    setupFileReader(makeBinary([{ 'Tên khách hàng': 'KH', 'Số điện thoại': '0912345678' }]));
    const result = await parseCustomersFromFile(new Blob([]));
    expect(result[0].type).toBe('personal');
  });

  it('nhận dạng type = company khi Loại = "công ty"', async () => {
    setupFileReader(makeBinary([{ 'Tên khách hàng': 'Cty ABC', 'Số điện thoại': '0912345678', 'Loại': 'công ty' }]));
    const result = await parseCustomersFromFile(new Blob([]));
    expect(result[0].type).toBe('company');
  });

  it('nhận dạng type = company khi Loại = "cty"', async () => {
    setupFileReader(makeBinary([{ 'Tên khách hàng': 'Cty ABC', 'Số điện thoại': '0912345678', 'Loại': 'cty ABC' }]));
    const result = await parseCustomersFromFile(new Blob([]));
    expect(result[0].type).toBe('company');
  });

  it('nhận dạng type = company khi Loại = "company"', async () => {
    setupFileReader(makeBinary([{ 'Tên khách hàng': 'ABC Corp', 'Số điện thoại': '0912345678', 'Loại': 'company' }]));
    const result = await parseCustomersFromFile(new Blob([]));
    expect(result[0].type).toBe('company');
  });

  it('bỏ qua cột không có trong mapping', async () => {
    setupFileReader(makeBinary([{ 'Tên khách hàng': 'KH', 'Số điện thoại': '0912345678', 'Cột lạ': 'xyz' }]));
    const result = await parseCustomersFromFile(new Blob([]));
    expect(result[0].name).toBe('KH');
    expect(result[0]['Cột lạ']).toBeUndefined();
  });

  it('chuẩn hóa DOB từ DD/MM/YYYY', async () => {
    setupFileReader(makeBinary([{ 'Tên khách hàng': 'KH', 'Số điện thoại': '0912345678', 'Ngày sinh': '15/03/1990' }]));
    const result = await parseCustomersFromFile(new Blob([]));
    expect(result[0].dob).toBe('1990-03-15');
  });

  it('trả về mảng rỗng khi sheet rỗng', async () => {
    setupFileReader(makeBinary([]));
    const result = await parseCustomersFromFile(new Blob([]));
    expect(result).toHaveLength(0);
  });

  it('trả về _row = row index + 2', async () => {
    setupFileReader(makeBinary([{ 'Tên khách hàng': 'KH1', 'Số điện thoại': '0912345678' }]));
    const result = await parseCustomersFromFile(new Blob([]));
    expect(result[0]._row).toBe(2);
  });

  it('reject khi FileReader lỗi', async () => {
    setupFileReaderError();
    await expect(parseCustomersFromFile(new Blob([]))).rejects.toBeInstanceOf(Error);
  });

  it('chuẩn hóa DOB dạng YYYY-MM-DD giữ nguyên', async () => {
    setupFileReader(makeBinary([{ 'Tên khách hàng': 'KH', 'Số điện thoại': '0912345678', 'Ngày sinh': '1990-03-15' }]));
    const result = await parseCustomersFromFile(new Blob([]));
    expect(result[0].dob).toBe('1990-03-15');
  });

  it('chuẩn hóa DOB dạng Excel serial (5 chữ số)', async () => {
    // Excel serial 32916 = 1990-01-20 (approx)
    setupFileReader(makeBinary([{ 'Tên khách hàng': 'KH', 'Số điện thoại': '0912345678', 'Ngày sinh': '32916' }]));
    const result = await parseCustomersFromFile(new Blob([]));
    expect(result[0].dob).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('reject khi XLSX.read throw', async () => {
    // Mock XLSX.read to throw inside the onload handler
    const XLSXmod = await import('xlsx');
    const readSpy = vi.spyOn(XLSXmod, 'read').mockImplementation(() => { throw new Error('parse error'); });
    setupFileReader(makeBinary([]));
    await expect(parseCustomersFromFile(new Blob([]))).rejects.toThrow('parse error');
    readSpy.mockRestore();
  });
});

describe('parseNccFromFile', () => {
  it('parse đúng NCC cơ bản', async () => {
    setupFileReader(makeBinary([{ 'Tên NCC': 'Vietnam Airlines', 'Danh mục': 'Hãng bay' }]));
    const result = await parseNccFromFile(new Blob([]));
    expect(result[0].name).toBe('Vietnam Airlines');
    expect(result[0].cat).toBe('hang_bay');
  });

  it('báo lỗi khi thiếu tên NCC', async () => {
    setupFileReader(makeBinary([{ 'Danh mục': 'Khách sạn' }]));
    const result = await parseNccFromFile(new Blob([]));
    expect(result[0]._errors).toContain('Thiếu tên NCC');
  });

  it('default cat = "other" khi không có cột danh mục', async () => {
    setupFileReader(makeBinary([{ 'Tên NCC': 'NCC XYZ' }]));
    const result = await parseNccFromFile(new Blob([]));
    expect(result[0].cat).toBe('other');
  });

  it('nhận dạng "Khách sạn" → "khach_san"', async () => {
    setupFileReader(makeBinary([{ 'Tên NCC': 'KS A', 'Danh mục': 'khách sạn' }]));
    const result = await parseNccFromFile(new Blob([]));
    expect(result[0].cat).toBe('khach_san');
  });

  it('trả về mảng rỗng khi sheet rỗng', async () => {
    setupFileReader(makeBinary([]));
    const result = await parseNccFromFile(new Blob([]));
    expect(result).toHaveLength(0);
  });

  it('reject khi FileReader lỗi', async () => {
    setupFileReaderError();
    await expect(parseNccFromFile(new Blob([]))).rejects.toBeInstanceOf(Error);
  });

  it('bỏ qua cột không có trong NCC mapping', async () => {
    setupFileReader(makeBinary([{ 'Tên NCC': 'NCC X', 'Cột lạ': 'xyz' }]));
    const result = await parseNccFromFile(new Blob([]));
    expect(result[0].name).toBe('NCC X');
    expect(result[0]['Cột lạ']).toBeUndefined();
  });

  it('cat không rõ giữ nguyên giá trị lowercase', async () => {
    setupFileReader(makeBinary([{ 'Tên NCC': 'NCC X', 'Danh mục': 'loại mới' }]));
    const result = await parseNccFromFile(new Blob([]));
    expect(result[0].cat).toBe('loại mới');
  });

  it('reject khi XLSX.read throw', async () => {
    const XLSXmod = await import('xlsx');
    const readSpy = vi.spyOn(XLSXmod, 'read').mockImplementation(() => { throw new Error('parse error ncc'); });
    setupFileReader(makeBinary([]));
    await expect(parseNccFromFile(new Blob([]))).rejects.toThrow('parse error ncc');
    readSpy.mockRestore();
  });
});

describe('downloadCustomerTemplate', () => {
  it('gọi XLSX.writeFile với tên file chứa "KhachHang"', () => {
    XLSX.writeFile.mockClear();
    downloadCustomerTemplate();
    expect(XLSX.writeFile).toHaveBeenCalledOnce();
    expect(XLSX.writeFile.mock.calls[0][1]).toContain('KhachHang');
  });
});

describe('downloadNccTemplate', () => {
  it('gọi XLSX.writeFile với tên file chứa "NCC"', () => {
    XLSX.writeFile.mockClear();
    downloadNccTemplate();
    expect(XLSX.writeFile).toHaveBeenCalledOnce();
    expect(XLSX.writeFile.mock.calls[0][1]).toContain('NCC');
  });
});

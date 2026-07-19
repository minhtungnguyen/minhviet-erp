// currency.js — Multi-currency support
const FX_KEY = "mv_erp_fx_rates";

export const CURRENCIES = [
  { code: "VND", symbol: "đ",    name: "Việt Nam Đồng",     defaultRate: 1 },
  { code: "USD", symbol: "$",    name: "Đô la Mỹ",           defaultRate: 25400 },
  { code: "EUR", symbol: "€",    name: "Euro",               defaultRate: 27500 },
  { code: "JPY", symbol: "¥",    name: "Yên Nhật",           defaultRate: 165 },
  { code: "CNY", symbol: "¥",    name: "Nhân dân tệ",        defaultRate: 3500 },
  { code: "THB", symbol: "฿",    name: "Baht Thái",          defaultRate: 680 },
  { code: "SGD", symbol: "S$",   name: "Đô la Singapore",    defaultRate: 18800 },
  { code: "AUD", symbol: "A$",   name: "Đô la Úc",           defaultRate: 16200 },
  { code: "KRW", symbol: "₩",    name: "Won Hàn Quốc",       defaultRate: 18 },
  { code: "HKD", symbol: "HK$",  name: "Đô la Hồng Kông",   defaultRate: 3250 },
];

export function loadFxRates() {
  try {
    const raw = localStorage.getItem(FX_KEY);
    const saved = raw ? JSON.parse(raw) : {};
    const result = {};
    CURRENCIES.forEach(c => {
      result[c.code] = saved[c.code] ?? c.defaultRate;
    });
    return result;
  } catch {
    const result = {};
    CURRENCIES.forEach(c => { result[c.code] = c.defaultRate; });
    return result;
  }
}

export function saveFxRates(rates) {
  localStorage.setItem(FX_KEY, JSON.stringify(rates));
}

// Convert amount in `currency` → VND
export function toVND(amount, currency, rates) {
  if (!currency || currency === "VND") return Math.round(amount);
  const rate = (rates || loadFxRates())[currency] ?? 1;
  return Math.round(amount * rate);
}

// Format with currency symbol
export function fmtCurrency(amount, currency) {
  const c = CURRENCIES.find(x => x.code === currency) || CURRENCIES[0];
  if (currency === "VND") return amount.toLocaleString("vi-VN") + "đ";
  return c.symbol + amount.toLocaleString("vi-VN");
}

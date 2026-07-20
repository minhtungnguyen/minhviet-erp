// Nghiệp vụ báo giá (QuoteModule): tính tổng tiền theo số khách, tiền cọc, hạn hiệu lực.
export function calcQuoteTotal(pax, pricing) {
  const p = pax || {};
  const pr = pricing || {};
  return (
    (p.adults || 0) * (pr.adultPrice || 0) +
    (p.children || 0) * (pr.childPrice || 0) +
    (p.babies || 0) * (pr.babyPrice || 0)
  );
}

export function calcDepositAmount(totalPrice, depositPct) {
  return Math.round((totalPrice || 0) * (depositPct || 0) / 100);
}

export function daysLeft(validUntil) {
  if (!validUntil) return null;
  return Math.ceil((new Date(validUntil) - new Date()) / 86400000);
}

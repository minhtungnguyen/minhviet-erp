// Nghiệp vụ bảo lưu vé máy bay (CreditModule).
export function daysToExpiry(expiryDate) {
  return Math.ceil((new Date(expiryDate) - new Date()) / 86400000);
}

export function computeCreditStatus(credit) {
  if (daysToExpiry(credit.expiryDate) < 0) return "expired";
  if (credit.remainingAmount <= 0) return "used";
  if (credit.usedAmount > 0) return "partial";
  return "active";
}

// Giá trị bảo lưu thực nhận = giá vé gốc trừ phí hủy/đổi, không âm.
export function calcCreditAmount(originalAmount, feeDeducted) {
  return Math.max(0, (originalAmount || 0) - (feeDeducted || 0));
}

// Số tiền sử dụng phải >0 và không vượt quá số dư còn lại.
export function isValidCreditUsage(amount, remainingAmount) {
  return amount > 0 && amount <= remainingAmount;
}

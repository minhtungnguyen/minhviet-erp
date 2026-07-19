/**
 * migrate-imports.mjs
 * Removes duplicate inline definitions from App.jsx,
 * replacing them with imports from extracted module files.
 * Run: node scripts/migrate-imports.mjs
 */
import { readFileSync, writeFileSync } from "fs";

const file = new URL("../src/App.jsx", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1");
let src = readFileSync(file, "utf8");

const originalLen = src.length;

// ─── Helper: replace between two unique markers (inclusive) ───
function removeBetween(content, startMarker, endMarker, replacement = "") {
  const si = content.indexOf(startMarker);
  if (si === -1) { console.warn("  ⚠ Start marker not found:", startMarker.slice(0, 60)); return content; }
  const ei = content.indexOf(endMarker, si + startMarker.length);
  if (ei === -1) { console.warn("  ⚠ End marker not found:", endMarker.slice(0, 60)); return content; }
  return content.slice(0, si) + replacement + content.slice(ei + endMarker.length);
}

// ─── Helper: remove from startMarker to just before stopBefore ──
function removeUntil(content, startMarker, stopBefore, replacement = "") {
  const si = content.indexOf(startMarker);
  if (si === -1) { console.warn("  ⚠ Start marker not found:", startMarker.slice(0, 60)); return content; }
  const ei = content.indexOf(stopBefore, si + startMarker.length);
  if (ei === -1) { console.warn("  ⚠ Stop marker not found:", stopBefore.slice(0, 60)); return content; }
  return content.slice(0, si) + replacement + content.slice(ei);
}

console.log("🔧 Migrating App.jsx imports...\n");

// ══════════════════════════════════════════════════════════════
// STEP 1 — Add new import lines at the top
// ══════════════════════════════════════════════════════════════
console.log("Step 1: Adding import statements...");
const OLD_IMPORTS = `import { useState, useMemo, useRef, useEffect } from "react";
import LoginPageComponent from "./components/LoginPage";
import { Sidebar, TopBar, AppShell } from "./components/Layout";`;

const NEW_IMPORTS = `import { useState, useMemo, useRef, useEffect } from "react";
import LoginPageComponent from "./components/LoginPage";
import { Sidebar, TopBar, AppShell } from "./components/Layout";
import { openPrintWindow, buildPhieuThu, buildPhieuChi, buildConfirmation, PrintBtn } from "./print";
import { fmt, fmtS, fmtD, fmtDT, pct, genId, genVId, soThanhChu } from "./utils/format";
import { SERVICES, COST_GROUPS, CHECKLIST_TEMPLATES } from "./constants/services";
import { COMPANY, PROVINCES, SALE_STAFF, KT_STAFF, NCC_LIST, METHODS, ROLES, GD_APPROVAL_THRESHOLD } from "./constants/config";
import { INVOICE_TYPES, ORDER_STATUS, VOUCHER_STATUS, PRICE_APPROVAL_STATUS, EXP_PIPELINE_STATUS, REFUND_STATUS, CREDIT_STATUS, TOUR_OP_STATUS, BK_STATUS } from "./constants/statuses";
import { SBadge, Toast, Card, Row, Inp, Sel, Btn, FieldWrap, ProgBar, Divider } from "./components/ui";
import {
  SEED_BANK_ACCOUNTS, SEED_PERSONAL_TARGETS, SEED_TOUR_PROGRAMS,
  SEED_ORDERS, SEED_VOUCHERS, SEED_NOTIFS, SEED_EXPENSES,
  SEED_CREDITS, SEED_REFUNDS, SEED_OUTPUT_INVOICES, SEED_INPUT_INVOICES,
  SEED_TOUR_OPS, SEED_CUSTOMERS, SEED_NCC_MASTER, SEED_NCC_BOOKINGS,
  AIRLINES, HDV_LIST, DEFAULT_CHECKLIST, CRM_TAGS, CRM_EVENT_TYPES,
  MSG_TEMPLATES, NCC_CAT, NCC_CAT_GROUPS, REFUND_SERVICE_TYPES,
  REFUND_FEE_PRESETS, CANCEL_REASONS, APPROVAL_RULES, COMPANY_INFO,
  PROFIT_THRESHOLD,
} from "./seeds";`;

if (src.includes(OLD_IMPORTS)) {
  src = src.replace(OLD_IMPORTS, NEW_IMPORTS);
  console.log("  ✅ Import block updated");
} else {
  console.error("  ❌ Could not find old import block — aborting");
  process.exit(1);
}

// ══════════════════════════════════════════════════════════════
// STEP 2 — Remove print engine block
// ══════════════════════════════════════════════════════════════
console.log("Step 2: Removing print engine block...");
src = removeBetween(
  src,
  "\n// ═══════════════════════════════════════════════════════════\n// PDF PRINT ENGINE",
  // End: right after PrintBtn closing, stop just before CONSTANTS section
  `}\n\n\n// ═══════════════════════════════════════════════════════════\n// CONSTANTS & SEED DATA`,
  // Keep the CONSTANTS header
  "\n\n// ═══════════════════════════════════════════════════════════\n// CONSTANTS & SEED DATA"
);
console.log("  ✅ Print engine removed");

// ══════════════════════════════════════════════════════════════
// STEP 3 — Remove SERVICES + CHECKLIST_TEMPLATES
// ══════════════════════════════════════════════════════════════
console.log("Step 3: Removing SERVICES + CHECKLIST_TEMPLATES...");
src = removeUntil(
  src,
  "\n// ═══════════════════════════════════════════════════════════\n// CONSTANTS & SEED DATA\n// ═══════════════════════════════════════════════════════════\nconst SERVICES",
  "\nconst PROVINCES",
  "\n"
);
console.log("  ✅ SERVICES + CHECKLIST_TEMPLATES removed");

// ══════════════════════════════════════════════════════════════
// STEP 4 — Remove PROVINCES, SALE_STAFF, KT_STAFF, NCC_LIST, METHODS
// ══════════════════════════════════════════════════════════════
console.log("Step 4: Removing config constants...");
src = removeUntil(
  src,
  "\nconst PROVINCES",
  "\n// ─── Tài khoản ngân hàng",
  "\n"
);
console.log("  ✅ Config constants removed");

// ══════════════════════════════════════════════════════════════
// STEP 5 — Remove SEED_BANK_ACCOUNTS, INVOICE_TYPES, SEED_PERSONAL_TARGETS
// ══════════════════════════════════════════════════════════════
console.log("Step 5: Removing bank accounts + invoice types + personal targets...");
src = removeUntil(
  src,
  "\n// ─── Tài khoản ngân hàng",
  "\n// ─── Chương trình tour",
  "\n"
);
console.log("  ✅ Bank accounts + invoice types + targets removed");

// ══════════════════════════════════════════════════════════════
// STEP 6 — Remove COST_GROUPS
// ══════════════════════════════════════════════════════════════
console.log("Step 6: Removing COST_GROUPS...");
src = removeUntil(
  src,
  "\n// ─── Chương trình tour",
  "\nconst SEED_TOUR_PROGRAMS",
  "\n"
);
console.log("  ✅ COST_GROUPS removed");

// ══════════════════════════════════════════════════════════════
// STEP 7 — Remove SEED_TOUR_PROGRAMS through SEED_NOTIFS
// ══════════════════════════════════════════════════════════════
console.log("Step 7: Removing SEED_TOUR_PROGRAMS...");
src = removeUntil(
  src,
  "\nconst SEED_TOUR_PROGRAMS",
  "\nconst COMPANY_INFO",
  "\n"
);
console.log("  ✅ SEED_TOUR_PROGRAMS removed");

// ══════════════════════════════════════════════════════════════
// STEP 8 — Remove COMPANY_INFO + PROFIT_THRESHOLD
// ══════════════════════════════════════════════════════════════
console.log("Step 8: Removing COMPANY_INFO + PROFIT_THRESHOLD...");
src = removeUntil(
  src,
  "\nconst COMPANY_INFO",
  "\nfunction getProfitThreshold",
  "\n"
);
console.log("  ✅ COMPANY_INFO + PROFIT_THRESHOLD removed");

// ══════════════════════════════════════════════════════════════
// STEP 9 — Remove PRICE_APPROVAL_STATUS + ORDER_STATUS + VOUCHER_STATUS
// ══════════════════════════════════════════════════════════════
console.log("Step 9: Removing PRICE_APPROVAL_STATUS + ORDER_STATUS + VOUCHER_STATUS...");
src = removeUntil(
  src,
  "\n// ─── Trạng thái duyệt giá",
  "\nconst SEED_ORDERS",
  "\n"
);
console.log("  ✅ Status constants (price/order/voucher) removed");

// ══════════════════════════════════════════════════════════════
// STEP 10 — Remove SEED_ORDERS + SEED_VOUCHERS + SEED_NOTIFS + APPROVAL_RULES
// ══════════════════════════════════════════════════════════════
console.log("Step 10: Removing SEED_ORDERS through APPROVAL_RULES...");
src = removeUntil(
  src,
  "\nconst SEED_ORDERS",
  "\nconst EXP_PIPELINE_STATUS",
  "\n"
);
console.log("  ✅ SEED_ORDERS + SEED_VOUCHERS + SEED_NOTIFS + APPROVAL_RULES removed");

// ══════════════════════════════════════════════════════════════
// STEP 11 — Remove EXP_PIPELINE_STATUS
// ══════════════════════════════════════════════════════════════
console.log("Step 11: Removing EXP_PIPELINE_STATUS...");
src = removeUntil(
  src,
  "\nconst EXP_PIPELINE_STATUS",
  "\nconst SEED_EXPENSES",
  "\n"
);
console.log("  ✅ EXP_PIPELINE_STATUS removed");

// ══════════════════════════════════════════════════════════════
// STEP 12 — Remove SEED_EXPENSES
// ══════════════════════════════════════════════════════════════
console.log("Step 12: Removing SEED_EXPENSES...");
src = removeUntil(
  src,
  "\nconst SEED_EXPENSES",
  "\nconst CREDIT_STATUS",
  "\n"
);
console.log("  ✅ SEED_EXPENSES removed");

// ══════════════════════════════════════════════════════════════
// STEP 13 — Remove CREDIT_STATUS + AIRLINES + SEED_CREDITS
// ══════════════════════════════════════════════════════════════
console.log("Step 13: Removing CREDIT_STATUS + AIRLINES + SEED_CREDITS...");
src = removeUntil(
  src,
  "\nconst CREDIT_STATUS",
  "\nconst REFUND_SERVICE_TYPES",
  "\n"
);
console.log("  ✅ CREDIT_STATUS + AIRLINES + SEED_CREDITS removed");

// ══════════════════════════════════════════════════════════════
// STEP 14 — Remove REFUND_SERVICE_TYPES + REFUND_FEE_PRESETS
// ══════════════════════════════════════════════════════════════
console.log("Step 14: Removing REFUND_SERVICE_TYPES + REFUND_FEE_PRESETS...");
src = removeUntil(
  src,
  "\nconst REFUND_SERVICE_TYPES",
  "\nconst SEED_OUTPUT_INVOICES",
  "\n"
);
console.log("  ✅ REFUND_SERVICE_TYPES + REFUND_FEE_PRESETS removed");

// ══════════════════════════════════════════════════════════════
// STEP 15 — Remove SEED_OUTPUT_INVOICES + SEED_INPUT_INVOICES
// ══════════════════════════════════════════════════════════════
console.log("Step 15: Removing invoice seed data...");
src = removeUntil(
  src,
  "\nconst SEED_OUTPUT_INVOICES",
  "\nconst REFUND_STATUS",
  "\n"
);
console.log("  ✅ Invoice seed data removed");

// ══════════════════════════════════════════════════════════════
// STEP 16 — Remove REFUND_STATUS + SEED_REFUNDS + CANCEL_REASONS
// ══════════════════════════════════════════════════════════════
console.log("Step 16: Removing REFUND_STATUS + SEED_REFUNDS + CANCEL_REASONS...");
src = removeUntil(
  src,
  "\nconst REFUND_STATUS",
  "\nconst HDV_LIST",
  "\n"
);
console.log("  ✅ REFUND_STATUS + SEED_REFUNDS + CANCEL_REASONS removed");

// ══════════════════════════════════════════════════════════════
// STEP 17 — Remove HDV_LIST + DEFAULT_CHECKLIST
// ══════════════════════════════════════════════════════════════
console.log("Step 17: Removing HDV_LIST + DEFAULT_CHECKLIST...");
src = removeUntil(
  src,
  "\nconst HDV_LIST",
  "\nconst TOUR_OP_STATUS",
  "\n"
);
console.log("  ✅ HDV_LIST + DEFAULT_CHECKLIST removed");

// ══════════════════════════════════════════════════════════════
// STEP 18 — Remove TOUR_OP_STATUS + SEED_TOUR_OPS
// ══════════════════════════════════════════════════════════════
console.log("Step 18: Removing TOUR_OP_STATUS + SEED_TOUR_OPS...");
src = removeUntil(
  src,
  "\nconst TOUR_OP_STATUS",
  "\nconst CRM_TAGS",
  "\n"
);
console.log("  ✅ TOUR_OP_STATUS + SEED_TOUR_OPS removed");

// ══════════════════════════════════════════════════════════════
// STEP 19 — Remove CRM data + MSG_TEMPLATES + SEED_CUSTOMERS
// ══════════════════════════════════════════════════════════════
console.log("Step 19: Removing CRM data...");
src = removeUntil(
  src,
  "\nconst CRM_TAGS",
  "\nconst SEED_NCC_MASTER",
  "\n"
);
console.log("  ✅ CRM data removed");

// ══════════════════════════════════════════════════════════════
// STEP 20 — Remove NCC data
// ══════════════════════════════════════════════════════════════
console.log("Step 20: Removing NCC data...");
src = removeUntil(
  src,
  "\nconst SEED_NCC_MASTER",
  "\nconst BK_STATUS",
  "\n"
);
console.log("  ✅ NCC data removed");

// ══════════════════════════════════════════════════════════════
// STEP 21 — Remove BK_STATUS
// ══════════════════════════════════════════════════════════════
console.log("Step 21: Removing BK_STATUS...");
src = removeUntil(
  src,
  "\nconst BK_STATUS",
  "\n// ═══════════════════════════════════════════════════════════\n// HELPERS",
  "\n"
);
console.log("  ✅ BK_STATUS removed");

// ══════════════════════════════════════════════════════════════
// STEP 22 — Remove HELPERS block (fmt, fmtS, fmtD, fmtDT, pct, genId, genVId)
// ══════════════════════════════════════════════════════════════
console.log("Step 22: Removing HELPERS block...");
src = removeUntil(
  src,
  "\n// ═══════════════════════════════════════════════════════════\n// HELPERS\n// ═══════════════════════════════════════════════════════════\nconst fmt",
  "\nconst validateOrder",
  "\n"
);
console.log("  ✅ HELPERS (fmt/fmtS/...) removed");

// ══════════════════════════════════════════════════════════════
// STEP 23 — Remove SHARED UI ATOMS (SBadge, Toast, etc.)
// ══════════════════════════════════════════════════════════════
console.log("Step 23: Removing SHARED UI ATOMS...");
src = removeUntil(
  src,
  "\n// ═══════════════════════════════════════════════════════════\n// SHARED UI ATOMS\n// ═══════════════════════════════════════════════════════════",
  "\n// ═══════════════════════════════════════════════════════════\n// FINANCE PANEL",
  "\n"
);
console.log("  ✅ SHARED UI ATOMS removed");

// ══════════════════════════════════════════════════════════════
// WRITE RESULT
// ══════════════════════════════════════════════════════════════
writeFileSync(file, src, "utf8");
const newLen = src.length;
const removed = originalLen - newLen;
console.log(`\n✅ Done! Removed ${removed.toLocaleString()} chars (${(removed/1024).toFixed(1)} KB)`);
console.log(`   Original: ${(originalLen/1024).toFixed(1)} KB → New: ${(newLen/1024).toFixed(1)} KB`);

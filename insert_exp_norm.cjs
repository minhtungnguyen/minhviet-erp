const fs = require('fs');
const lines = fs.readFileSync('C:/minhviet-erp/src/App.jsx', 'utf8').split('\n');
// Line 1744 (1-indexed) = "];" closing SEED_EXPENSES, index 1743
const insertAt = 1744; // after line 1744 (0-indexed 1744 = line 1745)
const norm = [
  'const EXP_STATUS_MAP_LEGACY={draft:"pending",pending_kt:"pending",pending_gd:"pending",pending_pay:"approved",paid:"approved",rejected:"rejected"};',
  'const SEED_EXPENSES_FLAT = SEED_EXPENSES.map(e=>({...e,type:e.type||"chi",status:EXP_STATUS_MAP_LEGACY[e.status]||e.status||"pending",createdBy:e.createdBy||e.sale||"—",createdAt:e.createdAt||new Date().toISOString(),nccName:e.ncc||e.nccName||""}));',
];
lines.splice(insertAt, 0, ...norm);
fs.writeFileSync('C:/minhviet-erp/src/App.jsx', lines.join('\n'), 'utf8');
console.log('Inserted at line', insertAt+1);

const fs = require('fs');
let src = fs.readFileSync('C:/minhviet-erp/src/App.jsx', 'utf8');
const newMod = fs.readFileSync('C:/minhviet-erp/new_supplier.jsx', 'utf8');

// ── Step 1: Replace NCCDashboard (and everything up to FinancePanel) ──
const lines = src.split('\n');
let start = -1, end = lines.length;
for (let i = 0; i < lines.length; i++) {
  if (/^function NCCDashboard\(/.test(lines[i])) { start = i; break; }
}
if (start < 0) { console.error('NCCDashboard not found'); process.exit(1); }
for (let i = start + 1; i < lines.length; i++) {
  if (/^function FinancePanel\(/.test(lines[i])) { end = i; break; }
}
console.log('Replacing NCCDashboard lines', start+1, 'to', end);
lines.splice(start, end - start, ...newMod.split('\n'));
src = lines.join('\n');

// ── Step 2: Add suppliers state to App root (after bookings state) ──
if (!src.includes('useState(SEED_SUPPLIERS)')) {
  src = src.replace(
    /const \[bookings, setBookings\] = React\.useState\(SEED_NCC_BOOKINGS\);/,
    `const [bookings, setBookings] = React.useState(SEED_NCC_BOOKINGS);\n  const [suppliers, setSuppliers] = React.useState(SEED_SUPPLIERS);\n  const addSupplier = (s) => setSuppliers(p => [...p, { ...s, id: 'ncc-' + Date.now(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() }]);\n  const updateSupplier = (id, s) => setSuppliers(p => p.map(x => x.id === id ? { ...x, ...s, updated_at: new Date().toISOString() } : x));\n  const deleteSupplier = (id) => setSuppliers(p => p.filter(x => x.id !== id));`
  );
  console.log('Added suppliers state');
} else {
  console.log('suppliers state already present');
}

// ── Step 3: Update render call ──
src = src.replace(
  /\{view==="ncc"&&<NCCDashboard[^}]+\/>\}/,
  `{view==="ncc"&&<SupplierModule suppliers={suppliers} onAddSupplier={addSupplier} onUpdateSupplier={updateSupplier} onDeleteSupplier={deleteSupplier} orders={orders} vouchers={vouchers} expenses={expenses} pushNotif={pushToast} currentRole={currentRole} currentUser={currentUser} bookings={bookings} onUpdateBookings={setBookings} onCreateExpense={(exp)=>{setExpenses(p=>[exp,...p]);pushToast("Phiếu chi "+exp.id+" chờ KT duyệt","warning");}}/>}`
);
console.log('Updated render call');

fs.writeFileSync('C:/minhviet-erp/src/App.jsx', src, 'utf8');
console.log('Done. Total lines:', src.split('\n').length);

const fs = require('fs');
let src = fs.readFileSync('C:/minhviet-erp/src/App.jsx', 'utf8');
const newMod = fs.readFileSync('C:/minhviet-erp/new_tourghep.jsx', 'utf8');

// ── Step 1: Replace old TourGhepModule ─────────────────────
const lines = src.split('\n');
let start = -1, end = lines.length;
for (let i = 0; i < lines.length; i++) {
  if (/^function TourGhepModule\(/.test(lines[i])) { start = i; break; }
}
if (start < 0) { console.error('TourGhepModule not found'); process.exit(1); }
// find next top-level function/const after TourGhepModule
for (let i = start + 1; i < lines.length; i++) {
  if (/^function [A-Z]/.test(lines[i]) || /^const [A-Z]/.test(lines[i])) { end = i; break; }
}
console.log('Replacing TourGhepModule lines', start+1, 'to', end);
lines.splice(start, end - start, ...newMod.split('\n'));
src = lines.join('\n');

// ── Step 2: Add tourGhepProducts state to App root ──────────
if (!src.includes('tourGhepProducts')) {
  src = src.replace(
    /const \[suppliers, setSuppliers\] = React\.useState\(SEED_SUPPLIERS\);/,
    `const [suppliers, setSuppliers] = React.useState(SEED_SUPPLIERS);\n  const [tourGhepProducts, setTourGhepProducts] = React.useState([]);`
  );
  console.log('Added tourGhepProducts state');
} else {
  console.log('tourGhepProducts state already present');
}

// ── Step 3: Update TourGhepModule render call ───────────────
// Replace whatever props the old call uses
src = src.replace(
  /\{view==="tourghep"&&canAccessTourGhep\(currentUser\)&&<TourGhepModule[^}]*\/>\}/,
  `{view==="tourghep"&&canAccessTourGhep(currentUser)&&<TourGhepModule tourGhepProducts={tourGhepProducts} onUpdateTourGhepProducts={setTourGhepProducts} orders={orders} suppliers={suppliers} onCreateOrder={(prefill)=>{ handleCreateOrder(prefill); }} pushNotif={pushToast} currentRole={currentRole} currentUser={currentUser}/>}`
);

// Also handle multiline render call
if (!src.includes('onUpdateTourGhepProducts={setTourGhepProducts}')) {
  src = src.replace(
    /\{view==="tourghep"&&canAccessTourGhep\(currentUser\)&&[\s\S]*?\/>\}/,
    `{view==="tourghep"&&canAccessTourGhep(currentUser)&&<TourGhepModule tourGhepProducts={tourGhepProducts} onUpdateTourGhepProducts={setTourGhepProducts} orders={orders} suppliers={suppliers} onCreateOrder={(prefill)=>{ handleCreateOrder(prefill); }} pushNotif={pushToast} currentRole={currentRole} currentUser={currentUser}/>}`
  );
}
console.log('Updated render call');

fs.writeFileSync('C:/minhviet-erp/src/App.jsx', src, 'utf8');
console.log('Done. Total lines:', src.split('\n').length);

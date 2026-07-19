const fs = require('fs');
const lines = fs.readFileSync('C:/minhviet-erp/src/App.jsx', 'utf8').split('\n');
// Find OrderForm start (incomplete) and next function start
let start = -1, end = -1;
for (let i = 0; i < lines.length; i++) {
  if (/^function OrderForm\(/.test(lines[i])) { start = i; }
  if (start >= 0 && i > start && /^function [A-Z]|^export /.test(lines[i])) { end = i; break; }
}
console.log('OrderForm:', start+1, 'to', end);

const stub = `function OrderForm({onSave,onCancel,pushNotif,defaultSale=SALE_STAFF[0],currentRole="sale",customers=[],onCreateCustomer}){ return null; }`;
lines.splice(start, end - start, stub);
fs.writeFileSync('C:/minhviet-erp/src/App.jsx', lines.join('\n'), 'utf8');
console.log('Done. Lines:', lines.length);

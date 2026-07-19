const fs = require('fs');
const lines = fs.readFileSync('C:/minhviet-erp/src/App.jsx', 'utf8').split('\n');
// Delete lines 2937 and 2942 (0-indexed: 2936 and 2941)
// But need to be careful - delete in reverse order
// Line 2942 = index 2941, line 2937 = index 2936
lines.splice(2941, 1); // remove NCCDashboard stub (line 2942)
lines.splice(2936, 1); // remove FinancePanel stub (line 2937)
fs.writeFileSync('C:/minhviet-erp/src/App.jsx', lines.join('\n'), 'utf8');
console.log('Removed duplicates. Lines:', lines.length);

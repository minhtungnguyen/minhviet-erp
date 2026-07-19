const fs = require('fs');
const lines = fs.readFileSync('C:/minhviet-erp/src/App.jsx', 'utf8').split('\n');
// Delete lines 3077 to 3883 (0-indexed: 3076 to 3882)
const deleted = lines.splice(3076, 3883 - 3076);
console.log('Deleted', deleted.length, 'orphaned lines');
fs.writeFileSync('C:/minhviet-erp/src/App.jsx', lines.join('\n'), 'utf8');
console.log('New line count:', lines.length);

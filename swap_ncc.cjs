const fs = require('fs');
const appLines = fs.readFileSync('C:/minhviet-erp/src/App.jsx', 'utf8').split('\n');
const newNcc = fs.readFileSync('C:/minhviet-erp/new_ncc.jsx', 'utf8');

// Find NCCDashboard start and its matching end (next top-level function)
let start=-1;
for(let i=0;i<appLines.length;i++){
  if(/^function NCCDashboard\(/.test(appLines[i])){ start=i; break; }
}
if(start<0){ console.error('NCCDashboard not found'); process.exit(1); }
let end=appLines.length;
for(let i=start+1;i<appLines.length;i++){
  if(/^function [A-Za-z]+\(/.test(appLines[i])){ end=i; break; }
}
console.log('Replacing lines', start+1, 'to', end, '(', end-start, 'lines)');
appLines.splice(start, end-start, ...newNcc.split('\n'));
fs.writeFileSync('C:/minhviet-erp/src/App.jsx', appLines.join('\n'), 'utf8');
console.log('Done. New total lines:', appLines.length);

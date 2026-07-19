const fs = require('fs');
const appLines = fs.readFileSync('C:/minhviet-erp/src/App.jsx', 'utf8').split('\n');
const newMod = fs.readFileSync('C:/minhviet-erp/new_dashboards.jsx', 'utf8');

// Find start of SaleDashboard and end of AccountantDashboard (3 functions in a row)
let start=-1, end=-1;
for(let i=0;i<appLines.length;i++){
  if(/^function SaleDashboard\(/.test(appLines[i])){ start=i; break; }
}
if(start<0){ console.error('SaleDashboard not found'); process.exit(1); }
// find the function after AccountantDashboard
let accStart=-1;
for(let i=start;i<appLines.length;i++){
  if(/^function AccountantDashboard\(/.test(appLines[i])){ accStart=i; break; }
}
for(let i=accStart+1;i<appLines.length;i++){
  if(/^function [A-Za-z]+\(/.test(appLines[i])||/^export default function/.test(appLines[i])){ end=i; break; }
}
console.log('Replacing lines', start+1, 'to', end);
appLines.splice(start, end-start, ...newMod.split('\n'));
fs.writeFileSync('C:/minhviet-erp/src/App.jsx', appLines.join('\n'), 'utf8');
console.log('Done. New total lines:', appLines.length);

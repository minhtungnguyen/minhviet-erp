const fs = require('fs');
const src = fs.readFileSync('C:/minhviet-erp/src/App.jsx.backup35k', 'utf8').split('\n');
const TOP = /^(function [A-Za-z]|export function [A-Za-z]|export default function [A-Za-z])/;
const FN_NAME = /^(?:export )?function ([A-Za-z]+)/;
const fnStarts = [];
for (let i = 0; i < src.length; i++) {
  if (TOP.test(src[i])) {
    const m = src[i].match(FN_NAME);
    fnStarts.push({ line: i, name: m ? m[1] : null });
  }
}
const lastByName = {};
for (const f of fnStarts) {
  if (f.name) lastByName[f.name] = f.line;
}
function extract(name) {
  const start = lastByName[name];
  if (start === undefined) return null;
  let end = src.length;
  for (let i = start + 1; i < src.length; i++) {
    if (TOP.test(src[i])) { end = i; break; }
  }
  return src.slice(start, end).join('\n');
}
const targets = ['CrmModule','ApprovalsModule','CloseOrderModule','QuoteModule','TourProgramForm','TourProgramModule','BankAccountModule','AccountingDashboard','OrderForm','OrderList','OrderDetail','ProfilePage','UserManagementPage','ReportModule','TourGhepModule'];
let out = '';
for (const name of targets) {
  const code = extract(name);
  if (code) {
    console.log(`Extracted ${name}: ${code.split('\n').length} lines`);
    out += '\n' + code + '\n';
  } else {
    console.log(`NOT FOUND: ${name}`);
  }
}
fs.writeFileSync('C:/minhviet-erp/extracted_modules.js', out, 'utf8');
console.log('\nTotal extracted:', out.split('\n').length, 'lines');

// Extract NCCDashboard and FinancePanel too
const extra = ['NCCDashboard', 'FinancePanel'];
let out2 = '';
for (const name of extra) {
  const code = extract(name);
  if (code) {
    console.log(`Extracted ${name}: ${code.split('\n').length} lines`);
    out2 += '\n' + code + '\n';
  }
}
fs.writeFileSync('C:/minhviet-erp/extracted_extra.js', out2, 'utf8');

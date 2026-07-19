const fs = require('fs');
const body = fs.readFileSync('C:/minhviet-erp/hdv_module.txt', 'utf8');
let depth = 0, inStr = false, strCh = '';
for (let i = 0; i < body.length; i++) {
  const c = body[i];
  if (inStr) {
    if (c === strCh && body[i-1] !== '\\') inStr = false;
    continue;
  }
  if (c === '"' || c === "'" || c === '`') { inStr = true; strCh = c; continue; }
  if (c === '{') depth++;
  else if (c === '}') depth--;
}
console.log('depth:', depth);

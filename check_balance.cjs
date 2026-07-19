const fs = require('fs');
const lines = fs.readFileSync('src/App.jsx.reconstructed', 'utf8').split('\n');
const body = lines.slice(16529, 16530+1206).join('\n');
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
console.log('Final brace depth (should be 0 if balanced):', depth);

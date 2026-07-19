const fs = require('fs');
const src = fs.readFileSync('C:/minhviet-erp/src/App.jsx', 'utf8').split('\n');
const TOP = /^(function [A-Za-z]|export function [A-Za-z]|export default function [A-Za-z])/;

// Find all top-level function starts
const fns = [];
for (let i = 0; i < src.length; i++) {
  if (TOP.test(src[i])) fns.push(i);
}
fns.push(src.length);

// For each function, check if it's a proper one-liner stub (has ){ return null; } or ){ return <...)
// or a multi-line function with proper closing brace
// Quick check: count { and } in the function body — if they don't balance, it's corrupted
let changes = [];
for (let k = 0; k < fns.length - 1; k++) {
  const start = fns[k];
  const end = fns[k+1];
  const body = src.slice(start, end).join('\n');
  
  // Count braces (rough)
  let depth = 0;
  let inStr = false;
  let strChar = '';
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (inStr) {
      if (c === strChar && body[i-1] !== '\') inStr = false;
    } else if (c === '"' || c === "'" || c === '`') {
      inStr = true; strChar = c;
    } else if (c === '{') depth++;
    else if (c === '}') depth--;
  }
  
  const fnLine = src[start];
  const name = (fnLine.match(/function ([A-Za-z]+)/) || [])[1] || '?';
  
  if (depth !== 0) {
    console.log(`UNBALANCED ${name} (depth=${depth}) lines ${start+1}-${end}`);
    changes.push({start, end, name});
  }
}

// Stub out unbalanced functions
for (const {start, end, name} of changes.reverse()) {
  const fnLine = src[start];
  const paramMatch = fnLine.match(/^(export )?function [A-Za-z]+(\([^)]*\)|\([^]*?\))/);
  const stub = `function ${name}(){ return null; }`;
  src.splice(start, end - start, stub);
  console.log(`Stubbed ${name}`);
}

fs.writeFileSync('C:/minhviet-erp/src/App.jsx', src.join('\n'), 'utf8');
console.log('Final lines:', src.length);

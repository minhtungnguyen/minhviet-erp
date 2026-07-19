// Fix patterns like "text ${expr} text" in double-quoted strings
// → "text "+(expr)+" text"
const fs = require('fs');
const content = fs.readFileSync('C:/minhviet-erp/src/App.jsx', 'utf8');

// Process line by line looking for double-quoted strings with ${...} in them
// Strategy: when inside a double-quoted string, if we see ${, we need to split the string

function fixLine(line) {
  let result = '';
  let i = 0;
  while (i < line.length) {
    const c = line[i];
    // Skip single-quoted strings
    if (c === "'") {
      result += c; i++;
      while (i < line.length) {
        const ch = line[i]; result += ch; i++;
        if (ch === '\\') { result += line[i]||''; i++; continue; }
        if (ch === "'") break;
      }
      continue;
    }
    // Handle double-quoted strings
    if (c === '"') {
      result += c; i++;
      let strContent = '';
      let hasExpr = false;
      // Collect the string content
      let j = i;
      while (j < line.length) {
        const ch = line[j];
        if (ch === '\\') { strContent += ch + (line[j+1]||''); j += 2; continue; }
        if (ch === '"') { j++; break; }
        if (ch === '$' && line[j+1] === '{') { hasExpr = true; }
        strContent += ch; j++;
      }
      if (!hasExpr) {
        // No ${} in this string, output as-is
        result += strContent + '"';
        i = j;
        continue;
      }
      // Has ${} - need to convert
      // Parse strContent splitting on ${...}
      let parts = [];
      let k = 0;
      let cur = '';
      while (k < strContent.length) {
        if (strContent[k] === '$' && strContent[k+1] === '{') {
          if (cur) parts.push({type:'str', val: cur});
          cur = '';
          k += 2;
          let depth = 1;
          let expr = '';
          let inSQ = false, inDQ = false;
          while (k < strContent.length && depth > 0) {
            const ec = strContent[k];
            if (inSQ) { expr += ec; if (ec === '\\') { expr += strContent[++k]||''; k++; continue; } if (ec === "'") inSQ = false; k++; continue; }
            if (inDQ) { expr += ec; if (ec === '\\') { expr += strContent[++k]||''; k++; continue; } if (ec === '"') inDQ = false; k++; continue; }
            if (ec === '{') depth++;
            else if (ec === '}') { depth--; if (depth === 0) { k++; break; } }
            else if (ec === "'") inSQ = true;
            else if (ec === '"') inDQ = true;
            expr += ec;
            k++;
          }
          parts.push({type:'expr', val: expr});
        } else {
          // Handle escaped chars
          if (strContent[k] === '\\') {
            cur += strContent[k] + (strContent[k+1]||'');
            k += 2;
          } else {
            cur += strContent[k]; k++;
          }
        }
      }
      if (cur) parts.push({type:'str', val: cur});

      // Remove leading opening quote we already added
      result = result.slice(0, -1);

      // Build concatenation
      const pieces = parts.map(p => {
        if (p.type === 'str') {
          if (!p.val) return null;
          return '"' + p.val + '"';
        } else {
          return '(' + p.val + ')';
        }
      }).filter(Boolean);

      if (pieces.length === 0) result += '""';
      else result += pieces.join('+');
      i = j;
      continue;
    }
    // Skip template literals (backticks) - just pass through
    if (c === '`') {
      result += c; i++;
      while (i < line.length) {
        const ch = line[i]; result += ch; i++;
        if (ch === '\\') { result += line[i]||''; i++; continue; }
        if (ch === '`') break;
      }
      continue;
    }
    result += c; i++;
  }
  return result;
}

const lines = content.split('\n');
let fixCount = 0;
const fixed = lines.map((line, idx) => {
  if (!line.includes('${')) return line;
  const newLine = fixLine(line);
  if (newLine !== line) { fixCount++; }
  return newLine;
});

fs.writeFileSync('C:/minhviet-erp/src/App.jsx', fixed.join('\n'), 'utf8');
console.log('Fixed', fixCount, 'lines with ${} in double-quoted strings');

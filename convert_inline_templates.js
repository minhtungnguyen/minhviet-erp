// Convert single-line template literals to string concatenation
// Safe: only processes template literals where open AND close backtick are on the same line
// Multi-line template literals (like CSS strings) are left alone
const fs = require('fs');
const content = fs.readFileSync('C:/minhviet-erp/src/App.jsx', 'utf8');
const lines = content.split('\n');

function convertLine(line) {
  // Quick check: does this line have a backtick?
  if (!line.includes('`')) return line;

  let result = '';
  let i = 0;
  let inSingleQ = false;
  let inDoubleQ = false;
  let inLineComment = false;

  while (i < line.length) {
    const c = line[i];

    if (inLineComment) { result += c; i++; continue; }
    if (c === '/' && line[i+1] === '/') { inLineComment = true; result += c; i++; continue; }

    if (inSingleQ) {
      result += c;
      if (c === '\\') { result += line[i+1]||''; i += 2; continue; }
      if (c === "'") inSingleQ = false;
      i++; continue;
    }
    if (inDoubleQ) {
      result += c;
      if (c === '\\') { result += line[i+1]||''; i += 2; continue; }
      if (c === '"') inDoubleQ = false;
      i++; continue;
    }

    if (c === "'") { inSingleQ = true; result += c; i++; continue; }
    if (c === '"') { inDoubleQ = true; result += c; i++; continue; }

    if (c === '`') {
      // Try to find closing backtick on this same line
      // Scan forward to find closing backtick (handling ${} but not nested backticks)
      let j = i + 1;
      let depth = 0; // for ${ } nesting
      let inSQ2 = false, inDQ2 = false;
      let found = false;
      while (j < line.length) {
        const ch = line[j];
        if (inSQ2) {
          if (ch === '\\') { j += 2; continue; }
          if (ch === "'") inSQ2 = false;
          j++; continue;
        }
        if (inDQ2) {
          if (ch === '\\') { j += 2; continue; }
          if (ch === '"') inDQ2 = false;
          j++; continue;
        }
        if (depth > 0) {
          if (ch === "'") { inSQ2 = true; j++; continue; }
          if (ch === '"') { inDQ2 = true; j++; continue; }
          if (ch === '\\') { j += 2; continue; }
          if (ch === '{') depth++;
          else if (ch === '}') { depth--; j++; continue; }
          j++; continue;
        }
        if (ch === '\\') { j += 2; continue; }
        if (ch === '$' && line[j+1] === '{') { depth++; j += 2; continue; }
        if (ch === '`') { found = true; break; }
        j++;
      }

      if (!found) {
        // No closing backtick on this line → multi-line template, leave as-is
        result += c; i++;
        continue;
      }

      // Extract template content between i+1 and j
      const templateContent = line.substring(i+1, j);

      // Parse into parts (strings and expressions)
      const parts = [];
      let k = 0;
      let cur = '';
      while (k < templateContent.length) {
        if (templateContent[k] === '\\') {
          const esc = templateContent[k+1];
          if (esc === '`') { cur += '`'; k += 2; continue; }
          if (esc === '\\') { cur += '\\'; k += 2; continue; }
          if (esc === 'n') { cur += '\n'; k += 2; continue; }
          if (esc === 'r') { cur += '\r'; k += 2; continue; }
          if (esc === 't') { cur += '\t'; k += 2; continue; }
          if (esc === '$') { cur += '$'; k += 2; continue; }
          cur += esc; k += 2; continue;
        }
        if (templateContent[k] === '$' && templateContent[k+1] === '{') {
          parts.push({ type: 'str', val: cur }); cur = '';
          k += 2;
          let d2 = 1, expr = '';
          let iSQ = false, iDQ = false;
          while (k < templateContent.length && d2 > 0) {
            const ec = templateContent[k];
            if (iSQ) { expr += ec; if (ec === '\\') { expr += templateContent[++k]||''; k++; continue; } if (ec === "'") iSQ=false; k++; continue; }
            if (iDQ) { expr += ec; if (ec === '\\') { expr += templateContent[++k]||''; k++; continue; } if (ec === '"') iDQ=false; k++; continue; }
            if (ec === '{') d2++;
            else if (ec === '}') { d2--; if (d2 === 0) { k++; break; } }
            else if (ec === "'") iSQ = true;
            else if (ec === '"') iDQ = true;
            expr += ec; k++;
          }
          parts.push({ type: 'expr', val: expr });
        } else {
          cur += templateContent[k]; k++;
        }
      }
      if (cur || parts.length === 0) parts.push({ type: 'str', val: cur });

      // Build replacement
      function escStr(s) {
        return s
          .replace(/\\/g, '\\\\')
          .replace(/"/g, '\\"')
          .replace(/\n/g, '\\n')
          .replace(/\r/g, '\\r')
          .replace(/\t/g, '\\t');
      }

      const pieces = parts.map(p => {
        if (p.type === 'str') {
          if (!p.val && parts.length > 1) return null;
          return '"' + escStr(p.val) + '"';
        } else {
          return '(' + p.val + ')';
        }
      }).filter(Boolean);

      const replacement = pieces.length === 0 ? '""' : pieces.join('+');
      result += replacement;
      i = j + 1; // skip closing backtick
      continue;
    }

    result += c; i++;
  }

  return result;
}

let fixCount = 0;
const fixed = lines.map((line, idx) => {
  if (!line.includes('`')) return line;
  const newLine = convertLine(line);
  if (newLine !== line) fixCount++;
  return newLine;
});

fs.writeFileSync('C:/minhviet-erp/src/App.jsx', fixed.join('\n'), 'utf8');
const remaining = fixed.filter(l => l.includes('`')).length;
console.log('Converted', fixCount, 'lines');
console.log('Lines still with backticks:', remaining, '(multi-line templates or comments)');

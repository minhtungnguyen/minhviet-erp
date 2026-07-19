const fs = require('fs');
const content = fs.readFileSync('C:/minhviet-erp/src/App.jsx', 'utf8');

function convertTemplateLiterals(src) {
  let result = '';
  let i = 0;
  let inLineComment = false;
  let inBlockComment = false;
  let inSingleQ = false;
  let inDoubleQ = false;

  while (i < src.length) {
    const c = src[i];
    const next = src[i+1];

    if (inLineComment) {
      result += c;
      if (c === '\n') inLineComment = false;
      i++; continue;
    }
    if (inBlockComment) {
      result += c;
      if (c === '*' && next === '/') { result += next; i += 2; inBlockComment = false; continue; }
      i++; continue;
    }
    if (inSingleQ) {
      result += c;
      if (c === '\\') { result += next; i += 2; continue; }
      if (c === "'") inSingleQ = false;
      i++; continue;
    }
    if (inDoubleQ) {
      result += c;
      if (c === '\\') { result += next; i += 2; continue; }
      if (c === '"') inDoubleQ = false;
      i++; continue;
    }

    if (c === '/' && next === '/') { inLineComment = true; result += c; i++; continue; }
    if (c === '/' && next === '*') { inBlockComment = true; result += c; i++; continue; }
    if (c === "'") { inSingleQ = true; result += c; i++; continue; }
    if (c === '"') { inDoubleQ = true; result += c; i++; continue; }

    if (c === '`') {
      i++; // skip opening backtick
      const parts = [];
      let current = '';
      while (i < src.length) {
        const ch = src[i];
        if (ch === '\\') {
          // Handle escape sequences in template literal
          const esc = src[i+1];
          if (esc === '`') { current += '`'; i += 2; continue; }
          if (esc === '\\') { current += '\\'; i += 2; continue; }
          if (esc === 'n') { current += '\n'; i += 2; continue; }
          if (esc === 'r') { current += '\r'; i += 2; continue; }
          if (esc === 't') { current += '\t'; i += 2; continue; }
          if (esc === '$') { current += '$'; i += 2; continue; }
          current += esc; i += 2; continue;
        }
        if (ch === '`') { i++; break; }
        if (ch === '$' && src[i+1] === '{') {
          parts.push({type:'str', val: current});
          current = '';
          i += 2; // skip ${
          let depth = 1;
          let exprContent = '';
          let inSQ2 = false, inDQ2 = false, inTpl2 = 0;
          while (i < src.length && depth > 0) {
            const ec = src[i];
            if (inSQ2) {
              exprContent += ec;
              if (ec === '\\') { exprContent += src[i+1]; i+=2; continue; }
              if (ec === "'") inSQ2 = false;
            } else if (inDQ2) {
              exprContent += ec;
              if (ec === '\\') { exprContent += src[i+1]; i+=2; continue; }
              if (ec === '"') inDQ2 = false;
            } else if (inTpl2 > 0) {
              exprContent += ec;
              if (ec === '`') inTpl2--;
            } else {
              if (ec === '{') depth++;
              else if (ec === '}') { depth--; if (depth === 0) { i++; break; } }
              else if (ec === "'") inSQ2 = true;
              else if (ec === '"') inDQ2 = true;
              else if (ec === '`') inTpl2++;
              exprContent += ec;
            }
            i++;
          }
          parts.push({type:'expr', val: exprContent});
        } else {
          current += ch;
          i++;
        }
      }
      if (current) parts.push({type:'str', val: current});

      if (parts.length === 0) {
        result += '""';
      } else if (parts.length === 1 && parts[0].type === 'str') {
        // Encode string for double-quote literal
        const s = parts[0].val
          .replace(/\\/g, '\\\\')
          .replace(/"/g, '\\"')
          .replace(/\n/g, '\\n')
          .replace(/\r/g, '\\r')
          .replace(/\t/g, '\\t');
        result += '"' + s + '"';
      } else {
        const pieces = parts.map(p => {
          if (p.type === 'str') {
            if (!p.val) return null;
            const s = p.val
              .replace(/\\/g, '\\\\')
              .replace(/"/g, '\\"')
              .replace(/\n/g, '\\n')
              .replace(/\r/g, '\\r')
              .replace(/\t/g, '\\t');
            return '"' + s + '"';
          } else {
            return '(' + p.val + ')';
          }
        }).filter(Boolean);
        if (pieces.length === 0) result += '""';
        else result += pieces.join('+');
      }
    } else {
      result += c;
      i++;
    }
  }
  return result;
}

const converted = convertTemplateLiterals(content);
fs.writeFileSync('C:/minhviet-erp/src/App.jsx', converted, 'utf8');
const before = (content.match(/`/g)||[]).length;
const after = (converted.match(/`/g)||[]).length;
console.log('Backticks before:', before, 'after:', after);

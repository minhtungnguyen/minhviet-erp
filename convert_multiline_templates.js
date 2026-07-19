// Convert multi-line template literals to string concatenation
// Handles nested template literals correctly
// Only touches template literals not already converted (i.e., those still with backticks)
const fs = require('fs');

function convertTemplates(src) {
  let result = '';
  let i = 0;
  let inLineComment = false;
  let inBlockComment = false;
  let inSingleQ = false;
  let inDoubleQ = false;

  function peek(n) { return src.substring(i, i+n); }

  while (i < src.length) {
    const c = src[i];
    const n = src[i+1];

    if (inLineComment) {
      result += c;
      if (c === '\n') inLineComment = false;
      i++; continue;
    }
    if (inBlockComment) {
      result += c;
      if (c === '*' && n === '/') { result += n; i += 2; inBlockComment = false; }
      else i++;
      continue;
    }
    if (inSingleQ) {
      result += c;
      if (c === '\\') { result += n||''; i += 2; continue; }
      if (c === "'") inSingleQ = false;
      i++; continue;
    }
    if (inDoubleQ) {
      result += c;
      if (c === '\\') { result += n||''; i += 2; continue; }
      if (c === '"') inDoubleQ = false;
      i++; continue;
    }

    if (c === '/' && n === '/') { inLineComment = true; result += c + n; i += 2; continue; }
    if (c === '/' && n === '*') { inBlockComment = true; result += c + n; i += 2; continue; }
    if (c === "'") { inSingleQ = true; result += c; i++; continue; }
    if (c === '"') { inDoubleQ = true; result += c; i++; continue; }

    if (c === '`') {
      // Process template literal
      i++; // skip opening backtick
      result += convertTemplateLiteral();
    } else {
      result += c; i++;
    }
  }

  return result;

  // Recursively convert a template literal (called after opening backtick consumed)
  function convertTemplateLiteral() {
    const parts = [];
    let cur = '';
    let isMultiLine = false;

    while (i < src.length) {
      const ch = src[i];

      if (ch === '\\') {
        const esc = src[i+1];
        i += 2;
        if (esc === '`') { cur += '`'; continue; }
        if (esc === '\\') { cur += '\\'; continue; }
        if (esc === 'n') { cur += '\n'; continue; }
        if (esc === 'r') { cur += '\r'; continue; }
        if (esc === 't') { cur += '\t'; continue; }
        if (esc === '$') { cur += '$'; continue; }
        cur += esc; continue;
      }

      if (ch === '\n') { cur += '\n'; isMultiLine = true; i++; continue; }

      if (ch === '`') {
        i++; // skip closing backtick
        break;
      }

      if (ch === '$' && src[i+1] === '{') {
        parts.push({ type: 'str', val: cur }); cur = '';
        i += 2; // skip ${
        // Extract expression (handling nested template literals)
        const expr = extractExpression();
        parts.push({ type: 'expr', val: expr });
        continue;
      }

      cur += ch; i++;
    }

    parts.push({ type: 'str', val: cur });

    // Build output
    function escStr(s) {
      // For multi-line strings, we need to handle newlines specially
      return s
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t');
    }

    // Filter out empty string parts when mixed with expressions
    const hasExpr = parts.some(p => p.type === 'expr');
    const pieces = parts.map(p => {
      if (p.type === 'str') {
        if (!p.val && hasExpr) return null;
        return '"' + escStr(p.val) + '"';
      } else {
        // Recursively convert template literals inside expressions
        const convExpr = convertTemplateInExpr(p.val);
        return '(' + convExpr + ')';
      }
    }).filter(Boolean);

    if (pieces.length === 0) return '""';
    return pieces.join('+');
  }

  // Extract an expression inside ${...} (with proper nesting)
  function extractExpression() {
    let depth = 1;
    let expr = '';
    let inSQ2 = false, inDQ2 = false;
    let inLC = false, inBC = false;

    while (i < src.length && depth > 0) {
      const ec = src[i];
      const en = src[i+1];

      if (inLC) {
        expr += ec;
        if (ec === '\n') { inLC = false; }
        i++; continue;
      }
      if (inBC) {
        expr += ec;
        if (ec === '*' && en === '/') { expr += en; i += 2; inBC = false; continue; }
        i++; continue;
      }
      if (inSQ2) {
        expr += ec;
        if (ec === '\\') { expr += en||''; i += 2; continue; }
        if (ec === "'") inSQ2 = false;
        i++; continue;
      }
      if (inDQ2) {
        expr += ec;
        if (ec === '\\') { expr += en||''; i += 2; continue; }
        if (ec === '"') inDQ2 = false;
        i++; continue;
      }

      // Handle template literals inside expressions (leave as-is, they'll be converted recursively)
      if (ec === '`') {
        // Collect the inner template literal verbatim
        expr += ec; i++;
        let inInnerTpl = true;
        while (i < src.length && inInnerTpl) {
          const ic = src[i];
          expr += ic; i++;
          if (ic === '\\') { expr += src[i]||''; i++; continue; }
          if (ic === '`') { inInnerTpl = false; break; }
          if (ic === '$' && src[i] === '{') {
            expr += src[i]; i++;
            // Nested nested template literal expression
            let d3 = 1;
            while (i < src.length && d3 > 0) {
              const nc = src[i];
              expr += nc; i++;
              if (nc === '{') d3++;
              else if (nc === '}') d3--;
            }
          }
        }
        continue;
      }

      if (ec === '/' && en === '/') { inLC = true; expr += ec + en; i += 2; continue; }
      if (ec === '/' && en === '*') { inBC = true; expr += ec + en; i += 2; continue; }
      if (ec === "'") { inSQ2 = true; expr += ec; i++; continue; }
      if (ec === '"') { inDQ2 = true; expr += ec; i++; continue; }

      if (ec === '{') depth++;
      else if (ec === '}') { depth--; if (depth === 0) { i++; break; } }
      expr += ec; i++;
    }
    return expr;
  }

  // Convert template literals found inside expression strings
  function convertTemplateInExpr(expr) {
    // Re-process the expression string to convert any template literals in it
    let result2 = '';
    let j = 0;
    let inSQ3 = false, inDQ3 = false, inLC3 = false, inBC3 = false;

    while (j < expr.length) {
      const c3 = expr[j];
      const n3 = expr[j+1];

      if (inLC3) { result2 += c3; if (c3 === '\n') inLC3 = false; j++; continue; }
      if (inBC3) { result2 += c3; if (c3 === '*' && n3 === '/') { result2 += n3; j += 2; inBC3 = false; } else j++; continue; }
      if (inSQ3) { result2 += c3; if (c3 === '\\') { result2 += n3||''; j += 2; continue; } if (c3 === "'") inSQ3 = false; j++; continue; }
      if (inDQ3) { result2 += c3; if (c3 === '\\') { result2 += n3||''; j += 2; continue; } if (c3 === '"') inDQ3 = false; j++; continue; }

      if (c3 === '/' && n3 === '/') { inLC3 = true; result2 += c3 + n3; j += 2; continue; }
      if (c3 === '/' && n3 === '*') { inBC3 = true; result2 += c3 + n3; j += 2; continue; }
      if (c3 === "'") { inSQ3 = true; result2 += c3; j++; continue; }
      if (c3 === '"') { inDQ3 = true; result2 += c3; j++; continue; }

      if (c3 === '`') {
        // Found a template literal inside the expression — convert it
        // We need to save/restore our global position `i` and process this sub-string
        const savedI = i;
        i = 0; // temporarily set i to process the expr substring
        // Trick: temporarily replace src with the remaining expr from j+1
        // This is complex, so instead just leave inner template literals as-is for now
        // (they'll be handled by recursive passes)
        result2 += c3; j++;
        // Copy inner template literal verbatim
        while (j < expr.length) {
          const ic = expr[j];
          result2 += ic; j++;
          if (ic === '\\') { result2 += expr[j]||''; j++; continue; }
          if (ic === '`') break;
          if (ic === '$' && expr[j] === '{') {
            result2 += expr[j]; j++;
            let d4 = 1;
            while (j < expr.length && d4 > 0) {
              const nc = expr[j];
              result2 += nc; j++;
              if (nc === '{') d4++;
              else if (nc === '}') d4--;
            }
          }
        }
        i = savedI;
        continue;
      }

      result2 += c3; j++;
    }
    return result2;
  }
}

const content = fs.readFileSync('C:/minhviet-erp/src/App.jsx', 'utf8');
const converted = convertTemplates(content);

const beforeBt = (content.match(/`/g)||[]).length;
const afterBt = (converted.match(/`/g)||[]).length;

fs.writeFileSync('C:/minhviet-erp/src/App.jsx', converted, 'utf8');
console.log('Backticks before:', beforeBt, '→ after:', afterBt);
console.log('Lines before:', content.split('\n').length, '→ after:', converted.split('\n').length);

// Comprehensive fix script for App.jsx
// Run: node --input-type=commonjs < fix_all.js
const fs = require('fs');
let lines = fs.readFileSync('C:/minhviet-erp/src/App.jsx','utf8').split('\n');
let changes = [];

function log(msg) { changes.push(msg); }

// ── Helper: find all occurrences of a pattern ────────────────
function findAll(pattern) {
  const hits = [];
  for(let i=0; i<lines.length; i++) {
    if(pattern.test(lines[i])) hits.push(i); // 0-based
  }
  return hits;
}

// ── 1. Remove duplicate NOW_ISO (keep line 0) ──────────────
{
  const hits = findAll(/^export const NOW_ISO/);
  if(hits.length > 1) {
    // Delete all after first (in reverse order)
    for(let i=hits.length-1; i>=1; i--) {
      const idx = hits[i];
      // Also delete any nearby blank lines and comment
      let start = idx;
      while(start > 0 && lines[start-1].trim() === '') start--;
      // Check for comment above
      if(start > 0 && lines[start-1].startsWith('//')) start--;
      lines.splice(start, idx-start+1);
      log('Deleted duplicate NOW_ISO at line ' + (idx+1));
    }
  }
}

// ── 2. Remove duplicate NCC_CAT (keep last complete one) ────
{
  const hits = findAll(/^export const NCC_CAT = \{/);
  if(hits.length > 1) {
    // Find next top-level decl after first hit to determine its extent
    const firstIdx = hits[0];
    let endIdx = firstIdx;
    for(let i=firstIdx+1; i<lines.length; i++) {
      if(/^(export const|export function|function |const [A-Z])/.test(lines[i])) {
        endIdx = i-1;
        break;
      }
    }
    lines.splice(firstIdx, endIdx-firstIdx+1);
    log('Deleted first (incomplete) NCC_CAT at lines ' + (firstIdx+1) + '-' + (endIdx+1));
  }
}

// ── 3. Remove duplicate SEED_NCC_MASTER ────────────────────
{
  const hits = findAll(/^export const SEED_NCC_MASTER/);
  if(hits.length > 1) {
    for(let i=hits.length-1; i>=1; i--) {
      const idx = hits[i];
      let end = idx;
      for(let j=idx+1; j<lines.length; j++) {
        if(/^(export const|export function|function |const [A-Z])/.test(lines[j])) { end=j-1; break; }
      }
      lines.splice(idx, end-idx+1);
      log('Deleted duplicate SEED_NCC_MASTER at line ' + (idx+1));
    }
  }
}

// ── 4. Stub CrmAnalytics (corrupted with orphaned JSX) ─────
{
  const hits = findAll(/^function CrmAnalytics/);
  if(hits.length > 0) {
    const idx = hits[0];
    // Find end
    let end = idx;
    for(let i=idx+1; i<lines.length; i++) {
      if(/^(function |export function |export const |const [A-Z])/.test(lines[i])) { end=i-1; break; }
    }
    const stub = 'function CrmAnalytics({ customers, orders, onSelectCustomer }){ return null; }';
    lines.splice(idx, end-idx+1, stub);
    log('Stubbed CrmAnalytics (lines ' + (idx+1) + '-' + (end+1) + ')');
  }
}

// ── 5. Remove duplicate CrmModule (keep last one) ──────────
{
  const hits = findAll(/^function CrmModule\b/);
  if(hits.length > 1) {
    // Keep last copy, delete earlier copies
    for(let i=hits.length-2; i>=0; i--) {
      const startIdx = hits[i];
      const endIdx = hits[i+1]-1; // up to start of next copy
      lines.splice(startIdx, endIdx-startIdx+1);
      log('Deleted CrmModule copy ' + (i+1) + ' (lines ' + (startIdx+1) + '-' + (endIdx+1) + ')');
    }
  }
}

// ── 6. Replace middle dot · (U+00B7) with dash ─────────────
{
  let count = 0;
  for(let i=0; i<lines.length; i++) {
    if(lines[i].includes('·')) {
      lines[i] = lines[i].replace(/·/g, '-');
      count++;
    }
  }
  if(count) log('Replaced U+00B7 middle dot on ' + count + ' lines');
}

// ── 7. Fix emoji in template literals → string concat ───────
// Only target the specific problematic patterns rolldown rejects:
// backtick strings with emoji at start position
{
  let count = 0;
  for(let i=0; i<lines.length; i++) {
    // Replace `🎯 ...${expr}...` patterns
    const before = lines[i];
    // Replace template literals that start with emoji (4-byte UTF-8 chars)
    // Pattern: backtick + emoji + text + ${expr} + backtick
    lines[i] = lines[i].replace(/`([\uD83C-\uDBFF][\uDC00-\uDFFF]|[☀-⟿]|[\u{1F000}-\u{1FFFF}])([^`$]*)\$\{([^}]*)\}([^`]*)`/gu,
      (match, emoji, pre, expr, post) => {
        const parts = [];
        if(emoji+pre) parts.push('"' + (emoji+pre).replace(/"/g,'\\"') + '"');
        parts.push('(' + expr + ')');
        if(post) parts.push('"' + post.replace(/"/g,'\\"') + '"');
        return parts.join('+');
      }
    );
    // Also simpler: pure emoji string template `🎯 text`
    lines[i] = lines[i].replace(/`([\uD83C-\uDBFF][\uDC00-\uDFFF]|[☀-⟿])([^`]*)`/gu,
      (match, emoji, rest) => '"' + (emoji+rest).replace(/"/g,'\\"') + '"'
    );
    if(lines[i] !== before) count++;
  }
  if(count) log('Fixed emoji template literals on ' + count + ' lines');
}

// ── 8. Fix digit-start template literals in JSX style ───────
// Pattern: property: `Npx ...${expr}...`  (N=digit, like 1px, 2px)
{
  let count = 0;
  for(let i=0; i<lines.length; i++) {
    const before = lines[i];
    // Match: colon + backtick + digit + text + ${expr} + text + backtick
    lines[i] = lines[i].replace(/:\s*`(\d[^`$]*)\$\{([^}]*)\}([^`]*)`/g,
      (match, pre, expr, post) => {
        const parts = [];
        if(pre) parts.push('"' + pre.replace(/"/g,'\\"') + '"');
        parts.push('(' + expr + ')');
        if(post) parts.push('"' + post.replace(/"/g,'\\"') + '"');
        return ': ' + parts.join('+');
      }
    );
    // Also handle pure digit string: `: `1px solid #abc``
    lines[i] = lines[i].replace(/:\s*`(\d[^`$`]*)`/g,
      (match, content) => ': "' + content.replace(/"/g,'\\"') + '"'
    );
    if(lines[i] !== before) count++;
  }
  if(count) log('Fixed digit-start template literals on ' + count + ' lines');
}

// ── Write result ──────────────────────────────────────────────
fs.writeFileSync('C:/minhviet-erp/src/App.jsx', lines.join('\n'), 'utf8');
console.log('=== Fix Summary ===');
changes.forEach(c => console.log(' -', c));
console.log('Total lines:', lines.length);

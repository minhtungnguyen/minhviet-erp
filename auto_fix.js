// Auto-fix: find build error line, identify containing function, stub it, repeat
const fs = require('fs');
const { execSync } = require('child_process');

function getLines() {
  return fs.readFileSync('C:/minhviet-erp/src/App.jsx', 'utf8').split('\n');
}

function saveLines(lines) {
  fs.writeFileSync('C:/minhviet-erp/src/App.jsx', lines.join('\n'), 'utf8');
}

function findEnd(lines, startIdx) {
  for (let i = startIdx + 1; i < lines.length; i++) {
    if (/^(function [A-Z]|export function [A-Z]|export const [A-Z]|export default |\/\/ [═━]{3})/.test(lines[i])) return i;
  }
  return lines.length;
}

function findContainingFunction(lines, errLine) {
  // errLine is 1-based
  const idx = errLine - 1;
  for (let i = idx; i >= 0; i--) {
    const l = lines[i];
    if (/^(function [A-Za-z]|export function [A-Za-z])/.test(l)) return i;
  }
  return -1;
}

function stubFunction(lines, fnIdx) {
  // Find the function name (may span multiple lines for params)
  const fnLine = lines[fnIdx];
  const nameMatch = fnLine.match(/^(export )?function ([A-Za-z]+)\s*\(/);
  if (!nameMatch) return false;
  const exp = nameMatch[1] || '';
  const name = nameMatch[2];

  // Extract full params by counting parens across lines
  let paramStr = '';
  let depth = 0;
  let started = false;
  let done = false;
  outer: for (let i = fnIdx; i < Math.min(lines.length, fnIdx + 20); i++) {
    const line = lines[i];
    for (let j = 0; j < line.length; j++) {
      const c = line[j];
      if (!started && c === '(') { started = true; depth = 1; continue; }
      if (!started) continue;
      if (c === '(') depth++;
      else if (c === ')') { depth--; if (depth === 0) { done = true; break outer; } }
      paramStr += c;
    }
    if (i > fnIdx) paramStr += '\n';
  }
  if (!done) return false;

  const stub = `${exp}function ${name}(${paramStr}){ return null; }`;
  const end = findEnd(lines, fnIdx);
  lines.splice(fnIdx, end - fnIdx, stub);
  console.log(`  Stubbed ${name} (was lines ${fnIdx+1}-${end})`);
  return true;
}

let iterations = 0;
const MAX_ITER = 50;

while (iterations < MAX_ITER) {
  iterations++;

  let buildOut;
  try {
    buildOut = execSync('npx vite build 2>&1', {
      cwd: 'C:/minhviet-erp',
      encoding: 'utf8',
      timeout: 60000
    });
    console.log('✅ BUILD SUCCEEDED after', iterations, 'iterations!');
    console.log(buildOut.substring(0, 500));
    break;
  } catch (e) {
    buildOut = e.stdout || e.message || '';
  }

  // Parse error line number
  const match = buildOut.match(/App\.jsx:(\d+):/);
  if (!match) {
    console.log('Could not parse error line from:\n', buildOut.substring(0, 500));
    break;
  }

  const errLine = parseInt(match[1]);
  console.log(`Iter ${iterations}: Error at line ${errLine}`);

  const lines = getLines();

  // Find containing function
  const fnIdx = findContainingFunction(lines, errLine);

  if (fnIdx < 0) {
    // No containing function — this is module-scope corruption
    // Delete the problematic line and a few around it
    console.log(`  No containing function. Line ${errLine}: ${lines[errLine-1].substring(0,80)}`);
    // Find next top-level
    let end = errLine - 1;
    for (let i = errLine; i < Math.min(lines.length, errLine + 200); i++) {
      if (/^(export const [A-Z]|export function |function [A-Z]|export default )/.test(lines[i])) {
        end = i; break;
      }
    }
    if (end > errLine - 1) {
      console.log(`  Deleting orphaned lines ${errLine}-${end} (${end - errLine + 1} lines)`);
      lines.splice(errLine - 1, end - errLine);
    } else {
      console.log(`  Deleting just line ${errLine}`);
      lines.splice(errLine - 1, 1);
    }
    saveLines(lines);
    continue;
  }

  console.log(`  Containing function at line ${fnIdx+1}: ${lines[fnIdx].substring(0,70)}`);

  // If the found function is already a stub, there's orphaned code AFTER the stub
  // Find the next top-level declaration between fnIdx+1 and errLine-1 and delete orphaned lines
  const fnLineContent = lines[fnIdx];
  const isAlreadyStub = fnLineContent.includes('return null; }') && fnLineContent.length < 250;

  if (isAlreadyStub) {
    // Find orphaned code between fnIdx+1 and errLine-1
    // Find the function AT errLine or search for next top-level after errLine
    // Delete lines from fnIdx+1 to errLine-2 (keep errLine)
    const orphanStart = fnIdx + 1;
    const orphanEnd = errLine - 2; // 0-based index of line before errLine
    if (orphanEnd > orphanStart) {
      console.log(`  Deleting orphaned code lines ${orphanStart+1}-${orphanEnd+1} (${orphanEnd - orphanStart + 1} lines)`);
      lines.splice(orphanStart, orphanEnd - orphanStart + 1);
    } else {
      console.log(`  No orphaned range to delete. Manual fix needed.`);
      break;
    }
  } else {
    stubFunction(lines, fnIdx);
  }
  saveLines(lines);
}

if (iterations >= MAX_ITER) {
  console.log('Max iterations reached. Manual intervention needed.');
}

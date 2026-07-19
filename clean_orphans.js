// Comprehensive orphan cleaner:
// 1. Find all top-level function/const/export declarations
// 2. For each section between consecutive top-level declarations,
//    check if it looks like a proper function body (has matching braces from the function decl)
//    If a top-level decl is followed by code that's NOT its own body (orphaned code from another
//    function's body that leaked through), delete it.
// 3. Also: find duplicate function names and keep only the last stub or last definition.

const fs = require('fs');
const { execSync } = require('child_process');

const filePath = 'C:/minhviet-erp/src/App.jsx';

function getLines() {
  return fs.readFileSync(filePath, 'utf8').split('\n');
}
function saveLines(lines) {
  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
}

// Top-level pattern: starts at column 0 with function/export function/export const uppercase
const TOP_LEVEL = /^(export default |export function [A-Za-z]|export const [A-Z]|function [A-Za-z]|\/\/ [═━─]{3})/;
const FN_DECL = /^(export )?function ([A-Za-z]+)/;

function findTopLevelRanges(lines) {
  const ranges = []; // {start, end (exclusive), name, isStub}
  for (let i = 0; i < lines.length; i++) {
    if (TOP_LEVEL.test(lines[i])) {
      // Find end: next top-level or EOF
      let end = lines.length;
      for (let j = i + 1; j < lines.length; j++) {
        if (TOP_LEVEL.test(lines[j])) { end = j; break; }
      }
      const m = lines[i].match(FN_DECL);
      const name = m ? m[2] : null;
      const isStub = lines[i].includes('return null; }') && lines[i].length < 300;
      ranges.push({ start: i, end, name, isStub, line: lines[i].substring(0, 60) });
      i = end - 1; // skip to next
    }
  }
  return ranges;
}

function isOrphanedBody(lines, start, end) {
  // Check if the lines from start to end-1 look like an orphaned body:
  // They start with whitespace (indented code) or JSX
  // But NOT a proper function opening (which starts at col 0)
  if (start >= end) return false;
  const firstLine = lines[start];
  // If first line is empty or whitespace, skip to first non-empty
  let firstContent = start;
  while (firstContent < end && !lines[firstContent].trim()) firstContent++;
  if (firstContent >= end) return false; // all empty, not orphaned
  const fc = lines[firstContent];
  // If it starts with whitespace (indented code) or looks like JSX, it's orphaned
  if (/^\s/.test(fc)) return true;
  // If it starts with a comment that's not a separator, might be orphaned
  // If it starts with a lowercase const/let/var or JSX tag, it's orphaned
  if (/^(const |let |var |return |if |for |while |<[A-Za-z])/.test(fc)) return true;
  return false;
}

let iterations = 0;
const MAX_OUTER = 20;

while (iterations < MAX_OUTER) {
  iterations++;
  const lines = getLines();

  // Build ranges
  const ranges = findTopLevelRanges(lines);

  let changed = false;

  // Find any range where:
  // 1. The declaration is a stub (1 line), AND
  // 2. There are non-empty lines after the stub (within the range) that are orphaned code
  for (let i = 0; i < ranges.length; i++) {
    const r = ranges[i];
    if (!r.name) continue; // skip comment separators

    // Find code AFTER the declaration line
    const bodyStart = r.start + 1;
    const bodyEnd = r.end;

    if (bodyStart >= bodyEnd) continue;

    // Check if there's actual content after the stub
    let hasContent = false;
    for (let k = bodyStart; k < bodyEnd; k++) {
      if (lines[k].trim()) { hasContent = true; break; }
    }
    if (!hasContent) continue;

    // If the declaration is a stub, the content after it is orphaned
    if (r.isStub) {
      console.log(`Deleting ${bodyEnd - bodyStart} orphaned lines after ${r.name} stub (lines ${bodyStart+1}-${bodyEnd})`);
      lines.splice(bodyStart, bodyEnd - bodyStart);
      saveLines(lines);
      changed = true;
      break;
    }

    // If the declaration is NOT a stub, check if the body content looks orphaned
    // This can happen if the function body ends but more JSX/code appears in the range
    // We can't easily determine this without parsing, so skip non-stubs for now
  }

  if (!changed) {
    console.log('No more orphaned blocks found after stub declarations.');
    break;
  }
}

// Now also remove duplicate function names (keep last occurrence)
console.log('\n--- Removing duplicate function declarations ---');
const lines2 = getLines();
const fnPositions = {}; // name -> [idx, ...]
for (let i = 0; i < lines2.length; i++) {
  const m = lines2[i].match(FN_DECL);
  if (m) {
    const name = m[2];
    if (!fnPositions[name]) fnPositions[name] = [];
    fnPositions[name].push(i);
  }
}

// Find functions with duplicates
const toDelete = new Set();
for (const [name, positions] of Object.entries(fnPositions)) {
  if (positions.length > 1) {
    console.log(`Duplicate: ${name} at lines ${positions.map(p=>p+1).join(', ')} — keeping last`);
    // Keep the last occurrence, mark all earlier ones for deletion
    for (let i = 0; i < positions.length - 1; i++) {
      toDelete.add(positions[i]);
    }
  }
}

if (toDelete.size > 0) {
  const lines3 = getLines();
  const ranges3 = findTopLevelRanges(lines3);

  // Build a set of line ranges to delete
  const deleteRanges = [];
  for (const startIdx of [...toDelete].sort((a,b) => b-a)) {
    // Find the range for this function
    const r = ranges3.find(r => r.start === startIdx);
    if (r) {
      deleteRanges.push([r.start, r.end]);
    } else {
      // It's just a 1-line stub, find its extent
      let end = startIdx + 1;
      for (let j = startIdx + 1; j < lines3.length; j++) {
        if (TOP_LEVEL.test(lines3[j])) { end = j; break; }
      }
      deleteRanges.push([startIdx, end]);
    }
  }

  // Sort descending and delete
  deleteRanges.sort((a,b) => b[0] - a[0]);
  const lines3m = getLines();
  let deleted = 0;
  for (const [s, e] of deleteRanges) {
    lines3m.splice(s, e - s);
    deleted += e - s;
  }
  console.log(`Deleted ${deleted} lines from duplicate function declarations`);
  saveLines(lines3m);
}

console.log('\nFinal line count:', getLines().length);

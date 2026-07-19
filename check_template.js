const fs = require('fs');
const content = fs.readFileSync('C:/minhviet-erp/src/App.jsx', 'utf8');
const lines = content.split('\n');

// Check for unclosed template literals (simple state machine)
let inTemplate = 0; // nesting depth
let inSingleQ = false;
let inDoubleQ = false;
let inLineComment = false;
let inBlockComment = false;
let i = 0;

while(i < content.length) {
  const c = content[i];
  const next = content[i+1];

  // Line comment end
  if(inLineComment) {
    if(c === '\n') inLineComment = false;
    i++; continue;
  }
  // Block comment end
  if(inBlockComment) {
    if(c === '*' && next === '/') { inBlockComment = false; i+=2; continue; }
    i++; continue;
  }
  // Inside string
  if(inSingleQ) {
    if(c === '\\') { i+=2; continue; }
    if(c === "'") inSingleQ = false;
    i++; continue;
  }
  if(inDoubleQ) {
    if(c === '\\') { i+=2; continue; }
    if(c === '"') inDoubleQ = false;
    i++; continue;
  }

  // Check starts
  if(c === '/' && next === '/') { inLineComment = true; i+=2; continue; }
  if(c === '/' && next === '*') { inBlockComment = true; i+=2; continue; }
  if(c === "'") { inSingleQ = true; i++; continue; }
  if(c === '"') { inDoubleQ = true; i++; continue; }
  if(c === '`') {
    inTemplate++;
    // Find the position (line number)
    const lineNum = content.substring(0,i).split('\n').length;
    if(inTemplate % 2 === 0) {
      inTemplate -= 2;
      // closed
    } else {
      // opened - check if it closes on same line or later
    }
    i++; continue;
  }
  i++;
}

// Find positions of all backticks
let lineNum = 1;
let colNum = 1;
let openTemplates = [];

i = 0;
inSingleQ = false; inDoubleQ = false; inLineComment = false; inBlockComment = false;

while(i < content.length) {
  const c = content[i];
  const next = content[i+1];

  if(c === '\n') { lineNum++; colNum = 1; }
  else { colNum++; }

  if(inLineComment) { if(c === '\n') inLineComment = false; i++; continue; }
  if(inBlockComment) { if(c === '*' && next === '/') { inBlockComment = false; i+=2; colNum+=2; continue; } i++; continue; }
  if(inSingleQ) { if(c === '\\') { i+=2; colNum++; continue; } if(c === "'") inSingleQ = false; i++; continue; }
  if(inDoubleQ) { if(c === '\\') { i+=2; colNum++; continue; } if(c === '"') inDoubleQ = false; i++; continue; }

  if(c === '/' && next === '/') { inLineComment = true; i+=2; continue; }
  if(c === '/' && next === '*') { inBlockComment = true; i+=2; continue; }
  if(c === "'") { inSingleQ = true; i++; continue; }
  if(c === '"') { inDoubleQ = true; i++; continue; }
  if(c === '`') {
    if(openTemplates.length > 0) {
      openTemplates.pop(); // close
    } else {
      openTemplates.push({line: lineNum, col: colNum});
    }
    i++; continue;
  }
  i++;
}

if(openTemplates.length > 0) {
  console.log('UNCLOSED TEMPLATE LITERALS:');
  openTemplates.forEach(t => console.log('  Line', t.line, 'Col', t.col));
} else {
  console.log('No unclosed template literals found');
}

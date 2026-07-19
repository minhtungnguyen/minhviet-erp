const fs = require('fs');

const jsonlPath = 'C:/Users/minhv/.claude/projects/C--minhviet-erp/c58ce40a-ae6e-4499-8ea4-fcf67c880e9a.jsonl';
const outputPath = 'C:/minhviet-erp/src/App.jsx.reconstructed';

const rawContent = fs.readFileSync(jsonlPath, 'utf8');
const lines = rawContent.split('\n');

const fileLines = {};

function processJsonLine(jsonLine, phase) {
  let parsed;
  try { parsed = JSON.parse(jsonLine); } catch(e) { return; }
  if (parsed.type !== 'user') return;
  if (!parsed.message?.content) return;
  const content = parsed.message.content;
  if (!Array.isArray(content)) return;
  for (const item of content) {
    if (item.type !== 'tool_result') continue;
    let text = '';
    if (typeof item.content === 'string') {
      text = item.content;
    } else if (Array.isArray(item.content)) {
      for (const c of item.content) {
        if (c.type === 'text') text += c.text;
      }
    }
    if (!text || !text.match(/^\d+\t/)) continue;
    const textLines = text.split('\n');
    for (const tl of textLines) {
      const m = tl.match(/^(\d+)\t(.*)$/s);
      if (!m) continue;
      const lineNum = parseInt(m[1]);
      const lineContent = m[2];
      if (phase === 'pre') {
        fileLines[lineNum] = lineContent;
      } else if (!(lineNum in fileLines)) {
        fileLines[lineNum] = lineContent;
      }
    }
  }
}

const CORRUPTION_IDX = 7223; // L7224 (1-indexed)

console.log('Phase 1: pre-corruption reads...');
for (let i = 0; i < Math.min(CORRUPTION_IDX, lines.length); i++) {
  if (lines[i].trim()) processJsonLine(lines[i], 'pre');
}
console.log(`Phase 1 done: ${Object.keys(fileLines).length} lines`);

console.log('Phase 2: post-corruption gap fill...');
for (let i = CORRUPTION_IDX; i < lines.length; i++) {
  if (lines[i].trim()) processJsonLine(lines[i], 'post');
}

const keys = Object.keys(fileLines).map(Number).sort((a,b)=>a-b);
const maxLine = keys[keys.length-1];
console.log(`Total: ${keys.length} lines, max: ${maxLine}`);

let totalMissing = 0, gapCount = 0;
const gaps = [];
for (let k = 1; k < keys.length; k++) {
  if (keys[k] - keys[k-1] > 1) {
    gapCount++;
    const size = keys[k] - keys[k-1] - 1;
    totalMissing += size;
    gaps.push({start: keys[k-1]+1, end: keys[k]-1, size,
      before: fileLines[keys[k-1]].substring(0, 60),
      after: fileLines[keys[k]].substring(0, 60)});
  }
}
console.log(`Gaps: ${gapCount}, Total missing: ${totalMissing}`);
gaps.sort((a,b)=>b.size-a.size).slice(0,10).forEach(g => {
  console.log(`  Gap ${g.start}-${g.end} (${g.size} lines)`);
  console.log(`    Before: ${g.before}`);
  console.log(`    After:  ${g.after}`);
});

const output = [];
for (let n = 1; n <= maxLine; n++) {
  output.push(n in fileLines ? fileLines[n] : '');
}
fs.writeFileSync(outputPath, output.join('\n'), 'utf8');
console.log(`Written ${output.length} lines to ${outputPath}`);

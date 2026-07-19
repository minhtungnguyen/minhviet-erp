const fs = require('fs');
// Get the App function from stub_version
const stubLines = fs.readFileSync('C:/minhviet-erp/src/App.jsx.stub_version', 'utf8').split('\n');
let appStart = stubLines.findIndex(l => /^export default function App\(\)/.test(l));
const appCode = stubLines.slice(appStart).join('\n');

// Append to current App.jsx
const current = fs.readFileSync('C:/minhviet-erp/src/App.jsx', 'utf8');
fs.writeFileSync('C:/minhviet-erp/src/App.jsx', current + '\n' + appCode, 'utf8');
const final = fs.readFileSync('C:/minhviet-erp/src/App.jsx', 'utf8').split('\n');
console.log('Restored App function. Total lines:', final.length);

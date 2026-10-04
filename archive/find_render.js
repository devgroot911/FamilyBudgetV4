const fs = require('fs');
let c = fs.readFileSync('app.js', 'utf8');
let arr = c.split('\n');

let startIdx = arr.findIndex(l => l.startsWith('function renderAllowances() {'));
if (startIdx !== -1) {
  let endIdx = startIdx;
  while(arr[endIdx] !== '  document.querySelector(\'#allowance-form\').addEventListener(\'submit\', function(event) {') { endIdx++; }
  // wait, we need to replace until the end of renderAllowances function.
}

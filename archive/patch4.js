const fs = require('fs');
let c = fs.readFileSync('app.js', 'utf8');
let arr = c.split('\n');

let startIdx = arr.findIndex(l => l.includes('var remaining = totalAllowance - totalSpent;'));
if (startIdx !== -1) {
  let patch = `  var trueRemaining = categories.reduce(function(s, c) { return s + getFbBalance(c.id); }, 0);
  var remaining = trueRemaining !== 0 ? trueRemaining : (totalAllowance - totalSpent);`;
  
  arr.splice(startIdx, 1, patch);
  fs.writeFileSync('app.js', arr.join('\n'));
}

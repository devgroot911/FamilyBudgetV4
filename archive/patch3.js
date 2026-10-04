const fs = require('fs');
let c = fs.readFileSync('app.js', 'utf8');
let arr = c.split('\n');

let startIdx = arr.findIndex(l => l.includes('var bal = al - ex;'));
if (startIdx !== -1) {
  let patch = `        var bal = al - ex;
        var matchedCat = categories.find(function(c) { return c.name === k; });
        if (matchedCat) {
            var fbBal = getFbBalance(matchedCat.id, currentMonth(start));
            if (fbBal !== 0) bal = fbBal; // Override simple math with official DB carry-over balance
        }`;
  
  arr.splice(startIdx, 1, patch);
  fs.writeFileSync('app.js', arr.join('\n'));
}

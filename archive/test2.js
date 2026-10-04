const fs = require('fs');
let c = fs.readFileSync('app.js', 'utf8');
let arr = c.split('\\n');
for (let i = 0; i < arr.length; i++) {
  if (arr[i].includes('var cat1Allowances = {};')) {
     arr[i] = '    var cat1Allowances = {};\\n    var prof = (state.profiles && state.profiles[username]) ? state.profiles[username] : {};\\n    var userHouse = prof.house || \\'ALL\\';\\n    var userVillage = prof.village || \\'ALL\\';';
  } else if (arr[i].includes('var allowAmt = Number(state.allowances[username')) {
     arr[i] = '      var allowAmt = allowance(c.id, currentMonth(start), userHouse, userVillage) || 0;';
  } else if (arr[i].includes('var fbBal = getFbBalance(matchedCat.id, currentMonth(start));')) {
     arr[i] = '            var prof2 = (state.profiles && state.profiles[username]) ? state.profiles[username] : {};\\n            var uh = prof2.house || \\'ALL\\';\\n            var uv = prof2.village || \\'ALL\\';\\n            var fbBal = getFbBalance(matchedCat.id, currentMonth(start), uh, uv);';
  }
}
fs.writeFileSync('app.js', arr.join('\\n'));

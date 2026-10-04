const fs = require('fs');
let c = fs.readFileSync('app.js', 'utf8');

c = c.replace(
  /var cat1Allowances = \{\};\s*\(state\.categories \|\| \[\]\)\.forEach\(function\(c\) \{\s*var allowAmt = Number\(state\.allowances\[username \+ '_' \+ month \+ '_' \+ c\.id\]\) \|\| 0;\s*cat1Allowances\[c\.name\] = allowAmt;\s*\}\);/g,
  \`var cat1Allowances = {};
    var prof = (state.profiles && state.profiles[username]) ? state.profiles[username] : {};
    var userHouse = prof.house || 'ALL';
    var userVillage = prof.village || 'ALL';
    (state.categories || []).forEach(function(c) {
      var allowAmt = allowance(c.id, month, userHouse, userVillage) || 0;
      cat1Allowances[c.name] = allowAmt;
    });\`
);

c = c.replace(
  /var fbBal = getFbBalance\(matchedCat\.id, currentMonth\(start\), uh, uv\);/g,
  \`var fbBal = getFbBalance(matchedCat.id, month, uh, uv);\`
);

fs.writeFileSync('app.js', c);

const fs = require('fs');
let c = fs.readFileSync('app.js', 'utf8');

c = c.replace(
  "    var cat1Allowances = {};\n" +
  "    (state.categories || []).forEach(function(c) {\n" +
  "      var allowAmt = Number(state.allowances[username + '_' + month + '_' + c.id]) || 0;\n" +
  "      cat1Allowances[c.name] = allowAmt;\n" +
  "    });",
  "    var cat1Allowances = {};\n" +
  "    var prof = (state.profiles && state.profiles[username]) ? state.profiles[username] : {};\n" +
  "    var userHouse = prof.house || 'ALL';\n" +
  "    var userVillage = prof.village || 'ALL';\n" +
  "    (state.categories || []).forEach(function(c) {\n" +
  "      var allowAmt = allowance(c.id, currentMonth(start), userHouse, userVillage) || 0;\n" +
  "      cat1Allowances[c.name] = allowAmt;\n" +
  "    });"
);

c = c.replace(
  "        var matchedCat = categories.find(function(c) { return c.name === k; });\n" +
  "        if (matchedCat) {\n" +
  "            var fbBal = getFbBalance(matchedCat.id, currentMonth(start));\n" +
  "            if (fbBal !== 0) bal = fbBal; // Override simple math with official DB carry-over balance\n" +
  "        }",
  "        var matchedCat = categories.find(function(c) { return c.name === k; });\n" +
  "        if (matchedCat) {\n" +
  "            var prof2 = (state.profiles && state.profiles[username]) ? state.profiles[username] : {};\n" +
  "            var uh = prof2.house || 'ALL';\n" +
  "            var uv = prof2.village || 'ALL';\n" +
  "            var fbBal = getFbBalance(matchedCat.id, currentMonth(start), uh, uv);\n" +
  "            if (fbBal !== 0) bal = fbBal; // Override simple math with official DB carry-over balance\n" +
  "        }"
);

fs.writeFileSync('app.js', c);

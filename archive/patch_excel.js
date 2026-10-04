const fs = require('fs');
let c = fs.readFileSync('app.js', 'utf8');

c = c.replace(
\`    var cat1Allowances = {};
    (state.categories || []).forEach(function(c) {
      var allowAmt = Number(state.allowances[username + '_' + month + '_' + c.id]) || 0;
      cat1Allowances[c.name] = allowAmt;
    });\`,
\`    var cat1Allowances = {};
    var prof = (state.profiles && state.profiles[username]) ? state.profiles[username] : {};
    var userHouse = prof.house || 'ALL';
    var userVillage = prof.village || 'ALL';
    (state.categories || []).forEach(function(c) {
      var allowAmt = allowance(c.id, currentMonth(start), userHouse, userVillage) || 0;
      cat1Allowances[c.name] = allowAmt;
    });\`
);

c = c.replace(
\`        var matchedCat = categories.find(function(c) { return c.name === k; });
        if (matchedCat) {
            var fbBal = getFbBalance(matchedCat.id, currentMonth(start));
            if (fbBal !== 0) bal = fbBal; // Override simple math with official DB carry-over balance
        }\`,
\`        var matchedCat = categories.find(function(c) { return c.name === k; });
        if (matchedCat) {
            var prof2 = (state.profiles && state.profiles[username]) ? state.profiles[username] : {};
            var uh = prof2.house || 'ALL';
            var uv = prof2.village || 'ALL';
            var fbBal = getFbBalance(matchedCat.id, currentMonth(start), uh, uv);
            if (fbBal !== 0) bal = fbBal; // Override simple math with official DB carry-over balance
        }\`
);

fs.writeFileSync('app.js', c);

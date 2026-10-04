const fs = require('fs');
let c = fs.readFileSync('app.js', 'utf8');

// 1. Fix Sheet 1 Balance Calculation
// We need to replace: var bal = al - ex;
// With: var bal = fbWithdrawn - ex;
c = c.replace(/var bal = al - ex;/g, 'var bal = 0; // calculated later');
// Wait, we need fbWithdrawn first!
// Let's replace the whole summary loop for Sheet 1
c = c.replace(
  /var totalAl = 0, totalEx = 0, totalWithdrawn = 0;[\s\S]*?var balTotal = totalAl - totalEx;/m,
  \`var totalAl = 0, totalEx = 0, totalWithdrawn = 0;
      summaryCatKeys.forEach(function(k) {
        var al = cat1Allowances[k] || 0;
        var ex = cat1Totals[k] || 0;
        var fbWithdrawn = 0;
        var matchedCat = categories.find(function(c) { return c.name === k; });
        if (matchedCat) {
            var prof2 = (state.profiles && state.profiles[username]) ? state.profiles[username] : {};
            var uh = prof2.house || 'ALL';
            var uv = prof2.village || 'ALL';
            fbWithdrawn = getFbWithdrawn(matchedCat.id, month, uh, uv);
        }
        var bal = fbWithdrawn - ex;
        totalAl += al; totalEx += ex; totalWithdrawn += fbWithdrawn;

        var font = reportTheme.fonts.body;
        var balFont = bal < 0 ? reportTheme.fonts.warn : reportTheme.fonts.body;

        ws1Data.push([
          createCell(k, {font: font}), null,
          createCell(al, {font: font, alignment: {horizontal: "right"}}, 'n', reportTheme.formats.currency),
          createCell(fbWithdrawn, {font: font, alignment: {horizontal: "right"}}, 'n', reportTheme.formats.currency),
          createCell(ex, {font: font, alignment: {horizontal: "right"}}, 'n', reportTheme.formats.currency),
          createCell(bal, {font: balFont, alignment: {horizontal: "right"}}, 'n', reportTheme.formats.currency), null
        ]);
        var rr = ws1Data.length - 1;
        ws1Merges.push({s:{r: rr, c:0}, e:{r: rr, c:1}});
        ws1Merges.push({s:{r: rr, c:5}, e:{r: rr, c:6}});
        ws1Rows.push({hpt: 16});
      });

      var balTotal = totalWithdrawn - totalEx;\`
);

fs.writeFileSync('app.js', c);

const fs = require('fs');
let c = fs.readFileSync('app.js', 'utf8');

const target = `      ws1Data.push([
        createCell("Category", {font: reportTheme.fonts.smallB, border: reportTheme.borders.bottomThin}), null,
        createCell("Allowance", {font: reportTheme.fonts.smallB, border: reportTheme.borders.bottomThin, alignment: {horizontal: "right"}}), null,
        createCell("Expenditure", {font: reportTheme.fonts.smallB, border: reportTheme.borders.bottomThin, alignment: {horizontal: "right"}}),
        createCell("Balance", {font: reportTheme.fonts.smallB, border: reportTheme.borders.bottomThin, alignment: {horizontal: "right"}}), null
      ]);
      var sr = ws1Data.length - 1;
      ws1Merges.push({s:{r: sr, c:0}, e:{r: sr, c:1}});
      ws1Merges.push({s:{r: sr, c:2}, e:{r: sr, c:3}});
      ws1Merges.push({s:{r: sr, c:5}, e:{r: sr, c:6}});
      ws1Rows.push({hpt: 16});

      var totalAl = 0, totalEx = 0;
      summaryCatKeys.forEach(function(k) {
        var al = cat1Allowances[k] || 0;
        var ex = cat1Totals[k] || 0;
        var bal = al - ex;
        var matchedCat = categories.find(function(c) { return c.name === k; });
        if (matchedCat) {
            var prof2 = (state.profiles && state.profiles[username]) ? state.profiles[username] : {};
            var uh = prof2.house || 'ALL';
            var uv = prof2.village || 'ALL';
            var fbBal = getFbBalance(matchedCat.id, month, uh, uv);
            if (fbBal !== 0) bal = fbBal; // Override simple math with official DB carry-over balance
        }
        totalAl += al; totalEx += ex;

        var font = reportTheme.fonts.body;
        var balFont = bal < 0 ? reportTheme.fonts.warn : reportTheme.fonts.body;

        ws1Data.push([
          createCell(k, {font: font}), null,
          createCell(al, {font: font, alignment: {horizontal: "right"}}, 'n', reportTheme.formats.currency), null,
          createCell(ex, {font: font, alignment: {horizontal: "right"}}, 'n', reportTheme.formats.currency),
          createCell(bal, {font: balFont, alignment: {horizontal: "right"}}, 'n', reportTheme.formats.currency), null
        ]);
        var rr = ws1Data.length - 1;
        ws1Merges.push({s:{r: rr, c:0}, e:{r: rr, c:1}});
        ws1Merges.push({s:{r: rr, c:2}, e:{r: rr, c:3}});
        ws1Merges.push({s:{r: rr, c:5}, e:{r: rr, c:6}});
        ws1Rows.push({hpt: 16});
      });

      var balTotal = totalAl - totalEx;
      ws1Data.push([
        createCell("TOTAL", {font: reportTheme.fonts.smallB, alignment: {horizontal: "right"}}), null,
        createCell(totalAl, {font: reportTheme.fonts.smallB, alignment: {horizontal: "right"}, border: reportTheme.borders.topDouble, fill: {fgColor: {rgb: reportTheme.palette.TINT}}}, 'n', reportTheme.formats.currency), null,
        createCell(totalEx, {font: reportTheme.fonts.smallB, alignment: {horizontal: "right"}, border: reportTheme.borders.topDouble, fill: {fgColor: {rgb: reportTheme.palette.TINT}}}, 'n', reportTheme.formats.currency),
        createCell(balTotal, {font: (balTotal < 0 ? reportTheme.fonts.warn : reportTheme.fonts.smallB), alignment: {horizontal: "right"}, border: reportTheme.borders.topDouble, fill: {fgColor: {rgb: reportTheme.palette.TINT}}}, 'n', reportTheme.formats.currency), null
      ]);
      var tr = ws1Data.length - 1;
      ws1Merges.push({s:{r: tr, c:0}, e:{r: tr, c:1}});
      ws1Merges.push({s:{r: tr, c:2}, e:{r: tr, c:3}});
      ws1Merges.push({s:{r: tr, c:5}, e:{r: tr, c:6}});
      ws1Rows.push({hpt: 18});`;

const replacement = `      ws1Data.push([
        createCell("Category", {font: reportTheme.fonts.smallB, border: reportTheme.borders.bottomThin}), null,
        createCell("Allowance", {font: reportTheme.fonts.smallB, border: reportTheme.borders.bottomThin, alignment: {horizontal: "right"}}),
        createCell("Actual Withdrawn", {font: reportTheme.fonts.smallB, border: reportTheme.borders.bottomThin, alignment: {horizontal: "right"}}),
        createCell("Expenditure", {font: reportTheme.fonts.smallB, border: reportTheme.borders.bottomThin, alignment: {horizontal: "right"}}),
        createCell("Balance", {font: reportTheme.fonts.smallB, border: reportTheme.borders.bottomThin, alignment: {horizontal: "right"}}), null
      ]);
      var sr = ws1Data.length - 1;
      ws1Merges.push({s:{r: sr, c:0}, e:{r: sr, c:1}});
      ws1Merges.push({s:{r: sr, c:5}, e:{r: sr, c:6}});
      ws1Rows.push({hpt: 16});

      var totalAl = 0, totalEx = 0, totalWithdrawn = 0;
      summaryCatKeys.forEach(function(k) {
        var al = cat1Allowances[k] || 0;
        var ex = cat1Totals[k] || 0;
        var bal = al - ex;
        var fbWithdrawn = 0;
        var matchedCat = categories.find(function(c) { return c.name === k; });
        if (matchedCat) {
            var prof2 = (state.profiles && state.profiles[username]) ? state.profiles[username] : {};
            var uh = prof2.house || 'ALL';
            var uv = prof2.village || 'ALL';
            var fbBal = getFbBalance(matchedCat.id, month, uh, uv);
            fbWithdrawn = getFbWithdrawn(matchedCat.id, month, uh, uv);
            if (fbBal !== 0) bal = fbBal; // Override simple math with official DB carry-over balance
        }
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

      var balTotal = totalAl - totalEx;
      ws1Data.push([
        createCell("TOTAL", {font: reportTheme.fonts.smallB, alignment: {horizontal: "right"}}), null,
        createCell(totalAl, {font: reportTheme.fonts.smallB, alignment: {horizontal: "right"}, border: reportTheme.borders.topDouble, fill: {fgColor: {rgb: reportTheme.palette.TINT}}}, 'n', reportTheme.formats.currency),
        createCell(totalWithdrawn, {font: reportTheme.fonts.smallB, alignment: {horizontal: "right"}, border: reportTheme.borders.topDouble, fill: {fgColor: {rgb: reportTheme.palette.TINT}}}, 'n', reportTheme.formats.currency),
        createCell(totalEx, {font: reportTheme.fonts.smallB, alignment: {horizontal: "right"}, border: reportTheme.borders.topDouble, fill: {fgColor: {rgb: reportTheme.palette.TINT}}}, 'n', reportTheme.formats.currency),
        createCell(balTotal, {font: (balTotal < 0 ? reportTheme.fonts.warn : reportTheme.fonts.smallB), alignment: {horizontal: "right"}, border: reportTheme.borders.topDouble, fill: {fgColor: {rgb: reportTheme.palette.TINT}}}, 'n', reportTheme.formats.currency), null
      ]);
      var tr = ws1Data.length - 1;
      ws1Merges.push({s:{r: tr, c:0}, e:{r: tr, c:1}});
      ws1Merges.push({s:{r: tr, c:5}, e:{r: tr, c:6}});
      ws1Rows.push({hpt: 18});`;

c = c.replace(target, replacement);

c = c.replace(
  'createCell("Allowance Calculation Breakdown", {font: reportTheme.fonts.section, border: reportTheme.borders.bottomAccent})',
  'createCell("Balances and Calculation Breakdown", {font: reportTheme.fonts.section, border: reportTheme.borders.bottomAccent})'
);

fs.writeFileSync('app.js', c);

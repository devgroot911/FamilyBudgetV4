const fs = require('fs');
let c = fs.readFileSync('app.js', 'utf8');

c = c.replace(
  /ws1Data\.push\(\[\s*createCell\("Category", \{font: reportTheme\.fonts\.smallB, border: reportTheme\.borders\.bottomThin\}\), null,\s*createCell\("Allowance", \{font: reportTheme\.fonts\.smallB, border: reportTheme\.borders\.bottomThin, alignment: \{horizontal: "right"\}\}\), null,\s*createCell\("Expenditure", \{font: reportTheme\.fonts\.smallB, border: reportTheme\.borders\.bottomThin, alignment: \{horizontal: "right"\}\}\),\s*createCell\("Balance", \{font: reportTheme\.fonts\.smallB, border: reportTheme\.borders\.bottomThin, alignment: \{horizontal: "right"\}\}\), null\s*\]\);/g,
  'ws1Data.push([\\n        createCell("Category", {font: reportTheme.fonts.smallB, border: reportTheme.borders.bottomThin}), null,\\n        createCell("Allowance", {font: reportTheme.fonts.smallB, border: reportTheme.borders.bottomThin, alignment: {horizontal: "right"}}),\\n        createCell("Actual Withdrawn", {font: reportTheme.fonts.smallB, border: reportTheme.borders.bottomThin, alignment: {horizontal: "right"}}),\\n        createCell("Expenditure", {font: reportTheme.fonts.smallB, border: reportTheme.borders.bottomThin, alignment: {horizontal: "right"}}),\\n        createCell("Balance", {font: reportTheme.fonts.smallB, border: reportTheme.borders.bottomThin, alignment: {horizontal: "right"}}), null\\n      ]);'
);

c = c.replace(
  /ws1Merges\.push\(\{s:\{r: sr, c:0\}, e:\{r: sr, c:1\}\}\);\s*ws1Merges\.push\(\{s:\{r: sr, c:2\}, e:\{r: sr, c:3\}\}\);\s*ws1Merges\.push\(\{s:\{r: sr, c:5\}, e:\{r: sr, c:6\}\}\);/g,
  'ws1Merges.push({s:{r: sr, c:0}, e:{r: sr, c:1}});\\n      ws1Merges.push({s:{r: sr, c:5}, e:{r: sr, c:6}});\\n'
);

c = c.replace(
  /var totalAl = 0, totalEx = 0;/,
  'var totalAl = 0, totalEx = 0, totalWithdrawn = 0;'
);

c = c.replace(
  /var fbBal = getFbBalance\(matchedCat\.id, month, uh, uv\);\s*if \(fbBal !== 0\) bal = fbBal;/,
  'var fbBal = getFbBalance(matchedCat.id, month, uh, uv);\\n            fbWithdrawn = getFbWithdrawn(matchedCat.id, month, uh, uv);\\n            if (fbBal !== 0) bal = fbBal;'
);

c = c.replace(
  /var matchedCat = categories\.find\(function\(c\) \{ return c\.name === k; \}\);/,
  'var fbWithdrawn = 0;\\n        var matchedCat = categories.find(function(c) { return c.name === k; });'
);

c = c.replace(
  /totalAl \+= al; totalEx \+= ex;/,
  'totalAl += al; totalEx += ex; totalWithdrawn += fbWithdrawn;'
);

c = c.replace(
  /createCell\(al, \{font: font, alignment: \{horizontal: "right"\}\}, 'n', reportTheme\.formats\.currency\), null,\s*createCell\(ex, \{font: font, alignment: \{horizontal: "right"\}\}, 'n', reportTheme\.formats\.currency\),/g,
  'createCell(al, {font: font, alignment: {horizontal: "right"}}, \\\'n\\\', reportTheme.formats.currency),\\n          createCell(fbWithdrawn, {font: font, alignment: {horizontal: "right"}}, \\\'n\\\', reportTheme.formats.currency),\\n          createCell(ex, {font: font, alignment: {horizontal: "right"}}, \\\'n\\\', reportTheme.formats.currency),'
);

c = c.replace(
  /ws1Merges\.push\(\{s:\{r: rr, c:0\}, e:\{r: rr, c:1\}\}\);\s*ws1Merges\.push\(\{s:\{r: rr, c:2\}, e:\{r: rr, c:3\}\}\);\s*ws1Merges\.push\(\{s:\{r: rr, c:5\}, e:\{r: rr, c:6\}\}\);/g,
  'ws1Merges.push({s:{r: rr, c:0}, e:{r: rr, c:1}});\\n        ws1Merges.push({s:{r: rr, c:5}, e:{r: rr, c:6}});\\n'
);

c = c.replace(
  /createCell\(totalAl, \{font: reportTheme\.fonts\.smallB, alignment: \{horizontal: "right"\}, border: reportTheme\.borders\.topDouble, fill: \{fgColor: \{rgb: reportTheme\.palette\.TINT\}\}\}, 'n', reportTheme\.formats\.currency\), null,\s*createCell\(totalEx, \{font: reportTheme\.fonts\.smallB, alignment: \{horizontal: "right"\}, border: reportTheme\.borders\.topDouble, fill: \{fgColor: \{rgb: reportTheme\.palette\.TINT\}\}\}, 'n', reportTheme\.formats\.currency\),/g,
  'createCell(totalAl, {font: reportTheme.fonts.smallB, alignment: {horizontal: "right"}, border: reportTheme.borders.topDouble, fill: {fgColor: {rgb: reportTheme.palette.TINT}}}, \\\'n\\\', reportTheme.formats.currency),\\n        createCell(totalWithdrawn, {font: reportTheme.fonts.smallB, alignment: {horizontal: "right"}, border: reportTheme.borders.topDouble, fill: {fgColor: {rgb: reportTheme.palette.TINT}}}, \\\'n\\\', reportTheme.formats.currency),\\n        createCell(totalEx, {font: reportTheme.fonts.smallB, alignment: {horizontal: "right"}, border: reportTheme.borders.topDouble, fill: {fgColor: {rgb: reportTheme.palette.TINT}}}, \\\'n\\\', reportTheme.formats.currency),'
);

c = c.replace(
  /ws1Merges\.push\(\{s:\{r: tr, c:0\}, e:\{r: tr, c:1\}\}\);\s*ws1Merges\.push\(\{s:\{r: tr, c:2\}, e:\{r: tr, c:3\}\}\);\s*ws1Merges\.push\(\{s:\{r: tr, c:5\}, e:\{r: tr, c:6\}\}\);/g,
  'ws1Merges.push({s:{r: tr, c:0}, e:{r: tr, c:1}});\\n      ws1Merges.push({s:{r: tr, c:5}, e:{r: tr, c:6}});\\n'
);

fs.writeFileSync('app.js', c);

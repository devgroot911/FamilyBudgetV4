const fs = require('fs');
let c = fs.readFileSync('app.js', 'utf8');

c = c.replace(
  /ws2Data\.push\(\[\s*createCell\("Sub-category Summary", \{font: reportTheme\.fonts\.section\}\)\s*\]\);/g,
  'ws2Data.push([ createCell("Category Withdrawn Summary", {font: reportTheme.fonts.section}) ]);'
);

// Replace the sub-category summary table logic
let startIdx = c.indexOf('    ws2Data.push([' + '\\n' + '      createCell("Sub-category"');
let endIdx = c.indexOf('    ws2Data.push([ createCell("AI Insights"');
let blockToReplace = c.substring(startIdx, endIdx);

let newBlock = \`    ws2Data.push([
      createCell("Category", {font: reportTheme.fonts.header, fill: {fgColor: {rgb: reportTheme.palette.PRIMARY_DARK}}, border: reportTheme.borders.thinAll}),
      createCell("Actual Withdrawn", {font: reportTheme.fonts.header, fill: {fgColor: {rgb: reportTheme.palette.PRIMARY_DARK}}, border: reportTheme.borders.thinAll, alignment:{horizontal:"right"}}),
      createCell("Expenditure", {font: reportTheme.fonts.header, fill: {fgColor: {rgb: reportTheme.palette.PRIMARY_DARK}}, border: reportTheme.borders.thinAll, alignment:{horizontal:"right"}}),
      createCell("Balance", {font: reportTheme.fonts.header, fill: {fgColor: {rgb: reportTheme.palette.PRIMARY_DARK}}, border: reportTheme.borders.thinAll, alignment:{horizontal:"right"}})
    ]);
    ws2Rows.push({hpt: 20});
    
    if(summaryCatKeys.length === 0) {
       ws2Data.push([createCell("LKR 0.00 — No category data.", {font: reportTheme.fonts.body} )]);
       ws2Merges.push({s:{r: ws2Data.length-1, c:0}, e:{r: ws2Data.length-1, c:3}});
       ws2Rows.push({hpt: 18});
    } else {
       summaryCatKeys.forEach(function(k, i) {
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
         
         var fill = i % 2 === 0 ? {fgColor: {rgb: reportTheme.palette.LIGHT_BAND}} : null;
         var styleL = {font: reportTheme.fonts.body, border: reportTheme.borders.bottomThin};
         var styleR = {font: reportTheme.fonts.body, border: reportTheme.borders.bottomThin, alignment:{horizontal:"right"}};
         var styleWarn = {font: bal < 0 ? reportTheme.fonts.warn : reportTheme.fonts.body, border: reportTheme.borders.bottomThin, alignment:{horizontal:"right"}};
         if(fill) { styleL.fill = fill; styleR.fill = fill; styleWarn.fill = fill; }
         
         ws2Data.push([
           createCell(k, styleL),
           createCell(fbWithdrawn, styleR, 'n', reportTheme.formats.currency),
           createCell(ex, styleR, 'n', reportTheme.formats.currency),
           createCell(bal, styleWarn, 'n', reportTheme.formats.currency)
         ]);
         ws2Rows.push({hpt: 18});
       });
    }
    
    ws2Data.push([
      createCell("TOTAL", {font: reportTheme.fonts.smallB, alignment:{horizontal:"right"}}),
      createCell(totalWithdrawn, {font: reportTheme.fonts.smallB, alignment:{horizontal:"right"}, border: reportTheme.borders.topDouble, fill: {fgColor: {rgb: reportTheme.palette.TINT}}}, 'n', reportTheme.formats.currency),
      createCell(totalEx, {font: reportTheme.fonts.smallB, alignment:{horizontal:"right"}, border: reportTheme.borders.topDouble, fill: {fgColor: {rgb: reportTheme.palette.TINT}}}, 'n', reportTheme.formats.currency),
      createCell(balTotal, {font: balTotal < 0 ? reportTheme.fonts.warn : reportTheme.fonts.smallB, alignment:{horizontal:"right"}, border: reportTheme.borders.topDouble, fill: {fgColor: {rgb: reportTheme.palette.TINT}}}, 'n', reportTheme.formats.currency)
    ]);
    ws2Rows.push({hpt: 20});
    ws2Data.push([]); ws2Rows.push({hpt: 12});
    
\`;

c = c.replace(blockToReplace, newBlock);

// Replace c:2 with c:3 in all ws2Merges
c = c.replace(/ws2Merges\.push\(\{s:\{r: (.*?), c:0\}, e:\{r: (.*?), c:2\}\}\);/g, "ws2Merges.push({s:{r: $1, c:0}, e:{r: $2, c:3}});");
c = c.replace(/ws2Merges\.push\(\{s:\{r: (.*?), c:1\}, e:\{r: (.*?), c:2\}\}\);/g, "ws2Merges.push({s:{r: $1, c:1}, e:{r: $2, c:3}});");

// Fix cols array
c = c.replace(/ws2\['!cols'\] = \[\{wch:25\}, \{wch:20\}, \{wch:20\}\];/g, "ws2['!cols'] = [{wch:22}, {wch:18}, {wch:18}, {wch:18}];");

fs.writeFileSync('app.js', c);

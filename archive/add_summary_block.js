const fs = require('fs');

let appJs = fs.readFileSync('app.js', 'utf8');
const funcStart = appJs.indexOf('function generateExcelReport(username, month) {');
if (funcStart !== -1) {
  appJs = appJs.substring(0, funcStart);
}

const newEngine = `
function generateExcelReport(username, month) {
  try {
    if (!window.XLSX) return notify('Excel library loading...');
    
    var profile = state.profiles && state.profiles[username] ? state.profiles[username] : {};
    var meta = {
      motherName: profile.name || username || "—",
      village: profile.village || "—",
      house: profile.house || "—",
      period: month || "—"
    };
    
    var list = (state.expenses || []).filter(function(e) {
      return e.user === username && e.date.indexOf(month) === 0 && e.date && e.name;
    }).sort(function(a, b) { return a.date.localeCompare(b.date); });
    
    var wb = XLSX.utils.book_new();
    
    // --- Pre-compute Totals ---
    var grandTotal = 0;
    var cat1Totals = {};
    var cat2Totals = {};
    var zeroCount = 0;
    var itemGroups = {};
    
    list.forEach(function(e) {
      var c1Name = cat(e.category); c1Name = c1Name ? c1Name.name : "Uncategorised";
      var c2Name = subcat(e.subcategory) || "Uncategorised";
      var tPrice = Number(e.total);
      
      grandTotal += tPrice;
      cat1Totals[c1Name] = (cat1Totals[c1Name] || 0) + tPrice;
      cat2Totals[c2Name] = (cat2Totals[c2Name] || 0) + tPrice;
      itemGroups[e.name] = (itemGroups[e.name] || 0) + tPrice;
      if (tPrice === 0) zeroCount++;
    });
    
    var cat1Allowances = {};
    (state.categories || []).forEach(function(c) {
      var allowAmt = Number(state.allowances[username + '_' + month + '_' + c.id]) || 0;
      cat1Allowances[c.name] = allowAmt;
    });
    cat1Allowances["Uncategorised"] = 0;
    
    var summaryCatKeys = Object.keys(cat1Totals).concat(Object.keys(cat1Allowances));
    summaryCatKeys = summaryCatKeys.filter(function(item, pos) { return summaryCatKeys.indexOf(item) === pos; });
    summaryCatKeys = summaryCatKeys.filter(function(k) { return cat1Allowances[k] > 0 || cat1Totals[k] > 0; }).sort();

    // --- SHEET 1: Expense Records ---
    var ws1Data = [], ws1Merges = [], ws1Rows = [];
    writeTitleBlock(ws1Data, ws1Merges, ws1Rows, meta, 6);
    
    // Insert Allowance vs Expenditure Summary
    if (summaryCatKeys.length > 0) {
      ws1Data.push([createCell("ALLOWANCE VS EXPENDITURE SUMMARY", {font: reportTheme.fonts.section, border: reportTheme.borders.bottomAccent})]);
      ws1Merges.push({s:{r: ws1Data.length-1, c:0}, e:{r: ws1Data.length-1, c:6}});
      ws1Rows.push({hpt: 20});

      ws1Data.push([
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
      ws1Rows.push({hpt: 18});

      ws1Data.push([]); ws1Rows.push({hpt: 12});
    }

    ws1Data.push([createCell("ITEMIZED EXPENSE RECORDS", {font: reportTheme.fonts.section, border: reportTheme.borders.bottomAccent})]);
    ws1Merges.push({s:{r: ws1Data.length-1, c:0}, e:{r: ws1Data.length-1, c:6}});
    ws1Rows.push({hpt: 20});
    
    var headers = ['Date', 'Item Name', 'Category', 'Sub-category', 'Qty', 'Unit Price', 'Total Price'];
    ws1Data.push(headers.map(function(h) {
      return createCell(h, {font: reportTheme.fonts.header, fill: {fgColor: {rgb: reportTheme.palette.PRIMARY_DARK}}, alignment: {horizontal: "center", vertical: "center", wrapText: true}, border: reportTheme.borders.thinAll});
    }));
    ws1Rows.push({hpt: 22});
    var freezeRow = ws1Data.length;
    
    if (list.length === 0) {
       ws1Data.push([createCell("LKR 0.00 — No expenses recorded for this period.", {font: reportTheme.fonts.body, alignment: {horizontal: "center"}} )]);
       ws1Merges.push({s:{r: ws1Data.length-1, c:0}, e:{r: ws1Data.length-1, c:6}});
       ws1Rows.push({hpt: 20});
    } else {
       list.forEach(function(e, i) {
         var c1Name = cat(e.category); c1Name = c1Name ? c1Name.name : "Uncategorised";
         var c2Name = subcat(e.subcategory) || "Uncategorised";
         var tPrice = Number(e.total);
         var uPrice = tPrice / (Number(e.quantity) || 1);
         
         var isHigh = tPrice >= 5000;
         var fill = isHigh ? {fgColor: {rgb: reportTheme.palette.WARN_FILL}} : (i % 2 === 0 ? {fgColor: {rgb: reportTheme.palette.LIGHT_BAND}} : null);
         var rowFont = isHigh ? reportTheme.fonts.warn : reportTheme.fonts.body;
         var baseStyle = {font: rowFont, border: reportTheme.borders.bottomThin};
         if (fill) baseStyle.fill = fill;
         
         var cStyle = Object.assign({}, baseStyle, {alignment: {horizontal: "center"}});
         var nStyle = Object.assign({}, baseStyle, {alignment: {horizontal: "right"}});
         
         ws1Data.push([
           createCell(e.date, cStyle, 's'),
           createCell(e.name, baseStyle, 's'),
           createCell(c1Name, baseStyle, 's'),
           createCell(c2Name, baseStyle, 's'),
           createCell(e.quantity, cStyle, 'n'),
           createCell(uPrice, nStyle, 'n', reportTheme.formats.currency),
           createCell(tPrice, nStyle, 'n', reportTheme.formats.currency)
         ]);
         ws1Rows.push({hpt: 18});
       });
    }
    
    // Total Row
    var tIdx = ws1Data.length;
    ws1Data.push([
      createCell("TOTAL EXPENSE RECORDS", {font: {name: "Calibri", sz:11, bold: true}, alignment: {horizontal: "right"}}),
      null, null, null, null, null,
      createCell(grandTotal, {font: {name: "Calibri", sz:11, bold: true}, fill: {fgColor: {rgb: reportTheme.palette.TINT}}, border: reportTheme.borders.topDouble, alignment: {horizontal: "right"}}, 'n', reportTheme.formats.currency)
    ]);
    ws1Merges.push({s:{r:tIdx, c:0}, e:{r:tIdx, c:5}});
    ws1Rows.push({hpt: 20});
    
    writeSignatureBlock(ws1Data, ws1Merges, ws1Rows, true);
    
    var ws1 = XLSX.utils.aoa_to_sheet(ws1Data);
    ws1['!merges'] = ws1Merges;
    ws1['!rows'] = ws1Rows;
    ws1['!cols'] = [{wch:11}, {wch:23}, {wch:12}, {wch:12}, {wch:5}, {wch:9}, {wch:10}];
    ws1['!freeze'] = { ySplit: freezeRow };
    ws1['!pageSetup'] = { paperSize: 9, orientation: 'portrait', fitToWidth: 1, fitToHeight: 0 };
    ws1['!margins'] = { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 };
    ws1['!views'] = [{showGridLines: false}];
    
    // --- SHEET 2: Summary & Insights ---
    var ws2Data = [], ws2Merges = [], ws2Rows = [];
    writeTitleBlock(ws2Data, ws2Merges, ws2Rows, meta, 2);
    
    ws2Data.push([ createCell("Grand Total Expenditure", {font: reportTheme.fonts.section}) ]);
    ws2Data.push([ 
      createCell("", {fill: {fgColor: {rgb: reportTheme.palette.LIGHT_BAND}}, border: reportTheme.borders.box}), 
      createCell(grandTotal, {font: {name: "Calibri", sz:16, bold:true, color:{rgb:reportTheme.palette.TEXT_DARK}}, fill: {fgColor: {rgb: reportTheme.palette.LIGHT_BAND}}, border: reportTheme.borders.box, alignment: {horizontal:"center"}}, 'n', reportTheme.formats.currency) 
    ]);
    ws2Merges.push({s:{r: ws2Data.length-1, c:1}, e:{r: ws2Data.length-1, c:2}});
    ws2Rows.push({hpt: 18}, {hpt: 30});
    ws2Data.push([]); ws2Rows.push({hpt: 12});
    
    ws2Data.push([ createCell("Sub-category Summary", {font: reportTheme.fonts.section}) ]);
    ws2Rows.push({hpt: 18});
    
    ws2Data.push([
      createCell("Sub-category", {font: reportTheme.fonts.header, fill: {fgColor: {rgb: reportTheme.palette.PRIMARY_DARK}}, border: reportTheme.borders.thinAll}),
      createCell("Total Expenditure", {font: reportTheme.fonts.header, fill: {fgColor: {rgb: reportTheme.palette.PRIMARY_DARK}}, border: reportTheme.borders.thinAll, alignment:{horizontal:"right"}}),
      createCell("% of Total", {font: reportTheme.fonts.header, fill: {fgColor: {rgb: reportTheme.palette.PRIMARY_DARK}}, border: reportTheme.borders.thinAll, alignment:{horizontal:"right"}})
    ]);
    ws2Rows.push({hpt: 20});
    
    var cat2Keys = Object.keys(cat2Totals).sort(function(a,b){return cat2Totals[b]-cat2Totals[a]});
    if(cat2Keys.length === 0) {
       ws2Data.push([createCell("LKR 0.00 — No category data.", {font: reportTheme.fonts.body} )]);
       ws2Merges.push({s:{r: ws2Data.length-1, c:0}, e:{r: ws2Data.length-1, c:2}});
       ws2Rows.push({hpt: 18});
    } else {
       cat2Keys.forEach(function(k, i) {
         var pct = grandTotal ? (cat2Totals[k]/grandTotal) : 0;
         var fill = i % 2 === 0 ? {fgColor: {rgb: reportTheme.palette.LIGHT_BAND}} : null;
         var styleL = {font: reportTheme.fonts.body, border: reportTheme.borders.bottomThin};
         var styleR = {font: reportTheme.fonts.body, border: reportTheme.borders.bottomThin, alignment:{horizontal:"right"}};
         if(fill) { styleL.fill = fill; styleR.fill = fill; }
         
         ws2Data.push([
           createCell(k, styleL),
           createCell(cat2Totals[k], styleR, 'n', reportTheme.formats.currency),
           createCell(pct, styleR, 'n', reportTheme.formats.pct)
         ]);
         ws2Rows.push({hpt: 18});
       });
    }
    
    ws2Data.push([
      createCell("TOTAL", {font: reportTheme.fonts.smallB, alignment:{horizontal:"right"}}),
      createCell(grandTotal, {font: reportTheme.fonts.smallB, alignment:{horizontal:"right"}, border: reportTheme.borders.topDouble, fill: {fgColor: {rgb: reportTheme.palette.TINT}}}, 'n', reportTheme.formats.currency),
      createCell(1, {font: reportTheme.fonts.smallB, alignment:{horizontal:"right"}, border: reportTheme.borders.topDouble, fill: {fgColor: {rgb: reportTheme.palette.TINT}}}, 'n', reportTheme.formats.pct)
    ]);
    ws2Rows.push({hpt: 20});
    ws2Data.push([]); ws2Rows.push({hpt: 12});
    
    ws2Data.push([ createCell("AI Insights", {font: reportTheme.fonts.section, border: reportTheme.borders.bottomAccent}) ]);
    ws2Merges.push({s:{r: ws2Data.length-1, c:0}, e:{r: ws2Data.length-1, c:2}});
    ws2Rows.push({hpt: 18});
    
    var largestC = cat2Keys[0] || "None";
    ws2Data.push([ createCell("Largest Sub-category", {font: reportTheme.fonts.metaLabel}), createCell(largestC, {font: reportTheme.fonts.metaVal}) ]);
    ws2Merges.push({s:{r: ws2Data.length-1, c:1}, e:{r: ws2Data.length-1, c:2}});
    ws2Rows.push({hpt: 18});
    
    ws2Data.push([]); ws2Rows.push({hpt: 12});
    ws2Data.push([ createCell("Data Quality Flags", {font: reportTheme.fonts.section, border: reportTheme.borders.bottomAccent}) ]);
    ws2Merges.push({s:{r: ws2Data.length-1, c:0}, e:{r: ws2Data.length-1, c:2}});
    ws2Rows.push({hpt: 18});
    
    if (zeroCount === 0 && list.length > 0 && cat2Keys.indexOf("Uncategorised") === -1) {
      ws2Data.push([ createCell("✓ No anomalies detected.", {font: reportTheme.fonts.ok}) ]);
      ws2Merges.push({s:{r: ws2Data.length-1, c:0}, e:{r: ws2Data.length-1, c:2}});
    } else if (list.length === 0) {
      ws2Data.push([ createCell("— No data to analyze.", {font: reportTheme.fonts.body}) ]);
      ws2Merges.push({s:{r: ws2Data.length-1, c:0}, e:{r: ws2Data.length-1, c:2}});
    } else {
      if (zeroCount > 0) {
        ws2Data.push([ createCell("⚠ " + zeroCount + " entries have LKR 0.00 total.", {font: reportTheme.fonts.warn, fill: {fgColor: {rgb: reportTheme.palette.WARN_FILL}}}) ]);
        ws2Merges.push({s:{r: ws2Data.length-1, c:0}, e:{r: ws2Data.length-1, c:2}});
      }
      if (cat2Keys.indexOf("Uncategorised") !== -1) {
        ws2Data.push([ createCell("⚠ Contains uncategorised items.", {font: reportTheme.fonts.warn, fill: {fgColor: {rgb: reportTheme.palette.WARN_FILL}}}) ]);
        ws2Merges.push({s:{r: ws2Data.length-1, c:0}, e:{r: ws2Data.length-1, c:2}});
      }
    }
    ws2Rows.push({hpt: 18});
    
    writeSignatureBlock(ws2Data, ws2Merges, ws2Rows, false);
    
    var ws2 = XLSX.utils.aoa_to_sheet(ws2Data);
    ws2['!merges'] = ws2Merges;
    ws2['!rows'] = ws2Rows;
    ws2['!cols'] = [{wch:25}, {wch:20}, {wch:20}];
    ws2['!pageSetup'] = { paperSize: 9, orientation: 'portrait', fitToWidth: 1, fitToHeight: 0 };
    ws2['!margins'] = { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 };
    ws2['!views'] = [{showGridLines: false}];
    
    XLSX.utils.book_append_sheet(wb, ws1, 'Expense Records');
    XLSX.utils.book_append_sheet(wb, ws2, 'Summary & Insights');
    
    if(!wb.Workbook) wb.Workbook = { Views: [{ activeTab: 1 }] };
    
    XLSX.writeFile(wb, 'SOS_Budget_Report_' + username + '_' + month + '.xlsx');
    
  } catch (err) {
    console.error("Excel generation failed:", err);
    notify("Warning: Advanced styling failed, reverting to defaults. " + err.message);
  }
}
`;

appJs += newEngine;
fs.writeFileSync('app.js', appJs);
console.log('Successfully injected Allowance vs Expenditure Summary block.');

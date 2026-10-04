const fs = require('fs');

let appJs = fs.readFileSync('app.js', 'utf8');
const funcStart = appJs.indexOf('function generateExcelReport(username, month) {');
if (funcStart !== -1) {
  appJs = appJs.substring(0, funcStart);
}

const newEngine = `
var reportTheme = {
  palette: {
    PRIMARY_DARK: "1F5C3A", ACCENT: "7BB661", LIGHT_BAND: "F4F8F4",
    BORDER_GREY: "D0D7D2", TEXT_DARK: "1A1A1A", TEXT_MUTED: "6B7280",
    WARN: "C0392B", WARN_FILL: "FADBD8", OK: "2E7D32", TINT: "E8F5E9"
  },
  fonts: {
    title: { name: "Calibri", sz: 14, bold: true, color: { rgb: "FFFFFF" } },
    section: { name: "Calibri", sz: 12, bold: true, color: { rgb: "1F5C3A" } },
    header: { name: "Calibri", sz: 10.5, bold: true, color: { rgb: "FFFFFF" } },
    body: { name: "Calibri", sz: 10.5, color: { rgb: "1A1A1A" } },
    metaLabel: { name: "Calibri", sz: 11, bold: true, color: { rgb: "6B7280" } },
    metaVal: { name: "Calibri", sz: 11, color: { rgb: "1A1A1A" } },
    smallB: { name: "Calibri", sz: 9, bold: true, color: { rgb: "1A1A1A" } },
    smallMuted: { name: "Calibri", sz: 9, italic: true, color: { rgb: "6B7280" } },
    warn: { name: "Calibri", sz: 10.5, bold: true, color: { rgb: "C0392B" } },
    ok: { name: "Calibri", sz: 11, bold: true, color: { rgb: "2E7D32" } }
  },
  formats: { currency: '"LKR "#,##0.00', date: 'DD-MMM-YYYY', pct: '0.0%' },
  borders: {
    thinAll: {
      top: {style: "thin", color: {rgb: "D0D7D2"}}, bottom: {style: "thin", color: {rgb: "D0D7D2"}},
      left: {style: "thin", color: {rgb: "D0D7D2"}}, right: {style: "thin", color: {rgb: "D0D7D2"}}
    },
    bottomThin: { bottom: {style: "thin", color: {rgb: "D0D7D2"}} },
    bottomAccent: { bottom: {style: "thin", color: {rgb: "7BB661"}} },
    topDouble: { top: {style: "double", color: {rgb: "1F5C3A"}} },
    box: {
      top: {style: "medium", color: {rgb: "1F5C3A"}}, bottom: {style: "medium", color: {rgb: "1F5C3A"}},
      left: {style: "medium", color: {rgb: "1F5C3A"}}, right: {style: "medium", color: {rgb: "1F5C3A"}}
    },
    sigLine: { bottom: {style: "medium", color: {rgb: "1A1A1A"}} }
  }
};

function createCell(val, style, type, fmt) {
  var c = { v: val, t: type || (typeof val === 'number' ? 'n' : 's'), s: style || reportTheme.fonts.body };
  if (fmt) c.z = fmt;
  return c;
}

function writeTitleBlock(wsData, wsMerges, wsRows, meta, colsSpan) {
  wsData.push([ createCell("SOS CHILDREN\\'S VILLAGES — FAMILY BUDGET REPORT", {font: reportTheme.fonts.title, fill: {fgColor: {rgb: reportTheme.palette.PRIMARY_DARK}}, alignment: {vertical: "center", indent: 1}, border: reportTheme.borders.bottomAccent}) ]);
  wsMerges.push({s: {r: wsData.length-1, c:0}, e: {r: wsData.length-1, c: colsSpan}});
  wsRows.push({hpt: 30});
  
  var mRows = [
    ["Mother Name:", meta.motherName], ["Village:", meta.village],
    ["Family House Number:", meta.house], ["Reporting Period:", meta.period]
  ];
  mRows.forEach(function(mr, i) {
    wsData.push([ createCell(mr[0], {font: reportTheme.fonts.metaLabel}), createCell(mr[1], {font: reportTheme.fonts.metaVal}) ]);
    wsMerges.push({s: {r: wsData.length-1, c: 1}, e: {r: wsData.length-1, c: Math.min(3, colsSpan)}});
    wsRows.push({hpt: 16});
  });
  
  wsData.push([]); wsRows.push({hpt: 6});
}

function writeSignatureBlock(wsData, wsMerges, wsRows, isWide) {
  wsData.push([]); wsRows.push({hpt: 12});
  var sIdx = wsData.length;
  
  if (isWide) {
    wsData.push([
      createCell("Mother", {font: reportTheme.fonts.smallB}), null,
      createCell("Accounts Assistant", {font: reportTheme.fonts.smallB}), null,
      createCell("Village Director", {font: reportTheme.fonts.smallB})
    ]);
    wsData.push([
      createCell("", {border: reportTheme.borders.sigLine}), null,
      createCell("", {border: reportTheme.borders.sigLine}), null,
      createCell("", {border: reportTheme.borders.sigLine})
    ]);
    wsData.push([
      createCell("Date: __________", {font: reportTheme.fonts.smallMuted}), null,
      createCell("Date: __________", {font: reportTheme.fonts.smallMuted}), null,
      createCell("Date: __________", {font: reportTheme.fonts.smallMuted})
    ]);
    wsMerges.push({s:{r:sIdx,c:0}, e:{r:sIdx,c:1}}, {s:{r:sIdx+1,c:0}, e:{r:sIdx+1,c:1}}, {s:{r:sIdx+2,c:0}, e:{r:sIdx+2,c:1}});
    wsMerges.push({s:{r:sIdx,c:2}, e:{r:sIdx,c:3}}, {s:{r:sIdx+1,c:2}, e:{r:sIdx+1,c:3}}, {s:{r:sIdx+2,c:2}, e:{r:sIdx+2,c:3}});
    wsMerges.push({s:{r:sIdx,c:4}, e:{r:sIdx,c:6}}, {s:{r:sIdx+1,c:4}, e:{r:sIdx+1,c:6}}, {s:{r:sIdx+2,c:4}, e:{r:sIdx+2,c:6}});
  } else {
    wsData.push([
      createCell("Mother", {font: reportTheme.fonts.smallB}),
      createCell("Accounts Assistant", {font: reportTheme.fonts.smallB}),
      createCell("Village Director", {font: reportTheme.fonts.smallB})
    ]);
    wsData.push([
      createCell("", {border: reportTheme.borders.sigLine}),
      createCell("", {border: reportTheme.borders.sigLine}),
      createCell("", {border: reportTheme.borders.sigLine})
    ]);
    wsData.push([
      createCell("Date: __________", {font: reportTheme.fonts.smallMuted}),
      createCell("Date: __________", {font: reportTheme.fonts.smallMuted}),
      createCell("Date: __________", {font: reportTheme.fonts.smallMuted})
    ]);
  }
  wsRows.push({hpt: 14}, {hpt: 20}, {hpt: 14});
}

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
    
    // --- SHEET 1: Expense Records ---
    var ws1Data = [], ws1Merges = [], ws1Rows = [];
    writeTitleBlock(ws1Data, ws1Merges, ws1Rows, meta, 6);
    
    var headers = ['Date', 'Item Name', 'Category', 'Sub-category', 'Qty', 'Unit Price', 'Total Price'];
    ws1Data.push(headers.map(function(h) {
      return createCell(h, {font: reportTheme.fonts.header, fill: {fgColor: {rgb: reportTheme.palette.PRIMARY_DARK}}, alignment: {horizontal: "center", vertical: "center", wrapText: true}, border: reportTheme.borders.thinAll});
    }));
    ws1Rows.push({hpt: 22});
    var freezeRow = ws1Data.length;
    
    var grandTotal = 0;
    var cat2Totals = {};
    var zeroCount = 0;
    
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
         grandTotal += tPrice;
         cat2Totals[c2Name] = (cat2Totals[c2Name] || 0) + tPrice;
         if (tPrice === 0) zeroCount++;
         
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
      createCell("TOTAL", {font: {name: "Calibri", sz:11, bold: true}, alignment: {horizontal: "right"}}),
      null, null, null, null, null,
      createCell(grandTotal, {font: {name: "Calibri", sz:11, bold: true}, fill: {fgColor: {rgb: reportTheme.palette.TINT}}, border: reportTheme.borders.topDouble, alignment: {horizontal: "right"}}, 'n', reportTheme.formats.currency)
    ]);
    ws1Merges.push({s:{r:tIdx, c:0}, e:{r:tIdx, c:5}});
    ws1Rows.push({hpt: 20});
    
    writeSignatureBlock(ws1Data, ws1Merges, ws1Rows, true);
    
    var ws1 = XLSX.utils.aoa_to_sheet(ws1Data);
    ws1['!merges'] = ws1Merges;
    ws1['!rows'] = ws1Rows;
    ws1['!cols'] = [{wch:12}, {wch:30}, {wch:15}, {wch:18}, {wch:8}, {wch:12}, {wch:14}];
    ws1['!freeze'] = { ySplit: freezeRow };
    ws1['!pageSetup'] = { paperSize: 9, orientation: 'landscape', fitToWidth: 1, fitToHeight: 0 };
    ws1['!margins'] = { left: 0.5, right: 0.5, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 };
    ws1['!views'] = [{showGridLines: false}];
    
    // --- SHEET 2: Summary & Insights ---
    var ws2Data = [], ws2Merges = [], ws2Rows = [];
    writeTitleBlock(ws2Data, ws2Merges, ws2Rows, meta, 2);
    
    ws2Data.push([ createCell("Grand Total", {font: reportTheme.fonts.section}) ]);
    ws2Data.push([ 
      createCell("", {fill: {fgColor: {rgb: reportTheme.palette.LIGHT_BAND}}, border: reportTheme.borders.box}), 
      createCell(grandTotal, {font: {name: "Calibri", sz:16, bold:true, color:{rgb:reportTheme.palette.PRIMARY_DARK}}, fill: {fgColor: {rgb: reportTheme.palette.LIGHT_BAND}}, border: reportTheme.borders.box, alignment: {horizontal:"center"}}, 'n', reportTheme.formats.currency) 
    ]);
    ws2Merges.push({s:{r: ws2Data.length-1, c:1}, e:{r: ws2Data.length-1, c:2}});
    ws2Rows.push({hpt: 18}, {hpt: 30});
    ws2Data.push([]); ws2Rows.push({hpt: 12});
    
    ws2Data.push([ createCell("Category Summary", {font: reportTheme.fonts.section}) ]);
    ws2Rows.push({hpt: 18});
    
    ws2Data.push([
      createCell("Category", {font: reportTheme.fonts.header, fill: {fgColor: {rgb: reportTheme.palette.PRIMARY_DARK}}, border: reportTheme.borders.thinAll}),
      createCell("Total Expenditure", {font: reportTheme.fonts.header, fill: {fgColor: {rgb: reportTheme.palette.PRIMARY_DARK}}, border: reportTheme.borders.thinAll, alignment:{horizontal:"right"}}),
      createCell("% of Total", {font: reportTheme.fonts.header, fill: {fgColor: {rgb: reportTheme.palette.PRIMARY_DARK}}, border: reportTheme.borders.thinAll, alignment:{horizontal:"right"}})
    ]);
    ws2Rows.push({hpt: 20});
    
    var catKeys = Object.keys(cat2Totals).sort(function(a,b){return cat2Totals[b]-cat2Totals[a]});
    if(catKeys.length === 0) {
       ws2Data.push([createCell("LKR 0.00 — No category data.", {font: reportTheme.fonts.body} )]);
       ws2Merges.push({s:{r: ws2Data.length-1, c:0}, e:{r: ws2Data.length-1, c:2}});
       ws2Rows.push({hpt: 18});
    } else {
       catKeys.forEach(function(k, i) {
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
    
    var largestC = catKeys[0] || "None";
    ws2Data.push([ createCell("Largest Category", {font: reportTheme.fonts.metaLabel}), createCell(largestC, {font: reportTheme.fonts.metaVal}) ]);
    ws2Merges.push({s:{r: ws2Data.length-1, c:1}, e:{r: ws2Data.length-1, c:2}});
    ws2Rows.push({hpt: 18});
    
    ws2Data.push([]); ws2Rows.push({hpt: 12});
    ws2Data.push([ createCell("Data Quality Flags", {font: reportTheme.fonts.section, border: reportTheme.borders.bottomAccent}) ]);
    ws2Merges.push({s:{r: ws2Data.length-1, c:0}, e:{r: ws2Data.length-1, c:2}});
    ws2Rows.push({hpt: 18});
    
    if (zeroCount === 0 && list.length > 0 && catKeys.indexOf("Uncategorised") === -1) {
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
      if (catKeys.indexOf("Uncategorised") !== -1) {
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
    ws2['!margins'] = { left: 0.5, right: 0.5, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 };
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
console.log('Successfully injected modular Excel generator.');

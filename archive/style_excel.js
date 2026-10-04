const fs = require('fs');

// 1. Update index.html
let html = fs.readFileSync('index.html', 'utf8');
html = html.replace('https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js', 'https://cdn.jsdelivr.net/npm/xlsx-js-style@1.2.0/dist/xlsx.bundle.js');
fs.writeFileSync('index.html', html);

// 2. Update app.js
let appJs = fs.readFileSync('app.js', 'utf8');

const stylingCode = `
  // --- APPLY STYLES USING XLSX-JS-STYLE ---
  function applyStyles(ws, tableStart, tableEnd, maxCol) {
    if (!ws['!ref']) return;
    var range = XLSX.utils.decode_range(ws['!ref']);
    for(var R = 0; R <= range.e.r; ++R) {
      for(var C = 0; C <= range.e.c; ++C) {
        var addr = XLSX.utils.encode_cell({c:C, r:R});
        if (!ws[addr]) {
          if (R >= tableStart && R <= tableEnd && C <= maxCol) ws[addr] = { t: 's', v: '' };
          else continue;
        }
        if (!ws[addr].s) ws[addr].s = {};
        
        // Main title bold
        if (R === 0) ws[addr].s.font = { bold: true, sz: 14, color: { rgb: "333333" } };
        // Metadata labels bold
        if (R >= 1 && R <= 4 && C === 0) ws[addr].s.font = { bold: true };
        
        // Table Borders & Shading
        if (R >= tableStart && R <= tableEnd && C <= maxCol) {
          ws[addr].s.border = {
            top: { style: "thin", color: { rgb: "D9D9D9" } },
            bottom: { style: "thin", color: { rgb: "D9D9D9" } },
            left: { style: "thin", color: { rgb: "D9D9D9" } },
            right: { style: "thin", color: { rgb: "D9D9D9" } }
          };
          
          // Zebra striping for data rows
          if (R > tableStart && R % 2 === 1) {
            ws[addr].s.fill = { fgColor: { rgb: "F7F7F7" } };
          }
          
          // Number formatting for prices
          if (R > tableStart && (C === 5 || C === 6)) {
             ws[addr].s.numFmt = "#,##0.00";
          }
        }
        
        // Table Header
        if (R === tableStart && C <= maxCol) {
          ws[addr].s.fill = { fgColor: { rgb: "EAEAEA" } };
          ws[addr].s.font = { bold: true };
          ws[addr].s.border.top = { style: "medium", color: { rgb: "888888" } };
          ws[addr].s.border.bottom = { style: "medium", color: { rgb: "888888" } };
        }
      }
    }
  }

  // Apply to Sheet 1 (Headers start at row index 6, data ends before the 6 signature rows)
  applyStyles(ws1, 6, recordsData.length - 7, 6);

  // Apply to Sheet 2 (Let's just apply basic bolding for sheet 2 headers)
  if (ws2['!ref']) {
    var range2 = XLSX.utils.decode_range(ws2['!ref']);
    for(var R = 0; R <= range2.e.r; ++R) {
      for(var C = 0; C <= range2.e.c; ++C) {
        var addr = XLSX.utils.encode_cell({c:C, r:R});
        if(!ws2[addr]) continue;
        if(!ws2[addr].s) ws2[addr].s = {};
        if (ws2[addr].v === 'TOTALS' || ws2[addr].v === 'CATEGORY SUMMARY' || ws2[addr].v === 'AI INSIGHTS' || ws2[addr].v === 'DATA QUALITY FLAGS') {
          ws2[addr].s.font = { bold: true, sz: 12 };
          ws2[addr].s.fill = { fgColor: { rgb: "EAEAEA" } };
        }
        if (R === 0) ws2[addr].s.font = { bold: true, sz: 14 };
        if (R >= 1 && R <= 4 && C === 0) ws2[addr].s.font = { bold: true };
      }
    }
  }
`;

appJs = appJs.replace(`var wb = XLSX.utils.book_new();`, stylingCode + `\n  var wb = XLSX.utils.book_new();`);
fs.writeFileSync('app.js', appJs);

console.log('Injected styling logic');

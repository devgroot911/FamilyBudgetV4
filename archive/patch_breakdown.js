const fs = require('fs');
let c = fs.readFileSync('app.js', 'utf8');

c = c.replace(
  "    writeSignatureBlock(ws2Data, ws2Merges, ws2Rows, false);",
  \`    // --- Allowance Calculation Details ---
    var yr = parseInt(month.split('-')[0], 10), mo = parseInt(month.split('-')[1], 10);
    var uh = profile.house || '';
    var uv = profile.village || '';
    var fbRow = (window.appState.fbAllocations || []).find(function(r) {
      return r.year === yr && r.month === mo && String(r.house_no) === String(uh) && String(r.village) === String(uv);
    });
    
    if (fbRow && fbRow.calcs) {
       ws2Data.push([ createCell("Allowance Calculation Breakdown", {font: reportTheme.fonts.section, border: reportTheme.borders.bottomAccent}) ]);
       ws2Merges.push({s:{r: ws2Data.length-1, c:0}, e:{r: ws2Data.length-1, c:2}});
       ws2Rows.push({hpt: 20});
       
       var addRow = function(label, val, isMoney, isString) {
          ws2Data.push([ createCell(label, {font: reportTheme.fonts.body}), createCell(val, {font: reportTheme.fonts.body, alignment:{horizontal:"right"}}, isString ? 's' : 'n', isMoney ? reportTheme.formats.currency : undefined) ]);
          ws2Merges.push({s:{r: ws2Data.length-1, c:1}, e:{r: ws2Data.length-1, c:2}});
          ws2Rows.push({hpt: 16});
       };
       addRow("Children Under 12", fbRow.child_u12, false, false);
       addRow("Children Over 12", fbRow.child_o12, false, false);
       addRow("Mother / Aunt", (fbRow.mother_count || 0) + " / " + (fbRow.aunt_amount > 0 ? "Yes" : "No"), false, true);
       addRow("Total Food Budget", fbRow.calcs.total_food, true, false);
       addRow("Total Household Budget", fbRow.calcs.total_hh, true, false);
       addRow("Total Clothing Budget", fbRow.calcs.total_clothing, true, false);
       if (fbRow.calcs.adjustment) addRow("Manual Adjustment", fbRow.calcs.adjustment, true, false);
       if (fbRow.calcs.festival) addRow("Festival Allowance", fbRow.calcs.festival, true, false);
       if (fbRow.calcs.food_balance) addRow("Food End Balance (incl. savings)", fbRow.calcs.food_balance, true, false);
       
       ws2Data.push([]); ws2Rows.push({hpt: 18});
    }
    
    writeSignatureBlock(ws2Data, ws2Merges, ws2Rows, false);\`
);

fs.writeFileSync('app.js', c);

const fs = require('fs');
let appJs = fs.readFileSync('app.js', 'utf8');

const regexFunc = /function generateExcelReport[\s\S]*?XLSX\.writeFile\(wb, 'Report_' \+ username \+ '_' \+ month \+ '\.xlsx'\);\s*\}/;

const newFunc = `function generateExcelReport(username, month) {
  if (!window.XLSX) return notify('Excel library loading, try again in a moment');
  var profile = state.profiles && state.profiles[username] ? state.profiles[username] : {};
  var motherName = profile.name || username;
  var familyHouse = profile.house || 'N/A';
  
  var list = (state.expenses || []).filter(function(e) {
    return e.user === username && e.date.indexOf(month) === 0;
  }).sort(function(a, b) { return a.date.localeCompare(b.date); });
  
  if (list.length === 0) return notify('No records found for ' + motherName + ' in ' + month);
  
  var recordsData = [['Date', 'Item ID', 'Item Name', 'Category 1', 'Category 2', 'Quantity', 'Unit Price', 'Total Price']];
  var cat2Totals = {};
  var grandTotal = 0;
  var largestSingle = null;
  
  // For AI insights
  var itemGroups = {};
  var qualityFlags = [];
  var zeroPriceCount = 0;
  
  list.forEach(function(e) {
    var c1 = cat(e.category).name;
    var c2 = subcat(e.subcategory);
    var tPrice = Number(e.total);
    var uPrice = tPrice / (Number(e.quantity) || 1);
    
    recordsData.push([ e.date, e.id.substring(0,8), e.name, c1, c2, e.quantity, uPrice, tPrice ]);
    
    grandTotal += tPrice;
    cat2Totals[c2] = (cat2Totals[c2] || 0) + tPrice;
    
    itemGroups[e.name] = (itemGroups[e.name] || 0) + tPrice;
    
    if (!largestSingle || tPrice > Number(largestSingle.total)) {
      largestSingle = e;
    }
    if (tPrice <= 0) zeroPriceCount++;
  });
  
  if (zeroPriceCount > 0) qualityFlags.push(zeroPriceCount + " entries have 0.00 total price.");
  if (grandTotal === 0) qualityFlags.push("Warning: Grand total is 0.");
  if (qualityFlags.length === 0) qualityFlags.push("Data appears clean. No anomalies detected.");
  
  var ws1 = XLSX.utils.aoa_to_sheet(recordsData);
  ws1['!cols'] = [{wch:12}, {wch:10}, {wch:30}, {wch:15}, {wch:20}, {wch:10}, {wch:12}, {wch:15}];
  
  var largestCat2 = Object.keys(cat2Totals).reduce(function(a, b) { return cat2Totals[a] > cat2Totals[b] ? a : b; }, Object.keys(cat2Totals)[0] || '');
  var largestItem = Object.keys(itemGroups).reduce(function(a, b) { return itemGroups[a] > itemGroups[b] ? a : b; }, Object.keys(itemGroups)[0] || '');
  
  var insightsData = [
    ['REPORT METADATA', ''],
    ['Mother Name', motherName],
    ['Family House', familyHouse],
    ['Report Period', month],
    ['',''],
    ['TOTALS', ''],
    ['Grand Total Expenditure', grandTotal],
    ['',''],
    ['CATEGORY 2 SUMMARY', 'Total Expenditure']
  ];
  
  Object.keys(cat2Totals).forEach(function(k) {
    if (cat2Totals[k] > 0) insightsData.push([k, cat2Totals[k]]);
  });
  
  insightsData.push(['','']);
  insightsData.push(['AI INSIGHTS', '']);
  insightsData.push(['Largest Category 2', largestCat2 + ' (' + money(cat2Totals[largestCat2]) + ' - ' + Math.round((cat2Totals[largestCat2]/grandTotal)*100) + '%)']);
  
  if (largestItem) {
    insightsData.push(['Combined Top Item Total', largestItem + ' (' + money(itemGroups[largestItem]) + ' - ' + Math.round((itemGroups[largestItem]/grandTotal)*100) + '%)']);
  }
  
  if (largestSingle) {
    insightsData.push(['Largest Single Expense', largestSingle.date + ' | ' + largestSingle.name + ' (' + money(largestSingle.total) + ')']);
  }
  
  insightsData.push(['', '']);
  insightsData.push(['DATA QUALITY FLAGS', '']);
  qualityFlags.forEach(function(flag) {
    insightsData.push([flag, '']);
  });
  
  var ws2 = XLSX.utils.aoa_to_sheet(insightsData);
  ws2['!cols'] = [{wch:35}, {wch:35}];
  
  var wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws1, 'Expense Records');
  XLSX.utils.book_append_sheet(wb, ws2, 'Summary & Insights');
  
  XLSX.writeFile(wb, 'Report_' + username + '_' + month + '.xlsx');
}`;

appJs = appJs.replace(regexFunc, newFunc);
fs.writeFileSync('app.js', appJs);
console.log('Fixed excel generator for precise JSON match');

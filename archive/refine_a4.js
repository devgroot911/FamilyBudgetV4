const fs = require('fs');
let appJs = fs.readFileSync('app.js', 'utf8');

// Replace signature rows for Sheet 1
const oldSigs = `  recordsData.push(['___________________', '', '___________________', '', '', '___________________']);
  recordsData.push(['Signature of Mother', '', 'Certified by Accounts Asst', '', '', 'Approved by Village Dir']);
  recordsData.push(['Date: .............', '', 'Date: .............', '', '', 'Date: .............']);`;

const newSigs = `  recordsData.push(['______________', '', '', '______________', '', '', '______________']);
  recordsData.push(['Mother Sign.', '', '', 'Accounts Asst.', '', '', 'Village Dir.']);
  recordsData.push(['Date: ........', '', '', 'Date: ........', '', '', 'Date: ........']);`;

appJs = appJs.replace(oldSigs, newSigs);

// Replace widths for Sheet 1
const oldCols = `ws1['!cols'] = [{wch:10}, {wch:25}, {wch:12}, {wch:15}, {wch:6}, {wch:10}, {wch:12}];`;
const newCols = `ws1['!cols'] = [{wch:11}, {wch:23}, {wch:12}, {wch:12}, {wch:5}, {wch:9}, {wch:10}];`;

appJs = appJs.replace(oldCols, newCols);

fs.writeFileSync('app.js', appJs);
console.log('Optimized A4 print widths');

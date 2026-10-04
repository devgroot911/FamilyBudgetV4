const fs = require('fs');
let appJs = fs.readFileSync('app.js', 'utf8');

// Adjust Sheet 1 Signatures (Move them to Col 0, 2, 4)
const oldSigs1 = `  recordsData.push(['______________', '', '', '______________', '', '', '______________']);
  recordsData.push(['Mother Sign.', '', '', 'Accounts Asst.', '', '', 'Village Dir.']);
  recordsData.push(['Date: ........', '', '', 'Date: ........', '', '', 'Date: ........']);`;

const newSigs1 = `  recordsData.push(['______________', '', '______________', '', '______________', '', '']);
  recordsData.push(['Mother Sign.', '', 'Accounts Asst.', '', 'Village Dir.', '', '']);
  recordsData.push(['Date: ........', '', 'Date: ........', '', 'Date: ........', '', '']);`;

appJs = appJs.replace(oldSigs1, newSigs1);

// Adjust Sheet 2 Signatures (Make lines slightly shorter so they don't overflow the right margin)
const oldSigs2 = `  insightsData.push(['___________________', '___________________', '___________________']);
  insightsData.push(['Signature of Mother', 'Certified by Accounts Asst', 'Approved by Village Dir']);
  insightsData.push(['Date: .............', 'Date: .............', 'Date: .............']);`;

const newSigs2 = `  insightsData.push(['______________', '______________', '______________']);
  insightsData.push(['Mother Sign.', 'Accounts Asst.', 'Village Dir.']);
  insightsData.push(['Date: ........', 'Date: ........', 'Date: ........']);`;

appJs = appJs.replace(oldSigs2, newSigs2);

fs.writeFileSync('app.js', appJs);
console.log('Adjusted signature alignment');

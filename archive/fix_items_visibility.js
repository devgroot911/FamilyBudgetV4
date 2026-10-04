const fs = require('fs');

let appJs = fs.readFileSync('app.js', 'utf8');

// Change: Add 'items' to the manager views unconditionally
appJs = appJs.replace(
  /var views = \['dashboard', 'reports', 'records', 'expenses'\];\s*if \(role\.indexOf\('accountant'\) !== -1\) views\.push\('items'\);/g,
  `var views = ['dashboard', 'reports', 'records', 'expenses', 'items'];`
);

fs.writeFileSync('app.js', appJs);
console.log('Fixed item master visibility for all managers');

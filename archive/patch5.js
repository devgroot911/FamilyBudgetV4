const fs = require('fs');
let c = fs.readFileSync('app.js', 'utf8');
c = c.replace("var views = ['dashboard', 'reports', 'records', 'expenses', 'items', 'profile', 'fb-calculator'];", "var views = ['dashboard', 'reports', 'records', 'expenses', 'allowances', 'items', 'profile', 'fb-calculator'];");
fs.writeFileSync('app.js', c);

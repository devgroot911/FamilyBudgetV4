const fs = require('fs');
let app = fs.readFileSync('app.js', 'utf8');

app = app.replace(
  "var views = ['dashboard', 'reports', 'records', 'expenses', 'allowances', 'items', 'profile', 'fb-calculator'];",
  "var views = ['dashboard', 'reports', 'records', 'expenses', 'allowances', 'items', 'profile', 'fb-calculator', 'help'];"
);

app = app.replace(
  "['dashboard', 'expenses', 'records', 'allowances', 'items', 'reports', 'profile'].forEach(function(v)",
  "['dashboard', 'expenses', 'records', 'allowances', 'items', 'reports', 'profile', 'help'].forEach(function(v)"
);

app = app.replace(
  "users: 'Manage Users', 'fb-calculator': 'Family Budget Calculator' };",
  "users: 'Manage Users', 'fb-calculator': 'Family Budget Calculator', 'help': 'Help & Guides' };"
);

app = app.replace(
  "users: renderUsers, 'fb-calculator': window.renderFbCalculator || function(){} };",
  "users: renderUsers, 'fb-calculator': window.renderFbCalculator || function(){}, 'help': renderHelp };"
);

fs.writeFileSync('app.js', app);

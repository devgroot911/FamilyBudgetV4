const fs = require('fs');

let appJs = fs.readFileSync('app.js', 'utf8');

// Patch 1: isManager views
if (!appJs.includes("'fb-calculator'")) {
  appJs = appJs.replace(
    /var views = \['dashboard', 'reports', 'records', 'expenses', 'items', 'profile'\];/,
    "var views = ['dashboard', 'reports', 'records', 'expenses', 'items', 'profile', 'fb-calculator'];"
  );
  
  appJs = appJs.replace(
    /var titles = \{ dashboard: 'Dashboard', expenses: 'Expense Entry', records: 'Manage Expenses', allowances: 'Allowances', items: 'Item Master', reports: 'Past Records & Reports', profile: 'Profile & Settings', users: 'Manage Users' \};/,
    "var titles = { dashboard: 'Dashboard', expenses: 'Expense Entry', records: 'Manage Expenses', allowances: 'Allowances', items: 'Item Master', reports: 'Past Records & Reports', profile: 'Profile & Settings', users: 'Manage Users', 'fb-calculator': 'Family Budget Calculator' };"
  );
  
  appJs = appJs.replace(
    /var renderers = \{ dashboard: renderDashboard, expenses: renderExpenses, records: renderRecords, allowances: renderAllowances, items: renderItems, reports: renderReports, profile: renderProfile, users: renderUsers \};/,
    "var renderers = { dashboard: renderDashboard, expenses: renderExpenses, records: renderRecords, allowances: renderAllowances, items: renderItems, reports: renderReports, profile: renderProfile, users: renderUsers, 'fb-calculator': window.renderFbCalculator || function(){} };"
  );
}

fs.writeFileSync('app.js', appJs);
console.log('app.js patched for FB Calculator route.');

const fs = require('fs');
let appJs = fs.readFileSync('app.js', 'utf8');

// 1. Update the Users dropdown
appJs = appJs.replace(
  /'<div class="field"><label>Role<\/label><select id="new-user-role"><option value="mother">Mother \(Data Entry\)<\/option><option value="accountant">Accountant \(Reports only\)<\/option><option value="admin">Admin \(Full Access\)<\/option><\/select><\/div>'/g,
  `'<div class="field"><label>Role</label><select id="new-user-role"><option value="mother">Mother (Data Entry)</option><option value="village_director">Village Director</option><option value="accounts_assistant">Accounts Assistant</option><option value="accountant">Accountant</option><option value="national_director">National Director</option><option value="admin">System Admin</option></select></div>'`
);

// 2. Update getVisibleExpenses()
appJs = appJs.replace(
  /var role = \(sessionStorage\.getItem\('role'\) \|\| 'mother'\)\.toLowerCase\(\);\s*if \(role\.indexOf\('admin'\) !== -1 \|\| role\.indexOf\('accountant'\) !== -1\) \{\s*return validExpenses;\s*\}/g,
  `var role = (sessionStorage.getItem('role') || 'mother').toLowerCase();
    var isManager = role.indexOf('admin') !== -1 || role.indexOf('director') !== -1 || role.indexOf('accountant') !== -1 || role.indexOf('assistant') !== -1;
    if (isManager) {
      return validExpenses;
    }`
);

// 3. Update Nav Visibility
appJs = appJs.replace(
  /var role = \(sessionStorage\.getItem\('role'\) \|\| 'mother'\)\.toLowerCase\(\);\s*\/\/ Show\/hide nav by role\s*document\.querySelectorAll\('\.nav-item'\)\.forEach\(function\(btn\) \{ btn\.style\.display = 'none'; \}\);\s*if \(role\.indexOf\('admin'\) !== -1\) \{\s*document\.querySelectorAll\('\.nav-item'\)\.forEach\(function\(btn\) \{ btn\.style\.display = 'flex'; \}\);\s*\} else if \(role\.indexOf\('accountant'\) !== -1\) \{\s*\['dashboard', 'items', 'reports', 'records'\]\.forEach\(function\(v\) \{\s*var el = document\.querySelector\('\[data-view="' \+ v \+ '"\]'\);\s*if \(el\) el\.style\.display = 'flex';\s*\}\);\s*\} else \{/g,
  `var role = (sessionStorage.getItem('role') || 'mother').toLowerCase();
  var isManager = role.indexOf('admin') !== -1 || role.indexOf('director') !== -1 || role.indexOf('accountant') !== -1 || role.indexOf('assistant') !== -1;
  // Show/hide nav by role
  document.querySelectorAll('.nav-item').forEach(function(btn) { btn.style.display = 'none'; });
  if (role.indexOf('admin') !== -1) {
    document.querySelectorAll('.nav-item').forEach(function(btn) { btn.style.display = 'flex'; });
  } else if (isManager) {
    var views = ['dashboard', 'reports', 'records'];
    if (role.indexOf('accountant') !== -1) views.push('items');
    views.forEach(function(v) {
      var el = document.querySelector('[data-view="' + v + '"]');
      if (el) el.style.display = 'flex';
    });
  } else {`
);

fs.writeFileSync('app.js', appJs);
console.log('App JS roles updated');

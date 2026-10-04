const fs = require('fs');

let appJs = fs.readFileSync('app.js', 'utf8');

appJs = appJs.replace(
  /var role = \(sessionStorage\.getItem\('role'\) \|\| 'mother'\)\.toLowerCase\(\);\s*var isManager = role\.indexOf\('admin'\) !== -1 \|\| role\.indexOf\('director'\) !== -1 \|\| role\.indexOf\('accountant'\) !== -1 \|\| role\.indexOf\('assistant'\) !== -1;\s*if \(isManager\) \{\s*return validExpenses;\s*\}/g,
  `var role = (sessionStorage.getItem('role') || 'mother').toLowerCase();
    var isManager = role.indexOf('admin') !== -1 || role.indexOf('director') !== -1 || role.indexOf('accountant') !== -1 || role.indexOf('assistant') !== -1;
    var myName = sessionStorage.getItem('username') || 'mother';
    var myVillage = state.profiles && state.profiles[myName] ? state.profiles[myName].village : null;

    if (isManager) {
      if (role === 'national_director' || role === 'accountant' || role === 'admin' || myVillage === 'All') {
        return validExpenses;
      } else {
        // Filter strictly to current user's village
        return validExpenses.filter(function(e) {
          var expVillage = state.profiles && state.profiles[e.user] ? state.profiles[e.user].village : null;
          return expVillage === myVillage;
        });
      }
    }`
);

fs.writeFileSync('app.js', appJs);
console.log('Village filtering applied to getVisibleExpenses');

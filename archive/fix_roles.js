const fs = require('fs');

let appJs = fs.readFileSync('app.js', 'utf8');

// 1. Patch fetchCloudData to properly store role and avoid default "Mother" usertype for admins
const oldUserFetch = `      .then(function(userRes) {
        if (!userRes.error && userRes.data) {
          window.loadedUsers = userRes.data;
          if (!state.profiles) state.profiles = {};
          userRes.data.forEach(function(u) {
            state.profiles[u.username] = { name: u.name || '', usertype: u.usertype || 'Mother / YCCW', village: u.village || '', house: u.house || '', phone: u.phone || '', email: u.email || '' };
          });
        }
        notify('Cloud sync complete');
        render();
      })`;

const newUserFetch = `      .then(function(userRes) {
        if (!userRes.error && userRes.data) {
          window.loadedUsers = userRes.data;
          if (!state.profiles) state.profiles = {};
          userRes.data.forEach(function(u) {
            var realUserType = u.usertype;
            if (!realUserType) realUserType = (u.role === 'mother') ? 'Mother / YCCW' : u.role;
            state.profiles[u.username] = { name: u.name || '', usertype: realUserType, village: u.village || '', house: u.house || '', phone: u.phone || '', email: u.email || '', role: u.role };
          });
          save(); // Persist corrected profiles
        }
        notify('Cloud sync complete');
        render();
      })`;
appJs = appJs.replace(oldUserFetch, newUserFetch);

// 2. Patch renderRecords filtering to use the strictly corrected role / usertype
const oldRecordsFilter = `    var availableUsers = [];
    Object.keys(state.profiles || {}).forEach(function(u) {
      var p = state.profiles[u];
      var v = p.village || 'Unknown';
      var isMother = !p.usertype || p.usertype.toLowerCase().indexOf('mother') !== -1 || p.usertype.toLowerCase() === 'mother / yccw';
      
      if (isMother && (recordState.village === 'All' || recordState.village === v)) {
        availableUsers.push(u);
      }
    });`;

const newRecordsFilter = `    var availableUsers = [];
    Object.keys(state.profiles || {}).forEach(function(u) {
      var p = state.profiles[u];
      var v = p.village || 'Unknown';
      // Strictly check role if available, otherwise fallback to usertype string
      var isMother = (p.role && p.role.toLowerCase() === 'mother') || (!p.role && p.usertype && p.usertype.toLowerCase().indexOf('mother') !== -1);
      
      if (isMother && (recordState.village === 'All' || recordState.village === v)) {
        availableUsers.push(u);
      }
    });`;
appJs = appJs.replace(oldRecordsFilter, newRecordsFilter);

// 3. Patch renderExpenses dropdown filtering as well
const oldExpensesFilter = `        var options = Object.keys(state.profiles).filter(function(u) {
          if (state.profiles[u].usertype && state.profiles[u].usertype.toLowerCase().indexOf('admin') !== -1) return false;
          if (isNational) return true;
          return state.profiles[u].village === myVillage;
        })`;

const newExpensesFilter = `        var options = Object.keys(state.profiles).filter(function(u) {
          var p = state.profiles[u];
          var isMother = (p.role && p.role.toLowerCase() === 'mother') || (!p.role && p.usertype && p.usertype.toLowerCase().indexOf('mother') !== -1);
          if (!isMother) return false;
          if (isNational) return true;
          return p.village === myVillage;
        })`;
appJs = appJs.replace(oldExpensesFilter, newExpensesFilter);

fs.writeFileSync('app.js', appJs);
console.log('Fixed mother filtering logic across the app.');

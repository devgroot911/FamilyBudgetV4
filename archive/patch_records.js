const fs = require('fs');
let appJs = fs.readFileSync('app.js', 'utf8');

const regex1 = /var availableUsers = \[\];\s*Object\.keys\(state\.profiles \|\| \{\}\)\.forEach\(function\(u\) \{[\s\S]*?availableUsers\.push\(u\);\s*\}\s*\}\);/m;

const newLoop1 = `var availableUsers = [];
    Object.keys(state.profiles || {}).forEach(function(u) {
      var p = state.profiles[u];
      var v = p.village || 'Unknown';
      var isMother = (p.role && p.role.toLowerCase() === 'mother') || (!p.role && p.usertype && p.usertype.toLowerCase().indexOf('mother') !== -1);
      
      if (!isMother) return;
      if (!isNational && v !== myVillage) return;
      
      if (recordState.village === 'All' || recordState.village === v) {
        availableUsers.push(u);
      }
    });`;

appJs = appJs.replace(regex1, newLoop1);

fs.writeFileSync('app.js', appJs);
console.log("Patched renderRecords.");

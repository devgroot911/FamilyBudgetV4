const fs = require('fs');

let appJs = fs.readFileSync('app.js', 'utf8');

const regex2 = /if \(isManager && state\.profiles\) \{[\s\S]*?userSelectHtml = '<div class="field" style="margin-bottom:15px"><label for="expense-user">Assign to Mother<\/label><select id="expense-user">' \+ options \+ '<\/select><\/div>';\s*\}/m;

const newBlock2 = `if (isManager && state.profiles) {
        var myVillage = state.profiles[myName] ? state.profiles[myName].village : null;
        var isNational = (role === 'national_director' || role === 'accountant' || role === 'admin' || myVillage === 'All');
        
        window.expenseVillageFilter = window.expenseVillageFilter || 'All';
        var availableVillagesExp = [];
        Object.keys(state.profiles).forEach(function(u) {
            var v = state.profiles[u].village || 'Unknown';
            if (v && v !== 'All' && availableVillagesExp.indexOf(v) === -1) availableVillagesExp.push(v);
        });
        availableVillagesExp.sort();

        var options = Object.keys(state.profiles).filter(function(u) {
          var p = state.profiles[u];
          var isMother = (p.role && p.role.toLowerCase() === 'mother') || (!p.role && p.usertype && p.usertype.toLowerCase().indexOf('mother') !== -1);
          if (!isMother) return false;
          if (!isNational && p.village !== myVillage) return false;
          if (isNational && window.expenseVillageFilter !== 'All' && p.village !== window.expenseVillageFilter) return false;
          return true;
        }).map(function(u) {
          return '<option value="' + escapeHtml(u) + '">' + escapeHtml(state.profiles[u].name || u) + ' (' + u + ')</option>';
        }).join('');
        
        userSelectHtml = '';
        if (isNational) {
            userSelectHtml += '<div class="field" style="margin-bottom:15px"><label for="expense-village-filter">Filter Mothers by Village</label><select id="expense-village-filter" onchange="window.expenseVillageFilter = this.value; render();"><option value="All">All Villages</option>' + 
            availableVillagesExp.map(function(v) { return '<option value="' + escapeHtml(v) + '"' + (window.expenseVillageFilter === v ? ' selected' : '') + '>' + escapeHtml(v) + '</option>'; }).join('') + 
            '</select></div>';
        }
        userSelectHtml += '<div class="field" style="margin-bottom:15px"><label for="expense-user">Assign to Mother</label><select id="expense-user">' + options + '</select></div>';
      }`;

appJs = appJs.replace(regex2, newBlock2);

fs.writeFileSync('app.js', appJs);
console.log("Patched renderExpenses dropdown.");

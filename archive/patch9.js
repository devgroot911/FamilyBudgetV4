const fs = require('fs');
let c = fs.readFileSync('app.js', 'utf8');

c = c.replace(
\`window.selectedAllowanceHouse = window.selectedAllowanceHouse || 'ALL';

function renderAllowances() {
  var cm = selectedAllowanceMonth;
  var role = (sessionStorage.getItem('role') || '').toLowerCase();
  var isGlobal = (role.indexOf('admin') !== -1 || role.indexOf('accountant') !== -1 || role === 'national_director' || role.indexOf('assistant') !== -1);
  var isMother = role === 'mother';
  var myVillage = sessionStorage.getItem('village') || '';
  
  var houseSelectorHtml = '';
  if (!isMother) {
      var availableHouses = [];
      Object.keys(window.state.profiles || {}).forEach(function(u) {
          var p = window.state.profiles[u];
          var v = p.village || '';
          if (!isGlobal && myVillage && v.toLowerCase() !== myVillage.toLowerCase()) return;
          if (p.house && availableHouses.indexOf(p.house) === -1) availableHouses.push(p.house);
      });
      availableHouses.sort(function(a,b){return parseInt(a)-parseInt(b);});
      
      houseSelectorHtml = '<div class="field"><label for="allowance-house">Select House</label><select id="allowance-house">' +
                          '<option value="ALL"' + (window.selectedAllowanceHouse === 'ALL' ? ' selected' : '') + '>All Houses (Aggregate)</option>' +
                          availableHouses.map(function(h) {
                              return '<option value="' + h + '"' + (window.selectedAllowanceHouse == h ? ' selected' : '') + '>House ' + h + '</option>';
                          }).join('') +
                          '</select></div>';
  }
  
  var targetVillage = isGlobal ? 'ALL' : myVillage;
  var targetHouse = isMother ? sessionStorage.getItem('house') : window.selectedAllowanceHouse;\`,
\`window.selectedAllowanceHouse = window.selectedAllowanceHouse || 'ALL';
window.selectedAllowanceVillage = window.selectedAllowanceVillage || 'ALL';

function renderAllowances() {
  var cm = selectedAllowanceMonth;
  var role = (sessionStorage.getItem('role') || '').toLowerCase();
  var isGlobal = (role.indexOf('admin') !== -1 || role.indexOf('accountant') !== -1 || role === 'national_director' || role.indexOf('assistant') !== -1);
  var isMother = role === 'mother';
  var myVillage = sessionStorage.getItem('village') || '';
  
  var houseSelectorHtml = '';
  var villageSelectorHtml = '';
  
  var activeVill = isGlobal ? window.selectedAllowanceVillage : myVillage;
  
  if (!isMother) {
      var allRows = window.appState && window.appState.fbAllocations ? window.appState.fbAllocations : [];
      
      if (isGlobal) {
          var availableVillages = [];
          allRows.forEach(function(r) {
             if (r.village && availableVillages.indexOf(r.village) === -1) availableVillages.push(r.village);
          });
          availableVillages.sort();
          villageSelectorHtml = '<div class="field"><label for="allowance-village">Select Project (Village)</label><select id="allowance-village">' +
                              '<option value="ALL"' + (window.selectedAllowanceVillage === 'ALL' ? ' selected' : '') + '>All Villages (National Aggregate)</option>' +
                              availableVillages.map(function(v) {
                                  return '<option value="' + v + '"' + (window.selectedAllowanceVillage == v ? ' selected' : '') + '>' + v + '</option>';
                              }).join('') +
                              '</select></div>';
      }
      
      var availableHouses = [];
      allRows.forEach(function(r) {
          if (activeVill !== 'ALL' && activeVill !== '' && r.village !== activeVill) return;
          if (r.house_no && availableHouses.indexOf(r.house_no) === -1) availableHouses.push(r.house_no);
      });
      availableHouses.sort(function(a,b){return parseInt(a)-parseInt(b);});
      
      houseSelectorHtml = '<div class="field"><label for="allowance-house">Select House</label><select id="allowance-house">' +
                          '<option value="ALL"' + (window.selectedAllowanceHouse === 'ALL' ? ' selected' : '') + '>All Houses (Aggregate)</option>' +
                          availableHouses.map(function(h) {
                              return '<option value="' + h + '"' + (window.selectedAllowanceHouse == h ? ' selected' : '') + '>House ' + h + '</option>';
                          }).join('') +
                          '</select></div>';
  }
  
  var targetVillage = activeVill;
  var targetHouse = isMother ? sessionStorage.getItem('house') : window.selectedAllowanceHouse;\`
);

fs.writeFileSync('app.js', c);

const fs = require('fs');
let c = fs.readFileSync('app.js', 'utf8');
let arr = c.split('\n');

let startIdx = arr.findIndex(l => l.startsWith('function renderAllowances() {'));
let endIdx = arr.findIndex((l, i) => i > startIdx && l.startsWith('function renderItems() {'));

if (startIdx !== -1 && endIdx !== -1) {
  let newFunc = `window.selectedAllowanceHouse = window.selectedAllowanceHouse || 'ALL';

function renderAllowances() {
  var cm = selectedAllowanceMonth;
  var role = (sessionStorage.getItem('role') || '').toLowerCase();
  var isGlobal = (role.indexOf('admin') !== -1 || role.indexOf('accountant') !== -1 || role === 'national_director' || role.indexOf('assistant') !== -1);
  var isMother = role === 'mother';
  var myVillage = sessionStorage.getItem('village') || '';
  
  var houseSelectorHtml = '';
  if (!isMother) {
      // Find all houses available to this user
      var availableHouses = [];
      if (window.fbState && window.fbState.historicalCounts) {
          var yr = parseInt(cm.split('-')[0], 10), mo = parseInt(cm.split('-')[1], 10);
          var rows = window.fbState.historicalCounts.filter(function(r) { return r.year === yr && r.month === mo; });
          if (!isGlobal && myVillage) rows = rows.filter(function(r) { return r.village === myVillage; });
          availableHouses = rows.map(function(r) { return r.house_no; }).filter(function(v, i, a) { return a.indexOf(v) === i; }).sort(function(a,b){return a-b;});
      }
      
      houseSelectorHtml = '<div class="field"><label for="allowance-house">Select House</label><select id="allowance-house">' +
                          '<option value="ALL"' + (window.selectedAllowanceHouse === 'ALL' ? ' selected' : '') + '>All Houses (Aggregate)</option>' +
                          availableHouses.map(function(h) {
                              return '<option value="' + h + '"' + (window.selectedAllowanceHouse == h ? ' selected' : '') + '>House ' + h + '</option>';
                          }).join('') +
                          '</select></div>';
  }
  
  var targetVillage = isGlobal ? 'ALL' : myVillage;
  var targetHouse = isMother ? sessionStorage.getItem('house') : window.selectedAllowanceHouse;
  
  var html = '<div class="grid two-col">' +
      '<div class="panel">' +
        '<div class="section-heading"><div><h2>Family Budget Overview</h2><small>Calculated allowances for ' + cm + '</small></div></div>' +
        '<div style="margin-bottom: 20px; display:flex; gap:15px;">' +
          '<div class="field" style="flex:1;"><label for="allowance-month">View Month</label><input id="allowance-month" type="month" value="' + cm + '"></div>' +
          (houseSelectorHtml ? '<div style="flex:1;">' + houseSelectorHtml + '</div>' : '') +
        '</div>' +
        '<div style="background:#f8f9fa; padding:15px; border-radius:8px; margin-bottom:15px;">' +
           '<h4 style="margin-top:0; color:#2c3e50;">Monthly Allocations</h4>';
           
  categories.forEach(function(c) {
      html += '<div style="display:flex; justify-content:space-between; margin-bottom:8px; border-bottom:1px solid #eee; padding-bottom:4px;">' +
              '<span>' + c.name + ' Budget:</span><strong>' + money(allowance(c.id, cm, targetHouse, targetVillage)) + '</strong></div>';
  });
  
  html += '</div>' +
          '<div style="background:#eaf4fc; padding:15px; border-radius:8px;">' +
           '<h4 style="margin-top:0; color:#2980b9;">Official Available Balances</h4>' +
           '<small style="display:block; margin-bottom:10px; color:#7f8c8d;">(Includes carry-over savings & transfers)</small>';
           
  categories.forEach(function(c) {
      html += '<div style="display:flex; justify-content:space-between; margin-bottom:8px; border-bottom:1px solid #bbd6ef; padding-bottom:4px;">' +
              '<span>' + c.name + ' Balance:</span><strong style="color:#27ae60;">' + money(getFbBalance(c.id, cm, targetHouse, targetVillage)) + '</strong></div>';
  });
  
  html += '</div></div>' +
      '<div class="panel">' +
        '<div class="section-heading"><div><h2>Month at a glance</h2><small>Allowance vs actual spending</small></div></div>';
        
  html += categories.map(function(c, i) {
          var budget = allowance(c.id, cm, targetHouse, targetVillage) || 0;
          var v = spent(c.id, cm, targetHouse, targetVillage);
          var pctStr = budget > 0 ? Math.round((v / budget) * 100) + "%" : "0%";
          var pct = budget > 0 ? Math.min((v / budget) * 100, 100) : 0;
          return '<div class="progress-row"><div class="progress-meta"><span>' + c.name + ' Spending</span><span>' + pctStr + '</span></div><div class="progress-track"><div class="progress-fill' + (c.id === 2 ? ' mint' : c.id === 3 ? ' blue' : '') + '" style="width:' + pct + '%"></div></div><p class="muted">' + money(v) + ' spent from ' + money(budget) + ' monthly budget</p></div>';
  }).join('');
  
  html += '</div></div>';

  document.querySelector('#view-allowances').innerHTML = html;

  document.querySelector('#allowance-month').addEventListener('change', function(event) {
    selectedAllowanceMonth = event.target.value || currentMonth();
    renderAllowances();
  });
  
  if (!isMother) {
      document.querySelector('#allowance-house').addEventListener('change', function(event) {
        window.selectedAllowanceHouse = event.target.value;
        renderAllowances();
      });
  }
}
`;
  
  arr.splice(startIdx, endIdx - startIdx, newFunc);
  fs.writeFileSync('app.js', arr.join('\n'));
}

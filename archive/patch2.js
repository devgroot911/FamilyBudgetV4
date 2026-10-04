const fs = require('fs');
let c = fs.readFileSync('app.js', 'utf8');
let arr = c.split('\n');

let startIdx = arr.findIndex(l => l.startsWith('function renderAllowances() {'));
let endIdx = arr.findIndex((l, i) => i > startIdx && l.startsWith('function renderItems() {'));
if (startIdx !== -1 && endIdx !== -1) {
  let newFunc = `function renderAllowances() {
  var cm = selectedAllowanceMonth;
  var role = (sessionStorage.getItem('role') || '').toLowerCase();
  
  var html = '<div class="grid two-col">' +
      '<div class="panel">' +
        '<div class="section-heading"><div><h2>Family Budget Overview</h2><small>Calculated allowances for ' + cm + '</small></div></div>' +
        '<div style="margin-bottom: 20px;">' +
          '<div class="field"><label for="allowance-month">View Month</label><input id="allowance-month" type="month" value="' + cm + '"></div>' +
        '</div>' +
        '<div style="background:#f8f9fa; padding:15px; border-radius:8px; margin-bottom:15px;">' +
           '<h4 style="margin-top:0; color:#2c3e50;">Monthly Allocations</h4>';
           
  categories.forEach(function(c) {
      html += '<div style="display:flex; justify-content:space-between; margin-bottom:8px; border-bottom:1px solid #eee; padding-bottom:4px;">' +
              '<span>' + c.name + ' Budget:</span><strong>' + money(allowance(c.id, cm)) + '</strong></div>';
  });
  
  html += '</div>' +
          '<div style="background:#eaf4fc; padding:15px; border-radius:8px;">' +
           '<h4 style="margin-top:0; color:#2980b9;">Official Available Balances</h4>' +
           '<small style="display:block; margin-bottom:10px; color:#7f8c8d;">(Includes carry-over savings & transfers)</small>';
           
  categories.forEach(function(c) {
      html += '<div style="display:flex; justify-content:space-between; margin-bottom:8px; border-bottom:1px solid #bbd6ef; padding-bottom:4px;">' +
              '<span>' + c.name + ' Balance:</span><strong style="color:#27ae60;">' + money(getFbBalance(c.id, cm)) + '</strong></div>';
  });
  
  html += '</div></div>' +
      '<div class="panel">' +
        '<div class="section-heading"><div><h2>Month at a glance</h2><small>Allowance vs actual spending</small></div></div>';
        
  html += categories.map(function(c, i) {
          var budget = allowance(c.id, cm) || 0;
          var v = spent(c.id, cm);
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
}
`;
  
  arr.splice(startIdx, endIdx - startIdx, newFunc);
  fs.writeFileSync('app.js', arr.join('\n'));
}

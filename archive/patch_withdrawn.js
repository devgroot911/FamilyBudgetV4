const fs = require('fs');
let c = fs.readFileSync('app.js', 'utf8');

c = c.replace(
  "function getFbBalance(categoryId, period, optHouse, optVillage) {",
  \`function getFbWithdrawn(categoryId, period, optHouse, optVillage) {
  if (!window.appState || !window.appState.fbAllocations) return 0;
  var p = period || currentMonth();
  var pts = p.split('-');
  var yr = parseInt(pts[0], 10), mo = parseInt(pts[1], 10);
  
  var role = (sessionStorage.getItem('role') || '').toLowerCase();
  var isGlobal = (role.indexOf('admin') !== -1 || role.indexOf('accountant') !== -1 || role === 'national_director' || role.indexOf('assistant') !== -1);
  var myVillage = optVillage && optVillage !== 'ALL' ? optVillage : (optVillage === 'ALL' ? '' : sessionStorage.getItem('village'));
  var myHouse = optHouse && optHouse !== 'ALL' ? optHouse : (optHouse === 'ALL' ? '' : sessionStorage.getItem('house'));
  
  var validRows = window.appState.fbAllocations.filter(function(r) { return r.year === yr && r.month === mo; });
  if (!isGlobal && myVillage) { validRows = validRows.filter(function(r) { return r.village === myVillage; }); }
  else if (optVillage && optVillage !== 'ALL') { validRows = validRows.filter(function(r) { return r.village === optVillage; }); }
  
  if (!isGlobal && myHouse && role.indexOf('director') === -1) { validRows = validRows.filter(function(r) { return String(r.house_no) === String(myHouse); }); }
  else if (optHouse && optHouse !== 'ALL') { validRows = validRows.filter(function(r) { return String(r.house_no) === String(optHouse); }); }
  
  var sum = 0;
  validRows.forEach(function(r) {
    if (!r.calcs) return;
    if (categoryId === 1) sum += ((r.calcs.first_food_portion || 0) + (r.calcs.second_withdrawal || 0));
    else if (categoryId === 2) sum += (r.calcs.actual_household_w || 0);
    else if (categoryId === 3) sum += (r.calcs.actual_clothing_w || 0);
  });
  return sum;
}

function getFbBalance(categoryId, period, optHouse, optVillage) {\`
);

fs.writeFileSync('app.js', c);

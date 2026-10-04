const fs = require('fs');
let c = fs.readFileSync('app.js', 'utf8');
let arr = c.split('\n');

let startIdx = arr.findIndex(l => l.startsWith('function allowance(categoryId, period) {'));
if (startIdx !== -1) {
  let endIdx = startIdx;
  while(arr[endIdx] !== '}') { endIdx++; }
  
  let newFunc = `function allowance(categoryId, period) {
  var p = period || currentMonth();
  if (!window.fbState || !window.fbState.historicalCounts || !window.calculateHouseBudget) return 0;
  
  var role = (sessionStorage.getItem('role') || '').toLowerCase();
  var isGlobal = (role.indexOf('admin') !== -1 || role.indexOf('accountant') !== -1 || role === 'national_director' || role.indexOf('assistant') !== -1);
  var myVillage = sessionStorage.getItem('village');
  var myHouse = sessionStorage.getItem('house');
  
  var pts = p.split('-');
  var yr = parseInt(pts[0], 10), mo = parseInt(pts[1], 10);
  
  var validRows = window.fbState.historicalCounts.filter(function(r) { return r.year === yr && r.month === mo; });
  
  if (!isGlobal) {
    if (myVillage) validRows = validRows.filter(function(r) { return r.village === myVillage; });
    if (myHouse && role.indexOf('director') === -1) {
       validRows = validRows.filter(function(r) { return String(r.house_no) === String(myHouse); });
    }
  }
  
  var sum = 0;
  validRows.forEach(function(r) {
    var dummyPrev = { food: r.open_food || 0, clothing: r.open_cloth || 0, household: r.open_hh || 0, interest: r.open_int || 0 };
    var mAdj = { food: r.manual_adj_food || 0, clothing: r.manual_adj_cloth || 0, household: r.manual_adj_hh || 0, interest: r.manual_adj_int || 0 };
    if (r.remarks) {
       try {
          var rem = JSON.parse(r.remarks);
          if (rem.manual_adjustments) {
             mAdj.food = rem.manual_adjustments.food || mAdj.food;
             mAdj.clothing = rem.manual_adjustments.cloth || mAdj.clothing;
             mAdj.household = rem.manual_adjustments.hh || mAdj.household;
             mAdj.interest = rem.manual_adjustments.int || mAdj.interest;
          }
       } catch(e) {}
    }
    
    var calcs = calculateHouseBudget(r, window.fbState.rateVariables, dummyPrev, mAdj);
    
    if (categoryId === 1) sum += calcs.total_food;
    else if (categoryId === 2) sum += calcs.total_hh;
    else if (categoryId === 3) sum += calcs.total_clothing;
  });
  
  return sum;
}

function getFbBalance(categoryId, period) {
  var p = period || currentMonth();
  if (!window.fbState || !window.fbState.historicalCounts || !window.calculateHouseBudget) return 0;
  
  var role = (sessionStorage.getItem('role') || '').toLowerCase();
  var isGlobal = (role.indexOf('admin') !== -1 || role.indexOf('accountant') !== -1 || role === 'national_director' || role.indexOf('assistant') !== -1);
  var myVillage = sessionStorage.getItem('village');
  var myHouse = sessionStorage.getItem('house');
  
  var pts = p.split('-');
  var yr = parseInt(pts[0], 10), mo = parseInt(pts[1], 10);
  
  var validRows = window.fbState.historicalCounts.filter(function(r) { return r.year === yr && r.month === mo; });
  
  if (!isGlobal) {
    if (myVillage) validRows = validRows.filter(function(r) { return r.village === myVillage; });
    if (myHouse && role.indexOf('director') === -1) {
       validRows = validRows.filter(function(r) { return String(r.house_no) === String(myHouse); });
    }
  }
  
  var sum = 0;
  validRows.forEach(function(r) {
    var dummyPrev = { food: r.open_food || 0, clothing: r.open_cloth || 0, household: r.open_hh || 0, interest: r.open_int || 0 };
    var mAdj = { food: r.manual_adj_food || 0, clothing: r.manual_adj_cloth || 0, household: r.manual_adj_hh || 0, interest: r.manual_adj_int || 0 };
    if (r.remarks) {
       try {
          var rem = JSON.parse(r.remarks);
          if (rem.manual_adjustments) {
             mAdj.food = rem.manual_adjustments.food || mAdj.food;
             mAdj.clothing = rem.manual_adjustments.cloth || mAdj.clothing;
             mAdj.household = rem.manual_adjustments.hh || mAdj.household;
             mAdj.interest = rem.manual_adjustments.int || mAdj.interest;
          }
       } catch(e) {}
    }
    var calcs = calculateHouseBudget(r, window.fbState.rateVariables, dummyPrev, mAdj);
    
    if (categoryId === 1) sum += calcs.food_balance;
    else if (categoryId === 2) sum += calcs.household_balance;
    else if (categoryId === 3) sum += calcs.clothing_balance;
  });
  
  return sum;
}`;
  
  arr.splice(startIdx, endIdx - startIdx + 1, newFunc);
  fs.writeFileSync('app.js', arr.join('\n'));
}

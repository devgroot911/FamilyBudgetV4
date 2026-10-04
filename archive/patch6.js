const fs = require('fs');
let c = fs.readFileSync('app.js', 'utf8');
let arr = c.split('\n');

// 1. Inject fetchGlobalFbData function near fetchCloudData
let fetchIdx = arr.findIndex(l => l.startsWith('function fetchCloudData() {'));
if (fetchIdx !== -1) {
  let func = `window.appState = window.appState || {};
window.appState.fbAllocations = [];

function fetchGlobalFbData() {
  if (!supabase) return;
  var role = (sessionStorage.getItem('role') || '').toLowerCase();
  var isGlobal = (role.indexOf('admin') !== -1 || role.indexOf('accountant') !== -1 || role === 'national_director' || role.indexOf('assistant') !== -1);
  var myVillage = sessionStorage.getItem('village');
  
  var q = supabase.from('fb_child_counts').select('*');
  if (!isGlobal) {
     if (myVillage) q = q.eq('village', myVillage);
  }
  
  var ratesQ = supabase.from('fb_rate_variables').select('*').eq('village', 'ALL');
  
  Promise.all([q, ratesQ]).then(function(results) {
     var counts = results[0].data || [];
     var rates = results[1].data || [];
     
     counts.forEach(function(r) {
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
        r.calcs = (typeof calculateHouseBudget === 'function') ? calculateHouseBudget(r, rates, dummyPrev, mAdj) : {};
     });
     
     window.appState.fbAllocations = counts;
     render(); // trigger re-render of dashboard/allowances
  }).catch(function(e){ console.error("Global FB Data Error: ", e); });
}
`;
  arr.splice(fetchIdx, 0, func);
}

// 2. Call fetchGlobalFbData() at the end of fetchCloudData()
let notifyCompleteIdx = arr.findIndex(l => l.includes("notify('Cloud sync complete');"));
if (notifyCompleteIdx !== -1) {
  arr.splice(notifyCompleteIdx, 0, "      fetchGlobalFbData();");
}

// 3. Rewrite allowance and getFbBalance to use window.appState.fbAllocations
let allowStart = arr.findIndex(l => l.startsWith('function allowance(categoryId, period, optHouse, optVillage) {'));
let allowEnd = arr.findIndex(l => l.startsWith('function spent(categoryId, period, optHouse, optVillage) {'));

if (allowStart !== -1 && allowEnd !== -1) {
  let newAllowances = `function allowance(categoryId, period, optHouse, optVillage) {
  var p = period || currentMonth();
  var pts = p.split('-');
  var yr = parseInt(pts[0], 10), mo = parseInt(pts[1], 10);
  
  var role = (sessionStorage.getItem('role') || '').toLowerCase();
  var isGlobal = (role.indexOf('admin') !== -1 || role.indexOf('accountant') !== -1 || role === 'national_director' || role.indexOf('assistant') !== -1);
  var myVillage = optVillage && optVillage !== 'ALL' ? optVillage : (optVillage === 'ALL' ? '' : sessionStorage.getItem('village'));
  var myHouse = optHouse && optHouse !== 'ALL' ? optHouse : (optHouse === 'ALL' ? '' : sessionStorage.getItem('house'));
  
  var validRows = (window.appState.fbAllocations || []).filter(function(r) { return r.year === yr && r.month === mo; });
  
  if (!isGlobal && myVillage) {
      validRows = validRows.filter(function(r) { return r.village === myVillage; });
  } else if (optVillage && optVillage !== 'ALL') {
      validRows = validRows.filter(function(r) { return r.village === optVillage; });
  }
  
  if (!isGlobal && myHouse && role.indexOf('director') === -1) {
      validRows = validRows.filter(function(r) { return String(r.house_no) === String(myHouse); });
  } else if (optHouse && optHouse !== 'ALL') {
      validRows = validRows.filter(function(r) { return String(r.house_no) === String(optHouse); });
  }
  
  var sum = 0;
  validRows.forEach(function(r) {
    if (!r.calcs) return;
    if (categoryId === 1) sum += (r.calcs.total_food || 0);
    else if (categoryId === 2) sum += (r.calcs.total_hh || 0);
    else if (categoryId === 3) sum += (r.calcs.total_clothing || 0);
  });
  return sum;
}

function getFbBalance(categoryId, period, optHouse, optVillage) {
  var p = period || currentMonth();
  var pts = p.split('-');
  var yr = parseInt(pts[0], 10), mo = parseInt(pts[1], 10);
  
  var role = (sessionStorage.getItem('role') || '').toLowerCase();
  var isGlobal = (role.indexOf('admin') !== -1 || role.indexOf('accountant') !== -1 || role === 'national_director' || role.indexOf('assistant') !== -1);
  var myVillage = optVillage && optVillage !== 'ALL' ? optVillage : (optVillage === 'ALL' ? '' : sessionStorage.getItem('village'));
  var myHouse = optHouse && optHouse !== 'ALL' ? optHouse : (optHouse === 'ALL' ? '' : sessionStorage.getItem('house'));
  
  var validRows = (window.appState.fbAllocations || []).filter(function(r) { return r.year === yr && r.month === mo; });
  
  if (!isGlobal && myVillage) {
      validRows = validRows.filter(function(r) { return r.village === myVillage; });
  } else if (optVillage && optVillage !== 'ALL') {
      validRows = validRows.filter(function(r) { return r.village === optVillage; });
  }
  
  if (!isGlobal && myHouse && role.indexOf('director') === -1) {
      validRows = validRows.filter(function(r) { return String(r.house_no) === String(myHouse); });
  } else if (optHouse && optHouse !== 'ALL') {
      validRows = validRows.filter(function(r) { return String(r.house_no) === String(optHouse); });
  }
  
  var sum = 0;
  validRows.forEach(function(r) {
    if (!r.calcs) return;
    if (categoryId === 1) sum += (r.calcs.food_balance || 0);
    else if (categoryId === 2) sum += (r.calcs.household_balance || 0);
    else if (categoryId === 3) sum += (r.calcs.clothing_balance || 0);
  });
  return sum;
}
`;
  arr.splice(allowStart, allowEnd - allowStart, newAllowances);
}

fs.writeFileSync('app.js', arr.join('\n'));

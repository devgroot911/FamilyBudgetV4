// FB Calculator Module (Vanilla JS - Strict ES5/ES6 Promise chains, NO async/await, NO ?., NO ??)

var today = new Date();
window.fbState = {
  myVillages: [],
  activeVillage: null, // string (e.g. "Piliyandala")
  activeYear: today.getFullYear(),
  activeMonth: today.getMonth() + 1,
  historicalCounts: [], // All months for rolling balances
  childCounts: [], // Just the active month
  rateVariables: [],
  currentSubView: 'villages',
  loading: false,
  editingHouseNo: null, // string/int
  hasUnsavedChanges: false
};

// Rates matched exactly to SOS Children's Village Piliyandala Excel Sheet
var DEFAULT_RATES = {
  food_o12_rate: 6300,
  food_u12_rate: 4500,
  clothing_o12_rate: 2500,
  clothing_u12_rate: 2100,
  household_rate: 1500,
  mother_food_rate: 6300,
  first_pct: 66.6,
  second_pct: 33.4,
  savings_pct: 5.0000
};

// Clean, standard CSS to match the rest of the application's minimalist design
var style = document.createElement('style');
style.innerHTML = 
  '.fb-modal-overlay { display:none; position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.5); z-index:99999; align-items:center; justify-content:center; padding: 20px; box-sizing: border-box; }' +
  '.fb-modal-content { background:#fff; width:100%; max-width:650px; max-height:90vh; border-radius:8px; display:flex; flex-direction:column; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.15); }' +
  '.fb-modal-header { background:#fafafa; border-bottom:1px solid #eaeaea; padding:15px 20px; font-weight:bold; font-size:16px; color:#333; }' +
  '.fb-modal-body { padding:20px; overflow-y:auto; flex:1; }' +
  '.fb-modal-footer { background:#fafafa; border-top:1px solid #eaeaea; padding:15px 20px; text-align:right; }' +
  '.fb-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }' +
  '.fb-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; }' +
  '.fb-box { background:#fff; border:1px solid #eaeaea; padding:12px; border-radius:6px; }' +
  '.fb-box h4 { margin:0 0 10px 0; font-size:13px; color:#555; text-transform:uppercase; border-bottom:1px solid #f0f0f0; padding-bottom:5px; }' +
  '.fb-label { display:block; font-size:12px; color:#666; font-weight:bold; margin-bottom:5px; }' +
  '.fb-value { font-size:16px; font-weight:bold; color:#222; }' +
  '.fb-highlight { color:#2980b9; }' +
  '.fb-success { color:#27ae60; }' +
  '.fb-danger { color:#c0392b; background:#fadbd8; padding:2px 6px; border-radius:4px; font-size:11px; }' +
  '.fb-table td { padding: 6px 0; font-size: 13px; border-bottom: 1px solid #f5f5f5; }' +
  '.fb-table td:first-child { color: #666; }' +
  '.fb-table td:last-child { text-align: right; font-weight: bold; }';
document.head.appendChild(style);


// ------------------------------------------------------------------
// Core Business Logic (Rolling Balances & New Withdrawal Math)
// ------------------------------------------------------------------
function getPreviousBalances(houseNo, targetYear, targetMonth) {
  var history = window.fbState.historicalCounts.filter(function(c) {
      if (String(c.house_no) !== String(houseNo)) return false;
      if (c.year < targetYear) return true;
      if (c.year === targetYear && c.month < targetMonth) return true;
      return false;
  });
  
  if (history.length === 0) return { food: 0, clothing: 0, household: 0, interest: 0 };
  
  // Sort descending to get the most recent previous record
  history.sort(function(a, b) {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
  });
  
  var last = history[0];
  return {
      food: Number(last.food_balance || 0),
      clothing: Number(last.clothing_balance || 0),
      household: Number(last.household_balance || 0),
      interest: Number(last.interest_balance || 0)
  };
}

function calculateHouseBudget(houseCounts, rates, prevBalances) {
  if (!prevBalances) prevBalances = { food: 0, clothing: 0, household: 0, interest: 0 };
  
  var getRate = function(key) {
    var found = rates.find(function(r) { return r.variable_key === key; });
    return (found && found.value !== undefined && found.value !== null) ? Number(found.value) : DEFAULT_RATES[key];
  };
  
  var child_o12 = Number(houseCounts.food_o12 || 0); 
  var child_u12 = Number(houseCounts.food_u12 || 0);
  var child_total = child_o12 + child_u12;
  
  var actual_clothing_w = Number(houseCounts.clothing_o12 || 0);
  var actual_household_w = Number(houseCounts.clothing_u12 || 0);
  var interest_earned = Number(houseCounts.household || 0);
  var bank_charges = Number(houseCounts.arrears || 0);
  
  var food_o12_amount = getRate('food_o12_rate') * child_o12;
  var food_u12_amount = getRate('food_u12_rate') * child_u12;
  var clothing_o12_amount = getRate('clothing_o12_rate') * child_o12;
  var clothing_u12_amount = getRate('clothing_u12_rate') * child_u12;
  var household_amount = getRate('household_rate') * child_total;
  var mother_amount = getRate('mother_food_rate') * Number(houseCounts.mother_count || 0);
  var aunt_amount = Number(houseCounts.aunt_amount || 0);
  var adjustment = Number(houseCounts.adjustment || 0);
  var festival = Number(houseCounts.festival || 0);
  
  var total_food = food_o12_amount + food_u12_amount + mother_amount + aunt_amount;
  var total_clothing = clothing_o12_amount + clothing_u12_amount;
  var total_hh = household_amount;
  var total_budget = total_food + total_clothing + total_hh + adjustment + festival;
  
  // Withdrawal Logic as strictly requested by User
  var savings = total_food * (getRate('savings_pct') / 100);
  var remaining_food = total_food - savings; 
  
  var first_food_portion = remaining_food * (getRate('first_pct') / 100);
  var second_withdrawal = remaining_food * ((100 - getRate('first_pct')) / 100); 
  
  var first_withdrawal = actual_clothing_w + actual_household_w + first_food_portion;
  
  // Cumulative Rolling Balances (Previous + Current Allocated - Actual Used)
  var food_balance = prevBalances.food + remaining_food - first_food_portion - second_withdrawal;
  var clothing_balance = prevBalances.clothing + total_clothing - actual_clothing_w;
  var household_balance = prevBalances.household + total_hh - actual_household_w;
  var interest_balance = prevBalances.interest + interest_earned - bank_charges;

  return {
    child_total: child_total,
    total_food: total_food,
    total_clothing: total_clothing,
    total_hh: total_hh,
    total_budget: total_budget,
    savings: savings,
    first_withdrawal: first_withdrawal,
    second_withdrawal: second_withdrawal,
    first_food_portion: first_food_portion,
    food_balance: food_balance,
    clothing_balance: clothing_balance,
    household_balance: household_balance,
    interest_balance: interest_balance,
    actual_clothing_w: actual_clothing_w,
    actual_household_w: actual_household_w,
    interest_earned: interest_earned,
    bank_charges: bank_charges,
    prevBalances: prevBalances
  };
}

// ------------------------------------------------------------------
// Permissions & Live Data Extractors
// ------------------------------------------------------------------
function getFbRole() {
  var role = (sessionStorage.getItem('role') || '').toLowerCase();
  if (role.indexOf('admin') !== -1) return 'admin';
  if (role.indexOf('director') !== -1) return 'director';
  if (role.indexOf('national') !== -1) return 'national';
  if (role.indexOf('accountant') !== -1) return 'accountant';
  if (role.indexOf('assistant') !== -1) return 'assistant';
  return 'viewer';
}

function canAccessFb() {
  return getFbRole() !== 'viewer';
}

function getVillageHouses(vName) {
  if (!vName || !window.state || !window.state.profiles) return [];
  var houses = [];
  Object.keys(window.state.profiles).forEach(function(uname) {
    var p = window.state.profiles[uname];
    var isMother = (p.role && p.role.toLowerCase() === 'mother') || (p.usertype && p.usertype.toLowerCase().indexOf('mother') !== -1);
    if (isMother && p.village && p.village.toLowerCase() === vName.toLowerCase() && p.house) {
      if (!houses.find(function(h) { return String(h.house_no) === String(p.house); })) {
        houses.push({ house_no: String(p.house), mother_name: p.name });
      }
    }
  });
  return houses.sort(function(a,b) { return parseInt(a.house_no) - parseInt(b.house_no); });
}

window.fbParseMath = function(val) {
  if (!val) return 0;
  var str = String(val).trim();
  if (str.indexOf('=') === 0) str = str.substring(1);
  str = str.replace(/[^0-9+\-*/().]/g, '');
  if (!str) return 0;
  try { return Function('"use strict";return (' + str + ')')() || 0; }
  catch (e) { return 0; }
};

window.fbExcelInput = function(elem, houseNo, field) {
  var num = window.fbParseMath(elem.value);
  elem.value = num;
  window.fbUpdateLocalCount(houseNo, field, num);
};

window.fbChangePeriod = function() {
  if (window.fbState.hasUnsavedChanges && !confirm("Discard unsaved changes?")) return;
  window.fbState.hasUnsavedChanges = false;
  window.fbState.activeMonth = parseInt(document.getElementById('fb-sel-month').value);
  window.fbState.activeYear = parseInt(document.getElementById('fb-sel-year').value);
  loadVillageData();
};

function loadFbData() {
  window.fbState.loading = true;
  window.fbState.hasUnsavedChanges = false;
  fbRenderSubView();
  
  var myVillage = ((window.state && window.state.profiles) ? window.state.profiles[sessionStorage.getItem('username')] : {}).village || 'All';
  var uniqueVillages = [];
  
  if (window.state && window.state.profiles) {
    Object.keys(window.state.profiles).forEach(function(k) {
      var v = window.state.profiles[k].village;
      if (v && v.toLowerCase() !== 'all' && uniqueVillages.indexOf(v) === -1) uniqueVillages.push(v);
    });
  }
  
  if (myVillage.toLowerCase() === 'all' || ['admin','director','national'].indexOf(getFbRole()) !== -1) {
    window.fbState.myVillages = uniqueVillages;
  } else {
    window.fbState.myVillages = uniqueVillages.filter(function(v) { return v.toLowerCase() === myVillage.toLowerCase(); });
  }
  
  window.fbState.loading = false;
  fbRenderSubView();
}

function loadVillageData() {
  if (!window.fbState.activeVillage) return;
  
  window.fbState.loading = true;
  window.fbState.hasUnsavedChanges = false;
  fbRenderSubView();
  
  // Fetch ALL historical records for this village to compute rolling balances
  Promise.all([
    supabase.from('fb_child_counts').select('*').eq('village', window.fbState.activeVillage),
    supabase.from('fb_rate_variables').select('*').eq('village', window.fbState.activeVillage).eq('year', window.fbState.activeYear).eq('month', window.fbState.activeMonth)
  ]).then(function(results) {
    window.fbState.historicalCounts = results[0].data || [];
    // Filter down for active screen editing
    window.fbState.childCounts = window.fbState.historicalCounts.filter(function(c) {
      return c.year === window.fbState.activeYear && c.month === window.fbState.activeMonth;
    });
    window.fbState.rateVariables = results[1].data || [];
    window.fbState.loading = false;
    fbRenderSubView();
  }).catch(function(err) {
    alert("Database sync error: " + err.message);
    window.fbState.loading = false;
    fbRenderSubView();
  });
}

// ------------------------------------------------------------------
// Base DOM Structure
// ------------------------------------------------------------------
window.renderFbCalculator = function() {
  if (!canAccessFb()) {
    document.querySelector('#view-fb-calculator').innerHTML = '<div class="empty">Access Denied.</div>';
    return;
  }
  
  var m = window.fbState.activeMonth;
  var y = window.fbState.activeYear;
  var monthOptions = [1,2,3,4,5,6,7,8,9,10,11,12].map(function(x) { return '<option value="'+x+'" '+(x===m?'selected':'')+'>Month '+x+'</option>'; }).join('');
  
  document.querySelector('#view-fb-calculator').innerHTML = 
    '<div class="fb-layout">' +
      '<div class="fb-sidebar panel">' +
        '<h3 style="margin-top:0">Budget Allocation</h3>' +
        '<div style="margin-bottom:20px; display:flex; flex-direction:column; gap:8px;">' +
          '<label class="fb-label">Period</label>' +
          '<select id="fb-sel-month" onchange="fbChangePeriod()" class="form-control">' + monthOptions + '</select>' +
          '<select id="fb-sel-year" onchange="fbChangePeriod()" class="form-control">' +
            '<option value="2024" '+(y===2024?'selected':'')+'>2024</option><option value="2025" '+(y===2025?'selected':'')+'>2025</option><option value="2026" '+(y===2026?'selected':'')+'>2026</option>' +
          '</select>' +
        '</div><hr>' +
        '<button class="ghost-button fb-nav-btn" data-subview="villages">Villages</button>' +
        '<button class="ghost-button fb-nav-btn" data-subview="dashboard" id="fb-nav-dashboard" style="display:none">Dashboard</button>' +
        '<button class="ghost-button fb-nav-btn" data-subview="rates" id="fb-nav-rates" style="display:none">Rates</button>' +
        '<button class="ghost-button fb-nav-btn" data-subview="entry" id="fb-nav-entry" style="display:none">Data Entry</button>' +
      '</div>' +
      '<div class="fb-content" id="fb-subview-container"></div>' +
    '</div>' +
    '<div id="fb-modal-overlay" class="fb-modal-overlay">' +
      '<div id="fb-modal-content" class="fb-modal-content"></div>' +
    '</div>';
  
  document.querySelectorAll('.fb-nav-btn').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      if (window.fbState.hasUnsavedChanges && !confirm("Discard unsaved changes?")) return;
      window.fbState.hasUnsavedChanges = false;
      window.fbState.currentSubView = e.target.dataset.subview;
      fbRenderSubView();
    });
  });
  
  loadFbData();
};

function fbRenderSubView() {
  var container = document.querySelector('#fb-subview-container');
  if (!container) return;
  
  document.querySelectorAll('.fb-nav-btn').forEach(function(btn) {
    btn.style.fontWeight = btn.dataset.subview === window.fbState.currentSubView ? 'bold' : 'normal';
    btn.style.background = btn.dataset.subview === window.fbState.currentSubView ? '#f5f5f5' : 'transparent';
  });
  
  var hasProj = !!window.fbState.activeVillage;
  ['dashboard', 'rates', 'entry'].forEach(function(id) {
    var el = document.getElementById('fb-nav-' + id);
    if(el) el.style.display = hasProj ? 'block' : 'none';
  });
  
  if (window.fbState.loading) return container.innerHTML = '<div class="empty">Loading...</div>';
  
  switch(window.fbState.currentSubView) {
    case 'villages': return fbRenderProjects(container);
    case 'dashboard': return fbRenderDashboard(container);
    case 'rates': return fbRenderRates(container);
    case 'entry': return fbRenderEntry(container);
    default: container.innerHTML = '<div class="empty">Select a view</div>';
  }
}

// ------------------------------------------------------------------
// Sub Views
// ------------------------------------------------------------------
function fbRenderProjects(container) {
  var html = '<div class="panel"><div class="section-heading"><div><h2>Villages</h2><small>Select a village</small></div></div>';
  if (window.fbState.myVillages.length === 0) {
    html += '<p>No villages assigned.</p>';
  } else {
    html += '<div class="grid two-col">';
    window.fbState.myVillages.forEach(function(vName) {
      html += '<div class="panel" style="cursor:pointer; border:1px solid #eaeaea;" onclick="fbSelectVillage(\'' + vName + '\')"><h3>' + vName + '</h3></div>';
    });
    html += '</div>';
  }
  container.innerHTML = html + '</div>';
}

window.fbSelectVillage = function(vName) {
  if (window.fbState.hasUnsavedChanges && !confirm("Discard unsaved changes?")) return;
  window.fbState.hasUnsavedChanges = false;
  window.fbState.activeVillage = vName;
  window.fbState.editingHouseNo = null; 
  window.fbState.currentSubView = 'entry';
  loadVillageData();
};

function fbRenderDashboard(container) {
  var vName = window.fbState.activeVillage;
  if (!vName) return;
  var totalBudget = 0, totalFood = 0, totalClothing = 0, totalHH = 0;
  
  var houses = getVillageHouses(vName);
  houses.forEach(function(h) {
    var prev = getPreviousBalances(h.house_no, window.fbState.activeYear, window.fbState.activeMonth);
    var counts = window.fbState.childCounts.find(function(c) { return String(c.house_no) === String(h.house_no); }) || {};
    var calcs = calculateHouseBudget(counts, window.fbState.rateVariables, prev);
    totalBudget += calcs.total_budget;
    totalFood += calcs.total_food;
    totalClothing += calcs.total_clothing;
    totalHH += calcs.total_hh;
  });
  
  container.innerHTML = 
    '<div class="panel">' +
      '<div class="section-heading"><div><h2>Dashboard</h2><small>' + vName + '</small></div></div>' +
      '<div class="fb-grid-4">' +
        '<div class="fb-box"><span class="fb-label">Total Allocated Budget</span><div class="fb-value">LKR ' + totalBudget.toLocaleString() + '</div></div>' +
        '<div class="fb-box"><span class="fb-label">Food Allocated</span><div class="fb-value">LKR ' + totalFood.toLocaleString() + '</div></div>' +
        '<div class="fb-box"><span class="fb-label">Clothing Allocated</span><div class="fb-value">LKR ' + totalClothing.toLocaleString() + '</div></div>' +
        '<div class="fb-box"><span class="fb-label">Household Allocated</span><div class="fb-value">LKR ' + totalHH.toLocaleString() + '</div></div>' +
      '</div>' +
    '</div>';
}

function fbRenderRates(container) {
  var rates = window.fbState.rateVariables;
  var isDirector = getFbRole() === 'director' || getFbRole() === 'admin';
  var html = '<div class="panel"><div class="section-heading"><div><h2>Rates</h2><small>System calculation variables</small></div></div><div class="table-wrap"><table><thead><tr><th>Variable</th><th>Value</th></tr></thead><tbody>';
  
  Object.keys(DEFAULT_RATES).forEach(function(k) {
    var val = (rates.find(function(r) { return r.variable_key === k; }) || {}).value;
    if (val === undefined) val = DEFAULT_RATES[k];
    var disabled = (k.indexOf('_pct') !== -1 && !isDirector) ? 'disabled' : '';
    html += '<tr><td><strong>' + k + '</strong></td><td><input type="number" step="0.0001" value="' + val + '" id="rate_' + k + '" class="form-control" ' + disabled + ' /></td></tr>';
  });
  
  container.innerHTML = html + '</tbody></table></div><div class="button-row"><button class="primary-button" onclick="fbSaveRates()">Save Rates</button></div></div>';
}

window.fbSaveRates = function() {
  var vName = window.fbState.activeVillage;
  var upserts = Object.keys(DEFAULT_RATES).map(function(k) {
    return { village: vName, year: window.fbState.activeYear, month: window.fbState.activeMonth, variable_key: k, value: document.getElementById('rate_' + k).value, updated_by: sessionStorage.getItem('username') };
  });
  supabase.from('fb_rate_variables').upsert(upserts, { onConflict: 'village, year, month, variable_key' }).then(function(res) {
    if (res.error) throw res.error;
    alert('Rates saved.');
    loadVillageData();
  }).catch(function(err) {
    alert('Error saving rates. Have you run the SQL migration? ' + err.message);
  });
};

window.fbEditHouseForm = function(hNo, selectElement) {
  if (!hNo) {
    window.fbState.editingHouseNo = null;
    fbRenderSubView();
    return;
  }
  
  var counts = window.fbState.childCounts.find(function(c) { return String(c.house_no) === String(hNo); });
  if (counts && counts.id) {
    if (!confirm("This house already has a saved record. Do you want to edit it?")) {
      if (selectElement) selectElement.value = window.fbState.editingHouseNo || ''; 
      return;
    }
  }

  if (window.fbState.hasUnsavedChanges && !confirm("Discard unsaved changes?")) {
    if (selectElement) selectElement.value = window.fbState.editingHouseNo || ''; 
    return;
  }
  
  window.fbState.hasUnsavedChanges = false;
  window.fbState.editingHouseNo = String(hNo);
  fbRenderSubView();
};

function fbRenderEntry(container) {
  var vName = window.fbState.activeVillage;
  if (!vName) return;
  var hNo = window.fbState.editingHouseNo || '';
  var activeHouses = getVillageHouses(vName);
  
  var html = 
    '<div class="panel" style="margin-bottom:15px;">' +
      '<div class="grid" style="grid-template-columns: 1fr 1.5fr auto; gap: 15px; align-items:end;">' +
        '<div><label class="fb-label">Village</label><select onchange="fbSelectVillage(this.value)" class="form-control">' +
        '<option value="">-- Select --</option>' + window.fbState.myVillages.map(function(v) { return '<option value="'+v+'" '+(vName===v?'selected':'')+'>'+v+'</option>'; }).join('') +
        '</select></div>' +
        
        '<div><label class="fb-label">House / Mother</label><select onchange="fbEditHouseForm(this.value, this)" class="form-control">' +
        '<option value="">-- Select --</option>';
  
  activeHouses.forEach(function(h) {
     var isSaved = (window.fbState.childCounts.find(function(c) { return String(c.house_no) === String(h.house_no); }) || {}).id;
     html += '<option value="' + h.house_no + '" ' + (hNo === h.house_no ? 'selected' : '') + '>House ' + h.house_no + ' (' + h.mother_name + ')' + (isSaved ? '  ✅ [Saved]' : '') + '</option>';
  });
  
  html += '</select></div><div><button class="ghost-button" onclick="fbDownloadTemplate()">&#11015; Excel Summary</button></div></div>';
  
  if (hNo) {
    var houseData = activeHouses.find(function(h) { return h.house_no === hNo; });
    var prev = getPreviousBalances(hNo, window.fbState.activeYear, window.fbState.activeMonth);
    var counts = window.fbState.childCounts.find(function(c) { return String(c.house_no) === String(hNo); }) || {};
    var calcs = calculateHouseBudget(counts, window.fbState.rateVariables, prev);
    
    html += '<hr style="margin:20px 0; border:0; border-top:1px solid #eee;">' +
      '<div style="display:flex; justify-content:space-between; margin-bottom:15px;">' +
        '<h3 style="margin:0;">Data Entry</h3>' +
        (window.fbState.hasUnsavedChanges ? '<span class="fb-danger">Unsaved Changes</span>' : '') +
      '</div>' +
      
      '<div class="fb-grid-4" style="margin-bottom:15px; background:#f9f9f9; padding:10px; border-radius:4px; font-size:12px;">' +
        '<div><strong>Prev Food Bal:</strong> ' + prev.food.toLocaleString(undefined, {minimumFractionDigits:2}) + '</div>' +
        '<div><strong>Prev Cloth Bal:</strong> ' + prev.clothing.toLocaleString(undefined, {minimumFractionDigits:2}) + '</div>' +
        '<div><strong>Prev HH Bal:</strong> ' + prev.household.toLocaleString(undefined, {minimumFractionDigits:2}) + '</div>' +
        '<div><strong>Prev Int Bal:</strong> ' + prev.interest.toLocaleString(undefined, {minimumFractionDigits:2}) + '</div>' +
      '</div>' +
      
      '<div class="fb-grid-3" style="margin-bottom:15px;">' +
        '<div><label class="fb-label">Children >12</label><input type="number" min="0" class="form-control" value="'+(counts.food_o12||0)+'" onchange="fbUpdateLocalCount(\''+hNo+'\', \'food_o12\', this.value)"></div>' +
        '<div><label class="fb-label">Children <12</label><input type="number" min="0" class="form-control" value="'+(counts.food_u12||0)+'" onchange="fbUpdateLocalCount(\''+hNo+'\', \'food_u12\', this.value)"></div>' +
        '<div><label class="fb-label">Mothers</label><input type="number" min="0" class="form-control" value="'+(counts.mother_count||0)+'" onchange="fbUpdateLocalCount(\''+hNo+'\', \'mother_count\', this.value)"></div>' +
      '</div>' + 
      
      '<div class="fb-grid-3" style="margin-bottom:20px;">' +
        '<div class="fb-box"><h4>Allowances (Math)</h4>' +
          '<label class="fb-label">Aunt Amt</label><input type="text" class="form-control" value="' + (counts.aunt_amount||0) + '" onblur="fbExcelInput(this, \''+hNo+'\', \'aunt_amount\')" style="margin-bottom:8px;">' +
          '<label class="fb-label">Adjustments</label><input type="text" class="form-control" value="' + (counts.adjustment||0) + '" onblur="fbExcelInput(this, \''+hNo+'\', \'adjustment\')"></div>' +
        '<div class="fb-box"><h4>Withdrawals</h4>' +
          '<label class="fb-label">Actual Clothing</label><input type="text" class="form-control" value="' + calcs.actual_clothing_w + '" onblur="fbExcelInput(this, \''+hNo+'\', \'clothing_o12\')" style="margin-bottom:8px;">' +
          '<label class="fb-label">Actual Household</label><input type="text" class="form-control" value="' + calcs.actual_household_w + '" onblur="fbExcelInput(this, \''+hNo+'\', \'clothing_u12\')"></div>' +
        '<div class="fb-box"><h4>Interest & Charges</h4>' +
          '<label class="fb-label">Interest Received</label><input type="text" class="form-control" value="' + calcs.interest_earned + '" onblur="fbExcelInput(this, \''+hNo+'\', \'household\')" style="margin-bottom:8px;">' +
          '<label class="fb-label">Bank Charges</label><input type="text" class="form-control" value="' + calcs.bank_charges + '" onblur="fbExcelInput(this, \''+hNo+'\', \'arrears\')"></div>' +
      '</div>' + 
      
      '<div class="fb-box" style="display:flex; justify-content:space-between; align-items:center; background:#fafafa;">' +
        '<div class="fb-grid-4" style="flex:1; margin-right:20px; gap:20px;">' +
          '<div><span class="fb-label">End Food Bal</span><span class="fb-value '+(calcs.food_balance<0?'fb-danger':'')+'">LKR ' + calcs.food_balance.toLocaleString(undefined, {minimumFractionDigits:2}) + '</span></div>' +
          '<div><span class="fb-label">End Clothing Bal</span><span class="fb-value '+(calcs.clothing_balance<0?'fb-danger':'')+'">LKR ' + calcs.clothing_balance.toLocaleString(undefined, {minimumFractionDigits:2}) + '</span></div>' +
          '<div><span class="fb-label">End HH Bal</span><span class="fb-value '+(calcs.household_balance<0?'fb-danger':'')+'">LKR ' + calcs.household_balance.toLocaleString(undefined, {minimumFractionDigits:2}) + '</span></div>' +
          '<div><span class="fb-label">End Interest Bal</span><span class="fb-value '+(calcs.interest_balance<0?'fb-danger':'fb-success')+'">LKR ' + calcs.interest_balance.toLocaleString(undefined, {minimumFractionDigits:2}) + '</span></div>' +
        '</div>' +
        '<button class="primary-button" onclick="fbReviewAndSave(\''+hNo+'\')">Review & Save</button>' +
      '</div>';
  }
  html += '</div>';
  
  html += '<div class="panel" style="overflow-x:auto;">' +
    '<h3>Balance Overview</h3>' +
    '<table class="data-table" style="min-width:900px; font-size:12px; width:100%; border-collapse:collapse;">' +
      '<thead style="background:#f5f5f5; text-align:left;"><tr>' +
        '<th style="padding:8px">House</th><th style="padding:8px">Mother Snapshot</th><th style="padding:8px">Savings</th>' +
        '<th style="padding:8px">1st W</th><th style="padding:8px">2nd W</th><th style="padding:8px">Food Bal</th><th style="padding:8px">Clothing Bal</th>' +
        '<th style="padding:8px">HH Bal</th><th style="padding:8px">Int Bal</th>' +
      '</tr></thead><tbody>';
      
  activeHouses.forEach(function(h) {
    var prev = getPreviousBalances(h.house_no, window.fbState.activeYear, window.fbState.activeMonth);
    var counts = window.fbState.childCounts.find(function(c) { return String(c.house_no) === String(h.house_no); }) || {};
    var calcs = calculateHouseBudget(counts, window.fbState.rateVariables, prev);
    var isSel = hNo === h.house_no ? 'background:#f0f7f4; font-weight:bold;' : 'border-bottom:1px solid #eee;';
    
    html += 
      '<tr style="'+isSel+' cursor:pointer;" onclick="fbEditHouseForm(\''+h.house_no+'\')">' +
        '<td style="padding:6px 8px;">House ' + h.house_no + '</td>' +
        '<td style="padding:6px 8px;">' + (counts.mother_name || h.mother_name + ' (Unsaved)') + '</td>' +
        '<td style="padding:6px 8px;" class="fb-highlight">' + calcs.savings.toLocaleString(undefined, {minimumFractionDigits:2}) + '</td>' +
        '<td style="padding:6px 8px;">' + calcs.first_withdrawal.toLocaleString(undefined, {minimumFractionDigits:2}) + '</td>' +
        '<td style="padding:6px 8px;">' + calcs.second_withdrawal.toLocaleString(undefined, {minimumFractionDigits:2}) + '</td>' +
        '<td style="padding:6px 8px;">' + calcs.food_balance.toLocaleString(undefined, {minimumFractionDigits:2}) + '</td>' +
        '<td style="padding:6px 8px;">' + calcs.clothing_balance.toLocaleString(undefined, {minimumFractionDigits:2}) + '</td>' +
        '<td style="padding:6px 8px;">' + calcs.household_balance.toLocaleString(undefined, {minimumFractionDigits:2}) + '</td>' +
        '<td style="padding:6px 8px;" class="fb-success">' + calcs.interest_balance.toLocaleString(undefined, {minimumFractionDigits:2}) + '</td>' +
      '</tr>';
  });
  
  container.innerHTML = html + '</tbody></table></div>';
}

window.fbDownloadTemplate = function() {
  if (!window.XLSX) return alert('Excel library missing.');
  var ws_data = [['House No', 'Mother Snapshot', 'Child >12', 'Child <12', 'Aunt Amt', 'Actual Clothing W', 'Actual HH W', 'Interest Earned', 'Bank Charges', 'Start Food Bal', 'Start Cloth Bal', 'Start HH Bal', 'Start Int Bal']];
  var vName = window.fbState.activeVillage;
  var activeHouses = getVillageHouses(vName);
  
  activeHouses.forEach(function(h) {
    var prev = getPreviousBalances(h.house_no, window.fbState.activeYear, window.fbState.activeMonth);
    var counts = window.fbState.childCounts.find(function(c) { return String(c.house_no) === String(h.house_no); }) || {};
    var calcs = calculateHouseBudget(counts, window.fbState.rateVariables, prev);
    ws_data.push([ h.house_no, (counts.mother_name || h.mother_name), counts.food_o12||0, counts.food_u12||0, counts.aunt_amount||0, calcs.actual_clothing_w, calcs.actual_household_w, calcs.interest_earned, calcs.bank_charges, prev.food, prev.clothing, prev.household, prev.interest ]);
  });
  
  var wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(ws_data), "Data");
  XLSX.writeFile(wb, vName + "_Summary.xlsx");
};

window.fbUpdateLocalCount = function(houseNo, field, val) {
  var existing = window.fbState.childCounts.find(function(c) { return String(c.house_no) === String(houseNo); });
  if (!existing) {
    existing = { village: window.fbState.activeVillage, year: window.fbState.activeYear, month: window.fbState.activeMonth, house_no: String(houseNo) };
    window.fbState.childCounts.push(existing);
  }
  existing[field] = Number(val);
  window.fbState.hasUnsavedChanges = true;
  fbRenderSubView();
};

window.fbReviewAndSave = function(houseNo) {
  var existing = window.fbState.childCounts.find(function(c) { return String(c.house_no) === String(houseNo); });
  if (!existing) return alert("No data to save.");
  var prev = getPreviousBalances(houseNo, window.fbState.activeYear, window.fbState.activeMonth);
  var calcs = calculateHouseBudget(existing, window.fbState.rateVariables, prev);
  
  var overdrafts = [];
  if (calcs.clothing_balance < 0) overdrafts.push({ field: 'clothing_balance', label: 'Clothing', amount: Math.abs(calcs.clothing_balance) });
  if (calcs.household_balance < 0) overdrafts.push({ field: 'household_balance', label: 'Household', amount: Math.abs(calcs.household_balance) });
  
  if (overdrafts.length > 0) {
     var html = '<div class="fb-modal-header" style="color:#c0392b;">Insufficient Funds Detected</div>' +
                '<div class="fb-modal-body">' +
                '<p style="margin-top:0;">Your requested actual withdrawals exceed the available monthly allocation and the previous rollover balance.</p>';
                
     overdrafts.forEach(function(od) {
        // Smart Dropdowns: Disable options if covering field doesn't have enough funds!
        var foodLabel = calcs.food_balance < od.amount 
            ? 'Cover from Food (Warning: Insufficient, ' + calcs.food_balance.toLocaleString(undefined, {minimumFractionDigits:2}) + ' avail)' 
            : 'Cover from Food (Avail: ' + calcs.food_balance.toLocaleString(undefined, {minimumFractionDigits:2}) + ')';
            
        var intLabel = calcs.interest_balance < od.amount 
            ? 'Cover from Interest (Warning: Insufficient, ' + calcs.interest_balance.toLocaleString(undefined, {minimumFractionDigits:2}) + ' avail)' 
            : 'Cover from Interest (Avail: ' + calcs.interest_balance.toLocaleString(undefined, {minimumFractionDigits:2}) + ')';
            
        html += '<div class="fb-box" style="margin-bottom:10px;">' +
                '<label class="fb-label">' + od.label + ' Overdraft: LKR ' + od.amount.toLocaleString(undefined, {minimumFractionDigits:2}) + '</label>' +
                '<select id="od_resolve_' + od.field + '" class="form-control">' +
                   '<option value="none">Keep Negative Balance (Carry Forward)</option>' +
                   '<option value="food_balance">' + foodLabel + '</option>' +
                   '<option value="interest_balance">' + intLabel + '</option>' +
                '</select></div>';
     });
     html += '</div><div class="fb-modal-footer">' +
             '<button class="ghost-button" onclick="document.getElementById(\'fb-modal-overlay\').style.display=\'none\'; document.body.style.overflow=\'\';" style="margin-right:15px;">Cancel</button>' +
             '<button class="primary-button" onclick="fbApplyOverdrafts(\''+houseNo+'\')">Apply Transfers & Continue</button>' +
             '</div>';
     
     document.getElementById('fb-modal-content').innerHTML = html;
     document.body.style.overflow = 'hidden';
     document.getElementById('fb-modal-overlay').style.display = 'flex';
  } else {
     fbShowReviewModal(houseNo, []);
  }
};

window.fbApplyOverdrafts = function(houseNo) {
   var existing = window.fbState.childCounts.find(function(c) { return String(c.house_no) === String(houseNo); });
   var prev = getPreviousBalances(houseNo, window.fbState.activeYear, window.fbState.activeMonth);
   var calcs = calculateHouseBudget(existing, window.fbState.rateVariables, prev);
   
   var transfers = [];
   var foodDeduction = 0;
   var intDeduction = 0;
   
   ['clothing_balance', 'household_balance'].forEach(function(f) {
      var sel = document.getElementById('od_resolve_' + f);
      if (sel && sel.value !== 'none') {
         var amt = Math.abs(calcs[f]);
         if (sel.value === 'food_balance') foodDeduction += amt;
         if (sel.value === 'interest_balance') intDeduction += amt;
         transfers.push({ to: f, from: sel.value, amount: amt });
      }
   });
   
   var warnings = [];
   if (foodDeduction > calcs.food_balance) {
      warnings.push("The requested transfers will push the Food Balance into the negative.");
   }
   if (intDeduction > calcs.interest_balance) {
       warnings.push("The requested transfers will push the Interest Balance into the negative.");
   }
   
   if (warnings.length > 0) {
      if (!confirm(warnings.join("\n") + "\n\nDo you want to proceed and carry these negative balances forward?")) {
         return;
      }
   }
   
   fbShowReviewModal(houseNo, transfers);
};

window.fbShowReviewModal = function(houseNo, transfers) {
  var existing = window.fbState.childCounts.find(function(c) { return String(c.house_no) === String(houseNo); });
  var prev = getPreviousBalances(houseNo, window.fbState.activeYear, window.fbState.activeMonth);
  var calcs = calculateHouseBudget(existing, window.fbState.rateVariables, prev);
  var houseData = getVillageHouses(window.fbState.activeVillage).find(function(h) { return h.house_no === houseNo; });
  
  var transferLog = [];
  transfers.forEach(function(t) {
     calcs[t.to] += t.amount; // Resolve negative
     calcs[t.from] -= t.amount; // Deduct from source
     var cleanTo = t.to.replace('_balance', '');
     var cleanFrom = t.from.replace('_balance', '');
     transferLog.push("Transferred LKR " + t.amount + " from " + cleanFrom + " to " + cleanTo);
  });
  
  // Store resolved math on global object to pass to save function
  window.fbState._activeCalcs = calcs;
  window.fbState._activeTransfers = transferLog;
  
  var html = 
    '<div class="fb-modal-header">Review & Save: House ' + houseNo + '</div>' +
    '<div class="fb-modal-body">' +
      '<div class="fb-box" style="margin-bottom:15px; border-left:3px solid #f39c12;"><h4>Permanent Historical Snapshot</h4>' +
        '<p style="font-size:13px; color:#555; margin:0;">Saving this will permanently lock <strong>' + houseData.mother_name + '</strong> as the Mother for this month\'s ledger. This protects historical records even if user profiles change later.</p>' +
      '</div>' +
      
      '<div class="fb-box" style="margin-bottom:15px;"><h4>1. Cumulative Math & Withdrawals</h4>' +
        '<div class="fb-grid-4" style="margin-bottom:10px; font-size:12px; color:#666;">' +
          '<div><span class="fb-label">Prev Food</span>LKR ' + prev.food.toLocaleString(undefined, {minimumFractionDigits:2}) + '</div>' +
          '<div><span class="fb-label">Prev Cloth</span>LKR ' + prev.clothing.toLocaleString(undefined, {minimumFractionDigits:2}) + '</div>' +
          '<div><span class="fb-label">Prev HH</span>LKR ' + prev.household.toLocaleString(undefined, {minimumFractionDigits:2}) + '</div>' +
          '<div><span class="fb-label">Prev Int</span>LKR ' + prev.interest.toLocaleString(undefined, {minimumFractionDigits:2}) + '</div>' +
        '</div><hr>' +
        '<div class="fb-grid-4">' +
          '<div><span class="fb-label">Savings (5%)</span><span class="fb-value fb-highlight">LKR ' + calcs.savings.toLocaleString(undefined, {minimumFractionDigits:2}) + '</span></div>' +
          '<div><span class="fb-label">Food Portion (1st)</span><span class="fb-value">LKR ' + calcs.first_food_portion.toLocaleString(undefined, {minimumFractionDigits:2}) + '</span></div>' +
          '<div><span class="fb-label">Total 1st W</span><span class="fb-value">LKR ' + calcs.first_withdrawal.toLocaleString(undefined, {minimumFractionDigits:2}) + '</span></div>' +
          '<div><span class="fb-label">2nd W</span><span class="fb-value">LKR ' + calcs.second_withdrawal.toLocaleString(undefined, {minimumFractionDigits:2}) + '</span></div>' +
        '</div>' +
      '</div>';
      
      if (transferLog.length > 0) {
        html += '<div class="fb-box" style="margin-bottom:15px; border-left:3px solid #3498db;"><h4>Accountant Transfers Applied</h4><ul style="margin:0; padding-left:20px; font-size:13px; color:#333;">';
        transferLog.forEach(function(l) { html += '<li>' + l + '</li>'; });
        html += '</ul></div>';
      }
      
      html += '<div class="fb-box"><h4>2. Final Month-End Balances</h4>' +
        '<div class="fb-grid-4">' +
          '<div><span class="fb-label">Food</span><span class="fb-value '+(calcs.food_balance<0?'fb-danger':'')+'">LKR ' + calcs.food_balance.toLocaleString(undefined, {minimumFractionDigits:2}) + '</span></div>' +
          '<div><span class="fb-label">Clothing</span><span class="fb-value '+(calcs.clothing_balance<0?'fb-danger':'')+'">LKR ' + calcs.clothing_balance.toLocaleString(undefined, {minimumFractionDigits:2}) + '</span></div>' +
          '<div><span class="fb-label">Household</span><span class="fb-value '+(calcs.household_balance<0?'fb-danger':'')+'">LKR ' + calcs.household_balance.toLocaleString(undefined, {minimumFractionDigits:2}) + '</span></div>' +
          '<div><span class="fb-label">Interest</span><span class="fb-value '+(calcs.interest_balance<0?'fb-danger':'fb-success')+'">LKR ' + calcs.interest_balance.toLocaleString(undefined, {minimumFractionDigits:2}) + '</span></div>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div class="fb-modal-footer">' +
      '<button class="ghost-button" onclick="document.getElementById(\'fb-modal-overlay\').style.display=\'none\'; document.body.style.overflow=\'\';" style="margin-right:15px;">Cancel</button>' +
      '<button class="primary-button" onclick="fbConfirmSaveData(\''+houseNo+'\')">Confirm & Save</button>' +
    '</div>';
    
  document.getElementById('fb-modal-content').innerHTML = html;
  document.body.style.overflow = 'hidden';
  document.getElementById('fb-modal-overlay').style.display = 'flex';
};

window.fbConfirmSaveData = function(houseNo) {
  var existing = window.fbState.childCounts.find(function(c) { return String(c.house_no) === String(houseNo); });
  var houseData = getVillageHouses(window.fbState.activeVillage).find(function(h) { return h.house_no === houseNo; });
  var calcs = window.fbState._activeCalcs;
  var transferLog = window.fbState._activeTransfers;
  
  var payload = Object.assign({}, existing);
  payload.food_balance = calcs.food_balance;
  payload.clothing_balance = calcs.clothing_balance;
  payload.household_balance = calcs.household_balance;
  payload.interest_balance = calcs.interest_balance;
  payload.mother_name = houseData.mother_name;
  
  payload.remarks = JSON.stringify({ savings: calcs.savings, first_w: calcs.first_withdrawal, second_w: calcs.second_withdrawal, mother: houseData.mother_name, transfers: transferLog });
  
  document.getElementById('fb-modal-overlay').style.display = 'none';
  document.body.style.overflow = '';
  
  supabase.from('fb_child_counts').upsert([payload], { onConflict: 'village, year, month, house_no' }).select().single().then(function(res) {
    if (res.error) throw res.error;
    var idx = window.fbState.childCounts.findIndex(function(c) { return String(c.house_no) === String(houseNo); });
    if(idx > -1) window.fbState.childCounts[idx] = res.data; else window.fbState.childCounts.push(res.data);
    
    // Update historical array so rolling balances update instantly without reload
    var hIdx = window.fbState.historicalCounts.findIndex(function(c) { return String(c.house_no) === String(houseNo) && c.year === res.data.year && c.month === res.data.month; });
    if(hIdx > -1) window.fbState.historicalCounts[hIdx] = res.data; else window.fbState.historicalCounts.push(res.data);
    
    alert('Data explicitly saved to database with permanent mother snapshot!');
    window.fbState.hasUnsavedChanges = false;
    fbRenderSubView();
  }).catch(function(e) {
    if (e.message && (e.message.indexOf('schema cache') !== -1 || e.message.indexOf('Could not find') !== -1)) {
       delete payload.food_balance; delete payload.clothing_balance; delete payload.household_balance; delete payload.interest_balance;
       supabase.from('fb_child_counts').upsert([payload], { onConflict: 'village, year, month, house_no' }).select().single().then(function(res2) {
          if (res2.error) return alert('Database Error: ' + res2.error.message);
          
          var idx = window.fbState.childCounts.findIndex(function(c) { return String(c.house_no) === String(houseNo); });
          if(idx > -1) window.fbState.childCounts[idx] = res2.data; else window.fbState.childCounts.push(res2.data);
          
          var hIdx = window.fbState.historicalCounts.findIndex(function(c) { return String(c.house_no) === String(houseNo) && c.year === res2.data.year && c.month === res2.data.month; });
          if(hIdx > -1) window.fbState.historicalCounts[hIdx] = res2.data; else window.fbState.historicalCounts.push(res2.data);
          
          alert('Data saved successfully via JSON fallback!\n\n(The explicit balance columns are missing from Supabase, but your data is safe inside the remarks column. Run the final SQL to add explicit columns later).');
          window.fbState.hasUnsavedChanges = false;
          fbRenderSubView();
       }).catch(function(err2) {
          alert('Database Error! Please ensure you have run the Schema Migration SQL in Supabase. Details: ' + err2.message); 
       });
    } else { 
       alert('Database Error! Please ensure you have run the Schema Migration SQL in Supabase. Details: ' + e.message); 
    }
  });
};

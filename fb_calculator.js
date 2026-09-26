// FB Calculator Module (Vanilla JS - Strict ES5/ES6 Promise chains, NO async/await, NO ?., NO ??)

var today = new Date();
window.fbState = {
  projects: [],
  myProjects: [],
  activeProject: null,
  activeYear: today.getFullYear(),
  activeMonth: today.getMonth() + 1,
  houses: [],
  childCounts: [],
  rateVariables: [],
  monthlySummary: null,
  currentSubView: 'projects',
  loading: false,
  editingHouseId: null,
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
  '.fb-modal-content { background:#fff; width:100%; max-width:600px; max-height:90vh; border-radius:8px; display:flex; flex-direction:column; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.15); }' +
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
// Core Business Logic
// ------------------------------------------------------------------
function calculateHouseBudget(houseCounts, rates) {
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
  
  var savings = total_food * (getRate('savings_pct') / 100);
  var remaining_food = total_food - savings;
  var first_withdrawal = remaining_food * (getRate('first_pct') / 100);
  var second_withdrawal = remaining_food - first_withdrawal; 
  
  var food_balance = remaining_food - first_withdrawal - second_withdrawal;
  var clothing_balance = total_clothing - actual_clothing_w;
  var household_balance = total_hh - actual_household_w;
  var interest_balance = interest_earned - bank_charges;

  return {
    child_total: child_total,
    total_food: total_food,
    total_clothing: total_clothing,
    total_hh: total_hh,
    total_budget: total_budget,
    savings: savings,
    first_withdrawal: first_withdrawal,
    second_withdrawal: second_withdrawal,
    food_balance: food_balance,
    clothing_balance: clothing_balance,
    household_balance: household_balance,
    interest_balance: interest_balance,
    actual_clothing_w: actual_clothing_w,
    actual_household_w: actual_household_w,
    interest_earned: interest_earned,
    bank_charges: bank_charges
  };
}

// ------------------------------------------------------------------
// Permissions & Data Loading
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

function fbGetMotherName(pName, houseNo) {
  var currentMotherName = 'Unassigned';
  if (window.state && window.state.profiles) {
    Object.keys(window.state.profiles).forEach(function(uname) {
      var prof = window.state.profiles[uname];
      if (prof.village && prof.village.toLowerCase() === pName.toLowerCase() && String(prof.house) === String(houseNo)) {
        var isMother = (prof.role && prof.role.toLowerCase() === 'mother') || (prof.usertype && prof.usertype.toLowerCase().indexOf('mother') !== -1);
        if (isMother) currentMotherName = prof.name;
      }
    });
  }
  return currentMotherName;
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

window.fbExcelInput = function(elem, houseId, field) {
  var num = window.fbParseMath(elem.value);
  elem.value = num;
  window.fbUpdateLocalCount(houseId, field, num);
};

window.fbChangePeriod = function() {
  if (window.fbState.hasUnsavedChanges && !confirm("Discard unsaved changes?")) return;
  window.fbState.hasUnsavedChanges = false;
  window.fbState.activeMonth = parseInt(document.getElementById('fb-sel-month').value);
  window.fbState.activeYear = parseInt(document.getElementById('fb-sel-year').value);
  loadProjectData();
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
  
  supabase.from('fb_projects').select('*').then(function(res) {
    if (res.error) throw res.error;
    var existingProjects = res.data || [];
    var missing = uniqueVillages.filter(function(v) { return !existingProjects.find(function(p) { return p.name.toLowerCase() === v.toLowerCase(); }); });
    
    if (missing.length > 0) {
      return supabase.from('fb_projects').insert(missing.map(function(v) { return { name: v }; })).then(function() {
        return supabase.from('fb_projects').select('*');
      });
    }
    return res;
  }).then(function(res) {
    var projects = res.data || [];
    window.fbState.myProjects = (myVillage.toLowerCase() === 'all' || ['admin','director','national'].indexOf(getFbRole()) !== -1) 
      ? projects 
      : projects.filter(function(p) { return p.name.toLowerCase() === myVillage.toLowerCase(); });
      
    window.fbState.loading = false;
    fbRenderSubView();
  }).catch(function(err) {
    alert('Failed to load FB projects: ' + err.message);
    window.fbState.loading = false;
    fbRenderSubView();
  });
}

function loadProjectData() {
  if (!window.fbState.activeProject) return;
  var pid = window.fbState.activeProject.id;
  
  window.fbState.loading = true;
  window.fbState.hasUnsavedChanges = false;
  fbRenderSubView();
  
  Promise.all([
    supabase.from('fb_houses').select('*').eq('project_id', pid),
    supabase.from('fb_child_counts').select('*').eq('project_id', pid).eq('year', window.fbState.activeYear).eq('month', window.fbState.activeMonth),
    supabase.from('fb_rate_variables').select('*').eq('project_id', pid).eq('year', window.fbState.activeYear).eq('month', window.fbState.activeMonth)
  ]).then(function(results) {
    window.fbState.houses = results[0].data || [];
    window.fbState.childCounts = results[1].data || [];
    window.fbState.rateVariables = results[2].data || [];
    
    // Auto-sync missing houses based on live user profiles
    if (window.state && window.state.profiles) {
      var projectName = window.fbState.activeProject.name;
      var neededHouses = [];
      Object.keys(window.state.profiles).forEach(function(uname) {
        var p = window.state.profiles[uname];
        var isMother = (p.role && p.role.toLowerCase() === 'mother') || (p.usertype && p.usertype.toLowerCase().indexOf('mother') !== -1);
        if (isMother && p.village && projectName.toLowerCase().indexOf(p.village.toLowerCase()) !== -1 && p.house) {
          if (neededHouses.indexOf(p.house) === -1) neededHouses.push(p.house);
        }
      });
      
      var missingHouses = neededHouses.filter(function(hNum) { return !window.fbState.houses.find(function(h) { return String(h.house_no) === String(hNum); }); });
      if (missingHouses.length > 0) {
        return supabase.from('fb_houses').insert(missingHouses.map(function(hNum) { return { project_id: pid, house_no: String(hNum) }; })).then(function() {
          return supabase.from('fb_houses').select('*').eq('project_id', pid);
        }).then(function(hRes) {
          window.fbState.houses = hRes.data || [];
          window.fbState.loading = false;
          fbRenderSubView();
        });
      }
    }
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
        '<button class="ghost-button fb-nav-btn" data-subview="projects">Projects</button>' +
        '<button class="ghost-button fb-nav-btn" data-subview="dashboard" id="fb-nav-dashboard" style="display:none">Dashboard</button>' +
        '<button class="ghost-button fb-nav-btn" data-subview="rates" id="fb-nav-rates" style="display:none">Rates</button>' +
        '<button class="ghost-button fb-nav-btn" data-subview="entry" id="fb-nav-entry" style="display:none">Data Entry</button>' +
      '</div>' +
      '<div class="fb-content" id="fb-subview-container"></div>' +
    '</div>' +
    // Unified Modal Structure
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
  
  var hasProj = !!window.fbState.activeProject;
  ['dashboard', 'rates', 'entry'].forEach(function(id) {
    var el = document.getElementById('fb-nav-' + id);
    if(el) el.style.display = hasProj ? 'block' : 'none';
  });
  
  if (window.fbState.loading) return container.innerHTML = '<div class="empty">Loading...</div>';
  
  switch(window.fbState.currentSubView) {
    case 'projects': return fbRenderProjects(container);
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
  var html = '<div class="panel"><div class="section-heading"><div><h2>Projects</h2><small>Select a village</small></div></div>';
  if (window.fbState.myProjects.length === 0) {
    html += '<p>No projects assigned.</p>';
  } else {
    html += '<div class="grid two-col">';
    window.fbState.myProjects.forEach(function(p) {
      html += '<div class="panel" style="cursor:pointer; border:1px solid #eaeaea;" onclick="fbSelectProject(\'' + p.id + '\')"><h3>' + p.name + '</h3></div>';
    });
    html += '</div>';
  }
  container.innerHTML = html + '</div>';
}

window.fbSelectProject = function(id) {
  if (window.fbState.hasUnsavedChanges && !confirm("Discard unsaved changes?")) return;
  window.fbState.hasUnsavedChanges = false;
  window.fbState.activeProject = window.fbState.myProjects.find(function(p) { return p.id === id; });
  window.fbState.editingHouseId = null; 
  window.fbState.currentSubView = 'entry';
  loadProjectData();
};

function fbRenderDashboard(container) {
  var p = window.fbState.activeProject;
  if (!p) return;
  var totalBudget = 0, totalFood = 0, totalClothing = 0, totalHH = 0;
  window.fbState.houses.forEach(function(h) {
    var calcs = calculateHouseBudget(window.fbState.childCounts.find(function(c) { return c.house_id === h.id; }) || {}, window.fbState.rateVariables);
    totalBudget += calcs.total_budget;
    totalFood += calcs.total_food;
    totalClothing += calcs.total_clothing;
    totalHH += calcs.total_hh;
  });
  container.innerHTML = 
    '<div class="panel">' +
      '<div class="section-heading"><div><h2>Dashboard</h2><small>' + p.name + '</small></div></div>' +
      '<div class="fb-grid-4">' +
        '<div class="fb-box"><span class="fb-label">Total Budget</span><div class="fb-value">LKR ' + totalBudget.toLocaleString() + '</div></div>' +
        '<div class="fb-box"><span class="fb-label">Total Food</span><div class="fb-value">LKR ' + totalFood.toLocaleString() + '</div></div>' +
        '<div class="fb-box"><span class="fb-label">Total Clothing</span><div class="fb-value">LKR ' + totalClothing.toLocaleString() + '</div></div>' +
        '<div class="fb-box"><span class="fb-label">Total Household</span><div class="fb-value">LKR ' + totalHH.toLocaleString() + '</div></div>' +
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
  var pid = window.fbState.activeProject.id;
  var upserts = Object.keys(DEFAULT_RATES).map(function(k) {
    return { project_id: pid, year: window.fbState.activeYear, month: window.fbState.activeMonth, variable_key: k, value: document.getElementById('rate_' + k).value, updated_by: sessionStorage.getItem('username') };
  });
  supabase.from('fb_rate_variables').upsert(upserts, { onConflict: 'project_id, year, month, variable_key' }).then(function(res) {
    if (res.error) throw res.error;
    alert('Rates saved.');
    loadProjectData();
  });
};

window.fbEditHouseForm = function(hId, selectElement) {
  if (!hId) {
    window.fbState.editingHouseId = null;
    fbRenderSubView();
    return;
  }
  
  var counts = window.fbState.childCounts.find(function(c) { return c.house_id === hId; });
  if (counts && counts.id) {
    if (!confirm("This house already has a saved record. Do you want to edit it?")) {
      if (selectElement) selectElement.value = window.fbState.editingHouseId || ''; 
      return;
    }
  }

  if (window.fbState.hasUnsavedChanges && !confirm("Discard unsaved changes?")) {
    if (selectElement) selectElement.value = window.fbState.editingHouseId || ''; 
    return;
  }
  
  window.fbState.hasUnsavedChanges = false;
  window.fbState.editingHouseId = hId;
  fbRenderSubView();
};

function fbRenderEntry(container) {
  var p = window.fbState.activeProject;
  if (!p) return;
  var hId = window.fbState.editingHouseId || '';
  
  // Clean, standardized UI styling
  var html = 
    '<div class="panel" style="margin-bottom:15px;">' +
      '<div class="grid" style="grid-template-columns: 1fr 1.5fr auto; gap: 15px; align-items:end;">' +
        '<div><label class="fb-label">Project</label><select onchange="fbSelectProject(this.value)" class="form-control">' +
        '<option value="">-- Select --</option>' + window.fbState.myProjects.map(function(proj) { return '<option value="'+proj.id+'" '+(p.id===proj.id?'selected':'')+'>'+proj.name+'</option>'; }).join('') +
        '</select></div>' +
        
        '<div><label class="fb-label">House / Mother</label><select onchange="fbEditHouseForm(this.value, this)" class="form-control">' +
        '<option value="">-- Select --</option>';
  
  var validHouses = window.fbState.houses.filter(function(h) { return fbGetMotherName(p.name, h.house_no) !== 'Unassigned'; }).sort(function(a,b) { return parseInt(a.house_no) - parseInt(b.house_no); });
  validHouses.forEach(function(h) {
     var isSaved = (window.fbState.childCounts.find(function(c) { return c.house_id === h.id; }) || {}).id;
     html += '<option value="' + h.id + '" ' + (hId === h.id ? 'selected' : '') + '>House ' + h.house_no + ' (' + fbGetMotherName(p.name, h.house_no) + ')' + (isSaved ? '  ✅ [Saved]' : '') + '</option>';
  });
  
  html += '</select></div><div><button class="ghost-button" onclick="fbDownloadTemplate()">&#11015; Excel Summary</button></div></div>';
  
  if (hId) {
    var house = window.fbState.houses.find(function(h) { return h.id === hId; });
    var counts = window.fbState.childCounts.find(function(c) { return c.house_id === hId; }) || {};
    var calcs = calculateHouseBudget(counts, window.fbState.rateVariables);
    
    html += '<hr style="margin:20px 0; border:0; border-top:1px solid #eee;">' +
      '<div style="display:flex; justify-content:space-between; margin-bottom:15px;">' +
        '<h3 style="margin:0;">Data Entry</h3>' +
        (window.fbState.hasUnsavedChanges ? '<span class="fb-danger">Unsaved Changes</span>' : '') +
      '</div>' +
      
      '<div class="fb-grid-3" style="margin-bottom:15px;">' +
        '<div><label class="fb-label">Children >12</label><input type="number" min="0" class="form-control" value="'+(counts.food_o12||0)+'" onchange="fbUpdateLocalCount(\''+hId+'\', \'food_o12\', this.value)"></div>' +
        '<div><label class="fb-label">Children <12</label><input type="number" min="0" class="form-control" value="'+(counts.food_u12||0)+'" onchange="fbUpdateLocalCount(\''+hId+'\', \'food_u12\', this.value)"></div>' +
        '<div><label class="fb-label">Mothers</label><input type="number" min="0" class="form-control" value="'+(counts.mother_count||0)+'" onchange="fbUpdateLocalCount(\''+hId+'\', \'mother_count\', this.value)"></div>' +
      '</div>' + 
      
      '<div class="fb-grid-3" style="margin-bottom:20px;">' +
        '<div class="fb-box"><h4>Allowances (Math)</h4>' +
          '<label class="fb-label">Aunt Amt</label><input type="text" class="form-control" value="' + (counts.aunt_amount||0) + '" onblur="fbExcelInput(this, \''+hId+'\', \'aunt_amount\')" style="margin-bottom:8px;">' +
          '<label class="fb-label">Adjustments</label><input type="text" class="form-control" value="' + (counts.adjustment||0) + '" onblur="fbExcelInput(this, \''+hId+'\', \'adjustment\')"></div>' +
        '<div class="fb-box"><h4>Withdrawals</h4>' +
          '<label class="fb-label">Actual Clothing</label><input type="text" class="form-control" value="' + calcs.actual_clothing_w + '" onblur="fbExcelInput(this, \''+hId+'\', \'clothing_o12\')" style="margin-bottom:8px;">' +
          '<label class="fb-label">Actual Household</label><input type="text" class="form-control" value="' + calcs.actual_household_w + '" onblur="fbExcelInput(this, \''+hId+'\', \'clothing_u12\')"></div>' +
        '<div class="fb-box"><h4>Interest & Charges</h4>' +
          '<label class="fb-label">Interest Received</label><input type="text" class="form-control" value="' + calcs.interest_earned + '" onblur="fbExcelInput(this, \''+hId+'\', \'household\')" style="margin-bottom:8px;">' +
          '<label class="fb-label">Bank Charges</label><input type="text" class="form-control" value="' + calcs.bank_charges + '" onblur="fbExcelInput(this, \''+hId+'\', \'arrears\')"></div>' +
      '</div>' + 
      
      '<div class="fb-box" style="display:flex; justify-content:space-between; align-items:center; background:#fafafa;">' +
        '<div class="fb-grid-4" style="flex:1; margin-right:20px; gap:20px;">' +
          '<div><span class="fb-label">Food Bal</span><span class="fb-value">LKR ' + calcs.food_balance.toLocaleString(undefined, {minimumFractionDigits:2}) + '</span></div>' +
          '<div><span class="fb-label">Clothing Bal</span><span class="fb-value">LKR ' + calcs.clothing_balance.toLocaleString(undefined, {minimumFractionDigits:2}) + '</span></div>' +
          '<div><span class="fb-label">HH Bal</span><span class="fb-value">LKR ' + calcs.household_balance.toLocaleString(undefined, {minimumFractionDigits:2}) + '</span></div>' +
          '<div><span class="fb-label">Interest Bal</span><span class="fb-value fb-success">LKR ' + calcs.interest_balance.toLocaleString(undefined, {minimumFractionDigits:2}) + '</span></div>' +
        '</div>' +
        '<button class="primary-button" onclick="fbReviewAndSave(\''+hId+'\')">Review & Save</button>' +
      '</div>';
  }
  html += '</div>';
  
  html += '<div class="panel" style="overflow-x:auto;">' +
    '<h3>Balance Overview</h3>' +
    '<table class="data-table" style="min-width:900px; font-size:12px; width:100%; border-collapse:collapse;">' +
      '<thead style="background:#f5f5f5; text-align:left;"><tr>' +
        '<th style="padding:8px">House</th><th style="padding:8px">Mother</th><th style="padding:8px">Savings</th>' +
        '<th style="padding:8px">1st W</th><th style="padding:8px">2nd W</th><th style="padding:8px">Clothing Bal</th>' +
        '<th style="padding:8px">HH Bal</th><th style="padding:8px">Interest Bal</th>' +
      '</tr></thead><tbody>';
      
  validHouses.forEach(function(h) {
    var counts = window.fbState.childCounts.find(function(c) { return c.house_id === h.id; }) || {};
    var calcs = calculateHouseBudget(counts, window.fbState.rateVariables);
    var isSel = hId === h.id ? 'background:#f0f7f4; font-weight:bold;' : 'border-bottom:1px solid #eee;';
    
    html += 
      '<tr style="'+isSel+' cursor:pointer;" onclick="fbEditHouseForm(\''+h.id+'\')">' +
        '<td style="padding:6px 8px;">House ' + h.house_no + '</td>' +
        '<td style="padding:6px 8px;">' + fbGetMotherName(p.name, h.house_no) + '</td>' +
        '<td style="padding:6px 8px;" class="fb-highlight">' + calcs.savings.toLocaleString(undefined, {minimumFractionDigits:2}) + '</td>' +
        '<td style="padding:6px 8px;">' + calcs.first_withdrawal.toLocaleString(undefined, {minimumFractionDigits:2}) + '</td>' +
        '<td style="padding:6px 8px;">' + calcs.second_withdrawal.toLocaleString(undefined, {minimumFractionDigits:2}) + '</td>' +
        '<td style="padding:6px 8px;">' + calcs.clothing_balance.toLocaleString(undefined, {minimumFractionDigits:2}) + '</td>' +
        '<td style="padding:6px 8px;">' + calcs.household_balance.toLocaleString(undefined, {minimumFractionDigits:2}) + '</td>' +
        '<td style="padding:6px 8px;" class="fb-success">' + calcs.interest_balance.toLocaleString(undefined, {minimumFractionDigits:2}) + '</td>' +
      '</tr>';
  });
  
  container.innerHTML = html + '</tbody></table></div>';
}

window.fbDownloadTemplate = function() {
  if (!window.XLSX) return alert('Excel library missing.');
  var ws_data = [['House No', 'Mother', 'Child >12', 'Child <12', 'Aunt Amt', 'Actual Clothing W', 'Actual HH W', 'Interest Earned', 'Bank Charges']];
  var pName = window.fbState.activeProject.name;
  
  var validHouses = window.fbState.houses.filter(function(h) { return fbGetMotherName(pName, h.house_no) !== 'Unassigned'; }).sort(function(a,b) { return parseInt(a.house_no) - parseInt(b.house_no); });
  validHouses.forEach(function(h) {
    var counts = window.fbState.childCounts.find(function(c) { return c.house_id === h.id; }) || {};
    var calcs = calculateHouseBudget(counts, window.fbState.rateVariables);
    ws_data.push([ h.house_no, fbGetMotherName(pName, h.house_no), counts.food_o12||0, counts.food_u12||0, counts.aunt_amount||0, calcs.actual_clothing_w, calcs.actual_household_w, calcs.interest_earned, calcs.bank_charges ]);
  });
  
  var wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(ws_data), "Data");
  XLSX.writeFile(wb, pName + "_Summary.xlsx");
};

window.fbUpdateLocalCount = function(houseId, field, val) {
  var existing = window.fbState.childCounts.find(function(c) { return c.house_id === houseId; });
  if (!existing) {
    existing = { project_id: window.fbState.activeProject.id, year: window.fbState.activeYear, month: window.fbState.activeMonth, house_id: houseId };
    window.fbState.childCounts.push(existing);
  }
  existing[field] = Number(val);
  window.fbState.hasUnsavedChanges = true;
  fbRenderSubView();
};

window.fbReviewAndSave = function(houseId) {
  var existing = window.fbState.childCounts.find(function(c) { return c.house_id === houseId; });
  if (!existing) return alert("No data to save.");
  var calcs = calculateHouseBudget(existing, window.fbState.rateVariables);
  var house = window.fbState.houses.find(function(h) { return h.id === houseId; });
  
  var html = 
    '<div class="fb-modal-header">Review & Save: House ' + house.house_no + '</div>' +
    '<div class="fb-modal-body">' +
      '<div class="fb-box" style="margin-bottom:15px;"><h4>1. Inputs Summary</h4>' +
        '<table class="fb-table" style="width:100%">' +
          '<tr><td>Children Over 12:</td><td>' + (existing.food_o12||0) + '</td></tr>' +
          '<tr><td>Children Under 12:</td><td>' + (existing.food_u12||0) + '</td></tr>' +
          '<tr><td>Mothers:</td><td>' + (existing.mother_count||0) + '</td></tr>' +
          '<tr><td>Allowances / Adjustments:</td><td>LKR ' + (existing.aunt_amount||0).toLocaleString() + ' / LKR ' + (existing.adjustment||0).toLocaleString() + '</td></tr>' +
          '<tr><td>Clothing / HH Withdrawals:</td><td>LKR ' + calcs.actual_clothing_w.toLocaleString() + ' / LKR ' + calcs.actual_household_w.toLocaleString() + '</td></tr>' +
          '<tr><td style="border-bottom:none;">Interest / Bank Charges:</td><td style="border-bottom:none;">LKR ' + calcs.interest_earned.toLocaleString() + ' / LKR ' + calcs.bank_charges.toLocaleString() + '</td></tr>' +
        '</table>' +
      '</div>' +
      
      '<div class="fb-box" style="margin-bottom:15px;"><h4>2. Math & Withdrawals</h4>' +
        '<div class="fb-grid-4">' +
          '<div><span class="fb-label">Budget</span><span class="fb-value">LKR ' + calcs.total_budget.toLocaleString(undefined, {minimumFractionDigits:2}) + '</span></div>' +
          '<div><span class="fb-label">Savings (5%)</span><span class="fb-value fb-highlight">LKR ' + calcs.savings.toLocaleString(undefined, {minimumFractionDigits:2}) + '</span></div>' +
          '<div><span class="fb-label">1st W</span><span class="fb-value">LKR ' + calcs.first_withdrawal.toLocaleString(undefined, {minimumFractionDigits:2}) + '</span></div>' +
          '<div><span class="fb-label">2nd W</span><span class="fb-value">LKR ' + calcs.second_withdrawal.toLocaleString(undefined, {minimumFractionDigits:2}) + '</span></div>' +
        '</div>' +
      '</div>' +
      
      '<div class="fb-box"><h4>3. Final Balances</h4>' +
        '<div class="fb-grid-4">' +
          '<div><span class="fb-label">Food</span><span class="fb-value">LKR ' + calcs.food_balance.toLocaleString(undefined, {minimumFractionDigits:2}) + '</span></div>' +
          '<div><span class="fb-label">Clothing</span><span class="fb-value">LKR ' + calcs.clothing_balance.toLocaleString(undefined, {minimumFractionDigits:2}) + '</span></div>' +
          '<div><span class="fb-label">Household</span><span class="fb-value">LKR ' + calcs.household_balance.toLocaleString(undefined, {minimumFractionDigits:2}) + '</span></div>' +
          '<div><span class="fb-label">Interest</span><span class="fb-value fb-success">LKR ' + calcs.interest_balance.toLocaleString(undefined, {minimumFractionDigits:2}) + '</span></div>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div class="fb-modal-footer">' +
      '<button class="ghost-button" onclick="document.getElementById(\'fb-modal-overlay\').style.display=\'none\'; document.body.style.overflow=\'\';" style="margin-right:15px;">Cancel</button>' +
      '<button class="primary-button" onclick="fbConfirmSaveData(\''+houseId+'\')">Confirm & Save</button>' +
    '</div>';
    
  document.getElementById('fb-modal-content').innerHTML = html;
  document.body.style.overflow = 'hidden';
  document.getElementById('fb-modal-overlay').style.display = 'flex';
};

window.fbConfirmSaveData = function(houseId) {
  var existing = window.fbState.childCounts.find(function(c) { return c.house_id === houseId; });
  var calcs = calculateHouseBudget(existing, window.fbState.rateVariables);
  
  var payload = Object.assign({}, existing);
  payload.food_balance = calcs.food_balance;
  payload.clothing_balance = calcs.clothing_balance;
  payload.household_balance = calcs.household_balance;
  payload.interest_balance = calcs.interest_balance;
  payload.remarks = JSON.stringify({ savings: calcs.savings, first_w: calcs.first_withdrawal, second_w: calcs.second_withdrawal });
  
  document.getElementById('fb-modal-overlay').style.display = 'none';
  document.body.style.overflow = '';
  
  supabase.from('fb_child_counts').upsert([payload], { onConflict: 'project_id, year, month, house_id' }).select().single().then(function(res) {
    if (res.error) throw res.error;
    var idx = window.fbState.childCounts.findIndex(function(c) { return c.house_id === houseId; });
    if(idx > -1) window.fbState.childCounts[idx] = res.data; else window.fbState.childCounts.push(res.data);
    alert('Data saved explicitly to database!');
    window.fbState.hasUnsavedChanges = false;
    fbRenderSubView();
  }).catch(function(e) {
    if (e.message && (e.message.indexOf('schema cache') !== -1 || e.message.indexOf('Could not find') !== -1)) {
       delete payload.food_balance; delete payload.clothing_balance; delete payload.household_balance; delete payload.interest_balance;
       supabase.from('fb_child_counts').upsert([payload], { onConflict: 'project_id, year, month, house_id' }).select().single().then(function(res2) {
          if (res2.error) return alert('Fallback save failed: ' + res2.error.message);
          var idx = window.fbState.childCounts.findIndex(function(c) { return c.house_id === houseId; });
          if(idx > -1) window.fbState.childCounts[idx] = res2.data; else window.fbState.childCounts.push(res2.data);
          alert('Data saved via JSON fallback (Balance columns missing or schema cache needs reload).');
          window.fbState.hasUnsavedChanges = false;
          fbRenderSubView();
       });
    } else { alert('Error: ' + e.message); }
  });
};

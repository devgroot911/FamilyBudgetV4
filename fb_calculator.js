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

// Inject custom CSS for our beautiful UI Modal
var style = document.createElement('style');
style.innerHTML = 
  '@keyframes fbFadeIn { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }' +
  '.fb-modal-header { background: #34495e; color: #fff; padding: 20px; font-size: 20px; font-weight: bold; border-radius: 12px 12px 0 0; }' +
  '.fb-modal-body { padding: 25px; max-height: 70vh; overflow-y: auto; background: #fff; }' +
  '.fb-modal-footer { padding: 15px 25px; background: #f8f9fa; text-align: right; border-top: 1px solid #ecf0f1; border-radius: 0 0 12px 12px; }' +
  '.fb-summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px; }' +
  '.fb-summary-box { background: #f4f6f7; padding: 15px; border-radius: 8px; border: 1px solid #d5dbdb; }' +
  '.fb-summary-box span { display: block; color: #7f8c8d; font-size: 11px; text-transform: uppercase; font-weight: bold; margin-bottom: 5px; }' +
  '.fb-summary-box strong { font-size: 18px; color: #2c3e50; }';
document.head.appendChild(style);

function calculateHouseBudget(houseCounts, rates) {
  var getRate = function(key) {
    var found = rates.find(function(r) { return r.variable_key === key; });
    if (found && found.value !== undefined && found.value !== null) {
      return Number(found.value);
    }
    return DEFAULT_RATES[key];
  };
  
  var child_o12 = houseCounts.food_o12 || 0; 
  var child_u12 = houseCounts.food_u12 || 0;
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
  var mother_amount = getRate('mother_food_rate') * (houseCounts.mother_count || 0);
  var aunt_amount = Number(houseCounts.aunt_amount || 0);
  var adjustment = Number(houseCounts.adjustment || 0);
  var festival = Number(houseCounts.festival || 0);
  var adjustments = festival + adjustment;
  
  var total_food = food_o12_amount + food_u12_amount + mother_amount + aunt_amount;
  var total_clothing = clothing_o12_amount + clothing_u12_amount;
  var total_hh = household_amount;
  var total_budget = total_food + total_clothing + total_hh + adjustments;
  
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
  var r = getFbRole();
  return r === 'admin' || r === 'director' || r === 'national' || r === 'accountant' || r === 'assistant';
}

window.fbChangePeriod = function() {
  if (window.fbState.hasUnsavedChanges) {
    if (!confirm("You have unsaved changes. Are you sure you want to change the period and discard them?")) return;
  }
  window.fbState.hasUnsavedChanges = false;
  window.fbState.activeMonth = parseInt(document.getElementById('fb-sel-month').value);
  window.fbState.activeYear = parseInt(document.getElementById('fb-sel-year').value);
  loadProjectData();
};

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

function loadFbData() {
  window.fbState.loading = true;
  window.fbState.hasUnsavedChanges = false;
  fbRenderSubView();
  
  var role = getFbRole();
  var username = sessionStorage.getItem('username');
  var myProfile = (window.state && window.state.profiles) ? window.state.profiles[username] : null;
  var myVillage = myProfile ? myProfile.village : 'All';
  
  var uniqueVillages = [];
  if (window.state && window.state.profiles) {
    Object.keys(window.state.profiles).forEach(function(k) {
      var v = window.state.profiles[k].village;
      if (v && v.toLowerCase() !== 'all' && uniqueVillages.indexOf(v) === -1) {
        uniqueVillages.push(v);
      }
    });
  }
  
  supabase.from('fb_projects').select('*').then(function(res) {
    if (res.error) throw res.error;
    var existingProjects = res.data || [];
    var missing = uniqueVillages.filter(function(v) {
      return !existingProjects.find(function(p) { return p.name.toLowerCase() === v.toLowerCase(); });
    });
    
    if (missing.length > 0) {
      var inserts = missing.map(function(v) { return { name: v }; });
      return supabase.from('fb_projects').insert(inserts).then(function() {
        return supabase.from('fb_projects').select('*');
      });
    }
    return res;
  }).then(function(res) {
    var projects = res.data || [];
    if (myVillage.toLowerCase() === 'all' || role === 'admin' || role === 'director' || role === 'national') {
      window.fbState.myProjects = projects;
    } else {
      window.fbState.myProjects = projects.filter(function(p) { 
        return p.name.toLowerCase() === myVillage.toLowerCase(); 
      });
    }
    
    window.fbState.loading = false;
    fbRenderSubView();
  }).catch(function(err) {
    console.error(err);
    alert('Failed to load FB projects: ' + err.message);
    window.fbState.loading = false;
    fbRenderSubView();
  });
}

function loadProjectData() {
  if (!window.fbState.activeProject) return;
  var pid = window.fbState.activeProject.id;
  var y = window.fbState.activeYear;
  var m = window.fbState.activeMonth;
  
  window.fbState.loading = true;
  window.fbState.hasUnsavedChanges = false;
  fbRenderSubView();
  
  Promise.all([
    supabase.from('fb_houses').select('*').eq('project_id', pid),
    supabase.from('fb_child_counts').select('*').eq('project_id', pid).eq('year', y).eq('month', m),
    supabase.from('fb_rate_variables').select('*').eq('project_id', pid).eq('year', y).eq('month', m)
  ]).then(function(results) {
    window.fbState.houses = results[0].data || [];
    window.fbState.childCounts = results[1].data || [];
    window.fbState.rateVariables = results[2].data || [];
    
    if (window.state && window.state.profiles) {
      var projectName = window.fbState.activeProject.name;
      
      var villageMothers = Object.keys(window.state.profiles).filter(function(uname) {
        var p = window.state.profiles[uname];
        var isMother = (p.role && p.role.toLowerCase() === 'mother') || (p.usertype && p.usertype.toLowerCase().indexOf('mother') !== -1);
        return isMother && p.village && projectName.toLowerCase().indexOf(p.village.toLowerCase()) !== -1;
      });
      
      var neededHouses = [];
      villageMothers.forEach(function(uname) {
        var houseNum = window.state.profiles[uname].house;
        if (houseNum && neededHouses.indexOf(houseNum) === -1) {
          neededHouses.push(houseNum);
        }
      });
      
      var missingHouses = neededHouses.filter(function(hNum) {
        return !window.fbState.houses.find(function(h) { return String(h.house_no) === String(hNum); });
      });
      
      if (missingHouses.length > 0) {
        var newHouses = missingHouses.map(function(hNum) {
          return { project_id: pid, house_no: String(hNum) };
        });
        return supabase.from('fb_houses').insert(newHouses).then(function() {
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
  }).catch(function(err) {
    console.error(err);
    window.fbState.loading = false;
    fbRenderSubView();
  });
}

window.renderFbCalculator = function() {
  if (!canAccessFb()) {
    document.querySelector('#view-fb-calculator').innerHTML = '<div class="empty">Access Denied.</div>';
    return;
  }
  
  var m = window.fbState.activeMonth;
  var y = window.fbState.activeYear;
  
  var monthOptions = [1,2,3,4,5,6,7,8,9,10,11,12].map(function(x) { 
    return '<option value="'+x+'" '+(x===m?'selected':'')+'>Month '+x+'</option>'; 
  }).join('');
  
  var container = document.querySelector('#view-fb-calculator');
  container.innerHTML = 
    '<div class="fb-layout">' +
      '<div class="fb-sidebar panel">' +
        '<h3 style="margin-top:0">FB Calculator</h3>' +
        '<div style="margin-bottom:15px; display:flex; flex-direction:column; gap:8px;">' +
          '<label style="font-size:11px; font-weight:bold; color:#666;">SELECT PERIOD</label>' +
          '<select id="fb-sel-month" onchange="fbChangePeriod()" class="form-control">' + monthOptions + '</select>' +
          '<select id="fb-sel-year" onchange="fbChangePeriod()" class="form-control">' +
            '<option value="2024" '+(y===2024?'selected':'')+'>2024</option>' +
            '<option value="2025" '+(y===2025?'selected':'')+'>2025</option>' +
            '<option value="2026" '+(y===2026?'selected':'')+'>2026</option>' +
          '</select>' +
        '</div><hr>' +
        '<button class="ghost-button fb-nav-btn" data-subview="projects">Projects</button>' +
        '<button class="ghost-button fb-nav-btn" data-subview="dashboard" id="fb-nav-dashboard" style="display:none">Dashboard</button>' +
        '<button class="ghost-button fb-nav-btn" data-subview="rates" id="fb-nav-rates" style="display:none">Rate Variables</button>' +
        '<button class="ghost-button fb-nav-btn" data-subview="entry" id="fb-nav-entry" style="display:none">Data Entry</button>' +
        '<button class="ghost-button fb-nav-btn" data-subview="history" id="fb-nav-history" style="display:none">History / Audit</button>' +
      '</div>' +
      '<div class="fb-content" id="fb-subview-container"></div>' +
    '</div>' +
    // Modal Overlay Container
    '<div id="fb-modal-overlay" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:9999; justify-content:center; align-items:center;">' +
      '<div id="fb-modal-content" style="background:#fff; width:600px; max-width:90%; border-radius:12px; box-shadow:0 10px 30px rgba(0,0,0,0.2); overflow:hidden; animation: fbFadeIn 0.3s ease;">' +
      '</div>' +
    '</div>';
  
  container.querySelectorAll('.fb-nav-btn').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      if (window.fbState.hasUnsavedChanges) {
        if (!confirm("You have unsaved changes. Discard them?")) return;
        window.fbState.hasUnsavedChanges = false;
      }
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
    btn.style.background = btn.dataset.subview === window.fbState.currentSubView ? '#f0f0f0' : 'transparent';
  });
  
  var hasProj = !!window.fbState.activeProject;
  ['dashboard', 'rates', 'entry', 'history'].forEach(function(id) {
    var el = document.getElementById('fb-nav-' + id);
    if(el) el.style.display = hasProj ? 'block' : 'none';
  });
  
  if (window.fbState.loading) {
    container.innerHTML = '<div class="empty">Loading...</div>';
    return;
  }
  
  switch(window.fbState.currentSubView) {
    case 'projects': return fbRenderProjects(container);
    case 'dashboard': return fbRenderDashboard(container);
    case 'rates': return fbRenderRates(container);
    case 'entry': return fbRenderEntry(container);
    case 'history': return fbRenderHistory(container);
    default: container.innerHTML = '<div class="empty">Select a view</div>';
  }
}

function fbRenderProjects(container) {
  var html = '<div class="panel"><div class="section-heading"><div><h2>Projects</h2><small>Select a project to manage</small></div></div>';
  if (window.fbState.myProjects.length === 0) {
    html += '<p>No projects assigned to you.</p>';
  } else {
    html += '<div class="grid two-col">';
    window.fbState.myProjects.forEach(function(p) {
      html += 
        '<div class="panel" style="cursor:pointer; border:1px solid #ddd" onclick="fbSelectProject(\'' + p.id + '\')">' +
          '<h3>' + p.name + '</h3><p>Click to open module</p>' +
        '</div>';
    });
    html += '</div>';
  }
  html += '</div>';
  container.innerHTML = html;
}

window.fbSelectProject = function(id) {
  if (window.fbState.hasUnsavedChanges) {
    if (!confirm("You have unsaved changes. Discard them?")) return;
    window.fbState.hasUnsavedChanges = false;
  }
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
    var counts = window.fbState.childCounts.find(function(c) { return c.house_id === h.id; }) || {};
    var calcs = calculateHouseBudget(counts, window.fbState.rateVariables);
    totalBudget += calcs.total_budget;
    totalFood += calcs.total_food;
    totalClothing += calcs.total_clothing;
    totalHH += calcs.total_hh;
  });
  var html = 
    '<div class="panel">' +
      '<div class="section-heading">' +
        '<div><h2>' + p.name + ' - Dashboard</h2><small>' + window.fbState.activeYear + ' / ' + window.fbState.activeMonth + '</small></div>' +
      '</div>' +
      '<div class="grid stats-grid" style="grid-template-columns: repeat(4, 1fr); gap:15px;">' +
        '<div class="panel stat-card" style="background:#f4f9fb; border:1px solid #cce5f0;"><span class="stat-label">Total Budget</span><div class="stat-value">LKR ' + totalBudget.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2}) + '</div></div>' +
        '<div class="panel stat-card" style="background:#fef9e7; border:1px solid #f9e79f;"><span class="stat-label">Total Food Budget</span><div class="stat-value">LKR ' + totalFood.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2}) + '</div></div>' +
        '<div class="panel stat-card" style="background:#e8f8f5; border:1px solid #a3e4d7;"><span class="stat-label">Total Clothing</span><div class="stat-value">LKR ' + totalClothing.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2}) + '</div></div>' +
        '<div class="panel stat-card" style="background:#fdf2e9; border:1px solid #edbb99;"><span class="stat-label">Total Household</span><div class="stat-value">LKR ' + totalHH.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2}) + '</div></div>' +
      '</div>' +
    '</div>';
  container.innerHTML = html;
}

function fbRenderRates(container) {
  var p = window.fbState.activeProject;
  if (!p) return;
  var rates = window.fbState.rateVariables;
  var getRate = function(k) {
    var found = rates.find(function(r) { return r.variable_key === k; });
    if (found && found.value !== undefined && found.value !== null) return found.value;
    return DEFAULT_RATES[k];
  };
  var r = getFbRole();
  var isDirectorOrAdmin = r === 'director' || r === 'admin';
  var html = 
    '<div class="panel">' +
      '<div class="section-heading"><div><h2>Rate Variables</h2><small>Rates matched exactly to SOS Village parameters</small></div></div>' +
      '<div class="table-wrap">' +
        '<table>' +
          '<thead><tr><th>Variable</th><th>Value</th></tr></thead>' +
          '<tbody>' +
            Object.keys(DEFAULT_RATES).map(function(k) {
              var isPct = k.indexOf('_pct') !== -1;
              var disabled = (isPct && !isDirectorOrAdmin) ? 'disabled title="Only Finance Director can edit percentages"' : '';
              return '<tr>' +
                '<td><strong>' + k + '</strong></td>' +
                '<td><input type="number" step="0.0001" value="' + getRate(k) + '" id="rate_' + k + '" class="fb-rate-input form-control" ' + disabled + ' /></td>' +
              '</tr>';
            }).join('') +
          '</tbody>' +
        '</table>' +
      '</div>' +
      '<div class="button-row"><button class="primary-button" onclick="fbSaveRates()">Save Rates</button></div>' +
    '</div>';
  container.innerHTML = html;
}

window.fbSaveRates = function() {
  var pid = window.fbState.activeProject.id;
  var y = window.fbState.activeYear;
  var m = window.fbState.activeMonth;
  var username = sessionStorage.getItem('username');
  var upserts = Object.keys(DEFAULT_RATES).map(function(k) {
    return {
      project_id: pid, year: y, month: m,
      variable_key: k, value: document.getElementById('rate_' + k).value,
      updated_by: username
    };
  });
  supabase.from('fb_rate_variables').upsert(upserts, { onConflict: 'project_id, year, month, variable_key' }).then(function(res) {
    if (res.error) throw res.error;
    alert('Rates saved successfully.');
    loadProjectData();
  }).catch(function(e) { alert('Error saving rates: ' + e.message); });
};

window.fbEditHouseForm = function(hId) {
  if (window.fbState.hasUnsavedChanges) {
    if (!confirm("You have unsaved changes in this house form. Are you sure you want to discard them?")) return;
    window.fbState.hasUnsavedChanges = false;
  }
  window.fbState.editingHouseId = hId;
  fbRenderSubView();
};

function fbRenderEntry(container) {
  var p = window.fbState.activeProject;
  if (!p) return;
  var pName = p.name;
  var hId = window.fbState.editingHouseId || '';
  
  var html = 
    '<div class="panel" style="margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); border: 1px solid #eaeaea;">' +
      '<div class="section-heading" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">' +
        '<div><h2 style="color:#2c3e50; margin:0 0 5px 0;">Data Entry & Balances</h2><small style="color:#7f8c8d;">Select Project & House</small></div>' +
        '<div style="display:flex; gap:10px;">' +
          '<button class="ghost-button" onclick="fbDownloadTemplate()">&#11015; Excel Summary</button>' +
        '</div>' +
      '</div>' +
      '<div class="grid two-col" style="gap:20px; background:#f8fbfc; padding:20px; border-radius:8px; border:1px solid #d4e6f1;">' +
        '<div><label style="font-weight:600; color:#34495e; margin-bottom:8px; display:block;">1. Project / Village:</label>' +
        '<select onchange="fbSelectProject(this.value)" class="form-control" style="width:100%; padding:10px; border-radius:6px; border:1px solid #bdc3c7;">';
        
  html += '<option value="">-- Select Project --</option>';
  window.fbState.myProjects.forEach(function(proj) {
     var sel = p.id === proj.id ? 'selected' : '';
     html += '<option value="' + proj.id + '" ' + sel + '>' + proj.name + '</option>';
  });
  html += '</select></div>';
  
  html += '<div><label style="font-weight:600; color:#34495e; margin-bottom:8px; display:block;">2. House Number / Mother Name:</label>' +
      '<select onchange="fbEditHouseForm(this.value)" class="form-control" style="width:100%; padding:10px; border-radius:6px; border:1px solid #bdc3c7;">';
  html += '<option value="">-- Select House --</option>';
  
  var validHouses = window.fbState.houses.filter(function(h) {
     return fbGetMotherName(p.name, h.house_no) !== 'Unassigned';
  });
  
  var sortedHouses = validHouses.sort(function(a,b) { return parseInt(a.house_no) - parseInt(b.house_no); });
  sortedHouses.forEach(function(h) {
     var mName = fbGetMotherName(p.name, h.house_no);
     var sel = hId === h.id ? 'selected' : '';
     html += '<option value="' + h.id + '" ' + sel + '>House ' + h.house_no + ' (' + mName + ')</option>';
  });
  html += '</select></div></div></div>';
  
  if (hId) {
    var house = window.fbState.houses.find(function(h) { return h.id === hId; });
    var counts = window.fbState.childCounts.find(function(c) { return c.house_id === hId; }) || {};
    var calcs = calculateHouseBudget(counts, window.fbState.rateVariables);
    var motherName = fbGetMotherName(pName, house.house_no);
    
    html += '<div class="panel" style="margin-bottom:20px; border-left:5px solid #3498db; background:#ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border-radius:8px; padding:25px;">' +
      '<div style="display:flex; justify-content:space-between; align-items:center;">' +
        '<h3 style="margin:0; color:#2c3e50; font-size:20px; font-weight:600;">Data Entry For: <span style="color:#3498db">House ' + house.house_no + ' (' + motherName + ')</span></h3>' +
        (window.fbState.hasUnsavedChanges ? '<span style="color:#e74c3c; font-weight:bold; font-size:14px; background:#fadbd8; padding:5px 10px; border-radius:4px;">⚠️ Unsaved Changes - Click Save</span>' : '') +
      '</div>' +
      '<hr style="border:0; border-top:1px solid #ecf0f1; margin:20px 0;">' +
      
      '<div class="grid" style="grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom:25px;">' +
      '<div><label style="font-weight:600; color:#7f8c8d; display:block; margin-bottom:8px;">Children Over 12</label>' +
      '<input type="number" min="0" class="form-control" value="' + (counts.food_o12||0) + '" onchange="fbUpdateLocalCount(\''+hId+'\', \'food_o12\', this.value)" style="width:100%; padding:10px; font-size:16px; border-radius:6px; border:1px solid #bdc3c7;"></div>' +
      
      '<div><label style="font-weight:600; color:#7f8c8d; display:block; margin-bottom:8px;">Children Under 12</label>' +
      '<input type="number" min="0" class="form-control" value="' + (counts.food_u12||0) + '" onchange="fbUpdateLocalCount(\''+hId+'\', \'food_u12\', this.value)" style="width:100%; padding:10px; font-size:16px; border-radius:6px; border:1px solid #bdc3c7;"></div>' +
      
      '<div><label style="font-weight:600; color:#7f8c8d; display:block; margin-bottom:8px;">Mothers in House</label>' +
      '<input type="number" min="0" class="form-control" value="' + (counts.mother_count||0) + '" onchange="fbUpdateLocalCount(\''+hId+'\', \'mother_count\', this.value)" style="width:100%; padding:10px; font-size:16px; border-radius:6px; border:1px solid #bdc3c7;"></div>' +
      '</div>' + 
      
      '<div class="grid two-col" style="gap:20px; margin-bottom:25px;">' +
      '<div style="background:#f4f6f7; padding:20px; border-radius:8px; border:1px solid #e5e8e8;">' +
        '<h4 style="margin-top:0; color:#2c3e50;">Manual Allowances & Adjustments</h4>' +
        '<label style="font-weight:bold; color:#2c3e50; margin-bottom:8px; display:block;">Aunts Allowance <small>(Excel Math)</small></label>' +
        '<input type="text" class="form-control" value="' + (counts.aunt_amount||0) + '" onblur="fbExcelInput(this, \''+hId+'\', \'aunt_amount\')" style="width:100%; padding:10px; margin-bottom:15px; border:1px solid #3498db;">' +
        '<label style="font-weight:bold; color:#2c3e50; margin-bottom:8px; display:block;">Adjustments / Festival <small>(Excel Math)</small></label>' +
        '<input type="text" class="form-control" value="' + (counts.adjustment||0) + '" onblur="fbExcelInput(this, \''+hId+'\', \'adjustment\')" style="width:100%; padding:10px; border:1px solid #3498db;">' +
      '</div>' +
      
      '<div style="background:#fef9e7; padding:20px; border-radius:8px; border:1px solid #f9e79f;">' +
        '<h4 style="margin-top:0; color:#d4ac0d;">Manual Withdrawals (For Balances)</h4>' +
        '<label style="font-weight:bold; color:#d4ac0d; margin-bottom:8px; display:block;">Actual Clothing Withdrawal</label>' +
        '<input type="text" class="form-control" value="' + calcs.actual_clothing_w + '" onblur="fbExcelInput(this, \''+hId+'\', \'clothing_o12\')" placeholder="Amount withdrawn" style="width:100%; padding:10px; margin-bottom:15px; border:1px solid #f1c40f;">' +
        '<label style="font-weight:bold; color:#d4ac0d; margin-bottom:8px; display:block;">Actual Household Withdrawal</label>' +
        '<input type="text" class="form-control" value="' + calcs.actual_household_w + '" onblur="fbExcelInput(this, \''+hId+'\', \'clothing_u12\')" placeholder="Amount withdrawn" style="width:100%; padding:10px; border:1px solid #f1c40f;">' +
      '</div>' +
      
      '<div style="background:#fdf2e9; padding:20px; border-radius:8px; border:1px solid #edbb99; grid-column:span 2;">' +
        '<h4 style="margin-top:0; color:#ca6f1e;">Interest & Charges</h4>' +
        '<div class="grid two-col" style="gap:20px;">' +
          '<div><label style="font-weight:bold; color:#ca6f1e; display:block; margin-bottom:8px;">Interest Received</label>' +
          '<input type="text" class="form-control" value="' + calcs.interest_earned + '" onblur="fbExcelInput(this, \''+hId+'\', \'household\')" style="width:100%; padding:10px; border:1px solid #e67e22;"></div>' +
          '<div><label style="font-weight:bold; color:#ca6f1e; display:block; margin-bottom:8px;">Bank and Other Charges</label>' +
          '<input type="text" class="form-control" value="' + calcs.bank_charges + '" onblur="fbExcelInput(this, \''+hId+'\', \'arrears\')" style="width:100%; padding:10px; border:1px solid #e67e22;"></div>' +
        '</div>' +
      '</div>' +
      '</div>' + 
      
      '<div style="margin-top:25px; padding:20px; background:#e8f8f5; border-radius:8px; border: 1px solid #d1f2eb;">' +
        '<h4 style="margin-top:0; color:#1abc9c; font-size:18px;">Monthly Balances & Withdrawals (Live Preview)</h4>' +
        '<div class="grid" style="grid-template-columns: repeat(4, 1fr); gap: 15px;">' +
          '<div style="background:#fff; padding:15px; border-radius:6px; box-shadow:0 2px 4px rgba(0,0,0,0.02);"><small style="color:#7f8c8d; font-weight:bold; display:block; margin-bottom:5px;">Food Balance</small><strong style="font-size:18px; color:#2c3e50;">LKR ' + calcs.food_balance.toLocaleString(undefined, {minimumFractionDigits:2}) + '</strong><br><small style="color:#999">(1st W: ' + calcs.first_withdrawal.toLocaleString() + ' | 2nd W: ' + calcs.second_withdrawal.toLocaleString() + ')</small></div>' +
          '<div style="background:#fff; padding:15px; border-radius:6px; box-shadow:0 2px 4px rgba(0,0,0,0.02);"><small style="color:#7f8c8d; font-weight:bold; display:block; margin-bottom:5px;">Clothing Balance</small><strong style="font-size:18px; color:#2c3e50;">LKR ' + calcs.clothing_balance.toLocaleString(undefined, {minimumFractionDigits:2}) + '</strong><br><small style="color:#999">(Budget: ' + calcs.total_clothing.toLocaleString() + ')</small></div>' +
          '<div style="background:#fff; padding:15px; border-radius:6px; box-shadow:0 2px 4px rgba(0,0,0,0.02);"><small style="color:#7f8c8d; font-weight:bold; display:block; margin-bottom:5px;">Household Balance</small><strong style="font-size:18px; color:#2c3e50;">LKR ' + calcs.household_balance.toLocaleString(undefined, {minimumFractionDigits:2}) + '</strong><br><small style="color:#999">(Budget: ' + calcs.total_hh.toLocaleString() + ')</small></div>' +
          '<div style="background:#fff; padding:15px; border-radius:6px; box-shadow:0 2px 4px rgba(0,0,0,0.02);"><small style="color:#7f8c8d; font-weight:bold; display:block; margin-bottom:5px;">Interest Balance</small><strong style="font-size:18px; color:#27ae60;">LKR ' + calcs.interest_balance.toLocaleString(undefined, {minimumFractionDigits:2}) + '</strong></div>' +
        '</div>' +
      '</div>' +
      
      '<div style="margin-top:25px; text-align:right; border-top:1px solid #ecf0f1; padding-top:20px;">' +
        '<button class="primary-button" onclick="fbReviewAndSave(\''+hId+'\')" style="font-size:16px; padding:12px 30px; background:#27ae60; border:none; border-radius:6px; cursor:pointer; box-shadow:0 4px 6px rgba(39, 174, 96, 0.2);">&#10004; Review & Save House Data</button>' +
      '</div>' +

    '</div>';
  } else {
    html += '<div class="panel" style="text-align:center; padding:60px 20px; color:#95a5a6; background:#fdfdfd; border:2px dashed #ecf0f1; border-radius:8px;">' +
      '<div style="font-size:48px; margin-bottom:15px;">📊</div>' +
      '<h3 style="margin:0; font-weight:normal;">Please select a House / Mother above to enter data.</h3></div>';
  }
  
  html += '<div class="panel" style="overflow-x:auto; margin-top:20px;">' +
    '<h3 style="color:#2c3e50;">Balance Overview</h3>' +
    '<table class="data-table" style="min-width: 1100px; font-size: 13px; text-align:left; border-collapse:collapse; width:100%;">' +
      '<thead>' +
        '<tr style="background:#f4f6f7; border-bottom:2px solid #bdc3c7;">' +
          '<th style="padding:12px;">House</th>' +
          '<th style="padding:12px;">Mother</th>' +
          '<th style="padding:12px;">Savings</th>' +
          '<th style="padding:12px;">1st W (Food)</th>' +
          '<th style="padding:12px;">2nd W (Food)</th>' +
          '<th style="padding:12px; background:#f9ebea;">Clothing Bal</th>' +
          '<th style="padding:12px; background:#f9ebea;">HH Bal</th>' +
          '<th style="padding:12px; background:#e8f8f5;">Interest Bal</th>' +
        '</tr>' +
      '</thead>' +
      '<tbody>';
      
  sortedHouses.forEach(function(h) {
    var counts = window.fbState.childCounts.find(function(c) { return c.house_id === h.id; }) || {};
    var calcs = calculateHouseBudget(counts, window.fbState.rateVariables);
    var cMotherName = fbGetMotherName(pName, h.house_no);
    var isSel = (hId === h.id) ? 'background:#eafaf1; font-weight:bold;' : 'border-bottom:1px solid #ecf0f1;';
    
    html += 
      '<tr style="'+isSel+' cursor:pointer; transition: background 0.2s;" onmouseover="this.style.background=\'#f9f9f9\'" onmouseout="this.style.background=\''+(hId===h.id?'#eafaf1':'#fff')+'\'" onclick="fbEditHouseForm(\''+h.id+'\')">' +
        '<td style="padding:10px;"><strong>' + h.house_no + '</strong></td>' +
        '<td style="padding:10px;">' + cMotherName + '</td>' +
        '<td style="padding:10px; color:#2980b9; font-weight:bold;">' + calcs.savings.toLocaleString(undefined, {minimumFractionDigits:2}) + '</td>' +
        '<td style="padding:10px;">' + calcs.first_withdrawal.toLocaleString(undefined, {minimumFractionDigits:2}) + '</td>' +
        '<td style="padding:10px;">' + calcs.second_withdrawal.toLocaleString(undefined, {minimumFractionDigits:2}) + '</td>' +
        '<td style="padding:10px; background:#fdf2e9; font-weight:bold;">' + calcs.clothing_balance.toLocaleString(undefined, {minimumFractionDigits:2}) + '</td>' +
        '<td style="padding:10px; background:#fdf2e9; font-weight:bold;">' + calcs.household_balance.toLocaleString(undefined, {minimumFractionDigits:2}) + '</td>' +
        '<td style="padding:10px; background:#eafaf1; font-weight:bold; color:#27ae60;">' + calcs.interest_balance.toLocaleString(undefined, {minimumFractionDigits:2}) + '</td>' +
      '</tr>';
  });
  
  html += '</tbody></table></div>';
  container.innerHTML = html;
}

window.fbDownloadTemplate = function() {
  if (!window.XLSX) return alert('Excel library not loaded.');
  var ws_data = [['House No', 'Mother', 'Child >12', 'Child <12', 'Aunt Amt', 'Actual Clothing W', 'Actual HH W', 'Interest Earned', 'Bank Charges']];
  var pName = window.fbState.activeProject.name;
  
  var validHouses = window.fbState.houses.filter(function(h) { return fbGetMotherName(pName, h.house_no) !== 'Unassigned'; });
  var sortedHouses = validHouses.sort(function(a,b) { return parseInt(a.house_no) - parseInt(b.house_no); });
  
  sortedHouses.forEach(function(h) {
    var counts = window.fbState.childCounts.find(function(c) { return c.house_id === h.id; }) || {};
    var calcs = calculateHouseBudget(counts, window.fbState.rateVariables);
    ws_data.push([
      h.house_no, fbGetMotherName(pName, h.house_no), 
      counts.food_o12 || 0, counts.food_u12 || 0,
      counts.aunt_amount || 0, 
      calcs.actual_clothing_w, calcs.actual_household_w,
      calcs.interest_earned, calcs.bank_charges
    ]);
  });
  
  var ws = XLSX.utils.aoa_to_sheet(ws_data);
  var wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Data Entry");
  XLSX.writeFile(wb, window.fbState.activeProject.name + "_Summary_" + window.fbState.activeYear + "_" + window.fbState.activeMonth + ".xlsx");
};

window.fbUpdateLocalCount = function(houseId, field, val) {
  var pid = window.fbState.activeProject.id;
  var y = window.fbState.activeYear;
  var m = window.fbState.activeMonth;
  
  var existing = window.fbState.childCounts.find(function(c) { return c.house_id === houseId; });
  if (!existing) {
    existing = { project_id: pid, year: y, month: m, house_id: houseId };
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
  
  var html = 
    '<div class="fb-modal-header">Double Verification Required</div>' +
    '<div class="fb-modal-body">' +
      '<p style="font-size:14px; color:#34495e; margin-top:0;">Please carefully review the final calculated budget and balances before permanently committing to the database.</p>' +
      '<h4 style="border-bottom:2px solid #eee; padding-bottom:10px; margin-top:20px; color:#2c3e50;">Budget & Withdrawals</h4>' +
      '<div class="fb-summary-grid">' +
        '<div class="fb-summary-box"><span>Total Budget</span><strong>LKR ' + calcs.total_budget.toLocaleString(undefined, {minimumFractionDigits:2}) + '</strong></div>' +
        '<div class="fb-summary-box" style="background:#e8f4f8; border-color:#d4e6f1;"><span>Savings (5%)</span><strong style="color:#2980b9">LKR ' + calcs.savings.toLocaleString(undefined, {minimumFractionDigits:2}) + '</strong></div>' +
        '<div class="fb-summary-box"><span>1st Withdrawal</span><strong>LKR ' + calcs.first_withdrawal.toLocaleString(undefined, {minimumFractionDigits:2}) + '</strong></div>' +
        '<div class="fb-summary-box"><span>2nd Withdrawal</span><strong>LKR ' + calcs.second_withdrawal.toLocaleString(undefined, {minimumFractionDigits:2}) + '</strong></div>' +
      '</div>' +
      '<h4 style="border-bottom:2px solid #eee; padding-bottom:10px; color:#2c3e50;">Closing Ledger Balances</h4>' +
      '<div class="fb-summary-grid">' +
        '<div class="fb-summary-box"><span>Food Balance</span><strong>LKR ' + calcs.food_balance.toLocaleString(undefined, {minimumFractionDigits:2}) + '</strong></div>' +
        '<div class="fb-summary-box"><span>Clothing Balance</span><strong>LKR ' + calcs.clothing_balance.toLocaleString(undefined, {minimumFractionDigits:2}) + '</strong></div>' +
        '<div class="fb-summary-box"><span>Household Balance</span><strong>LKR ' + calcs.household_balance.toLocaleString(undefined, {minimumFractionDigits:2}) + '</strong></div>' +
        '<div class="fb-summary-box" style="background:#eafaf1; border-color:#d5f5e3;"><span>Interest Balance</span><strong style="color:#27ae60">LKR ' + calcs.interest_balance.toLocaleString(undefined, {minimumFractionDigits:2}) + '</strong></div>' +
      '</div>' +
    '</div>' +
    '<div class="fb-modal-footer">' +
      '<button class="ghost-button" onclick="document.getElementById(\'fb-modal-overlay\').style.display=\'none\'" style="margin-right:15px; padding:10px 20px; font-weight:bold;">Cancel & Edit</button>' +
      '<button class="primary-button" onclick="fbConfirmSaveData(\''+houseId+'\')" style="padding:12px 25px; background:#27ae60; border:none; border-radius:6px; font-size:15px; font-weight:bold; box-shadow:0 4px 6px rgba(39, 174, 96, 0.3);">Confirm & Save</button>' +
    '</div>';
    
  document.getElementById('fb-modal-content').innerHTML = html;
  document.getElementById('fb-modal-overlay').style.display = 'flex';
};

window.fbConfirmSaveData = function(houseId) {
  var existing = window.fbState.childCounts.find(function(c) { return c.house_id === houseId; });
  var calcs = calculateHouseBudget(existing, window.fbState.rateVariables);
  
  // Write to explicit physical database columns if user has created them
  existing.food_balance = calcs.food_balance;
  existing.clothing_balance = calcs.clothing_balance;
  existing.household_balance = calcs.household_balance;
  existing.interest_balance = calcs.interest_balance;
  
  // Store a JSON snapshot as a robust backup
  existing.remarks = JSON.stringify({
    savings: calcs.savings,
    first_w: calcs.first_withdrawal,
    second_w: calcs.second_withdrawal
  });
  
  document.getElementById('fb-modal-overlay').style.display = 'none';
  
  // upsert and select().single() ensures we get the new 'id' back to prevent duplicates
  supabase.from('fb_child_counts').upsert([existing], { onConflict: 'project_id, year, month, house_id' }).select().single().then(function(res) {
    if (res.error) throw res.error;
    
    // Update local cache so we don't insert a duplicate row on next save
    var idx = window.fbState.childCounts.findIndex(function(c) { return c.house_id === houseId; });
    if(idx > -1) window.fbState.childCounts[idx] = res.data;
    else window.fbState.childCounts.push(res.data);
    
    alert('Data explicitly saved to database successfully!');
    window.fbState.hasUnsavedChanges = false;
    fbRenderSubView();
  }).catch(function(e) {
    alert('Error saving data. If you have not created the balance columns in Supabase yet, the save will fail. Error: ' + e.message);
  });
};

function fbRenderHistory(container) {
  container.innerHTML = '<div class="panel"><h2>Audit Logs & History</h2><p>Coming in next iteration.</p></div>';
}

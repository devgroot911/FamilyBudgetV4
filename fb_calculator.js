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
  editingHouseId: null
};

// Updated DEFAULT_RATES to perfectly match the SOS Children's Village Piliyandala Excel Sheet
var DEFAULT_RATES = {
  food_o12_rate: 6300,
  food_u12_rate: 4500,
  clothing_o12_rate: 2500,
  clothing_u12_rate: 2100,
  household_rate: 1500,
  mother_food_rate: 6300,
  first_pct: 61.6667,
  second_pct: 33.3333,
  savings_pct: 5.0000
};

function calculateHouseBudget(houseCounts, rates) {
  var getRate = function(key) {
    var found = rates.find(function(r) { return r.variable_key === key; });
    if (found && found.value !== undefined && found.value !== null) {
      return Number(found.value);
    }
    return DEFAULT_RATES[key];
  };
  
  var food_o12_amount = getRate('food_o12_rate') * (houseCounts.food_o12 || 0);
  var food_u12_amount = getRate('food_u12_rate') * (houseCounts.food_u12 || 0);
  var clothing_o12_amount = getRate('clothing_o12_rate') * (houseCounts.clothing_o12 || 0);
  var clothing_u12_amount = getRate('clothing_u12_rate') * (houseCounts.clothing_u12 || 0);
  var household_amount = getRate('household_rate') * (houseCounts.household || 0);
  var mother_amount = getRate('mother_food_rate') * (houseCounts.mother_count || 0);
  var aunt_amount = Number(houseCounts.aunt_amount || 0);
  
  var total_food = food_o12_amount + food_u12_amount + mother_amount + aunt_amount;
  
  var arrears = Number(houseCounts.arrears || 0);
  var festival = Number(houseCounts.festival || 0);
  var adjustment = Number(houseCounts.adjustment || 0);
  var adjustments = arrears + festival + adjustment;
  
  var total_budget = total_food + clothing_o12_amount + clothing_u12_amount + household_amount + adjustments;
  
  var first_pct = getRate('first_pct') / 100;
  var second_pct = getRate('second_pct') / 100;
  var savings_pct = getRate('savings_pct') / 100;
  
  var first_withdrawal = total_food * first_pct;
  var second_withdrawal = total_food * second_pct;
  var savings = total_food * savings_pct;
  
  var net_payable = first_withdrawal + second_withdrawal + adjustments - savings;

  return {
    food_o12_amount: food_o12_amount, food_u12_amount: food_u12_amount, clothing_o12_amount: clothing_o12_amount, clothing_u12_amount: clothing_u12_amount,
    household_amount: household_amount, mother_amount: mother_amount, aunt_amount: aunt_amount, total_food: total_food, total_budget: total_budget,
    first_withdrawal: first_withdrawal, second_withdrawal: second_withdrawal, savings: savings, net_payable: net_payable
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

function logAudit(action, projectId, details) {
  var username = sessionStorage.getItem('username');
  return supabase.from('fb_audit_logs').insert({
    user_username: username,
    action: action,
    project_id: projectId,
    month: window.fbState.activeYear + '-' + window.fbState.activeMonth,
    details_json: details
  });
}

window.fbChangePeriod = function() {
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
  elem.value = num; // update UI cleanly
  window.fbUpdateCount(houseId, field, num);
};

function loadFbData() {
  window.fbState.loading = true;
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
      return supabase.from('fb_projects').insert(inserts).then(function(insRes) {
        if(insRes.error) throw insRes.error;
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
  fbRenderSubView();
  
  Promise.all([
    supabase.from('fb_houses').select('*').eq('project_id', pid),
    supabase.from('fb_child_counts').select('*').eq('project_id', pid).eq('year', y).eq('month', m),
    supabase.from('fb_rate_variables').select('*').eq('project_id', pid).eq('year', y).eq('month', m),
    supabase.from('fb_monthly_summaries').select('*').eq('project_id', pid).eq('year', y).eq('month', m).single()
  ]).then(function(results) {
    window.fbState.houses = results[0].data || [];
    window.fbState.childCounts = results[1].data || [];
    window.fbState.rateVariables = results[2].data || [];
    window.fbState.monthlySummary = results[3].data || null;
    
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
    document.querySelector('#view-fb-calculator').innerHTML = '<div class="empty">Access Denied. You do not have permission to view the FB Calculator.</div>';
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
      '<div class="fb-content" id="fb-subview-container">' +
        '<!-- Content injects here -->' +
      '</div>' +
    '</div>';
  
  container.querySelectorAll('.fb-nav-btn').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
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
          '<h3>' + p.name + '</h3>' +
          '<p>Click to open module</p>' +
        '</div>';
    });
    html += '</div>';
  }
  html += '</div>';
  container.innerHTML = html;
}

window.fbSelectProject = function(id) {
  window.fbState.activeProject = window.fbState.myProjects.find(function(p) { return p.id === id; });
  window.fbState.editingHouseId = null; 
  window.fbState.currentSubView = 'entry';
  loadProjectData();
};

function fbRenderDashboard(container) {
  var p = window.fbState.activeProject;
  if (!p) return;
  
  var totalBudget = 0, totalFood = 0, totalWithdrawal1 = 0, totalWithdrawal2 = 0, totalSavings = 0;
  
  window.fbState.houses.forEach(function(h) {
    var counts = window.fbState.childCounts.find(function(c) { return c.house_id === h.id; }) || {};
    var calcs = calculateHouseBudget(counts, window.fbState.rateVariables);
    totalBudget += calcs.total_budget;
    totalFood += calcs.total_food;
    totalWithdrawal1 += calcs.first_withdrawal;
    totalWithdrawal2 += calcs.second_withdrawal;
    totalSavings += calcs.savings;
  });
  
  var html = 
    '<div class="panel">' +
      '<div class="section-heading">' +
        '<div><h2>' + p.name + ' - Dashboard</h2><small>' + window.fbState.activeYear + ' / ' + window.fbState.activeMonth + '</small></div>' +
      '</div>' +
      '<div class="grid stats-grid" style="grid-template-columns: repeat(4, 1fr);">' +
        '<div class="panel stat-card"><span class="stat-label">Total Budget</span><div class="stat-value">LKR ' + totalBudget.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2}) + '</div></div>' +
        '<div class="panel stat-card"><span class="stat-label">Total Food</span><div class="stat-value">LKR ' + totalFood.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2}) + '</div></div>' +
        '<div class="panel stat-card"><span class="stat-label">1st Withdrawal</span><div class="stat-value">LKR ' + totalWithdrawal1.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2}) + '</div></div>' +
        '<div class="panel stat-card"><span class="stat-label">2nd Withdrawal</span><div class="stat-value">LKR ' + totalWithdrawal2.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2}) + '</div></div>' +
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
      project_id: pid,
      year: y,
      month: m,
      variable_key: k,
      value: document.getElementById('rate_' + k).value,
      updated_by: username
    };
  });
  
  supabase.from('fb_rate_variables').upsert(upserts, { onConflict: 'project_id, year, month, variable_key' }).then(function(res) {
    if (res.error) throw res.error;
    return logAudit('UPDATED_RATES', pid, { year: y, month: m });
  }).then(function() {
    alert('Rates saved successfully.');
    loadProjectData();
  }).catch(function(e) {
    alert('Error saving rates: ' + e.message);
  });
};

window.fbEditHouseForm = function(hId) {
  window.fbState.editingHouseId = hId;
  fbRenderSubView();
};

function fbRenderEntry(container) {
  var p = window.fbState.activeProject;
  if (!p) return;
  var pName = p.name;
  var hId = window.fbState.editingHouseId || '';
  
  var html = 
    '<div class="panel" style="margin-bottom: 20px;">' +
      '<div class="section-heading" style="display:flex; justify-content:space-between; align-items:center;">' +
        '<div><h2>Data Entry</h2><small>Select Project & House to enter data</small></div>' +
        '<div style="display:flex; gap:10px;">' +
          '<button class="ghost-button" onclick="fbDownloadTemplate()">&#11015; Excel Summary</button>' +
        '</div>' +
      '</div>' +
      
      '<div class="grid two-col" style="gap:15px; margin-bottom:15px; background:#f4f9fb; padding:15px; border-radius:5px; border:1px solid #cce5f0;">' +
        '<div><label style="font-weight:bold;">1. Project / Village:</label>' +
        '<select onchange="fbSelectProject(this.value)" class="form-control" style="width:100%;">';
        
  html += '<option value="">-- Select Project --</option>';
  window.fbState.myProjects.forEach(function(proj) {
     var sel = p.id === proj.id ? 'selected' : '';
     html += '<option value="' + proj.id + '" ' + sel + '>' + proj.name + '</option>';
  });
  html += '</select></div>';
  
  html += '<div><label style="font-weight:bold;">2. House Number / Mother Name:</label>' +
      '<select onchange="fbEditHouseForm(this.value)" class="form-control" style="width:100%;">';
  html += '<option value="">-- Select House --</option>';
  
  var sortedHouses = window.fbState.houses.slice().sort(function(a,b) { return parseInt(a.house_no) - parseInt(b.house_no); });
  sortedHouses.forEach(function(h) {
     var mName = fbGetMotherName(p.name, h.house_no);
     var sel = hId === h.id ? 'selected' : '';
     html += '<option value="' + h.id + '" ' + sel + '>House ' + h.house_no + ' (' + mName + ')</option>';
  });
  html += '</select></div>';
  html += '</div></div>'; // end panel
  
  if (hId) {
    var house = window.fbState.houses.find(function(h) { return h.id === hId; });
    var counts = window.fbState.childCounts.find(function(c) { return c.house_id === hId; }) || {};
    var calcs = calculateHouseBudget(counts, window.fbState.rateVariables);
    var motherName = fbGetMotherName(pName, house.house_no);
    
    html += '<div class="panel" style="margin-bottom:20px; border-left:4px solid #1abc9c;">' +
      '<h3 style="margin-top:0">Entering Data For: <span style="color:#1abc9c">House ' + house.house_no + ' (' + motherName + ')</span></h3>' +
      '<hr>' +
      '<div class="grid" style="grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom:20px;">' +
      
      '<div><label>Food >12 Count</label><input type="number" min="0" class="form-control" value="' + (counts.food_o12||0) + '" onchange="fbUpdateCount(\''+hId+'\', \'food_o12\', this.value)" style="width:100%"></div>' +
      '<div><label>Food <12 Count</label><input type="number" min="0" class="form-control" value="' + (counts.food_u12||0) + '" onchange="fbUpdateCount(\''+hId+'\', \'food_u12\', this.value)" style="width:100%"></div>' +
      '<div><label>Mother Count</label><input type="number" min="0" class="form-control" value="' + (counts.mother_count||0) + '" onchange="fbUpdateCount(\''+hId+'\', \'mother_count\', this.value)" style="width:100%"></div>' +
      
      '<div><label>Clothing >12 Count</label><input type="number" min="0" class="form-control" value="' + (counts.clothing_o12||0) + '" onchange="fbUpdateCount(\''+hId+'\', \'clothing_o12\', this.value)" style="width:100%"></div>' +
      '<div><label>Clothing <12 Count</label><input type="number" min="0" class="form-control" value="' + (counts.clothing_u12||0) + '" onchange="fbUpdateCount(\''+hId+'\', \'clothing_u12\', this.value)" style="width:100%"></div>' +
      '<div><label>House Hold Count</label><input type="number" min="0" class="form-control" value="' + (counts.household||0) + '" onchange="fbUpdateCount(\''+hId+'\', \'household\', this.value)" style="width:100%"></div>' +
      
      '</div>' + 
      '<div class="grid two-col" style="gap:15px; padding:15px; background:#f9f9f9; border-radius:5px;">' +
      
      '<div><label>Aunts Allowance (LKR)<br><small style="color:#666">Inside calculations supported (e.g. <b>=500+250</b>)</small></label>' +
      '<input type="text" class="form-control" value="' + (counts.aunt_amount||0) + '" onblur="fbExcelInput(this, \''+hId+'\', \'aunt_amount\')" placeholder="=500+200" style="width:100%; border-color:#1abc9c"></div>' +
      
      '<div><label>Adjustments / Festival (LKR)<br><small style="color:#666">Inside calculations supported (e.g. <b>=1500+500</b>)</small></label>' +
      '<input type="text" class="form-control" value="' + (counts.adjustment||0) + '" onblur="fbExcelInput(this, \''+hId+'\', \'adjustment\')" placeholder="=1500+500" style="width:100%; border-color:#1abc9c"></div>' +
      
      '</div>' + 
      
      '<div style="margin-top:20px; padding:15px; background:#e8f4f8; border-radius:5px; border-left:4px solid #3498db;">' +
        '<h4 style="margin-top:0">Live Budget Calculation</h4>' +
        '<div class="grid" style="grid-template-columns: repeat(4, 1fr); gap: 10px;">' +
          '<div><small>Food Budget:</small><br><strong>LKR ' + calcs.total_food.toLocaleString(undefined, {minimumFractionDigits:2}) + '</strong></div>' +
          '<div><small>Total Budget:</small><br><strong>LKR ' + calcs.total_budget.toLocaleString(undefined, {minimumFractionDigits:2}) + '</strong></div>' +
          '<div><small>Net Payable:</small><br><strong style="color:#1F5C3A">LKR ' + calcs.net_payable.toLocaleString(undefined, {minimumFractionDigits:2}) + '</strong></div>' +
          '<div><small>Savings:</small><br><strong>LKR ' + calcs.savings.toLocaleString(undefined, {minimumFractionDigits:2}) + '</strong></div>' +
        '</div>' +
      '</div>' +
    '</div>';
  } else {
    html += '<div class="panel" style="text-align:center; padding:40px; color:#888;"><h3>Please select a House / Mother above to enter data.</h3></div>';
  }
  
  html += '<div class="panel" style="overflow-x:auto;">' +
    '<h3>Summary Overview</h3>' +
    '<table class="data-table" style="min-width: 1000px; font-size: 13px;">' +
      '<thead>' +
        '<tr style="background:#f8f9fa;">' +
          '<th>House No</th>' +
          '<th>Assigned Mother</th>' +
          '<th style="text-align:center" colspan="2">Food</th>' +
          '<th style="text-align:center" colspan="2">Clothing</th>' +
          '<th style="text-align:center">HH</th>' +
          '<th style="text-align:center">Mother</th>' +
          '<th>Aunt Amt</th>' +
          '<th>Adjustments</th>' +
          '<th style="background:#e8f4f8">Total Budget</th>' +
          '<th style="background:#e8f4f8">Net Payable</th>' +
        '</tr>' +
      '</thead>' +
      '<tbody>';
      
  sortedHouses.forEach(function(h) {
    var counts = window.fbState.childCounts.find(function(c) { return c.house_id === h.id; }) || {};
    var calcs = calculateHouseBudget(counts, window.fbState.rateVariables);
    var cMotherName = fbGetMotherName(pName, h.house_no);
    var isSel = (hId === h.id) ? 'background:#eafaf1; font-weight:bold;' : '';
    
    html += 
      '<tr style="'+isSel+' cursor:pointer;" onclick="fbEditHouseForm(\''+h.id+'\')">' +
        '<td><strong>' + h.house_no + '</strong></td>' +
        '<td>' + cMotherName + '</td>' +
        '<td>' + (counts.food_o12 || 0) + '</td>' +
        '<td>' + (counts.food_u12 || 0) + '</td>' +
        '<td>' + (counts.clothing_o12 || 0) + '</td>' +
        '<td>' + (counts.clothing_u12 || 0) + '</td>' +
        '<td>' + (counts.household || 0) + '</td>' +
        '<td>' + (counts.mother_count || 0) + '</td>' +
        '<td>' + (counts.aunt_amount || 0) + '</td>' +
        '<td>' + (counts.adjustment || 0) + '</td>' +
        '<td style="background:#f4f9fb; font-weight:bold;">' + calcs.total_budget.toLocaleString(undefined, {minimumFractionDigits:2}) + '</td>' +
        '<td style="background:#f4f9fb; font-weight:bold; color:#1F5C3A">' + calcs.net_payable.toLocaleString(undefined, {minimumFractionDigits:2}) + '</td>' +
      '</tr>';
  });
  
  html += '</tbody></table></div>';
  container.innerHTML = html;
}

window.fbDownloadTemplate = function() {
  if (!window.XLSX) return alert('Excel library not loaded.');
  var ws_data = [['House No', 'Mother', 'Food >12', 'Food <12', 'Clothing >12', 'Clothing <12', 'HH Count', 'Mother Count', 'Aunt Amt', 'Adjustments']];
  var pName = window.fbState.activeProject.name;
  
  window.fbState.houses.forEach(function(h) {
    var counts = window.fbState.childCounts.find(function(c) { return c.house_id === h.id; }) || {};
    ws_data.push([
      h.house_no, fbGetMotherName(pName, h.house_no), 
      counts.food_o12 || 0, counts.food_u12 || 0,
      counts.clothing_o12 || 0, counts.clothing_u12 || 0,
      counts.household || 0, counts.mother_count || 0,
      counts.aunt_amount || 0, counts.adjustment || 0
    ]);
  });
  
  var ws = XLSX.utils.aoa_to_sheet(ws_data);
  var wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Data Entry");
  XLSX.writeFile(wb, window.fbState.activeProject.name + "_Summary_" + window.fbState.activeYear + "_" + window.fbState.activeMonth + ".xlsx");
};

window.fbUpdateCount = function(houseId, field, val) {
  var pid = window.fbState.activeProject.id;
  var y = window.fbState.activeYear;
  var m = window.fbState.activeMonth;
  
  var existing = window.fbState.childCounts.find(function(c) { return c.house_id === houseId; });
  if (!existing) existing = {};
  
  existing.project_id = pid;
  existing.year = y;
  existing.month = m;
  existing.house_id = houseId;
  existing[field] = Number(val);
  
  supabase.from('fb_child_counts').upsert([existing], { onConflict: 'project_id, year, month, house_id' }).then(function(res) {
    if (res.error) throw res.error;
    var idx = window.fbState.childCounts.findIndex(function(c) { return c.house_id === houseId; });
    if(idx > -1) window.fbState.childCounts[idx] = existing;
    else window.fbState.childCounts.push(existing);
    fbRenderSubView();
  }).catch(function(e) {
    alert('Error saving data: ' + e.message);
  });
};

function fbRenderHistory(container) {
  container.innerHTML = '<div class="panel"><h2>Audit Logs & History</h2><p>Coming in next iteration.</p></div>';
}

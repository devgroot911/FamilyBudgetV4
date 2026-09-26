// FB Calculator Module (Vanilla JS - Strict ES5/ES6 Promise chains, NO async/await, NO ?., NO ??)
// Strictly additive, no modification to existing app.js internals.

window.fbState = {
  projects: [],
  myProjects: [],
  activeProject: null,
  activeYear: 2025,
  activeMonth: 1,
  houses: [],
  childCounts: [],
  rateVariables: [],
  monthlySummary: null,
  currentSubView: 'projects',
  loading: false
};

var DEFAULT_RATES = {
  food_o12_rate: 15000,
  food_u12_rate: 10000,
  clothing_o12_rate: 2500,
  clothing_u12_rate: 2000,
  household_rate: 5000,
  mother_food_rate: 18000,
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
  if (role.indexOf('national') !== -1) return 'national';
  if (role.indexOf('accountant') !== -1) return 'accountant';
  if (role.indexOf('assistant') !== -1) return 'assistant';
  return 'viewer';
}

function canAccessFb() {
  var r = getFbRole();
  return r === 'admin' || r === 'national' || r === 'accountant' || r === 'assistant';
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

function loadFbData() {
  window.fbState.loading = true;
  fbRenderSubView();
  
  var role = getFbRole();
  var username = sessionStorage.getItem('username');
  
  supabase.from('fb_projects').select('*').then(function(res) {
    if (res.error) throw res.error;
    var projects = res.data || [];
    
    if (role === 'admin' || role === 'national') {
      window.fbState.myProjects = projects;
      window.fbState.loading = false;
      fbRenderSubView();
    } else {
      supabase.from('fb_project_users').select('project_id').eq('username', username).then(function(upRes) {
        if (upRes.error) throw upRes.error;
        var myIds = (upRes.data || []).map(function(up) { return up.project_id; });
        window.fbState.myProjects = projects.filter(function(p) { return myIds.indexOf(p.id) !== -1; });
        window.fbState.loading = false;
        fbRenderSubView();
      }).catch(function(err) {
        console.error(err);
        alert('Failed to load user projects: ' + err.message);
        window.fbState.loading = false;
        fbRenderSubView();
      });
    }
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
      
      var missingMothers = villageMothers.filter(function(uname) {
        return !window.fbState.houses.find(function(h) { return h.mother_username === uname; });
      });
      
      if (missingMothers.length > 0) {
        var newHouses = missingMothers.map(function(uname, idx) {
          return { project_id: pid, house_no: 'Auto-' + uname, mother_username: uname };
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
  
  var container = document.querySelector('#view-fb-calculator');
  container.innerHTML = 
    '<div class="fb-layout">' +
      '<div class="fb-sidebar panel">' +
        '<h3 style="margin-top:0">FB Calculator</h3>' +
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
      // NOTE: Using properly escaped quotes for the onclick attribute
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
  window.fbState.currentSubView = 'dashboard';
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
  
  var html = 
    '<div class="panel">' +
      '<div class="section-heading"><div><h2>Rate Variables</h2><small>For ' + window.fbState.activeYear + '/' + window.fbState.activeMonth + '</small></div></div>' +
      '<div class="table-wrap">' +
        '<table>' +
          '<thead><tr><th>Variable</th><th>Value</th></tr></thead>' +
          '<tbody>' +
            Object.keys(DEFAULT_RATES).map(function(k) {
              return '<tr>' +
                '<td><strong>' + k + '</strong></td>' +
                '<td><input type="number" step="0.0001" value="' + getRate(k) + '" id="rate_' + k + '" class="fb-rate-input" /></td>' +
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


function fbRenderEntry(container) {
  var p = window.fbState.activeProject;
  if (!p) return;
  
  var html = 
    '<div class="panel" style="margin-bottom: 20px;">' +
      '<div class="section-heading" style="display:flex; justify-content:space-between; align-items:center;">' +
        '<div><h2>Data Entry</h2><small>Enter monthly allocations or import from Excel</small></div>' +
        '<div style="display:flex; gap:10px;">' +
          '<button class="ghost-button" onclick="fbDownloadTemplate()">&#11015; Excel Template</button>' +
          '<label class="primary-button" style="cursor:pointer; margin:0; display:flex; align-items:center;">&#11014; Upload Excel<input type="file" id="fb-excel-upload" accept=".xlsx, .xls" style="display:none" onchange="fbHandleExcelUpload(event)"></label>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div class="panel" style="overflow-x:auto;">' +
      '<div class="table-wrap">' +
        '<table class="data-table" style="min-width: 1200px; font-size: 13px;">' +
          '<thead>' +
            '<tr style="background:#f8f9fa;">' +
              '<th>House No</th>' +
              '<th>Mother</th>' +
              '<th style="text-align:center" colspan="2">Food</th>' +
              '<th style="text-align:center" colspan="2">Clothing</th>' +
              '<th style="text-align:center">HH</th>' +
              '<th style="text-align:center">Mother</th>' +
              '<th>Aunt Amt</th>' +
              '<th>Adjustments</th>' +
              '<th style="background:#e8f4f8">Total Budget</th>' +
              '<th style="background:#e8f4f8">Net Payable</th>' +
            '</tr>' +
            '<tr style="font-size: 11px; color:#666; background:#f8f9fa;">' +
              '<th></th><th></th><th>Over 12</th><th>Under 12</th><th>Over 12</th><th>Under 12</th><th>Count</th><th>Count</th><th>LKR</th><th>LKR</th><th style="background:#e8f4f8">Calc</th><th style="background:#e8f4f8">Calc</th>' +
            '</tr>' +
          '</thead>' +
          '<tbody>';
  
  window.fbState.houses.forEach(function(h) {
    var counts = window.fbState.childCounts.find(function(c) { return c.house_id === h.id; }) || {};
    var calcs = calculateHouseBudget(counts, window.fbState.rateVariables);
    var motherName = (window.state && window.state.profiles && window.state.profiles[h.mother_username]) ? window.state.profiles[h.mother_username].name : h.mother_username;
    
    html += 
      '<tr>' +
        '<td><strong>' + h.house_no + '</strong></td>' +
        '<td>' + motherName + '</td>' +
        '<td><input type="number" min="0" style="width:50px; padding:4px;" value="' + (counts.food_o12 || 0) + '" onchange="fbUpdateCount('' + h.id + '', 'food_o12', this.value)" /></td>' +
        '<td><input type="number" min="0" style="width:50px; padding:4px;" value="' + (counts.food_u12 || 0) + '" onchange="fbUpdateCount('' + h.id + '', 'food_u12', this.value)" /></td>' +
        '<td><input type="number" min="0" style="width:50px; padding:4px;" value="' + (counts.clothing_o12 || 0) + '" onchange="fbUpdateCount('' + h.id + '', 'clothing_o12', this.value)" /></td>' +
        '<td><input type="number" min="0" style="width:50px; padding:4px;" value="' + (counts.clothing_u12 || 0) + '" onchange="fbUpdateCount('' + h.id + '', 'clothing_u12', this.value)" /></td>' +
        '<td><input type="number" min="0" style="width:50px; padding:4px;" value="' + (counts.household || 0) + '" onchange="fbUpdateCount('' + h.id + '', 'household', this.value)" /></td>' +
        '<td><input type="number" min="0" style="width:50px; padding:4px;" value="' + (counts.mother_count || 0) + '" onchange="fbUpdateCount('' + h.id + '', 'mother_count', this.value)" /></td>' +
        '<td><input type="number" min="0" step="100" style="width:70px; padding:4px;" value="' + (counts.aunt_amount || 0) + '" onchange="fbUpdateCount('' + h.id + '', 'aunt_amount', this.value)" /></td>' +
        '<td><input type="number" step="100" style="width:70px; padding:4px;" value="' + (counts.adjustment || 0) + '" onchange="fbUpdateCount('' + h.id + '', 'adjustment', this.value)" placeholder="Adj." title="Adjustments/Arrears/Festival" /></td>' +
        '<td style="background:#f4f9fb; font-weight:bold;">' + calcs.total_budget.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2}) + '</td>' +
        '<td style="background:#f4f9fb; font-weight:bold; color:#1F5C3A">' + calcs.net_payable.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2}) + '</td>' +
      '</tr>';
  });
  
  html += 
          '</tbody>' +
        '</table>' +
      '</div>' +
    '</div>';
  container.innerHTML = html;
}

window.fbDownloadTemplate = function() {
  if (!window.XLSX) return alert('Excel library not loaded.');
  var ws_data = [
    ['House No', 'Mother', 'Food >12', 'Food <12', 'Clothing >12', 'Clothing <12', 'HH Count', 'Mother Count', 'Aunt Amt', 'Adjustments']
  ];
  
  window.fbState.houses.forEach(function(h) {
    var counts = window.fbState.childCounts.find(function(c) { return c.house_id === h.id; }) || {};
    var motherName = (window.state && window.state.profiles && window.state.profiles[h.mother_username]) ? window.state.profiles[h.mother_username].name : h.mother_username;
    ws_data.push([
      h.house_no, motherName, 
      counts.food_o12 || 0, counts.food_u12 || 0,
      counts.clothing_o12 || 0, counts.clothing_u12 || 0,
      counts.household || 0, counts.mother_count || 0,
      counts.aunt_amount || 0, counts.adjustment || 0
    ]);
  });
  
  var ws = XLSX.utils.aoa_to_sheet(ws_data);
  
  // Basic styling for header
  var range = XLSX.utils.decode_range(ws['!ref']);
  for(var C = range.s.c; C <= range.e.c; ++C) {
    var addr = XLSX.utils.encode_cell({r:0, c:C});
    if(!ws[addr]) continue;
    ws[addr].s = { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "4A90E2" } } };
  }
  
  var wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Data Entry");
  XLSX.writeFile(wb, window.fbState.activeProject.name + "_Template_" + window.fbState.activeYear + "_" + window.fbState.activeMonth + ".xlsx");
};

window.fbHandleExcelUpload = function(event) {
  var file = event.target.files[0];
  if (!file || !window.XLSX) return;
  var reader = new FileReader();
  reader.onload = function(e) {
    var data = new Uint8Array(e.target.result);
    var workbook = XLSX.read(data, {type: 'array'});
    var sheet = workbook.Sheets[workbook.SheetNames[0]];
    var json = XLSX.utils.sheet_to_json(sheet, {header: 1});
    
    // Skip header row [0]
    var updates = [];
    var pid = window.fbState.activeProject.id;
    var y = window.fbState.activeYear;
    var m = window.fbState.activeMonth;
    
    for (var i = 1; i < json.length; i++) {
      var row = json[i];
      if (!row || row.length < 1) continue;
      var houseNo = String(row[0]);
      var house = window.fbState.houses.find(function(h) { return h.house_no === houseNo; });
      if (house) {
        updates.push({
          project_id: pid, year: y, month: m, house_id: house.id,
          food_o12: Number(row[2]) || 0, food_u12: Number(row[3]) || 0,
          clothing_o12: Number(row[4]) || 0, clothing_u12: Number(row[5]) || 0,
          household: Number(row[6]) || 0, mother_count: Number(row[7]) || 0,
          aunt_amount: Number(row[8]) || 0, adjustment: Number(row[9]) || 0
        });
      }
    }
    
    if (updates.length > 0) {
      window.fbState.loading = true;
      fbRenderSubView();
      supabase.from('fb_child_counts').upsert(updates, { onConflict: 'project_id, year, month, house_id' }).then(function(res) {
        if (res.error) throw res.error;
        alert('Imported ' + updates.length + ' rows successfully!');
        loadProjectData(); // refresh full state
      }).catch(function(err) {
        window.fbState.loading = false;
        fbRenderSubView();
        alert('Upload failed: ' + err.message);
      });
    }
  };
  reader.readAsArrayBuffer(file);
};

window.fbUpdateHouse = function(houseId, val) {
  supabase.from('fb_houses').update({ house_no: val }).eq('id', houseId).then(function(res) {
    if (res.error) throw res.error;
    var h = window.fbState.houses.find(function(x) { return x.id === houseId; });
    if(h) h.house_no = val;
    fbRenderSubView();
  }).catch(function(e) {
    alert('Error updating house no: ' + e.message);
  });
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

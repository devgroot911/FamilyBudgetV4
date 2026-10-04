const fs = require('fs');
let code = fs.readFileSync('fb_calculator.js', 'utf8');

const newLoadProjectData = `function loadProjectData() {
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
        return !window.fbState.houses.find(function(h) { return h.house_no === String(hNum); });
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
}`;

code = code.replace(/function loadProjectData\(\) \{[\s\S]*?\}\n\nwindow\.renderFbCalculator/, newLoadProjectData + '\n\nwindow.renderFbCalculator');

const newRenderEntry = `function fbRenderEntry(container) {
  var p = window.fbState.activeProject;
  if (!p) return;
  
  var pName = p.name;
  
  var html = 
    '<div class="panel" style="margin-bottom: 20px;">' +
      '<div class="section-heading" style="display:flex; justify-content:space-between; align-items:center;">' +
        '<div><h2>Data Entry</h2><small>House assignments are strictly linked to the Manage Users table</small></div>' +
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
            '<tr style="font-size: 11px; color:#666; background:#f8f9fa;">' +
              '<th></th><th></th><th>Over 12</th><th>Under 12</th><th>Over 12</th><th>Under 12</th><th>Count</th><th>Count</th><th>LKR</th><th>LKR</th><th style="background:#e8f4f8">Calc</th><th style="background:#e8f4f8">Calc</th>' +
            '</tr>' +
          '</thead>' +
          '<tbody>';
  
  window.fbState.houses.forEach(function(h) {
    var counts = window.fbState.childCounts.find(function(c) { return c.house_id === h.id; }) || {};
    var calcs = calculateHouseBudget(counts, window.fbState.rateVariables);
    
    // STRICTLY align with the users entrys
    var currentMotherName = 'Unassigned';
    var currentMotherUsername = '';
    
    if (window.state && window.state.profiles) {
      Object.keys(window.state.profiles).forEach(function(uname) {
        var prof = window.state.profiles[uname];
        if (prof.village && prof.village.toLowerCase() === pName.toLowerCase() && String(prof.house) === String(h.house_no)) {
          var isMother = (prof.role && prof.role.toLowerCase() === 'mother') || (prof.usertype && prof.usertype.toLowerCase().indexOf('mother') !== -1);
          if (isMother) {
            currentMotherName = prof.name;
            currentMotherUsername = uname;
          }
        }
      });
    }
    
    html += 
      '<tr>' +
        '<td><strong>' + h.house_no + '</strong></td>' +
        '<td>' + currentMotherName + '<br><small style="color:#888">' + (currentMotherUsername ? '(' + currentMotherUsername + ')' : 'Edit in Manage Users') + '</small></td>' +
        '<td><input type="number" min="0" style="width:50px; padding:4px;" value="' + (counts.food_o12 || 0) + '" onchange="fbUpdateCount(\\'' + h.id + '\\', \\'food_o12\\', this.value)" /></td>' +
        '<td><input type="number" min="0" style="width:50px; padding:4px;" value="' + (counts.food_u12 || 0) + '" onchange="fbUpdateCount(\\'' + h.id + '\\', \\'food_u12\\', this.value)" /></td>' +
        '<td><input type="number" min="0" style="width:50px; padding:4px;" value="' + (counts.clothing_o12 || 0) + '" onchange="fbUpdateCount(\\'' + h.id + '\\', \\'clothing_o12\\', this.value)" /></td>' +
        '<td><input type="number" min="0" style="width:50px; padding:4px;" value="' + (counts.clothing_u12 || 0) + '" onchange="fbUpdateCount(\\'' + h.id + '\\', \\'clothing_u12\\', this.value)" /></td>' +
        '<td><input type="number" min="0" style="width:50px; padding:4px;" value="' + (counts.household || 0) + '" onchange="fbUpdateCount(\\'' + h.id + '\\', \\'household\\', this.value)" /></td>' +
        '<td><input type="number" min="0" style="width:50px; padding:4px;" value="' + (counts.mother_count || 0) + '" onchange="fbUpdateCount(\\'' + h.id + '\\', \\'mother_count\\', this.value)" /></td>' +
        '<td><input type="number" min="0" step="100" style="width:70px; padding:4px;" value="' + (counts.aunt_amount || 0) + '" onchange="fbUpdateCount(\\'' + h.id + '\\', \\'aunt_amount\\', this.value)" /></td>' +
        '<td><input type="number" step="100" style="width:70px; padding:4px;" value="' + (counts.adjustment || 0) + '" onchange="fbUpdateCount(\\'' + h.id + '\\', \\'adjustment\\', this.value)" placeholder="Adj." title="Adjustments/Arrears/Festival" /></td>' +
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
}`;

code = code.replace(/function fbRenderEntry\(container\) \{[\s\S]*?\}\n\nwindow\.fbDownloadTemplate/, newRenderEntry + '\n\nwindow.fbDownloadTemplate');

fs.writeFileSync('fb_calculator.js', code);

const fs = require('fs');
let code = fs.readFileSync('fb_calculator.js', 'utf8');

const newEntry = `
function fbRenderEntry(container) {
  var p = window.fbState.activeProject;
  if (!p) return;
  
  // Get mothers in this village for the dropdown
  var projectName = p.name;
  var villageMothers = [];
  if (window.state && window.state.profiles) {
    villageMothers = Object.keys(window.state.profiles).filter(function(uname) {
      var prof = window.state.profiles[uname];
      var isMother = (prof.role && prof.role.toLowerCase() === 'mother') || (prof.usertype && prof.usertype.toLowerCase().indexOf('mother') !== -1);
      return isMother && prof.village && projectName.toLowerCase().indexOf(prof.village.toLowerCase()) !== -1;
    });
  }
  
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
    
    var motherSelect = '<select onchange="fbUpdateHouseMother(\\'' + h.id + '\\', this.value)" style="width:120px; padding:4px;">';
    motherSelect += '<option value="">-- Unassigned --</option>';
    villageMothers.forEach(function(uname) {
      var prof = window.state.profiles[uname];
      var selected = (h.mother_username === uname) ? 'selected' : '';
      motherSelect += '<option value="' + uname + '" ' + selected + '>' + prof.name + '</option>';
    });
    // Fallback if current mother isn't in village
    if (h.mother_username && villageMothers.indexOf(h.mother_username) === -1) {
      var extraName = (window.state && window.state.profiles && window.state.profiles[h.mother_username]) ? window.state.profiles[h.mother_username].name : h.mother_username;
      motherSelect += '<option value="' + h.mother_username + '" selected>' + extraName + ' (Other)</option>';
    }
    motherSelect += '</select>';
    
    html += 
      '<tr>' +
        '<td><input type="text" style="width:70px; padding:4px;" value="' + h.house_no + '" onchange="fbUpdateHouse(\\'' + h.id + '\\', this.value)" /></td>' +
        '<td>' + motherSelect + '</td>' +
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
}
`;

code = code.replace(/function fbRenderEntry\(container\) \{[\s\S]*?window\.fbUpdateHouse = function\(houseId, val\) \{/, newEntry + '\nwindow.fbUpdateHouse = function(houseId, val) {');

const updateMotherFunc = `
window.fbUpdateHouseMother = function(houseId, val) {
  supabase.from('fb_houses').update({ mother_username: val }).eq('id', houseId).then(function(res) {
    if (res.error) throw res.error;
    var h = window.fbState.houses.find(function(x) { return x.id === houseId; });
    if(h) h.mother_username = val;
    fbRenderSubView();
  }).catch(function(e) {
    alert('Error updating assigned mother: ' + e.message);
  });
};
`;

code = code.replace(/window\.fbUpdateHouse = function\(houseId, val\) \{/, updateMotherFunc + '\nwindow.fbUpdateHouse = function(houseId, val) {');

fs.writeFileSync('fb_calculator.js', code);

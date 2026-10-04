const fs = require('fs');
let code = fs.readFileSync('fb_calculator.js', 'utf8');

const newEntry = `
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
        '<td><input type="number" min="0" style="width:50px; padding:4px;" value="' + (counts.food_o12 || 0) + '" onchange="fbUpdateCount(\'' + h.id + '\', \'food_o12\', this.value)" /></td>' +
        '<td><input type="number" min="0" style="width:50px; padding:4px;" value="' + (counts.food_u12 || 0) + '" onchange="fbUpdateCount(\'' + h.id + '\', \'food_u12\', this.value)" /></td>' +
        '<td><input type="number" min="0" style="width:50px; padding:4px;" value="' + (counts.clothing_o12 || 0) + '" onchange="fbUpdateCount(\'' + h.id + '\', \'clothing_o12\', this.value)" /></td>' +
        '<td><input type="number" min="0" style="width:50px; padding:4px;" value="' + (counts.clothing_u12 || 0) + '" onchange="fbUpdateCount(\'' + h.id + '\', \'clothing_u12\', this.value)" /></td>' +
        '<td><input type="number" min="0" style="width:50px; padding:4px;" value="' + (counts.household || 0) + '" onchange="fbUpdateCount(\'' + h.id + '\', \'household\', this.value)" /></td>' +
        '<td><input type="number" min="0" style="width:50px; padding:4px;" value="' + (counts.mother_count || 0) + '" onchange="fbUpdateCount(\'' + h.id + '\', \'mother_count\', this.value)" /></td>' +
        '<td><input type="number" min="0" step="100" style="width:70px; padding:4px;" value="' + (counts.aunt_amount || 0) + '" onchange="fbUpdateCount(\'' + h.id + '\', \'aunt_amount\', this.value)" /></td>' +
        '<td><input type="number" step="100" style="width:70px; padding:4px;" value="' + (counts.adjustment || 0) + '" onchange="fbUpdateCount(\'' + h.id + '\', \'adjustment\', this.value)" placeholder="Adj." title="Adjustments/Arrears/Festival" /></td>' +
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
`;

code = code.replace(/function fbRenderEntry\(container\) \{[\s\S]*?window\.fbUpdateHouse = function\(houseId, val\) \{/, newEntry + '\nwindow.fbUpdateHouse = function(houseId, val) {');

fs.writeFileSync('fb_calculator.js', code);

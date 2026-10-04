const fs = require('fs');

const bulkLogic = `

// ------------------------------------------------------------------
// Bulk Import (Excel)
// ------------------------------------------------------------------
function fbRenderBulk(container) {
  var html = '<div class="panel" style="padding:20px;">' +
    '<div class="section-heading" style="margin-bottom:20px;"><div><h2 style="margin:0; font-size:18px;">Bulk Import (Excel)</h2><small>' + window.fbState.activeVillage + ' - ' + window.fbState.activeYear + '-' + window.fbState.activeMonth + '</small></div></div>' +
    '<p><strong>Step 1:</strong> Download the pre-formatted Excel template for this village and month.</p>' +
    '<button class="primary-button" style="margin-bottom:20px;" onclick="fbDownloadBulkTemplate()">Download Template</button>' +
    '<hr style="margin:20px 0; border:0; border-top:1px solid #eee;">' +
    '<p><strong>Step 2:</strong> Upload your completed Excel file to calculate budgets for all houses at once.</p>' +
    '<input type="file" id="fb-bulk-upload" accept=".xlsx, .xls" style="margin-bottom:10px; display:block;" />' +
    '<button class="primary-button" onclick="fbProcessBulkUpload()">Process & Validate</button>' +
    '<div id="fb-bulk-errors" style="margin-top:15px; color:#e74c3c; font-weight:bold;"></div>' +
  '</div>';
  container.innerHTML = html;
}

window.fbDownloadBulkTemplate = function() {
  var vName = window.fbState.activeVillage;
  if (!vName) return fbAlert('No village selected.');
  
  var houses = getVillageHouses(vName);
  
  // Sheet 1: Current Entries
  var ws1_data = [['House No', 'Project Name', 'Children (Over 12)', 'Children (Under 12)', 'Mother Count', 'Aunt Amount', 'Adjustment', 'Festival', 'Clothing Withdrawal', 'Household Withdrawal', 'Interest Earned', 'Arrears / Bank Charges']];
  
  // Sheet 2: Opening Balances (Optional Fallback)
  var ws2_data = [['House No', 'Food Balance', 'Clothing Balance', 'Household Balance', 'Interest Balance']];

  houses.forEach(function(h) {
    ws1_data.push([h.house_no, vName, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0]);
    ws2_data.push([h.house_no, '', '', '', '']);
  });

  var wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(ws1_data), "Current Entries");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(ws2_data), "Opening Balances");
  
  var filename = 'Bulk_Import_Template_' + vName.replace(/\\s+/g, '_') + '_' + window.fbState.activeYear + '_' + window.fbState.activeMonth + '.xlsx';
  XLSX.writeFile(wb, filename);
};

window.fbProcessBulkUpload = function() {
  var fileInput = document.getElementById('fb-bulk-upload');
  var errorDiv = document.getElementById('fb-bulk-errors');
  errorDiv.innerHTML = '';
  
  if (!fileInput.files || !fileInput.files[0]) return fbAlert('Please select an Excel file first.');
  var file = fileInput.files[0];
  var reader = new FileReader();
  
  reader.onload = function(e) {
    try {
      var data = new Uint8Array(e.target.result);
      var workbook = XLSX.read(data, {type: 'array'});
      fbValidateAndCalculateBulk(workbook);
    } catch(err) {
      errorDiv.innerHTML = 'Error reading Excel file: ' + err.message;
    }
  };
  reader.readAsArrayBuffer(file);
};

function fbValidateAndCalculateBulk(workbook) {
  var errorDiv = document.getElementById('fb-bulk-errors');
  var vName = window.fbState.activeVillage;
  var houses = getVillageHouses(vName);
  var expectedHouseNumbers = houses.map(function(h) { return String(h.house_no); });
  
  var sheet1Name = workbook.SheetNames[0];
  var sheet2Name = workbook.SheetNames[1];
  
  if (!sheet1Name) return errorDiv.innerHTML = 'Excel file must have at least one sheet.';
  var ws1 = XLSX.utils.sheet_to_json(workbook.Sheets[sheet1Name]);
  var ws2 = sheet2Name ? XLSX.utils.sheet_to_json(workbook.Sheets[sheet2Name]) : [];
  
  var errors = [];
  var parsedData = {};
  
  // Validate Project Completeness
  var uploadedHouses = [];
  ws1.forEach(function(row) {
    if (row['House No'] !== undefined) uploadedHouses.push(String(row['House No']));
  });
  
  expectedHouseNumbers.forEach(function(hn) {
    if (uploadedHouses.indexOf(hn) === -1) {
      errors.push('House ' + hn + ' is missing from Sheet 1.');
    }
  });
  
  if (errors.length > 0) {
    return errorDiv.innerHTML = 'Validation Failed:<br>• ' + errors.join('<br>• ');
  }
  
  var allPayloads = [];
  var allCalcs = [];
  
  ws1.forEach(function(row) {
    var houseNo = String(row['House No']);
    if (expectedHouseNumbers.indexOf(houseNo) === -1) return; // Ignore houses not in this project
    var houseData = houses.find(function(h) { return String(h.house_no) === houseNo; });
    
    // Type Integrity Check
    var getNum = function(val, label) {
      if (val === undefined || val === null || val === '') return 0;
      var n = Number(val);
      if (isNaN(n)) errors.push('House ' + houseNo + ': ' + label + ' must be a valid number. Found: "' + val + '"');
      return n;
    };
    
    var counts = {
      food_o12: getNum(row['Children (Over 12)'], 'Children (Over 12)'),
      food_u12: getNum(row['Children (Under 12)'], 'Children (Under 12)'),
      mother_count: getNum(row['Mother Count'], 'Mother Count'),
      aunt_amount: getNum(row['Aunt Amount'], 'Aunt Amount'),
      adjustment: getNum(row['Adjustment'], 'Adjustment'),
      festival: getNum(row['Festival'], 'Festival'),
      clothing_o12: getNum(row['Clothing Withdrawal'], 'Clothing Withdrawal'), // mapped correctly
      clothing_u12: getNum(row['Household Withdrawal'], 'Household Withdrawal'), // mapped correctly
      household: getNum(row['Interest Earned'], 'Interest Earned'), // mapped correctly
      arrears: getNum(row['Arrears / Bank Charges'], 'Arrears / Bank Charges') // mapped correctly
    };
    
    // Historical Continuity Check
    var prevBalances = getPreviousBalances(houseNo, window.fbState.activeYear, window.fbState.activeMonth);
    var openingObj = undefined;
    
    // If not found historically, check Sheet 2
    if (!prevBalances || (prevBalances.food === 0 && prevBalances.clothing === 0 && prevBalances.household === 0 && prevBalances.interest === 0 && !prevBalances.isManual)) {
      // Check Sheet 2
      var fallbackRow = ws2.find(function(r) { return String(r['House No']) === houseNo; });
      if (fallbackRow && (fallbackRow['Food Balance'] !== undefined || fallbackRow['Clothing Balance'] !== undefined)) {
        prevBalances = {
          food: getNum(fallbackRow['Food Balance'], 'Sheet 2: Food Balance'),
          clothing: getNum(fallbackRow['Clothing Balance'], 'Sheet 2: Clothing Balance'),
          household: getNum(fallbackRow['Household Balance'], 'Sheet 2: Household Balance'),
          interest: getNum(fallbackRow['Interest Balance'], 'Sheet 2: Interest Balance')
        };
        openingObj = { food: prevBalances.food, cloth: prevBalances.clothing, hh: prevBalances.household, int: prevBalances.interest };
      } else {
        // Did we actually have a previous month in DB?
        var historyRow = window.fbState.historicalCounts.find(function(h) { return String(h.house_no) === houseNo; });
        if (!historyRow) {
            errors.push('House ' + houseNo + ' is missing opening balances. Please provide them in Sheet 2 (Opening Balances).');
        }
      }
    } else {
       if (prevBalances.isManual) {
         var existing = window.fbState.childCounts.find(function(c) { return String(c.house_no) === String(houseNo); }) || {};
         if (existing.open_food !== undefined) {
             openingObj = { food: existing.open_food, cloth: existing.open_cloth, hh: existing.open_hh, int: existing.open_int };
         }
       }
    }
    
    parsedData[houseNo] = { counts: counts, prevBalances: prevBalances, houseData: houseData, openingObj: openingObj };
  });
  
  if (errors.length > 0) {
    return errorDiv.innerHTML = 'Validation Failed:<br>• ' + errors.join('<br>• ');
  }
  
  // Calculate Budgets
  Object.keys(parsedData).forEach(function(houseNo) {
    var d = parsedData[houseNo];
    var calcs = calculateHouseBudget(d.counts, window.fbState.rateVariables, d.prevBalances);
    
    allCalcs.push({
      houseNo: houseNo,
      totalBudget: calcs.total_budget,
      foodBalance: calcs.food_balance,
      clothingBalance: calcs.clothing_balance,
      householdBalance: calcs.household_balance,
      interestBalance: calcs.interest_balance
    });
    
    var existing = window.fbState.childCounts.find(function(c) { return String(c.house_no) === String(houseNo); }) || {};
    var payload = Object.assign({}, existing);
    
    payload.village = vName;
    payload.house_no = houseNo;
    payload.year = window.fbState.activeYear;
    payload.month = window.fbState.activeMonth;
    payload.updated_by = sessionStorage.getItem('username');
    payload.food_balance = calcs.food_balance;
    payload.clothing_balance = calcs.clothing_balance;
    payload.household_balance = calcs.household_balance;
    payload.interest_balance = calcs.interest_balance;
    payload.mother_name = d.houseData ? d.houseData.mother_name : '';
    
    if (d.openingObj) {
        payload.open_food = d.openingObj.food;
        payload.open_cloth = d.openingObj.cloth;
        payload.open_hh = d.openingObj.hh;
        payload.open_int = d.openingObj.int;
    }
    
    payload.remarks = JSON.stringify({ savings: calcs.savings, first_w: calcs.first_withdrawal, second_w: calcs.second_withdrawal, mother: payload.mother_name, transfers: [], opening: d.openingObj });
    
    // Copy counts to payload
    Object.keys(d.counts).forEach(function(k) { payload[k] = d.counts[k]; });
    allPayloads.push(payload);
  });
  
  // Show Summary Confirmation
  fbShowBulkSummary(allCalcs, allPayloads);
}

function fbShowBulkSummary(allCalcs, allPayloads) {
  window.fbPendingBulkPayloads = allPayloads;
  
  var html = '<div id="fb-modal-overlay" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:9999; display:flex; justify-content:center; align-items:center;">' +
    '<div class="panel" style="width:90%; max-width:800px; max-height:90vh; overflow-y:auto; padding:20px; box-shadow:0 10px 30px rgba(0,0,0,0.2);">' +
      '<h2 style="margin-top:0;">Bulk Calculation Summary</h2>' +
      '<p>Review the calculated end balances below. If they look correct, click Confirm to save all houses to the cloud.</p>' +
      '<div class="fb-table-wrap" style="max-height:50vh; overflow-y:auto; margin-bottom:20px;">' +
        '<table class="fb-data-table">' +
          '<thead><tr><th>House</th><th>Total Allocated</th><th>Food Bal</th><th>Clothing Bal</th><th>HH Bal</th><th>Interest Bal</th></tr></thead>' +
          '<tbody>';
          
  allCalcs.forEach(function(c) {
    html += '<tr>' +
      '<td>' + c.houseNo + '</td>' +
      '<td>' + c.totalBudget.toLocaleString(undefined, {minimumFractionDigits:2}) + '</td>' +
      '<td>' + c.foodBalance.toLocaleString(undefined, {minimumFractionDigits:2}) + '</td>' +
      '<td>' + c.clothingBalance.toLocaleString(undefined, {minimumFractionDigits:2}) + '</td>' +
      '<td>' + c.householdBalance.toLocaleString(undefined, {minimumFractionDigits:2}) + '</td>' +
      '<td>' + c.interestBalance.toLocaleString(undefined, {minimumFractionDigits:2}) + '</td>' +
    '</tr>';
  });
          
  html += '</tbody></table></div>' +
      '<div style="display:flex; justify-content:flex-end; gap:10px;">' +
        '<button class="secondary-button" onclick="document.body.removeChild(document.getElementById(\\'fb-modal-overlay\\'))">Cancel</button>' +
        '<button class="primary-button" onclick="fbConfirmBulkSave()">Confirm & Save to Cloud</button>' +
      '</div>' +
    '</div>' +
  '</div>';
  
  var div = document.createElement('div');
  div.innerHTML = html;
  document.body.appendChild(div.firstChild);
}

window.fbConfirmBulkSave = function() {
  if (!window.fbPendingBulkPayloads || window.fbPendingBulkPayloads.length === 0) return;
  
  // Close modal
  var overlay = document.getElementById('fb-modal-overlay');
  if (overlay) document.body.removeChild(overlay);
  
  fbAlert('Saving ' + window.fbPendingBulkPayloads.length + ' records to cloud...');
  
  supabase.from('fb_child_counts').upsert(window.fbPendingBulkPayloads, { onConflict: 'village, year, month, house_no' })
    .then(function(res) {
      if (res.error) throw res.error;
      fbAlert('Bulk Import Successful! Saved ' + window.fbPendingBulkPayloads.length + ' records.');
      loadFbData();
    })
    .catch(function(err) {
      fbAlert('Error saving bulk data: ' + err.message);
    });
};
`;
fs.appendFileSync('C:\\Users\\Administrator\\Desktop\\Family budget V4\\fb_calculator.js', bulkLogic);
console.log("Appended successfully");

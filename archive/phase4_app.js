const fs = require('fs');
let appJs = fs.readFileSync('app.js', 'utf8');

// 1. Add isPublished helper
const helperCode = `
function isPublished(username, month) {
  return Number(state.allowances[username + '_' + month + '_9999']) === 1;
}

function setPublishedStatus(username, month, isPub) {
  var val = isPub ? 1 : 0;
  state.allowances[username + '_' + month + '_9999'] = val;
  var upsert = { user_username: username, month: month, category_id: 9999, amount: val };
  return supabase.from('allowances').upsert([upsert], { onConflict: 'user_username,month,category_id' });
}
`;

if (!appJs.includes('function isPublished')) {
  appJs = appJs.replace('function allowance(', helperCode + '\nfunction allowance(');
}

// 2. Update getVisibleExpenses to hide drafts from managers
const oldGetVisible = `      } else {
        // Filter strictly to current user's village
        return validExpenses.filter(function(e) {
          var expVillage = state.profiles && state.profiles[e.user] ? state.profiles[e.user].village : null;
          return expVillage === myVillage;
        });
      }
    }`;
const newGetVisible = `      } else {
        // Filter strictly to current user's village
        validExpenses = validExpenses.filter(function(e) {
          var expVillage = state.profiles && state.profiles[e.user] ? state.profiles[e.user].village : null;
          return expVillage === myVillage;
        });
      }

      // Filter out unpublished records for managers unless showDrafts is checked
      if (!window.recordState || !window.recordState.showDrafts) {
        validExpenses = validExpenses.filter(function(e) {
          return isPublished(e.user, e.date.substring(0, 7));
        });
      }
      return validExpenses;
    }`;
if (!appJs.includes('window.recordState.showDrafts')) {
  appJs = appJs.replace(oldGetVisible, newGetVisible);
}

// 3. Update recordState declaration
appJs = appJs.replace(
  /var recordState = \{ query: '', month: '', village: 'All', user: 'All' \};/g,
  `var recordState = { query: '', month: currentMonth(), village: 'All', user: 'All', showDrafts: false, publishMonth: currentMonth() };\nwindow.recordState = recordState;`
);

// 4. Update renderRecords to inject Publishing UI and Drafts checkbox
const oldHtmlGrid = `    if (isManager) {
      if (isNational) {`;
const newHtmlGrid = `    if (isManager) {
      html += '<div class="field" style="display:flex; align-items:flex-end; padding-bottom:8px;"><label style="display:flex; align-items:center; cursor:pointer;"><input type="checkbox" id="record-show-drafts" ' + (recordState.showDrafts ? 'checked' : '') + ' style="margin-right:8px"> Show Drafts</label></div>';
      if (isNational) {`;
appJs = appJs.replace(oldHtmlGrid, newHtmlGrid);

const oldTableEnd = `'</tbody></table></div>' +
    '</div>';`;
const newTableEnd = `'</tbody></table></div>' +
    '</div>';

    // Publish Panel for Mothers
    if (!isManager) {
      var isPub = isPublished(myName, recordState.publishMonth);
      var htmlPub = '<div class="panel content-gap">' +
        '<div class="section-heading"><div><h2>Monthly Publishing</h2><small>Publish records to managers</small></div></div>' +
        '<div class="form-grid">' +
          '<div class="field"><label>Month to Publish</label><input type="month" id="publish-month" value="' + recordState.publishMonth + '"></div>' +
          '<div class="field"><label>Status</label><div style="padding:10px; border-radius:4px; font-weight:bold; background:' + (isPub ? '#e6f4ea; color:#1e8e3e' : '#fce8e6; color:#d93025') + '">' + (isPub ? 'PUBLISHED (Locked for Managers)' : 'DRAFT (Not visible to Managers)') + '</div></div>' +
        '</div>' +
        '<div style="margin-top:16px;">' +
          (isPub ? '<button class="ghost-button" data-action="unpublish-records">Revert to Draft (Edit)</button>' : '<button class="primary-button" data-action="publish-records">Publish ' + recordState.publishMonth + ' Records</button>') +
        '</div>' +
      '</div>';
      html = htmlPub + html;
    }
`;
if (!appJs.includes('Monthly Publishing')) {
  appJs = appJs.replace(oldTableEnd, newTableEnd);
}

// 5. Update renderRecords Event Listeners for new inputs
const oldEventsEnd = `var userFilter = document.querySelector('#record-user');
    if (userFilter) userFilter.addEventListener('change', function(e) { recordState.user = e.target.value; renderRecords(); });`;
const newEventsEnd = `var userFilter = document.querySelector('#record-user');
    if (userFilter) userFilter.addEventListener('change', function(e) { recordState.user = e.target.value; renderRecords(); });
    
    var draftsCheck = document.querySelector('#record-show-drafts');
    if (draftsCheck) draftsCheck.addEventListener('change', function(e) { recordState.showDrafts = e.target.checked; renderRecords(); });
    
    var pubMonth = document.querySelector('#publish-month');
    if (pubMonth) pubMonth.addEventListener('change', function(e) { recordState.publishMonth = e.target.value; renderRecords(); });
    
    document.querySelectorAll('[data-action="publish-records"]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        setPublishedStatus(sessionStorage.getItem('username') || 'mother', recordState.publishMonth, true).then(function() { notify('Records published!'); renderRecords(); });
      });
    });
    document.querySelectorAll('[data-action="unpublish-records"]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        setPublishedStatus(sessionStorage.getItem('username') || 'mother', recordState.publishMonth, false).then(function() { notify('Reverted to draft.'); renderRecords(); });
      });
    });
`;
appJs = appJs.replace(oldEventsEnd, newEventsEnd);

// 6. Update renderReports for Manager Excel Export
const oldRenderReports = `function renderReports() {
    document.querySelector('#view-reports').innerHTML =
      '<div class="grid two-col">' +
        '<div class="panel">' +
          '<div class="section-heading"><div><h2>Past Records & Reports</h2><small>Create a local, printable report</small></div></div>' +`;

const newRenderReports = `function renderReports() {
    var role = (sessionStorage.getItem('role') || 'mother').toLowerCase();
    var isManager = role.indexOf('admin') !== -1 || role.indexOf('director') !== -1 || role.indexOf('accountant') !== -1 || role.indexOf('assistant') !== -1;
    
    var excelPanel = '';
    if (isManager && state.profiles) {
      var myName = sessionStorage.getItem('username') || 'mother';
      var myVillage = state.profiles[myName] ? state.profiles[myName].village : null;
      var isNational = (role === 'national_director' || role === 'accountant' || role === 'admin' || myVillage === 'All');
      var options = Object.keys(state.profiles).filter(function(u) {
        if (state.profiles[u].usertype && state.profiles[u].usertype.toLowerCase().indexOf('admin') !== -1) return false;
        if (isNational) return true;
        return state.profiles[u].village === myVillage;
      }).map(function(u) {
        return '<option value="' + escapeHtml(u) + '">' + escapeHtml(state.profiles[u].name || u) + ' (' + u + ')</option>';
      }).join('');
      
      excelPanel = '<div class="panel content-gap">' +
        '<div class="section-heading"><div><h2>Mother Level Excel Report</h2><small>Download formatted multi-sheet Excel</small></div></div>' +
        '<div class="form-grid">' +
          '<div class="field"><label>Mother</label><select id="excel-user">' + options + '</select></div>' +
          '<div class="field"><label>Month</label><input type="month" id="excel-month" value="' + currentMonth() + '"></div>' +
        '</div>' +
        '<div class="button-row"><button class="primary-button" data-action="export-excel">Download Excel</button></div>' +
      '</div>';
    }

    document.querySelector('#view-reports').innerHTML =
      excelPanel +
      '<div class="grid two-col">' +
        '<div class="panel">' +
          '<div class="section-heading"><div><h2>Past Records & Reports</h2><small>Create a local, printable report</small></div></div>' +`;
appJs = appJs.replace(oldRenderReports, newRenderReports);

// 7. Implement generateExcelReport function and button click listener
const oldExportEvents = `if (action === 'export-csv') exportCsv();`;
const newExportEvents = `if (action === 'export-csv') exportCsv();
      if (action === 'export-excel') {
        var eu = document.querySelector('#excel-user').value;
        var em = document.querySelector('#excel-month').value;
        generateExcelReport(eu, em);
      }`;
appJs = appJs.replace(oldExportEvents, newExportEvents);

const excelFunc = `
function generateExcelReport(username, month) {
  if (!window.XLSX) return notify('Excel library loading, try again in a moment');
  var profile = state.profiles && state.profiles[username] ? state.profiles[username] : {};
  var motherName = profile.name || username;
  var familyHouse = profile.house || 'N/A';
  
  // Get expenses strictly for this user and month
  // Override the getVisibleExpenses filter to pull drafts too if needed, but since managers only see published, let's bypass the manager filter explicitly for export by querying state directly.
  var list = (state.expenses || []).filter(function(e) {
    return e.user === username && e.date.indexOf(month) === 0;
  }).sort(function(a, b) { return a.date.localeCompare(b.date); });
  
  if (list.length === 0) return notify('No records found for ' + motherName + ' in ' + month);
  
  // Sheet 1: Expense Records
  var recordsData = [['Date', 'Item ID', 'Item Name', 'Category 1', 'Category 2 (Sub)', 'Quantity', 'Unit Price', 'Total Price']];
  var cat2Totals = {};
  var grandTotal = 0;
  var largestSingle = null;
  
  list.forEach(function(e) {
    var c1 = cat(e.category).name;
    var c2 = subcat(e.subcategory);
    var uPrice = Number(e.total) / (Number(e.quantity) || 1);
    recordsData.push([ e.date, e.id.substring(0,8), e.name, c1, c2, e.quantity, uPrice, e.total ]);
    
    grandTotal += Number(e.total);
    cat2Totals[c2] = (cat2Totals[c2] || 0) + Number(e.total);
    if (!largestSingle || Number(e.total) > Number(largestSingle.total)) {
      largestSingle = e;
    }
  });
  
  var ws1 = XLSX.utils.aoa_to_sheet(recordsData);
  // Formatting headers
  ws1['!cols'] = [{wch:12}, {wch:10}, {wch:30}, {wch:15}, {wch:20}, {wch:10}, {wch:12}, {wch:15}];
  
  // Sheet 2: Summary & Insights
  var largestCat2 = Object.keys(cat2Totals).reduce(function(a, b) { return cat2Totals[a] > cat2Totals[b] ? a : b; }, '');
  var insightsData = [
    ['REPORT METADATA', ''],
    ['Mother Name', motherName],
    ['Family House', familyHouse],
    ['Report Period', month],
    ['',''],
    ['TOTALS', ''],
    ['Grand Total Expenditure', grandTotal],
    ['',''],
    ['CATEGORY 2 SUMMARY', 'Total Expenditure']
  ];
  
  Object.keys(cat2Totals).forEach(function(k) {
    insightsData.push([k, cat2Totals[k]]);
  });
  
  insightsData.push(['','']);
  insightsData.push(['AI INSIGHTS', '']);
  insightsData.push(['Largest Category 2', largestCat2 + ' (' + money(cat2Totals[largestCat2]) + ' - ' + Math.round((cat2Totals[largestCat2]/grandTotal)*100) + '%)']);
  if (largestSingle) {
    insightsData.push(['Largest Single Expense', largestSingle.date + ' | ' + largestSingle.name + ' (' + money(largestSingle.total) + ')']);
  }
  
  var ws2 = XLSX.utils.aoa_to_sheet(insightsData);
  ws2['!cols'] = [{wch:35}, {wch:25}];
  
  var wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws1, 'Expense Records');
  XLSX.utils.book_append_sheet(wb, ws2, 'Summary & Insights');
  
  XLSX.writeFile(wb, 'Report_' + username + '_' + month + '.xlsx');
}
`;

if (!appJs.includes('generateExcelReport')) {
  appJs += '\n' + excelFunc;
}

fs.writeFileSync('app.js', appJs);
console.log('App JS rewritten for Publishing and Excel logic');

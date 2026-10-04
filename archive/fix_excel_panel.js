const fs = require('fs');
let appJs = fs.readFileSync('app.js', 'utf8');

const regex = /function renderReports\(\) \{\s*document\.querySelector\('#view-reports'\)\.innerHTML =\s*'<div class="grid two-col">' \+\s*'<div class="panel">' \+\s*'<div class="section-heading"><div><h2>Past Records & Reports<\/h2><small>Create a local, printable report<\/small><\/div><\/div>' \+/g;

const newString = `function renderReports() {
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

appJs = appJs.replace(regex, newString);

fs.writeFileSync('app.js', appJs);
console.log('Fixed Excel panel in renderReports');

const fs = require('fs');
let appJs = fs.readFileSync('app.js', 'utf8');

const regexReports = /var excelPanel = '';\s*if \(isManager && state\.profiles\) \{[\s\S]*?excelPanel = '<div class="panel content-gap">' \+[\s\S]*?<\/div>';\s*\}/;

const newReports = `var excelPanel = '';
    if (isManager && state.profiles) {
      var myName = sessionStorage.getItem('username') || 'mother';
      var myVillage = state.profiles[myName] ? state.profiles[myName].village : null;
      var isNational = (role === 'national_director' || role === 'accountant' || role === 'admin' || myVillage === 'All');
      
      var publishedReports = [];
      Object.keys(state.allowances || {}).forEach(function(key) {
        if (key.endsWith('_9999') && Number(state.allowances[key]) === 1) {
          var parts = key.split('_');
          var u = parts[0];
          var m = parts[1];
          if (state.profiles[u]) {
            if (state.profiles[u].usertype && state.profiles[u].usertype.toLowerCase().indexOf('admin') !== -1) return;
            if (isNational || state.profiles[u].village === myVillage) {
              publishedReports.push({ user: u, month: m, name: state.profiles[u].name || u, village: state.profiles[u].village });
            }
          }
        }
      });
      publishedReports.sort(function(a, b) { return b.month.localeCompare(a.month); });

      excelPanel = '<div class="panel content-gap">' +
        '<div class="section-heading"><div><h2>Published Mother Reports</h2><small>Download formatted multi-sheet Excel for locked months</small></div></div>' +
        (publishedReports.length ?
          '<div class="table-wrap"><table><thead><tr><th>Month</th><th>Mother</th><th>Village</th><th></th></tr></thead><tbody>' +
          publishedReports.map(function(r) {
            return '<tr><td><strong>' + r.month + '</strong></td><td>' + escapeHtml(r.name) + ' (' + escapeHtml(r.user) + ')</td><td>' + escapeHtml(r.village || 'N/A') + '</td><td><button class="primary-button" onclick="generateExcelReport(\\'' + escapeHtml(r.user) + '\\', \\'' + r.month + '\\')">Download Excel</button></td></tr>';
          }).join('') +
          '</tbody></table></div>' :
          '<div class="empty">No published reports available yet.</div>'
        ) +
      '</div>';
    }`;

appJs = appJs.replace(regexReports, newReports);
fs.writeFileSync('app.js', appJs);
console.log('Fixed reports list');

const fs = require('fs');
let code = fs.readFileSync('fb_calculator.js', 'utf8');

// Update getFbRole
const newGetFbRole = `function getFbRole() {
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
}`;
code = code.replace(/function getFbRole\(\) \{[\s\S]*?\}\n\nfunction canAccessFb\(\) \{[\s\S]*?\}/, newGetFbRole);

// Update fbRenderRates
const newRenderRates = `function fbRenderRates(container) {
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
      '<div class="section-heading"><div><h2>Rate Variables</h2><small>For ' + window.fbState.activeYear + '/' + window.fbState.activeMonth + '</small></div></div>' +
      '<div class="table-wrap">' +
        '<table>' +
          '<thead><tr><th>Variable</th><th>Value</th></tr></thead>' +
          '<tbody>' +
            Object.keys(DEFAULT_RATES).map(function(k) {
              var isPct = k.indexOf('_pct') !== -1;
              var disabled = (isPct && !isDirectorOrAdmin) ? 'disabled title="Only Finance Director can edit percentages"' : '';
              return '<tr>' +
                '<td><strong>' + k + '</strong></td>' +
                '<td><input type="number" step="0.0001" value="' + getRate(k) + '" id="rate_' + k + '" class="fb-rate-input" ' + disabled + ' /></td>' +
              '</tr>';
            }).join('') +
          '</tbody>' +
        '</table>' +
      '</div>' +
      '<div class="button-row"><button class="primary-button" onclick="fbSaveRates()">Save Rates</button></div>' +
    '</div>';
  container.innerHTML = html;
}`;
code = code.replace(/function fbRenderRates\(container\) \{[\s\S]*?\}\n\nwindow.fbSaveRates/, newRenderRates + '\n\nwindow.fbSaveRates');

fs.writeFileSync('fb_calculator.js', code);

const fs = require('fs');

let appJs = fs.readFileSync('app.js', 'utf8');

const oldRenderRecords = appJs.substring(
  appJs.indexOf('function renderRecords() {'),
  appJs.indexOf('function renderAllowances() {')
);

const newRenderRecords = `var recordState = { query: '', month: '', village: 'All', user: 'All' };

function renderRecords() {
    var role = (sessionStorage.getItem('role') || 'mother').toLowerCase();
    var isManager = role.indexOf('admin') !== -1 || role.indexOf('director') !== -1 || role.indexOf('accountant') !== -1 || role.indexOf('assistant') !== -1;
    var myName = sessionStorage.getItem('username') || 'mother';
    var myVillage = state.profiles && state.profiles[myName] ? state.profiles[myName].village : null;
    var isNational = (role === 'national_director' || role === 'accountant' || role === 'admin' || myVillage === 'All');

    var searchInputRef = document.querySelector('#record-search');
    if (searchInputRef) recordState.query = searchInputRef.value;
    var wasFocused = searchInputRef && document.activeElement === searchInputRef;
    var selStart = searchInputRef ? searchInputRef.selectionStart : null;
    var selEnd = searchInputRef ? searchInputRef.selectionEnd : null;

    var visibleExpenses = getVisibleExpenses();
    
    var availableVillages = [];
    var availableUsers = [];
    visibleExpenses.forEach(function(e) {
      var v = state.profiles && state.profiles[e.user] ? state.profiles[e.user].village : 'Unknown';
      if (v && availableVillages.indexOf(v) === -1) availableVillages.push(v);
      if (e.user && availableUsers.indexOf(e.user) === -1) availableUsers.push(e.user);
    });

    var queryLower = recordState.query.toLowerCase();
    var filtered = visibleExpenses.filter(function(item) {
      if (recordState.month && item.date.indexOf(recordState.month) !== 0) return false;
      if (recordState.user !== 'All' && item.user !== recordState.user) return false;
      var itemVillage = state.profiles && state.profiles[item.user] ? state.profiles[item.user].village : 'Unknown';
      if (recordState.village !== 'All' && itemVillage !== recordState.village) return false;

      return ((item.user || '') + ' ' + item.name + ' ' + cat(item.category).name + ' ' + item.date).toLowerCase().indexOf(queryLower) !== -1;
    }).sort(function(a, b) { return b.date.localeCompare(a.date); });

    var html = '<div class="panel">' +
      '<div class="section-heading"><div><h2>Expense ledger</h2><small>' + filtered.length + ' of ' + visibleExpenses.length + ' records</small></div>' +
      '<div class="button-row"><button class="ghost-button" data-action="export-csv">Export CSV</button>' +
      (isManager ? '<button class="primary-button" data-view="expenses">+ Add expense</button>' : '') +
      '</div></div>';

    html += '<div class="form-grid" style="margin-bottom:18px; max-width:800px;">' +
      '<div class="field"><label for="record-search">Search text</label><input id="record-search" value="' + escapeHtml(recordState.query) + '" placeholder="Item, category..."></div>' +
      '<div class="field"><label for="record-month">Month</label><input id="record-month" type="month" value="' + recordState.month + '"></div>';
    
    if (isManager) {
      if (isNational) {
        html += '<div class="field"><label for="record-village">Village</label><select id="record-village"><option value="All">All Villages</option>' + 
          availableVillages.map(function(v) { return '<option value="' + escapeHtml(v) + '"' + (recordState.village === v ? ' selected' : '') + '>' + escapeHtml(v) + '</option>'; }).join('') + 
          '</select></div>';
      }
      html += '<div class="field"><label for="record-user">Mother</label><select id="record-user"><option value="All">All Mothers</option>' + 
        availableUsers.map(function(u) { return '<option value="' + escapeHtml(u) + '"' + (recordState.user === u ? ' selected' : '') + '>' + escapeHtml(state.profiles && state.profiles[u] ? state.profiles[u].name || u : u) + ' (' + u + ')</option>'; }).join('') + 
        '</select></div>';
    }
    html += '</div>';

    html += '<div class="table-wrap"><table><thead><tr><th>Item</th><th>Category</th><th>User</th><th>Date</th><th>Qty</th><th>Amount</th><th></th></tr></thead><tbody>' +
      (filtered.length ? filtered.map(function(expense) {
        return '<tr><td><strong>' + escapeHtml(expense.name) + '</strong>' + getTranslationsHtml(expense.name) + 
        '<br><span class="muted">' + subcat(expense.subcategory) + '</span></td><td><span class="category-dot ' + cat(expense.category).color + '"></span>' + cat(expense.category).name + '</td><td>' + escapeHtml(expense.user || 'Unknown') + '</td><td>' + expense.date + '</td><td>' + expense.quantity + '</td><td class="amount">' + money(expense.total) + '</td><td>' + (isManager ? '<button class="ghost-button" data-edit-expense="' + expense.id + '">Edit</button> ' : '') + '<button class="ghost-button" data-delete-expense="' + expense.id + '">Delete</button></td></tr>';
      }).join('') : '<tr><td colspan="7" class="empty">No expense entries found matching filters.</td></tr>') +
      '</tbody></table></div>' +
    '</div>';

    document.querySelector('#view-records').innerHTML = html;

    var newSearch = document.querySelector('#record-search');
    if (newSearch) {
      newSearch.addEventListener('input', function(e) { recordState.query = e.target.value; renderRecords(); });
      if (wasFocused) { newSearch.focus(); newSearch.setSelectionRange(selStart, selEnd); }
    }
    
    var monthFilter = document.querySelector('#record-month');
    if (monthFilter) monthFilter.addEventListener('change', function(e) { recordState.month = e.target.value; renderRecords(); });

    var villageFilter = document.querySelector('#record-village');
    if (villageFilter) villageFilter.addEventListener('change', function(e) { recordState.village = e.target.value; renderRecords(); });

    var userFilter = document.querySelector('#record-user');
    if (userFilter) userFilter.addEventListener('change', function(e) { recordState.user = e.target.value; renderRecords(); });
}

`;

appJs = appJs.replace(oldRenderRecords, newRenderRecords);
fs.writeFileSync('app.js', appJs);
console.log('Filters injected into renderRecords');

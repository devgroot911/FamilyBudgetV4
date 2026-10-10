function renderDashboard() {
  var cm = currentMonth();
  var visibleExpenses = getVisibleExpenses();
  var role = (sessionStorage.getItem('role') || '').toLowerCase();
  var isManager = role.indexOf('admin') !== -1 || role.indexOf('director') !== -1 || role.indexOf('accountant') !== -1 || role.indexOf('assistant') !== -1;
  var isAdminUser = role.indexOf('admin') !== -1;

  var currentMonthExpenses = visibleExpenses.filter(function(i) { return i.date.indexOf(cm) === 0; });
  var totalSpent = currentMonthExpenses.reduce(function(s, i) { return s + Number(i.total); }, 0);
  var totalAllowance = categories.reduce(function(s, c) { return s + allowance(c.id); }, 0);
  var trueRemaining = categories.reduce(function(s, c) { return s + getFbBalance(c.id); }, 0);
  var remaining = trueRemaining !== 0 ? trueRemaining : (totalAllowance - totalSpent);
  var recent = visibleExpenses.slice().sort(function(a, b) { return b.date.localeCompare(a.date); }).slice(0, 10);
  var todaySpent = visibleExpenses.filter(function(i) { return i.date === today(); }).reduce(function(s, i) { return s + Number(i.total); }, 0);
  
  var html = (isAdminUser ? '<div style="text-align:right;margin-bottom:10px"><button class="primary-button" data-action="refresh-dashboard">&#x21bb; Refresh Data</button></div>' : '');

  if (!isManager) {
    // --- MOTHER VIEW ---
    html += '<div class="grid stats-grid">' +
      '<div class="panel stat-card"><span class="stat-label">Spent this month</span><div class="stat-value">' + money(totalSpent) + '</div><div class="stat-note">' + currentMonthExpenses.length + ' entries</div></div>' +
      '<div class="panel stat-card"><span class="stat-label">Available balance</span><div class="stat-value">' + money(remaining) + '</div><div class="stat-note">Against current allowances</div></div>' +
      '<div class="panel stat-card"><span class="stat-label">Today</span><div class="stat-value">' + money(todaySpent) + '</div><div class="stat-note">' + visibleExpenses.filter(function(i) { return i.date === today(); }).length + ' entries today</div></div>' +
      '<div class="panel stat-card"><span class="stat-label">Catalog items</span><div class="stat-value">' + state.items.length + '</div><div class="stat-note">Available for quick entry</div></div>' +
    '</div>';

    html += '<div class="grid two-col content-gap">' +
      '<div class="panel">' +
        '<div class="section-heading"><div><h2>Category Spending</h2><small>Where is your money going?</small></div></div>' +
        '<div class="chart-container"><canvas id="mother-donut-chart"></canvas></div>' +
      '</div>' +
      '<div class="panel">' +
        '<div class="section-heading"><div><h2>Budget Progress</h2><small>' + cm + '</small></div></div>' +
        categories.map(function(c, i) {
          var budget = allowance(c.id) || 0;
          var v = spent(c.id);
          var pct = budget > 0 ? Math.min((v / budget) * 100, 100) : 0;
          return '<div class="progress-row"><div class="progress-meta"><span>' + c.name + '</span><span>' + money(v) + ' / ' + money(budget) + '</span></div><div class="progress-track"><div class="progress-fill' + (i === 1 ? ' mint' : i === 2 ? ' blue' : '') + '" style="width:' + pct + '%"></div></div></div>';
        }).join('') +
      '</div>' +
    '</div>';

    html += '<div class="panel content-gap">' +
      '<div class="section-heading"><div><h2>Daily Spending Trend</h2><small>Cumulative expenses this month</small></div></div>' +
      '<div class="chart-container"><canvas id="mother-line-chart"></canvas></div>' +
    '</div>';
  } else {
    // --- MANAGER VIEW ---
    var usersCount = [...new Set(currentMonthExpenses.map(function(e) { return e.user; }))].length;
    html += '<div class="grid stats-grid">' +
      '<div class="panel stat-card"><span class="stat-label">Total Village Spend</span><div class="stat-value">' + money(totalSpent) + '</div><div class="stat-note">This month</div></div>' +
      '<div class="panel stat-card"><span class="stat-label">Village Allowance</span><div class="stat-value">' + money(totalAllowance) + '</div><div class="stat-note">Total allocated</div></div>' +
      '<div class="panel stat-card"><span class="stat-label">Active Mothers</span><div class="stat-value">' + usersCount + '</div><div class="stat-note">Entered data this month</div></div>' +
      '<div class="panel stat-card"><span class="stat-label">Total Entries</span><div class="stat-value">' + currentMonthExpenses.length + '</div><div class="stat-note">This month</div></div>' +
    '</div>';

    html += '<div class="grid two-col content-gap">' +
      '<div class="panel">' +
        '<div class="section-heading"><div><h2>Mother Comparison</h2><small>Spend by user</small></div></div>' +
        '<div class="chart-container"><canvas id="manager-bar-chart"></canvas></div>' +
      '</div>' +
      '<div class="panel">' +
        '<div class="section-heading"><div><h2>Category Breakdown</h2><small>Village-wide category spend</small></div></div>' +
        '<div class="chart-container"><canvas id="manager-pie-chart"></canvas></div>' +
      '</div>' +
    '</div>';

    html += '<div class="panel content-gap">' +
      '<div class="section-heading"><div><h2>Village Spending Trend</h2><small>Cumulative vs Allowance</small></div></div>' +
      '<div class="chart-container"><canvas id="manager-line-chart"></canvas></div>' +
    '</div>';
  }

  // Recent activity table (for both)
  html += '<div class="panel content-gap">' +
    '<div class="section-heading"><div><h2>Recent Activity</h2><small>Latest saved entries</small></div>' + (!isManager ? '<button class="primary-button" data-view="expenses">+ Add expense</button>' : '') + '</div>' +
    '<div class="table-wrap"><table><thead><tr><th>Item</th><th>Category</th><th>User</th><th>Date</th><th>Qty</th><th>Amount</th><th></th></tr></thead><tbody>' +
    (recent.length ? recent.map(function(e) {
      return '<tr><td><strong>' + escapeHtml(e.name) + '</strong>' + getTranslationsHtml(e.name) + '<br><span class="muted">' + subcat(e.subcategory) + '</span></td><td><span class="category-dot ' + cat(e.category).color + '"></span>' + cat(e.category).name + '</td><td>' + escapeHtml(e.user || 'Unknown') + '</td><td>' + e.date + '</td><td>' + e.quantity + '</td><td class="amount">' + money(e.total) + '</td><td>' + (isManager ? '<button class="ghost-button" data-edit-expense="' + e.id + '">Edit</button> ' : '') + '<button class="ghost-button" data-delete-expense="' + e.id + '">Delete</button></td></tr>';
    }).join('') : '<tr><td colspan="7" class="empty">No expense entries yet.</td></tr>') +
    '</tbody></table></div>' +
  '</div>';

  document.querySelector('#view-dashboard').innerHTML = html;

  // Render Charts after DOM injection
  if (window.Chart) renderCharts(isManager, currentMonthExpenses, totalAllowance);
}

// Global chart instances to destroy before re-rendering
// ============================================================
// FAMILY BUDGET V4 - app.js
// Compatible with older Android browsers - NO async/await
// All Supabase calls use .then().catch() Promise chains
// ============================================================

// --- Supabase Init ---
var SUPABASE_URL = 'https://qgfopifgmvwleohswkxo.supabase.co';
var SUPABASE_KEY = 'sb_publishable_qA9QPQZ0Nxzs3xbCx8LeXw_z3UF2ezQ';
var supabaseClient = null;
try {
  // The UMD bundle exposes the global as `supabase` (not window.supabase)
  // createClient is at supabase.createClient
  var _sb = window.supabase || (typeof supabase !== 'undefined' ? supabase : null);
  if (_sb && _sb.createClient) {
    supabaseClient = _sb.createClient(SUPABASE_URL, SUPABASE_KEY);
  } else {
    throw new Error('supabase library not found on page');
  }
} catch (e) {
  console.error('Supabase failed to load:', e);
}
// Use supabaseClient everywhere inside this file
var supabase = supabaseClient;

// --- App State ---
var isLoggedIn = sessionStorage.getItem('logged_in') === 'true';
var isAdmin = (sessionStorage.getItem('role') || '').toLowerCase().indexOf('admin') !== -1;
var activeView = 'dashboard';
var selectedCategory = 1;
var selectedAllowanceMonth = (function() {
  return new Date().toISOString().slice(0, 7);
}());

var STORAGE_KEY = 'family-budget-v4';

function initialState() {
  return {
    profiles: {},
    expenses: [],
    allowances: {},
    catalogSourceUrl: 'https://docs.google.com/spreadsheets/d/1uKYIbIyn__vpcX46cxa1__JinXDfVzfdTZDYZo5WPD0/edit?usp=sharing',
    items: [],
    reports: []
  };
}
var state = (function() {
  try {
    var saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      var parsed = JSON.parse(saved);
      return Object.assign(initialState(), parsed, { expenses: [], allowances: {} });
    }
  } catch (e) {}
  return initialState();
}());

// --- Constants ---
var categories = [
  { id: 1, name: 'Food', color: '' },
  { id: 2, name: 'Household', color: 'household' },
  { id: 3, name: 'Clothing', color: 'clothing' }
];
var subcategories = [
  { id: 1, name: 'Animal protein' }, { id: 2, name: 'Grains' }, { id: 3, name: 'Vegetables' },
  { id: 4, name: 'Fruits' }, { id: 5, name: 'Dairy & milk' }, { id: 6, name: 'Spices & condiments' },
  { id: 7, name: 'Oils & fats' }, { id: 8, name: 'Pulses & legumes' }, { id: 9, name: 'Bakery & bread' },
  { id: 10, name: 'Beverages & tea' }, { id: 11, name: 'Snacks & sweets' }, { id: 12, name: 'Prepared meals' },
  { id: 13, name: 'Other food items' }, { id: 14, name: 'Household & cleaning' },
  { id: 15, name: 'Personal care & hygiene' }, { id: 16, name: 'Clothing & footwear' },
  { id: 17, name: 'Miscellaneous & others' }
];

// --- Utility Functions ---
function today() { return new Date().toISOString().slice(0, 10); }
function currentMonth(date) { return (date || today()).slice(0, 7); }
function money(value) { return 'LKR ' + Number(value || 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function escapeHtml(value) {
  return String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
function uid(prefix) {
  var rand = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : (Date.now() + Math.random()).toString(36);
  return (prefix || 'id') + '_' + rand;
}
function notify(message) {
  var notice = document.querySelector('#notice');
  if (!notice) return;
  notice.textContent = message;
  notice.classList.add('show');
  setTimeout(function() { notice.classList.remove('show'); }, 2700);
}
function cat(id) { return categories.find(function(c) { return c.id === Number(id); }) || categories[0]; }
function subcat(id) { return String(Number(id) || id || ''); }
function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  updateHeader();
}
function getVisibleExpenses() {
  // First, filter out any corrupted database rows (missing date or total)
  var validExpenses = state.expenses.filter(function(e) {
    return e && e.date && e.total !== null && e.total !== undefined;
  });
  
  var role = (sessionStorage.getItem('role') || 'mother').toLowerCase();
  if (role.indexOf('admin') !== -1 || role.indexOf('accountant') !== -1) {
    return validExpenses;
  }
  var myName = sessionStorage.getItem('username') || 'mother';
  return validExpenses.filter(function(e) { return e.user === myName; });
}
function getProfile() {
  if (!state.profiles) state.profiles = {};
  var user = sessionStorage.getItem('username') || 'mother';
  if (!state.profiles[user]) {
    state.profiles[user] = { name: '', usertype: 'Mother / YCCW', village: '', house: '', phone: '', email: '' };
  }
  return state.profiles[user];
}
function allowance(categoryId, period) {
  var p = period || currentMonth();
  var user = sessionStorage.getItem('username') || 'mother';
  return Number(state.allowances[user + '_' + p + '_' + categoryId] || state.allowances[p + '_' + categoryId] || 0);
}
function spent(categoryId, period) {
  var p = period || currentMonth();
  return getVisibleExpenses()
    .filter(function(e) { return e.category === categoryId && e.date.indexOf(p) === 0; })
    .reduce(function(sum, e) { return sum + Number(e.total); }, 0);
}
function updateHeader() {
  var profile = getProfile();
  var name = (profile.name || '').trim() || sessionStorage.getItem('profile_name') || 'Family member';
  var nameEl = document.querySelector('#profile-name');
  var initialsEl = document.querySelector('#profile-initials');
  if (nameEl) nameEl.textContent = name;
  if (initialsEl) initialsEl.textContent = name.split(/\s+/).map(function(p) { return p[0]; }).join('').slice(0, 2).toUpperCase() || 'FM';
}
function categoryOptions(selected) {
  return categories.map(function(c) {
    return '<option value="' + c.id + '"' + (c.id === Number(selected || 1) ? ' selected' : '') + '>' + c.name + '</option>';
  }).join('');
}
function subcategoryOptions(selected) {
  return subcategories.map(function(s) {
    return '<option value="' + s.id + '"' + (s.id === Number(selected || 1) ? ' selected' : '') + '>' + s.id + '</option>';
  }).join('');
}

// --- CSV / Catalog ---
function csvRows(text) {
  var rows = []; var row = []; var cell = ''; var quoted = false;
  for (var i = 0; i < text.length; i++) {
    var ch = text[i]; var next = text[i + 1];
    if (ch === '"' && quoted && next === '"') { cell += '"'; i++; }
    else if (ch === '"') { quoted = !quoted; }
    else if (ch === ',' && !quoted) { row.push(cell.trim()); cell = ''; }
    else if ((ch === '\n' || ch === '\r') && !quoted) {
      if (ch === '\r' && next === '\n') i++;
      row.push(cell.trim());
      if (row.some(function(v) { return v; })) rows.push(row);
      row = []; cell = '';
    } else { cell += ch; }
  }
  if (cell || row.length) { row.push(cell.trim()); if (row.some(function(v) { return v; })) rows.push(row); }
  return rows;
}
function sheetCsvUrl(input) {
  var value = input.trim();
  var match = value.match(/docs\.google\.com\/spreadsheets\/d\/([^/]+)/);
  if (!match) return value;
  var gidMatch = value.match(/[?&#]gid=([^&#]+)/);
  var gid = gidMatch ? gidMatch[1] : '0';
  return 'https://docs.google.com/spreadsheets/d/' + match[1] + '/gviz/tq?tqx=out:csv&gid=' + gid;
}
function mergeCatalogCsv(csvText) {
  var rows = csvRows(csvText);
  var added = 0; var updated = 0;
  var byId = {}; var byName = {};
  state.items.forEach(function(item) { byId[item.id] = item; byName[item.name.toLowerCase().trim()] = item; });
  rows.forEach(function(parts, rowIndex) {
    if (rowIndex === 0 && /id|name/i.test(parts[0] || '')) return;
    var hasId = parts.length >= 7 || /^item_/i.test(parts[0] || '');
    var id = hasId ? (parts[0] || uid('item')) : uid('item');
    var name = (hasId ? parts[1] : parts[0] || '').trim();
    if (!name) return;
    var existing = byId[id] || byName[name.toLowerCase()];
    var item = { 
      id: existing ? existing.id : id, 
      name: name, 
      nameSi: (hasId ? parts[2] : parts[1] || name).trim() || name,
      nameTa: (hasId ? parts[3] : parts[2] || name).trim() || name,
      category: Number(hasId ? parts[4] : parts[3]) || 1, 
      subcategory: Number(hasId ? parts[5] : parts[4]) || 1, 
      unit: (hasId ? parts[6] : parts[5] || 'kg').trim() || 'kg' 
    };
    if (existing) { state.items = state.items.filter(function(e) { return e.id !== existing.id; }); updated++; }
    else { added++; }
    state.items.unshift(item);
    byId[item.id] = item;
    byName[name.toLowerCase()] = item;
  });
  save();
  return { added: added, updated: updated };
}
function syncGoogleSheet() {
  var input = document.querySelector('#catalog-source-url');
  var source = input ? input.value.trim() : '';
  if (!source) return notify('Enter a Google Sheet link first');
  state.catalogSourceUrl = source;
  save();
  var button = document.querySelector('[data-action=sync-sheet]');
  if (button) { button.disabled = true; button.textContent = 'Syncing...'; }
  fetch(sheetCsvUrl(source), { headers: { Accept: 'text/csv' } })
    .then(function(res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.text();
    })
    .then(function(csv) {
      if (/<html/i.test(csv)) throw new Error('Sheet is not publicly viewable');
      var result = mergeCatalogCsv(csv);
      notify('Sheet synced: ' + result.added + ' added, ' + result.updated + ' updated');
      render();
    })
    .catch(function(error) {
      notify('Sheet sync failed: ' + error.message + '. Use "Anyone with the link can view".');
    })
    .then(function() {
      var current = document.querySelector('[data-action=sync-sheet]');
      if (current) { current.disabled = false; current.textContent = 'Sync Google Sheet'; }
    });
}

// --- Cloud Sync ---
function fetchCloudData() {
  if (!supabase) return notify('Database not connected');
  notify('Syncing with cloud...');
  supabase.from('expenses').select('*').order('date', { ascending: false })
    .then(function(expRes) {
      if (!expRes.error) state.expenses = expRes.data || [];
      return supabase.from('allowances').select('*');
    })
    .then(function(allRes) {
      if (!allRes.error && allRes.data) {
        state.allowances = {};
        allRes.data.forEach(function(a) {
          state.allowances[a.user_username + '_' + a.month + '_' + a.category_id] = a.amount;
        });
      }
      return supabase.from('users').select('*');
    })
    .then(function(userRes) {
      if (!userRes.error && userRes.data) {
        window.loadedUsers = userRes.data;
        if (!state.profiles) state.profiles = {};
        userRes.data.forEach(function(u) {
          state.profiles[u.username] = { name: u.name || '', usertype: u.usertype || 'Mother / YCCW', village: u.village || '', house: u.house || '', phone: u.phone || '', email: u.email || '' };
        });
      }
      notify('Cloud sync complete');
      render();
    })
    .catch(function(err) {
      console.error(err);
      notify('Sync error: ' + (err && err.message ? err.message : String(err)));
    });
}

// --- Download Helpers ---
function download(filename, content, type) {
  var link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([content], { type: type || 'text/plain' }));
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}
function exportCsv() {
  var header = 'date,user,item,category,subcategory,quantity,total,note';
  var rows = getVisibleExpenses().map(function(item) {
    return [item.date, item.user || 'Unknown', item.name, cat(item.category).name, subcat(item.subcategory), item.quantity, item.total, item.note]
      .map(function(v) { return '"' + String(v || '').replace(/"/g, '""') + '"'; }).join(',');
  });
  download('family-budget-expenses.csv', [header].concat(rows).join('\n'), 'text/csv');
}
function exportBackup() { download('family-budget-backup.json', JSON.stringify(state, null, 2), 'application/json'); notify('Backup downloaded'); }
function importBackup() { document.querySelector('#backup-input').dataset.mode = 'backup'; document.querySelector('#backup-input').click(); }
function importCsv() { document.querySelector('#backup-input').dataset.mode = 'csv'; document.querySelector('#backup-input').click(); }
function makeReportDownload(id) {
  var report = state.reports.find(function(r) { return r.id === id; });
  if (report) download('family-budget-report-' + report.start + '.txt', report.text);
}
function makeReport(start, end) {
  var list = getVisibleExpenses().filter(function(item) { return item.date >= start && item.date <= end; });
  var total = list.reduce(function(sum, item) { return sum + Number(item.total); }, 0);
  var profile = getProfile();
  var lines = ['FAMILY BUDGET - EXPENDITURE STATEMENT', '='.repeat(48),
    (profile.usertype || 'Mother / YCCW') + ': ' + (profile.name || 'N/A'),
    'Village: ' + (profile.village || 'N/A'), 'Period: ' + start + ' to ' + end, '', 'ALLOWANCE SUMMARY'];
  categories.forEach(function(item) {
    lines.push(item.name + ': ' + money(allowance(item.id, currentMonth(start))) + ' allocated | ' + money(list.filter(function(e) { return e.category === item.id; }).reduce(function(s, e) { return s + Number(e.total); }, 0)) + ' spent');
  });
  lines.push('', 'TOTAL SPENT: ' + money(total), '', 'ITEMIZED EXPENSES');
  list.forEach(function(item, index) {
    lines.push((index + 1) + '. ' + item.date + ' | ' + item.name + ' | ' + cat(item.category).name + ' | ' + money(item.total));
  });
  return lines.join('\n');
}

// ============================================================
// --- UI Render ---
// ============================================================
function render() {
  if (!isLoggedIn) {
    document.body.classList.add('logged-out');
    document.querySelectorAll('.view').forEach(function(v) { v.classList.remove('active'); });
    document.querySelector('#view-login').classList.add('active');
    return;
  }
  document.body.classList.remove('logged-out');
  var role = (sessionStorage.getItem('role') || 'mother').toLowerCase();

  // Show/hide nav by role
  document.querySelectorAll('.nav-item').forEach(function(btn) { btn.style.display = 'none'; });
  if (role.indexOf('admin') !== -1) {
    document.querySelectorAll('.nav-item').forEach(function(btn) { btn.style.display = 'flex'; });
  } else if (role.indexOf('accountant') !== -1) {
    ['dashboard', 'items', 'reports', 'records'].forEach(function(v) {
      var el = document.querySelector('[data-view="' + v + '"]');
      if (el) el.style.display = 'flex';
    });
  } else {
    ['dashboard', 'expenses', 'records', 'allowances', 'items', 'reports', 'profile'].forEach(function(v) {
      var el = document.querySelector('[data-view="' + v + '"]');
      if (el) el.style.display = 'flex';
    });
  }

  // Active nav tab
  document.querySelectorAll('.nav-item').forEach(function(btn) {
    btn.classList.toggle('active', btn.getAttribute('data-view') === activeView);
  });

  // Switch view sections
  document.querySelectorAll('.view').forEach(function(v) { v.classList.remove('active'); });
  var activeEl = document.querySelector('#view-' + activeView);
  if (activeEl) activeEl.classList.add('active');

  // Page title
  var titles = { dashboard: 'Dashboard', expenses: 'Expense Entry', records: 'Manage Expenses', allowances: 'Allowances', items: 'Item Master', reports: 'Past Records & Reports', profile: 'Profile & Settings', users: 'Manage Users' };
  var titleEl = document.querySelector('#page-title');
  var kickerEl = document.querySelector('#page-kicker');
  if (titleEl) titleEl.textContent = titles[activeView] || activeView;
  if (kickerEl) kickerEl.textContent = activeView === 'dashboard' ? 'HOUSEHOLD LEDGER' : 'FAMILY BUDGET / ' + (titles[activeView] || '').toUpperCase();

  // Render view
  var renderers = { dashboard: renderDashboard, expenses: renderExpenses, records: renderRecords, allowances: renderAllowances, items: renderItems, reports: renderReports, profile: renderProfile, users: renderUsers };
  if (renderers[activeView]) renderers[activeView]();
  if (activeView === 'expenses') { enhanceExpenseForm(); }
  updateHeader();
}

// ============================================================
function renderDashboard() {
  var cm = currentMonth();
  var visibleExpenses = getVisibleExpenses();
  var totalSpent = visibleExpenses.filter(function(i) { return i.date.indexOf(cm) === 0; }).reduce(function(s, i) { return s + Number(i.total); }, 0);
  var totalAllowance = categories.reduce(function(s, c) { return s + allowance(c.id); }, 0) || 140000;
  var remaining = totalAllowance - totalSpent;
  var recent = visibleExpenses.slice().sort(function(a, b) { return b.date.localeCompare(a.date); }).slice(0, 10);
  var maxSpent = Math.max.apply(null, categories.map(function(c) { return spent(c.id); }).concat([1]));
  var role = (sessionStorage.getItem('role') || '').toLowerCase();
  var isAdminUser = role.indexOf('admin') !== -1;

  document.querySelector('#view-dashboard').innerHTML =
    // Refresh button for admin at top
    (isAdminUser ? '<div style="text-align:right;margin-bottom:10px"><button class="primary-button" data-action="refresh-dashboard">&#x21bb; Refresh Data</button></div>' : '') +
    '<div class="grid stats-grid">' +
      '<div class="panel stat-card"><span class="stat-label">Spent this month</span><div class="stat-value">' + money(totalSpent) + '</div><div class="stat-note">' + visibleExpenses.filter(function(i) { return i.date.indexOf(cm) === 0; }).length + ' recorded entries</div></div>' +
      '<div class="panel stat-card"><span class="stat-label">Available balance</span><div class="stat-value">' + money(remaining) + '</div><div class="stat-note">Against current allowances</div></div>' +
      '<div class="panel stat-card"><span class="stat-label">Today</span><div class="stat-value">' + money(visibleExpenses.filter(function(i) { return i.date === today(); }).reduce(function(s, i) { return s + Number(i.total); }, 0)) + '</div><div class="stat-note">' + visibleExpenses.filter(function(i) { return i.date === today(); }).length + ' entries today</div></div>' +
      '<div class="panel stat-card"><span class="stat-label">Catalog items</span><div class="stat-value">' + state.items.length + '</div><div class="stat-note">Available for quick entry</div></div>' +
    '</div>' +
    '<div class="grid two-col content-gap">' +
      '<div class="panel">' +
        '<div class="section-heading"><div><h2>Spending rhythm</h2><small>Current month by category</small></div><button class="ghost-button" data-view="records">View ledger</button></div>' +
        '<div class="chart">' + categories.map(function(c) { return '<div class="bar-wrap"><div class="bar" style="height:' + Math.max(5, spent(c.id) / maxSpent * 100) + '%" title="' + money(spent(c.id)) + '"></div><span class="bar-label">' + c.name + '</span></div>'; }).join('') + '</div>' +
        '<div class="grid three-col" style="margin-top:16px">' + categories.map(function(c) { return '<div><span class="muted">' + c.name + '</span><br><strong>' + money(spent(c.id)) + '</strong></div>'; }).join('') + '</div>' +
      '</div>' +
      '<div class="panel">' +
        '<div class="section-heading"><div><h2>Allowance health</h2><small>' + cm + '</small></div><button class="ghost-button" data-view="allowances">Edit</button></div>' +
        categories.map(function(c, i) {
          var budget = allowance(c.id) || [85000, 30000, 25000][i];
          var v = spent(c.id);
          return '<div class="progress-row"><div class="progress-meta"><span>' + c.name + '</span><span>' + money(v) + ' / ' + money(budget) + '</span></div><div class="progress-track"><div class="progress-fill' + (i === 1 ? ' mint' : i === 2 ? ' blue' : '') + '" style="width:' + Math.min(v / budget * 100, 100) + '%"></div></div></div>';
        }).join('') +
      '</div>' +
    '</div>' +
    '<div class="panel content-gap">' +
      '<div class="section-heading"><div><h2>Recent activity</h2><small>Latest saved entries</small></div><button class="primary-button" data-view="expenses">+ Add expense</button></div>' +
      '<div class="table-wrap"><table><thead><tr><th>Item</th><th>Category</th><th>User</th><th>Date</th><th>Qty</th><th>Amount</th><th></th></tr></thead><tbody>' +
      (recent.length ? recent.map(function(e) {
        return '<tr><td><strong>' + escapeHtml(e.name) + '</strong><br><span class="muted">' + subcat(e.subcategory) + '</span></td><td><span class="category-dot ' + cat(e.category).color + '"></span>' + cat(e.category).name + '</td><td>' + escapeHtml(e.user || 'Unknown') + '</td><td>' + e.date + '</td><td>' + e.quantity + '</td><td class="amount">' + money(e.total) + '</td><td><button class="ghost-button" data-delete-expense="' + e.id + '">Delete</button></td></tr>';
      }).join('') : '<tr><td colspan="7" class="empty">No expense entries yet.</td></tr>') +
      '</tbody></table></div>' +
    '</div>';
}


// ============================================================
function enhanceExpenseForm() {
  var form = document.querySelector('#expense-form');
  if (!form || document.querySelector('#expense-catalog-grid')) return; // already enhanced

  // Inject catalog cards panel after the category/subcategory row (first form-grid)
  var firstGrid = form.querySelector('.form-grid');
  var catalogPanel = document.createElement('div');
  catalogPanel.className = 'expense-catalog-panel';
  catalogPanel.innerHTML =
    '<div class="section-heading"><div><h3>Catalog Items</h3><small id="expense-catalog-count"></small></div></div>' +
    '<div class="expense-catalog-grid" id="expense-catalog-grid"></div>';
  firstGrid.after(catalogPanel);

  var categorySelect = document.querySelector('#expense-category');
  var subcategorySelect = document.querySelector('#expense-subcategory');

  function chooseItem(item) {
    document.querySelector('#expense-name').value = item.name;
    // Mark selected card
    document.querySelectorAll('.expense-catalog-card').forEach(function(btn) {
      btn.classList.toggle('selected', btn.dataset.expenseItemId === item.id);
    });
  }

  function refreshItems() {
    var categoryId = Number(categorySelect.value);
    var subcategoryId = Number(subcategorySelect.value);
    var filtered = state.items.filter(function(item) {
      return item.category === categoryId && item.subcategory === subcategoryId;
    }).sort(function(a, b) { return a.name.localeCompare(b.name); });

    var countEl = document.querySelector('#expense-catalog-count');
    var gridEl = document.querySelector('#expense-catalog-grid');
    if (countEl) countEl.textContent = filtered.length + ' matching items';
    if (gridEl) {
      if (filtered.length) {
        gridEl.innerHTML = filtered.map(function(item) {
          return '<button type="button" class="expense-catalog-card" data-expense-item-id="' + escapeHtml(item.id) + '">' +
            '<strong>' + escapeHtml(item.name) + '</strong>' +
            '<span>' + escapeHtml(item.unit || 'kg') + '</span>' +
          '</button>';
        }).join('');
        gridEl.querySelectorAll('[data-expense-item-id]').forEach(function(button) {
          button.addEventListener('click', function() {
            var found = state.items.find(function(item) { return item.id === button.dataset.expenseItemId; });
            if (found) chooseItem(found);
          });
        });
      } else {
        gridEl.innerHTML = '<div class="empty">No catalog items for Category ' + categoryId + ' / Sub-category ' + subcategoryId + '. Sync the Google Sheet in Item Master first.</div>';
      }
    }
    // Clear name when filter changes
    document.querySelector('#expense-name').value = '';
  }

  categorySelect.addEventListener('change', refreshItems);
  subcategorySelect.addEventListener('change', refreshItems);
  refreshItems();
}

function renderExpenses() {
  var visibleExpenses = getVisibleExpenses();
  var todayItems = visibleExpenses.filter(function(i) { return i.date === today(); });
  document.querySelector('#view-expenses').innerHTML =
    '<div class="grid two-col">' +
      '<div class="panel">' +
        '<div class="section-heading"><div><h2>Item Details Form</h2><small>Saved to cloud</small></div></div>' +
        '<form id="expense-form">' +
          // Category + Subcategory side by side
          '<div class="form-grid">' +
            '<div class="field"><label for="expense-category">Category</label><select id="expense-category">' + categoryOptions(selectedCategory) + '</select></div>' +
            '<div class="field"><label for="expense-subcategory">Sub-category</label><select id="expense-subcategory">' + subcategoryOptions() + '</select></div>' +
          '</div>' +
          // Catalog cards panel injected here by enhanceExpenseForm
          // Hidden name field (filled by card click)
          '<div class="field" style="display:none"><label for="expense-name">Item name</label><input id="expense-name" placeholder="e.g. Rice 5kg"></div>' +
          // Other fields below cards
          '<div class="form-grid">' +
            '<div class="field"><label for="expense-quantity">Quantity</label><input id="expense-quantity" type="number" min="0.01" step="0.01" value="1" required></div>' +
            '<div class="field"><label for="expense-total">Total Price (LKR)</label><input id="expense-total" type="number" min="0.01" step="0.01" required placeholder="0.00"></div>' +
            '<div class="field"><label for="expense-date">Date</label><input id="expense-date" type="date" value="' + today() + '" required></div>' +
            '<div class="field"><label for="expense-note">Note (optional)</label><input id="expense-note" placeholder="Receipt number or note"></div>' +
          '</div>' +
          '<div class="callout">Expense saved directly to cloud database.</div>' +
          '<div class="button-row"><button class="primary-button" type="submit">Save Expense</button><button class="ghost-button" type="button" data-view="records">Manage Expenses</button></div>' +
        '</form>' +
      '</div>' +
      '<div class="panel">' +
        '<div class="section-heading"><div><h2>Today</h2><small>' + todayItems.length + ' entries</small></div><strong>' + money(todayItems.reduce(function(s, i) { return s + Number(i.total); }, 0)) + '</strong></div>' +
        '<div class="table-wrap"><table><thead><tr><th>Item</th><th>Amount</th><th></th></tr></thead><tbody>' +
        (todayItems.length ? todayItems.map(function(item) {
          return '<tr><td>' + escapeHtml(item.name) + '<br><span class="muted">' + item.quantity + ' x ' + money(item.total / item.quantity) + '</span></td><td class="amount">' + money(item.total) + '</td><td><button class="ghost-button" data-delete-expense="' + item.id + '">x</button></td></tr>';
        }).join('') : '<tr><td colspan="3" class="empty">Nothing logged today.</td></tr>') +
        '</tbody></table></div>' +
      '</div>' +
    '</div>';
}

function renderRecords() {
  var searchInputRef = document.querySelector('#record-search');
  var query = searchInputRef ? searchInputRef.value : '';
  var wasFocused = searchInputRef && document.activeElement === searchInputRef;
  var selStart = searchInputRef ? searchInputRef.selectionStart : null;
  var selEnd = searchInputRef ? searchInputRef.selectionEnd : null;
  var visibleExpenses = getVisibleExpenses();
  var queryLower = query.toLowerCase();
  var filtered = visibleExpenses.filter(function(item) {
    return ((item.user || '') + ' ' + item.name + ' ' + cat(item.category).name + ' ' + item.date).toLowerCase().indexOf(queryLower) !== -1;
  }).sort(function(a, b) { return b.date.localeCompare(a.date); });

  document.querySelector('#view-records').innerHTML =
    '<div class="panel">' +
      '<div class="section-heading"><div><h2>Expense ledger</h2><small>' + filtered.length + ' of ' + visibleExpenses.length + ' records</small></div>' +
      '<div class="button-row"><button class="ghost-button" data-action="export-csv">Export CSV</button><button class="primary-button" data-view="expenses">+ Add expense</button></div></div>' +
      '<div class="field" style="max-width:360px;margin-bottom:18px"><label for="record-search">Search records</label><input id="record-search" value="' + escapeHtml(query) + '" placeholder="Search item, category, user or date"></div>' +
      '<div class="table-wrap"><table><thead><tr><th>Item</th><th>Category</th><th>User</th><th>Date</th><th>Qty</th><th>Amount</th><th></th></tr></thead><tbody>' +
      (filtered.length ? filtered.map(function(expense) {
        return '<tr><td><strong>' + escapeHtml(expense.name) + '</strong><br><span class="muted">' + subcat(expense.subcategory) + '</span></td><td><span class="category-dot ' + cat(expense.category).color + '"></span>' + cat(expense.category).name + '</td><td>' + escapeHtml(expense.user || 'Unknown') + '</td><td>' + expense.date + '</td><td>' + expense.quantity + '</td><td class="amount">' + money(expense.total) + '</td><td><button class="ghost-button" data-delete-expense="' + expense.id + '">Delete</button></td></tr>';
      }).join('') : '<tr><td colspan="7" class="empty">No expense entries yet.</td></tr>') +
      '</tbody></table></div>' +
    '</div>';

  var newSearch = document.querySelector('#record-search');
  if (newSearch) {
    newSearch.addEventListener('input', renderRecords);
    if (wasFocused) { newSearch.focus(); newSearch.setSelectionRange(selStart, selEnd); }
  }
}

function renderAllowances() {
  var cm = selectedAllowanceMonth;
  document.querySelector('#view-allowances').innerHTML =
    '<div class="grid two-col">' +
      '<div class="panel">' +
        '<div class="section-heading"><div><h2>Monthly Allowance Budget</h2><small>Set a budget for ' + cm + '</small></div></div>' +
        '<form id="allowance-form">' +
          '<div class="field"><label for="allowance-month">Budget month</label><input id="allowance-month" type="month" value="' + cm + '"></div>' +
          categories.map(function(c, i) {
            return '<div class="field"><label for="allowance-' + c.id + '">' + c.name + ' (LKR)</label><input id="allowance-' + c.id + '" type="number" min="0" step="0.01" value="' + (allowance(c.id, cm) || [85000, 30000, 25000][i]) + '"></div>';
          }).join('') +
          '<button class="primary-button" type="submit">Save allowances</button>' +
        '</form>' +
      '</div>' +
      '<div class="panel">' +
        '<div class="section-heading"><div><h2>Month at a glance</h2><small>Allowance vs actual spending</small></div></div>' +
        categories.map(function(c, i) {
          var budget = allowance(c.id, cm) || [85000, 30000, 25000][i];
          var v = spent(c.id, cm);
          return '<div class="progress-row"><div class="progress-meta"><span>' + c.name + '</span><span>' + Math.round(v / budget * 100) + '%</span></div><div class="progress-track"><div class="progress-fill' + (c.id === 2 ? ' mint' : c.id === 3 ? ' blue' : '') + '" style="width:' + Math.min(v / budget * 100, 100) + '%"></div></div><p class="muted">' + money(v) + ' spent from ' + money(budget) + '</p></div>';
        }).join('') +
      '</div>' +
    '</div>';

  document.querySelector('#allowance-month').addEventListener('change', function(event) {
    selectedAllowanceMonth = event.target.value || currentMonth();
    renderAllowances();
  });

  document.querySelector('#allowance-form').addEventListener('submit', function(event) {
    event.preventDefault();
    var selectedMonth = document.querySelector('#allowance-month').value || cm;
    var user = sessionStorage.getItem('username') || 'mother';
    var upserts = [];
    categories.forEach(function(c) {
      var val = Number(document.querySelector('#allowance-' + c.id).value || 0);
      state.allowances[user + '_' + selectedMonth + '_' + c.id] = val;
      upserts.push({ user_username: user, month: selectedMonth, category_id: c.id, amount: val });
    });
    save();
    supabase.from('allowances').upsert(upserts, { onConflict: 'user_username,month,category_id' })
      .then(function(res) {
        if (res.error) throw res.error;
        notify('Allowances saved securely to cloud');
        render();
      })
      .catch(function(err) { console.error(err); notify('Failed to save to cloud'); });
  });
}

function renderItems() {
  document.querySelector('#view-items').innerHTML =
    '<div class="grid two-col">' +
      '<div class="panel">' +
        '<div class="section-heading"><div><h2>Item Master</h2><small>Sync the accountant\'s published item list</small></div></div>' +
        '<div class="field"><label for="catalog-source-url">Google Sheet link or CSV URL</label><input id="catalog-source-url" value="' + escapeHtml(state.catalogSourceUrl || '') + '" placeholder="https://docs.google.com/spreadsheets/d/.../edit"></div>' +
        '<p class="form-help">The sheet must be shared as "Anyone with the link can view".</p>' +
        '<div class="button-row"><button class="primary-button" data-action="sync-sheet">Sync Google Sheet</button><button class="ghost-button" data-action="import-csv">Import CSV file</button></div>' +
        '<hr>' +
        '<div class="section-heading"><div><h2>Add catalog item</h2><small>Manual addition</small></div></div>' +
        '<form id="item-form">' +
          '<div class="field"><label for="item-name">English name</label><input id="item-name" required placeholder="e.g. Red lentils 1kg"></div>' +
          '<div class="form-grid">' +
            '<div class="field"><label for="item-category">Category</label><select id="item-category">' + categoryOptions() + '</select></div>' +
            '<div class="field"><label for="item-subcategory">Sub-category</label><select id="item-subcategory">' + subcategoryOptions() + '</select></div>' +
            '<div class="field"><label for="item-unit">Default unit</label><select id="item-unit"><option>kg</option><option>g</option><option>pcs</option><option>litre</option><option>packet</option><option>pair</option><option>set</option></select></div>' +
          '</div>' +
          '<button class="primary-button" type="submit">Add to catalog</button>' +
        '</form>' +
        '<hr>' +
        '<div class="button-row"><button class="ghost-button" data-action="export-backup">Export backup</button><button class="ghost-button" data-action="import-backup">Restore backup</button></div>' +
      '</div>' +
      '<div class="panel">' +
        '<div class="section-heading"><div><h2>Catalog</h2><small>' + state.items.length + ' reusable items</small></div></div>' +
        '<div class="table-wrap"><table><thead><tr><th>Item</th><th>Category</th><th>Unit</th><th></th></tr></thead><tbody>' +
        (state.items.length ? state.items.map(function(item) {
          var langs = ""; if(item.nameSi || item.nameTa) langs = "<br><small style=\"color:var(--ink-soft);font-size:10px;\">" + escapeHtml(item.nameSi || item.name) + " · " + escapeHtml(item.nameTa || item.name) + "</small>"; return '<tr><td><strong>' + escapeHtml(item.name) + '</strong>' + langs + '<br><span class="muted">' + subcat(item.subcategory) + '</span></td><td>' + cat(item.category).name + '</td><td>' + item.unit + '</td><td><button class="ghost-button" data-delete-item="' + item.id + '">Delete</button></td></tr>';
        }).join('') : '<tr><td colspan="4" class="empty">Your catalog is empty. Sync from Google Sheet to get started.</td></tr>') +
        '</tbody></table></div>' +
      '</div>' +
    '</div>';

  document.querySelector('#item-form').addEventListener('submit', function(event) {
    event.preventDefault();
    state.items.unshift({
      id: uid('item'),
      name: document.querySelector('#item-name').value.trim(),
      category: Number(document.querySelector('#item-category').value),
      subcategory: Number(document.querySelector('#item-subcategory').value),
      unit: document.querySelector('#item-unit').value
    });
    save();
    notify('Item added to catalog');
    render();
  });
}

function renderReports() {
  document.querySelector('#view-reports').innerHTML =
    '<div class="grid two-col">' +
      '<div class="panel">' +
        '<div class="section-heading"><div><h2>Past Records & Reports</h2><small>Create a local, printable report</small></div></div>' +
        '<form id="report-form">' +
          '<div class="form-grid">' +
            '<div class="field"><label for="report-start">From</label><input id="report-start" type="date" value="' + currentMonth() + '-01"></div>' +
            '<div class="field"><label for="report-end">To</label><input id="report-end" type="date" value="' + today() + '"></div>' +
          '</div>' +
          '<div class="callout">The report is generated from cloud records. It can be printed or downloaded as a text file.</div>' +
          '<button class="primary-button" type="submit">Generate report</button>' +
        '</form>' +
      '</div>' +
      '<div class="panel">' +
        '<div class="section-heading"><div><h2>Submission outbox</h2><small>' + state.reports.length + ' local reports</small></div></div>' +
        (state.reports.length ?
          '<div class="table-wrap"><table><thead><tr><th>Period</th><th>Status</th><th></th></tr></thead><tbody>' +
          state.reports.map(function(report) {
            return '<tr><td>' + report.start + ' to ' + report.end + '</td><td><span class="badge ' + report.status + '">' + report.status + '</span></td><td><button class="ghost-button" data-download-report="' + report.id + '">Download</button></td></tr>';
          }).join('') +
          '</tbody></table></div>' :
          '<div class="empty">Generated reports will appear here.</div>'
        ) +
      '</div>' +
    '</div>';

  document.querySelector('#report-form').addEventListener('submit', function(event) {
    event.preventDefault();
    var start = document.querySelector('#report-start').value;
    var end = document.querySelector('#report-end').value;
    if (!start || !end || start > end) return notify('Choose a valid date range');
    var report = makeReport(start, end);
    state.reports.unshift({ id: uid('report'), start: start, end: end, status: 'pending', text: report });
    save();
    notify('Report added to local outbox');
    render();
  });
}

function renderProfile() {
  var profile = getProfile();
  var role = (sessionStorage.getItem('role') || '').toLowerCase();
  var defaultUsertype = role === 'mother' ? 'Mother / YCCW' : 'Other';
  var currentUsertype = profile.usertype || defaultUsertype;
  document.querySelector('#view-profile').innerHTML =
    '<div class="grid two-col">' +
      '<div class="panel">' +
        '<div class="section-heading"><div><h2>Profile & Settings</h2><small>Used on locally generated reports</small></div></div>' +
        '<form id="profile-form">' +
          '<div class="field"><label for="profile-name-input">Name</label><input id="profile-name-input" value="' + escapeHtml(profile.name) + '" placeholder="Family member name"></div>' +
          '<div class="form-grid">' +
            '<div class="field"><label for="profile-usertype">User Type</label><select id="profile-usertype"' + (isAdmin ? '' : ' disabled') + '>' +
              '<option value="Mother / YCCW"' + (currentUsertype === 'Mother / YCCW' ? ' selected' : '') + '>Usertype 1 : Mother / YCCW</option>' +
              '<option value="Father / Guardian"' + (currentUsertype === 'Father / Guardian' ? ' selected' : '') + '>Usertype 2 : Father / Guardian</option>' +
              '<option value="Other"' + (currentUsertype === 'Other' ? ' selected' : '') + '>Usertype 3 : Other</option>' +
            '</select></div>' +
            '<div class="field"><label for="profile-village">Village</label><input id="profile-village" value="' + escapeHtml(profile.village) + '"></div>' +
            '<div class="field"><label for="profile-house">House number</label><input id="profile-house" value="' + escapeHtml(profile.house) + '"></div>' +
            '<div class="field"><label for="profile-phone">Phone</label><input id="profile-phone" value="' + escapeHtml(profile.phone) + '"></div>' +
            '<div class="field"><label for="profile-email">Email</label><input id="profile-email" type="email" value="' + escapeHtml(profile.email) + '"></div>' +
          '</div>' +
          '<button class="primary-button" type="submit">Save profile</button>' +
        '</form>' +
      '</div>' +
      '<div class="panel">' +
        '<div class="section-heading"><div><h2>Data controls</h2><small>Backup and restore</small></div></div>' +
        '<p class="form-help">Use a backup before changing devices or clearing browser storage.</p>' +
        '<div class="button-row"><button class="primary-button" data-action="export-backup">Download backup</button><button class="ghost-button" data-action="import-backup">Restore backup</button></div>' +
      '</div>' +
    '</div>';

  document.querySelector('#profile-form').addEventListener('submit', function(event) {
    event.preventDefault();
    var user = sessionStorage.getItem('username') || 'mother';
    if (!state.profiles) state.profiles = {};
    state.profiles[user] = Object.assign(state.profiles[user] || {}, {
      name: document.querySelector('#profile-name-input').value,
      usertype: document.querySelector('#profile-usertype').value,
      village: document.querySelector('#profile-village').value,
      house: document.querySelector('#profile-house').value,
      phone: document.querySelector('#profile-phone').value,
      email: document.querySelector('#profile-email').value
    });
    save();
    supabase.from('users').update({
      name: state.profiles[user].name,
      usertype: state.profiles[user].usertype,
      village: state.profiles[user].village,
      house: state.profiles[user].house,
      phone: state.profiles[user].phone,
      email: state.profiles[user].email
    }).eq('username', user)
      .then(function(res) {
        if (res.error) throw res.error;
        notify('Profile saved securely to cloud');
        render();
      })
      .catch(function(err) { console.error(err); notify('Failed to save to cloud'); });
  });
}

function renderUsers() {
  document.querySelector('#view-users').innerHTML =
    '<div class="grid two-col">' +
      '<div class="panel">' +
        '<div class="section-heading"><div><h2 id="user-form-title">Create / Edit User</h2><small>Add mothers or accountants</small></div></div>' +
        '<form id="add-user-form">' +
          '<input type="hidden" id="editing-username" value="">' +
          '<div class="field"><label>Name / Identifier</label><input id="new-user-name" required placeholder="e.g. Jane (Mother)"></div>' +
          '<div class="field"><label>Username</label><input id="new-user-username" required></div>' +
          '<div class="field"><label>Password</label><input id="new-user-password" type="text" required></div>' +
          '<div class="field"><label>Role</label><select id="new-user-role"><option value="mother">Mother (Data Entry)</option><option value="accountant">Accountant (Reports only)</option><option value="admin">Admin (Full Access)</option></select></div>' +
          '<div class="button-row"><button class="primary-button" type="submit" id="add-user-submit">Create User</button><button class="ghost-button" type="button" id="cancel-edit" style="display:none">Cancel</button></div>' +
        '</form>' +
      '</div>' +
      '<div class="panel">' +
        '<div class="section-heading"><div><h2>Active Users</h2><small>Loaded from cloud</small></div></div>' +
        '<div class="table-wrap"><table><thead><tr><th>Name</th><th>Username</th><th>Role</th><th>Actions</th></tr></thead><tbody id="user-table-body"><tr><td colspan="4" class="empty">Loading users...</td></tr></tbody></table></div>' +
      '</div>' +
    '</div>';

  function loadUsers() {
    supabase.from('users').select('*').then(function(res) {
      var tbody = document.querySelector('#user-table-body');
      if (res.error || !res.data || !res.data.length) {
        return (tbody.innerHTML = '<tr><td colspan="4" class="empty">No users found.</td></tr>');
      }
      window.loadedUsers = res.data;
      tbody.innerHTML = res.data.map(function(u) {
        return '<tr><td><strong>' + escapeHtml(u.name) + '</strong></td><td>' + escapeHtml(u.username) + '</td><td><span class="badge ' + u.role + '">' + u.role + '</span></td><td>' +
          (u.username === 'admin' ? '' : '<button class="ghost-button" onclick="editUser(\'' + escapeHtml(u.username) + '\')">Edit</button> <button class="ghost-button" onclick="deleteUser(\'' + escapeHtml(u.username) + '\')">Delete</button>') +
          '</td></tr>';
      }).join('');
    }).catch(function() {
      var tbody = document.querySelector('#user-table-body');
      if (tbody) tbody.innerHTML = '<tr><td colspan="4" class="empty">Failed to load users.</td></tr>';
    });
  }
  loadUsers();

  window.editUser = function(username) {
    var user = (window.loadedUsers || []).find(function(u) { return u.username === username; });
    if (!user) return;
    document.querySelector('#editing-username').value = user.username;
    document.querySelector('#new-user-username').value = user.username;
    document.querySelector('#new-user-username').readOnly = true;
    document.querySelector('#new-user-name').value = user.name;
    document.querySelector('#new-user-password').value = user.password;
    document.querySelector('#new-user-role').value = user.role;
    document.querySelector('#user-form-title').textContent = 'Edit User';
    document.querySelector('#add-user-submit').textContent = 'Update User';
    document.querySelector('#cancel-edit').style.display = 'inline-block';
  };

  window.deleteUser = function(username) {
    if (!confirm('Are you sure you want to delete ' + username + '?')) return;
    supabase.from('users').delete().eq('username', username)
      .then(function(res) {
        if (res.error) throw res.error;
        notify('User deleted');
        loadUsers();
      })
      .catch(function(e) { console.error(e); notify('Failed to delete user'); });
  };

  document.querySelector('#cancel-edit').addEventListener('click', function() {
    document.querySelector('#editing-username').value = '';
    document.querySelector('#new-user-username').readOnly = false;
    document.querySelector('#add-user-form').reset();
    document.querySelector('#user-form-title').textContent = 'Create New User';
    document.querySelector('#add-user-submit').textContent = 'Create User';
    document.querySelector('#cancel-edit').style.display = 'none';
  });

  document.querySelector('#add-user-form').addEventListener('submit', function(event) {
    event.preventDefault();
    var btn = document.querySelector('#add-user-submit');
    var editing = document.querySelector('#editing-username').value;
    btn.disabled = true;
    btn.textContent = editing ? 'Updating...' : 'Creating...';

    function resetForm() {
      document.querySelector('#add-user-form').reset();
      document.querySelector('#editing-username').value = '';
      document.querySelector('#new-user-username').readOnly = false;
      document.querySelector('#user-form-title').textContent = 'Create New User';
      document.querySelector('#add-user-submit').textContent = 'Create User';
      document.querySelector('#add-user-submit').disabled = false;
      document.querySelector('#cancel-edit').style.display = 'none';
      loadUsers();
    }

    if (editing) {
      supabase.from('users').update({
        name: document.querySelector('#new-user-name').value.trim(),
        password: document.querySelector('#new-user-password').value.trim(),
        role: document.querySelector('#new-user-role').value
      }).eq('username', editing)
        .then(function(res) {
          if (res.error) throw res.error;
          notify('User updated!');
          resetForm();
        })
        .catch(function(err) { console.error(err); notify('Failed to update user'); btn.disabled = false; });
    } else {
      supabase.from('users').insert({
        username: document.querySelector('#new-user-username').value.trim(),
        name: document.querySelector('#new-user-name').value.trim(),
        password: document.querySelector('#new-user-password').value.trim(),
        role: document.querySelector('#new-user-role').value,
        usertype: 'Mother / YCCW'
      })
        .then(function(res) {
          if (res.error) throw res.error;
          notify('User created!');
          resetForm();
        })
        .catch(function(err) {
          console.error(err);
          if (err.code === '23505') notify('Username already exists');
          else notify('Failed to add user');
          btn.disabled = false;
          btn.textContent = 'Create User';
        });
    }
  });
}

// ============================================================
// --- Global Event Listeners ---
// ============================================================

// Navigation clicks & action buttons
document.addEventListener('click', function(event) {
  var nav = event.target.closest('[data-view]');
  if (nav) { activeView = nav.getAttribute('data-view'); render(); return; }

  var deleteExpense = event.target.closest('[data-delete-expense]');
  if (deleteExpense) {
    supabase.from('expenses').delete().eq('id', deleteExpense.dataset.deleteExpense)
      .then(function(res) {
        if (res.error) throw res.error;
        notify('Expense deleted from cloud');
        fetchCloudData();
      })
      .catch(function(err) { console.error(err); notify('Failed to delete'); });
    return;
  }

  var deleteItem = event.target.closest('[data-delete-item]');
  if (deleteItem) {
    state.items = state.items.filter(function(item) { return item.id !== deleteItem.dataset.deleteItem; });
    save();
    notify('Catalog item deleted');
    render();
    return;
  }

  var reportDl = event.target.closest('[data-download-report]');
  if (reportDl) { makeReportDownload(reportDl.dataset.downloadReport); return; }

  var actionNode = event.target.closest('[data-action]');
  if (actionNode) {
    var action = actionNode.dataset.action;
    if (action === 'export-csv') exportCsv();
    if (action === 'export-backup') exportBackup();
    if (action === 'import-backup') importBackup();
    if (action === 'import-csv') importCsv();
    if (action === 'sync-sheet') syncGoogleSheet();
    if (action === 'refresh-dashboard') {
      var btn = actionNode;
      btn.disabled = true;
      btn.textContent = 'Refreshing...';
      fetchCloudData();
      setTimeout(function() {
        if (btn) { btn.disabled = false; btn.innerHTML = '&#x21bb; Refresh Data'; }
      }, 2000);
    }
  }
});

// Expense form submit
document.addEventListener('submit', function(event) {
  if (event.defaultPrevented || event.target.id !== 'expense-form') return;
  event.preventDefault();
  var quantity = Number(document.querySelector('#expense-quantity').value);
  var total = Number(document.querySelector('#expense-total').value);
  if (quantity <= 0 || total <= 0) return notify('Enter a valid quantity and total price');
  var expense = {
    user: sessionStorage.getItem('username') || 'mother',
    date: document.querySelector('#expense-date').value || today(),
    name: document.querySelector('#expense-name').value.trim(),
    category: Number(document.querySelector('#expense-category').value),
    subcategory: Number(document.querySelector('#expense-subcategory').value),
    quantity: quantity,
    total: total,
    note: document.querySelector('#expense-note').value.trim()
  };
  supabase.from('expenses').insert(expense)
    .then(function(res) {
      if (res.error) throw res.error;
      notify('Expense saved to cloud');
      fetchCloudData();
    })
    .catch(function(err) { console.error(err); notify('Failed to save expense'); });
});

// Backup file restore
document.querySelector('#backup-input').addEventListener('change', function(event) {
  var file = event.target.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function() {
    try {
      if (event.target.dataset.mode === 'csv') {
        var result = mergeCatalogCsv(String(reader.result));
        notify('CSV merged: ' + result.added + ' added, ' + result.updated + ' updated');
      } else {
        var imported = JSON.parse(reader.result);
        if (!imported.expenses && !imported.profiles) throw new Error('Invalid backup');
        state = Object.assign(initialState(), imported);
        save();
        notify('Data restored locally');
      }
      render();
    } catch (e) { notify('Could not read that backup file'); }
  };
  reader.readAsText(file);
  event.target.value = '';
});

// Language button
var langBtn = document.querySelector('#language-button');
if (langBtn) langBtn.addEventListener('click', function() { notify('English interface selected'); });

// Login
document.querySelector('#login-form').addEventListener('submit', function(event) {
  event.preventDefault();
  var errorEl = document.querySelector('#login-error');
  var user = document.querySelector('#login-username').value.trim().toLowerCase();
  var pass = document.querySelector('#login-password').value.trim();
  var btn = event.target.querySelector('button');
  errorEl.textContent = '';
  btn.textContent = 'Verifying...';
  btn.disabled = true;

  if (!supabase) {
    errorEl.textContent = 'System error: Database client not loaded';
    btn.textContent = 'Sign In';
    btn.disabled = false;
    return;
  }

  supabase.from('users').select('*').then(function(res) {
    if (res.error) throw new Error('Database connection failed');
    var validUser = (res.data || []).find(function(u) {
      return String(u.username).toLowerCase() === user && String(u.password) === pass;
    });
    if (validUser) {
      isLoggedIn = true;
      isAdmin = (validUser.role || '').toLowerCase().indexOf('admin') !== -1;
      sessionStorage.setItem('logged_in', 'true');
      sessionStorage.setItem('username', validUser.username);
      sessionStorage.setItem('role', validUser.role);
      sessionStorage.setItem('profile_name', validUser.name);
      if (!state.profiles) state.profiles = {};
      state.profiles[validUser.username] = { name: validUser.name || '', usertype: validUser.usertype || 'Mother / YCCW', village: validUser.village || '', house: validUser.house || '', phone: validUser.phone || '', email: validUser.email || '' };
      save();
      document.querySelector('#login-username').value = '';
      document.querySelector('#login-password').value = '';
      notify('Logged in successfully');
      render();
      fetchCloudData();
    } else {
      errorEl.textContent = 'Invalid username or password.';
    }
    btn.textContent = 'Sign In';
    btn.disabled = false;
  }).catch(function(err) {
    errorEl.textContent = err.message || 'Network error. Please try again.';
    btn.textContent = 'Sign In';
    btn.disabled = false;
  });
});

// Logout
document.querySelector('#logout-button').addEventListener('click', function() {
  sessionStorage.clear();
  isLoggedIn = false;
  isAdmin = false;
  activeView = 'dashboard';
  notify('Logged out successfully');
  render();
});

// --- Start App ---
render();
if (isLoggedIn) {
  fetchCloudData();
}

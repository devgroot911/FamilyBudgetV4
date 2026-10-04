const fs = require('fs');

let appJs = fs.readFileSync('app.js', 'utf8');

// 1. renderExpenses
appJs = appJs.replace(
  /document\.querySelector\('#view-expenses'\)\.innerHTML =\s*'<div class="grid two-col">' \+\s*'<div class="panel">' \+\s*'<div class="section-heading"><div><h2>Item Details Form<\/h2><small>Saved to cloud<\/small><\/div><\/div>' \+\s*'<form id="expense-form">' \+\s*\/\/\s*Category \+ Subcategory side by side/g,
  `var role = (sessionStorage.getItem('role') || 'mother').toLowerCase();
    var isManager = role.indexOf('admin') !== -1 || role.indexOf('director') !== -1 || role.indexOf('accountant') !== -1 || role.indexOf('assistant') !== -1;
    var myName = sessionStorage.getItem('username') || 'mother';
    var userSelectHtml = '';
    if (isManager && state.profiles) {
      var myVillage = state.profiles[myName] ? state.profiles[myName].village : null;
      var isNational = (role === 'national_director' || role === 'accountant' || role === 'admin' || myVillage === 'All');
      var options = Object.keys(state.profiles).filter(function(u) {
        if (state.profiles[u].usertype && state.profiles[u].usertype.toLowerCase().indexOf('admin') !== -1) return false;
        if (isNational) return true;
        return state.profiles[u].village === myVillage;
      }).map(function(u) {
        return '<option value="' + escapeHtml(u) + '">' + escapeHtml(state.profiles[u].name || u) + ' (' + u + ')</option>';
      }).join('');
      userSelectHtml = '<div class="field" style="margin-bottom:15px"><label for="expense-user">Assign to Mother</label><select id="expense-user">' + options + '</select></div>';
    }

    document.querySelector('#view-expenses').innerHTML =
      '<div class="grid two-col">' +
        '<div class="panel">' +
          '<div class="section-heading"><div><h2 id="expense-form-title">Item Details Form</h2><small>Saved to cloud</small></div></div>' +
          '<form id="expense-form">' +
            '<input type="hidden" id="expense-id" value="">' +
            userSelectHtml +
            // Category + Subcategory side by side`
);

// 2. Submit Event Handler
appJs = appJs.replace(
  /var expense = \{\s*user: sessionStorage\.getItem\('username'\) \|\| 'mother',\s*date: document\.querySelector\('#expense-date'\)\.value \|\| today\(\),\s*name: document\.querySelector\('#expense-name'\)\.value\.trim\(\),\s*category: Number\(document\.querySelector\('#expense-category'\)\.value\),\s*subcategory: Number\(document\.querySelector\('#expense-subcategory'\)\.value\),\s*quantity: quantity,\s*total: total,\s*note: document\.querySelector\('#expense-note'\)\.value\.trim\(\)\s*\};\s*supabase\.from\('expenses'\)\.insert\(expense\)\s*\.then\(function\(res\) \{\s*if \(res\.error\) throw res\.error;\s*notify\('Expense saved to cloud'\);\s*fetchCloudData\(\);\s*\}\)\s*\.catch\(function\(err\) \{ console\.error\(err\); notify\('Failed to save expense'\); \}\);/g,
  `var userField = document.querySelector('#expense-user');
    var expenseId = document.querySelector('#expense-id') ? document.querySelector('#expense-id').value : '';
    var expense = {
      user: userField ? userField.value : (sessionStorage.getItem('username') || 'mother'),
      date: document.querySelector('#expense-date').value || today(),
      name: document.querySelector('#expense-name').value.trim(),
      category: Number(document.querySelector('#expense-category').value),
      subcategory: Number(document.querySelector('#expense-subcategory').value),
      quantity: quantity,
      total: total,
      note: document.querySelector('#expense-note').value.trim()
    };
    var req = expenseId ? supabase.from('expenses').update(expense).eq('id', expenseId) : supabase.from('expenses').insert(expense);
    req.then(function(res) {
        if (res.error) throw res.error;
        notify(expenseId ? 'Expense updated in cloud' : 'Expense saved to cloud');
        if (expenseId) {
          if (document.querySelector('#expense-id')) document.querySelector('#expense-id').value = '';
          if (document.querySelector('#expense-form-title')) document.querySelector('#expense-form-title').textContent = 'Item Details Form';
          var btn = document.querySelector('#expense-form button[type="submit"]');
          if (btn) btn.textContent = 'Save Expense';
        }
        fetchCloudData();
      })
      .catch(function(err) { console.error(err); notify('Failed to save expense'); });`
);

// 3. Edit Event Listener
// Find `var deleteExpense = event.target.closest('[data-delete-expense]');` inside the click listener.
appJs = appJs.replace(
  /var deleteExpense = event\.target\.closest\('\[data-delete-expense\]'\);/g,
  `var editExpense = event.target.closest('[data-edit-expense]');
    if (editExpense) {
      var id = editExpense.dataset.editExpense;
      var exp = state.expenses.find(function(x) { return x.id === id; });
      if (exp) {
        document.querySelectorAll('.nav-item').forEach(function(btn) {
          btn.classList.toggle('active', btn.dataset.view === 'expenses');
        });
        document.querySelectorAll('.view').forEach(function(v) { v.classList.remove('active'); });
        document.querySelector('#view-expenses').classList.add('active');
        activeView = 'expenses';
        render();
        
        setTimeout(function() {
          if (document.querySelector('#expense-id')) document.querySelector('#expense-id').value = exp.id;
          if (document.querySelector('#expense-form-title')) document.querySelector('#expense-form-title').textContent = 'Edit Expense';
          if (document.querySelector('#expense-user')) document.querySelector('#expense-user').value = exp.user;
          document.querySelector('#expense-category').value = exp.category;
          document.querySelector('#expense-subcategory').innerHTML = subcategoryOptions(exp.category);
          document.querySelector('#expense-subcategory').value = exp.subcategory;
          document.querySelector('#expense-name').value = exp.name;
          document.querySelector('#expense-quantity').value = exp.quantity;
          document.querySelector('#expense-total').value = exp.total;
          document.querySelector('#expense-date').value = exp.date;
          document.querySelector('#expense-note').value = exp.note || '';
          var submitBtn = document.querySelector('#expense-form button[type="submit"]');
          if (submitBtn) submitBtn.textContent = 'Update Expense';
          window.scrollTo(0, 0);
        }, 50);
      }
      return;
    }
    
    var deleteExpense = event.target.closest('[data-delete-expense]');`
);

fs.writeFileSync('app.js', appJs);
console.log('Fixed add_modify using regex');

const fs = require('fs');
let app = fs.readFileSync('app.js', 'utf8');

const enhanceCode = `
// ============================================================
function enhanceExpenseForm() {
  var form = document.querySelector('#expense-form');
  if (!form || document.querySelector('#expense-item')) return;

  // Add catalog item select at top of form grid
  var field = document.createElement('div');
  field.className = 'field full';
  field.innerHTML = '<label for="expense-item">Catalog item</label><select id="expense-item"></select><p class="form-help">Choose an item from the cards below, or leave as Custom item to type manually.</p>';
  form.querySelector('.form-grid').prepend(field);

  // Add catalog cards panel
  var catalogPanel = document.createElement('div');
  catalogPanel.className = 'expense-catalog-panel';
  catalogPanel.innerHTML = '<div class="section-heading"><div><h3>Catalog Items</h3><small id="expense-catalog-count"></small></div></div><div class="expense-catalog-grid" id="expense-catalog-grid"></div>';
  form.querySelector('.form-grid').after(catalogPanel);

  var itemSelect = document.querySelector('#expense-item');
  var categorySelect = document.querySelector('#expense-category');
  var subcategorySelect = document.querySelector('#expense-subcategory');

  function chooseItem(item) {
    itemSelect.value = item.id;
    document.querySelector('#expense-name').value = item.name;
  }

  function refreshItems() {
    var categoryId = Number(categorySelect.value);
    var subcategoryId = Number(subcategorySelect.value);
    var selectedId = itemSelect.value;
    var filtered = state.items.filter(function(item) {
      return item.category === categoryId && item.subcategory === subcategoryId;
    }).sort(function(a, b) { return a.name.localeCompare(b.name); });

    itemSelect.innerHTML = '<option value="">Custom item</option>' + filtered.map(function(item) {
      return '<option value="' + escapeHtml(item.id) + '">' + escapeHtml(item.name) + ' - ' + item.subcategory + '</option>';
    }).join('');

    var countEl = document.querySelector('#expense-catalog-count');
    var gridEl = document.querySelector('#expense-catalog-grid');
    if (countEl) countEl.textContent = filtered.length + ' matching items';
    if (gridEl) {
      if (filtered.length) {
        gridEl.innerHTML = filtered.map(function(item) {
          return '<button type="button" class="expense-catalog-card' + (item.id === selectedId ? ' selected' : '') + '" data-expense-item-id="' + escapeHtml(item.id) + '"><strong>' + escapeHtml(item.name) + '</strong><span>' + escapeHtml(item.unit || 'kg') + '</span></button>';
        }).join('');
        gridEl.querySelectorAll('[data-expense-item-id]').forEach(function(button) {
          button.addEventListener('click', function() {
            var found = state.items.find(function(item) { return item.id === button.dataset.expenseItemId; });
            if (found) { chooseItem(found); refreshItems(); }
          });
        });
      } else {
        gridEl.innerHTML = '<div class="empty">No catalog items for Category ' + categoryId + ' / Sub-category ' + subcategoryId + '. Sync the Google Sheet in Item Master first.</div>';
      }
    }

    var stillValid = filtered.some(function(item) { return item.id === selectedId; });
    if (stillValid) { itemSelect.value = selectedId; }
    else { itemSelect.value = ''; document.querySelector('#expense-name').value = ''; }
  }

  itemSelect.addEventListener('change', function(event) {
    var found = state.items.find(function(item) { return item.id === event.target.value; });
    if (found) chooseItem(found);
  });
  categorySelect.addEventListener('change', refreshItems);
  subcategorySelect.addEventListener('change', refreshItems);
  refreshItems();
}

`;

const insertBefore = 'function renderExpenses()';
app = app.replace(insertBefore, enhanceCode + insertBefore);
fs.writeFileSync('app.js', app);
console.log('enhanceExpenseForm inserted');

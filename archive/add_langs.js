const fs = require('fs');
let appJs = fs.readFileSync('app.js', 'utf8');

// Update item list table row
appJs = appJs.replace(
  'return \'<tr><td><strong>\' + escapeHtml(item.name) + \'</strong><br><span class="muted">\' + subcat(item.subcategory) + \'</span></td><td>\' + cat(item.category).name + \'</td><td>\' + item.unit + \'</td><td><button class="ghost-button" data-delete-item="\' + item.id + \'">Delete</button></td></tr>\';',
  'var langs = ""; if(item.nameSi || item.nameTa) langs = "<br><small style=\\"color:var(--ink-soft);font-size:10px;\\">" + escapeHtml(item.nameSi || item.name) + " · " + escapeHtml(item.nameTa || item.name) + "</small>"; return \'<tr><td><strong>\' + escapeHtml(item.name) + \'</strong>\' + langs + \'<br><span class="muted">\' + subcat(item.subcategory) + \'</span></td><td>\' + cat(item.category).name + \'</td><td>\' + item.unit + \'</td><td><button class="ghost-button" data-delete-item="\' + item.id + \'">Delete</button></td></tr>\';'
);

// Update expense form catalog cards
const oldCardHTML = `return '<button type="button" class="expense-catalog-card" data-expense-item-id="' + escapeHtml(item.id) + '">' +
              '<strong>' + escapeHtml(item.name) + '</strong>' +
              '<span>' + escapeHtml(item.unit || 'kg') + '</span>' +
            '</button>';`;
const newCardHTML = `var langs = (item.nameSi || item.nameTa) ? '<small class="catalog-language-names" style="color:var(--ink-soft); font-size:9px; display:block; margin-top:2px;">' + escapeHtml(item.nameSi || item.name) + ' · ' + escapeHtml(item.nameTa || item.name) + '</small>' : '';
            return '<button type="button" class="expense-catalog-card" data-expense-item-id="' + escapeHtml(item.id) + '">' +
              '<strong>' + escapeHtml(item.name) + '</strong>' +
              langs +
              '<span>' + escapeHtml(item.unit || 'kg') + '</span>' +
            '</button>';`;

appJs = appJs.replace(oldCardHTML, newCardHTML);

fs.writeFileSync('app.js', appJs);
console.log('Added language names to catalog cards and item table');

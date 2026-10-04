const fs = require('fs');
let appJs = fs.readFileSync('app.js', 'utf8');

// 1. Add getTranslationsHtml helper function
const helperFn = `function getTranslationsHtml(name) {
  var item = state.items.find(function(i) { return i.name.toLowerCase() === (name || '').toLowerCase(); });
  if (item && (item.nameSi || item.nameTa)) {
    return '<br><small style="color:var(--ink-soft);font-size:10px;line-height:1.2;display:inline-block;margin-top:2px;">' + escapeHtml(item.nameSi || item.name) + ' &#183; ' + escapeHtml(item.nameTa || item.name) + '</small>';
  }
  return '';
}
`;
if (!appJs.includes('getTranslationsHtml')) {
  appJs = appJs.replace('function getVisibleExpenses() {', helperFn + 'function getVisibleExpenses() {');
}

// 2. Fix the catalog cards in enhanceExpenseForm that my last script missed
appJs = appJs.replace(
  /return '<button type="button" class="expense-catalog-card"[^>]+>'\s*\+\s*'<strong>' \+ escapeHtml\(item\.name\) \+ '<\/strong>'\s*\+\s*'<span>' \+ escapeHtml\(item\.unit \|\| 'kg'\) \+ '<\/span>'\s*\+\s*'<\/button>';/g,
  `var langs = (item.nameSi || item.nameTa) ? '<small class="catalog-language-names" style="color:var(--ink-soft); font-size:9px; display:block; margin-top:2px;">' + escapeHtml(item.nameSi || item.name) + ' &#183; ' + escapeHtml(item.nameTa || item.name) + '</small>' : '';
            return '<button type="button" class="expense-catalog-card" data-expense-item-id="' + escapeHtml(item.id) + '">' +
              '<strong>' + escapeHtml(item.name) + '</strong>' + langs +
              '<span>' + escapeHtml(item.unit || 'kg') + '</span>' +
            '</button>';`
);

// 3. Add to Dashboard recent table
appJs = appJs.replace(
  /'<tr><td><strong>' \+ escapeHtml\(e\.name\) \+ '<\/strong><br><span class="muted">'/g,
  `'<tr><td><strong>' + escapeHtml(e.name) + '</strong>' + getTranslationsHtml(e.name) + '<br><span class="muted">'`
);

// 4. Add to Records filtered table
appJs = appJs.replace(
  /'<tr><td><strong>' \+ escapeHtml\(expense\.name\) \+ '<\/strong><br><span class="muted">'/g,
  `'<tr><td><strong>' + escapeHtml(expense.name) + '</strong>' + getTranslationsHtml(expense.name) + '<br><span class="muted">'`
);

// 5. Add to Expenses todayItems table
appJs = appJs.replace(
  /'<tr><td>' \+ escapeHtml\(item\.name\) \+ '<br><span class="muted">' \+ item\.quantity/g,
  `'<tr><td><strong>' + escapeHtml(item.name) + '</strong>' + getTranslationsHtml(item.name) + '<br><span class="muted">' + item.quantity`
);

fs.writeFileSync('app.js', appJs);
console.log('Fixed translations everywhere!');

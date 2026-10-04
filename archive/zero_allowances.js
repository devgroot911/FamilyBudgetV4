const fs = require('fs');
let appJs = fs.readFileSync('app.js', 'utf8');

appJs = appJs.replace(
  'var totalAllowance = categories.reduce(function(s, c) { return s + allowance(c.id); }, 0) || 140000;',
  'var totalAllowance = categories.reduce(function(s, c) { return s + allowance(c.id); }, 0);'
);

appJs = appJs.replace(
  'var budget = allowance(c.id) || [85000, 30000, 25000][i];\n            var v = spent(c.id);\n            return \'<div class="progress-row"><div class="progress-meta"><span>\' + c.name + \'</span><span>\' + money(v) + \' / \' + money(budget) + \'</span></div><div class="progress-track"><div class="progress-fill\' + (i === 1 ? \' mint\' : i === 2 ? \' blue\' : \'\') + \'" style="width:\' + Math.min(v / budget * 100, 100) + \'%\"></div></div></div>\';',
  'var budget = allowance(c.id) || 0;\n            var v = spent(c.id);\n            var pct = budget > 0 ? Math.min((v / budget) * 100, 100) : 0;\n            return \'<div class="progress-row"><div class="progress-meta"><span>\' + c.name + \'</span><span>\' + money(v) + \' / \' + money(budget) + \'</span></div><div class="progress-track"><div class="progress-fill\' + (i === 1 ? \' mint\' : i === 2 ? \' blue\' : \'\') + \'" style="width:\' + pct + \'%\"></div></div></div>\';'
);

appJs = appJs.replace(
  'return \'<div class="field"><label for="allowance-\' + c.id + \'">\' + c.name + \' (LKR)</label><input id="allowance-\' + c.id + \'" type="number" min="0" step="0.01" value="\' + (allowance(c.id, cm) || [85000, 30000, 25000][i]) + \'"></div>\';',
  'return \'<div class="field"><label for="allowance-\' + c.id + \'">\' + c.name + \' (LKR)</label><input id="allowance-\' + c.id + \'" type="number" min="0" step="0.01" value="\' + (allowance(c.id, cm) || 0) + \'"></div>\';'
);

appJs = appJs.replace(
  'var budget = allowance(c.id, cm) || [85000, 30000, 25000][i];\n            var v = spent(c.id, cm);\n            return \'<div class="progress-row"><div class="progress-meta"><span>\' + c.name + \'</span><span>\' + Math.round(v / budget * 100) + \'%</span></div><div class="progress-track"><div class="progress-fill\' + (c.id === 2 ? \' mint\' : c.id === 3 ? \' blue\' : \'\') + \'" style="width:\' + Math.min(v / budget * 100, 100) + \'%\"></div></div><p class="muted">\' + money(v) + \' spent from \' + money(budget) + \'</p></div>\';',
  'var budget = allowance(c.id, cm) || 0;\n            var v = spent(c.id, cm);\n            var pctStr = budget > 0 ? Math.round((v / budget) * 100) + "%" : "0%";\n            var pct = budget > 0 ? Math.min((v / budget) * 100, 100) : 0;\n            return \'<div class="progress-row"><div class="progress-meta"><span>\' + c.name + \'</span><span>\' + pctStr + \'</span></div><div class="progress-track"><div class="progress-fill\' + (c.id === 2 ? \' mint\' : c.id === 3 ? \' blue\' : \'\') + \'" style="width:\' + pct + \'%\"></div></div><p class="muted">\' + money(v) + \' spent from \' + money(budget) + \'</p></div>\';'
);

fs.writeFileSync('app.js', appJs);
console.log('Removed hardcoded allowances');

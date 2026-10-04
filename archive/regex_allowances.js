const fs = require('fs');
let appJs = fs.readFileSync('app.js', 'utf8');

// 1. Remove 140000 fallback
appJs = appJs.replace(
  /\|\| 140000;/g,
  ';'
);

// 2. Remove [85000, 30000, 25000][i] fallback and update the rendering logic for those blocks safely.
// For Dashboard renderDashboard
appJs = appJs.replace(
  /var budget = allowance\(c\.id\) \|\| \[85000, 30000, 25000\]\[i\];\s*var v = spent\(c\.id\);\s*return '<div class="progress-row"><div class="progress-meta"><span>' \+ c\.name \+ '<\/span><span>' \+ money\(v\) \+ ' \/ ' \+ money\(budget\) \+ '<\/span><\/div><div class="progress-track"><div class="progress-fill' \+ \(i === 1 \? ' mint' : i === 2 \? ' blue' : ''\) \+ '" style="width:' \+ Math\.min\(v \/ budget \* 100, 100\) \+ '%"><\/div><\/div><\/div>';/g,
  `var budget = allowance(c.id) || 0;
            var v = spent(c.id);
            var pct = budget > 0 ? Math.min((v / budget) * 100, 100) : 0;
            return '<div class="progress-row"><div class="progress-meta"><span>' + c.name + '</span><span>' + money(v) + ' / ' + money(budget) + '</span></div><div class="progress-track"><div class="progress-fill' + (i === 1 ? ' mint' : i === 2 ? ' blue' : '') + '" style="width:' + pct + '%"></div></div></div>';`
);

// For Allowances Form
appJs = appJs.replace(
  /value="' \+ \(allowance\(c\.id, cm\) \|\| \[85000, 30000, 25000\]\[i\]\) \+ '"/g,
  `value="' + (allowance(c.id, cm) || 0) + '"`
);

// For Allowances Dashboard
appJs = appJs.replace(
  /var budget = allowance\(c\.id, cm\) \|\| \[85000, 30000, 25000\]\[i\];\s*var v = spent\(c\.id, cm\);\s*return '<div class="progress-row"><div class="progress-meta"><span>' \+ c\.name \+ '<\/span><span>' \+ Math\.round\(v \/ budget \* 100\) \+ '%<\/span><\/div><div class="progress-track"><div class="progress-fill' \+ \(c\.id === 2 \? ' mint' : c\.id === 3 \? ' blue' : ''\) \+ '" style="width:' \+ Math\.min\(v \/ budget \* 100, 100\) \+ '%"><\/div><\/div><p class="muted">' \+ money\(v\) \+ ' spent from ' \+ money\(budget\) \+ '<\/p><\/div>';/g,
  `var budget = allowance(c.id, cm) || 0;
            var v = spent(c.id, cm);
            var pctStr = budget > 0 ? Math.round((v / budget) * 100) + "%" : "0%";
            var pct = budget > 0 ? Math.min((v / budget) * 100, 100) : 0;
            return '<div class="progress-row"><div class="progress-meta"><span>' + c.name + '</span><span>' + pctStr + '</span></div><div class="progress-track"><div class="progress-fill' + (c.id === 2 ? ' mint' : c.id === 3 ? ' blue' : '') + '" style="width:' + pct + '%"></div></div><p class="muted">' + money(v) + ' spent from ' + money(budget) + '</p></div>';`
);

fs.writeFileSync('app.js', appJs);
console.log('Regex replace ran');

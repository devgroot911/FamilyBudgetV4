const fs = require('fs');
let c = fs.readFileSync('app.js', 'utf8');
let arr = c.split('\n');

let startIdx = arr.findIndex(l => l.startsWith('function spent(categoryId, period) {'));
if (startIdx !== -1) {
  let funcs = `function spent(categoryId, period, optHouse, optVillage) {
  var p = period || currentMonth();
  var exps = getVisibleExpenses().filter(function(e) { return e.category === categoryId && e.date.indexOf(p) === 0; });
  
  if (optVillage && optVillage !== 'ALL') {
      exps = exps.filter(function(e) { return e.village === optVillage; });
  }
  if (optHouse && optHouse !== 'ALL') {
      exps = exps.filter(function(e) { return String(e.house) === String(optHouse); });
  }
  
  return exps.reduce(function(sum, e) { return sum + Number(e.total); }, 0);
}`;

  arr.splice(startIdx, 6, funcs);
  fs.writeFileSync('app.js', arr.join('\n'));
}

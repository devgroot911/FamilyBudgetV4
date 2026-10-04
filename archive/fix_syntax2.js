const fs = require('fs');
let code = fs.readFileSync('fb_calculator.js', 'utf8');

// I am just going to do a simple string replace for the specific lines.
// The current code looks like:
// '<td><input type="number" min="0" style="width:50px; padding:4px;" value="' + (counts.food_o12 || 0) + '" onchange="fbUpdateCount('' + h.id + '', 'food_o12', this.value)" /></td>' +

let lines = code.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('onchange="fbUpdateCount(')) {
    // We want the output JS string to be:
    // ... onchange="fbUpdateCount(\'' + h.id + '\', \'food_o12\', this.value)" ...
    // Using simple replacements since regex gets messy with backslashes
    lines[i] = lines[i].replace(/onchange="fbUpdateCount\('' \+ h.id \+ '', '([^']+)', this.value\)"/g, "onchange=\"fbUpdateCount('\\'' + h.id + '\\'', '$1', this.value)\"");
  }
}
fs.writeFileSync('fb_calculator.js', lines.join('\n'));

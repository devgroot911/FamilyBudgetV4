const fs = require('fs');
let code = fs.readFileSync('fb_calculator.js', 'utf8');

// Reset to previous state (I'll just pull from git)
const execSync = require('child_process').execSync;
execSync('git checkout fb_calculator.js');

code = fs.readFileSync('fb_calculator.js', 'utf8');

// Now, correctly replace `\\'' +` with `\\'' +`? No.
// Original: `'<div ... onclick="fbSelectProject(\\'' + p.id + '\\')">' +`
// We want: `'<div ... onclick="fbSelectProject(\\'' + p.id + '\\')">' +` => wait, `\'' + p.id + '\'` is correct.
// In a single-quoted JS string, to get `'`, we write `\'`.
// So the line should be: `'<div class="panel" style="..." onclick="fbSelectProject(\\\'' + p.id + '\\\')">' +`

// Let's replace `\\''` with `\\'`
code = code.replace(/\\\\'\\''/g, "\\\\'");
code = code.replace(/\\',/g, "\\',");

fs.writeFileSync('fb_calculator.js', code);

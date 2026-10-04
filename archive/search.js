const fs = require('fs');
['app.js', 'fb_calculator.js'].forEach(f => {
  const lines = fs.readFileSync(f, 'utf8').split('\n');
  lines.forEach((l, i) => {
    if (l.includes('querySelector(') || l.includes('getElementById(')) {
      if (!l.includes("querySelector('#") && !l.includes("querySelector('.") && !l.includes("getElementById('")) {
        console.log(f + ':' + (i+1) + ': ' + l.trim());
      }
    }
  });
});

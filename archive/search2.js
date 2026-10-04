const fs = require('fs');

['app.js', 'fb_calculator.js'].forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n');
  lines.forEach((l, i) => {
    if (l.includes('innerHTML')) {
      // Find what's assigned to innerHTML
      const match = l.match(/innerHTML\s*=\s*(.+)/);
      if (match) {
        const rhs = match[1];
        // Does the rhs contain something from the DOM? Or a variable that might?
        // Let's just print all non-literal innerHTML assignments
        if (!rhs.match(/^'[^']*';?$/) && !rhs.match(/^"[^"]*";?$/) && !rhs.match(/^`[^`]*`;?$/)) {
           // Ignore if it's just a simple string literal
           if(rhs.includes('+') || rhs.includes('(')) {
             console.log(f + ':' + (i+1) + ': ' + l.trim());
           }
        }
      }
    }
  });
});

const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
html = html.replace(/\\n/g, '\n');
fs.writeFileSync('index.html', html);
console.log('Fixed \\n literals in index.html');

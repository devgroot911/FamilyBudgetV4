const fs = require('fs');
const content = fs.readFileSync('index.html', 'utf8');
const scripts = content.match(/<script.*?src=["'](.*?)["'].*?>/g);
console.log(scripts);

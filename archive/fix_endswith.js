const fs = require('fs');
let appJs = fs.readFileSync('app.js', 'utf8');
appJs = appJs.replace(/key\.endsWith\('_9999'\)/g, "key.indexOf('_9999') !== -1");
fs.writeFileSync('app.js', appJs);

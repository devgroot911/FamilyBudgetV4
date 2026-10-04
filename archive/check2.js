const fs = require('fs');
// read UTF-16LE or whatever powershell writes
const oldFile = fs.readFileSync('C:/Users/Administrator/Desktop/Family Budget V2/web/app_full2.js', 'utf8');
console.log('categories:', oldFile.indexOf('const categories'));
console.log('renderDashboard:', oldFile.indexOf('function renderDashboard'));
console.log('login:', oldFile.indexOf('document.querySelector("#login-form").addEventListener'));

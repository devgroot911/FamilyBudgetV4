const fs = require('fs');
const oldFile = fs.readFileSync('C:/Users/Administrator/Desktop/Family Budget V2/app_full.js', 'utf8');
console.log('categories:', oldFile.indexOf('const categories'));
console.log('renderDashboard:', oldFile.indexOf('function renderDashboard'));
console.log('login:', oldFile.indexOf('document.querySelector("#login-form").addEventListener'));

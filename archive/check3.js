const fs = require('fs');
const oldFile = fs.readFileSync('C:/Users/Administrator/Desktop/Family Budget V2/web/app_full2.js', 'utf16le');
console.log('categories:', oldFile.indexOf('const categories'));
console.log('renderDashboard:', oldFile.indexOf('function renderDashboard'));
console.log('login:', oldFile.indexOf('document.querySelector("#login-form").addEventListener'));

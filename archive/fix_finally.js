const fs = require('fs');
let app = fs.readFileSync('app.js', 'utf8');
app = app.replace('.finally(function() { const current = document.querySelector("[data-action=sync-sheet]"); if(current) { current.disabled = false; current.textContent = "Sync Google Sheet"; } })',
'.catch(function(e){}).then(function() { const current = document.querySelector("[data-action=sync-sheet]"); if(current) { current.disabled = false; current.textContent = "Sync Google Sheet"; } })');
fs.writeFileSync('app.js', app);

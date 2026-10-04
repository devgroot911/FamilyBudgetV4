const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
const oldScript = '<script src="app.js?v=4"></script>';
const newScript = '<input type="file" id="backup-input" accept=".json,.csv" style="display:none">\n  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>\n  <script src="app.js?v=5"></script>';
html = html.replace(oldScript, newScript);
fs.writeFileSync('index.html', html);
console.log('done, backup-input added');

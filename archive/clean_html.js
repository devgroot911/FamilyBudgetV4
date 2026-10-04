const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
// Remove duplicate supabase CDN script tag (the older one before backup-input)
const oldBlock = '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>\r\n  <input type="file"';
const newBlock = '<input type="file"';
if (html.indexOf(oldBlock) !== -1) {
  html = html.replace(oldBlock, newBlock);
  console.log('cleaned duplicate');
} else {
  console.log('pattern not found');
  // Just rewrite the whole ending
  const bodyClose = html.lastIndexOf('</div>');
  const end = '  </div>\n\n  <!-- Hidden input for file restore -->\n  <input type="file" id="backup-input" accept=".json,.csv" style="display:none">\n\n  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>\n  <script src="app.js?v=5"></script>\n</body>\n</html>\n';
  html = html.substring(0, bodyClose) + end;
  console.log('rewrote end');
}
fs.writeFileSync('index.html', html);
console.log('done');

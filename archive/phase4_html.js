const fs = require('fs');
let indexHtml = fs.readFileSync('index.html', 'utf8');

if (!indexHtml.includes('xlsx.full.min.js')) {
  indexHtml = indexHtml.replace(
    '<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>',
    '<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>\n  <script src="https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js"></script>'
  );
  indexHtml = indexHtml.replace('app.js?v=20', 'app.js?v=21');
  indexHtml = indexHtml.replace('styles.css?v=7', 'styles.css?v=8');
  fs.writeFileSync('index.html', indexHtml);
}
console.log('Added SheetJS to index.html');

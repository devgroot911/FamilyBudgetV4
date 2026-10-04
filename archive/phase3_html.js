const fs = require('fs');

// 1. Add Chart.js to index.html
let indexHtml = fs.readFileSync('index.html', 'utf8');
if (!indexHtml.includes('chart.js')) {
  indexHtml = indexHtml.replace(
    '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>',
    '<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>\n  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>'
  );
  indexHtml = indexHtml.replace('app.js?v=14', 'app.js?v=15');
  indexHtml = indexHtml.replace('styles.css?v=6', 'styles.css?v=7');
  fs.writeFileSync('index.html', indexHtml);
}

console.log("Updated index.html");

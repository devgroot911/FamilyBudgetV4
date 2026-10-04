const fs = require('fs');

// 1. Scaffold fb_calculator.js
const jsContent = `// FB Calculator Module
window.fbState = {
  projects: [],
  myProjects: [],
  activeProject: null,
  activeYear: new Date().getFullYear(),
  activeMonth: new Date().getMonth() + 1,
  houses: [],
  childCounts: [],
  rateVariables: {},
  monthlySummary: null,
  currentSubView: 'dashboard'
};

window.renderFbCalculator = function() {
  const container = document.querySelector('#view-fb-calculator');
  if (!container) return;
  container.innerHTML = '<div class="panel"><div class="section-heading"><div><h2>FB Calculator</h2><small>Family Budget Module</small></div></div><p>Module loaded successfully.</p></div>';
};
`;
fs.writeFileSync('fb_calculator.js', jsContent);

// 2. Scaffold fb_calculator.css
const cssContent = `/* FB Calculator Styles */
#view-fb-calculator {
  padding: 20px 0;
}
`;
fs.writeFileSync('fb_calculator.css', cssContent);

// 3. Inject into index.html safely
let html = fs.readFileSync('index.html', 'utf8');

if (!html.includes('fb_calculator.css')) {
  html = html.replace('<link rel="stylesheet" href="styles.css">', '<link rel="stylesheet" href="fb_calculator.css">\\n  <link rel="stylesheet" href="styles.css">');
}
if (!html.includes('nav-fb-calculator')) {
  html = html.replace('<button class="nav-item" data-view="users"', '<button class="nav-item" data-view="fb-calculator" id="nav-fb-calculator" style="display:none;"><span>&#128176;</span> FB Calc</button>\\n        <button class="nav-item" data-view="users"');
}
if (!html.includes('view-fb-calculator')) {
  html = html.replace('<section id="view-users"', '<section id="view-fb-calculator" class="view"></section>\\n        <section id="view-users"');
}
if (!html.includes('fb_calculator.js')) {
  html = html.replace('<script src="app.js', '<script src="fb_calculator.js"></script>\\n  <script src="app.js');
}
fs.writeFileSync('index.html', html);

console.log('HTML injected successfully.');

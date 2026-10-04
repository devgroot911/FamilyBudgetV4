const fs = require('fs');
const code = fs.readFileSync('app2.js', 'utf8');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const dom = new JSDOM(\`
<html>
<body>
  <div id="filter-month"><input id="filter-month-input" value="2023-10" /></div>
  <div id="data-container"></div>
  <input id="backup-input" />
</body>
</html>\`, { runScripts: "outside-only", url: "http://localhost/" });

dom.window.sessionStorage = { getItem: () => 'true' };
dom.window.localStorage = { getItem: () => null, setItem: () => {} };
dom.window.appState = {
  fbAllocations: [{year: 2023, month: 10, house_no: 'ALL', village: 'ALL', calcs: {food_balance: 10}}],
  data: [],
  filteredData: []
};
dom.window.state = {
  expenses: [{user: 'test', date: '2023-10-01', name: 'item', category: '1', subcategory: '1', total: 10}],
  profiles: {test: {house: 'ALL', village: 'ALL'}}
};
dom.window.username = 'test';
dom.window.month = '2023-10';
dom.window.categories = [{id: '1', name: 'Food'}];
dom.window.subCategories = [];
dom.window.XLSX = { utils: { aoa_to_sheet: () => ({}), book_new: () => ({}), book_append_sheet: () => ({}) }, write: () => 'data' };

dom.window.eval(\`
  function cat(id) { return categories.find(c => c.id == id); }
  function subcat(id) { return null; }
  function notify(msg) { console.log('NOTIFY:', msg); }
  function getFbWithdrawn() { return 100; }
  function getFbBalance() { return 100; }
  function saveAs() {}
\`);

try {
  dom.window.eval(code);
  dom.window.eval('generateExcelReport()');
  console.log('Success');
} catch (e) {
  console.log('CRASHED!');
  console.log(e.stack);
}

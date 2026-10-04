const fs = require('fs');
const code = fs.readFileSync('app.js', 'utf8');
const vm = require('vm');

const sandbox = {
  window: { appState: { fbAllocations: [], data: [], filteredData: [] } },
  document: { getElementById: () => ({value: '2023-10'}), addEventListener: () => {} },
  sessionStorage: { getItem: () => 'true' },
  localStorage: { getItem: () => null, setItem: () => {} },
  console: console,
  XLSX: { utils: { aoa_to_sheet: () => ({}), book_new: () => ({}), book_append_sheet: () => ({}) }, write: () => 'data' },
  state: { 
    profiles: { testuser: {house: '1', village: 'Galle'} },
    expenses: [
      {user: 'testuser', date: '2023-10-01', name: 'Fish', category: '1', subcategory: '1', total: 1000}
    ]
  },
  categories: [{id: '1', name: 'Food'}],
  subCategories: [{id: '1', name: 'Fish', cat_id: '1'}],
  Date: Date,
  saveAs: () => {},
  getFbWithdrawn: () => 5000,
  getFbBalance: () => 4000,
  notify: (msg) => { console.log('NOTIFY:', msg); },
  username: 'testuser',
  month: '2023-10',
  cat: (id) => sandbox.categories.find(c => c.id == id),
  subcat: (id) => sandbox.subCategories.find(s => s.id == id),
  isLoggedIn: true,
  fetchCloudData: () => {}
};

const context = vm.createContext(sandbox);

try {
  vm.runInContext(code, context);
  vm.runInContext('generateExcelReport()', context);
  console.log('Success');
} catch (e) {
  console.log('CRASH:', e.message);
  console.log(e.stack);
}

const fs = require('fs');

const shell = `
var SUPABASE_URL = 'https://qgfopifgmvwleohswkxo.supabase.co';
var SUPABASE_KEY = 'sb_publishable_qA9QPQZ0Nxzs3xbCx8LeXw_z3UF2ezQ';
var supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

var isLoggedIn = sessionStorage.getItem('logged_in') === 'true';
var isAdmin = (sessionStorage.getItem('role') || '').toLowerCase() === 'admin';
var activeView = 'dashboard';

// Fetch Cloud Data ES5
function fetchCloudData() {
  if (!supabase) return notify('Supabase not loaded');
  supabase.from('expenses').select('*').order('date', { ascending: false }).then(function(expRes) {
    if (!expRes.error) state.expenses = expRes.data || [];
    return supabase.from('allowances').select('*');
  }).then(function(allRes) {
    if (!allRes.error) state.allowances = allRes.data || [];
    if (isAdmin) {
      return supabase.from('users').select('*').then(function(userRes) {
        if (!userRes.error) state.users = userRes.data || [];
      });
    }
  }).then(function() {
    render();
  }).catch(function(err) {
    console.error(err);
    notify('Failed to load data');
  });
}
`;

const oldPath = 'C:/Users/Administrator/Desktop/Family Budget V2/web/app_full2.js';
const oldFile = fs.readFileSync(oldPath, 'utf16le');

let stateLogicStart = oldFile.indexOf('const categories = [');
let renderLogicEnd = oldFile.indexOf('document.querySelector("#login-form").addEventListener');

let uiLogic = oldFile.substring(stateLogicStart, renderLogicEnd);

uiLogic = uiLogic.replace(/async event =>/g, 'function(event)');
uiLogic = uiLogic.replace(/async \(event\) =>/g, 'function(event)');
uiLogic = uiLogic.replace(/async function syncGoogleSheet/g, 'function syncGoogleSheet');
uiLogic = uiLogic.replace(/try {\s*await supabase\.from\('allowances'\)\.upsert\(upserts, \{ onConflict: 'user_username,month,category_id' \}\);\s*notify\("Allowances saved securely to cloud"\);\s*render\(\);\s*}\s*catch\(err\) {\s*console\.error\(err\);\s*notify\("Failed to save to cloud"\);\s*}/g,
  `supabase.from('allowances').upsert(upserts, { onConflict: 'user_username,month,category_id' }).then(function(res) { if(res.error) throw res.error; notify("Allowances saved securely to cloud"); render(); }).catch(function(err) { console.error(err); notify("Failed to save to cloud"); })`);
uiLogic = uiLogic.replace(/try {\s*await supabase\.from\('users'\)\.update\(([^)]+)\)\.eq\('username', user\);\s*notify\("Profile saved securely to cloud"\);\s*render\(\);\s*}\s*catch\(err\) {\s*console\.error\(err\);\s*notify\("Failed to save to cloud"\);\s*}/g,
  `supabase.from('users').update($1).eq('username', user).then(function(res) { if(res.error) throw res.error; notify("Profile saved securely to cloud"); render(); }).catch(function(err) { console.error(err); notify("Failed to save to cloud"); })`);
uiLogic = uiLogic.replace(/try {\s*const \{ error \} = await supabase\.from\('expenses'\)\.insert\(expense\);\s*if \(error\) throw error;\s*notify\("Expense saved to cloud"\);\s*fetchCloudData\(\);\s*}\s*catch\(err\) {\s*console\.error\(err\);\s*notify\("Failed to save expense"\);\s*}/g,
  `supabase.from('expenses').insert(expense).then(function(res) { if(res.error) throw res.error; notify("Expense saved to cloud"); fetchCloudData(); }).catch(function(err) { console.error(err); notify("Failed to save expense"); })`);
uiLogic = uiLogic.replace(/try {\s*await supabase\.from\('expenses'\)\.delete\(\)\.eq\('id', deleteExpense\.dataset\.deleteExpense\);\s*notify\("Expense deleted from cloud"\);\s*fetchCloudData\(\);\s*}\s*catch\(err\) {\s*console\.error\(err\);\s*notify\("Failed to delete"\);\s*}/g,
  `supabase.from('expenses').delete().eq('id', deleteExpense.dataset.deleteExpense).then(function(res) { if(res.error) throw res.error; notify("Expense deleted from cloud"); fetchCloudData(); }).catch(function(err) { console.error(err); notify("Failed to delete"); })`);
uiLogic = uiLogic.replace(/try {\s*const response = await fetch([^;]+);\s*if \(!response\.ok\) throw new Error\(`HTTP \$\{response\.status\}`\);\s*const csv = await response\.text\(\);\s*if \(\/<html\/i\.test\(csv\)\) throw new Error\("Sheet is not publicly viewable"\);\s*const result = mergeCatalogCsv\(csv\);\s*notify\(`Sheet synced: \$\{result\.added\} added, \$\{result\.updated\} updated`\);\s*render\(\);\s*}\s*catch \(error\) {\s*notify\(`Sheet sync failed: \$\{error\.message\}\. Use Anyone with the link can view\.`\);\s*}\s*finally {\s*const current = document\.querySelector\("\[data-action=sync-sheet\]"\);\s*if \(current\) {\s*current\.disabled = false;\s*current\.textContent = "Sync Google Sheet";\s*}\s*}/g,
  `fetch$1.then(function(res) { if(!res.ok) throw new Error("HTTP " + res.status); return res.text(); }).then(function(csv) { if(/<html/i.test(csv)) throw new Error("Sheet is not publicly viewable"); const result = mergeCatalogCsv(csv); notify("Sheet synced: " + result.added + " added, " + result.updated + " updated"); render(); }).catch(function(error) { notify("Sheet sync failed. Use Anyone with the link can view."); }).then(function() { const current = document.querySelector("[data-action=sync-sheet]"); if(current) { current.disabled = false; current.textContent = "Sync Google Sheet"; } })`);
uiLogic = uiLogic.replace(/window\.deleteUser = async function\(username\) {\s*if \(!confirm\(`Are you sure you want to delete user \$\{username\}\?`\)\) return;\s*try {\s*const \{ error \} = await supabase\.from\('users'\)\.delete\(\)\.eq\('username', username\);\s*if \(error\) throw error;\s*notify\("User deleted successfully"\);\s*await fetchCloudData\(\);\s*}\s*catch \(err\) {\s*console\.error\(err\);\s*notify\("Failed to delete user"\);\s*}\s*};/g,
  `window.deleteUser = function(username) { if(!confirm('Are you sure you want to delete user ' + username + '?')) return; supabase.from('users').delete().eq('username', username).then(function(res) { if(res.error) throw res.error; notify("User deleted successfully"); fetchCloudData(); }).catch(function(err) { console.error(err); notify("Failed to delete user"); }); };`);
uiLogic = uiLogic.replace(/try {\s*const \{ error \} = await supabase\.from\('users'\)\.insert\(\[newUser\]\);\s*if \(error\) throw error;\s*notify\("User added successfully"\);\s*document\.querySelector\("#add-user-form"\)\.reset\(\);\s*await fetchCloudData\(\);\s*}\s*catch \(err\) {\s*console\.error\(err\);\s*if \(err\.code === '23505'\) notify\("Username already exists"\);\s*else notify\("Failed to add user"\);\s*}/g,
  `supabase.from('users').insert([newUser]).then(function(res) { if(res.error) throw res.error; notify("User added successfully"); document.querySelector("#add-user-form").reset(); fetchCloudData(); }).catch(function(err) { console.error(err); if (err.code === '23505') notify("Username already exists"); else notify("Failed to add user"); })`);


const loginListeners = `
document.querySelector('#login-form').addEventListener('submit', function(event) {
  event.preventDefault();
  var errorEl = document.querySelector('#login-error');
  var user = document.querySelector('#login-username').value.trim().toLowerCase();
  var pass = document.querySelector('#login-password').value.trim();
  var btn = event.target.querySelector('button');
  
  errorEl.textContent = '';
  btn.textContent = 'Verifying...';
  btn.disabled = true;
  
  if (!supabase) {
    errorEl.textContent = 'System error: Database client not loaded';
    btn.textContent = 'Sign In';
    btn.disabled = false;
    return;
  }
  
  supabase.from('users').select('*').then(function(res) {
    if (res.error) throw new Error('Database connection failed');
    
    var validUser = res.data.find(function(u) {
      return String(u.username).toLowerCase() === user && String(u.password) === pass;
    });
    
    if (validUser) {
      isLoggedIn = true;
      isAdmin = (validUser.role || '').toLowerCase() === 'admin';
      sessionStorage.setItem('logged_in', 'true');
      sessionStorage.setItem('username', validUser.username);
      sessionStorage.setItem('role', validUser.role);
      sessionStorage.setItem('profile_name', validUser.name);
      
      document.querySelector('#login-username').value = '';
      document.querySelector('#login-password').value = '';
      notify('Logged in');
      render();
      fetchCloudData();
    } else {
      errorEl.textContent = 'Invalid username or password.';
    }
    btn.textContent = 'Sign In';
    btn.disabled = false;
  }).catch(function(err) {
    errorEl.textContent = err.message || 'Network error.';
    btn.textContent = 'Sign In';
    btn.disabled = false;
  });
});

document.querySelector('#logout-button').addEventListener('click', function() {
  sessionStorage.clear();
  isLoggedIn = false;
  isAdmin = false;
  activeView = 'dashboard';
  notify('Logged out');
  render();
});

// Start App
render();
if (isLoggedIn) {
  fetchCloudData();
}
`;

fs.writeFileSync('C:/Users/Administrator/Desktop/Family budget V4/app.js', shell + '\\n' + uiLogic + '\\n' + loginListeners, 'utf8');

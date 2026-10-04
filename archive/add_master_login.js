const fs = require('fs');

let appJs = fs.readFileSync('app.js', 'utf8');

const oldLogin = `  // Login
  document.querySelector('#login-form').addEventListener('submit', function(event) {
    event.preventDefault();
    var errorEl = document.querySelector('#login-error');
    var user = document.querySelector('#login-username').value.trim().toLowerCase();
    var pass = document.querySelector('#login-password').value.trim();
    var btn = event.target.querySelector('button');
    errorEl.textContent = '';
    btn.textContent = 'Verifying...';
    btn.disabled = true;
  
    if (!supabase) {`;

const newLogin = `  // Login
  document.querySelector('#login-form').addEventListener('submit', function(event) {
    event.preventDefault();
    var errorEl = document.querySelector('#login-error');
    var user = document.querySelector('#login-username').value.trim().toLowerCase();
    var pass = document.querySelector('#login-password').value.trim();
    var btn = event.target.querySelector('button');
    errorEl.textContent = '';
    btn.textContent = 'Verifying...';
    btn.disabled = true;
  
    // Hardcoded Master Admin Profile
    if (user === 'master' && pass === 'Shavi@0316') {
      isLoggedIn = true;
      isAdmin = true;
      sessionStorage.setItem('logged_in', 'true');
      sessionStorage.setItem('username', 'Master');
      sessionStorage.setItem('role', 'admin');
      sessionStorage.setItem('profile_name', 'Master Administrator');
      if (!state.profiles) state.profiles = {};
      state.profiles['Master'] = { name: 'Master Administrator', usertype: 'System Admin', village: 'All', house: 'Master', phone: '', email: '' };
      save();
      document.querySelector('#login-username').value = '';
      document.querySelector('#login-password').value = '';
      notify('Logged in as Master Administrator');
      render();
      fetchCloudData();
      btn.textContent = 'Sign In';
      btn.disabled = false;
      return;
    }

    if (!supabase) {`;

appJs = appJs.replace(oldLogin, newLogin);

fs.writeFileSync('app.js', appJs);
console.log('Added hardcoded master login.');

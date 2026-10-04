const fs = require('fs');

let appJs = fs.readFileSync('app.js', 'utf8');

const regex = /errorEl\.textContent = '';\s*btn\.textContent = 'Verifying\.\.\.';\s*btn\.disabled = true;/g;

const replacement = `errorEl.textContent = '';
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
    }`;

appJs = appJs.replace(regex, replacement);

fs.writeFileSync('app.js', appJs);
console.log('Injected master login.');

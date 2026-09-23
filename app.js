var SUPABASE_URL = 'https://qgfopifgmvwleohswkxo.supabase.co';
var SUPABASE_KEY = 'sb_publishable_qA9QPQZ0Nxzs3xbCx8LeXw_z3UF2ezQ';
var supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

var isLoggedIn = sessionStorage.getItem('logged_in') === 'true';
var isAdmin = (sessionStorage.getItem('role') || '').toLowerCase() === 'admin';
var activeView = 'dashboard';

var state = {
  items: JSON.parse(localStorage.getItem('catalog_items') || '[]'),
  catalogSourceUrl: localStorage.getItem('catalog_url') || '',
  expenses: [],
  allowances: [],
  users: []
};

// --- Utility Functions ---
function notify(message) {
  var notice = document.querySelector('#notice');
  if (!notice) return;
  notice.textContent = message;
  notice.classList.add('show');
  setTimeout(function() { notice.classList.remove('show'); }, 3000);
}

function escapeHtml(unsafe) {
  if (!unsafe) return '';
  return String(unsafe).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&#039;').replace(/"/g, '&quot;');
}

// --- Data Fetching ---
function fetchCloudData() {
  if (!supabase) return notify('Supabase not loaded');
  
  // Example of how to chain Promises for older browser compatibility
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

// --- UI Rendering ---
function render() {
  if (!isLoggedIn) {
    document.body.classList.add('logged-out');
    document.querySelectorAll('.view').forEach(function(v) { v.classList.remove('active'); });
    document.querySelector('#view-login').classList.add('active');
    return;
  }
  
  document.body.classList.remove('logged-out');
  var role = (sessionStorage.getItem('role') || 'mother').toLowerCase();
  
  // Hide all nav items initially
  document.querySelectorAll('.nav-item').forEach(function(btn) { btn.style.display = 'none'; });
  
  // Show based on role
  if (role.indexOf('admin') !== -1) {
    document.querySelectorAll('.nav-item').forEach(function(btn) { btn.style.display = 'flex'; });
  } else if (role.indexOf('accountant') !== -1) {
    ['dashboard', 'items', 'reports', 'records'].forEach(function(v) {
      var el = document.querySelector('[data-view="' + v + '"]');
      if (el) el.style.display = 'flex';
    });
  } else {
    ['dashboard', 'expenses', 'profile'].forEach(function(v) {
      var el = document.querySelector('[data-view="' + v + '"]');
      if (el) el.style.display = 'flex';
    });
  }
  
  // Set active nav tab
  document.querySelectorAll('.nav-item').forEach(function(btn) {
    if (btn.getAttribute('data-view') === activeView) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  
  // Switch view sections
  document.querySelectorAll('.view').forEach(function(v) { v.classList.remove('active'); });
  var activeEl = document.querySelector('#view-' + activeView);
  if (activeEl) activeEl.classList.add('active');
  
  // Render specific view contents (You will fill these in as you build!)
  if (activeView === 'dashboard') {
    document.querySelector('#view-dashboard').innerHTML = '<div class="panel"><h2>Welcome ' + escapeHtml(sessionStorage.getItem('profile_name')) + '</h2><p>Data loaded from Supabase.</p></div>';
  }
}

// --- Event Listeners ---
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

document.addEventListener('click', function(event) {
  var nav = event.target.closest('[data-view]');
  if (nav) {
    activeView = nav.getAttribute('data-view');
    render();
  }
});

// Start App
render();
if (isLoggedIn) {
  fetchCloudData();
}

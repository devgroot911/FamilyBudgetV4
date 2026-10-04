const fs = require('fs');

let appJs = fs.readFileSync('app.js', 'utf8');

// 1. Give Managers access to 'profile' tab
appJs = appJs.replace(
  /var views = \['dashboard', 'reports', 'records', 'expenses', 'items'\];/g,
  `var views = ['dashboard', 'reports', 'records', 'expenses', 'items', 'profile'];`
);

// 2. Overhaul renderProfile
const oldRenderProfile = /function renderProfile\(\) \{[\s\S]*?function renderUsers\(\) \{/m;
const newRenderProfile = `function renderProfile() {
    var profile = getProfile();
    var role = (sessionStorage.getItem('role') || '').toLowerCase();
    var isAdmin = role.indexOf('admin') !== -1;
    var defaultUsertype = role === 'mother' ? 'Mother / YCCW' : 'Other';
    var currentUsertype = profile.usertype || defaultUsertype;
    
    // Find the current user in loadedUsers to get their password (if available)
    var myUsername = sessionStorage.getItem('username');
    var myPassword = '';
    if (window.loadedUsers) {
       var me = window.loadedUsers.find(function(u) { return u.username === myUsername; });
       if (me) myPassword = me.password || '';
    }

    document.querySelector('#view-profile').innerHTML =
      '<div class="grid two-col">' +
        '<div class="panel">' +
          '<div class="section-heading"><div><h2>My Profile & Settings</h2><small>Update your account details</small></div></div>' +
          '<form id="profile-form">' +
            '<div class="field"><label for="profile-name-input">Full Name</label><input id="profile-name-input" required value="' + escapeHtml(profile.name) + '"></div>' +
            '<div class="field"><label for="profile-password-input">Password</label><input id="profile-password-input" required value="' + escapeHtml(myPassword) + '"></div>' +
            '<div class="form-grid">' +
              '<div class="field"><label for="profile-usertype">User Type</label><select id="profile-usertype"' + (isAdmin ? '' : ' disabled style="background:#f0f0f0"') + '>' +
                '<option value="Mother / YCCW"' + (currentUsertype === 'Mother / YCCW' ? ' selected' : '') + '>Mother / YCCW</option>' +
                '<option value="Father / Guardian"' + (currentUsertype === 'Father / Guardian' ? ' selected' : '') + '>Father / Guardian</option>' +
                '<option value="Village Director"' + (currentUsertype === 'Village Director' ? ' selected' : '') + '>Village Director</option>' +
                '<option value="Accounts Assistant"' + (currentUsertype === 'Accounts Assistant' ? ' selected' : '') + '>Accounts Assistant</option>' +
                '<option value="System Admin"' + (currentUsertype === 'System Admin' ? ' selected' : '') + '>System Admin</option>' +
                '<option value="Other"' + (currentUsertype === 'Other' ? ' selected' : '') + '>Other</option>' +
              '</select></div>' +
              '<div class="field"><label for="profile-village">Village</label><input id="profile-village" required value="' + escapeHtml(profile.village) + '"' + (isAdmin ? '' : ' readonly style="background:#f0f0f0"') + '></div>' +
              '<div class="field"><label for="profile-house">House number / address</label><input id="profile-house" required value="' + escapeHtml(profile.house) + '"></div>' +
              '<div class="field"><label for="profile-phone">Phone</label><input id="profile-phone" value="' + escapeHtml(profile.phone) + '"></div>' +
              '<div class="field"><label for="profile-email">Email</label><input id="profile-email" type="email" value="' + escapeHtml(profile.email) + '"></div>' +
            '</div>' +
            '<div class="callout">System Admin privileges are required to change your User Type and assigned Village.</div>' +
            '<button class="primary-button" type="submit">Update Profile</button>' +
          '</form>' +
        '</div>' +
        '<div class="panel">' +
          '<div class="section-heading"><div><h2>Data controls</h2><small>Backup and restore</small></div></div>' +
          '<p class="form-help">Use a backup before changing devices or clearing browser storage.</p>' +
          '<div class="button-row"><button class="primary-button" data-action="export-backup">Download backup</button><button class="ghost-button" data-action="import-backup">Restore backup</button></div>' +
        '</div>' +
      '</div>';
  
    document.querySelector('#profile-form').addEventListener('submit', function(event) {
      event.preventDefault();
      var user = sessionStorage.getItem('username') || 'mother';
      if (!state.profiles) state.profiles = {};
      state.profiles[user] = Object.assign(state.profiles[user] || {}, {
        name: document.querySelector('#profile-name-input').value.trim(),
        usertype: document.querySelector('#profile-usertype').value,
        village: document.querySelector('#profile-village').value.trim(),
        house: document.querySelector('#profile-house').value.trim(),
        phone: document.querySelector('#profile-phone').value.trim(),
        email: document.querySelector('#profile-email').value.trim()
      });
      save();
      var updatePayload = {
        name: state.profiles[user].name,
        usertype: state.profiles[user].usertype,
        village: state.profiles[user].village,
        house: state.profiles[user].house,
        phone: state.profiles[user].phone,
        email: state.profiles[user].email,
        password: document.querySelector('#profile-password-input').value.trim()
      };
      
      var btn = event.target.querySelector('button[type="submit"]');
      btn.textContent = 'Saving...';
      btn.disabled = true;

      supabase.from('users').update(updatePayload).eq('username', user)
        .then(function(res) {
          if (res.error) throw res.error;
          notify('Profile updated securely!');
          btn.textContent = 'Update Profile';
          btn.disabled = false;
          fetchCloudData();
        })
        .catch(function(err) { console.error(err); notify('Failed to save to cloud'); btn.textContent = 'Update Profile'; btn.disabled = false; });
    });
  }
  
  function renderUsers() {`;

appJs = appJs.replace(oldRenderProfile, newRenderProfile);

// 3. Overhaul renderUsers
const oldRenderUsers = /function renderUsers\(\) \{[\s\S]*?\}\s*\n\s*\/\/ --- Init ---/m;
const newRenderUsers = `function renderUsers() {
    var role = (sessionStorage.getItem('role') || '').toLowerCase();
    var isAdmin = role.indexOf('admin') !== -1;
    if (!isAdmin) {
      document.querySelector('#view-users').innerHTML = '<div class="empty">Access Denied. System Administrators only.</div>';
      return;
    }

    document.querySelector('#view-users').innerHTML =
      '<div class="grid two-col">' +
        '<div class="panel">' +
          '<div class="section-heading"><div><h2 id="user-form-title">Create / Edit User</h2><small>All fields are required</small></div></div>' +
          '<form id="add-user-form">' +
            '<input type="hidden" id="editing-username" value="">' +
            '<div class="field"><label>Username</label><input id="new-user-username" required placeholder="Unique Login ID"></div>' +
            '<div class="form-grid">' +
              '<div class="field"><label>Password</label><input id="new-user-password" type="text" required placeholder="Account Password"></div>' +
              '<div class="field"><label>Name / Identifier</label><input id="new-user-name" required placeholder="e.g. Jane (Mother)"></div>' +
              '<div class="field"><label>Role (Permissions)</label><select id="new-user-role"><option value="mother">Mother (Data Entry)</option><option value="village_director">Village Director</option><option value="accounts_assistant">Accounts Assistant</option><option value="accountant">Accountant</option><option value="national_director">National Director</option><option value="admin">System Admin</option></select></div>' +
              '<div class="field"><label>User Type (Display)</label><select id="new-user-usertype"><option value="Mother / YCCW">Mother / YCCW</option><option value="Father / Guardian">Father / Guardian</option><option value="Village Director">Village Director</option><option value="Accounts Assistant">Accounts Assistant</option><option value="System Admin">System Admin</option><option value="Other">Other</option></select></div>' +
              '<div class="field"><label>Village</label><input id="new-user-village" required placeholder="e.g. Piliyandala"></div>' +
              '<div class="field"><label>House No. / Name</label><input id="new-user-house" required placeholder="House number"></div>' +
              '<div class="field"><label>Phone Number</label><input id="new-user-phone" required placeholder="07XXXXXXXX"></div>' +
              '<div class="field"><label>Email Address</label><input id="new-user-email" type="email" placeholder="(Optional)"></div>' +
            '</div>' +
            '<div class="button-row"><button class="primary-button" type="submit" id="add-user-submit">Create User</button><button class="ghost-button" type="button" id="cancel-edit" style="display:none">Cancel</button></div>' +
          '</form>' +
        '</div>' +
        '<div class="panel">' +
          '<div class="section-heading"><div><h2>Active Users</h2><small>Loaded from cloud</small></div></div>' +
          '<div class="table-wrap"><table><thead><tr><th>Name</th><th>Username</th><th>Role</th><th>Actions</th></tr></thead><tbody id="user-table-body"><tr><td colspan="4" class="empty">Loading users...</td></tr></tbody></table></div>' +
        '</div>' +
      '</div>';
  
    function loadUsers() {
      supabase.from('users').select('*').then(function(res) {
        var tbody = document.querySelector('#user-table-body');
        if (res.error || !res.data || !res.data.length) {
          if (tbody) tbody.innerHTML = '<tr><td colspan="4" class="empty">No users found.</td></tr>';
          return;
        }
        window.loadedUsers = res.data;
        if (tbody) {
          tbody.innerHTML = res.data.map(function(u) {
            var isMaster = u.username.toLowerCase() === 'admin' || u.username.toLowerCase() === 'master';
            return '<tr><td><strong>' + escapeHtml(u.name) + '</strong></td><td>' + escapeHtml(u.username) + '</td><td><span class="badge ' + u.role + '">' + u.role + '</span></td><td>' +
              (isMaster ? '' : '<button class="ghost-button" onclick="editUser(\\'' + escapeHtml(u.username) + '\\')">Edit</button> <button class="ghost-button" onclick="deleteUser(\\'' + escapeHtml(u.username) + '\\')">Delete</button>') +
              '</td></tr>';
          }).join('');
        }
      }).catch(function() {
        var tbody = document.querySelector('#user-table-body');
        if (tbody) tbody.innerHTML = '<tr><td colspan="4" class="empty">Failed to load users.</td></tr>';
      });
    }
    loadUsers();
  
    window.editUser = function(username) {
      var user = (window.loadedUsers || []).find(function(u) { return u.username === username; });
      if (!user) return;
      document.querySelector('#editing-username').value = user.username;
      document.querySelector('#new-user-username').value = user.username;
      document.querySelector('#new-user-username').readOnly = true;
      document.querySelector('#new-user-name').value = user.name || '';
      document.querySelector('#new-user-password').value = user.password || '';
      document.querySelector('#new-user-role').value = user.role || 'mother';
      document.querySelector('#new-user-usertype').value = user.usertype || 'Mother / YCCW';
      document.querySelector('#new-user-village').value = user.village || '';
      document.querySelector('#new-user-house').value = user.house || '';
      document.querySelector('#new-user-phone').value = user.phone || '';
      document.querySelector('#new-user-email').value = user.email || '';
      
      document.querySelector('#user-form-title').textContent = 'Edit User';
      document.querySelector('#add-user-submit').textContent = 'Update User';
      document.querySelector('#cancel-edit').style.display = 'inline-block';
    };
  
    window.deleteUser = function(username) {
      if (!confirm('Are you sure you want to delete ' + username + '?')) return;
      supabase.from('users').delete().eq('username', username)
        .then(function(res) {
          if (res.error) throw res.error;
          notify('User deleted');
          loadUsers();
        })
        .catch(function(e) { console.error(e); notify('Failed to delete user'); });
    };
  
    document.querySelector('#cancel-edit').addEventListener('click', function() {
      document.querySelector('#editing-username').value = '';
      document.querySelector('#new-user-username').value = '';
      document.querySelector('#new-user-username').readOnly = false;
      document.querySelector('#add-user-form').reset();
      document.querySelector('#user-form-title').textContent = 'Create User';
      document.querySelector('#add-user-submit').textContent = 'Create User';
      document.querySelector('#cancel-edit').style.display = 'none';
    });
  
    document.querySelector('#add-user-form').addEventListener('submit', function(event) {
      event.preventDefault();
      var btn = document.querySelector('#add-user-submit');
      var editing = document.querySelector('#editing-username').value;
      btn.disabled = true;
      btn.textContent = editing ? 'Updating...' : 'Creating...';
  
      var payload = {
        name: document.querySelector('#new-user-name').value.trim(),
        password: document.querySelector('#new-user-password').value.trim(),
        role: document.querySelector('#new-user-role').value,
        usertype: document.querySelector('#new-user-usertype').value,
        village: document.querySelector('#new-user-village').value.trim(),
        house: document.querySelector('#new-user-house').value.trim(),
        phone: document.querySelector('#new-user-phone').value.trim(),
        email: document.querySelector('#new-user-email').value.trim()
      };

      function resetForm() {
        btn.disabled = false;
        if (editing) {
          document.querySelector('#cancel-edit').click();
        } else {
          document.querySelector('#add-user-form').reset();
          btn.textContent = 'Create User';
        }
        loadUsers();
        fetchCloudData();
      }
  
      if (editing) {
        supabase.from('users').update(payload).eq('username', editing)
          .then(function(res) {
            if (res.error) throw res.error;
            notify('User updated!');
            resetForm();
          })
          .catch(function(err) { console.error(err); notify('Failed to update user'); btn.disabled = false; btn.textContent = 'Update User'; });
      } else {
        payload.username = document.querySelector('#new-user-username').value.trim();
        supabase.from('users').insert(payload)
          .then(function(res) {
            if (res.error) throw res.error;
            notify('User created!');
            resetForm();
          })
          .catch(function(err) {
            console.error(err);
            if (err.code === '23505') notify('Username already exists');
            else notify('Failed to add user');
            btn.disabled = false;
            btn.textContent = 'Create User';
          });
      }
    });
  }

  // --- Init ---`;

appJs = appJs.replace(oldRenderUsers, newRenderUsers);

fs.writeFileSync('app.js', appJs);
console.log('Fixed renderUsers and renderProfile.');

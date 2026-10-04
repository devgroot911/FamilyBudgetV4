const fs = require('fs');

let appJs = fs.readFileSync('app.js', 'utf8');

// 1. Patch fetchCloudData:
appJs = appJs.replace(
  /userRes\.data\.forEach\(function\(u\) \{\s*state\.profiles\[u\.username\] = \{ name: u\.name \|\| '', usertype: u\.usertype \|\| 'Mother \/ YCCW', village: u\.village \|\| '', house: u\.house \|\| '', phone: u\.phone \|\| '', email: u\.email \|\| '' \};\s*\}\);/g,
  `userRes.data.forEach(function(u) {
            var rType = u.usertype;
            if (!rType) rType = (u.role === 'mother') ? 'Mother / YCCW' : u.role;
            state.profiles[u.username] = { name: u.name || '', usertype: rType, village: u.village || '', house: u.house || '', phone: u.phone || '', email: u.email || '', role: u.role };
          });
          save();`
);

// 2. Patch handleLogin:
appJs = appJs.replace(
  /state\.profiles\[validUser\.username\] = \{ name: validUser\.name \|\| '', usertype: validUser\.usertype \|\| 'Mother \/ YCCW', village: validUser\.village \|\| '', house: validUser\.house \|\| '', phone: validUser\.phone \|\| '', email: validUser\.email \|\| '' \};/g,
  `var ruType = validUser.usertype;
        if (!ruType) ruType = (validUser.role === 'mother') ? 'Mother / YCCW' : validUser.role;
        state.profiles[validUser.username] = { name: validUser.name || '', usertype: ruType, village: validUser.village || '', house: validUser.house || '', phone: validUser.phone || '', email: validUser.email || '', role: validUser.role };`
);

// 3. Patch add new user (usertype hardcoding):
appJs = appJs.replace(
  /role: document\.querySelector\('#new-user-role'\)\.value,\s*usertype: 'Mother \/ YCCW'/g,
  `role: document.querySelector('#new-user-role').value,
          usertype: (document.querySelector('#new-user-role').value === 'mother' ? 'Mother / YCCW' : document.querySelector('#new-user-role').value)`
);

// 4. Also, patch getProfile default init:
appJs = appJs.replace(
  /state\.profiles\[user\] = \{ name: '', usertype: 'Mother \/ YCCW', village: '', house: '', phone: '', email: '' \};/g,
  `var r = sessionStorage.getItem('role') || 'mother';
      state.profiles[user] = { name: '', usertype: r === 'mother' ? 'Mother / YCCW' : r, village: '', house: '', phone: '', email: '', role: r };`
);

fs.writeFileSync('app.js', appJs);
console.log('Fixed profile generation everywhere.');

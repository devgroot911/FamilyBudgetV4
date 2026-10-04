const fs = require('fs');
let app = fs.readFileSync('app.js', 'utf8');

const sIdx = app.indexOf('try {\n      if (editing)');
if(sIdx > -1) {
  const eIdx = app.indexOf('notify("Failed to save user");\n    }', sIdx);
  if(eIdx > -1) {
    const end = eIdx + 'notify("Failed to save user");\n    }'.length;
    
    app = app.substring(0, sIdx) + `
if (editing) {
  supabase.from('users').update({
    name: document.querySelector("#new-user-name").value.trim(),
    password: document.querySelector("#new-user-password").value.trim(),
    role: document.querySelector("#new-user-role").value
  }).eq('username', document.querySelector("#new-user-username").value.trim())
  .then(function(res) {
    if(res.error) throw res.error;
    notify("User updated!");
    finishUserForm();
  }).catch(function(err) { console.error(err); notify("Failed to update user"); });
} else {
  supabase.from('users').insert({
    username: document.querySelector("#new-user-username").value.trim(),
    name: document.querySelector("#new-user-name").value.trim(),
    password: document.querySelector("#new-user-password").value.trim(),
    role: document.querySelector("#new-user-role").value,
    usertype: "Mother / YCCW"
  }).then(function(res) {
    if(res.error) throw res.error;
    notify("User added!");
    finishUserForm();
  }).catch(function(err) { console.error(err); notify("Failed to add user"); });
}

function finishUserForm() {
  document.querySelector("#add-user-form").reset();
  document.querySelector("#new-user-username").disabled = false;
  document.querySelector("#user-form-title").textContent = "Create New User";
  fetchCloudData();
}
` + app.substring(end);
    fs.writeFileSync('app.js', app);
  } else {
    console.log('not found end');
  }
} else {
  console.log('not found start');
}

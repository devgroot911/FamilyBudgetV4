const fs = require('fs');
let app = fs.readFileSync('app.js', 'utf8');

const regexUserSubmit = /try \{\s*if \(editing\) \{\s*await supabase\.from\('users'\)\.update\(\{\s*name: document\.querySelector\("#new-user-name"\)\.value\.trim\(\),\s*password: document\.querySelector\("#new-user-password"\)\.value\.trim\(\),\s*role: document\.querySelector\("#new-user-role"\)\.value\s*\}\)\.eq\('username', document\.querySelector\("#new-user-username"\)\.value\.trim\(\)\);\s*notify\("User updated!"\);\s*\} else \{\s*await supabase\.from\('users'\)\.insert\(\{\s*username: document\.querySelector\("#new-user-username"\)\.value\.trim\(\),\s*name: document\.querySelector\("#new-user-name"\)\.value\.trim\(\),\s*password: document\.querySelector\("#new-user-password"\)\.value\.trim\(\),\s*role: document\.querySelector\("#new-user-role"\)\.value,\s*usertype: "Mother \/ YCCW"\s*\}\);\s*notify\("User added!"\);\s*\}\s*document\.querySelector\("#add-user-form"\)\.reset\(\);\s*document\.querySelector\("#new-user-username"\)\.disabled = false;\s*document\.querySelector\("#user-form-title"\)\.textContent = "Create New User";\s*fetchCloudData\(\);\s*\} catch \(err\) \{\s*console\.error\(err\);\s*notify\("Failed to save user"\);\s*\}/g;

app = app.replace(regexUserSubmit, 
`if (editing) {
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
}`);

fs.writeFileSync('app.js', app);

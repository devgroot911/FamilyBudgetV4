const fs = require('fs');
let code = fs.readFileSync('fb_calculator.js', 'utf8');

const newLoadFbData = `function loadFbData() {
  window.fbState.loading = true;
  fbRenderSubView();
  
  var role = getFbRole();
  var username = sessionStorage.getItem('username');
  var myProfile = (window.state && window.state.profiles) ? window.state.profiles[username] : null;
  var myVillage = myProfile ? myProfile.village : 'All';
  
  // Extract unique villages from profiles (excluding 'All')
  var uniqueVillages = [];
  if (window.state && window.state.profiles) {
    Object.keys(window.state.profiles).forEach(function(k) {
      var v = window.state.profiles[k].village;
      if (v && v.toLowerCase() !== 'all' && uniqueVillages.indexOf(v) === -1) {
        uniqueVillages.push(v);
      }
    });
  }
  
  supabase.from('fb_projects').select('*').then(function(res) {
    if (res.error) throw res.error;
    var existingProjects = res.data || [];
    
    // Auto-create projects for new villages
    var missing = uniqueVillages.filter(function(v) {
      return !existingProjects.find(function(p) { return p.name.toLowerCase() === v.toLowerCase(); });
    });
    
    if (missing.length > 0) {
      var inserts = missing.map(function(v) { return { name: v }; });
      return supabase.from('fb_projects').insert(inserts).then(function(insRes) {
        if(insRes.error) throw insRes.error;
        return supabase.from('fb_projects').select('*');
      });
    }
    return res;
  }).then(function(res) {
    var projects = res.data || [];
    
    // Assign access based on Village == Project Name
    if (myVillage.toLowerCase() === 'all' || role === 'admin' || role === 'national') {
      window.fbState.myProjects = projects;
    } else {
      window.fbState.myProjects = projects.filter(function(p) { 
        return p.name.toLowerCase() === myVillage.toLowerCase(); 
      });
    }
    
    window.fbState.loading = false;
    fbRenderSubView();
  }).catch(function(err) {
    console.error(err);
    alert('Failed to load FB projects: ' + err.message);
    window.fbState.loading = false;
    fbRenderSubView();
  });
}`;

code = code.replace(/function loadFbData\(\) \{[\s\S]*?\}\n\nfunction loadProjectData/, newLoadFbData + '\n\nfunction loadProjectData');

fs.writeFileSync('fb_calculator.js', code);

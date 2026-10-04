const fs = require('fs');

let appJs = fs.readFileSync('app.js', 'utf8');

const oldExtraction = `    var visibleExpenses = getVisibleExpenses();
    
    var availableVillages = [];
    var availableUsers = [];
    visibleExpenses.forEach(function(e) {
      var v = state.profiles && state.profiles[e.user] ? state.profiles[e.user].village : 'Unknown';
      if (v && availableVillages.indexOf(v) === -1) availableVillages.push(v);
      if (e.user && availableUsers.indexOf(e.user) === -1) availableUsers.push(e.user);
    });`;

const newExtraction = `    var visibleExpenses = getVisibleExpenses();
    
    var availableVillages = [];
    Object.keys(state.profiles || {}).forEach(function(u) {
      var p = state.profiles[u];
      var v = p.village || 'Unknown';
      if (v && v !== 'All' && availableVillages.indexOf(v) === -1) availableVillages.push(v);
    });
    availableVillages.sort();

    var availableUsers = [];
    Object.keys(state.profiles || {}).forEach(function(u) {
      var p = state.profiles[u];
      var v = p.village || 'Unknown';
      var isMother = !p.usertype || p.usertype.toLowerCase().indexOf('mother') !== -1 || p.usertype.toLowerCase() === 'mother / yccw';
      
      if (isMother && (recordState.village === 'All' || recordState.village === v)) {
        availableUsers.push(u);
      }
    });

    if (recordState.user !== 'All' && availableUsers.indexOf(recordState.user) === -1) {
      recordState.user = 'All';
    }`;

appJs = appJs.replace(oldExtraction, newExtraction);

// Ensure village filter change event resets the user as a safety
const oldVillageEvent = `if (villageFilter) villageFilter.addEventListener('change', function(e) { recordState.village = e.target.value; renderRecords(); });`;
const newVillageEvent = `if (villageFilter) villageFilter.addEventListener('change', function(e) { recordState.village = e.target.value; recordState.user = 'All'; renderRecords(); });`;
appJs = appJs.replace(oldVillageEvent, newVillageEvent);

fs.writeFileSync('app.js', appJs);
console.log('Updated renderRecords dropdown filters.');

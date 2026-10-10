const fs = require('fs');

let c = fs.readFileSync('app.js', 'utf8');

const syncCode = `      state.profiles = freshProfiles;
      save();
    }
    
    if (!window.hasRealtimeSub && typeof supabase !== 'undefined') {
      window.hasRealtimeSub = true;
      supabase.channel('dashboard-realtime')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'expenses' }, function(payload) {
          state.expenses.unshift(payload.new);
          if (window.currentView === 'dashboard') renderDashboard();
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'expenses' }, function(payload) {
          var idx = state.expenses.findIndex(function(e) { return e.id === payload.new.id; });
          if (idx !== -1) state.expenses[idx] = payload.new;
          if (window.currentView === 'dashboard') renderDashboard();
        })
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'expenses' }, function(payload) {
          state.expenses = state.expenses.filter(function(e) { return e.id !== payload.old.id; });
          if (window.currentView === 'dashboard') renderDashboard();
        })
        .subscribe();
    }

    fetchGlobalFbData();
    notify('Cloud sync complete');
    render();
  })
  .catch(function(err) {`;

c = c.replace(
`state.profiles = freshProfiles;
      save();
    }
    fetchGlobalFbData();
    notify('Cloud sync complete');
    render();
  })
  .catch(function(err) {`, syncCode);

const startIdx = c.indexOf("function renderDashboard() {");
const endIdx = c.indexOf("var chartInstances = [];", startIdx);

const patch2Str = fs.readFileSync('patch2.js', 'utf8').split('const newDashboard = `')[1].split('`;')[0];
c = c.substring(0, startIdx) + patch2Str + c.substring(endIdx);

const startIdx2 = c.indexOf("function renderCharts(isManager, cmExpenses, totalAllowance) {");
const endIdx2 = c.indexOf("function enhanceExpenseForm() {");

const patch3Str = fs.readFileSync('patch3.js', 'utf8').split('const newCharts = `')[1].split('`;')[0];
c = c.substring(0, startIdx2) + patch3Str + "\n\n" + c.substring(endIdx2);

fs.writeFileSync('app.js', c);
console.log("Safely patched app.js");

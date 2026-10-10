import re

with open('app.js', 'r', encoding='utf-8') as f:
    c = f.read()

# Phase 1: Realtime
sync_code = """
      state.profiles = freshProfiles;
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
  .catch(function(err) {"""

c = c.replace(
"""state.profiles = freshProfiles;
      save();
    }
    fetchGlobalFbData();
    notify('Cloud sync complete');
    render();
  })
  .catch(function(err) {""", sync_code
)

# Phase 2: renderDashboard
start_idx = c.find("function renderDashboard() {")
end_idx = c.find("var chartInstances = [];", start_idx)
with open('patch2.js', 'r', encoding='utf-8') as f2:
    patch2_code = f2.read()
    patch2_str = patch2_code.split('const newDashboard = `')[1].split('`;')[0]

c = c[:start_idx] + patch2_str + c[end_idx:]

# Phase 3: renderDashboardCharts
start_idx2 = c.find("function renderCharts(isManager, cmExpenses, totalAllowance) {")
end_idx2 = c.find("function enhanceExpenseForm() {")
with open('patch3.js', 'r', encoding='utf-8') as f3:
    patch3_code = f3.read()
    patch3_str = patch3_code.split('const newCharts = `')[1].split('`;')[0]

c = c[:start_idx2] + patch3_str + "\n\n" + c[end_idx2:]

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(c)

print("Safely patched app.js")

const fs = require('fs');

const logic = `

// ============================================================
// Notification System (Added via Bulk Updates)
// ============================================================

window.appState = window.appState || {};
window.appState.notifications = [];

function fetchNotifications() {
  if (!sessionStorage.getItem('isLoggedIn')) return;
  var role = (sessionStorage.getItem('role') || 'mother').toLowerCase();
  var myVillage = sessionStorage.getItem('village') || '';
  var username = sessionStorage.getItem('username') || '';
  
  var isGlobal = (role.indexOf('admin') !== -1 || role.indexOf('accountant') !== -1 || role === 'national_director');
  
  var query = supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(50);
  
  if (!isGlobal) {
    // Village specific or user specific
    // In Supabase JS v2, we can use an OR filter
    query = query.or('target_village.eq.' + myVillage + ',target_village.eq.ALL,target_user.eq.' + username);
  }
  
  query.then(function(res) {
    if (res.error) {
       console.error("Notifications Error:", res.error);
       return;
    }
    window.appState.notifications = res.data || [];
    renderNotificationBadge();
  });
}

function renderNotificationBadge() {
  var unreadCount = window.appState.notifications.filter(function(n) { return !n.is_read; }).length;
  var badge = document.getElementById('notif-badge');
  if (badge) {
    if (unreadCount > 0) {
      badge.style.display = 'block';
      badge.innerText = unreadCount > 99 ? '99+' : unreadCount;
    } else {
      badge.style.display = 'none';
    }
  }
}

function showNotificationInbox() {
  var html = '<div id="notif-modal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:999999; display:flex; justify-content:flex-end; padding-top:60px; padding-right:20px; box-sizing:border-box;">' +
    '<div class="panel" style="width:350px; max-height:80vh; overflow-y:auto; padding:15px; box-shadow:0 10px 30px rgba(0,0,0,0.2); animation: slideIn 0.2s ease-out;">' +
      '<div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #eee; padding-bottom:10px; margin-bottom:10px;">' +
        '<h3 style="margin:0;">Notifications</h3>' +
        '<button class="icon-button" onclick="document.body.removeChild(document.getElementById(\\'notif-modal\\'))">&times;</button>' +
      '</div>';
      
  if (window.appState.notifications.length === 0) {
    html += '<p style="text-align:center; color:#999; margin:20px 0;">No notifications right now.</p>';
  } else {
    window.appState.notifications.forEach(function(n) {
      var date = new Date(n.created_at).toLocaleDateString() + ' ' + new Date(n.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      html += '<div style="padding:10px; margin-bottom:8px; background:'+(n.is_read ? '#f9f9f9' : '#eaf4fc')+'; border-radius:6px; border-left:3px solid '+(n.is_read ? '#ccc' : '#3498db')+'; cursor:pointer;" onclick="markNotificationRead(\\''+n.id+'\\', this)">' +
        '<p style="margin:0 0 5px 0; font-size:13px; color:#333;">' + escapeHtml(n.message) + '</p>' +
        '<small style="color:#7f8c8d; font-size:11px;">' + date + ' &bull; by ' + escapeHtml(n.triggered_by || 'System') + '</small>' +
      '</div>';
    });
  }
  
  html += '</div></div>';
  var div = document.createElement('div');
  div.innerHTML = html;
  document.body.appendChild(div.firstChild);
}

window.markNotificationRead = function(id, el) {
  // Optimistic UI update
  el.style.background = '#f9f9f9';
  el.style.borderLeft = '3px solid #ccc';
  var notif = window.appState.notifications.find(function(n) { return n.id === id; });
  if (notif && !notif.is_read) {
    notif.is_read = true;
    renderNotificationBadge();
    // Fire API update silently
    supabase.from('notifications').update({ is_read: true }).eq('id', id).then(function(){});
  }
};

window.sendNotification = function(targetVillage, message, targetUser) {
  var payload = {
    target_village: targetVillage || 'ALL',
    target_user: targetUser || null,
    message: message,
    triggered_by: sessionStorage.getItem('username') || 'System'
  };
  supabase.from('notifications').insert([payload]).then(function(res) {
    // If it's for myself, reload notifications
    if (payload.target_village === 'ALL' || payload.target_village === sessionStorage.getItem('village')) {
       fetchNotifications();
    }
  });
};

// Wire up the bell icon
document.addEventListener('DOMContentLoaded', function() {
  var bell = document.getElementById('notif-button');
  if (bell) {
    bell.addEventListener('click', function(e) {
      e.preventDefault();
      showNotificationInbox();
    });
  }
});

// Periodic polling
setInterval(function() {
  if (sessionStorage.getItem('isLoggedIn') === 'true') {
     fetchNotifications();
  }
}, 60000); // Poll every minute
`;

fs.appendFileSync('C:\\Users\\Administrator\\Desktop\\Family budget V4\\app.js', logic);
console.log("Appended to app.js");

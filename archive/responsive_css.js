const fs = require('fs');

let css = fs.readFileSync('styles.css', 'utf8');

// Replace the @media (max-width: 600px) block with a vastly improved one
const oldMedia600Start = css.indexOf('@media (max-width: 600px) {');
const oldMedia600End = css.indexOf('body.logged-out .sidebar'); // It ends right before this

if (oldMedia600Start !== -1 && oldMedia600End !== -1) {
  const newMedia600 = `@media (max-width: 600px) {
  .app-shell { flex-direction: column; }
  .sidebar { 
    position: fixed; bottom: 0; left: 0; right: 0; width: 100%; height: 65px; 
    flex-direction: row; padding: 0; align-items: center; z-index: 1000; 
    border-right: none; border-top: 1px solid var(--line); 
  }
  .brand, .sidebar-footer { display: none; }
  #main-nav { display: flex; flex-direction: row; width: 100%; justify-content: space-evenly; padding: 0 5px; }
  .nav-item { display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 10px; padding: 6px 2px; width: auto; border-radius: 8px; color: var(--ink-soft); background: transparent !important; }
  .nav-item span { font-size: 20px; width: auto; margin-bottom: 2px; }
  .nav-item.active { color: var(--coral); }
  .nav-item.active span { color: var(--coral); }
  
  .main-content { padding: 15px 15px 85px; }
  .topbar { align-items: center; gap: 12px; margin-bottom: 20px; }
  .top-actions { gap: 8px; }
  .offline-pill, #profile-name { display: none; }
  h1 { font-size: 24px; }
  .stats-grid, .three-col, .form-grid { grid-template-columns: 1fr; }
  .panel { padding: 15px; }
  .table-wrap { margin: 0 -5px; overflow-x: auto; -webkit-overflow-scrolling: touch; }
  table th, table td { padding: 10px 8px; font-size: 13px; }
  .section-heading { gap: 10px; flex-direction: column; align-items: flex-start; }
  .section-heading > div { margin-bottom: 5px; }
  .section-heading > strong { font-size: 18px; }
  .profile-chip { padding-right: 5px; border-radius: 50%; }
  .profile-chip span:first-child { width: 32px; height: 32px; font-size: 12px; }
  .quick-actions { display: grid; }
  .quick-actions button { width: 100%; }
  .button-row { flex-direction: column; gap: 10px; }
  .button-row button { width: 100%; }
  .expense-catalog-card { width: 100%; flex-basis: 100%; margin-bottom: 5px; }
}
`;

  css = css.substring(0, oldMedia600Start) + newMedia600 + css.substring(oldMedia600End);
  
  // Also add a general overflow-x: auto to table-wrap if not present
  if (!css.includes('.table-wrap { overflow-x: auto')) {
    css = css.replace('.table-wrap {', '.table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch;');
  }

  fs.writeFileSync('styles.css', css);
  console.log('Mobile media query rewritten for bottom nav and better responsiveness');
} else {
  console.log('Could not find media query bounds');
}

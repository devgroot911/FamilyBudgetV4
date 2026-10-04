const fs = require('fs');
let css = fs.readFileSync('temp_css.txt', 'utf8');

const start = css.indexOf('@media (max-width: 600px) {');
const endStr = 'body.logged-out .sidebar';
const end = css.indexOf(endStr);

if (start !== -1 && end !== -1) {
  const newMedia = `@media (max-width: 600px) {
  .app-shell { flex-direction: column; }
  .sidebar { position: fixed; bottom: 0; left: 0; right: 0; width: 100%; height: 60px; flex-direction: row; padding: 0; align-items: center; z-index: 1000; border-right: none; border-top: 1px solid var(--line); }
  .brand, .sidebar-footer { display: none; }
  #main-nav { display: flex; flex-direction: row; width: 100%; justify-content: space-evenly; padding: 0; }
  .nav-item { display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 10px; padding: 4px; width: auto; border-radius: 8px; color: var(--ink-soft); background: transparent !important; }
  .nav-item span { font-size: 20px; width: auto; margin-bottom: 1px; }
  .nav-item.active { color: var(--coral); }
  .nav-item.active span { color: var(--coral); }
  
  .main-content { padding: 10px 10px 70px; }
  .topbar { align-items: center; gap: 10px; margin-bottom: 10px; }
  .top-actions { gap: 8px; }
  .offline-pill, #profile-name { display: none; }
  h1 { font-size: 20px; margin: 0; }
  
  /* Full width columns like before, but tightly packed vertically */
  .stats-grid, .three-col, .form-grid { grid-template-columns: 1fr; gap: 6px; }
  .field { display: flex; align-items: center; justify-content: space-between; }
  .field label { font-size: 12px; margin-bottom: 0; flex: 1; }
  .field input, .field select { width: 60%; padding: 6px 10px; font-size: 14px; min-height: 36px; }
  .panel { padding: 10px; margin-bottom: 8px; }
  
  /* Catalog cards in compact 2-column grid, scrolling vertically within small box */
  .expense-catalog-grid { display: grid !important; grid-template-columns: repeat(2, 1fr) !important; gap: 6px !important; max-height: 120px; overflow-y: auto; overflow-x: hidden; padding-bottom: 2px; }
  .expense-catalog-card { min-height: 40px; padding: 6px; margin: 0 !important; width: 100% !important; min-width: 0 !important; flex-shrink: 1 !important; display: flex; flex-direction: column; justify-content: center; align-items: center; }
  .expense-catalog-card strong { font-size: 11px; display: block; text-align: center; }
  .expense-catalog-card span { font-size: 10px; margin-left: 0; display: block; text-align: center; }
  
  .table-wrap { margin: 0 -5px; overflow-x: auto; -webkit-overflow-scrolling: touch; }
  table th, table td { padding: 6px 4px; font-size: 12px; }
  .section-heading { gap: 4px; flex-direction: row; align-items: center; margin-bottom: 8px; }
  .section-heading > div { margin-bottom: 0; }
  .section-heading > strong { font-size: 14px; }
  .profile-chip { padding-right: 5px; border-radius: 50%; }
  .profile-chip span:first-child { width: 28px; height: 28px; font-size: 11px; }
  .quick-actions { display: grid; }
  .quick-actions button { width: 100%; }
  .button-row { flex-direction: row; gap: 6px; }
  .button-row button { width: 100%; margin: 0; padding: 10px; font-size: 14px; }
  .callout { padding: 6px; font-size: 11px; margin: 6px 0; }
}
  `;
  css = css.substring(0, start) + newMedia + css.substring(end);
  fs.writeFileSync('styles.css', css);
  console.log('Mobile layout restored to 1 column and highly compressed');
} else {
  console.log('Error: @media query not found');
}

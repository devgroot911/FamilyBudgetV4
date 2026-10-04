const fs = require('fs');
let css = fs.readFileSync('styles.css', 'utf8');

// Inside the media query, I want to change:
// .stats-grid, .three-col, .form-grid { grid-template-columns: 1fr; }
// To:
// .stats-grid, .three-col { grid-template-columns: 1fr; }
// .form-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
// .field.full { grid-column: 1 / -1; }

css = css.replace(
  '.stats-grid, .three-col, .form-grid { grid-template-columns: 1fr; }',
  '.stats-grid, .three-col { grid-template-columns: 1fr; } .form-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; } .field.full { grid-column: 1 / -1; }'
);

// I want to change:
// .expense-catalog-card { width: 100%; flex-basis: 100%; margin-bottom: 5px; }
// To horizontal scrolling:
css = css.replace(
  '.expense-catalog-card { width: 100%; flex-basis: 100%; margin-bottom: 5px; }',
  '.expense-catalog-grid { display: flex; overflow-x: auto; -webkit-overflow-scrolling: touch; padding-bottom: 8px; gap: 8px; } .expense-catalog-card { min-width: 140px; flex-shrink: 0; margin-bottom: 0; min-height: 55px; }'
);

// Reduce spacing in main content and topbar to save vertical space
css = css.replace(
  '.main-content { padding: 15px 15px 85px; }',
  '.main-content { padding: 10px 10px 85px; }'
);
css = css.replace(
  '.topbar { align-items: center; gap: 12px; margin-bottom: 20px; }',
  '.topbar { align-items: center; gap: 10px; margin-bottom: 12px; }'
);
css = css.replace(
  '.panel { padding: 15px; }',
  '.panel { padding: 12px; margin-bottom: 12px; }'
);

fs.writeFileSync('styles.css', css);
console.log('Mobile layout compressed for no-scroll form entry');

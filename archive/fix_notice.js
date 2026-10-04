const fs = require('fs');
let css = fs.readFileSync('styles.css', 'utf8');

// Replace standard notice style
css = css.replace(
  '.notice { position: fixed; right: 25px; bottom: 24px; background: var(--ink); color: white; border-radius: 8px; padding: 12px 16px; font-size: 12px; box-shadow: var(--shadow); transform: translateY(25px); opacity: 0; pointer-events: none; transition: .25s; z-index: 5; }.notice.show { transform: none; opacity: 1; }',
  '.notice { position: fixed; right: 25px; bottom: 24px; background: var(--ink); color: white; border-radius: 8px; padding: 14px 20px; font-size: 14px; font-weight: bold; text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,0.4); transform: translateY(25px); opacity: 0; pointer-events: none; transition: .25s; z-index: 2000; }.notice.show { transform: translateY(0); opacity: 1; }'
);

// Add mobile notice style
const mobileStart = css.indexOf('.main-content { padding: 10px 10px 70px; }');
if (mobileStart !== -1) {
  css = css.substring(0, mobileStart) + '.notice { left: 20px; right: 20px; bottom: 85px; }\n  ' + css.substring(mobileStart);
}

fs.writeFileSync('styles.css', css);
console.log('Fixed notice styling');

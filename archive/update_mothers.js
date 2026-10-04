const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://qgfopifgmvwleohswkxo.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnZm9waWZnbXZ3bGVvaHN3a3hvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMxMzMwOTksImV4cCI6MjA1ODcwOTA5OX0.e7b3Z6zGq9C9o2_xQ4_5yG9D2H0hJ7O4xY5-zV0kL7Y');

// Wait, the anon key provided earlier is: 'sb_publishable_qA9QPQZ0Nxzs3xbCx8LeXw_z3UF2ezQ' ?
// Let me check app.js for the exact key.
const fs = require('fs');
let appJs = fs.readFileSync('app.js', 'utf8');
let urlMatch = appJs.match(/supabaseUrl\s*=\s*'([^']+)'/);
let keyMatch = appJs.match(/supabaseKey\s*=\s*'([^']+)'/);

const sb = createClient(urlMatch[1], keyMatch[1]);

async function run() {
  const { data: users } = await sb.from('users').select('*');
  let mothers = users.filter(u => u.role && u.role.toLowerCase() === 'mother');
  console.log('Total mothers:', mothers.length);
  mothers.forEach(m => console.log(m.username, m.village, m.house));
  
  // Assign to a village and give house numbers
  let vGalle = mothers.filter(m => m.village === 'Galle' || m.username.startsWith('galle_'));
  let vPili = mothers.filter(m => m.village === 'Piliyandala' || m.username.startsWith('pili_'));
  
  // If none exist, we just take all mothers and assign half to Galle and half to Piliyandala
  if (vGalle.length === 0 && vPili.length === 0) {
      vGalle = mothers.slice(0, 20);
      vPili = mothers.slice(20, 40);
  }
  
  console.log('Updating Galle mothers...');
  for (let i = 0; i < vGalle.length; i++) {
     let m = vGalle[i];
     await sb.from('users').update({ village: 'Galle', house: String(i + 1) }).eq('username', m.username);
  }
  
  console.log('Updating Pili mothers...');
  for (let i = 0; i < vPili.length; i++) {
     let m = vPili[i];
     await sb.from('users').update({ village: 'Piliyandala', house: String(i + 1) }).eq('username', m.username);
  }
  
  console.log('Done mapping mothers to houses!');
}
run();

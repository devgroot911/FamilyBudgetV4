const https = require('https');
const SUPABASE_URL = 'qgfopifgmvwleohswkxo.supabase.co';
const SUPABASE_KEY = 'sb_publishable_qA9QPQZ0Nxzs3xbCx8LeXw_z3UF2ezQ';

https.get({
  hostname: SUPABASE_URL,
  path: '/rest/v1/users?select=role',
  headers: {
    'apikey': SUPABASE_KEY,
    'Authorization': 'Bearer ' + SUPABASE_KEY,
    'Content-Type': 'application/json'
  }
}, (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    const roles = [...new Set(JSON.parse(data).map(u => u.role))];
    console.log(roles);
  });
});

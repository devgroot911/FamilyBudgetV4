// Script to create 5 mother accounts in Supabase
const https = require('https');

const SUPABASE_URL = 'qgfopifgmvwleohswkxo.supabase.co';
const SUPABASE_KEY = 'sb_publishable_qA9QPQZ0Nxzs3xbCx8LeXw_z3UF2ezQ';

const users = [
  { username: 'mother1', name: 'Mother 1', password: '1234', role: 'mother', usertype: 'Mother / YCCW' },
  { username: 'mother2', name: 'Mother 2', password: '1234', role: 'mother', usertype: 'Mother / YCCW' },
  { username: 'mother3', name: 'Mother 3', password: '1234', role: 'mother', usertype: 'Mother / YCCW' },
  { username: 'mother4', name: 'Mother 4', password: '1234', role: 'mother', usertype: 'Mother / YCCW' },
  { username: 'mother5', name: 'Mother 5', password: '1234', role: 'mother', usertype: 'Mother / YCCW' },
];

const body = JSON.stringify(users);

const options = {
  hostname: SUPABASE_URL,
  path: '/rest/v1/users',
  method: 'POST',
  headers: {
    'apikey': SUPABASE_KEY,
    'Authorization': 'Bearer ' + SUPABASE_KEY,
    'Content-Type': 'application/json',
    'Prefer': 'resolution=merge-duplicates,return=representation'
  }
};

const req = https.request(options, function(res) {
  let data = '';
  res.on('data', function(chunk) { data += chunk; });
  res.on('end', function() {
    if (res.statusCode === 200 || res.statusCode === 201) {
      console.log('✅ Users created successfully!');
      try {
        const result = JSON.parse(data);
        result.forEach(function(u) {
          console.log('  Created: ' + u.username + ' (' + u.name + ')');
        });
      } catch(e) {
        console.log('Response:', data);
      }
    } else {
      console.log('❌ Error:', res.statusCode, data);
    }
  });
});

req.on('error', function(e) { console.error('Request error:', e); });
req.write(body);
req.end();

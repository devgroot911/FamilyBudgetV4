// Test Supabase connection directly
const https = require('https');

const SUPABASE_URL = 'qgfopifgmvwleohswkxo.supabase.co';
const SUPABASE_KEY = 'sb_publishable_qA9QPQZ0Nxzs3xbCx8LeXw_z3UF2ezQ';

function testTable(table) {
  return new Promise(function(resolve) {
    const options = {
      hostname: SUPABASE_URL,
      path: '/rest/v1/' + table + '?select=*&limit=1',
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Content-Type': 'application/json'
      }
    };
    const req = https.request(options, function(res) {
      let data = '';
      res.on('data', function(c) { data += c; });
      res.on('end', function() {
        resolve({ table: table, status: res.statusCode, body: data.substring(0, 300) });
      });
    });
    req.on('error', function(e) { resolve({ table: table, error: e.message }); });
    req.end();
  });
}

Promise.all([testTable('users'), testTable('expenses'), testTable('allowances')])
  .then(function(results) {
    results.forEach(function(r) {
      console.log('\nTable: ' + r.table);
      if (r.error) {
        console.log('  Network error:', r.error);
      } else {
        console.log('  HTTP Status:', r.status);
        console.log('  Response:', r.body);
      }
    });
  });

const https = require('https');

const SUPABASE_URL = 'qgfopifgmvwleohswkxo.supabase.co';
const SUPABASE_KEY = 'sb_publishable_qA9QPQZ0Nxzs3xbCx8LeXw_z3UF2ezQ';

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: SUPABASE_URL,
      path: path,
      method: method,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data ? JSON.parse(data) : null);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function run() {
  try {
    const users = await request('GET', '/rest/v1/users?select=*');
    const counts = {};

    for (const u of users) {
      const lower = u.username.toLowerCase();
      if (!counts[lower]) counts[lower] = [];
      counts[lower].push(u);
    }

    for (const [key, group] of Object.entries(counts)) {
      if (group.length > 1) {
        console.log(`Found duplicate username: ${key} (${group.length} occurrences)`);
        
        // Delete ALL users with this username
        console.log(`  Deleting all records for ${key}...`);
        await request('DELETE', `/rest/v1/users?username=eq.${encodeURIComponent(key)}`);
        
        // Insert them back with unique usernames
        for (let i = 0; i < group.length; i++) {
          const u = group[i];
          if (i > 0) {
            u.username = `${u.username}_${i}`;
            u.password = '1234';
          }
          console.log(`  Inserting ${u.username}...`);
          await request('POST', `/rest/v1/users`, u);
        }
      }
    }
    console.log("Done.");
  } catch(e) {
    console.error(e);
  }
}

run();

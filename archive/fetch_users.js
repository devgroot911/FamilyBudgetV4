const https = require('https');

const options = {
  hostname: 'qgfopifgmvwleohswkxo.supabase.co',
  path: '/rest/v1/users?select=*',
  method: 'GET',
  headers: {
    'apikey': 'sb_publishable_qA9QPQZ0Nxzs3xbCx8LeXw_z3UF2ezQ',
    'Authorization': 'Bearer sb_publishable_qA9QPQZ0Nxzs3xbCx8LeXw_z3UF2ezQ'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log(JSON.parse(data));
  });
});

req.on('error', (e) => {
  console.error(e);
});

req.end();

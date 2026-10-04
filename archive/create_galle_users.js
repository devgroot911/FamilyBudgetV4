const url = 'https://qgfopifgmvwleohswkxo.supabase.co/rest/v1/users';
const key = 'sb_publishable_qA9QPQZ0Nxzs3xbCx8LeXw_z3UF2ezQ';

async function createGalleUsers() {
  const usersToCreate = [
    { username: 'mother1_galle', password: '1234', role: 'mother', name: 'Mother 1 (Galle)', village: 'Galle' },
    { username: 'mother2_galle', password: '1234', role: 'mother', name: 'Mother 2 (Galle)', village: 'Galle' }
  ];

  for (let u of usersToCreate) {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': key,
        'Authorization': 'Bearer ' + key,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(u)
    });
    console.log(await res.text());
  }
}
createGalleUsers();

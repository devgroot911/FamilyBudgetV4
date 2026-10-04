const url = 'https://qgfopifgmvwleohswkxo.supabase.co/rest/v1/users';
const key = 'sb_publishable_qA9QPQZ0Nxzs3xbCx8LeXw_z3UF2ezQ';

async function createUsers() {
  const usersToCreate = [
    { username: 'vd_pili', password: '1234', role: 'village_director', name: 'Village Director (Piliyandala)', village: 'Piliyandala' },
    { username: 'aa_pili', password: '1234', role: 'accounts_assistant', name: 'Accounts Assistant (Piliyandala)', village: 'Piliyandala' },
    { username: 'nd_national', password: '1234', role: 'national_director', name: 'National Director', village: 'All' },
    { username: 'fd_national', password: '1234', role: 'accountant', name: 'Finance Director', village: 'All' },
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

  // Also assign mother1 to mother5 to Piliyandala
  for (let i = 1; i <= 5; i++) {
    const res = await fetch(url + '?username=eq.mother' + i, {
      method: 'PATCH',
      headers: {
        'apikey': key,
        'Authorization': 'Bearer ' + key,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ village: 'Piliyandala' })
    });
    console.log('Update mother' + i, res.status);
  }
}
createUsers();

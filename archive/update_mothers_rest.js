const SUPABASE_URL = 'https://qgfopifgmvwleohswkxo.supabase.co';
const SUPABASE_KEY = 'sb_publishable_qA9QPQZ0Nxzs3xbCx8LeXw_z3UF2ezQ';

async function run() {
  console.log("Fetching mothers...");
  const res = await fetch(`${SUPABASE_URL}/rest/v1/users?select=*`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  });
  
  const users = await res.json();
  const mothers = users.filter(u => u.role && u.role.toLowerCase() === 'mother');
  
  console.log('Total mothers:', mothers.length);
  if (mothers.length === 0) {
      console.log('No mothers found!');
      return;
  }
  
  let i = 1;
  for (const m of mothers) {
      // Force all mothers to Galle for testing
      const village = m.username.includes('pili') ? 'Piliyandala' : 'Galle';
      const houseNo = String(i++);
      
      console.log(`Updating ${m.username} -> ${village}, House ${houseNo}`);
      
      await fetch(`${SUPABASE_URL}/rest/v1/users?username=eq.${m.username}`, {
          method: 'PATCH',
          headers: {
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ village: village, house: houseNo })
      });
  }
  
  console.log("Finished updating mothers!");
}
run();

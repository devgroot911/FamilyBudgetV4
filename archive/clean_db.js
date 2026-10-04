const SUPABASE_URL = 'https://qgfopifgmvwleohswkxo.supabase.co';
const SUPABASE_KEY = 'sb_publishable_qA9QPQZ0Nxzs3xbCx8LeXw_z3UF2ezQ';

async function run() {
  console.log("Fetching users and houses...");
  const headers = { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` };
  
  const [usersRes, housesRes] = await Promise.all([
    fetch(`${SUPABASE_URL}/rest/v1/users?select=*`, { headers }),
    fetch(`${SUPABASE_URL}/rest/v1/fb_houses?select=*`, { headers })
  ]);
  
  const users = await usersRes.json();
  const houses = await housesRes.json();
  
  const validCombos = new Set();
  users.filter(u => u.role && u.role.toLowerCase() === 'mother').forEach(u => {
      if (u.village && u.house) {
          validCombos.add(u.village.toLowerCase() + '_' + String(u.house));
      }
  });
  
  const projRes = await fetch(`${SUPABASE_URL}/rest/v1/fb_projects?select=*`, { headers });
  const projects = await projRes.json();
  
  for (const h of houses) {
      const p = projects.find(proj => proj.id === h.project_id);
      if (!p) continue;
      
      const combo = p.name.toLowerCase() + '_' + String(h.house_no);
      if (!validCombos.has(combo)) {
          console.log('Deleting orphan house:', combo, h.id);
          await fetch(`${SUPABASE_URL}/rest/v1/fb_houses?id=eq.${h.id}`, { method: 'DELETE', headers });
          // also delete child counts
          await fetch(`${SUPABASE_URL}/rest/v1/fb_child_counts?house_id=eq.${h.id}`, { method: 'DELETE', headers });
      }
  }
  
  console.log("Cleanup complete.");
}
run();

const SUPABASE_URL = 'https://qgfopifgmvwleohswkxo.supabase.co';
const SUPABASE_KEY = 'sb_publishable_qA9QPQZ0Nxzs3xbCx8LeXw_z3UF2ezQ';

async function checkDups() {
  const headers = { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' };
  const res = await fetch(`${SUPABASE_URL}/rest/v1/fb_child_counts?select=*`, { headers });
  const data = await res.json();
  console.log("Total rows:", data.length);
  const map = {};
  data.forEach(r => {
    const key = `${r.project_id}_${r.year}_${r.month}_${r.house_id}`;
    if (!map[key]) map[key] = [];
    map[key].push(r.id);
  });
  let dups = false;
  for (let k in map) {
    if (map[k].length > 1) {
      console.log("DUPLICATE FOUND for", k, ":", map[k]);
      dups = true;
      // Delete older duplicates
      const toDelete = map[k].slice(0, map[k].length - 1);
      for (let id of toDelete) {
         await fetch(`${SUPABASE_URL}/rest/v1/fb_child_counts?id=eq.${id}`, { method: 'DELETE', headers });
         console.log("Deleted duplicate", id);
      }
    }
  }
  if (!dups) console.log("No duplicates found in fb_child_counts.");
}
checkDups();

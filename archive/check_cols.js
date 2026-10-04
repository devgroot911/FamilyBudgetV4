const SUPABASE_URL = 'https://qgfopifgmvwleohswkxo.supabase.co';
const SUPABASE_KEY = 'sb_publishable_qA9QPQZ0Nxzs3xbCx8LeXw_z3UF2ezQ';

async function addColumns() {
  const headers = { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' };
  
  // We can't easily run ALTER TABLE via REST API directly without RPC.
  // Let's check if the columns exist by doing a select limit 1
  const res = await fetch(`${SUPABASE_URL}/rest/v1/fb_child_counts?limit=1`, { headers });
  const data = await res.json();
  console.log("Current columns:", Object.keys(data[0] || {}));
}
addColumns();

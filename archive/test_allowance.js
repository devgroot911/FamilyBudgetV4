const url = 'https://qgfopifgmvwleohswkxo.supabase.co/rest/v1/allowances';
const key = 'sb_publishable_qA9QPQZ0Nxzs3xbCx8LeXw_z3UF2ezQ';

async function testAllowanceHack() {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': key,
      'Authorization': 'Bearer ' + key,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({ user_username: 'mother1', month: '2026-09', category_id: 9999, amount: 1 })
  });
  console.log(res.status, await res.text());
}
testAllowanceHack();

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qgfopifgmvwleohswkxo.supabase.co';
const supabaseKey = 'sb_publishable_qA9QPQZ0Nxzs3xbCx8LeXw_z3UF2ezQ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsers() {
  const { data, error } = await supabase.from('users').select('*');
  if (error) console.error("Error:", error);
  else {
    console.log("Users:", data);
    console.log("Keys of first user:", data.length > 0 ? Object.keys(data[0]) : "No users");
  }
}

checkUsers();

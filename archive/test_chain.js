const https = require('https');
const fs = require('fs');

// Create a basic index.html mock for JSDOM if needed, or just polyfill fetch/window.
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://qgfopifgmvwleohswkxo.supabase.co';
const SUPABASE_KEY = 'sb_publishable_qA9QPQZ0Nxzs3xbCx8LeXw_z3UF2ezQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

supabase.from('expenses').select('*').order('date', { ascending: false })
  .then(function(expRes) {
    console.log('expenses OK');
    return supabase.from('allowances').select('*');
  })
  .then(function(allRes) {
    console.log('allowances OK');
    return supabase.from('users').select('*');
  })
  .then(function(userRes) {
    console.log('users OK');
  })
  .catch(function(err) {
    console.error('CAUGHT ERR:', err);
  });

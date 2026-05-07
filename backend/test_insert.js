const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase.from('orders').insert({
    user_id: 'e6a8dcab-8a47-4e78-9e1e-2abf12f0b7aa', // I will need a valid user ID. 
    // Let's first fetch a user_id
  }).select();
}

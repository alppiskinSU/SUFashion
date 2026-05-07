const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testTrigger() {
  const { data: users } = await supabase.from('profiles').select('id').limit(1);
  if (!users || users.length === 0) return console.log('No users');
  const uid = users[0].id;

  const { data, error } = await supabase.from('orders').insert({
    user_id: uid,
    product_id: 1,
    quantity: 9999, // very high
    total_price: 100
  }).select();
  console.log('Error:', error);
}

testTrigger();

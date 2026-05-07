const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkSQL() {
  const { data, error } = await supabase.rpc('get_triggers'); // won't work
}

// Let's do a fast way: Just create a test user, insert an order with stock=999, and observe the error!
async function fullTest() {
  // 1. Create a fake user
  const { data: user, error: userErr } = await supabase.auth.admin.createUser({
    email: 'test_trigger_debug@example.com',
    password: 'password123',
    email_confirm: true
  });
  
  if (userErr && !userErr.message.includes('already exists')) {
    console.log('User error:', userErr);
    return;
  }
  
  const uid = user ? user.user.id : (await supabase.from('profiles').select('id').eq('email', 'test_trigger_debug@example.com').single()).data.id;

  console.log('Testing insert with uid:', uid);
  
  const { data, error } = await supabase.from('orders').insert({
    user_id: uid,
    product_id: 1, // We know Silk Blouse has 10 stock
    quantity: 11, // Try to buy 11
    total_price: 100
  });

  console.log('Order Error:', error);
  
  // Cleanup
  await supabase.auth.admin.deleteUser(uid);
}

fullTest();

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function testQuery() {
  const { data: products, error: prodError } = await supabase.from('products').select('id, name').limit(1);
  if (prodError) {
    console.error('Products error:', prodError);
  } else {
    console.log('Products sample:', products);
  }

  const { data: orders, error: orderError } = await supabase.from('orders').select('id').limit(1);
  if (orderError) {
    console.error('Orders error:', orderError);
  } else {
    console.log('Orders sample:', orders);
  }
  
  const { data: profiles, error: profileError } = await supabase.from('profiles').select('id, role').limit(1);
  if (profileError) {
    console.error('Profiles error:', profileError);
  } else {
    console.log('Profiles sample:', profiles);
  }
}

testQuery();

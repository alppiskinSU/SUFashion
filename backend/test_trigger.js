const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function checkTriggers() {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/check_triggers`, {
    method: 'POST',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    }
  });
  console.log(response.status);
}

// Instead of RPC, let's just make a test order and catch the error.
const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  const { data, error } = await supabase.from('orders').insert({
    user_id: 'e6a8dcab-8a47-4e78-9e1e-2abf12f0b7aa', // I need a valid UUID. I'll just use a random valid UUID format
    product_id: 1,
    quantity: 9999, // Should trigger the check constraint
    total_price: 100
  }).select();
  console.log('Error:', error);
}

testInsert();

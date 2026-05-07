const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkStock() {
  const { data } = await supabase.from('products').select('quantity').eq('id', 1).single();
  console.log('Product 1 Quantity:', data.quantity);
}

checkStock();

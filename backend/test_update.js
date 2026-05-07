const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase.from('products').update({ quantity: 10 }).eq('id', 1).select();
  console.log('Update test:', { data, error });
}
check();

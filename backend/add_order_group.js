const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

(async () => {
  const { data, error } = await supabase.from('orders').select('order_group').limit(1);
  if (error) {
    console.log('Error:', error.message);
  } else {
    console.log('Success, order_group exists!');
  }
})();

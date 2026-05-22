const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkRevenue() {
  const { data, error } = await supabase.from('revenue_tracking').select('*').order('date', { ascending: true });
  if (error) {
    console.error('Error fetching revenue:', error);
  } else {
    console.log('Revenue Tracking data count:', data.length);
    console.log('Sample rows:', data.slice(0, 10));
  }
}

checkRevenue();

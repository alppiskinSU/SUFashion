require('dotenv').config();
console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('SUPABASE_SERVICE_ROLE_KEY length:', process.env.SUPABASE_SERVICE_ROLE_KEY?.length);

const { supabase } = require('./db');

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

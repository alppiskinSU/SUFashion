const { supabase } = require('./db');

async function testServiceRole() {
  const { data, error } = await supabase.from('products').select('id, name').limit(1);
  if (error) {
    console.error('Service role key query error:', error);
  } else {
    console.log('Query using db.js supabase succeeded:', data);
  }
}

testServiceRole();

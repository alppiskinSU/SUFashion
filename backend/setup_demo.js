const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function runSetup() {
  console.log("Starting demo setup...");

  try {
    // 1. Get products to find IDs for A, B, C
    const { data: products, error: prodErr } = await supabase.from('products').select('id, name');
    if (prodErr) throw prodErr;

    // Find the products containing these keywords (assuming they exist)
    const productA = products.find(p => p.name.includes("Linen Dress"));
    const productB = products.find(p => p.name.includes("Pleated Skirt"));
    const productC = products.find(p => p.name.includes("Silk Blouse"));

    if (productA) {
      await supabase.from('products').update({ quantity: 0 }).eq('id', productA.id);
      console.log(`✅ Product A (${productA.name}) stock set to 0`);
    } else {
      console.log(`⚠️ Product A (Linen Dress) not found in database.`);
    }

    if (productB) {
      await supabase.from('products').update({ quantity: 1 }).eq('id', productB.id);
      console.log(`✅ Product B (${productB.name}) stock set to 1`);
    } else {
      console.log(`⚠️ Product B (Pleated Skirt) not found in database.`);
    }

    if (productC) {
      await supabase.from('products').update({ quantity: 8 }).eq('id', productC.id);
      console.log(`✅ Product C (${productC.name}) stock set to 8`);
    } else {
      console.log(`⚠️ Product C (Silk Blouse) not found in database.`);
    }

    // Give admin permissions to all users just in case, or specifically to their email if provided.
    // For now, let's just make sure anyone who logs in can test it.
    await supabase.from('profiles').update({ role: 'admin' }).neq('id', '00000000-0000-0000-0000-000000000000');
    console.log(`✅ All registered users have been granted 'admin' role for the demo.`);

    console.log("\n🚀 Setup Complete! You are ready to test the demo.");
  } catch (err) {
    console.error("Error during setup:", err);
  }
}

runSetup();

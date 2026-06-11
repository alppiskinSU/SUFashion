/**
 * Setup script: Create 4 SEPARATE orders for the customer account (customer@sufashion.test)
 * Each order has its own order_group so they appear as independent purchases.
 *
 *   Product E — purchased more than a month ago → status = delivered  (refund window expired)
 *   Product F — purchased less than a month ago  → status = delivered  (refund eligible)
 *   Product G — purchased recently               → status = processing
 *   Product H — purchased recently               → status = shipped (in-transit)
 *
 * Usage:  node setup_customer_orders.js
 */
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Customer account: customer@sufashion.test
const CUSTOMER_USER_ID = '58d881e2-e680-4eb2-b006-e7c13273b513';

// Helper: create a date N days ago (ISO string)
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

async function setupCustomerOrders() {
  console.log('Setting up customer orders for Product E, F, G, H...\n');

  // Each order gets its own order_group so they appear as separate purchases
  const orders = [
    {
      label: 'Product E',
      product_id: 5,   // Cashmere Wrap Coat
      quantity: 1,
      status: 'delivered',
      created_at: daysAgo(45), // 45 days ago → refund window expired (>30 days)
      order_group: crypto.randomUUID(),
    },
    {
      label: 'Product F',
      product_id: 6,   // Satin Evening Gown
      quantity: 1,
      status: 'delivered',
      created_at: daysAgo(10), // 10 days ago → refund eligible (<30 days)
      order_group: crypto.randomUUID(),
    },
    {
      label: 'Product G',
      product_id: 7,   // Cropped Cashmere Sweater
      quantity: 1,
      status: 'processing',
      created_at: daysAgo(1), // Yesterday
      order_group: crypto.randomUUID(),
    },
    {
      label: 'Product H',
      product_id: 8,   // Tailored Wool Trousers
      quantity: 1,
      status: 'shipped', // DB value for "in-transit"
      created_at: daysAgo(2), // 2 days ago
      order_group: crypto.randomUUID(),
    },
  ];

  // Get product prices
  const productIds = orders.map((o) => o.product_id);
  const { data: products, error: prodErr } = await supabase
    .from('products')
    .select('id, name, price')
    .in('id', productIds);

  if (prodErr) {
    console.error('Failed to fetch products:', prodErr.message);
    process.exit(1);
  }

  const priceMap = Object.fromEntries(products.map((p) => [p.id, p]));

  for (const o of orders) {
    const product = priceMap[o.product_id];
    if (!product) {
      console.error(`Product ${o.product_id} (${o.label}) not found in database!`);
      continue;
    }

    const total_price = product.price * o.quantity;

    const { data: inserted, error: insertErr } = await supabase
      .from('orders')
      .insert([
        {
          user_id: CUSTOMER_USER_ID,
          product_id: o.product_id,
          quantity: o.quantity,
          total_price,
          status: o.status,
          created_at: o.created_at,
          shipping_address: '123 Fashion Avenue, Istanbul, Turkey',
          order_group: o.order_group,
        },
      ])
      .select('id, status, created_at')
      .single();

    if (insertErr) {
      console.error(`❌ ${o.label} failed:`, insertErr.message);
    } else {
      console.log(
        `✅ ${o.label} (${product.name}) → status: ${inserted.status}, date: ${new Date(inserted.created_at).toLocaleDateString()}, order_id: #${inserted.id}`
      );
    }
  }

  console.log('\n🚀 Setup complete!');
  console.log('   Account:   customer@sufashion.test');
  console.log('   Product E → delivered, 45 days ago (refund window EXPIRED)');
  console.log('   Product F → delivered, 10 days ago (refund ELIGIBLE)');
  console.log('   Product G → processing (recent purchase)');
  console.log('   Product H → shipped/in-transit (recent purchase)');
  console.log('\n   Each product is a SEPARATE order (different order_group).');
}

setupCustomerOrders().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});

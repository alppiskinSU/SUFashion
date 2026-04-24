const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const mockProducts = [
  {
    id: 1, name: 'Silk Blouse', category: 'Tops', price: 1250, old_price: null,
    description: 'Pure mulberry silk with a luminous finish. Designed with a subtle drape at the shoulder and French seams throughout, this blouse moves beautifully from day to evening.',
    image_url: 'https://images.unsplash.com/photo-1551163943-3f6a855d1153?auto=format&fit=crop&q=80&w=800',
    quantity: 8, is_limited: false, 
    model: 'SB-24', serial_number: 'SU-TP-001', warranty_status: '1 Year Limited', distributor_info: 'SUFashion Direct',
  },
  {
    id: 2, name: 'Pleated Skirt', category: 'Bottoms', price: 1450, old_price: 1800,
    description: 'Flowing pleats in a luxurious crepe fabric. This midi-length skirt pairs effortlessly with everything from silk camisoles to structured blazers.',
    image_url: 'https://images.unsplash.com/photo-1592301933927-35b597393c0a?auto=format&fit=crop&q=80&w=800',
    quantity: 3, is_limited: true, 
    model: 'PS-24', serial_number: 'SU-BT-002', warranty_status: '1 Year Limited', distributor_info: 'SUFashion Direct',
  },
  {
    id: 3, name: 'Linen Dress', category: 'Dresses', price: 2100, old_price: null,
    description: 'Airy European linen in a relaxed A-line cut. The perfect balance between structure and ease, finished with hand-stitched details at the neckline.',
    image_url: 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?auto=format&fit=crop&q=80&w=800',
    quantity: 0, is_limited: false, 
    model: 'LD-24', serial_number: 'SU-DR-003', warranty_status: '1 Year Limited', distributor_info: 'SUFashion Direct',
  },
  {
    id: 4, name: 'Leather Jacket', category: 'Outerwear', price: 4500, old_price: null,
    description: 'Italian lambskin leather shaped into a timeless moto silhouette. Gunmetal hardware and a tailored fit make this a statement piece for every wardrobe.',
    image_url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&q=80&w=800',
    quantity: 5, is_limited: false, 
    model: 'LJ-24', serial_number: 'SU-OW-004', warranty_status: '2 Year Limited', distributor_info: 'SUFashion Direct',
  }
];

async function seed() {
  console.log('Seeding products...');
  const { data, error } = await supabase
    .from('products')
    .upsert(mockProducts, { onConflict: 'id' });
    
  if (error) {
    console.error('Error seeding data:', error);
  } else {
    console.log('Successfully seeded data!');
  }
}

seed();

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const products = [
  {
    id: 1, name: 'Silk Blouse', category: 'Tops', price: 1250, old_price: null,
    description: 'Pure mulberry silk with a luminous finish. Designed with a subtle drape at the shoulder and French seams throughout.',
    image_url: 'https://images.unsplash.com/photo-1551163943-3f6a855d1153?auto=format&fit=crop&q=80&w=800',
    quantity: 8, is_limited: false, model: 'SB-24', serial_number: 'SU-TP-001', warranty_status: '1 Year Limited', distributor_info: 'SUFashion Direct',
  },
  {
    id: 2, name: 'Pleated Skirt', category: 'Bottoms', price: 1450, old_price: 1800,
    description: 'Flowing pleats in a luxurious crepe fabric. This midi-length skirt pairs effortlessly with silk camisoles to structured blazers.',
    image_url: 'https://images.unsplash.com/photo-1592301933927-35b597393c0a?auto=format&fit=crop&q=80&w=800',
    quantity: 3, is_limited: true, model: 'PS-24', serial_number: 'SU-BT-002', warranty_status: '1 Year Limited', distributor_info: 'SUFashion Direct',
  },
  {
    id: 3, name: 'Linen Dress', category: 'Dresses', price: 2100, old_price: null,
    description: 'Airy European linen in a relaxed A-line cut. The perfect balance between structure and ease, finished with hand-stitched details.',
    image_url: 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?auto=format&fit=crop&q=80&w=800',
    quantity: 0, is_limited: false, model: 'LD-24', serial_number: 'SU-DR-003', warranty_status: '1 Year Limited', distributor_info: 'SUFashion Direct',
  },
  {
    id: 4, name: 'Leather Jacket', category: 'Outerwear', price: 4500, old_price: null,
    description: 'Italian lambskin leather shaped into a timeless moto silhouette. Gunmetal hardware and a tailored fit make this a statement piece.',
    image_url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&q=80&w=800',
    quantity: 5, is_limited: false, model: 'LJ-24', serial_number: 'SU-OW-004', warranty_status: '2 Year Limited', distributor_info: 'SUFashion Direct',
  },
  {
    id: 5, name: 'Cashmere Wrap Coat', category: 'Outerwear', price: 6800, old_price: null,
    description: 'Double-faced cashmere in a generous wrap silhouette. Hand-finished seams and a self-tie belt create an effortlessly elegant look.',
    image_url: 'https://images.unsplash.com/photo-1539533113208-f6df8cc8b543?auto=format&fit=crop&q=80&w=800',
    quantity: 4, is_limited: true, model: 'CW-24', serial_number: 'SU-OW-005', warranty_status: '2 Year Limited', distributor_info: 'SUFashion Direct',
  },
  {
    id: 6, name: 'Satin Evening Gown', category: 'Dresses', price: 5200, old_price: null,
    description: 'Bias-cut satin that cascades like liquid gold. A dramatic back slit and delicate spaghetti straps define red-carpet elegance.',
    image_url: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&q=80&w=800',
    quantity: 2, is_limited: true, model: 'SE-24', serial_number: 'SU-DR-006', warranty_status: '1 Year Limited', distributor_info: 'SUFashion Direct',
  },
  {
    id: 7, name: 'Cropped Cashmere Sweater', category: 'Knitwear', price: 1800, old_price: null,
    description: 'Luxuriously soft Mongolian cashmere in a modern cropped silhouette. Ribbed cuffs and hem provide subtle structure.',
    image_url: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&q=80&w=800',
    quantity: 12, is_limited: false, model: 'CC-24', serial_number: 'SU-KN-007', warranty_status: '1 Year Limited', distributor_info: 'SUFashion Direct',
  },
  {
    id: 8, name: 'Tailored Wool Trousers', category: 'Bottoms', price: 1650, old_price: null,
    description: 'Super 120s wool with a razor-sharp crease. High-waisted with a relaxed leg, these trousers bridge the gap between office and evening.',
    image_url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&q=80&w=800',
    quantity: 9, is_limited: false, model: 'TW-24', serial_number: 'SU-BT-008', warranty_status: '1 Year Limited', distributor_info: 'SUFashion Direct',
  },
  {
    id: 9, name: 'Leather Ankle Boots', category: 'Footwear', price: 3200, old_price: 3800,
    description: 'Handcrafted calfskin leather with a sculpted block heel. A pointed toe and side zip create a seamless, modern profile.',
    image_url: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&q=80&w=800',
    quantity: 6, is_limited: false, model: 'LA-24', serial_number: 'SU-FW-009', warranty_status: '2 Year Limited', distributor_info: 'SUFashion Direct',
  },
  {
    id: 10, name: 'Structured Tote Bag', category: 'Accessories', price: 2800, old_price: null,
    description: 'Full-grain calfskin with brushed gold hardware. Interior organizational pockets and a detachable shoulder strap for versatility.',
    image_url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=800',
    quantity: 7, is_limited: false, model: 'ST-24', serial_number: 'SU-AC-010', warranty_status: '2 Year Limited', distributor_info: 'SUFashion Direct',
  },
  {
    id: 11, name: 'Oversized Cotton Shirt', category: 'Tops', price: 980, old_price: null,
    description: 'Organic cotton poplin with an oversized, borrowed-from-the-boys fit. Mother-of-pearl buttons and a curved hem add refinement.',
    image_url: 'https://images.unsplash.com/photo-1598033129183-c4f50c736c10?auto=format&fit=crop&q=80&w=800',
    quantity: 15, is_limited: false, model: 'OC-24', serial_number: 'SU-TP-011', warranty_status: '1 Year Limited', distributor_info: 'SUFashion Direct',
  },
  {
    id: 12, name: 'Merino Turtleneck', category: 'Knitwear', price: 1100, old_price: null,
    description: 'Extra-fine merino wool in a slim turtleneck profile. Ribbed knit construction provides warmth without bulk.',
    image_url: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&q=80&w=800',
    quantity: 10, is_limited: false, model: 'MT-24', serial_number: 'SU-KN-012', warranty_status: '1 Year Limited', distributor_info: 'SUFashion Direct',
  },
  {
    id: 13, name: 'Silk Wide-Leg Trousers', category: 'Bottoms', price: 1950, old_price: 2300,
    description: 'Flowing silk crepe de chine in a wide-leg silhouette. An elasticated waistband hidden beneath a tailored front creates effortless draping.',
    image_url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=800',
    quantity: 5, is_limited: false, model: 'SW-24', serial_number: 'SU-BT-013', warranty_status: '1 Year Limited', distributor_info: 'SUFashion Direct',
  },
  {
    id: 14, name: 'Cropped Denim Jacket', category: 'Denim', price: 1400, old_price: null,
    description: 'Premium Japanese selvedge denim in a cropped, boxy silhouette. Raw-edge hem and copper rivets for an artisanal finish.',
    image_url: 'https://images.unsplash.com/photo-1551537482-f2075a1d41f2?auto=format&fit=crop&q=80&w=800',
    quantity: 8, is_limited: false, model: 'CD-24', serial_number: 'SU-DN-014', warranty_status: '1 Year Limited', distributor_info: 'SUFashion Direct',
  },
  {
    id: 15, name: 'Cable-Knit Cardigan', category: 'Knitwear', price: 1600, old_price: null,
    description: 'Heritage cable-knit pattern reimagined in a relaxed, oversized cardigan. Crafted from a luxurious wool-cashmere blend.',
    image_url: 'https://images.unsplash.com/photo-1434389677669-e08b4cda3a7a?auto=format&fit=crop&q=80&w=800',
    quantity: 6, is_limited: false, model: 'CK-24', serial_number: 'SU-KN-015', warranty_status: '1 Year Limited', distributor_info: 'SUFashion Direct',
  },
  {
    id: 16, name: 'Minimalist Leather Sandals', category: 'Footwear', price: 1500, old_price: null,
    description: 'Butter-soft nappa leather with a minimalist two-strap design. A cushioned insole and sculpted wooden heel ensure all-day comfort.',
    image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800',
    quantity: 11, is_limited: false, model: 'ML-24', serial_number: 'SU-FW-016', warranty_status: '1 Year Limited', distributor_info: 'SUFashion Direct',
  },
  {
    id: 17, name: 'Silk Camisole', category: 'Tops', price: 850, old_price: null,
    description: 'Delicate silk charmeuse with a flattering V-neckline. Adjustable straps and a slightly longer back hem for layered styling.',
    image_url: 'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?auto=format&fit=crop&q=80&w=800',
    quantity: 14, is_limited: false, model: 'SC-24', serial_number: 'SU-TP-017', warranty_status: '1 Year Limited', distributor_info: 'SUFashion Direct',
  },
  {
    id: 18, name: 'Wrap Midi Dress', category: 'Dresses', price: 2400, old_price: null,
    description: 'Fluid jersey with a classic wrap construction. A self-tie waist and midi length create a universally flattering silhouette.',
    image_url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=800',
    quantity: 7, is_limited: false, model: 'WM-24', serial_number: 'SU-DR-018', warranty_status: '1 Year Limited', distributor_info: 'SUFashion Direct',
  },
  {
    id: 19, name: 'High-Rise Straight Jeans', category: 'Denim', price: 1200, old_price: null,
    description: 'Vintage-inspired straight leg in premium stretch denim. A high-rise waist and full-length leg create a timeless, leg-lengthening look.',
    image_url: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&q=80&w=800',
    quantity: 20, is_limited: false, model: 'HR-24', serial_number: 'SU-DN-019', warranty_status: '1 Year Limited', distributor_info: 'SUFashion Direct',
  },
  {
    id: 20, name: 'Wool-Blend Overcoat', category: 'Outerwear', price: 5500, old_price: 6200,
    description: 'Italian wool-alpaca blend in an oversized single-breasted silhouette. Peak lapels and a half-canvas construction define old-world tailoring.',
    image_url: 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?auto=format&fit=crop&q=80&w=800',
    quantity: 3, is_limited: true, model: 'WO-24', serial_number: 'SU-OW-020', warranty_status: '2 Year Limited', distributor_info: 'SUFashion Direct',
  },
  {
    id: 21, name: 'Statement Pearl Earrings', category: 'Accessories', price: 950, old_price: null,
    description: 'Baroque freshwater pearls set in sterling silver with a modern asymmetric design. Each pair is unique due to the natural pearls.',
    image_url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=800',
    quantity: 9, is_limited: true, model: 'SP-24', serial_number: 'SU-AC-021', warranty_status: '1 Year Limited', distributor_info: 'SUFashion Direct',
  },
  {
    id: 22, name: 'Linen Blazer', category: 'Outerwear', price: 2800, old_price: null,
    description: 'Unstructured Italian linen with patch pockets and a relaxed shoulder. The perfect transitional piece from boardroom to rooftop.',
    image_url: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&q=80&w=800',
    quantity: 6, is_limited: false, model: 'LB-24', serial_number: 'SU-OW-022', warranty_status: '1 Year Limited', distributor_info: 'SUFashion Direct',
  },
  {
    id: 23, name: 'Suede Pointed Pumps', category: 'Footwear', price: 2600, old_price: null,
    description: 'Supple Italian suede on a slender 85mm heel. A pointed toe and leather sole create a refined, feminine profile.',
    image_url: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&q=80&w=800',
    quantity: 4, is_limited: false, model: 'SP-24', serial_number: 'SU-FW-023', warranty_status: '1 Year Limited', distributor_info: 'SUFashion Direct',
  },
  {
    id: 24, name: 'Chain-Link Bracelet', category: 'Accessories', price: 1100, old_price: null,
    description: 'Chunky chain-link design in 18k gold-plated brass. A toggle clasp and brushed finish add contemporary sophistication.',
    image_url: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&q=80&w=800',
    quantity: 13, is_limited: false, model: 'CL-24', serial_number: 'SU-AC-024', warranty_status: '1 Year Limited', distributor_info: 'SUFashion Direct',
  },
  {
    id: 25, name: 'Ribbed Knit Dress', category: 'Dresses', price: 1750, old_price: null,
    description: 'A body-conscious ribbed knit in a midi-length tank silhouette. The perfect canvas for layering or standing alone.',
    image_url: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&q=80&w=800',
    quantity: 8, is_limited: false, model: 'RK-24', serial_number: 'SU-DR-025', warranty_status: '1 Year Limited', distributor_info: 'SUFashion Direct',
  },
  {
    id: 26, name: 'Denim Shirt Dress', category: 'Denim', price: 1350, old_price: null,
    description: 'Washed indigo denim in a classic shirtdress silhouette. Brass buttons and a self-belt create a casual yet polished look.',
    image_url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800',
    quantity: 10, is_limited: false, model: 'DS-24', serial_number: 'SU-DN-026', warranty_status: '1 Year Limited', distributor_info: 'SUFashion Direct',
  },
  {
    id: 27, name: 'Mohair Blend Scarf', category: 'Accessories', price: 680, old_price: null,
    description: 'Featherlight mohair-silk blend in an generous oversized format. Hand-rolled edges and a subtle ombré finish.',
    image_url: 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?auto=format&fit=crop&q=80&w=800',
    quantity: 18, is_limited: false, model: 'MB-24', serial_number: 'SU-AC-027', warranty_status: '1 Year Limited', distributor_info: 'SUFashion Direct',
  },
  {
    id: 28, name: 'Velvet Blazer', category: 'Outerwear', price: 3200, old_price: 3600,
    description: 'Plush cotton velvet with a single-button closure and satin lining. Peak lapels and a tailored fit bring evening sophistication.',
    image_url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=800',
    quantity: 3, is_limited: true, model: 'VB-24', serial_number: 'SU-OW-028', warranty_status: '1 Year Limited', distributor_info: 'SUFashion Direct',
  },
  {
    id: 29, name: 'Satin Pajama Set', category: 'Knitwear', price: 1300, old_price: null,
    description: 'Washed silk satin in a relaxed pajama silhouette. Contrasting piping and a covered elastic waistband for effortless luxury lounging.',
    image_url: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&q=80&w=800',
    quantity: 7, is_limited: false, model: 'SP-24', serial_number: 'SU-KN-029', warranty_status: '1 Year Limited', distributor_info: 'SUFashion Direct',
  },
  {
    id: 30, name: 'Platform Leather Sneakers', category: 'Footwear', price: 1900, old_price: null,
    description: 'Premium calfskin leather on a platform rubber sole. Minimalist design with embossed logo detail and a cushioned collar.',
    image_url: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&q=80&w=800',
    quantity: 16, is_limited: false, model: 'PL-24', serial_number: 'SU-FW-030', warranty_status: '1 Year Limited', distributor_info: 'SUFashion Direct',
  },
  {
    id: 31, name: 'Relaxed Chinos', category: 'Bottoms', price: 950, old_price: null,
    description: 'Garment-dyed cotton twill with a relaxed, tapered leg. A flat front and side adjusters eliminate the need for a belt.',
    image_url: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&q=80&w=800',
    quantity: 14, is_limited: false, model: 'RC-24', serial_number: 'SU-BT-031', warranty_status: '1 Year Limited', distributor_info: 'SUFashion Direct',
  },
  {
    id: 32, name: 'Cocktail Ring', category: 'Accessories', price: 1450, old_price: null,
    description: 'A stunning emerald-cut crystal set in rhodium-plated brass. The oversized silhouette commands attention on any occasion.',
    image_url: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=800',
    quantity: 5, is_limited: true, model: 'CR-24', serial_number: 'SU-AC-032', warranty_status: '1 Year Limited', distributor_info: 'SUFashion Direct',
  },
];

async function seed() {
  console.log('Seeding extended products...');
  const { data, error } = await supabase
    .from('products')
    .upsert(products, { onConflict: 'id' });

  if (error) {
    console.error('Error seeding data:', error);
  } else {
    console.log(`Successfully seeded ${products.length} products!`);
  }
}

seed();

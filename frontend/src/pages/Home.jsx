import React from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import HeroSection from '../components/home/HeroSection';
import CategorySection from '../components/home/CategorySection';
import GallerySection from '../components/home/GallerySection';
import EditorialSection from '../components/home/EditorialSection';

// Mock Product Data
const products = [
  {
    id: 1,
    name: 'Sculpted Cashmere Wrap Coat',
    category: 'SUFASHION ATELIER',
    price: 2450,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCa3u_fr496RCBQXE8eLexYjYiHYv_t-UB09ayWnAOoxUIjgXC1zd8SrQaezCRtzjMafwOeHJHlDvoRWC51GFjlNj3pLEsbFHo8q-bQ7MS0cZ9Au3K517BuLhiwobDRkvYnQlSE8iCG3yLI__wEsi34-UFSSnY8yEpyzlknY72JHcGVV5AsjyQDJJNY06-nCdI8lD0rFOXedYOYKSKvxmXJrZyOw0xLPyxzet1y4iMWim853HGhE56iGxnJYILdwsPpaU5DyyIx_sQ',
    description: 'Italian-sourced virgin cashmere with hand-finished seams and a contemporary oversized silhouette.',
    isLimited: true,
    doubleColumn: true,
  },
  {
    id: 2,
    name: 'Architectural Tote Bag',
    category: 'Accessories',
    price: 890,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC0a7_MWmqkwlSE4Gf9S-Xs_pj42MSkRS9p1HWwwCesg4EqDcYUYUxXNuTIKTH05WbtOQlqBkXOLwfLnzzxeVBf-FUXKpD8ULcqvl2wVtYqgyhOv_-btqALLvPYdc-se4kFnw0LaVc-m1r-zw8CcKwbQWlueMrGNrT9XK6nu80MTWC0ZF_VzvRiFcsAPhgmoOmZb4F9W4omyHS3alV7J0vKIWMaEtsDs0A8N0aPAs5BIrnnnECuIQwZywIEvFapg_AI1lAtewxhC7A',
  },
  {
    id: 3,
    name: 'Chrome Pointed Stilettos',
    category: 'Footwear',
    price: 1100,
    oldPrice: 1100, 
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCXzt38ftF2gtX-06v3-BJM6mrgQbntL5qzBwvNpr3MJcNxsx0TSa-FFlCPbA4lI6J98HpCvB4QrHIu7YjMLWrTEobZHIXwytmWSkrOnD-AqQLE_r60unCpDCRdZTzE4Of1T-uti3qwSlQkgA5APXIcvzfH9z9y6iF348KAeEVu28oAj3j81AW0ICz5wtkE00kLdAEBIM7qPc3DT3b3krosxhr2gPqZ6S25tMbO0YHr4amAaksijwv8dpGGCHjRvz8SbmOXUl91mdU',
    isSoldOut: true,
  },
  {
    id: 4,
    name: 'Organic Heavy Cotton Tee',
    category: 'Essentials',
    price: 120,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDCYGRS4nTC7ric3ABNQOyWo-N-e3YWQerm4rsh4pT37iX8QV7bbN_GF2TMwjMW6k_xCZ_ds8XUfBxzk-c0xeepahSqp7NkIctPaW4nKQ7lZ15l2lB7EXEL3lYI1PT7sBVcav2aZhgiy1ddBmV9nCeZxJnHXLKvRqVc3dgGg8k_I5y7NQ0EPwGxJwRmszhV0v1Up8fiTBssYhgGiUiX_MM1Rfs6DQCt2P9KSfEJZJPAovwiBRIWUV7WNmsFts-jhEWYHUnAE04Od2w',
    useCartIcon: true,
  },
  {
    id: 5,
    name: 'The Heritage Chronograph',
    category: 'Timepieces',
    price: 3200,
    oldPrice: 4500,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD5MCYLkJsAy1cTl-aylLHwtiRYUgCgrIPIKrGg5yShwpt05lJW2zF7aZ-asFV27Lmr1Awca7YWH5CRg-KHK-kK30GQIVfaHx57Yf4ZEqtOBoF05gWGD65HEnkDdH2RtEt1QCaQPnUfYGEKDD6_MyETK-V5fZp129ik6PH2CogFQJqHMaWspuak9PIKTZi7evowpeGhur3zkXXOHJnAq3hvdEAl2NJ8TzV-q9ZFWpR-Z4dWPq3233sswCs7rc0oKY-oXNymPa78V4w',
  },
  {
    id: 6,
    name: 'High-Waisted Wool Trousers',
    category: 'Apparel',
    price: 560,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBLbd4LqJH_t3HxKSpbiNYDS7dcFO5G_R5e8VjFx3hKFubvJVkTXqwyipMcef89qTsgsdf6D-wUAIsVkYmQjx7ElRkTjTNWRDzZD5L3Qp93KD1uqKGP_-h8JpLRDa4jBXvddUHCSyH3OSKni4SLaGc-csNiEXKAF-0kBvUSvgTh1RnXA4MSzZpNQhTA7sMwUqM7p2yifBC6NBmfz_EvWIedu1YbSTtiItnIcwUgQF9SBR1fpMWiAQqBUKoO4PWwmCgLxMYtxP97bjQ',
  },
  {
    id: 7,
    name: 'Hand-Knit Merino Sweater',
    category: 'Knitwear',
    price: 420,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBoB208qUR1N1syG6H2Z2uyCyymdV4OQWRpFaoTGRJMEdeHSeSWSIOb69RkeeRqLYCTL8oU9W9kcGbi9IhR4zggGwsdVFlp0Rx6Dx0-rvua_MW6xyu1ClQLM0_XalHf7Q_ESuJB4ppHRLQHjR2Pyyu2HFb8v7w__5V0Paoe_uRg1zBliLeN5seiiCdDAkqaiCxc7Ktnqf2sXVZJfwZJ-UaZ0vZY2n73jgpX2jXDc6DtoHVWC3p_5OuUkDlsVn2WF4y5Uq-LYNfmtcg',
  }
];

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="pt-24">
        <HeroSection />
        <CategorySection />
        <GallerySection products={products} />
        <EditorialSection />
      </main>
      <Footer />
    </>
  );
}

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import CollectionHero from '../components/collections/CollectionHero';
import CollectionFilter from '../components/collections/CollectionFilter';
import CollectionGrid from '../components/collections/CollectionGrid';
import { supabase } from '../lib/supabase';

export default function Collections() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [sortMode, setSortMode] = useState('default');

  const categoryParam = searchParams.get('category') || '';

  async function fetchProducts(sort, category) {
    const params = new URLSearchParams();
    if (sort && sort !== 'default') params.set('sort', sort);
    if (category) params.set('category', category);

    try {
      const res = await fetch(`http://localhost:3000/api/products?${params}`);
      const data = await res.json();
      const mapped = (data.products || []).map(p => ({
        ...p,
        image: p.image_url,
        hoverImage: p.image_url,
        isSoldOut: p.quantity === 0,
        isLimited: p.is_limited,
        oldPrice: p.old_price,
      }));
      setProducts(mapped);

      if (!category) {
        const catSet = new Set(mapped.map(p => p.category).filter(Boolean));
        setCategories(Array.from(catSet).map(c => ({ id: c.toLowerCase(), label: c })));
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  }

  // Refetch whenever sort or category changes
  useEffect(() => {
    fetchProducts(sortMode, categoryParam);
  }, [sortMode, categoryParam]);

  // Real-time: refetch via backend on product table changes
  useEffect(() => {
    const channel = supabase
      .channel('public:products:collections')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        fetchProducts(sortMode, categoryParam);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [sortMode, categoryParam]);

  const handleFilterChange = (categoryId) => {
    if (categoryId === 'all') {
      setSearchParams({});
    } else {
      setSearchParams({ category: categoryId });
    }
  };

  return (
    <div className="min-h-screen flex flex-col pt-24">
      <Navbar />

      <main className="flex-grow">
        <CollectionHero
          title="Atelier Collection"
          description="Discover unique designs where elegance meets modern lines. The new season crafted with quality fabrics and fine details."
          coverImage="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=2000"
        />

        <CollectionFilter
          categories={categories}
          onFilterChange={handleFilterChange}
          sortMode={sortMode}
          onSortChange={setSortMode}
        />

        <CollectionGrid products={products} />
      </main>

      <Footer />
    </div>
  );
}

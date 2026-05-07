import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import CollectionHero from '../components/collections/CollectionHero';
import CollectionFilter from '../components/collections/CollectionFilter';
import CollectionGrid from '../components/collections/CollectionGrid';
import { supabase } from '../lib/supabase';
import { sortProducts } from '../lib/sortProducts';

export default function Collections() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [sortMode, setSortMode] = useState('default');

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase.from('products').select('*');
      if (!error && data) {
        const mappedData = data.map(mapProductData);
        setProducts(mappedData);

        const catSet = new Set();
        data.forEach((p) => {
          if (p.category) catSet.add(p.category);
        });
        const cats = Array.from(catSet).map((c) => ({ id: c.toLowerCase(), label: c }));
        setCategories(cats);
      } else {
        console.error('Supabase error:', error);
      }
    };

    fetchProducts();

    const channel = supabase
      .channel('public:products:collections')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        fetchProducts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const mapProductData = (p) => ({
    ...p,
    image: p.image_url,
    hoverImage: p.image_url,
    isSoldOut: p.quantity === 0,
    isLimited: p.is_limited,
    oldPrice: p.old_price,
  });

  const displayProducts = useMemo(() => {
    const categoryParam = searchParams.get('category');
    const base =
      categoryParam
        ? products.filter(
            (p) => p.category && p.category.toLowerCase() === categoryParam.toLowerCase()
          )
        : products;
    return sortProducts(base, sortMode);
  }, [products, searchParams, sortMode]);

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

        <CollectionGrid products={displayProducts} />
      </main>

      <Footer />
    </div>
  );
}

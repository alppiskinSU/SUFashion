import React, { useState, useEffect } from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import CollectionHero from '../components/collections/CollectionHero';
import CollectionFilter from '../components/collections/CollectionFilter';
import CollectionGrid from '../components/collections/CollectionGrid';
import { supabase } from '../lib/supabase';

export default function Collections() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase.from('products').select('*');
      if (!error && data) {
        const mappedData = data.map(mapProductData);
        setProducts(mappedData);
        setFilteredProducts(mappedData);
      } else {
        console.error('Supabase error:', error);
      }
    };
    
    fetchProducts();

    const channel = supabase
      .channel('public:products:collections')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
        console.log('Real-time product change:', payload);
        fetchProducts(); // Simple refetch on any change
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Helper to match components' expected data structure
  const mapProductData = (p) => ({
    ...p,
    image: p.image_url,
    hoverImage: p.image_url, // fallback
    isSoldOut: p.quantity === 0,
    isLimited: p.is_limited,
    oldPrice: p.old_price,
  });

  const categories = [
    { id: 'dresses', label: 'Dresses' },
    { id: 'tops', label: 'Tops' },
    { id: 'bottoms', label: 'Bottoms' },
    { id: 'outerwear', label: 'Outerwear' }
  ];

  const handleFilterChange = (categoryId) => {
    if (categoryId === 'all') {
      setFilteredProducts(products);
    } else {
      setFilteredProducts(products.filter(p => 
        p.category && p.category.toLowerCase() === categoryId.toLowerCase()
      ));
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
        />
        
        <CollectionGrid products={filteredProducts} />
      </main>

      <Footer />
    </div>
  );
}

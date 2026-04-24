import { useState, useEffect } from 'react';
import React from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import HeroSection from '../components/home/HeroSection';
import CategorySection from '../components/home/CategorySection';
import GallerySection from '../components/home/GallerySection';
import EditorialSection from '../components/home/EditorialSection';
import { supabase } from '../lib/supabase';

export default function Home() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    // Initial fetch
    const fetchProducts = async () => {
      const { data, error } = await supabase.from('products').select('*');
      if (!error && data) {
        setProducts(data.map(mapProductData));
      } else {
        console.error('Supabase error:', error);
      }
    };
    
    fetchProducts();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('public:products')
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
    isSoldOut: p.quantity === 0,
    isLimited: p.is_limited,
    oldPrice: p.old_price,
  });

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

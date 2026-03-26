import { useState, useEffect } from 'react';
import React from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import HeroSection from '../components/home/HeroSection';
import CategorySection from '../components/home/CategorySection';
import GallerySection from '../components/home/GallerySection';
import EditorialSection from '../components/home/EditorialSection';

export default function Home() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch('http://localhost:3000/api/products')
      .then(res => res.json())
      .then(data => setProducts(data.products))
      .catch(err => console.error('API error:', err));
  }, []);

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

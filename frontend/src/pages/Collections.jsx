import React, { useState, useEffect } from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import CollectionHero from '../components/collections/CollectionHero';
import CollectionFilter from '../components/collections/CollectionFilter';
import CollectionGrid from '../components/collections/CollectionGrid';

const dummyProducts = [
  {
    id: 1,
    name: 'Silk Blouse',
    price: 1250,
    category: 'tops',
    image: 'https://images.unsplash.com/photo-1551163943-3f6a855d1153?auto=format&fit=crop&q=80&w=800',
    hoverImage: 'https://images.unsplash.com/photo-1551163943-3f6a855d1153?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 2,
    name: 'Pleated Skirt',
    price: 1450,
    category: 'bottoms',
    image: 'https://images.unsplash.com/photo-1583496661160-c588c443c982?auto=format&fit=crop&q=80&w=800',
    hoverImage: 'https://images.unsplash.com/photo-1583496661160-c588c443c982?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 3,
    name: 'Linen Dress',
    price: 2100,
    category: 'dresses',
    image: 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?auto=format&fit=crop&q=80&w=800',
    hoverImage: 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 4,
    name: 'Leather Jacket',
    price: 4500,
    category: 'outerwear',
    image: 'https://images.unsplash.com/photo-1550614000-4b9e782e4f0a?auto=format&fit=crop&q=80&w=800',
    hoverImage: 'https://images.unsplash.com/photo-1550614000-4b9e782e4f0a?auto=format&fit=crop&q=80&w=800'
  }
];

export default function Collections() {
  const [products, setProducts] = useState(dummyProducts);
  const [filteredProducts, setFilteredProducts] = useState(dummyProducts);

  useEffect(() => {
    // Attempt to fetch from API but fallback to dummy if needed
    fetch('http://localhost:3000/api/products')
      .then(res => res.json())
      .then(data => {
        if (data.products && data.products.length > 0) {
          setProducts(data.products);
          setFilteredProducts(data.products);
        }
      })
      .catch(err => console.error('API error, using fallback:', err));
  }, []);

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
      setFilteredProducts(products.filter(p => p.category === categoryId));
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

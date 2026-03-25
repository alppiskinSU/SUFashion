import React from 'react';
import { ChevronDown } from 'lucide-react';
import ProductCard from '../ui/ProductCard';

export default function GallerySection({ products }) {
  return (
    <section className="px-8 py-20 bg-surface-container-low">
      <div className="flex flex-col md:flex-row justify-between items-baseline gap-8 mb-16 border-b border-outline-variant pb-8">
        <h2 className="text-5xl font-serif font-bold tracking-tight text-primary">The Gallery</h2>
        <div className="flex items-center gap-12 w-full md:w-auto">
          <div className="flex gap-8 text-sm uppercase tracking-widest font-medium font-sans">
            <button className="text-primary border-b border-primary pb-1">All</button>
            <button className="text-outline hover:text-primary transition-colors pb-1 border-b border-transparent">Apparel</button>
            <button className="text-outline hover:text-primary transition-colors pb-1 border-b border-transparent">Footwear</button>
            <button className="text-outline hover:text-primary transition-colors pb-1 border-b border-transparent">Jewelry</button>
          </div>
          <div className="relative group ml-auto">
            <button className="flex items-center gap-2 text-sm uppercase tracking-widest font-bold text-primary font-sans">
              Sort By: Popularity <ChevronDown className="w-4 h-4 ml-1" strokeWidth={2} />
            </button>
            <div className="absolute top-full right-0 w-48 bg-white border border-outline-variant opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
              <a href="#" className="block px-4 py-3 text-xs uppercase tracking-widest hover:bg-surface-container text-primary font-sans">Price: Low to High</a>
              <a href="#" className="block px-4 py-3 text-xs uppercase tracking-widest hover:bg-surface-container text-primary font-sans">Price: High to Low</a>
              <a href="#" className="block px-4 py-3 text-xs uppercase tracking-widest hover:bg-surface-container text-primary font-sans">Newest</a>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
        {products.map((product) => (
          <ProductCard 
            key={product.id} 
            product={product} 
            doubleColumn={product.doubleColumn} 
          />
        ))}
      </div>
    </section>
  );
}

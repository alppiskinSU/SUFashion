import React from 'react';
import ProductCard from '../ui/ProductCard';

export default function CollectionGrid({ products }) {
  if (!products || products.length === 0) {
    return (
      <div className="w-full flex-col flex items-center justify-center py-32 text-center px-8">
        <h3 className="font-serif text-2xl text-primary mb-4">No Results Found</h3>
        <p className="body-md text-outline">No products match your criteria. Please clear filters and try again.</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-8 py-16">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}

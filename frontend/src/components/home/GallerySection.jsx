import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import ProductCard from '../ui/ProductCard';

const SORT_OPTIONS = [
  { value: 'popularity', label: 'Popularity' },
  { value: 'price_asc',  label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

function sortProducts(products, sort) {
  const copy = [...products];
  if (sort === 'price_asc')  return copy.sort((a, b) => a.price - b.price);
  if (sort === 'price_desc') return copy.sort((a, b) => b.price - a.price);
  return copy.sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));
}

export default function GallerySection({ products }) {
  const [sort, setSort] = useState('popularity');

  const sorted = sortProducts(products, sort);
  const activeLabel = SORT_OPTIONS.find(o => o.value === sort)?.label ?? 'Popularity';

  return (
    <section className="px-8 py-20 bg-surface-container-low">
      <div className="flex flex-col md:flex-row justify-between items-baseline gap-8 mb-16 border-b border-outline-variant pb-8">
        <h2 className="text-5xl font-serif font-bold tracking-tight text-primary">The Gallery</h2>
        <div className="flex items-center gap-12 w-full md:w-auto">
          <div className="relative group ml-auto">
            <button className="flex items-center gap-2 text-sm uppercase tracking-widest font-bold text-primary font-sans">
              Sort By: {activeLabel} <ChevronDown className="w-4 h-4 ml-1" strokeWidth={2} />
            </button>
            <div className="absolute top-full right-0 w-48 bg-white border border-outline-variant opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
              {SORT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setSort(opt.value)}
                  className={`block w-full text-left px-4 py-3 text-xs uppercase tracking-widest hover:bg-surface-container font-sans transition-colors ${
                    sort === opt.value ? 'text-primary font-bold' : 'text-outline'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
        {sorted.map((product) => (
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

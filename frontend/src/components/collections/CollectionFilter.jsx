import { useState } from 'react';

const SORT_OPTIONS = [
  { value: '',           label: 'Default' },
  { value: 'price_asc',  label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'popularity', label: 'Popularity' },
];

export default function CollectionFilter({ categories, onFilterChange, onSortChange }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeSort, setActiveSort] = useState('');

  const handleCategoryClick = (category) => {
    setActiveCategory(category);
    if (onFilterChange) onFilterChange(category);
  };

  const handleSortClick = (value) => {
    setActiveSort(value);
    if (onSortChange) onSortChange(value);
  };

  return (
    <div className="w-full border-y border-outline-variant/30 bg-surface-container-lowest sticky top-[88px] z-40">
      <div className="max-w-[1400px] mx-auto px-8 py-4 flex flex-col gap-4">
        {/* Categories */}
        <div className="flex gap-8 overflow-x-auto scrollbar-hide pb-1">
          <button
            onClick={() => handleCategoryClick('all')}
            className={`label-sm whitespace-nowrap transition-colors border-b-2 pb-1 ${activeCategory === 'all' ? 'text-primary border-primary' : 'text-outline border-transparent hover:text-primary'}`}
          >
            All Products
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              className={`label-sm whitespace-nowrap transition-colors border-b-2 pb-1 ${activeCategory === cat.id ? 'text-primary border-primary' : 'text-outline border-transparent hover:text-primary'}`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Sort buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] uppercase tracking-widest text-outline mr-2">Sort by</span>
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => handleSortClick(opt.value)}
              className={`px-3 py-1.5 text-[10px] uppercase tracking-widest font-bold border transition-colors ${
                activeSort === opt.value
                  ? 'border-primary bg-primary text-white'
                  : 'border-outline-variant text-outline hover:border-primary hover:text-primary'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

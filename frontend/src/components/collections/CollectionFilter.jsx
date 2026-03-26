import React, { useState } from 'react';
import { ChevronDown, Filter } from 'lucide-react';

export default function CollectionFilter({ categories, onFilterChange }) {
  const [activeCategory, setActiveCategory] = useState('all');

  const handleCategoryClick = (category) => {
    setActiveCategory(category);
    if (onFilterChange) onFilterChange(category);
  };

  return (
    <div className="w-full border-y border-outline-variant/30 bg-surface-container-lowest sticky top-[88px] z-40">
      <div className="max-w-[1400px] mx-auto px-8 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Categories */}
        <div className="flex gap-8 overflow-x-auto w-full md:w-auto scrollbar-hide pb-2 md:pb-0">
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

        {/* Sort & Filter Actions */}
        <div className="flex items-center gap-6 self-start md:self-auto w-full md:w-auto justify-end border-t md:border-t-0 border-outline-variant/30 pt-4 md:pt-0">
          <button className="flex items-center gap-2 label-sm text-primary hover:opacity-70 transition-opacity">
            <Filter size={16} strokeWidth={1.5} />
            <span>Filter</span>
          </button>
          <div className="h-4 w-[1px] bg-outline-variant/50"></div>
          <button className="flex items-center gap-2 label-sm text-primary hover:opacity-70 transition-opacity">
            <span>Sort</span>
            <ChevronDown size={16} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </div>
  );
}

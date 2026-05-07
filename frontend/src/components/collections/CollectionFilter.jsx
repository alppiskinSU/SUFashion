import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Filter } from 'lucide-react';

const SORT_OPTIONS = [
  { value: 'default', label: 'Default' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'popularity', label: 'Popularity' },
];

export default function CollectionFilter({ categories, onFilterChange, sortMode, onSortChange }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef(null);

  useEffect(() => {
    const close = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) setSortOpen(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  const handleCategoryClick = (category) => {
    setActiveCategory(category);
    if (onFilterChange) onFilterChange(category);
  };

  const currentSortLabel = SORT_OPTIONS.find(o => o.value === (sortMode || 'default'))?.label || 'Default';

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
          <button type="button" className="flex items-center gap-2 label-sm text-primary hover:opacity-70 transition-opacity">
            <Filter size={16} strokeWidth={1.5} />
            <span>Filter</span>
          </button>
          <div className="h-4 w-[1px] bg-outline-variant/50"></div>
          <div className="relative" ref={sortRef}>
            <button
              type="button"
              onClick={() => setSortOpen(o => !o)}
              className="flex items-center gap-2 label-sm text-primary hover:opacity-70 transition-opacity"
              aria-expanded={sortOpen}
              aria-haspopup="listbox"
            >
              <span>Sort: {currentSortLabel}</span>
              <ChevronDown size={16} strokeWidth={1.5} className={sortOpen ? 'rotate-180' : ''} />
            </button>
            {sortOpen && (
              <ul
                className="absolute right-0 mt-2 min-w-[220px] bg-surface-container-lowest border border-outline-variant shadow-lg z-50 py-1"
                role="listbox"
              >
                {SORT_OPTIONS.map(opt => (
                  <li key={opt.value}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={(sortMode || 'default') === opt.value}
                      onClick={() => {
                        onSortChange?.(opt.value);
                        setSortOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-xs uppercase tracking-widest hover:bg-surface-container transition-colors ${
                        (sortMode || 'default') === opt.value ? 'text-primary font-bold' : 'text-outline'
                      }`}
                    >
                      {opt.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

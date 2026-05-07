import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowUpRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';

function CollectionCard({ title, image, productCount }) {
  return (
    <Link to={`/collections?category=${encodeURIComponent(title)}`} className="flex-none w-[450px] group cursor-pointer">
      <div className="aspect-[4/5] overflow-hidden mb-6 bg-surface-container">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-1000"
        />
      </div>
      <div className="flex justify-between items-center text-primary">
        <div>
          <h3 className="text-2xl font-serif italic">{title}</h3>
          <p className="text-[10px] uppercase tracking-[0.2em] text-outline mt-1">{productCount} {productCount === 1 ? 'piece' : 'pieces'}</p>
        </div>
        <ArrowUpRight className="w-6 h-6" strokeWidth={1} />
      </div>
    </Link>
  );
}

export default function CategorySection() {
  const [collections, setCollections] = useState([]);
  const scrollRef = useRef(null);

  useEffect(() => {
    const fetchCollections = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('category, image_url');

      if (!error && data) {
        const categoryMap = {};
        data.forEach((p) => {
          if (!p.category) return;
          const cat = p.category;
          if (!categoryMap[cat]) {
            categoryMap[cat] = { title: cat, image: p.image_url, count: 0 };
          }
          categoryMap[cat].count += 1;
        });

        const sorted = Object.values(categoryMap).sort((a, b) => b.count - a.count);
        setCollections(sorted);
      }
    };

    fetchCollections();

    const channel = supabase
      .channel('public:products:collections-section')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        fetchCollections();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const amount = 470;
      scrollRef.current.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
    }
  };

  return (
    <section className="py-20 bg-surface">
      <div className="px-8 mb-12 flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-serif italic mb-2 text-primary">Collections</h2>
          <p className="text-outline font-light font-sans">Explore our curated categories</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => scroll('left')}
            className="w-12 h-12 border border-outline-variant flex items-center justify-center hover:bg-primary hover:text-on-primary transition-colors text-primary"
          >
            <ChevronLeft className="w-6 h-6" strokeWidth={1} />
          </button>
          <button
            onClick={() => scroll('right')}
            className="w-12 h-12 border border-outline-variant flex items-center justify-center hover:bg-primary hover:text-on-primary transition-colors text-primary"
          >
            <ChevronRight className="w-6 h-6" strokeWidth={1} />
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex overflow-x-auto hidden-scrollbar gap-8 px-8 pb-4">
        {collections.map((col) => (
          <CollectionCard
            key={col.title}
            title={col.title}
            image={col.image}
            productCount={col.count}
          />
        ))}
      </div>
    </section>
  );
}

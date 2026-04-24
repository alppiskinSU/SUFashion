import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search as SearchIcon } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import ProductCard from '../components/ui/ProductCard';
import { supabase } from '../lib/supabase';

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const doSearch = async (q) => {
    if (!q.trim()) { setResults([]); setSearched(false); return; }
    setLoading(true);
    setSearched(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .or(`name.ilike.%${q}%,description.ilike.%${q}%,category.ilike.%${q}%`);

    if (!error && data) {
      setResults(data.map(p => ({
        ...p,
        image: p.image_url,
        isSoldOut: p.quantity === 0,
        isLimited: p.is_limited,
        oldPrice: p.old_price,
      })));
    } else {
      setResults([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) { setQuery(q); doSearch(q); }
  }, [searchParams]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSearchParams(query.trim() ? { q: query.trim() } : {});
    doSearch(query);
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Navbar />

      <main className="flex-grow pt-28 pb-20 px-6 md:px-12 lg:px-24">
        {/* Search header */}
        <h1 className="font-serif italic text-4xl md:text-5xl text-primary mb-12">Search</h1>

        {/* Search input */}
        <form onSubmit={handleSubmit} className="max-w-2xl mb-16">
          <div className="flex items-center border-b-2 border-primary pb-2">
            <SearchIcon className="w-5 h-5 text-outline mr-4 flex-none" strokeWidth={1.5} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products, categories..."
              autoFocus
              className="flex-1 bg-transparent text-xl text-primary placeholder:text-outline outline-none font-serif italic"
            />
            <button
              type="submit"
              className="text-[10px] uppercase tracking-widest font-bold text-primary hover:text-outline transition-colors ml-4"
            >
              Search
            </button>
          </div>
        </form>

        {/* Results */}
        {loading ? (
          <p className="text-outline text-xs uppercase tracking-widest animate-pulse">Searching...</p>
        ) : searched ? (
          <>
            <p className="text-outline text-xs uppercase tracking-widest mb-10">
              {results.length} result{results.length !== 1 ? 's' : ''} for "{searchParams.get('q')}"
            </p>

            {results.length === 0 ? (
              <div className="text-center py-24">
                <p className="text-outline text-sm uppercase tracking-widest mb-4">No products found</p>
                <p className="text-outline text-xs">Try a different search term</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
                {results.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-24">
            <SearchIcon className="w-16 h-16 text-outline mx-auto mb-6" strokeWidth={0.75} />
            <p className="text-outline text-sm uppercase tracking-widest">Enter a search term to find products</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

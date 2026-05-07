import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import CollectionHero from '../components/collections/CollectionHero';
import CollectionFilter from '../components/collections/CollectionFilter';
import CollectionGrid from '../components/collections/CollectionGrid';
import { supabase } from '../lib/supabase';

export default function Collections() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [sort, setSort] = useState('');
  const [categories, setCategories] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase.from('products').select('*');
      if (!error && data) {
        const mappedData = data.map(mapProductData);
        setProducts(mappedData);

        const catSet = new Set();
        data.forEach((p) => {
          if (p.category) catSet.add(p.category);
        });
        const cats = Array.from(catSet).map((c) => ({ id: c.toLowerCase(), label: c }));
        setCategories(cats);

        const categoryParam = searchParams.get('category');
        if (categoryParam) {
          setFilteredProducts(
            mappedData.filter(
              (p) => p.category && p.category.toLowerCase() === categoryParam.toLowerCase()
            )
          );
        } else {
          setFilteredProducts(mappedData);
        }
      } else {
        console.error('Supabase error:', error);
      }
    };

    fetchProducts();

    const channel = supabase
      .channel('public:products:collections')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        fetchProducts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const mapProductData = (p) => ({
    ...p,
    image: p.image_url,
    hoverImage: p.image_url,
    isSoldOut: p.quantity === 0,
    isLimited: p.is_limited,
    oldPrice: p.old_price,
  });

  const getSorted = (items) => {
    const copy = [...items];
    if (sort === 'price_asc')  return copy.sort((a, b) => a.price - b.price);
    if (sort === 'price_desc') return copy.sort((a, b) => b.price - a.price);
    if (sort === 'popularity') return copy.sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));
    return copy;
  };

  const handleFilterChange = (categoryId) => {
    if (categoryId === 'all') {
      setSearchParams({});
      setFilteredProducts(products);
    } else {
      setSearchParams({ category: categoryId });
      setFilteredProducts(
        products.filter((p) => p.category && p.category.toLowerCase() === categoryId.toLowerCase())
      );
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
          onSortChange={setSort}
        />

        <CollectionGrid products={getSorted(filteredProducts)} />
      </main>

      <Footer />
    </div>
  );
}

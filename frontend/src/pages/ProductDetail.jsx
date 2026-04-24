import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, Heart, Minus, Plus, Package, AlertTriangle } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Button from '../components/ui/Button';
import { useCart } from '../contexts/CartContext';
import { supabase } from '../lib/supabase';

/* ── Stock badge component ── */
function StockBadge({ quantity }) {
  if (quantity === 0) {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200">
        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        <span className="text-[11px] uppercase tracking-widest font-bold text-red-600">Out of Stock</span>
      </div>
    );
  }
  if (quantity <= 5) {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" strokeWidth={1.5} />
        <span className="text-[11px] uppercase tracking-widest font-bold text-amber-700">
          Only {quantity} left in stock
        </span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border border-emerald-200">
      <Package className="w-3.5 h-3.5 text-emerald-600" strokeWidth={1.5} />
      <span className="text-[11px] uppercase tracking-widest font-bold text-emerald-700">In Stock</span>
    </div>
  );
}

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();
        
      if (!error && data) {
        setProduct({
          ...data,
          image: data.image_url,
          isSoldOut: data.quantity === 0,
          isLimited: data.is_limited,
          oldPrice: data.old_price,
        });
      } else {
        setProduct(null);
        console.error('Supabase error:', error);
      }
      setLoading(false);
    };

    fetchProduct();

    const channel = supabase
      .channel(`public:products:detail:${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products', filter: `id=eq.${id}` }, (payload) => {
        console.log('Real-time product change:', payload);
        fetchProduct(); // Simple refetch on any change
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-surface">
        <Navbar />
        <div className="flex-grow flex items-center justify-center pt-24">
          <p className="text-outline text-xs uppercase tracking-widest animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col bg-surface">
        <Navbar />
        <div className="flex-grow flex flex-col items-center justify-center pt-24 gap-6">
          <h2 className="font-serif italic text-3xl text-primary">Product Not Found</h2>
          <Link to="/collections" className="text-outline hover:text-primary text-xs uppercase tracking-widest font-bold underline underline-offset-4">
            Back to Collections
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const isSoldOut = product.isSoldOut || product.quantity === 0;
  const fmt = (n) => n.toLocaleString(undefined, { minimumFractionDigits: 2 });

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Navbar />

      <main className="flex-grow pt-28 pb-20 px-6 md:px-12 lg:px-24">
        {/* Breadcrumb */}
        <Link
          to="/collections"
          className="inline-flex items-center gap-2 text-outline hover:text-primary text-xs uppercase tracking-widest font-bold mb-12 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" strokeWidth={1.5} />
          Back to Collections
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          {/* ── Image ── */}
          <div className="relative overflow-hidden bg-surface-container aspect-[3/4]">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-1000"
            />

            {isSoldOut && (
              <div className="absolute inset-0 bg-primary/40 flex items-center justify-center backdrop-blur-[2px]">
                <span className="bg-white text-primary px-8 py-3 text-xs uppercase tracking-widest font-bold">
                  Sold Out
                </span>
              </div>
            )}

            {product.isLimited && !isSoldOut && (
              <div className="absolute top-6 left-6 bg-white px-4 py-1.5 text-[10px] uppercase tracking-widest font-bold text-primary z-10">
                Limited Edition
              </div>
            )}
          </div>

          {/* ── Details ── */}
          <div className="flex flex-col justify-center py-4 lg:py-12">
            {/* Category */}
            <p className="text-[10px] uppercase tracking-[0.25em] text-outline font-bold mb-3">{product.category}</p>

            {/* Name */}
            <h1 className="font-serif italic text-4xl md:text-5xl text-primary mb-6 leading-tight">{product.name}</h1>

            {/* Price */}
            <div className="flex items-baseline gap-4 mb-8">
              <span className="text-2xl font-medium text-primary">${fmt(product.price)}</span>
              {product.oldPrice && (
                <span className="text-base text-outline line-through">${fmt(product.oldPrice)}</span>
              )}
            </div>

            {/* ★ Stock Display ★ */}
            <div className="mb-8">
              <StockBadge quantity={product.quantity} />
            </div>

            {/* Description */}
            <p className="text-sm text-outline font-light leading-relaxed mb-10 max-w-lg">
              {product.description}
            </p>

            {/* Quantity Selector + Add to Cart */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-10">
              {/* Qty */}
              <div className="flex items-center border border-outline-variant">
                <button
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                  disabled={isSoldOut}
                  className="w-12 h-12 flex items-center justify-center text-outline hover:text-primary disabled:opacity-30"
                >
                  <Minus className="w-4 h-4" strokeWidth={1.5} />
                </button>
                <span className="w-12 text-center text-sm font-bold text-primary">{qty}</span>
                <button
                  onClick={() => setQty(q => Math.min(product.quantity, q + 1))}
                  disabled={isSoldOut}
                  className="w-12 h-12 flex items-center justify-center text-outline hover:text-primary disabled:opacity-30"
                >
                  <Plus className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </div>

              {/* Add to Cart */}
              <Button
                variant="secondary"
                className="flex-1"
                disabled={isSoldOut}
                onClick={() => {
                  addToCart(product, qty);
                  setAdded(true);
                  setTimeout(() => setAdded(false), 2000);
                }}
              >
                <ShoppingBag className="w-4 h-4" strokeWidth={1.5} />
                {isSoldOut ? 'Out of Stock' : added ? 'Added!' : 'Add to Bag'}
              </Button>

              {/* Wishlist */}
              <button className="w-12 h-12 flex items-center justify-center border border-outline-variant text-outline hover:text-primary hover:border-primary">
                <Heart className="w-5 h-5" strokeWidth={1} />
              </button>
            </div>

            {/* Product Details Accordion */}
            <div className="border-t border-outline-variant pt-8 space-y-4">
              <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-primary mb-4">Product Details</h3>
              <div className="grid grid-cols-2 gap-y-3 text-sm">
                {product.model && (
                  <>
                    <span className="text-outline">Model</span>
                    <span className="text-primary font-medium">{product.model}</span>
                  </>
                )}
                {product.serial_number && (
                  <>
                    <span className="text-outline">Serial Number</span>
                    <span className="text-primary font-medium">{product.serial_number}</span>
                  </>
                )}
                {product.warranty_status && (
                  <>
                    <span className="text-outline">Warranty</span>
                    <span className="text-primary font-medium">{product.warranty_status}</span>
                  </>
                )}
                {product.distributor_info && (
                  <>
                    <span className="text-outline">Distributor</span>
                    <span className="text-primary font-medium">{product.distributor_info}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

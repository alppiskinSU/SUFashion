import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, Heart, Minus, Plus, Package, AlertTriangle, Star } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Button from '../components/ui/Button';
import { useCart } from '../contexts/CartContext';
import { supabase } from '../lib/supabase';
import { authFetch } from '../lib/authFetch';

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
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMessage, setReviewMessage] = useState('');
  const { addToCart } = useCart();

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try { setCurrentUser(JSON.parse(stored)); } catch { setCurrentUser(null); }
    }
  }, []);

  useEffect(() => {
    if (!currentUser?.id || !product?.id) return;
    const controller = new AbortController();
    authFetch(`http://localhost:3000/api/favorites/check/${product.id}`, {
      signal: controller.signal,
    })
      .then(r => r.json())
      .then(data => setIsFavorited(!!data.isFavorited))
      .catch(() => {});
    return () => controller.abort();
  }, [currentUser?.id, product?.id]);

  const toggleFavorite = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    const next = !isFavorited;
    setIsFavorited(next);
    try {
      const res = await authFetch(`http://localhost:3000/api/favorites/${product.id}`, {
        method: isFavorited ? 'DELETE' : 'POST',
      });
      if (!res.ok) setIsFavorited(!next);
    } catch {
      setIsFavorited(!next);
    }
  };

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

  useEffect(() => {
    if (!product?.id) return;
    fetch(`http://localhost:3000/api/reviews/${product.id}`)
      .then(r => r.json())
      .then(data => setReviews(data.reviews ?? []))
      .catch(() => {});
  }, [product?.id]);

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

  const submitReview = async (e) => {
    e.preventDefault();
    if (!reviewRating) return setReviewMessage('Please select a star rating.');
    setReviewSubmitting(true);
    setReviewMessage('');
    try {
      const res = await authFetch(`http://localhost:3000/api/reviews/${product.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: reviewRating, comment: reviewComment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setReviewMessage(
        data.message ||
          'Rating added immediately. Your comment is awaiting approval.'
      );
      setReviewRating(0);
      setReviewComment('');
      // Refresh reviews so the new rating shows up right away
      fetch(`http://localhost:3000/api/reviews/${product.id}`)
        .then(r => r.json())
        .then(d => setReviews(d.reviews ?? []))
        .catch(() => {});
    } catch (err) {
      setReviewMessage(err.message || 'Failed to submit review.');
    } finally {
      setReviewSubmitting(false);
    }
  };

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
              <button
                onClick={toggleFavorite}
                className="w-12 h-12 flex items-center justify-center border border-outline-variant hover:border-primary transition-colors"
              >
                <Heart
                  className="w-5 h-5 transition-colors"
                  strokeWidth={1}
                  fill={isFavorited ? 'currentColor' : 'none'}
                  style={{ color: isFavorited ? '#e11d48' : undefined }}
                />
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
        {/* ── Reviews Section ── */}
        <section className="mt-24 border-t border-outline-variant pt-16">
          <h2 className="font-serif italic text-3xl text-primary mb-12">
            Reviews {reviews.length > 0 && <span className="text-outline text-xl not-italic">({reviews.length})</span>}
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">

            {/* ── Existing reviews ── */}
            <div className="space-y-8">
              {reviews.length === 0 ? (
                <p className="text-outline text-sm uppercase tracking-widest">No reviews yet. Be the first!</p>
              ) : reviews.map(r => (
                <div key={r.id} className="border-b border-outline-variant pb-8">
                  <div className="flex items-center gap-1 mb-2">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} className="w-4 h-4" strokeWidth={1}
                        fill={s <= r.rating ? 'currentColor' : 'none'}
                        style={{ color: s <= r.rating ? '#f59e0b' : undefined }}
                      />
                    ))}
                  </div>
                  {r.comment ? (
                    <p className="text-sm text-primary leading-relaxed mb-2">{r.comment}</p>
                  ) : r.comment_pending ? (
                    <p className="text-sm italic text-outline leading-relaxed mb-2">Comment awaiting approval</p>
                  ) : null}
                  <p className="text-[10px] uppercase tracking-widest text-outline">{r.user_name}</p>
                </div>
              ))}
            </div>

            {/* ── Submit review form ── */}
            <div>
              <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-primary mb-8">Write a Review</h3>
              {!currentUser ? (
                <p className="text-sm text-outline">
                  <a href="/login" className="underline underline-offset-4 hover:text-primary">Sign in</a> to leave a review.
                </p>
              ) : (
                <form onSubmit={submitReview} className="space-y-6">
                  {/* Star picker */}
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-outline mb-3">Your Rating</p>
                    <div className="flex items-center gap-1">
                      {[1,2,3,4,5].map(s => (
                        <button key={s} type="button"
                          onMouseEnter={() => setReviewHover(s)}
                          onMouseLeave={() => setReviewHover(0)}
                          onClick={() => setReviewRating(s)}
                        >
                          <Star className="w-7 h-7 transition-colors" strokeWidth={1}
                            fill={(reviewHover || reviewRating) >= s ? 'currentColor' : 'none'}
                            style={{ color: (reviewHover || reviewRating) >= s ? '#f59e0b' : '#9ca3af' }}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Comment */}
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-outline mb-3">Your Comment</p>
                    <textarea
                      rows={4}
                      value={reviewComment}
                      onChange={e => setReviewComment(e.target.value)}
                      placeholder="Share your thoughts about this product..."
                      className="w-full bg-surface-container border border-outline-variant px-4 py-3 text-sm text-primary placeholder:text-outline outline-none focus:border-primary transition-colors resize-none"
                    />
                  </div>

                  {reviewMessage && (
                    <p className={`text-xs uppercase tracking-widest ${/added|submitted|approval/i.test(reviewMessage) ? 'text-emerald-600' : 'text-red-500'}`}>
                      {reviewMessage}
                    </p>
                  )}

                  <button type="submit" disabled={reviewSubmitting}
                    className="px-8 py-3 bg-primary text-white text-[10px] uppercase tracking-widest font-bold hover:brightness-95 transition-all disabled:opacity-50"
                  >
                    {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, Heart, Minus, Plus, Package, AlertTriangle, Star } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Button from '../components/ui/Button';
import { useCart } from '../contexts/CartContext';
import { supabase } from '../lib/supabase';
import { authFetch } from '../lib/authFetch';

/* ── Stock badge ── */
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

/* ── Star display (read-only) ── */
function StarDisplay({ rating, size = 'sm' }) {
  const cls = size === 'lg' ? 'w-5 h-5' : 'w-3.5 h-3.5';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`${cls} ${i <= rating ? 'fill-[#ffde59] text-[#ffde59]' : 'text-outline-variant'}`}
          strokeWidth={1}
        />
      ))}
    </div>
  );
}

/* ── Star picker (interactive) ── */
function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(0)}
          className="focus:outline-none"
        >
          <Star
            className={`w-6 h-6 transition-colors ${i <= (hovered || value) ? 'fill-[#ffde59] text-[#ffde59]' : 'text-outline-variant'}`}
            strokeWidth={1}
          />
        </button>
      ))}
    </div>
  );
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  /* product */
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  /* user */
  const [currentUser, setCurrentUser] = useState(null);

  /* reviews */
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(null);
  const [reviewCount, setReviewCount] = useState(0);
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState('');

  /* load user from localStorage */
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try { setCurrentUser(JSON.parse(stored)); } catch { setCurrentUser(null); }
    }
  }, []);

  /* check favorites when user + product are ready */
  useEffect(() => {
    if (!currentUser?.id || !product?.id) return;
    const controller = new AbortController();
    authFetch(`http://localhost:3000/api/favorites/check/${product.id}`, { signal: controller.signal })
      .then(r => r.json())
      .then(data => setIsFavorited(!!data.isFavorited))
      .catch(() => {});
    return () => controller.abort();
  }, [currentUser?.id, product?.id]);

  const toggleFavorite = async () => {
    if (!currentUser) { navigate('/login'); return; }
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

  /* fetch product + real-time subscription */
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
      }
      setLoading(false);
    };

    fetchProduct();

    const channel = supabase
      .channel(`public:products:detail:${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products', filter: `id=eq.${id}` }, () => {
        fetchProduct();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id]);

  /* fetch reviews */
  useEffect(() => {
    if (!id) return;
    fetchReviews();
  }, [id]);

  async function fetchReviews() {
    try {
      const res = await fetch(`http://localhost:3000/api/reviews/${id}`);
      const data = await res.json();
      setReviews(data.reviews || []);
      setAvgRating(data.avg_rating ?? null);
      setReviewCount(data.review_count ?? 0);
    } catch {
      // silently fail
    }
  }

  async function handleReviewSubmit(e) {
    e.preventDefault();
    if (reviewForm.rating === 0) return;
    setSubmitting(true);
    setSubmitMsg('');
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:3000/api/reviews/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rating: reviewForm.rating, comment: reviewForm.comment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');
      setSubmitMsg(data.message);
      setReviewForm({ rating: 0, comment: '' });
      await fetchReviews();
    } catch (err) {
      setSubmitMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  }

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

        {/* ── Product grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Image */}
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

          {/* Details */}
          <div className="flex flex-col justify-center py-4 lg:py-12">
            <p className="text-[10px] uppercase tracking-[0.25em] text-outline font-bold mb-3">{product.category}</p>
            <h1 className="font-serif italic text-4xl md:text-5xl text-primary mb-4 leading-tight">{product.name}</h1>

            {/* Avg rating */}
            {avgRating && (
              <div className="flex items-center gap-2 mb-6">
                <StarDisplay rating={Math.round(avgRating)} size="lg" />
                <span className="text-sm font-medium text-primary">{avgRating.toFixed(1)}</span>
                <span className="text-xs text-outline">({reviewCount} rating{reviewCount !== 1 ? 's' : ''})</span>
              </div>
            )}

            <div className="flex items-baseline gap-4 mb-8">
              <span className="text-2xl font-medium text-primary">${fmt(product.price)}</span>
              {product.oldPrice && (
                <span className="text-base text-outline line-through">${fmt(product.oldPrice)}</span>
              )}
            </div>

            <div className="mb-8">
              <StockBadge quantity={product.quantity} />
            </div>

            <p className="text-sm text-outline font-light leading-relaxed mb-10 max-w-lg">
              {product.description}
            </p>

            {/* Quantity + Add to Cart */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-10">
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

              <button
                onClick={toggleFavorite}
                className={`w-12 h-12 flex items-center justify-center border border-outline-variant transition-colors ${
                  isFavorited ? 'text-primary border-primary' : 'text-outline hover:text-primary hover:border-primary'
                }`}
              >
                <Heart className={`w-5 h-5 ${isFavorited ? 'fill-primary' : ''}`} strokeWidth={1} />
              </button>
            </div>

            {/* Product Details */}
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
        <section className="border-t border-outline-variant mt-20 pt-12">
          <div className="flex items-start justify-between mb-10">
            <h2 className="font-serif italic text-2xl text-primary">Customer Reviews</h2>
            {avgRating && (
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-2">
                  <StarDisplay rating={Math.round(avgRating)} size="lg" />
                  <span className="text-xl font-medium text-primary">{avgRating.toFixed(1)}</span>
                </div>
                <span className="text-xs text-outline">
                  {reviewCount} rating{reviewCount !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>

          {/* Approved review list */}
          {reviews.length > 0 ? (
            <div className="space-y-8 mb-14">
              {reviews.map(r => (
                <div key={r.id} className="border-b border-outline-variant pb-8">
                  <div className="flex items-center gap-3 mb-2">
                    <StarDisplay rating={r.rating} />
                    <span className="text-xs font-bold text-primary">{r.user_name}</span>
                    <span className="text-xs text-outline">
                      {new Date(r.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  {r.comment && <p className="text-sm text-outline font-light leading-relaxed">{r.comment}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-outline mb-14">
              No reviews yet. Be the first to rate this product.
            </p>
          )}

          {/* Submit form */}
          <div className="max-w-lg">
            {currentUser ? (
              submitMsg ? (
                <div className="bg-surface-container px-6 py-4">
                  <p className="text-sm text-primary font-medium">{submitMsg}</p>
                </div>
              ) : (
                <form onSubmit={handleReviewSubmit} className="space-y-5">
                  <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-primary">Write a Review</h3>

                  <div>
                    <p className="text-xs text-outline mb-2 uppercase tracking-widest">Your Rating</p>
                    <StarPicker
                      value={reviewForm.rating}
                      onChange={v => setReviewForm(f => ({ ...f, rating: v }))}
                    />
                  </div>

                  <div>
                    <p className="text-xs text-outline mb-2 uppercase tracking-widest">Comment (optional)</p>
                    <textarea
                      value={reviewForm.comment}
                      onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                      placeholder="Share your thoughts — will appear after approval"
                      rows={4}
                      className="w-full border border-outline-variant px-4 py-3 text-sm text-primary bg-surface placeholder:text-outline focus:outline-none focus:border-primary resize-none transition-colors"
                    />
                  </div>

                  <Button type="submit" disabled={reviewForm.rating === 0 || submitting}>
                    {submitting ? 'Submitting…' : 'Submit Review'}
                  </Button>
                </form>
              )
            ) : (
              <p className="text-sm text-outline">
                <Link to="/login" className="font-bold text-primary underline underline-offset-4 hover:opacity-70">
                  Log in
                </Link>{' '}
                to write a review.
              </p>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

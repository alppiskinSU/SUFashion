import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, CheckCircle, XCircle, Star, Clock, AlertTriangle, Inbox } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { authFetch } from '../lib/authFetch';

export default function AdminPanel() {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null); // id of review being acted on
  const [toast, setToast] = useState(null); // { type: 'approve' | 'reject', message }

  /* ── Auth guard ── */
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) { navigate('/login'); return; }
    try {
      const user = JSON.parse(stored);
      if (user.role !== 'admin') { navigate('/'); return; }
    } catch { navigate('/login'); }
  }, [navigate]);

  /* ── Fetch pending reviews ── */
  const fetchPending = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await authFetch('http://localhost:3000/api/reviews/pending');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      setReviews(data.reviews ?? []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPending(); }, []);

  /* ── Actions ── */
  const handleAction = async (id, action) => {
    setActionLoading(id);
    try {
      const res = await authFetch(`http://localhost:3000/api/reviews/${id}/${action}`, {
        method: 'PATCH',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Remove from local list immediately
      setReviews(prev => prev.filter(r => r.id !== id));

      // Show toast
      setToast({
        type: action,
        message: action === 'approve' ? 'Review approved successfully' : 'Review rejected and removed',
      });
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      setToast({ type: 'error', message: err.message });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setActionLoading(null);
    }
  };

  /* ── Render stars ── */
  const renderStars = (rating) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star
          key={s}
          className="w-3.5 h-3.5"
          strokeWidth={1}
          fill={s <= rating ? 'currentColor' : 'none'}
          style={{ color: s <= rating ? '#f59e0b' : '#d1d5db' }}
        />
      ))}
    </div>
  );

  /* ── Format date ── */
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Navbar />

      <main className="flex-grow pt-28 pb-20 px-6 md:px-12 lg:px-24">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Shield className="w-5 h-5 text-primary" strokeWidth={1.5} />
              <p className="text-[10px] uppercase tracking-[0.25em] text-outline font-bold">Admin Panel</p>
            </div>
            <h1 className="font-serif italic text-4xl md:text-5xl text-primary">
              Comment Moderation
            </h1>
          </div>

          {!loading && (
            <div className="flex items-center gap-2 px-5 py-2.5 bg-surface-container border border-outline-variant">
              <Clock className="w-3.5 h-3.5 text-outline" strokeWidth={1.5} />
              <span className="text-[11px] uppercase tracking-widest font-bold text-primary">
                {reviews.length} pending
              </span>
            </div>
          )}
        </div>

        {/* ── Error State ── */}
        {error && (
          <div className="flex items-center gap-3 px-6 py-4 bg-red-50 border border-red-200 mb-8">
            <AlertTriangle className="w-4 h-4 text-red-500" strokeWidth={1.5} />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* ── Loading State ── */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <p className="text-outline text-xs uppercase tracking-widest animate-pulse">Loading reviews...</p>
          </div>
        ) : reviews.length === 0 ? (
          /* ── Empty State ── */
          <div className="flex flex-col items-center justify-center py-24 gap-6">
            <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center">
              <Inbox className="w-8 h-8 text-outline" strokeWidth={1} />
            </div>
            <div className="text-center">
              <h3 className="font-serif italic text-2xl text-primary mb-2">All Caught Up</h3>
              <p className="text-sm text-outline">No pending reviews to moderate</p>
            </div>
          </div>
        ) : (
          /* ── Reviews List ── */
          <div className="space-y-4">
            {reviews.map(review => (
              <div
                key={review.id}
                className={`bg-surface-container border border-outline-variant p-6 md:p-8 transition-all duration-300 ${
                  actionLoading === review.id ? 'opacity-50 scale-[0.99]' : ''
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                  {/* ── Review Content ── */}
                  <div className="flex-1 min-w-0">
                    {/* Product & User info */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-3">
                      <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary">
                        {review.product_name}
                      </span>
                      <span className="text-[10px] text-outline">•</span>
                      <span className="text-[10px] uppercase tracking-widest text-outline">
                        by {review.user_name}
                      </span>
                      <span className="text-[10px] text-outline">•</span>
                      <span className="text-[10px] uppercase tracking-widest text-outline">
                        {formatDate(review.created_at)}
                      </span>
                    </div>

                    {/* Rating */}
                    <div className="mb-3">
                      {renderStars(review.rating)}
                    </div>

                    {/* Comment */}
                    <p className="text-sm text-primary leading-relaxed">
                      {review.comment}
                    </p>
                  </div>

                  {/* ── Action Buttons ── */}
                  <div className="flex items-center gap-3 lg:flex-col lg:gap-2 shrink-0">
                    <button
                      onClick={() => handleAction(review.id, 'approve')}
                      disabled={actionLoading === review.id}
                      className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-[10px] uppercase tracking-widest font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CheckCircle className="w-3.5 h-3.5" strokeWidth={2} />
                      Approve
                    </button>
                    <button
                      onClick={() => handleAction(review.id, 'reject')}
                      disabled={actionLoading === review.id}
                      className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white text-[10px] uppercase tracking-widest font-bold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <XCircle className="w-3.5 h-3.5" strokeWidth={2} />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ── Toast Notification ── */}
      {toast && (
        <div
          className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-3.5 shadow-lg text-white text-[11px] uppercase tracking-widest font-bold transition-all duration-300 ${
            toast.type === 'approve'
              ? 'bg-emerald-600'
              : toast.type === 'reject'
              ? 'bg-red-600'
              : 'bg-amber-600'
          }`}
        >
          {toast.type === 'approve' && <CheckCircle className="w-4 h-4" strokeWidth={2} />}
          {toast.type === 'reject' && <XCircle className="w-4 h-4" strokeWidth={2} />}
          {toast.type === 'error' && <AlertTriangle className="w-4 h-4" strokeWidth={2} />}
          {toast.message}
        </div>
      )}

      <Footer />
    </div>
  );
}

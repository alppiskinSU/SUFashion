import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, CheckCircle, XCircle, Star, Clock,
  AlertTriangle, Inbox, Package, Truck, ChevronRight,
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { authFetch } from '../lib/authFetch';

const STATUS_LABEL = {
  processing: 'Processing',
  shipped:    'In Transit',
  delivered:  'Delivered',
  cancelled:  'Cancelled',
};

const STATUS_COLOR = {
  processing: 'bg-amber-100 text-amber-800',
  shipped:    'bg-blue-100 text-blue-800',
  delivered:  'bg-emerald-100 text-emerald-800',
  cancelled:  'bg-surface-container text-outline',
};

const NEXT_STATUS = {
  processing: { value: 'shipped',   label: '→ In Transit' },
  shipped:    { value: 'delivered', label: '→ Delivered' },
};

const fmt = (n) => Number(n).toLocaleString(undefined, { minimumFractionDigits: 2 });

export default function AdminPanel() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('comments');

  /* ── Reviews state ── */
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  /* ── Orders state ── */
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState('');
  const [statusLoading, setStatusLoading] = useState(null);

  /* ── Toast ── */
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

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
  const fetchReviews = async () => {
    setReviewsLoading(true);
    setReviewsError('');
    try {
      const res = await authFetch('http://localhost:3000/api/reviews/pending');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      setReviews(data.reviews ?? []);
    } catch (err) {
      setReviewsError(err.message);
    } finally {
      setReviewsLoading(false);
    }
  };

  /* ── Fetch all orders ── */
  const fetchOrders = async () => {
    setOrdersLoading(true);
    setOrdersError('');
    try {
      const res = await authFetch('http://localhost:3000/api/orders/admin/all');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      setOrders(data.orders ?? []);
    } catch (err) {
      setOrdersError(err.message);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => { fetchReviews(); fetchOrders(); }, []);

  /* ── Review actions ── */
  const handleReviewAction = async (id, action) => {
    setActionLoading(id);
    try {
      const res = await authFetch(`http://localhost:3000/api/reviews/${id}/${action}`, { method: 'PATCH' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setReviews(prev => prev.filter(r => r.id !== id));
      showToast(action, action === 'approve' ? 'Review approved' : 'Review rejected');
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setActionLoading(null);
    }
  };

  /* ── Order status update ── */
  const handleStatusUpdate = async (orderId, newStatus) => {
    setStatusLoading(orderId);
    try {
      const res = await authFetch(`http://localhost:3000/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOrders(prev => prev.map(o =>
        o.id === orderId ? { ...o, status: data.order?.status ?? newStatus } : o
      ));
      showToast('approve', `Order updated to ${STATUS_LABEL[data.order?.status ?? newStatus]}`);
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setStatusLoading(null);
    }
  };

  const renderStars = (rating) => (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(s => (
        <Star key={s} className="w-3.5 h-3.5" strokeWidth={1}
          fill={s <= rating ? 'currentColor' : 'none'}
          style={{ color: s <= rating ? '#f59e0b' : '#d1d5db' }}
        />
      ))}
    </div>
  );

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Navbar />

      <main className="flex-grow pt-28 pb-20 px-6 md:px-12 lg:px-24">

        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <Shield className="w-5 h-5 text-primary" strokeWidth={1.5} />
          <p className="text-[10px] uppercase tracking-[0.25em] text-outline font-bold">Admin Panel</p>
        </div>
        <h1 className="font-serif italic text-4xl md:text-5xl text-primary mb-10">Management</h1>

        {/* Tabs */}
        <div className="flex gap-0 border-b border-outline-variant mb-10">
          {[
            { key: 'comments', label: `Comments (${reviews.length} pending)` },
            { key: 'orders',   label: `Orders (${orders.length})` },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-6 py-3 text-[11px] uppercase tracking-widest font-bold border-b-2 transition-colors ${
                tab === t.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-outline hover:text-primary'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── COMMENTS TAB ── */}
        {tab === 'comments' && (
          <>
            {reviewsError && (
              <div className="flex items-center gap-3 px-6 py-4 bg-red-50 border border-red-200 mb-8">
                <AlertTriangle className="w-4 h-4 text-red-500" strokeWidth={1.5} />
                <p className="text-sm text-red-600">{reviewsError}</p>
              </div>
            )}
            {reviewsLoading ? (
              <p className="text-outline text-xs uppercase tracking-widest animate-pulse py-24 text-center">Loading reviews...</p>
            ) : reviews.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <Inbox className="w-12 h-12 text-outline" strokeWidth={1} />
                <p className="text-sm text-outline uppercase tracking-widest">No pending reviews</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map(review => (
                  <div key={review.id}
                    className={`bg-surface-container border border-outline-variant p-6 md:p-8 transition-all duration-300 ${actionLoading === review.id ? 'opacity-50' : ''}`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-3">
                          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary">{review.product_name}</span>
                          <span className="text-[10px] text-outline">•</span>
                          <span className="text-[10px] uppercase tracking-widest text-outline">by {review.user_name}</span>
                          <span className="text-[10px] text-outline">•</span>
                          <span className="text-[10px] uppercase tracking-widest text-outline">{formatDate(review.created_at)}</span>
                        </div>
                        <div className="mb-3">{renderStars(review.rating)}</div>
                        <p className="text-sm text-primary leading-relaxed">{review.comment}</p>
                      </div>
                      <div className="flex items-center gap-3 lg:flex-col lg:gap-2 shrink-0">
                        <button onClick={() => handleReviewAction(review.id, 'approve')}
                          disabled={actionLoading === review.id}
                          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-[10px] uppercase tracking-widest font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50"
                        >
                          <CheckCircle className="w-3.5 h-3.5" strokeWidth={2} /> Approve
                        </button>
                        <button onClick={() => handleReviewAction(review.id, 'reject')}
                          disabled={actionLoading === review.id}
                          className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white text-[10px] uppercase tracking-widest font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                          <XCircle className="w-3.5 h-3.5" strokeWidth={2} /> Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── ORDERS TAB ── */}
        {tab === 'orders' && (
          <>
            {ordersError && (
              <div className="flex items-center gap-3 px-6 py-4 bg-red-50 border border-red-200 mb-8">
                <AlertTriangle className="w-4 h-4 text-red-500" strokeWidth={1.5} />
                <p className="text-sm text-red-600">{ordersError}</p>
              </div>
            )}
            {ordersLoading ? (
              <p className="text-outline text-xs uppercase tracking-widest animate-pulse py-24 text-center">Loading orders...</p>
            ) : orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <Package className="w-12 h-12 text-outline" strokeWidth={1} />
                <p className="text-sm text-outline uppercase tracking-widest">No orders yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map(order => {
                  const next = NEXT_STATUS[order.status];
                  return (
                    <div key={order.id} className="bg-surface-container border border-outline-variant p-6 md:p-8">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">

                        {/* Product image */}
                        <div className="w-12 h-14 bg-surface flex-none overflow-hidden">
                          {order.products?.image_url
                            ? <img src={order.products.image_url} alt={order.products.name} className="w-full h-full object-cover" />
                            : <Package className="w-5 h-5 text-outline m-auto mt-3" strokeWidth={1} />
                          }
                        </div>

                        {/* Details */}
                        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-outline mb-0.5">Order ID</p>
                            <p className="text-xs font-bold text-primary truncate">{order.id}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-outline mb-0.5">Product</p>
                            <p className="text-xs text-primary truncate">{order.products?.name ?? '—'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-outline mb-0.5">Total</p>
                            <p className="text-xs text-primary">${fmt(order.total_price)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-outline mb-0.5">Date</p>
                            <p className="text-xs text-primary">{formatDate(order.created_at)}</p>
                          </div>
                        </div>

                        {/* Status + action */}
                        <div className="flex items-center gap-3 shrink-0">
                          <span className={`px-3 py-1 text-[10px] uppercase tracking-widest font-bold ${STATUS_COLOR[order.status] ?? STATUS_COLOR.processing}`}>
                            {STATUS_LABEL[order.status] ?? order.status}
                          </span>
                          {next && (
                            <button
                              onClick={() => handleStatusUpdate(order.id, next.value)}
                              disabled={statusLoading === order.id}
                              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-[10px] uppercase tracking-widest font-bold hover:brightness-95 transition-all disabled:opacity-50"
                            >
                              {statusLoading === order.id
                                ? <Clock className="w-3.5 h-3.5 animate-spin" strokeWidth={2} />
                                : <><Truck className="w-3.5 h-3.5" strokeWidth={2} /><ChevronRight className="w-3 h-3" strokeWidth={2} /></>
                              }
                              {next.label}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-3.5 shadow-lg text-white text-[11px] uppercase tracking-widest font-bold ${
          toast.type === 'approve' ? 'bg-emerald-600' : toast.type === 'reject' ? 'bg-red-600' : 'bg-amber-600'
        }`}>
          {toast.type === 'approve' && <CheckCircle className="w-4 h-4" strokeWidth={2} />}
          {toast.type === 'reject'  && <XCircle className="w-4 h-4" strokeWidth={2} />}
          {toast.type === 'error'   && <AlertTriangle className="w-4 h-4" strokeWidth={2} />}
          {toast.message}
        </div>
      )}

      <Footer />
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, CheckCircle, XCircle, Star, Clock,
  AlertTriangle, Inbox, Package, Truck, ChevronRight, RefreshCw, MapPin,
  FileText, BarChart3, DollarSign, TrendingUp, RotateCcw,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { authFetch } from '../lib/authFetch';
import StockManager from '../components/admin/StockManager';

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
  const [tab, setTab] = useState('dashboard');

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

  /* ── Deliveries state (Req 12) ── */
  const [deliveries, setDeliveries] = useState([]);
  const [delLoading, setDelLoading] = useState(true);
  const [delError, setDelError] = useState('');
  const [delActionLoading, setDelActionLoading] = useState(null);

  /* ── Invoices by date range state (SCRUM-110) ── */
  const [invoices,       setInvoices]       = useState([]);
  const [invoiceSummary, setInvoiceSummary] = useState(null);
  const [invLoading,     setInvLoading]     = useState(false);
  const [invError,       setInvError]       = useState('');
  const [invFrom,        setInvFrom]        = useState('');
  const [invTo,          setInvTo]          = useState('');

  /* ── Refunds state (SCRUM-113) ── */
  const [refunds,        setRefunds]        = useState([]);
  const [refLoading,     setRefLoading]     = useState(true);
  const [refError,       setRefError]       = useState('');
  const [refActionLoading, setRefActionLoading] = useState(null);

  /* ── Dashboard / Revenue chart state (SCRUM-114) ── */
  const [dashFrom,       setDashFrom]       = useState('');
  const [dashTo,         setDashTo]         = useState('');
  const [dashSummary,    setDashSummary]    = useState(null);
  const [dashChart,      setDashChart]      = useState([]);
  const [dashLoading,    setDashLoading]    = useState(false);
  const [dashError,      setDashError]      = useState('');

  /* ── Toast ── */
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  /* ── Auth guard ── */
  useEffect(() => {
    const stored = sessionStorage.getItem('user');
    if (!stored) { navigate('/login'); return; }
    try {
      const user = JSON.parse(stored);
      if (user.role !== 'admin' && user.role !== 'sales_manager') { navigate('/'); return; }
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

  /* ── Fetch delivery list ── */
  const fetchDeliveries = async () => {
    setDelLoading(true);
    setDelError('');
    try {
      const res = await authFetch('http://localhost:3000/api/orders/admin/deliveries');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      setDeliveries(data.deliveries ?? []);
    } catch (err) {
      setDelError(err.message);
    } finally {
      setDelLoading(false);
    }
  };

  /* ── Fetch invoices by date range (SCRUM-110) ── */
  const fetchInvoices = async () => {
    if (!invFrom || !invTo) {
      setInvError('Please select both a start and end date.');
      return;
    }
    setInvLoading(true);
    setInvError('');
    setInvoices([]);
    setInvoiceSummary(null);
    try {
      const params = new URLSearchParams({ from: invFrom, to: invTo });
      const resInv = await authFetch(`http://localhost:3000/api/invoices/admin/by-date?${params}`);
      const dataInv = await resInv.json();
      if (!resInv.ok) throw new Error(dataInv.error || 'Failed to load invoices');
      setInvoices(dataInv.invoices ?? []);

      const resSummary = await authFetch(`http://localhost:3000/api/invoices/admin/revenue-summary?${params}`);
      const dataSummary = await resSummary.json();
      if (resSummary.ok) setInvoiceSummary(dataSummary.summary);
    } catch (err) {
      setInvError(err.message);
    } finally {
      setInvLoading(false);
    }
  };

  /* ── Fetch all refund requests (SCRUM-113) ── */
  const fetchRefunds = async () => {
    setRefLoading(true);
    setRefError('');
    try {
      const res = await authFetch('http://localhost:3000/api/refunds/admin/all');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load refunds');
      setRefunds(data.refunds ?? []);
    } catch (err) {
      setRefError(err.message);
    } finally {
      setRefLoading(false);
    }
  };

  /* ── Refund approve / reject action (SCRUM-113) ── */
  const handleRefundAction = async (refundId, newStatus) => {
    setRefActionLoading(refundId);
    try {
      const res = await authFetch(`http://localhost:3000/api/refunds/${refundId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed');
      setRefunds(prev => prev.map(r => r.id === refundId ? { ...r, status: newStatus } : r));
      showToast(newStatus === 'approved' ? 'approve' : 'reject',
        `Refund #${refundId} ${newStatus}`);
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setRefActionLoading(null);
    }
  };

  /* ── Fetch dashboard data (SCRUM-114) ── */
  const fetchDashboard = async () => {
    if (!dashFrom || !dashTo) {
      setDashError('Please select both a start and end date.');
      return;
    }
    setDashLoading(true);
    setDashError('');
    setDashSummary(null);
    setDashChart([]);
    try {
      const params = new URLSearchParams({ from: dashFrom, to: dashTo });

      const [resSummary, resChart] = await Promise.all([
        authFetch(`http://localhost:3000/api/invoices/admin/revenue-summary?${params}`),
        authFetch(`http://localhost:3000/api/invoices/admin/revenue-chart?${params}`),
      ]);

      const dataSummary = await resSummary.json();
      const dataChart   = await resChart.json();

      if (!resSummary.ok) throw new Error(dataSummary.error || 'Failed to load summary');
      if (!resChart.ok)   throw new Error(dataChart.error || 'Failed to load chart data');

      setDashSummary(dataSummary.summary);
      setDashChart(dataChart.chartData ?? []);
    } catch (err) {
      setDashError(err.message);
    } finally {
      setDashLoading(false);
    }
  };

  useEffect(() => { fetchReviews(); fetchOrders(); fetchDeliveries(); fetchRefunds(); }, []);

  // Refetch when the browser tab regains focus (no polling timer).
  useEffect(() => {
    const onFocus = () => {
      if (tab === 'comments')   fetchReviews();
      if (tab === 'orders')     fetchOrders();
      if (tab === 'deliveries') fetchDeliveries();
      if (tab === 'refunds')    fetchRefunds();
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [tab]);

  // Refetch whenever the user switches to a tab so it always reflects the
  // latest server state.
  useEffect(() => {
    if (tab === 'comments')   fetchReviews();
    if (tab === 'orders')     fetchOrders();
    if (tab === 'deliveries') fetchDeliveries();
    if (tab === 'refunds')    fetchRefunds();
  }, [tab]);

  /* ── Mark delivery completed (transitions through shipped if needed) ── */
  const markDeliveryCompleted = async (delivery) => {
    setDelActionLoading(delivery.delivery_id);
    try {
      // Status state machine only allows processing→shipped→delivered, so step
      // through 'shipped' first if necessary.
      if (delivery.status === 'processing') {
        const r1 = await authFetch(`http://localhost:3000/api/orders/${delivery.delivery_id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'shipped' }),
        });
        if (!r1.ok) {
          const d = await r1.json();
          throw new Error(d.error || 'Failed to ship');
        }
      }
      const r2 = await authFetch(`http://localhost:3000/api/orders/${delivery.delivery_id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'delivered' }),
      });
      if (!r2.ok) {
        const d = await r2.json();
        throw new Error(d.error || 'Failed to mark delivered');
      }
      await fetchDeliveries();
      showToast('approve', `Delivery #${delivery.delivery_id} completed`);
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setDelActionLoading(null);
    }
  };

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
            { key: 'dashboard', label: 'Dashboard' },
            { key: 'comments',  label: `Comments (${reviews.length} pending)` },
            { key: 'orders',   label: `Orders (${orders.length})` },
            { key: 'deliveries', label: `Deliveries (${deliveries.filter(d => !d.completed).length} open)` },
            { key: 'refunds',  label: `Refunds (${refunds.filter(r => r.status === 'pending').length} pending)` },
            { key: 'stock',    label: 'Stock' },
            { key: 'invoices', label: 'Invoices' },
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

        {/* ── DASHBOARD TAB (SCRUM-114) ── */}
        {tab === 'dashboard' && (
          <>
            {/* Date range picker */}
            <div className="flex flex-wrap items-end gap-4 mb-8 p-6 bg-surface-container border border-outline-variant">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-widest text-outline font-bold" htmlFor="dash-from">From</label>
                <input
                  id="dash-from"
                  type="date"
                  value={dashFrom}
                  onChange={e => setDashFrom(e.target.value)}
                  className="px-3 py-2 border border-outline-variant bg-surface text-primary text-xs focus:outline-none focus:border-primary"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-widest text-outline font-bold" htmlFor="dash-to">To</label>
                <input
                  id="dash-to"
                  type="date"
                  value={dashTo}
                  onChange={e => setDashTo(e.target.value)}
                  className="px-3 py-2 border border-outline-variant bg-surface text-primary text-xs focus:outline-none focus:border-primary"
                />
              </div>
              <button
                onClick={fetchDashboard}
                disabled={dashLoading}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-[10px] uppercase tracking-widest font-bold hover:brightness-95 transition-all disabled:opacity-50"
              >
                <BarChart3 className="w-3.5 h-3.5" strokeWidth={1.5} />
                {dashLoading ? 'Loading…' : 'Generate Report'}
              </button>
            </div>

            {/* Error */}
            {dashError && (
              <div className="flex items-center gap-3 px-6 py-4 bg-red-50 border border-red-200 mb-6">
                <AlertTriangle className="w-4 h-4 text-red-500" strokeWidth={1.5} />
                <p className="text-sm text-red-600">{dashError}</p>
              </div>
            )}

            {/* KPI Cards */}
            {dashSummary && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                {[
                  { label: 'Total Orders',   value: dashSummary.total_orders,     icon: Package,     color: 'text-primary' },
                  { label: 'Completed',       value: dashSummary.completed_orders, icon: CheckCircle, color: 'text-emerald-600' },
                  { label: 'Cancelled',       value: dashSummary.cancelled_orders, icon: XCircle,     color: 'text-red-500' },
                  { label: 'Gross Revenue',   value: `$${fmt(dashSummary.gross_revenue)}`,     icon: DollarSign,  color: 'text-emerald-600' },
                  { label: 'Lost Revenue',    value: `$${fmt(dashSummary.cancelled_revenue)}`, icon: TrendingUp,  color: 'text-red-500' },
                ].map(card => {
                  const Icon = card.icon;
                  return (
                    <div key={card.label} className="bg-surface-container border border-outline-variant p-5 flex flex-col gap-2 transition-all duration-300 hover:shadow-ghost">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${card.color}`} strokeWidth={1.5} />
                        <p className="text-[10px] uppercase tracking-widest text-outline">{card.label}</p>
                      </div>
                      <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Revenue Chart */}
            {dashChart.length > 0 && (
              <div className="bg-surface-container border border-outline-variant p-6 mb-8">
                <div className="flex items-center gap-2 mb-6">
                  <TrendingUp className="w-4 h-4 text-primary" strokeWidth={1.5} />
                  <h3 className="text-[11px] uppercase tracking-widest font-bold text-primary">Daily Revenue & Refunds</h3>
                </div>
                <ResponsiveContainer width="100%" height={340}>
                  <AreaChart data={dashChart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2B2B2B" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#2B2B2B" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradRefund" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#c4c7c7" strokeOpacity={0.5} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: '#747878', textTransform: 'uppercase' }}
                      tickFormatter={(d) => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis tick={{ fontSize: 10, fill: '#747878' }} tickFormatter={(v) => `$${v}`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#EDEAE9',
                        border: '1px solid #c4c7c7',
                        fontSize: 11,
                        fontFamily: 'Outfit, sans-serif',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                      formatter={(value) => [`$${Number(value).toFixed(2)}`, undefined]}
                      labelFormatter={(d) => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    />
                    <Legend
                      iconType="square"
                      wrapperStyle={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="daily_revenue"
                      name="Revenue"
                      stroke="#2B2B2B"
                      strokeWidth={2}
                      fill="url(#gradRevenue)"
                      dot={{ r: 3, fill: '#2B2B2B' }}
                      activeDot={{ r: 5 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="daily_refunds"
                      name="Refunds"
                      stroke="#ef4444"
                      strokeWidth={2}
                      fill="url(#gradRefund)"
                      dot={{ r: 3, fill: '#ef4444' }}
                      activeDot={{ r: 5 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Empty state */}
            {!dashLoading && !dashSummary && (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <BarChart3 className="w-12 h-12 text-outline" strokeWidth={1} />
                <p className="text-sm text-outline uppercase tracking-widest">Select a date range and generate a report</p>
              </div>
            )}
          </>
        )}

        {/* ── COMMENTS TAB ── */}
        {tab === 'comments' && (
          <>
            <div className="flex justify-end mb-4">
              <button
                onClick={fetchReviews}
                disabled={reviewsLoading}
                className="inline-flex items-center gap-2 px-4 py-2 border border-outline-variant text-[10px] uppercase tracking-widest font-bold text-primary hover:bg-surface-container-high transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${reviewsLoading ? 'animate-spin' : ''}`} strokeWidth={1.5} />
                Refresh
              </button>
            </div>
            {reviewsError && (
              <div className="flex items-center gap-3 px-6 py-4 bg-red-50 border border-red-200 mb-8">
                <AlertTriangle className="w-4 h-4 text-red-500" strokeWidth={1.5} />
                <p className="text-sm text-red-600">Could not load pending reviews: {reviewsError}</p>
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

        {/* ── DELIVERIES TAB (Req 12) ── */}
        {tab === 'deliveries' && (
          <>
            <div className="flex justify-end mb-4">
              <button
                onClick={fetchDeliveries}
                disabled={delLoading}
                className="inline-flex items-center gap-2 px-4 py-2 border border-outline-variant text-[10px] uppercase tracking-widest font-bold text-primary hover:bg-surface-container-high transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${delLoading ? 'animate-spin' : ''}`} strokeWidth={1.5} />
                Refresh
              </button>
            </div>
            {delError && (
              <div className="flex items-center gap-3 px-6 py-4 bg-red-50 border border-red-200 mb-8">
                <AlertTriangle className="w-4 h-4 text-red-500" strokeWidth={1.5} />
                <p className="text-sm text-red-600">{delError}</p>
              </div>
            )}
            {delLoading ? (
              <p className="text-outline text-xs uppercase tracking-widest animate-pulse py-24 text-center">Loading deliveries...</p>
            ) : deliveries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <Truck className="w-12 h-12 text-outline" strokeWidth={1} />
                <p className="text-sm text-outline uppercase tracking-widest">No deliveries</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-outline-variant">
                <table className="w-full text-xs">
                  <thead className="bg-surface-container-high">
                    <tr className="text-left text-[10px] uppercase tracking-widest text-outline">
                      <th className="px-4 py-3 font-bold">Delivery ID</th>
                      <th className="px-4 py-3 font-bold">Customer</th>
                      <th className="px-4 py-3 font-bold">Product</th>
                      <th className="px-4 py-3 font-bold">Qty</th>
                      <th className="px-4 py-3 font-bold">Total</th>
                      <th className="px-4 py-3 font-bold">Address</th>
                      <th className="px-4 py-3 font-bold">Completed</th>
                      <th className="px-4 py-3 font-bold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliveries.map(d => (
                      <tr key={d.delivery_id} className="border-t border-outline-variant hover:bg-surface-container-low">
                        <td className="px-4 py-3 font-bold text-primary">#{d.delivery_id}</td>
                        <td className="px-4 py-3 text-primary">
                          <div>{d.customer_name}</div>
                          <div className="text-[10px] text-outline truncate max-w-[140px]">{d.customer_id}</div>
                        </td>
                        <td className="px-4 py-3 text-primary">
                          <div>{d.product_name}</div>
                          <div className="text-[10px] text-outline">PID {d.product_id}</div>
                        </td>
                        <td className="px-4 py-3 text-primary">{d.quantity}</td>
                        <td className="px-4 py-3 text-primary">${fmt(d.total_price)}</td>
                        <td className="px-4 py-3 text-primary max-w-[220px]">
                          <div className="flex items-start gap-1.5">
                            <MapPin className="w-3 h-3 mt-0.5 flex-none text-outline" strokeWidth={1.5} />
                            <span className="truncate" title={d.delivery_address}>{d.delivery_address}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {d.completed
                            ? <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] uppercase tracking-widest font-bold">
                                <CheckCircle className="w-3 h-3" strokeWidth={2} /> Yes
                              </span>
                            : <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] uppercase tracking-widest font-bold">
                                <Clock className="w-3 h-3" strokeWidth={2} /> No
                              </span>
                          }
                        </td>
                        <td className="px-4 py-3 text-right">
                          {!d.completed && (
                            <button
                              onClick={() => markDeliveryCompleted(d)}
                              disabled={delActionLoading === d.delivery_id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-[10px] uppercase tracking-widest font-bold hover:brightness-95 disabled:opacity-50"
                            >
                              {delActionLoading === d.delivery_id
                                ? <Clock className="w-3 h-3 animate-spin" strokeWidth={2} />
                                : <Truck className="w-3 h-3" strokeWidth={2} />
                              }
                              Mark Completed
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ── REFUNDS TAB (SCRUM-113) ── */}
        {tab === 'refunds' && (
          <>
            <div className="flex justify-end mb-4">
              <button
                onClick={fetchRefunds}
                disabled={refLoading}
                className="inline-flex items-center gap-2 px-4 py-2 border border-outline-variant text-[10px] uppercase tracking-widest font-bold text-primary hover:bg-surface-container-high transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refLoading ? 'animate-spin' : ''}`} strokeWidth={1.5} />
                Refresh
              </button>
            </div>
            {refError && (
              <div className="flex items-center gap-3 px-6 py-4 bg-red-50 border border-red-200 mb-8">
                <AlertTriangle className="w-4 h-4 text-red-500" strokeWidth={1.5} />
                <p className="text-sm text-red-600">{refError}</p>
              </div>
            )}
            {refLoading ? (
              <p className="text-outline text-xs uppercase tracking-widest animate-pulse py-24 text-center">Loading refund requests...</p>
            ) : refunds.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <RotateCcw className="w-12 h-12 text-outline" strokeWidth={1} />
                <p className="text-sm text-outline uppercase tracking-widest">No refund requests</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-outline-variant">
                <table className="w-full text-xs">
                  <thead className="bg-surface-container-high">
                    <tr className="text-left text-[10px] uppercase tracking-widest text-outline">
                      <th className="px-4 py-3 font-bold">Refund ID</th>
                      <th className="px-4 py-3 font-bold">Order ID</th>
                      <th className="px-4 py-3 font-bold">Product</th>
                      <th className="px-4 py-3 font-bold">Amount</th>
                      <th className="px-4 py-3 font-bold">Reason</th>
                      <th className="px-4 py-3 font-bold">Date</th>
                      <th className="px-4 py-3 font-bold">Status</th>
                      <th className="px-4 py-3 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {refunds.map(refund => (
                      <tr key={refund.id} className={`border-t border-outline-variant hover:bg-surface-container-low transition-colors ${refActionLoading === refund.id ? 'opacity-50' : ''}`}>
                        <td className="px-4 py-3 font-bold text-primary">#{refund.id}</td>
                        <td className="px-4 py-3 text-primary">#{refund.order_id}</td>
                        <td className="px-4 py-3 text-primary">{refund.orders?.products?.name || '—'}</td>
                        <td className="px-4 py-3 text-primary font-bold">${fmt(refund.amount)}</td>
                        <td className="px-4 py-3 text-primary max-w-[200px]">
                          <span className="truncate block" title={refund.reason}>{refund.reason || '—'}</span>
                        </td>
                        <td className="px-4 py-3 text-primary whitespace-nowrap">{formatDate(refund.created_at)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-0.5 text-[10px] uppercase tracking-widest font-bold ${
                            refund.status === 'approved' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : refund.status === 'rejected' ? 'bg-red-100 text-red-800 border border-red-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}>
                            {refund.status === 'approved' ? 'Approved' : refund.status === 'rejected' ? 'Rejected' : 'Pending'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {refund.status === 'pending' && (
                            <div className="flex items-center gap-2 justify-end">
                              <button
                                onClick={() => handleRefundAction(refund.id, 'approved')}
                                disabled={refActionLoading === refund.id}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-[10px] uppercase tracking-widest font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50"
                              >
                                <CheckCircle className="w-3 h-3" strokeWidth={2} />
                                Approve
                              </button>
                              <button
                                onClick={() => handleRefundAction(refund.id, 'rejected')}
                                disabled={refActionLoading === refund.id}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-[10px] uppercase tracking-widest font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
                              >
                                <XCircle className="w-3 h-3" strokeWidth={2} />
                                Reject
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ── STOCK TAB ── */}
        {tab === 'stock' && (
          <StockManager onToast={showToast} />
        )}

        {/* ── INVOICES TAB (SCRUM-110) ── */}
        {tab === 'invoices' && (
          <>
            {/* Date range picker */}
            <div className="flex flex-wrap items-end gap-4 mb-8 p-6 bg-surface-container border border-outline-variant">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-widest text-outline font-bold" htmlFor="inv-from">From</label>
                <input
                  id="inv-from"
                  type="date"
                  value={invFrom}
                  onChange={e => setInvFrom(e.target.value)}
                  className="px-3 py-2 border border-outline-variant bg-surface text-primary text-xs focus:outline-none focus:border-primary"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-widest text-outline font-bold" htmlFor="inv-to">To</label>
                <input
                  id="inv-to"
                  type="date"
                  value={invTo}
                  onChange={e => setInvTo(e.target.value)}
                  className="px-3 py-2 border border-outline-variant bg-surface text-primary text-xs focus:outline-none focus:border-primary"
                />
              </div>
              <button
                onClick={fetchInvoices}
                disabled={invLoading}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-[10px] uppercase tracking-widest font-bold hover:brightness-95 transition-all disabled:opacity-50"
              >
                <FileText className="w-3.5 h-3.5" strokeWidth={1.5} />
                {invLoading ? 'Loading…' : 'Search'}
              </button>
            </div>

            {/* Error banner */}
            {invError && (
              <div className="flex items-center gap-3 px-6 py-4 bg-red-50 border border-red-200 mb-6">
                <AlertTriangle className="w-4 h-4 text-red-500" strokeWidth={1.5} />
                <p className="text-sm text-red-600">{invError}</p>
              </div>
            )}

            {/* Revenue summary cards */}
            {invoiceSummary && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                  { label: 'Total Orders',   value: invoiceSummary.total_orders },
                  { label: 'Completed',       value: invoiceSummary.completed_orders },
                  { label: 'Cancelled',       value: invoiceSummary.cancelled_orders },
                  { label: 'Gross Revenue',   value: `$${fmt(invoiceSummary.gross_revenue)}` },
                ].map(card => (
                  <div key={card.label} className="bg-surface-container border border-outline-variant p-5">
                    <p className="text-[10px] uppercase tracking-widest text-outline mb-1">{card.label}</p>
                    <p className="text-xl font-bold text-primary">{card.value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Empty state */}
            {!invLoading && invoices.length === 0 && invoiceSummary === null && (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <FileText className="w-12 h-12 text-outline" strokeWidth={1} />
                <p className="text-sm text-outline uppercase tracking-widest">Select a date range and press Search</p>
              </div>
            )}

            {/* Invoices table */}
            {invoices.length > 0 && (
              <div className="overflow-x-auto border border-outline-variant">
                <table className="w-full text-xs">
                  <thead className="bg-surface-container-high">
                    <tr className="text-left text-[10px] uppercase tracking-widest text-outline">
                      <th className="px-4 py-3 font-bold">Invoice ID</th>
                      <th className="px-4 py-3 font-bold">Date</th>
                      <th className="px-4 py-3 font-bold">Customer</th>
                      <th className="px-4 py-3 font-bold">Product</th>
                      <th className="px-4 py-3 font-bold">Qty</th>
                      <th className="px-4 py-3 font-bold">Unit Price</th>
                      <th className="px-4 py-3 font-bold">Total</th>
                      <th className="px-4 py-3 font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map(inv => (
                      <tr key={inv.invoice_id} className="border-t border-outline-variant hover:bg-surface-container-low">
                        <td className="px-4 py-3 font-bold text-primary truncate max-w-[120px]">#{inv.invoice_id}</td>
                        <td className="px-4 py-3 text-primary whitespace-nowrap">{formatDate(inv.created_at)}</td>
                        <td className="px-4 py-3 text-primary">{inv.customer_name}</td>
                        <td className="px-4 py-3 text-primary">{inv.product_name}</td>
                        <td className="px-4 py-3 text-primary">{inv.quantity}</td>
                        <td className="px-4 py-3 text-primary">{inv.unit_price != null ? `$${fmt(inv.unit_price)}` : '—'}</td>
                        <td className="px-4 py-3 text-primary font-bold">${fmt(inv.total_price)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 text-[10px] uppercase tracking-widest font-bold ${STATUS_COLOR[inv.status] ?? STATUS_COLOR.processing}`}>
                            {STATUS_LABEL[inv.status] ?? inv.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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

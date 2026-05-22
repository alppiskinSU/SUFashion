import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authFetch } from '../lib/authFetch';
import { ArrowLeft, Package, Truck, CheckCircle, Clock, ChevronDown, ChevronUp, XCircle } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

/* ── Status config ── */
const STATUS_STEPS = ['processing', 'in-transit', 'delivered'];

const statusConfig = {
  processing: { label: 'Processing',  color: 'bg-secondary-container text-on-secondary-container' },
  'in-transit': { label: 'In Transit', color: 'bg-primary text-white' },
  delivered:   { label: 'Delivered',  color: 'bg-surface-container-high text-primary' },
  cancelled:   { label: 'Cancelled',  color: 'bg-surface-container text-outline' },
};

const stepIcons = {
  processing:  Clock,
  'in-transit': Truck,
  delivered:   CheckCircle,
};

const fmt = (n) => n.toLocaleString(undefined, { minimumFractionDigits: 2 });

/** DB stores `shipped`; UI timeline uses `in-transit` (demo wording). */
function normalizeOrderStatus(raw) {
  const s = raw || 'processing';
  if (s === 'shipped') return 'in-transit';
  return s;
}

function StatusTimeline({ currentStatus }) {
  const uiStatus = normalizeOrderStatus(currentStatus);
  const currentIdx = STATUS_STEPS.includes(uiStatus)
    ? STATUS_STEPS.indexOf(uiStatus)
    : 0;
  return (
    <div className="flex items-center gap-0 mt-6">
      {STATUS_STEPS.map((step, idx) => {
        const Icon = stepIcons[step];
        const done = idx <= currentIdx;
        const isLast = idx === STATUS_STEPS.length - 1;
        return (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center gap-1.5 flex-none">
              <div className={`w-8 h-8 flex items-center justify-center transition-colors ${done ? 'bg-primary text-white' : 'bg-surface-container text-outline'}`}>
                <Icon className="w-4 h-4" strokeWidth={1.5} />
              </div>
              <span className={`text-[9px] uppercase tracking-widest ${done ? 'text-primary font-bold' : 'text-outline'}`}>
                {statusConfig[step].label}
              </span>
            </div>
            {!isLast && (
              <div className={`flex-1 h-px mx-2 mb-5 ${idx < currentIdx ? 'bg-primary' : 'bg-outline-variant'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function OrderCard({ order, onRefresh }) {
  const [expanded, setExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);
  const uiStatus = normalizeOrderStatus(order.status);
  const cfg = statusConfig[uiStatus] ?? statusConfig.processing;
  const raw = order.status || 'processing';

  const cancelOrder = async () => {
    if (!window.confirm('Cancel this order? Stock will be returned.')) return;
    setUpdating(true);
    try {
      const res = await authFetch(`http://localhost:3000/api/orders/${order.id}/cancel`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Cancel failed');
      await onRefresh?.();
    } catch (e) {
      alert(e.message || 'Could not cancel order');
    } finally {
      setUpdating(false);
    }
  };

  const patchStatus = async (nextStatus) => {
    setUpdating(true);
    try {
      const res = await authFetch(`http://localhost:3000/api/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');
      await onRefresh?.();
    } catch (e) {
      alert(e.message || 'Could not update status');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="bg-surface-container-low">

      {/* Card header */}
      <div
        onClick={() => setExpanded(e => !e)}
        className="cursor-pointer w-full p-8 md:p-10 flex flex-col sm:flex-row sm:items-center gap-6 group"
      >
        {/* Product thumbnail preview — separate Link so click navigates without toggling card */}
        <Link
          to={`/product/${order.product_id}`}
          onClick={e => e.stopPropagation()}
          className="flex-none flex items-center gap-4 hover:opacity-75 transition-opacity"
        >
          <div className="bg-surface-container overflow-hidden flex-none w-14" style={{ height: '72px' }}>
            {order.products?.image_url
              ? <img
                  src={order.products.image_url}
                  alt={order.products.name}
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                />
              : <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-5 h-5 text-outline" strokeWidth={1} />
                </div>
            }
          </div>
          <div className="hidden sm:block">
            <p className="text-[10px] uppercase tracking-widest text-outline mb-1">Product</p>
            <p className="text-sm font-bold text-primary max-w-[140px] truncate">{order.products?.name ?? '—'}</p>
            <p className="text-[10px] text-outline mt-0.5">Qty: {order.quantity}</p>
          </div>
        </Link>

        <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-outline mb-1">Order</p>
            <p className="text-sm font-bold text-primary">{order.id}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-outline mb-1">Date</p>
            <p className="text-sm text-primary">{order.created_at ? new Date(order.created_at).toLocaleDateString() : '—'}</p>
          </div>
          <div className="hidden sm:block">
            <p className="text-[10px] uppercase tracking-widest text-outline mb-1">Total</p>
            <p className="text-sm text-primary">${fmt(order.total_price)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-outline mb-1">Status</p>
            <span className={`inline-block text-[10px] uppercase tracking-widest font-bold px-3 py-1 ${cfg.color}`}>
              {cfg.label}
            </span>
          </div>
        </div>

        <div className="flex-none text-outline group-hover:text-primary transition-colors">
          {expanded
            ? <ChevronUp className="w-5 h-5" strokeWidth={1.5} />
            : <ChevronDown className="w-5 h-5" strokeWidth={1.5} />
          }
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-outline-variant px-8 md:px-10 pb-10">

          {/* Status timeline */}
          {order.status !== 'cancelled' && (
            <StatusTimeline currentStatus={order.status} />
          )}

          {/* Demo: advance delivery status (backend PATCH) */}
          {order.status !== 'cancelled' && (
            <div className="mt-8 flex flex-wrap gap-3">
              {raw === 'processing' && (
                <button
                  type="button"
                  disabled={updating}
                  onClick={e => { e.stopPropagation(); patchStatus('in-transit'); }}
                  className="px-5 py-2.5 text-[10px] uppercase tracking-widest font-bold bg-primary text-white hover:brightness-95 disabled:opacity-50"
                >
                  {updating ? 'Updating…' : 'Ship order (In transit)'}
                </button>
              )}
              {raw === 'shipped' && (
                <button
                  type="button"
                  disabled={updating}
                  onClick={e => { e.stopPropagation(); patchStatus('delivered'); }}
                  className="px-5 py-2.5 text-[10px] uppercase tracking-widest font-bold bg-secondary-container text-on-secondary-container hover:brightness-95 disabled:opacity-50"
                >
                  {updating ? 'Updating…' : 'Mark as delivered'}
                </button>
              )}
              {/* Customer cancel — Req 13 */}
              {raw === 'processing' && (
                <button
                  type="button"
                  disabled={updating}
                  onClick={e => { e.stopPropagation(); cancelOrder(); }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-[10px] uppercase tracking-widest font-bold border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  <XCircle className="w-3.5 h-3.5" strokeWidth={2} />
                  {updating ? 'Cancelling…' : 'Cancel order'}
                </button>
              )}
            </div>
          )}

          {/* Items */}
          <div className="mt-10 space-y-6">
            <p className="text-[10px] uppercase tracking-widest text-outline">Items</p>
            <Link
              to={`/product/${order.product_id}`}
              className="flex gap-5 group/item hover:opacity-80 transition-opacity"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-16 h-20 bg-surface-container flex-none overflow-hidden">
                <img
                  src={order.products?.image_url}
                  alt={order.products?.name}
                  className="w-full h-full object-cover grayscale group-hover/item:grayscale-0 transition-all duration-700"
                />
              </div>
              <div className="flex-1 flex flex-col justify-between py-0.5">
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-primary group-hover/item:underline">{order.products?.name}</h4>
                  <p className="text-[10px] uppercase tracking-widest text-outline mt-1">View product →</p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-widest text-outline">Qty: {order.quantity}</span>
                  <span className="text-sm font-medium text-primary">${fmt(order.products?.price * order.quantity)}</span>
                </div>
              </div>
            </Link>
          </div>

          {/* View invoice link */}
          <div className="mt-8 flex items-center gap-6">
            <Link
              to={`/order-confirmation/${order.id}`}
              className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-outline hover:text-primary font-bold transition-colors"
            >
              View Invoice →
            </Link>
            {uiStatus === 'delivered' && (
              <Link
                to="/refunds"
                className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-outline hover:text-primary font-bold transition-colors"
              >
                Request Return / Refund →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrderTracking() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const refreshOrders = () =>
    authFetch('http://localhost:3000/api/orders/user/me')
      .then(r => r.json())
      .then(data => setOrders(data.orders ?? []))
      .catch(() => setOrders([]));

  useEffect(() => {
    setLoading(true);
    refreshOrders().finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <p className="text-outline text-xs uppercase tracking-widest">Loading orders...</p>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Navbar />

      <main className="flex-grow pt-28 pb-20 px-6 md:px-12 lg:px-24">

        {/* Back link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-outline hover:text-primary text-xs uppercase tracking-widest font-bold mb-12 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" strokeWidth={1.5} />
          Back to Home
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-16">
          <div className="flex items-start gap-6">
            <Package className="w-10 h-10 text-primary flex-none mt-1" strokeWidth={1} />
            <div>
              <h1 className="font-serif italic text-4xl md:text-5xl text-primary leading-tight">
                My Orders
              </h1>
              <p className="text-outline text-sm uppercase tracking-widest mt-3">
                {orders.length} order{orders.length !== 1 ? 's' : ''} total
              </p>
            </div>
          </div>
        </div>

        {/* Orders list */}
        {orders.length === 0 ? (
          <div className="text-center py-32">
            <Package className="w-16 h-16 text-outline mx-auto mb-6" strokeWidth={0.75} />
            <p className="text-outline text-sm uppercase tracking-widest mb-8">No orders yet</p>
            <Link
              to="/collections"
              className="text-xs uppercase tracking-widest font-bold text-primary hover:text-outline transition-colors"
            >
              Start Shopping →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <OrderCard key={order.id} order={order} onRefresh={refreshOrders} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

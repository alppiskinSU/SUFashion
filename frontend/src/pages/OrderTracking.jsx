import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Package, Truck, CheckCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

/* ── Mock orders data (replace with real API: GET /api/orders/user/:userId) ── */
const mockOrders = [
  {
    id: 'SUF-2024-00142',
    date: 'April 3, 2026',
    status: 'processing',
    total: 3916.00,
    items: [
      { id: 1, name: 'Cashmere Wrap Coat', size: 'M', color: 'Oatmeal', price: 2450, quantity: 1,
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD9OeHNJRVwTzVFdQ5_kDymgp3PR6niaoAT_qMhe_0plRNsdnytCS3wQ5TYqN6vw14VqlVhZnPvSzmbfWBoXkUUXu3Yyk3IAaD3MWBwMklU1gxyVAM1jiNrIykmJ7gDfvSbzsCTnP6rBdGS3KRG-rEnjA5x3phC1BDUJ5naLK3owehWcdbnrJ1MvTEuPSHreVaCYge3Z8wt1_PeZ9ZG970QqI3y4XFdeiv7wHFIY6F7u6PF5WcIM3NXFcxpespGgVhslB1-HhJxRlw' },
      { id: 2, name: 'Silk Evening Blouse', size: 'S', color: 'Ivory', price: 1250, quantity: 1,
        image: 'https://images.unsplash.com/photo-1551163943-3f6a855d1153?auto=format&fit=crop&q=80&w=400' },
    ],
  },
  {
    id: 'SUF-2024-00118',
    date: 'March 15, 2026',
    status: 'in-transit',
    total: 890.00,
    items: [
      { id: 3, name: 'Linen Wide-Leg Trousers', size: 'M', color: 'Sand', price: 890, quantity: 1,
        image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&q=80&w=400' },
    ],
  },
  {
    id: 'SUF-2024-00091',
    date: 'February 28, 2026',
    status: 'delivered',
    total: 3200.00,
    items: [
      { id: 4, name: 'Merino Turtleneck', size: 'S', color: 'Noir', price: 1600, quantity: 2,
        image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&q=80&w=400' },
    ],
  },
];

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

function StatusTimeline({ currentStatus }) {
  const currentIdx = STATUS_STEPS.indexOf(currentStatus);
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

function OrderCard({ order }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = statusConfig[order.status] ?? statusConfig.processing;

  return (
    <div className="bg-surface-container-low">

      {/* Card header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full text-left p-8 md:p-10 flex flex-col sm:flex-row sm:items-center gap-4 group"
      >
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-outline mb-1">Order</p>
            <p className="text-sm font-bold text-primary">{order.id}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-outline mb-1">Date</p>
            <p className="text-sm text-primary">{order.date}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-outline mb-1">Total</p>
            <p className="text-sm text-primary">${fmt(order.total)}</p>
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
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-outline-variant px-8 md:px-10 pb-10">

          {/* Status timeline */}
          {order.status !== 'cancelled' && (
            <StatusTimeline currentStatus={order.status} />
          )}

          {/* Items */}
          <div className="mt-10 space-y-6">
            <p className="text-[10px] uppercase tracking-widest text-outline">Items</p>
            {order.items.map(item => (
              <div key={item.id} className="flex gap-5 group/item">
                <div className="w-16 h-20 bg-surface-container flex-none overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover grayscale group-hover/item:grayscale-0 transition-all duration-700"
                  />
                </div>
                <div className="flex-1 flex flex-col justify-between py-0.5">
                  <div>
                    <h4 className="text-sm font-bold uppercase tracking-wider text-primary">{item.name}</h4>
                    <p className="text-[10px] text-outline uppercase tracking-widest mt-1">
                      {item.color} / Size {item.size}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-widest text-outline">Qty: {item.quantity}</span>
                    <span className="text-sm font-medium text-primary">${fmt(item.price * item.quantity)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* View invoice link */}
          <div className="mt-8">
            <Link
              to={`/order-confirmation/${order.id}`}
              className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-outline hover:text-primary font-bold transition-colors"
            >
              View Invoice →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrderTracking() {
  // TODO: Replace with real API call when backend is ready:
  // const [orders, setOrders] = useState([]);
  // useEffect(() => {
  //   fetch(`/api/orders/user/${userId}`, { headers: { Authorization: `Bearer ${token}` } })
  //     .then(r => r.json()).then(data => setOrders(data.orders));
  // }, []);

  const orders = mockOrders;

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
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle, Printer, ArrowLeft, Package } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Button from '../components/ui/Button';

const fmt = (n) => Number(n).toLocaleString(undefined, { minimumFractionDigits: 2 });

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`http://localhost:3000/api/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error);
        else setOrder(data.order);
      })
      .catch(() => setError('Could not load order.'))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <p className="text-outline text-xs uppercase tracking-widest">Loading order...</p>
    </div>
  );

  if (error || !order) return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <p className="text-outline text-xs uppercase tracking-widest">{error || 'Order not found.'}</p>
    </div>
  );

  const subtotal = order.total_price ?? 0;
  const tax = Math.round(subtotal * 0.08 * 100) / 100;
  const total = subtotal + tax;
  const orderDate = order.created_at ? new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '';

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
          Continue Shopping
        </Link>

        {/* Confirmation header */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-6 mb-16">
          <CheckCircle className="w-10 h-10 text-primary flex-none" strokeWidth={1} />
          <div>
            <h1 className="font-serif italic text-4xl md:text-5xl text-primary leading-tight">
              Order Confirmed
            </h1>
            <p className="text-outline text-sm uppercase tracking-widest mt-3">
              Thank you — your order has been received
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">

          {/* ────────── LEFT: Invoice ────────── */}
          <div className="lg:col-span-7 space-y-12">

            {/* Order meta */}
            <section className="bg-surface-container-low p-8 md:p-10">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xs uppercase tracking-[0.2em] font-bold text-primary">Invoice</h2>
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 text-outline hover:text-primary text-[10px] uppercase tracking-widest transition-colors"
                >
                  <Printer className="w-4 h-4" strokeWidth={1.5} />
                  Print
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6 text-sm">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-outline mb-1">Order Number</p>
                  <p className="font-bold text-primary">{order.id}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-outline mb-1">Date</p>
                  <p className="text-primary">{orderDate}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-outline mb-1">Status</p>
                  <span className="inline-block bg-secondary-container text-on-secondary-container text-[10px] uppercase tracking-widest font-bold px-3 py-1">
                    {order.status ?? 'Processing'}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-outline mb-1">Quantity</p>
                  <p className="text-primary">{order.quantity}</p>
                </div>
              </div>
            </section>

            {/* Items */}
            <section>
              <h2 className="text-xs uppercase tracking-[0.2em] font-bold text-primary mb-8">Items Ordered</h2>
              <div className="space-y-6">
                <div className="flex gap-5 group">
                  <div className="w-20 h-24 bg-surface-container flex-none overflow-hidden">
                    <img
                      src={order.products?.image_url}
                      alt={order.products?.name}
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-between py-0.5 border-b border-outline-variant pb-6">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-primary">{order.products?.name}</h4>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-widest text-outline">Qty: {order.quantity}</span>
                      <span className="text-sm font-medium text-primary">${fmt(order.products?.price * order.quantity)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Totals */}
            <section className="border-t border-outline-variant pt-8 space-y-4">
              <div className="flex justify-between text-sm text-outline">
                <span>Subtotal</span>
                <span className="text-primary">${fmt(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-outline">
                <span>Shipping</span>
                <span className="text-primary italic">Complimentary</span>
              </div>
              <div className="flex justify-between text-sm text-outline">
                <span>Tax (8%)</span>
                <span className="text-primary">${fmt(tax)}</span>
              </div>
              <div className="border-t border-outline-variant pt-6 flex justify-between items-center">
                <span className="text-sm uppercase tracking-widest font-bold text-primary">Total</span>
                <span className="text-2xl font-medium text-primary">${fmt(total)}</span>
              </div>
            </section>
          </div>

          {/* ────────── RIGHT: Shipping + Actions ────────── */}
          <aside className="lg:col-span-5 space-y-8">

            {/* Shipping address */}
            <div className="bg-surface-container-low p-8 md:p-10">
              <div className="flex items-center gap-3 mb-6">
                <Package className="w-5 h-5 text-primary" strokeWidth={1} />
                <h2 className="text-xs uppercase tracking-[0.2em] font-bold text-primary">Order Total</h2>
              </div>
              <p className="text-2xl font-medium text-primary">${fmt(order.total_price)}</p>
              <p className="text-[10px] uppercase tracking-widest text-outline mt-2">Incl. tax & complimentary shipping</p>
            </div>

            {/* CTA buttons */}
            <Link to="/my-orders" className="block">
              <Button variant="primary" className="w-full">Track My Order</Button>
            </Link>

            <Link to="/collections" className="block">
              <Button variant="ghost" className="w-full">Continue Shopping</Button>
            </Link>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}

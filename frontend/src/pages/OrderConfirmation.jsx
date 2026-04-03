import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle, Printer, ArrowLeft, Package } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Button from '../components/ui/Button';

/* ── Mock order data (replace with real API: GET /api/orders/:id) ── */
const mockOrder = {
  id: 'SUF-2024-00142',
  date: 'April 3, 2026',
  status: 'Processing',
  shipping: {
    firstName: 'Amin',
    lastName: 'Azaka',
    address: '123 Atelier Street',
    city: 'Istanbul',
    zip: '34000',
    country: 'Turkey',
    email: 'amin@example.com',
  },
  items: [
    {
      id: 1,
      name: 'Cashmere Wrap Coat',
      size: 'M',
      color: 'Oatmeal',
      price: 2450,
      quantity: 1,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD9OeHNJRVwTzVFdQ5_kDymgp3PR6niaoAT_qMhe_0plRNsdnytCS3wQ5TYqN6vw14VqlVhZnPvSzmbfWBoXkUUXu3Yyk3IAaD3MWBwMklU1gxyVAM1jiNrIykmJ7gDfvSbzsCTnP6rBdGS3KRG-rEnjA5x3phC1BDUJ5naLK3owehWcdbnrJ1MvTEuPSHreVaCYge3Z8wt1_PeZ9ZG970QqI3y4XFdeiv7wHFIY6F7u6PF5WcIM3NXFcxpespGgVhslB1-HhJxRlw',
    },
    {
      id: 2,
      name: 'Silk Evening Blouse',
      size: 'S',
      color: 'Ivory',
      price: 1250,
      quantity: 1,
      image: 'https://images.unsplash.com/photo-1551163943-3f6a855d1153?auto=format&fit=crop&q=80&w=400',
    },
  ],
};

const fmt = (n) => n.toLocaleString(undefined, { minimumFractionDigits: 2 });

export default function OrderConfirmation() {
  // TODO: Replace with real API call when backend is ready:
  // const { orderId } = useParams();
  // const [order, setOrder] = useState(null);
  // useEffect(() => {
  //   fetch(`/api/orders/${orderId}`, { headers: { Authorization: `Bearer ${token}` } })
  //     .then(r => r.json()).then(data => setOrder(data.order));
  // }, [orderId]);

  const order = mockOrder;
  const subtotal = order.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const tax = Math.round(subtotal * 0.08 * 100) / 100;
  const total = subtotal + tax;

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
                  <p className="text-primary">{order.date}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-outline mb-1">Status</p>
                  <span className="inline-block bg-secondary-container text-on-secondary-container text-[10px] uppercase tracking-widest font-bold px-3 py-1">
                    {order.status}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-outline mb-1">Email</p>
                  <p className="text-primary">{order.shipping.email}</p>
                </div>
              </div>
            </section>

            {/* Items */}
            <section>
              <h2 className="text-xs uppercase tracking-[0.2em] font-bold text-primary mb-8">Items Ordered</h2>
              <div className="space-y-6">
                {order.items.map(item => (
                  <div key={item.id} className="flex gap-5 group">
                    <div className="w-20 h-24 bg-surface-container flex-none overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-0.5 border-b border-outline-variant pb-6">
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
                <h2 className="text-xs uppercase tracking-[0.2em] font-bold text-primary">Shipping To</h2>
              </div>
              <p className="text-sm text-primary leading-relaxed">
                {order.shipping.firstName} {order.shipping.lastName}<br />
                {order.shipping.address}<br />
                {order.shipping.city}, {order.shipping.zip}<br />
                {order.shipping.country}
              </p>
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

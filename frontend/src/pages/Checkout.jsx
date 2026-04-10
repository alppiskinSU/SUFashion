import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Lock, Truck, ShieldCheck } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useCart } from '../contexts/CartContext';


/* ── Helpers ── */
function formatCardNumber(value) {
  const digits = value.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(value) {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2);
  return digits;
}

export default function Checkout() {
  const { items: cartItems, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', address: '', city: '', zip: '', country: '',
    cardName: '', cardNumber: '', expiry: '', cvv: '',
  });

  const subtotal = cartTotal;
  const shipping = 0; // free shipping
  const tax = Math.round(subtotal * 0.08 * 100) / 100;
  const total = subtotal + shipping + tax;

  const fmt = (n) => n.toLocaleString(undefined, { minimumFractionDigits: 2 });

  function handleChange(e) {
    const { id, value } = e.target;
    if (id === 'cardNumber') return setForm(p => ({ ...p, cardNumber: formatCardNumber(value) }));
    if (id === 'expiry')     return setForm(p => ({ ...p, expiry: formatExpiry(value) }));
    if (id === 'cvv')        return setForm(p => ({ ...p, cvv: value.replace(/\D/g, '').slice(0, 3) }));
    setForm(p => ({ ...p, [id]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      let lastOrderId = null;
      for (const item of cartItems) {
        const res = await fetch('http://localhost:3000/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ product_id: item.product_id ?? item.id, quantity: item.quantity }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Order failed');
        if (data.order_id) lastOrderId = data.order_id;
      }
      clearCart();
      navigate(lastOrderId ? `/order-confirmation/${lastOrderId}` : '/my-orders');
    } catch (err) {
      alert(err.message);
    }
  }

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

        <h1 className="font-serif italic text-4xl md:text-5xl text-primary mb-16">Checkout</h1>

        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-6">
            <p className="text-outline text-sm uppercase tracking-widest">Your bag is empty</p>
            <Link to="/collections" className="text-primary text-xs uppercase tracking-widest font-bold underline underline-offset-4">
              Explore Collections
            </Link>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* ────────── LEFT: Form ────────── */}
          <div className="lg:col-span-7 space-y-14">

            {/* Shipping Info */}
            <section>
              <div className="flex items-center gap-3 mb-8">
                <Truck className="w-5 h-5 text-primary" strokeWidth={1} />
                <h2 className="text-xs uppercase tracking-[0.2em] font-bold text-primary">Shipping Information</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-8">
                <Input label="First Name"  id="firstName" value={form.firstName} onChange={handleChange} />
                <Input label="Last Name"   id="lastName"  value={form.lastName}  onChange={handleChange} />
                <Input label="Email"        id="email"     type="email" className="sm:col-span-2" value={form.email} onChange={handleChange} />
                <Input label="Address"      id="address"   className="sm:col-span-2" value={form.address} onChange={handleChange} />
                <Input label="City"         id="city"      value={form.city} onChange={handleChange} />
                <Input label="ZIP / Postal" id="zip"       value={form.zip}  onChange={handleChange} />
                <Input label="Country"      id="country"   className="sm:col-span-2" value={form.country} onChange={handleChange} />
              </div>
            </section>

            {/* Divider */}
            <div className="border-t border-outline-variant" />

            {/* Payment Info */}
            <section>
              <div className="flex items-center gap-3 mb-8">
                <CreditCard className="w-5 h-5 text-primary" strokeWidth={1} />
                <h2 className="text-xs uppercase tracking-[0.2em] font-bold text-primary">Payment Details</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-8">
                <Input label="Name on Card" id="cardName"   className="sm:col-span-2" value={form.cardName}   onChange={handleChange} />
                <Input label="Card Number"  id="cardNumber" className="sm:col-span-2" value={form.cardNumber} onChange={handleChange}
                  indicator={
                    <span className="absolute right-0 top-2 text-outline flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </span>
                  }
                />
                <Input label="MM / YY"  id="expiry" value={form.expiry} onChange={handleChange} />
                <Input label="CVV"      id="cvv"    value={form.cvv}    onChange={handleChange} />
              </div>

              <div className="flex items-center gap-2 mt-6 text-outline">
                <ShieldCheck className="w-4 h-4" strokeWidth={1} />
                <span className="text-[10px] uppercase tracking-widest">Secure 256-bit SSL encryption</span>
              </div>
            </section>

            {/* Submit — visible on mobile below form */}
            <div className="lg:hidden pt-4">
              <Button variant="secondary" className="w-full" type="submit">
                Place Order — ${fmt(total)}
              </Button>
            </div>
          </div>

          {/* ────────── RIGHT: Order Summary ────────── */}
          <aside className="lg:col-span-5">
            <div className="bg-surface-container-low p-8 md:p-10 sticky top-28">
              <h2 className="text-xs uppercase tracking-[0.2em] font-bold text-primary mb-10">Order Summary</h2>

              {/* Items */}
              <div className="space-y-8 mb-10">
                {cartItems.map(item => (
                  <div key={item.id} className="flex gap-5 group">
                    <div className="w-20 h-24 bg-surface-container flex-none overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-0.5">
                      <div>
                        <h4 className="text-sm font-bold uppercase tracking-wider text-primary truncate">{item.name}</h4>
                        <p className="text-[10px] text-outline uppercase tracking-widest mt-1">
                          {[item.color, item.size ? `Size ${item.size}` : ''].filter(Boolean).join(' / ')}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-widest text-outline">Qty: {item.quantity}</span>
                        <span className="text-sm font-medium text-primary">${fmt(item.price)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t border-outline-variant pt-6 space-y-4">
                <div className="flex justify-between text-sm text-outline">
                  <span>Subtotal</span>
                  <span className="text-primary">${fmt(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-outline">
                  <span>Shipping</span>
                  <span className="text-primary italic">Complimentary</span>
                </div>
                <div className="flex justify-between text-sm text-outline">
                  <span>Tax</span>
                  <span className="text-primary">${fmt(tax)}</span>
                </div>
              </div>

              <div className="border-t border-outline-variant mt-6 pt-6 flex justify-between items-center">
                <span className="text-sm uppercase tracking-widest font-bold text-primary">Total</span>
                <span className="text-2xl font-medium text-primary">${fmt(total)}</span>
              </div>

              {/* Place order — desktop */}
              <div className="hidden lg:block mt-10">
                <Button variant="secondary" className="w-full" type="submit">
                  Place Order
                </Button>
              </div>
            </div>
          </aside>
        </form>
        )}
      </main>

      <Footer />
    </div>
  );
}

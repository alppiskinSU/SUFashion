import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Lock, Truck, ShieldCheck } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useCart } from '../contexts/CartContext';
import { placeOrder } from '../lib/placeOrder';


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
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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

  function validatePaymentDetails() {
    const required = [
      ['firstName',  'First name'],
      ['lastName',   'Last name'],
      ['email',      'Email'],
      ['address',    'Address'],
      ['city',       'City'],
      ['zip',        'ZIP / Postal code'],
      ['country',    'Country'],
      ['cardName',   'Name on card'],
      ['cardNumber', 'Card number'],
      ['expiry',     'Expiry date'],
      ['cvv',        'CVV'],
    ];
    for (const [key, label] of required) {
      if (!String(form[key] ?? '').trim()) return `${label} is required.`;
    }

    const cardDigits = form.cardNumber.replace(/\D/g, '');
    if (cardDigits.length !== 16) return 'Card number must be 16 digits.';

    const expiryMatch = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(form.expiry);
    if (!expiryMatch) return 'Expiry must be in MM/YY format.';
    const expMonth = parseInt(expiryMatch[1], 10);
    const expYear  = 2000 + parseInt(expiryMatch[2], 10);
    const now = new Date();
    const lastValid = new Date(expYear, expMonth, 0, 23, 59, 59);
    if (lastValid < now) return 'Card has expired.';

    if (!/^\d{3}$/.test(form.cvv)) return 'CVV must be 3 digits.';
    return null;
  }

  async function handleSubmit(e) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    // Guard at the very top — prevents double-submit from rapid clicks or Enter key
    if (submitting) return;

    if (!sessionStorage.getItem('token')) {
      sessionStorage.setItem('postLoginRedirect', '/checkout');
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }

    const validationError = validatePaymentDetails();
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      const { orderId, orderGroup } = await placeOrder(cartItems, {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        address: form.address,
        city: form.city,
        zip: form.zip,
        country: form.country,
      });

      // Clear cart only AFTER backend confirmed the order — prevents data loss on network failure
      clearCart();

      // Navigate to group confirmation if available, fallback to single order
      if (orderGroup) {
        navigate(`/order-confirmation/group/${orderGroup}`);
      } else if (orderId) {
        navigate(`/order-confirmation/${orderId}`);
      } else {
        navigate('/my-orders');
      }
    } catch (err) {
      if (err.code === 'UNAUTHENTICATED') {
        sessionStorage.setItem('postLoginRedirect', '/checkout');
        navigate('/login', { state: { from: '/checkout' } });
        return;
      }
      setErrorMsg(err.message || 'Could not place your order. Please try again.');
    } finally {
      setSubmitting(false);
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
                <Input label="First Name"  id="firstName" value={form.firstName} onChange={handleChange} required />
                <Input label="Last Name"   id="lastName"  value={form.lastName}  onChange={handleChange} required />
                <Input label="Email"        id="email"     type="email" className="sm:col-span-2" value={form.email} onChange={handleChange} required />
                <Input label="Address"      id="address"   className="sm:col-span-2" value={form.address} onChange={handleChange} required />
                <Input label="City"         id="city"      value={form.city} onChange={handleChange} required />
                <Input label="ZIP / Postal" id="zip"       value={form.zip}  onChange={handleChange} required />
                <Input label="Country"      id="country"   className="sm:col-span-2" value={form.country} onChange={handleChange} required />
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
                <Input label="Name on Card" id="cardName"   className="sm:col-span-2" value={form.cardName}   onChange={handleChange} required autoComplete="cc-name" />
                <Input label="Card Number"  id="cardNumber" className="sm:col-span-2" value={form.cardNumber} onChange={handleChange}
                  required
                  inputMode="numeric"
                  autoComplete="cc-number"
                  pattern="(\d{4} ?){4}"
                  title="Enter a 16-digit card number"
                  indicator={
                    <span className="absolute right-0 top-2 text-outline flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </span>
                  }
                />
                <Input label="MM / YY"  id="expiry" value={form.expiry} onChange={handleChange}
                  required
                  inputMode="numeric"
                  autoComplete="cc-exp"
                  pattern="(0[1-9]|1[0-2])\/\d{2}"
                  title="MM/YY format, e.g. 09/28"
                />
                <Input label="CVV"      id="cvv"    value={form.cvv}    onChange={handleChange}
                  required
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  pattern="\d{3}"
                  title="3-digit security code"
                />
              </div>

              <div className="flex items-center gap-2 mt-6 text-outline">
                <ShieldCheck className="w-4 h-4" strokeWidth={1} />
                <span className="text-[10px] uppercase tracking-widest">Secure 256-bit SSL encryption</span>
              </div>
            </section>

            {/* Submit — visible on mobile below form */}
            <div className="lg:hidden pt-4 space-y-3">
              <Button
                variant="secondary"
                className="w-full"
                type="submit"
                disabled={submitting || cartItems.length === 0}
              >
                {submitting ? 'Processing…' : `Place Order — $${fmt(total)}`}
              </Button>
              {errorMsg && (
                <p className="text-red-500 text-[10px] uppercase tracking-widest">{errorMsg}</p>
              )}
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
              <div className="hidden lg:block mt-10 space-y-3">
                <Button
                  variant="secondary"
                  className="w-full"
                  type="submit"
                  disabled={submitting || cartItems.length === 0}
                >
                  {submitting ? 'Processing…' : 'Place Order'}
                </Button>
                {errorMsg && (
                  <p className="text-red-500 text-[10px] uppercase tracking-widest">{errorMsg}</p>
                )}
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

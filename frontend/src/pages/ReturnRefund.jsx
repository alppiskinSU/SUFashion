import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw, ShoppingBag, Send, CheckCircle, XCircle, Clock, AlertTriangle, HelpCircle } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { authFetch } from '../lib/authFetch';

const STATUS_COLOR = {
  pending: 'bg-amber-100 text-amber-800 border border-amber-200',
  approved: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  rejected: 'bg-red-100 text-red-800 border border-red-200',
};

const STATUS_LABEL = {
  pending: 'Pending Approval',
  approved: 'Refund Approved',
  rejected: 'Refund Declined',
};

const fmt = (n) => Number(n).toLocaleString(undefined, { minimumFractionDigits: 2 });

export default function ReturnRefund() {
  const [orders, setOrders] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Refund request form state
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [submitError, setSubmitError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch both user orders and user refunds concurrently
      const [resOrders, resRefunds] = await Promise.all([
        authFetch('http://localhost:3000/api/orders/user/me'),
        authFetch('http://localhost:3000/api/refunds/user/me')
      ]);

      if (!resOrders.ok) throw new Error('Failed to load orders.');
      if (!resRefunds.ok) throw new Error('Failed to load refund requests.');

      const dataOrders = await resOrders.json();
      const dataRefunds = await resRefunds.json();

      setOrders(dataOrders.orders ?? []);
      setRefunds(dataRefunds.refunds ?? []);
    } catch (err) {
      setError(err.message || 'An error occurred while fetching data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenRefundForm = (order) => {
    setSelectedOrder(order);
    setReason('');
    setSubmitError('');
    setSubmitSuccess(null);
  };

  const handleCloseRefundForm = () => {
    setSelectedOrder(null);
    setReason('');
  };

  const handleSubmitRefund = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;
    if (!reason.trim()) {
      setSubmitError('Please provide a reason for the refund.');
      return;
    }

    setSubmitting(true);
    setSubmitError('');
    setSubmitSuccess(null);

    try {
      const res = await authFetch('http://localhost:3000/api/refunds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: selectedOrder.id,
          reason: reason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit refund request.');
      }

      setSubmitSuccess('Your refund request has been successfully submitted and is under review.');
      setReason('');
      
      // Refresh list
      fetchData();
      
      // Close form after a short delay
      setTimeout(() => {
        handleCloseRefundForm();
      }, 3000);

    } catch (err) {
      setSubmitError(err.message || 'Could not submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter orders that are delivered
  const deliveredOrders = orders.filter(o => o.status === 'delivered');
  
  // Find which delivered orders already have a refund request
  const getRefundForOrder = (orderId) => {
    return refunds.find(r => r.order_id === orderId);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Navbar />

      <main className="flex-grow pt-28 pb-20 px-6 md:px-12 lg:px-24">
        
        {/* Back Link */}
        <Link
          to="/my-orders"
          className="inline-flex items-center gap-2 text-outline hover:text-primary text-xs uppercase tracking-widest font-bold mb-12 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" strokeWidth={1.5} />
          Back to Orders
        </Link>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] uppercase tracking-[0.25em] text-outline font-bold">Customer Portal</span>
            </div>
            <h1 className="font-serif italic text-4xl md:text-5xl text-primary leading-tight">
              Returns & Refunds
            </h1>
            <p className="text-outline text-sm tracking-wide mt-3 max-w-xl">
              Request a return for delivered items within the eligibility window or track your pending refunds.
            </p>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="self-start md:self-end inline-flex items-center gap-2 px-4 py-2 border border-outline-variant text-[10px] uppercase tracking-widest font-bold text-primary hover:bg-surface-container-high transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} strokeWidth={1.5} />
            Refresh Status
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-3 px-6 py-4 bg-red-50 border border-red-200 text-red-800 mb-10">
            <AlertTriangle className="w-5 h-5 flex-none" strokeWidth={1.5} />
            <p className="text-sm font-sans">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="py-24 text-center">
            <p className="text-outline text-xs uppercase tracking-widest animate-pulse">Loading return registry...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Left side: Refund Request Section */}
            <div className="lg:col-span-7 space-y-8">
              <h2 className="font-serif text-2xl italic text-primary border-b border-outline-variant pb-3 mb-6">Eligible Delivered Orders</h2>
              
              {deliveredOrders.length === 0 ? (
                <div className="bg-surface-container border border-outline-variant p-8 text-center space-y-4">
                  <ShoppingBag className="w-8 h-8 text-outline mx-auto" strokeWidth={1.5} />
                  <p className="text-sm text-outline uppercase tracking-widest">No delivered orders found</p>
                  <p className="text-xs text-outline max-w-sm mx-auto leading-relaxed">
                    Refunds can only be requested for orders that have been successfully delivered to your address.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {deliveredOrders.map(order => {
                    const existingRefund = getRefundForOrder(order.id);
                    
                    return (
                      <div key={order.id} className="bg-surface-container-low border border-outline-variant p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all duration-300 hover:border-primary/30">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          {/* Product Image */}
                          <div className="w-14 h-16 bg-surface-container flex-none overflow-hidden">
                            {order.products?.image_url ? (
                              <img src={order.products.image_url} alt={order.products.name} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ShoppingBag className="w-5 h-5 text-outline" strokeWidth={1} />
                              </div>
                            )}
                          </div>
                          
                          {/* Order Details */}
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-primary truncate max-w-[200px] md:max-w-[300px] uppercase tracking-wider">{order.products?.name || '—'}</h4>
                            <p className="text-[10px] text-outline mt-1 uppercase tracking-widest">Order ID: #{order.id}</p>
                            <div className="flex items-center gap-3 mt-2 text-[10px] text-outline uppercase tracking-widest">
                              <span>Qty: {order.quantity}</span>
                              <span>•</span>
                              <span className="font-bold text-primary">${fmt(order.total_price)}</span>
                              <span>•</span>
                              <span>Delivered: {formatDate(order.created_at)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Action buttons or status */}
                        <div className="shrink-0 flex items-center justify-end">
                          {existingRefund ? (
                            <span className={`px-3 py-1 text-[10px] uppercase tracking-widest font-bold ${STATUS_COLOR[existingRefund.status] || STATUS_COLOR.pending}`}>
                              {STATUS_LABEL[existingRefund.status] || existingRefund.status}
                            </span>
                          ) : (
                            <button
                              onClick={() => handleOpenRefundForm(order)}
                              className="px-4 py-2 text-[10px] uppercase tracking-widest font-bold bg-primary text-white hover:brightness-95 transition-all shadow-sm"
                            >
                              Request Refund
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right side: Past Refunds Section */}
            <div className="lg:col-span-5 space-y-8">
              <h2 className="font-serif text-2xl italic text-primary border-b border-outline-variant pb-3 mb-6">Refund History</h2>

              {refunds.length === 0 ? (
                <div className="bg-surface-container border border-outline-variant p-8 text-center space-y-4">
                  <Clock className="w-8 h-8 text-outline mx-auto" strokeWidth={1.5} />
                  <p className="text-sm text-outline uppercase tracking-widest">No refund requests yet</p>
                  <p className="text-xs text-outline leading-relaxed">
                    Once you submit a request, you can monitor its approval process and status updates here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                  {refunds.map(refund => (
                    <div key={refund.id} className="bg-surface-container border border-outline-variant p-5 space-y-4">
                      {/* Refund header */}
                      <div className="flex items-center justify-between border-b border-outline-variant/60 pb-3">
                        <div>
                          <p className="text-[9px] uppercase tracking-widest text-outline">Refund ID: #{refund.id}</p>
                          <p className="text-[10px] text-outline uppercase tracking-widest mt-0.5">{formatDate(refund.created_at)}</p>
                        </div>
                        <span className={`px-2.5 py-0.5 text-[9px] uppercase tracking-widest font-bold ${STATUS_COLOR[refund.status] || STATUS_COLOR.pending}`}>
                          {STATUS_LABEL[refund.status] || refund.status}
                        </span>
                      </div>

                      {/* Product display */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-12 bg-surface flex-none overflow-hidden border border-outline-variant">
                          {refund.orders?.products?.image_url ? (
                            <img src={refund.orders.products.image_url} alt={refund.orders.products.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ShoppingBag className="w-4 h-4 text-outline" strokeWidth={1} />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-bold text-primary truncate uppercase tracking-wider">{refund.orders?.products?.name || '—'}</p>
                          <p className="text-[10px] text-outline mt-0.5 uppercase tracking-widest">Returned Amount: <span className="font-bold text-primary">${fmt(refund.amount)}</span></p>
                        </div>
                      </div>

                      {/* Reason */}
                      <div className="bg-surface p-3 border border-outline-variant/50">
                        <p className="text-[9px] uppercase tracking-widest text-outline mb-1 font-bold">Reason Provided:</p>
                        <p className="text-xs text-primary leading-relaxed font-sans italic">"{refund.reason || 'No reason provided.'}"</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

      </main>

      {/* Slide-out Refund Request Dialog Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300">
          <div className="bg-surface-container-low max-w-lg w-full border border-outline-variant shadow-2xl p-8 space-y-6 relative animate-in fade-in zoom-in-95 duration-200">
            
            <button 
              onClick={handleCloseRefundForm}
              className="absolute top-6 right-6 text-outline hover:text-primary transition-colors cursor-pointer text-lg font-bold"
            >
              ×
            </button>

            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-outline font-bold mb-1">Request Return</p>
              <h3 className="font-serif italic text-2xl text-primary">Refund Request</h3>
              <p className="text-xs text-outline mt-1 font-sans">For Order #{selectedOrder.id}</p>
            </div>

            {/* Product summary */}
            <div className="flex items-center gap-4 bg-surface p-4 border border-outline-variant/60">
              <div className="w-12 h-14 bg-surface-container flex-none overflow-hidden">
                {selectedOrder.products?.image_url ? (
                  <img src={selectedOrder.products.image_url} alt={selectedOrder.products.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4 text-outline" strokeWidth={1} />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-primary truncate uppercase tracking-wider">{selectedOrder.products?.name}</p>
                <p className="text-[10px] text-outline mt-1 uppercase tracking-widest">
                  Total Refundable Amount: <span className="font-bold text-primary">${fmt(selectedOrder.total_price)}</span>
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitRefund} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-outline font-bold block" htmlFor="refund-reason">
                  Reason for Refund
                </label>
                <textarea
                  id="refund-reason"
                  rows={4}
                  required
                  placeholder="Please describe the reason for return (e.g. incorrect sizing, quality issues, damaged item)..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-4 py-3 border border-outline-variant bg-surface text-primary text-xs font-sans focus:outline-none focus:border-primary resize-none placeholder:text-outline/60 leading-relaxed"
                />
              </div>

              {submitError && (
                <div className="flex items-center gap-2 text-red-600 text-xs uppercase tracking-widest">
                  <AlertTriangle className="w-4 h-4 flex-none" />
                  <span>{submitError}</span>
                </div>
              )}

              {submitSuccess && (
                <div className="flex items-center gap-2 text-emerald-600 text-xs uppercase tracking-widest">
                  <CheckCircle className="w-4 h-4 flex-none" />
                  <span>{submitSuccess}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseRefundForm}
                  disabled={submitting}
                  className="px-6 py-2.5 border border-outline-variant text-[10px] uppercase tracking-widest font-bold text-primary hover:bg-surface-container-high transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || submitSuccess !== null}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-[10px] uppercase tracking-widest font-bold hover:brightness-95 transition-all disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" strokeWidth={2} />
                  {submitting ? 'Submitting…' : 'Submit Request'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

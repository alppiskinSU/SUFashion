const express = require('express');
const router = express.Router();
const { supabase } = require('../db');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

// Req 15 — refund eligibility window (days from purchase)
const REFUND_WINDOW_DAYS = 30;

// POST /api/refunds — customer requests a refund for a delivered order
// Req 15: Must be within 30 days of purchase. Refund amount = total_price
// at the time of purchase, so even if a discount campaign has ended the
// customer receives back the discounted price they actually paid.
router.post('/', authMiddleware, async (req, res) => {
  const { order_id, reason } = req.body;
  const user_id = req.user.id;

  if (!order_id) return res.status(400).json({ error: 'order_id is required' });

  try {
    const { data: order, error: fetchErr } = await supabase
      .from('orders')
      .select('id, status, user_id, total_price, created_at')
      .eq('id', order_id)
      .single();

    if (fetchErr || !order) return res.status(404).json({ error: 'Order not found' });
    if (order.user_id !== user_id) return res.status(403).json({ error: 'Not your order' });
    if (order.status !== 'delivered')
      return res.status(400).json({ error: 'Refunds can only be requested for delivered orders' });

    // Req 15 — enforce 30-day return window from the purchase date
    const purchaseDate = new Date(order.created_at);
    const now = new Date();
    const diffMs = now.getTime() - purchaseDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays > REFUND_WINDOW_DAYS) {
      return res.status(400).json({
        error: `Refund window has expired. Returns must be requested within ${REFUND_WINDOW_DAYS} days of purchase. This order was placed ${diffDays} days ago.`,
      });
    }

    // Prevent duplicate pending/approved refund on the same order
    const { data: existing } = await supabase
      .from('refunds')
      .select('id, status')
      .eq('order_id', order_id)
      .in('status', ['pending', 'approved'])
      .maybeSingle();

    if (existing)
      return res.status(409).json({ error: `A refund for this order is already ${existing.status}` });

    // Req 15 — refund amount is order.total_price, i.e. the price the
    // customer actually paid at checkout. If a discount was active at the
    // time of purchase, total_price already reflects that discount, so
    // the refunded amount will equal the discounted purchase price even
    // if the campaign has since ended.
    // Req 15 — refund amount includes 8% tax paid at checkout
    const amountWithTax = order.total_price * 1.08;

    const { data: refund, error: insertErr } = await supabase
      .from('refunds')
      .insert([{ order_id, user_id, amount: amountWithTax, reason: reason || null }])
      .select()
      .single();

    if (insertErr) throw insertErr;

    res.status(201).json({ message: 'Refund request submitted', refund });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/refunds/user/me — customer views their own refund requests
router.get('/user/me', authMiddleware, async (req, res) => {
  try {
    const { data: refunds, error } = await supabase
      .from('refunds')
      .select('*, orders(product_id, quantity, total_price, products(name, image_url))')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    res.json({ refunds });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/refunds/admin/all — admin views all refund requests
router.get('/admin/all', authMiddleware, requireRole('admin', 'sales_manager'), async (_req, res) => {
  try {
    const { data: refunds, error } = await supabase
      .from('refunds')
      .select('*, orders(product_id, quantity, products(name))')
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    res.json({ refunds });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/refunds/:id/status — admin approves or rejects a refund
// Body: { "status": "approved" | "rejected" }
router.patch('/:id/status', authMiddleware, requireRole('admin', 'sales_manager'), async (req, res) => {
  const { status } = req.body;
  const refundId = req.params.id;

  if (!['approved', 'rejected'].includes(status))
    return res.status(400).json({ error: 'status must be "approved" or "rejected"' });

  try {
    const { data: current, error: fetchErr } = await supabase
      .from('refunds')
      .select('id, status')
      .eq('id', refundId)
      .single();

    if (fetchErr || !current) return res.status(404).json({ error: 'Refund not found' });
    if (current.status !== 'pending')
      return res.status(400).json({ error: `Refund is already ${current.status}` });

    const { data: updated, error: updateErr } = await supabase
      .from('refunds')
      .update({ status })
      .eq('id', refundId)
      .select()
      .single();

    if (updateErr) throw updateErr;

    // Send email notification if approved
    if (status === 'approved') {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', updated.user_id)
        .single();
        
      const { data: authUser } = await supabase.auth.admin.getUserById(updated.user_id);
      
      if (authUser?.user?.email) {
        const { sendRefundApproval } = require('../utils/emailService');
        await sendRefundApproval(authUser.user.email, {
          customerName: userProfile?.name || 'Customer',
          refundId: updated.id,
          amount: updated.amount,
          orderId: updated.order_id
        });
      }
    }

    res.json({ message: `Refund ${status}`, refund: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

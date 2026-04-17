const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const { supabase } = require('../db');
const { authMiddleware } = require('../middleware/authMiddleware');

// Create a transporter — uses Ethereal (free test SMTP) by default.
// To send real emails, add SMTP_USER and SMTP_PASS to .env (Gmail App Password).
let transporterPromise = nodemailer.createTestAccount().then(account => {
  return nodemailer.createTransport({
    host: account.smtp.host,
    port: account.smtp.port,
    secure: account.smtp.secure,
    auth: { user: account.user, pass: account.pass },
  });
});

// Send invoice email for an order
router.post('/:orderId/send', authMiddleware, async (req, res) => {
  try {
    const { email } = req.body; // recipient email

    // Fetch the order with product info
    const { data: order, error } = await supabase
      .from('orders')
      .select('*, products(name, price, image_url)')
      .eq('id', req.params.orderId)
      .eq('user_id', req.user.id)
      .single();

    if (error || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Fetch user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, home_address')
      .eq('id', req.user.id)
      .single();

    const customerName = profile?.name || 'Customer';
    const subtotal = order.total_price;
    const tax = Math.round(subtotal * 0.08 * 100) / 100;
    const total = subtotal + tax;
    const fmt = (n) => Number(n).toFixed(2);
    const orderDate = new Date(order.created_at).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });

    const html = `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #2B2B2B;">
        <div style="border-bottom: 2px solid #2B2B2B; padding-bottom: 20px; margin-bottom: 30px;">
          <h1 style="font-size: 28px; margin: 0;">SUFashion</h1>
          <p style="color: #747878; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin-top: 4px;">Invoice</p>
        </div>

        <table style="width: 100%; font-size: 13px; margin-bottom: 30px;">
          <tr>
            <td><strong>Order Number</strong><br/>${order.id}</td>
            <td><strong>Date</strong><br/>${orderDate}</td>
          </tr>
          <tr>
            <td style="padding-top: 12px;"><strong>Customer</strong><br/>${customerName}</td>
            <td style="padding-top: 12px;"><strong>Status</strong><br/>${order.status || 'Processing'}</td>
          </tr>
        </table>

        <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 30px;">
          <thead>
            <tr style="border-bottom: 1px solid #ddd; text-transform: uppercase; letter-spacing: 1px; font-size: 10px; color: #747878;">
              <th style="text-align: left; padding: 8px 0;">Item</th>
              <th style="text-align: center; padding: 8px 0;">Qty</th>
              <th style="text-align: right; padding: 8px 0;">Price</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 12px 0;">${order.products?.name || 'Product'}</td>
              <td style="text-align: center; padding: 12px 0;">${order.quantity}</td>
              <td style="text-align: right; padding: 12px 0;">$${fmt(order.products?.price * order.quantity)}</td>
            </tr>
          </tbody>
        </table>

        <table style="width: 100%; font-size: 13px; margin-bottom: 30px;">
          <tr>
            <td>Subtotal</td>
            <td style="text-align: right;">$${fmt(subtotal)}</td>
          </tr>
          <tr>
            <td>Shipping</td>
            <td style="text-align: right; font-style: italic;">Complimentary</td>
          </tr>
          <tr>
            <td>Tax (8%)</td>
            <td style="text-align: right;">$${fmt(tax)}</td>
          </tr>
          <tr style="border-top: 2px solid #2B2B2B; font-weight: bold; font-size: 16px;">
            <td style="padding-top: 12px;">Total</td>
            <td style="text-align: right; padding-top: 12px;">$${fmt(total)}</td>
          </tr>
        </table>

        <div style="border-top: 1px solid #ddd; padding-top: 20px; font-size: 11px; color: #747878; text-transform: uppercase; letter-spacing: 1px;">
          <p>Thank you for shopping with SUFashion.</p>
          <p>&copy; 2026 SUFashion Atelier. All rights reserved.</p>
        </div>
      </div>
    `;

    const transporter = await transporterPromise;
    const info = await transporter.sendMail({
      from: '"SUFashion" <noreply@sufashion.com>',
      to: email,
      subject: `Your SUFashion Invoice — Order ${order.id}`,
      html,
    });

    // Ethereal provides a preview URL for testing
    const previewUrl = nodemailer.getTestMessageUrl(info);

    res.json({
      message: 'Invoice sent successfully',
      previewUrl: previewUrl || null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

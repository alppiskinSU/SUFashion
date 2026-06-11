const express = require('express');
const router = express.Router();
const { supabase } = require('../db');
const { authMiddleware } = require('../middleware/authMiddleware');
const { generateInvoicePdf } = require('../utils/pdfGenerator');
const { sendInvoiceEmail } = require('../utils/emailService');

// POST /api/invoices/send/:orderId
router.post('/send/:orderId', authMiddleware, async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const userEmail = req.body?.email || req.user.email; // Use provided email or fall back to account email

        if (!userEmail) {
            return res.status(400).json({ error: 'No email address found. Please provide an email address.' });
        }

        // Fetch order details + joined product details
        const { data: order, error: fetchError } = await supabase
            .from('orders')
            .select(`
                *,
                products (
                    name,
                    price
                )
            `)
            .eq('id', orderId)
            .eq('user_id', req.user.id) // Security check to ensure user owns this order
            .single();

        if (fetchError || !order) {
            return res.status(404).json({ error: 'Order not found or you do not have permission to access it.' });
        }

        // 1. Generate PDF
        const pdfBuffer = await generateInvoicePdf(order);

        // 2. Send via Email
        const emailResult = await sendInvoiceEmail(userEmail, pdfBuffer, order.id);

        res.status(200).json({ 
            message: 'Invoice email sent successfully.', 
            previewUrl: emailResult.previewUrl // Ethereal preview url (test purpose)
        });

    } catch (err) {
        console.error("Invoice API Error:", err);
        res.status(500).json({ error: 'An error occurred while generating or sending the invoice.', details: err.message });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// SCRUM-110 — Sales manager: view invoices by date range
// ─────────────────────────────────────────────────────────────────────────────

const { requireRole } = require('../middleware/authMiddleware');

/**
 * GET /api/invoices/admin/by-date?from=YYYY-MM-DD&to=YYYY-MM-DD
 *
 * Returns every order in [from, to] enriched with customer + product names.
 * Accessible to admin only.
 */
router.get('/admin/by-date', authMiddleware, requireRole('admin', 'sales_manager', 'product_manager'), async (req, res) => {
    const { from, to } = req.query;

    if (!from || !to) {
        return res.status(400).json({
            error: 'Both "from" and "to" query parameters are required (YYYY-MM-DD).',
        });
    }

    const fromDate = new Date(from);
    const toDate   = new Date(to);

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
    }

    if (fromDate > toDate) {
        return res.status(400).json({ error: '"from" must not be after "to".' });
    }

    // Extend "to" to end-of-day so the whole day is included
    toDate.setUTCHours(23, 59, 59, 999);

    try {
        const { data: orders, error } = await supabase
            .from('orders')
            .select('id, user_id, product_id, quantity, total_price, status, created_at, products(name, price)')
            .gte('created_at', fromDate.toISOString())
            .lte('created_at', toDate.toISOString())
            .order('created_at', { ascending: false });

        if (error) return res.status(500).json({ error: error.message });

        // Enrich with customer names from profiles
        const userIds = [...new Set((orders || []).map(o => o.user_id).filter(Boolean))];
        let nameById = {};
        if (userIds.length) {
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, name')
                .in('id', userIds);
            nameById = Object.fromEntries((profiles || []).map(p => [p.id, p.name]));
        }

        const invoices = (orders || []).map(o => ({
            invoice_id:    o.id,
            customer_id:   o.user_id,
            customer_name: nameById[o.user_id] || 'Anonymous',
            product_id:    o.product_id,
            product_name:  o.products?.name || '—',
            quantity:      o.quantity,
            unit_price:    o.products?.price ?? null,
            total_price:   o.total_price,
            status:        o.status,
            created_at:    o.created_at,
        }));

        res.json({ invoices, meta: { from, to, count: invoices.length } });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/invoices/admin/revenue-summary?from=YYYY-MM-DD&to=YYYY-MM-DD
 *
 * Returns aggregate revenue stats for the date range.
 */
router.get('/admin/revenue-summary', authMiddleware, requireRole('admin', 'sales_manager'), async (req, res) => {
    const { from, to } = req.query;

    if (!from || !to) {
        return res.status(400).json({
            error: 'Both "from" and "to" query parameters are required (YYYY-MM-DD).',
        });
    }

    const fromDate = new Date(from);
    const toDate   = new Date(to);

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
    }

    toDate.setUTCHours(23, 59, 59, 999);

    try {
        const { data: orders, error } = await supabase
            .from('orders')
            .select('id, total_price, status')
            .gte('created_at', fromDate.toISOString())
            .lte('created_at', toDate.toISOString());

        if (error) return res.status(500).json({ error: error.message });

        const all       = orders || [];
        const cancelled = all.filter(o => o.status === 'cancelled');
        const active    = all.filter(o => o.status !== 'cancelled');
        const completed = all.filter(o => o.status === 'delivered');
        const sum       = (arr) => arr.reduce((acc, o) => acc + Number(o.total_price || 0), 0);

        res.json({
            summary: {
                from,
                to,
                total_orders:      all.length,
                completed_orders:  completed.length,
                cancelled_orders:  cancelled.length,
                gross_revenue:     sum(active),
                cancelled_revenue: sum(cancelled),
            },
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/invoices/admin/profit-loss?from=YYYY-MM-DD&to=YYYY-MM-DD
 *
 * Req 11 — revenue and loss/profit between two dates, plus a daily series
 * for the chart. Profit = revenue − cost of goods (products.cost × quantity),
 * computed over non-cancelled orders in the range.
 */
router.get('/admin/profit-loss', authMiddleware, requireRole('admin', 'sales_manager'), async (req, res) => {
    const { from, to } = req.query;

    if (!from || !to) {
        return res.status(400).json({
            error: 'Both "from" and "to" query parameters are required (YYYY-MM-DD).',
        });
    }

    const fromDate = new Date(from);
    const toDate   = new Date(to);

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
    }

    toDate.setUTCHours(23, 59, 59, 999);

    try {
        const { data: orders, error } = await supabase
            .from('orders')
            .select('quantity, total_price, status, created_at, products(cost)')
            .gte('created_at', fromDate.toISOString())
            .lte('created_at', toDate.toISOString())
            .neq('status', 'cancelled')
            .order('created_at', { ascending: true });

        if (error) return res.status(500).json({ error: error.message });

        const byDay = new Map();
        let grossRevenue = 0;
        let totalCost    = 0;

        for (const o of orders || []) {
            const revenue = Number(o.total_price || 0);
            const cost    = Number(o.products?.cost || 0) * Number(o.quantity || 0);
            grossRevenue += revenue;
            totalCost    += cost;

            const day = o.created_at.slice(0, 10);
            const row = byDay.get(day) || { date: day, revenue: 0, cost: 0, profit: 0 };
            row.revenue += revenue;
            row.cost    += cost;
            row.profit   = row.revenue - row.cost;
            byDay.set(day, row);
        }

        const round = (n) => Math.round(n * 100) / 100;
        const netProfit = round(grossRevenue - totalCost);

        res.json({
            summary: {
                from,
                to,
                gross_revenue: round(grossRevenue),
                total_cost:    round(totalCost),
                net_profit:    netProfit,
                is_loss:       netProfit < 0,
            },
            series: [...byDay.values()].map(r => ({
                date: r.date,
                revenue: round(r.revenue),
                cost:    round(r.cost),
                profit:  round(r.profit),
            })),
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/invoices/admin/:orderId/pdf
 *
 * Req 11 — sales manager (and product manager, Req 12) opens any invoice as a
 * PDF to print or save. Same generator as the customer e-mail invoice.
 */
router.get('/admin/:orderId/pdf', authMiddleware, requireRole('admin', 'sales_manager', 'product_manager'), async (req, res) => {
    try {
        const { data: order, error } = await supabase
            .from('orders')
            .select('*, products(name, price)')
            .eq('id', req.params.orderId)
            .single();

        if (error || !order) return res.status(404).json({ error: 'Order not found' });

        const pdfBuffer = await generateInvoicePdf(order);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="invoice-${order.id}.pdf"`);
        res.send(pdfBuffer);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/invoices/admin/revenue-chart?from=YYYY-MM-DD&to=YYYY-MM-DD
 *
 * Returns daily aggregate revenue/refund records for the chart.
 */
router.get('/admin/revenue-chart', authMiddleware, requireRole('admin', 'sales_manager'), async (req, res) => {
    const { from, to } = req.query;

    if (!from || !to) {
        return res.status(400).json({
            error: 'Both "from" and "to" query parameters are required (YYYY-MM-DD).',
        });
    }

    try {
        const fromDate = new Date(from);
        const toDate   = new Date(to);
        toDate.setUTCHours(23, 59, 59, 999);

        const { data: orders, error } = await supabase
            .from('orders')
            .select('total_price, status, created_at')
            .gte('created_at', fromDate.toISOString())
            .lte('created_at', toDate.toISOString())
            .order('created_at', { ascending: true });

        if (error) return res.status(500).json({ error: error.message });

        const byDay = new Map();
        
        for (const o of orders || []) {
            const day = o.created_at.slice(0, 10);
            const row = byDay.get(day) || { date: day, daily_revenue: 0, daily_refunds: 0 };
            
            const amount = Number(o.total_price || 0);
            if (o.status === 'cancelled') {
                row.daily_refunds += amount;
            } else {
                row.daily_revenue += amount;
            }
            byDay.set(day, row);
        }

        const chartData = [...byDay.values()].map(r => ({
            date: r.date,
            daily_revenue: Math.round(r.daily_revenue * 100) / 100,
            daily_refunds: Math.round(r.daily_refunds * 100) / 100,
        }));

        res.json({ chartData });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;


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
        const userEmail = req.user.email; // Filled by authMiddleware

        if (!userEmail) {
            return res.status(400).json({ error: 'No email address found registered to this account.' });
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

module.exports = router;

const nodemailer = require('nodemailer');

// Create a transporter using Ethereal (test) or standard SMTP
const getTransporter = async () => {
    // If you have real SMTP config in .env, use them:
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT || 587,
            secure: process.env.SMTP_PORT == 465,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }

    // Otherwise, generate an Ethereal test account on the fly
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false, 
        auth: {
            user: testAccount.user,
            pass: testAccount.pass,
        },
    });
};

const sendInvoiceEmail = async (toEmail, pdfBuffer, orderId) => {
    try {
        const transporter = await getTransporter();

        const info = await transporter.sendMail({
            from: '"SUFashion" <no-reply@sufashion.com>',
            to: toEmail,
            subject: `Order Invoice - #${orderId}`,
            text: "The invoice for your order is attached. Thank you for choosing us.",
            html: `
                <h3>Hello,</h3>
                <p>The invoice for your order <b>#${orderId}</b> is attached to this email.</p>
                <p>Thank you for shopping with us.</p>
                <br />
                <b>SUFashion Team</b>
            `,
            attachments: [
                {
                    filename: `invoice-${orderId}.pdf`,
                    content: pdfBuffer,
                    contentType: 'application/pdf'
                }
            ]
        });

        console.log("Invoice email sent: %s", info.messageId);
        
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
            console.log("TEST EMAIL PREVIEW URL (Open in browser): %s", previewUrl);
        }

        return { success: true, previewUrl };
    } catch (error) {
        console.error("Email sending error:", error);
        throw error;
    }
};

/**
 * Sends an order confirmation email after a successful batch checkout.
 *
 * @param {string} toEmail
 * @param {{ customerName: string, orderGroup: string, items: Array<{name:string, quantity:number, unit_price:number, total_price:number}>, shippingAddress: string, grandTotal: number, orderDate: string }} orderData
 */
const sendOrderConfirmation = async (toEmail, orderData) => {
    try {
        const transporter = await getTransporter();

        const { customerName, orderGroup, items, shippingAddress, grandTotal, orderDate } = orderData;

        const itemRows = items.map(item => `
            <tr>
                <td style="padding:12px 0; border-bottom:1px solid #e5e0de; font-size:13px; color:#2B2B2B;">${item.name}</td>
                <td style="padding:12px 0; border-bottom:1px solid #e5e0de; font-size:13px; color:#747878; text-align:center;">${item.quantity}</td>
                <td style="padding:12px 0; border-bottom:1px solid #e5e0de; font-size:13px; color:#2B2B2B; text-align:right;">$${Number(item.total_price).toFixed(2)}</td>
            </tr>
        `).join('');

        const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
        <body style="margin:0;padding:0;background:#f5f1ef;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f1ef;padding:40px 0;">
                <tr><td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;max-width:600px;width:100%;">

                        <!-- Header -->
                        <tr>
                            <td style="background:#2B2B2B;padding:32px 40px;text-align:center;">
                                <h1 style="margin:0;color:#ffffff;font-size:22px;letter-spacing:0.3em;font-weight:300;text-transform:uppercase;">SUFASHION</h1>
                            </td>
                        </tr>

                        <!-- Body -->
                        <tr>
                            <td style="padding:40px;">
                                <p style="margin:0 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:0.2em;color:#747878;">Order Confirmed</p>
                                <h2 style="margin:0 0 24px;font-size:26px;color:#2B2B2B;font-weight:300;font-style:italic;">Thank you, ${customerName}.</h2>
                                <p style="margin:0 0 32px;font-size:14px;color:#747878;line-height:1.6;">
                                    Your order has been received and is now being processed.
                                    You will receive a shipping notification once your items are on their way.
                                </p>

                                <!-- Order Meta -->
                                <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f1ef;padding:20px;margin-bottom:32px;">
                                    <tr>
                                        <td style="font-size:11px;text-transform:uppercase;letter-spacing:0.15em;color:#747878;">Order Reference</td>
                                        <td style="font-size:11px;text-transform:uppercase;letter-spacing:0.15em;color:#747878;">Date</td>
                                        <td style="font-size:11px;text-transform:uppercase;letter-spacing:0.15em;color:#747878;">Shipping To</td>
                                    </tr>
                                    <tr>
                                        <td style="font-size:13px;color:#2B2B2B;font-weight:600;padding-top:6px;">${orderGroup.slice(0, 8).toUpperCase()}</td>
                                        <td style="font-size:13px;color:#2B2B2B;padding-top:6px;">${orderDate}</td>
                                        <td style="font-size:13px;color:#2B2B2B;padding-top:6px;">${shippingAddress}</td>
                                    </tr>
                                </table>

                                <!-- Items -->
                                <p style="margin:0 0 12px;font-size:11px;text-transform:uppercase;letter-spacing:0.2em;color:#747878;">Items Ordered</p>
                                <table width="100%" cellpadding="0" cellspacing="0">
                                    <thead>
                                        <tr>
                                            <th style="font-size:10px;text-transform:uppercase;letter-spacing:0.15em;color:#747878;text-align:left;padding-bottom:8px;border-bottom:1px solid #e5e0de;">Product</th>
                                            <th style="font-size:10px;text-transform:uppercase;letter-spacing:0.15em;color:#747878;text-align:center;padding-bottom:8px;border-bottom:1px solid #e5e0de;">Qty</th>
                                            <th style="font-size:10px;text-transform:uppercase;letter-spacing:0.15em;color:#747878;text-align:right;padding-bottom:8px;border-bottom:1px solid #e5e0de;">Price</th>
                                        </tr>
                                    </thead>
                                    <tbody>${itemRows}</tbody>
                                </table>

                                <!-- Total -->
                                <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
                                    <tr>
                                        <td style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;color:#2B2B2B;">Total</td>
                                        <td style="font-size:18px;font-weight:600;color:#2B2B2B;text-align:right;">$${Number(grandTotal).toFixed(2)}</td>
                                    </tr>
                                </table>

                                <hr style="border:none;border-top:1px solid #e5e0de;margin:32px 0;">

                                <p style="margin:0;font-size:13px;color:#747878;line-height:1.6;">
                                    If you have any questions about your order, please contact us.<br>
                                    We appreciate your business.
                                </p>
                            </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                            <td style="background:#f5f1ef;padding:24px 40px;text-align:center;">
                                <p style="margin:0;font-size:10px;text-transform:uppercase;letter-spacing:0.2em;color:#747878;">SUFashion &mdash; Premium Fashion</p>
                            </td>
                        </tr>

                    </table>
                </td></tr>
            </table>
        </body>
        </html>
        `;

        const info = await transporter.sendMail({
            from: `"SUFashion" <${process.env.SMTP_USER}>`,
            to: toEmail,
            subject: `Order Confirmed — ${orderGroup.slice(0, 8).toUpperCase()}`,
            text: `Thank you for your order, ${customerName}! Your order reference is ${orderGroup.slice(0, 8).toUpperCase()}. Total: $${Number(grandTotal).toFixed(2)}.`,
            html,
        });

        console.log('[Mail] Order confirmation sent to %s — messageId: %s', toEmail, info.messageId);

        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) console.log('[Mail] Preview: %s', previewUrl);

        return { success: true };
    } catch (error) {
        console.error('[Mail] Order confirmation failed:', error);
        // Non-fatal — order is already placed; just log and continue.
        return { success: false, error: error.message };
    }
};

/**
 * Req 11 — notifies a user that products on their wishlist were discounted.
 *
 * @param {string} toEmail
 * @param {{ customerName: string, discountRate: number, items: Array<{name:string, oldPrice:number, newPrice:number}> }} data
 */
const sendDiscountNotification = async (toEmail, { customerName, discountRate, items }) => {
    try {
        const transporter = await getTransporter();

        const itemRows = items.map(item => `
            <tr>
                <td style="padding:12px 0; border-bottom:1px solid #e5e0de; font-size:13px; color:#2B2B2B;">${item.name}</td>
                <td style="padding:12px 0; border-bottom:1px solid #e5e0de; font-size:13px; color:#747878; text-align:right; text-decoration:line-through;">$${Number(item.oldPrice).toFixed(2)}</td>
                <td style="padding:12px 0; border-bottom:1px solid #e5e0de; font-size:14px; color:#b91c1c; font-weight:600; text-align:right;">$${Number(item.newPrice).toFixed(2)}</td>
            </tr>
        `).join('');

        const html = `
        <body style="margin:0;padding:0;background:#f5f1ef;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f1ef;padding:40px 0;">
                <tr><td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;max-width:600px;width:100%;">
                        <tr>
                            <td style="background:#2B2B2B;padding:32px 40px;text-align:center;">
                                <h1 style="margin:0;color:#ffffff;font-size:22px;letter-spacing:0.3em;font-weight:300;text-transform:uppercase;">SUFASHION</h1>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding:40px;">
                                <p style="margin:0 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:0.2em;color:#b91c1c;">${discountRate}% Off — Wishlist Alert</p>
                                <h2 style="margin:0 0 24px;font-size:26px;color:#2B2B2B;font-weight:300;font-style:italic;">Good news, ${customerName}.</h2>
                                <p style="margin:0 0 32px;font-size:14px;color:#747878;line-height:1.6;">
                                    Items on your wishlist just went on sale. Prices are updated on the store — while stocks last.
                                </p>
                                <table width="100%" cellpadding="0" cellspacing="0">
                                    <thead>
                                        <tr>
                                            <th style="font-size:10px;text-transform:uppercase;letter-spacing:0.15em;color:#747878;text-align:left;padding-bottom:8px;border-bottom:1px solid #e5e0de;">Product</th>
                                            <th style="font-size:10px;text-transform:uppercase;letter-spacing:0.15em;color:#747878;text-align:right;padding-bottom:8px;border-bottom:1px solid #e5e0de;">Was</th>
                                            <th style="font-size:10px;text-transform:uppercase;letter-spacing:0.15em;color:#747878;text-align:right;padding-bottom:8px;border-bottom:1px solid #e5e0de;">Now</th>
                                        </tr>
                                    </thead>
                                    <tbody>${itemRows}</tbody>
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <td style="background:#f5f1ef;padding:24px 40px;text-align:center;">
                                <p style="margin:0;font-size:10px;text-transform:uppercase;letter-spacing:0.2em;color:#747878;">SUFashion &mdash; Premium Fashion</p>
                            </td>
                        </tr>
                    </table>
                </td></tr>
            </table>
        </body>`;

        const info = await transporter.sendMail({
            from: '"SUFashion" <no-reply@sufashion.com>',
            to: toEmail,
            subject: `${discountRate}% off — items on your wishlist are on sale!`,
            text: items.map(i => `${i.name}: $${Number(i.oldPrice).toFixed(2)} → $${Number(i.newPrice).toFixed(2)}`).join('\n'),
            html,
        });

        console.log('[Mail] Discount notification sent to %s — messageId: %s', toEmail, info.messageId);
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) console.log('[Mail] Preview: %s', previewUrl);

        return { success: true, previewUrl };
    } catch (error) {
        console.error('[Mail] Discount notification failed:', error.message);
        // Non-fatal — the discount itself is already applied.
        return { success: false, error: error.message };
    }
};

module.exports = { sendInvoiceEmail, sendOrderConfirmation, sendDiscountNotification };

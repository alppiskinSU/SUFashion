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

module.exports = { sendInvoiceEmail };

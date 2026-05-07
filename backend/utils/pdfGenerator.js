const PDFDocument = require('pdfkit');

const generateInvoicePdf = (orderData) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const buffers = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfData = Buffer.concat(buffers);
                resolve(pdfData);
            });

            // Invoice Header
            doc.fontSize(20).text('SUFASHION - INVOICE', { align: 'center' });
            doc.moveDown();
            
            // Invoice Details
            doc.fontSize(10).text(`Order No: ${orderData.id}`);
            if (orderData.created_at) {
                doc.text(`Date: ${new Date(orderData.created_at).toLocaleDateString()}`);
            }
            doc.text(`Customer ID: ${orderData.user_id}`);
            doc.moveDown(2);

            // Table Headers
            doc.fontSize(12).text('Product Detail', 50, doc.y, { continued: true })
               .text('Qty', 300, doc.y, { continued: true })
               .text('Unit Price', 400, doc.y, { continued: true })
               .text('Total', 480, doc.y);
            
            doc.moveTo(50, doc.y + 10).lineTo(550, doc.y + 10).stroke();
            doc.moveDown(1.5);

            const quantity = orderData.quantity || 1;
            const totalPrice = parseFloat(orderData.total_price || 0);
            const unitPrice = totalPrice / quantity;
            const productName = orderData.products?.name || `Product ID: ${orderData.product_id}`;

            doc.fontSize(10).text(productName, 50, doc.y, { width: 230, continued: true })
               .text(quantity.toString(), 300, doc.y, { continued: true })
               .text(`$${unitPrice.toFixed(2)}`, 400, doc.y, { continued: true })
               .text(`$${totalPrice.toFixed(2)}`, 480, doc.y);
            
            doc.moveDown(1.5);
            doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
            doc.moveDown(2);

            // Grand Total
            doc.fontSize(14).text(`Grand Total: $${totalPrice.toFixed(2)}`, { align: 'right' });

            doc.moveDown(4);
            doc.fontSize(10).text('Thank you for choosing SUFashion.', { align: 'center' });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};

module.exports = { generateInvoicePdf };

const express = require('express');
const router = express.Router();
const { supabase } = require('../db'); 
const { authMiddleware } = require('../middleware/authMiddleware'); 
// Create an order and reduce stock
router.post('/', authMiddleware, async (req, res) => {
  const { product_id, quantity } = req.body;
  const user_id = req.user.id; // Comes safely from the authMiddleware

  try {
    // 1. Check if the product exists and get its stock/price
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('stock, price')
      .eq('id', product_id)
      .single();

    if (fetchError || !product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // 2. Check if there is enough 
    if (product.stock < quantity) {
      return res.status(400).json({ error: 'Not enough stock available' });
    }

    const total_price = product.price * quantity;

    // 3. Reduce the stock 
    const { error: updateError } = await supabase
      .from('products')
      .update({ stock: product.stock - quantity })
      .eq('id', product_id);

    if (updateError) throw updateError;

    // 4. Create the new order
    const { error: insertError } = await supabase
      .from('orders')
      .insert([{ 
        user_id: user_id, 
        product_id: product_id, 
        quantity: quantity, 
        total_price: total_price 
      }]);

    if (insertError) throw insertError;

    res.status(201).json({ message: 'Order created successfully!', total_price });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
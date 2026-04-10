const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/auth',     require('./routes/authRoutes'));
app.use('/api/cart',     require('./routes/cartRoutes'));
app.use('/api/reviews',  require('./routes/reviewRoutes'));
app.use('/api/orders',   require('./routes/orderRoutes'));

app.get('/', (req, res) => res.json({ message: 'SUFashion API çalışıyor' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Sunucu ${PORT} portunda çalışıyor`));

module.exports = app;
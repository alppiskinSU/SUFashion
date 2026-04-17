import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Collections from './pages/Collections';
import Checkout from './pages/Checkout';
import ProductDetail from './pages/ProductDetail';
import OrderConfirmation from './pages/OrderConfirmation';
import OrderTracking from './pages/OrderTracking';
import About from './pages/About';
import Search from './pages/Search';

function App() {
  return (
    <div className="app-container">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/collections" element={<Collections />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />
        <Route path="/my-orders" element={<OrderTracking />} />
        <Route path="/about" element={<About />} />
        <Route path="/search" element={<Search />} />
      </Routes>
    </div>
  );
}

export default App;

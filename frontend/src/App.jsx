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
import Favorites from './pages/Favorites';
import Contact from './pages/Contact';
import AdminPanel from './pages/AdminPanel';
import RequireAuth from './components/RequireAuth';
import BlockAdmin from './components/BlockAdmin';

function App() {
  return (
    <div className="app-container">
      <Routes>
        {/* Customer storefront — admins are redirected to /admin */}
        <Route path="/"                          element={<BlockAdmin><Home /></BlockAdmin>} />
        <Route path="/collections"               element={<BlockAdmin><Collections /></BlockAdmin>} />
        <Route path="/checkout"                  element={<BlockAdmin><RequireAuth><Checkout /></RequireAuth></BlockAdmin>} />
        <Route path="/product/:id"               element={<BlockAdmin><ProductDetail /></BlockAdmin>} />
        <Route path="/order-confirmation/:orderId" element={<BlockAdmin><OrderConfirmation /></BlockAdmin>} />
        <Route path="/my-orders"                 element={<BlockAdmin><OrderTracking /></BlockAdmin>} />
        <Route path="/about"                     element={<BlockAdmin><About /></BlockAdmin>} />
        <Route path="/search"                    element={<BlockAdmin><Search /></BlockAdmin>} />
        <Route path="/favorites"                 element={<BlockAdmin><Favorites /></BlockAdmin>} />
        <Route path="/contact"                   element={<BlockAdmin><Contact /></BlockAdmin>} />

        {/* Auth pages — open to everyone */}
        <Route path="/login"                     element={<Login />} />
        <Route path="/signup"                    element={<Signup />} />

        {/* Admin */}
        <Route path="/admin"                     element={<AdminPanel />} />
      </Routes>
    </div>
  );
}

export default App;

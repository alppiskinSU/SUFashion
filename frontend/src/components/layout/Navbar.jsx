import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Heart, ShoppingBag, User, LogOut, Package } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import QuickLookDrawer from './QuickLookDrawer';

export default function Navbar() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [user, setUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { cartCount } = useCart();

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch { setUser(null); }
    } else {
      setUser(null);
    }
  }, [location]);

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  };

  return (
    <>
      <nav className="fixed top-0 w-full z-50 bg-surface-container/70 backdrop-blur-xl flex justify-between items-center px-8 py-6 max-w-full glass-panel">
        <div className="flex items-center gap-12">
          <Link to="/" className="flex items-center">
            <img src="/sufashion-logo-w.svg" alt="SUFashion Logo" className="h-10 md:h-12 w-auto object-contain scale-[1.5] origin-left" />
          </Link>
          <div className="hidden md:flex gap-8 items-center text-xs uppercase tracking-widest font-medium font-sans mt-1">
            <Link to="/" className={`pb-1 border-b-2 transition-colors ${location.pathname === '/' ? 'text-primary border-primary' : 'text-outline border-transparent hover:text-primary'}`}>New Arrivals</Link>
            <Link to="/collections" className={`pb-1 border-b-2 transition-colors ${location.pathname === '/collections' ? 'text-primary border-primary' : 'text-outline border-transparent hover:text-primary'}`}>Collections</Link>
            <Link to="/about" className={`pb-1 border-b-2 transition-colors ${location.pathname === '/about' ? 'text-primary border-primary' : 'text-outline border-transparent hover:text-primary'}`}>About</Link>
          </div>
        </div>
        <div className="flex items-center gap-6 text-primary">
          <button
            onClick={() => navigate('/search')}
            className="hover:opacity-80 transition-opacity flex items-center justify-center"
          >
            <Search className="w-[22px] h-[22px]" strokeWidth={1} />
          </button>
          <button className="hover:opacity-80 transition-opacity relative flex items-center justify-center">
            <Heart className="w-[22px] h-[22px]" strokeWidth={1} />
          </button>
          <button 
            className="hover:opacity-80 transition-opacity relative flex items-center justify-center"
            onClick={() => setIsCartOpen(true)}
          >
            <ShoppingBag className="w-[22px] h-[22px]" strokeWidth={1} />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-secondary w-4 h-4 text-[10px] flex items-center justify-center text-on-secondary-container font-bold rounded-none">{cartCount}</span>
            )}
          </button>
          <div className="relative group">
            <button className="hover:opacity-80 transition-opacity flex items-center justify-center gap-2">
              <User className="w-[22px] h-[22px]" strokeWidth={1} />
              {user && (
                <span className="hidden md:inline text-[10px] uppercase tracking-widest font-bold">{user.name || 'Account'}</span>
              )}
            </button>
            <div className="absolute right-0 top-full mt-3 w-44 bg-surface-container shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              {user ? (
                <>
                  <div className="px-5 py-3 border-b border-outline-variant">
                    <p className="text-[10px] uppercase tracking-widest text-outline">Signed in as</p>
                    <p className="text-[11px] font-bold text-primary truncate mt-0.5">{user.name || user.email}</p>
                  </div>
                  <Link to="/my-orders" className="flex items-center gap-2 px-5 py-3 text-[11px] uppercase tracking-widest text-primary hover:bg-surface-container-high transition-colors">
                    <Package className="w-3.5 h-3.5" strokeWidth={1.5} />
                    My Orders
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left flex items-center gap-2 px-5 py-3 text-[11px] uppercase tracking-widest text-primary hover:bg-surface-container-high transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" strokeWidth={1.5} />
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="block px-5 py-3 text-[11px] uppercase tracking-widest text-primary hover:bg-surface-container-high transition-colors">
                    Sign In
                  </Link>
                  <Link to="/signup" className="block px-5 py-3 text-[11px] uppercase tracking-widest text-primary hover:bg-surface-container-high transition-colors">
                    Create Account
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <QuickLookDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}

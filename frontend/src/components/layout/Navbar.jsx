import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Heart, ShoppingBag, User } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import QuickLookDrawer from './QuickLookDrawer';

export default function Navbar() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const location = useLocation();
  const { cartCount } = useCart();

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
          <button className="hover:opacity-80 transition-opacity flex items-center justify-center">
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
            <button className="hover:opacity-80 transition-opacity flex items-center justify-center">
              <User className="w-[22px] h-[22px]" strokeWidth={1} />
            </button>
            <div className="absolute right-0 top-full mt-3 w-44 bg-surface-container shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <Link to="/login" className="block px-5 py-3 text-[11px] uppercase tracking-widest text-primary hover:bg-surface-container-high transition-colors">
                Sign In
              </Link>
              <Link to="/my-orders" className="block px-5 py-3 text-[11px] uppercase tracking-widest text-primary hover:bg-surface-container-high transition-colors">
                My Orders
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <QuickLookDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}

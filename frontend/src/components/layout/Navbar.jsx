import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Heart, ShoppingBag, User } from 'lucide-react';
import QuickLookDrawer from './QuickLookDrawer';

export default function Navbar() {
  const [isCartOpen, setIsCartOpen] = useState(false);

  return (
    <>
      <nav className="fixed top-0 w-full z-50 bg-surface-container/70 backdrop-blur-xl flex justify-between items-center px-8 py-6 max-w-full glass-panel">
        <div className="flex items-center gap-12">
          <Link to="/" className="flex items-center">
            <img src="/sufashion-logo-w.svg" alt="SUFashion Logo" className="h-10 md:h-12 w-auto object-contain scale-[1.5] origin-left" />
          </Link>
          <div className="hidden md:flex gap-8 items-center text-xs uppercase tracking-widest font-medium font-sans mt-1">
            <Link to="/" className="text-primary border-b-2 border-primary pb-1">New Arrivals</Link>
            <Link to="/" className="text-outline hover:text-primary transition-colors pb-1 border-b-2 border-transparent">Collections</Link>
            <Link to="/" className="text-outline hover:text-primary transition-colors pb-1 border-b-2 border-transparent">Editorial</Link>
            <Link to="/" className="text-outline hover:text-primary transition-colors pb-1 border-b-2 border-transparent">Atelier</Link>
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
            <span className="absolute -top-1.5 -right-1.5 bg-secondary w-4 h-4 text-[10px] flex items-center justify-center text-on-secondary-container font-bold rounded-none">2</span>
          </button>
          <Link to="/login" className="hover:opacity-80 transition-opacity flex items-center justify-center">
            <User className="w-[22px] h-[22px]" strokeWidth={1} />
          </Link>
        </div>
      </nav>

      <QuickLookDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}

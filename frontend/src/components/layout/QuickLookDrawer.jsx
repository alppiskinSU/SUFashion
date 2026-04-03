import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../ui/Button';
import { X } from 'lucide-react';

export default function QuickLookDrawer({ isOpen, onClose }) {
  return (
    <div 
      className={`fixed inset-0 z-[60] transition-opacity duration-500 ${
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-primary/20 backdrop-blur-sm cursor-pointer"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div 
        className={`absolute right-0 top-0 h-full w-[450px] max-w-full bg-surface-container-lowest transition-transform duration-700 ease-heavy p-12 flex flex-col shadow-ghost select-none ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex justify-between items-center mb-16">
          <h2 className="text-3xl font-serif italic text-primary">Your Bag</h2>
          <button onClick={onClose} className="text-outline hover:text-primary transition-colors flex items-center justify-center">
            <X className="w-6 h-6" strokeWidth={1} />
          </button>
        </div>

        <div className="flex-1 space-y-8 overflow-y-auto hidden-scrollbar pr-2">
          {/* Mock Cart Item */}
          <div className="flex gap-6 group">
            <div className="w-24 h-32 bg-surface-container flex-none overflow-hidden">
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD9OeHNJRVwTzVFdQ5_kDymgp3PR6niaoAT_qMhe_0plRNsdnytCS3wQ5TYqN6vw14VqlVhZnPvSzmbfWBoXkUUXu3Yyk3IAaD3MWBwMklU1gxyVAM1jiNrIykmJ7gDfvSbzsCTnP6rBdGS3KRG-rEnjA5x3phC1BDUJ5naLK3owehWcdbnrJ1MvTEuPSHreVaCYge3Z8wt1_PeZ9ZG970QqI3y4XFdeiv7wHFIY6F7u6PF5WcIM3NXFcxpespGgVhslB1-HhJxRlw" 
                alt="thumbnail" 
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
              />
            </div>
            <div className="flex-1 py-1 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-primary truncate pr-2">Cashmere Wrap Coat</h4>
                  <p className="text-sm font-medium text-primary">$2,450</p>
                </div>
                <p className="text-xs text-outline mt-1 uppercase tracking-widest">Oatmeal / Size M</p>
              </div>
              <div className="flex items-center gap-4 mt-4">
                <span className="text-xs uppercase tracking-widest text-outline">Qty: 1</span>
                <button className="text-[10px] uppercase tracking-widest font-bold underline text-outline hover:text-primary transition-colors">Remove</button>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-outline-variant pt-8 mt-8">
          <div className="flex justify-between mb-8">
            <span className="text-sm uppercase tracking-widest font-bold text-primary">Total</span>
            <span className="text-xl font-medium text-primary">$2,450.00</span>
          </div>
          <Link to="/checkout" onClick={onClose} className="w-full block">
            <Button variant="secondary" className="w-full">
              Proceed to Checkout
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../ui/Button';
import { X } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';

export default function QuickLookDrawer({ isOpen, onClose }) {
  const { items, removeFromCart, cartTotal } = useCart();
  const fmt = (n) => n.toLocaleString(undefined, { minimumFractionDigits: 2 });

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
          {items.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-4 opacity-60">
              <p className="text-sm uppercase tracking-widest text-outline">Your bag is empty</p>
              <Link to="/collections" onClick={onClose} className="text-xs uppercase tracking-widest text-primary underline underline-offset-4 font-bold">
                Explore Collections
              </Link>
            </div>
          )}

          {items.map(item => (
            <div key={item.id} className="flex gap-6 group">
              <div className="w-24 h-32 bg-surface-container flex-none overflow-hidden">
                <img 
                  src={item.image} 
                  alt={item.name} 
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                />
              </div>
              <div className="flex-1 py-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-primary truncate pr-2">{item.name}</h4>
                    <p className="text-sm font-medium text-primary shrink-0">${fmt(item.price)}</p>
                  </div>
                  {(item.color || item.size) && (
                    <p className="text-xs text-outline mt-1 uppercase tracking-widest">
                      {[item.color, item.size ? `Size ${item.size}` : ''].filter(Boolean).join(' / ')}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-4">
                  <span className="text-xs uppercase tracking-widest text-outline">Qty: {item.quantity}</span>
                  <button 
                    onClick={() => removeFromCart(item.id)}
                    className="text-[10px] uppercase tracking-widest font-bold underline text-outline hover:text-primary transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {items.length > 0 && (
          <div className="border-t border-outline-variant pt-8 mt-8">
            <div className="flex justify-between mb-8">
              <span className="text-sm uppercase tracking-widest font-bold text-primary">Total</span>
              <span className="text-xl font-medium text-primary">${fmt(cartTotal)}</span>
            </div>
            <Link to="/checkout" onClick={onClose} className="w-full block">
              <Button variant="secondary" className="w-full">
                Proceed to Checkout
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

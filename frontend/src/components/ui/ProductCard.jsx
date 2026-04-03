import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Plus } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';

export default function ProductCard({ 
  product, 
  doubleColumn = false, 
  onAdd 
}) {
  const { addToCart } = useCart();

  const handleAdd = () => {
    if (onAdd) { onAdd(); return; }
    addToCart(product, 1);
  };
  return (
    <div className={`group relative ${doubleColumn ? 'lg:col-span-2' : ''}`}>
      <div 
        className={`overflow-hidden bg-surface-container mb-6 relative ${
          doubleColumn ? 'aspect-[16/9]' : 'aspect-[3/4]'
        }`}
      >
        <Link to={`/product/${product.id || 1}`}>
          <img 
            src={product.image} 
            alt={product.name} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
          />
        </Link>
        
        {product.isSoldOut && (
          <div className="absolute inset-0 bg-primary/40 flex items-center justify-center backdrop-blur-[2px]">
            <span className="bg-white text-primary px-6 py-2 text-[10px] uppercase tracking-widest font-bold">
              Sold Out
            </span>
          </div>
        )}

        {product.isLimited && (
          <div className="absolute top-6 left-6 bg-white shrink-0 px-3 py-1 text-[10px] uppercase tracking-widest font-bold text-primary z-10">
            Limited Edition
          </div>
        )}

        {!product.isSoldOut && (
          <button 
            onClick={handleAdd}
            className={`absolute bottom-6 right-6 w-12 h-12 flex items-center justify-center opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 z-10 ${
              product.useCartIcon ? 'bg-secondary-container text-on-secondary-container' : 'bg-primary text-white'
            }`}
          >
            {product.useCartIcon ? (
              <ShoppingCart className="w-5 h-5" strokeWidth={1} />
            ) : (
              <Plus className="w-5 h-5" strokeWidth={1} />
            )}
          </button>
        )}
      </div>

      {doubleColumn ? (
        <div className="flex justify-between items-start gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-outline font-bold mb-1">{product.category}</p>
            <Link to={`/product/${product.id || 1}`}>
              <h3 className="text-2xl font-serif italic leading-none mb-2 text-primary hover:opacity-80 transition-opacity">{product.name}</h3>
            </Link>
            {product.description && (
              <p className="text-sm text-outline font-light max-w-md">{product.description}</p>
            )}
          </div>
          <p className="text-xl font-medium text-primary shrink-0">${product.price.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
        </div>
      ) : (
        <>
          <p className="text-[10px] uppercase tracking-[0.2em] text-outline mb-1">{product.category}</p>
          <Link to={`/product/${product.id || 1}`}>
            <h3 className="text-lg font-serif italic mb-2 text-primary line-clamp-1 hover:opacity-80 transition-opacity">{product.name}</h3>
          </Link>
          
          <div className="flex items-center gap-3">
            <p className={`text-base font-medium ${product.oldPrice ? 'text-primary' : 'text-primary'}`}>
              ${product.price.toLocaleString(undefined, {minimumFractionDigits: 2})}
            </p>
            {product.oldPrice && (
              <p className="text-xs text-outline line-through">
                ${product.oldPrice.toLocaleString(undefined, {minimumFractionDigits: 2})}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

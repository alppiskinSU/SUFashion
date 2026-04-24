import React, { createContext, useContext, useState, useCallback } from 'react';

const CartContext = createContext();

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  const addToCart = useCallback((product, qty = 1) => {
    setItems(prev => {
      const stock = product.quantity ?? 99;
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        const newQty = Math.min(existing.quantity + qty, stock);
        if (newQty === existing.quantity) return prev;
        return prev.map(i =>
          i.id === product.id ? { ...i, quantity: newQty } : i
        );
      }
      return [...prev, {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        category: product.category,
        size: product.size || 'One Size',
        color: product.color || '',
        quantity: Math.min(qty, stock),
        stock,
      }];
    });
  }, []);

  const removeFromCart = useCallback((id) => {
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const updateQuantity = useCallback((id, newQty) => {
    if (newQty < 1) return removeFromCart(id);
    setItems(prev => prev.map(i =>
      i.id === id ? { ...i, quantity: Math.min(newQty, i.stock) } : i
    ));
  }, [removeFromCart]);

  const clearCart = useCallback(() => setItems([]), []);

  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const cartTotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, cartCount, cartTotal }}>
      {children}
    </CartContext.Provider>
  );
}

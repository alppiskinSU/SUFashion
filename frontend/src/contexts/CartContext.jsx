import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';

const CartContext = createContext();

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

/**
 * Resolve the active cart storage key based on the currently logged in user.
 * Logged-in users get their own bucket so each account keeps its own cart and
 * a fresh login on a shared device never inherits the previous account's bag.
 * Logged-out (guest) carts live in memory only — they are wiped on sign-out.
 */
function getActiveCartKey() {
  try {
    const stored = localStorage.getItem('user');
    if (!stored) return null;
    const user = JSON.parse(stored);
    return user?.id ? `cart:${user.id}` : null;
  } catch {
    return null;
  }
}

function readCart(key) {
  if (!key) return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [cartKey, setCartKey] = useState(() => getActiveCartKey());
  const [items, setItems] = useState(() => readCart(getActiveCartKey()));
  const skipNextPersist = useRef(false);

  // Keep the in-memory cart in sync with the active storage bucket. When the
  // user changes (login / logout / swap account) we re-load that bucket and
  // suppress the next persist so we don't accidentally overwrite it.
  useEffect(() => {
    const syncFromActiveUser = () => {
      const nextKey = getActiveCartKey();
      setCartKey(prevKey => {
        if (prevKey === nextKey) return prevKey;
        
        setItems(prevItems => {
          const userItems = readCart(nextKey);
          
          // If transitioning from guest (null key) with items to a logged-in user, merge items
          if (prevKey === null && prevItems.length > 0) {
            const merged = [...userItems];
            for (const item of prevItems) {
              const existing = merged.find(i => i.id === item.id);
              if (existing) {
                existing.quantity = Math.min(existing.quantity + item.quantity, item.stock || 99);
              } else {
                merged.push(item);
              }
            }
            // We merged new items, so DO NOT skip the next persist! We want to save this to localStorage.
            skipNextPersist.current = false;
            return merged;
          }
          
          skipNextPersist.current = true;
          return userItems;
        });

        return nextKey;
      });
    };

    const handleStorage = (e) => {
      if (!e || e.key === 'user' || e.key === null) syncFromActiveUser();
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('auth-changed', syncFromActiveUser);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('auth-changed', syncFromActiveUser);
    };
  }, []);

  // Persist cart for logged-in users. Guests (cartKey === null) keep an
  // in-memory cart only, which is wiped automatically when they sign out.
  useEffect(() => {
    if (skipNextPersist.current) {
      skipNextPersist.current = false;
      return;
    }
    if (!cartKey) return;
    try {
      localStorage.setItem(cartKey, JSON.stringify(items));
    } catch {
      /* storage might be full or disabled — ignore */
    }
  }, [items, cartKey]);

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

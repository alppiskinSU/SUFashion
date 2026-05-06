import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Trash2 } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { useCart } from '../contexts/CartContext';

function FavoriteCard({ product, onRemove }) {
  const { addToCart } = useCart();
  const fmt = (n) => n.toLocaleString(undefined, { minimumFractionDigits: 2 });

  return (
    <div className="group relative">
      <div className="relative overflow-hidden bg-surface-container aspect-[3/4] mb-4">
        <Link to={`/product/${product.id}`}>
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

        {product.isLimited && !product.isSoldOut && (
          <div className="absolute top-4 left-4 bg-white px-3 py-1 text-[10px] uppercase tracking-widest font-bold text-primary z-10">
            Limited Edition
          </div>
        )}

        {/* Remove button */}
        <button
          onClick={() => onRemove(product.id)}
          className="absolute top-4 right-4 w-9 h-9 bg-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-red-50 z-10"
          title="Remove from favorites"
        >
          <Trash2 className="w-4 h-4 text-red-500" strokeWidth={1.5} />
        </button>

        {/* Add to bag button */}
        {!product.isSoldOut && (
          <button
            onClick={() => addToCart(product, 1)}
            className="absolute bottom-4 left-0 right-0 mx-4 py-3 bg-primary text-white text-[10px] uppercase tracking-widest font-bold opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 z-10"
          >
            Add to Bag
          </button>
        )}
      </div>

      <p className="text-[10px] uppercase tracking-[0.2em] text-outline mb-1">{product.category}</p>
      <Link to={`/product/${product.id}`}>
        <h3 className="text-lg font-serif italic text-primary hover:opacity-70 transition-opacity line-clamp-1 mb-1">
          {product.name}
        </h3>
      </Link>
      <div className="flex items-center gap-3">
        <span className="text-base font-medium text-primary">${fmt(product.price)}</span>
        {product.oldPrice && (
          <span className="text-xs text-outline line-through">${fmt(product.oldPrice)}</span>
        )}
      </div>
    </div>
  );
}

export default function Favorites() {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/login');
      return;
    }

    const token = localStorage.getItem('token');
    fetch('http://localhost:3000/api/favorites', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => setFavorites(data.favorites ?? []))
      .catch(() => setFavorites([]))
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleRemove = async (productId) => {
    const token = localStorage.getItem('token');
    await fetch(`http://localhost:3000/api/favorites/${productId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    setFavorites(prev => prev.filter(p => p.id !== productId));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-surface">
        <Navbar />
        <div className="flex-grow flex items-center justify-center pt-24">
          <p className="text-outline text-xs uppercase tracking-widest animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Navbar />

      <main className="flex-grow pt-28 pb-20 px-6 md:px-12 lg:px-24">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-outline hover:text-primary text-xs uppercase tracking-widest font-bold mb-12 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" strokeWidth={1.5} />
          Back to Home
        </Link>

        <div className="flex items-start gap-6 mb-16">
          <Heart className="w-10 h-10 text-primary flex-none mt-1" strokeWidth={1} />
          <div>
            <h1 className="font-serif italic text-4xl md:text-5xl text-primary leading-tight">
              My Favorites
            </h1>
            <p className="text-outline text-sm uppercase tracking-widest mt-3">
              {favorites.length} item{favorites.length !== 1 ? 's' : ''} saved
            </p>
          </div>
        </div>

        {favorites.length === 0 ? (
          <div className="text-center py-32">
            <Heart className="w-16 h-16 text-outline mx-auto mb-6" strokeWidth={0.75} />
            <p className="text-outline text-sm uppercase tracking-widest mb-8">
              No favorites yet
            </p>
            <Link
              to="/collections"
              className="text-xs uppercase tracking-widest font-bold text-primary hover:text-outline transition-colors"
            >
              Explore Collections →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
            {favorites.map(product => (
              <FavoriteCard key={product.id} product={product} onRemove={handleRemove} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

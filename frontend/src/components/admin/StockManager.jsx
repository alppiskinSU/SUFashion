import { useEffect, useState } from 'react';
import { Boxes, RefreshCw, Save, AlertTriangle, Search } from 'lucide-react';
import { authFetch } from '../../lib/authFetch';

const API_BASE = 'http://localhost:3000';

/**
 * Lightweight inventory editor for the admin panel. Lists every product and
 * lets a manager update its quantity with a PATCH /api/products/:id call.
 *
 * Kept in its own file so AdminPanel.jsx stays focused on review/order
 * moderation while the stock UI can grow independently.
 */
export default function StockManager({ onToast }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [savingId, setSavingId] = useState(null);
  const [drafts, setDrafts]     = useState({}); // id -> string quantity input
  const [search, setSearch]     = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/products`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load products');
      const list = (data.products ?? []).slice().sort((a, b) =>
        (a.name || '').localeCompare(b.name || '')
      );
      setProducts(list);
      setDrafts(Object.fromEntries(list.map(p => [p.id, String(p.quantity ?? 0)])));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDraftChange = (id, value) => {
    const cleaned = value.replace(/\D/g, '');
    setDrafts(prev => ({ ...prev, [id]: cleaned }));
  };

  const handleSave = async (product) => {
    const raw = drafts[product.id];
    const next = Number(raw);
    if (!Number.isFinite(next) || next < 0) {
      onToast?.('error', 'Quantity must be a non-negative number.');
      return;
    }
    if (next === product.quantity) return;

    setSavingId(product.id);
    try {
      const res = await authFetch(`${API_BASE}/api/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');

      setProducts(prev =>
        prev.map(p => (p.id === product.id ? { ...p, quantity: data.product.quantity } : p))
      );
      onToast?.('approve', `${product.name}: stock updated to ${data.product.quantity}`);
    } catch (err) {
      onToast?.('error', err.message);
    } finally {
      setSavingId(null);
    }
  };

  const filtered = products.filter(p =>
    (p.name || '').toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <section>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mb-6">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-outline" strokeWidth={1.5} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products…"
            className="w-full pl-9 pr-3 py-2 bg-surface-container border border-outline-variant text-xs text-primary placeholder:text-outline focus:border-primary outline-none"
          />
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 border border-outline-variant text-[10px] uppercase tracking-widest font-bold text-primary hover:bg-surface-container-high transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} strokeWidth={1.5} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 px-6 py-4 bg-red-50 border border-red-200 mb-6">
          <AlertTriangle className="w-4 h-4 text-red-500" strokeWidth={1.5} />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {loading ? (
        <p className="text-outline text-xs uppercase tracking-widest animate-pulse py-24 text-center">
          Loading inventory…
        </p>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Boxes className="w-12 h-12 text-outline" strokeWidth={1} />
          <p className="text-sm text-outline uppercase tracking-widest">
            {products.length === 0 ? 'No products in catalog' : 'No products match your search'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-outline border-b border-outline-variant">
                <th className="py-3 pr-4">Product</th>
                <th className="py-3 pr-4">Category</th>
                <th className="py-3 pr-4">Price</th>
                <th className="py-3 pr-4">Current Stock</th>
                <th className="py-3 pr-4">New Stock</th>
                <th className="py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const draft = drafts[p.id] ?? String(p.quantity ?? 0);
                const dirty = Number(draft) !== Number(p.quantity ?? 0);
                const lowStock = (p.quantity ?? 0) > 0 && (p.quantity ?? 0) <= 5;
                const outOfStock = (p.quantity ?? 0) === 0;
                return (
                  <tr key={p.id} className="border-b border-outline-variant/40 align-middle">
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-3">
                        {p.image_url || p.image ? (
                          <img
                            src={p.image_url || p.image}
                            alt={p.name}
                            className="w-10 h-12 object-cover bg-surface-container"
                          />
                        ) : (
                          <div className="w-10 h-12 bg-surface-container" />
                        )}
                        <span className="text-xs font-bold text-primary">{p.name}</span>
                      </div>
                    </td>
                    <td className="py-4 pr-4 text-xs text-outline">{p.category || '—'}</td>
                    <td className="py-4 pr-4 text-xs text-primary">${Number(p.price ?? 0).toFixed(2)}</td>
                    <td className="py-4 pr-4">
                      <span className={`inline-block px-2 py-1 text-[10px] uppercase tracking-widest font-bold ${
                        outOfStock ? 'bg-red-100 text-red-800'
                        : lowStock ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {p.quantity ?? 0}
                      </span>
                    </td>
                    <td className="py-4 pr-4">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={draft}
                        onChange={e => handleDraftChange(p.id, e.target.value)}
                        className="w-24 px-2 py-1.5 bg-surface-container border border-outline-variant text-xs text-primary focus:border-primary outline-none"
                      />
                    </td>
                    <td className="py-4">
                      <button
                        onClick={() => handleSave(p)}
                        disabled={!dirty || savingId === p.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-[10px] uppercase tracking-widest font-bold hover:brightness-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Save className="w-3.5 h-3.5" strokeWidth={2} />
                        {savingId === p.id ? 'Saving…' : 'Save'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

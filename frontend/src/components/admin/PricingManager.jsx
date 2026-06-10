import { useEffect, useState } from 'react';
import { RefreshCw, Save, AlertTriangle, Search, Tags } from 'lucide-react';
import { authFetch } from '../../lib/authFetch';

const API_BASE = 'http://localhost:3000';

/**
 * Req 11 — sales manager sets the prices of the products.
 * Edits price, old price and unit cost via PATCH /api/products/:id
 * (the backend restricts sales managers to exactly these fields).
 */
export default function PricingManager({ onToast }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [savingId, setSavingId] = useState(null);
  const [drafts, setDrafts]     = useState({}); // id -> { price, old_price, cost }
  const [search, setSearch]     = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await authFetch(`${API_BASE}/api/products/admin/pricing`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load products');
      const list = data.products ?? [];
      setProducts(list);
      setDrafts(Object.fromEntries(list.map(p => [p.id, {
        price:     p.price != null ? String(p.price) : '',
        old_price: p.old_price != null ? String(p.old_price) : '',
        cost:      p.cost != null ? String(p.cost) : '',
      }])));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDraftChange = (id, field, value) => {
    const cleaned = value.replace(/[^0-9.]/g, '');
    setDrafts(prev => ({ ...prev, [id]: { ...prev[id], [field]: cleaned } }));
  };

  const isDirty = (p) => {
    const d = drafts[p.id];
    if (!d) return false;
    const same = (a, b) => (a === '' ? null : Number(a)) === (b ?? null);
    return !same(d.price, p.price) || !same(d.old_price, p.old_price) || !same(d.cost, p.cost);
  };

  const handleSave = async (product) => {
    const d = drafts[product.id];
    const price = Number(d.price);
    if (!d.price || !Number.isFinite(price) || price <= 0) {
      onToast?.('error', 'Price must be a positive number.');
      return;
    }

    const body = { price };
    body.old_price = d.old_price === '' ? null : Number(d.old_price);
    body.cost      = d.cost === '' ? null : Number(d.cost);

    setSavingId(product.id);
    try {
      const res = await authFetch(`${API_BASE}/api/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');

      setProducts(prev => prev.map(p => (p.id === product.id
        ? { ...p, price: data.product.price, old_price: data.product.old_price, cost: data.product.cost }
        : p
      )));
      onToast?.('approve', `${product.name}: price updated to $${Number(data.product.price).toFixed(2)}`);
    } catch (err) {
      onToast?.('error', err.message);
    } finally {
      setSavingId(null);
    }
  };

  const filtered = products.filter(p =>
    (p.name || '').toLowerCase().includes(search.trim().toLowerCase())
  );

  const moneyInput = (id, field, placeholder) => (
    <input
      type="text"
      inputMode="decimal"
      value={drafts[id]?.[field] ?? ''}
      placeholder={placeholder}
      onChange={e => handleDraftChange(id, field, e.target.value)}
      className="w-24 px-2 py-1.5 bg-surface-container border border-outline-variant text-xs text-primary focus:border-primary outline-none"
    />
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
          Loading pricing…
        </p>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Tags className="w-12 h-12 text-outline" strokeWidth={1} />
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
                <th className="py-3 pr-4">Unit Cost</th>
                <th className="py-3 pr-4">Old Price</th>
                <th className="py-3 pr-4">Price</th>
                <th className="py-3 pr-4">Margin</th>
                <th className="py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const d = drafts[p.id];
                const margin = d?.price && d?.cost ? Number(d.price) - Number(d.cost) : null;
                return (
                  <tr key={p.id} className="border-b border-outline-variant/40 align-middle">
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-3">
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.name} className="w-10 h-12 object-cover bg-surface-container" />
                        ) : (
                          <div className="w-10 h-12 bg-surface-container" />
                        )}
                        <span className="text-xs font-bold text-primary">{p.name}</span>
                      </div>
                    </td>
                    <td className="py-4 pr-4 text-xs text-outline">{p.category || '—'}</td>
                    <td className="py-4 pr-4">{moneyInput(p.id, 'cost', '0.00')}</td>
                    <td className="py-4 pr-4">{moneyInput(p.id, 'old_price', '—')}</td>
                    <td className="py-4 pr-4">{moneyInput(p.id, 'price', '0.00')}</td>
                    <td className="py-4 pr-4">
                      {margin != null ? (
                        <span className={`text-xs font-bold ${margin >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                          {margin >= 0 ? '+' : '−'}${Math.abs(margin).toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-xs text-outline">—</span>
                      )}
                    </td>
                    <td className="py-4">
                      <button
                        onClick={() => handleSave(p)}
                        disabled={!isDirty(p) || savingId === p.id}
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

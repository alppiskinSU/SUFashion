import { useEffect, useState } from 'react';
import { RefreshCw, AlertTriangle, Search, Plus, Trash2, PackagePlus } from 'lucide-react';
import { authFetch } from '../../lib/authFetch';

const API_BASE = 'http://localhost:3000';

const EMPTY_FORM = {
  name: '', category: '', description: '', price: '', image_url: '',
  quantity: '0', model: '', serial_number: '', warranty_status: '', distributor_info: '',
};

/* ── Custom Confirm / Alert Modal ── */
function ConfirmModal({ open, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', onConfirm, onCancel, variant = 'danger' }) {
  if (!open) return null;
  const isAlert = !onCancel;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-surface-container-low max-w-md w-full border border-outline-variant shadow-2xl p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 flex items-center justify-center flex-none ${
            variant === 'danger' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
          }`}>
            <AlertTriangle className="w-5 h-5" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="font-serif italic text-xl text-primary">{title}</h3>
            <p className="text-sm text-outline mt-2 leading-relaxed font-sans">{message}</p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 pt-2">
          {!isAlert && (
            <button
              onClick={onCancel}
              className="px-6 py-2.5 border border-outline-variant text-[10px] uppercase tracking-widest font-bold text-primary hover:bg-surface-container-high transition-colors"
            >
              {cancelLabel}
            </button>
          )}
          <button
            onClick={onConfirm}
            className={`px-6 py-2.5 text-[10px] uppercase tracking-widest font-bold text-white transition-all ${
              variant === 'danger'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-primary hover:brightness-95'
            }`}
          >
            {isAlert ? 'OK' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Req 12 — product manager adds/removes products.
 * New products are created via POST /api/products; the category dropdown is
 * fed by the categories table so it stays in sync with CategoryManager.
 */
export default function ProductManager({ onToast }) {
  const [products, setProducts]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [search, setSearch]         = useState('');
  const [form, setForm]             = useState(EMPTY_FORM);
  const [creating, setCreating]     = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [resProducts, resCategories] = await Promise.all([
        fetch(`${API_BASE}/api/products`),
        fetch(`${API_BASE}/api/categories`),
      ]);
      const dataProducts   = await resProducts.json();
      const dataCategories = await resCategories.json();
      if (!resProducts.ok) throw new Error(dataProducts.error || 'Failed to load products');

      setProducts((dataProducts.products ?? []).slice().sort((a, b) =>
        (a.name || '').localeCompare(b.name || '')
      ));
      setCategories(dataCategories.categories ?? []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const setField = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleCreate = async (e) => {
    e.preventDefault();
    const price = Number(form.price);
    if (!form.name.trim() || !Number.isFinite(price) || price <= 0) {
      onToast?.('error', 'A product needs at least a name and a positive price.');
      return;
    }

    setCreating(true);
    try {
      const res = await authFetch(`${API_BASE}/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          category: form.category || null,
          description: form.description.trim() || null,
          price,
          image_url: form.image_url.trim() || null,
          quantity: Number(form.quantity) || 0,
          model: form.model.trim() || null,
          serial_number: form.serial_number.trim() || null,
          warranty_status: form.warranty_status.trim() || null,
          distributor_info: form.distributor_info.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Create failed');

      setForm(EMPTY_FORM);
      await load();
      onToast?.('approve', `Product "${data.product.name}" added`);
    } catch (err) {
      onToast?.('error', err.message);
    } finally {
      setCreating(false);
    }
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    const product = productToDelete;
    setProductToDelete(null);
    setDeletingId(product.id);
    try {
      const res = await authFetch(`${API_BASE}/api/products/${product.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Delete failed');

      setProducts(prev => prev.filter(p => p.id !== product.id));
      onToast?.('approve', `Product "${product.name}" removed`);
    } catch (err) {
      onToast?.('error', err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = products.filter(p =>
    (p.name || '').toLowerCase().includes(search.trim().toLowerCase())
  );

  const inputClass = 'w-full px-3 py-2 bg-surface border border-outline-variant text-xs text-primary placeholder:text-outline focus:border-primary outline-none';
  const labelClass = 'text-[10px] uppercase tracking-widest text-outline font-bold';

  return (
    <section>
      <ConfirmModal
        open={!!productToDelete}
        title="Remove Product"
        message={`Are you sure you want to remove "${productToDelete?.name}" from the catalog? This action cannot be undone.`}
        confirmLabel="Yes, Remove"
        cancelLabel="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => setProductToDelete(null)}
        variant="danger"
      />

      {/* Add product form */}
      <form onSubmit={handleCreate} className="p-6 bg-surface-container border border-outline-variant mb-10">
        <div className="flex items-center gap-2 mb-6">
          <PackagePlus className="w-4 h-4 text-primary" strokeWidth={1.5} />
          <h3 className="text-[11px] uppercase tracking-widest font-bold text-primary">Add Product</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Name *</label>
            <input className={inputClass} value={form.name} onChange={setField('name')} placeholder="Silk Evening Scarf" />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Category</label>
            <select className={inputClass} value={form.category} onChange={setField('category')}>
              <option value="">— Uncategorised —</option>
              {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Price ($) *</label>
            <input className={inputClass} inputMode="decimal" value={form.price} onChange={setField('price')} placeholder="129.00" />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Initial Stock</label>
            <input className={inputClass} inputMode="numeric" value={form.quantity} onChange={setField('quantity')} placeholder="0" />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Model</label>
            <input className={inputClass} value={form.model} onChange={setField('model')} placeholder="SES-2026" />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Serial Number</label>
            <input className={inputClass} value={form.serial_number} onChange={setField('serial_number')} placeholder="SN-0001" />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Warranty Status</label>
            <input className={inputClass} value={form.warranty_status} onChange={setField('warranty_status')} placeholder="2 years" />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Distributor</label>
            <input className={inputClass} value={form.distributor_info} onChange={setField('distributor_info')} placeholder="SUFashion Wholesale Ltd." />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Image URL</label>
            <input className={inputClass} value={form.image_url} onChange={setField('image_url')} placeholder="https://…" />
          </div>
        </div>
        <div className="flex flex-col gap-1 mb-6">
          <label className={labelClass}>Description</label>
          <textarea className={`${inputClass} resize-none`} rows={2} value={form.description} onChange={setField('description')} placeholder="Hand-rolled silk scarf…" />
        </div>
        <button
          type="submit"
          disabled={creating}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-[10px] uppercase tracking-widest font-bold hover:brightness-95 transition-all disabled:opacity-50"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={2} />
          {creating ? 'Adding…' : 'Add Product'}
        </button>
      </form>

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
          Loading catalog…
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-outline border-b border-outline-variant">
                <th className="py-3 pr-4">Product</th>
                <th className="py-3 pr-4">Category</th>
                <th className="py-3 pr-4">Model</th>
                <th className="py-3 pr-4">Price</th>
                <th className="py-3 pr-4">Stock</th>
                <th className="py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="border-b border-outline-variant/40 align-middle">
                  <td className="py-4 pr-4">
                    <div className="flex items-center gap-3">
                      {p.image_url || p.image ? (
                        <img src={p.image_url || p.image} alt={p.name} className="w-10 h-12 object-cover bg-surface-container" />
                      ) : (
                        <div className="w-10 h-12 bg-surface-container" />
                      )}
                      <span className="text-xs font-bold text-primary">{p.name}</span>
                    </div>
                  </td>
                  <td className="py-4 pr-4 text-xs text-outline">{p.category || '—'}</td>
                  <td className="py-4 pr-4 text-xs text-outline">{p.model || '—'}</td>
                  <td className="py-4 pr-4 text-xs text-primary">${Number(p.price ?? 0).toFixed(2)}</td>
                  <td className="py-4 pr-4 text-xs text-primary">{p.quantity ?? 0}</td>
                  <td className="py-4 text-right">
                    <button
                      onClick={() => setProductToDelete(p)}
                      disabled={deletingId === p.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-[10px] uppercase tracking-widest font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                      {deletingId === p.id ? 'Removing…' : 'Remove'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

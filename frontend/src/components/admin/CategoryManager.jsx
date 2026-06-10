import { useEffect, useState } from 'react';
import { RefreshCw, AlertTriangle, Plus, Trash2, FolderTree } from 'lucide-react';
import { authFetch } from '../../lib/authFetch';

const API_BASE = 'http://localhost:3000';

/**
 * Req 12 — product manager adds/removes product categories.
 * Deleting a category keeps its products (they become uncategorised).
 */
export default function CategoryManager({ onToast }) {
  const [categories, setCategories] = useState([]);
  const [counts, setCounts]         = useState({}); // category name (lowercase) -> product count
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [newName, setNewName]       = useState('');
  const [creating, setCreating]     = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [resCategories, resProducts] = await Promise.all([
        fetch(`${API_BASE}/api/categories`),
        fetch(`${API_BASE}/api/products`),
      ]);
      const dataCategories = await resCategories.json();
      const dataProducts   = await resProducts.json();
      if (!resCategories.ok) throw new Error(dataCategories.error || 'Failed to load categories');

      const byName = {};
      for (const p of dataProducts.products ?? []) {
        if (!p.category) continue;
        const key = p.category.toLowerCase();
        byName[key] = (byName[key] || 0) + 1;
      }
      setCategories(dataCategories.categories ?? []);
      setCounts(byName);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;

    setCreating(true);
    try {
      const res = await authFetch(`${API_BASE}/api/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Create failed');

      setNewName('');
      await load();
      onToast?.('approve', `Category "${data.category.name}" added`);
    } catch (err) {
      onToast?.('error', err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (category) => {
    const count = counts[category.name.toLowerCase()] || 0;
    const warning = count > 0
      ? `Delete "${category.name}"? Its ${count} product(s) will become uncategorised.`
      : `Delete "${category.name}"?`;
    if (!window.confirm(warning)) return;

    setDeletingId(category.id);
    try {
      const res = await authFetch(`${API_BASE}/api/categories/${category.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Delete failed');

      await load();
      onToast?.('approve', `Category "${category.name}" deleted`);
    } catch (err) {
      onToast?.('error', err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section>
      {/* Add category */}
      <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-4 mb-8 p-6 bg-surface-container border border-outline-variant">
        <div className="flex flex-col gap-1 flex-1 min-w-[220px]">
          <label className="text-[10px] uppercase tracking-widest text-outline font-bold" htmlFor="new-category">New Category</label>
          <input
            id="new-category"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="e.g. Accessories"
            className="px-3 py-2 border border-outline-variant bg-surface text-primary text-xs focus:outline-none focus:border-primary"
          />
        </div>
        <button
          type="submit"
          disabled={creating || !newName.trim()}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-[10px] uppercase tracking-widest font-bold hover:brightness-95 transition-all disabled:opacity-50"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={2} />
          {creating ? 'Adding…' : 'Add Category'}
        </button>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 border border-outline-variant text-[10px] uppercase tracking-widest font-bold text-primary hover:bg-surface-container-high transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} strokeWidth={1.5} />
          Refresh
        </button>
      </form>

      {error && (
        <div className="flex items-center gap-3 px-6 py-4 bg-red-50 border border-red-200 mb-6">
          <AlertTriangle className="w-4 h-4 text-red-500" strokeWidth={1.5} />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {loading ? (
        <p className="text-outline text-xs uppercase tracking-widest animate-pulse py-24 text-center">
          Loading categories…
        </p>
      ) : categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <FolderTree className="w-12 h-12 text-outline" strokeWidth={1} />
          <p className="text-sm text-outline uppercase tracking-widest">No categories yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-outline-variant">
          <table className="w-full text-xs">
            <thead className="bg-surface-container-high">
              <tr className="text-left text-[10px] uppercase tracking-widest text-outline">
                <th className="px-4 py-3 font-bold">Category</th>
                <th className="px-4 py-3 font-bold">Products</th>
                <th className="px-4 py-3 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(c => (
                <tr key={c.id} className="border-t border-outline-variant hover:bg-surface-container-low">
                  <td className="px-4 py-3 font-bold text-primary">{c.name}</td>
                  <td className="px-4 py-3 text-primary">{counts[c.name.toLowerCase()] || 0}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(c)}
                      disabled={deletingId === c.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-[10px] uppercase tracking-widest font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-3 h-3" strokeWidth={2} />
                      {deletingId === c.id ? 'Deleting…' : 'Delete'}
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

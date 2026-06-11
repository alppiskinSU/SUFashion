import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, User, Mail, MapPin, Hash, Shield, Key, Save, CheckCircle, AlertTriangle, Edit3, X, Copy, Check } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { authFetch } from '../lib/authFetch';

export default function MyProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Edit mode
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', home_address: '', tax_id: '', password: '', confirm_password: '' });
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');
  const [copied, setCopied] = useState(false);

  const fetchProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await authFetch('http://localhost:3000/api/auth/profile');
      if (!res.ok) throw new Error('Failed to load profile.');
      const data = await res.json();
      setProfile(data.profile);
      setForm({
        name: data.profile.name || '',
        home_address: data.profile.home_address || '',
        tax_id: data.profile.tax_id || '',
        password: '',
        confirm_password: '',
      });
    } catch (err) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveError('');
    setSaveSuccess('');

    if (form.password && form.password !== form.confirm_password) {
      setSaveError('Passwords do not match.');
      return;
    }

    setSaving(true);
    try {
      const body = {
        name: form.name,
        home_address: form.home_address,
        tax_id: form.tax_id,
      };
      if (form.password) body.password = form.password;

      const res = await authFetch('http://localhost:3000/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile.');

      setProfile(data.profile);
      setSaveSuccess('Profile updated successfully.');
      setEditing(false);
      setForm(prev => ({ ...prev, password: '', confirm_password: '' }));

      // Update session storage with new name
      const stored = sessionStorage.getItem('user');
      if (stored) {
        try {
          const user = JSON.parse(stored);
          user.name = data.profile.name;
          sessionStorage.setItem('user', JSON.stringify(user));
          window.dispatchEvent(new Event('auth-changed'));
        } catch {}
      }

      setTimeout(() => setSaveSuccess(''), 4000);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setSaveError('');
    setForm({
      name: profile?.name || '',
      home_address: profile?.home_address || '',
      tax_id: profile?.tax_id || '',
      password: '',
      confirm_password: '',
    });
  };

  const handleCopyId = () => {
    if (profile?.id) {
      navigator.clipboard.writeText(profile.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Navbar />

      <main className="flex-grow pt-28 pb-20 px-6 md:px-12 lg:px-24">

        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-outline hover:text-primary text-xs uppercase tracking-widest font-bold mb-12 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" strokeWidth={1.5} />
          Back to Home
        </Link>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] uppercase tracking-[0.25em] text-outline font-bold">Account Settings</span>
            </div>
            <h1 className="font-serif italic text-4xl md:text-5xl text-primary leading-tight">
              My Profile
            </h1>
            <p className="text-outline text-sm tracking-wide mt-3 max-w-xl">
              View and manage your personal information. Keep your details up to date for a seamless shopping experience.
            </p>
          </div>
          {!editing && !loading && profile && (
            <button
              onClick={() => setEditing(true)}
              className="self-start md:self-end inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-[10px] uppercase tracking-widest font-bold hover:brightness-95 transition-all"
            >
              <Edit3 className="w-3.5 h-3.5" strokeWidth={1.5} />
              Edit Profile
            </button>
          )}
        </div>

        {/* Success / Error messages */}
        {saveSuccess && (
          <div className="flex items-center gap-3 px-6 py-4 bg-emerald-50 border border-emerald-200 text-emerald-800 mb-8 animate-in fade-in duration-300">
            <CheckCircle className="w-5 h-5 flex-none" strokeWidth={1.5} />
            <p className="text-sm font-sans">{saveSuccess}</p>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 px-6 py-4 bg-red-50 border border-red-200 text-red-800 mb-8">
            <AlertTriangle className="w-5 h-5 flex-none" strokeWidth={1.5} />
            <p className="text-sm font-sans">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="py-24 text-center">
            <p className="text-outline text-xs uppercase tracking-widest animate-pulse">Loading profile...</p>
          </div>
        ) : profile ? (
          <div className="max-w-3xl">
            {editing ? (
              /* ── Edit Mode ── */
              <form onSubmit={handleSave} className="space-y-0">
                {/* Customer ID — read-only */}
                <div className="bg-surface-container-low border border-outline-variant p-6 flex items-center gap-5">
                  <div className="w-10 h-10 bg-surface-container flex items-center justify-center flex-none">
                    <Hash className="w-4 h-4 text-outline" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] uppercase tracking-widest text-outline font-bold mb-1">Customer ID</p>
                    <p className="text-xs text-primary font-mono truncate">{profile.id}</p>
                  </div>
                  <span className="text-[9px] uppercase tracking-widest text-outline px-2 py-1 bg-surface-container border border-outline-variant">Read Only</span>
                </div>

                {/* Email — read-only */}
                <div className="bg-surface-container-low border border-outline-variant border-t-0 p-6 flex items-center gap-5">
                  <div className="w-10 h-10 bg-surface-container flex items-center justify-center flex-none">
                    <Mail className="w-4 h-4 text-outline" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] uppercase tracking-widest text-outline font-bold mb-1">Email Address</p>
                    <p className="text-xs text-primary">{profile.email}</p>
                  </div>
                  <span className="text-[9px] uppercase tracking-widest text-outline px-2 py-1 bg-surface-container border border-outline-variant">Read Only</span>
                </div>

                {/* Name — editable */}
                <div className="bg-surface-container-low border border-outline-variant border-t-0 p-6 flex items-center gap-5">
                  <div className="w-10 h-10 bg-surface-container flex items-center justify-center flex-none">
                    <User className="w-4 h-4 text-outline" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="text-[9px] uppercase tracking-widest text-outline font-bold mb-2 block" htmlFor="edit-name">Full Name</label>
                    <input
                      id="edit-name"
                      name="name"
                      type="text"
                      value={form.name}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-outline-variant bg-surface text-primary text-xs font-sans focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                </div>

                {/* Tax ID — editable */}
                <div className="bg-surface-container-low border border-outline-variant border-t-0 p-6 flex items-center gap-5">
                  <div className="w-10 h-10 bg-surface-container flex items-center justify-center flex-none">
                    <Shield className="w-4 h-4 text-outline" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="text-[9px] uppercase tracking-widest text-outline font-bold mb-2 block" htmlFor="edit-tax-id">Tax ID</label>
                    <input
                      id="edit-tax-id"
                      name="tax_id"
                      type="text"
                      value={form.tax_id}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-outline-variant bg-surface text-primary text-xs font-sans focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                </div>

                {/* Home Address — editable */}
                <div className="bg-surface-container-low border border-outline-variant border-t-0 p-6 flex items-center gap-5">
                  <div className="w-10 h-10 bg-surface-container flex items-center justify-center flex-none">
                    <MapPin className="w-4 h-4 text-outline" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="text-[9px] uppercase tracking-widest text-outline font-bold mb-2 block" htmlFor="edit-address">Home Address</label>
                    <input
                      id="edit-address"
                      name="home_address"
                      type="text"
                      value={form.home_address}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-outline-variant bg-surface text-primary text-xs font-sans focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                </div>

                {/* Password — editable */}
                <div className="bg-surface-container-low border border-outline-variant border-t-0 p-6 flex items-start gap-5">
                  <div className="w-10 h-10 bg-surface-container flex items-center justify-center flex-none mt-1">
                    <Key className="w-4 h-4 text-outline" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0 space-y-3">
                    <p className="text-[9px] uppercase tracking-widest text-outline font-bold">Change Password</p>
                    <p className="text-[10px] text-outline">Leave blank to keep your current password.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        name="password"
                        type="password"
                        placeholder="New password"
                        value={form.password}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-outline-variant bg-surface text-primary text-xs font-sans focus:outline-none focus:border-primary transition-colors placeholder:text-outline/50"
                      />
                      <input
                        name="confirm_password"
                        type="password"
                        placeholder="Confirm new password"
                        value={form.confirm_password}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-outline-variant bg-surface text-primary text-xs font-sans focus:outline-none focus:border-primary transition-colors placeholder:text-outline/50"
                      />
                    </div>
                  </div>
                </div>

                {/* Error */}
                {saveError && (
                  <div className="flex items-center gap-2 px-6 py-3 bg-red-50 border border-outline-variant border-t-0 text-red-700 text-xs uppercase tracking-widest">
                    <AlertTriangle className="w-4 h-4 flex-none" strokeWidth={1.5} />
                    {saveError}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-8">
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={saving}
                    className="px-6 py-2.5 border border-outline-variant text-[10px] uppercase tracking-widest font-bold text-primary hover:bg-surface-container-high transition-colors disabled:opacity-50 inline-flex items-center gap-2"
                  >
                    <X className="w-3.5 h-3.5" strokeWidth={1.5} />
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-[10px] uppercase tracking-widest font-bold hover:brightness-95 transition-all disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" strokeWidth={1.5} />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            ) : (
              /* ── View Mode ── */
              <div className="space-y-0">
                {/* Customer ID */}
                <div className="bg-surface-container-low border border-outline-variant p-6 flex items-center gap-5 group hover:border-primary/30 transition-all duration-300">
                  <div className="w-10 h-10 bg-surface-container flex items-center justify-center flex-none">
                    <Hash className="w-4 h-4 text-outline" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] uppercase tracking-widest text-outline font-bold mb-1">Customer ID</p>
                    <p className="text-xs text-primary font-mono truncate">{profile.id}</p>
                  </div>
                  <button
                    onClick={handleCopyId}
                    className="text-outline hover:text-primary transition-colors p-1"
                    title="Copy ID"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" strokeWidth={1.5} /> : <Copy className="w-4 h-4" strokeWidth={1.5} />}
                  </button>
                </div>

                {/* Full Name */}
                <div className="bg-surface-container-low border border-outline-variant border-t-0 p-6 flex items-center gap-5 group hover:border-primary/30 transition-all duration-300">
                  <div className="w-10 h-10 bg-surface-container flex items-center justify-center flex-none">
                    <User className="w-4 h-4 text-outline" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] uppercase tracking-widest text-outline font-bold mb-1">Full Name</p>
                    <p className="text-sm text-primary font-sans">{profile.name || '—'}</p>
                  </div>
                </div>

                {/* Tax ID */}
                <div className="bg-surface-container-low border border-outline-variant border-t-0 p-6 flex items-center gap-5 group hover:border-primary/30 transition-all duration-300">
                  <div className="w-10 h-10 bg-surface-container flex items-center justify-center flex-none">
                    <Shield className="w-4 h-4 text-outline" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] uppercase tracking-widest text-outline font-bold mb-1">Tax ID</p>
                    <p className="text-sm text-primary font-sans">{profile.tax_id || '—'}</p>
                  </div>
                </div>

                {/* Email */}
                <div className="bg-surface-container-low border border-outline-variant border-t-0 p-6 flex items-center gap-5 group hover:border-primary/30 transition-all duration-300">
                  <div className="w-10 h-10 bg-surface-container flex items-center justify-center flex-none">
                    <Mail className="w-4 h-4 text-outline" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] uppercase tracking-widest text-outline font-bold mb-1">Email Address</p>
                    <p className="text-sm text-primary font-sans">{profile.email}</p>
                  </div>
                </div>

                {/* Home Address */}
                <div className="bg-surface-container-low border border-outline-variant border-t-0 p-6 flex items-center gap-5 group hover:border-primary/30 transition-all duration-300">
                  <div className="w-10 h-10 bg-surface-container flex items-center justify-center flex-none">
                    <MapPin className="w-4 h-4 text-outline" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] uppercase tracking-widest text-outline font-bold mb-1">Home Address</p>
                    <p className="text-sm text-primary font-sans">{profile.home_address || '—'}</p>
                  </div>
                </div>

                {/* Password */}
                <div className="bg-surface-container-low border border-outline-variant border-t-0 p-6 flex items-center gap-5 group hover:border-primary/30 transition-all duration-300">
                  <div className="w-10 h-10 bg-surface-container flex items-center justify-center flex-none">
                    <Key className="w-4 h-4 text-outline" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] uppercase tracking-widest text-outline font-bold mb-1">Password</p>
                    <p className="text-sm text-primary font-sans tracking-widest">••••••••</p>
                  </div>
                </div>

                {/* Account meta */}
                <div className="pt-6 flex items-center gap-6 text-[10px] uppercase tracking-widest text-outline">
                  <span>Role: <span className="font-bold text-primary">{profile.role}</span></span>
                  <span>•</span>
                  <span>Member since: <span className="font-bold text-primary">{formatDate(profile.created_at)}</span></span>
                </div>
              </div>
            )}
          </div>
        ) : null}

      </main>

      <Footer />
    </div>
  );
}

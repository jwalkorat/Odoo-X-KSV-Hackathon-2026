import React, { useEffect, useMemo, useState } from 'react';
import api from '../lib/api';
import { formatDate, getStatusBadgeClass } from '../lib/utils';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Filter,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  UserRoundCheck,
} from 'lucide-react';

const CATEGORIES = ['IT', 'Raw Materials', 'Logistics', 'Services', 'Facilities', 'Other'];

const emptyVendor = {
  name: '',
  category: 'IT',
  gst_number: '',
  contact_email: '',
  contact_phone: '',
  address: '',
  rating: 5,
  status: 'ACTIVE',
};

const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const phoneRegex = /^\+?[0-9]{10,15}$/;

const FieldError = ({ message }) =>
  message ? <p className="mt-1 text-[11px] text-red-300">{message}</p> : null;

const Vendors = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState(emptyVendor);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [selectedVendorId, setSelectedVendorId] = useState(null);

  const loadVendors = async () => {
    setLoading(true);
    try {
      const params = {};
      if (query.trim()) params.search = query.trim();
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (categoryFilter !== 'ALL') params.category = categoryFilter;
      const { data } = await api.get('/api/vendors/', { params });
      setVendors(data);
      setSelectedVendorId((current) => current ?? data[0]?.id ?? null);
    } catch (error) {
      setMessage(error.response?.data?.detail || 'Unable to load vendors. Check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(loadVendors, 250);
    return () => window.clearTimeout(timer);
  }, [query, statusFilter, categoryFilter]);

  const selectedVendor = useMemo(
    () => vendors.find((vendor) => vendor.id === selectedVendorId) || vendors[0],
    [vendors, selectedVendorId]
  );

  const metrics = useMemo(() => {
    const active = vendors.filter((vendor) => vendor.status === 'ACTIVE').length;
    const inactive = vendors.filter((vendor) => vendor.status === 'INACTIVE').length;
    const avgRating = vendors.length
      ? (vendors.reduce((sum, vendor) => sum + Number(vendor.rating || 0), 0) / vendors.length).toFixed(1)
      : '0.0';
    return { active, inactive, avgRating };
  }, [vendors]);

  const validate = () => {
    const nextErrors = {};
    const gst = form.gst_number.trim().toUpperCase();
    const phone = form.contact_phone.replace(/[\s-]/g, '');

    if (form.name.trim().length < 2) nextErrors.name = 'Enter at least 2 characters.';
    if (!gstRegex.test(gst)) nextErrors.gst_number = 'Use a valid 15-character GSTIN.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contact_email.trim())) nextErrors.contact_email = 'Enter a valid email.';
    if (!phoneRegex.test(phone)) nextErrors.contact_phone = 'Use 10 to 15 digits, optionally with +.';
    if (form.address.trim().length < 8) nextErrors.address = 'Add a complete address.';
    if (Number(form.rating) < 0 || Number(form.rating) > 5) nextErrors.rating = 'Rating must be between 0 and 5.';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    if (!validate()) return;

    setSaving(true);
    try {
      const payload = {
        ...form,
        gst_number: form.gst_number.trim().toUpperCase(),
        contact_email: form.contact_email.trim(),
        contact_phone: form.contact_phone.replace(/[\s-]/g, ''),
        rating: Number(form.rating),
      };
      const { data } = await api.post('/api/vendors/', payload);
      setVendors((current) => [data, ...current]);
      setSelectedVendorId(data.id);
      setForm(emptyVendor);
      setErrors({});
      setMessage(`${data.name} is now registered in the vendor registry.`);
    } catch (error) {
      const detail = error.response?.data?.detail;
      setMessage(Array.isArray(detail) ? detail[0]?.msg : detail || 'Vendor registration failed.');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (vendor) => {
    const nextStatus = vendor.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setVendors((current) =>
      current.map((item) => (item.id === vendor.id ? { ...item, status: nextStatus } : item))
    );
    try {
      const { data } = await api.patch(`/api/vendors/${vendor.id}/status`, { status: nextStatus });
      setVendors((current) => current.map((item) => (item.id === vendor.id ? data : item)));
      setMessage(`${data.name} switched to ${data.status.toLowerCase()}.`);
    } catch (error) {
      setVendors((current) => current.map((item) => (item.id === vendor.id ? vendor : item)));
      setMessage(error.response?.data?.detail || 'Status update failed.');
    }
  };

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="glass-panel rounded-xl border border-cyan-500/20 p-5 lg:col-span-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-cyan-300">Vendor registry</p>
          <h2 className="mt-2 font-outfit text-2xl font-bold text-slate-100">Procurement Galaxy Supplier Deck</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Register vendors, verify GST details, filter by quadrant, and switch active status without leaving the screen.
          </p>
        </div>
        {[
          ['Active vendors', metrics.active, UserRoundCheck, 'text-emerald-300'],
          ['Inactive vendors', metrics.inactive, AlertCircle, 'text-amber-300'],
          ['Avg rating', metrics.avgRating, Star, 'text-cyan-300'],
        ].map(([label, value, Icon, color]) => (
          <div key={label} className="glass-panel rounded-xl border border-violet-500/10 p-5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">{label}</span>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <p className="mt-3 font-mono text-3xl font-semibold text-slate-100">{value}</p>
          </div>
        ))}
      </section>

      {message && (
        <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
          {message}
        </div>
      )}

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[390px_1fr]">
        <form onSubmit={handleSubmit} className="glass-panel rounded-xl border border-violet-500/15 p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="font-outfit text-lg font-semibold text-slate-100">Add vendor</h3>
              <p className="text-xs text-slate-500">Validated before launch into registry</p>
            </div>
            <div className="rounded-lg bg-cyan-500/10 p-2 text-cyan-300">
              <Plus className="h-4 w-4" />
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-xs text-slate-300">
              Vendor name
              <input className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <FieldError message={errors.name} />
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block text-xs text-slate-300">
                Category
                <select className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map((category) => <option key={category}>{category}</option>)}
                </select>
              </label>
              <label className="block text-xs text-slate-300">
                Rating
                <input type="number" min="0" max="5" step="0.1" className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} />
                <FieldError message={errors.rating} />
              </label>
            </div>
            <label className="block text-xs text-slate-300">
              GSTIN
              <input className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 font-mono text-sm uppercase text-slate-100 outline-none focus:border-cyan-400" value={form.gst_number} onChange={(e) => setForm({ ...form, gst_number: e.target.value.toUpperCase() })} placeholder="24ABCDE1234F1Z5" />
              <FieldError message={errors.gst_number} />
            </label>
            <label className="block text-xs text-slate-300">
              Contact email
              <input className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
              <FieldError message={errors.contact_email} />
            </label>
            <label className="block text-xs text-slate-300">
              Contact phone
              <input className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} />
              <FieldError message={errors.contact_phone} />
            </label>
            <label className="block text-xs text-slate-300">
              Address
              <textarea rows="3" className="mt-1 w-full resize-none rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              <FieldError message={errors.address} />
            </label>
          </div>

          <button disabled={saving} className="cosmic-btn-primary mt-5 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-60">
            <ShieldCheck className="h-4 w-4" />
            {saving ? 'Registering...' : 'Register vendor'}
          </button>
        </form>

        <div className="space-y-4">
          <div className="glass-panel rounded-xl border border-violet-500/15 p-4">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_180px_180px]">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input className="w-full rounded-lg border border-slate-700 bg-slate-950/70 py-2 pl-9 pr-3 text-sm text-slate-100 outline-none focus:border-cyan-400" placeholder="Search name, GST, email..." value={query} onChange={(e) => setQuery(e.target.value)} />
              </label>
              <label className="relative block">
                <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <select className="w-full rounded-lg border border-slate-700 bg-slate-950/70 py-2 pl-9 pr-3 text-sm text-slate-100 outline-none focus:border-cyan-400" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                  <option value="ALL">All categories</option>
                  {CATEGORIES.map((category) => <option key={category}>{category}</option>)}
                </select>
              </label>
              <label className="relative block">
                <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <select className="w-full rounded-lg border border-slate-700 bg-slate-950/70 py-2 pl-9 pr-3 text-sm text-slate-100 outline-none focus:border-cyan-400" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="ALL">All statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="BLACKLISTED">Blacklisted</option>
                </select>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 2xl:grid-cols-[1fr_330px]">
            <div className="glass-panel overflow-hidden rounded-xl border border-violet-500/15">
              <div className="grid grid-cols-[1.25fr_.8fr_.7fr_.8fr_120px] gap-4 border-b border-violet-500/10 px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-slate-500 max-lg:hidden">
                <span>Vendor</span><span>Category</span><span>GST</span><span>Status</span><span>Toggle</span>
              </div>
              <div className="max-h-[620px] overflow-y-auto">
                {loading ? (
                  <div className="p-8 text-center text-sm text-slate-400">Syncing vendor registry...</div>
                ) : vendors.length === 0 ? (
                  <div className="p-8 text-center text-sm text-slate-400">No vendors match this signal.</div>
                ) : vendors.map((vendor) => (
                  <button key={vendor.id} type="button" onClick={() => setSelectedVendorId(vendor.id)} className={`grid w-full grid-cols-1 gap-3 border-b border-violet-500/10 px-4 py-4 text-left transition hover:bg-slate-800/30 lg:grid-cols-[1.25fr_.8fr_.7fr_.8fr_120px] lg:items-center ${selectedVendor?.id === vendor.id ? 'bg-cyan-500/5' : ''}`}>
                    <div>
                      <p className="font-semibold text-slate-100">{vendor.name}</p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><Mail className="h-3 w-3" />{vendor.contact_email}</p>
                    </div>
                    <span className="text-sm text-slate-300">{vendor.category}</span>
                    <span className="font-mono text-xs text-slate-400">{vendor.gst_number}</span>
                    <span className={`w-fit rounded-full px-2.5 py-1 font-mono text-[10px] uppercase ${getStatusBadgeClass(vendor.status)}`}>{vendor.status}</span>
                    <span onClick={(e) => e.stopPropagation()} className="flex items-center">
                      <button type="button" onClick={() => toggleStatus(vendor)} className={`relative h-7 w-12 rounded-full border transition ${vendor.status === 'ACTIVE' ? 'border-cyan-400/50 bg-cyan-400/20' : 'border-slate-600 bg-slate-800'}`} aria-label={`Toggle ${vendor.name} status`}>
                        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${vendor.status === 'ACTIVE' ? 'left-6' : 'left-1'}`} />
                      </button>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <aside className="glass-panel rounded-xl border border-violet-500/15 p-5">
              {selectedVendor ? (
                <div className="space-y-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-outfit text-lg font-semibold text-slate-100">{selectedVendor.name}</p>
                      <p className="mt-1 text-xs text-slate-500">Registered {formatDate(selectedVendor.created_at)}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 font-mono text-[10px] uppercase ${getStatusBadgeClass(selectedVendor.status)}`}>{selectedVendor.status}</span>
                  </div>
                  <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-4">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-cyan-300">Vendor rating</p>
                    <p className="mt-2 flex items-center gap-2 font-mono text-3xl text-slate-100"><Star className="h-5 w-5 fill-cyan-300 text-cyan-300" />{Number(selectedVendor.rating || 0).toFixed(1)}</p>
                  </div>
                  <div className="space-y-3 text-sm text-slate-300">
                    <p className="flex gap-2"><Building2 className="mt-0.5 h-4 w-4 text-cyan-300" />{selectedVendor.category}</p>
                    <p className="flex gap-2"><Phone className="mt-0.5 h-4 w-4 text-cyan-300" />{selectedVendor.contact_phone}</p>
                    <p className="flex gap-2"><Mail className="mt-0.5 h-4 w-4 text-cyan-300" />{selectedVendor.contact_email}</p>
                    <p className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />{selectedVendor.address}</p>
                    <p className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-cyan-300" />GST verified: {selectedVendor.gst_number}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-400">Select a vendor for registry details.</p>
              )}
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Vendors;

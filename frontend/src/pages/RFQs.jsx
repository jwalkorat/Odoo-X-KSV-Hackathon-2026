import React, { useEffect, useMemo, useState } from 'react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate, getStatusBadgeClass } from '../lib/utils';
import {
  AlertCircle,
  CalendarClock,
  ChevronDown,
  ChevronUp,
  Crown,
  Edit2,
  FilePlus2,
  Files,
  PackagePlus,
  Paperclip,
  Plus,
  Rocket,
  Save,
  Search,
  Send,
  ThumbsUp,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { MOCK_RFQS, MOCK_QUOTATIONS, MOCK_VENDORS } from '../mockData/mockDb';

const emptyItem = { product_name: '', quantity: 1, unit: 'pcs', specifications: '' };
const emptyRfq = {
  title: '',
  description: '',
  deadline: '',
  status: 'OPEN',
  vendor_ids: [],
  items: [emptyItem],
  attachments: [],
};

const FieldError = ({ message }) =>
  message ? <p className="mt-1 text-xs text-red-300">{message}</p> : null;

const RFQs = () => {
  const { user } = useAuth();
  const isOfficerOrAdmin = user?.role === 'OFFICER' || user?.role === 'ADMIN';
  const isVendor = user?.role === 'VENDOR';
  const isManager = user?.role === 'MANAGER';

  const [vendors, setVendors] = useState([]);
  const [rfqs, setRfqs] = useState([]);
  const [quotationsByRfq, setQuotationsByRfq] = useState({});
  const [expandedRfqId, setExpandedRfqId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyRfq);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [requestingApproval, setRequestingApproval] = useState(null);

  // Vendor quotation form (for VENDOR role)
  const [vendorQuoteForm, setVendorQuoteForm] = useState({});
  const [submittingQuote, setSubmittingQuote] = useState(false);

  // Edit quotation state (vendor edits their own submitted quote)
  const [editingQuoteId, setEditingQuoteId] = useState(null);
  const [editQuoteForm, setEditQuoteForm] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);

  const activeVendors = useMemo(
    () => vendors.filter((vendor) => vendor.status === 'ACTIVE'),
    [vendors]
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const [vendorRes, rfqRes] = await Promise.all([
        api.get('/api/vendors/', { params: { status: 'ACTIVE' } }),
        api.get('/api/rfqs/'),
      ]);
      setVendors(vendorRes.data);
      setRfqs(rfqRes.data);
    } catch {
      setVendors(MOCK_VENDORS);
      setRfqs(MOCK_RFQS);
      setMessage('Backend unreachable — showing mock RFQ console.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredRfqs = useMemo(() => {
    return rfqs.filter((rfq) => {
      const matchesStatus = statusFilter === 'ALL' || rfq.status === statusFilter;
      const haystack = `${rfq.title} ${rfq.description}`.toLowerCase();
      const matchesQuery = !query.trim() || haystack.includes(query.trim().toLowerCase());
      return matchesStatus && matchesQuery;
    });
  }, [rfqs, query, statusFilter]);

  const stats = useMemo(() => {
    const open = rfqs.filter((rfq) => rfq.status === 'OPEN').length;
    const draft = rfqs.filter((rfq) => rfq.status === 'DRAFT').length;
    const assigned = rfqs.reduce((sum, rfq) => sum + (rfq.vendor_ids?.length || 0), 0);
    return { open, draft, assigned };
  }, [rfqs]);

  // Load quotations for an RFQ when expanded
  const toggleExpand = async (rfqId) => {
    if (expandedRfqId === rfqId) {
      setExpandedRfqId(null);
      return;
    }
    setExpandedRfqId(rfqId);
    if (!quotationsByRfq[rfqId]) {
      try {
        const { data } = await api.get(`/api/rfqs/${rfqId}/quotes`);
        setQuotationsByRfq((cur) => ({ ...cur, [rfqId]: data }));
      } catch {
        const fallback = MOCK_QUOTATIONS.filter((q) => q.rfq_id === rfqId);
        setQuotationsByRfq((cur) => ({ ...cur, [rfqId]: fallback }));
      }
    }
  };

  const updateItem = (index, key, value) => {
    setForm((current) => ({
      ...current,
      items: current.items.map((item, i) => (i === index ? { ...item, [key]: value } : item)),
    }));
  };

  const toggleVendor = (vendorId) => {
    setForm((current) => {
      const exists = current.vendor_ids.includes(vendorId);
      return {
        ...current,
        vendor_ids: exists
          ? current.vendor_ids.filter((id) => id !== vendorId)
          : [...current.vendor_ids, vendorId],
      };
    });
  };

  const handleFiles = (event) => {
    const files = Array.from(event.target.files || []);
    const attachments = files.map((file) => ({
      name: file.name,
      size: file.size,
      type: file.type || 'application/octet-stream',
    }));
    setForm((current) => ({ ...current, attachments }));
  };

  const validate = () => {
    const nextErrors = {};
    if (form.title.trim().length < 4) nextErrors.title = 'Enter a clear RFQ title.';
    if (form.description.trim().length < 10) nextErrors.description = 'Add procurement context for vendors.';
    if (!form.deadline) {
      nextErrors.deadline = 'Select a deadline.';
    } else if (new Date(form.deadline) <= new Date()) {
      nextErrors.deadline = 'Deadline must be in the future.';
    }
    if (form.vendor_ids.length === 0) nextErrors.vendor_ids = 'Assign at least one active vendor.';
    form.items.forEach((item, index) => {
      if (item.product_name.trim().length < 2) nextErrors[`item_${index}_product_name`] = 'Required.';
      if (Number(item.quantity) <= 0) nextErrors[`item_${index}_quantity`] = 'Use a positive quantity.';
      if (!item.unit.trim()) nextErrors[`item_${index}_unit`] = 'Required.';
    });
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
        deadline: new Date(form.deadline).toISOString(),
        items: form.items.map((item) => ({
          product_name: item.product_name.trim(),
          quantity: Number(item.quantity),
          unit: item.unit.trim(),
          specifications: item.specifications.trim() || null,
        })),
      };
      const { data } = await api.post('/api/rfqs/', payload);
      setRfqs((current) => [data, ...current]);
      setForm(emptyRfq);
      setErrors({});
      setMessage(`${data.title} launched to ${data.vendor_ids.length} vendor${data.vendor_ids.length === 1 ? '' : 's'}.`);
    } catch (error) {
      const detail = error.response?.data?.detail;
      setMessage(Array.isArray(detail) ? detail[0]?.msg : detail || 'RFQ creation failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleRequestApproval = async (rfqId, quotationId) => {
    setRequestingApproval(quotationId);
    setMessage('');
    try {
      await api.post('/api/approvals/', { rfq_id: rfqId, quotation_id: quotationId });
      setMessage(`Approval request submitted for Quotation #${quotationId}. Manager will be notified.`);
    } catch (e) {
      setMessage(e.response?.data?.detail || 'Failed to request approval.');
    } finally {
      setRequestingApproval(null);
    }
  };

  const handleVendorQuoteSubmit = async (rfq) => {
    const qForm = vendorQuoteForm[rfq.id] || {};
    if (!qForm.total_amount || !qForm.delivery_days) {
      setMessage('Please fill in total amount and delivery days.');
      return;
    }
    setSubmittingQuote(true);
    setMessage('');
    try {
      const vendorId = vendors.find((v) => v.contact_email === user?.email)?.id || 1;
      const items = rfq.items?.map((item) => ({
        rfq_item_id: item.id,
        unit_price: parseFloat(qForm.total_amount) / (rfq.items?.length || 1),
        total_price: parseFloat(qForm.total_amount) / (rfq.items?.length || 1),
      })) || [];
      const payload = {
        rfq_id: rfq.id,
        vendor_id: vendorId,
        total_amount: parseFloat(qForm.total_amount),
        delivery_days: parseInt(qForm.delivery_days),
        notes: qForm.notes || null,
        items,
      };
      const { data } = await api.post(`/api/rfqs/${rfq.id}/quotes`, payload);
      setQuotationsByRfq((cur) => ({ ...cur, [rfq.id]: [...(cur[rfq.id] || []), data] }));
      setVendorQuoteForm((cur) => ({ ...cur, [rfq.id]: {} }));
      setMessage(`Quotation submitted successfully for RFQ "${rfq.title}".`);
    } catch (e) {
      setMessage(e.response?.data?.detail || 'Failed to submit quotation.');
    } finally {
      setSubmittingQuote(false);
    }
  };

  const handleVendorQuoteEdit = async (rfqId, quoteId) => {
    if (!editQuoteForm.total_amount || !editQuoteForm.delivery_days) {
      setMessage('Total amount and delivery days are required.');
      return;
    }
    setSavingEdit(true);
    setMessage('');
    try {
      const { data } = await api.patch(`/api/rfqs/${rfqId}/quotes/${quoteId}`, {
        total_amount: parseFloat(editQuoteForm.total_amount),
        delivery_days: parseInt(editQuoteForm.delivery_days),
        notes: editQuoteForm.notes || null,
      });
      setQuotationsByRfq((cur) => ({
        ...cur,
        [rfqId]: (cur[rfqId] || []).map((q) => (q.id === quoteId ? data : q))
      }));
      setEditingQuoteId(null);
      setEditQuoteForm({});
      setMessage('Quotation updated successfully.');
    } catch (e) {
      setMessage(e.response?.data?.detail || 'Failed to update quotation.');
    } finally {
      setSavingEdit(false);
    }
  };

  const vendorName = (vendorId) => vendors.find((v) => v.id === vendorId)?.name || `Vendor #${vendorId}`;

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="glass-panel rounded-xl border border-cyan-500/20 p-5 lg:col-span-2">
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-cyan-300">RFQ launch console</p>
          <h2 className="mt-2 font-outfit text-2xl font-bold text-slate-100">Requisition Builder</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Create RFQs, attach reference files, assign active vendors, track quotations, and request approvals.
          </p>
        </div>
        {[
          ['Open RFQs', stats.open, Rocket, 'text-cyan-300'],
          ['Draft RFQs', stats.draft, FilePlus2, 'text-violet-300'],
          ['Vendor invites', stats.assigned, Users, 'text-emerald-300'],
        ].map(([label, value, Icon, color]) => (
          <div key={label} className="glass-panel rounded-xl border border-violet-500/10 p-5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-widest text-slate-500">{label}</span>
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

      <section className={`grid grid-cols-1 gap-6 ${isOfficerOrAdmin ? 'xl:grid-cols-[430px_1fr]' : ''}`}>
        {/* RFQ Create Form — Officers/Admins only */}
        {isOfficerOrAdmin && (
          <form onSubmit={handleSubmit} className="glass-panel rounded-xl border border-violet-500/15 p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="font-outfit text-lg font-semibold text-slate-100">Create RFQ</h3>
                <p className="text-xs text-slate-500">No wizard, no friction, just the full requisition packet</p>
              </div>
              <div className="rounded-lg bg-cyan-500/10 p-2 text-cyan-300">
                <PackagePlus className="h-4 w-4" />
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-xs text-slate-300">
                RFQ title
                <input className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                <FieldError message={errors.title} />
              </label>
              <label className="block text-xs text-slate-300">
                Product/service details
                <textarea rows="3" className="mt-1 w-full resize-none rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                <FieldError message={errors.description} />
              </label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block text-xs text-slate-300">
                  Deadline
                  <input type="datetime-local" className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
                  <FieldError message={errors.deadline} />
                </label>
                <label className="block text-xs text-slate-300">
                  Status
                  <select className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="OPEN">Open</option>
                    <option value="DRAFT">Draft</option>
                  </select>
                </label>
              </div>

              {/* Line Items */}
              <div className="rounded-lg border border-violet-500/15 bg-slate-950/35 p-3">
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-mono text-xs uppercase tracking-widest text-slate-400">Line items</p>
                  <button type="button" onClick={() => setForm({ ...form, items: [...form.items, emptyItem] })} className="flex items-center gap-1 rounded-md border border-cyan-500/30 px-2 py-1 text-xs text-cyan-300">
                    <Plus className="h-3 w-3" /> Add
                  </button>
                </div>
                <div className="space-y-3">
                  {form.items.map((item, index) => (
                    <div key={index} className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="font-mono text-xs text-slate-500">ITEM {index + 1}</span>
                        {form.items.length > 1 && (
                          <button type="button" onClick={() => setForm({ ...form, items: form.items.filter((_, i) => i !== index) })} className="text-red-300">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                      <label className="block text-xs text-slate-300">
                        Product/service
                        <input className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400" value={item.product_name} onChange={(e) => updateItem(index, 'product_name', e.target.value)} />
                        <FieldError message={errors[`item_${index}_product_name`]} />
                      </label>
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <label className="block text-xs text-slate-300">
                          Qty
                          <input type="number" min="0.01" step="0.01" className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', e.target.value)} />
                          <FieldError message={errors[`item_${index}_quantity`]} />
                        </label>
                        <label className="block text-xs text-slate-300">
                          Unit
                          <input className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400" value={item.unit} onChange={(e) => updateItem(index, 'unit', e.target.value)} />
                          <FieldError message={errors[`item_${index}_unit`]} />
                        </label>
                      </div>
                      <label className="mt-3 block text-xs text-slate-300">
                        Specifications
                        <textarea rows="2" className="mt-1 w-full resize-none rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400" value={item.specifications} onChange={(e) => updateItem(index, 'specifications', e.target.value)} />
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Assign Vendors */}
              <div className="rounded-lg border border-violet-500/15 bg-slate-950/35 p-3">
                <p className="mb-3 font-mono text-xs uppercase tracking-widest text-slate-400">Assign vendors</p>
                <div className="grid max-h-44 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
                  {activeVendors.map((vendor) => (
                    <button key={vendor.id} type="button" onClick={() => toggleVendor(vendor.id)} className={`rounded-lg border px-3 py-2 text-left text-xs transition ${form.vendor_ids.includes(vendor.id) ? 'border-cyan-400/50 bg-cyan-500/15 text-cyan-100' : 'border-slate-700 bg-slate-950/60 text-slate-300 hover:border-cyan-500/30'}`}>
                      <span className="block font-semibold">{vendor.name}</span>
                      <span className="font-mono text-xs text-slate-500">{vendor.category}</span>
                    </button>
                  ))}
                  {activeVendors.length === 0 && <p className="text-xs text-slate-500">No active vendors available.</p>}
                </div>
                <FieldError message={errors.vendor_ids} />
              </div>

              <label className="block rounded-lg border border-dashed border-cyan-500/30 bg-cyan-500/5 p-4 text-center text-xs text-cyan-200">
                <Paperclip className="mx-auto mb-2 h-5 w-5" />
                Attach reference files
                <input type="file" multiple className="hidden" onChange={handleFiles} />
                <span className="mt-1 block text-xs text-slate-500">{form.attachments.length ? `${form.attachments.length} file(s) queued` : 'PDF, specs, drawings, or quote templates'}</span>
              </label>
            </div>

            <button disabled={saving} className="cosmic-btn-primary mt-5 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-60">
              <Send className="h-4 w-4" />
              {saving ? 'Launching RFQ...' : 'Launch RFQ'}
            </button>
          </form>
        )}

        {/* RFQ List */}
        <div className="space-y-4">
          <div className="glass-panel rounded-xl border border-violet-500/15 p-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px]">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input className="w-full rounded-lg border border-slate-700 bg-slate-950/70 py-2 pl-9 pr-3 text-sm text-slate-100 outline-none focus:border-cyan-400" placeholder="Search RFQs..." value={query} onChange={(e) => setQuery(e.target.value)} />
              </label>
              <select className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="ALL">All statuses</option>
                <option value="OPEN">Open</option>
                <option value="DRAFT">Draft</option>
                <option value="CLOSED">Closed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="glass-panel rounded-xl border border-violet-500/15 p-8 text-center text-sm text-slate-400">Syncing RFQ packets...</div>
            ) : filteredRfqs.length === 0 ? (
              <div className="glass-panel rounded-xl border border-violet-500/15 p-8 text-center text-sm text-slate-400">
                <AlertCircle className="mx-auto mb-2 h-7 w-7 text-slate-600" />
                No RFQs match this filter.
              </div>
            ) : filteredRfqs.map((rfq) => (
              <article key={rfq.id} className="glass-panel rounded-xl border border-violet-500/15 p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-outfit text-lg font-semibold text-slate-100">{rfq.title}</h3>
                      <span className={`rounded-full px-2.5 py-1 font-mono text-xs uppercase ${getStatusBadgeClass(rfq.status)}`}>{rfq.status}</span>
                    </div>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">{rfq.description}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100">
                      <CalendarClock className="mb-1 h-4 w-4" />
                      {formatDate(rfq.deadline)}
                    </div>
                    <button
                      onClick={() => toggleExpand(rfq.id)}
                      className="flex items-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-xs text-violet-300 hover:bg-violet-500/20 transition"
                    >
                      {expandedRfqId === rfq.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      Quotes
                    </button>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
                  <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-4 lg:col-span-2">
                    <p className="mb-3 font-mono text-xs uppercase tracking-widest text-slate-500">Requested items</p>
                    <div className="space-y-2">
                      {rfq.items?.map((item) => (
                        <div key={item.id} className="flex flex-col justify-between gap-2 rounded-lg border border-slate-800 bg-slate-950/45 px-3 py-2 text-sm sm:flex-row">
                          <span className="font-medium text-slate-200">{item.product_name}</span>
                          <span className="font-mono text-xs text-cyan-300">{item.quantity} {item.unit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-4">
                    <p className="mb-3 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-slate-500"><Users className="h-3.5 w-3.5" />Assigned vendors</p>
                    <div className="space-y-2">
                      {(rfq.vendor_ids || []).map((vendorId) => (
                        <span key={vendorId} className="block rounded-md border border-cyan-500/20 bg-cyan-500/10 px-2 py-1 text-xs text-cyan-100">{vendorName(vendorId)}</span>
                      ))}
                    </div>
                    <p className="mb-2 mt-4 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-slate-500"><Files className="h-3.5 w-3.5" />Attachments</p>
                    {rfq.attachments?.length ? rfq.attachments.map((file) => (
                      <span key={file.name} className="block truncate rounded-md border border-violet-500/20 bg-violet-500/10 px-2 py-1 text-xs text-violet-100">{file.name}</span>
                    )) : <span className="text-xs text-slate-500">No attachments</span>}
                  </div>
                </div>

                {/* Quotations Section — expandable */}
                {expandedRfqId === rfq.id && (
                  <div className="mt-5 border-t border-violet-500/10 pt-5 space-y-4">
                    <p className="font-mono text-xs uppercase tracking-widest text-slate-400">
                      Submitted Quotations
                      {quotationsByRfq[rfq.id]?.length > 0 && (
                        <span className="ml-2 rounded-full bg-violet-500/20 px-2 py-0.5 text-violet-400">{quotationsByRfq[rfq.id].length}</span>
                      )}
                    </p>

                    {!quotationsByRfq[rfq.id] ? (
                      <p className="text-xs text-slate-500">Loading quotations...</p>
                    ) : quotationsByRfq[rfq.id].length === 0 ? (
                      <p className="text-xs text-slate-500">No quotations received yet.</p>
                    ) : (() => {
                      const quotes = quotationsByRfq[rfq.id];
                      const lowestPrice = Math.min(...quotes.map((q) => q.total_amount));
                      return (
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          {quotes.map((quote) => {
                            const isLowest = quote.total_amount === lowestPrice && quotes.length > 1;
                            const isEditing = editingQuoteId === quote.id;
                            return (
                              <div
                                key={quote.id}
                                className={`rounded-lg border p-4 space-y-3 transition-all ${
                                  isLowest
                                    ? 'border-emerald-400/40 bg-emerald-950/20 ring-1 ring-emerald-400/20'
                                    : 'border-violet-500/20 bg-slate-950/40'
                                }`}
                              >
                                {/* Header */}
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className="font-semibold text-slate-200 text-sm">{vendorName(quote.vendor_id)}</p>
                                      {isLowest && (
                                        <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2 py-0.5 text-[9px] font-bold text-emerald-400 uppercase tracking-widest">
                                          <Crown className="h-2.5 w-2.5" /> LOWEST
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-0.5">Delivery in {quote.delivery_days} days</p>
                                  </div>
                                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 font-mono text-xs uppercase ${getStatusBadgeClass(quote.status)}`}>
                                    {quote.status}
                                  </span>
                                </div>

                                {/* Edit Mode */}
                                {isEditing ? (
                                  <div className="space-y-2 border border-cyan-500/20 bg-cyan-500/5 rounded-lg p-3">
                                    <p className="font-mono text-[10px] uppercase tracking-widest text-cyan-400">Edit Quotation</p>
                                    <div className="grid grid-cols-2 gap-2">
                                      <label className="block text-xs text-slate-300">
                                        Amount (INR)
                                        <input
                                          type="number"
                                          min="1"
                                          className="mt-1 w-full rounded border border-slate-700 bg-slate-950/70 px-2 py-1.5 text-sm text-slate-100 outline-none focus:border-cyan-400"
                                          value={editQuoteForm.total_amount || ''}
                                          onChange={(e) => setEditQuoteForm((f) => ({ ...f, total_amount: e.target.value }))}
                                        />
                                      </label>
                                      <label className="block text-xs text-slate-300">
                                        Delivery Days
                                        <input
                                          type="number"
                                          min="1"
                                          className="mt-1 w-full rounded border border-slate-700 bg-slate-950/70 px-2 py-1.5 text-sm text-slate-100 outline-none focus:border-cyan-400"
                                          value={editQuoteForm.delivery_days || ''}
                                          onChange={(e) => setEditQuoteForm((f) => ({ ...f, delivery_days: e.target.value }))}
                                        />
                                      </label>
                                    </div>
                                    <textarea
                                      rows="2"
                                      placeholder="Notes (optional)"
                                      className="w-full resize-none rounded border border-slate-700 bg-slate-950/70 px-2 py-1.5 text-xs text-slate-100 outline-none focus:border-cyan-400"
                                      value={editQuoteForm.notes || ''}
                                      onChange={(e) => setEditQuoteForm((f) => ({ ...f, notes: e.target.value }))}
                                    />
                                    <div className="flex gap-2">
                                      <button
                                        disabled={savingEdit}
                                        onClick={() => handleVendorQuoteEdit(rfq.id, quote.id)}
                                        className="flex-1 flex items-center justify-center gap-1.5 rounded border border-emerald-500/30 bg-emerald-500/10 py-1.5 text-xs text-emerald-400 hover:bg-emerald-500/20 transition disabled:opacity-50"
                                      >
                                        <Save className="h-3 w-3" />{savingEdit ? 'Saving...' : 'Save'}
                                      </button>
                                      <button
                                        onClick={() => { setEditingQuoteId(null); setEditQuoteForm({}); }}
                                        className="px-3 flex items-center justify-center rounded border border-slate-700 text-slate-400 hover:text-red-400 transition py-1.5"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    {/* Price display */}
                                    <div className={`rounded-lg border px-3 py-2 ${
                                      isLowest ? 'bg-emerald-500/10 border-emerald-400/20' : 'bg-cyan-500/10 border-cyan-500/20'
                                    }`}>
                                      <span className={`font-mono text-xs uppercase ${isLowest ? 'text-emerald-400' : 'text-cyan-400'}`}>Total Amount</span>
                                      <p className={`font-mono text-lg font-bold ${isLowest ? 'text-emerald-300' : 'text-slate-100'}`}>{formatCurrency(quote.total_amount)}</p>
                                    </div>
                                    {quote.notes && (
                                      <p className="text-xs text-slate-400 italic border-t border-slate-800 pt-2">"{quote.notes}"</p>
                                    )}
                                    {/* Vendor Edit Button */}
                                    {isVendor && quote.status === 'SUBMITTED' && (
                                      <button
                                        onClick={() => {
                                          setEditingQuoteId(quote.id);
                                          setEditQuoteForm({
                                            total_amount: quote.total_amount,
                                            delivery_days: quote.delivery_days,
                                            notes: quote.notes || ''
                                          });
                                        }}
                                        className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 py-1.5 text-xs text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30 transition"
                                      >
                                        <Edit2 className="h-3 w-3" /> Edit Quotation
                                      </button>
                                    )}
                                    {/* Request Approval — Officers/Admins */}
                                    {isOfficerOrAdmin && rfq.status === 'OPEN' && quote.status === 'SUBMITTED' && (
                                      <button
                                        disabled={requestingApproval === quote.id}
                                        onClick={() => handleRequestApproval(rfq.id, quote.id)}
                                        className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 py-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition disabled:opacity-50"
                                      >
                                        <ThumbsUp className="h-3.5 w-3.5" />
                                        {requestingApproval === quote.id ? 'Requesting...' : 'Request Manager Approval'}
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}

                    {/* Vendor Quotation Submit Form */}
                    {isVendor && rfq.status === 'OPEN' && (
                      <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-4 space-y-3">
                        <p className="font-mono text-xs uppercase tracking-widest text-cyan-400">Submit Your Quotation</p>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <label className="block text-xs text-slate-300">
                            Total Amount (INR)
                            <input
                              type="number"
                              min="1"
                              step="0.01"
                              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400"
                              value={vendorQuoteForm[rfq.id]?.total_amount || ''}
                              onChange={(e) => setVendorQuoteForm((cur) => ({ ...cur, [rfq.id]: { ...cur[rfq.id], total_amount: e.target.value } }))}
                            />
                          </label>
                          <label className="block text-xs text-slate-300">
                            Delivery Days
                            <input
                              type="number"
                              min="1"
                              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400"
                              value={vendorQuoteForm[rfq.id]?.delivery_days || ''}
                              onChange={(e) => setVendorQuoteForm((cur) => ({ ...cur, [rfq.id]: { ...cur[rfq.id], delivery_days: e.target.value } }))}
                            />
                          </label>
                        </div>
                        <label className="block text-xs text-slate-300">
                          Notes (optional)
                          <textarea
                            rows="2"
                            className="mt-1 w-full resize-none rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400"
                            value={vendorQuoteForm[rfq.id]?.notes || ''}
                            onChange={(e) => setVendorQuoteForm((cur) => ({ ...cur, [rfq.id]: { ...cur[rfq.id], notes: e.target.value } }))}
                          />
                        </label>
                        <button
                          disabled={submittingQuote}
                          onClick={() => handleVendorQuoteSubmit(rfq)}
                          className="w-full flex items-center justify-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 py-2.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 transition disabled:opacity-50"
                        >
                          <Send className="h-3.5 w-3.5" />
                          {submittingQuote ? 'Submitting...' : 'Submit Quotation'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default RFQs;

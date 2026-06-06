import React, { useEffect, useMemo, useState } from 'react';
import api from '../lib/api';
import { formatCurrency, formatDate, getStatusBadgeClass } from '../lib/utils';
import {
  AlertCircle,
  FileDown,
  IndianRupee,
  Printer,
  Receipt,
  Send,
} from 'lucide-react';
import { MOCK_INVOICES, MOCK_ORDERS } from '../mockData/mockDb';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  // Invoice generation form state
  const [form, setForm] = useState({ po_id: '', tax_percent: 18 });

  const loadData = async () => {
    setLoading(true);
    try {
      const [invRes, poRes] = await Promise.all([
        api.get('/api/orders/invoices'),
        api.get('/api/orders/purchase-orders'),
      ]);
      setInvoices(invRes.data);
      setOrders(poRes.data);
      if (invRes.data.length > 0) setSelectedId((c) => c ?? invRes.data[0].id);
    } catch {
      const enriched = MOCK_INVOICES.map((inv) => ({
        ...inv,
        po_number: 'PO-2026-0001',
        vendor_name: 'Supernova Raw Materials Corp',
      }));
      setInvoices(enriched);
      setOrders(MOCK_ORDERS.map((o) => ({ ...o, rfq_title: 'Quantum Server Infrastructure Upgrade', vendor_name: 'Supernova Raw Materials Corp' })));
      if (enriched.length > 0) setSelectedId((c) => c ?? enriched[0].id);
      setMessage('Backend unreachable — showing mock invoices.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selected = useMemo(
    () => invoices.find((inv) => inv.id === selectedId) || invoices[0],
    [invoices, selectedId]
  );

  const stats = useMemo(() => {
    const draft = invoices.filter((i) => i.status === 'DRAFT').length;
    const sent = invoices.filter((i) => i.status === 'SENT').length;
    const paid = invoices.filter((i) => i.status === 'PAID').length;
    const totalBilled = invoices.reduce((acc, i) => acc + (i.total || 0), 0);
    return { draft, sent, paid, totalBilled };
  }, [invoices]);

  const issuedOrders = useMemo(() => orders.filter((o) => o.status === 'ISSUED' || o.status === 'COMPLETED'), [orders]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!form.po_id) return;
    setGenerating(true);
    setMessage('');
    try {
      const selectedPO = orders.find((o) => o.id === parseInt(form.po_id));
      const { data } = await api.post('/api/orders/invoices', {
        po_id: parseInt(form.po_id),
        subtotal: selectedPO?.total_amount || 0,
        tax_percent: parseFloat(form.tax_percent),
      });
      setInvoices((cur) => [data, ...cur]);
      setSelectedId(data.id);
      setForm({ po_id: '', tax_percent: 18 });
      setMessage(`Invoice ${data.invoice_number} created successfully.`);
    } catch (err) {
      setMessage(err.response?.data?.detail || 'Invoice generation failed.');
    } finally {
      setGenerating(false);
    }
  };

  const handleStatusUpdate = async (inv, newStatus) => {
    setUpdatingId(inv.id);
    setMessage('');
    try {
      const { data } = await api.patch(`/api/orders/invoices/${inv.id}/status`, { status: newStatus });
      setInvoices((cur) => cur.map((i) => (i.id === inv.id ? data : i)));
      setMessage(`Invoice ${inv.invoice_number} status updated to ${newStatus}.`);
    } catch (err) {
      setMessage(err.response?.data?.detail || 'Status update failed.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handlePrint = () => {
    if (!selected) return;
    const win = window.open('', '_blank', 'width=800,height=1050');
    win.document.write(`
      <html><head><title>Invoice ${selected.invoice_number}</title>
      <style>
        * { box-sizing: border-box; }
        body { font-family: Arial, sans-serif; padding: 48px; color: #111; max-width: 760px; margin: 0 auto; }
        .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:40px; }
        .company { font-size:11px; text-transform:uppercase; letter-spacing:3px; color:#6366f1; margin-bottom:6px; }
        h1 { font-size:28px; font-weight:700; margin:0 0 6px; }
        .badge { display:inline-block; padding:3px 12px; border-radius:999px; font-size:10px; font-weight:700; text-transform:uppercase; background:#fef3c7; color:#b45309; }
        .meta { font-size:12px; color:#555; margin-top:6px; }
        .bill-to { background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:16px 20px; margin-bottom:32px; }
        .bill-to h3 { font-size:11px; text-transform:uppercase; letter-spacing:2px; color:#64748b; margin:0 0 8px; }
        .bill-to p { font-size:14px; font-weight:600; margin:0; }
        table { width:100%; border-collapse:collapse; font-size:13px; }
        th { text-align:left; padding:10px 12px; font-size:11px; text-transform:uppercase; letter-spacing:1px; color:#64748b; border-bottom:2px solid #e2e8f0; }
        td { padding:12px; border-bottom:1px solid #f1f5f9; }
        .subtotal-section { border-top:2px solid #e2e8f0; margin-top:8px; }
        .subtotal-section tr td { border:none; padding:6px 12px; font-size:13px; color:#555; }
        .subtotal-section tr:last-child td { font-size:16px; font-weight:700; color:#111; padding-top:12px; border-top:2px solid #e2e8f0; }
        .footer { margin-top:60px; font-size:10px; color:#94a3b8; text-align:center; border-top:1px solid #f1f5f9; padding-top:20px; }
        @media print { button { display:none !important; } }
      </style></head><body>
      <div class="header">
        <div>
          <div class="company">Procurement Galaxy ERP</div>
          <h1>Tax Invoice</h1>
          <span class="badge">${selected.status}</span>
          <p class="meta">Invoice No: <strong>${selected.invoice_number}</strong></p>
          <p class="meta">Date: ${new Date(selected.created_at).toLocaleDateString('en-IN', {day:'numeric',month:'long',year:'numeric'})}</p>
          <p class="meta">PO Reference: <strong>${selected.po_number || 'N/A'}</strong></p>
        </div>
        <div style="text-align:right; font-size:12px; color:#555;">
          <p style="font-weight:700; font-size:14px; color:#111;">Issued to:</p>
          <p>${selected.vendor_name || 'Vendor #' + selected.vendor_id}</p>
        </div>
      </div>
      <div class="bill-to">
        <h3>Bill To</h3>
        <p>${selected.vendor_name || 'Vendor #' + selected.vendor_id}</p>
      </div>
      <table>
        <thead><tr><th>#</th><th>Description</th><th style="text-align:right">Amount</th></tr></thead>
        <tbody>
          <tr><td>1</td><td>Procurement Services — PO ${selected.po_number || ''}</td><td style="text-align:right">${new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format(selected.subtotal)}</td></tr>
        </tbody>
        <tbody class="subtotal-section">
          <tr><td colspan="2" style="text-align:right">Subtotal</td><td style="text-align:right">${new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format(selected.subtotal)}</td></tr>
          <tr><td colspan="2" style="text-align:right">GST (${selected.tax_percent}%)</td><td style="text-align:right">${new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format(selected.tax_amount)}</td></tr>
          <tr><td colspan="2" style="text-align:right; font-weight:700;">Total</td><td style="text-align:right">${new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format(selected.total)}</td></tr>
        </tbody>
      </table>
      <div class="footer">
        This is a system-generated tax invoice. GST (GSTIN applicable). For disputes, contact procurement@galaxy.com.<br/>
        Procurement Galaxy ERP — Authorized Electronic Document
      </div>
      <br/><button onclick="window.print()" style="margin-top:20px;padding:10px 20px;background:#6366f1;color:white;border:none;border-radius:6px;cursor:pointer;font-size:14px;">🖨 Print / Save as PDF</button>
      </body></html>
    `);
    win.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Stats Banner */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="glass-panel rounded-xl border border-cyan-500/20 p-5 lg:col-span-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-cyan-300">Finance console</p>
          <h2 className="mt-2 font-outfit text-2xl font-bold text-slate-100">Invoice Billing Console</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Generate GST tax invoices from Purchase Orders, print A4 layouts, and track payment status.
          </p>
        </div>
        {[
          ['Draft', stats.draft, Receipt, 'text-slate-400'],
          ['Sent', stats.sent, Send, 'text-cyan-400'],
          ['Paid', stats.paid, IndianRupee, 'text-emerald-400'],
          ['Total Billed', stats.totalBilled, FileDown, 'text-violet-400'],
        ].map(([label, value, Icon, color]) => (
          <div key={label} className="glass-panel rounded-xl border border-violet-500/10 p-5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">{label}</span>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <p className={`mt-3 font-mono font-semibold text-slate-100 ${label === 'Total Billed' ? 'text-base mt-4' : 'text-3xl'}`}>
              {label === 'Total Billed' ? formatCurrency(value) : value}
            </p>
          </div>
        ))}
      </section>

      {message && (
        <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
          {message}
        </div>
      )}

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_400px]">
        {/* Invoice List */}
        <div className="space-y-4">
          {/* Generate Invoice Form */}
          <form onSubmit={handleGenerate} className="glass-panel rounded-xl border border-violet-500/15 p-5">
            <h3 className="font-outfit text-base font-semibold text-slate-100 mb-4">Generate New Invoice</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_160px_160px]">
              <label className="block text-xs text-slate-300">
                Select Purchase Order
                <select
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400"
                  value={form.po_id}
                  onChange={(e) => setForm({ ...form, po_id: e.target.value })}
                  required
                >
                  <option value="">— Select a PO —</option>
                  {issuedOrders.map((po) => (
                    <option key={po.id} value={po.id}>
                      {po.po_number} — {po.vendor_name || `Vendor #${po.vendor_id}`}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs text-slate-300">
                GST %
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400"
                  value={form.tax_percent}
                  onChange={(e) => setForm({ ...form, tax_percent: e.target.value })}
                />
              </label>
              <div className="flex items-end">
                <button
                  disabled={generating || !form.po_id}
                  className="cosmic-btn-primary w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Receipt className="h-4 w-4" />
                  {generating ? 'Generating...' : 'Generate'}
                </button>
              </div>
            </div>
          </form>

          {/* Invoice Table */}
          <div className="glass-panel overflow-hidden rounded-xl border border-violet-500/15">
            <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_100px] gap-4 border-b border-violet-500/10 px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-slate-500 max-lg:hidden">
              <span>Invoice No</span><span>Vendor</span><span>Total (incl. GST)</span><span>Created</span><span>Status</span>
            </div>
            <div className="max-h-[400px] overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-sm text-slate-400">Syncing billing console...</div>
              ) : invoices.length === 0 ? (
                <div className="p-10 text-center">
                  <AlertCircle className="mx-auto mb-2 h-8 w-8 text-slate-600" />
                  <p className="text-sm text-slate-400">No invoices generated yet.</p>
                </div>
              ) : invoices.map((inv) => (
                <div
                  key={inv.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedId(inv.id)}
                  onKeyDown={(e) => e.key === 'Enter' && setSelectedId(inv.id)}
                  className={`grid grid-cols-1 gap-3 border-b border-violet-500/10 px-4 py-4 text-left transition hover:bg-slate-800/30 lg:grid-cols-[1.5fr_1fr_1fr_1fr_100px] lg:items-center cursor-pointer ${selectedId === inv.id ? 'bg-cyan-500/5' : ''}`}
                >
                  <p className="font-mono text-sm font-semibold text-slate-100">{inv.invoice_number}</p>
                  <p className="text-sm text-slate-300 truncate">{inv.vendor_name || `Vendor #${inv.vendor_id}`}</p>
                  <p className="font-mono text-sm text-cyan-400">{formatCurrency(inv.total)}</p>
                  <p className="text-xs text-slate-400">{formatDate(inv.created_at)}</p>
                  <span className={`w-fit rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase ${getStatusBadgeClass(inv.status)}`}>
                    {inv.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detail + Actions Panel */}
        <aside className="glass-panel rounded-xl border border-violet-500/15 p-5 space-y-5">
          {selected ? (
            <>
              <div className="border-b border-violet-500/10 pb-4">
                <span className={`inline-block rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase mb-2 ${getStatusBadgeClass(selected.status)}`}>
                  {selected.status}
                </span>
                <h3 className="font-mono text-lg font-bold text-slate-100">{selected.invoice_number}</h3>
                <p className="mt-1 text-xs text-slate-500">PO Ref: {selected.po_number || `PO #${selected.po_id}`}</p>
              </div>

              {/* Tax Breakdown */}
              <div className="space-y-2 text-xs">
                <div className="rounded-lg bg-slate-950/50 border border-slate-800 overflow-hidden">
                  <div className="px-4 py-2.5 flex justify-between border-b border-slate-800">
                    <span className="text-slate-400">Vendor</span>
                    <span className="text-slate-200 font-semibold">{selected.vendor_name || `Vendor #${selected.vendor_id}`}</span>
                  </div>
                  <div className="px-4 py-2.5 flex justify-between border-b border-slate-800">
                    <span className="text-slate-400">Subtotal</span>
                    <span className="text-slate-200 font-mono">{formatCurrency(selected.subtotal)}</span>
                  </div>
                  <div className="px-4 py-2.5 flex justify-between border-b border-slate-800">
                    <span className="text-slate-400">GST ({selected.tax_percent}%)</span>
                    <span className="text-amber-400 font-mono">{formatCurrency(selected.tax_amount)}</span>
                  </div>
                  <div className="px-4 py-3 flex justify-between bg-cyan-500/5">
                    <span className="font-semibold text-slate-200">Total</span>
                    <span className="font-mono text-lg text-cyan-400 font-bold">{formatCurrency(selected.total)}</span>
                  </div>
                </div>
                <p className="flex justify-between border-b border-slate-800 pb-1.5 pt-1">
                  <span className="text-slate-500">Created</span>
                  <span className="text-slate-300">{formatDate(selected.created_at)}</span>
                </p>
                {selected.sent_at && (
                  <p className="flex justify-between border-b border-slate-800 pb-1.5">
                    <span className="text-slate-500">Sent At</span>
                    <span className="text-slate-300">{formatDate(selected.sent_at)}</span>
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-2 border-t border-violet-500/10">
                <button
                  onClick={handlePrint}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-violet-500/30 bg-violet-500/10 py-2.5 text-xs font-semibold text-violet-300 hover:bg-violet-500/20 transition"
                >
                  <Printer className="h-3.5 w-3.5" /> Print / Export A4 PDF
                </button>
                {selected.status === 'DRAFT' && (
                  <button
                    disabled={updatingId === selected.id}
                    onClick={() => handleStatusUpdate(selected, 'SENT')}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 py-2.5 text-xs font-semibold text-cyan-400 hover:bg-cyan-500/20 transition disabled:opacity-50"
                  >
                    <Send className="h-3.5 w-3.5" /> Mark as Sent
                  </button>
                )}
                {selected.status === 'SENT' && (
                  <button
                    disabled={updatingId === selected.id}
                    onClick={() => handleStatusUpdate(selected, 'PAID')}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 py-2.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition disabled:opacity-50"
                  >
                    <IndianRupee className="h-3.5 w-3.5" /> Mark as Paid
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-center p-8">
              <div>
                <AlertCircle className="mx-auto mb-2 h-8 w-8 text-slate-600" />
                <p className="text-sm text-slate-400">Generate or select an invoice to preview.</p>
              </div>
            </div>
          )}
        </aside>
      </section>
    </div>
  );
};

export default Invoices;

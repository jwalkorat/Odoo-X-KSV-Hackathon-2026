import React, { useEffect, useMemo, useState } from 'react';
import api from '../lib/api';
import { formatCurrency, formatDate, getStatusBadgeClass } from '../lib/utils';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Package,
  Printer,
  ShoppingCart,
  TrendingUp,
} from 'lucide-react';
import { MOCK_ORDERS } from '../mockData/mockDb';

const PurchaseOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/orders/purchase-orders');
      setOrders(data);
      if (data.length > 0) setSelectedId((c) => c ?? data[0].id);
    } catch {
      const enriched = MOCK_ORDERS.map((o) => ({
        ...o,
        rfq_title: 'Quantum Server Infrastructure Upgrade',
        vendor_name: 'Supernova Raw Materials Corp',
      }));
      setOrders(enriched);
      if (enriched.length > 0) setSelectedId((c) => c ?? enriched[0].id);
      setMessage('Backend unreachable — showing mock Purchase Orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const selected = useMemo(
    () => orders.find((o) => o.id === selectedId) || orders[0],
    [orders, selectedId]
  );

  const stats = useMemo(() => {
    const issued = orders.filter((o) => o.status === 'ISSUED').length;
    const completed = orders.filter((o) => o.status === 'COMPLETED').length;
    const totalSpend = orders.reduce((acc, o) => acc + (o.total_amount || 0), 0);
    return { issued, completed, totalSpend, total: orders.length };
  }, [orders]);

  const handleStatusUpdate = async (po, newStatus) => {
    setUpdatingId(po.id);
    setMessage('');
    try {
      const { data } = await api.patch(`/api/orders/purchase-orders/${po.id}/status`, { status: newStatus });
      setOrders((cur) => cur.map((o) => (o.id === po.id ? data : o)));
      setMessage(`PO ${po.po_number} marked as ${newStatus}.`);
    } catch (e) {
      setMessage(e.response?.data?.detail || 'Status update failed.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handlePrint = () => {
    if (!selected) return;
    const win = window.open('', '_blank', 'width=800,height=900');
    win.document.write(`
      <html><head><title>PO ${selected.po_number}</title>
      <style>
        body { font-family: 'Arial', sans-serif; padding: 40px; color: #111; }
        h1 { font-size: 22px; margin-bottom: 4px; }
        .badge { display:inline-block; padding:2px 10px; border-radius:999px; font-size:11px; font-weight:700; text-transform:uppercase; background:#e0f2fe; color:#0369a1; }
        .meta { color:#555; font-size:13px; margin-top:4px; }
        table { width:100%; border-collapse:collapse; margin-top:24px; font-size:13px; }
        th { background:#f1f5f9; text-align:left; padding:8px 12px; border-bottom:2px solid #e2e8f0; }
        td { padding:10px 12px; border-bottom:1px solid #f1f5f9; }
        .total-row td { font-weight:700; font-size:15px; background:#f8fafc; }
        .footer { margin-top:60px; font-size:11px; color:#94a3b8; text-align:center; }
        @media print { button { display:none; } }
      </style></head><body>
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div>
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:3px;color:#6366f1;margin-bottom:6px;">Procurement Galaxy ERP</div>
          <h1>Purchase Order</h1>
          <div class="badge">${selected.status}</div>
          <p class="meta">PO Number: <strong>${selected.po_number}</strong></p>
          <p class="meta">Issued: ${new Date(selected.issued_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}</p>
        </div>
        <div style="text-align:right; font-size:12px; color:#555;">
          <p><strong>RFQ Reference:</strong> ${selected.rfq_title || 'RFQ #' + selected.rfq_id}</p>
          <p><strong>Vendor:</strong> ${selected.vendor_name || 'Vendor #' + selected.vendor_id}</p>
        </div>
      </div>
      <table>
        <thead><tr><th>Description</th><th style="text-align:right">Amount (INR)</th></tr></thead>
        <tbody>
          <tr><td>Procurement Package — ${selected.rfq_title || 'RFQ #' + selected.rfq_id}</td><td style="text-align:right">${new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format(selected.total_amount)}</td></tr>
          <tr class="total-row"><td>Total</td><td style="text-align:right">${new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format(selected.total_amount)}</td></tr>
        </tbody>
      </table>
      <div class="footer">This is a system-generated Purchase Order. Authorized signature required for legal validity. — Procurement Galaxy ERP</div>
      <br/><button onclick="window.print()">🖨 Print / Save as PDF</button>
      </body></html>
    `);
    win.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Stats Banner */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="glass-panel rounded-xl border border-cyan-500/20 p-5 lg:col-span-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-cyan-300">Supply chain console</p>
          <h2 className="mt-2 font-outfit text-2xl font-bold text-slate-100">Purchase Orders</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Track issued POs, sign digital agreements, mark deliveries complete, and generate invoices.
          </p>
        </div>
        {[
          ['Total POs', stats.total, ClipboardList, 'text-slate-400'],
          ['Active (Issued)', stats.issued, Package, 'text-cyan-400'],
          ['Completed', stats.completed, CheckCircle2, 'text-emerald-400'],
          ['Total Spend', stats.totalSpend, TrendingUp, 'text-violet-400'],
        ].map(([label, value, Icon, color]) => (
          <div key={label} className="glass-panel rounded-xl border border-violet-500/10 p-5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">{label}</span>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <p className={`mt-3 font-mono font-semibold text-slate-100 ${label === 'Total Spend' ? 'text-lg mt-4' : 'text-3xl'}`}>
              {label === 'Total Spend' ? formatCurrency(value) : value}
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
        {/* PO List */}
        <div className="glass-panel overflow-hidden rounded-xl border border-violet-500/15">
          <div className="grid grid-cols-[1.5fr_1fr_1fr_120px] gap-4 border-b border-violet-500/10 px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-slate-500 max-lg:hidden">
            <span>PO Number / RFQ</span><span>Vendor</span><span>Issued Date</span><span>Status</span>
          </div>
          <div className="max-h-[580px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-sm text-slate-400">Syncing purchase order registry...</div>
            ) : orders.length === 0 ? (
              <div className="p-10 text-center">
                <AlertCircle className="mx-auto mb-2 h-8 w-8 text-slate-600" />
                <p className="text-sm text-slate-400">No purchase orders issued yet.</p>
              </div>
            ) : orders.map((po) => (
              <div
                key={po.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedId(po.id)}
                onKeyDown={(e) => e.key === 'Enter' && setSelectedId(po.id)}
                className={`grid grid-cols-1 gap-3 border-b border-violet-500/10 px-4 py-4 text-left transition hover:bg-slate-800/30 lg:grid-cols-[1.5fr_1fr_1fr_120px] lg:items-center cursor-pointer ${selectedId === po.id ? 'bg-cyan-500/5' : ''}`}
              >
                <div>
                  <p className="font-mono text-sm font-semibold text-slate-100">{po.po_number}</p>
                  <p className="mt-0.5 text-xs text-slate-500 truncate">{po.rfq_title || `RFQ #${po.rfq_id}`}</p>
                </div>
                <p className="text-sm text-slate-300 truncate">{po.vendor_name || `Vendor #${po.vendor_id}`}</p>
                <p className="text-xs text-slate-400">{formatDate(po.issued_at)}</p>
                <span className={`w-fit rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase ${getStatusBadgeClass(po.status)}`}>
                  {po.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Detail Panel */}
        <aside className="glass-panel rounded-xl border border-violet-500/15 p-5 space-y-5">
          {selected ? (
            <>
              <div className="border-b border-violet-500/10 pb-4">
                <span className={`inline-block rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase mb-2 ${getStatusBadgeClass(selected.status)}`}>
                  {selected.status}
                </span>
                <h3 className="font-mono text-lg font-bold text-slate-100">{selected.po_number}</h3>
                <p className="mt-1 text-xs text-slate-500">{selected.rfq_title || `RFQ #${selected.rfq_id}`}</p>
              </div>

              <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-4">
                <span className="font-mono text-[9px] uppercase tracking-widest text-cyan-300">Order Value</span>
                <p className="mt-1 font-mono text-2xl font-bold text-slate-100">{formatCurrency(selected.total_amount)}</p>
              </div>

              <div className="space-y-2.5 text-xs">
                {[
                  ['Vendor', selected.vendor_name || `Vendor #${selected.vendor_id}`],
                  ['Issued On', formatDate(selected.issued_at)],
                  ['PO Reference', selected.po_number],
                ].map(([k, v]) => (
                  <p key={k} className="flex justify-between border-b border-slate-800 pb-1.5">
                    <span className="text-slate-500">{k}</span>
                    <span className="text-slate-200 font-mono">{v}</span>
                  </p>
                ))}
              </div>

              {/* Actions */}
              <div className="space-y-2.5 pt-2 border-t border-violet-500/10">
                <button
                  onClick={handlePrint}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-violet-500/30 bg-violet-500/10 py-2.5 text-xs font-semibold text-violet-300 hover:bg-violet-500/20 transition"
                >
                  <Printer className="h-3.5 w-3.5" /> Print / Download PO
                </button>

                {selected.status === 'ISSUED' && (
                  <button
                    disabled={updatingId === selected.id}
                    onClick={() => handleStatusUpdate(selected, 'COMPLETED')}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 py-2.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Mark as Completed
                  </button>
                )}

                {selected.status === 'ISSUED' && (
                  <a
                    href="/invoices"
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 py-2.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 transition"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" /> Generate Invoice <ArrowRight className="h-3 w-3" />
                  </a>
                )}
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-center p-8">
              <div>
                <AlertCircle className="mx-auto mb-2 h-8 w-8 text-slate-600" />
                <p className="text-sm text-slate-400">Select a Purchase Order to inspect.</p>
              </div>
            </div>
          )}
        </aside>
      </section>
    </div>
  );
};

export default PurchaseOrders;

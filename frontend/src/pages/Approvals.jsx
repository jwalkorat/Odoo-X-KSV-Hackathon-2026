import React, { useEffect, useMemo, useState } from 'react';
import api from '../lib/api';
import { formatCurrency, formatDate, getStatusBadgeClass } from '../lib/utils';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  MessageSquare,
  ThumbsDown,
  ThumbsUp,
  User,
  XCircle,
} from 'lucide-react';
import { MOCK_APPROVALS } from '../mockData/mockDb';

const Approvals = () => {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [remarks, setRemarks] = useState('');

  const loadApprovals = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/approvals/');
      setApprovals(data);
      if (data.length > 0) {
        setSelectedId((current) => current ?? data[0].id);
      }
    } catch (error) {
      console.warn("Backend API unreachable. Falling back to mock approvals.");
      // Fallback to mock data and add placeholder details
      const enrichedMock = MOCK_APPROVALS.map(app => ({
        ...app,
        rfq_title: "Quantum Server Infrastructure Upgrade",
        vendor_name: "Supernova Raw Materials Corp",
        total_amount: 1150000.0,
        requested_by_username: "officer",
        approved_by_username: null,
        delivery_days: 8,
        notes: "Slightly longer lead time but lower pricing on Tachyon cabling."
      }));
      setApprovals(enrichedMock);
      if (enrichedMock.length > 0) {
        setSelectedId((current) => current ?? enrichedMock[0].id);
      }
      setMessage('Backend unreachable. Displaying fallback mock approvals console.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApprovals();
  }, []);

  const selectedApproval = useMemo(
    () => approvals.find((app) => app.id === selectedId) || approvals[0],
    [approvals, selectedId]
  );

  const stats = useMemo(() => {
    const total = approvals.length;
    const pending = approvals.filter((a) => a.status === 'PENDING').length;
    const approved = approvals.filter((a) => a.status === 'APPROVED').length;
    const rejected = approvals.filter((a) => a.status === 'REJECTED').length;
    return { total, pending, approved, rejected };
  }, [approvals]);

  const handleResolve = async (status) => {
    if (!selectedApproval) return;
    setResolving(true);
    setMessage('');
    try {
      const { data } = await api.post(`/api/approvals/${selectedApproval.id}/resolve`, {
        status,
        remarks: remarks.trim() || null,
      });
      setApprovals((current) =>
        current.map((item) => (item.id === selectedApproval.id ? data : item))
      );
      setRemarks('');
      setMessage(`Approval request was successfully resolved as ${status}.`);
    } catch (error) {
      setMessage(error.response?.data?.detail || 'Failed to resolve approval request.');
    } finally {
      setResolving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner and Metrics */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="glass-panel rounded-xl border border-cyan-500/20 p-5 lg:col-span-2">
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-cyan-300">Manager deck</p>
          <h2 className="mt-2 font-outfit text-2xl font-bold text-slate-100">Approvals Workflow</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Review pending quote requests, evaluate vendor terms, and sign-off or reject to spin up purchase orders.
          </p>
        </div>
        {[
          ['Total Requests', stats.total, FileText, 'text-slate-400'],
          ['Pending sign-off', stats.pending, Clock, 'text-amber-400'],
          ['Approved packages', stats.approved, CheckCircle2, 'text-emerald-400'],
          ['Rejected packages', stats.rejected, XCircle, 'text-red-400'],
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

      {/* Main Content Pane */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_390px]">
        {/* List of approvals */}
        <div className="glass-panel overflow-hidden rounded-xl border border-violet-500/15">
          <div className="grid grid-cols-[1.5fr_1fr_1fr_120px] gap-4 border-b border-violet-500/10 px-4 py-3 font-mono text-xs uppercase tracking-widest text-slate-500 max-lg:hidden">
            <span>RFQ & Requisition</span>
            <span>Vendor & Amount</span>
            <span>Requested By</span>
            <span>Status</span>
          </div>

          <div className="max-h-[600px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-sm text-slate-400">Syncing approvals ledger...</div>
            ) : approvals.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400">No approvals recorded in this cycle.</div>
            ) : (
              approvals.map((app) => (
                <div
                  key={app.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedId(app.id)}
                  onKeyDown={(e) => e.key === 'Enter' && setSelectedId(app.id)}
                  className={`grid grid-cols-1 gap-3 border-b border-violet-500/10 px-4 py-4 text-left transition hover:bg-slate-800/30 lg:grid-cols-[1.5fr_1fr_1fr_120px] lg:items-center ${
                    selectedId === app.id ? 'bg-cyan-500/5' : ''
                  }`}
                >
                  <div>
                    <p className="font-semibold text-slate-100 truncate">{app.rfq_title || `RFQ Requisition #${app.rfq_id}`}</p>
                    <p className="mt-1 text-xs text-slate-500">Requested: {formatDate(app.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-200 truncate">{app.vendor_name || `Vendor #${app.vendor_id}`}</p>
                    <p className="mt-0.5 text-xs text-cyan-400 font-mono">{formatCurrency(app.total_amount || 0)}</p>
                  </div>
                  <div>
                    <span className="flex items-center gap-1.5 text-xs text-slate-400">
                      <User className="h-3 w-3 text-violet-400" />
                      {app.requested_by_username || `Officer #${app.requested_by_id}`}
                    </span>
                  </div>
                  <div>
                    <span className={`inline-block rounded-full px-2.5 py-0.5 font-mono text-xs uppercase ${getStatusBadgeClass(app.status)}`}>
                      {app.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Action / Detail sidebar */}
        <aside className="glass-panel rounded-xl border border-violet-500/15 p-5 flex flex-col justify-between">
          {selectedApproval ? (
            <div className="space-y-6">
              <div className="border-b border-violet-500/10 pb-4">
                <span className={`inline-block rounded-full px-2.5 py-0.5 font-mono text-xs uppercase mb-2 ${getStatusBadgeClass(selectedApproval.status)}`}>
                  {selectedApproval.status}
                </span>
                <h3 className="font-outfit text-lg font-bold text-slate-100 leading-snug">
                  {selectedApproval.rfq_title || `RFQ #${selectedApproval.rfq_id}`}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Uplink Code: APP-REF-{selectedApproval.id.toString().padStart(4, '0')}
                </p>
              </div>

              {/* Package Summary */}
              <div className="space-y-4">
                <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-4">
                  <span className="font-mono text-xs uppercase tracking-widest text-cyan-300">Quote Value</span>
                  <p className="mt-1 font-mono text-2xl font-bold text-slate-100">
                    {formatCurrency(selectedApproval.total_amount || 0)}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Terms: Deliver in <span className="text-cyan-300 font-semibold">{selectedApproval.delivery_days || 'N/A'} days</span>
                  </p>
                </div>

                <div className="space-y-2.5 text-xs text-slate-300">
                  <p className="flex justify-between border-b border-slate-800 pb-1.5">
                    <span className="text-slate-500">Vendor</span>
                    <span className="font-semibold text-slate-200">{selectedApproval.vendor_name || 'N/A'}</span>
                  </p>
                  <p className="flex justify-between border-b border-slate-800 pb-1.5">
                    <span className="text-slate-500">Requested By</span>
                    <span className="text-slate-200 font-mono">{selectedApproval.requested_by_username || 'N/A'}</span>
                  </p>
                  <p className="flex justify-between border-b border-slate-800 pb-1.5">
                    <span className="text-slate-500">Requested Date</span>
                    <span className="text-slate-200">{formatDate(selectedApproval.created_at)}</span>
                  </p>
                  {selectedApproval.notes && (
                    <div className="mt-3 bg-slate-900/50 rounded-lg p-3 border border-slate-800">
                      <span className="font-mono text-xs uppercase tracking-wider text-slate-500 block mb-1">Vendor Note</span>
                      <p className="text-slate-400 leading-relaxed italic">"{selectedApproval.notes}"</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Controls */}
              {selectedApproval.status === 'PENDING' ? (
                <div className="space-y-4 pt-4 border-t border-violet-500/10">
                  <label className="block text-xs text-slate-300">
                    Add decision remarks
                    <textarea
                      rows="3"
                      className="mt-1.5 w-full resize-none rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400 placeholder:text-slate-600"
                      placeholder="Remarks are appended to the audit log and purchase order documentation..."
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                    />
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      disabled={resolving}
                      onClick={() => handleResolve('APPROVED')}
                      className="flex items-center justify-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 py-2.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition disabled:opacity-50"
                    >
                      <ThumbsUp className="h-3.5 w-3.5" /> Approve
                    </button>
                    <button
                      type="button"
                      disabled={resolving}
                      onClick={() => handleResolve('REJECTED')}
                      className="flex items-center justify-center gap-1.5 rounded-lg border border-red-500/40 bg-red-500/10 py-2.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition disabled:opacity-50"
                    >
                      <ThumbsDown className="h-3.5 w-3.5" /> Reject
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 pt-4 border-t border-violet-500/10 text-xs">
                  <div className="rounded-lg bg-slate-900/60 border border-slate-800 p-3.5 space-y-2">
                    <p className="flex justify-between">
                      <span className="text-slate-500">Resolved By</span>
                      <span className="font-mono text-slate-300">{selectedApproval.approved_by_username || 'System'}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-slate-500">Resolved Date</span>
                      <span className="text-slate-300">{formatDate(selectedApproval.resolved_at)}</span>
                    </p>
                    {selectedApproval.remarks && (
                      <div className="pt-2 border-t border-slate-800 mt-2">
                        <span className="text-xs font-mono uppercase text-slate-500 block mb-1">Resolution Remarks</span>
                        <p className="text-slate-400 italic">"{selectedApproval.remarks}"</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center p-8">
              <AlertCircle className="w-8 h-8 text-slate-600 mb-2" />
              <p className="text-sm text-slate-400">Select an approval request to review details.</p>
            </div>
          )}
        </aside>
      </section>
    </div>
  );
};

export default Approvals;

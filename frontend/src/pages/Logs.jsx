import React, { useEffect, useMemo, useState } from 'react';
import api from '../lib/api';
import { formatDate } from '../lib/utils';
import {
  Activity,
  AlertCircle,
  FileText,
  Filter,
  Search,
  User,
} from 'lucide-react';
import { MOCK_LOGS } from '../mockData/mockDb';

const ENTITY_TYPES = ['ALL', 'RFQ', 'Quotation', 'Approval', 'PurchaseOrder', 'Invoice'];

const entityColor = (type) => {
  const t = (type || '').toLowerCase();
  if (t === 'rfq') return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
  if (t === 'quotation') return 'bg-violet-500/10 text-violet-400 border-violet-500/30';
  if (t === 'approval') return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
  if (t === 'purchaseorder') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  if (t === 'invoice') return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
  return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
};

const Logs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [entityFilter, setEntityFilter] = useState('ALL');
  const [message, setMessage] = useState('');

  const loadLogs = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/logs/?limit=100');
      setLogs(data);
    } catch {
      const enrichedMock = MOCK_LOGS.map((log) => ({ ...log, username: ['officer', 'vendor1', 'vendor2', 'manager', 'admin'][log.user_id % 5] || 'user' }));
      setLogs(enrichedMock);
      setMessage('Backend unreachable — showing mock activity logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesType = entityFilter === 'ALL' || log.entity_type === entityFilter;
      const haystack = `${log.action} ${log.username || ''} ${log.entity_type}`.toLowerCase();
      const matchesQuery = !query.trim() || haystack.includes(query.trim().toLowerCase());
      return matchesType && matchesQuery;
    });
  }, [logs, query, entityFilter]);

  const stats = useMemo(() => {
    const byType = {};
    logs.forEach((l) => {
      byType[l.entity_type] = (byType[l.entity_type] || 0) + 1;
    });
    return { total: logs.length, byType };
  }, [logs]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="glass-panel rounded-xl border border-cyan-500/20 p-5 lg:col-span-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-cyan-300">Admin console</p>
          <h2 className="mt-2 font-outfit text-2xl font-bold text-slate-100">Activity Audit Logs</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Full system audit trail. Search and filter by action type to trace any procurement event across the Galaxy.
          </p>
        </div>
        {[
          ['Total Events', stats.total, Activity, 'text-slate-400'],
          ['RFQ Actions', stats.byType['RFQ'] || 0, FileText, 'text-cyan-400'],
          ['Approvals', (stats.byType['Approval'] || 0), AlertCircle, 'text-amber-400'],
          ['PO & Invoices', (stats.byType['PurchaseOrder'] || 0) + (stats.byType['Invoice'] || 0), FileText, 'text-emerald-400'],
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

      {/* Filters */}
      <div className="glass-panel rounded-xl border border-violet-500/15 p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              className="w-full rounded-lg border border-slate-700 bg-slate-950/70 py-2 pl-9 pr-3 text-sm text-slate-100 outline-none focus:border-cyan-400"
              placeholder="Search by action, username, or entity type..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <label className="relative block">
            <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <select
              className="w-full rounded-lg border border-slate-700 bg-slate-950/70 py-2 pl-9 pr-3 text-sm text-slate-100 outline-none focus:border-cyan-400"
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
            >
              {ENTITY_TYPES.map((t) => (
                <option key={t} value={t}>{t === 'ALL' ? 'All event types' : t}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Log Timeline */}
      <div className="glass-panel overflow-hidden rounded-xl border border-violet-500/15">
        <div className="grid grid-cols-[180px_1fr_140px_120px] gap-4 border-b border-violet-500/10 px-5 py-3 font-mono text-[10px] uppercase tracking-widest text-slate-500 max-md:hidden">
          <span>Timestamp</span><span>Action</span><span>User</span><span>Category</span>
        </div>

        <div className="max-h-[620px] overflow-y-auto divide-y divide-violet-500/10">
          {loading ? (
            <div className="p-8 text-center text-sm text-slate-400">Fetching audit stream...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-10 text-center">
              <AlertCircle className="mx-auto mb-2 h-8 w-8 text-slate-600" />
              <p className="text-sm text-slate-400">No log entries match your filter.</p>
            </div>
          ) : (
            filteredLogs.map((log, idx) => (
              <div
                key={log.id ?? idx}
                className="grid grid-cols-1 gap-3 px-5 py-4 hover:bg-slate-800/20 transition md:grid-cols-[180px_1fr_140px_120px] md:items-center"
              >
                {/* Timestamp */}
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                  <span className="font-mono text-[11px] text-slate-500 leading-tight">
                    {formatDate(log.created_at)}
                  </span>
                </div>

                {/* Action */}
                <p className="text-sm text-slate-300 leading-relaxed">{log.action}</p>

                {/* User */}
                <div className="flex items-center gap-1.5">
                  <User className="h-3 w-3 text-violet-400 shrink-0" />
                  <span className="font-mono text-xs text-slate-400">{log.username || `user_${log.user_id}`}</span>
                </div>

                {/* Category badge */}
                <span className={`w-fit rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase ${entityColor(log.entity_type)}`}>
                  {log.entity_type}
                </span>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-violet-500/10 px-5 py-3 font-mono text-[10px] text-slate-500">
          Showing {filteredLogs.length} of {logs.length} events
        </div>
      </div>
    </div>
  );
};

export default Logs;

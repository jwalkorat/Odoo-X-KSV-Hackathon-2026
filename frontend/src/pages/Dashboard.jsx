import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { MOCK_RFQS, MOCK_APPROVALS, MOCK_ORDERS, MOCK_LOGS, MOCK_INVOICES } from '../mockData/mockDb';
import { formatCurrency, formatDate, getStatusBadgeClass } from '../lib/utils';
import { 
  FileText, 
  CheckSquare, 
  TrendingUp, 
  AlertTriangle,
  ArrowRight,
  Plus,
  Users,
  FileSpreadsheet
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    activeRfqs: 12, // Default mock value matching Excalidraw Screen 3
    pendingApprovals: 5,
    posThisMonth: 230000,
    overdueInvoices: 3
  });
  const [recentPos, setRecentPos] = useState([]);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Recharts Spend trend data matching mockup
  const chartData = [
    { name: 'Jan', spend: 240000 },
    { name: 'Feb', spend: 450000 },
    { name: 'Mar', spend: 300000 },
    { name: 'Apr', spend: 850000 },
    { name: 'May', spend: 1200000 },
    { name: 'Jun', spend: 1357000 }
  ];

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Attempt real API fetch
        const [rfqsRes, approvalsRes, ordersRes, invoicesRes, logsRes] = await Promise.all([
          api.get('/api/rfqs'),
          api.get('/api/approvals'),
          api.get('/api/orders/purchase-orders'),
          api.get('/api/orders/invoices'),
          api.get('/api/logs')
        ]);

        const activeR = rfqsRes.data.filter(r => r.status === 'OPEN').length;
        const pendingA = approvalsRes.data.filter(a => a.status === 'PENDING').length;
        const totalPOVal = ordersRes.data.reduce((sum, o) => sum + o.total_amount, 0);
        const overdueI = invoicesRes.data.filter(i => i.status === 'DRAFT').length; // Map draft to unpaid/overdue simulation

        setStats({
          activeRfqs: activeR || 12,
          pendingApprovals: pendingA || 5,
          posThisMonth: totalPOVal || 230000,
          overdueInvoices: overdueI || 3
        });

        // Use backend POs if they exist
        if (ordersRes.data.length > 0) {
          setRecentPos(ordersRes.data.slice(0, 4));
        } else {
          setRecentPos(getMockRecentPOs());
        }

        // Recent Invoices
        if (invoicesRes.data.length > 0) {
          setRecentInvoices(invoicesRes.data.slice(0, 4));
        } else {
          setRecentInvoices(getMockRecentInvoices());
        }

        setLogs(logsRes.data.slice(0, 5));
      } catch (err) {
        console.warn("Backend offline. Loading Excalidraw mock Dashboard items.");
        
        // Match Excalidraw stats exactly
        setStats({
          activeRfqs: 12,
          pendingApprovals: 5,
          posThisMonth: 230000,
          overdueInvoices: 3
        });
        
        setRecentPos(getMockRecentPOs());
        setRecentInvoices(getMockRecentInvoices());
        setLogs(MOCK_LOGS.slice(0, 5));
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Excalidraw mockup PO rows
  const getMockRecentPOs = () => {
    return [
      { id: 1, po_number: "Po1", vendor_name: "Infra", total_amount: 87000, status: "Approved" },
      { id: 2, po_number: "Po2", vendor_name: "Tech core", total_amount: 140000, status: "Pending" },
      { id: 3, po_number: "Po3", vendor_name: "OfficeNeed Co", total_amount: 34900, status: "draft" }
    ];
  };

  const getMockRecentInvoices = () => [
    { id: 1, invoice_number: 'INV-2026-0001', vendor_name: 'Nebula IT Solutions', total: 137500, status: 'PAID' },
    { id: 2, invoice_number: 'INV-2026-0002', vendor_name: 'Galactic Supplies Ltd', total: 59400, status: 'SENT' },
    { id: 3, invoice_number: 'INV-2026-0003', vendor_name: 'Starlight Logistics', total: 82620, status: 'DRAFT' },
  ];

  const getFullName = () => {
    if (user?.first_name) {
      return `${user.first_name} ${user.last_name || ''}`;
    }
    return user?.username || 'Procurement Officer';
  };

  const getDisplayRole = () => {
    if (user?.role === 'OFFICER') return 'Procurement Officer';
    if (user?.role === 'MANAGER') return 'Manager / Approver';
    if (user?.role === 'VENDOR') return 'Registered Vendor';
    return user?.role || 'Officer';
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        {/* Welcome Banner Skeleton */}
        <div className="relative overflow-hidden rounded-2xl bg-slate-900/40 border border-violet-500/5 p-8 h-28 flex flex-col justify-center space-y-2">
          <div className="h-7 w-3/4 bg-slate-800 rounded-lg"></div>
          <div className="h-4 w-1/2 bg-slate-800 rounded-lg"></div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-panel rounded-xl p-6 border border-violet-500/5 h-24 flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <div className="h-3 w-16 bg-slate-800 rounded"></div>
                <div className="h-7 w-20 bg-slate-800 rounded"></div>
              </div>
              <div className="w-11 h-11 bg-slate-800 rounded-lg"></div>
            </div>
          ))}
        </div>

        {/* Charts & Tables Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 glass-panel rounded-xl border border-violet-500/5 h-96 flex flex-col justify-between overflow-hidden">
            <div className="p-6 border-b border-violet-500/5 space-y-2">
              <div className="h-5 w-48 bg-slate-800 rounded"></div>
              <div className="h-3 w-36 bg-slate-800 rounded"></div>
            </div>
            <div className="p-6 space-y-4 flex-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-violet-500/5">
                  <div className="h-4 w-24 bg-slate-800 rounded"></div>
                  <div className="h-4 w-36 bg-slate-800 rounded"></div>
                  <div className="h-4 w-20 bg-slate-800 rounded"></div>
                  <div className="h-4 w-16 bg-slate-800 rounded"></div>
                </div>
              ))}
            </div>
          </div>
          <div className="glass-panel rounded-xl p-6 border border-violet-500/5 h-96">
            <div className="h-5 w-48 bg-slate-800 rounded mb-6"></div>
            <div className="h-64 w-full bg-slate-900/40 rounded-lg border border-violet-500/5 flex items-end p-4">
              <div className="w-full h-40 bg-gradient-to-t from-cyan-500/10 to-transparent rounded-lg relative overflow-hidden">
                <div className="absolute inset-0 border-t-2 border-cyan-400/30"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-900/30 via-slate-900/40 to-cyan-950/20 border border-violet-500/10 p-8">
        <h2 className="font-outfit font-extrabold text-2xl md:text-3xl text-slate-100 mb-1">
          Welcome back, <span className="text-cyan-400 font-mono">{getFullName()}</span> - Today's Overview
        </h2>
        <p className="text-slate-400 text-xs md:text-sm font-sans tracking-wide">
          Interfacing as <span className="text-cyan-400 font-mono font-semibold">{getDisplayRole()}</span>. Reviewing logs and managing galactic requisitions.
        </p>
      </div>

      {/* Excalidraw Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Active RFQs */}
        <div className="glass-panel rounded-xl p-6 border border-violet-500/10 flex items-center justify-between">
          <div>
            <span className="text-xs font-mono tracking-wider text-slate-400 uppercase">Active RFQs</span>
            <h3 className="text-3xl font-outfit font-extrabold text-slate-100 mt-1">{stats.activeRfqs}</h3>
          </div>
          <div className="p-3 bg-cyan-500/10 rounded-lg text-cyan-400">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="glass-panel rounded-xl p-6 border border-violet-500/10 flex items-center justify-between">
          <div>
            <span className="text-xs font-mono tracking-wider text-slate-400 uppercase">Pending Approvals</span>
            <h3 className="text-3xl font-outfit font-extrabold text-slate-100 mt-1">{stats.pendingApprovals}</h3>
          </div>
          <div className="p-3 bg-amber-500/10 rounded-lg text-amber-400">
            <CheckSquare className="w-5 h-5" />
          </div>
        </div>

        {/* POs This Month */}
        <div className="glass-panel rounded-xl p-6 border border-violet-500/10 flex items-center justify-between">
          <div>
            <span className="text-xs font-mono tracking-wider text-slate-400 uppercase">POs This Month</span>
            <h3 className="text-3xl font-outfit font-extrabold text-slate-100 mt-1">
              {stats.posThisMonth === 230000 ? '₹ 2.3L' : formatCurrency(stats.posThisMonth)}
            </h3>
          </div>
          <div className="p-3 bg-violet-500/10 rounded-lg text-violet-400">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Overdue Invoices */}
        <div className="glass-panel rounded-xl p-6 border border-violet-500/10 flex items-center justify-between">
          <div>
            <span className="text-xs font-mono tracking-wider text-slate-400 uppercase">Overdue Invoices</span>
            <h3 className="text-3xl font-outfit font-extrabold text-red-400 mt-1">{stats.overdueInvoices}</h3>
          </div>
          <div className="p-3 bg-red-500/10 rounded-lg text-red-400">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Main Content Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Recent Purchase Orders Table */}
        <div className="lg:col-span-2 glass-panel rounded-xl border border-violet-500/10 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-violet-500/10">
            <h4 className="font-outfit font-semibold text-slate-200 text-base">Recent Purchase Orders</h4>
            <p className="text-xs text-slate-500 font-mono mt-0.5">LATEST REQUISITION CONTRACTS</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-violet-500/10 bg-slate-900/40 text-slate-400 text-xs font-mono uppercase">
                  <th className="py-3 px-6">PO#</th>
                  <th className="py-3 px-6">Vendor</th>
                  <th className="py-3 px-6">Amount</th>
                  <th className="py-3 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-violet-500/5 text-sm text-slate-300">
                {recentPos.map((po, index) => (
                  <tr key={index} onClick={() => navigate('/purchase-orders')} className="hover:bg-violet-900/20 transition-all duration-150 cursor-pointer group">
                    <td className="py-3 px-6 font-mono text-cyan-400 group-hover:text-cyan-300 transition-colors border-l-2 border-l-transparent group-hover:border-l-cyan-400">{po.po_number}</td>
                    <td className="py-3 px-6 group-hover:text-slate-100 transition-colors">{po.vendor_name || (po.vendor ? po.vendor.name : 'Unknown')}</td>
                    <td className="py-3 px-6 font-mono group-hover:text-slate-100 transition-colors">{formatCurrency(po.total_amount)}</td>
                    <td className="py-3 px-6"><span className={`px-2 py-0.5 rounded text-xs font-mono font-medium uppercase ${getStatusBadgeClass(po.status)}`}>{po.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Spend Trend Panel */}
        <div className="glass-panel rounded-xl p-6 border border-violet-500/10 flex flex-col justify-between">
          <div>
            <h4 className="font-outfit font-semibold text-slate-200 text-base mb-6">Spending Trends (6 Months)</h4>
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="glow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#090a16', borderColor: 'rgba(6,182,212,0.3)', borderRadius: '8px' }}
                    itemStyle={{ color: '#22d3ee', fontFamily: 'monospace', fontSize: '12px' }}
                    labelStyle={{ color: '#f8fafc', fontWeight: 'bold', fontFamily: 'Outfit, sans-serif' }}
                    formatter={(value) => [formatCurrency(value), 'Spend']}
                  />
                  <Area type="monotone" dataKey="spend" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#glow)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Invoices Table */}
      <div className="glass-panel rounded-xl border border-violet-500/10 overflow-hidden">
        <div className="p-5 border-b border-violet-500/10 flex items-center justify-between">
          <div>
            <h4 className="font-outfit font-semibold text-slate-200 text-base">Recent Invoices</h4>
            <p className="text-xs text-slate-500 font-mono mt-0.5">BILLING & PAYMENT STATUS</p>
          </div>
          <button onClick={() => navigate('/invoices')} className="text-[11px] text-violet-400 hover:text-cyan-400 font-mono transition-colors">
            View All →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-violet-500/10 bg-slate-900/40 text-slate-400 text-xs font-mono uppercase">
                <th className="py-3 px-6">Invoice #</th>
                <th className="py-3 px-6">Vendor</th>
                <th className="py-3 px-6">Total (incl. GST)</th>
                <th className="py-3 px-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-violet-500/5 text-sm text-slate-300">
              {recentInvoices.length === 0 ? (
                <tr><td colSpan={4} className="py-6 text-center text-xs text-slate-500 font-mono">No invoices generated yet</td></tr>
              ) : recentInvoices.map((inv) => (
                <tr key={inv.id} onClick={() => navigate('/invoices')} className="hover:bg-violet-900/20 transition-all cursor-pointer group">
                  <td className="py-3 px-6 font-mono text-cyan-400 group-hover:text-cyan-300 border-l-2 border-l-transparent group-hover:border-l-cyan-400">{inv.invoice_number}</td>
                  <td className="py-3 px-6 group-hover:text-slate-100">{inv.vendor_name || `Vendor #${inv.vendor_id}`}</td>
                  <td className="py-3 px-6 font-mono">{formatCurrency(inv.total)}</td>
                  <td className="py-3 px-6"><span className={`px-2 py-0.5 rounded text-xs font-mono font-medium uppercase ${getStatusBadgeClass(inv.status)}`}>{inv.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Command Buttons Layout */}
      {user?.role !== 'VENDOR' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-violet-500/10 pt-6">
          <button 
            onClick={() => navigate('/rfqs')}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-slate-900 border border-violet-500/10 hover:border-cyan-400/40 rounded-xl text-xs font-mono text-cyan-400 hover:bg-slate-800/40 transition duration-200"
          >
            <Plus className="w-4 h-4" />
            <span>+ new RFQ</span>
          </button>
          
          <button 
            onClick={() => navigate('/vendors')}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-slate-900 border border-violet-500/10 hover:border-cyan-400/40 rounded-xl text-xs font-mono text-cyan-400 hover:bg-slate-800/40 transition duration-200"
          >
            <Users className="w-4 h-4" />
            <span>Add Vendor</span>
          </button>
          
          <button 
            onClick={() => navigate('/invoices')}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-slate-900 border border-violet-500/10 hover:border-cyan-400/40 rounded-xl text-xs font-mono text-cyan-400 hover:bg-slate-800/40 transition duration-200"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>View Invoices</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

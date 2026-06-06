import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { MOCK_RFQS, MOCK_APPROVALS, MOCK_ORDERS, MOCK_LOGS, MOCK_VENDORS } from '../mockData/mockDb';
import { formatCurrency, formatDate } from '../lib/utils';
import { 
  FileText, 
  CheckSquare, 
  TrendingUp, 
  Users, 
  ArrowRight,
  Plus,
  AlertCircle
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
  const [stats, setStats] = useState({
    activeRfqs: 0,
    pendingApprovals: 0,
    totalSpend: 0,
    vendorCount: 0
  });
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Spend chart data - mock format
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
        // Attempt to fetch from real API endpoints
        const [rfqsRes, approvalsRes, vendorsRes, ordersRes, logsRes] = await Promise.all([
          api.get('/api/rfqs'),
          api.get('/api/approvals'),
          api.get('/api/vendors'),
          api.get('/api/orders/purchase-orders'),
          api.get('/api/logs')
        ]);

        const activeR = rfqsRes.data.filter(r => r.status === 'OPEN').length;
        const pendingA = approvalsRes.data.filter(a => a.status === 'PENDING').length;
        const vendorsC = vendorsRes.data.length;
        const spendSum = ordersRes.data.reduce((acc, curr) => acc + curr.total_amount, 0);

        setStats({
          activeRfqs: activeR,
          pendingApprovals: pendingA,
          totalSpend: spendSum,
          vendorCount: vendorsC
        });
        setLogs(logsRes.data.slice(0, 5));
      } catch (err) {
        console.warn("Backend API unreachable. Rendering mock console dashboard data.");
        
        // MOCK DATABASE FALLBACK FOR DEVELOPMENT
        const activeR = MOCK_RFQS.filter(r => r.status === 'OPEN').length;
        const pendingA = MOCK_APPROVALS.filter(a => a.status === 'PENDING').length;
        const vendorsC = MOCK_VENDORS.length;
        const spendSum = MOCK_ORDERS.reduce((acc, curr) => acc + curr.total_amount, 0);

        setStats({
          activeRfqs: activeR,
          pendingApprovals: pendingA,
          totalSpend: spendSum,
          vendorCount: vendorsC
        });
        setLogs(MOCK_LOGS.slice(0, 5));
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div class="space-y-8">
      {/* Welcome Banner */}
      <div class="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-900/40 via-indigo-950/30 to-cyan-950/20 border border-violet-500/15 p-8">
        <div class="absolute right-0 top-0 w-80 h-full opacity-10 bg-radial-gradient -z-10"></div>
        <h2 class="font-outfit font-extrabold text-2xl md:text-3xl text-slate-100 mb-1">
          Welcome back, Officer <span class="text-cyan-400 font-mono">{user?.username}</span>!
        </h2>
        <p class="text-slate-400 text-xs md:text-sm max-w-xl font-sans">
          Your command deck is fully synced with the Galactic Logistics network. Monitoring 4 active vendor quadrants and tracking resource requisitions.
        </p>
      </div>

      {/* Grid statistics cards */}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Active RFQs */}
        <div class="glass-panel rounded-xl p-6 border border-violet-500/10 flex items-center justify-between">
          <div>
            <span class="text-[10px] font-mono tracking-widest text-slate-500 uppercase">Active RFQs</span>
            <h3 class="text-3xl font-outfit font-bold text-slate-100 mt-1 font-mono">{stats.activeRfqs}</h3>
            <p class="text-[10px] text-cyan-400 mt-1 font-mono">Invited vendors responding</p>
          </div>
          <div class="p-3.5 bg-cyan-500/10 rounded-lg text-cyan-400">
            <FileText class="w-5 h-5" />
          </div>
        </div>

        {/* Pending Approvals */}
        <div class="glass-panel rounded-xl p-6 border border-violet-500/10 flex items-center justify-between">
          <div>
            <span class="text-[10px] font-mono tracking-widest text-slate-500 uppercase">Pending Approvals</span>
            <h3 class="text-3xl font-outfit font-bold text-slate-100 mt-1 font-mono">{stats.pendingApprovals}</h3>
            <p class="text-[10px] text-amber-400 mt-1 font-mono">Requires Manager sign-off</p>
          </div>
          <div class="p-3.5 bg-amber-500/10 rounded-lg text-amber-400">
            <CheckSquare class="w-5 h-5" />
          </div>
        </div>

        {/* Total Spend */}
        <div class="glass-panel rounded-xl p-6 border border-violet-500/10 flex items-center justify-between">
          <div>
            <span class="text-[10px] font-mono tracking-widest text-slate-500 uppercase">Allocated Spend</span>
            <h3 class="text-xl font-outfit font-bold text-slate-100 mt-2 font-mono">{formatCurrency(stats.totalSpend)}</h3>
            <p class="text-[10px] text-emerald-400 mt-1.5 font-mono">Active purchase orders</p>
          </div>
          <div class="p-3.5 bg-emerald-500/10 rounded-lg text-emerald-400">
            <TrendingUp class="w-5 h-5" />
          </div>
        </div>

        {/* Total Vendors */}
        <div class="glass-panel rounded-xl p-6 border border-violet-500/10 flex items-center justify-between">
          <div>
            <span class="text-[10px] font-mono tracking-widest text-slate-500 uppercase">Active Vendors</span>
            <h3 class="text-3xl font-outfit font-bold text-slate-100 mt-1 font-mono">{stats.vendorCount}</h3>
            <p class="text-[10px] text-violet-400 mt-1 font-mono">Verified in the registry</p>
          </div>
          <div class="p-3.5 bg-violet-500/10 rounded-lg text-violet-400">
            <Users class="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Analytics chart and logs timeline */}
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recharts card */}
        <div class="lg:col-span-2 glass-panel rounded-xl p-6 border border-violet-500/10">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h4 class="font-outfit font-semibold text-slate-200 text-base">Procurement Spending Trend</h4>
              <p class="text-[10px] text-slate-500 font-mono mt-0.5">LATEST 6 CYCLES</p>
            </div>
            <span class="text-xs text-slate-400 font-mono">INR (₹)</span>
          </div>

          <div class="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="spendGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(139, 92, 246, 0.2)', color: '#f8fafc' }}
                  formatter={(value) => [formatCurrency(value), 'Spend']}
                />
                <Area type="monotone" dataKey="spend" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#spendGlow)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Real-time timeline log */}
        <div class="glass-panel rounded-xl p-6 border border-violet-500/10 flex flex-col justify-between">
          <div>
            <h4 class="font-outfit font-semibold text-slate-200 text-base mb-6">Uplink Activity Stream</h4>
            <div class="space-y-5">
              {logs.map((log) => (
                <div key={log.id} class="flex items-start space-x-3 text-xs">
                  <div class="w-2 h-2 rounded-full bg-cyan-400 mt-1.5 shrink-0 shadow-glow-cyan"></div>
                  <div class="space-y-1">
                    <p class="text-slate-300 font-sans leading-relaxed">{log.action}</p>
                    <span class="text-[9px] text-slate-500 font-mono block">{formatDate(log.created_at)}</span>
                  </div>
                </div>
              ))}
              {logs.length === 0 && (
                <div class="flex flex-col items-center justify-center py-12 text-slate-500 space-y-2">
                  <AlertCircle class="w-8 h-8 opacity-40" />
                  <p class="text-xs font-mono">No activity packets recorded</p>
                </div>
              )}
            </div>
          </div>

          <div class="mt-6 border-t border-violet-500/10 pt-4">
            <button class="w-full flex items-center justify-center space-x-2 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition duration-150">
              <span>Inspect audit trail</span>
              <ArrowRight class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

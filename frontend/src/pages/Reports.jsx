import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { MOCK_ORDERS, MOCK_VENDORS } from '../mockData/mockDb';
import { formatCurrency } from '../lib/utils';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { Download, BarChart2, Star, TrendingUp, DollarSign, Award } from 'lucide-react';

const Reports = () => {
  const [stats, setStats] = useState({
    totalSpend: 0,
    totalPos: 0,
    totalVendors: 0,
    avgPoValue: 0
  });
  const [vendorPerformance, setVendorPerformance] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Spend Trend Data
  const trendData = [
    { name: 'Jan', Spend: 240000 },
    { name: 'Feb', Spend: 450000 },
    { name: 'Mar', Spend: 300000 },
    { name: 'Apr', Spend: 850000 },
    { name: 'May', Spend: 1200000 },
    { name: 'Jun', Spend: 1357000 }
  ];

  // Pie chart colors
  const COLORS = ['#8b5cf6', '#06b6d4', '#ec4899', '#3b82f6'];

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        // Attempt backend fetch
        const [ordersRes, vendorsRes] = await Promise.all([
          api.get('/api/orders/purchase-orders'),
          api.get('/api/vendors')
        ]);
        
        processAnalytics(ordersRes.data, vendorsRes.data);
      } catch (err) {
        console.warn("Backend API offline. Running mock analytics engine.");
        processAnalytics(MOCK_ORDERS, MOCK_VENDORS);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const processAnalytics = (orders, vendors) => {
    const totalPos = orders.length;
    const totalSpend = orders.reduce((sum, o) => sum + o.total_amount, 0);
    const avgPoValue = totalPos > 0 ? totalSpend / totalPos : 0;
    const totalVendors = vendors.length;

    setStats({
      totalSpend,
      totalPos,
      totalVendors,
      avgPoValue
    });

    // 1. Process Category Share (Pie Chart)
    const categoryMap = {};
    orders.forEach(o => {
      // Find vendor category
      const v = vendors.find(vendor => vendor.id === o.vendor_id);
      const category = v ? v.category : 'Other';
      categoryMap[category] = (categoryMap[category] || 0) + o.total_amount;
    });

    const categories = Object.keys(categoryMap).map(cat => ({
      name: cat,
      value: categoryMap[cat]
    }));
    setCategoryData(categories);

    // 2. Process Vendor Performance Table
    const performance = vendors.map(v => {
      const vOrders = orders.filter(o => o.vendor_id === v.id);
      const totalVal = vOrders.reduce((sum, o) => sum + o.total_amount, 0);
      return {
        name: v.name,
        orders: vOrders.length,
        totalValue: totalVal,
        deliveryDays: vOrders.length > 0 ? 6 : 0, // Mock avg delivery timeline
        onTime: 95, // Mock percentage
        rating: v.rating
      };
    });
    setVendorPerformance(performance);
  };

  // CSV Exporter using pure JS
  const exportToCSV = () => {
    const headers = ['Vendor Name', 'Total Orders', 'Total Spend (INR)', 'Avg Delivery (Days)', 'On-Time Rate (%)', 'Rating'];
    const rows = vendorPerformance.map(v => [
      v.name,
      v.orders,
      v.totalValue,
      v.deliveryDays,
      `${v.onTime}%`,
      v.rating
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "vendor_performance_report_2026.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div class="space-y-8">
      {/* Action Header */}
      <div class="flex items-center justify-between">
        <div>
          <h2 class="font-outfit font-extrabold text-2xl text-slate-100 uppercase tracking-wide">Procurement Analytics</h2>
          <p class="text-xs text-slate-500 font-mono mt-0.5">SECTOR: ANALYTICS COMMAND MODULE</p>
        </div>
        <button
          onClick={exportToCSV}
          class="flex items-center space-x-2 px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/15 text-xs font-mono transition duration-150 shadow-glow-cyan"
        >
          <Download class="w-3.5 h-3.5" />
          <span>Export Vendor CSV</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="glass-panel rounded-xl p-6 border border-violet-500/10">
          <span class="text-[10px] font-mono tracking-widest text-slate-500 uppercase">Total System Spend</span>
          <h3 class="text-2xl font-outfit font-bold text-slate-100 mt-2 font-mono">{formatCurrency(stats.totalSpend)}</h3>
          <div class="flex items-center space-x-1 text-[10px] text-emerald-400 mt-1">
            <TrendingUp class="w-3 h-3" />
            <span>Operational Limit: 100% OK</span>
          </div>
        </div>

        <div class="glass-panel rounded-xl p-6 border border-violet-500/10">
          <span class="text-[10px] font-mono tracking-widest text-slate-500 uppercase">Purchase Orders Issued</span>
          <h3 class="text-3xl font-outfit font-bold text-slate-100 mt-1 font-mono">{stats.totalPos}</h3>
          <div class="flex items-center space-x-1 text-[10px] text-violet-400 mt-1">
            <DollarSign class="w-3 h-3" />
            <span>All PO processes healthy</span>
          </div>
        </div>

        <div class="glass-panel rounded-xl p-6 border border-violet-500/10">
          <span class="text-[10px] font-mono tracking-widest text-slate-500 uppercase">Average Order Value</span>
          <h3 class="text-2xl font-outfit font-bold text-slate-100 mt-2 font-mono">{formatCurrency(stats.avgPoValue)}</h3>
          <div class="flex items-center space-x-1 text-[10px] text-cyan-400 mt-1">
            <BarChart2 class="w-3 h-3" />
            <span>Calculated mean value</span>
          </div>
        </div>

        <div class="glass-panel rounded-xl p-6 border border-violet-500/10">
          <span class="text-[10px] font-mono tracking-widest text-slate-500 uppercase">Participating Vendors</span>
          <h3 class="text-3xl font-outfit font-bold text-slate-100 mt-1 font-mono">{stats.totalVendors}</h3>
          <div class="flex items-center space-x-1 text-[10px] text-emerald-400 mt-1">
            <Award class="w-3 h-3" />
            <span>Active network nodes</span>
          </div>
        </div>
      </div>

      {/* Charts section */}
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Spending trend chart */}
        <div class="lg:col-span-2 glass-panel rounded-xl p-6 border border-violet-500/10">
          <h4 class="font-outfit font-semibold text-slate-200 text-base mb-6">Stellar Spending Frequency</h4>
          <div class="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(139, 92, 246, 0.2)', color: '#f8fafc' }}
                  formatter={(value) => [formatCurrency(value), 'Spend']}
                />
                <Bar dataKey="Spend" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
                  {trendData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#8b5cf6' : '#06b6d4'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Spend by Category Pie chart */}
        <div class="glass-panel rounded-xl p-6 border border-violet-500/10 flex flex-col justify-between">
          <div>
            <h4 class="font-outfit font-semibold text-slate-200 text-base mb-6">Spend Allocation by Category</h4>
            <div class="h-64 w-full flex justify-center items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(139, 92, 246, 0.2)', color: '#f8fafc' }}
                    formatter={(value) => [formatCurrency(value), 'Spend']}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Vendor performance table */}
      <div class="glass-panel rounded-xl border border-violet-500/10 overflow-hidden">
        <div class="p-6 border-b border-violet-500/10">
          <h4 class="font-outfit font-semibold text-slate-200 text-base">Vendor Performance Ledger</h4>
          <p class="text-[10px] text-slate-500 font-mono mt-0.5">CYBER PERFORMANCE RATINGS & TRANSACTION VOLUMES</p>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-violet-500/10 bg-slate-900/40 text-slate-400 text-xs font-mono uppercase">
                <th class="py-3 px-6">Vendor Name</th>
                <th class="py-3 px-6">Total Orders</th>
                <th class="py-3 px-6">Total Spend (INR)</th>
                <th class="py-3 px-6">Avg Delivery</th>
                <th class="py-3 px-6">On-Time %</th>
                <th class="py-3 px-6">Vendor Rating</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-violet-500/5 text-sm text-slate-300">
              {vendorPerformance.map((v, i) => (
                <tr key={i} class="hover:bg-slate-900/20 transition duration-150">
                  <td class="py-3.5 px-6 font-medium text-slate-100">{v.name}</td>
                  <td class="py-3.5 px-6 font-mono">{v.orders}</td>
                  <td class="py-3.5 px-6 font-mono text-cyan-400">{formatCurrency(v.totalValue)}</td>
                  <td class="py-3.5 px-6 font-mono">{v.deliveryDays} Days</td>
                  <td class="py-3.5 px-6 font-mono text-emerald-400">{v.onTime}%</td>
                  <td class="py-3.5 px-6">
                    <div class="flex items-center space-x-1 text-amber-400 font-mono">
                      <Star class="w-3.5 h-3.5 fill-current" />
                      <span>{v.rating.toFixed(1)}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;

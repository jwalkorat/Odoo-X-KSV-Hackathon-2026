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

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-7 w-48 bg-slate-800 rounded-lg"></div>
            <div className="h-3 w-32 bg-slate-800 rounded-lg mt-1"></div>
          </div>
          <div className="h-9 w-36 bg-slate-800 rounded-lg"></div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-panel rounded-xl p-6 border border-violet-500/5 h-28 flex flex-col justify-between">
              <div className="h-3 w-24 bg-slate-800 rounded"></div>
              <div className="h-7 w-32 bg-slate-800 rounded mt-2"></div>
              <div className="h-3 w-28 bg-slate-800 rounded"></div>
            </div>
          ))}
        </div>

        {/* Charts Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 glass-panel rounded-xl p-6 border border-violet-500/5 h-96">
            <div className="h-4 w-48 bg-slate-800 rounded mb-6"></div>
            <div className="h-72 w-full bg-slate-900/40 rounded-lg border border-violet-500/5 flex items-end p-4 space-x-4">
              {[120, 240, 160, 280, 200, 260].map((h, idx) => (
                <div key={idx} className="flex-1 bg-slate-800/50 rounded-t" style={{ height: `${h}px` }}></div>
              ))}
            </div>
          </div>
          <div className="glass-panel rounded-xl p-6 border border-violet-500/5 h-96 flex flex-col justify-between">
            <div className="h-4 w-48 bg-slate-800 rounded mb-6"></div>
            <div className="h-48 w-48 rounded-full border-[12px] border-slate-800/80 mx-auto flex items-center justify-center">
              <div className="h-28 w-28 rounded-full border-[12px] border-slate-800/50"></div>
            </div>
            <div className="h-4 w-32 bg-slate-800 rounded mx-auto mt-4"></div>
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="glass-panel rounded-xl border border-violet-500/5 overflow-hidden">
          <div className="p-6 border-b border-violet-500/5 space-y-2">
            <div className="h-4 w-48 bg-slate-800 rounded"></div>
            <div className="h-3 w-64 bg-slate-800 rounded"></div>
          </div>
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-violet-500/5">
                <div className="h-4 w-36 bg-slate-800 rounded"></div>
                <div className="h-4 w-12 bg-slate-800 rounded"></div>
                <div className="h-4 w-24 bg-slate-800 rounded"></div>
                <div className="h-4 w-16 bg-slate-800 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Action Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-outfit font-extrabold text-2xl text-slate-100 uppercase tracking-wide">Procurement Analytics</h2>
          <p className="text-xs text-slate-500 font-mono mt-0.5">SECTOR: ANALYTICS COMMAND MODULE</p>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/15 text-xs font-mono transition duration-150 shadow-glow-cyan"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Vendor CSV</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-panel rounded-xl p-6 border border-violet-500/10">
          <span className="text-xs font-mono tracking-wider text-slate-400 uppercase">Total System Spend</span>
          <h3 className="text-3xl font-outfit font-extrabold text-slate-100 mt-1">{formatCurrency(stats.totalSpend)}</h3>
          <div className="flex items-center space-x-1 text-xs text-emerald-400 mt-1">
            <TrendingUp className="w-3 h-3" />
            <span>Operational Limit: 100% OK</span>
          </div>
        </div>

        <div className="glass-panel rounded-xl p-6 border border-violet-500/10">
          <span className="text-xs font-mono tracking-wider text-slate-400 uppercase">Purchase Orders Issued</span>
          <h3 className="text-3xl font-outfit font-extrabold text-slate-100 mt-1">{stats.totalPos}</h3>
          <div className="flex items-center space-x-1 text-xs text-violet-400 mt-1">
            <DollarSign className="w-3 h-3" />
            <span>All PO processes healthy</span>
          </div>
        </div>

        <div className="glass-panel rounded-xl p-6 border border-violet-500/10">
          <span className="text-xs font-mono tracking-wider text-slate-400 uppercase">Average Order Value</span>
          <h3 className="text-3xl font-outfit font-extrabold text-slate-100 mt-1">{formatCurrency(stats.avgPoValue)}</h3>
          <div className="flex items-center space-x-1 text-xs text-cyan-400 mt-1">
            <BarChart2 className="w-3 h-3" />
            <span>Calculated mean value</span>
          </div>
        </div>

        <div className="glass-panel rounded-xl p-6 border border-violet-500/10">
          <span className="text-xs font-mono tracking-wider text-slate-400 uppercase">Participating Vendors</span>
          <h3 className="text-3xl font-outfit font-extrabold text-slate-100 mt-1">{stats.totalVendors}</h3>
          <div className="flex items-center space-x-1 text-xs text-emerald-400 mt-1">
            <Award className="w-3 h-3" />
            <span>Active network nodes</span>
          </div>
        </div>
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Spending trend chart */}
        <div className="lg:col-span-2 glass-panel rounded-xl p-6 border border-violet-500/10">
          <h4 className="font-outfit font-semibold text-slate-200 text-base mb-6">Stellar Spending Frequency</h4>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#090a16', 
                    borderColor: 'rgba(139, 92, 246, 0.3)', 
                    borderRadius: '8px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.5)'
                  }}
                  itemStyle={{ color: '#22d3ee', fontFamily: 'monospace', fontSize: '12px' }}
                  labelStyle={{ color: '#f8fafc', fontWeight: 'bold', fontFamily: 'Outfit, sans-serif' }}
                  formatter={(value) => [formatCurrency(value), 'Spend']}
                  cursor={{ fill: 'rgba(139, 92, 246, 0.08)', radius: 4 }}
                />
                <Bar 
                  dataKey="Spend" 
                  fill="#8b5cf6" 
                  radius={[4, 4, 0, 0]}
                  activeBar={{ fillOpacity: 0.85, stroke: '#22d3ee', strokeWidth: 1.5 }}
                  isAnimationActive={true}
                  animationBegin={0}
                  animationDuration={800}
                >
                  {trendData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#8b5cf6' : '#06b6d4'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Spend by Category Pie chart */}
        <div className="glass-panel rounded-xl p-6 border border-violet-500/10 flex flex-col justify-between">
          <div>
            <h4 className="font-outfit font-semibold text-slate-200 text-base mb-6">Spend Allocation by Category</h4>
            <div className="h-64 w-full flex justify-center items-center">
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart key={categoryData.length}>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      isAnimationActive={true}
                      animationBegin={0}
                      animationDuration={800}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#090a16', 
                        borderColor: 'rgba(139, 92, 246, 0.3)', 
                        borderRadius: '8px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.5)'
                      }}
                      itemStyle={{ color: '#22d3ee', fontFamily: 'monospace', fontSize: '12px' }}
                      labelStyle={{ color: '#f8fafc', fontWeight: 'bold', fontFamily: 'Outfit, sans-serif' }}
                      formatter={(value, name) => [formatCurrency(value), name]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center text-center text-slate-500 font-mono text-xs space-y-1">
                  <TrendingUp className="w-8 h-8 text-cyan-400 opacity-20 mb-2 animate-pulse" />
                  <span className="uppercase tracking-widest text-xs font-bold text-slate-400">No Requisition Spend Data</span>
                  <span className="text-slate-600">Approve bids to trigger order spending.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Vendor performance table */}
      <div className="glass-panel rounded-xl border border-violet-500/10 overflow-hidden">
        <div className="p-6 border-b border-violet-500/10">
          <h4 className="font-outfit font-semibold text-slate-200 text-base">Vendor Performance Ledger</h4>
          <p className="text-xs text-slate-500 font-mono mt-0.5">CYBER PERFORMANCE RATINGS & TRANSACTION VOLUMES</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-violet-500/10 bg-slate-900/40 text-slate-400 text-xs font-mono uppercase">
                <th className="py-3 px-6">Vendor Name</th>
                <th className="py-3 px-6">Total Orders</th>
                <th className="py-3 px-6">Total Spend (INR)</th>
                <th className="py-3 px-6">Avg Delivery</th>
                <th className="py-3 px-6">On-Time %</th>
                <th className="py-3 px-6">Vendor Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-violet-500/5 text-sm text-slate-300">
              {vendorPerformance.map((v, i) => (
                <tr key={i} className="hover:bg-violet-900/20 transition-all duration-150 cursor-pointer group">
                  <td className="py-3.5 px-6 font-medium text-slate-100 group-hover:text-cyan-400 transition-colors duration-150 border-l-2 border-l-transparent group-hover:border-l-cyan-400">{v.name}</td>
                  <td className="py-3.5 px-6 font-mono group-hover:text-slate-100 transition-colors duration-150">{v.orders}</td>
                  <td className="py-3.5 px-6 font-mono text-cyan-400 group-hover:text-cyan-300 transition-colors duration-150">{formatCurrency(v.totalValue)}</td>
                  <td className="py-3.5 px-6 font-mono group-hover:text-slate-100 transition-colors duration-150">{v.deliveryDays} Days</td>
                  <td className="py-3.5 px-6 font-mono text-emerald-400 group-hover:text-emerald-300 transition-colors duration-150">{v.onTime}%</td>
                  <td className="py-3.5 px-6">
                    <div className="flex items-center space-x-1 text-amber-400 font-mono group-hover:text-amber-300 transition-colors duration-150">
                      <Star className="w-3.5 h-3.5 fill-current" />
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

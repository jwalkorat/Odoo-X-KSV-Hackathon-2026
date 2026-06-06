import React from 'react';
import Navigation from './Navigation';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

const Reports = () => {
  // MOCK DATA 1: Spend Trend (Line Chart)
  const spendTrendData = [
    { month: 'Jan', spend: 45000 },
    { month: 'Feb', spend: 52000 },
    { month: 'Mar', spend: 38000 },
    { month: 'Apr', spend: 65000 },
    { month: 'May', spend: 48000 },
    { month: 'Jun', spend: 71000 },
  ];

  // MOCK DATA 2: Procurement Statistics (Pie Chart)
  const categoryData = [
    { name: 'Hardware (Quantum)', value: 120000 },
    { name: 'Software Licenses', value: 85000 },
    { name: 'Consulting', value: 45000 },
    { name: 'Logistics', value: 25000 },
  ];

  // Colors for the pie chart slices
  const COLORS = ['#818CF8', '#34D399', '#F472B6', '#FBBF24'];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 text-indigo-100 font-sans">
      <Navigation />
      
      {/* Main Content Area */}
      <div className="flex-1 p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 tracking-wider mb-2">
            PROCUREMENT ANALYTICS
          </h1>
          <p className="text-indigo-300/70">Overview of galactic spending and vendor distribution.</p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Chart 1: Spend Trend */}
          <div className="bg-slate-900/60 backdrop-blur-md border border-indigo-500/30 p-6 rounded-2xl shadow-[0_0_30px_rgba(79,70,229,0.1)]">
            <h2 className="text-lg font-semibold text-white mb-6 uppercase tracking-widest border-b border-indigo-500/30 pb-3">
              6-Month Spend Trend
            </h2>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={spendTrendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#4f46e5" strokeOpacity={0.2} />
                  <XAxis dataKey="month" stroke="#818cf8" tick={{ fill: '#818cf8' }} />
                  <YAxis stroke="#818cf8" tick={{ fill: '#818cf8' }} tickFormatter={(value) => `$${value/1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#4f46e5', color: '#e0e7ff', borderRadius: '8px' }}
                    itemStyle={{ color: '#818cf8' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Line 
                    type="monotone" 
                    dataKey="spend" 
                    name="Total Spend ($)"
                    stroke="#818cf8" 
                    strokeWidth={3}
                    dot={{ fill: '#818cf8', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 8, fill: '#34d399', stroke: '#0f172a' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Category Pie Chart */}
          <div className="bg-slate-900/60 backdrop-blur-md border border-indigo-500/30 p-6 rounded-2xl shadow-[0_0_30px_rgba(79,70,229,0.1)]">
            <h2 className="text-lg font-semibold text-white mb-6 uppercase tracking-widest border-b border-indigo-500/30 pb-3">
              Spend by Category
            </h2>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#4f46e5', color: '#e0e7ff', borderRadius: '8px' }}
                    formatter={(value) => `$${value.toLocaleString()}`}
                  />
                  <Legend 
                    layout="vertical" 
                    verticalAlign="middle" 
                    align="right"
                    wrapperStyle={{ color: '#c7d2fe' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>
      </div>
    </div>
  );
};

export default Reports;
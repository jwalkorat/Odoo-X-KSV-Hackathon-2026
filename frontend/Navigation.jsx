import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', path: '/' },
    { id: 'vendors', label: 'Vendors', icon: '👥', path: '/vendors' },
    { id: 'rfq', label: 'RFQs & Quotes', icon: '📋', path: '/rfq' },
    { id: 'approvals', label: 'Approvals', icon: '✓', path: '/approvals' },
    { id: 'purchase-orders', label: 'Purchase Orders', icon: '📦', path: '/purchase-orders' },
    { id: 'invoices', label: 'Invoices', icon: '💰', path: '/invoices' },
    { id: 'reports', label: 'Reports', icon: '📈', path: '/reports' },
  ];

  const isActive = (path) => {
    return location.pathname === path || 
           (path === '/purchase-orders' && location.pathname === '/') ||
           location.pathname === path;
  };

  const handleLogout = () => {
    // Clear any session data here if needed
    alert('Logged out successfully!');
    // Navigate to home/dashboard
    navigate('/');
  };

  return (
    <div className="w-64 bg-gradient-to-b from-slate-900 to-slate-950 border-r border-indigo-500/20 min-h-screen flex flex-col print:hidden">
      {/* Logo Section */}
      <div className="p-6 border-b border-indigo-500/20">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
            🚀
          </div>
          <div>
            <div className="text-sm font-black text-white">GALAXY ERP</div>
            <div className="text-xs text-indigo-400 font-semibold">PROCUREMENT</div>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.id}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              isActive(item.path)
                ? 'bg-indigo-600/30 border-l-2 border-indigo-400 text-indigo-200'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span className="text-sm font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Profile Section */}
      <div className="p-4 border-t border-indigo-500/20">
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-800/40 hover:bg-slate-800/60 transition-colors cursor-pointer">
          <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
            👤
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-white">manager</div>
            <div className="text-xs text-slate-400">ADMIN</div>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="w-full mt-3 px-4 py-2 rounded-lg text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2 border border-red-500/30">
          <span>⊖</span>
          <span>Logout Desk</span>
        </button>
      </div>
    </div>
  );
};

export default Navigation;

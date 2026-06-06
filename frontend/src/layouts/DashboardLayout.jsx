import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Rocket, 
  Users, 
  FileText, 
  CheckSquare, 
  ShoppingBag, 
  FileSpreadsheet, 
  LogOut, 
  Activity, 
  User as UserIcon,
  Shield
} from 'lucide-react';

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: Rocket, roles: ['ADMIN', 'OFFICER', 'MANAGER', 'VENDOR'] },
    { name: 'Vendors', path: '/vendors', icon: Users, roles: ['ADMIN', 'OFFICER', 'MANAGER'] },
    { name: 'RFQs & Quotes', path: '/rfqs', icon: FileText, roles: ['ADMIN', 'OFFICER', 'MANAGER', 'VENDOR'] },
    { name: 'Approvals', path: '/approvals', icon: CheckSquare, roles: ['ADMIN', 'MANAGER'] },
    { name: 'Purchase Orders', path: '/purchase-orders', icon: ShoppingBag, roles: ['ADMIN', 'OFFICER', 'MANAGER', 'VENDOR'] },
    { name: 'Invoices', path: '/invoices', icon: FileSpreadsheet, roles: ['ADMIN', 'OFFICER', 'MANAGER', 'VENDOR'] },
    { name: 'Activity Log', path: '/logs', icon: Activity, roles: ['ADMIN', 'OFFICER'] }
  ];

  const filteredNavItems = navItems.filter(item => item.roles.includes(user?.role));

  return (
    <div class="flex h-screen overflow-hidden bg-slate-950 font-sans">
      {/* Dynamic Cosmic Sidebar */}
      <aside class="w-64 bg-slate-900/60 border-r border-violet-500/10 flex flex-col justify-between backdrop-blur-xl">
        <div>
          {/* Logo Brand Header */}
          <div class="p-6 border-b border-violet-500/10 flex items-center space-x-3">
            <div class="bg-gradient-to-tr from-violet-600 to-cyan-400 p-2 rounded-lg shadow-glow-cyan">
              <Rocket class="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <span class="font-outfit font-bold text-lg bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">GALAXY ERP</span>
              <p class="text-[9px] tracking-widest text-cyan-400 font-mono">PROCUREMENT</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav class="p-4 space-y-1">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  class={`flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-violet-600/20 to-cyan-500/10 text-cyan-400 border-l-2 border-cyan-400 font-medium'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <Icon class="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout Deck */}
        <div class="p-4 border-t border-violet-500/10 bg-slate-950/40">
          <div class="flex items-center space-x-3 mb-4">
            <div class="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center border border-violet-500/30 text-cyan-400">
              <UserIcon class="w-4 h-4" />
            </div>
            <div class="overflow-hidden">
              <p class="text-xs font-semibold text-slate-200 truncate">{user?.username}</p>
              <div class="flex items-center space-x-1">
                <Shield class="w-[10px] h-[10px] text-cyan-400" />
                <span class="text-[9px] text-cyan-400 font-mono tracking-wider font-semibold">{user?.role}</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            class="w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg bg-red-950/20 border border-red-500/20 text-red-400 hover:bg-red-500/15 hover:text-red-300 text-xs transition duration-200"
          >
            <LogOut class="w-3.5 h-3.5" />
            <span>Logout Deck</span>
          </button>
        </div>
      </aside>

      {/* Main Command Center Deck */}
      <main class="flex-1 flex flex-col overflow-y-auto">
        <header class="h-16 border-b border-violet-500/10 flex items-center justify-between px-8 bg-slate-900/10 backdrop-blur-md">
          <h1 class="text-xl font-outfit font-semibold tracking-wide text-slate-100">
            Sector: <span class="text-cyan-400 font-mono text-lg">{location.pathname === '/' ? 'DASHBOARD' : location.pathname.substring(1).toUpperCase()}</span>
          </h1>
          <div class="text-xs font-mono text-slate-400">
            System Status: <span class="text-emerald-400 animate-pulse">● ONLINE</span>
          </div>
        </header>
        <div class="p-8 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;

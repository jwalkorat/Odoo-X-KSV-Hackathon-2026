import React, { useState, useEffect, useRef } from 'react';
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
  Shield,
  BarChart2,
  Bell,
  X,
  CheckCheck,
  Info,
  AlertTriangle as AlertTri
} from 'lucide-react';
import api from '../lib/api';

// ─── Notification Bell & Panel ─────────────────────────────────────────────
const DEMO_NOTIFS = [
  { id: 1, type: 'info', title: 'New RFQ Assigned', body: 'You have been assigned to evaluate 3 vendor quotations.', time: '2 min ago', read: false },
  { id: 2, type: 'warn', title: 'Invoice Overdue', body: 'INV-2026-0003 is pending approval for 5 days.', time: '1 hr ago', read: false },
  { id: 3, type: 'success', title: 'PO Approved', body: 'Purchase Order PO-2026-0007 has been approved by manager.', time: '3 hr ago', read: false },
  { id: 4, type: 'info', title: 'Vendor Registered', body: 'Starlight Logistics Corp joined the galaxy network.', time: 'Yesterday', read: true },
  { id: 5, type: 'warn', title: 'Quotation Deadline', body: 'RFQ-2026-0005 deadline is tomorrow at 11:59 PM.', time: 'Yesterday', read: true },
];

const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState(DEMO_NOTIFS);
  const panelRef = useRef(null);

  // Fetch real logs as notifications (merge with demo ones)
  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const { data } = await api.get('/api/logs?limit=5');
        const logNotifs = data.map((log, i) => ({
          id: `log-${log.id || i}`,
          type: 'info',
          title: log.action || 'System Event',
          body: `${log.entity_type || 'Entity'} #${log.entity_id || '?'} — by ${log.username || 'system'}`,
          time: log.created_at ? new Date(log.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Just now',
          read: true
        }));
        setNotifs((prev) => {
          const existing = prev.filter((n) => !String(n.id).startsWith('log-'));
          return [...existing, ...logNotifs];
        });
      } catch {
        // Backend offline — keep demo notifs
      }
    };
    fetchNotifs();
  }, []);

  // Close panel on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unread = notifs.filter((n) => !n.read).length;

  const markAllRead = () => setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  const dismiss = (id) => setNotifs((prev) => prev.filter((n) => n.id !== id));

  const typeStyle = {
    info: { icon: Info, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    warn: { icon: AlertTri, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    success: { icon: CheckCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/10' }
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        id="notification-bell"
        onClick={() => setOpen((o) => !o)}
        className="relative flex items-center justify-center w-9 h-9 rounded-lg border border-violet-500/15 bg-slate-900/60 hover:border-cyan-400/30 hover:bg-slate-800/60 transition-all duration-200"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4 text-slate-400 hover:text-slate-200 transition-colors" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-[9px] font-bold text-white font-mono animate-pulse">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 bg-slate-900/95 border border-violet-500/20 rounded-xl shadow-2xl backdrop-blur-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-violet-500/10">
            <div className="flex items-center space-x-2">
              <Bell className="w-4 h-4 text-cyan-400" />
              <span className="font-outfit font-semibold text-slate-100 text-sm">Notifications</span>
              {unread > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[9px] font-mono font-bold">{unread} new</span>
              )}
            </div>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-[10px] text-violet-400 hover:text-cyan-400 font-mono transition-colors">
                Mark all read
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-72 overflow-y-auto">
            {notifs.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-slate-500 font-mono">
                ◎ No transmissions received
              </div>
            ) : notifs.map((n) => {
              const { icon: NIcon, color, bg } = typeStyle[n.type] || typeStyle.info;
              return (
                <div
                  key={n.id}
                  className={`flex items-start space-x-3 px-4 py-3 border-b border-violet-500/5 transition hover:bg-slate-800/30 ${!n.read ? 'bg-violet-900/10' : ''}`}
                >
                  <div className={`shrink-0 w-7 h-7 rounded-lg ${bg} flex items-center justify-center mt-0.5`}>
                    <NIcon className={`w-3.5 h-3.5 ${color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <p className={`text-xs font-semibold truncate ${!n.read ? 'text-slate-100' : 'text-slate-300'}`}>{n.title}</p>
                      <button onClick={() => dismiss(n.id)} className="ml-2 shrink-0 text-slate-600 hover:text-red-400 transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{n.body}</p>
                    <p className="text-[9px] text-slate-600 font-mono mt-1">{n.time}</p>
                  </div>
                  {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0 mt-1.5 animate-pulse"></div>}
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-violet-500/10 text-center">
            <Link to="/logs" onClick={() => setOpen(false)} className="text-[10px] text-violet-400 hover:text-cyan-400 font-mono transition-colors">
              View Activity Log →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main Layout ────────────────────────────────────────────────────────────
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
    { name: 'Reports', path: '/reports', icon: BarChart2, roles: ['ADMIN', 'OFFICER', 'MANAGER'] },
    { name: 'Activity Log', path: '/logs', icon: Activity, roles: ['ADMIN', 'OFFICER'] }
  ];

  const filteredNavItems = navItems.filter(item => item.roles.includes(user?.role));

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 font-sans">
      {/* Dynamic Cosmic Sidebar */}
      <aside className="w-64 bg-slate-900/60 border-r border-violet-500/10 flex flex-col justify-between backdrop-blur-xl">
        <div>
          {/* Logo Brand Header */}
          <div className="p-6 border-b border-violet-500/10 flex items-center space-x-3">
            <div className="bg-gradient-to-tr from-violet-600 to-cyan-400 p-2 rounded-lg shadow-glow-cyan">
              <Rocket className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <span className="font-outfit font-bold text-lg bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">GALAXY ERP</span>
              <p className="text-[9px] tracking-widest text-cyan-400 font-mono">PROCUREMENT</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-violet-600/20 to-cyan-500/10 text-cyan-400 border-l-2 border-cyan-400 font-medium'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout Deck */}
        <div className="p-4 border-t border-violet-500/10 bg-slate-950/40">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center border border-violet-500/30 text-cyan-400">
              <UserIcon className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-slate-200 truncate">{user?.username}</p>
              <div className="flex items-center space-x-1">
                <Shield className="w-[10px] h-[10px] text-cyan-400" />
                <span className="text-[9px] text-cyan-400 font-mono tracking-wider font-semibold">{user?.role}</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg bg-red-950/20 border border-red-500/20 text-red-400 hover:bg-red-500/15 hover:text-red-300 text-xs transition duration-200"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout Deck</span>
          </button>
        </div>
      </aside>

      {/* Main Command Center Deck */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        <header className="h-16 border-b border-violet-500/10 flex items-center justify-between px-8 bg-slate-900/10 backdrop-blur-md">
          <h1 className="text-xl font-outfit font-semibold tracking-wide text-slate-100">
            Sector: <span className="text-cyan-400 font-mono text-lg">{location.pathname === '/' ? 'DASHBOARD' : location.pathname.substring(1).toUpperCase().replace(/-/g, ' ')}</span>
          </h1>
          <div className="flex items-center space-x-4">
            <NotificationBell />
            <div className="text-xs font-mono text-slate-400">
              System Status: <span className="text-emerald-400 animate-pulse">● ONLINE</span>
            </div>
          </div>
        </header>
        <div className="p-8 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Reports from './pages/Reports';
import Logs from './pages/Logs';
import Vendors from './pages/Vendors';
import RFQs from './pages/RFQs';
import Approvals from './pages/Approvals';
import PurchaseOrders from './pages/PurchaseOrders';
import Invoices from './pages/Invoices';
import { Terminal, ShieldAlert } from 'lucide-react';


// Protected Route Guard (Checks if user is logged in)
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-cyan-400 font-mono text-sm">
        Connecting with Command Deck...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Role Access Guard (Checks if user role matches permitted roles)
const RoleGuard = ({ children, allowedRoles }) => {
  const { user } = useAuth();

  if (!allowedRoles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

// Cosmic Work In Progress Stub Component
const WIPPage = ({ title, assignee, details }) => {
  return (
    <div className="glass-panel rounded-xl p-8 border border-violet-500/10 text-center max-w-2xl mx-auto my-12">
      <Terminal className="w-12 h-12 text-cyan-400 mx-auto mb-4 animate-pulse" />
      <h3 className="font-outfit font-extrabold text-xl text-slate-100 mb-2 uppercase tracking-wider">{title} Module</h3>
      <div className="inline-block px-3 py-1 rounded-full bg-violet-600/10 border border-violet-500/20 text-[10px] text-violet-400 font-mono mb-4 uppercase">
        Assigned pilot: {assignee}
      </div>
      <p className="text-slate-400 text-sm leading-relaxed mb-6">{details}</p>
      <div className="border-t border-violet-500/10 pt-4 text-xs font-mono text-slate-500">
        Ready for feature expansion. Access endpoints via <code className="text-cyan-400 bg-slate-950 px-1 py-0.5 rounded">api.js</code>
      </div>
    </div>
  );
};

const Unauthorized = () => {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full glass-panel border border-red-500/20 rounded-xl p-8 text-center">
        <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="font-outfit font-bold text-xl text-slate-100 mb-2">Access Denied</h3>
        <p className="text-slate-400 text-sm mb-6">
          Your credentials do not possess the required clearance level to interface with this quadrant.
        </p>
        <a href="/" className="inline-block px-4 py-2 bg-slate-900 border border-violet-500/20 hover:border-cyan-400/40 text-xs font-mono text-cyan-400 rounded transition duration-150">
          Uplink back to Dashboard
        </a>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Protected Dashboard console routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendors"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['ADMIN', 'OFFICER', 'MANAGER']}>
                  <DashboardLayout>
                    <Vendors />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/rfqs"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <RFQs />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/approvals"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['ADMIN', 'MANAGER']}>
                  <DashboardLayout>
                    <Approvals />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/purchase-orders"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <PurchaseOrders />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/invoices"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Invoices />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['ADMIN', 'OFFICER', 'MANAGER']}>
                  <DashboardLayout>
                    <Reports />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/logs"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['ADMIN', 'OFFICER']}>
                  <DashboardLayout>
                    <Logs />
                  </DashboardLayout>
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;

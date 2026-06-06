import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import RfqsAndQuotes from './pages/RfqsAndQuotes';
import Approvals from './pages/Approvals';
import { Terminal, ShieldAlert } from 'lucide-react';

// Protected Route Guard (Checks if user is logged in)
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div class="min-h-screen bg-slate-950 flex items-center justify-center text-cyan-400 font-mono text-sm">
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
    <div class="glass-panel rounded-xl p-8 border border-violet-500/10 text-center max-w-2xl mx-auto my-12">
      <Terminal class="w-12 h-12 text-cyan-400 mx-auto mb-4 animate-pulse" />
      <h3 class="font-outfit font-extrabold text-xl text-slate-100 mb-2 uppercase tracking-wider">{title} Module</h3>
      <div class="inline-block px-3 py-1 rounded-full bg-violet-600/10 border border-violet-500/20 text-[10px] text-violet-400 font-mono mb-4 uppercase">
        Assigned pilot: {assignee}
      </div>
      <p class="text-slate-400 text-sm leading-relaxed mb-6">{details}</p>
      <div class="border-t border-violet-500/10 pt-4 text-xs font-mono text-slate-500">
        Ready for feature expansion. Access endpoints via <code class="text-cyan-400 bg-slate-950 px-1 py-0.5 rounded">api.js</code>
      </div>
    </div>
  );
};

const Unauthorized = () => {
  return (
    <div class="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div class="max-w-md w-full glass-panel border border-red-500/20 rounded-xl p-8 text-center">
        <ShieldAlert class="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 class="font-outfit font-bold text-xl text-slate-100 mb-2">Access Denied</h3>
        <p class="text-slate-400 text-sm mb-6">
          Your credentials do not possess the required clearance level to interface with this quadrant.
        </p>
        <a href="/" class="inline-block px-4 py-2 bg-slate-900 border border-violet-500/20 hover:border-cyan-400/40 text-xs font-mono text-cyan-400 rounded transition duration-150">
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
                    <WIPPage 
                      title="Vendor Management" 
                      assignee="Person 2 (Deepam / Meet / Kashvi)" 
                      details="Create vendor profiles, search, filter by category, validate GST formats (15-char regex), toggle statuses, and display past order history."
                    />
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
                  <RfqsAndQuotes />
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
                  <WIPPage 
                    title="Purchase Orders" 
                    assignee="Person 4 (Deepam / Meet / Kashvi)" 
                    details="Track issued Purchase Orders, calculate tax overrides (18% default), generate and sign digital agreements."
                  />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/invoices"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <WIPPage 
                    title="Invoice Billing Console" 
                    assignee="Person 4 (Deepam / Meet / Kashvi)" 
                    details="Generate tax invoices from POs, print A4 invoices cleanly, download PDF captures, and email them using Supabase/Edge mailers."
                  />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/logs"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['ADMIN', 'OFFICER']}>
                  <DashboardLayout>
                    <WIPPage 
                      title="Activity Audit Logs" 
                      assignee="Person 1 (Team Leader)" 
                      details="Review complete system logs, query by log types (RFQ, Approval, Invoice, User actions) and inspect transaction history."
                    />
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

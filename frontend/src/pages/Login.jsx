import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Rocket, Lock, User, AlertTriangle, KeyRound, RotateCcw, CheckCircle } from 'lucide-react';
import api from '../lib/api';

// ─── Forgot-Password Modal ──────────────────────────────────────────────────
const ForgotPasswordModal = ({ onClose }) => {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [otp, setOtp] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [emailHint, setEmailHint] = useState('');

  const handleRequest = async (e) => {
    e.preventDefault();
    if (!username.trim()) return;
    setLoading(true);
    setMsg('');
    try {
      const { data } = await api.post('/api/auth/forgot-password', { username });
      setEmailHint(data.email_hint || '');
      setMsg(data.message);
      setMsgType('success');
      setStep(2);
    } catch (err) {
      setMsg(err.response?.data?.detail || 'Pilot not found in galaxy records.');
      setMsgType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (newPw !== confirmPw) {
      setMsg('Security codes do not match.');
      setMsgType('error');
      return;
    }
    if (newPw.length < 6) {
      setMsg('Security code must be at least 6 characters.');
      setMsgType('error');
      return;
    }
    setLoading(true);
    setMsg('');
    try {
      const { data } = await api.post('/api/auth/reset-password', {
        username,
        otp,
        new_password: newPw
      });
      setMsg(data.message);
      setMsgType('success');
      setDone(true);
    } catch (err) {
      setMsg(err.response?.data?.detail || 'Reset failed — check your recovery code.');
      setMsgType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-slate-900 border border-violet-500/20 rounded-2xl shadow-2xl p-7">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-gradient-to-tr from-violet-600 to-cyan-400 p-2 rounded-lg">
            <KeyRound className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-outfit font-bold text-slate-100 text-base">Security Recovery</h3>
            <p className="text-[10px] font-mono text-slate-400 tracking-widest">
              {done ? 'COMPLETE' : step === 1 ? 'STEP 1 — VERIFY PILOT' : 'STEP 2 — RESET CODE'}
            </p>
          </div>
        </div>

        {/* Done state */}
        {done ? (
          <div className="text-center py-4">
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <p className="text-sm text-emerald-300 font-mono mb-5">{msg}</p>
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-lg cosmic-btn-primary text-sm font-semibold"
            >
              Return to Login
            </button>
          </div>
        ) : step === 1 ? (
          <form onSubmit={handleRequest} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-cyan-400 uppercase mb-1.5 tracking-wider">
                Pilot Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Your username"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-violet-500/15 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 font-mono placeholder-slate-600"
                  required
                />
              </div>
            </div>
            {msg && (
              <div className={`flex items-center space-x-2 p-3 rounded-lg text-xs font-mono border ${msgType === 'error' ? 'bg-red-950/20 border-red-500/20 text-red-400' : 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400'}`}>
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{msg}</span>
              </div>
            )}
            <div className="flex space-x-2 pt-1">
              <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 text-sm transition">
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 rounded-lg cosmic-btn-primary text-sm font-semibold disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Recovery Code'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <div className="text-xs font-mono text-slate-400 bg-slate-950/50 rounded-lg px-3 py-2 border border-violet-500/10 space-y-1">
              <p>Recovery code sent to:</p>
              <p className="text-cyan-400 font-semibold">{emailHint || `email on file for ${username}`}</p>
              <p className="text-slate-500 text-[10px]">Check your inbox and spam folder.</p>
            </div>
            <div>
              <label className="block text-xs font-mono text-cyan-400 uppercase mb-1.5 tracking-wider">Recovery Code</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit code from email"
                className="w-full px-4 py-2.5 bg-slate-950/60 border border-violet-500/15 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 font-mono placeholder-slate-600"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-cyan-400 uppercase mb-1.5 tracking-wider">New Security Code</label>
              <input
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 bg-slate-950/60 border border-violet-500/15 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 font-mono placeholder-slate-600"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-cyan-400 uppercase mb-1.5 tracking-wider">Confirm Code</label>
              <input
                type="password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 bg-slate-950/60 border border-violet-500/15 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 font-mono placeholder-slate-600"
                required
              />
            </div>
            {msg && (
              <div className={`flex items-center space-x-2 p-3 rounded-lg text-xs font-mono border ${msgType === 'error' ? 'bg-red-950/20 border-red-500/20 text-red-400' : 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400'}`}>
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{msg}</span>
              </div>
            )}
            <div className="flex space-x-2 pt-1">
              <button type="button" onClick={() => { setStep(1); setMsg(''); }} className="flex items-center gap-1 py-2.5 px-3 rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 text-sm transition">
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 rounded-lg cosmic-btn-primary text-sm font-semibold disabled:opacity-50"
              >
                {loading ? 'Resetting...' : 'Reset Security Code'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

// ─── Main Login Page ────────────────────────────────────────────────────────
const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) return;

    setError('');
    setLoading(true);
    try {
      const result = await login(username, password);
      if (result.success) {
        navigate('/');
      }
    } catch (err) {
      setError(err.message || "Failed to establish uplink.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (roleName, userVal, passVal) => {
    setUsername(userVal);
    setPassword(passVal);
    setError('');
    setLoading(true);
    try {
      const result = await login(userVal, passVal);
      if (result.success) {
        navigate('/');
      }
    } catch (err) {
      setError(err.message || "Failed to establish uplink.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}

      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950">
        {/* Background Glow effects */}
        <div className="absolute w-96 h-96 rounded-full bg-violet-600/10 blur-[120px] top-1/4 left-1/4 -z-10"></div>
        <div className="absolute w-96 h-96 rounded-full bg-cyan-500/10 blur-[120px] bottom-1/4 right-1/4 -z-10"></div>

        <div className="w-full max-w-md bg-slate-900/40 border border-violet-500/15 backdrop-blur-2xl rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex mb-4">
              <img src="/logo.png" className="w-14 h-14 object-contain rounded-2xl shadow-glow-cyan" alt="Logo" />
            </div>
            <h2 className="font-outfit font-extrabold text-2xl tracking-wide bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              PROCUREMENT GALAXY
            </h2>
            <p className="text-xs text-slate-400 font-mono tracking-widest mt-1">UPLINK AUTHENTICATION</p>
          </div>

          {error && (
            <div className="mb-5 flex items-center space-x-3 p-3 rounded-lg bg-red-950/20 border border-red-500/20 text-red-400 text-xs font-mono">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono tracking-wider text-cyan-400 uppercase mb-1.5">Pilot Username</label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-violet-500/15 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 font-mono placeholder-slate-600"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono tracking-wider text-cyan-400 uppercase mb-1.5">Security Code</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-violet-500/15 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 font-mono placeholder-slate-600"
                  required
                />
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowForgot(true)}
                className="text-[11px] text-violet-400 hover:text-cyan-400 font-mono transition-colors"
              >
                Forgot security code?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg font-outfit text-sm font-semibold tracking-wide cosmic-btn-primary disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Initiating Hyperdrive...' : 'Establish Connection'}
            </button>

            <div className="text-center mt-4 text-xs font-mono text-slate-500">
              <span>New Pilot? </span>
              <Link to="/register" className="text-cyan-400 hover:text-cyan-300 hover:underline">Enroll credentials</Link>
            </div>
          </form>

          {/* Demo Fast Login Shortcuts */}
          <div className="mt-8 border-t border-violet-500/10 pt-6">
            <p className="text-xs font-mono tracking-wider text-slate-500 uppercase text-center mb-3">Quick Login Simulation</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => handleQuickLogin('OFFICER', 'officer', 'officer123')}
                className="px-2 py-1.5 bg-slate-900 border border-violet-500/10 hover:border-cyan-400/40 rounded text-slate-400 hover:text-slate-200 transition font-mono"
              >
                🚀 Officer
              </button>
              <button
                onClick={() => handleQuickLogin('MANAGER', 'manager', 'manager123')}
                className="px-2 py-1.5 bg-slate-900 border border-violet-500/10 hover:border-cyan-400/40 rounded text-slate-400 hover:text-slate-200 transition font-mono"
              >
                💼 Manager
              </button>
              <button
                onClick={() => handleQuickLogin('VENDOR', 'vendor1', 'vendor123')}
                className="px-2 py-1.5 bg-slate-900 border border-violet-500/10 hover:border-cyan-400/40 rounded text-slate-400 hover:text-slate-200 transition font-mono col-span-2"
              >
                🛰️ Vendor (Nebula IT Solutions)
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;

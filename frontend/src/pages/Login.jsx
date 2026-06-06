import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Rocket, Lock, User, AlertTriangle } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    <div class="min-h-screen flex items-center justify-center p-4 bg-slate-950">
      {/* Background Glow effects */}
      <div class="absolute w-96 h-96 rounded-full bg-violet-600/10 blur-[120px] top-1/4 left-1/4 -z-10"></div>
      <div class="absolute w-96 h-96 rounded-full bg-cyan-500/10 blur-[120px] bottom-1/4 right-1/4 -z-10"></div>

      <div class="w-full max-w-md bg-slate-900/40 border border-violet-500/15 backdrop-blur-2xl rounded-2xl p-8 shadow-2xl">
        <div class="text-center mb-8">
          <div class="inline-flex bg-gradient-to-tr from-violet-600 to-cyan-400 p-3 rounded-2xl shadow-glow-cyan mb-4">
            <Rocket class="w-7 h-7 text-white" />
          </div>
          <h2 class="font-outfit font-extrabold text-2xl tracking-wide bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            PROCUREMENT GALAXY
          </h2>
          <p class="text-xs text-slate-400 font-mono tracking-widest mt-1">UPLINK AUTHENTICATION</p>
        </div>

        {error && (
          <div class="mb-5 flex items-center space-x-3 p-3 rounded-lg bg-red-950/20 border border-red-500/20 text-red-400 text-xs font-mono">
            <AlertTriangle class="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} class="space-y-4">
          <div>
            <label class="block text-[10px] font-mono tracking-wider text-cyan-400 uppercase mb-1.5">Pilot Username</label>
            <div class="relative">
              <User class="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                class="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-violet-500/15 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 font-mono placeholder-slate-600"
                required
              />
            </div>
          </div>

          <div>
            <label class="block text-[10px] font-mono tracking-wider text-cyan-400 uppercase mb-1.5">Security Code</label>
            <div class="relative">
              <Lock class="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                class="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-violet-500/15 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 font-mono placeholder-slate-600"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            class="w-full py-2.5 rounded-lg font-outfit text-sm font-semibold tracking-wide cosmic-btn-primary disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? 'Initiating Hyperdrive...' : 'Establish Connection'}
          </button>
        </form>

        {/* Demo Fast Login Shortcuts */}
        <div class="mt-8 border-t border-violet-500/10 pt-6">
          <p class="text-[9px] font-mono tracking-wider text-slate-500 uppercase text-center mb-3">Quick Login Simulation</p>
          <div class="grid grid-cols-2 gap-2 text-[10px]">
            <button
              onClick={() => handleQuickLogin('OFFICER', 'officer', 'officer123')}
              class="px-2 py-1.5 bg-slate-900 border border-violet-500/10 hover:border-cyan-400/40 rounded text-slate-400 hover:text-slate-200 transition font-mono"
            >
              🚀 Officer
            </button>
            <button
              onClick={() => handleQuickLogin('MANAGER', 'manager', 'manager123')}
              class="px-2 py-1.5 bg-slate-900 border border-violet-500/10 hover:border-cyan-400/40 rounded text-slate-400 hover:text-slate-200 transition font-mono"
            >
              💼 Manager
            </button>
            <button
              onClick={() => handleQuickLogin('VENDOR', 'vendor1', 'vendor123')}
              class="px-2 py-1.5 bg-slate-900 border border-violet-500/10 hover:border-cyan-400/40 rounded text-slate-400 hover:text-slate-200 transition font-mono col-span-2"
            >
              🛰️ Vendor (Nebula IT Solutions)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

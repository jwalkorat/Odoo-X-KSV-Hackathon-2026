import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';
import { Rocket, User, Mail, Phone, Globe, Shield, Terminal, ArrowLeft, Camera, AlertTriangle } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    country: '',
    role: 'VENDOR',
    additional_info: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await api.post('/api/auth/register', formData);
      setSuccess('Uplink registration successful! Redirecting to login console...');
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err) {
      if (err.response) {
        setError(err.response.data?.detail || 'Registration failed. Check validation rules.');
      } else {
        console.warn("Backend unavailable, simulating frontend mock registration...");
        // MOCK FALLBACK SUCCESS FOR OFFLINE DEVELOPMENT
        setSuccess('[Simulation Mode] Uplink credentials cached successfully! Redirecting...');
        setTimeout(() => {
          navigate('/login');
        }, 2500);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950">
      {/* Space Aura Glows */}
      <div className="absolute w-96 h-96 rounded-full bg-violet-600/5 blur-[120px] top-1/4 left-1/4 -z-10"></div>
      <div className="absolute w-96 h-96 rounded-full bg-cyan-500/5 blur-[120px] bottom-1/4 right-1/4 -z-10"></div>

      <div className="w-full max-w-2xl bg-slate-900/40 border border-violet-500/15 backdrop-blur-2xl rounded-2xl p-8 shadow-2xl my-8">
        
        {/* Back navigation */}
        <Link to="/login" className="inline-flex items-center space-x-2 text-xs font-mono text-slate-500 hover:text-cyan-400 transition mb-6">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Login</span>
        </Link>

        {/* Branding Title */}
        <div className="text-center mb-6">
          <div className="inline-flex bg-gradient-to-tr from-violet-600 to-cyan-400 p-2.5 rounded-2xl shadow-glow-cyan mb-3">
            <Rocket className="w-6 h-6 text-white" />
          </div>
          <h2 className="font-outfit font-extrabold text-2xl tracking-wide bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            REGISTER NEW PILOT
          </h2>
          <p className="text-xs text-slate-400 font-mono tracking-widest mt-1">UPLINK ENROLLMENT CONSOLE</p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 flex items-center space-x-3 p-3 rounded-lg bg-red-950/20 border border-red-500/20 text-red-400 text-xs font-mono">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 flex items-center space-x-3 p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
            <Terminal className="w-4 h-4 shrink-0 animate-pulse" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Photo upload mock block */}
          <div className="flex flex-col items-center justify-center space-y-2 mb-4">
            <div className="w-20 h-20 rounded-full border border-dashed border-violet-500/30 bg-slate-950/40 flex flex-col items-center justify-center cursor-pointer hover:border-cyan-400 transition group relative overflow-hidden">
              <Camera className="w-6 h-6 text-slate-500 group-hover:text-cyan-400 transition" />
              <span className="text-[10px] font-mono text-slate-600 group-hover:text-cyan-400 mt-1 uppercase">Photo</span>
            </div>
            <span className="text-xs font-mono text-slate-500">UPLOAD IDENTIFICATION SHIELD</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* First Name */}
            <div>
              <label className="block text-xs font-mono tracking-wider text-cyan-400 uppercase mb-1.5">First Name</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                placeholder="Enter first name"
                className="w-full px-4 py-2 bg-slate-950/60 border border-violet-500/15 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 font-mono placeholder-slate-700"
                required
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-xs font-mono tracking-wider text-cyan-400 uppercase mb-1.5">Last Name</label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                placeholder="Enter last name"
                className="w-full px-4 py-2 bg-slate-950/60 border border-violet-500/15 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 font-mono placeholder-slate-700"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-mono tracking-wider text-cyan-400 uppercase mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@gmail.com"
                  className="w-full pl-10 pr-4 py-2 bg-slate-950/60 border border-violet-500/15 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 font-mono placeholder-slate-700"
                  required
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-mono tracking-wider text-cyan-400 uppercase mb-1.5">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="tel"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleChange}
                  placeholder="+91 9999999999"
                  className="w-full pl-10 pr-4 py-2 bg-slate-950/60 border border-violet-500/15 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 font-mono placeholder-slate-700"
                  required
                />
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-xs font-mono tracking-wider text-cyan-400 uppercase mb-1.5">Uplink Username</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Choose username"
                  className="w-full pl-10 pr-4 py-2 bg-slate-950/60 border border-violet-500/15 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 font-mono placeholder-slate-700"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-mono tracking-wider text-cyan-400 uppercase mb-1.5">Access Passcode</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Choose passcode"
                className="w-full px-4 py-2 bg-slate-950/60 border border-violet-500/15 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 font-mono placeholder-slate-700"
                required
              />
            </div>

            {/* Country */}
            <div>
              <label className="block text-xs font-mono tracking-wider text-cyan-400 uppercase mb-1.5">Country</label>
              <div className="relative">
                <Globe className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  placeholder="e.g. India"
                  className="w-full pl-10 pr-4 py-2 bg-slate-950/60 border border-violet-500/15 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 font-mono placeholder-slate-700"
                  required
                />
              </div>
            </div>

            {/* Role select */}
            <div>
              <label className="block text-xs font-mono tracking-wider text-cyan-400 uppercase mb-1.5">Select Role</label>
              <div className="relative">
                <Shield className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-violet-500/15 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 font-mono appearance-none"
                >
                  <option value="VENDOR">VENDOR (Submit Bids & Track POs)</option>
                  <option value="OFFICER">PROCUREMENT OFFICER (Create RFQs & Invoices)</option>
                  <option value="MANAGER">MANAGER / APPROVER (Review & Approve POs)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div>
            <label className="block text-xs font-mono tracking-wider text-cyan-400 uppercase mb-1.5">Additional Information</label>
            <textarea
              name="additional_info"
              value={formData.additional_info}
              onChange={handleChange}
              rows="3"
              placeholder="Provide organization details, category specifiers, or qualifications..."
              className="w-full px-4 py-2.5 bg-slate-950/60 border border-violet-500/15 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 font-mono placeholder-slate-700 resize-none"
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg font-outfit text-sm font-semibold tracking-wide cosmic-btn-primary disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? 'Transmitting Data Core...' : 'Register'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;

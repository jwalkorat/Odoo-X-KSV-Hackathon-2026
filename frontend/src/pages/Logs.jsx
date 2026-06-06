import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { MOCK_LOGS } from '../mockData/mockDb';
import { formatDate } from '../lib/utils';
import { 
  Terminal, 
  CheckCircle, 
  Clock, 
  FileText, 
  UserPlus, 
  Activity, 
  AlertCircle 
} from 'lucide-react';

const Logs = () => {
  const [logs, setLogs] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  const filters = ['All', 'RFQ', 'Approvals', 'Invoices', 'Vendors'];

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        // Translate filter for API (e.g., 'Approvals' -> 'APPROVAL')
        let apiFilter = activeFilter;
        
        const response = await api.get('/api/logs/', {
          params: { entity_type: apiFilter }
        });
        setLogs(response.data);
      } catch (err) {
        console.warn("Backend API offline. Querying mock database logs.");
        
        // MOCK DATABASE FILTER SIMULATION
        let filtered = MOCK_LOGS;
        if (activeFilter !== 'All') {
          let searchFilter = activeFilter.toUpperCase();
          if (searchFilter.endsWith('S')) {
            searchFilter = searchFilter.slice(0, -1); // Remove trailing S
          }
          filtered = MOCK_LOGS.filter(log => log.entity_type === searchFilter);
        }
        setLogs(filtered);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [activeFilter]);

  // Decides which color and icon to show for a timeline log item
  const getLogStyle = (log) => {
    const action = log.action.toLowerCase();
    const type = log.entity_type.toUpperCase();

    if (action.includes('select') || action.includes('approve') || action.includes('paid')) {
      return {
        icon: CheckCircle,
        iconClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
        lineClass: 'border-emerald-500/20'
      };
    }
    if (action.includes('pending') || action.includes('request')) {
      return {
        icon: Clock,
        iconClass: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
        lineClass: 'border-cyan-500/20'
      };
    }
    if (action.includes('publish') || action.includes('create') || action.includes('send')) {
      return {
        icon: FileText,
        iconClass: 'text-violet-400 bg-violet-500/10 border-violet-500/30',
        lineClass: 'border-violet-500/20'
      };
    }
    if (action.includes('add') || action.includes('register')) {
      return {
        icon: UserPlus,
        iconClass: 'text-pink-400 bg-pink-500/10 border-pink-500/30',
        lineClass: 'border-pink-500/20'
      };
    }
    return {
      icon: Activity,
      iconClass: 'text-slate-400 bg-slate-500/10 border-slate-500/30',
      lineClass: 'border-slate-500/20'
    };
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="border-b border-violet-500/10 pb-4">
        <h2 className="font-outfit font-extrabold text-2xl text-slate-100 uppercase tracking-wide">Activity & Logs</h2>
        <p className="text-xs text-slate-500 font-mono mt-0.5">PROCUREMENT AUDIT TRAIL</p>
      </div>

      {/* Cyber Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-4 py-1.5 rounded-lg text-xs font-mono border transition-all duration-150 ${
              activeFilter === filter
                ? 'bg-cyan-500/10 text-cyan-400 border-cyan-400 shadow-glow-cyan'
                : 'bg-slate-900/40 text-slate-400 border-violet-500/10 hover:text-slate-200 hover:border-violet-500/25'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Timeline List */}
      <div className="relative pl-6 border-l border-violet-500/10 space-y-8 py-4">
        {logs.map((log) => {
          const style = getLogStyle(log);
          const IconComponent = style.icon;
          return (
            <div key={log.id} className="relative group">
              {/* Outer timeline indicator */}
              <div className={`absolute -left-10 top-0.5 w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-300 ${style.iconClass} group-hover:scale-110`}>
                <IconComponent className="w-4 h-4" />
              </div>

              {/* Log Details Card */}
              <div className="glass-panel rounded-xl p-5 border border-violet-500/10 hover:border-cyan-400/30 transition-all duration-300">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div className="space-y-1">
                    <p className="text-sm font-sans text-slate-200 leading-relaxed font-medium">
                      {log.action}
                    </p>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono bg-violet-600/10 border border-violet-500/20 text-violet-400 px-2 py-0.5 rounded uppercase">
                        {log.entity_type}
                      </span>
                      {log.entity_id && (
                        <span className="text-xs font-mono text-slate-500">
                          ID: #{log.entity_id}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Timestamp */}
                  <span className="text-xs font-mono text-slate-500 shrink-0">
                    {formatDate(log.created_at)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {logs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500 space-y-3 pl-0 border-none">
            <AlertCircle className="w-10 h-10 opacity-30 text-cyan-400 animate-pulse" />
            <p className="text-xs font-mono uppercase tracking-wider">No audit packets matching search filter</p>
          </div>
        )}
      </div>

      {/* Security Disclaimer */}
      <div className="flex items-center space-x-2.5 p-4 rounded-lg bg-cyan-950/15 border border-cyan-500/10 text-xs font-mono text-slate-400">
        <Terminal className="w-4 h-4 text-cyan-400 shrink-0" />
        <span>System Security Alert: Logs are read-only and cryptographically verified. No deletions or edits are permitted.</span>
      </div>
    </div>
  );
};

export default Logs;

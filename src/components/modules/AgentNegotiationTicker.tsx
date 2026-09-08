import React, { useState } from 'react';
import { useHospitalStore } from '../../store/hospitalStore';
import { Bot, ShieldAlert, CheckCircle2, Clock, Filter } from 'lucide-react';
import { AgentLog } from '../../types/hospital';

export const AgentNegotiationTicker: React.FC = () => {
  const { agentLogs } = useHospitalStore();
  const [filterAgent, setFilterAgent] = useState<string>('All');

  const filteredLogs = filterAgent === 'All'
    ? agentLogs
    : agentLogs.filter(log => log.agentName === filterAgent);

  const getSeverityBadge = (severity: AgentLog['severity']) => {
    switch (severity) {
      case 'urgent':
        return <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] px-1.5 py-0.5 rounded font-mono font-bold">URGENT</span>;
      case 'warning':
        return <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] px-1.5 py-0.5 rounded font-mono">ALERT</span>;
      case 'success':
        return <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] px-1.5 py-0.5 rounded font-mono">RESOLVED</span>;
      default:
        return <span className="bg-slate-700/50 text-slate-300 text-[10px] px-1.5 py-0.5 rounded font-mono">INFO</span>;
    }
  };

  const getAgentColor = (name: AgentLog['agentName']) => {
    switch (name) {
      case 'ICU_Agent': return 'text-rose-400';
      case 'ED_Agent': return 'text-amber-400';
      case 'EVS_Cleaning_Agent': return 'text-cyan-400';
      case 'Regional_Broker_Agent': return 'text-purple-400';
      case 'MedSurg_Agent': return 'text-blue-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
          <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Bot className="w-3.5 h-3.5 text-cyan-400" /> Multi-Agent Bed Broker Negotiation Stream
          </h3>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-1 text-xs">
          <Filter className="w-3 h-3 text-slate-400" />
          <select
            value={filterAgent}
            onChange={(e) => setFilterAgent(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-300 rounded px-2 py-0.5 text-xs focus:outline-none focus:border-cyan-500"
          >
            <option value="All">All Agents</option>
            <option value="ICU_Agent">ICU Agent</option>
            <option value="ED_Agent">ED Agent</option>
            <option value="MedSurg_Agent">MedSurg Agent</option>
            <option value="EVS_Cleaning_Agent">EVS Agent</option>
            <option value="Regional_Broker_Agent">Regional Broker</option>
          </select>
        </div>
      </div>

      {/* Log Feed */}
      <div className="space-y-2.5 overflow-y-auto max-h-64 pr-1 text-xs">
        {filteredLogs.map((log) => (
          <div
            key={log.id}
            className="bg-slate-900/50 hover:bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80 transition-all flex items-start justify-between gap-3"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={`font-mono font-semibold ${getAgentColor(log.agentName)}`}>
                  [{log.agentName}]
                </span>
                <span className="text-slate-200 font-medium">{log.action}</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">{log.details}</p>
            </div>

            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              {getSeverityBadge(log.severity)}
              <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" /> {log.timestamp}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

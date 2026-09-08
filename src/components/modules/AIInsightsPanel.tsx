import React, { useState } from 'react';
import { AlertTriangle, Clock, Users, Activity, CheckCircle2, ChevronRight, BrainCircuit, Wand2 } from 'lucide-react';
import { sound } from '../../utils/audioEngine';

export const AIInsightsPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'capacity' | 'discharge' | 'staffing'>('all');
  const [resolved, setResolved] = useState<Record<string, boolean>>({});

  const handleResolve = (id: string) => {
    sound.playTurnoverSuccess();
    setResolved(prev => ({ ...prev, [id]: true }));
  };

  const tabs = [
    { id: 'all', label: 'All Insights' },
    { id: 'capacity', label: 'Capacity' },
    { id: 'discharge', label: 'Discharge' },
    { id: 'staffing', label: 'Staffing' }
  ];

  return (
    <div className="flex flex-col h-full bg-[#0a0f1c] rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 border-b border-slate-800 bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
            <BrainCircuit size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">AI Command Insights</h2>
            <p className="text-xs text-slate-400">Real-time operational intelligence</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { sound.playTactileClick(); setActiveTab(tab.id as any); }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeTab === tab.id ? 'bg-slate-800 text-cyan-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-8">
        
        {/* Section 1: Capacity Bottlenecks */}
        {(activeTab === 'all' || activeTab === 'capacity') && (
          <section className="animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity size={18} className="text-amber-400" />
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Capacity Bottlenecks</h3>
            </div>
            <div className="grid gap-3">
              
              <div className={`p-4 rounded-xl transition-all duration-500 ${resolved['cap1'] ? 'bg-emerald-950/20 border border-emerald-900/30 opacity-60' : 'bg-slate-800/40 border border-amber-900/30 hover:bg-slate-800/60'}`}>
                <div className="flex justify-between items-start mb-2">
                  <span className={`font-medium ${resolved['cap1'] ? 'text-emerald-400 line-through' : 'text-amber-300'}`}>ICU Overflow Imminent</span>
                  {resolved['cap1'] ? (
                    <span className="text-xs font-semibold px-2 py-1 bg-emerald-950/50 text-emerald-400 rounded-md flex items-center gap-1"><CheckCircle2 size={12}/> Resolved</span>
                  ) : (
                    <span className="text-xs font-semibold px-2 py-1 bg-amber-950/50 text-amber-400 rounded-md">Critical</span>
                  )}
                </div>
                <p className="text-sm text-slate-400 mb-4">
                  Current ICU capacity is at 90%. Predicted to reach 100% in 4 hours based on ED triage data.
                </p>
                {!resolved['cap1'] && (
                  <button onClick={() => handleResolve('cap1')} className="text-xs px-3 py-2 bg-amber-950 hover:bg-amber-900 text-amber-400 rounded-lg flex items-center border border-amber-800/50 transition-colors cursor-pointer">
                    <Wand2 size={14} className="mr-2" /> Auto-Convert 2 MedSurg Beds to ICU
                  </button>
                )}
              </div>
              
              <div className={`p-4 rounded-xl transition-all duration-500 ${resolved['cap2'] ? 'bg-emerald-950/20 border border-emerald-900/30 opacity-60' : 'bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800/60'}`}>
                <div className="flex justify-between items-start mb-2">
                  <span className={`font-medium ${resolved['cap2'] ? 'text-emerald-400 line-through' : 'text-slate-200'}`}>Ghost Beds Detected</span>
                  {resolved['cap2'] ? (
                    <span className="text-xs font-semibold px-2 py-1 bg-emerald-950/50 text-emerald-400 rounded-md flex items-center gap-1"><CheckCircle2 size={12}/> Cleared</span>
                  ) : (
                    <span className="text-xs font-semibold px-2 py-1 bg-slate-700 text-slate-300 rounded-md">Warning</span>
                  )}
                </div>
                <p className="text-sm text-slate-400 mb-4">
                  2 beds in Ward 4 are marked occupied but telemetry shows 0kg weight for {'>'}4 hours.
                </p>
                {!resolved['cap2'] && (
                  <button onClick={() => handleResolve('cap2')} className="text-xs px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg flex items-center border border-slate-600 transition-colors cursor-pointer">
                    Release Ghost Beds
                  </button>
                )}
              </div>

            </div>
          </section>
        )}

        {/* Section 2: Discharge Blockers */}
        {(activeTab === 'all' || activeTab === 'discharge') && (
          <section className="animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={18} className="text-cyan-400" />
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Discharge Blockers (NLP)</h3>
            </div>
            <div className="space-y-3">
              
              <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border transition-all duration-500 ${resolved['dis1'] ? 'bg-emerald-950/20 border-emerald-900/30 opacity-60' : 'bg-slate-800/40 border-slate-700/30'}`}>
                <div className="flex gap-3">
                  <div className="mt-0.5"><Clock size={16} className={resolved['dis1'] ? 'text-emerald-500' : 'text-cyan-500'} /></div>
                  <div>
                    <div className={`text-sm font-medium ${resolved['dis1'] ? 'text-emerald-400 line-through' : 'text-slate-200'}`}>Pending MRI Results (4 Patients)</div>
                    <div className="text-xs text-slate-400 mt-1">Ward 3 discharges delayed by avg 2.5 hours waiting on radiology.</div>
                  </div>
                </div>
                {!resolved['dis1'] && (
                  <button onClick={() => handleResolve('dis1')} className="text-xs px-3 py-1.5 bg-cyan-950 hover:bg-cyan-900 text-cyan-400 rounded-lg border border-cyan-800/50 whitespace-nowrap transition-colors cursor-pointer">
                    Elevate Priority
                  </button>
                )}
              </div>

              <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border transition-all duration-500 ${resolved['dis2'] ? 'bg-emerald-950/20 border-emerald-900/30 opacity-60' : 'bg-slate-800/40 border-slate-700/30'}`}>
                <div className="flex gap-3">
                  <div className="mt-0.5"><Clock size={16} className={resolved['dis2'] ? 'text-emerald-500' : 'text-cyan-500'} /></div>
                  <div>
                    <div className={`text-sm font-medium ${resolved['dis2'] ? 'text-emerald-400 line-through' : 'text-slate-200'}`}>Physician Sign-off Needed</div>
                    <div className="text-xs text-slate-400 mt-1">Dr. Sharma has 2 patients ready for final review in the MedSurg wing.</div>
                  </div>
                </div>
                {!resolved['dis2'] && (
                  <button onClick={() => handleResolve('dis2')} className="text-xs px-3 py-1.5 bg-cyan-950 hover:bg-cyan-900 text-cyan-400 rounded-lg border border-cyan-800/50 whitespace-nowrap transition-colors cursor-pointer">
                    Page Dr. Sharma
                  </button>
                )}
              </div>

            </div>
          </section>
        )}

        {/* Section 3: Staffing Alerts */}
        {(activeTab === 'all' || activeTab === 'staffing') && (
          <section className="animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center gap-2 mb-3">
              <Users size={18} className="text-purple-400" />
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Staffing Alerts</h3>
            </div>
            <div className={`border p-4 rounded-xl transition-all duration-500 ${resolved['staff1'] ? 'bg-emerald-950/20 border-emerald-900/30 opacity-60' : 'bg-slate-800/40 border-purple-900/30'}`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg shrink-0 ${resolved['staff1'] ? 'bg-emerald-950/50' : 'bg-purple-950/50'}`}>
                  {resolved['staff1'] ? <CheckCircle2 size={16} className="text-emerald-400" /> : <AlertTriangle size={16} className="text-purple-400" />}
                </div>
                <div>
                  <h4 className={`text-sm font-medium mb-1 ${resolved['staff1'] ? 'text-emerald-400 line-through' : 'text-slate-200'}`}>Nurse-to-Patient Ratio Alert</h4>
                  <p className="text-xs text-slate-400 mb-3">
                    Night shift in Ward 2 is projected to be understaffed (1:8 ratio). Standard is 1:6.
                  </p>
                  {!resolved['staff1'] && (
                    <div className="flex gap-2">
                      <button onClick={() => handleResolve('staff1')} className="text-xs px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-md transition-colors cursor-pointer">
                        Call in Floater
                      </button>
                      <button onClick={() => handleResolve('staff1')} className="text-xs px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-md transition-colors cursor-pointer">
                        Ignore
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

      </div>
    </div>
  );
};

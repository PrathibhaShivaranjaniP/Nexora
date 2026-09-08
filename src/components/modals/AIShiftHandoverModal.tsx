import React from 'react';
import { BrainCircuit, X, AlertCircle, Activity, Wind, Clock } from 'lucide-react';

import { sound } from '../../utils/audioEngine';

export interface AIShiftHandoverModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIShiftHandoverModal: React.FC<AIShiftHandoverModalProps> = ({ isOpen, onClose }) => {
  React.useEffect(() => {
    if (isOpen) {
      sound.speakVoiceAI("Welcome back. Here is your shift handover. ICU capacity is at 90 percent. 3 trauma patients are inbound. Oxygen reserves are stable.", true);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-slate-900 border border-cyan-900/50 rounded-2xl shadow-[0_0_50px_-12px_rgba(6,182,212,0.3)] overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-teal-400" />
        
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-cyan-950/50 text-cyan-400 rounded-xl border border-cyan-800/50">
                <BrainCircuit size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-100">AI Shift Handover</h2>
                <div className="flex items-center gap-2 text-sm text-cyan-400/80">
                  <Clock size={14} />
                  <span>Last 12 Hours Summary</span>
                </div>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-start gap-4 hover:bg-slate-800 transition-colors">
              <div className="p-2 bg-amber-950/50 text-amber-400 rounded-lg shrink-0 mt-0.5">
                <AlertCircle size={18} />
              </div>
              <div>
                <h3 className="font-semibold text-slate-200 mb-1">ICU Capacity Critical</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  ICU is currently <span className="text-amber-400 font-medium">90% full</span>. Only 2 beds remaining. Discharges are blocked due to pending lab results.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-start gap-4 hover:bg-slate-800 transition-colors">
              <div className="p-2 bg-red-950/50 text-red-400 rounded-lg shrink-0 mt-0.5">
                <Activity size={18} />
              </div>
              <div>
                <h3 className="font-semibold text-slate-200 mb-1">Inbound Emergencies</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  <span className="text-red-400 font-medium">3 trauma patients</span> are inbound from the highway multi-vehicle collision. ETA is 15 minutes. Emergency Response Team Alpha has been activated.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-start gap-4 hover:bg-slate-800 transition-colors">
              <div className="p-2 bg-cyan-950/50 text-cyan-400 rounded-lg shrink-0 mt-0.5">
                <Wind size={18} />
              </div>
              <div>
                <h3 className="font-semibold text-slate-200 mb-1">Resource Update</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Oxygen bank was successfully <span className="text-cyan-400 font-medium">refilled</span> at 04:00 AM. Total reserves are now at 98% capacity, sufficient for the next 72 hours at current consumption rates.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-lg transition-colors shadow-[0_0_15px_-3px_rgba(6,182,212,0.4)]"
          >
            Acknowledge Handover
          </button>
        </div>
      </div>
    </div>
  );
};

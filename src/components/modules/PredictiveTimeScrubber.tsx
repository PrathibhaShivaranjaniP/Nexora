import React from 'react';
import { useHospitalStore } from '../../store/hospitalStore';
import { Clock, AlertTriangle } from 'lucide-react';

export const PredictiveTimeScrubber: React.FC = () => {
  const { predictiveOffsetHours, setPredictiveOffsetHours } = useHospitalStore();

  if (!setPredictiveOffsetHours) return null;

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[400px] max-w-[90vw] bg-[#040812]/90 backdrop-blur-xl border border-cyan-900/50 rounded-2xl p-4 shadow-2xl z-20 animate-in slide-in-from-bottom-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">Predictive Time Scrubber</span>
        </div>
        {predictiveOffsetHours > 0 ? (
          <span className="text-xs font-mono font-bold text-rose-400 animate-pulse bg-rose-950/40 px-2 py-0.5 rounded border border-rose-900/50">
            +{predictiveOffsetHours} HOURS
          </span>
        ) : (
          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/50">
            LIVE (NOW)
          </span>
        )}
      </div>

      <input
        type="range"
        min="0"
        max="24"
        step="1"
        value={predictiveOffsetHours || 0}
        onChange={(e) => setPredictiveOffsetHours(Number(e.target.value))}
        className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-400 transition-all"
      />
      
      <div className="flex justify-between mt-2 text-[10px] font-mono text-slate-500">
        <span>NOW</span>
        <span>+6H</span>
        <span>+12H</span>
        <span>+18H</span>
        <span>+24H</span>
      </div>

      {predictiveOffsetHours > 12 && (
        <div className="mt-3 p-2 bg-rose-950/30 border border-rose-900/40 rounded-lg flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-400 mt-0.5 shrink-0" />
          <p className="text-[10px] text-rose-300/80 leading-relaxed">
            AI predicts critical mass casualty surge at +14H. Expected ICU overflow: 14%. Divert incoming trauma.
          </p>
        </div>
      )}
    </div>
  );
};
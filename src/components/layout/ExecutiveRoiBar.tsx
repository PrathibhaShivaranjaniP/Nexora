import React from 'react';
import { useHospitalStore } from '../../store/hospitalStore';
import { DollarSign, ShieldCheck, Clock, Award, TrendingUp } from 'lucide-react';

export const ExecutiveRoiBar: React.FC = () => {
  const { ghostBeds, whatIfParams } = useHospitalStore();

  // Dynamic calculations based on operational state
  const surgeriesSaved = whatIfParams.electiveSurgeryRatio >= 0.8 ? 2 : 0;
  const surgicalRevenue = surgeriesSaved * 36000; // $36k per cardiac/ortho margin
  const overtimeAvoided = 14800;
  const totalFinancialImpact = surgicalRevenue + overtimeAvoided;
  const bedHoursReclaimed = (4 - ghostBeds) * 3.4 + 18.2;

  return (
    <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800/80 rounded-xl px-4 py-2 flex items-center justify-between gap-4 shadow-xl text-xs">
      <div className="flex items-center gap-2 pr-3 border-r border-slate-800 flex-shrink-0">
        <div className="w-6 h-6 rounded-md bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
          <TrendingUp className="w-3.5 h-3.5" />
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase font-mono font-semibold block leading-tight">
            Executive Operations ROI
          </span>
          <span className="font-bold text-emerald-400 font-mono text-xs">
            +${totalFinancialImpact.toLocaleString()} Protected Today
          </span>
        </div>
      </div>

      <div className="hidden sm:flex items-center gap-5 text-[11px]">
        {/* Metric 1 */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Surgical Revenue:</span>
          <span className="font-mono font-bold text-slate-200">+${surgicalRevenue.toLocaleString()}</span>
          <span className="text-[10px] text-slate-500">(2 cases preserved)</span>
        </div>

        {/* Metric 2 */}
        <div className="hidden md:flex items-center gap-2">
          <span className="text-slate-400">Nurse Overtime Saved:</span>
          <span className="font-mono font-bold text-slate-200">+$14,800</span>
        </div>

        {/* Metric 3 */}
        <div className="hidden lg:flex items-center gap-2">
          <span className="text-slate-400">Bed Hours Reclaimed:</span>
          <span className="font-mono font-bold text-cyan-400">+{bedHoursReclaimed.toFixed(1)} hrs</span>
          <span className="text-[10px] text-slate-500">(Ghost bed turnover)</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-mono">
          <ShieldCheck className="w-3 h-3" /> Zero Elective Cancellations
        </span>
      </div>
    </div>
  );
};

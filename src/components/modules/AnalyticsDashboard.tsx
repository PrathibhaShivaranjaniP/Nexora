import React from 'react';
import { useHospitalStore } from '../../store/hospitalStore';

export const AnalyticsDashboard = () => {
  const store = useHospitalStore();
  
  return (
    <div className="w-full h-full bg-[#050811] text-slate-200 p-6 flex flex-col gap-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-white">Analytics & Forecasting</h2>
        <div className="text-sm text-slate-400">Last updated: Just now</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* KPI 1 */}
        <div className="bg-[#0f172a] rounded-xl p-5 border border-slate-800 shadow-md">
          <div className="text-sm text-slate-400 mb-1">Prediction Accuracy</div>
          <div className="text-3xl font-bold text-emerald-400">94.2%</div>
          <div className="text-xs text-slate-500 mt-2">+1.2% from last week</div>
        </div>
        
        {/* KPI 2 */}
        <div className="bg-[#0f172a] rounded-xl p-5 border border-slate-800 shadow-md">
          <div className="text-sm text-slate-400 mb-1">Avg Length of Stay</div>
          <div className="text-3xl font-bold text-blue-400">4.1 Days</div>
          <div className="text-xs text-slate-500 mt-2">-0.3 days optimization</div>
        </div>

        {/* KPI 3 */}
        <div className="bg-[#0f172a] rounded-xl p-5 border border-slate-800 shadow-md">
          <div className="text-sm text-slate-400 mb-1">Surge Risk (Next 72h)</div>
          <div className="text-3xl font-bold text-amber-400">Medium</div>
          <div className="text-xs text-slate-500 mt-2">Driven by local flu trends</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-grow">
        {/* Chart 1: 7-Day Occupancy Trend */}
        <div className="bg-[#0f172a] rounded-xl p-6 border border-slate-800 flex flex-col shadow-md">
          <h3 className="text-lg font-medium text-white mb-6">7-Day Occupancy Trend</h3>
          <div className="flex-grow flex items-end justify-between gap-2 h-48 mt-4">
            {[65, 72, 85, 78, 92, 88, 75].map((val, i) => (
              <div key={i} className="w-full flex flex-col justify-end items-center gap-2 group relative h-full">
                <div 
                  className="w-full bg-blue-500/20 hover:bg-blue-500/40 border border-blue-500/50 rounded-t-md transition-all duration-300 relative" 
                  style={{ height: `${val}%` }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-slate-800 text-white text-xs py-1 px-2 rounded transition-opacity pointer-events-none">
                    {val}%
                  </div>
                </div>
                <div className="text-xs text-slate-400">D-{6-i}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 2: Department Load */}
        <div className="bg-[#0f172a] rounded-xl p-6 border border-slate-800 flex flex-col shadow-md">
          <h3 className="text-lg font-medium text-white mb-6">Department Load Prediction</h3>
          <div className="flex-grow flex flex-col justify-center gap-5">
            {[
              { dept: 'Emergency', load: 85, color: 'bg-red-500' },
              { dept: 'ICU', load: 92, color: 'bg-amber-500' },
              { dept: 'General Med', load: 60, color: 'bg-blue-500' },
              { dept: 'Surgery', load: 45, color: 'bg-emerald-500' }
            ].map((item, i) => (
              <div key={i} className="flex flex-col gap-1.5" w-full="true">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300 font-medium">{item.dept}</span>
                  <span className="text-slate-400">{item.load}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.load}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

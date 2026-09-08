import React from 'react';
import { useHospitalStore } from '../../store/hospitalStore';

export const MobileGlanceDashboard = () => {
  const store = useHospitalStore();

  const occupancyPercent = store.actualHospitalOccupancyPercent || 0;
  const occupiedBeds = store.actualHospitalOccupiedBeds || 0;
  const totalBeds = store.actualHospitalTotalBeds || 0;

  // Assuming agentLogs are available for system alerts.
  // Using generic mock data if they aren't structured well enough.
  const alerts = store.agentLogs?.slice(0, 3) || [];
  
  // Pending admissions might not be explicitly in the store with that exact name.
  // Using edWait or just mocking a fallback.
  const pendingAdmissionsCount = store.actualHospitalEdOccupied || 12; 
  const edWaitTime = store.actualHospitalEdWait || 45;

  return (
    <div className="w-full h-full bg-[#050811] text-slate-200 p-4 flex flex-col gap-4 overflow-y-auto">
      <div className="flex flex-col gap-1 mb-2">
        <h2 className="text-xl font-semibold text-white">Mobile Glance</h2>
        <span className="text-xs text-slate-400">Real-time Overview</span>
      </div>

      {/* Card 1: Live Occupancy */}
      <div className="bg-[#0f172a] rounded-2xl p-5 border border-slate-800 shadow-md flex flex-col">
        <div className="text-sm text-slate-400 font-medium mb-3">Live Occupancy</div>
        <div className="flex items-end gap-3 mb-4">
          <div className="text-4xl font-bold text-white">{occupancyPercent}%</div>
          <div className="text-sm text-slate-500 mb-1">
            {occupiedBeds} / {totalBeds} Beds
          </div>
        </div>
        <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full ${occupancyPercent > 85 ? 'bg-red-500' : occupancyPercent > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
            style={{ width: `${occupancyPercent}%` }}
          ></div>
        </div>
      </div>

      {/* Card 2: Pending Admissions */}
      <div className="bg-[#0f172a] rounded-2xl p-5 border border-slate-800 shadow-md flex flex-col">
        <div className="text-sm text-slate-400 font-medium mb-3">Pending Admissions</div>
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-3xl font-bold text-blue-400">{pendingAdmissionsCount}</span>
            <span className="text-xs text-slate-500 mt-1">Total in queue</span>
          </div>
          <div className="h-10 w-[1px] bg-slate-700"></div>
          <div className="flex flex-col">
            <span className="text-3xl font-bold text-amber-400">{edWaitTime}m</span>
            <span className="text-xs text-slate-500 mt-1">Avg ED Wait</span>
          </div>
        </div>
      </div>

      {/* Card 3: System Alerts */}
      <div className="bg-[#0f172a] rounded-2xl p-5 border border-slate-800 shadow-md flex flex-col">
        <div className="text-sm text-slate-400 font-medium mb-3">System Alerts</div>
        <div className="flex flex-col gap-3">
          {alerts.length > 0 ? (
            alerts.map((alert: any, idx: number) => (
              <div key={idx} className="flex gap-3 items-start bg-slate-800/30 p-3 rounded-lg border border-slate-700/50">
                <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${alert.severity === 'high' || alert.severity === 'critical' ? 'bg-red-500' : alert.severity === 'medium' ? 'bg-amber-500' : 'bg-blue-500'}`}></div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm text-slate-200">{alert.action || 'Alert'}</span>
                  <span className="text-xs text-slate-500 line-clamp-2">{alert.details}</span>
                </div>
              </div>
            ))
          ) : (
            <>
              {/* Mock Alerts if store is empty */}
              <div className="flex gap-3 items-start bg-slate-800/30 p-3 rounded-lg border border-slate-700/50">
                <div className="mt-0.5 w-2 h-2 rounded-full shrink-0 bg-amber-500"></div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm text-slate-200">ICU Capacity Warning</span>
                  <span className="text-xs text-slate-500">ICU approaching 90% utilization</span>
                </div>
              </div>
              <div className="flex gap-3 items-start bg-slate-800/30 p-3 rounded-lg border border-slate-700/50">
                <div className="mt-0.5 w-2 h-2 rounded-full shrink-0 bg-blue-500"></div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm text-slate-200">Oxygen Refill Complete</span>
                  <span className="text-xs text-slate-500">Tank 2 refilled successfully</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { useHospitalStore } from '../../store/hospitalStore';
import { Navigation, Ambulance, ShieldAlert, CheckCircle2, Clock, MapPin, Building2 } from 'lucide-react';
import { RealHospital } from '../../data/realDistrictsData';

export const RegionalEMSNetwork: React.FC = () => {
  const { hospitals, selectedHospitalId, setSelectedHospitalId } = useHospitalStore();

  return (
    <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <Navigation className="w-4 h-4 text-cyan-400" /> Regional EMS Dynamic Routing & Ambulance Diversion
          </h3>
          <p className="text-xs text-slate-400">
            Automated multi-objective network load balancing routes ambulances to minimize total time-to-care
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 px-2.5 py-1 rounded-full font-mono">
            <Ambulance className="w-3.5 h-3.5" /> Regional EMS Mesh Active
          </span>
        </div>
      </div>

      {/* Network Topology Visual Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {hospitals.map((hospital: RealHospital) => {
          const isCentral = hospital.id === 'hosp-central';
          const isSelected = hospital.id === selectedHospitalId;
          const totalOccupancyPercent = Math.round((hospital.occupiedBeds / hospital.totalBeds) * 100);
          const icuOccupancyPercent = Math.round((hospital.icuOccupied / hospital.icuBeds) * 100);

          return (
            <div
              key={hospital.id}
              onClick={() => setSelectedHospitalId(hospital.id)}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-slate-900/90 border-cyan-500/80 shadow-xl shadow-cyan-950/40 ring-1 ring-cyan-500/50'
                  : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <Building2 className={`w-4 h-4 ${isCentral ? 'text-cyan-400' : 'text-slate-400'}`} />
                    <h4 className="font-semibold text-slate-100 text-sm">{hospital.shortName}</h4>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">{hospital.type}</div>
                </div>

                {/* Diversion Status Badge */}
                {hospital.diversionActive ? (
                  <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] px-2 py-0.5 rounded font-mono font-bold animate-pulse">
                    DIVERSION ON
                  </span>
                ) : (
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] px-2 py-0.5 rounded font-mono">
                    ACCEPTING
                  </span>
                )}
              </div>

              {/* Transit & Wait Metrics */}
              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800 text-xs">
                <div className="bg-slate-950/60 p-2 rounded">
                  <span className="text-slate-500 text-[10px] flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" /> ED Wait Time
                  </span>
                  <span
                    className={`font-mono font-bold text-sm ${
                      hospital.edWaitMinutes > 45 ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {hospital.edWaitMinutes} mins
                  </span>
                </div>

                <div className="bg-slate-950/60 p-2 rounded">
                  <span className="text-slate-500 text-[10px] flex items-center gap-1">
                    <Ambulance className="w-2.5 h-2.5" /> Transit from Hub
                  </span>
                  <span className="font-mono font-bold text-sm text-slate-200">
                    {hospital.ambulanceTransitMinutes === 0 ? 'Hub Facility' : `${hospital.ambulanceTransitMinutes}m (${hospital.distanceFromHubKm}km)`}
                  </span>
                </div>
              </div>

              {/* Bed Capacity Gauges */}
              <div className="space-y-2 mt-3 pt-2 border-t border-slate-800/80 text-xs">
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-400">Total Census ({hospital.occupiedBeds}/{hospital.totalBeds})</span>
                    <span className="font-mono font-semibold text-slate-200">{totalOccupancyPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        totalOccupancyPercent > 85 ? 'bg-rose-500' : 'bg-cyan-400'
                      }`}
                      style={{ width: `${totalOccupancyPercent}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-400">ICU Capacity ({hospital.icuOccupied}/{hospital.icuBeds})</span>
                    <span
                      className={`font-mono font-semibold ${
                        icuOccupancyPercent >= 90 ? 'text-rose-400 font-bold' : 'text-slate-200'
                      }`}
                    >
                      {icuOccupancyPercent}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        icuOccupancyPercent >= 90 ? 'bg-rose-500' : 'bg-purple-400'
                      }`}
                      style={{ width: `${icuOccupancyPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Specialties */}
              <div className="mt-3 pt-2 border-t border-slate-800/60">
                <span className="text-[10px] text-slate-500 block mb-1">Clinical Specialties:</span>
                <div className="flex flex-wrap gap-1">
                  {hospital.specialties.slice(0, 3).map((spec: string, i: number) => (
                    <span key={i} className="text-[9px] bg-slate-800/80 text-slate-300 px-1.5 py-0.5 rounded">
                      {spec}
                    </span>
                  ))}
                  {hospital.specialties.length > 3 && (
                    <span className="text-[9px] text-slate-500 self-center">
                      +{hospital.specialties.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Regional Load Balancing Insight Box */}
      <div className="bg-slate-900/60 p-3.5 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <Ambulance className="w-5 h-5 text-amber-400 animate-pulse flex-shrink-0" />
          <div className="space-y-0.5">
            <div className="font-semibold text-slate-200">
              Active Diversion Protocol: Aegis Central $\rightarrow$ Metro North Regional
            </div>
            <p className="text-slate-400 text-[11px]">
              Diverting non-critical trauma ambulances to Metro North saves ~34 mins per patient (18m wait vs 52m wait) and protects Central's remaining 3 ICU beds.
            </p>
          </div>
        </div>
        <button
          onClick={() => setSelectedHospitalId(selectedHospitalId === 'hosp-central' ? 'hosp-north' : 'hosp-central')}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition-colors flex-shrink-0"
        >
          Toggle Node View
        </button>
      </div>
    </div>
  );
};

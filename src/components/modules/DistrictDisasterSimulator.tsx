import React from 'react';
import { useHospitalStore } from '../../store/hospitalStore';
import { AlertOctagon, Flame, Train, Waves, CheckCircle2, ShieldAlert } from 'lucide-react';
import { sound } from '../../utils/audioEngine';

export const DistrictDisasterSimulator: React.FC = () => {
  const { currentDistrict, activeDisasterScenario, triggerMassCasualty, clearMassCasualty } = useHospitalStore();

  const handleTrigger = (name: string) => {
    sound.playAlertTone();
    triggerMassCasualty(name);
  };

  const handleClear = () => {
    sound.playTactileClick();
    clearMassCasualty();
  };

  return (
    <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-rose-400 animate-pulse" /> District Mass Casualty & Disaster Simulator (MCI)
          </h3>
          <p className="text-xs text-slate-400">
            Defense-grade disaster triage engine calculating dynamic casualty distribution across {currentDistrict.name}
          </p>
        </div>

        {activeDisasterScenario ? (
          <button
            onClick={handleClear}
            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-all"
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Clear Disaster Alert
          </button>
        ) : (
          <span className="text-xs bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-mono">
            MCI Readiness: Standby
          </span>
        )}
      </div>

      {/* Active Warning Banner if Disaster is Live */}
      {activeDisasterScenario && (
        <div className="p-3.5 bg-rose-500/15 border border-rose-500/40 rounded-xl flex items-center justify-between text-xs text-rose-200 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-rose-400 animate-pulse flex-shrink-0" />
            <div>
              <span className="font-bold text-rose-300 uppercase tracking-wide">
                ACTIVE SCENARIO: {activeDisasterScenario}
              </span>
              <p className="text-[11px] text-rose-200/80">
                District Trauma Network operating at Level 1 MCI Surge. All non-emergency elective surgeries deferred. 12 resuscitation bays unlocked.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Regional Disaster Scenario Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Scenario 1: Train Derailment */}
        <button
          onClick={() => handleTrigger('Express Train Derailment near District Junction')}
          className={`p-3.5 rounded-xl border text-left text-xs transition-all space-y-2 ${
            activeDisasterScenario?.includes('Train')
              ? 'bg-rose-500/20 border-rose-500 text-rose-100 shadow-xl'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
          }`}
        >
          <div className="flex items-center gap-2 font-bold text-rose-400">
            <Train className="w-4 h-4" />
            <span>Express Train Derailment</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Simulates ~85 polytrauma victims. Routes severe head & spine trauma to apex medical college and extremity fractures to secondary centers.
          </p>
          <div className="text-[10px] font-mono text-cyan-400 font-semibold">
            +45 Trauma Bays Required
          </div>
        </button>

        {/* Scenario 2: Industrial Chemical Gas Leak */}
        <button
          onClick={() => handleTrigger('Industrial Toxic Gas Hazard in Industrial Estate')}
          className={`p-3.5 rounded-xl border text-left text-xs transition-all space-y-2 ${
            activeDisasterScenario?.includes('Chemical')
              ? 'bg-amber-500/20 border-amber-500 text-amber-100 shadow-xl'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
          }`}
        >
          <div className="flex items-center gap-2 font-bold text-amber-400">
            <Flame className="w-4 h-4" />
            <span>Industrial Chemical Leak</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Simulates acute respiratory distress and chemical burns. Arms negative-pressure ICU pods and toxicological antidote buffers across district.
          </p>
          <div className="text-[10px] font-mono text-amber-400 font-semibold">
            +28 Pulmonary ICU Beds
          </div>
        </button>

        {/* Scenario 3: Monsoon Cyclone Flooding */}
        <button
          onClick={() => handleTrigger('Severe Cyclone Landfall & Urban Inundation')}
          className={`p-3.5 rounded-xl border text-left text-xs transition-all space-y-2 ${
            activeDisasterScenario?.includes('Cyclone')
              ? 'bg-cyan-500/20 border-cyan-500 text-cyan-100 shadow-xl'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
          }`}
        >
          <div className="flex items-center gap-2 font-bold text-cyan-400">
            <Waves className="w-4 h-4" />
            <span>Monsoon Cyclone Inundation</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Simulates ground-floor ward flooding. Vertically evacuates 60 inpatient beds to upper recovery floors and activates amphibious ambulance dispatch.
          </p>
          <div className="text-[10px] font-mono text-cyan-300 font-semibold">
            Vertical Ward Relocation Active
          </div>
        </button>
      </div>
    </div>
  );
};

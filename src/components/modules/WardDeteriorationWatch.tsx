import React from 'react';
import { useHospitalStore } from '../../store/hospitalStore';
import { HeartPulse, AlertTriangle, ShieldAlert, ArrowUpRight } from 'lucide-react';
import { ECGWaveform } from '../telemetry/ECGWaveform';
import { sound } from '../../utils/audioEngine';

export const WardDeteriorationWatch: React.FC = () => {
  const { patients, preEmptIcuBed, setSelectedBedId } = useHospitalStore();

  const highRiskPatients = patients
    .filter(p => p.ward !== 'ICU' && p.deteriorationRisk >= 25)
    .sort((a, b) => b.deteriorationRisk - a.deteriorationRisk);

  const handlePreempt = (patientId: string) => {
    sound.playAlertTone();
    preEmptIcuBed(patientId);
  };

  return (
    <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <HeartPulse className="w-4 h-4 text-rose-400 animate-pulse" /> Ward-to-ICU Deterioration Pre-emption & Live ECG
          </h3>
          <p className="text-xs text-slate-400">
            Real-time continuous NEWS2 risk telemetry predicting clinical arrests 6–12 hours in advance
          </p>
        </div>
        <span className="text-xs bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full font-mono font-semibold">
          {highRiskPatients.filter(p => p.deteriorationRisk >= 70).length} Critical Escalation Alerts
        </span>
      </div>

      <div className="space-y-3">
        {highRiskPatients.map(patient => {
          const isCritical = patient.deteriorationRisk >= 70;

          return (
            <div
              key={patient.id}
              className={`p-4 rounded-xl border text-xs transition-all space-y-3 ${
                isCritical
                  ? 'bg-rose-950/20 border-rose-500/40 shadow-xl shadow-rose-950/20 ring-1 ring-rose-500/30'
                  : 'bg-slate-900/60 border-slate-800'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-100 text-sm">{patient.name}</span>
                  <span className="text-slate-400 font-mono text-[11px]">({patient.mrn})</span>
                  <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded text-[10px]">
                    {patient.ward} • {patient.bedId}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-400">NEWS2 Score:</span>
                  <span
                    className={`font-mono font-bold px-2 py-0.5 rounded ${
                      patient.news2Score >= 7 ? 'bg-rose-500 text-white animate-pulse' : 'bg-amber-500 text-slate-950'
                    }`}
                  >
                    {patient.news2Score}
                  </span>
                </div>
              </div>

              <p className="text-slate-300 text-xs font-medium">{patient.diagnosis}</p>

              {/* Real-time Oscilloscope Telemetry Strip */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
                <div className="flex-1">
                  <span className="text-[10px] text-slate-500 block mb-1 font-mono uppercase">
                    Live Oscilloscope Strip (Lead II)
                  </span>
                  <ECGWaveform
                    heartRate={patient.vitals.heartRate}
                    isCritical={isCritical}
                    width={280}
                    height={50}
                  />
                </div>

                {/* Vitals HUD */}
                <div className="grid grid-cols-3 gap-2 text-[11px] font-mono flex-shrink-0">
                  <div className="bg-slate-950/60 p-2 rounded">
                    <span className="text-slate-500 block text-[9px]">BP</span>
                    <span className={patient.vitals.bpSystolic < 100 ? 'text-rose-400 font-bold' : 'text-slate-200'}>
                      {patient.vitals.bpSystolic}/{patient.vitals.bpDiastolic}
                    </span>
                  </div>
                  <div className="bg-slate-950/60 p-2 rounded">
                    <span className="text-slate-500 block text-[9px]">SpO2</span>
                    <span className={patient.vitals.spO2 < 93 ? 'text-amber-400 font-bold' : 'text-slate-200'}>
                      {patient.vitals.spO2}%
                    </span>
                  </div>
                  <div className="bg-slate-950/60 p-2 rounded">
                    <span className="text-slate-500 block text-[9px]">ICU Risk</span>
                    <span className={isCritical ? 'text-rose-400 font-bold' : 'text-amber-400'}>
                      {patient.deteriorationRisk}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions Bar */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                <span className="text-[10px] text-slate-400 italic line-clamp-1 max-w-sm">
                  "{patient.clinicalNotesSnippet || 'Telemetry stream active'}"
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      sound.playTactileClick();
                      setSelectedBedId(patient.bedId);
                    }}
                    className="px-2.5 py-1 text-[11px] text-slate-300 hover:text-cyan-300 transition-colors"
                  >
                    Locate Bed 3D
                  </button>
                  <button
                    onClick={() => handlePreempt(patient.id)}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-rose-600/30 active:scale-95"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" /> Pre-Empt ICU Bed
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

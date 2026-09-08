import React, { useState } from 'react';
import { useHospitalStore } from '../../store/hospitalStore';
import { BedStatus } from '../../types/hospital';
import { X, BedDouble, UserX, Sparkles, Activity, ShieldAlert, Check, Heart } from 'lucide-react';
import { ECGWaveform } from '../telemetry/ECGWaveform';

export const BedDetailModal: React.FC = () => {
  const { beds, patients, selectedBedId, setSelectedBedId, updateBedStatus, dischargePatient, turnoverGhostBed } = useHospitalStore();

  const [overrideStatus, setOverrideStatus] = useState<BedStatus | ''>('');
  const [overrideNotes, setOverrideNotes] = useState('');
  const [dischargeReason, setDischargeReason] = useState('Routine Clinical Discharge');

  if (!selectedBedId) return null;

  const bed = beds.find(b => b.id === selectedBedId);
  if (!bed) return null;

  const patient = patients.find(p => p.id === bed.patientId);

  const handleApplyOverride = () => {
    if (overrideStatus) {
      updateBedStatus(bed.id, overrideStatus as BedStatus, overrideNotes);
      setOverrideStatus('');
      setOverrideNotes('');
    }
  };

  const handleDischarge = () => {
    if (patient) {
      dischargePatient(patient.id, dischargeReason);
    } else {
      updateBedStatus(bed.id, 'cleaning', `Discharged: ${dischargeReason}`);
    }
    setSelectedBedId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#0b1326] border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <BedDouble className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">{bed.number} Details</h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Ward: {bed.ward} • ID: {bed.id}
              </p>
            </div>
          </div>

          <button
            onClick={() => setSelectedBedId(null)}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Current Status Card */}
          <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-mono">Physical State</span>
              <span className="text-slate-200 font-semibold text-sm capitalize">{bed.status}</span>
            </div>

            <span
              className={`text-xs px-2.5 py-1 rounded font-mono font-bold uppercase ${
                bed.status === 'available'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : bed.status === 'ghost'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                  : bed.status === 'cleaning'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : bed.status === 'reserved'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
              }`}
            >
              {bed.status}
            </span>
          </div>

          {/* Ghost Bed Alert & Fast Action */}
          {bed.status === 'ghost' && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg space-y-2">
              <div className="flex items-center justify-between text-amber-300">
                <span className="font-semibold">Ghost Bed Action Required</span>
                <span className="text-[10px] font-mono">Pressure: 0 kg</span>
              </div>
              <p className="text-slate-300 text-[11px]">
                The bed is physically empty. Dispatching cleaning staff immediately releases this bed to 'Available' in under 3 minutes.
              </p>
              <button
                onClick={() => {
                  turnoverGhostBed(bed.id);
                  setSelectedBedId(null);
                }}
                className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded flex items-center justify-center gap-1.5 transition-all shadow-md shadow-cyan-600/20"
              >
                <Sparkles className="w-3.5 h-3.5" /> Dispatch Rapid Cleaning Turnover
              </button>
            </div>
          )}

          {/* Patient Details (if Occupied) */}
          {patient ? (
            <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div>
                  <h4 className="font-semibold text-slate-100 text-sm">{patient.name}</h4>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {patient.mrn} • {patient.gender}, {patient.age} yrs
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block">Acuity Level</span>
                  <span className="font-mono font-bold text-cyan-400 text-sm">{patient.acuity} / 5</span>
                </div>
              </div>

              <div>
                <span className="text-slate-500 text-[10px] block">Primary Diagnosis</span>
                <p className="text-slate-200 text-xs font-medium">{patient.diagnosis}</p>
              </div>

              {/* Live Lead II Continuous Cardiac Waveform Oscilloscope */}
              <div className="space-y-1 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-emerald-400 font-mono font-bold flex items-center gap-1.5">
                    <Heart className="w-3 h-3 text-rose-500 animate-pulse fill-rose-500" />
                    Lead II Cardiac Telemetry (Continuous 60 FPS)
                  </span>
                  <span className="text-slate-500 font-mono">25 mm/s • 10 mm/mV</span>
                </div>
                <div className="h-14 w-full bg-[#030612] rounded-lg overflow-hidden border border-slate-800/80">
                  <ECGWaveform
                    heartRate={patient.vitals.heartRate}
                    isCritical={patient.news2Score >= 7}
                    color={patient.news2Score >= 7 ? '#f43f5e' : '#10b981'}
                    width={450}
                    height={54}
                    showDetails={false}
                  />
                </div>
              </div>

              {/* Vitals */}
              <div className="grid grid-cols-4 gap-2 text-[10px] font-mono bg-slate-950/60 p-2 rounded border border-slate-800/80">
                <div>
                  <span className="text-slate-500 block">HR</span>
                  <span className="text-slate-200 font-bold">{patient.vitals.heartRate} bpm</span>
                </div>
                <div>
                  <span className="text-slate-500 block">BP</span>
                  <span className="text-slate-200 font-bold">{patient.vitals.bpSystolic}/{patient.vitals.bpDiastolic}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">SpO2</span>
                  <span className="text-slate-200 font-bold">{patient.vitals.spO2}%</span>
                </div>
                <div>
                  <span className="text-slate-500 block">NEWS2</span>
                  <span className={patient.news2Score >= 7 ? 'text-rose-400 font-bold' : 'text-slate-200'}>
                    {patient.news2Score}
                  </span>
                </div>
              </div>

              {/* Discharge Section */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <span className="text-slate-400 font-semibold block text-[11px]">Discharge or Remove Patient</span>
                <div className="flex gap-2">
                  <select
                    value={dischargeReason}
                    onChange={e => setDischargeReason(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-700/80 rounded p-1.5 text-slate-200 text-xs"
                  >
                    <option value="Routine Clinical Discharge">Routine Clinical Discharge</option>
                    <option value="Transfer to Another Facility">Transfer to Another Facility</option>
                    <option value="Against Medical Advice (AMA)">Against Medical Advice (AMA)</option>
                    <option value="Entered in Error (Soft Delete)">Entered in Error (Soft Delete)</option>
                  </select>
                  <button
                    onClick={handleDischarge}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded text-xs flex items-center gap-1 transition-all"
                  >
                    <UserX className="w-3.5 h-3.5" /> Discharge
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-slate-400 text-xs italic bg-slate-900/40 p-3 rounded-lg border border-slate-800/60">
              No patient currently assigned to this bed.
            </div>
          )}

          {/* Manual Bed Status Override */}
          <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
            <span className="font-semibold text-slate-200 block text-xs">Manual Bed Status Override</span>
            <div className="grid grid-cols-3 gap-1.5">
              {(['available', 'occupied', 'ghost', 'cleaning', 'reserved'] as BedStatus[]).map(status => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setOverrideStatus(status)}
                  className={`py-1.5 px-2 rounded text-[11px] font-mono uppercase transition-all capitalize ${
                    overrideStatus === status
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            <input
              type="text"
              value={overrideNotes}
              onChange={e => setOverrideNotes(e.target.value)}
              placeholder="Override rationale (e.g. UV clean needed, maintenance)..."
              className="w-full bg-slate-950 border border-slate-700/80 rounded p-2 text-xs text-slate-100"
            />

            <button
              onClick={handleApplyOverride}
              disabled={!overrideStatus}
              className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-cyan-300 font-semibold rounded transition-colors"
            >
              Apply Status Override
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

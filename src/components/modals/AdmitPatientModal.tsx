import React, { useState } from 'react';
import { useHospitalStore } from '../../store/hospitalStore';
import { UserPlus, X, HeartPulse, Activity } from 'lucide-react';
import { WardType } from '../../types/hospital';

interface AdmitPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdmitPatientModal: React.FC<AdmitPatientModalProps> = ({ isOpen, onClose }) => {
  const { beds, admitPatient } = useHospitalStore();

  const [name, setName] = useState('');
  const [age, setAge] = useState(55);
  const [gender, setGender] = useState<'M' | 'F' | 'Other'>('M');
  const [ward, setWard] = useState<WardType>('MedSurg');
  const [bedId, setBedId] = useState('');
  const [diagnosis, setDiagnosis] = useState('Acute Exacerbation of Heart Failure');
  const [acuity, setAcuity] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [hr, setHr] = useState(88);
  const [bpSys, setBpSys] = useState(128);
  const [bpDia, setBpDia] = useState(82);
  const [spo2, setSpo2] = useState(96);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  // Filter available beds for the chosen ward
  const availableBeds = beds.filter(b => b.ward === ward && (b.status === 'available' || b.status === 'cleaning'));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const selectedBed = bedId || (availableBeds.length > 0 ? availableBeds[0].id : beds[0].id);

    admitPatient({
      name,
      age: Number(age),
      gender,
      ward,
      bedId: selectedBed,
      diagnosis,
      acuity,
      vitals: {
        heartRate: Number(hr),
        bpSystolic: Number(bpSys),
        bpDiastolic: Number(bpDia),
        spO2: Number(spo2),
        respRate: 18,
        temperature: 37.0
      },
      news2Score: acuity >= 4 ? 6 : 2,
      deteriorationRisk: acuity >= 4 ? 65 : 15,
      admissionTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      estDischargeTime: 'In 3 days',
      clinicalNotesSnippet: notes || 'New emergency admission. Initial stabilization complete.'
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#0b1326] border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-slate-100">Manual Patient Admission</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 block mb-1">Patient Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g., Jonathan Mercer"
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-400 block mb-1">Age</label>
                <input
                  type="number"
                  value={age}
                  onChange={e => setAge(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Gender</label>
                <select
                  value={gender}
                  onChange={e => setGender(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 block mb-1">Target Ward</label>
              <select
                value={ward}
                onChange={e => {
                  setWard(e.target.value as WardType);
                  setBedId('');
                }}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                <option value="ED">Emergency Dept (ED)</option>
                <option value="ICU">Intensive Care Unit (ICU)</option>
                <option value="MedSurg">Med-Surg Ward</option>
                <option value="StepDown">Step-Down Unit</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Bed Selection</label>
              <select
                value={bedId}
                onChange={e => setBedId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
              >
                {availableBeds.length === 0 ? (
                  <option value="">No clean beds in ward (Will force)</option>
                ) : (
                  availableBeds.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.number} ({b.status})
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Primary Diagnosis</label>
            <input
              type="text"
              required
              value={diagnosis}
              onChange={e => setDiagnosis(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Acuity & Vitals */}
          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-cyan-400" /> Clinical Acuity & Vitals
              </span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(lvl => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setAcuity(lvl as any)}
                    className={`px-2 py-0.5 rounded font-mono font-bold transition-colors ${
                      acuity === lvl
                        ? lvl >= 4
                          ? 'bg-rose-500 text-white'
                          : 'bg-cyan-500 text-slate-950'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 text-[11px] font-mono">
              <div>
                <span className="text-slate-500 block text-[10px]">Heart Rate</span>
                <input
                  type="number"
                  value={hr}
                  onChange={e => setHr(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-1 text-slate-200"
                />
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Sys BP</span>
                <input
                  type="number"
                  value={bpSys}
                  onChange={e => setBpSys(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-1 text-slate-200"
                />
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Dia BP</span>
                <input
                  type="number"
                  value={bpDia}
                  onChange={e => setBpDia(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-1 text-slate-200"
                />
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">SpO2 %</span>
                <input
                  type="number"
                  value={spo2}
                  onChange={e => setSpo2(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-1 text-slate-200"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Clinical Handoff Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Clinical status, known barriers, or special isolation precautions..."
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-lg transition-all shadow-md shadow-cyan-600/20"
            >
              Admit Patient to Bed
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

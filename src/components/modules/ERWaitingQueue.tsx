import React from 'react';
import { Users, GripVertical, AlertCircle, User, Activity } from 'lucide-react';
import { useHospitalStore } from '../../store/hospitalStore';
import { sound } from '../../utils/audioEngine';

export const ERWaitingQueue: React.FC = () => {
  const { waitingRoomPatients } = useHospitalStore();

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, patientId: string) => {
    e.dataTransfer.setData('application/x-patient-id', patientId);
    e.dataTransfer.effectAllowed = 'move';
    sound.playTactileClick();
  };

  if (waitingRoomPatients.length === 0) return null;

  return (
    <div className="flex flex-col h-full bg-[#0a0f1c] rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
      <div className="flex items-center gap-3 p-4 border-b border-slate-800 bg-slate-900/50">
        <div className="p-2 bg-emerald-950/50 rounded-lg">
          <Users size={18} className="text-emerald-400" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-100">ER Triage Queue</h2>
          <p className="text-[10px] text-slate-400">Drag to assign to empty bed</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {waitingRoomPatients.map(patient => (
          <div
            key={patient.id}
            draggable
            onDragStart={(e) => handleDragStart(e, patient.id)}
            className="flex items-start gap-3 p-3 bg-slate-800/40 rounded-xl border border-slate-700/50 cursor-grab active:cursor-grabbing hover:bg-slate-800/80 transition-colors"
          >
            <div className="mt-1 opacity-50"><GripVertical size={16} /></div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <span className="font-semibold text-slate-200 text-sm">{patient.name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                  patient.acuity >= 4 ? 'bg-rose-950/50 text-rose-400' : 'bg-amber-950/50 text-amber-400'
                }`}>
                  Lvl {patient.acuity}
                </span>
              </div>
              <div className="text-xs text-slate-400 mt-1 line-clamp-1">{patient.diagnosis}</div>
              <div className="flex items-center gap-3 mt-2">
                <span className="flex items-center gap-1 text-[10px] text-slate-500">
                  <User size={10} /> {patient.age}{patient.gender}
                </span>
                <span className="flex items-center gap-1 text-[10px] text-slate-500">
                  <Activity size={10} /> HR: {patient.vitals.heartRate}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

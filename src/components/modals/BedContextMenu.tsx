import React from 'react';
import { Power, Stethoscope, Droplet, UserMinus, Wind, X, CheckCircle2 } from 'lucide-react';
import { useHospitalStore } from '../../store/hospitalStore';
import { sound } from '../../utils/audioEngine';

export interface BedContextMenuProps {
  x: number;
  y: number;
  bedId: string;
  onClose: () => void;
}

export const BedContextMenu: React.FC<BedContextMenuProps> = ({ x, y, bedId, onClose }) => {
  const { beds, updateBedStatus, dischargePatient, preEmptIcuBed } = useHospitalStore();
  const bed = beds.find(b => b.id === bedId);

  if (!bed) return null;

  // Ensure menu doesn't flow off screen
  const safeX = Math.min(x, window.innerWidth - 220);
  const safeY = Math.min(y, window.innerHeight - 300);

  const handleAction = (action: () => void) => {
    sound.playTurnoverSuccess();
    action();
    onClose();
  };

  return (
    <>
      {/* Invisible backdrop to catch outside clicks */}
      <div className="fixed inset-0 z-[100]" onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose(); }} />
      
      <div 
        className="fixed z-[101] w-52 bg-[#060913]/95 backdrop-blur-xl border border-cyan-900/50 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        style={{ left: safeX, top: safeY }}
      >
        <div className="flex items-center justify-between px-3 py-2 bg-slate-900/80 border-b border-slate-800">
          <span className="text-xs font-bold text-slate-300">Bed {bed.id}</span>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <X size={14} />
          </button>
        </div>

        <div className="p-1">
          {bed.status === 'occupied' && (
            <>
              <button onClick={() => handleAction(() => dischargePatient(bed.patientId || ''))} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-cyan-400 rounded-md transition-colors text-left cursor-pointer">
                <UserMinus size={14} /> Discharge Patient
              </button>
              <button onClick={() => handleAction(() => preEmptIcuBed(bed.patientId || ''))} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-purple-400 rounded-md transition-colors text-left cursor-pointer">
                <Stethoscope size={14} /> Request ICU Transfer
              </button>
              <div className="h-px bg-slate-800 my-1 mx-2" />
            </>
          )}

          {(bed.status === 'available' || bed.status === 'ghost') && (
            <button onClick={() => handleAction(() => updateBedStatus(bed.id, 'cleaning', 'Manual UV Disinfection requested'))} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-cyan-400 rounded-md transition-colors text-left cursor-pointer">
              <Power size={14} /> Dispatch UV-C Robot
            </button>
          )}

          {bed.status === 'cleaning' && (
            <button onClick={() => handleAction(() => updateBedStatus(bed.id, 'available'))} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-emerald-400 rounded-md transition-colors text-left cursor-pointer">
              <CheckCircle2 size={14} /> Mark as Ready
            </button>
          )}

          <button onClick={() => handleAction(() => console.log('Ping device'))} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-slate-100 rounded-md transition-colors text-left cursor-pointer">
            <Wind size={14} /> Ping Telemetry Device
          </button>
        </div>
      </div>
    </>
  );
};

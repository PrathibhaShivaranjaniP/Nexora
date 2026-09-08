import React from 'react';
import { useHospitalStore } from '../../store/hospitalStore';
import { AlertOctagon, X } from 'lucide-react';
import { DistrictDisasterSimulator } from '../modules/DistrictDisasterSimulator';
import { sound } from '../../utils/audioEngine';

interface DisasterSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DisasterSimulatorModal: React.FC<DisasterSimulatorModalProps> = ({ isOpen, onClose }) => {
  const { currentDistrict } = useHospitalStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-[#090f1d] border border-slate-700/80 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <AlertOctagon className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">District Mass Casualty & Disaster Simulator (MCI)</h3>
              <p className="text-[11px] text-slate-400">
                Simulate trauma surge, industrial hazard, and natural disasters across {currentDistrict.name}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playTactileClick();
              onClose();
            }}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          <DistrictDisasterSimulator />
        </div>
      </div>
    </div>
  );
};

import { useHospitalStore } from '../../store/hospitalStore';
import { sound } from '../../utils/audioEngine';

const SIM_SPEEDS = [0.5, 1, 2, 5];

export default function LiveKPIStrip() {
  const {
    actualHospitalOccupancyPercent,
    actualHospitalAvailableBeds,
    actualHospitalIcuBeds,
    actualHospitalIcuOccupied,
    ghostBeds,
    simSpeed,
    setSimSpeed,
  } = useHospitalStore();

  const occupancyColor =
    actualHospitalOccupancyPercent >= 95
      ? 'text-rose-400'
      : actualHospitalOccupancyPercent >= 85
      ? 'text-amber-400'
      : 'text-cyan-400';

  const handleGhostClick = () => {
    sound.playTactileClick();
  };

  const handleSimSpeedClick = () => {
    sound.playTactileClick();
    const currentIndex = SIM_SPEEDS.indexOf(simSpeed);
    const nextIndex = (currentIndex + 1) % SIM_SPEEDS.length;
    setSimSpeed(SIM_SPEEDS[nextIndex]);
  };

  return (
    <div className="w-full bg-[#040c1a]/80 border border-slate-800/60 rounded-xl px-2 py-2 grid grid-cols-5 gap-0 divide-x divide-slate-800/60">
      {/* 1 — Occupancy */}
      <div className="px-3 py-1 text-center flex flex-col items-center justify-center gap-0.5">
        <span className={'text-xl font-black font-mono ' + occupancyColor}>
          {actualHospitalOccupancyPercent}%
        </span>
        <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest">Occupancy</span>
      </div>

      {/* 2 — Available Beds */}
      <div className="px-3 py-1 text-center flex flex-col items-center justify-center gap-0.5">
        <span className="text-xl font-black font-mono text-emerald-400">
          {actualHospitalAvailableBeds}
        </span>
        <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest">Available</span>
        <span className="text-[8px] font-mono text-slate-500">Ready to admit</span>
      </div>

      {/* 3 — ICU */}
      <div className="px-3 py-1 text-center flex flex-col items-center justify-center gap-0.5">
        <span className="text-xl font-black font-mono text-purple-400">
          {actualHospitalIcuOccupied}
          <span className="text-sm font-medium text-purple-600">/{actualHospitalIcuBeds}</span>
        </span>
        <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest">ICU</span>
      </div>

      {/* 4 — Ghost Beds */}
      <button
        onClick={handleGhostClick}
        className="px-3 py-1 text-center flex flex-col items-center justify-center gap-0.5 hover:bg-amber-950/20 transition-colors rounded-lg"
      >
        <span className="text-xl font-black font-mono text-amber-400">{ghostBeds}</span>
        <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest">Ghosts</span>
      </button>

      {/* 5 — Sim Speed */}
      <button
        onClick={handleSimSpeedClick}
        className="px-3 py-1 text-center flex flex-col items-center justify-center gap-0.5 hover:bg-cyan-950/20 transition-colors rounded-lg"
        title="Click to cycle sim speed"
      >
        <span className="text-xl font-black font-mono text-cyan-400">{simSpeed}\u00D7</span>
        <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest">Sim Speed</span>
      </button>
    </div>
  );
}

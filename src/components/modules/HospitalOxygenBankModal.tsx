import React, { useState } from 'react';
import { useHospitalStore } from '../../store/hospitalStore';
import {
  Wind,
  ShieldCheck,
  AlertTriangle,
  Truck,
  PhoneCall,
  Clock,
  Gauge,
  Activity,
  CheckCircle2,
  X,
  Radio
} from 'lucide-react';
import { sound } from '../../utils/audioEngine';

interface HospitalOxygenBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenComms?: (targetId?: string) => void;
}

export const HospitalOxygenBankModal: React.FC<HospitalOxygenBankModalProps> = ({
  isOpen,
  onClose,
  onOpenComms
}) => {
  const {
    currentHospital,
    oxygenData,
    requestOxygenRefill,
    language
  } = useHospitalStore();

  const [selectedSupplier, setSelectedSupplier] = useState('Inox Air Products (Sriperumbudur Cryo Hub)');
  const [selectedVolume, setSelectedVolume] = useState(10000);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const suppliers = [
    {
      id: 'inox-sriperumbudur',
      name: 'Inox Air Products (Sriperumbudur Cryo Hub)',
      eta: '24 mins',
      distance: '28 km',
      tankerCapacity: '10,000 Liters LMO',
      channel: 'LMO-LOGISTICS-1',
      status: 'Ready for Immediate Dispatch'
    },
    {
      id: 'praxair-manali',
      name: 'Praxair / Linde Cryogenic Depot (Manali)',
      eta: '36 mins',
      distance: '34 km',
      tankerCapacity: '15,000 Liters LMO',
      channel: 'LMO-LOGISTICS-2',
      status: 'High Stock Available'
    },
    {
      id: 'apollo-mutual-hub',
      name: 'Apollo Greams Emergency Cryo-Reserve',
      eta: '16 mins',
      distance: '6.5 km',
      tankerCapacity: '6,000 Liters LMO',
      channel: 'MUTUAL-AID-CH3',
      status: 'Direct Inter-Hospital Transfer'
    }
  ];

  const handleDispatchRefill = () => {
    sound.playRadarPing();
    setIsSubmitting(true);
    setTimeout(() => {
      requestOxygenRefill(selectedSupplier, selectedVolume);
      setIsSubmitting(false);
      sound.playCallConnected();
    }, 600);
  };

  const isLowStock = oxygenData.percentage <= oxygenData.criticalThresholdPercent;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-3xl bg-[#071326] border border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100 ring-1 ring-cyan-500/20 max-h-[92vh]">
        {/* Header Ribbon */}
        <div className="bg-slate-900/90 border-b border-slate-800 px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/20">
              <Wind className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-slate-100 uppercase tracking-wide">
                  {language === 'ta' ? 'திரவ மருத்துவ ஆக்ஸிஜன் இருப்பு மையம்' : 'Liquid Medical Oxygen (LMO) Storage & Bank'}
                </h3>
                <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[9.5px] px-1.5 py-0.2 rounded font-mono font-bold">
                  CRYOGENIC -183°C
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                {currentHospital.name} • Vacuum Insulated Cryogenic Tank Telemetry
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {/* Active Refill Banner */}
          {oxygenData.refillRequestActive && (
            <div className="bg-emerald-500/10 border border-emerald-500/40 rounded-xl p-3 flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Truck className="w-4 h-4 animate-bounce" />
                </div>
                <div>
                  <div className="text-xs font-bold text-emerald-200 flex items-center gap-2">
                    <span>INBOUND CRYOGENIC TANKER DISPATCHED</span>
                    <span className="bg-emerald-500/20 text-emerald-300 text-[9px] px-1.5 py-0.2 rounded font-mono">
                      GREEN WAVE PRIORITY
                    </span>
                  </div>
                  <div className="text-[10.5px] text-slate-300 font-mono">
                    Source: {oxygenData.refillSource} • Volume: {oxygenData.refillVolumeLiters?.toLocaleString()} Liters
                  </div>
                </div>
              </div>
              <div className="text-right font-mono">
                <span className="text-xs text-emerald-400 font-bold">{oxygenData.refillEtaMinutes}m ETA</span>
                <span className="block text-[9.5px] text-slate-400">Police Escort Active</span>
              </div>
            </div>
          )}

          {/* Section 1: Main LMO Cryogenic Level & Pressure Gauge */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Main Level Card */}
            <div className="md:col-span-2 bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-cyan-400 font-bold uppercase flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5" /> Primary LMO Storage Tank
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded font-mono font-bold ${
                    isLowStock
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}
                >
                  {oxygenData.percentage}% Capacity
                </span>
              </div>

              {/* Liquid Visual Fill Bar */}
              <div className="space-y-1.5">
                <div className="w-full h-4 bg-slate-950 rounded-full border border-slate-700/60 p-0.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      isLowStock
                        ? 'bg-gradient-to-r from-rose-600 to-amber-500'
                        : 'bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400'
                    }`}
                    style={{ width: `${oxygenData.percentage}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>
                    Current: <strong className="text-slate-100">{oxygenData.currentLiters.toLocaleString()} L</strong>
                  </span>
                  <span>
                    Certified Max: <strong className="text-slate-100">{oxygenData.tankCapacityLiters.toLocaleString()} L</strong>
                  </span>
                </div>
              </div>

              {/* Secondary Stats Grid */}
              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-800/80 text-center text-xs font-mono">
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                  <div className="text-[9.5px] text-slate-400">PIPELINE PRESSURE</div>
                  <div className="text-sm font-bold text-emerald-400 mt-0.5">{oxygenData.manifoldPressureBar} Bar</div>
                  <div className="text-[9px] text-slate-500">Normal: 4.0 - 4.5</div>
                </div>
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                  <div className="text-[9.5px] text-slate-400">CONSUMPTION</div>
                  <div className="text-sm font-bold text-cyan-300 mt-0.5">{oxygenData.consumptionRateLpm} L/min</div>
                  <div className="text-[9px] text-slate-500">Live Hospital Draw</div>
                </div>
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                  <div className="text-[9.5px] text-slate-400">AUTONOMY BUFFER</div>
                  <div className="text-sm font-bold text-amber-300 mt-0.5">{oxygenData.hoursAutonomyRemaining} Hours</div>
                  <div className="text-[9px] text-slate-500">Depletion Buffer</div>
                </div>
              </div>
            </div>

            {/* Cylinder Yard Backup Card */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-2">
              <div>
                <span className="text-xs font-mono text-amber-400 font-bold uppercase flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> Type-D Backup Yard
                </span>
                <p className="text-[11px] text-slate-400 mt-1">
                  Automatic manifold changeover manifold in case of cryogenic line failure.
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
                <div className="text-2xl font-black text-amber-300 font-mono">
                  {oxygenData.backupCylindersCount}
                </div>
                <div className="text-[10px] text-slate-400 uppercase font-mono mt-0.5">
                  Jumbo Cylinders (150 Bar)
                </div>
                <div className="text-[9.5px] text-emerald-400 font-mono mt-1">
                  100% Ready • 8.2h Standalone Run
                </div>
              </div>

              <button
                onClick={() => {
                  sound.playRadioChirp();
                  if (onOpenComms) onOpenComms('icu-charge-nurse');
                }}
                className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Radio Manifold Engineer</span>
              </button>
            </div>
          </div>

          {/* Section 2: Hospital Department Draw Breakdown */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <span className="text-xs font-mono text-slate-300 font-bold flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              Live Departmental Oxygen Distribution
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Critical ICUs</span>
                <span className="text-sm font-bold text-cyan-300">18.2 L/min</span>
                <span className="text-[9px] text-slate-500 block">14 Invasive Ventilators</span>
              </div>
              <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Apex Trauma Bays</span>
                <span className="text-sm font-bold text-rose-400">8.5 L/min</span>
                <span className="text-[9px] text-slate-500 block">High-Flow Canulas</span>
              </div>
              <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Operating Theatres</span>
                <span className="text-sm font-bold text-amber-300">7.4 L/min</span>
                <span className="text-[9px] text-slate-500 block">6 Active OTs</span>
              </div>
              <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Med-Surg Wards</span>
                <span className="text-sm font-bold text-emerald-400">4.4 L/min</span>
                <span className="text-[9px] text-slate-500 block">Wall Suction & O2</span>
              </div>
            </div>
          </div>

          {/* Section 3: Inter-Facility Mutual Aid & Cryogenic Tanker Requisition */}
          <div className="bg-slate-900/90 border border-cyan-500/30 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-extrabold text-slate-100 uppercase tracking-wide flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-cyan-400" />
                  Request Emergency Cryogenic Tanker Refill (Mutual Aid)
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Direct dispatch connection to regional cryogenic air separation facilities.
                </p>
              </div>
              <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[9.5px] px-2 py-0.5 rounded font-mono font-bold">
                DISTRICT PREEMPTION
              </span>
            </div>

            {/* Supplier Radio Options */}
            <div className="space-y-2">
              {suppliers.map(sup => (
                <label
                  key={sup.id}
                  onClick={() => setSelectedSupplier(sup.name)}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedSupplier === sup.name
                      ? 'bg-cyan-950/40 border-cyan-400 shadow-md'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="supplier"
                      checked={selectedSupplier === sup.name}
                      onChange={() => setSelectedSupplier(sup.name)}
                      className="accent-cyan-400"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-200">{sup.name}</div>
                      <div className="text-[10.5px] text-slate-400 font-mono">
                        {sup.distance} away • Capacity: {sup.tankerCapacity}
                      </div>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-xs text-emerald-400 font-bold">{sup.eta} ETA</span>
                    <span className="block text-[9.5px] text-cyan-400">{sup.channel}</span>
                  </div>
                </label>
              ))}
            </div>

            {/* Volume Selection & Dispatch Button */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-slate-400">Quantity:</span>
                {[5000, 10000, 15000].map(vol => (
                  <button
                    key={vol}
                    type="button"
                    onClick={() => setSelectedVolume(vol)}
                    className={`px-2.5 py-1 rounded-lg border transition-all ${
                      selectedVolume === vol
                        ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    {vol.toLocaleString()} L
                  </button>
                ))}
              </div>

              <button
                onClick={handleDispatchRefill}
                disabled={isSubmitting}
                className="px-4 py-2 bg-gradient-to-r from-cyan-600 via-teal-500 to-emerald-500 hover:from-cyan-500 hover:to-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-cyan-900/40 transition-all cursor-pointer disabled:opacity-50"
              >
                <Truck className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? 'Dispatched...'
                    : `Dispatch ${selectedVolume.toLocaleString()}L Tanker ➔`}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

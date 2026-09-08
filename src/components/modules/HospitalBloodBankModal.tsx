import React, { useState } from 'react';
import { useHospitalStore } from '../../store/hospitalStore';
import {
  Droplet,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Activity,
  Send,
  X,
  Radio,
  Hospital,
  Sparkles
} from 'lucide-react';
import { sound } from '../../utils/audioEngine';

interface HospitalBloodBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenComms?: (targetId?: string) => void;
}

export const HospitalBloodBankModal: React.FC<HospitalBloodBankModalProps> = ({
  isOpen,
  onClose,
  onOpenComms
}) => {
  const {
    currentHospital,
    bloodData,
    requestBloodTransfer,
    language
  } = useHospitalStore();

  const [selectedSourceHosp, setSelectedSourceHosp] = useState('RGGGH Apex Central Blood Bank');
  const [selectedUnitsType, setSelectedUnitsType] = useState('6 Units O-Negative (PRBC) + 4 Bags Platelets');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const sisterBloodBanks = [
    {
      id: 'rgggh-blood-hub',
      name: 'RGGGH Apex Central Blood Bank (Park Town)',
      distance: '3.8 km',
      eta: '14 mins',
      stockOminus: 64,
      stockOplus: 182,
      platelets: 52,
      courierType: 'EMS Police Green Wave Motorcycle Unit'
    },
    {
      id: 'apollo-blood-center',
      name: 'Apollo Greams Transfusion Medicine Hub',
      distance: '5.2 km',
      eta: '18 mins',
      stockOminus: 42,
      stockOplus: 110,
      platelets: 38,
      courierType: 'Cold-Chain Mobile Blood Transport'
    },
    {
      id: 'stanley-blood-bank',
      name: 'Stanley Medical College Regional Blood Center',
      distance: '6.5 km',
      eta: '22 mins',
      stockOminus: 36,
      stockOplus: 95,
      platelets: 28,
      courierType: 'Hospital Rapid Courier'
    }
  ];

  const handleRequestTransfer = () => {
    sound.playRadarPing();
    setIsSubmitting(true);
    setTimeout(() => {
      requestBloodTransfer(selectedSourceHosp, selectedUnitsType);
      setIsSubmitting(false);
      sound.playCallConnected();
    }, 600);
  };

  const groupKeys = ['O-', 'O+', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-3xl bg-[#0b1022] border border-rose-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100 ring-1 ring-rose-500/20 max-h-[92vh]">
        {/* Header Ribbon */}
        <div className="bg-slate-900/90 border-b border-slate-800 px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/50 flex items-center justify-center text-rose-400 shadow-lg shadow-rose-500/20">
              <Droplet className="w-5 h-5 animate-pulse text-rose-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-slate-100 uppercase tracking-wide">
                  {language === 'ta' ? 'இரத்த வங்கி & உறைநிலை சேமிப்பு தளம்' : 'Central Blood Bank & Transfusion Cryo-Storage'}
                </h3>
                <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[9.5px] px-1.5 py-0.2 rounded font-mono font-bold">
                  TEMP 2°C - 6°C
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                {currentHospital.name} • Certified Packed Red Blood Cells (PRBC), FFP & Platelets
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
          {/* Active Blood Transfer Courier Banner */}
          {bloodData.transferActive && bloodData.transferDetails && (
            <div className="bg-rose-500/10 border border-rose-500/40 rounded-xl p-3 flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-400">
                  <Droplet className="w-4 h-4 animate-bounce" />
                </div>
                <div>
                  <div className="text-xs font-bold text-rose-200 flex items-center gap-2">
                    <span>EMERGENCY BLOOD COURIER IN-TRANSIT</span>
                    <span className="bg-rose-500/20 text-rose-300 text-[9px] px-1.5 py-0.2 rounded font-mono">
                      {bloodData.transferDetails.trackingId}
                    </span>
                  </div>
                  <div className="text-[10.5px] text-slate-300 font-mono">
                    From: {bloodData.transferDetails.sourceHospitalName} • Cargo: {bloodData.transferDetails.requestedUnits}
                  </div>
                </div>
              </div>
              <div className="text-right font-mono">
                <span className="text-xs text-rose-400 font-bold">{bloodData.transferDetails.courierEtaMinutes}m ETA</span>
                <span className="block text-[9.5px] text-slate-400">Cold Box 4°C Monitored</span>
              </div>
            </div>
          )}

          {/* Section 1: Live Blood Group Inventory Matrix */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-slate-300 font-bold flex items-center gap-1.5">
                <Droplet className="w-3.5 h-3.5 text-rose-400" />
                Real-Time Packed Red Blood Cells (PRBC) Units
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Total Blood Units: <strong className="text-slate-100">{Object.values(bloodData.groups).reduce((acc, g) => acc + g.unitsAvailable, 0)} Units</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {groupKeys.map(key => {
                const stock = bloodData.groups[key] || { group: key, unitsAvailable: 10, reservedUnits: 2, criticalThreshold: 8 };
                const isCritical = stock.unitsAvailable <= stock.criticalThreshold;
                const isUniversalDonor = key === 'O-';

                return (
                  <div
                    key={key}
                    className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
                      isUniversalDonor
                        ? 'bg-rose-950/40 border-rose-500/60 ring-1 ring-rose-500/30'
                        : isCritical
                        ? 'bg-amber-950/20 border-amber-500/50'
                        : 'bg-slate-900/80 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-base font-black font-mono text-slate-100 flex items-center gap-1">
                        <span className={isUniversalDonor ? 'text-rose-400' : 'text-slate-200'}>{key}</span>
                        {isUniversalDonor && (
                          <span className="text-[8.5px] bg-rose-500/20 text-rose-300 border border-rose-500/40 px-1 py-0.2 rounded font-sans font-bold">
                            UNIVERSAL
                          </span>
                        )}
                      </span>
                      <span
                        className={`text-[9.5px] font-mono px-1.5 py-0.2 rounded font-bold ${
                          isCritical
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        }`}
                      >
                        {isCritical ? 'LOW' : 'OK'}
                      </span>
                    </div>

                    <div className="mt-2 flex items-baseline justify-between font-mono">
                      <div>
                        <span className="text-xl font-bold text-slate-100">{stock.unitsAvailable}</span>
                        <span className="text-[10px] text-slate-400 ml-1">Units</span>
                      </div>
                      <span className="text-[9.5px] text-slate-400">
                        {stock.reservedUnits} Held
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Blood Components & Cryo Storage */}
          <div className="grid grid-cols-3 gap-2.5 text-xs font-mono">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-center">
              <span className="text-[10px] text-slate-400 block uppercase">Fresh Frozen Plasma</span>
              <span className="text-lg font-bold text-cyan-300 mt-1 block">{bloodData.ffpUnits} Bags</span>
              <span className="text-[9px] text-slate-500 block">-30°C Cryo-Freezer</span>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-center">
              <span className="text-[10px] text-slate-400 block uppercase">Platelet Concentrates</span>
              <span className="text-lg font-bold text-amber-300 mt-1 block">{bloodData.plateletUnits} Bags</span>
              <span className="text-[9px] text-slate-500 block">22°C Agitator (5d Shelf)</span>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-center">
              <span className="text-[10px] text-slate-400 block uppercase">Cryoprecipitate</span>
              <span className="text-lg font-bold text-emerald-300 mt-1 block">{bloodData.cryoUnits} Bags</span>
              <span className="text-[9px] text-slate-500 block">Factor VIII / Fibrinogen</span>
            </div>
          </div>

          {/* Section 3: Inter-Hospital Mutual Aid Blood Transfer */}
          <div className="bg-slate-900/90 border border-rose-500/30 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-extrabold text-slate-100 uppercase tracking-wide flex items-center gap-1.5">
                  <Hospital className="w-4 h-4 text-rose-400" />
                  Request Mutual-Aid Emergency Blood Transfer
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  If local emergency trauma demands exceed reserve, dispatch an inter-hospital blood courier.
                </p>
              </div>
              <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[9.5px] px-2 py-0.5 rounded font-mono font-bold">
                TRANSFUSION PROTOCOL
              </span>
            </div>

            {/* Sister Blood Banks Selection */}
            <div className="space-y-2">
              {sisterBloodBanks.map(hosp => (
                <label
                  key={hosp.id}
                  onClick={() => setSelectedSourceHosp(hosp.name)}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedSourceHosp === hosp.name
                      ? 'bg-rose-950/30 border-rose-400 shadow-md'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="bloodBank"
                      checked={selectedSourceHosp === hosp.name}
                      onChange={() => setSelectedSourceHosp(hosp.name)}
                      className="accent-rose-500"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-200">{hosp.name}</div>
                      <div className="text-[10.5px] text-slate-400 font-mono">
                        {hosp.distance} away • Available: <strong className="text-rose-400">{hosp.stockOminus} O-</strong>, {hosp.stockOplus} O+, {hosp.platelets} Platelets
                      </div>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-xs text-emerald-400 font-bold">{hosp.eta} ETA</span>
                    <span className="block text-[9.5px] text-slate-400">Motorcycle Courier</span>
                  </div>
                </label>
              ))}
            </div>

            {/* Cargo Units Selection & Dispatch Button */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-slate-400">Requisition:</span>
                <select
                  value={selectedUnitsType}
                  onChange={e => setSelectedUnitsType(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 text-xs font-mono focus:outline-none focus:border-rose-400"
                >
                  <option value="6 Units O-Negative (PRBC) + 4 Bags Platelets">
                    6 Units O-Negative (PRBC) + 4 Bags Platelets
                  </option>
                  <option value="10 Units O-Negative (Mass Casualty Resuscitation)">
                    10 Units O-Negative (Mass Casualty Resuscitation)
                  </option>
                  <option value="8 Units O-Positive + 6 Bags FFP">
                    8 Units O-Positive + 6 Bags FFP
                  </option>
                  <option value="4 Units AB-Negative Rare Crossmatch">
                    4 Units AB-Negative Rare Crossmatch
                  </option>
                </select>
              </div>

              <button
                onClick={handleRequestTransfer}
                disabled={isSubmitting}
                className="px-4 py-2 bg-gradient-to-r from-rose-600 via-red-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-rose-900/40 transition-all cursor-pointer disabled:opacity-50"
              >
                <Droplet className="w-4 h-4" />
                <span>
                  {isSubmitting ? 'Dispatching Courier...' : 'Dispatch Mutual-Aid Blood Courier ➔'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

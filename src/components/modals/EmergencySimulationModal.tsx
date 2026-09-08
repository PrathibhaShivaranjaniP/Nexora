import React, { useState, useEffect } from 'react';
import { useHospitalStore } from '../../store/hospitalStore';
import {
  AlertOctagon,
  CheckCircle2,
  Clock,
  Navigation,
  Route,
  Bed,
  Building,
  ArrowRight,
  Sparkles,
  Play,
  RotateCcw,
  X
} from 'lucide-react';
import { sound } from '../../utils/audioEngine';

interface EmergencySimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmergencySimulationModal: React.FC<EmergencySimulationModalProps> = ({
  isOpen,
  onClose
}) => {
  const {
    currentDistrict,
    setSelectedHospitalId,
    setDedicatedRouteActive,
    setSpatialTier,
    createBedReservation,
    confirmBedIntake,
    activeReservation,
    language
  } = useHospitalStore();

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  const targetHosp = currentDistrict.hospitals[0]; // Primary Apex Trauma Hub (e.g. RGGGH)

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setIsAutoPlaying(false);
      sound.playAlertTone();
    }
  }, [isOpen]);

  // Auto-play timer
  useEffect(() => {
    if (!isAutoPlaying || !isOpen) return;

    const timer = setTimeout(() => {
      if (step < 5) {
        handleNextStep();
      } else {
        setIsAutoPlaying(false);
      }
    }, 4500);

    return () => clearTimeout(timer);
  }, [isAutoPlaying, step, isOpen]);

  const handleNextStep = () => {
    if (step === 1) {
      sound.playRadarPing();
      setStep(2);
    } else if (step === 2) {
      sound.playRadarPing();
      setStep(3);
      // Auto-trigger bed reservation in store
      createBedReservation({
        hospitalId: targetHosp.id,
        hospitalName: targetHosp.name,
        department: 'ICU',
        patientName: 'S. Murugan (108 ALS)',
        incidentPriority: 'Level 1 Apex Polytrauma + Craniocerebral Injury (Priority Green Wave)',
        waitTimeMinutes: 6,
        queuePosition: 1
      });
    } else if (step === 3) {
      sound.playRadarPing();
      setStep(4);
    } else if (step === 4) {
      sound.playTurnoverSuccess();
      confirmBedIntake();
      setStep(5);
    }
  };

  const handleFinishAndFlyToWard = () => {
    sound.playTactileClick();
    setSelectedHospitalId(targetHosp.id);
    setDedicatedRouteActive(false);
    setSpatialTier(3);
    onClose();
  };

  const handleFinishAndFlyToRoute = () => {
    sound.playRadarPing();
    setSelectedHospitalId(targetHosp.id);
    setDedicatedRouteActive(true);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-[#080e1e] border border-cyan-500/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100 ring-1 ring-cyan-400/30">
        {/* Header Bar */}
        <div className="bg-slate-900/90 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/50 flex items-center justify-center text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.4)]">
              <AlertOctagon className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-100 uppercase tracking-wide">
                  108 Live Emergency Incident Simulation
                </h3>
                <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] px-2 py-0.5 rounded font-mono font-bold animate-pulse">
                  PRIORITY 1 TRAUMA
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                End-to-end autonomous triage, reservation, navigation & intake
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAutoPlaying(prev => !prev)}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 border transition-all ${
                isAutoPlaying
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              <Play className="w-3 h-3" />
              <span>{isAutoPlaying ? 'Auto-Advancing...' : 'Auto-Play'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 5-Step Progress Stepper Indicator */}
        <div className="bg-[#050a16] px-6 py-3 border-b border-slate-800/80 flex items-center justify-between">
          {[
            { num: 1, label: '1. 108 Call' },
            { num: 2, label: '2. AI Match' },
            { num: 3, label: '3. Bed Hold' },
            { num: 4, label: '4. Green Wave' },
            { num: 5, label: '5. Ward Intake' }
          ].map(s => {
            const isCompleted = step > s.num;
            const isCurrent = step === s.num;
            return (
              <div key={s.num} className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all ${
                    isCurrent
                      ? 'bg-cyan-500 text-slate-950 ring-4 ring-cyan-500/30'
                      : isCompleted
                      ? 'bg-emerald-500 text-slate-950 font-black'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {isCompleted ? '✓' : s.num}
                </div>
                <span
                  className={`text-xs font-mono font-semibold hidden md:inline ${
                    isCurrent ? 'text-cyan-300' : isCompleted ? 'text-emerald-400' : 'text-slate-500'
                  }`}
                >
                  {s.label}
                </span>
                {s.num < 5 && <div className="w-6 lg:w-12 h-0.5 bg-slate-800 mx-1 hidden sm:block" />}
              </div>
            );
          })}
        </div>

        {/* Dynamic Scenario Body */}
        <div className="p-6 space-y-4 min-h-[290px] flex flex-col justify-center">
          {/* STEP 1: Incident Trigger */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-cyan-400 uppercase font-bold">
                    🚨 Inbound Call Telemetry
                  </span>
                  <span className="text-xs font-mono text-slate-400">Caller ID: 108-DISPATCH-CHN</span>
                </div>
                <div className="text-base font-bold text-slate-100">
                  Multiple vehicle collision at Guindy Kathipara Junction
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Patient: Male, ~38 years old. Severe bilateral flail chest, closed head trauma, GCS score 8. Requires immediate Advanced Trauma Life Support (ATLS), emergency endotracheal intubation, and ventilator-equipped Level 1 trauma resuscitation.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center text-xs font-mono">
                <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
                  <div className="text-slate-500 text-[10px]">INCIDENT GPS</div>
                  <div className="font-bold text-cyan-300 mt-1">13.0067° N, 80.2023° E</div>
                </div>
                <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
                  <div className="text-slate-500 text-[10px]">UNIT DISPATCHED</div>
                  <div className="font-bold text-amber-300 mt-1">108 ALS UNIT #49</div>
                </div>
                <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
                  <div className="text-slate-500 text-[10px]">INITIAL VITALS</div>
                  <div className="font-bold text-rose-400 mt-1">BP 80/50 • SpO2 84%</div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: AI Hospital & Capacity Matching */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4 bg-slate-900/80 border border-cyan-500/30 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-cyan-400 uppercase font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" /> Autonomous Matching Engine
                  </span>
                  <span className="text-xs font-mono text-emerald-400 font-bold">Optimization Complete</span>
                </div>
                <div className="text-base font-bold text-slate-100">
                  Target Match: {targetHosp.name} (Apex Level 1)
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Compared 5 district facilities. RGGGH verified with 1 open surgical ICU ventilator bay and immediate neurotrauma surgical staff available on standby.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/40 rounded-xl text-xs space-y-1">
                  <div className="font-bold text-emerald-300 flex items-center justify-between">
                    <span>{targetHosp.shortName} (Recommended Hub)</span>
                    <span className="text-[10px] font-mono bg-emerald-500/20 px-1.5 py-0.5 rounded">MATCH 98%</span>
                  </div>
                  <div className="text-slate-300 text-[11px]">
                    Distance: 8.4 km • Green Wave ETA: 11 mins • ICU Ventilator Bay 14 Ready
                  </div>
                </div>

                <div className="p-3.5 bg-slate-900/50 border border-slate-800 rounded-xl text-xs space-y-1">
                  <div className="font-bold text-slate-300 flex items-center justify-between">
                    <span>Apollo Greams Road (Private CMCHIS)</span>
                    <span className="text-[10px] font-mono text-slate-500">BACKUP</span>
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    Distance: 6.8 km • PPP Diversion Standby • ER Bay Ready
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Guaranteed Bed Reservation */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4 bg-slate-900/80 border border-amber-500/40 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-amber-400 uppercase font-bold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 animate-pulse" /> Guaranteed Bed Lock Executed
                  </span>
                  <span className="text-xs font-mono text-amber-300 font-bold">Hold Window: 45:00</span>
                </div>
                <div className="text-base font-bold text-slate-100">
                  Bed Token: {activeReservation?.id || 'TN-RES-RGGGH-ICU-491'}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  ICU Bed 14 has been placed in <strong className="text-purple-300">'RESERVED'</strong> status in the state grid. The trauma resuscitation team and sterile ventilator setup have been locked for this patient.
                </p>
              </div>

              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-slate-200 font-bold">Ventilator Preparation: Completed</span>
                </div>
                <span className="text-cyan-400 font-bold">Staff Notified via Pager</span>
              </div>
            </div>
          )}

          {/* STEP 4: Green Wave Ambulance Navigation */}
          {step === 4 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4 bg-slate-900/80 border border-cyan-500/40 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-cyan-400 uppercase font-bold flex items-center gap-1.5">
                    <Route className="w-3.5 h-3.5 text-cyan-400" /> Green Wave Corridor Active
                  </span>
                  <span className="text-xs font-mono text-emerald-300 font-bold">14 Signals Preempted</span>
                </div>
                <div className="text-base font-bold text-slate-100">
                  108 Ambulance En Route via Anna Salai Arterial
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Native In-App Street GPS navigation with green wave traffic preemption is holding traffic signals green along the 8.4 km corridor, reducing arrival time by 42%.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleFinishAndFlyToRoute}
                  className="flex-1 py-2.5 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Open In-App Street GPS Navigation ➔</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Patient Intake Completed */}
          {step === 5 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4 bg-emerald-950/40 border border-emerald-500/60 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-emerald-400 uppercase font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Patient Admitted to Ward
                  </span>
                  <span className="text-xs font-mono text-emerald-300 font-bold">Status: OCCUPIED</span>
                </div>
                <div className="text-base font-bold text-slate-100">
                  Patient S. Murugan admitted into ICU Bed 14
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Ambulance reached trauma intake bay in 10 mins 45s. Patient transferred to bed, continuous telemetry active, surgical team scrubbing in. Zero delay experienced.
                </p>
              </div>

              <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                <span className="text-slate-300 font-mono">Live Vitals Stream:</span>
                <span className="font-mono text-emerald-400 font-bold">HR 88 • SpO2 97% • Sinus Rhythm</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-900/80 border-t border-slate-800 px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => {
              sound.playTactileClick();
              setStep(1);
            }}
            className="px-3 py-1.5 text-xs font-mono text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Simulation</span>
          </button>

          <div className="flex items-center gap-2">
            {step < 5 ? (
              <button
                onClick={handleNextStep}
                className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-cyan-950/50 transition-all cursor-pointer"
              >
                <span>Next Step: {step === 1 ? 'Match Facility' : step === 2 ? 'Reserve Bed' : step === 3 ? 'Green Wave Transit' : 'Admit Patient'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleFinishAndFlyToWard}
                className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/50 transition-all cursor-pointer"
              >
                <Bed className="w-4 h-4" />
                <span>Fly to 3D Hospital Ward ➔</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

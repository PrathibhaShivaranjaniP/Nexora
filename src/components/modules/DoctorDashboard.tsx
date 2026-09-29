import React, { useState, useEffect } from 'react';
import {
  Activity, Heart, Thermometer, Droplets, Clock, AlertTriangle,
  Phone, Radio, Zap, BrainCircuit, Loader2, CheckCircle2,
  Siren, ShieldAlert, Stethoscope, MonitorSmartphone
} from 'lucide-react';

interface AmbulanceData {
  unitId: string;
  callSign: string;
  etaMinutes: number;
  patientName: string;
  age: number;
  gender: string;
  chiefComplaint: string;
  mechanism: string;
  gcsScore: number;
  vitals: {
    hr: number;
    bp: string;
    spo2: number;
    temp: number;
    rr: number;
  };
}

const mockAmbulance: AmbulanceData = {
  unitId: '108-TN-42',
  callSign: 'MEDIC-42',
  etaMinutes: 7,
  patientName: 'Rajesh K.',
  age: 34,
  gender: 'Male',
  chiefComplaint: 'High-speed MVC — Unrestrained driver',
  mechanism: 'Frontal impact, estimated 80+ km/h, severe cabin intrusion',
  gcsScore: 11,
  vitals: {
    hr: 118,
    bp: '88/54',
    spo2: 91,
    temp: 36.2,
    rr: 26
  }
};

export const DoctorDashboard: React.FC = () => {
  const [activeAmbulance] = useState<AmbulanceData>(mockAmbulance);
  const [eta, setEta] = useState(mockAmbulance.etaMinutes * 60);
  const [vitals, setVitals] = useState(mockAmbulance.vitals);
  const [aiScanState, setAiScanState] = useState<'idle' | 'scanning' | 'analyzed'>('idle');
  const [activatingTrauma, setActivatingTrauma] = useState(false);
  const [preparingOR, setPreparingOR] = useState(false);
  const [alertingBlood, setAlertingBlood] = useState(false);

  // ETA countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setEta(prev => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Live vitals fluctuation
  useEffect(() => {
    const interval = setInterval(() => {
      setVitals(prev => ({
        hr: prev.hr + Math.floor(Math.random() * 7) - 3,
        bp: prev.bp,
        spo2: Math.min(100, Math.max(85, prev.spo2 + Math.floor(Math.random() * 3) - 1)),
        temp: prev.temp,
        rr: prev.rr + Math.floor(Math.random() * 3) - 1
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // AI Scan auto-cycle
  useEffect(() => {
    const timer1 = setTimeout(() => setAiScanState('scanning'), 3000);
    const timer2 = setTimeout(() => setAiScanState('analyzed'), 7000);
    return () => { clearTimeout(timer1); clearTimeout(timer2); };
  }, []);

  const handleAction = (setter: (v: boolean) => void) => {
    setter(true);
    setTimeout(() => setter(false), 2500);
  };

  const etaMinutes = Math.floor(eta / 60);
  const etaSeconds = eta % 60;

  const scanBadgeClass = aiScanState === 'scanning'
    ? 'bg-purple-900/80 border-purple-500 text-purple-300'
    : aiScanState === 'analyzed'
    ? 'bg-emerald-900/80 border-emerald-500 text-emerald-300'
    : 'bg-slate-900/80 border-slate-600 text-slate-400';

  const scanDotClass = aiScanState === 'scanning'
    ? 'bg-purple-400 animate-pulse'
    : aiScanState === 'analyzed'
    ? 'bg-emerald-400'
    : 'bg-slate-500';

  const scanLabel = aiScanState === 'scanning'
    ? 'AI NEURAL NET ACTIVE'
    : aiScanState === 'analyzed'
    ? 'ANALYSIS COMPLETE'
    : 'STANDBY';

  const sceneLabel = aiScanState === 'scanning'
    ? 'RUNNING PREDICTIVE MODEL...'
    : aiScanState === 'analyzed'
    ? 'PHYSICS MODEL COMPLETE'
    : 'AWAITING SCENE DATA';

  const etaBadgeClass = eta > 0
    ? 'bg-amber-950/60 border border-amber-600/40 text-amber-300'
    : 'bg-emerald-950/60 border border-emerald-600/40 text-emerald-300';

  const etaDotClass = eta > 0 ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400';

  return (
    <div className="w-full h-full bg-[#050811] text-slate-100 overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 border-b border-slate-800/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-600/20 border border-rose-500/40 flex items-center justify-center">
            <Siren className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-wide text-slate-100">ER DOCTOR — TRAUMA DESK</h1>
            <p className="text-[10px] font-mono text-slate-500 tracking-widest">INBOUND PATIENT TELEMETRY</p>
          </div>
        </div>
        <div className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-2 ${etaBadgeClass}`}>
          <span className={`w-2 h-2 rounded-full ${etaDotClass}`} />
          {eta > 0 ? `ETA ${etaMinutes}:${String(etaSeconds).padStart(2, '0')}` : 'ARRIVED'}
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-5">
        {/* LEFT COLUMN: Patient Info + Vitals */}
        <div className="lg:col-span-2 space-y-4">
          {/* Patient Card */}
          <div className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-200">
                  {activeAmbulance.patientName} — {activeAmbulance.age}y {activeAmbulance.gender}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">{activeAmbulance.chiefComplaint}</p>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-rose-950/60 border border-rose-800/50">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-[10px] font-mono font-bold text-rose-300">GCS {activeAmbulance.gcsScore}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
              <Radio className="w-3 h-3" />
              <span>Unit {activeAmbulance.unitId} | {activeAmbulance.callSign}</span>
            </div>
          </div>

          {/* Vitals Grid */}
          <div className="grid grid-cols-5 gap-2">
            {[
              { label: 'Heart Rate', value: String(vitals.hr), unit: 'bpm', icon: Heart, color: vitals.hr > 120 ? 'text-rose-400' : 'text-emerald-400', warn: vitals.hr > 120 },
              { label: 'SpO2', value: String(vitals.spo2), unit: '%', icon: Activity, color: vitals.spo2 < 93 ? 'text-rose-400' : 'text-cyan-400', warn: vitals.spo2 < 93 },
              { label: 'BP', value: vitals.bp, unit: 'mmHg', icon: Droplets, color: 'text-blue-400', warn: false },
              { label: 'Temp', value: String(vitals.temp), unit: '°C', icon: Thermometer, color: 'text-amber-400', warn: false },
              { label: 'Resp', value: String(vitals.rr), unit: '/min', icon: Stethoscope, color: 'text-purple-400', warn: vitals.rr > 24 }
            ].map(v => {
              const Icon = v.icon;
              const borderClass = v.warn
                ? 'border-rose-700/60 shadow-[inset_0_0_20px_rgba(225,29,72,0.1)]'
                : 'border-slate-700/50';
              return (
                <div key={v.label} className={`bg-[#0a1020] border rounded-xl p-3 text-center ${borderClass}`}>
                  <Icon className={`w-4 h-4 mx-auto mb-1 ${v.color}`} />
                  <div className={`text-xl font-black font-mono ${v.color}`}>{v.value}</div>
                  <div className="text-[8px] text-slate-500 uppercase tracking-widest">{v.unit}</div>
                  <div className="text-[9px] text-slate-500 mt-0.5">{v.label}</div>
                </div>
              );
            })}
          </div>

          {/* AI Scene & Kinematics */}
          <div className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-4">
            <h3 className="text-xs font-bold text-slate-300 flex items-center gap-2 mb-3">
              <BrainCircuit className="w-4 h-4 text-purple-400" /> AI Kinematics &amp; Scene Analysis
            </h3>

            <div className="w-full h-56 bg-[#040812] rounded-xl border border-slate-700/80 overflow-hidden relative flex shadow-inner">
              {/* LEFT: Scene Visual */}
              <div className="w-1/2 h-full relative border-r border-slate-800">
                <div className="flex flex-col items-center justify-center text-slate-500 w-full h-full relative bg-[#040812]">
                  <div
                    className="absolute inset-0 opacity-10"
                    style={{
                      backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #a855f7 2px, #a855f7 4px)',
                      backgroundSize: '100% 4px'
                    }}
                  />
                  <BrainCircuit className={`w-8 h-8 mb-2 opacity-50 ${aiScanState === 'scanning' ? 'animate-pulse text-purple-400' : 'text-slate-500'}`} />
                  <div className="text-[9px] font-mono tracking-widest uppercase z-10 text-center px-2">
                    {sceneLabel}
                  </div>
                </div>

                {/* Scanning overlay */}
                {aiScanState === 'scanning' && (
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div
                      className="w-full h-0.5 bg-purple-500 shadow-[0_0_15px_#a855f7] absolute top-0"
                      style={{ animation: 'scan 1.5s ease-in-out infinite' }}
                    />
                  </div>
                )}

                {/* Bounding boxes when analyzed */}
                {aiScanState === 'analyzed' && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-[20%] left-[15%] w-[40%] h-[50%] border-2 border-rose-500 bg-rose-500/10 rounded" />
                    <div className="absolute top-[30%] right-[10%] w-[25%] h-[30%] border-2 border-amber-500 bg-amber-500/10 rounded" />
                  </div>
                )}

                {/* Status badge */}
                <div className={`absolute top-2 left-2 px-2 py-1 rounded text-[8px] font-mono border flex items-center gap-1.5 backdrop-blur-md ${scanBadgeClass}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${scanDotClass}`} />
                  {scanLabel}
                </div>
              </div>

              {/* RIGHT: AI Readout */}
              <div className="w-1/2 h-full bg-slate-950 p-4 overflow-y-auto custom-scrollbar flex flex-col justify-end text-xs font-mono">
                {aiScanState === 'scanning' ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-purple-400/70">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="text-[10px] uppercase tracking-widest animate-pulse">Running Neural Diagnostics</span>
                  </div>
                ) : aiScanState === 'analyzed' ? (
                  <div className="space-y-3">
                    <div className="border-l-2 border-rose-500 pl-2">
                      <span className="text-slate-500 text-[9px] uppercase block mb-0.5">Kinematics</span>
                      <span className="text-slate-200">High-speed frontal impact (Est. &gt;80km/h). Severe cabin intrusion detected.</span>
                    </div>
                    <div className="border-l-2 border-amber-500 pl-2">
                      <span className="text-slate-500 text-[9px] uppercase block mb-0.5">Biometric Prediction</span>
                      <span className="text-slate-200">82% prob. blunt force chest trauma. 64% prob. pelvic fracture.</span>
                    </div>
                    <div className="bg-purple-500/10 border border-purple-500/30 rounded p-2 text-purple-300 text-[10px]">
                      AI RECOMMENDATION: Activate Level 1 Trauma. Alert OR-2, mobilize massive transfusion protocol.
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-600 text-[10px] text-center">
                    Waiting for scene data or ambulance photo uplink...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: ER Readiness & Actions */}
        <div className="space-y-4">
          {/* Action Buttons */}
          <div className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-4 space-y-2">
            <h3 className="text-xs font-bold text-slate-300 mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" /> RAPID ACTIONS
            </h3>
            <button
              onClick={() => handleAction(setActivatingTrauma)}
              disabled={activatingTrauma}
              className="w-full py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 bg-rose-600/20 border border-rose-600/40 text-rose-300 hover:bg-rose-600/30 transition-all disabled:opacity-60"
            >
              {activatingTrauma ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
              {activatingTrauma ? 'ACTIVATING...' : 'ACTIVATE TRAUMA TEAM'}
            </button>
            <button
              onClick={() => handleAction(setPreparingOR)}
              disabled={preparingOR}
              className="w-full py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 bg-cyan-600/20 border border-cyan-600/40 text-cyan-300 hover:bg-cyan-600/30 transition-all disabled:opacity-60"
            >
              {preparingOR ? <Loader2 className="w-4 h-4 animate-spin" /> : <MonitorSmartphone className="w-4 h-4" />}
              {preparingOR ? 'PREPARING...' : 'PREPARE OR-2'}
            </button>
            <button
              onClick={() => handleAction(setAlertingBlood)}
              disabled={alertingBlood}
              className="w-full py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 bg-amber-600/20 border border-amber-600/40 text-amber-300 hover:bg-amber-600/30 transition-all disabled:opacity-60"
            >
              {alertingBlood ? <Loader2 className="w-4 h-4 animate-spin" /> : <Droplets className="w-4 h-4" />}
              {alertingBlood ? 'ALERTING...' : 'ALERT BLOOD BANK (O-)'}
            </button>
          </div>

          {/* ER Status */}
          <div className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-4">
            <h3 className="text-xs font-bold text-slate-300 mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> ER READINESS
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs bg-[#040812] p-2 rounded border border-slate-800">
                <span className="text-slate-400">Trauma Bays Available:</span>
                <span className="font-bold text-emerald-400 font-mono">2 / 4</span>
              </div>
              <div className="flex justify-between items-center text-xs bg-[#040812] p-2 rounded border border-slate-800">
                <span className="text-slate-400">O- Blood Inventory:</span>
                <span className="font-bold text-rose-400 font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" /> 4 Units
                </span>
              </div>
              <div className="flex justify-between items-center text-xs bg-[#040812] p-2 rounded border border-slate-800">
                <span className="text-slate-400">CT Scanner:</span>
                <span className="font-bold text-emerald-400 font-mono">Online &amp; Ready</span>
              </div>
              <div className="flex justify-between items-center text-xs bg-[#040812] p-2 rounded border border-slate-800">
                <span className="text-slate-400">OR-2 Status:</span>
                <span className="font-bold text-amber-400 font-mono">Standby</span>
              </div>
              <div className="flex justify-between items-center text-xs bg-[#040812] p-2 rounded border border-slate-800">
                <span className="text-slate-400">Attending on Duty:</span>
                <span className="font-bold text-cyan-400 font-mono">Dr. Priya M.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

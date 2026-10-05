import React, { useState, useEffect, useRef } from 'react';
import {
  Activity, Heart, Clock, AlertTriangle, Radio, Zap,
  BrainCircuit, ChevronLeft, ChevronRight, ChevronDown,
  User, CheckCircle2, Siren, ShieldAlert, Sparkles,
  Layers, Stethoscope, Droplets, Bed, Bell, AlertOctagon,
  Loader2, Shield, Eye, X, Send, Navigation
} from 'lucide-react';
import { useHospitalStore } from '../../store/hospitalStore';
import { sound } from '../../utils/audioEngine';

interface BayPatient {
  id: string;
  name: string;
  patientName: string;
  patientId: string;
  age: number;
  gender: string;
  status: 'occupied' | 'incoming' | 'available';
  triage: 'red' | 'orange' | 'green';
  complaint: string;
  hotspot: {
    left: string;
    top: string;
    width: string;
    height: string;
    badgePos: { left: string; top: string };
  };
  vitals: {
    hr: number;
    bpSys: number;
    bpDia: number;
    spo2: number;
    rr: number;
  };
}

const initialBays: BayPatient[] = [
  {
    id: 'trauma-a',
    name: 'TRAUMA A',
    patientName: 'LEO CHEN',
    patientId: '77123',
    age: 34,
    gender: 'M',
    status: 'incoming',
    triage: 'red',
    complaint: 'High-Speed MVC — Polytrauma & Tension Pneumothorax',
    hotspot: {
      left: '2%',
      top: '26%',
      width: '36%',
      height: '48%',
      badgePos: { left: '8%', top: '30%' }
    },
    vitals: { hr: 128, bpSys: 98, bpDia: 62, spo2: 94, rr: 24 }
  },
  {
    id: 'bay-1',
    name: 'BAY 1',
    patientName: 'DAVID MILLER',
    patientId: '77125',
    age: 62,
    gender: 'M',
    status: 'occupied',
    triage: 'green',
    complaint: 'Post-op Observation & Fluid Management',
    hotspot: {
      left: '23%',
      top: '18%',
      width: '15%',
      height: '27%',
      badgePos: { left: '25%', top: '20%' }
    },
    vitals: { hr: 76, bpSys: 128, bpDia: 82, spo2: 98, rr: 16 }
  },
  {
    id: 'bay-2',
    name: 'BAY 2',
    patientName: 'ANANYA IYER',
    patientId: '77126',
    age: 45,
    gender: 'F',
    status: 'occupied',
    triage: 'orange',
    complaint: 'Severe Sepsis Protocol / High Fever & Tachycardia',
    hotspot: {
      left: '33%',
      top: '12%',
      width: '16%',
      height: '27%',
      badgePos: { left: '35%', top: '14%' }
    },
    vitals: { hr: 111, bpSys: 102, bpDia: 66, spo2: 95, rr: 22 }
  },
  {
    id: 'bay-3',
    name: 'BAY 3',
    patientName: 'KAVIN RAJ',
    patientId: '77127',
    age: 51,
    gender: 'M',
    status: 'occupied',
    triage: 'green',
    complaint: 'Atypical Chest Discomfort — Troponin Negative',
    hotspot: {
      left: '44%',
      top: '6%',
      width: '20%',
      height: '27%',
      badgePos: { left: '46%', top: '8%' }
    },
    vitals: { hr: 82, bpSys: 134, bpDia: 86, spo2: 97, rr: 17 }
  },
  {
    id: 'bay-6',
    name: 'BAY 6',
    patientName: 'VIKRAM SETH',
    patientId: '77128',
    age: 39,
    gender: 'M',
    status: 'occupied',
    triage: 'orange',
    complaint: 'Compound Tibial Fracture & Hemostasis Monitoring',
    hotspot: {
      left: '32%',
      top: '49%',
      width: '26%',
      height: '40%',
      badgePos: { left: '36%', top: '53%' }
    },
    vitals: { hr: 90, bpSys: 122, bpDia: 78, spo2: 99, rr: 18 }
  },
  {
    id: 'bay-7',
    name: 'BAY 7',
    patientName: 'SANJAY PATEL',
    patientId: '77129',
    age: 70,
    gender: 'M',
    status: 'occupied',
    triage: 'green',
    complaint: 'Dehydration & Electrolyte Imbalance Recovery',
    hotspot: {
      left: '56%',
      top: '41%',
      width: '21%',
      height: '32%',
      badgePos: { left: '60%', top: '44%' }
    },
    vitals: { hr: 72, bpSys: 120, bpDia: 80, spo2: 99, rr: 15 }
  },
  {
    id: 'bay-8',
    name: 'BAY 8',
    patientName: 'CLEAN READY BED',
    patientId: '77130',
    age: 0,
    gender: '-',
    status: 'available',
    triage: 'green',
    complaint: 'Sanitized Bay — UV-C Disinfection Complete (Ready for Admittance)',
    hotspot: {
      left: '70%',
      top: '31%',
      width: '23%',
      height: '33%',
      badgePos: { left: '74%', top: '34%' }
    },
    vitals: { hr: 0, bpSys: 0, bpDia: 0, spo2: 0, rr: 0 }
  }
];

export const DoctorDashboard: React.FC = () => {
  const { currentDistrict } = useHospitalStore();
  const [bays, setBays] = useState<BayPatient[]>(initialBays);
  const [selectedBayId, setSelectedBayId] = useState<string>('trauma-a');
  const [bayFilter, setBayFilter] = useState<'all' | 'trauma'>('all');
  const [isStaffOpen, setIsStaffOpen] = useState(false);
  const [isAiInboundModalOpen, setIsAiInboundModalOpen] = useState(false);

  // Rapid Actions Feedback
  const [activatingTrauma, setActivatingTrauma] = useState(false);
  const [orderingCT, setOrderingCT] = useState(false);
  const [alertingBlood, setAlertingBlood] = useState(false);

  // Inbound Alert countdowns
  const [alertEta1, setAlertEta1] = useState(175); // ~3m
  const [alertEta2, setAlertEta2] = useState(475); // ~8m

  useEffect(() => {
    const timer = setInterval(() => {
      setAlertEta1(prev => (prev <= 1 ? 180 : prev - 1));
      setAlertEta2(prev => (prev <= 1 ? 480 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const activeBay = bays.find(b => b.id === selectedBayId) || bays[0];

  // Live fluctuating vitals for active patient
  const [liveVitals, setLiveVitals] = useState(activeBay.vitals);

  useEffect(() => {
    setLiveVitals(activeBay.vitals);
  }, [selectedBayId, activeBay]);

  useEffect(() => {
    if (activeBay.status === 'available') return;
    const interval = setInterval(() => {
      setLiveVitals(prev => ({
        hr: Math.min(150, Math.max(70, prev.hr + Math.floor(Math.random() * 5) - 2)),
        bpSys: Math.min(140, Math.max(85, prev.bpSys + Math.floor(Math.random() * 3) - 1)),
        bpDia: Math.min(90, Math.max(50, prev.bpDia + Math.floor(Math.random() * 3) - 1)),
        spo2: Math.min(99, Math.max(90, prev.spo2 + Math.floor(Math.random() * 3) - 1)),
        rr: Math.min(32, Math.max(14, prev.rr + Math.floor(Math.random() * 3) - 1))
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, [activeBay.status]);

  // Handle Triage Change
  const updateTriage = (newTriage: 'red' | 'orange' | 'green') => {
    sound.playTactileClick();
    setBays(prev => prev.map(b => b.id === selectedBayId ? { ...b, triage: newTriage } : b));
  };

  const handleAction = (setter: (v: boolean) => void, soundFn?: () => void) => {
    if (soundFn) soundFn();
    setter(true);
    setTimeout(() => {
      setter(false);
      sound.playRadarPing();
    }, 1800);
  };

  const selectBay = (id: string) => {
    sound.playTactileClick();
    setSelectedBayId(id);
  };

  const activeTraumaCount = bays.filter(b => b.triage === 'red').length;

  return (
    <div className="w-full h-full min-h-[calc(100vh-140px)] bg-[#070b16] text-slate-100 flex flex-col rounded-2xl border border-slate-800 shadow-2xl overflow-hidden select-none animate-in fade-in duration-200">
      {/* ─────────────────────────────────────────────────────────────
          1. TOP KPI STATUS BAR (Exact Match to Reference Image)
         ───────────────────────────────────────────────────────────── */}
      <div className="bg-[#0b1222]/95 backdrop-blur-xl border-b border-slate-800/90 px-6 py-3.5 grid grid-cols-2 sm:grid-cols-5 gap-4 items-center text-xs shadow-lg">
        {/* Live ER Status */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <span className="w-3.5 h-3.5 rounded-full bg-cyan-400 animate-ping absolute opacity-80" />
            <span className="w-3 h-3 rounded-full bg-cyan-500 relative shadow-[0_0_12px_#06b6d4]" />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">LIVE ER STATUS</div>
            <div className="flex items-center gap-2 mt-0.5 text-slate-400 text-xs">
              <span className="text-cyan-300 font-bold">Active</span>
              <span className="text-slate-600">|</span>
              <div className="flex items-center gap-1.5 opacity-80">
                <Bed className="w-3 h-3 text-cyan-400" />
                <Activity className="w-3 h-3 text-emerald-400" />
                <User className="w-3 h-3 text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Bed Capacity */}
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">BED CAPACITY</div>
          <div className="flex items-center gap-2">
            <span className="text-base font-black font-mono text-slate-100">18 / 22</span>
            <span className="text-xs font-mono font-bold text-cyan-400">82%</span>
          </div>
          <div className="w-28 h-1 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
            <div className="w-[82%] h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full" />
          </div>
        </div>

        {/* Wait Time */}
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">WAIT TIME</div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-black font-mono text-slate-100">14m</span>
            <span className="text-[10px] font-mono text-slate-400">AVG 26m</span>
          </div>
        </div>

        {/* Active Traumas */}
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">ACTIVE TRAUMAS</div>
          <div className="text-lg font-black font-mono text-rose-500 flex items-center gap-1.5">
            <span>{activeTraumaCount}</span>
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          </div>
        </div>

        {/* Inbound Ambulances */}
        <div className="col-span-2 sm:col-span-1 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">AMBULANCES</div>
          <div className="text-base font-black font-mono text-cyan-300 flex items-center gap-1.5">
            <span>3 INBOUND</span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. MAIN STAGE: ER WARD MATRIX + TELEMETRY PANEL
         ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* LEFT 65%: AUTHENTIC 3D ISOMETRIC ER WARD MATRIX WITH INTERACTIVE HOTSPOTS */}
        <div className="lg:col-span-7 bg-[#040814] p-4 sm:p-5 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800 relative select-none">
          {/* Matrix Header Pill Switcher */}
          <div className="flex items-center justify-between mb-2 z-10">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-black uppercase tracking-wider text-slate-200">
                ER WARD MATRIX
              </span>
              <div className="flex bg-slate-950/90 p-0.5 rounded-xl border border-slate-800 text-[11px]">
                <button
                  onClick={() => { sound.playTactileClick(); setBayFilter('all'); }}
                  className={`px-3 py-1 rounded-lg font-mono font-bold transition-all cursor-pointer ${
                    bayFilter === 'all'
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-900/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  BAY 1 - BAY 12
                </button>
                <button
                  onClick={() => { sound.playTactileClick(); setBayFilter('trauma'); selectBay('trauma-a'); }}
                  className={`px-3 py-1 rounded-lg font-mono font-bold transition-all cursor-pointer ${
                    bayFilter === 'trauma'
                      ? 'bg-gradient-to-r from-rose-600 to-purple-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  TRAUMA A &amp; B
                </button>
              </div>
            </div>

            {/* AI Inbound Trigger */}
            <button
              onClick={() => { sound.playTactileClick(); setIsAiInboundModalOpen(true); }}
              className="flex items-center gap-1.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 px-2.5 py-1 rounded-xl text-[10.5px] font-mono text-slate-300 cursor-pointer shadow-sm transition-all hover:text-cyan-300"
            >
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>AI INBOUND</span>
              <ChevronRight className="w-3 h-3 text-slate-500" />
            </button>
          </div>

          {/* Top-Left Color Status Legend */}
          <div className="absolute top-16 left-6 z-20 flex flex-col gap-1 text-[10px] font-mono text-slate-300 bg-slate-950/85 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-800/80 shadow-md pointer-events-none">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400 shadow-[0_0_6px_#22d3ee]" />
              <span>Cyan = Occupied</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500 animate-pulse shadow-[0_0_6px_#6366f1]" />
              <span>Indigo = Incoming</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-slate-600" />
              <span>Grey = Empty</span>
            </div>
          </div>

          {/* 3D VOLUMETRIC ISOMETRIC ER WARD CANVAS WITH INTERACTIVE BAYS */}
          <div className="relative flex-1 w-full min-h-[380px] sm:min-h-[440px] rounded-2xl overflow-hidden border border-slate-800/90 shadow-2xl bg-[#0c1427] flex items-center justify-center my-1 group">
            {/* The Authentic 3D Isometric Room Render */}
            <img
              src="/assets/er_isometric_clean.png"
              alt="ER Ward 3D Matrix"
              className="w-full h-full object-contain pointer-events-none drop-shadow-[0_10px_25px_rgba(0,0,0,0.6)]"
            />

            {/* INTERACTIVE HOTSPOTS OVERLAID ON EACH BAY */}
            {bays.map(bay => {
              const isSelected = selectedBayId === bay.id;
              const isFilteredOut = bayFilter === 'trauma' && !bay.id.startsWith('trauma');

              if (isFilteredOut) return null;

              return (
                <div
                  key={bay.id}
                  onClick={() => selectBay(bay.id)}
                  style={{
                    position: 'absolute',
                    left: bay.hotspot.left,
                    top: bay.hotspot.top,
                    width: bay.hotspot.width,
                    height: bay.hotspot.height
                  }}
                  className={`cursor-pointer rounded-2xl transition-all duration-300 z-10 flex flex-col justify-between p-1.5 ${
                    isSelected
                      ? 'border-2 border-cyan-400 bg-cyan-500/15 shadow-[0_0_20px_rgba(34,211,238,0.4)] ring-4 ring-cyan-500/20 scale-[1.02]'
                      : 'border border-transparent hover:border-cyan-400/50 hover:bg-cyan-500/10'
                  }`}
                  title={`${bay.name} • ${bay.patientName}`}
                >
                  {/* Floating Bay Status Badge */}
                  <div className="flex items-center justify-between pointer-events-none">
                    <span
                      className={`px-2 py-0.5 rounded-lg text-[9px] font-mono font-black tracking-wider transition-all shadow-md flex items-center gap-1 ${
                        bay.id === 'trauma-a'
                          ? 'bg-rose-950/90 text-rose-300 border border-rose-500/80'
                          : isSelected
                          ? 'bg-cyan-950/90 text-cyan-300 border border-cyan-400'
                          : 'bg-slate-950/80 text-slate-300 border border-slate-700/80'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          bay.triage === 'red'
                            ? 'bg-rose-500 animate-ping'
                            : bay.triage === 'orange'
                            ? 'bg-amber-400'
                            : 'bg-emerald-400'
                        }`}
                      />
                      <span>{bay.name}</span>
                    </span>

                    {isSelected && (
                      <span className="text-[9px] font-mono font-bold bg-cyan-400 text-slate-950 px-1.5 py-0.5 rounded shadow-sm">
                        ACTIVE
                      </span>
                    )}
                  </div>

                  {/* Pulsing Active Target Marker */}
                  {isSelected && (
                    <div className="self-center flex items-center justify-center pointer-events-none">
                      <span className="w-8 h-8 rounded-full border border-cyan-400 animate-ping absolute opacity-60" />
                      <span className="w-4 h-4 rounded-full bg-cyan-400/80 shadow-[0_0_10px_#22d3ee]" />
                    </div>
                  )}

                  <div className="h-1" />
                </div>
              );
            })}

            {/* Active Selected Bay Footer Tag in 3D Stage */}
            <div className="absolute bottom-4 left-6 z-20 bg-slate-950/90 backdrop-blur-md border border-cyan-500/60 px-3.5 py-2 rounded-xl text-xs font-mono flex items-center gap-2.5 shadow-xl">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]" />
              <span>
                Viewing: <strong className="text-cyan-300 font-black">{activeBay.name}</strong> ({activeBay.patientName}) •{' '}
                <span className="text-slate-400">{activeBay.complaint}</span>
              </span>
            </div>
          </div>

          {/* Bottom Legend & Pagination Controls */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px] font-mono text-slate-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-sm bg-cyan-400" />
                <span>Cyan = Occupied</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-sm bg-indigo-500" />
                <span>Indigo = Incoming</span>
              </span>
              <span className="hidden sm:flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-sm bg-slate-600" />
                <span>Active patients</span>
              </span>
              <span className="hidden sm:flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-sm bg-slate-400" />
                <span>Staff</span>
              </span>
            </div>

            {/* Pagination controls to cycle through bays */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => {
                  const idx = bays.findIndex(b => b.id === selectedBayId);
                  const prevIdx = (idx - 1 + bays.length) % bays.length;
                  selectBay(bays[prevIdx].id);
                }}
                className="p-1 hover:text-cyan-300 transition-colors cursor-pointer"
                title="Previous Bay"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  const idx = bays.findIndex(b => b.id === selectedBayId);
                  const nextIdx = (idx + 1) % bays.length;
                  selectBay(bays[nextIdx].id);
                }}
                className="p-1 hover:text-cyan-300 transition-colors cursor-pointer"
                title="Next Bay"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT 35%: ACTIVE TRAUMA TELEMETRY PANEL (Exact Reference Match) */}
        <div className="lg:col-span-5 bg-[#080e1e] p-4 sm:p-5 flex flex-col justify-between space-y-3.5 overflow-y-auto custom-scrollbar">
          {/* Telemetry Card Header */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                ACTIVE TRAUMA TELEMETRY PANEL
              </span>
              <span className="text-slate-500 hover:text-slate-300 cursor-pointer">•••</span>
            </div>

            {/* Patient Name Banner */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-slate-100 flex items-center gap-2">
                  <span>{activeBay.name}</span>
                </h2>
                <span
                  className={`w-3 h-3 rounded-full animate-pulse ${
                    activeBay.triage === 'red'
                      ? 'bg-rose-500 shadow-[0_0_10px_#ef4444]'
                      : activeBay.triage === 'orange'
                      ? 'bg-amber-500 shadow-[0_0_10px_#f59e0b]'
                      : 'bg-emerald-500 shadow-[0_0_10px_#10b981]'
                  }`}
                />
              </div>
              <div className="text-xs font-mono text-slate-300 mt-1 flex items-center justify-between">
                <span>
                  PATIENT: <strong className="text-white">{activeBay.patientName}</strong> (ID: {activeBay.patientId})
                </span>
                <span className="text-slate-400">AGE: {activeBay.age} {activeBay.gender}</span>
              </div>
            </div>

            {/* 4 Real-Time Waveform Vitals Rows (HR, BP, SpO2, RR) */}
            <div className="space-y-2 bg-[#040814] p-3 rounded-2xl border border-slate-800/80 shadow-inner">
              {/* Row 1: HR */}
              <div className="flex items-center justify-between gap-3 border-b border-slate-800/60 pb-2">
                <div className="w-28 flex-shrink-0">
                  <span className="text-[10px] text-slate-400 font-mono block">HR</span>
                  <span className="text-xl font-black font-mono text-rose-500 leading-none">
                    {liveVitals.hr} <span className="text-[10px] text-slate-500 font-normal">bpm</span>
                  </span>
                </div>
                {/* Cyan Lead-II ECG Waveform with sweep */}
                <div className="flex-1 h-8 overflow-hidden relative">
                  <svg viewBox="0 0 240 30" className="w-full h-full">
                    <path
                      d="M 0,15 L 15,15 L 18,15 L 21,4 L 25,26 L 29,8 L 33,15 L 60,15 L 75,15 L 78,15 L 81,4 L 85,26 L 89,8 L 93,15 L 120,15 L 135,15 L 138,15 L 141,4 L 145,26 L 149,8 L 153,15 L 180,15 L 195,15 L 198,15 L 201,4 L 205,26 L 209,8 L 213,15 L 240,15"
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth="1.8"
                      className="animate-pulse"
                    />
                  </svg>
                </div>
              </div>

              {/* Row 2: BP */}
              <div className="flex items-center justify-between gap-3 border-b border-slate-800/60 pb-2">
                <div className="w-28 flex-shrink-0">
                  <span className="text-[10px] text-slate-400 font-mono block">BP</span>
                  <span className="text-xl font-black font-mono text-cyan-300 leading-none">
                    {liveVitals.bpSys}/{liveVitals.bpDia} <span className="text-[10px] text-slate-500 font-normal">mmHg</span>
                  </span>
                </div>
                {/* Indigo Arterial Pulse Waveform */}
                <div className="flex-1 h-8 overflow-hidden relative">
                  <svg viewBox="0 0 240 30" className="w-full h-full">
                    <path
                      d="M 0,20 Q 15,2 30,12 T 60,20 Q 75,2 90,12 T 120,20 Q 135,2 150,12 T 180,20 Q 195,2 210,12 T 240,20"
                      fill="none"
                      stroke="#818cf8"
                      strokeWidth="1.8"
                      className="animate-pulse"
                    />
                  </svg>
                </div>
              </div>

              {/* Row 3: SpO2 */}
              <div className="flex items-center justify-between gap-3 border-b border-slate-800/60 pb-2">
                <div className="w-28 flex-shrink-0">
                  <span className="text-[10px] text-slate-400 font-mono block">SpO2</span>
                  <span className="text-xl font-black font-mono text-blue-400 leading-none">
                    {liveVitals.spo2}%
                  </span>
                </div>
                {/* Cyan Pleth Waveform */}
                <div className="flex-1 h-8 overflow-hidden relative">
                  <svg viewBox="0 0 240 30" className="w-full h-full">
                    <path
                      d="M 0,16 Q 10,6 20,12 T 40,16 Q 50,6 60,12 T 80,16 Q 90,6 100,12 T 120,16 Q 130,6 140,12 T 160,16 Q 170,6 180,12 T 200,16 Q 210,6 220,12 T 240,16"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="1.6"
                    />
                  </svg>
                </div>
              </div>

              {/* Row 4: RR */}
              <div className="flex items-center justify-between gap-3">
                <div className="w-28 flex-shrink-0">
                  <span className="text-[10px] text-slate-400 font-mono block">RR</span>
                  <span className="text-xl font-black font-mono text-emerald-400 leading-none">
                    {liveVitals.rr}/m
                  </span>
                </div>
                {/* Emerald Respiratory Waveform */}
                <div className="flex-1 h-8 overflow-hidden relative">
                  <svg viewBox="0 0 240 30" className="w-full h-full">
                    <path
                      d="M 0,22 Q 20,4 40,22 T 80,22 Q 100,4 120,22 T 160,22 Q 180,4 200,22 T 240,22"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="1.8"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* 3 Triage Acuity Buttons (RED / ORANGE / GREEN) */}
            <div className="grid grid-cols-3 gap-2 font-mono text-xs font-bold pt-1">
              <button
                onClick={() => updateTriage('red')}
                className={`py-2 rounded-xl border transition-all cursor-pointer ${
                  activeBay.triage === 'red'
                    ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white border-rose-500 shadow-lg shadow-rose-950/60'
                    : 'bg-[#0f172a] text-rose-400 border-rose-900/40 hover:bg-slate-900'
                }`}
              >
                RED
              </button>
              <button
                onClick={() => updateTriage('orange')}
                className={`py-2 rounded-xl border transition-all cursor-pointer ${
                  activeBay.triage === 'orange'
                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white border-amber-500 shadow-lg shadow-amber-950/60'
                    : 'bg-[#0f172a] text-amber-400 border-amber-900/40 hover:bg-slate-900'
                }`}
              >
                ORANGE
              </button>
              <button
                onClick={() => updateTriage('green')}
                className={`py-2 rounded-xl border transition-all cursor-pointer ${
                  activeBay.triage === 'green'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-500 shadow-lg shadow-emerald-950/60'
                    : 'bg-[#0f172a] text-emerald-400 border-emerald-900/40 hover:bg-slate-900'
                }`}
              >
                GREEN
              </button>
            </div>
          </div>

          {/* Inbound Alerts Section */}
          <div className="space-y-2 pt-1 border-t border-slate-800">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-300">
              <span>INBOUND ALERTS</span>
              <span
                onClick={() => { sound.playTactileClick(); setIsAiInboundModalOpen(true); }}
                className="text-cyan-400 hover:text-cyan-300 cursor-pointer text-[10px]"
              >
                View All →
              </span>
            </div>

            <div className="space-y-1.5 font-mono text-xs">
              <div
                onClick={() => { sound.playTactileClick(); setIsAiInboundModalOpen(true); }}
                className="p-2.5 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/40 rounded-xl flex items-center justify-between cursor-pointer transition-all"
              >
                <div className="flex items-center gap-2">
                  <Bell className="w-3.5 h-3.5 text-rose-400 animate-bounce" />
                  <span className="text-rose-200 font-bold">Inbound Airborne Trauma Alert</span>
                </div>
                <span className="text-amber-300 font-bold">ETA {Math.floor(alertEta1 / 60)}m {alertEta1 % 60}s</span>
              </div>

              <div
                onClick={() => { sound.playTactileClick(); setIsAiInboundModalOpen(true); }}
                className="p-2.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 rounded-xl flex items-center justify-between text-slate-400 cursor-pointer transition-all"
              >
                <div className="flex items-center gap-2">
                  <AlertOctagon className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-slate-200">Inbound Ambulance Alert</span>
                </div>
                <span className="text-slate-300">ETA {Math.floor(alertEta2 / 60)}m {alertEta2 % 60}s</span>
              </div>
            </div>
          </div>

          {/* Rapid Action Buttons */}
          <div className="space-y-2 pt-1">
            <button
              onClick={() => handleAction(setActivatingTrauma, sound.playTactileClick)}
              disabled={activatingTrauma}
              className="w-full py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-rose-950/50 transition-all cursor-pointer disabled:opacity-50"
            >
              {activatingTrauma ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
              <span>{activatingTrauma ? 'ACTIVATING TRAUMA BAY...' : 'ACTIVATE TRAUMA TEAM'}</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleAction(setOrderingCT, sound.playTactileClick)}
                disabled={orderingCT}
                className="py-2 px-2 bg-slate-900 hover:bg-slate-800 border border-emerald-500/40 text-emerald-300 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                {orderingCT ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                <span>{orderingCT ? 'ORDERING...' : 'ORDER STAT CT'}</span>
              </button>

              <button
                onClick={() => handleAction(setAlertingBlood, sound.playTactileClick)}
                disabled={alertingBlood}
                className="py-2 px-2 bg-slate-900 hover:bg-slate-800 border border-amber-500/40 text-amber-300 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                {alertingBlood ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Droplets className="w-3.5 h-3.5 text-rose-400" />}
                <span>{alertingBlood ? 'RESERVING...' : 'RESERVE O- BLOOD'}</span>
              </button>
            </div>
          </div>

          {/* Staff On Call Collapsible Strip */}
          <div className="pt-1">
            <button
              onClick={() => { sound.playTactileClick(); setIsStaffOpen(!isStaffOpen); }}
              className="w-full py-2.5 px-3 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 flex items-center justify-between transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-bold">STAFF ON CALL</span>
                <span className="text-[10px] text-slate-500">(Dr. Aris Thorne, Trauma Chief)</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isStaffOpen ? 'rotate-180' : ''}`} />
            </button>

            {isStaffOpen && (
              <div className="mt-1.5 p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono space-y-1.5 animate-in fade-in duration-200">
                <div className="flex justify-between text-slate-300">
                  <span>Attending Physician:</span>
                  <span className="text-cyan-400 font-bold">Dr. Aris Thorne, MD</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Trauma Resuscitation Lead:</span>
                  <span className="text-emerald-400 font-bold">Nurse Sarah M., BSN</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>On-Call Neurosurgeon:</span>
                  <span className="text-purple-400 font-bold">Dr. K. Raman (Paged)</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. AI INBOUND QUEUE MODAL
         ───────────────────────────────────────────────────────────── */}
      {isAiInboundModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0b1328] border border-cyan-500/50 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden font-mono">
            <div className="bg-[#0f1b38] px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-sm text-cyan-300">AI INBOUND EMERGENCY QUEUE</span>
              </div>
              <button
                onClick={() => setIsAiInboundModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <div className="p-3.5 bg-rose-950/40 border border-rose-800/60 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-rose-300 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    <span>Air Ambulance Flight #MED-108</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Polytrauma MVC • Shock Index 1.3 • Intubated • Assigned to <strong>TRAUMA A</strong>
                  </div>
                </div>
                <span className="text-amber-300 text-xs font-bold">ETA 2m 45s</span>
              </div>

              <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-amber-300 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span>Ambulance Unit A104 (Incident #3244)</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Acute STEMI • Pre-activated Cath Lab • Assigned to <strong>BAY 2</strong>
                  </div>
                </div>
                <span className="text-slate-300 text-xs font-bold">ETA 7m 10s</span>
              </div>

              <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-emerald-300 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>Private Vehicle Self-Transport #TN-09-881</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Digital QR Triage Token generated • Ready for Triage Nurse Check-in
                  </div>
                </div>
                <span className="text-slate-400 text-xs">ETA 12m</span>
              </div>
            </div>

            <div className="bg-[#0f1b38] px-5 py-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setIsAiInboundModalOpen(false)}
                className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-xl text-xs transition-all"
              >
                Close Queue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

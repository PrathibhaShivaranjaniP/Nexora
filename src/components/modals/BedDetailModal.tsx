import React, { useState, useEffect, useRef } from 'react';
import { useHospitalStore } from '../../store/hospitalStore';
import { BedStatus } from '../../types/hospital';
import {
  X, BedDouble, UserX, Sparkles, Activity, ShieldAlert, Check,
  Heart, ChevronDown, ChevronUp, Edit3, Phone, Stethoscope,
  Volume2, VolumeX, Eye, Rotate3d, Maximize2, Bell, Plus,
  Info, Search, User, Shield, AlertTriangle, CheckCircle2,
  Clock, FileText, Send, Radio, Thermometer, Wind, Droplet,
  Layers, Sliders, Play, Pause
} from 'lucide-react';
import { ECGWaveform } from '../telemetry/ECGWaveform';
import { sound } from '../../utils/audioEngine';

export const BedDetailModal: React.FC = () => {
  const {
    beds,
    patients,
    selectedBedId,
    setSelectedBedId,
    updateBedStatus,
    dischargePatient,
    turnoverGhostBed
  } = useHospitalStore();

  // State management
  const [activeTab, setActiveTab] = useState<'status' | 'history' | 'alerts'>('status');
  const [vitalsAccordionOpen, setVitalsAccordionOpen] = useState(true);
  const [doctorAccordionOpen, setDoctorAccordionOpen] = useState(true);
  const [nurseAccordionOpen, setNurseAccordionOpen] = useState(true);

  // Editable patient name
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedPatientName, setEditedPatientName] = useState('');

  // Pager alert state
  const [isPagerModalOpen, setIsPagerModalOpen] = useState(false);
  const [pagerMessage, setPagerMessage] = useState('Urgent bedside consult requested in Room.');
  const [pagerDispatched, setPagerDispatched] = useState(false);

  // Doctor status toggle
  const [doctorStatus, setDoctorStatus] = useState<'ON-DUTY' | 'IN SURGERY' | 'ON-CALL'>('ON-DUTY');

  // Room view interactive controls
  const [roomAngle, setRoomAngle] = useState<'isometric' | 'front' | 'top'>('isometric');
  const [showHologramHud, setShowHologramHud] = useState(true);
  const [isPlayingHeartSound, setIsPlayingHeartSound] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Bed override & discharge state
  const [overrideStatus, setOverrideStatus] = useState<BedStatus | ''>('');
  const [overrideNotes, setOverrideNotes] = useState('');
  const [dischargeReason, setDischargeReason] = useState('Routine Clinical Discharge');

  // Dynamic live clock
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Web Audio simulated heartbeat sound generator
  const audioCtxRef = useRef<AudioContext | null>(null);
  const heartSoundIntervalRef = useRef<any>(null);

  const toggleHeartSound = () => {
    if (isPlayingHeartSound) {
      if (heartSoundIntervalRef.current) clearInterval(heartSoundIntervalRef.current);
      setIsPlayingHeartSound(false);
    } else {
      setIsPlayingHeartSound(true);
      sound.playRadarPing();

      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!audioCtxRef.current && AudioCtx) {
          audioCtxRef.current = new AudioCtx();
        }

        const playLubDub = () => {
          if (!audioCtxRef.current) return;
          const ctx = audioCtxRef.current;
          if (ctx.state === 'suspended') ctx.resume();

          const osc1 = ctx.createOscillator();
          const gain1 = ctx.createGain();
          osc1.type = 'sine';
          osc1.frequency.setValueAtTime(65, ctx.currentTime);
          osc1.frequency.exponentialRampToValueAtTime(35, ctx.currentTime + 0.12);
          gain1.gain.setValueAtTime(0.3, ctx.currentTime);
          gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
          osc1.connect(gain1);
          gain1.connect(ctx.destination);
          osc1.start(ctx.currentTime);
          osc1.stop(ctx.currentTime + 0.12);

          // Dub
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(50, ctx.currentTime + 0.18);
          osc2.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.28);
          gain2.gain.setValueAtTime(0.2, ctx.currentTime + 0.18);
          gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.28);
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.start(ctx.currentTime + 0.18);
          osc2.stop(ctx.currentTime + 0.28);
        };

        playLubDub();
        heartSoundIntervalRef.current = setInterval(playLubDub, 800);
      } catch (e) {
        console.warn('Audio Context error', e);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (heartSoundIntervalRef.current) clearInterval(heartSoundIntervalRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close().catch(() => {});
    };
  }, []);

  if (!selectedBedId) return null;

  const bed = beds.find(b => b.id === selectedBedId);
  if (!bed) return null;

  const patient = patients.find(p => p.id === bed.patientId);

  // Fallback / default patient vitals for rich demonstration
  const displayPatientName = editedPatientName || (patient ? patient.name : 'John Michael Miller');
  const patientMrn = patient ? patient.mrn : 'JM892';
  const heartRate = patient?.vitals?.heartRate || 78;
  const spO2 = patient?.vitals?.spO2 || 96;
  const bpSys = patient?.vitals?.bpSystolic || 124;
  const bpDia = patient?.vitals?.bpDiastolic || 82;
  const respRate = patient?.vitals?.respRate || 18;
  const temperature = patient?.vitals?.temperature || 37.1;

  // Doctor info
  const doctor = patient?.attendingDoctor || {
    name: 'Dr. Sarah L. Chen',
    degree: 'MD, FCCP',
    specialty: 'Pulmonary & Critical Care Medicine',
    qualifications: 'MD, Johns Hopkins; Board Cert. Internal Med/Critical Care',
    status: doctorStatus,
    pager: '(555) 123-4567'
  };

  // Nurse info
  const nurse = patient?.primaryNurse || {
    name: 'Nurse Mark R. Thompson (RN, CCRN)',
    credentials: 'Critical Care Registered Nurse (CCRN)',
    certifications: ['Critical Care Registered Nurse (CCRN)', 'ACLS', 'BLS'],
    shift: '07:00 - 19:00 (Day Shift)'
  };

  const handleApplyOverride = () => {
    if (overrideStatus) {
      sound.playTurnoverSuccess();
      updateBedStatus(bed.id, overrideStatus as BedStatus, overrideNotes);
      setOverrideStatus('');
      setOverrideNotes('');
    }
  };

  const handleDischarge = () => {
    sound.playTactileClick();
    if (patient) {
      dischargePatient(patient.id, dischargeReason);
    } else {
      updateBedStatus(bed.id, 'cleaning', `Discharged: ${dischargeReason}`);
    }
    setSelectedBedId(null);
  };

  const handleSendPager = () => {
    sound.playRadarPing();
    setPagerDispatched(true);
    setTimeout(() => {
      setPagerDispatched(false);
      setIsPagerModalOpen(false);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0b1326] border border-cyan-500/40 rounded-2xl w-full max-w-7xl h-[94vh] shadow-2xl overflow-hidden flex flex-col relative text-slate-100 font-sans select-none">
        
        {/* =========================================================================
            TOP NAVIGATION HEADER (Matching Screenshot Exactly)
        ========================================================================= */}
        <header className="h-14 bg-[#070c18] border-b border-slate-800/90 px-4 flex items-center justify-between gap-3 shrink-0">
          
          {/* Left Title & Breadcrumb */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/50 flex items-center justify-center text-teal-400 shadow-md shadow-teal-500/20">
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-black tracking-wider text-slate-200 uppercase font-mono">
                WARD MANAGEMENT
              </span>
              <span className="text-slate-600 text-xs">•</span>
              <span className="text-xs sm:text-sm font-black tracking-wider text-teal-400 font-mono">
                {bed.ward} - ROOM {bed.number || bed.id}
              </span>
              <span className="text-slate-600 text-xs hidden sm:inline">•</span>
              <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                UNIT B • LVL 4
              </span>
            </div>
          </div>

          {/* Center Tabs: Dashboard, Wards, Alerts, Staff */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setSelectedBedId(null)}
              className="px-3 py-1 text-slate-400 hover:text-slate-200 rounded-lg flex items-center gap-1.5 transition-all"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>
            <button className="px-3 py-1 bg-teal-500/20 text-teal-300 font-bold border border-teal-500/40 rounded-lg flex items-center gap-1.5 shadow-sm">
              <BedDouble className="w-3.5 h-3.5 text-teal-400" />
              <span>Wards</span>
            </button>
            <button
              onClick={() => setActiveTab('alerts')}
              className="px-3 py-1 text-slate-400 hover:text-slate-200 rounded-lg flex items-center gap-1.5 transition-all"
            >
              <Bell className="w-3.5 h-3.5 text-rose-400" />
              <span>Alerts</span>
              <span className="w-4 h-4 bg-rose-500/20 border border-rose-500 text-rose-300 text-[10px] rounded-full flex items-center justify-center font-bold">
                1
              </span>
            </button>
            <button
              onClick={() => setActiveTab('status')}
              className="px-3 py-1 text-slate-400 hover:text-slate-200 rounded-lg flex items-center gap-1.5 transition-all"
            >
              <User className="w-3.5 h-3.5" />
              <span>Staff</span>
            </button>
          </nav>

          {/* Right Area: Search, Time, Data Status, System Controls */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative hidden lg:block">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-36 bg-slate-950/80 border border-slate-800 rounded-lg pl-8 pr-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Live Clock */}
            <div className="font-mono text-xs font-bold text-slate-300 px-2 py-1 bg-slate-900/80 rounded border border-slate-800">
              {currentTime || '14:38'}
            </div>

            {/* Data Status Indicator */}
            <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono text-slate-400 bg-slate-950/80 px-2 py-1 rounded border border-slate-800">
              <span>DATA STATUS</span>
              <div className="flex items-center gap-0.5">
                <span className="w-1.5 h-2.5 rounded-xs bg-teal-400 animate-pulse" />
                <span className="w-1.5 h-2.5 rounded-xs bg-teal-400" />
                <span className="w-1.5 h-2.5 rounded-xs bg-teal-400" />
                <span className="w-1.5 h-2.5 rounded-xs bg-teal-400" />
                <span className="w-1.5 h-2.5 rounded-xs bg-teal-400" />
              </div>
            </div>

            {/* Quick action buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => sound.playTactileClick()}
                className="w-7 h-7 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center justify-center text-slate-300"
                title="Add Note"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => sound.playTactileClick()}
                className="w-7 h-7 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center justify-center text-slate-300"
                title="System Info"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => sound.playTactileClick()}
                className="w-7 h-7 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center justify-center text-amber-400 relative"
                title="Staff Notification"
              >
                <User className="w-3.5 h-3.5" />
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-500 text-slate-950 text-[9px] font-black rounded-full flex items-center justify-center">
                  1
                </span>
              </button>
              <button
                onClick={() => sound.playTactileClick()}
                className="w-7 h-7 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center justify-center text-rose-400 relative"
                title="Active Alerts"
              >
                <Bell className="w-3.5 h-3.5" />
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                  1
                </span>
              </button>
            </div>

            {/* Close Modal [X] */}
            <button
              onClick={() => setSelectedBedId(null)}
              className="p-1.5 hover:bg-rose-500/20 border border-slate-800 hover:border-rose-500/50 rounded-lg text-slate-400 hover:text-rose-300 transition-all ml-1 cursor-pointer"
              title="Close Inspector"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* =========================================================================
            MAIN BODY: Left Mini Rail + Center 3D Stage + Right Inspector Panel
        ========================================================================= */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* 1. LEFT MINI TOOLBAR RAIL (Matching Screenshot) */}
          <aside className="w-12 bg-[#060a14] border-r border-slate-800/80 flex flex-col items-center py-3 gap-4 shrink-0">
            <button className="p-2 rounded-lg bg-teal-500/20 text-teal-400 border border-teal-500/40 shadow-sm" title="Ward Beds">
              <Layers className="w-4 h-4" />
            </button>
            <button className="p-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-900 transition-colors" title="Patient Roster">
              <FileText className="w-4 h-4" />
            </button>
            <button className="p-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-900 transition-colors" title="Telemetry Pulse">
              <Activity className="w-4 h-4" />
            </button>
            <button className="p-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-900 transition-colors" title="Timeline History">
              <Clock className="w-4 h-4" />
            </button>
            <button className="p-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-900 transition-colors" title="Doctor & Staff Assignment">
              <User className="w-4 h-4" />
            </button>
            <button className="p-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-900 transition-colors" title="Help & Protocols">
              <Info className="w-4 h-4" />
            </button>

            <div className="mt-auto p-2 rounded-lg text-slate-600 hover:text-teal-400 transition-colors" title="3D Isometric Camera">
              <Rotate3d className="w-4 h-4" />
            </div>
          </aside>

          {/* 2. CENTER STAGE: 3D ISOMETRIC WARD ROOM VIEW */}
          <main className="flex-1 flex flex-col bg-[#050914] relative overflow-hidden">
            
            {/* Viewport Sub-Navigation Tabs: Patient Status, History, Alerts */}
            <div className="absolute top-3 right-4 z-20 flex items-center gap-3 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 shadow-xl">
              <button
                onClick={() => {
                  sound.playTactileClick();
                  setActiveTab('status');
                }}
                className={`text-xs font-bold flex items-center gap-1.5 pb-0.5 transition-all ${
                  activeTab === 'status'
                    ? 'text-teal-400 border-b-2 border-teal-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Patient Status</span>
              </button>

              <button
                onClick={() => {
                  sound.playTactileClick();
                  setActiveTab('history');
                }}
                className={`text-xs font-bold flex items-center gap-1.5 pb-0.5 transition-all ${
                  activeTab === 'history'
                    ? 'text-teal-400 border-b-2 border-teal-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>History</span>
              </button>

              <button
                onClick={() => {
                  sound.playTactileClick();
                  setActiveTab('alerts');
                }}
                className={`text-xs font-bold flex items-center gap-1.5 pb-0.5 transition-all ${
                  activeTab === 'alerts'
                    ? 'text-rose-400 border-b-2 border-rose-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>Alerts</span>
              </button>
            </div>

            {/* TAB CONTENT: 1. PATIENT STATUS (3D Isometric Room Scene) */}
            {activeTab === 'status' && (
              <div className="flex-1 w-full h-full relative flex items-center justify-center p-2 sm:p-6 overflow-hidden">
                
                {/* 3D Isometric Hospital Room Stage Container */}
                <div
                  className={`relative w-full max-w-4xl aspect-[16/10] max-h-[75vh] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-[#080e1d] transition-all duration-300 ${
                    roomAngle === 'front'
                      ? 'scale-100'
                      : roomAngle === 'top'
                      ? 'rotate-0 scale-95'
                      : 'scale-100'
                  }`}
                  style={{
                    perspective: '1200px',
                    background: 'radial-gradient(ellipse at 50% 40%, #0d1a33 0%, #060a16 100%)'
                  }}
                >
                  {/* High-Tech Floor Grid Plate */}
                  <div
                    className="absolute inset-x-4 bottom-4 top-16 rounded-xl border border-slate-700/40 opacity-40 pointer-events-none"
                    style={{
                      backgroundImage:
                        'linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)',
                      backgroundSize: '36px 36px',
                      transform: 'rotateX(58deg) rotateZ(-30deg) translateY(20px)'
                    }}
                  />

                  {/* Glass Architectural Room Walls (Isometric Representation) */}
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Left Back Wall */}
                    <div
                      className="absolute top-8 left-8 w-[55%] h-[70%] border-r border-b border-teal-500/20 bg-gradient-to-r from-teal-950/20 to-slate-900/40 backdrop-blur-[1px]"
                      style={{ transform: 'skewY(-18deg)' }}
                    />
                    {/* Right Back Wall */}
                    <div
                      className="absolute top-8 right-8 w-[55%] h-[70%] border-l border-b border-teal-500/20 bg-gradient-to-l from-teal-950/20 to-slate-900/40 backdrop-blur-[1px]"
                      style={{ transform: 'skewY(18deg)' }}
                    />
                  </div>

                  {/* ===================================================================
                      HOLOGRAPHIC TELEMETRY HUD ON ROOM WALL (Matching Screenshot Exactly)
                  =================================================================== */}
                  {showHologramHud && (
                    <div
                      className="absolute top-12 right-12 z-20 bg-slate-950/80 border border-teal-500/40 rounded-xl p-3 shadow-2xl backdrop-blur-md transition-all animate-in fade-in"
                      style={{
                        transform: 'perspective(600px) rotateY(-14deg) rotateX(4deg)',
                        boxShadow: '0 0 30px rgba(6, 182, 212, 0.15)'
                      }}
                    >
                      {/* Telemetry Metrics Grid */}
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 font-mono text-xs">
                        {/* HR Metric */}
                        <div>
                          <span className="text-[10px] text-teal-400 font-bold block flex items-center gap-1">
                            <Heart className="w-3 h-3 text-rose-500 fill-rose-500 animate-pulse" />
                            HR
                          </span>
                          <span className="text-xl font-black text-emerald-400 leading-none">
                            {heartRate}{' '}
                            <span className="text-[10px] font-normal text-emerald-500/80">bpm</span>
                          </span>
                        </div>

                        {/* SpO2 Metric */}
                        <div>
                          <span className="text-[10px] text-cyan-400 font-bold block flex items-center gap-1">
                            <Wind className="w-3 h-3 text-cyan-400" />
                            SpO2
                          </span>
                          <span className="text-xl font-black text-cyan-300 leading-none">
                            {spO2}
                            <span className="text-[10px] font-normal text-cyan-500/80">%</span>
                          </span>
                        </div>

                        {/* BP Metric */}
                        <div>
                          <span className="text-[10px] text-amber-400 font-bold block flex items-center gap-1">
                            <Droplet className="w-3 h-3 text-amber-400" />
                            BP
                          </span>
                          <span className="text-base font-black text-amber-300 leading-none">
                            {bpSys}/{bpDia}{' '}
                            <span className="text-[9px] font-normal text-amber-500/80">mmHg</span>
                          </span>
                        </div>

                        {/* Temp Metric */}
                        <div>
                          <span className="text-[10px] text-orange-400 font-bold block flex items-center gap-1">
                            <Thermometer className="w-3 h-3 text-orange-400" />
                            Temp
                          </span>
                          <span className="text-base font-black text-orange-300 leading-none">
                            {temperature}{' '}
                            <span className="text-[9px] font-normal text-orange-500/80">°C</span>
                          </span>
                        </div>
                      </div>

                      {/* Continuous Lead II Waveform Line in Hologram */}
                      <div className="mt-2 pt-2 border-t border-slate-800">
                        <div className="h-8 w-44 bg-[#030712] rounded overflow-hidden border border-teal-500/30">
                          <ECGWaveform
                            heartRate={heartRate}
                            isCritical={patient?.news2Score ? patient.news2Score >= 7 : false}
                            color="#10b981"
                            width={176}
                            height={32}
                            showDetails={false}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ===================================================================
                      ANIMATED REAL PEOPLE & BED (3D Isometric Visualization)
                  =================================================================== */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <svg
                      viewBox="0 0 700 450"
                      className="w-full h-full max-w-[650px] overflow-visible"
                    >
                      <defs>
                        {/* Glow Filter */}
                        <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur stdDeviation="6" result="blur" />
                          <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                        <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
                          <feDropShadow dx="0" dy="12" stdDeviation="8" floodColor="#000000" floodOpacity="0.6" />
                        </filter>

                        {/* Linear Gradients */}
                        <linearGradient id="bedFrameGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#334155" />
                          <stop offset="50%" stopColor="#1e293b" />
                          <stop offset="100%" stopColor="#0f172a" />
                        </linearGradient>

                        <linearGradient id="blanketGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#f8fafc" />
                          <stop offset="60%" stopColor="#e2e8f0" />
                          <stop offset="100%" stopColor="#cbd5e1" />
                        </linearGradient>

                        <linearGradient id="doctorCoatGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#ffffff" />
                          <stop offset="100%" stopColor="#e2e8f0" />
                        </linearGradient>

                        <linearGradient id="nurseScrubsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#0ea5e9" />
                          <stop offset="100%" stopColor="#0284c7" />
                        </linearGradient>
                      </defs>

                      {/* --- Bed Floor Ring Underglow --- */}
                      <ellipse
                        cx="320"
                        cy="300"
                        rx="160"
                        ry="75"
                        fill="none"
                        stroke="#06b6d4"
                        strokeWidth="3"
                        filter="url(#cyanGlow)"
                        opacity="0.85"
                        strokeDasharray="12 4"
                      >
                        <animateTransform
                          attributeName="transform"
                          type="rotate"
                          from="0 320 300"
                          to="360 320 300"
                          dur="20s"
                          repeatCount="indefinite"
                        />
                      </ellipse>

                      {/* --- Overbed Warm Lighting Fixture on Wall --- */}
                      <g transform="translate(230, 90)">
                        <rect x="0" y="0" width="160" height="18" rx="4" fill="#334155" stroke="#64748b" />
                        <rect x="10" y="4" width="140" height="10" rx="2" fill="#fef08a" opacity="0.95" />
                        {/* Light Cone */}
                        <polygon points="10,14 150,14 260,240 -30,240" fill="#fef08a" opacity="0.06" />
                      </g>

                      {/* --- Motorized Hospital Bed Structure --- */}
                      <g id="hospitalBed" filter="url(#softShadow)" transform="translate(200, 170)">
                        {/* Bed Base */}
                        <polygon points="120,40 280,110 160,170 0,100" fill="#0f172a" stroke="#334155" strokeWidth="2" />
                        <polygon points="0,100 160,170 160,195 0,125" fill="#1e293b" />
                        <polygon points="160,170 280,110 280,135 160,195" fill="#0f172a" />

                        {/* Headboard */}
                        <polygon points="10,70 70,40 70,10 10,40" fill="#334155" stroke="#475569" strokeWidth="1.5" />

                        {/* Mattress */}
                        <polygon points="110,45 270,115 155,168 5,98" fill="#1e293b" stroke="#06b6d4" strokeWidth="1.5" />

                        {/* Pillow */}
                        <polygon points="25,75 75,52 65,42 15,65" fill="#f1f5f9" rx="3" />

                        {/* Patient Head & Face */}
                        <circle cx="50" cy="58" r="14" fill="#fcd34d" />
                        <path d="M 40 50 Q 50 42 60 48" fill="#451a03" /> {/* Hair */}
                        <rect x="52" y="58" width="6" height="3" rx="1.5" fill="#38bdf8" /> {/* Nasal Cannula */}

                        {/* Animated Breathing Patient Blanket */}
                        <g id="breathingBlanket">
                          <polygon
                            points="50,75 255,125 150,170 5,115"
                            fill="url(#blanketGrad)"
                            stroke="#cbd5e1"
                            strokeWidth="1.5"
                          >
                            {/* Smooth chest breathing animation */}
                            <animateTransform
                              attributeName="transform"
                              type="scale"
                              values="1 1; 1.02 1.05; 1 1"
                              keyTimes="0; 0.5; 1"
                              dur="3s"
                              repeatCount="indefinite"
                            />
                          </polygon>
                        </g>

                        {/* Side Bed Rails */}
                        <line x1="80" y1="95" x2="200" y2="145" stroke="#06b6d4" strokeWidth="3" opacity="0.8" />
                        <line x1="100" y1="95" x2="100" y2="120" stroke="#06b6d4" strokeWidth="2" opacity="0.8" />
                        <line x1="140" y1="110" x2="140" y2="135" stroke="#06b6d4" strokeWidth="2" opacity="0.8" />
                        <line x1="180" y1="125" x2="180" y2="150" stroke="#06b6d4" strokeWidth="2" opacity="0.8" />
                      </g>

                      {/* --- Medical Ventilator / IV Pole on Left --- */}
                      <g transform="translate(130, 160)">
                        {/* Stand Pole */}
                        <line x1="40" y1="170" x2="40" y2="30" stroke="#64748b" strokeWidth="3" />
                        {/* Wheel base */}
                        <line x1="20" y1="170" x2="60" y2="170" stroke="#475569" strokeWidth="3" />

                        {/* Hanging IV Fluid Bags */}
                        <rect x="22" y="32" width="14" height="24" rx="3" fill="#38bdf8" opacity="0.75" />
                        <rect x="44" y="32" width="14" height="24" rx="3" fill="#f43f5e" opacity="0.75" />
                        
                        {/* Animated IV Drips */}
                        <circle cx="29" cy="58" r="2" fill="#38bdf8">
                          <animate attributeName="cy" values="58; 110" dur="1.2s" repeatCount="indefinite" />
                          <animate attributeName="opacity" values="1; 0" dur="1.2s" repeatCount="indefinite" />
                        </circle>

                        {/* Monitor Cart Body */}
                        <rect x="20" y="80" width="40" height="34" rx="4" fill="#1e293b" stroke="#334155" strokeWidth="2" />
                        <rect x="24" y="84" width="32" height="20" rx="2" fill="#0284c7" opacity="0.9" />
                        <line x1="26" y1="94" x2="54" y2="94" stroke="#ffffff" strokeWidth="1.5" />
                      </g>

                      {/* --- ANIMATED DOCTOR (Attending Physician checking bed) --- */}
                      <g id="doctorCharacter" transform="translate(160, 180)">
                        {/* Shadow */}
                        <ellipse cx="25" cy="155" rx="20" ry="8" fill="#000000" opacity="0.5" />

                        {/* Shoes & Legs */}
                        <rect x="18" y="115" width="6" height="40" rx="2" fill="#1e293b" />
                        <rect x="27" y="115" width="6" height="40" rx="2" fill="#1e293b" />

                        {/* Doctor White Coat (with subtle idle animation) */}
                        <path
                          d="M 12 40 L 38 40 L 42 110 L 8 110 Z"
                          fill="url(#doctorCoatGrad)"
                          stroke="#cbd5e1"
                          strokeWidth="1.5"
                        >
                          <animateTransform
                            attributeName="transform"
                            type="translate"
                            values="0 0; 0 -2; 0 0"
                            dur="4s"
                            repeatCount="indefinite"
                          />
                        </path>

                        {/* Stethoscope */}
                        <path d="M 20 40 Q 25 65 30 40" fill="none" stroke="#0284c7" strokeWidth="2" />
                        <circle cx="25" cy="62" r="3" fill="#0284c7" />

                        {/* Doctor Head & Face */}
                        <circle cx="25" cy="24" r="12" fill="#fed7aa" />
                        {/* Hair */}
                        <path d="M 14 20 Q 25 10 36 20 Q 36 28 34 32 L 16 32 Z" fill="#1e293b" />

                        {/* Clipboard / Tablet in Hand */}
                        <rect x="32" y="60" width="16" height="22" rx="2" fill="#0f172a" stroke="#06b6d4" strokeWidth="1.5" />
                        <line x1="35" y1="66" x2="45" y2="66" stroke="#06b6d4" strokeWidth="1" />
                        <line x1="35" y1="72" x2="43" y2="72" stroke="#06b6d4" strokeWidth="1" />
                      </g>

                      {/* --- ANIMATED NURSE (Primary Care Nurse on right) --- */}
                      <g id="nurseCharacter" transform="translate(480, 210)">
                        {/* Shadow */}
                        <ellipse cx="20" cy="145" rx="18" ry="7" fill="#000000" opacity="0.4" />

                        {/* Pants & Shoes */}
                        <rect x="14" y="105" width="5" height="38" rx="2" fill="#0369a1" />
                        <rect x="22" y="105" width="5" height="38" rx="2" fill="#0369a1" />

                        {/* Scrubs Top */}
                        <path
                          d="M 10 40 L 30 40 L 32 105 L 8 105 Z"
                          fill="url(#nurseScrubsGrad)"
                          stroke="#0284c7"
                          strokeWidth="1.2"
                        >
                          <animateTransform
                            attributeName="transform"
                            type="translate"
                            values="0 0; 0 -1.5; 0 0"
                            dur="3.5s"
                            repeatCount="indefinite"
                          />
                        </path>

                        {/* Nurse Head */}
                        <circle cx="20" cy="24" r="11" fill="#fde047" />
                        <path d="M 10 22 Q 20 12 30 22" fill="#78350f" stroke="#78350f" strokeWidth="3" />

                        {/* ID Badge */}
                        <rect x="13" y="50" width="6" height="8" rx="1" fill="#ffffff" />
                      </g>
                    </svg>
                  </div>

                  {/* Room Viewport Floating Bottom Controls */}
                  <div className="absolute bottom-3 right-4 z-20 flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-md p-1.5 rounded-xl border border-slate-800 shadow-xl text-xs">
                    {/* Auscultation / Heart Sound Audio Toggle */}
                    <button
                      onClick={toggleHeartSound}
                      className={`p-1.5 rounded-lg flex items-center gap-1 font-mono transition-all ${
                        isPlayingHeartSound
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 animate-pulse'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                      }`}
                      title="Simulated Stethoscope Cardiac Auscultation"
                    >
                      {isPlayingHeartSound ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                      <span className="text-[10px] hidden sm:inline">
                        {isPlayingHeartSound ? 'Audio On' : 'Stethoscope'}
                      </span>
                    </button>

                    {/* HUD Visibility Toggle */}
                    <button
                      onClick={() => {
                        sound.playTactileClick();
                        setShowHologramHud(!showHologramHud);
                      }}
                      className={`p-1.5 rounded-lg flex items-center gap-1 font-mono transition-all ${
                        showHologramHud
                          ? 'bg-teal-500/20 text-teal-300 border border-teal-500/50'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                      }`}
                      title="Toggle Wall Holographic Telemetry"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span className="text-[10px] hidden sm:inline">HUD</span>
                    </button>

                    {/* 3D Perspective Angles */}
                    <button
                      onClick={() => {
                        sound.playTactileClick();
                        setRoomAngle(roomAngle === 'isometric' ? 'front' : roomAngle === 'front' ? 'top' : 'isometric');
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-teal-300 hover:bg-slate-900 transition-colors flex items-center gap-1 font-mono text-[10px]"
                      title="Switch View Angle"
                    >
                      <Rotate3d className="w-3.5 h-3.5" />
                      <span className="uppercase">{roomAngle}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: 2. HISTORY */}
            {activeTab === 'history' && (
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
                  <h3 className="text-sm font-bold text-teal-400 mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Clinical Timeline & Medication Log
                  </h3>
                  <div className="space-y-3 font-mono text-xs">
                    <div className="flex gap-3 items-start border-l-2 border-teal-500 pl-3">
                      <span className="text-slate-500 text-[10px]">14:15</span>
                      <div>
                        <p className="text-slate-200 font-bold">Physician Rounding Completed</p>
                        <p className="text-slate-400 text-[11px] font-sans">
                          Dr. Sarah L. Chen reviewed respiratory status. Weaning protocol initiated.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3 items-start border-l-2 border-cyan-500 pl-3">
                      <span className="text-slate-500 text-[10px]">12:30</span>
                      <div>
                        <p className="text-slate-200 font-bold">IV Normal Saline 500mL Bolus</p>
                        <p className="text-slate-400 text-[11px] font-sans">
                          Administered by Nurse Mark Thompson. BP stabilized at 124/82.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3 items-start border-l-2 border-amber-500 pl-3">
                      <span className="text-slate-500 text-[10px]">09:00</span>
                      <div>
                        <p className="text-slate-200 font-bold">Arterial Blood Gas (ABG) Lab Drawn</p>
                        <p className="text-slate-400 text-[11px] font-sans">
                          pH 7.39, PaCO2 41, PaO2 94. Results nominal.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: 3. ALERTS */}
            {activeTab === 'alerts' && (
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                <div className="bg-rose-950/30 border border-rose-500/40 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-rose-300 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                      Active Clinical Alerts
                    </h3>
                    <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded text-[10px] font-mono font-bold">
                      PRIORITY 2
                    </span>
                  </div>
                  <p className="text-slate-300 text-xs font-sans">
                    Occasional premature ventricular contractions (PVCs) noted on continuous Lead II telemetry. Serum potassium checked and repleted.
                  </p>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => sound.playTurnoverSuccess()}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-bold transition-all"
                    >
                      Acknowledge Alarm
                    </button>
                    <button
                      onClick={() => sound.playRadarPing()}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-bold transition-all"
                    >
                      Escalate to Rapid Response
                    </button>
                  </div>
                </div>
              </div>
            )}
          </main>

          {/* =========================================================================
              3. RIGHT SIDEBAR: INSPECTOR PANEL (Matching Screenshot Exactly)
          ========================================================================= */}
          <aside className="w-80 sm:w-96 bg-[#070c18] border-l border-slate-800/90 flex flex-col overflow-y-auto p-4 space-y-4 shrink-0">
            
            {/* Inspector Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-mono font-black text-slate-200 uppercase tracking-wide">
                INSPECTOR: ROOM {bed.number || bed.id} (PATIENT ID: {patientMrn})
              </span>
              <button
                onClick={() => setSelectedBedId(null)}
                className="p-1 text-slate-400 hover:text-slate-200 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Patient Name with Inline Edit */}
            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase block">Patient Name</span>
              <div className="flex items-center justify-between">
                {isEditingName ? (
                  <div className="flex items-center gap-1.5 w-full">
                    <input
                      type="text"
                      value={editedPatientName}
                      onChange={e => setEditedPatientName(e.target.value)}
                      className="flex-1 bg-slate-950 border border-teal-500 rounded px-2 py-1 text-xs text-slate-100 font-bold"
                      autoFocus
                    />
                    <button
                      onClick={() => setIsEditingName(false)}
                      className="p-1 bg-teal-500 text-slate-950 rounded hover:bg-teal-400"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <h3 className="text-sm font-bold text-slate-100">{displayPatientName}</h3>
                    <button
                      onClick={() => {
                        setEditedPatientName(displayPatientName);
                        setIsEditingName(true);
                      }}
                      className="p-1 text-slate-500 hover:text-teal-400 transition-colors"
                      title="Edit Patient Name"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* ACCORDION 1: VITAL SIGNS */}
            <div className="bg-slate-900/70 rounded-xl border border-slate-800 overflow-hidden">
              <button
                onClick={() => setVitalsAccordionOpen(!vitalsAccordionOpen)}
                className="w-full p-3 flex items-center justify-between text-xs font-bold text-slate-200 bg-slate-900/90 border-b border-slate-800/80 hover:bg-slate-850 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-teal-400" />
                  <span className="uppercase tracking-wider font-mono">VITAL SIGNS</span>
                </div>
                {vitalsAccordionOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>

              {vitalsAccordionOpen && (
                <div className="p-3.5 space-y-3">
                  {/* Grid Tiles */}
                  <div className="grid grid-cols-3 gap-2 text-center font-mono">
                    <div className="bg-[#040813] p-2 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">HR</span>
                      <span className="text-emerald-400 font-bold text-sm leading-none">{heartRate}</span>
                      <span className="text-[9px] text-slate-500 block">bpm</span>
                    </div>
                    <div className="bg-[#040813] p-2 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">SpO2</span>
                      <span className="text-cyan-400 font-bold text-sm leading-none">{spO2}%</span>
                      <span className="text-[9px] text-slate-500 block">Pulse Ox</span>
                    </div>
                    <div className="bg-[#040813] p-2 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">BP</span>
                      <span className="text-amber-400 font-bold text-xs leading-none">{bpSys}/{bpDia}</span>
                      <span className="text-[9px] text-slate-500 block">mmHg</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center font-mono">
                    <div className="bg-[#040813] p-2 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">RR</span>
                      <span className="text-slate-200 font-bold text-sm leading-none">{respRate}</span>
                      <span className="text-[9px] text-slate-500 block">breaths/min</span>
                    </div>
                    <div className="bg-[#040813] p-2 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Temp</span>
                      <span className="text-orange-400 font-bold text-sm leading-none">{temperature}°C</span>
                      <span className="text-[9px] text-slate-500 block">Core Axillary</span>
                    </div>
                  </div>

                  {/* 60 FPS Lead II Oscilloscope Waveform Canvas */}
                  <div className="space-y-1 bg-[#030612] p-2.5 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                        <Heart className="w-3 h-3 text-rose-500 animate-pulse fill-rose-500" />
                        Continuous Lead II Waveform
                      </span>
                      <span className="text-slate-500">60 FPS</span>
                    </div>
                    <div className="h-12 w-full bg-[#02050e] rounded overflow-hidden border border-slate-800/80">
                      <ECGWaveform
                        heartRate={heartRate}
                        isCritical={patient?.news2Score ? patient.news2Score >= 7 : false}
                        color="#10b981"
                        width={320}
                        height={48}
                        showDetails={false}
                      />
                    </div>
                  </div>

                  {/* Alert Banner */}
                  <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center gap-2 text-[11px] text-amber-300 font-sans">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Alerts detailed with continuous vital tracking</span>
                  </div>
                </div>
              )}
            </div>

            {/* ACCORDION 2: ATTENDING DOCTOR PROFILE CARD (Requested Feature) */}
            <div className="bg-slate-900/70 rounded-xl border border-teal-500/40 overflow-hidden shadow-lg shadow-teal-950/30">
              <button
                onClick={() => setDoctorAccordionOpen(!doctorAccordionOpen)}
                className="w-full p-3 flex items-center justify-between text-xs font-bold text-slate-200 bg-slate-900/90 border-b border-slate-800/80 hover:bg-slate-850 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-3.5 h-3.5 text-teal-400" />
                  <span className="uppercase tracking-wider font-mono">ATTENDING DOCTOR PROFILE CARD</span>
                </div>
                {doctorAccordionOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>

              {doctorAccordionOpen && (
                <div className="p-3.5 space-y-3 text-xs">
                  {/* Doctor Profile Header */}
                  <div className="flex items-start gap-3">
                    {/* Doctor Avatar Photo */}
                    <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-teal-500/50 bg-slate-800 shrink-0 shadow-md">
                      <svg viewBox="0 0 100 100" className="w-full h-full">
                        <rect width="100" height="100" fill="#0f172a" />
                        <circle cx="50" cy="38" r="22" fill="#fed7aa" />
                        <path d="M 28 32 Q 50 14 72 32 Q 74 48 70 54 L 30 54 Z" fill="#1e293b" />
                        {/* Doctor Coat */}
                        <path d="M 20 100 L 80 100 L 75 62 L 25 62 Z" fill="#f8fafc" />
                        <path d="M 40 62 Q 50 82 60 62" fill="none" stroke="#0284c7" strokeWidth="3" />
                      </svg>
                    </div>

                    <div className="space-y-0.5">
                      <h4 className="font-bold text-slate-100 text-sm">{doctor.name}</h4>
                      <p className="text-[10px] font-mono text-teal-400 font-bold">{doctor.degree}</p>
                      
                      <div className="pt-1">
                        <span className="text-[10px] text-slate-500 block uppercase font-mono">Specialization</span>
                        <span className="text-slate-200 text-xs font-medium leading-tight block">
                          {doctor.specialty}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Qualifications */}
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-mono">Qualifications</span>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      {doctor.qualifications}
                    </p>
                  </div>

                  {/* Doctor Status Badge (Interactive Toggle) */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase font-mono">Status</span>
                    <button
                      onClick={() => {
                        sound.playTactileClick();
                        setDoctorStatus(
                          doctorStatus === 'ON-DUTY'
                            ? 'IN SURGERY'
                            : doctorStatus === 'IN SURGERY'
                            ? 'ON-CALL'
                            : 'ON-DUTY'
                        );
                      }}
                      className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] font-extrabold tracking-wide uppercase transition-all cursor-pointer ${
                        doctorStatus === 'ON-DUTY'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/20'
                          : doctorStatus === 'IN SURGERY'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}
                      title="Click to toggle status"
                    >
                      ● {doctorStatus}
                    </button>
                  </div>

                  {/* Pager Contact & Interactive Page Button */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-mono">Pager Contact</span>
                      <span className="text-slate-200 font-mono text-xs font-bold">{doctor.pager}</span>
                    </div>

                    <button
                      onClick={() => {
                        sound.playRadarPing();
                        setIsPagerModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-teal-600 hover:text-slate-950 text-teal-300 font-bold rounded-lg text-xs transition-all flex items-center gap-1.5 border border-slate-700 hover:border-teal-400 cursor-pointer shadow-md"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Page Dr. Chen</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ACCORDION 3: PRIMARY NURSE CERTIFICATION DETAILS */}
            <div className="bg-slate-900/70 rounded-xl border border-slate-800 overflow-hidden">
              <button
                onClick={() => setNurseAccordionOpen(!nurseAccordionOpen)}
                className="w-full p-3 flex items-center justify-between text-xs font-bold text-slate-200 bg-slate-900/90 border-b border-slate-800/80 hover:bg-slate-850 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="uppercase tracking-wider font-mono">PRIMARY NURSE CERTIFICATION DETAILS</span>
                </div>
                {nurseAccordionOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>

              {nurseAccordionOpen && (
                <div className="p-3.5 space-y-2.5 text-xs">
                  <div>
                    <h4 className="font-bold text-slate-100 text-xs">{nurse.name}</h4>
                    <p className="text-[10px] text-slate-400 font-mono">{nurse.shift}</p>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-mono block">Certifications</span>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {nurse.certifications.map((cert: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-mono text-[10px] font-bold"
                        >
                          ✓ {cert}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* BED MANAGEMENT & ACTIONS (Discharge, Status Override, Turnover) */}
            <div className="pt-2 border-t border-slate-800 space-y-3 text-xs">
              {/* Ghost Bed Turnover Action */}
              {bed.status === 'ghost' && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg space-y-2">
                  <div className="flex items-center justify-between text-amber-300">
                    <span className="font-semibold">Ghost Bed Action Required</span>
                    <span className="text-[10px] font-mono">Pressure: 0 kg</span>
                  </div>
                  <p className="text-slate-300 text-[11px]">
                    The bed is physically empty. Dispatch cleaning turnover to release to Available in 3 minutes.
                  </p>
                  <button
                    onClick={() => {
                      turnoverGhostBed(bed.id);
                      setSelectedBedId(null);
                    }}
                    className="w-full py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded flex items-center justify-center gap-1.5 transition-all shadow-md shadow-teal-500/20"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Dispatch Rapid Cleaning Turnover
                  </button>
                </div>
              )}

              {/* Status Override */}
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-2">
                <span className="font-semibold text-slate-300 block text-xs">Manual Bed Status Override</span>
                <div className="grid grid-cols-3 gap-1">
                  {(['available', 'occupied', 'ghost', 'cleaning', 'reserved'] as BedStatus[]).map(status => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setOverrideStatus(status)}
                      className={`py-1 px-1.5 rounded text-[10px] font-mono uppercase transition-all capitalize ${
                        overrideStatus === status
                          ? 'bg-teal-500 text-slate-950 font-bold'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  value={overrideNotes}
                  onChange={e => setOverrideNotes(e.target.value)}
                  placeholder="Override rationale..."
                  className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-xs text-slate-100"
                />

                <button
                  onClick={handleApplyOverride}
                  disabled={!overrideStatus}
                  className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-teal-300 font-semibold rounded transition-colors"
                >
                  Apply Status Override
                </button>
              </div>

              {/* Patient Clinical Discharge */}
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-2">
                <span className="font-semibold text-slate-300 block text-xs">Discharge or Transfer Patient</span>
                <select
                  value={dischargeReason}
                  onChange={e => setDischargeReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-slate-200 text-xs"
                >
                  <option value="Routine Clinical Discharge">Routine Clinical Discharge</option>
                  <option value="Transfer to Another Facility">Transfer to Another Facility</option>
                  <option value="Against Medical Advice (AMA)">Against Medical Advice (AMA)</option>
                  <option value="Entered in Error (Soft Delete)">Entered in Error (Soft Delete)</option>
                </select>
                <button
                  onClick={handleDischarge}
                  className="w-full py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-rose-600/20"
                >
                  <UserX className="w-3.5 h-3.5" /> Discharge Patient
                </button>
              </div>
            </div>
          </aside>
        </div>

        {/* =========================================================================
            INTERACTIVE PAGER ALERT DISPATCH MODAL
        ========================================================================= */}
        {isPagerModalOpen && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
            <div className="bg-[#0f172a] border border-teal-500 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-teal-400 font-bold">
                  <Radio className="w-4 h-4 animate-ping" />
                  <span>Dispatch Urgent Pager Alert</span>
                </div>
                <button
                  onClick={() => setIsPagerModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {pagerDispatched ? (
                <div className="p-4 bg-emerald-500/20 border border-emerald-500/50 rounded-xl text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto animate-bounce" />
                  <h4 className="font-bold text-emerald-300 text-sm">Pager Alert Dispatched!</h4>
                  <p className="text-slate-300 text-xs font-mono">
                    Terminal ID: PR-904 • Dr. Sarah L. Chen notified at {doctor.pager}
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-mono text-slate-400 block">Recipient Doctor</label>
                    <div className="p-2 bg-slate-950 rounded border border-slate-800 text-xs font-bold text-teal-300">
                      {doctor.name} ({doctor.degree}) — {doctor.pager}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-mono text-slate-400 block">Urgent Clinical Message</label>
                    <textarea
                      value={pagerMessage}
                      onChange={e => setPagerMessage(e.target.value)}
                      rows={3}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setIsPagerModalOpen(false)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSendPager}
                      className="px-4 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-lg shadow-teal-500/30"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Transmit Pager Alert</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

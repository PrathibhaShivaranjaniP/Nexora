import React, { useState, useEffect, useMemo } from 'react';
import { useHospitalStore } from '../../store/hospitalStore';
import {
  RealHospital,
  getHospitalRouteDetails,
  getHospitalBedWaitTimes
} from '../../data/realDistrictsData';
import { InAppStreetMapEngine } from './InAppStreetMapEngine';
import {
  ArrowLeft,
  Navigation,
  Route,
  Volume2,
  VolumeX,
  Zap,
  LocateFixed,
  ShieldCheck,
  Activity,
  ArrowRight,
  Eye,
  Clock,
  Radio,
  Hospital,
  AlertTriangle,
  ExternalLink,
  Map,
  CheckCircle2
} from 'lucide-react';
import { sound } from '../../utils/audioEngine';

interface EmergencyRoutePageProps {
  onBackToDistrict?: () => void;
  onEnterWard?: () => void;
  onOpenComms?: (targetId?: string) => void;
}

export const EmergencyRoutePage: React.FC<EmergencyRoutePageProps> = ({
  onBackToDistrict,
  onEnterWard,
  onOpenComms
}) => {
  const {
    currentDistrict,
    selectedHospitalId,
    setSelectedHospitalId,
    setSpatialTier,
    setDedicatedRouteActive,
    actualHospitalTotalBeds,
    actualHospitalOccupiedBeds,
    actualHospitalAvailableBeds,
    actualHospitalIcuBeds,
    actualHospitalIcuOccupied,
    actualHospitalOccupancyPercent,
    activeReservation,
    openReservationModal,
    language,
    t
  } = useHospitalStore();

  const hospitals = currentDistrict.hospitals;
  const defaultDest = hospitals.find(h => h.id === selectedHospitalId) || hospitals[1] || hospitals[0];

  const [activeDestId, setActiveDestId] = useState<string>(defaultDest.id);
  const [routeViewMode, setRouteViewMode] = useState<'street' | 'vector'>('street');
  const [originType, setOriginType] = useState<'dispatch' | 'gps'>('dispatch');
  const [gpsIncidentCoords, setGpsIncidentCoords] = useState<{ x: number; y: number; label: string } | null>(null);
  const [gpsRealCoords, setGpsRealCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [ambulanceProgress, setAmbulanceProgress] = useState(0.18);
  const [isSpeakingRoute, setIsSpeakingRoute] = useState(false);

  // Sync selectedHospitalId with activeDestId
  useEffect(() => {
    if (selectedHospitalId && selectedHospitalId !== activeDestId) {
      setActiveDestId(selectedHospitalId);
    }
  }, [selectedHospitalId]);

  const targetHospital: RealHospital = useMemo(() => {
    return hospitals.find(h => h.id === activeDestId) || defaultDest;
  }, [hospitals, activeDestId, defaultDest]);

  // Route details
  const routeDetails = useMemo(() => {
    return getHospitalRouteDetails(targetHospital, currentDistrict.name);
  }, [targetHospital, currentDistrict.name]);

  // Real-time Bed Reservation Wait Times
  const waitTimes = useMemo(() => {
    return getHospitalBedWaitTimes(targetHospital);
  }, [targetHospital]);

  // Real-world Google Maps Coordinates
  const originLat = originType === 'gps' && gpsRealCoords ? gpsRealCoords.lat : (hospitals[0]?.coordinates.lat || currentDistrict.globeCoordinates.lat);
  const originLng = originType === 'gps' && gpsRealCoords ? gpsRealCoords.lng : (hospitals[0]?.coordinates.lng || currentDistrict.globeCoordinates.lng);
  const destLat = targetHospital.coordinates.lat;
  const destLng = targetHospital.coordinates.lng;

  // Origin point
  const originCoords = useMemo(() => {
    if (originType === 'gps' && gpsIncidentCoords) {
      return gpsIncidentCoords;
    }
    return {
      x: 120,
      y: 420,
      label: language === 'ta' ? '108 அவசர தொடக்க மையம்' : '108 EMS Central Dispatch Hub'
    };
  }, [originType, gpsIncidentCoords, language]);

  // Destination point
  const destCoords = useMemo(() => {
    return {
      x: targetHospital.coordinates.x * 1.05 + 40,
      y: targetHospital.coordinates.y * 0.95 + 40
    };
  }, [targetHospital]);

  // Dynamic Parabolic Bézier Highway Ribbon
  const { activeRoutePath, midX, midY, ambX, ambY, waypoints } = useMemo(() => {
    const x0 = originCoords.x;
    const y0 = originCoords.y;
    const x1 = destCoords.x;
    const y1 = destCoords.y;

    const dx = x1 - x0;
    const dy = y1 - y0;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const perpX = -dy / (dist || 1);
    const perpY = dx / (dist || 1);
    const curvature = 45;

    const mx = (x0 + x1) / 2 + perpX * curvature;
    const my = (y0 + y1) / 2 + perpY * curvature;

    const path = `M ${x0} ${y0} Q ${mx} ${my}, ${x1} ${y1}`;

    const t = ambulanceProgress;
    const ax = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * mx + t * t * x1;
    const ay = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * my + t * t * y1;

    // Intermediate Traffic Signal Intersections along the curve
    const wpList = [0.25, 0.5, 0.75].map((prog, idx) => {
      const px = (1 - prog) * (1 - prog) * x0 + 2 * (1 - prog) * prog * mx + prog * prog * x1;
      const py = (1 - prog) * (1 - prog) * y0 + 2 * (1 - prog) * prog * my + prog * prog * y1;
      return {
        id: idx + 1,
        x: px,
        y: py,
        label: `Signal ${idx + 1}`
      };
    });

    return {
      activeRoutePath: path,
      midX: mx,
      midY: my,
      ambX: ax,
      ambY: ay,
      waypoints: wpList
    };
  }, [originCoords, destCoords, ambulanceProgress]);

  // Smooth ambulance loop
  useEffect(() => {
    const interval = setInterval(() => {
      setAmbulanceProgress(prev => (prev >= 0.98 ? 0.02 : prev + 0.006));
    }, 45);
    return () => clearInterval(interval);
  }, []);

  // Cleanup speech
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Geolocation trigger
  const handleDetectGps = () => {
    sound.playRadarPing();
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setIsLocating(false);
          setOriginType('gps');
          setGpsRealCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          const offX = (pos.coords.longitude % 1) * 150;
          const offY = (pos.coords.latitude % 1) * 150;
          setGpsIncidentCoords({
            x: Math.round(100 + offX),
            y: Math.round(380 + offY),
            label: language === 'ta' ? 'அழைப்பாளர் நேரலை ஜிபிஎஸ்' : 'Caller Live GPS Incident Scene'
          });
        },
        () => {
          setIsLocating(false);
          setOriginType('gps');
          setGpsIncidentCoords({
            x: 140,
            y: 440,
            label: language === 'ta' ? 'சம்பவ இடம் (அழைப்பாளர்)' : 'Caller Incident Scene (108 GPS)'
          });
        },
        { timeout: 3000 }
      );
    } else {
      setIsLocating(false);
      setOriginType('gps');
      setGpsIncidentCoords({
        x: 140,
        y: 440,
        label: language === 'ta' ? 'சம்பவ இடம் (அழைப்பாளர்)' : 'Caller Incident Scene (108 GPS)'
      });
    }
  };

  // Voice Route Spoken Guidance
  const speakRoute = () => {
    sound.playTactileClick();
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    if (isSpeakingRoute) {
      window.speechSynthesis.cancel();
      setIsSpeakingRoute(false);
      return;
    }

    const introText =
      language === 'ta'
        ? `108 அவசர ஊர்தி வழிசெலுத்தல். இலக்கு: ${targetHospital.name}. தூரம் ${routeDetails.distanceKm} கிலோமீட்டர். எதிர்பார்க்கப்படும் நேரம் ${routeDetails.ambulanceTransitMinutes} நிமிடங்கள். கிரீன் வேவ் போக்குவரத்து முன்னுரிமை இயக்கப்பட்டது.`
        : `108 Emergency Route Activated to ${targetHospital.name}. Total distance is ${routeDetails.distanceKm} kilometers with an estimated arrival time of ${routeDetails.ambulanceTransitMinutes} minutes. Green wave traffic signal preemption is active.`;

    const instructionsText = routeDetails.steps
      .map(s => (language === 'ta' ? s.instructionTa : s.instructionEn))
      .join('. ');

    const fullUtterance = new SpeechSynthesisUtterance(`${introText}. ${instructionsText}`);
    fullUtterance.rate = 0.95;
    fullUtterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    if (language === 'ta') {
      const tamilVoice = voices.find(v => v.lang.includes('ta') || v.lang.includes('Tamil'));
      if (tamilVoice) fullUtterance.voice = tamilVoice;
    }

    fullUtterance.onstart = () => setIsSpeakingRoute(true);
    fullUtterance.onend = () => setIsSpeakingRoute(false);
    fullUtterance.onerror = () => setIsSpeakingRoute(false);

    window.speechSynthesis.speak(fullUtterance);
  };

  // Back to District Map
  const handleBack = () => {
    sound.playTactileClick();
    setDedicatedRouteActive(false);
    setSpatialTier(2);
    if (onBackToDistrict) onBackToDistrict();
  };

  // Enter Hospital 3D Ward Cutaway
  const handleEnterWard = () => {
    sound.playRadarPing();
    setSelectedHospitalId(targetHospital.id);
    setDedicatedRouteActive(false);
    setSpatialTier(3);
    if (onEnterWard) onEnterWard();
  };

  return (
    <div className="w-full h-full min-h-[calc(100vh-190px)] flex flex-col bg-[#030712] rounded-2xl border border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      {/* ─────────────────────────────────────────────────────────────
          TOP CONTROL BAR & ROUTE DISPATCH HUD
         ───────────────────────────────────────────────────────────── */}
      <div className="bg-slate-900/95 backdrop-blur-xl border-b border-slate-800/90 p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xl">
        {/* Left: Back & Route Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 hover:text-cyan-300 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition-all shadow-md"
          >
            <ArrowLeft className="w-4 h-4 text-cyan-400" />
            <span>{t.backToDistrict || 'Back to District Map'}</span>
          </button>

          <div className="h-5 w-px bg-slate-700 hidden sm:block" />

          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <h2 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
                <span>{t.routeNavigatorTitle || '108 EMERGENCY ROUTE THEATER'}</span>
                <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[9.5px] px-2 py-0.2 rounded-full font-mono">
                  GREEN WAVE OVERRIDE
                </span>
              </h2>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              {currentDistrict.name} District • Priority 1 Trauma Corridor • Dedicated Satellite View
            </p>
          </div>
        </div>

        {/* Center/Right: Origin & Destination Selector Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Origin Mode Toggle */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => {
                sound.playTactileClick();
                setOriginType('dispatch');
              }}
              className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition-all ${
                originType === 'dispatch'
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🚨 108 Dispatch HQ
            </button>
            <button
              onClick={handleDetectGps}
              className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition-all flex items-center gap-1 ${
                originType === 'gps'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LocateFixed className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? 'Locating...' : 'Caller GPS Scene'}</span>
            </button>
          </div>

          {/* Hospital Switcher */}
          <select
            value={activeDestId}
            onChange={e => {
              sound.playTactileClick();
              setActiveDestId(e.target.value);
              setSelectedHospitalId(e.target.value);
            }}
            className="bg-slate-950 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl px-3 py-1.5 focus:outline-none focus:border-cyan-400 cursor-pointer shadow-md"
          >
            {hospitals.map(h => (
              <option key={h.id} value={h.id}>
                🏥 {h.name} ({h.traumaLevel})
              </option>
            ))}
          </select>

          {/* Voice Guide Button */}
          <button
            onClick={speakRoute}
            className={`p-2 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-bold ${
              isSpeakingRoute
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 animate-pulse'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-cyan-300 hover:border-slate-700'
            }`}
            title="Voice Route Directions"
          >
            {isSpeakingRoute ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isSpeakingRoute ? 'Stop Voice' : 'Voice Guide'}</span>
          </button>

          {/* Tactical 108 Dispatch / Trauma Call Button */}
          <button
            onClick={() => {
              sound.playRadioChirp();
              if (onOpenComms) onOpenComms('hosp-er-chief');
            }}
            className="px-3 py-1.5 bg-gradient-to-r from-rose-950 via-slate-900 to-amber-950 hover:from-rose-900 hover:to-amber-900 text-rose-300 hover:text-rose-100 border border-rose-500/40 hover:border-rose-400 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-950/40 transition-all cursor-pointer group"
            title="Radio Call Trauma Bay Resuscitation Chief"
          >
            <Radio className="w-3.5 h-3.5 text-rose-400 group-hover:animate-pulse" />
            <span className="hidden md:inline">Call Trauma Desk</span>
            <span className="md:hidden">Call</span>
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
          </button>

          {/* Map View Mode Switcher */}
          {/* Map View Switcher: In-App Street GPS vs Satellite Vector */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => {
                sound.playTactileClick();
                setRouteViewMode('street');
              }}
              className={`px-3 py-1 rounded-lg font-mono text-[11px] flex items-center gap-1.5 transition-all cursor-pointer ${
                routeViewMode === 'street'
                  ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Map className="w-3.5 h-3.5" />
              <span>{language === 'ta' ? 'உள்ளமை வீதி வரைபடம்' : 'In-App Street Map'}</span>
            </button>
            <button
              onClick={() => {
                sound.playRadarPing();
                setRouteViewMode('vector');
              }}
              className={`px-3 py-1 rounded-lg font-mono text-[11px] flex items-center gap-1.5 transition-all cursor-pointer ${
                routeViewMode === 'vector'
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🛰️</span>
              <span>{language === 'ta' ? 'திசையன் வழித்தடம்' : 'Satellite Vector'}</span>
            </button>
          </div>

          {/* Direct Ward Cutaway Jump */}
          <button
            onClick={handleEnterWard}
            className="px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-slate-950 font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-900/40 transition-all cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{t.enterWardCutaway || 'Enter 3D Ward'}</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MAIN CONTENT THEATER: 70% ULTRA-WIDE MAP + 30% DISPATCH PANEL
         ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden relative">
        {/* LEFT 70%: NATIVE IN-APP STREET GPS MAP OR SATELLITE VECTOR */}
        <div className="lg:col-span-8 bg-[#020612] relative flex flex-col items-center justify-center p-2 sm:p-4 overflow-hidden select-none border-b lg:border-b-0 lg:border-r border-slate-800/80">
          {routeViewMode === 'street' ? (
            <InAppStreetMapEngine
              hospital={targetHospital}
              originCoords={originCoords}
              originRealCoords={{ lat: originLat, lng: originLng }}
              onEnterWard={handleEnterWard}
            />
          ) : (
            <div className="w-full h-full relative flex items-center justify-center">
              <svg
                viewBox="0 0 880 560"
                className="w-full h-full max-h-[750px] drop-shadow-2xl"
                preserveAspectRatio="xMidYMid meet"
              >
            <defs>
              {/* Radar Grid Pattern */}
              <pattern id="routeTheaterGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <rect width="40" height="40" fill="none" stroke="#06b6d4" strokeWidth="0.4" opacity="0.08" />
                <circle cx="20" cy="20" r="1" fill="#06b6d4" opacity="0.18" />
              </pattern>

              {/* Highway Corridor Glowing Linear Gradient */}
              <linearGradient id="routeCorridorGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
                <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="1" />
              </linearGradient>

              {/* Radial Beacon Gradient */}
              <radialGradient id="destAura" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Background High-Tech Grid */}
            <rect width="880" height="560" fill="#040916" />
            <rect width="880" height="560" fill="url(#routeTheaterGrid)" />

            {/* District Boundary Holographic Silhouette */}
            <path
              d="M 60 80 Q 240 40, 480 70 T 820 120 Q 840 340, 780 480 T 420 520 Q 140 500, 60 380 Z"
              fill="#06122a"
              stroke="#06b6d4"
              strokeWidth="1.2"
              strokeDasharray="6 4"
              opacity="0.25"
            />

            {/* Secondary District Road Network Underlay */}
            <path
              d="M 100 440 L 320 360 L 520 280 L 760 180 M 320 360 L 400 160 L 640 140 M 320 360 L 260 180"
              fill="none"
              stroke="#1e293b"
              strokeWidth="2"
              strokeDasharray="4 4"
              opacity="0.6"
            />

            {/* 1. PRIMARY EMERGENCY CORRIDOR: Thick Halation Base */}
            <path
              d={activeRoutePath}
              fill="none"
              stroke="#0284c7"
              strokeWidth="18"
              opacity="0.18"
              strokeLinecap="round"
            />

            {/* 2. PRIMARY EMERGENCY CORRIDOR: Pulsing Neon Highway Ribbon */}
            <path
              d={activeRoutePath}
              fill="none"
              stroke="url(#routeCorridorGlow)"
              strokeWidth="6"
              strokeLinecap="round"
              filter="drop-shadow(0 0 10px #06b6d4)"
            />

            {/* 3. High-Velocity Flow Particles (Animated Dash) */}
            <path
              d={activeRoutePath}
              fill="none"
              stroke="#f0f9ff"
              strokeWidth="2.5"
              strokeDasharray="14 18"
              strokeLinecap="round"
              opacity="0.9"
            >
              <animate attributeName="stroke-dashoffset" values="64;0" dur="1.1s" repeatCount="indefinite" />
            </path>

            {/* Traffic Signal Nodes along the Highway */}
            {waypoints.map(wp => (
              <g key={wp.id} transform={`translate(${wp.x}, ${wp.y})`}>
                <circle r="7" fill="#040c1a" stroke="#10b981" strokeWidth="1.5" />
                <circle r="3" fill="#10b981">
                  <animate attributeName="opacity" values="1;0.4;1" dur="1s" repeatCount="indefinite" />
                </circle>
                <text x="0" y="16" fill="#10b981" fontSize="7" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                  🚦 GREEN WAVE
                </text>
              </g>
            ))}

            {/* Highway Midpoint Telemetry Banner */}
            <g transform={`translate(${midX}, ${midY - 20})`}>
              <rect
                x="-120"
                y="-14"
                width="240"
                height="28"
                rx="6"
                fill="#050e20"
                stroke="#06b6d4"
                strokeWidth="1.2"
                filter="drop-shadow(0 4px 12px rgba(0,0,0,0.85))"
              />
              <text x="0" y="4" fill="#38bdf8" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                🛣️ {routeDetails.distanceKm} KM CORRIDOR • {routeDetails.ambulanceTransitMinutes}m ETA • GREEN WAVE
              </text>
            </g>

            {/* ORIGIN PIN: 108 Central Dispatch HQ or Incident Caller Scene */}
            <g transform={`translate(${originCoords.x}, ${originCoords.y})`}>
              <circle r="26" fill="none" stroke="#38bdf8" strokeWidth="1.5" opacity="0.6">
                <animate attributeName="r" values="16;40;16" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.8;0.05;0.8" dur="2s" repeatCount="indefinite" />
              </circle>
              <circle r="16" fill="#051024" stroke="#38bdf8" strokeWidth="2.5" filter="drop-shadow(0 0 10px #06b6d4)" />
              <text x="0" y="5" fontSize="12" textAnchor="middle">
                {originType === 'gps' ? '📍' : '🚨'}
              </text>
              <g transform="translate(0, -22)">
                <rect x="-85" y="-10" width="170" height="20" rx="5" fill="#050b18" stroke="#38bdf8" strokeWidth="1" />
                <text x="0" y="4" fill="#7dd3fc" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                  {originCoords.label}
                </text>
              </g>
            </g>

            {/* ANIMATED 108 ALS AMBULANCE ON HIGHWAY */}
            <g transform={`translate(${ambX}, ${ambY})`}>
              {/* Siren Pulse Rings */}
              <circle r="20" fill="#38bdf8" opacity="0.35">
                <animate attributeName="r" values="12;32;12" dur="0.8s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.5;0.05;0.5" dur="0.8s" repeatCount="indefinite" />
              </circle>
              <circle r="12" fill="#ef4444" opacity="0.3">
                <animate attributeName="r" values="8;24;8" dur="0.8s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.6;0.05;0.6" dur="0.8s" repeatCount="indefinite" />
              </circle>

              {/* Vehicle Body Badge */}
              <rect x="-16" y="-10" width="32" height="20" rx="5" fill="#071020" stroke="#38bdf8" strokeWidth="2" />
              <text x="0" y="5" fontSize="12" textAnchor="middle">
                🚑
              </text>

              {/* Speed & Progress Floating Tag */}
              <g transform="translate(0, 20)">
                <rect x="-55" y="-8" width="110" height="16" rx="4" fill="#091326" stroke="#0284c7" strokeWidth="1" />
                <text x="0" y="4" fill="#38bdf8" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                  108 ALS • 68 km/h [{Math.round(ambulanceProgress * 100)}%]
                </text>
              </g>
            </g>

            {/* ALL DISTRICT HOSPITALS (Interactive Nodes) */}
            {hospitals.map(hosp => {
              const isTarget = hosp.id === targetHospital.id;
              const hX = hosp.coordinates.x * 1.05 + 40;
              const hY = hosp.coordinates.y * 0.95 + 40;
              const occPercent = Math.round((hosp.occupiedBeds / hosp.totalBeds) * 100);

              return (
                <g
                  key={hosp.id}
                  transform={`translate(${hX}, ${hY})`}
                  onClick={() => {
                    sound.playTactileClick();
                    setActiveDestId(hosp.id);
                    setSelectedHospitalId(hosp.id);
                  }}
                  className="cursor-pointer group"
                >
                  {/* Target Hospital Rotating Lock Reticle */}
                  {isTarget && (
                    <g>
                      <circle r="38" fill="none" stroke="#38bdf8" strokeWidth="1.8" strokeDasharray="6 4">
                        <animateTransform
                          attributeName="transform"
                          type="rotate"
                          from="0"
                          to="360"
                          dur="6s"
                          repeatCount="indefinite"
                        />
                      </circle>
                      <circle r="46" fill="none" stroke="#38bdf8" strokeWidth="1" opacity="0.4">
                        <animate attributeName="r" values="38;56;38" dur="2.2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.6;0.05;0.6" dur="2.2s" repeatCount="indefinite" />
                      </circle>
                    </g>
                  )}

                  {/* Hospital Cylinder */}
                  <circle
                    r="20"
                    fill="#071020"
                    stroke={isTarget ? '#38bdf8' : hosp.traumaLevel.includes('Apex') ? '#ef4444' : '#10b981'}
                    strokeWidth={isTarget ? '3.5' : '2'}
                    filter={`drop-shadow(0 0 12px ${isTarget ? '#38bdf8' : '#10b981'}80)`}
                  />

                  <text x="0" y="6" fontSize="14" textAnchor="middle">
                    🏥
                  </text>

                  {/* Target Crosshair */}
                  {isTarget && (
                    <text x="0" y="-24" fontSize="11" textAnchor="middle" fill="#38bdf8">
                      🎯
                    </text>
                  )}

                  {/* Hospital Floating Info Tag */}
                  <g transform="translate(0, 32)">
                    <rect
                      x="-70"
                      y="-10"
                      width="140"
                      height="24"
                      rx="5"
                      fill="#070f20"
                      stroke={isTarget ? '#38bdf8' : '#334155'}
                      strokeWidth={isTarget ? '1.5' : '1'}
                    />
                    <text
                      x="0"
                      y="1"
                      fill={isTarget ? '#f8fafc' : '#cbd5e1'}
                      fontSize="8.5"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {hosp.name.length > 20 ? hosp.name.substring(0, 18) + '...' : hosp.name}
                    </text>
                    <text
                      x="0"
                      y="10"
                      fill={occPercent > 90 ? '#f87171' : '#34d399'}
                      fontSize="7.5"
                      fontFamily="monospace"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {hosp.occupiedBeds}/{hosp.totalBeds} Beds ({occPercent}%)
                    </text>
                  </g>
                </g>
              );
            })}
          </svg>

              {/* Satellite Map Bottom Legend */}
              <div className="absolute bottom-4 left-4 z-10 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/80 text-[11px] text-slate-300 flex items-center gap-4 shadow-xl">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#06b6d4]" />
                  <span className="font-mono text-cyan-300">108 Siren Highway</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
                  <span>Green Wave Intersections</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_#ef4444]" />
                  <span>Apex Trauma Center</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT 30%: DISPATCH HUD, REAL-TIME BED TELEMETRY & WAYPOINTS */}
        <div className="lg:col-span-4 bg-[#050914] p-4 flex flex-col justify-between space-y-4 overflow-y-auto">
          {/* Section 1: Real-Time Destination Hospital Card */}
          <div className="bg-slate-900/90 border border-slate-700/90 rounded-2xl p-4 space-y-3 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono text-cyan-400 font-bold flex items-center gap-1">
                  <Hospital className="w-3.5 h-3.5" /> Destination Hospital
                </span>
                <h3 className="text-sm font-bold text-slate-100 leading-snug">{targetHospital.name}</h3>
                <p className="text-[10.5px] text-slate-400">{targetHospital.ownership} • {currentDistrict.name}</p>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                  targetHospital.traumaLevel.includes('Apex')
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}
              >
                {targetHospital.traumaLevel}
              </span>
            </div>

            {/* Real-Time Live Bed Data Grid */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800 text-xs">
              <div className="bg-slate-950 p-2 rounded-xl border border-slate-800/80">
                <div className="text-[9.5px] text-slate-400">Total Actual Beds</div>
                <div className="text-sm font-bold text-slate-100 font-mono">{actualHospitalTotalBeds.toLocaleString()}</div>
                <div className="text-[9px] text-slate-500">Certified Capacity</div>
              </div>
              <div className="bg-slate-950 p-2 rounded-xl border border-slate-800/80">
                <div className="text-[9.5px] text-slate-400">Live Available Beds</div>
                <div className="text-sm font-bold text-emerald-400 font-mono">{actualHospitalAvailableBeds.toLocaleString()}</div>
                <div className="text-[9px] text-emerald-500/80">Ready for Admission</div>
              </div>
              <div className="bg-slate-950 p-2 rounded-xl border border-slate-800/80">
                <div className="text-[9.5px] text-slate-400">Critical ICU Beds</div>
                <div className="text-sm font-bold text-amber-400 font-mono">
                  {actualHospitalIcuBeds - actualHospitalIcuOccupied} / {actualHospitalIcuBeds}
                </div>
                <div className="text-[9px] text-amber-500/80">
                  {Math.round((actualHospitalIcuOccupied / actualHospitalIcuBeds) * 100)}% Saturation
                </div>
              </div>
              <div className="bg-slate-950 p-2 rounded-xl border border-slate-800/80">
                <div className="text-[9.5px] text-slate-400">Emergency Wait</div>
                <div className="text-sm font-bold text-cyan-300 font-mono">{targetHospital.edWaitMinutes} mins</div>
                <div className="text-[9px] text-cyan-500/80">Pre-Triage Notified</div>
              </div>
            </div>

            {/* IoT Bed Sensor Indicator */}
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                IoT Bed Pressure Sensors Live
              </span>
              <span className="text-slate-300 font-bold">{actualHospitalOccupancyPercent}% Census</span>
            </div>

            {/* Live Bed Reservation Wait Times & Queue System */}
            <div className="pt-2.5 border-t border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                <span className="text-cyan-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {language === 'ta' ? 'படுக்கை முன்பதிவு காத்திருப்பு:' : 'Bed Reservation Wait Times:'}
                </span>
                <span className="text-emerald-400">
                  {language === 'ta' ? '45 நிமிடம் நிறுத்திவைப்பு' : '45m Guaranteed Hold'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1.5 font-mono text-center text-[10px]">
                <div className="bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[8.5px]">ED Bay</span>
                  <span className={`font-bold ${waitTimes.ed.waitTimeMinutes === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {waitTimes.ed.waitTimeMinutes === 0 ? '0m (Instant)' : `${waitTimes.ed.waitTimeMinutes}m`}
                  </span>
                </div>
                <div className="bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[8.5px]">ICU Bed</span>
                  <span className="font-bold text-cyan-300">{waitTimes.icu.waitTimeMinutes}m wait</span>
                </div>
                <div className="bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[8.5px]">Med-Surg</span>
                  <span className="font-bold text-emerald-400">{waitTimes.medSurg.waitTimeMinutes}m wait</span>
                </div>
              </div>

              {/* Reserve Bed Trigger or Active Hold Banner */}
              {activeReservation && activeReservation.hospitalId === targetHospital.id ? (
                <button
                  onClick={() => {
                    sound.playRadarPing();
                    openReservationModal(targetHospital.id);
                  }}
                  className="w-full py-2 bg-gradient-to-r from-emerald-950 to-cyan-950 border border-emerald-500/50 hover:border-emerald-400 text-emerald-200 font-bold rounded-xl text-xs flex items-center justify-between px-3 shadow-lg transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 font-mono text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>BED RESERVED: {activeReservation.id}</span>
                  </div>
                  <span className="text-amber-300 font-mono font-black text-xs">
                    {Math.floor(activeReservation.remainingSeconds / 60)}:{(activeReservation.remainingSeconds % 60).toString().padStart(2, '0')} ➔
                  </span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    sound.playRadarPing();
                    openReservationModal(targetHospital.id);
                  }}
                  className="w-full py-2 bg-gradient-to-r from-cyan-600 via-cyan-500 to-emerald-500 hover:from-cyan-500 hover:to-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-900/40 transition-all cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    {language === 'ta'
                      ? 'படுக்கை முன்பதிவு செய் (45 நிமி உத்தரவாதம்) ➔'
                      : 'Reserve Bed in Advance (45-Min Hold) ➔'}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Section 2: Turn-by-Turn Waypoints */}
          <div className="space-y-2 flex-1">
            <div className="flex items-center justify-between text-xs font-mono text-slate-300 font-bold">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <Route className="w-3.5 h-3.5" />
                {t.routeWaypoints || 'Turn-by-Turn Waypoints'}
              </span>
              <span className="text-emerald-400 text-[10px] flex items-center gap-1">
                <Zap className="w-2.5 h-2.5" /> Green Wave Override
              </span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {routeDetails.steps.map(step => (
                <div
                  key={step.stepNumber}
                  className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl flex items-start gap-2.5 text-xs shadow-sm hover:border-slate-700 transition-colors"
                >
                  <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-mono font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                    {step.stepNumber}
                  </span>
                  <div className="flex-1">
                    <p className="text-slate-200 font-medium leading-tight">
                      {language === 'ta' ? step.instructionTa : step.instructionEn}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[9.5px] font-mono text-slate-400">
                      <span className="text-cyan-400">{step.distanceKm} km</span>
                      <span>•</span>
                      <span className="text-emerald-400">Signal Green</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Live 108 ALS In-Transit Telemetry & Actions */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="bg-[#07132a] border border-cyan-500/30 rounded-xl p-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold">
                  🚑
                </div>
                <div>
                  <div className="font-bold text-slate-100">108 ALS Unit #TN-04</div>
                  <div className="text-[10px] font-mono text-cyan-400">Speed: 68 km/h • Siren Active</div>
                </div>
              </div>
              <div className="text-right font-mono">
                <div className="text-emerald-400 font-bold">{routeDetails.ambulanceTransitMinutes}m ETA</div>
                <div className="text-[9px] text-slate-400">SpO2 96% • HR 112</div>
              </div>
            </div>

            {/* Quick Radio Intercom Actions */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  sound.playRadioChirp();
                  if (onOpenComms) onOpenComms('als-ambulance-49');
                }}
                className="py-2 px-2 bg-slate-900/90 hover:bg-cyan-950/60 border border-slate-700/80 hover:border-cyan-500/50 rounded-xl text-[11px] font-bold text-cyan-300 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
                <span>Radio ALS #49</span>
              </button>
              <button
                onClick={() => {
                  sound.playRadioChirp();
                  if (onOpenComms) onOpenComms('traffic-police-control');
                }}
                className="py-2 px-2 bg-slate-900/90 hover:bg-emerald-950/60 border border-slate-700/80 hover:border-emerald-500/50 rounded-xl text-[11px] font-bold text-emerald-300 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                <span>👮 Police Traffic HQ</span>
              </button>
            </div>

            {/* Enter Hospital Ward Cutaway Button */}
            <button
              onClick={handleEnterWard}
              className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-slate-950 font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/40 transition-all"
            >
              <span>{t.enterWardCutaway || 'Enter 3D Ward Cutaway (Tier 3)'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

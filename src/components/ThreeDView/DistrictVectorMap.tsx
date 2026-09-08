import React, { useState, useEffect, useMemo } from 'react';
import { useHospitalStore } from '../../store/hospitalStore';
import {
  MapPin,
  Wind,
  Thermometer,
  ShieldCheck,
  Navigation,
  Route,
  Clock,
  ExternalLink,
  Bed,
  Radio,
  PhoneCall,
  Droplet,
  Activity,
  CheckCircle2,
  XCircle,
  Database,
  ShieldAlert,
  Users,
  HeartPulse,
  AlertTriangle,
  Stethoscope
} from 'lucide-react';
import { sound } from '../../utils/audioEngine';
import {
  RealHospital,
  getHospitalRouteDetails,
  getHospitalBedWaitTimes,
  getGoogleMapsDirectionsUrl
} from '../../data/realDistrictsData';

interface DistrictVectorMapProps {
  onOpenComms?: (targetId?: string) => void;
}

export const DistrictVectorMap: React.FC<DistrictVectorMapProps> = ({ onOpenComms }) => {
  const {
    currentDistrict,
    selectedHospitalId,
    setSelectedHospitalId,
    setSpatialTier,
    setDedicatedRouteActive,
    publicPrivateBalancingActive,
    togglePublicPrivateBalancing,
    activeReservation,
    openReservationModal,
    openOxygenModal,
    openBloodModal,
    oxygenData,
    language,
    bedRequests,
    approveBedRequest,
    rejectBedRequest
  } = useHospitalStore();

  const hospitals = currentDistrict.hospitals;
  const hubHospital = hospitals[0]; // Level 1 Trauma Hub (e.g. RGGGH, GRH, CMCH, GTMCH)

  // Routing State
  const [activeDestHospId, setActiveDestHospId] = useState<string>(
    selectedHospitalId || hospitals[1]?.id || hospitals[0]?.id
  );
  const [etaSeconds, setEtaSeconds] = useState(480);

  // Sync selected hospital with active destination
  useEffect(() => {
    if (selectedHospitalId && selectedHospitalId !== activeDestHospId) {
      setActiveDestHospId(selectedHospitalId);
    }
  }, [selectedHospitalId]);

  // Destination hospital object
  const destHospital = useMemo(() => {
    return hospitals.find(h => h.id === activeDestHospId) || hospitals[1] || hospitals[0];
  }, [hospitals, activeDestHospId]);

  // Route calculation
  const routeDetails = useMemo(() => {
    return getHospitalRouteDetails(destHospital, currentDistrict.name);
  }, [destHospital, currentDistrict.name]);

  // Real-time Bed Reservation Wait Times
  const destWaitTimes = useMemo(() => {
    return getHospitalBedWaitTimes(destHospital);
  }, [destHospital]);

  // Real-world Google Maps Directions Deep Link
  const googleMapsDirectionsUrl = useMemo(() => {
    const originLat = currentDistrict.globeCoordinates.lat;
    const originLng = currentDistrict.globeCoordinates.lng;
    return getGoogleMapsDirectionsUrl(originLat, originLng, destHospital.coordinates.lat, destHospital.coordinates.lng);
  }, [currentDistrict, destHospital]);

  // ETA Countdown Timer
  useEffect(() => {
    const totalSeconds = (routeDetails.ambulanceTransitMinutes || 8) * 60;
    setEtaSeconds(totalSeconds);
    const interval = setInterval(() => {
      setEtaSeconds(prev => {
        if (prev === 301) {
          // Trigger voice warning at exactly 5 minutes out
          sound.speakVoiceAI("Warning. 108 Ambulance is exactly 5 minutes out. Prepare trauma bay.", true);
        }
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [destHospital.id, routeDetails.ambulanceTransitMinutes]);

  // Origin Coordinates (Dispatch HQ)
  const originCoords = useMemo(() => {
    return {
      x: hubHospital.coordinates.x - 40,
      y: hubHospital.coordinates.y - 28,
      label: language === 'ta' ? '108 கட்டுப்பாட்டு மையம்' : '108 Dispatch HQ'
    };
  }, [hubHospital, language]);

  // Clean Connecting Route Path to Destination
  const activeRoutePath = useMemo(() => {
    const x0 = originCoords.x;
    const y0 = originCoords.y;
    const x1 = destHospital.coordinates.x;
    const y1 = destHospital.coordinates.y;

    const dx = x1 - x0;
    const dy = y1 - y0;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const perpX = -dy / (dist || 1);
    const perpY = dx / (dist || 1);
    const curvature = 20;

    const mx = (x0 + x1) / 2 + perpX * curvature;
    const my = (y0 + y1) / 2 + perpY * curvature;

    return `M ${x0} ${y0} Q ${mx} ${my}, ${x1} ${y1}`;
  }, [originCoords, destHospital]);

  // Select a hospital
  const handleSelectHospital = (h: RealHospital) => {
    sound.playRadarPing();
    setActiveDestHospId(h.id);
    setSelectedHospitalId(h.id);
  };

  // Fly to Tier 3 (3D Hospital Ward)
  const handleEnterWard = (h: RealHospital) => {
    sound.playTactileClick();
    setSelectedHospitalId(h.id);
    setSpatialTier(3);
  };

  const occPercent = Math.round((destHospital.occupiedBeds / destHospital.totalBeds) * 100);

  return (
    <div className="relative w-full h-full min-h-[640px] bg-[#020510] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl select-none flex flex-col">
      {/* 1. SINGLE UNIFIED EXECUTIVE COMMAND HEADER */}
      <div className="bg-[#050b18]/95 backdrop-blur-md border-b border-slate-800/90 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs z-30">
        {/* Left: District Branding & Population */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 font-bold text-slate-100 tracking-wide">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-cyan-400 font-mono text-[11px] uppercase tracking-wider">TIER 2:</span>
            <span className="text-sm font-black text-slate-100 uppercase">{currentDistrict.name}</span>
          </div>
          <span className="text-slate-600 font-mono text-[11px]">|</span>
          <span className="text-slate-400 font-mono text-[11px] bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
            Pop: {currentDistrict.population}
          </span>
        </div>

        {/* Center: Clean Hospital Selector Chips */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800/80">
          {hospitals.map(h => {
            const isSelected = h.id === destHospital.id;
            const isApex = h.id === hubHospital.id;
            return (
              <button
                key={h.id}
                onClick={() => handleSelectHospital(h)}
                className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/50 shadow-[0_0_8px_rgba(6,182,212,0.3)] font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isApex ? 'bg-rose-400' : h.ownership === 'Government' ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                />
                <span>{h.shortName.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Environmental Telemetry & Global Actions */}
        <div className="flex items-center gap-2">
          {/* AQI & Temp */}
          <div className="hidden sm:flex items-center gap-2 bg-slate-950/60 border border-slate-800 px-2.5 py-1 rounded-lg text-[11px] font-mono">
            <div className="flex items-center gap-1">
              <Wind className="w-3 h-3 text-cyan-400" />
              <span className={currentDistrict.aqi > 120 ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                {currentDistrict.aqi}
              </span>
            </div>
            <span className="text-slate-700">•</span>
            <div className="flex items-center gap-1">
              <Thermometer className="w-3 h-3 text-amber-400" />
              <span className="text-slate-300 font-bold">{currentDistrict.temperatureC}°C</span>
            </div>
          </div>

          {/* Live 108 ETA Badge */}
          <div className="flex items-center gap-1.5 bg-orange-950/70 border border-orange-500/50 px-2.5 py-1 rounded-lg text-xs font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
            <span className="text-orange-300 font-bold">
              {etaSeconds > 0
                ? `🚑 ETA: ${Math.floor(etaSeconds / 60)}:${String(etaSeconds % 60).padStart(2, '0')}`
                : '🚑 108 ARRIVED ✅'}
            </span>
          </div>

          {/* PPP Diversion Button */}
          <button
            onClick={() => {
              sound.playTactileClick();
              togglePublicPrivateBalancing();
            }}
            className={`px-2.5 py-1 rounded-lg font-mono text-[11px] flex items-center gap-1.5 transition-all border cursor-pointer ${
              publicPrivateBalancingActive
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold">
              {publicPrivateBalancingActive ? 'PPP Active' : 'PPP Balancing'}
            </span>
          </button>

          {/* Dedicated Route Page Shortcut */}
          <button
            onClick={() => {
              sound.playRadarPing();
              setSelectedHospitalId(destHospital.id);
              setDedicatedRouteActive(true);
            }}
            className="px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold flex items-center gap-1.5 border border-cyan-500/50 bg-cyan-950/60 hover:bg-cyan-900 text-cyan-300 hover:text-cyan-100 transition-all cursor-pointer shadow-sm"
          >
            <Route className="w-3.5 h-3.5 text-cyan-400" />
            <span>{language === 'ta' ? '108 பாதை ↗' : '108 Route ↗'}</span>
          </button>
        </div>
      </div>

      {/* 2. DECLUTTERED SVG TACTICAL MAP CANVAS */}
      <div className="relative flex-1 w-full overflow-hidden bg-[#020510] flex items-center justify-center">
        <svg viewBox="100 80 560 360" preserveAspectRatio="xMidYMid meet" className="w-full h-full max-h-[80vh]">
          <defs>
            {/* Subtle Radar Sweep Gradient */}
            <linearGradient id="radarSweepGradSubtle" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
            </linearGradient>

            {/* Glowing Active Route Gradient */}
            <linearGradient id="activeRouteGradClean" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.9" />
            </linearGradient>

            {/* Emerald PPP Bypass Gradient */}
            <linearGradient id="pppBypassGradClean" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>

          {/* Minimal Tactical Grid Background */}
          {Array.from({ length: 16 }).map((_, i) => (
            <line key={`gx-${i}`} x1={i * 48} y1="0" x2={i * 48} y2="490" stroke="#081120" strokeWidth="0.6" />
          ))}
          {Array.from({ length: 11 }).map((_, i) => (
            <line key={`gy-${i}`} x1="0" y1={i * 45} x2="760" y2={i * 45} stroke="#081120" strokeWidth="0.6" />
          ))}

          {/* Subtle Ambient Radar Ring around Central Hub */}
          <g transform={`translate(${hubHospital.coordinates.x}, ${hubHospital.coordinates.y})`}>
            <circle r="90" fill="none" stroke="#06b6d4" strokeWidth="0.6" strokeDasharray="3 4" opacity="0.18" />
            <circle r="180" fill="none" stroke="#06b6d4" strokeWidth="0.6" strokeDasharray="3 4" opacity="0.12" />

            {/* Subtle Sweeping Radar Beam */}
            <g>
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0"
                to="360"
                dur="5s"
                repeatCount="indefinite"
              />
              <path d="M 0 0 L 140 -140 A 198 198 0 0 1 198 0 Z" fill="url(#radarSweepGradSubtle)" />
              <line x1="0" y1="0" x2="198" y2="0" stroke="#06b6d4" strokeWidth="1" opacity="0.3" />
            </g>
          </g>

          {/* Clean Arterial Road Connections Between Hub & Hospitals */}
          {hospitals.map((hosp, i) => {
            if (i === 0) return null;
            const midXSec = (hubHospital.coordinates.x + hosp.coordinates.x) / 2;
            const midYSec = (hubHospital.coordinates.y + hosp.coordinates.y) / 2;
            const dPath = `M ${hubHospital.coordinates.x} ${hubHospital.coordinates.y} Q ${midXSec} ${midYSec}, ${hosp.coordinates.x} ${hosp.coordinates.y}`;

            return (
              <g key={`road-${hosp.id}`}>
                {/* Subtle base road */}
                <path d={dPath} stroke="#0f1b2d" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                <path
                  d={dPath}
                  stroke="#1e3a5f"
                  strokeWidth="1"
                  strokeDasharray="4 6"
                  fill="none"
                  opacity="0.6"
                />

                {/* PPP Diversion Flow if enabled */}
                {publicPrivateBalancingActive && hosp.ownership === 'Private' && (
                  <path
                    d={dPath}
                    stroke="url(#pppBypassGradClean)"
                    strokeWidth="2.5"
                    strokeDasharray="8 6"
                    fill="none"
                    filter="drop-shadow(0 0 5px rgba(16, 185, 129, 0.7))"
                  >
                    <animate
                      attributeName="stroke-dashoffset"
                      from="56"
                      to="0"
                      dur="1.5s"
                      repeatCount="indefinite"
                    />
                  </path>
                )}
              </g>
            );
          })}

          {/* ACTIVE TARGET HIGHWAY BEAM (Selected Hospital) */}
          <g>
            <path
              d={activeRoutePath}
              stroke="#0284c7"
              strokeWidth="4"
              strokeOpacity="0.25"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d={activeRoutePath}
              stroke="url(#activeRouteGradClean)"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              filter="drop-shadow(0 0 6px rgba(6,182,212,0.5))"
            />
            <path
              id={`route-path-${destHospital.id}`}
              d={activeRoutePath}
              stroke="#ffffff"
              strokeWidth="1.8"
              strokeDasharray="8 16"
              fill="none"
              strokeLinecap="round"
            >
              <animate
                attributeName="stroke-dashoffset"
                from="48"
                to="0"
                dur="1.3s"
                repeatCount="indefinite"
              />
            </path>

            {/* Animated 108 Ambulance moving along route */}
            <text
              fontSize="16"
              style={{ filter: 'drop-shadow(0 0 8px rgba(249,115,22,0.8))' }}
            >
              🚑
              <animateMotion
                dur={`${Math.max(5, (routeDetails.ambulanceTransitMinutes || 8) * 0.5)}s`}
                repeatCount="indefinite"
                rotate="auto"
              >
                <mpath href={`#route-path-${destHospital.id}`} />
              </animateMotion>
            </text>
          </g>

          {/* 108 EMS Central Dispatch Hub Marker */}
          <g transform={`translate(${originCoords.x}, ${originCoords.y})`}>
            <circle r="8" fill="#040c1a" stroke="#38bdf8" strokeWidth="1.5" />
            <circle r="4" fill="#38bdf8" />
            <text x="0" y="15" fill="#7dd3fc" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle" opacity="0.8">
              108 HQ
            </text>
          </g>

          {/* CLEAN HOSPITAL NODES (No Colliding Giant Badges) */}
          {hospitals.map(hosp => {
            const isSelected = hosp.id === destHospital.id;
            const isApexHub = hosp.id === hubHospital.id;
            const isGovt = hosp.ownership === 'Government';

            const statusColor = isApexHub ? '#ef4444' : isGovt ? '#f59e0b' : '#10b981';
            const hOccPercent = Math.round((hosp.occupiedBeds / hosp.totalBeds) * 100);

            return (
              <g
                key={hosp.id}
                transform={`translate(${hosp.coordinates.x}, ${hosp.coordinates.y})`}
                onClick={() => handleSelectHospital(hosp)}
                className="cursor-pointer group"
              >
                {/* Active Selection Glowing Reticle */}
                {isSelected && (
                  <g>
                    <circle r="22" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="4 3">
                      <animateTransform
                        attributeName="transform"
                        type="rotate"
                        from="0"
                        to="360"
                        dur="6s"
                        repeatCount="indefinite"
                      />
                    </circle>
                    <circle r="26" fill="none" stroke="#38bdf8" strokeWidth="0.8" opacity="0.3">
                      <animate attributeName="r" values="22;32;22" dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.4;0.05;0.4" dur="2s" repeatCount="indefinite" />
                    </circle>
                  </g>
                )}

                {/* Soft Status Halo */}
                <circle
                  r="14"
                  fill="#060e1f"
                  stroke={isSelected ? '#38bdf8' : statusColor}
                  strokeWidth={isSelected ? '2.5' : '1.8'}
                  filter={`drop-shadow(0 0 8px ${isSelected ? '#38bdf8' : statusColor}70)`}
                />

                {/* Hospital Icon */}
                <text x="0" y="4" fontSize="10" textAnchor="middle" fill="#f8fafc">
                  🏥
                </text>

                {/* Streamlined Compact Pill Tag Under Node */}
                <g transform="translate(0, 20)">
                  <rect
                    x="-55"
                    y="-8"
                    width="110"
                    height="17"
                    rx="5"
                    fill="#040914"
                    stroke={isSelected ? '#38bdf8' : '#1e293b'}
                    strokeWidth={isSelected ? '1.5' : '1'}
                    filter="drop-shadow(0 2px 6px rgba(0,0,0,0.7))"
                  />
                  <circle cx="-45" cy="0.5" r="2.5" fill={statusColor} />
                  <text
                    x="-38"
                    y="3"
                    fill={isSelected ? '#f8fafc' : '#cbd5e1'}
                    fontSize="8.5"
                    fontWeight="bold"
                    fontFamily="sans-serif"
                    textAnchor="start"
                  >
                    {hosp.shortName.split(' ')[0]}
                  </text>
                  <text
                    x="47"
                    y="3"
                    fill={hOccPercent >= 90 ? '#f87171' : '#34d399'}
                    fontSize="7.5"
                    fontFamily="monospace"
                    fontWeight="bold"
                    textAnchor="end"
                  >
                    {hOccPercent}%
                  </text>
                </g>
              </g>
            );
          })}
        </svg>

        {/* 2.5 PENDING BED REQUESTS PANEL (Top-Left) */}
        <div className="absolute top-4 left-4 z-20 w-80 max-h-[90%] overflow-y-auto bg-slate-950/90 backdrop-blur-xl rounded-2xl border border-slate-800/90 p-4 shadow-2xl text-slate-200 flex flex-col gap-3 animate-in fade-in slide-in-from-left-4 duration-300 custom-scrollbar">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
            <h3 className="text-xs font-bold text-slate-100 flex items-center gap-2 uppercase tracking-wider">
              <Activity className="w-4 h-4 text-cyan-400" />
              Pending Bed Requests
            </h3>
            <span className="text-[10px] font-mono bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full font-bold">
              {bedRequests.filter(r => r.status === 'pending').length}
            </span>
          </div>
          
          {bedRequests.filter(r => r.status === 'pending').length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-xs font-mono">
              No pending requests in district.
            </div>
          ) : (
            bedRequests.filter(r => r.status === 'pending').map(req => (
              <div key={req.id} className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-slate-200 text-sm">{req.patientName}</div>
                    <div className="text-[10px] font-mono text-cyan-400">{req.hospitalName}</div>
                  </div>
                  <div className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    req.acuity <= 2 ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    Acuity {req.acuity}
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 italic line-clamp-2">
                  "{req.diagnosis}"
                </div>
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={() => {
                      sound.playTactileClick();
                      approveBedRequest(req.id, req.hospitalId);
                    }}
                    className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 rounded-lg py-1.5 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button
                    onClick={() => {
                      sound.playTactileClick();
                      rejectBedRequest(req.id);
                    }}
                    className="flex-1 bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-400 border border-slate-700 hover:border-rose-500/30 rounded-lg py-1.5 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 3. SLEEK GLASSMORPHIC HOSPITAL INSPECTOR PANEL (Top-Right) */}
        <div className="absolute top-4 right-4 z-20 w-80 bg-slate-950/90 backdrop-blur-xl rounded-2xl border border-slate-800/90 p-4 shadow-2xl text-slate-200 space-y-3 animate-in fade-in duration-200">
          {/* Panel Header */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  destHospital.id === hubHospital.id
                    ? 'bg-rose-400'
                    : destHospital.ownership === 'Government'
                    ? 'bg-amber-400'
                    : 'bg-emerald-400'
                }`}
              />
              <span className="text-[11px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
                {destHospital.ownership} Facility
              </span>
            </div>
            <span
              className={`text-[9.5px] px-2 py-0.5 rounded font-mono font-bold border ${
                destHospital.traumaLevel.includes('Apex')
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}
            >
              {destHospital.traumaLevel}
            </span>
          </div>

          {/* Hospital Identity */}
          <div>
            <h4 className="text-sm font-bold text-slate-100 leading-snug">{destHospital.name}</h4>
            <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2 mt-1">
              <span className="text-cyan-300 font-bold">{routeDetails.distanceKm} km</span>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-300 font-bold">{routeDetails.ambulanceTransitMinutes}m ETA</span>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-400 font-semibold">108 Corridor</span>
            </div>
          </div>

          {/* Data Reliability Layer */}
          <div className="flex gap-2">
            <div className="flex-1 bg-slate-900 border border-slate-800 rounded-lg p-2 flex flex-col gap-1">
              <span className="text-[9px] font-mono text-slate-500 uppercase flex items-center gap-1">
                <Database className="w-3 h-3 text-cyan-500" /> Data Status
              </span>
              <span className={`text-[10px] font-bold ${destHospital.dataStatus === 'Fresh' ? 'text-emerald-400' : 'text-amber-400'}`}>
                {destHospital.dataStatus} • {destHospital.lastUpdatedMinutesAgo}m ago
              </span>
            </div>
            <div className="flex-1 bg-slate-900 border border-slate-800 rounded-lg p-2 flex flex-col gap-1">
              <span className="text-[9px] font-mono text-slate-500 uppercase flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-rose-500" /> Confidence
              </span>
              <span className={`text-[10px] font-bold ${destHospital.confidenceScore === 'HIGH' ? 'text-emerald-400' : 'text-amber-400'}`}>
                {destHospital.confidenceScore} SCORE
              </span>
            </div>
          </div>

          {/* Bed Occupancy Capacity Gauge */}
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-2.5 space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 flex items-center gap-1.5 font-mono">
                <Bed className="w-3.5 h-3.5 text-cyan-400" />
                <span>Census (Tot/Occ/Res)</span>
              </span>
              <span className="font-mono font-bold text-slate-200">
                {destHospital.totalBeds} / {destHospital.occupiedBeds} / <span className="text-amber-400">{destHospital.reservedBeds}</span>
                <span className={occPercent >= 90 ? 'text-rose-400 ml-1' : 'text-emerald-400 ml-1'}>
                  ({occPercent}%)
                </span>
              </span>
            </div>
            {/* Clean Progress Bar */}
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden flex">
              <div
                className={`h-full transition-all duration-500 ${occPercent >= 95 ? 'bg-rose-500' : occPercent >= 85 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                style={{ width: `${(destHospital.occupiedBeds / destHospital.totalBeds) * 100}%` }}
              />
              <div
                className="h-full bg-amber-500 transition-all duration-500"
                style={{ width: `${(destHospital.reservedBeds / destHospital.totalBeds) * 100}%` }}
              />
            </div>
          </div>

          {/* Granular Resource Tracking */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-2 flex flex-col items-center justify-center gap-1">
              <Wind className="w-3.5 h-3.5 text-cyan-400" />
              <div className="text-xs font-bold text-slate-200">{destHospital.ventilatorsAvailable}/{destHospital.ventilatorsTotal}</div>
              <div className="text-[8px] font-mono text-slate-500 uppercase">Vents</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-2 flex flex-col items-center justify-center gap-1">
              <Stethoscope className="w-3.5 h-3.5 text-emerald-400" />
              <div className="text-xs font-bold text-slate-200">{destHospital.doctorsAvailable}</div>
              <div className="text-[8px] font-mono text-slate-500 uppercase">Docs</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-2 flex flex-col items-center justify-center gap-1">
              <Users className="w-3.5 h-3.5 text-rose-400" />
              <div className="text-xs font-bold text-slate-200">{destHospital.nursesAvailable}</div>
              <div className="text-[8px] font-mono text-slate-500 uppercase">Nurses</div>
            </div>
          </div>

          {/* Live Wait Times Strip */}
          <div className="grid grid-cols-3 gap-2 text-center text-[10.5px] font-mono">
            <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-1.5">
              <div className="text-slate-400 text-[9.5px]">ER WAIT</div>
              <div className="font-bold text-cyan-300 mt-0.5">
                {destWaitTimes.ed.waitTimeMinutes === 0 ? '0m' : `${destWaitTimes.ed.waitTimeMinutes}m`}
              </div>
            </div>
            <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-1.5">
              <div className="text-slate-400 text-[9.5px]">ICU WAIT</div>
              <div className="font-bold text-amber-300 mt-0.5">{destWaitTimes.icu.waitTimeMinutes}m</div>
            </div>
            <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-1.5">
              <div className="text-slate-400 text-[9.5px]">HOLD</div>
              <div className="font-bold text-emerald-400 mt-0.5">45m Lock</div>
            </div>
          </div>

          {/* Active Reservation Notification (if reserved at this hospital) */}
          {activeReservation && activeReservation.hospitalId === destHospital.id && (
            <div className="bg-amber-500/10 border border-amber-500/40 rounded-xl p-2 text-xs flex items-center justify-between">
              <span className="text-amber-300 font-mono font-bold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 animate-pulse" />
                Active Bed Hold
              </span>
              <span className="font-mono text-amber-200 font-bold">
                {Math.floor(activeReservation.remainingSeconds / 60)}:
                {String(activeReservation.remainingSeconds % 60).padStart(2, '0')}
              </span>
            </div>
          )}

          {/* Tactical Radio Comms Trigger */}
          <button
            onClick={() => {
              sound.playRadioChirp();
              if (onOpenComms) onOpenComms('hosp-er-chief');
            }}
            className="w-full py-1.5 bg-gradient-to-r from-rose-950/80 via-slate-900 to-amber-950/80 hover:from-rose-900 hover:to-amber-900 border border-rose-500/40 hover:border-rose-400 text-rose-300 hover:text-rose-100 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer group"
          >
            <Radio className="w-3.5 h-3.5 text-rose-400 group-hover:animate-pulse" />
            <span>{language === 'ta' ? 'அவசர சிகிச்சை தலைவரை அழை 📻' : 'Radio Trauma Desk (VoIP) 📻'}</span>
          </button>

          {/* Logistics Shortcuts: Oxygen & Blood Bank */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                sound.playRadarPing();
                openOxygenModal(true);
              }}
              className="py-1.5 px-2 bg-slate-900 hover:bg-cyan-950/60 border border-slate-700/80 hover:border-cyan-500/50 rounded-xl text-[11px] font-bold text-cyan-300 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title="Liquid Medical Oxygen Cryogenic Bank"
            >
              <Wind className="w-3.5 h-3.5 text-cyan-400" />
              <span>{oxygenData.percentage}% O2 Bank</span>
            </button>

            <button
              onClick={() => {
                sound.playRadarPing();
                openBloodModal(true);
              }}
              className="py-1.5 px-2 bg-slate-900 hover:bg-rose-950/60 border border-slate-700/80 hover:border-rose-500/50 rounded-xl text-[11px] font-bold text-rose-300 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title="Central Blood Bank & Cryo-Storage"
            >
              <Droplet className="w-3.5 h-3.5 text-rose-400" />
              <span>Blood Bank</span>
            </button>
          </div>

          {/* Primary Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => {
                sound.playRadarPing();
                setSelectedHospitalId(destHospital.id);
                setDedicatedRouteActive(true);
              }}
              className="py-2 bg-slate-900 hover:bg-cyan-950 border border-cyan-500/50 hover:border-cyan-400 text-cyan-300 hover:text-cyan-100 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Route className="w-3.5 h-3.5 text-cyan-400" />
              <span>{language === 'ta' ? '108 வழித்தடம் ↗' : '108 Route View'}</span>
            </button>

            <button
              onClick={() => {
                sound.playRadarPing();
                setSelectedHospitalId(destHospital.id);
                setDedicatedRouteActive(true);
              }}
              className="py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-cyan-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Navigation className="w-3.5 h-3.5 text-cyan-400" />
              <span>{language === 'ta' ? 'உள்ளமை வீதி வரைபடம்' : 'In-App Street GPS'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sound.playRadarPing();
                openReservationModal(destHospital.id);
              }}
              className="flex-1 py-2 bg-gradient-to-r from-amber-600 to-emerald-600 hover:from-amber-500 hover:to-emerald-500 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-amber-950/40 transition-all cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{language === 'ta' ? 'படுக்கை முன்பதிவு' : 'Reserve Bed'}</span>
            </button>

            <button
              onClick={() => handleEnterWard(destHospital)}
              className="flex-1 py-2 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-900/40 transition-all cursor-pointer"
            >
              <span>{language === 'ta' ? '3D வார்டு ➔' : '3D Ward ➔'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useMemo } from 'react';
import { useHospitalStore } from '../../store/hospitalStore';
import { Navigation, Ambulance, MapPin, Zap } from 'lucide-react';
import { sound } from '../../utils/audioEngine';
import { RealHospital, getHospitalRouteDetails } from '../../data/realDistrictsData';

interface RegionalGPSMapProps {
  activeRouteDestination?: string;
  height?: string;
}

export const RegionalGPSMap: React.FC<RegionalGPSMapProps> = ({
  activeRouteDestination,
  height = '520px'
}) => {
  const { currentDistrict, selectedHospitalId, setSelectedHospitalId, language } = useHospitalStore();
  const hospitals = currentDistrict.hospitals;
  const hubHospital = hospitals[0];

  const targetHospital = useMemo(() => {
    return hospitals.find(h => h.id === activeRouteDestination) || hospitals[1] || hospitals[0];
  }, [hospitals, activeRouteDestination]);

  const route = useMemo(() => {
    return getHospitalRouteDetails(targetHospital, currentDistrict.name);
  }, [targetHospital, currentDistrict.name]);

  const [ambulanceProgress, setAmbulanceProgress] = useState(0.2);
  const [selectedNode, setSelectedNode] = useState<string>(targetHospital.id);

  // Animate ambulance along route
  useEffect(() => {
    const interval = setInterval(() => {
      setAmbulanceProgress(prev => (prev >= 0.98 ? 0.05 : prev + 0.012));
    }, 45);

    return () => clearInterval(interval);
  }, []);

  const startPt = { x: hubHospital.coordinates.x - 30, y: hubHospital.coordinates.y - 20 };
  const endPt = targetHospital.coordinates;

  const midX = (startPt.x + endPt.x) / 2 + 20;
  const midY = (startPt.y + endPt.y) / 2 - 20;

  // Current interpolated position of the ambulance
  const t = ambulanceProgress;
  const ambX = (1 - t) * (1 - t) * startPt.x + 2 * (1 - t) * t * midX + t * t * endPt.x;
  const ambY = (1 - t) * (1 - t) * startPt.y + 2 * (1 - t) * t * midY + t * t * endPt.y;

  const handleNodeClick = (id: string) => {
    setSelectedNode(id);
    setSelectedHospitalId(id);
    sound.playTactileClick();
  };

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden border border-slate-800 bg-[#070b14] shadow-2xl select-none"
      style={{ height }}
    >
      {/* Map Header Status Banner */}
      <div className="absolute top-4 left-4 z-20 flex items-center space-x-2 bg-slate-900/80 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-700/80 text-xs shadow-lg">
        <Navigation className="w-4 h-4 text-cyan-400 animate-pulse" />
        <span className="font-semibold text-slate-100">Regional EMS GPS Mesh</span>
        <span className="text-slate-500 font-mono">|</span>
        <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> Live Transit Telemetry
        </span>
      </div>

      {/* Map Vector Stage */}
      <svg viewBox="0 0 800 500" className="w-full h-full">
        <defs>
          {/* Radial Grid Gradients */}
          <radialGradient id="centralGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="destGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>

        {/* Tactical City Map Grid Lines */}
        {Array.from({ length: 20 }).map((_, i) => (
          <line
            key={`grid-x-${i}`}
            x1={i * 40}
            y1="0"
            x2={i * 40}
            y2="500"
            stroke="#0e172a"
            strokeWidth="0.8"
          />
        ))}
        {Array.from({ length: 13 }).map((_, i) => (
          <line
            key={`grid-y-${i}`}
            x1="0"
            y1={i * 40}
            x2="800"
            y2={i * 40}
            stroke="#0e172a"
            strokeWidth="0.8"
          />
        ))}

        {/* Ambient Area Cones */}
        <circle cx={startPt.x} cy={startPt.y} r="140" fill="url(#centralGlow)" />
        <circle cx={endPt.x} cy={endPt.y} r="140" fill="url(#destGlow)" />

        {/* Base Roads between Hub and other District Hospitals */}
        {hospitals.map((hosp, i) => {
          if (i === 0) return null;
          const mx = (hubHospital.coordinates.x + hosp.coordinates.x) / 2 + 15;
          const my = (hubHospital.coordinates.y + hosp.coordinates.y) / 2 - 15;
          return (
            <path
              key={`base-rd-${hosp.id}`}
              d={`M ${hubHospital.coordinates.x} ${hubHospital.coordinates.y} Q ${mx} ${my}, ${hosp.coordinates.x} ${hosp.coordinates.y}`}
              stroke="#1e293b"
              strokeWidth="3.5"
              fill="none"
              opacity="0.6"
            />
          );
        })}

        {/* Active Emergency Route Line (Glowing Neon Bézier Corridor) */}
        <path
          d={`M ${startPt.x} ${startPt.y} Q ${midX} ${midY}, ${endPt.x} ${endPt.y}`}
          stroke="url(#routeGrad)"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          filter="drop-shadow(0 0 8px rgba(6, 182, 212, 0.8))"
        />

        {/* Animated Directional Dash Stream */}
        <path
          d={`M ${startPt.x} ${startPt.y} Q ${midX} ${midY}, ${endPt.x} ${endPt.y}`}
          stroke="#ffffff"
          strokeWidth="2"
          strokeDasharray="8 12"
          fill="none"
          strokeLinecap="round"
        >
          <animate
            attributeName="stroke-dashoffset"
            from="40"
            to="0"
            dur="1.2s"
            repeatCount="indefinite"
          />
        </path>

        {/* Moving Ambulance Beacon along the Active Route */}
        <g transform={`translate(${ambX}, ${ambY})`}>
          <circle r="14" fill="#06b6d4" opacity="0.35">
            <animate attributeName="r" values="8;20;8" dur="1.2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.5;0.1;0.5" dur="1.2s" repeatCount="indefinite" />
          </circle>
          <rect x="-10" y="-7" width="20" height="14" rx="3" fill="#0f172a" stroke="#06b6d4" strokeWidth="1.5" />
          <text x="0" y="4" fill="#38bdf8" fontSize="9" fontWeight="bold" textAnchor="middle">
            🚑
          </text>
        </g>

        {/* Hospital Interactive Nodes */}
        {hospitals.map((hosp: RealHospital) => {
          const isSelected = selectedNode === hosp.id;
          const isApex = hosp.id === hubHospital.id;
          const isDestination = hosp.id === targetHospital.id;
          const nodeColor = isApex ? '#ef4444' : hosp.ownership === 'Government' ? '#f59e0b' : '#10b981';

          return (
            <g
              key={hosp.id}
              transform={`translate(${hosp.coordinates.x}, ${hosp.coordinates.y})`}
              onClick={() => handleNodeClick(hosp.id)}
              className="cursor-pointer group"
            >
              {/* Outer Pulse Rings */}
              {isDestination && (
                <circle r="34" fill="none" stroke="#10b981" strokeWidth="1.5" opacity="0.6">
                  <animate attributeName="r" values="22;42;22" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.8;0.1;0.8" dur="2s" repeatCount="indefinite" />
                </circle>
              )}

              {/* Node Hexagon/Circle Base */}
              <circle
                r="18"
                fill={isSelected ? '#0f172a' : '#080c14'}
                stroke={isDestination ? '#10b981' : nodeColor}
                strokeWidth={isDestination ? '3' : '2'}
                filter="drop-shadow(0 4px 12px rgba(0,0,0,0.6))"
              />

              {/* Node Icon */}
              <text x="0" y="5" fontSize="11" textAnchor="middle" fill="#f8fafc">
                🏥
              </text>

              {/* Floating Node Label Box */}
              <g transform="translate(0, 26)">
                <rect
                  x="-70"
                  y="-10"
                  width="140"
                  height="26"
                  rx="6"
                  fill="#0b1324"
                  stroke={isDestination ? '#10b981' : '#1e293b'}
                  strokeWidth="1"
                />
                <text x="0" y="1" fill="#f8fafc" fontSize="8.5" fontWeight="bold" textAnchor="middle">
                  {hosp.shortName}
                </text>
                <text x="0" y="11" fill={hosp.diversionActive ? '#f43f5e' : '#10b981'} fontSize="7.5" fontFamily="monospace" textAnchor="middle">
                  {hosp.diversionActive ? '⚠ SURGE' : `ER: ${hosp.edWaitMinutes}m • ${Math.round((hosp.occupiedBeds / hosp.totalBeds) * 100)}% Occ`}
                </text>
              </g>
            </g>
          );
        })}
      </svg>

      {/* Floating GPS Route Transit Summary HUD (Bottom-Left) */}
      <div className="absolute bottom-3 left-3 z-20 bg-slate-900/95 backdrop-blur-md p-2.5 rounded-xl border border-slate-700/80 text-xs text-slate-200 w-72 space-y-1.5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-1">
          <span className="font-semibold text-cyan-300 flex items-center gap-1.5 text-[10.5px]">
            <Ambulance className="w-3.5 h-3.5 text-cyan-400" />
            <span>{language === 'ta' ? 'அவசர ஆம்புலன்ஸ் பயணம்' : '108 Active Transit'}</span>
          </span>
          <span className="bg-emerald-500/20 text-emerald-300 text-[9.5px] px-1.5 py-0.5 rounded font-mono font-bold">
            ETA: {route.ambulanceTransitMinutes} mins
          </span>
        </div>

        <div className="space-y-0.5 text-[10px] text-slate-300">
          <div className="flex justify-between">
            <span className="text-slate-500">{language === 'ta' ? 'இலக்கு:' : 'Destination:'}</span>
            <span className="font-semibold text-slate-100 truncate max-w-[160px]">
              {targetHospital.name}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">{language === 'ta' ? 'தூரம்:' : 'Distance:'}</span>
            <span className="font-mono text-cyan-300">{route.distanceKm} km (via Green Wave)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">{language === 'ta' ? 'வரவேற்பு:' : 'Intake Ramp:'}</span>
            <span className="text-emerald-400 font-semibold truncate max-w-[160px]">
              {language === 'ta' ? route.destinationBayTa : route.destinationBayEn}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

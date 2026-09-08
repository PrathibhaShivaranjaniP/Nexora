import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useHospitalStore } from '../../store/hospitalStore';
import {
  RealHospital,
  getHospitalRouteDetails
} from '../../data/realDistrictsData';
import {
  Navigation,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Compass,
  Crosshair,
  Layers,
  ShieldCheck,
  Clock,
  ArrowRight,
  Volume2,
  VolumeX,
  Radio,
  Hospital,
  AlertTriangle,
  LocateFixed
} from 'lucide-react';
import { sound } from '../../utils/audioEngine';

interface InAppStreetMapEngineProps {
  hospital: RealHospital;
  originCoords: { x: number; y: number; label: string };
  originRealCoords: { lat: number; lng: number };
  onEnterWard?: () => void;
}

interface RoadPoint {
  x: number;
  y: number;
  nameEn: string;
  nameTa: string;
  maneuver: 'start' | 'straight' | 'turn-left' | 'turn-right' | 'destination';
  distanceFromStartKm: number;
}

export const InAppStreetMapEngine: React.FC<InAppStreetMapEngineProps> = ({
  hospital,
  originCoords,
  originRealCoords,
  onEnterWard
}) => {
  const { currentDistrict, language } = useHospitalStore();

  // Navigation & Viewport State
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [mapTheme, setMapTheme] = useState<'street-dark' | 'tactical' | 'satellite'>('street-dark');
  const [ambulanceProgress, setAmbulanceProgress] = useState(0.2);
  const [showTrafficLayer, setShowTrafficLayer] = useState(true);
  const [isVoiceActive, setIsVoiceActive] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Route details
  const routeDetails = useMemo(() => {
    return getHospitalRouteDetails(hospital, currentDistrict.name);
  }, [hospital, currentDistrict.name]);

  // Compute realistic multi-turn street waypoints tailored to the destination hospital
  const streetRoutePoints: RoadPoint[] = useMemo(() => {
    const startX = 170;
    const startY = 480;

    if (hospital.id.includes('apollo')) {
      return [
        { x: startX, y: startY, nameEn: 'Kathipara Junction (GST Road)', nameTa: 'கத்திப்பாரா சந்திப்பு', maneuver: 'start', distanceFromStartKm: 0 },
        { x: 280, y: 410, nameEn: 'Saidapet Bridge over Adyar River', nameTa: 'சைதாப்பேட்டை பாலம்', maneuver: 'straight', distanceFromStartKm: 2.1 },
        { x: 390, y: 340, nameEn: 'Anna Salai Arterial (Teynampet)', nameTa: 'அண்ணா சாலை (தேனாம்பேட்டை)', maneuver: 'straight', distanceFromStartKm: 4.3 },
        { x: 470, y: 280, nameEn: 'Thousand Lights Junction (Gemini)', nameTa: 'ஆயிரம் விளக்கு சந்திப்பு', maneuver: 'turn-left', distanceFromStartKm: 5.8 },
        { x: 520, y: 240, nameEn: 'Greams Road Emergency Corridor', nameTa: 'கிரீம்ஸ் சாலை அவசர வழித்தடம்', maneuver: 'straight', distanceFromStartKm: 6.5 },
        { x: 555, y: 215, nameEn: 'Apollo Greams Road Emergency Bay', nameTa: 'அப்பல்லோ அவசர சிகிச்சை நுழைவாயில்', maneuver: 'destination', distanceFromStartKm: 6.8 }
      ];
    }

    if (hospital.id.includes('miot')) {
      return [
        { x: startX, y: startY, nameEn: 'Kathipara Junction', nameTa: 'கத்திப்பாரா சந்திப்பு', maneuver: 'start', distanceFromStartKm: 0 },
        { x: 210, y: 440, nameEn: 'Mount-Poonamallee High Road', nameTa: 'மவுண்ட்-பூந்தமல்லி சாலை', maneuver: 'turn-left', distanceFromStartKm: 1.2 },
        { x: 260, y: 400, nameEn: 'Manapakkam Bridge over Adyar River', nameTa: 'மணப்பாக்கம் பாலம்', maneuver: 'straight', distanceFromStartKm: 3.5 },
        { x: 300, y: 370, nameEn: 'MIOT International Trauma Gate', nameTa: 'மியாட் மருத்துவமனை அவசர வாயில்', maneuver: 'destination', distanceFromStartKm: 4.8 }
      ];
    }

    if (hospital.id.includes('stanley')) {
      return [
        { x: startX, y: startY, nameEn: 'Kathipara Junction (NH-48)', nameTa: 'கத்திப்பாரா சந்திப்பு', maneuver: 'start', distanceFromStartKm: 0 },
        { x: 320, y: 390, nameEn: 'Anna Salai Express Corridor', nameTa: 'அண்ணா சாலை விரைவு வழித்தடம்', maneuver: 'straight', distanceFromStartKm: 3.2 },
        { x: 480, y: 280, nameEn: 'Gemini Flyover Bypass', nameTa: 'ஜெமினி மேம்பாலம்', maneuver: 'straight', distanceFromStartKm: 6.4 },
        { x: 620, y: 190, nameEn: 'Park Town Junction (Central Station)', nameTa: 'சென்ட்ரல் ரயில் நிலையம்', maneuver: 'straight', distanceFromStartKm: 9.8 },
        { x: 710, y: 130, nameEn: 'Old Jail Road (George Town)', nameTa: 'பழைய சிறைச்சாலை சாலை', maneuver: 'turn-right', distanceFromStartKm: 11.5 },
        { x: 750, y: 85, nameEn: 'Stanley Medical College Trauma Bay', nameTa: 'ஸ்டான்லி அரசு மருத்துவ கல்லூரி', maneuver: 'destination', distanceFromStartKm: 12.8 }
      ];
    }

    if (hospital.id.includes('sri-ramachandra')) {
      return [
        { x: startX, y: startY, nameEn: 'Kathipara Junction', nameTa: 'கத்திப்பாரா சந்திப்பு', maneuver: 'start', distanceFromStartKm: 0 },
        { x: 190, y: 430, nameEn: 'Mount-Poonamallee Trunk Road', nameTa: 'மவுண்ட் பூந்தமல்லி சாலை', maneuver: 'turn-left', distanceFromStartKm: 1.8 },
        { x: 160, y: 370, nameEn: 'Porur Junction Flyover', nameTa: 'போரூர் சந்திப்பு மேம்பாலம்', maneuver: 'straight', distanceFromStartKm: 5.2 },
        { x: 130, y: 310, nameEn: 'Sri Ramachandra Campus Main Gate', nameTa: 'ராமச்சந்திரா அவசர பிரிவு', maneuver: 'destination', distanceFromStartKm: 7.2 }
      ];
    }

    // Default: RGGGH (Central / Park Town)
    return [
      { x: startX, y: startY, nameEn: 'Guindy Kathipara Junction (GST Road)', nameTa: 'கத்திப்பாரா சந்திப்பு (ஜிஎஸ்டி சாலை)', maneuver: 'start', distanceFromStartKm: 0 },
      { x: 270, y: 420, nameEn: 'Saidapet Maraimalai Adigal Bridge', nameTa: 'மறைமலை அடிகள் பாலம்', maneuver: 'straight', distanceFromStartKm: 2.3 },
      { x: 370, y: 350, nameEn: 'Anna Salai / Teynampet Corridor', nameTa: 'அண்ணா சாலை (தேனாம்பேட்டை)', maneuver: 'straight', distanceFromStartKm: 4.5 },
      { x: 480, y: 280, nameEn: 'Gemini Flyover (Green Wave Bypass)', nameTa: 'ஜெமினி மேம்பாலம் (கிரீன் வேவ்)', maneuver: 'straight', distanceFromStartKm: 6.8 },
      { x: 570, y: 215, nameEn: 'Spencers / Mount Road Plaza', nameTa: 'ஸ்பென்சர்ஸ் பிளாசா சந்திப்பு', maneuver: 'straight', distanceFromStartKm: 8.5 },
      { x: 650, y: 165, nameEn: 'Park Town / Chennai Central Junction', nameTa: 'சென்னை சென்ட்ரல் சந்திப்பு', maneuver: 'turn-left', distanceFromStartKm: 10.2 },
      { x: 690, y: 140, nameEn: 'RGGGH Apex Trauma Resuscitation Gate', nameTa: 'ராஜீவ் காந்தி அரசு பொது மருத்துவமனை', maneuver: 'destination', distanceFromStartKm: 11.0 }
    ];
  }, [hospital]);

  // Construct smooth SVG path string from the road waypoints
  const svgRoutePathString = useMemo(() => {
    if (streetRoutePoints.length === 0) return '';
    let d = `M ${streetRoutePoints[0].x} ${streetRoutePoints[0].y}`;
    for (let i = 1; i < streetRoutePoints.length; i++) {
      const p0 = streetRoutePoints[i - 1];
      const p1 = streetRoutePoints[i];
      const cx = (p0.x + p1.x) / 2;
      const cy = (p0.y + p1.y) / 2;
      d += ` Q ${p0.x} ${p0.y}, ${cx} ${cy} T ${p1.x} ${p1.y}`;
    }
    return d;
  }, [streetRoutePoints]);

  // Interpolate ambulance position and heading along the route segments
  const { currentAmbulancePos, currentHeadingDeg, currentSegmentIndex } = useMemo(() => {
    const totalSegments = streetRoutePoints.length - 1;
    if (totalSegments <= 0) return { currentAmbulancePos: { x: 0, y: 0 }, currentHeadingDeg: 0, currentSegmentIndex: 0 };

    const rawT = ambulanceProgress * totalSegments;
    const segIndex = Math.min(Math.floor(rawT), totalSegments - 1);
    const segT = rawT - segIndex;

    const p0 = streetRoutePoints[segIndex];
    const p1 = streetRoutePoints[segIndex + 1];

    const currentX = p0.x + (p1.x - p0.x) * segT;
    const currentY = p0.y + (p1.y - p0.y) * segT;

    const dx = p1.x - p0.x;
    const dy = p1.y - p0.y;
    const angleRad = Math.atan2(dy, dx);
    const angleDeg = (angleRad * 180) / Math.PI;

    return {
      currentAmbulancePos: { x: currentX, y: currentY },
      currentHeadingDeg: angleDeg,
      currentSegmentIndex: segIndex
    };
  }, [ambulanceProgress, streetRoutePoints]);

  // Smooth ambulance loop
  useEffect(() => {
    const interval = setInterval(() => {
      setAmbulanceProgress(prev => (prev >= 0.98 ? 0.02 : prev + 0.005));
    }, 45);
    return () => clearInterval(interval);
  }, []);

  // Pan and Drag Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => {
    sound.playTactileClick();
    setZoom(prev => Math.min(2.6, prev + 0.25));
  };

  const handleZoomOut = () => {
    sound.playTactileClick();
    setZoom(prev => Math.max(0.75, prev - 0.25));
  };

  const handleResetView = () => {
    sound.playTactileClick();
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  };

  const handleCenterAmbulance = () => {
    sound.playRadarPing();
    const centerX = 440;
    const centerY = 280;
    setZoom(1.4);
    setPan({
      x: (centerX - currentAmbulancePos.x) * 1.4,
      y: (centerY - currentAmbulancePos.y) * 1.4
    });
  };

  const handleCenterHospital = () => {
    sound.playRadarPing();
    const dest = streetRoutePoints[streetRoutePoints.length - 1];
    const centerX = 440;
    const centerY = 280;
    setZoom(1.4);
    setPan({
      x: (centerX - dest.x) * 1.4,
      y: (centerY - dest.y) * 1.4
    });
  };

  // Next maneuver calculation
  const nextWaypoint = streetRoutePoints[Math.min(currentSegmentIndex + 1, streetRoutePoints.length - 1)];
  const remainingDistanceKm = Math.max(
    0.3,
    routeDetails.distanceKm * (1 - ambulanceProgress)
  ).toFixed(1);
  const remainingMinutes = Math.max(
    1,
    Math.round(routeDetails.ambulanceTransitMinutes * (1 - ambulanceProgress))
  );

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[560px] bg-[#060b17] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl select-none flex flex-col"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* 1. TOP GPS NAVIGATION STATUS BANNER */}
      <div className="bg-slate-950/95 backdrop-blur-md border-b border-slate-800/90 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs z-20">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 font-bold text-slate-100">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-cyan-400 font-mono text-[11px] uppercase tracking-wider">
              {language === 'ta' ? 'நேரலை உள்ளமை வரைபடம்' : 'IN-APP GPS NAVIGATION'}
            </span>
          </div>
          <span className="text-slate-600 font-mono">|</span>
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-300">
            <span className="text-cyan-300 font-bold">📍 {streetRoutePoints[0].nameEn.split(' ')[0]}</span>
            <ArrowRight className="w-3 h-3 text-cyan-400" />
            <span className="text-emerald-300 font-bold">🏥 {hospital.shortName}</span>
          </div>
        </div>

        {/* Live Metrics & ETA */}
        <div className="flex items-center gap-3 font-mono text-[11px]">
          <div className="bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 flex items-center gap-2">
            <span className="text-slate-400">ETA:</span>
            <span className="text-emerald-400 font-bold text-xs">{remainingMinutes} mins</span>
            <span className="text-slate-600">•</span>
            <span className="text-cyan-300 font-bold">{remainingDistanceKm} km</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/40 px-2.5 py-1 rounded-lg text-emerald-300 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Green Wave Priority Active</span>
          </div>
        </div>

        {/* Map View Controls & Presets */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[11px]">
            <button
              onClick={() => setMapTheme('street-dark')}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                mapTheme === 'street-dark' ? 'bg-cyan-500/25 text-cyan-200 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Street
            </button>
            <button
              onClick={() => setMapTheme('tactical')}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                mapTheme === 'tactical' ? 'bg-cyan-500/25 text-cyan-200 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Tactical
            </button>
          </div>

          <button
            onClick={() => setShowTrafficLayer(prev => !prev)}
            className={`px-2 py-1 rounded-lg border text-[11px] font-mono transition-all cursor-pointer ${
              showTrafficLayer
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
            title="Toggle Live Street Congestion Heatmap"
          >
            Traffic
          </button>
        </div>
      </div>

      {/* 2. INTERACTIVE SVG / VECTOR GIS CANVAS */}
      <div className="relative flex-1 w-full overflow-hidden cursor-grab active:cursor-grabbing bg-[#050914]">
        <svg
          viewBox="0 0 900 580"
          className="w-full h-full"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.15s ease-out'
          }}
        >
          <defs>
            {/* Street Grid Pattern */}
            <pattern id="streetBlockGrid" width="30" height="30" patternUnits="userSpaceOnUse">
              <rect width="30" height="30" fill="none" stroke="#0a1224" strokeWidth="0.7" />
            </pattern>

            {/* Glowing Neon Highway Ribbon Gradient */}
            <linearGradient id="neonGpsRouteGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="60%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>

            {/* Waterway Gradient */}
            <linearGradient id="waterwayGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0c2548" />
              <stop offset="100%" stopColor="#071b33" />
            </linearGradient>
          </defs>

          {/* Background Street Foundation */}
          <rect width="900" height="580" fill="#040814" />
          <rect width="900" height="580" fill="url(#streetBlockGrid)" />

          {/* REAL GEOGRAPHIC WATER BODIES (Cooum River, Adyar River & Bay of Bengal) */}
          {/* Bay of Bengal Coastline (Right Border) */}
          <path
            d="M 830 0 C 815 150, 825 320, 840 580 L 900 580 L 900 0 Z"
            fill="#071b36"
            stroke="#0e3260"
            strokeWidth="1.5"
          />
          <text x="855" y="300" fill="#1e4976" fontSize="10" fontWeight="bold" fontFamily="sans-serif" transform="rotate(90, 855, 300)">
            BAY OF BENGAL (COROMANDEL COAST)
          </text>

          {/* Marina Beach Promenade Line */}
          <path
            d="M 815 0 C 800 150, 810 320, 825 580"
            stroke="#ca8a04"
            strokeWidth="2.5"
            fill="none"
            strokeDasharray="8 6"
            opacity="0.4"
          />

          {/* Cooum River (Curving through Northern Central Chennai to Napier Bridge) */}
          <path
            d="M 200 120 Q 380 90, 520 130 T 730 160 Q 780 170, 820 180"
            fill="none"
            stroke="url(#waterwayGrad)"
            strokeWidth="12"
            strokeLinecap="round"
          />
          <path
            d="M 200 120 Q 380 90, 520 130 T 730 160 Q 780 170, 820 180"
            fill="none"
            stroke="#0ea5e9"
            strokeWidth="2.5"
            strokeDasharray="6 8"
            opacity="0.5"
          />
          <text x="360" y="105" fill="#0284c7" fontSize="8" fontWeight="bold" fontFamily="sans-serif" opacity="0.6">
            Cooum River Waterway
          </text>

          {/* Adyar River (Flowing through Guindy and Saidapet into the Sea) */}
          <path
            d="M 80 500 Q 240 450, 360 460 T 600 490 Q 740 520, 830 510"
            fill="none"
            stroke="url(#waterwayGrad)"
            strokeWidth="16"
            strokeLinecap="round"
          />
          <path
            d="M 80 500 Q 240 450, 360 460 T 600 490 Q 740 520, 830 510"
            fill="none"
            stroke="#0ea5e9"
            strokeWidth="3"
            strokeDasharray="8 8"
            opacity="0.5"
          />
          <text x="240" y="470" fill="#0284c7" fontSize="8" fontWeight="bold" fontFamily="sans-serif" opacity="0.6">
            Adyar River
          </text>

          {/* URBAN STREET NETWORK & ARTERIAL HIGHWAYS */}
          {/* 1. Anna Salai (Mount Road - Premier Arterial Corridor) */}
          <path
            d="M 140 530 L 280 430 L 390 350 L 480 280 L 580 215 L 660 165 L 700 140"
            stroke="#0f1f38"
            strokeWidth="18"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 140 530 L 280 430 L 390 350 L 480 280 L 580 215 L 660 165 L 700 140"
            stroke="#1e3a5f"
            strokeWidth="12"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 140 530 L 280 430 L 390 350 L 480 280 L 580 215 L 660 165 L 700 140"
            stroke="#facc15"
            strokeWidth="1.2"
            strokeDasharray="8 8"
            fill="none"
            opacity="0.75"
          />
          <text x="310" y="380" fill="#94a3b8" fontSize="8" fontWeight="bold" fontFamily="monospace" transform="rotate(-34, 310, 380)">
            ANNA SALAI (MOUNT ROAD)
          </text>

          {/* 2. EVR Periyar Salai (Poonamallee High Road) */}
          <path
            d="M 100 240 L 320 200 L 500 170 L 660 165 L 730 160"
            stroke="#0f1f38"
            strokeWidth="14"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 100 240 L 320 200 L 500 170 L 660 165 L 730 160"
            stroke="#1e293b"
            strokeWidth="8"
            fill="none"
          />
          <text x="240" y="210" fill="#64748b" fontSize="7.5" fontWeight="bold" fontFamily="monospace">
            EVR PERIYAR SALAI (POONAMALLEE HIGH RD)
          </text>

          {/* 3. GST Road (Grand Southern Trunk Rd / NH-48) */}
          <path
            d="M 50 560 L 170 480 L 230 430"
            stroke="#0f1f38"
            strokeWidth="16"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 50 560 L 170 480 L 230 430"
            stroke="#1e3a5f"
            strokeWidth="10"
            fill="none"
          />
          <text x="60" y="525" fill="#64748b" fontSize="8" fontWeight="bold" fontFamily="monospace" transform="rotate(-30, 60, 525)">
            GST ROAD (NH 48)
          </text>

          {/* 4. Inner Ring Road (100 Feet Road) */}
          <path
            d="M 170 480 L 180 340 L 240 220 L 320 200"
            stroke="#121e33"
            strokeWidth="10"
            fill="none"
          />
          <text x="160" y="320" fill="#475569" fontSize="7" fontWeight="bold" fontFamily="monospace" transform="rotate(-85, 160, 320)">
            INNER RING RD (100FT)
          </text>

          {/* 5. Mount-Poonamallee Road (Leading to MIOT & SRMC) */}
          <path
            d="M 170 480 L 210 440 L 280 390 L 200 370 L 140 330"
            stroke="#121e33"
            strokeWidth="9"
            fill="none"
          />
          <text x="210" y="420" fill="#475569" fontSize="7" fontFamily="monospace">
            MOUNT-POONAMALLEE RD
          </text>

          {/* 6. Kamarajar Salai (Beach Coastal Highway) */}
          <path
            d="M 800 540 L 805 320 L 810 160 L 770 120"
            stroke="#0f1f38"
            strokeWidth="10"
            fill="none"
          />
          <text x="795" y="360" fill="#64748b" fontSize="7" fontWeight="bold" fontFamily="monospace" transform="rotate(90, 795, 360)">
            KAMARAJAR SALAI
          </text>

          {/* Major Urban Flyovers & Interchanges */}
          {/* Kathipara Cloverleaf Junction */}
          <g transform="translate(170, 480)">
            <circle r="22" fill="none" stroke="#38bdf8" strokeWidth="2.5" opacity="0.7" />
            <circle r="14" fill="#040c1a" stroke="#0284c7" strokeWidth="2" />
            <path d="M -16 -16 Q 0 0, 16 16 M -16 16 Q 0 0, 16 -16" stroke="#facc15" strokeWidth="1.5" />
            <text x="0" y="-26" fill="#38bdf8" fontSize="8" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">
              Kathipara Cloverleaf
            </text>
          </g>

          {/* Gemini Flyover */}
          <g transform="translate(480, 280)">
            <ellipse rx="18" ry="10" fill="none" stroke="#06b6d4" strokeWidth="2" opacity="0.6" transform="rotate(-35)" />
            <text x="22" y="-5" fill="#7dd3fc" fontSize="7" fontFamily="monospace">
              Gemini Flyover
            </text>
          </g>

          {/* Chennai Central Station Landmark */}
          <g transform="translate(650, 165)">
            <rect x="-12" y="-12" width="24" height="24" rx="4" fill="#0b172a" stroke="#f43f5e" strokeWidth="1.5" />
            <text x="0" y="4" fontSize="11" textAnchor="middle">🚉</text>
            <text x="0" y="22" fill="#fca5a5" fontSize="7" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">
              Chennai Central
            </text>
          </g>

          {/* LIVE STREET CONGESTION HEATMAP OVERLAY */}
          {showTrafficLayer && (
            <g opacity="0.85">
              {/* Green Wave Preempted Corridor (Anna Salai Arterial) */}
              <path
                d={svgRoutePathString}
                stroke="#10b981"
                strokeWidth="7"
                strokeOpacity="0.4"
                fill="none"
                strokeLinecap="round"
              />
              {/* Congested Side Road (Poonamallee High Rd bottleneck) */}
              <path
                d="M 320 200 L 460 180"
                stroke="#ef4444"
                strokeWidth="4"
                strokeOpacity="0.7"
                fill="none"
                strokeLinecap="round"
              />
              {/* Moderate Traffic (Inner Ring Road) */}
              <path
                d="M 180 340 L 220 260"
                stroke="#f59e0b"
                strokeWidth="4"
                strokeOpacity="0.7"
                fill="none"
                strokeLinecap="round"
              />
            </g>
          )}

          {/* ACTIVE 108 EMERGENCY GPS ROUTE (Glowing Polyline with Directional Stream) */}
          <g>
            {/* Deep glowing under-bed */}
            <path
              d={svgRoutePathString}
              stroke="#0369a1"
              strokeWidth="10"
              strokeOpacity="0.5"
              fill="none"
              strokeLinecap="round"
            />

            {/* Core Route Line */}
            <path
              d={svgRoutePathString}
              stroke="url(#neonGpsRouteGrad)"
              strokeWidth="5"
              fill="none"
              strokeLinecap="round"
              filter="drop-shadow(0 0 8px rgba(6,182,212,0.8))"
            />

            {/* Directional Flow Photon Pulses */}
            <path
              d={svgRoutePathString}
              stroke="#ffffff"
              strokeWidth="2.5"
              strokeDasharray="12 20"
              fill="none"
              strokeLinecap="round"
            >
              <animate
                attributeName="stroke-dashoffset"
                from="64"
                to="0"
                dur="1.2s"
                repeatCount="indefinite"
              />
            </path>
          </g>

          {/* Traffic Signal Intersections along the street route */}
          {streetRoutePoints.map((wp, idx) => {
            if (idx === 0 || idx === streetRoutePoints.length - 1) return null;
            return (
              <g key={`wp-${idx}`} transform={`translate(${wp.x}, ${wp.y})`}>
                <circle r="9" fill="#050e1f" stroke="#10b981" strokeWidth="1.8" />
                <circle r="3.5" fill="#10b981" className="animate-ping" />
                <text x="0" y="-12" fill="#6ee7b7" fontSize="7" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                  🟢 Preempted
                </text>
              </g>
            );
          })}

          {/* ORIGIN PIN: CALLER INCIDENT SCENE (Guindy Kathipara) */}
          <g transform={`translate(${streetRoutePoints[0].x}, ${streetRoutePoints[0].y})`}>
            {/* Sonar Ping Wave */}
            <circle r="24" fill="none" stroke="#38bdf8" strokeWidth="1.5" opacity="0.6">
              <animate attributeName="r" values="16;42;16" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.8;0.05;0.8" dur="2s" repeatCount="indefinite" />
            </circle>

            {/* Base Cylinder */}
            <circle r="14" fill="#030b17" stroke="#38bdf8" strokeWidth="2.5" filter="drop-shadow(0 0 10px #0284c7)" />
            <text x="0" y="4" fontSize="11" textAnchor="middle">📍</text>

            {/* Incident Scene Label Card */}
            <g transform="translate(0, 26)">
              <rect x="-70" y="-10" width="140" height="20" rx="5" fill="#040a16" stroke="#38bdf8" strokeWidth="1" />
              <text x="0" y="3" fill="#7dd3fc" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                INCIDENT: GUINDY (108 CALL)
              </text>
            </g>
          </g>

          {/* DESTINATION PIN: TARGET HOSPITAL EMERGENCY TRAUMA GATE */}
          {(() => {
            const destPoint = streetRoutePoints[streetRoutePoints.length - 1];
            return (
              <g
                transform={`translate(${destPoint.x}, ${destPoint.y})`}
                onClick={onEnterWard}
                className="cursor-pointer group"
              >
                {/* Target Lock Ring */}
                <circle r="32" fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="5 4">
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="0"
                    to="360"
                    dur="5s"
                    repeatCount="indefinite"
                  />
                </circle>

                <circle r="18" fill="#040e1b" stroke="#10b981" strokeWidth="3" filter="drop-shadow(0 0 14px #10b981)" />
                <text x="0" y="5" fontSize="13" textAnchor="middle">🏥</text>

                {/* Floating Destination Card */}
                <g transform="translate(0, -32)">
                  <rect
                    x="-90"
                    y="-12"
                    width="180"
                    height="24"
                    rx="6"
                    fill="#040e1b"
                    stroke="#10b981"
                    strokeWidth="1.5"
                    filter="drop-shadow(0 4px 10px rgba(0,0,0,0.85))"
                  />
                  <text x="0" y="3.5" fill="#6ee7b7" fontSize="8.5" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">
                    🎯 {hospital.name.slice(0, 24)}
                  </text>
                </g>
              </g>
            );
          })()}

          {/* LIVE ANIMATED 108 ALS AMBULANCE ON STREETS */}
          <g transform={`translate(${currentAmbulancePos.x}, ${currentAmbulancePos.y})`}>
            {/* Siren Wave Ripples */}
            <circle r="18" fill="#38bdf8" opacity="0.3">
              <animate attributeName="r" values="10;28;10" dur="0.9s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.6;0.05;0.6" dur="0.9s" repeatCount="indefinite" />
            </circle>
            <circle r="12" fill="#ef4444" opacity="0.25">
              <animate attributeName="r" values="6;22;6" dur="0.9s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.7;0.05;0.7" dur="0.9s" repeatCount="indefinite" />
            </circle>

            {/* Rotated Vehicle Body along road heading */}
            <g transform={`rotate(${currentHeadingDeg})`}>
              <rect x="-14" y="-8" width="28" height="16" rx="4" fill="#081426" stroke="#38bdf8" strokeWidth="1.8" />
              <text x="0" y="4" fontSize="10" textAnchor="middle">🚑</text>
            </g>

            {/* En Route Street HUD Tag */}
            <g transform="translate(0, 24)">
              <rect x="-55" y="-8" width="110" height="17" rx="4" fill="#040a16" stroke="#0284c7" strokeWidth="1" />
              <text x="0" y="4" fill="#38bdf8" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                108 ALS • 58 km/h
              </text>
            </g>
          </g>
        </svg>

        {/* 3. IN-MAP TURN-BY-TURN GPS HUD OVERLAY (Top-Left) */}
        <div className="absolute top-4 left-4 z-10 bg-slate-950/95 backdrop-blur-xl border border-cyan-500/40 rounded-2xl p-3.5 shadow-2xl text-slate-100 max-w-sm space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center text-cyan-400 font-bold">
                {nextWaypoint.maneuver === 'turn-left' ? '↰' : nextWaypoint.maneuver === 'turn-right' ? '↱' : '⬆'}
              </div>
              <div>
                <div className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
                  {language === 'ta' ? 'அடுத்த திருப்பம்' : 'Next Maneuver'}
                </div>
                <div className="text-xs font-bold text-slate-100 truncate max-w-[210px]">
                  {language === 'ta' ? nextWaypoint.nameTa : nextWaypoint.nameEn}
                </div>
              </div>
            </div>
            <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded font-bold">
              SIGNAL GREEN
            </span>
          </div>

          <div className="flex items-center justify-between text-xs font-mono pt-0.5">
            <div className="flex items-center gap-1.5 text-slate-300">
              <Compass className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
              <span>Heading: {Math.round(currentHeadingDeg)}° ENE</span>
            </div>
            <div className="text-emerald-300 font-bold">
              {remainingDistanceKm} km left
            </div>
          </div>
        </div>

        {/* 4. MAP VIEWPORT INTERACTIVE CONTROLS (Top-Right) */}
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-1.5 bg-slate-950/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-800 shadow-2xl">
          <button
            onClick={handleZoomIn}
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
            title="Zoom In (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
            title="Zoom Out (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetView}
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
            title="Reset View"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <div className="w-full h-px bg-slate-800 my-0.5" />
          <button
            onClick={handleCenterAmbulance}
            className="p-2 bg-slate-900 hover:bg-cyan-950 text-cyan-400 hover:text-cyan-200 rounded-lg transition-colors cursor-pointer"
            title="Track Ambulance"
          >
            <Navigation className="w-4 h-4 animate-pulse" />
          </button>
          <button
            onClick={handleCenterHospital}
            className="p-2 bg-slate-900 hover:bg-emerald-950 text-emerald-400 hover:text-emerald-200 rounded-lg transition-colors cursor-pointer"
            title="Focus Destination Hospital"
          >
            <Hospital className="w-4 h-4" />
          </button>
        </div>

        {/* 5. DRAG HINT INSTRUCTION (Bottom-Left) */}
        <div className="absolute bottom-3 left-4 z-10 text-[11px] text-slate-400 flex items-center gap-3 bg-slate-950/80 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-slate-800">
          <span>Click & Drag to pan map • Scroll / Zoom buttons to inspect streets • Live GPS coordinates verified</span>
        </div>
      </div>
    </div>
  );
};

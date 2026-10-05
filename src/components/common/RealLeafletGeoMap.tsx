import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { RealHospital, DistrictProfile } from '../../data/realDistrictsData';
import { sound } from '../../utils/audioEngine';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Navigation,
  Layers,
  MapPin,
  ShieldCheck,
  AlertTriangle,
  Car
} from 'lucide-react';

interface RealLeafletGeoMapProps {
  district: DistrictProfile;
  selectedHospitalId: string;
  onSelectHospital: (hospitalId: string) => void;
  onStartNav?: (hospitalId: string) => void;
  navProgress?: number; // 0 to 1 for vehicle animation
  isNavigating?: boolean;
  className?: string;
  showTraffic?: boolean;
}

// Map real district center & origin GPS coordinates
export const DISTRICT_ORIGINS: Record<string, { name: string; lat: number; lng: number }> = {
  madurai: {
    name: 'Madurai Central Junction / Periyar Hub',
    lat: 9.9195,
    lng: 78.1120
  },
  chennai: {
    name: 'Chennai Central / EVR Periyar Salai',
    lat: 13.0827,
    lng: 80.2757
  },
  theni: {
    name: 'Theni Old Bus Stand Junction',
    lat: 10.0100,
    lng: 77.4770
  },
  coimbatore: {
    name: 'Gandhipuram Central Transport Hub',
    lat: 11.0168,
    lng: 76.9558
  }
};

// Real-world Street & Highway Waypoint Corridors (Latitude, Longitude)
export const REAL_ROAD_CORRIDORS: Record<string, [number, number][]> = {
  // ── MADURAI ──
  'mdr-grh': [
    [9.9195, 78.1120], // Origin
    [9.9230, 78.1190], // West Veli St
    [9.9265, 78.1270], // Simmakkal Junction
    [9.9285, 78.1340], // Goripalayam Vaigai Bridge
    [9.9290, 78.1360]  // GRH Emergency Casualty
  ],
  'mdr-apollo': [
    [9.9195, 78.1120], // Origin
    [9.9220, 78.1230], // Anna Bus Stand link
    [9.9255, 78.1320], // Kuruvikaran Salai
    [9.9280, 78.1400], // KK Nagar 80ft Road
    [9.9310, 78.1480]  // Apollo Madurai ER Gate
  ],
  'mdr-mmhrc': [
    [9.9195, 78.1120], // Origin
    [9.9285, 78.1340], // Goripalayam Flyover
    [9.9380, 78.1480], // Mattuthavani Bus Terminal
    [9.9480, 78.1580], // Melur Highway (NH-38)
    [9.9570, 78.1690]  // MMHRC Emergency Resuscitation Bay
  ],
  'mdr-velammal': [
    [9.9195, 78.1120], // Origin
    [9.9130, 78.1210], // South Veli St
    [9.9080, 78.1340], // Teppakulam Southern Bypass
    [9.9055, 78.1420], // Anuppanadi Road
    [9.9040, 78.1490]  // Velammal Medical College Gate
  ],

  // ── CHENNAI ──
  'chn-rgggh': [
    [13.0827, 80.2757], // Origin
    [13.0822, 80.2768], // EVR Periyar Salai
    [13.0818, 80.2778]  // RGGGH Tower Block Gate
  ],
  'chn-apollo': [
    [13.0827, 80.2757], // Origin
    [13.0730, 80.2680], // Anna Salai (Mount Road)
    [13.0650, 80.2570], // Thousand Lights Flyover
    [13.0604, 80.2514]  // Greams Road Entrance
  ],
  'chn-stanley': [
    [13.0827, 80.2757], // Origin
    [13.0920, 80.2810], // Wall Tax Road
    [13.1010, 80.2840], // Old Jail Road
    [13.1075, 80.2872]  // Stanley Medical College ER
  ],
  'chn-miot': [
    [13.0827, 80.2757], // Origin
    [13.0600, 80.2300], // Poonamallee High Rd
    [13.0380, 80.2000], // Kathipara Cloverleaf Flyover
    [13.0280, 80.1850], // Mount-Poonamallee Rd
    [13.0232, 80.1784]  // MIOT Manapakkam Port
  ],
  'chn-fortis': [
    [13.0827, 80.2757],
    [13.0450, 80.2700], // Santhome High Road
    [13.0180, 80.2600], // Adyar Bridge
    [13.0067, 80.2571]  // Fortis Malar
  ],
  'chn-omandurar': [
    [13.0827, 80.2757],
    [13.0750, 80.2745],
    [13.0700, 80.2740]
  ],
  'chn-kauvery': [
    [13.0827, 80.2757],
    [13.0550, 80.2550],
    [13.0336, 80.2520]
  ],
  'chn-sims': [
    [13.0827, 80.2757],
    [13.0650, 80.2250],
    [13.0520, 80.2090]
  ],

  // ── THENI ──
  'thn-gtmch': [
    [10.0100, 77.4770], // Origin
    [10.0120, 77.4950], // NH-85 Madurai-Kochi Highway
    [10.0140, 77.5250], // Shanmugasundarapuram Expressway
    [10.0150, 77.5520]  // GTMCH Emergency Gate
  ],
  'thn-hq': [
    [10.0100, 77.4770],
    [10.0115, 77.4775],
    [10.0120, 77.4780]
  ],
  'thn-nrt': [
    [10.0100, 77.4770],
    [10.0090, 77.4790],
    [10.0080, 77.4810]
  ],
  'thn-annai': [
    [10.0100, 77.4770],
    [10.0140, 77.4740],
    [10.0180, 77.4710]
  ],

  // ── COIMBATORE ──
  'cbe-cmch': [
    [11.0168, 76.9558],
    [11.0080, 76.9620],
    [11.0020, 76.9690]
  ],
  'cbe-psg': [
    [11.0168, 76.9558],
    [11.0200, 76.9850],
    [11.0260, 77.0320]
  ],
  'cbe-ganga': [
    [11.0168, 76.9558],
    [11.0210, 76.9540],
    [11.0250, 76.9530]
  ],
  'cbe-kmch': [
    [11.0168, 76.9558],
    [11.0320, 77.0100],
    [11.0480, 77.0580]
  ],
  'cbe-sriramakrishna': [
    [11.0168, 76.9558],
    [11.0190, 76.9680],
    [11.0210, 76.9780]
  ]
};

export const RealLeafletGeoMap: React.FC<RealLeafletGeoMapProps> = ({
  district,
  selectedHospitalId,
  onSelectHospital,
  onStartNav,
  navProgress = 0,
  isNavigating = false,
  className = '',
  showTraffic = true
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const routeGlowPolylineRef = useRef<L.Polyline | null>(null);
  const vehicleMarkerRef = useRef<L.Marker | null>(null);

  const [mapStyle, setMapStyle] = useState<'dark' | 'streets' | 'satellite'>('dark');
  const [currentZoom, setCurrentZoom] = useState<number>(13);

  const userOrigin = useMemo(() => {
    return DISTRICT_ORIGINS[district.id] || {
      name: `${district.name} Center`,
      lat: district.globeCoordinates.lat,
      lng: district.globeCoordinates.lng
    };
  }, [district]);

  const activeHospital = useMemo(() => {
    return district.hospitals.find(h => h.id === selectedHospitalId) || district.hospitals[0];
  }, [district, selectedHospitalId]);

  // Compute active route path [lat, lng]
  const activeRouteCoords = useMemo<[number, number][]>(() => {
    if (!activeHospital) return [];
    const custom = REAL_ROAD_CORRIDORS[activeHospital.id];
    if (custom) return custom;

    // Fallback direct realistic route
    return [
      [userOrigin.lat, userOrigin.lng],
      [(userOrigin.lat + activeHospital.coordinates.lat) / 2 + 0.002, (userOrigin.lng + activeHospital.coordinates.lng) / 2 - 0.002],
      [activeHospital.coordinates.lat, activeHospital.coordinates.lng]
    ];
  }, [activeHospital, userOrigin]);

  // Tile Layer URLs
  const tileConfig = useMemo(() => {
    switch (mapStyle) {
      case 'streets':
        return {
          url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          subdomains: 'abc',
          maxZoom: 19
        };
      case 'satellite':
        return {
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          subdomains: ['server'],
          maxZoom: 19
        };
      case 'dark':
      default:
        return {
          url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
          subdomains: 'abcd',
          maxZoom: 19
        };
    }
  }, [mapStyle]);

  // 1. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [userOrigin.lat, userOrigin.lng],
      zoom: 13,
      zoomControl: false,
      attributionControl: false
    });

    const tileLayer = L.tileLayer(tileConfig.url, {
      subdomains: tileConfig.subdomains as any,
      maxZoom: tileConfig.maxZoom
    }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);

    tileLayerRef.current = tileLayer;
    markersLayerGroupRef.current = markersGroup;
    mapInstanceRef.current = map;

    map.on('zoomend', () => {
      setCurrentZoom(map.getZoom());
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Update Tile Layer on Style Change
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    tileLayerRef.current.setUrl(tileConfig.url);
  }, [tileConfig]);

  // 3. Render Markers & Routes whenever District or Selection changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerGroupRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    // ── A. Render User GPS Origin Marker ──
    const userOriginIcon = L.divIcon({
      className: 'custom-user-origin-marker',
      html: `
        <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 36px; height: 36px; border-radius: 50%; background: rgba(34, 211, 238, 0.25); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="width: 18px; height: 18px; border-radius: 50%; background: #22d3ee; border: 3px solid #ffffff; box-shadow: 0 0 14px #22d3ee;"></div>
          <div style="position: absolute; top: 32px; left: 50%; transform: translateX(-50%); white-space: nowrap; background: rgba(8, 14, 30, 0.95); border: 1px solid #22d3ee; color: #22d3ee; font-size: 9px; font-weight: bold; font-family: monospace; padding: 2px 6px; border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.6);">
            📍 YOUR LOCATION
          </div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });

    L.marker([userOrigin.lat, userOrigin.lng], { icon: userOriginIcon })
      .bindTooltip(`<strong>Your GPS Origin</strong><br/>${userOrigin.name}`, { direction: 'top', className: 'tactical-tooltip' })
      .addTo(markersGroup);

    // ── B. Render Hospital Markers ──
    const boundsPoints: [number, number][] = [[userOrigin.lat, userOrigin.lng]];

    district.hospitals.forEach(h => {
      const isSelected = activeHospital?.id === h.id;
      const freeBeds = Math.max(0, h.totalBeds - h.occupiedBeds);
      boundsPoints.push([h.coordinates.lat, h.coordinates.lng]);

      const pinColor = h.ownership === 'Government' ? '#10b981' : h.ownership === 'Trust' ? '#06b6d4' : '#818cf8';
      const badgeBg = isSelected ? '#081a34' : 'rgba(8, 14, 30, 0.92)';
      const borderStyle = isSelected ? '2px solid #22d3ee' : '1px solid rgba(148, 163, 184, 0.3)';

      const hospitalIcon = L.divIcon({
        className: 'custom-hospital-pin',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
            <!-- Floating Live Badge -->
            <div style="background: ${badgeBg}; border: ${borderStyle}; border-radius: 8px; padding: 4px 8px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.8); margin-bottom: 4px; white-space: nowrap; transition: transform 0.2s;">
              <div style="font-size: 10px; font-weight: 800; font-family: monospace; color: ${isSelected ? '#22d3ee' : '#ffffff'};">
                ${h.name.length > 20 ? h.name.slice(0, 18) + '...' : h.name}
              </div>
              <div style="font-size: 8.5px; font-family: monospace; font-weight: 600; color: ${freeBeds > 15 ? '#34d399' : '#fbbf24'};">
                ${freeBeds} Free Beds • 0m ER Wait
              </div>
            </div>

            <!-- Pin Anchor Circle -->
            <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
              ${isSelected ? '<div style="position: absolute; width: 44px; height: 44px; border-radius: 50%; border: 2px solid #22d3ee; animation: ping 1.8s infinite;"></div>' : ''}
              <div style="width: 28px; height: 28px; border-radius: 50%; background: ${pinColor}; border: 2.5px solid #ffffff; box-shadow: 0 0 12px ${pinColor}; display: flex; align-items: center; justify-content: center; color: #ffffff; font-weight: 900; font-size: 12px; font-family: sans-serif;">
                H
              </div>
            </div>
          </div>
        `,
        iconSize: [160, 70],
        iconAnchor: [80, 60]
      });

      const marker = L.marker([h.coordinates.lat, h.coordinates.lng], { icon: hospitalIcon });
      marker.on('click', () => {
        sound.playRadarPing();
        onSelectHospital(h.id);
        map.panTo([h.coordinates.lat, h.coordinates.lng], { animate: true, duration: 0.6 });
      });

      marker.addTo(markersGroup);
    });

    // ── C. Render Active Route Polyline ──
    if (routePolylineRef.current) {
      map.removeLayer(routePolylineRef.current);
      routePolylineRef.current = null;
    }
    if (routeGlowPolylineRef.current) {
      map.removeLayer(routeGlowPolylineRef.current);
      routeGlowPolylineRef.current = null;
    }

    if (activeRouteCoords && activeRouteCoords.length > 1) {
      // Glow underlay polyline
      const glowLine = L.polyline(activeRouteCoords, {
        color: '#0891b2',
        weight: 9,
        opacity: 0.5,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);

      // Active highway polyline
      const activeLine = L.polyline(activeRouteCoords, {
        color: '#22d3ee',
        weight: 5,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round',
        dashArray: isNavigating ? '8, 6' : undefined
      }).addTo(map);

      routeGlowPolylineRef.current = glowLine;
      routePolylineRef.current = activeLine;
    }

    // Auto-fit bounds on initial load / district change
    if (boundsPoints.length > 0) {
      map.fitBounds(L.latLngBounds(boundsPoints), {
        padding: [60, 60],
        maxZoom: 15,
        animate: true
      });
    }
  }, [district, activeHospital, activeRouteCoords, isNavigating, userOrigin]);

  // 4. Update Vehicle Marker during Live Navigation
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (!isNavigating || !activeRouteCoords || activeRouteCoords.length < 2) {
      if (vehicleMarkerRef.current) {
        map.removeLayer(vehicleMarkerRef.current);
        vehicleMarkerRef.current = null;
      }
      return;
    }

    const totalSegs = activeRouteCoords.length - 1;
    const scaled = Math.max(0, Math.min(0.999, navProgress)) * totalSegs;
    const segIdx = Math.floor(scaled);
    const fraction = scaled - segIdx;

    const p1 = activeRouteCoords[segIdx];
    const p2 = activeRouteCoords[Math.min(segIdx + 1, activeRouteCoords.length - 1)];

    const curLat = p1[0] + (p2[0] - p1[0]) * fraction;
    const curLng = p1[1] + (p2[1] - p1[1]) * fraction;

    const headingAngle = (Math.atan2(p2[1] - p1[1], p2[0] - p1[0]) * 180) / Math.PI;

    const vehicleIcon = L.divIcon({
      className: 'live-gps-vehicle-marker',
      html: `
        <div style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; transform: rotate(${headingAngle}deg);">
          <div style="position: absolute; width: 40px; height: 40px; border-radius: 50%; background: rgba(34, 211, 238, 0.3); animation: ping 1.2s infinite;"></div>
          <div style="width: 30px; height: 18px; border-radius: 6px; background: #0284c7; border: 2px solid #ffffff; box-shadow: 0 0 14px #22d3ee; display: flex; align-items: center; justify-content: center;">
            <div style="width: 6px; height: 6px; border-radius: 50%; background: #ef4444; animation: pulse 0.5s infinite;"></div>
          </div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    if (!vehicleMarkerRef.current) {
      vehicleMarkerRef.current = L.marker([curLat, curLng], { icon: vehicleIcon }).addTo(map);
    } else {
      vehicleMarkerRef.current.setLatLng([curLat, curLng]);
      vehicleMarkerRef.current.setIcon(vehicleIcon);
    }
  }, [isNavigating, navProgress, activeRouteCoords]);

  // Controls
  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };
  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };
  const handleResetView = () => {
    if (!mapInstanceRef.current) return;
    const points: [number, number][] = [
      [userOrigin.lat, userOrigin.lng],
      ...district.hospitals.map(h => [h.coordinates.lat, h.coordinates.lng] as [number, number])
    ];
    mapInstanceRef.current.fitBounds(L.latLngBounds(points), { padding: [60, 60], animate: true });
  };

  return (
    <div className={`relative w-full rounded-3xl overflow-hidden border border-cyan-500/40 shadow-2xl bg-[#050b18] ${className}`}>
      {/* 1. TOP TACTICAL GIS HEADER */}
      <div className="bg-[#071224] p-3.5 sm:p-4 border-b border-slate-800/90 flex flex-wrap items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shrink-0">
            <Navigation className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black font-mono tracking-wider text-white flex items-center gap-2 flex-wrap">
              <span>REAL-WORLD GIS STREET &amp; HOSPITAL NETWORK</span>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700 uppercase font-mono">
                {district.name} Grid
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              Live OpenStreetMap / CartoDB Real Geo Engine • Click any facility marker for direct road routing
            </p>
          </div>
        </div>

        {/* Tactical Map Style & Viewport Controls */}
        <div className="flex items-center gap-2">
          {/* Map Layer Switcher */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
            <button
              onClick={() => { sound.playTactileClick(); setMapStyle('dark'); }}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                mapStyle === 'dark' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              🌙 Dark Tactical
            </button>
            <button
              onClick={() => { sound.playTactileClick(); setMapStyle('streets'); }}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                mapStyle === 'streets' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              ☀️ Streets
            </button>
            <button
              onClick={() => { sound.playTactileClick(); setMapStyle('satellite'); }}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                mapStyle === 'satellite' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              🛰️ Satellite
            </button>
          </div>

          {/* Zoom Buttons */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs text-slate-300">
            <button onClick={handleZoomIn} className="p-1.5 hover:text-cyan-300 cursor-pointer" title="Zoom In">
              <ZoomIn className="w-4 h-4" />
            </button>
            <button onClick={handleZoomOut} className="p-1.5 hover:text-cyan-300 cursor-pointer" title="Zoom Out">
              <ZoomOut className="w-4 h-4" />
            </button>
            <button onClick={handleResetView} className="p-1.5 hover:text-cyan-300 cursor-pointer" title="Reset to District Bounds">
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. REAL LEAFLET MAP CANVAS CONTAINER */}
      <div className="relative w-full h-[400px] sm:h-[480px]">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Floating Active Route Corridor HUD */}
        {activeHospital && (
          <div className="absolute bottom-3 left-3 right-3 z-10 bg-slate-950/95 backdrop-blur-xl border border-cyan-500/50 p-3.5 sm:p-4 rounded-2xl text-xs font-mono text-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-300 shrink-0">
                <Navigation className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Target Facility Corridor:</span>
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <span>{activeHospital.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700">
                    {activeHospital.ownership}
                  </span>
                </h4>
                <p className="text-[11px] text-cyan-300 mt-0.5">
                  Direct Real-World Road Corridor • {Math.max(0, activeHospital.totalBeds - activeHospital.occupiedBeds)} Free Beds • Zero Gate Refusal
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onStartNav && onStartNav(activeHospital.id)}
                className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-cyan-900/50 transition-transform hover:scale-105 cursor-pointer"
              >
                <Navigation className="w-4 h-4" />
                <span>Start Turn-by-Turn GPS</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

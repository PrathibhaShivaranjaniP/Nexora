import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useHospitalStore } from '../../store/hospitalStore';
import { getGoogleMapsDirectionsUrl, getHospitalBedWaitTimes } from '../../data/realDistrictsData';
import { sound } from '../../utils/audioEngine';
import {
  PhoneCall,
  ShieldCheck,
  Clock,
  MapPin,
  Navigation,
  HeartPulse,
  Droplet,
  Pill,
  CheckCircle2,
  XCircle,
  ExternalLink,
  QrCode,
  Search,
  Stethoscope,
  Hospital,
  AlertOctagon,
  ArrowRight,
  Shield,
  Activity,
  UserCheck,
  Check,
  Compass,
  AlertTriangle,
  Info,
  User,
  Mic,
  Ambulance,
  Play,
  Pause,
  RotateCcw,
  Square,
  Sparkles,
  ZoomIn,
  ZoomOut,
  Volume2,
  VolumeX,
  FastForward,
  Wind,
  Flame,
  Maximize2,
  Minimize2,
  Route,
  X
} from 'lucide-react';

interface WaypointRoute {
  hospitalId: string;
  roadName: string;
  points: [number, number][];
  maneuvers: {
    progressThreshold: number;
    icon: string;
    instruction: string;
    sub: string;
    road: string;
  }[];
}

export const PatientPublicPortal: React.FC = () => {
  const {
    currentDistrict,
    selectedDistrictId,
    setSelectedDistrict,
    selectedHospitalId,
    setSelectedHospitalId,
    openReservationModal,
    activeReservation,
    cancelBedReservation,
    confirmBedIntake,
    bloodData,
    oxygenData,
    language,
    submitBedRequest
  } = useHospitalStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'govt' | 'pvt' | 'icu'>('all');
  const [activeTab, setActiveTab] = useState<'hospitals' | 'blood-pharma' | 'first-aid' | 'digital-triage'>('hospitals');
  const [callSimActive, setCallSimActive] = useState<string | null>(null);

  // Map View Controls & Fullscreen Maximizer
  const [mapZoom, setMapZoom] = useState(1.0);
  const [showTrafficOverlay, setShowTrafficOverlay] = useState(true);
  const [isMapMaximized, setIsMapMaximized] = useState(false);
  const [showTurnListOverlay, setShowTurnListOverlay] = useState(true);

  // Turn-by-Turn GPS Cockpit & Animation State
  const [isNavCockpitOpen, setIsNavCockpitOpen] = useState(false);
  const [navHospitalId, setNavHospitalId] = useState<string>('');
  const [navProgress, setNavProgress] = useState(0.06);
  const [navSpeedMultiplier, setNavSpeedMultiplier] = useState<number>(1);
  const [isNavPaused, setIsNavPaused] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [showQrTokenModal, setShowQrTokenModal] = useState(false);
  const lastSpokenStep = useRef<number>(-1);

  // Digital Triage States
  const [triageHospitalId, setTriageHospitalId] = useState<string>('');
  const [selectedBodyParts, setSelectedBodyParts] = useState<string[]>([]);
  const [triageToast, setTriageToast] = useState<string | null>(null);
  const [painLevel, setPainLevel] = useState<number>(5);
  const [symptoms, setSymptoms] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [abhaProfile, setAbhaProfile] = useState<{ name: string; age: number; bloodGroup: string; conditions: string } | null>(null);

  // First Aid State
  const [cprActive, setCprActive] = useState(false);
  const [cprBeat, setCprBeat] = useState(false);
  const [activeFirstAidTopic, setActiveFirstAidTopic] = useState<'cpr' | 'stroke' | 'bleeding' | 'choking' | 'burns'>('cpr');

  // CPR Metronome Effect (110 BPM)
  useEffect(() => {
    if (!cprActive) return;
    const interval = setInterval(() => {
      setCprBeat(b => !b);
      sound.playTactileClick();
    }, 545);
    return () => clearInterval(interval);
  }, [cprActive]);

  // Turn-by-Turn GPS Live Animation Loop (Traversing real route coordinates)
  useEffect(() => {
    if (isNavPaused) return;
    const intervalTime = 320 / navSpeedMultiplier;
    const interval = setInterval(() => {
      setNavProgress(prev => {
        if (prev >= 0.98) {
          return 0.05; // Loop for continuous live preview
        }
        return prev + 0.012;
      });
    }, intervalTime);
    return () => clearInterval(interval);
  }, [isNavPaused, navSpeedMultiplier]);

  // AI Hospital Recommendations & Auto-Diversion
  const { recommendedHospital, isDiverted, originalHospital } = useMemo(() => {
    const nearest = currentDistrict.hospitals[0];
    const nearestOccupancy = (nearest.occupiedBeds + (nearest.reservedBeds || 0)) / nearest.totalBeds;
    const isDiverted = nearestOccupancy > 0.95;

    const available = currentDistrict.hospitals.filter(h => (h.totalBeds - h.occupiedBeds - (h.reservedBeds || 0)) > 0);
    let best = nearest;

    if (isDiverted && available.length > 0) {
      best = [...available].sort((a, b) => {
        const waitA = getHospitalBedWaitTimes(a).fastestWaitMinutes;
        const waitB = getHospitalBedWaitTimes(b).fastestWaitMinutes;
        return waitA - waitB;
      })[0];
    } else if (available.length > 0) {
      best = [...available].sort((a, b) => {
        const waitA = getHospitalBedWaitTimes(a).fastestWaitMinutes;
        const waitB = getHospitalBedWaitTimes(b).fastestWaitMinutes;
        return waitA - waitB;
      })[0];
    }

    return { recommendedHospital: best || nearest, isDiverted, originalHospital: nearest };
  }, [currentDistrict]);

  // Filtered hospitals
  const filteredHospitals = useMemo(() => {
    return currentDistrict.hospitals.filter(h => {
      const matchesSearch =
        h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.shortName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.ownership.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;
      if (filterType === 'govt') return h.ownership === 'Government';
      if (filterType === 'pvt') return h.ownership === 'Private';
      if (filterType === 'icu') return h.icuBeds - h.icuOccupied > 0;
      return true;
    });
  }, [currentDistrict.hospitals, searchQuery, filterType]);

  // Selected Active Hospital for Navigation
  const activeNavHospital = useMemo(() => {
    const id = navHospitalId || selectedHospitalId || recommendedHospital.id;
    return currentDistrict.hospitals.find(h => h.id === id) || recommendedHospital;
  }, [navHospitalId, selectedHospitalId, recommendedHospital, currentDistrict]);

  // Map User Origin Anchor based on District
  const userOrigin = useMemo(() => {
    switch (selectedDistrictId) {
      case 'theni':
        return { x: 140, y: 340, name: 'Theni Central Junction / Old Bus Stand' };
      case 'chennai':
        return { x: 150, y: 350, name: 'Chennai Central / EVR Periyar Salai' };
      case 'coimbatore':
        return { x: 140, y: 340, name: 'Gandhipuram Central Transport Hub' };
      case 'madurai':
      default:
        return { x: 140, y: 340, name: 'Periyar Bus Stand / Madurai Junction' };
    }
  }, [selectedDistrictId]);

  // Authentic Multi-Segment Road Waypoint Corridors & Street Names for each Hospital
  const distinctRouteCatalog = useMemo<Record<string, WaypointRoute>>(() => {
    return {
      // ── MADURAI DISTRICT ──
      'mdr-grh': {
        hospitalId: 'mdr-grh',
        roadName: 'West Veli St ➔ Simmakkal ➔ Goripalayam Vaigai Flyover ➔ GRH Casualty',
        points: [
          [userOrigin.x, userOrigin.y],
          [220, 310],
          [310, 260],
          [420, 190],
          [540, 130],
          [620, 85]
        ],
        maneuvers: [
          { progressThreshold: 0.2, icon: '⬆️', instruction: 'Head Northeast on West Veli Street', sub: 'Pass Madurai Town Hall & proceed toward Simmakkal', road: 'West Veli St' },
          { progressThreshold: 0.5, icon: '↗️', instruction: 'Cross Goripalayam Vaigai River Flyover', sub: 'Priority Green Wave corridor active • Zero signal delay', road: 'Goripalayam Bridge' },
          { progressThreshold: 0.8, icon: '↪️', instruction: 'Turn Right at Government Rajaji Hospital Main Arch', sub: 'Approach Level-1 Trauma Casualty entrance', road: 'Alagar Kovil Road' },
          { progressThreshold: 1.0, icon: '🏁', instruction: 'Arrive at GRH Resuscitation Bay A', sub: 'Free CMCHIS triage desk ready • Present QR pass', road: 'Trauma Resus Dock' }
        ]
      },
      'mdr-apollo': {
        hospitalId: 'mdr-apollo',
        roadName: 'Anna Bus Stand Link ➔ Kuruvikaran Salai ➔ KK Nagar 80ft Road',
        points: [
          [userOrigin.x, userOrigin.y],
          [250, 350],
          [370, 360],
          [500, 330],
          [640, 270],
          [740, 210]
        ],
        maneuvers: [
          { progressThreshold: 0.25, icon: '⬇️', instruction: 'Head East via Anna Nagar Main Corridor', sub: 'Proceed along Kuruvikaran Salai toward Vandiyur', road: 'Anna Nagar Link' },
          { progressThreshold: 0.6, icon: '↗️', instruction: 'Turn Left onto KK Nagar 80 Feet Road', sub: 'Smooth arterial link • Apollo emergency lane clear', road: 'KK Nagar 80ft Rd' },
          { progressThreshold: 0.85, icon: '↪️', instruction: 'Turn Right into Apollo Speciality ER Port', sub: 'Cardiac catheterization & ICU team alerted', road: 'Apollo Private Pavilion' },
          { progressThreshold: 1.0, icon: '🏁', instruction: 'Arrive at Apollo Madurai Emergency', sub: 'Private ICU admission guaranteed', road: 'Emergency Casualty Bay' }
        ]
      },
      'mdr-mmhrc': {
        hospitalId: 'mdr-mmhrc',
        roadName: 'Goripalayam ➔ Mattuthavani Bus Terminal ➔ Melur Highway (NH-38)',
        points: [
          [userOrigin.x, userOrigin.y],
          [210, 280],
          [300, 210],
          [430, 150],
          [580, 110],
          [710, 75]
        ],
        maneuvers: [
          { progressThreshold: 0.25, icon: '⬆️', instruction: 'Head Northeast past Mattuthavani Junction', sub: 'Proceed onto Melur 4-Lane Highway (NH-38)', road: 'Melur Road (NH-38)' },
          { progressThreshold: 0.65, icon: '↖️', instruction: 'Take Meenakshi Mission Flyover Service Ramp', sub: 'Green wave clear for emergency access', road: 'MMHRC Service Link' },
          { progressThreshold: 0.85, icon: '↪️', instruction: 'Turn Right into Meenakshi Mission Trauma Gate', sub: 'Apex trauma resuscitation team on standby', road: 'Hospital Campus Ring Rd' },
          { progressThreshold: 1.0, icon: '🏁', instruction: 'Arrive at MMHRC Resuscitation Unit', sub: 'Guaranteed 45m bed hold confirmed', road: 'Trauma Bay 1' }
        ]
      },
      'mdr-velammal': {
        hospitalId: 'mdr-velammal',
        roadName: 'South Veli St ➔ Teppakulam Southern Bypass ➔ Anuppanadi Road',
        points: [
          [userOrigin.x, userOrigin.y],
          [230, 370],
          [350, 400],
          [490, 410],
          [620, 380],
          [730, 320]
        ],
        maneuvers: [
          { progressThreshold: 0.3, icon: '↘️', instruction: 'Head Southeast along Teppakulam Bypass', sub: 'Follow Southern Ring Road toward Anuppanadi', road: 'Teppakulam Bypass' },
          { progressThreshold: 0.7, icon: '↗️', instruction: 'Turn Left at Velammal Medical College Avenue', sub: 'Direct link to multispeciality pavilion', road: 'Anuppanadi Road' },
          { progressThreshold: 1.0, icon: '🏁', instruction: 'Arrive at Velammal Medical ER Dock', sub: 'Level-1 polytrauma unit ready', road: 'Velammal Emergency Port' }
        ]
      },

      // ── CHENNAI DISTRICT ──
      'chn-rgggh': {
        hospitalId: 'chn-rgggh',
        roadName: 'EVR Periyar Salai ➔ Park Town Flyover ➔ Tower Block Gate',
        points: [
          [userOrigin.x, userOrigin.y],
          [220, 310],
          [310, 260],
          [420, 200],
          [530, 150],
          [620, 100]
        ],
        maneuvers: [
          { progressThreshold: 0.25, icon: '⬆️', instruction: 'Head East on EVR Periyar Salai', sub: 'Pass Central Metro Station', road: 'EVR Periyar Salai' },
          { progressThreshold: 0.6, icon: '↗️', instruction: 'Cross Park Town Flyover East Ramp', sub: 'Green wave clear for emergency access', road: 'Park Station Flyover' },
          { progressThreshold: 0.85, icon: '↪️', instruction: 'Turn Right into Tower Block Trauma Center', sub: 'RGGGH Level-1 Trauma team ready', road: 'RGGGH Tower Gate 2' },
          { progressThreshold: 1.0, icon: '🏁', instruction: 'Arrive at RGGGH Resuscitation Bay', sub: 'Zero-wait emergency admission ready', road: 'Resuscitation Red Zone' }
        ]
      },
      'chn-apollo': {
        hospitalId: 'chn-apollo',
        roadName: 'Anna Salai (Mount Road) ➔ Greams Road Corridor',
        points: [
          [userOrigin.x, userOrigin.y],
          [240, 360],
          [350, 370],
          [480, 350],
          [610, 300],
          [720, 230]
        ],
        maneuvers: [
          { progressThreshold: 0.25, icon: '⬇️', instruction: 'Head South on Anna Salai (Mount Road)', sub: 'Pass Thousand Lights Mosque', road: 'Anna Salai' },
          { progressThreshold: 0.6, icon: '↗️', instruction: 'Turn Right onto Greams Road', sub: 'Apollo dedicated emergency lane', road: 'Greams Road' },
          { progressThreshold: 0.85, icon: '↪️', instruction: 'Enter Apollo Main Hospital Emergency Gate', sub: 'Cardiac catheterization team paged', road: 'Apollo Heart Gate' },
          { progressThreshold: 1.0, icon: '🏁', instruction: 'Arrive at Apollo Greams ER', sub: 'Private ICU admission ready', road: 'Apollo ER Dock' }
        ]
      },
      'chn-stanley': {
        hospitalId: 'chn-stanley',
        roadName: 'Old Jail Road ➔ Royapuram North Corridor',
        points: [
          [userOrigin.x, userOrigin.y],
          [190, 260],
          [250, 180],
          [330, 110],
          [420, 60]
        ],
        maneuvers: [
          { progressThreshold: 0.3, icon: '⬆️', instruction: 'Head North on Old Jail Road', sub: 'Proceed toward Royapuram junction', road: 'Old Jail Road' },
          { progressThreshold: 0.7, icon: '↖️', instruction: 'Take Stanley Medical College flyover ramp', sub: 'Plastic surgery & trauma dock clear', road: 'Stanley Link Road' },
          { progressThreshold: 1.0, icon: '🏁', instruction: 'Arrive at Stanley Medical College ER', sub: 'Govt CMCHIS triage ready', road: 'Casualty Bay 1' }
        ]
      },
      'chn-miot': {
        hospitalId: 'chn-miot',
        roadName: 'GST Road ➔ Kathipara Flyover ➔ Mount-Poonamallee Rd / Manapakkam',
        points: [
          [userOrigin.x, userOrigin.y],
          [260, 370],
          [400, 390],
          [540, 380],
          [680, 330],
          [790, 260]
        ],
        maneuvers: [
          { progressThreshold: 0.3, icon: '↘️', instruction: 'Head Southwest via Kathipara Cloverleaf Flyover', sub: 'Take Manapakkam exit', road: 'Mount-Poonamallee Rd' },
          { progressThreshold: 0.7, icon: '↗️', instruction: 'Cross Adyar River Bridge toward MIOT', sub: 'Green wave corridor active', road: 'MIOT Avenue' },
          { progressThreshold: 1.0, icon: '🏁', instruction: 'Arrive at MIOT International Trauma', sub: 'Orthopedic & polytrauma dock active', road: 'MIOT Emergency Port' }
        ]
      },

      // ── THENI DISTRICT ──
      'thn-gtmch': {
        hospitalId: 'thn-gtmch',
        roadName: 'NH-85 Madurai-Kochi Highway ➔ Shanmugasundarapuram Bypass',
        points: [
          [userOrigin.x, userOrigin.y],
          [230, 310],
          [330, 260],
          [460, 200],
          [580, 150],
          [680, 95]
        ],
        maneuvers: [
          { progressThreshold: 0.2, icon: '⬆️', instruction: 'Head East on NH-85 Expressway', sub: 'Proceed 2.4 km along NH-85 corridor', road: 'NH-85 Madurai Highway' },
          { progressThreshold: 0.5, icon: '↗️', instruction: 'Take Exit ramp onto SH-36 Bypass', sub: 'Priority Green Wave corridor active • Zero signal delay', road: 'Shanmugasundarapuram Link' },
          { progressThreshold: 0.8, icon: '↪️', instruction: 'Turn Right at GTMCH Medical College Arch', sub: 'Approach Emergency Trauma Bay A', road: 'GTMCH Campus Ring Road' },
          { progressThreshold: 1.0, icon: '🏁', instruction: 'Arrive at Resuscitation Bay', sub: 'Direct intake desk ready • Present QR token', road: 'Emergency Casualty Bay' }
        ]
      },
      'thn-hq': {
        hospitalId: 'thn-hq',
        roadName: 'SH-36 Periyakulam Road ➔ Collectorate Ave',
        points: [
          [userOrigin.x, userOrigin.y],
          [190, 270],
          [260, 200],
          [360, 130],
          [470, 80]
        ],
        maneuvers: [
          { progressThreshold: 0.25, icon: '⬆️', instruction: 'Head North onto Periyakulam Road (SH-36)', sub: 'Keep left at Old Bus Stand roundabout', road: 'SH-36 Northbound' },
          { progressThreshold: 0.6, icon: '↖️', instruction: 'Bear Left past Collectorate Master Plan Complex', sub: 'Traffic clearance signal priority verified', road: 'Collectorate Avenue' },
          { progressThreshold: 0.85, icon: '↪️', instruction: 'Turn Right into Theni HQ Trauma Gate', sub: 'Hospital security alerted to inbound arrival', road: 'Govt Hospital Road' },
          { progressThreshold: 1.0, icon: '🏁', instruction: 'Arrive at Theni HQ ER Intake', sub: 'Zero-wait CMCHIS desk open', road: 'ER Intake Bay' }
        ]
      },
      'thn-nrt': {
        hospitalId: 'thn-nrt',
        roadName: 'Cumbum Road ➔ Allinagaram Main Grid',
        points: [
          [userOrigin.x, userOrigin.y],
          [220, 360],
          [300, 370],
          [390, 350],
          [490, 300],
          [580, 250]
        ],
        maneuvers: [
          { progressThreshold: 0.25, icon: '⬇️', instruction: 'Head South onto Cumbum Main Road', sub: 'Continue 800m past Allinagaram Bazar', road: 'Cumbum Road' },
          { progressThreshold: 0.6, icon: '↗️', instruction: 'Turn Right at NRT Nagar Cross Junction', sub: 'Smooth arterial link with ambulance escort', road: 'NRT Hospital Road' },
          { progressThreshold: 0.85, icon: '↪️', instruction: 'Turn Left into N.R.T. Hospital Parking Arch', sub: 'ICU resuscitation team on standby', road: 'N.R.T. Private Pavilion' },
          { progressThreshold: 1.0, icon: '🏁', instruction: 'Arrive at N.R.T. Hospital Emergency', sub: 'Private bed reservation confirmed', road: 'ER Bay 1' }
        ]
      },
      'thn-annai': {
        hospitalId: 'thn-annai',
        roadName: 'Bodi Hills Highway ➔ Subban Street Link',
        points: [
          [userOrigin.x, userOrigin.y],
          [130, 270],
          [100, 200],
          [80, 140],
          [65, 85]
        ],
        maneuvers: [
          { progressThreshold: 0.3, icon: '↖️', instruction: 'Head Northwest onto Bodinayakanur Road', sub: 'Follow scenic Western Ghats corridor', road: 'Bodi Highway' },
          { progressThreshold: 0.7, icon: '↗️', instruction: 'Turn Right at Subban Street Cross', sub: 'Direct link to Annai Multispeciality', road: 'Subban Street' },
          { progressThreshold: 1.0, icon: '🏁', instruction: 'Arrive at Annai Hospital ER', sub: 'Trauma doctor paged and ready', road: 'Annai Emergency Dock' }
        ]
      },

      // ── COIMBATORE DISTRICT ──
      'cbe-cmch': {
        hospitalId: 'cbe-cmch',
        roadName: 'Trichy Road ➔ Collectorate Link ➔ CMCH Casualty',
        points: [
          [userOrigin.x, userOrigin.y],
          [220, 330],
          [320, 290],
          [440, 220],
          [560, 150],
          [650, 100]
        ],
        maneuvers: [
          { progressThreshold: 0.25, icon: '⬆️', instruction: 'Head South on Trichy Road corridor', sub: 'Pass Coimbatore Railway Junction', road: 'Trichy Road' },
          { progressThreshold: 0.6, icon: '↗️', instruction: 'Turn Left into CMCH Government Medical Gate', sub: 'CMCHIS Level-1 triage desk active', road: 'Hospital Road' },
          { progressThreshold: 1.0, icon: '🏁', instruction: 'Arrive at CMCH Resuscitation Bay', sub: 'Zero wait emergency intake open', road: 'Casualty Bay A' }
        ]
      },
      'cbe-psg': {
        hospitalId: 'cbe-psg',
        roadName: 'Avinashi Road Express ➔ Peelamedu ➔ PSG IMS&R Arch',
        points: [
          [userOrigin.x, userOrigin.y],
          [240, 310],
          [370, 250],
          [510, 180],
          [660, 130],
          [760, 80]
        ],
        maneuvers: [
          { progressThreshold: 0.25, icon: '⬆️', instruction: 'Head East on Avinashi Road Expressway', sub: 'Proceed along priority emergency lane', road: 'Avinashi Road' },
          { progressThreshold: 0.65, icon: '↗️', instruction: 'Take Peelamedu PSG Medical Overpass Ramp', sub: 'Green wave clear for trauma intake', road: 'Peelamedu Link' },
          { progressThreshold: 1.0, icon: '🏁', instruction: 'Arrive at PSG IMS&R Emergency Wing', sub: 'ICU team on immediate standby', road: 'PSG Resus Bay' }
        ]
      }
    };
  }, [userOrigin]);

  // Compute Active Corridor Route for any hospital in the current district
  const activeRoute = useMemo<WaypointRoute>(() => {
    const custom = distinctRouteCatalog[activeNavHospital.id];
    if (custom) return custom;

    // Fallback deterministic realistic polyline
    const index = currentDistrict.hospitals.findIndex(h => h.id === activeNavHospital.id);
    const i = index >= 0 ? index : 0;
    const targetX = 450 + (i % 3) * 150 + (i === 1 ? 30 : 0);
    const targetY = 80 + Math.floor(i / 2) * 130 + (i % 2) * 40;

    const midX1 = userOrigin.x + (targetX - userOrigin.x) * 0.35 + (i % 2 === 0 ? 25 : -25);
    const midY1 = userOrigin.y + (targetY - userOrigin.y) * 0.25 - 20;

    const midX2 = userOrigin.x + (targetX - userOrigin.x) * 0.7 + (i % 2 === 0 ? -20 : 30);
    const midY2 = userOrigin.y + (targetY - userOrigin.y) * 0.75 + 10;

    return {
      hospitalId: activeNavHospital.id,
      roadName: `${currentDistrict.name} Arterial Expressway ➔ ${activeNavHospital.shortName} Link`,
      points: [
        [userOrigin.x, userOrigin.y],
        [midX1, midY1],
        [midX2, midY2],
        [targetX, targetY]
      ],
      maneuvers: [
        { progressThreshold: 0.25, icon: '⬆️', instruction: `Head northeast on ${currentDistrict.name} Highway`, sub: 'Proceed along main arterial corridor', road: 'Main Arterial' },
        { progressThreshold: 0.6, icon: '↗️', instruction: `Bear Right onto ${activeNavHospital.shortName} Hospital Link`, sub: 'Priority Green Wave corridor active', road: 'Hospital Link' },
        { progressThreshold: 0.85, icon: '↪️', instruction: 'Turn Right into Emergency Trauma Reception', sub: 'Present Digital QR Token for instant check-in', road: 'ER Gate A' },
        { progressThreshold: 1.0, icon: '🏁', instruction: `Arriving at ${activeNavHospital.name}`, sub: 'Bed reservation guaranteed • Zero wait', road: 'Resuscitation Bay' }
      ]
    };
  }, [activeNavHospital, currentDistrict, distinctRouteCatalog, userOrigin]);

  // Compute Layout Coordinates for All District Hospitals
  const mapCoordinates = useMemo(() => {
    return filteredHospitals.map((h, i) => {
      const route = distinctRouteCatalog[h.id];
      let targetX = 450 + (i % 3) * 150 + (i === 1 ? 30 : 0);
      let targetY = 80 + Math.floor(i / 2) * 130 + (i % 2) * 40;

      if (route && route.points.length > 0) {
        const last = route.points[route.points.length - 1];
        targetX = last[0];
        targetY = last[1];
      }

      return {
        hospital: h,
        x: targetX,
        y: targetY,
        route: route || {
          hospitalId: h.id,
          roadName: `${h.shortName} Corridor`,
          points: [
            [userOrigin.x, userOrigin.y],
            [userOrigin.x + (targetX - userOrigin.x) * 0.5, userOrigin.y + (targetY - userOrigin.y) * 0.5 - 20],
            [targetX, targetY]
          ],
          maneuvers: []
        }
      };
    });
  }, [filteredHospitals, distinctRouteCatalog, userOrigin]);

  // Calculate Moving Vehicle State on the active route
  const vehicleState = useMemo(() => {
    const pts = activeRoute.points;
    if (!pts || pts.length < 2) return { x: userOrigin.x, y: userOrigin.y, angle: 0 };

    const totalSegments = pts.length - 1;
    const scaledProgress = Math.max(0, Math.min(0.999, navProgress)) * totalSegments;
    const segmentIndex = Math.floor(scaledProgress);
    const segmentFraction = scaledProgress - segmentIndex;

    const p1 = pts[segmentIndex];
    const p2 = pts[Math.min(segmentIndex + 1, pts.length - 1)];

    const x = p1[0] + (p2[0] - p1[0]) * segmentFraction;
    const y = p1[1] + (p2[1] - p1[1]) * segmentFraction;

    const angle = (Math.atan2(p2[1] - p1[1], p2[0] - p1[0]) * 180) / Math.PI;

    return { x, y, angle };
  }, [activeRoute, navProgress, userOrigin]);

  // Current Turn Maneuver based on active progress
  const currentTurnManeuver = useMemo(() => {
    const mList = activeRoute.maneuvers;
    for (let i = 0; i < mList.length; i++) {
      if (navProgress <= mList[i].progressThreshold || i === mList.length - 1) {
        const distKm = Math.max(0.1, (1 - navProgress) * 7.6).toFixed(1);
        const minsLeft = Math.max(1, Math.ceil((1 - navProgress) * 12));
        return {
          ...mList[i],
          index: i,
          distanceRemaining: `${distKm} km`,
          timeRemaining: `${minsLeft} min`
        };
      }
    }
    return {
      index: 0,
      icon: '⬆️',
      instruction: 'Continue toward destination',
      sub: 'Priority corridor active',
      road: activeRoute.roadName,
      distanceRemaining: '4.2 km',
      timeRemaining: '8 min'
    };
  }, [activeRoute, navProgress]);

  // Voice Guidance Trigger upon maneuver step change
  useEffect(() => {
    if (!isVoiceActive) return;
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    if (currentTurnManeuver.index !== lastSpokenStep.current) {
      lastSpokenStep.current = currentTurnManeuver.index;
      window.speechSynthesis.cancel();
      const speech = new SpeechSynthesisUtterance(`${currentTurnManeuver.instruction}. ${currentTurnManeuver.sub}`);
      speech.rate = 1.05;
      speech.pitch = 1.0;
      window.speechSynthesis.speak(speech);
    }
  }, [currentTurnManeuver, isVoiceActive]);

  // Handle 108 Emergency Call Simulation
  const handleCall108 = () => {
    sound.playAlertTone();
    setCallSimActive('Connecting to 108 Emergency Command Dispatcher...');
    setTimeout(() => {
      setCallSimActive('108 Operator Connected: "State Emergency Medical Services. Your GPS location has been pinpointed. Ambulances on standby."');
    }, 1500);
  };

  // Launch Dedicated Turn-by-Turn GPS Cockpit
  const startTurnByTurnNav = (hospitalId: string) => {
    sound.playRadarPing();
    setSelectedHospitalId(hospitalId);
    setNavHospitalId(hospitalId);
    setNavProgress(0.05);
    setIsNavPaused(false);
    lastSpokenStep.current = -1;
    setIsNavCockpitOpen(true);

    if (isVoiceActive && typeof window !== 'undefined' && window.speechSynthesis) {
      const target = currentDistrict.hospitals.find(h => h.id === hospitalId) || activeNavHospital;
      const u = new SpeechSynthesisUtterance(`Starting live turn-by-turn route to ${target.name}. Head northeast on arterial corridor.`);
      window.speechSynthesis.speak(u);
    }
  };

  const toggleVoiceGuidance = () => {
    sound.playTactileClick();
    const next = !isVoiceActive;
    setIsVoiceActive(next);

    if (next && typeof window !== 'undefined' && window.speechSynthesis) {
      const u = new SpeechSynthesisUtterance(`Voice guidance enabled. In 400 meters, prepare to take the exit toward ${activeNavHospital.name}.`);
      window.speechSynthesis.speak(u);
    }
  };

  // Open Google Maps external
  const handleOpenGoogleMaps = (h: typeof currentDistrict.hospitals[0]) => {
    sound.playTactileClick();
    const url = getGoogleMapsDirectionsUrl(
      currentDistrict.globeCoordinates.lat,
      currentDistrict.globeCoordinates.lng,
      h.coordinates.lat,
      h.coordinates.lng
    );
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Polyline generator helper
  const renderSvgPolyline = (pts: [number, number][]) => {
    return pts.map((p, idx) => (idx === 0 ? `M ${p[0]},${p[1]}` : `L ${p[0]},${p[1]}`)).join(' ');
  };

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-300">
      {/* ─────────────────────────────────────────────────────────────
          1. TOP CITIZEN BANNER & EMERGENCY SOS ROW
         ───────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0c1a2e] via-[#091424] to-[#040813] border border-cyan-500/30 p-6 md:p-8 shadow-2xl shadow-cyan-950/40">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold tracking-wide">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>{language === 'ta' ? 'தமிழ்நாடு அவசர மருத்துவ நெட்வொர்க் நேரலை' : 'Tamil Nadu State Emergency Health Grid Live'}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
              {language === 'ta' ? 'அருகிலுள்ள மருத்துவமனைகள் & அவசர படுக்கை விவரம்' : 'Find Emergency Beds & Care Near You'}
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              {language === 'ta'
                ? 'அரசு மற்றும் தனியார் மருத்துவமனைகளின் நிகழ்நேர படுக்கை இருப்பு, அவசர சிகிச்சை காத்திருப்பு நேரம் மற்றும் 45 நிமிட படுக்கை முன்பதிவு டோக்கன்.'
                : 'Real-time verified hospital bed occupancy, zero ER gate refusal wait times, guaranteed 45-minute bed reservations, and authentic GPS route navigation.'}
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-400">
              <span className="flex items-center gap-1 text-cyan-300 bg-cyan-950/60 border border-cyan-800/60 px-2.5 py-1 rounded-lg">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" /> CMCHIS Free Care Covered
              </span>
              <span className="flex items-center gap-1 text-emerald-300 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 rounded-lg">
                <Check className="w-3.5 h-3.5 text-emerald-400" /> 24/7 Zero Gate Refusal Policy
              </span>
            </div>
          </div>

          {/* Instant 108 SOS Card */}
          <div className="w-full lg:w-auto flex-shrink-0">
            <div className="bg-gradient-to-b from-rose-950/80 to-slate-900 border-2 border-rose-500/60 p-5 rounded-2xl shadow-xl shadow-rose-950/60 flex flex-col items-center text-center space-y-3 sm:min-w-[280px]">
              <div className="flex items-center gap-2 text-rose-300 text-xs font-mono font-black uppercase tracking-wider">
                <AlertOctagon className="w-4 h-4 text-rose-400 animate-pulse" />
                <span>Life-Threatening Emergency?</span>
              </div>

              <button
                onClick={handleCall108}
                className="w-full py-3.5 px-6 bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-red-500 text-white font-black text-lg rounded-xl shadow-lg shadow-rose-900/80 flex items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95 cursor-pointer border border-rose-400/60"
              >
                <PhoneCall className="w-6 h-6 animate-bounce" />
                <span>CALL 108 SOS</span>
              </button>

              <button
                onClick={() => {
                  startTurnByTurnNav(recommendedHospital.id);
                }}
                className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 bg-cyan-600/20 border border-cyan-600/40 text-cyan-300 hover:bg-cyan-600/30 transition-all cursor-pointer"
              >
                <Navigation className="w-4 h-4" /> DRIVE MYSELF (GPS NAV)
              </button>

              <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Toll-Free • GPS Location Auto-Transmitted</span>
              </div>
            </div>
          </div>
        </div>

        {callSimActive && (
          <div className="mt-5 p-4 rounded-xl bg-rose-950/90 border border-rose-500/70 text-rose-200 text-xs flex items-center justify-between gap-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-3">
              <PhoneCall className="w-5 h-5 text-rose-400 animate-spin" />
              <span className="font-semibold text-sm">{callSimActive}</span>
            </div>
            <button
              onClick={() => setCallSimActive(null)}
              className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-mono"
            >
              End Call
            </button>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. NAVIGATION TABS & DISTRICT SWITCHER
         ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              sound.playTactileClick();
              setActiveTab('hospitals');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'hospitals'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Hospital className="w-4 h-4" />
            <span>Emergency Facilities ({filteredHospitals.length})</span>
          </button>

          <button
            onClick={() => {
              sound.playTactileClick();
              setActiveTab('blood-pharma');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'blood-pharma'
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Droplet className="w-4 h-4 text-rose-400" />
            <span>Blood &amp; Oxygen Banks</span>
          </button>

          <button
            onClick={() => {
              sound.playTactileClick();
              setActiveTab('first-aid');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'first-aid'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <HeartPulse className="w-4 h-4 text-emerald-400" />
            <span>First-Aid Guides</span>
          </button>

          <button
            onClick={() => {
              sound.playTactileClick();
              setActiveTab('digital-triage');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'digital-triage'
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <User className={`w-4 h-4 ${activeTab === 'digital-triage' ? 'text-white' : 'text-blue-400'}`} />
            <span>Digital Triage &amp; Token</span>
          </button>
        </div>

        {/* District Switcher */}
        <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-1.5 text-xs">
          <MapPin className="w-4 h-4 text-emerald-400" />
          <span className="text-slate-400">District:</span>
          <select
            value={selectedDistrictId}
            onChange={e => {
              sound.playTactileClick();
              setSelectedDistrict(e.target.value as any);
            }}
            className="bg-transparent text-slate-100 font-bold focus:outline-none cursor-pointer"
          >
            <option value="madurai" className="bg-slate-900">Madurai</option>
            <option value="chennai" className="bg-slate-900">Chennai</option>
            <option value="coimbatore" className="bg-slate-900">Coimbatore</option>
            <option value="theni" className="bg-slate-900">Theni</option>
          </select>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. TAB 1: HOSPITALS LIST & HIGH-TECH TACTICAL VECTOR ROUTE THEATER
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'hospitals' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search hospital by name, Govt/Pvt, trauma..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  filterType === 'all'
                    ? 'bg-slate-800 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType('govt')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  filterType === 'govt'
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Govt (Free CMCHIS)
              </button>
              <button
                onClick={() => setFilterType('pvt')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  filterType === 'pvt'
                    ? 'bg-purple-950/80 text-purple-300 border border-purple-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Private Partners
              </button>
              <button
                onClick={() => setFilterType('icu')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  filterType === 'icu'
                    ? 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                ICU Available
              </button>
            </div>
          </div>

          {/* AI Smart Recommendation & Auto-Diversion Banner */}
          {searchQuery === '' && filterType === 'all' && (
            <div
              className={`border rounded-2xl p-5 mb-4 flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in duration-500 ${
                isDiverted
                  ? 'bg-gradient-to-r from-rose-950/40 to-amber-900/20 border-rose-500/50'
                  : 'bg-gradient-to-r from-cyan-950/40 to-blue-900/20 border-cyan-500/30'
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-full border flex items-center justify-center shrink-0 ${
                    isDiverted ? 'bg-rose-500/20 border-rose-500/50' : 'bg-cyan-500/20 border-cyan-500/50'
                  }`}
                >
                  {isDiverted ? <AlertTriangle className="w-6 h-6 text-rose-400" /> : <Sparkles className="w-6 h-6 text-cyan-400" />}
                </div>
                <div>
                  <h3 className={`${isDiverted ? 'text-rose-300' : 'text-cyan-300'} font-bold text-sm flex items-center gap-2`}>
                    {isDiverted ? 'AI Auto-Diversion Active' : 'AI Smart Match'}
                  </h3>
                  <p className="text-slate-300 text-sm mt-1">
                    {isDiverted ? (
                      <>
                        <strong className="text-white">{originalHospital.name}</strong> is at critical capacity. You have been auto-rerouted to{' '}
                        <strong className="text-white">{recommendedHospital.name}</strong> to guarantee immediate care.
                      </>
                    ) : (
                      <>
                        Based on your location, <strong className="text-white">{recommendedHospital.name}</strong> is recommended with lowest ER wait time (
                        {getHospitalBedWaitTimes(recommendedHospital).fastestWaitMinutes}m).
                      </>
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={() => startTurnByTurnNav(recommendedHospital.id)}
                className={`shrink-0 px-5 py-2.5 font-black rounded-xl text-xs transition-all text-slate-950 shadow-lg cursor-pointer flex items-center gap-2 ${
                  isDiverted ? 'bg-rose-500 hover:bg-rose-400 shadow-rose-900/40' : 'bg-cyan-400 hover:bg-cyan-300 shadow-cyan-900/40'
                }`}
              >
                <Navigation className="w-4 h-4" />
                <span>Route &amp; Request Admission</span>
              </button>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              TACTICAL VECTOR GPS ROAD NETWORK & TURN-BY-TURN THEATER (IMAGE 2 STYLE)
             ───────────────────────────────────────────────────────────── */}
          <div className="bg-[#050b18] border border-cyan-500/40 rounded-3xl p-4 sm:p-5 shadow-2xl relative overflow-hidden font-mono">
            {/* Top Tactical Map Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3 border-b border-slate-800/90 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                  <Navigation className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black tracking-wider text-slate-100 flex items-center gap-2 flex-wrap">
                    <span>AUTHENTIC GPS ROAD NETWORK &amp; DIRECT CORRIDOR MAP</span>
                    <span className="text-[10px] px-2.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 uppercase font-mono">
                      {currentDistrict.name} District Grid
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    Click any hospital pin or card to preview distinct road trajectory • Click "Maximize" or "Start GPS" to navigate
                  </p>
                </div>
              </div>

              {/* Map Viewport & Maximize Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowTrafficOverlay(!showTrafficOverlay)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all border cursor-pointer ${
                    showTrafficOverlay ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  🟢 Live Traffic
                </button>

                <div className="flex bg-slate-950 p-0.5 rounded-xl border border-slate-800 text-xs">
                  <button
                    onClick={() => setMapZoom(prev => Math.min(1.6, prev + 0.15))}
                    className="p-1.5 hover:text-cyan-300 text-slate-400 cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setMapZoom(prev => Math.max(0.85, prev - 0.15))}
                    className="p-1.5 hover:text-cyan-300 text-slate-400 cursor-pointer"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setMapZoom(1.0)}
                    className="p-1.5 hover:text-cyan-300 text-slate-400 cursor-pointer"
                    title="Reset View"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      sound.playTactileClick();
                      setIsMapMaximized(true);
                    }}
                    className="p-1.5 bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500 hover:text-slate-950 rounded-lg transition-colors cursor-pointer ml-1"
                    title="Open Fullscreen Map View"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* EXPANDED VECTOR SVG MAP CANVAS (With Live Animated Vehicle & Road Nodes) */}
            <div className="relative w-full h-[380px] sm:h-[450px] rounded-2xl overflow-hidden bg-[#020612] border border-slate-800/80 shadow-inner group">
              <svg
                viewBox="0 0 950 480"
                className="w-full h-full transition-transform duration-300"
                style={{ transform: `scale(${mapZoom})`, transformOrigin: 'center' }}
              >
                <defs>
                  <radialGradient id="patientGpsGlowWide" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
                  </radialGradient>
                  <linearGradient id="activeHighwayGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="50%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#38bdf8" />
                  </linearGradient>
                </defs>

                {/* Tactical Geographic Grid Matrix */}
                {[60, 140, 220, 300, 380, 440].map((y, i) => (
                  <line key={`grid-h-${i}`} x1="0" y1={y} x2="950" y2={y} stroke="#0f172a" strokeWidth="1" strokeDasharray="6,6" />
                ))}
                {[80, 200, 320, 440, 560, 680, 800, 920].map((x, i) => (
                  <line key={`grid-v-${i}`} x1={x} y1="0" x2={x} y2="480" stroke="#0f172a" strokeWidth="1" strokeDasharray="6,6" />
                ))}

                {/* Background Regional Road Network Arteries */}
                <path
                  d="M 50,420 L 250,330 L 450,260 L 680,180 L 900,120"
                  fill="none"
                  stroke="#172554"
                  strokeWidth="8"
                  strokeLinecap="round"
                />
                <text x="540" y="210" fill="#334155" fontSize="10" fontFamily="monospace" transform="rotate(-18 540 210)">
                  NH-85 NATIONAL EXPRESSWAY CORRIDOR
                </text>

                <path
                  d="M 150,450 L 170,300 L 260,180 L 400,90 L 580,40"
                  fill="none"
                  stroke="#172554"
                  strokeWidth="7"
                  strokeLinecap="round"
                />
                <text x="240" y="160" fill="#334155" fontSize="9" fontFamily="monospace" transform="rotate(-40 240 160)">
                  SH-36 NORTH HIGHWAY
                </text>

                {/* Concentric Distance Rings from User Origin */}
                <circle cx={userOrigin.x} cy={userOrigin.y} r="130" fill="none" stroke="#1e293b" strokeWidth="1.2" strokeDasharray="8,6" />
                <circle cx={userOrigin.x} cy={userOrigin.y} r="260" fill="none" stroke="#1e293b" strokeWidth="1.2" strokeDasharray="8,6" />
                <circle cx={userOrigin.x} cy={userOrigin.y} r="390" fill="none" stroke="#0f172a" strokeWidth="1.2" strokeDasharray="8,6" />
                <text x={userOrigin.x + 135} y={userOrigin.y - 5} fill="#475569" fontSize="9" fontFamily="monospace">5 km</text>
                <text x={userOrigin.x + 265} y={userOrigin.y - 5} fill="#475569" fontSize="9" fontFamily="monospace">12 km</text>
                <text x={userOrigin.x + 395} y={userOrigin.y - 5} fill="#475569" fontSize="9" fontFamily="monospace">20 km</text>

                {/* All Hospital Real Road Trajectory Polylines */}
                {mapCoordinates.map(({ hospital, route }) => {
                  const isSelected = activeNavHospital.id === hospital.id;
                  const polylineD = renderSvgPolyline(route.points);

                  return (
                    <g key={`route-${hospital.id}`}>
                      {/* Base Highway Underlay */}
                      <path
                        d={polylineD}
                        fill="none"
                        stroke={isSelected ? '#0e7490' : '#1e293b'}
                        strokeWidth={isSelected ? '10' : '4'}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity={isSelected ? 0.8 : 0.4}
                      />
                      {/* Active Traffic / Live Route Overlay */}
                      <path
                        d={polylineD}
                        fill="none"
                        stroke={isSelected ? 'url(#activeHighwayGlow)' : (showTrafficOverlay ? '#10b981' : '#334155')}
                        strokeWidth={isSelected ? '5' : '2'}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray={isSelected ? '8,4' : 'none'}
                        className={isSelected ? 'animate-pulse' : ''}
                      />
                    </g>
                  );
                })}

                {/* Live Moving Vehicle on the Active Route */}
                <g transform={`translate(${vehicleState.x}, ${vehicleState.y}) rotate(${vehicleState.angle})`}>
                  <circle cx="0" cy="0" r="22" fill="#22d3ee" fillOpacity="0.25" className="animate-ping" />
                  <rect x="-12" y="-7" width="24" height="14" rx="3.5" fill="#0284c7" stroke="#ffffff" strokeWidth="2" />
                  <circle cx="-6" cy="-6" r="2" fill="#0f172a" />
                  <circle cx="6" cy="-6" r="2" fill="#0f172a" />
                  <circle cx="-6" cy="6" r="2" fill="#0f172a" />
                  <circle cx="6" cy="6" r="2" fill="#0f172a" />
                  <rect x="2" y="-4" width="6" height="8" rx="1" fill="#38bdf8" />
                  <circle cx="-2" cy="0" r="2" fill="#ef4444" className="animate-pulse" />
                </g>

                {/* Patient Live GPS Location Origin Pin */}
                <circle cx={userOrigin.x} cy={userOrigin.y} r="50" fill="url(#patientGpsGlowWide)" />
                <circle cx={userOrigin.x} cy={userOrigin.y} r="12" fill="#22d3ee" stroke="#ffffff" strokeWidth="2.5" />
                <circle cx={userOrigin.x} cy={userOrigin.y} r="24" fill="none" stroke="#22d3ee" strokeWidth="2" className="animate-ping" />

                <rect x={userOrigin.x - 70} y={userOrigin.y + 22} width="140" height="26" rx="7" fill="#090f1e" stroke="#22d3ee" strokeWidth="1.5" />
                <text x={userOrigin.x} y={userOrigin.y + 39} fill="#22d3ee" fontSize="10" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                  📍 YOUR GPS ORIGIN
                </text>

                {/* Interactive Hospital Pins & Floating Badges */}
                {mapCoordinates.map(({ hospital: h, x, y }) => {
                  const isSelected = activeNavHospital.id === h.id;
                  const freeBeds = Math.max(0, h.totalBeds - h.occupiedBeds);

                  return (
                    <g
                      key={`pin-${h.id}`}
                      onClick={() => {
                        sound.playRadarPing();
                        setSelectedHospitalId(h.id);
                        setNavHospitalId(h.id);
                      }}
                      className="cursor-pointer group"
                    >
                      {/* Outer Selection Halo */}
                      {isSelected && (
                        <circle cx={x} cy={y} r="28" fill="none" stroke="#22d3ee" strokeWidth="2" className="animate-ping" />
                      )}

                      {/* Hospital Marker Circle */}
                      <circle
                        cx={x}
                        cy={y}
                        r={isSelected ? '18' : '13'}
                        fill={h.ownership === 'Government' ? '#10b981' : h.ownership === 'Trust' ? '#06b6d4' : '#6366f1'}
                        stroke="#ffffff"
                        strokeWidth={isSelected ? '3' : '2'}
                        className="transition-transform duration-300 group-hover:scale-125"
                      />
                      <text x={x} y={y + 4.5} fill="#ffffff" fontSize="11" fontWeight="black" textAnchor="middle">
                        H
                      </text>

                      {/* Floating Glassmorphism Badge */}
                      <g transform={`translate(${x - 90}, ${y - 54})`}>
                        <rect
                          x="0"
                          y="0"
                          width="180"
                          height="42"
                          rx="9"
                          fill="#080e1e"
                          fillOpacity="0.95"
                          stroke={isSelected ? '#22d3ee' : '#334155'}
                          strokeWidth={isSelected ? '2' : '1'}
                          className="shadow-2xl"
                        />
                        <text
                          x="90"
                          y="17"
                          fill={isSelected ? '#22d3ee' : '#ffffff'}
                          fontSize="10"
                          fontWeight="bold"
                          fontFamily="monospace"
                          textAnchor="middle"
                        >
                          {h.name.length > 22 ? h.name.slice(0, 20) + '...' : h.name}
                        </text>
                        <text
                          x="90"
                          y="32"
                          fill={freeBeds > 10 ? '#34d399' : '#fbbf24'}
                          fontSize="9"
                          fontFamily="monospace"
                          textAnchor="middle"
                        >
                          {freeBeds} Beds Free • {h.ownership}
                        </text>
                      </g>
                    </g>
                  );
                })}
              </svg>

              {/* Bottom Active Route Summary Dock */}
              <div className="absolute bottom-3 left-3 right-3 z-10 bg-slate-950/95 backdrop-blur-xl border border-cyan-500/50 p-3 sm:p-4 rounded-2xl text-xs font-mono text-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-300 shrink-0">
                    <Navigation className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Active Driving Corridor:</span>
                    <h4 className="text-sm font-black text-white flex items-center gap-2">
                      <span>{activeNavHospital.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700">
                        {activeNavHospital.ownership}
                      </span>
                    </h4>
                    <p className="text-[11px] text-cyan-300 mt-0.5">
                      Via {activeRoute.roadName} • {Math.max(0, activeNavHospital.totalBeds - activeNavHospital.occupiedBeds)} Free Beds • Zero Gate Refusal
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => startTurnByTurnNav(activeNavHospital.id)}
                    className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-cyan-900/50 transition-transform hover:scale-105 cursor-pointer"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>Start Turn-by-Turn GPS</span>
                  </button>

                  <button
                    onClick={() => {
                      sound.playTactileClick();
                      openReservationModal(activeNavHospital.id);
                    }}
                    className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-400 inline mr-1" />
                    <span>45m Hold</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              4. HOSPITAL CARDS GRID (1-to-1 Linked with Navigation Map)
             ───────────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {filteredHospitals.map(h => {
              const availableTotal = Math.max(0, h.totalBeds - h.occupiedBeds);
              const availableIcu = Math.max(0, h.icuBeds - h.icuOccupied);
              const availableEd = Math.max(0, h.edBays - h.edOccupied);
              const isSelected = activeNavHospital.id === h.id;

              return (
                <div
                  key={h.id}
                  onClick={() => {
                    setSelectedHospitalId(h.id);
                    setNavHospitalId(h.id);
                  }}
                  className={`rounded-3xl bg-gradient-to-b from-slate-900/90 to-[#091122] border p-5 shadow-xl transition-all duration-200 flex flex-col justify-between group cursor-pointer ${
                    isSelected
                      ? 'border-cyan-400 ring-2 ring-cyan-500/30 shadow-cyan-950/60 bg-[#0c1a32]'
                      : 'border-slate-800 hover:border-cyan-500/50'
                  }`}
                >
                  <div>
                    {/* Card Header Row */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider ${
                              h.ownership === 'Government'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : h.ownership === 'Trust'
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                                : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                            }`}
                          >
                            {h.ownership}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
                            {h.traumaLevel}
                          </span>
                          <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                            0m ER Wait
                          </span>
                        </div>

                        <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                          {h.name}
                        </h3>
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-cyan-400" />
                          <span>{currentDistrict.name} District • Direct Emergency Gate Access</span>
                        </p>
                      </div>

                      <div className="bg-slate-950/80 border border-slate-800 px-3 py-2 rounded-xl text-center flex-shrink-0">
                        <div className="text-[10px] font-mono text-slate-400">Driving ETA</div>
                        <div className="text-sm font-mono font-black text-cyan-300">
                          ~{Math.round(h.edWaitMinutes / 2) + 8}m
                        </div>
                      </div>
                    </div>

                    {/* Live Bed Capacity Metrics */}
                    <div className="grid grid-cols-3 gap-2 my-4 bg-slate-950/60 p-3 rounded-xl border border-slate-800/70">
                      <div className="text-center">
                        <div className="text-[10px] text-slate-400 uppercase font-mono">Available Beds</div>
                        <div className="text-base font-extrabold text-emerald-400 font-mono">
                          {availableTotal} <span className="text-xs text-slate-500 font-normal">/ {h.totalBeds}</span>
                        </div>
                      </div>

                      <div className="text-center border-x border-slate-800">
                        <div className="text-[10px] text-slate-400 uppercase font-mono">ICU Beds</div>
                        <div className="text-base font-extrabold text-purple-300 font-mono">
                          {availableIcu} <span className="text-xs text-slate-500 font-normal">/ {h.icuBeds}</span>
                        </div>
                      </div>

                      <div className="text-center">
                        <div className="text-[10px] text-slate-400 uppercase font-mono">ER Trauma Bays</div>
                        <div className="text-base font-extrabold text-cyan-400 font-mono">
                          {availableEd} <span className="text-xs text-slate-500 font-normal">/ {h.edBays}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions: Route & Reserve */}
                  <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          sound.playTactileClick();
                          openReservationModal(h.id);
                        }}
                        className="px-3.5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-transform hover:scale-105 cursor-pointer"
                        title="Book guaranteed 45-minute bed hold with digital QR token"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Reserve Bed (45m Hold)</span>
                      </button>

                      <button
                        onClick={e => {
                          e.stopPropagation();
                          startTurnByTurnNav(h.id);
                        }}
                        className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 hover:border-cyan-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Launch Turn-by-Turn GPS Navigation"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        <span>Route GPS</span>
                      </button>
                    </div>

                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleOpenGoogleMaps(h);
                      }}
                      className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors p-1 cursor-pointer"
                      title="Open in Google Maps"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Google Maps</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          4. TAB 2: BLOOD & OXYGEN CRYOGENIC EMERGENCY GRID
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'blood-pharma' && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Droplet className="w-6 h-6 text-rose-500" />
                  <span>District Blood Bank Availability</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Real-time blood stock monitored across government & certified private banks in {currentDistrict.name}
                </p>
              </div>
              <div className="px-3 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-bold">
                {currentDistrict.name} Hub
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              {Object.entries(bloodData.groups).map(([type, stock]) => (
                <div key={type} className="bg-slate-950/80 border border-slate-800 p-3 rounded-2xl text-center">
                  <div className="text-lg font-black text-rose-400 font-mono">{type}</div>
                  <div className="text-sm font-bold text-white font-mono mt-1">{stock.unitsAvailable} <span className="text-[10px] text-slate-500 font-normal">units</span></div>
                  <div className={`text-[10px] font-semibold mt-1 ${stock.unitsAvailable <= stock.criticalThreshold ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {stock.unitsAvailable <= stock.criticalThreshold ? 'Low Stock' : 'Available'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Wind className="w-6 h-6 text-cyan-400" />
                  <span>Cryogenic Liquid Medical Oxygen (LMO) Grid</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Cylinder and cryogenic tank reserves ready for emergency dispatch
                </p>
              </div>
              <div className="px-3 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded-xl text-xs font-bold">
                Buffer: Safe ({oxygenData.percentage}% • {(oxygenData.currentLiters / 1000).toFixed(1)} kL)
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl">
                <span className="text-xs text-slate-400 font-mono">CENTRAL CRYOGENIC RESERVES</span>
                <div className="text-2xl font-black text-cyan-300 font-mono mt-1">{(oxygenData.currentLiters / 1000).toFixed(1)} kL</div>
                <div className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {oxygenData.hoursAutonomyRemaining} Hours Autonomy Remaining
                </div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl">
                <span className="text-xs text-slate-400 font-mono">BACKUP HIGH PRESSURE CYLINDERS</span>
                <div className="text-2xl font-black text-white font-mono mt-1">{oxygenData.backupCylindersCount} Units</div>
                <div className="text-xs text-cyan-400 mt-1">Ready for Ambulance &amp; ED Rapid Hookup</div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl">
                <span className="text-xs text-slate-400 font-mono">MANIFOLD PRESSURE</span>
                <div className="text-2xl font-black text-emerald-300 font-mono mt-1">{oxygenData.manifoldPressureBar.toFixed(1)} BAR</div>
                <div className="text-xs text-emerald-400 mt-1">Pressure Nominal &amp; Regulated</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          5. TAB 3: FIRST-AID GUIDES & CPR METRONOME
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'first-aid' && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveFirstAidTopic('cpr')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeFirstAidTopic === 'cpr' ? 'bg-rose-500 text-white shadow-lg' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
              }`}
            >
              ❤️ CPR Metronome (110 BPM)
            </button>
            <button
              onClick={() => setActiveFirstAidTopic('stroke')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeFirstAidTopic === 'stroke' ? 'bg-amber-500 text-slate-950 shadow-lg' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
              }`}
            >
              🧠 Stroke F.A.S.T. Test
            </button>
            <button
              onClick={() => setActiveFirstAidTopic('bleeding')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeFirstAidTopic === 'bleeding' ? 'bg-rose-600 text-white shadow-lg' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
              }`}
            >
              🩸 Severe Bleeding / Tourniquet
            </button>
            <button
              onClick={() => setActiveFirstAidTopic('choking')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeFirstAidTopic === 'choking' ? 'bg-cyan-500 text-slate-950 shadow-lg' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
              }`}
            >
              🗣️ Choking (Heimlich)
            </button>
            <button
              onClick={() => setActiveFirstAidTopic('burns')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeFirstAidTopic === 'burns' ? 'bg-orange-500 text-slate-950 shadow-lg' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
              }`}
            >
              🔥 Burn Triage
            </button>
          </div>

          {activeFirstAidTopic === 'cpr' && (
            <div className="bg-gradient-to-b from-[#110714] to-slate-950 border border-rose-500/40 rounded-3xl p-6 md:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-black text-white flex items-center gap-3">
                    <HeartPulse className="w-8 h-8 text-rose-500 animate-pulse" />
                    <span>Hands-Only CPR Metronome</span>
                  </h3>
                  <p className="text-sm text-slate-300 mt-1">
                    Push hard and fast in the center of the chest at 100-120 beats per minute.
                  </p>
                </div>

                <button
                  onClick={() => setCprActive(!cprActive)}
                  className={`px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 transition-all cursor-pointer ${
                    cprActive
                      ? 'bg-rose-600 text-white shadow-xl shadow-rose-900/60 ring-4 ring-rose-500/40'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg'
                  }`}
                >
                  {cprActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  <span>{cprActive ? 'PAUSE METRONOME' : 'START 110 BPM METRONOME'}</span>
                </button>
              </div>

              {/* Visual Pulsing Heart Metronome */}
              <div className="flex flex-col items-center justify-center p-8 bg-black/40 rounded-2xl border border-rose-500/20 text-center space-y-4">
                <div
                  className={`w-32 h-32 rounded-full flex items-center justify-center transition-transform duration-150 ${
                    cprBeat ? 'scale-125 bg-rose-500/40 border-4 border-rose-400' : 'scale-95 bg-rose-950/40 border-2 border-rose-700'
                  }`}
                >
                  <HeartPulse className={`w-16 h-16 ${cprBeat ? 'text-white' : 'text-rose-400'}`} />
                </div>
                <div className="text-sm font-mono text-slate-300">
                  {cprActive ? (
                    <span className="text-rose-400 font-bold text-lg animate-pulse">PUSH NOW • PUSH HARD</span>
                  ) : (
                    <span>Click "START 110 BPM" to synchronize chest compressions</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
                  <span className="text-xs text-rose-400 font-bold">STEP 1</span>
                  <h4 className="text-white font-bold mt-1">Check Responsiveness</h4>
                  <p className="text-xs text-slate-400 mt-1">Tap shoulders and shout. If unresponsive and not breathing, call 108 immediately.</p>
                </div>
                <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
                  <span className="text-xs text-rose-400 font-bold">STEP 2</span>
                  <h4 className="text-white font-bold mt-1">Hand Placement</h4>
                  <p className="text-xs text-slate-400 mt-1">Place heel of one hand in center of chest, interlock fingers of second hand on top.</p>
                </div>
                <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
                  <span className="text-xs text-rose-400 font-bold">STEP 3</span>
                  <h4 className="text-white font-bold mt-1">Compress 2 Inches</h4>
                  <p className="text-xs text-slate-400 mt-1">Compress chest 5-6 cm deep at 110 BPM. Allow full chest recoil between beats.</p>
                </div>
              </div>
            </div>
          )}

          {activeFirstAidTopic === 'stroke' && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Activity className="w-6 h-6 text-amber-400" />
                <span>Stroke F.A.S.T. Assessment</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-slate-950/80 p-4 rounded-2xl border border-amber-500/30">
                  <span className="text-lg font-black text-amber-400">F - FACE</span>
                  <p className="text-xs text-slate-300 mt-1">Ask the person to smile. Does one side of the face droop?</p>
                </div>
                <div className="bg-slate-950/80 p-4 rounded-2xl border border-amber-500/30">
                  <span className="text-lg font-black text-amber-400">A - ARMS</span>
                  <p className="text-xs text-slate-300 mt-1">Ask the person to raise both arms. Does one arm drift downward?</p>
                </div>
                <div className="bg-slate-950/80 p-4 rounded-2xl border border-amber-500/30">
                  <span className="text-lg font-black text-amber-400">S - SPEECH</span>
                  <p className="text-xs text-slate-300 mt-1">Ask the person to repeat a simple phrase. Is their speech slurred or strange?</p>
                </div>
                <div className="bg-slate-950/80 p-4 rounded-2xl border border-rose-500/40">
                  <span className="text-lg font-black text-rose-400">T - TIME</span>
                  <p className="text-xs text-slate-300 mt-1">If you observe ANY of these signs, call 108 immediately. Brain tissue saves within 4.5 hours.</p>
                </div>
              </div>
            </div>
          )}

          {activeFirstAidTopic === 'bleeding' && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Droplet className="w-6 h-6 text-rose-500" />
                <span>Severe Bleeding &amp; Tourniquet Application</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-300">
                <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
                  <strong className="text-white block text-sm mb-1">1. Direct Firm Pressure</strong>
                  Apply heavy direct pressure using a clean cloth or gauze directly over the bleeding wound. Do not remove saturated pads; add more on top.
                </div>
                <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
                  <strong className="text-white block text-sm mb-1">2. Tourniquet Placement</strong>
                  For limb arterial spurting, apply a tourniquet 2-3 inches above the wound (never on a joint). Tighten until bleeding completely stops.
                </div>
                <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
                  <strong className="text-white block text-sm mb-1">3. Note the Application Time</strong>
                  Write down the exact time of tourniquet application on the patient's forehead or bandage for the trauma surgeon.
                </div>
              </div>
            </div>
          )}

          {activeFirstAidTopic === 'choking' && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <HeartPulse className="w-6 h-6 text-cyan-400" />
                <span>Choking / Heimlich Maneuver</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-300">
                <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
                  <strong className="text-white block text-sm mb-1">1. 5 Back Blows</strong>
                  Stand behind the victim, lean them forward, and deliver 5 sharp blows between their shoulder blades using the heel of your hand.
                </div>
                <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
                  <strong className="text-white block text-sm mb-1">2. 5 Abdominal Thrusts</strong>
                  Place fist just above the navel. Grasp with other hand and give quick upward and inward thrusts.
                </div>
                <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
                  <strong className="text-white block text-sm mb-1">3. If Unconscious</strong>
                  Lower victim to the floor and start CPR compressions immediately while checking oral airway.
                </div>
              </div>
            </div>
          )}

          {activeFirstAidTopic === 'burns' && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Flame className="w-6 h-6 text-orange-400" />
                <span>Thermal &amp; Chemical Burn Protocol</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-300">
                <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
                  <strong className="text-white block text-sm mb-1">1. Cool with Running Water</strong>
                  Cool the burn immediately under cool running tap water for 20 minutes. Never use ice or icy water.
                </div>
                <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
                  <strong className="text-white block text-sm mb-1">2. Protect the Area</strong>
                  Cover loosely with clean, non-adherent sterile plastic wrap or clean dressing. Do not apply butter, oil, or ointments.
                </div>
                <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
                  <strong className="text-white block text-sm mb-1">3. Critical Warning</strong>
                  Never pop blisters or remove clothing stuck to burned skin. Dispatch immediately to a burns center.
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          6. TAB 4: DIGITAL TRIAGE & EMERGENCY TOKEN DISPATCH
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'digital-triage' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <User className="w-6 h-6 text-cyan-400" />
                <span>Pre-Arrival Digital Triage &amp; Admission Token</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Complete your symptoms before arriving at the hospital. An emergency token will be transmitted to the triage desk.
              </p>
            </div>
            <button
              onClick={() => {
                sound.playTactileClick();
                setIsScanning(true);
                setTriageToast('Scanning ABHA QR code...');
                setTimeout(() => {
                  setIsScanning(false);
                  setAbhaProfile({
                    name: 'Rajesh Kumar',
                    age: 58,
                    bloodGroup: 'O+',
                    conditions: 'Hypertension, Mild Asthma'
                  });
                  setTriageToast('ABHA Profile loaded successfully!');
                  setTimeout(() => setTriageToast(null), 3500);
                }, 1500);
              }}
              className="px-4 py-2 bg-cyan-600/20 border border-cyan-500/40 hover:bg-cyan-600/30 text-cyan-300 font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              <span>{abhaProfile ? 'ABHA Linked: ' + abhaProfile.name : 'Link Ayushman Bharat (ABHA)'}</span>
            </button>
          </div>

          {triageToast && (
            <div className="p-3 rounded-xl bg-emerald-950/90 border border-emerald-500 text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{triageToast}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-mono font-bold text-slate-300 block mb-1">Target Hospital for Admission</label>
                <select
                  value={triageHospitalId || activeNavHospital.id}
                  onChange={e => setTriageHospitalId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  {currentDistrict.hospitals.map(h => (
                    <option key={h.id} value={h.id}>
                      {h.name} ({h.ownership}) - {Math.max(0, h.totalBeds - h.occupiedBeds)} Beds Free
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-mono font-bold text-slate-300 flex items-center justify-between mb-1">
                  <span>Pain / Severity Level</span>
                  <span className="text-rose-400 font-bold">{painLevel} / 10</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={painLevel}
                  onChange={e => setPainLevel(parseInt(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-xs font-mono font-bold text-slate-300 block mb-1">Primary Symptoms &amp; Notes</label>
                <textarea
                  value={symptoms}
                  onChange={e => setSymptoms(e.target.value)}
                  placeholder="e.g., Severe chest discomfort, shortness of breath for 30 minutes..."
                  className="w-full h-24 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>
            </div>

            <div className="space-y-4 flex flex-col justify-between">
              <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-xs font-mono text-cyan-300 font-bold block">PATIENT TRIAGE SUMMARY</span>
                <div className="text-xs text-slate-300">
                  <strong>Name:</strong> {abhaProfile ? abhaProfile.name : 'Citizen Self-Check-in'}
                </div>
                <div className="text-xs text-slate-300">
                  <strong>Blood Group:</strong> {abhaProfile ? abhaProfile.bloodGroup : 'Unknown'}
                </div>
                <div className="text-xs text-slate-300">
                  <strong>Acuity Code:</strong>{' '}
                  <span className={`font-mono font-bold ${painLevel >= 8 ? 'text-rose-400' : painLevel >= 5 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {painLevel >= 8 ? 'RESUSCITATION LEVEL 1' : painLevel >= 5 ? 'URGENT LEVEL 2' : 'STANDARD LEVEL 3'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  sound.playAlertTone();
                  const targetId = triageHospitalId || activeNavHospital.id;
                  const hosp = currentDistrict.hospitals.find(h => h.id === targetId);
                  submitBedRequest({
                    patientName: abhaProfile ? abhaProfile.name : 'Emergency Citizen',
                    patientAge: abhaProfile ? abhaProfile.age : 45,
                    bloodGroup: abhaProfile ? abhaProfile.bloodGroup : 'O+',
                    medicalHistory: abhaProfile ? abhaProfile.conditions : 'Self Reported',
                    hospitalId: targetId,
                    hospitalName: hosp?.name || activeNavHospital.name,
                    acuity: painLevel >= 8 ? 2 : painLevel >= 5 ? 3 : 4,
                    diagnosis: symptoms.trim() || 'Undisclosed Acute Symptoms'
                  });
                  setTriageToast('Digital Triage Token Transmitted to Hospital ER Desk!');
                  setShowQrTokenModal(true);
                }}
                className="w-full py-4 bg-gradient-to-r from-blue-600 via-cyan-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-slate-950 font-black text-sm rounded-2xl shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-transform hover:scale-[1.02]"
              >
                <QrCode className="w-5 h-5" />
                <span>TRANSMIT &amp; GENERATE QR PASS</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          7. FULLSCREEN / MAXIMIZED MAP THEATER MODAL (Open Map Fully on Click)
         ───────────────────────────────────────────────────────────── */}
      {isMapMaximized && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-2xl flex items-center justify-center p-2 sm:p-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-[#050b18] border-2 border-cyan-500/70 rounded-3xl w-full max-w-7xl h-[92vh] shadow-2xl overflow-hidden flex flex-col font-mono">
            {/* Header */}
            <div className="bg-[#09152b] p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-400">
                  <Navigation className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    <span>MAXIMIZED REGIONAL GPS CORRIDOR THEATER</span>
                    <span className="text-xs px-2.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700 uppercase">
                      {currentDistrict.name}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Viewing full district road grid • Live vehicle tracking active
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowTurnListOverlay(!showTurnListOverlay)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    showTurnListOverlay ? 'bg-cyan-500 text-slate-950 border-cyan-400' : 'bg-slate-900 border-slate-700 text-slate-300'
                  }`}
                >
                  <Route className="w-4 h-4 inline mr-1" />
                  <span>Turn-by-Turn Panel</span>
                </button>

                <button
                  onClick={() => setIsMapMaximized(false)}
                  className="p-2 bg-slate-800 hover:bg-rose-900/60 hover:text-rose-300 text-slate-400 rounded-xl transition-colors cursor-pointer"
                  title="Close Fullscreen View"
                >
                  <Minimize2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Split Screen Full Map View + Turn by Turn Steps */}
            <div className="relative flex-1 flex flex-col lg:flex-row overflow-hidden">
              {/* Maximized Map Canvas */}
              <div className="relative flex-1 bg-[#020612] p-2 flex items-center justify-center overflow-hidden">
                <svg viewBox="0 0 950 480" className="w-full h-full">
                  <defs>
                    <radialGradient id="patientGpsGlowWideFull" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
                    </radialGradient>
                  </defs>

                  {/* Tactical Grid */}
                  {[60, 140, 220, 300, 380, 440].map((y, i) => (
                    <line key={`grid-hf-${i}`} x1="0" y1={y} x2="950" y2={y} stroke="#0f172a" strokeWidth="1" strokeDasharray="6,6" />
                  ))}
                  {[80, 200, 320, 440, 560, 680, 800, 920].map((x, i) => (
                    <line key={`grid-vf-${i}`} x1={x} y1="0" x2={x} y2="480" stroke="#0f172a" strokeWidth="1" strokeDasharray="6,6" />
                  ))}

                  {/* Highways */}
                  <path d="M 50,420 L 250,330 L 450,260 L 680,180 L 900,120" fill="none" stroke="#172554" strokeWidth="10" strokeLinecap="round" />
                  <path d="M 150,450 L 170,300 L 260,180 L 400,90 L 580,40" fill="none" stroke="#172554" strokeWidth="8" strokeLinecap="round" />

                  {/* Hospital Polylines */}
                  {mapCoordinates.map(({ hospital, route }) => {
                    const isSelected = activeNavHospital.id === hospital.id;
                    const polylineD = renderSvgPolyline(route.points);

                    return (
                      <g key={`full-route-${hospital.id}`}>
                        <path d={polylineD} fill="none" stroke={isSelected ? '#0e7490' : '#1e293b'} strokeWidth={isSelected ? '12' : '4'} strokeLinecap="round" strokeLinejoin="round" />
                        <path d={polylineD} fill="none" stroke={isSelected ? 'url(#activeHighwayGlow)' : '#10b981'} strokeWidth={isSelected ? '6' : '2'} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={isSelected ? '8,4' : 'none'} className={isSelected ? 'animate-pulse' : ''} />
                      </g>
                    );
                  })}

                  {/* Vehicle */}
                  <g transform={`translate(${vehicleState.x}, ${vehicleState.y}) rotate(${vehicleState.angle})`}>
                    <circle cx="0" cy="0" r="26" fill="#22d3ee" fillOpacity="0.25" className="animate-ping" />
                    <rect x="-14" y="-8" width="28" height="16" rx="4" fill="#0284c7" stroke="#ffffff" strokeWidth="2.5" />
                    <circle cx="-2" cy="0" r="2.5" fill="#ef4444" className="animate-pulse" />
                  </g>

                  {/* Origin */}
                  <circle cx={userOrigin.x} cy={userOrigin.y} r="50" fill="url(#patientGpsGlowWideFull)" />
                  <circle cx={userOrigin.x} cy={userOrigin.y} r="12" fill="#22d3ee" stroke="#ffffff" strokeWidth="2.5" />

                  {/* Hospital Pins */}
                  {mapCoordinates.map(({ hospital: h, x, y }) => {
                    const isSelected = activeNavHospital.id === h.id;
                    return (
                      <g
                        key={`full-pin-${h.id}`}
                        onClick={() => {
                          sound.playRadarPing();
                          setSelectedHospitalId(h.id);
                          setNavHospitalId(h.id);
                        }}
                        className="cursor-pointer"
                      >
                        <circle cx={x} cy={y} r={isSelected ? '20' : '14'} fill={h.ownership === 'Government' ? '#10b981' : '#6366f1'} stroke="#ffffff" strokeWidth="3" />
                        <text x={x} y={y + 5} fill="#ffffff" fontSize="12" fontWeight="black" textAnchor="middle">H</text>
                        <rect x={x - 85} y={y - 50} width="170" height="38" rx="8" fill="#090f1e" stroke={isSelected ? '#22d3ee' : '#334155'} strokeWidth={isSelected ? '2' : '1'} />
                        <text x={x} y={y - 34} fill={isSelected ? '#22d3ee' : '#ffffff'} fontSize="10" fontWeight="bold" textAnchor="middle">{h.name.slice(0, 19)}...</text>
                        <text x={x} y={y - 19} fill="#34d399" fontSize="9" textAnchor="middle">{h.totalBeds - h.occupiedBeds} Beds Free</text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Turn by Turn Sidebar */}
              {showTurnListOverlay && (
                <div className="w-full lg:w-96 bg-[#071124] border-t lg:border-t-0 lg:border-l border-slate-800 p-4 overflow-y-auto space-y-4 shrink-0">
                  <div className="border-b border-slate-800 pb-3">
                    <span className="text-[10px] text-cyan-400 uppercase font-bold block">TARGET DESTINATION</span>
                    <h4 className="text-base font-black text-white">{activeNavHospital.name}</h4>
                    <p className="text-xs text-slate-300 mt-0.5">{activeRoute.roadName}</p>
                  </div>

                  <div className="space-y-3">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">STEP-BY-STEP MANEUVERS</span>
                    {activeRoute.maneuvers.map((m, idx) => (
                      <div
                        key={`step-${idx}`}
                        className={`p-3 rounded-2xl border transition-all ${
                          idx === currentTurnManeuver.index
                            ? 'bg-cyan-950/80 border-cyan-400 ring-2 ring-cyan-500/30'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl shrink-0">{m.icon}</span>
                          <div>
                            <div className="text-xs font-bold text-white">{m.instruction}</div>
                            <div className="text-[11px] text-slate-300 mt-0.5">{m.sub}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      setIsMapMaximized(false);
                      startTurnByTurnNav(activeNavHospital.id);
                    }}
                    className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-xl cursor-pointer"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>LAUNCH TURN-BY-TURN COCKPIT</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          8. INTERACTIVE TURN-BY-TURN LIVE GPS NAVIGATION COCKPIT MODAL
         ───────────────────────────────────────────────────────────── */}
      {isNavCockpitOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-3 sm:p-5 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-[#070d1e] border-2 border-cyan-500/60 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] font-mono">
            {/* Top Navigation HUD Header */}
            <div className="bg-[#0b162f] p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-3xl shrink-0">
                  {currentTurnManeuver.icon}
                </div>
                <div>
                  <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
                    DESTINATION: {activeNavHospital.name} ({activeNavHospital.ownership})
                  </div>
                  <h3 className="text-sm sm:text-base font-black text-white">
                    {currentTurnManeuver.instruction}
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {currentTurnManeuver.sub}
                  </p>
                </div>
              </div>

              {/* Header Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleVoiceGuidance}
                  className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isVoiceActive ? 'bg-cyan-500 text-slate-950 border-cyan-400 animate-pulse' : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                  }`}
                  title="Toggle Voice Guidance"
                >
                  {isVoiceActive ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  <span>{isVoiceActive ? 'Voice ON' : 'Muted'}</span>
                </button>

                <button
                  onClick={() => setShowQrTokenModal(true)}
                  className="px-3 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Show QR Token</span>
                </button>

                <button
                  onClick={() => setIsNavCockpitOpen(false)}
                  className="p-2 bg-slate-800 hover:bg-rose-900/60 hover:text-rose-300 text-slate-400 rounded-xl transition-colors cursor-pointer"
                  title="Exit Navigation"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Live Navigation GPS Map Canvas */}
            <div className="relative flex-1 min-h-[340px] bg-[#020612] p-4 flex items-center justify-center overflow-hidden">
              <svg viewBox="0 0 880 380" className="w-full h-full">
                <defs>
                  <linearGradient id="cockpitRoadGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="50%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#38bdf8" />
                  </linearGradient>
                </defs>

                {/* Dark Tactical Grid */}
                {[60, 120, 180, 240, 300, 360].map((y, i) => (
                  <line key={`cockpit-h-${i}`} x1="0" y1={y} x2="880" y2={y} stroke="#0f172a" strokeWidth="1" strokeDasharray="4,4" />
                ))}
                {[80, 200, 320, 440, 560, 680, 800].map((x, i) => (
                  <line key={`cockpit-v-${i}`} x1={x} y1="0" x2={x} y2="380" stroke="#0f172a" strokeWidth="1" strokeDasharray="4,4" />
                ))}

                {/* Multi-Turn Road Corridor Polyline */}
                <path
                  d={renderSvgPolyline(activeRoute.points)}
                  fill="none"
                  stroke="#1e293b"
                  strokeWidth="24"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d={renderSvgPolyline(activeRoute.points)}
                  fill="none"
                  stroke="url(#cockpitRoadGradient)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Road Waypoint Junction Labels */}
                {activeRoute.points.slice(1, -1).map((pt, idx) => (
                  <g key={`waypoint-${idx}`}>
                    <circle cx={pt[0]} cy={pt[1]} r="6" fill="#0f172a" stroke="#22d3ee" strokeWidth="2" />
                    <text x={pt[0]} y={pt[1] - 12} fill="#64748b" fontSize="9" fontFamily="monospace" textAnchor="middle">
                      Junction {idx + 1}
                    </text>
                  </g>
                ))}

                {/* Origin Marker */}
                <circle cx={activeRoute.points[0][0]} cy={activeRoute.points[0][1]} r="8" fill="#22d3ee" stroke="#ffffff" strokeWidth="2" />

                {/* Destination Hospital Pin */}
                {(() => {
                  const endPt = activeRoute.points[activeRoute.points.length - 1];
                  return (
                    <g transform={`translate(${endPt[0]}, ${endPt[1]})`}>
                      <circle cx="0" cy="0" r="20" fill="#10b981" stroke="#ffffff" strokeWidth="3" />
                      <text x="0" y="5" fill="#ffffff" fontSize="13" fontWeight="bold" textAnchor="middle">
                        H
                      </text>
                      <rect x="-80" y="-45" width="160" height="24" rx="6" fill="#090f1e" stroke="#10b981" strokeWidth="1.5" />
                      <text x="0" y="-29" fill="#10b981" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                        {activeNavHospital.name.slice(0, 18)}...
                      </text>
                    </g>
                  );
                })()}

                {/* Animated Moving Vehicle Marker */}
                <g transform={`translate(${vehicleState.x}, ${vehicleState.y}) rotate(${vehicleState.angle})`}>
                  <circle cx="0" cy="0" r="26" fill="#22d3ee" fillOpacity="0.2" className="animate-ping" />
                  <rect x="-14" y="-8" width="28" height="16" rx="4" fill="#0284c7" stroke="#ffffff" strokeWidth="2" />
                  <circle cx="-7" cy="-7" r="2.5" fill="#0f172a" />
                  <circle cx="7" cy="-7" r="2.5" fill="#0f172a" />
                  <circle cx="-7" cy="7" r="2.5" fill="#0f172a" />
                  <circle cx="7" cy="7" r="2.5" fill="#0f172a" />
                  <rect x="2" y="-5" width="8" height="10" rx="1.5" fill="#38bdf8" />
                  <circle cx="-2" cy="0" r="2.5" fill="#ef4444" className="animate-pulse" />
                </g>
              </svg>

              {/* Floating Speed & Telemetry Overlay */}
              <div className="absolute top-4 left-4 bg-slate-950/90 border border-cyan-500/50 p-3 rounded-xl text-center shadow-xl">
                <span className="text-[9px] text-slate-400 block font-mono">ESTIMATED SPEED</span>
                <span className="text-xl font-black font-mono text-cyan-300">
                  {isNavPaused ? 0 : 52} <span className="text-[10px] text-slate-500">km/h</span>
                </span>
              </div>

              {/* Simulation Playback Controls */}
              <div className="absolute top-4 right-4 bg-slate-950/90 border border-slate-800 p-2 rounded-xl flex items-center gap-2 shadow-xl">
                <button
                  onClick={() => setIsNavPaused(!isNavPaused)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs cursor-pointer"
                  title={isNavPaused ? 'Resume' : 'Pause'}
                >
                  {isNavPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4 text-amber-400" />}
                </button>

                <button
                  onClick={() => {
                    const speeds = [1, 2, 5];
                    const next = speeds[(speeds.indexOf(navSpeedMultiplier) + 1) % speeds.length];
                    setNavSpeedMultiplier(next);
                  }}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg text-xs font-bold cursor-pointer"
                  title="Cycle Speed Multiplier"
                >
                  {navSpeedMultiplier}x
                </button>

                <button
                  onClick={() => {
                    setNavProgress(0.04);
                    setIsNavPaused(false);
                    lastSpokenStep.current = -1;
                  }}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-lg cursor-pointer"
                  title="Restart Simulation"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Bottom Live Navigation Telemetry Bar */}
            <div className="bg-[#0b162f] p-4 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center shrink-0">
              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">TIME REMAINING</span>
                <span className="text-base font-black text-cyan-300">{currentTurnManeuver.timeRemaining}</span>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">DISTANCE REMAINING</span>
                <span className="text-base font-black text-emerald-400">{currentTurnManeuver.distanceRemaining}</span>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">ER RECEPTION GATE</span>
                <span className="text-base font-black text-emerald-300">Resus Bay A</span>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">BED RESERVATION</span>
                <span className="text-base font-black text-amber-400">Guaranteed Hold</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          9. DIGITAL TRIAGE QR TOKEN MODAL (For Arrival Presentation)
         ───────────────────────────────────────────────────────────── */}
      {showQrTokenModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0b1328] border border-cyan-500/50 rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center font-mono space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-cyan-300 uppercase">Emergency Gate Pass</span>
              <button onClick={() => setShowQrTokenModal(false)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>

            <div className="bg-white p-4 rounded-2xl inline-block shadow-lg">
              <QrCode className="w-32 h-32 text-slate-950 mx-auto" />
            </div>

            <div>
              <div className="text-xs font-bold text-slate-200">TOKEN: #TN-ER-2026-991</div>
              <p className="text-[11px] text-slate-400 mt-1">
                Show this QR Code at {activeNavHospital.name} Triage Desk for zero-wait registration.
              </p>
            </div>

            <button
              onClick={() => setShowQrTokenModal(false)}
              className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-xl text-xs cursor-pointer"
            >
              Done / Return to Map
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { useHospitalStore } from '../../store/hospitalStore';
import { getGoogleMapsDirectionsUrl } from '../../data/realDistrictsData';
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
  User
} from 'lucide-react';

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
    setDedicatedRouteActive,
    bloodData,
    oxygenData,
    setUserRole,
    language,
    submitBedRequest,
    bedRequests
  } = useHospitalStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'govt' | 'pvt' | 'icu'>('all');
  const [activeTab, setActiveTab] = useState<'hospitals' | 'blood-pharma' | 'first-aid' | 'digital-triage'>('hospitals');
  const [callSimActive, setCallSimActive] = useState<string | null>(null);

  // Digital Triage States
  const [triageHospitalId, setTriageHospitalId] = useState<string>('');
  const [selectedBodyParts, setSelectedBodyParts] = useState<string[]>([]);
  const [triageToast, setTriageToast] = useState<string | null>(null);
  const [painLevel, setPainLevel] = useState<number>(5);
  const [symptoms, setSymptoms] = useState<string>('');

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

  // Handle 108 Emergency Call Simulation
  const handleCall108 = () => {
    sound.playAlertTone();
    setCallSimActive('Connecting to 108 Emergency Command Dispatcher...');
    setTimeout(() => {
      setCallSimActive('108 Operator Connected: "State Emergency Medical Services. Your GPS location has been pinpointed. Ambulances on standby."');
    }, 1500);
  };

  // Open in-app navigation
  const handleNavigateInApp = (hospitalId: string) => {
    sound.playRadarPing();
    setSelectedHospitalId(hospitalId);
    setDedicatedRouteActive(true);
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

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300">
      {/* 1. TOP CITIZEN BANNER & EMERGENCY SOS ROW */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0c1a2e] via-[#091424] to-[#040813] border border-cyan-500/30 p-6 md:p-8 shadow-2xl shadow-cyan-950/40">
        {/* Subtle glowing accents */}
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
                : 'Real-time verified hospital bed occupancy, zero ER gate refusal wait times, guaranteed 45-minute bed reservations, and 108 Emergency ambulance dispatch.'}
            </p>

            {/* Scheme Protection Banner */}
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

              <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Toll-Free • GPS Location Auto-Transmitted</span>
              </div>
            </div>
          </div>
        </div>

        {/* Active 108 Call Simulated Notice */}
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

      {/* 2. ACTIVE BED RESERVATION CARD (IF CITIZEN HAS ACTIVE TOKEN) */}
      {activeReservation && (
        <div className="rounded-2xl bg-gradient-to-r from-cyan-950/90 via-slate-900 to-blue-950/90 border-2 border-cyan-400/80 p-5 shadow-2xl shadow-cyan-950/60 animate-in slide-in-from-top-4 duration-300">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-300 shadow-inner flex-shrink-0">
                <QrCode className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-500 text-slate-950 font-mono font-black text-[10px] px-2 py-0.5 rounded uppercase">
                    CONFIRMED HOLD
                  </span>
                  <span className="font-mono text-cyan-400 font-bold text-sm">
                    Token: {activeReservation.id}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white">
                  Bed Reserved at {activeReservation.hospitalName}
                </h3>
                <p className="text-xs text-slate-300">
                  Department: <strong className="text-cyan-300">{activeReservation.department}</strong> • Patient: <strong className="text-white">{activeReservation.patientName}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              <div className="bg-slate-950/80 border border-cyan-500/40 px-3.5 py-2 rounded-xl text-center">
                <div className="text-[10px] uppercase font-mono text-slate-400">Guaranteed Hold</div>
                <div className="text-lg font-mono font-black text-cyan-300 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-cyan-400 animate-spin" />
                  <span>
                    {Math.floor(activeReservation.remainingSeconds / 60)}:
                    {(activeReservation.remainingSeconds % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              </div>

              <button
                onClick={() => handleNavigateInApp(activeReservation.hospitalId)}
                className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition-transform hover:scale-105"
              >
                <Navigation className="w-4 h-4" />
                <span>Navigate to ER</span>
              </button>

              <button
                onClick={() => {
                  sound.playTactileClick();
                  cancelBedReservation();
                }}
                className="px-3 py-2.5 bg-slate-800 hover:bg-rose-900/60 hover:border-rose-500 border border-slate-700 text-slate-300 hover:text-rose-200 text-xs rounded-xl transition-colors"
                title="Cancel bed hold if no longer needed"
              >
                Cancel Hold
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. NAVIGATION TABS: HOSPITALS | BLOOD & PHARMACY | FIRST AID */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
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
            <span>Blood & Oxygen Banks</span>
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
            <span>Digital Triage</span>
          </button>
        </div>

        {/* District Switcher for Patient */}
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
            <option value="chennai" className="bg-slate-900">Chennai</option>
            <option value="madurai" className="bg-slate-900">Madurai</option>
            <option value="coimbatore" className="bg-slate-900">Coimbatore</option>
            <option value="theni" className="bg-slate-900">Theni</option>
          </select>
        </div>
      </div>

      {/* 4. TAB 1: HOSPITALS LIST VIEW */}
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

          {/* Hospital Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredHospitals.map(h => {
              const availableTotal = Math.max(0, h.totalBeds - h.occupiedBeds);
              const availableIcu = Math.max(0, h.icuBeds - h.icuOccupied);
              const availableEd = Math.max(0, h.edBays - h.edOccupied);

              return (
                <div
                  key={h.id}
                  className="rounded-2xl bg-gradient-to-b from-slate-900/90 to-[#091122] border border-slate-800 hover:border-cyan-500/50 p-5 shadow-xl transition-all duration-200 flex flex-col justify-between group"
                >
                  <div>
                    {/* Card Top Row: Name & Badges */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider ${
                              h.ownership === 'Government'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
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

                  {/* Card Actions */}
                  <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
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
                        onClick={() => handleNavigateInApp(h.id)}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 hover:border-cyan-500/40 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        title="View Real-Time Street Navigation Route"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        <span>Route</span>
                      </button>
                    </div>

                    <button
                      onClick={() => handleOpenGoogleMaps(h)}
                      className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors p-1"
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

      {/* 5. TAB 2: BLOOD & OXYGEN BANK PUBLIC CHECKER */}
      {activeTab === 'blood-pharma' && (
        <div className="space-y-6">
          {/* Blood Availability Grid */}
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 font-bold">
                  <Droplet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Central Emergency Blood Bank Stock</h3>
                  <p className="text-xs text-slate-400">Live verified packed red blood cells (PRBC) in {currentDistrict.name}</p>
                </div>
              </div>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
                State Transfusion Grid Active
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {Object.entries(bloodData.groups).map(([grp, info]) => {
                const isCritical = info.unitsAvailable <= info.criticalThreshold;
                return (
                  <div
                    key={grp}
                    className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                      isCritical
                        ? 'bg-rose-950/40 border-rose-500/40'
                        : 'bg-slate-950/70 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-black text-white font-mono">{grp}</span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                          isCritical
                            ? 'bg-rose-500/20 text-rose-300 font-bold animate-pulse'
                            : 'bg-emerald-500/20 text-emerald-300 font-semibold'
                        }`}
                      >
                        {isCritical ? 'High Demand' : 'Available'}
                      </span>
                    </div>
                    <div className="mt-3">
                      <div className="text-2xl font-extrabold text-white font-mono">{info.unitsAvailable}</div>
                      <div className="text-[10px] text-slate-400 font-mono">Units Verified Ready</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Liquid Medical Oxygen (LMO) Status */}
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Cryogenic Liquid Medical Oxygen (LMO) Autonomy</h3>
                <p className="text-xs text-slate-400">
                  {currentDistrict.name} District Reserve: {oxygenData.currentLiters.toLocaleString()} / {oxygenData.tankCapacityLiters.toLocaleString()} Liters ({oxygenData.percentage}%)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-[10px] font-mono text-slate-400">Autonomy Reserve</div>
                <div className="text-base font-mono font-bold text-emerald-400">
                  {oxygenData.hoursAutonomyRemaining} Hours Safe
                </div>
              </div>
              <div className="w-24 bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-700">
                <div
                  className="bg-cyan-400 h-full rounded-full"
                  style={{ width: `${oxygenData.percentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. TAB 3: FIRST AID INSTRUCTIONS */}
      {activeTab === 'first-aid' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* CPR Card */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
              <HeartPulse className="w-5 h-5" />
              <span>Cardiac Arrest & CPR</span>
            </div>
            <ul className="text-xs text-slate-300 space-y-2 leading-relaxed list-disc list-inside">
              <li>Check responsiveness and normal breathing.</li>
              <li>Call 108 immediately and put phone on speaker.</li>
              <li>Push hard and fast in the center of the chest: 100-120 beats per minute (to the beat of &quot;Stayin&apos; Alive&quot;).</li>
              <li>Allow full chest recoil between compressions.</li>
            </ul>
          </div>

          {/* Road Accident Bleeding */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <AlertTriangle className="w-5 h-5" />
              <span>Severe Bleeding & Trauma</span>
            </div>
            <ul className="text-xs text-slate-300 space-y-2 leading-relaxed list-disc list-inside">
              <li>Apply firm, continuous direct pressure with clean cloth or bandage.</li>
              <li>Do not remove impaled objects; stabilize them in place.</li>
              <li>Keep patient calm, lying down, and warm to prevent shock.</li>
              <li>Do not move someone with suspected spinal trauma unless immediate danger exists.</li>
            </ul>
          </div>

          {/* Stroke FAST Checklist */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
              <Activity className="w-5 h-5" />
              <span>Stroke FAST Detection</span>
            </div>
            <ul className="text-xs text-slate-300 space-y-2 leading-relaxed">
              <li><strong className="text-white">F - Face:</strong> Ask to smile. Does one side of the face droop?</li>
              <li><strong className="text-white">A - Arms:</strong> Ask to raise both arms. Does one arm drift downward?</li>
              <li><strong className="text-white">S - Speech:</strong> Ask to repeat a simple sentence. Is speech slurred?</li>
              <li><strong className="text-white">T - Time:</strong> Call 108 immediately. Thrombolytic window is &lt;4.5 hours.</li>
            </ul>
          </div>
        </div>
      )}

      {/* 8. TAB 4: DIGITAL TRIAGE / PRE-ARRIVAL FORM */}
      {activeTab === 'digital-triage' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            
            {/* Active Patient Requests */}
            {bedRequests.filter(r => r.patientName === 'Public Citizen').length > 0 && (
              <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-xl mb-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-cyan-400" />
                  Your Active Bed Requests
                </h3>
                <div className="space-y-3">
                  {bedRequests.filter(r => r.patientName === 'Public Citizen').map(req => (
                    <div key={req.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-700/50 bg-slate-950/50">
                      <div>
                        <div className="font-bold text-slate-200">{req.hospitalName}</div>
                        <div className="text-xs text-slate-400 font-mono">REQ ID: {req.id}</div>
                      </div>
                      <div className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono border flex items-center gap-2
                        ${req.status === 'approved' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                          req.status === 'rejected' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
                          'bg-amber-500/20 text-amber-300 border-amber-500/40'}`}
                      >
                        {req.status === 'approved' && <CheckCircle2 className="w-4 h-4" />}
                        {req.status === 'rejected' && <AlertOctagon className="w-4 h-4" />}
                        {req.status === 'pending' && <Clock className="w-4 h-4 animate-pulse" />}
                        {req.status.toUpperCase()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-3xl bg-[#09111e] border border-slate-800 p-6 md:p-8 shadow-2xl relative overflow-hidden">
              {/* Apple Health style glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="text-center space-y-2 mb-8 relative z-10">
              <h2 className="text-2xl font-bold text-white tracking-tight">Pre-Arrival Triage Form</h2>
              <p className="text-slate-400 text-sm">Tap the areas where you are experiencing pain or discomfort.</p>
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-center md:items-start justify-center relative z-10">
              {/* Interactive Human Body Map */}
              <div className="relative w-full max-w-[280px] bg-slate-900/50 p-6 rounded-3xl border border-slate-800 shadow-inner shrink-0">
                <svg viewBox="0 0 200 320" className="w-full h-auto drop-shadow-2xl">
                  {[
                    { id: 'head', label: 'Head', svg: <circle cx="100" cy="40" r="25" /> },
                    { id: 'chest', label: 'Chest', svg: <rect x="65" y="75" width="70" height="60" rx="15" /> },
                    { id: 'stomach', label: 'Stomach', svg: <rect x="70" y="140" width="60" height="50" rx="15" /> },
                    { id: 'left-arm', label: 'Left Arm', svg: <rect x="35" y="80" width="22" height="90" rx="11" transform="rotate(15 46 80)" /> },
                    { id: 'right-arm', label: 'Right Arm', svg: <rect x="143" y="80" width="22" height="90" rx="11" transform="rotate(-15 154 80)" /> },
                    { id: 'left-leg', label: 'Left Leg', svg: <rect x="65" y="195" width="26" height="110" rx="13" /> },
                    { id: 'right-leg', label: 'Right Leg', svg: <rect x="109" y="195" width="26" height="110" rx="13" /> },
                  ].map((part) => (
                    <g
                      key={part.id}
                      onClick={() => {
                        sound.playTactileClick();
                        setSelectedBodyParts(prev => 
                          prev.includes(part.id) ? prev.filter(p => p !== part.id) : [...prev, part.id]
                        );
                        setTriageToast(`Sending vitals for ${part.label} to ER dashboard...`);
                        setTimeout(() => setTriageToast(null), 3000);
                      }}
                      className="cursor-pointer group"
                    >
                      {React.cloneElement(part.svg, {
                        className: `transition-all duration-300 ${
                          selectedBodyParts.includes(part.id)
                            ? 'fill-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]'
                            : 'fill-slate-700 group-hover:fill-slate-600'
                        }`
                      })}
                    </g>
                  ))}
                </svg>

                {/* Toast Overlay */}
                <div className={`absolute top-4 left-1/2 -translate-x-1/2 w-[90%] bg-slate-800/95 backdrop-blur-md border border-cyan-500/30 text-cyan-300 text-[10px] sm:text-xs font-medium px-3 py-2 rounded-xl shadow-xl flex items-center justify-center gap-2 transition-all duration-300 ${triageToast ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
                  <Activity className="w-3.5 h-3.5 animate-pulse text-rose-400" />
                  <span className="truncate">{triageToast}</span>
                </div>
              </div>

              {/* Triage Details Form */}
              <div className="w-full max-w-md space-y-6">
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-300">Target Hospital (Bed Request)</label>
                  <select 
                    value={triageHospitalId}
                    onChange={(e) => setTriageHospitalId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all appearance-none"
                  >
                    <option value="" disabled>Select nearest hospital...</option>
                    {currentDistrict.hospitals.map(h => (
                      <option key={h.id} value={h.id}>{h.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-300 flex items-center justify-between">
                    <span>Pain Intensity</span>
                    <span className="text-rose-400 font-mono bg-rose-500/10 px-2 py-0.5 rounded">{painLevel} / 10</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={painLevel}
                    onChange={(e) => setPainLevel(parseInt(e.target.value))}
                    className="w-full accent-rose-500 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-medium px-1">
                    <span>Mild</span>
                    <span>Moderate</span>
                    <span>Severe</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-300">Detailed Symptoms</label>
                  <textarea
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    placeholder="Describe how you're feeling, when it started, etc."
                    className="w-full h-24 bg-slate-900/50 border border-slate-700 rounded-2xl p-4 text-sm text-slate-200 focus:outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/50 transition-all resize-none placeholder:text-slate-600"
                  />
                </div>

                <button
                  onClick={() => {
                    if (!triageHospitalId) {
                      setTriageToast("Please select a target hospital first.");
                      setTimeout(() => setTriageToast(null), 3000);
                      return;
                    }
                    sound.playTactileClick();
                    const hosp = currentDistrict.hospitals.find(h => h.id === triageHospitalId);
                    submitBedRequest({
                      patientName: 'Public Citizen', // anonymous
                      hospitalId: triageHospitalId,
                      hospitalName: hosp?.name || 'Unknown',
                      acuity: painLevel >= 8 ? 2 : (painLevel >= 5 ? 3 : 4),
                      diagnosis: symptoms.trim() || 'Undisclosed Symptoms'
                    });
                    setTriageToast("Bed Request transmitted! Check your active status.");
                    setTimeout(() => setTriageToast(null), 4000);
                    // Reset form
                    setSymptoms('');
                    setPainLevel(5);
                    setSelectedBodyParts([]);
                  }}
                  className="w-full py-3.5 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Shield className="w-5 h-5" />
                  <span>Transmit Bed Request to Command</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      </div>
    );
  };

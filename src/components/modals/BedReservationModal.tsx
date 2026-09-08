import React, { useState, useMemo } from 'react';
import { useHospitalStore } from '../../store/hospitalStore';
import { getHospitalBedWaitTimes, getGoogleMapsDirectionsUrl } from '../../data/realDistrictsData';
import { sound } from '../../utils/audioEngine';
import {
  X,
  Clock,
  ShieldCheck,
  Hospital,
  CheckCircle2,
  Navigation,
  ExternalLink,
  UserCheck,
  Ban
} from 'lucide-react';

export const BedReservationModal: React.FC = () => {
  const {
    isReservationModalOpen,
    reservationTargetHospitalId,
    closeReservationModal,
    currentDistrict,
    selectedHospitalId,
    activeReservation,
    createBedReservation,
    cancelBedReservation,
    confirmBedIntake,
    setDedicatedRouteActive,
    language
  } = useHospitalStore();

  const hospitals = currentDistrict.hospitals;
  const targetHospital = useMemo(() => {
    const idToFind = reservationTargetHospitalId || selectedHospitalId;
    return hospitals.find(h => h.id === idToFind) || hospitals[0];
  }, [hospitals, reservationTargetHospitalId, selectedHospitalId]);

  const waitTimes = useMemo(() => {
    return getHospitalBedWaitTimes(targetHospital);
  }, [targetHospital]);

  const [selectedDept, setSelectedDept] = useState<'ED' | 'ICU' | 'MedSurg'>('ICU');
  const [patientName, setPatientName] = useState('108 Inbound Trauma Case #TN-04');
  const [incidentPriority, setIncidentPriority] = useState<'Priority 1 Green Wave ALS' | 'Urgent Admission' | 'Standard Care'>('Priority 1 Green Wave ALS');

  if (!isReservationModalOpen) return null;

  const currentDeptDetail = waitTimes[selectedDept === 'ED' ? 'ed' : selectedDept === 'ICU' ? 'icu' : 'medSurg'];

  // Format seconds to MM:SS
  const formatCountdown = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleConfirmReservation = () => {
    sound.playRadarPing();
    createBedReservation({
      hospitalId: targetHospital.id,
      hospitalName: targetHospital.name,
      department: selectedDept,
      patientName: patientName.trim() || '108 Inbound Emergency Patient',
      incidentPriority,
      waitTimeMinutes: currentDeptDetail.waitTimeMinutes,
      queuePosition: currentDeptDetail.queuePosition
    });
  };

  const handleOpenGoogleMaps = () => {
    sound.playTactileClick();
    const destLat = targetHospital.coordinates.lat;
    const destLng = targetHospital.coordinates.lng;
    const originLat = currentDistrict.globeCoordinates.lat;
    const originLng = currentDistrict.globeCoordinates.lng;
    const url = getGoogleMapsDirectionsUrl(originLat, originLng, destLat, destLng);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleGoToRoutePage = () => {
    sound.playRadarPing();
    closeReservationModal();
    setDedicatedRouteActive(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#070e1c] border border-cyan-500/40 rounded-2xl w-full max-w-xl shadow-[0_0_50px_rgba(6,182,212,0.25)] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold shadow-md">
              <Hospital className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <h3 className="text-sm font-extrabold text-slate-100">
                  {language === 'ta' ? 'அவசர படுக்கை முன்பதிவு & காத்திருப்பு நேரம்' : 'Emergency Bed Reservation & Wait Time'}
                </h3>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                {targetHospital.name} • {targetHospital.traumaLevel}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playTactileClick();
              closeReservationModal();
            }}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* If reservation is already ACTIVE for this or another hospital */}
          {activeReservation ? (
            <div className="space-y-4">
              {/* Active Ticket Banner */}
              <div className="bg-gradient-to-br from-cyan-950/60 to-emerald-950/40 border border-cyan-500/50 rounded-2xl p-4 shadow-xl relative overflow-hidden">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-mono text-cyan-300 font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      {language === 'ta' ? 'உத்தரவாதமளிக்கப்பட்ட 45 நிமிட முன்பதிவு செயலில்' : '45-Min Guaranteed Bed Hold Active'}
                    </span>
                    <h4 className="text-base font-extrabold text-white font-mono tracking-wide">
                      {activeReservation.id}
                    </h4>
                    <p className="text-[11px] text-slate-300">
                      {activeReservation.hospitalName} • {activeReservation.deptLabelEn}
                    </p>
                  </div>

                  {/* Countdown Clock */}
                  <div className="bg-slate-950/90 border border-cyan-400/40 rounded-xl px-3 py-2 text-center shadow-lg">
                    <span className="text-[9px] font-mono text-cyan-400 uppercase block font-bold">
                      {language === 'ta' ? 'மீதமுள்ள நேரம்' : 'Hold Remaining'}
                    </span>
                    <span className="text-xl font-mono font-black text-amber-300 animate-pulse">
                      {formatCountdown(activeReservation.remainingSeconds)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-cyan-900/50 font-mono text-[11px]">
                  <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                    <span className="text-[9px] text-slate-400 block">Assigned Bed</span>
                    <span className="font-bold text-cyan-300">{activeReservation.bedNumber}</span>
                  </div>
                  <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                    <span className="text-[9px] text-slate-400 block">Queue Rank</span>
                    <span className="font-bold text-emerald-300">Priority #{activeReservation.queuePosition}</span>
                  </div>
                  <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                    <span className="text-[9px] text-slate-400 block">Patient Code</span>
                    <span className="font-bold text-slate-200 truncate block">{activeReservation.patientName}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons for Active Reservation */}
              <div className="space-y-2">
                <button
                  onClick={handleGoToRoutePage}
                  className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-slate-950 font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/40 transition-all cursor-pointer"
                >
                  <Navigation className="w-4 h-4" />
                  <span>
                    {language === 'ta' ? '108 அவசர வழிசெலுத்தல் திரைக்கு செல்க' : 'Open 108 Emergency Route Navigation'}
                  </span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleOpenGoogleMaps}
                    className="py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{language === 'ta' ? 'கூகிள் வரைபடத்தில் திற' : 'Open in Google Maps'}</span>
                  </button>

                  <button
                    onClick={() => {
                      sound.playRadarPing();
                      confirmBedIntake();
                    }}
                    className="py-2 bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-500/50 text-emerald-300 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>{language === 'ta' ? 'நோயாளி சேர்ந்தார் (Intake)' : 'Patient Arrived (Admit)'}</span>
                  </button>
                </div>

                <button
                  onClick={() => {
                    sound.playTactileClick();
                    cancelBedReservation();
                  }}
                  className="w-full py-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 rounded-xl font-mono text-[11px] flex items-center justify-center gap-1 transition-all cursor-pointer"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>{language === 'ta' ? 'முன்பதிவை ரத்து செய்' : 'Cancel Reservation Hold'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Reservation Creation Flow */
            <div className="space-y-4">
              {/* Step 1: Department Selection with Real-Time Wait Times */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-300 uppercase font-mono flex items-center justify-between">
                  <span>{language === 'ta' ? '1. படுக்கை பிரிவை தேர்ந்தெடுக்கவும்:' : '1. Select Bed Department & Acuity:'}</span>
                  <span className="text-cyan-400 text-[10px]">
                    {language === 'ta' ? 'நேரலை காத்திருப்பு நேரம்' : 'Live Calculated Wait Times'}
                  </span>
                </label>

                <div className="grid grid-cols-3 gap-2">
                  {/* ED Bay Option */}
                  <button
                    onClick={() => {
                      sound.playTactileClick();
                      setSelectedDept('ED');
                    }}
                    className={`p-3 rounded-xl border text-left transition-all relative cursor-pointer ${
                      selectedDept === 'ED'
                        ? 'bg-rose-950/40 border-rose-500 text-rose-200 shadow-md shadow-rose-950/50'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center gap-1">
                      <span>🚨</span>
                      <span>{language === 'ta' ? 'அவசர டிராமா பே' : 'ED Trauma Bay'}</span>
                    </div>
                    <div className="mt-1.5">
                      <span className="text-[10px] text-slate-400 block font-mono">
                        {language === 'ta' ? 'காத்திருப்பு:' : 'Wait Time:'}
                      </span>
                      <span
                        className={`text-sm font-black font-mono ${
                          waitTimes.ed.waitTimeMinutes === 0 ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                      >
                        {waitTimes.ed.waitTimeMinutes === 0 ? '0 mins (Instant)' : `${waitTimes.ed.waitTimeMinutes} mins`}
                      </span>
                    </div>
                    <span className="text-[9px] text-slate-500 font-mono block mt-0.5">
                      {waitTimes.ed.availableCount} / {waitTimes.ed.totalCount} open
                    </span>
                  </button>

                  {/* ICU Option */}
                  <button
                    onClick={() => {
                      sound.playTactileClick();
                      setSelectedDept('ICU');
                    }}
                    className={`p-3 rounded-xl border text-left transition-all relative cursor-pointer ${
                      selectedDept === 'ICU'
                        ? 'bg-cyan-950/40 border-cyan-500 text-cyan-200 shadow-md shadow-cyan-950/50'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center gap-1">
                      <span>🫁</span>
                      <span>{language === 'ta' ? 'தீவிர சிகிச்சை (ICU)' : 'Critical Care ICU'}</span>
                    </div>
                    <div className="mt-1.5">
                      <span className="text-[10px] text-slate-400 block font-mono">
                        {language === 'ta' ? 'காத்திருப்பு:' : 'Wait Time:'}
                      </span>
                      <span className="text-sm font-black font-mono text-cyan-300">
                        {waitTimes.icu.waitTimeMinutes} mins
                      </span>
                    </div>
                    <span className="text-[9px] text-slate-500 font-mono block mt-0.5">
                      {waitTimes.icu.availableCount} / {waitTimes.icu.totalCount} open
                    </span>
                  </button>

                  {/* Med-Surg Option */}
                  <button
                    onClick={() => {
                      sound.playTactileClick();
                      setSelectedDept('MedSurg');
                    }}
                    className={`p-3 rounded-xl border text-left transition-all relative cursor-pointer ${
                      selectedDept === 'MedSurg'
                        ? 'bg-emerald-950/40 border-emerald-500 text-emerald-200 shadow-md shadow-emerald-950/50'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center gap-1">
                      <span>🛏️</span>
                      <span>{language === 'ta' ? 'உள்நோயாளி வார்டு' : 'Med-Surg Bed'}</span>
                    </div>
                    <div className="mt-1.5">
                      <span className="text-[10px] text-slate-400 block font-mono">
                        {language === 'ta' ? 'காத்திருப்பு:' : 'Wait Time:'}
                      </span>
                      <span className="text-sm font-black font-mono text-emerald-400">
                        {waitTimes.medSurg.waitTimeMinutes} mins
                      </span>
                    </div>
                    <span className="text-[9px] text-slate-500 font-mono block mt-0.5">
                      {waitTimes.medSurg.availableCount} open
                    </span>
                  </button>
                </div>
              </div>

              {/* Step 2: Selected Department Wait & Readiness Telemetry */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <span className="font-bold text-slate-200 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>
                      {language === 'ta' ? currentDeptDetail.deptLabelTa : currentDeptDetail.deptLabelEn}
                    </span>
                  </span>
                  <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                    {language === 'ta' ? currentDeptDetail.statusTa : currentDeptDetail.statusEn}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px] font-mono">
                  <div className="bg-slate-900/70 p-2 rounded-lg">
                    <span className="text-[9px] text-slate-400 block">
                      {language === 'ta' ? 'மதிப்பிடப்பட்ட தயாரிப்பு நேரம்' : 'Estimated Preparation Wait'}
                    </span>
                    <span className="text-sm font-bold text-cyan-300">
                      {currentDeptDetail.waitTimeMinutes === 0
                        ? language === 'ta' ? '0 நிமி (உடனடி ஒதுக்கீடு)' : '0 mins (Immediate)'
                        : `${currentDeptDetail.waitTimeMinutes} mins prep & sterilize`}
                    </span>
                  </div>

                  <div className="bg-slate-900/70 p-2 rounded-lg">
                    <span className="text-[9px] text-slate-400 block">
                      {language === 'ta' ? 'முன்னுரிமை வரிசை எண்' : 'Queue Position'}
                    </span>
                    <span className="text-sm font-bold text-emerald-400">
                      {language === 'ta' ? `வரிசை நிலை #${currentDeptDetail.queuePosition} (முன்னுரிமை)` : `Priority Rank #${currentDeptDetail.queuePosition} (108 ALS)`}
                    </span>
                  </div>
                </div>

                {/* Sterilization & Setup Progress */}
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>
                      {language === 'ta' ? 'UV-C கிருமி நீக்கம் & மருத்துவ உபகரணங்கள் தயார்நிலை' : 'UV-C Sterilization & Equipment Readiness'}
                    </span>
                    <span className="text-emerald-400 font-bold">{currentDeptDetail.readinessPercent}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-500"
                      style={{ width: `${currentDeptDetail.readinessPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Step 3: Patient Information Form */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-300 uppercase font-mono block">
                  {language === 'ta' ? '2. நோயாளி / அவசர குறியீடு:' : '2. Inbound Patient / Emergency Identification:'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={patientName}
                    onChange={e => setPatientName(e.target.value)}
                    placeholder="Patient Name / Case ID"
                    className="bg-slate-950 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-400"
                  />
                  <select
                    value={incidentPriority}
                    onChange={e => setIncidentPriority(e.target.value as any)}
                    className="bg-slate-950 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    <option value="Priority 1 Green Wave ALS">🚨 Priority 1 Green Wave ALS</option>
                    <option value="Urgent Admission">⚡ Urgent Trauma Admission</option>
                    <option value="Standard Care">🛏️ Step-Down / Standard Care</option>
                  </select>
                </div>
              </div>

              {/* Guarantee Disclaimer */}
              <div className="bg-cyan-950/30 border border-cyan-500/20 rounded-xl p-3 flex items-start gap-2.5 text-[11px] text-cyan-200/90">
                <ShieldCheck className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                <span>
                  {language === 'ta'
                    ? 'முன்பதிவை உறுதிசெய்த பிறகு, மருத்துவமனை படுக்கை 45 நிமிடங்களுக்கு உத்தரவாதமாக நிறுத்தி வைக்கப்படும். 108 ஆம்புலன்ஸ் வருகை வரை பிற நோயாளிகளுக்கு ஒதுக்கப்படாது.'
                    : 'Confirming locks a 45-minute guaranteed hold in the hospital IoT telemetry network. The bed is physically reserved and prevented from being given to walk-in cases while the ambulance is in transit.'}
                </span>
              </div>

              {/* Confirmation Action */}
              <button
                onClick={handleConfirmReservation}
                className="w-full py-3 bg-gradient-to-r from-cyan-600 via-cyan-500 to-emerald-500 hover:from-cyan-500 hover:to-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-xl shadow-cyan-900/50 transition-all cursor-pointer transform active:scale-98"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>
                  {language === 'ta'
                    ? `45 நிமிட உத்தரவாத முன்பதிவை உறுதிசெய் (${currentDeptDetail.waitTimeMinutes} நிமிடம் தயார்)`
                    : `Confirm 45-Minute Guaranteed Reservation Hold (${currentDeptDetail.waitTimeMinutes}m wait)`}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

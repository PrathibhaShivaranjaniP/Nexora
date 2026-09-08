import React, { useState } from 'react';
import { useHospitalStore } from '../../store/hospitalStore';
import { FileText, Printer, Copy, Check, X, ShieldAlert, Building2 } from 'lucide-react';
import { sound } from '../../utils/audioEngine';

interface SitrepExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SitrepExportModal: React.FC<SitrepExportModalProps> = ({ isOpen, onClose }) => {
  const {
    currentDistrict,
    totalBeds,
    occupiedBeds,
    icuCapacityPercent,
    overallOccupancyPercent,
    publicPrivateBalancingActive,
    activeDisasterScenario,
    whatIfParams
  } = useHospitalStore();

  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  const sitrepText = `
================================================================================
OFFICIAL DISTRICT HEALTH SITUATION REPORT (SITREP)
GOVERNMENT OF TAMIL NADU - DEPARTMENT OF HEALTH & FAMILY WELFARE
DISTRICT COMMAND: ${currentDistrict.name.toUpperCase()}
DATE & TIMESTAMP: ${now} IST
================================================================================

1. EXECUTIVE CAPACITY SUMMARY
--------------------------------------------------------------------------------
• Total District Inpatient Beds: ${currentDistrict.occupiedDistrictBeds} / ${currentDistrict.totalDistrictBeds} (${Math.round((currentDistrict.occupiedDistrictBeds / currentDistrict.totalDistrictBeds) * 100)}%)
• District ICU Saturation: ${currentDistrict.occupiedIcuBeds} / ${currentDistrict.totalIcuBeds} (${Math.round((currentDistrict.occupiedIcuBeds / currentDistrict.totalIcuBeds) * 100)}%)
• Active Disaster Status: ${activeDisasterScenario ? `CRITICAL - ${activeDisasterScenario}` : 'NORMAL - Green Readiness'}
• Public-Private Balancing (PPP): ${publicPrivateBalancingActive ? 'ACTIVE (Empanelled Private CMCHIS Triage)' : 'STANDBY'}
• Environmental Risk: AQI ${currentDistrict.aqi} (${currentDistrict.aqiStatus}) | ${currentDistrict.temperatureC}°C (${currentDistrict.weatherCondition})

2. REAL-WORLD HEALTHCARE FACILITIES (DISTRICT ROSTER)
--------------------------------------------------------------------------------
${currentDistrict.hospitals.map(h => `• ${h.name} [${h.ownership.toUpperCase()} | ${h.traumaLevel}]
  - Inpatient Census: ${h.occupiedBeds}/${h.totalBeds} (${Math.round((h.occupiedBeds / h.totalBeds) * 100)}%) | ICU: ${h.icuOccupied}/${h.icuBeds}
  - Emergency Triage Wait: ${h.edWaitMinutes} mins | Diversion: ${h.diversionActive ? 'ACTIVE' : 'ACCEPTING'}
`).join('\n')}

3. PREDICTIVE 24-HOUR MULTI-HORIZON PROJECTION
--------------------------------------------------------------------------------
• Anticipated Inflow Multiplier: ${whatIfParams.edInflowMultiplier}x
• Projected Peak Bed Surge: In +12 Hours (${Math.round(overallOccupancyPercent * whatIfParams.edInflowMultiplier)}% Expected Census)
• Recommended CMO Intervention: ${
    whatIfParams.edInflowMultiplier > 1.4
      ? 'Expedite non-clinical discharges and authorize PPP surgical diversion.'
      : 'Maintain standard ward rotation and EVS ghost bed turnover.'
  }

Report Generated via AegisOS District Health Command Engine.
Authorized for District Collector & Chief Medical Officer (CMO) Review.
================================================================================
  `.trim();

  const handleCopy = () => {
    sound.playTactileClick();
    navigator.clipboard.writeText(sitrepText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    sound.playTactileClick();
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-[#090f1e] border border-slate-700/80 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">
                Official District Health Situation Report (SITREP)
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                {currentDistrict.name} • Government of Tamil Nadu
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Toolbar */}
        <div className="p-3 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400 text-[11px]">Formatted for District Collector & CMO Handoff</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center gap-1.5 font-semibold text-xs transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied SITREP' : 'Copy Text'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 rounded-lg flex items-center gap-1.5 font-bold text-xs transition-all shadow-md shadow-cyan-600/20"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
          </div>
        </div>

        {/* Formatted Report Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs font-mono bg-slate-950 text-slate-300">
          <pre className="whitespace-pre-wrap leading-relaxed text-[11px]">
            {sitrepText}
          </pre>
        </div>
      </div>
    </div>
  );
};

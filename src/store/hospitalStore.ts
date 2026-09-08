import { useState, useEffect, useCallback } from 'react';
import { Bed, Patient, StaffMember, AgentLog, WhatIfParameters, BedStatus, ForecastPoint } from '../types/hospital';
import { initialStaff, initialAgentLogs } from '../data/mockData';
import { realDistrictsData, DistrictProfile, RealHospital } from '../data/realDistrictsData';
import { translations, Language } from '../data/translations';
import { generateHospitalBedsAndPatients, stepRealTimeHospitalBedTelemetry } from '../utils/hospitalBedGenerator';

// State interface
export interface ActiveBedReservation {
  id: string; // e.g. "TN-RES-RGGGH-ICU-491"
  hospitalId: string;
  hospitalName: string;
  department: 'ED' | 'ICU' | 'MedSurg';
  deptLabelEn: string;
  deptLabelTa: string;
  bedId?: string;
  bedNumber: string;
  patientName: string;
  incidentPriority: string;
  reservedAtIso: string;
  totalHoldDurationSeconds: number; // 2700 (45 mins)
  remainingSeconds: number;
  waitTimeMinutes: number;
  queuePosition: number;
}

export interface OxygenBankData {
  tankCapacityLiters: number;
  currentLiters: number;
  percentage: number;
  manifoldPressureBar: number;
  consumptionRateLpm: number;
  hoursAutonomyRemaining: number;
  backupCylindersCount: number;
  criticalThresholdPercent: number;
  refillRequestActive: boolean;
  refillEtaMinutes?: number;
  refillSource?: string;
  refillVolumeLiters?: number;
}

export interface BloodGroupStock {
  group: 'O-' | 'O+' | 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-';
  unitsAvailable: number;
  reservedUnits: number;
  criticalThreshold: number;
}

export interface BloodBankData {
  groups: Record<string, BloodGroupStock>;
  ffpUnits: number;
  plateletUnits: number;
  cryoUnits: number;
  transferActive: boolean;
  transferDetails?: {
    sourceHospitalName: string;
    requestedUnits: string;
    courierEtaMinutes: number;
    trackingId: string;
  };
}

export interface BedRequest {
  id: string;
  patientName: string;
  hospitalId: string;
  hospitalName: string;
  acuity: number;
  diagnosis: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: number;
}

interface HospitalState {
  // Localization
  language: Language;

  // Global Mutable District Data
  districts: Record<string, DistrictProfile>;

  // Spatial Hierarchy
  spatialTier: 1 | 2 | 3 | 4; // 1: Globe, 2: District, 3: Hospital, 4: Bed
  selectedDistrictId: 'chennai' | 'coimbatore' | 'madurai' | 'theni';
  selectedHospitalId: string;
  selectedBedId: string | null;

  // Active Facilities Data
  beds: Bed[];
  patients: Patient[];
  waitingRoomPatients: Patient[];
  bedRequests: BedRequest[];
  staff: StaffMember[];
  agentLogs: AgentLog[];
  whatIfParams: WhatIfParameters;
  simulationRunning: boolean;
  simSpeed: number;
  simClockTime: string;

  // Executive Enhancements
  publicPrivateBalancingActive: boolean;
  activeDisasterScenario: string | null;
  dedicatedRouteActive: boolean;

  // Bed Reservation System
  activeReservation: ActiveBedReservation | null;
  isReservationModalOpen: boolean;
  reservationTargetHospitalId: string | null;

  // Oxygen & Blood Bank Logistics
  oxygenData: OxygenBankData;
  bloodData: BloodBankData;

  // Outstanding Features
  predictiveOffsetHours: number;
  isCctvOpen: boolean;
  isQrScannerOpen: boolean;

  // UI State
  isOxygenModalOpen: boolean;
  isBloodModalOpen: boolean;
  isGpsStreamModalOpen: boolean;

  // Auth State
  isAuthenticated: boolean;

  // Role-Based Persona (Doctor / Authority vs Patient / Citizen)
  userRole: 'authority' | 'patient';

  isOmniSearchOpen: boolean;
  isShiftHandoverOpen: boolean;
}

const defaultInitialHosp = realDistrictsData['chennai'].hospitals[0];
const initialHospData = generateHospitalBedsAndPatients(defaultInitialHosp);

// In-memory singleton state
let globalState: HospitalState = {
  isAuthenticated: false, // Default to false to show login screen

  language: 'en', // Defaults to English, easily switched to Tamil via Settings or AI Assistant!
  districts: JSON.parse(JSON.stringify(realDistrictsData)), // Mutable copy of districts
  spatialTier: 2, // Default to Hospital Tier 3 so 3D Bed Matrix is immediately visible!
  selectedDistrictId: 'chennai',
  selectedHospitalId: 'chn-rgggh',
  selectedBedId: null,

  beds: initialHospData.beds,
  patients: initialHospData.patients,
  bedRequests: [],
  waitingRoomPatients: [
    {
      id: 'P-WAIT-01', mrn: 'MRN-W01', name: 'Ravi Kumar', age: 34, gender: 'M',
      ward: 'ED', bedId: '', diagnosis: 'Laceration / Trauma', acuity: 3,
      vitals: { heartRate: 110, bpSystolic: 120, bpDiastolic: 80, spO2: 97, respRate: 20, temperature: 36.8 },
      news2Score: 4, deteriorationRisk: 12, admissionTime: new Date().toISOString(), estDischargeTime: ''
    },
    {
      id: 'P-WAIT-02', mrn: 'MRN-W02', name: 'Lakshmi S.', age: 55, gender: 'F',
      ward: 'ED', bedId: '', diagnosis: 'Chest Pain (Unspecified)', acuity: 4,
      vitals: { heartRate: 98, bpSystolic: 160, bpDiastolic: 95, spO2: 94, respRate: 22, temperature: 37.1 },
      news2Score: 6, deteriorationRisk: 45, admissionTime: new Date().toISOString(), estDischargeTime: ''
    }
  ],
  staff: JSON.parse(JSON.stringify(initialStaff)),
  agentLogs: JSON.parse(JSON.stringify(initialAgentLogs)),
  whatIfParams: {
    electiveSurgeryRatio: 1.0,
    edInflowMultiplier: 1.0,
    staffCalloutRate: 0.05,
    activeCrisisPreset: 'None'
  },
  simulationRunning: true,
  simSpeed: 1,
  simClockTime: '14:45:00',

  publicPrivateBalancingActive: false,
  activeDisasterScenario: null,
  dedicatedRouteActive: false,

  activeReservation: null,
  isReservationModalOpen: false,
  reservationTargetHospitalId: null,

  // Oxygen & Blood Bank Logistics
  oxygenData: {
    tankCapacityLiters: 20000,
    currentLiters: 14250,
    percentage: 71.3,
    manifoldPressureBar: 4.2,
    consumptionRateLpm: 38.5,
    hoursAutonomyRemaining: 19.4,
    backupCylindersCount: 148,
    criticalThresholdPercent: 25,
    refillRequestActive: false,
    refillEtaMinutes: undefined,
    refillSource: undefined,
    refillVolumeLiters: undefined
  },
  bloodData: {
    groups: {
      'O-': { group: 'O-', unitsAvailable: 7, reservedUnits: 3, criticalThreshold: 10 },
      'O+': { group: 'O+', unitsAvailable: 42, reservedUnits: 8, criticalThreshold: 15 },
      'A+': { group: 'A+', unitsAvailable: 31, reservedUnits: 4, criticalThreshold: 12 },
      'A-': { group: 'A-', unitsAvailable: 8, reservedUnits: 2, criticalThreshold: 8 },
      'B+': { group: 'B+', unitsAvailable: 46, reservedUnits: 6, criticalThreshold: 15 },
      'B-': { group: 'B-', unitsAvailable: 6, reservedUnits: 1, criticalThreshold: 8 },
      'AB+': { group: 'AB+', unitsAvailable: 19, reservedUnits: 3, criticalThreshold: 10 },
      'AB-': { group: 'AB-', unitsAvailable: 5, reservedUnits: 1, criticalThreshold: 6 }
    },
    ffpUnits: 72,
    plateletUnits: 26,
    cryoUnits: 34,
    transferActive: false,
    transferDetails: undefined
  },
  isOxygenModalOpen: false,
  isBloodModalOpen: false,
  isGpsStreamModalOpen: false,
  isOmniSearchOpen: false,
  isShiftHandoverOpen: false,
  userRole: 'authority',
  predictiveOffsetHours: 0,
  isCctvOpen: false,
  isQrScannerOpen: false
};

const listeners = new Set<() => void>();

if (typeof window !== 'undefined') {
  try {
    const savedState = localStorage.getItem('aegis-store-v1');
    if (savedState) {
      const parsedState = JSON.parse(savedState);
      globalState = {
        ...globalState,
        ...parsedState,
        isAuthenticated: false
      };
    }
  } catch (e) {
    console.error('Failed to load state from localStorage', e);
  }
}

function notify() {
  if (typeof window !== 'undefined') {
    localStorage.setItem('aegis-store-v1', JSON.stringify(globalState));
  }
  listeners.forEach(listener => listener());
}

export function useHospitalStore() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const handleUpdate = () => setTick(t => t + 1);
    listeners.add(handleUpdate);

    // Live Real-Time Hospital Bed Telemetry Loop (every 4.5 seconds)
    const telemetryInterval = setInterval(() => {
      if (!globalState.simulationRunning) return;
      const district = realDistrictsData[globalState.selectedDistrictId];
      const hosp = district?.hospitals.find(h => h.id === globalState.selectedHospitalId) || district?.hospitals[0];
      if (!hosp) return;

      const res = stepRealTimeHospitalBedTelemetry(hosp, globalState.beds, globalState.patients);
      globalState.beds = res.beds;
      globalState.patients = res.patients;

      if (res.eventLog) {
        const now = new Date().toLocaleTimeString();
        globalState.agentLogs = [
          {
            id: 'log-' + Date.now(),
            timestamp: now,
            agentName: 'System',
            action: res.eventLog.action,
            details: res.eventLog.details,
            severity: res.eventLog.severity
          },
          ...globalState.agentLogs.slice(0, 40)
        ];
      }

      notify();
    }, 4500 / Math.max(0.5, globalState.simSpeed));

    // Reservation Hold Countdown Loop (every 1 second)
    const countdownInterval = setInterval(() => {
      if (globalState.activeReservation && globalState.activeReservation.remainingSeconds > 0) {
        globalState.activeReservation = {
          ...globalState.activeReservation,
          remainingSeconds: globalState.activeReservation.remainingSeconds - 1
        };
        notify();
      } else if (globalState.activeReservation && globalState.activeReservation.remainingSeconds <= 0) {
        // Hold expired - release bed
        const res = globalState.activeReservation;
        if (res.bedId) {
          globalState.beds = globalState.beds.map(b => {
            if (b.id === res.bedId && b.status === 'reserved') {
              return { ...b, status: 'available', notes: 'Guaranteed 45-min hold expired. Released to pool.' };
            }
            return b;
          });
        }
        globalState.activeReservation = null;
        notify();
      }
    }, 1000);

    return () => {
      listeners.delete(handleUpdate);
      clearInterval(telemetryInterval);
      clearInterval(countdownInterval);
    };
  }, []);

  // Localization Action
  const setLanguage = useCallback((lang: Language) => {
    globalState.language = lang;
    notify();
  }, []);

  // Spatial Navigation Actions
  const setSpatialTier = useCallback((tier: 1 | 2 | 3 | 4) => {
    globalState.spatialTier = tier;
    notify();
  }, []);

  const setDedicatedRouteActive = useCallback((active: boolean) => {
    globalState.dedicatedRouteActive = active;
    notify();
  }, []);

  const setSelectedDistrict = useCallback((districtId: 'chennai' | 'coimbatore' | 'madurai' | 'theni') => {
    globalState.selectedDistrictId = districtId;
    const district = realDistrictsData[districtId];
    if (district && district.hospitals.length > 0) {
      const firstHosp = district.hospitals[0];
      globalState.selectedHospitalId = firstHosp.id;
      const generated = generateHospitalBedsAndPatients(firstHosp);
      globalState.beds = generated.beds;
      globalState.patients = generated.patients;
      globalState.selectedBedId = null;
    }
    
    // Add log
    const now = new Date().toLocaleTimeString();
    globalState.agentLogs = [
      {
        id: 'log-' + Date.now(),
        timestamp: now,
        agentName: 'Regional_Broker_Agent',
        action: 'District Focus Transitioned',
        details: `Command Center shifted focus to ${district.name}. Tracking ${district.hospitals.length} real healthcare institutions.`,
        severity: 'info'
      },
      ...globalState.agentLogs.slice(0, 40)
    ];

    notify();
  }, []);

  const setSelectedHospitalId = useCallback((id: string) => {
    globalState.selectedHospitalId = id;
    globalState.spatialTier = 3;
    globalState.dedicatedRouteActive = false;
    const district = realDistrictsData[globalState.selectedDistrictId];
    const targetHosp = district?.hospitals.find(h => h.id === id);
    if (targetHosp) {
      const generated = generateHospitalBedsAndPatients(targetHosp);
      globalState.beds = generated.beds;
      globalState.patients = generated.patients;
      globalState.selectedBedId = null;

      const now = new Date().toLocaleTimeString();
      globalState.agentLogs = [
        {
          id: 'log-' + Date.now(),
          timestamp: now,
          agentName: 'System',
          action: 'Hospital Infrastructure Linked',
          details: `Connected to ${targetHosp.name} EHR & IoT Bed Sensors. Capacity: ${targetHosp.occupiedBeds}/${targetHosp.totalBeds} beds (${Math.round((targetHosp.occupiedBeds / targetHosp.totalBeds) * 100)}% census).`,
          severity: 'info'
        },
        ...globalState.agentLogs.slice(0, 40)
      ];
    }
    notify();
  }, []);

  const setSelectedBedId = useCallback((id: string | null) => {
    globalState.selectedBedId = id;
    if (id) {
      globalState.spatialTier = 4; // Auto-zoom to Tier 4 when a bed is selected
    }
    notify();
  }, []);

  const togglePublicPrivateBalancing = useCallback(() => {
    globalState.publicPrivateBalancingActive = !globalState.publicPrivateBalancingActive;
    
    const now = new Date().toLocaleTimeString();
    globalState.agentLogs = [
      {
        id: 'log-' + Date.now(),
        timestamp: now,
        agentName: 'Regional_Broker_Agent',
        action: globalState.publicPrivateBalancingActive ? 'PPP Diversion Activated' : 'PPP Diversion Deactivated',
        details: globalState.publicPrivateBalancingActive
          ? 'Routing stabilized emergency patients from Govt Medical Colleges to empaneled private hospitals under CMCHIS scheme.'
          : 'Standard district triage resumed.',
        severity: 'success'
      },
      ...globalState.agentLogs.slice(0, 40)
    ];

    notify();
  }, []);

  const triggerMassCasualty = useCallback((scenarioName: string) => {
    globalState.activeDisasterScenario = scenarioName;
    globalState.whatIfParams = {
      ...globalState.whatIfParams,
      edInflowMultiplier: 2.8,
      electiveSurgeryRatio: 0.1,
      activeCrisisPreset: 'Highway Pileup'
    };

    const now = new Date().toLocaleTimeString();
    globalState.agentLogs = [
      {
        id: 'log-' + Date.now(),
        timestamp: now,
        agentName: 'System',
        action: `MASS CASUALTY DECLARED: ${scenarioName}`,
        details: `District Collector & CMO alert dispatched. Apex Level 1 Trauma bays cleared across all district hospitals.`,
        severity: 'urgent'
      },
      ...globalState.agentLogs.slice(0, 40)
    ];

    notify();
  }, []);

  const clearMassCasualty = useCallback(() => {
    globalState.activeDisasterScenario = null;
    globalState.whatIfParams = {
      ...globalState.whatIfParams,
      edInflowMultiplier: 1.0,
      electiveSurgeryRatio: 1.0,
      activeCrisisPreset: 'None'
    };
    notify();
  }, []);

  // Bed & Patient Operations
  const updateBedStatus = useCallback((bedId: string, status: BedStatus, notes?: string) => {
    globalState.beds = globalState.beds.map(bed => {
      if (bed.id === bedId) {
        return {
          ...bed,
          status,
          notes: notes !== undefined ? notes : bed.notes,
          pressureSensorActive: status === 'occupied'
        };
      }
      return bed;
    });
    notify();
  }, []);

  const turnoverGhostBed = useCallback((bedId: string) => {
    globalState.beds = globalState.beds.map(bed => {
      if (bed.id === bedId) {
        return { ...bed, status: 'cleaning', notes: 'EVS rapid disinfection in progress' };
      }
      return bed;
    });
    notify();

    setTimeout(() => {
      globalState.beds = globalState.beds.map(bed => {
        if (bed.id === bedId) {
          return { ...bed, status: 'available', notes: 'Sanitized and inspected. Ready for admission.' };
        }
        return bed;
      });
      notify();
    }, 2200);
  }, []);

  const assignPatientToBed = useCallback((patientId: string, bedId: string) => {
    const pIndex = globalState.waitingRoomPatients.findIndex(p => p.id === patientId);
    if (pIndex === -1) return;
    
    const patient = { ...globalState.waitingRoomPatients[pIndex], bedId };
    globalState.waitingRoomPatients = globalState.waitingRoomPatients.filter(p => p.id !== patientId);
    globalState.patients = [patient, ...globalState.patients];
    
    globalState.beds = globalState.beds.map(bed => {
      if (bed.id === bedId) {
        return { ...bed, status: 'occupied', patientId: patient.id, pressureSensorActive: true, notes: `Admitted from ER Triage` };
      }
      return bed;
    });
    
    globalState.agentLogs = [
      {
        id: 'log-' + Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        agentName: 'System',
        action: `PATIENT DRAG ASSIGNMENT`,
        details: `${patient.name} manually assigned to Bed ${bedId}.`,
        severity: 'success'
      },
      ...globalState.agentLogs.slice(0, 40)
    ];
    notify();
  }, []);

  const admitPatient = useCallback((newPatientData: Omit<Patient, 'id' | 'mrn'>) => {
    const id = 'P-' + Math.floor(1000 + Math.random() * 9000);
    const mrn = 'MRN-' + Math.floor(10000 + Math.random() * 90000);
    const newPatient: Patient = { ...newPatientData, id, mrn };

    globalState.patients = [newPatient, ...globalState.patients];
    globalState.beds = globalState.beds.map(bed => {
      if (bed.id === newPatient.bedId) {
        return { ...bed, status: 'occupied', patientId: id, pressureSensorActive: true };
      }
      return bed;
    });
    notify();
  }, []);

  const dischargePatient = useCallback((patientId: string, reason: string = 'Routine Clinical Discharge') => {
    const patient = globalState.patients.find(p => p.id === patientId);
    if (!patient) return;

    globalState.beds = globalState.beds.map(bed => {
      if (bed.id === patient.bedId) {
        return { ...bed, status: 'cleaning', patientId: undefined, pressureSensorActive: false, notes: `Discharged (${reason})` };
      }
      return bed;
    });
    globalState.patients = globalState.patients.filter(p => p.id !== patientId);
    notify();
  }, []);

  const resolveDischargeBarrier = useCallback((barrierId: string) => {
    globalState.patients = globalState.patients.map(patient => {
      if (patient.dischargeBarrier?.id === barrierId) {
        return { ...patient, dischargeBarrier: { ...patient.dischargeBarrier, resolved: true } };
      }
      return patient;
    });
    notify();
  }, []);

  const preEmptIcuBed = useCallback((patientId: string) => {
    const patient = globalState.patients.find(p => p.id === patientId);
    if (!patient) return;

    const targetIcuBed = globalState.beds.find(b => b.ward === 'ICU' && (b.status === 'available' || b.status === 'reserved'));
    if (!targetIcuBed) return;

    globalState.beds = globalState.beds.map(b => {
      if (b.id === targetIcuBed.id) {
        return { ...b, status: 'reserved', notes: `Pre-emptively reserved for ${patient.name} (Deterioration Risk: ${patient.deteriorationRisk}%)` };
      }
      return b;
    });
    notify();
  }, []);

  // Bed Reservation Actions
  const openReservationModal = useCallback((hospitalId?: string) => {
    globalState.reservationTargetHospitalId = hospitalId || globalState.selectedHospitalId;
    globalState.isReservationModalOpen = true;
    notify();
  }, []);

  const closeReservationModal = useCallback(() => {
    globalState.isReservationModalOpen = false;
    notify();
  }, []);

  const createBedReservation = useCallback((params: {
    hospitalId: string;
    hospitalName: string;
    department: 'ED' | 'ICU' | 'MedSurg';
    patientName?: string;
    incidentPriority?: string;
    waitTimeMinutes: number;
    queuePosition: number;
  }): ActiveBedReservation => {
    const district = realDistrictsData[globalState.selectedDistrictId];
    const hosp = district?.hospitals.find(h => h.id === params.hospitalId) || district?.hospitals[0];
    const hospName = hosp ? hosp.name : params.hospitalName;

    const candidateBed = globalState.beds.find(
      b => b.ward === params.department && (b.status === 'available' || b.status === 'ghost')
    ) || globalState.beds.find(b => b.status === 'available');

    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const token = `TN-RES-${params.hospitalId.toUpperCase().slice(-5)}-${params.department}-${randomSuffix}`;
    const bedNum = candidateBed ? candidateBed.number : `${params.department}-BAY-${Math.floor(1 + Math.random() * 8)}`;

    if (candidateBed) {
      globalState.beds = globalState.beds.map(b => {
        if (b.id === candidateBed.id) {
          return {
            ...b,
            status: 'reserved' as BedStatus,
            notes: `45-Min Guaranteed Hold: ${token} for ${params.patientName || '108 Inbound Emergency'}`
          };
        }
        return b;
      });
    }

    const deptLabels: Record<'ED' | 'ICU' | 'MedSurg', { en: string; ta: string }> = {
      ED: { en: 'Emergency Trauma Bay (Resus)', ta: 'அவசர சிகிச்சை பிரிவு (டிராமா பே)' },
      ICU: { en: 'Critical Care / ICU Bed', ta: 'தீவிர சிகிச்சைப் பிரிவு (ICU)' },
      MedSurg: { en: 'Inpatient Medical-Surgical Bed', ta: 'உள்நோயாளி அறுவைசிகிச்சை படுக்கை' }
    };

    const newReservation: ActiveBedReservation = {
      id: token,
      hospitalId: params.hospitalId,
      hospitalName: hospName,
      department: params.department,
      deptLabelEn: deptLabels[params.department].en,
      deptLabelTa: deptLabels[params.department].ta,
      bedId: candidateBed?.id,
      bedNumber: bedNum,
      patientName: params.patientName || '108 Inbound Trauma Case #TN-04',
      incidentPriority: params.incidentPriority || 'Priority 1 Green Wave ALS',
      reservedAtIso: new Date().toISOString(),
      totalHoldDurationSeconds: 2700, // 45 mins
      remainingSeconds: 2700,
      waitTimeMinutes: params.waitTimeMinutes,
      queuePosition: params.queuePosition
    };

    globalState.activeReservation = newReservation;

    const now = new Date().toLocaleTimeString();
    globalState.agentLogs = [
      {
        id: 'log-' + Date.now(),
        timestamp: now,
        agentName: 'Regional_Broker_Agent',
        action: `BED RESERVED: ${token}`,
        details: `45-Min Guaranteed Hold locked at ${hospName}. Assigned Bed: ${bedNum}. Wait: ${params.waitTimeMinutes}m. Queue: #${params.queuePosition}.`,
        severity: 'urgent'
      },
      ...globalState.agentLogs.slice(0, 40)
    ];

    notify();
    return newReservation;
  }, []);

  const cancelBedReservation = useCallback(() => {
    if (globalState.activeReservation) {
      const res = globalState.activeReservation;
      if (res.bedId) {
        globalState.beds = globalState.beds.map(b => {
          if (b.id === res.bedId && b.status === 'reserved') {
            return { ...b, status: 'available' as BedStatus, notes: 'Reservation released back to district pool.' };
          }
          return b;
        });
      }

      const now = new Date().toLocaleTimeString();
      globalState.agentLogs = [
        {
          id: 'log-' + Date.now(),
          timestamp: now,
          agentName: 'Regional_Broker_Agent',
          action: `RESERVATION RELEASED: ${res.id}`,
          details: `Bed ${res.bedNumber} at ${res.hospitalName} returned to available pool.`,
          severity: 'info'
        },
        ...globalState.agentLogs.slice(0, 40)
      ];

      globalState.activeReservation = null;
      notify();
    }
  }, []);

  const confirmBedIntake = useCallback(() => {
    if (globalState.activeReservation) {
      const res = globalState.activeReservation;
      if (res.bedId) {
        globalState.beds = globalState.beds.map(b => {
          if (b.id === res.bedId) {
            return {
              ...b,
              status: 'occupied' as BedStatus,
              pressureSensorActive: true,
              notes: `Patient Admitted: ${res.patientName}`
            };
          }
          return b;
        });
      }

      const now = new Date().toLocaleTimeString();
      globalState.agentLogs = [
        {
          id: 'log-' + Date.now(),
          timestamp: now,
          agentName: 'ED_Agent',
          action: `PATIENT ADMITTED VIA RESERVATION: ${res.id}`,
          details: `${res.patientName} safely arrived at ${res.hospitalName} and admitted into Bed ${res.bedNumber}.`,
          severity: 'success'
        },
        ...globalState.agentLogs.slice(0, 40)
      ];

      globalState.activeReservation = null;
      notify();
    }
  }, []);

  // Oxygen, Blood Bank & GPS Stream Logistics
  const openOxygenModal = useCallback((open: boolean) => {
    globalState.isOxygenModalOpen = open;
    notify();
  }, []);

  const openBloodModal = useCallback((open: boolean) => {
    globalState.isBloodModalOpen = open;
    notify();
  }, []);

  const openGpsStreamModal = useCallback((open: boolean) => {
    globalState.isGpsStreamModalOpen = open;
    notify();
  }, []);

  const requestOxygenRefill = useCallback((sourceName: string, volumeLiters: number) => {
    globalState.oxygenData = {
      ...globalState.oxygenData,
      refillRequestActive: true,
      refillEtaMinutes: 24,
      refillSource: sourceName,
      refillVolumeLiters: volumeLiters
    };
    const now = new Date().toLocaleTimeString();
    globalState.agentLogs = [
      {
        id: 'log-' + Date.now(),
        timestamp: now,
        agentName: 'System',
        action: 'CRYOGENIC OXYGEN REFILL DISPATCHED',
        details: `Mutual-aid requisition confirmed with ${sourceName}. Inbound ${volumeLiters.toLocaleString()}L cryogenic tanker ETA 24m.`,
        severity: 'urgent'
      },
      ...globalState.agentLogs.slice(0, 40)
    ];
    notify();
  }, []);

  const requestBloodTransfer = useCallback((sourceHospName: string, requestedUnits: string) => {
    globalState.bloodData = {
      ...globalState.bloodData,
      transferActive: true,
      transferDetails: {
        sourceHospitalName: sourceHospName,
        requestedUnits,
        courierEtaMinutes: 18,
        trackingId: 'TN-BLD-' + Math.floor(1000 + Math.random() * 9000)
      }
    };
    const now = new Date().toLocaleTimeString();
    globalState.agentLogs = [
      {
        id: 'log-' + Date.now(),
        timestamp: now,
        agentName: 'Regional_Broker_Agent',
        action: 'EMERGENCY BLOOD TRANSFER DISPATCHED',
        details: `Mutual-aid courier dispatched from ${sourceHospName} carrying ${requestedUnits}. Police green wave clearance active.`,
        severity: 'urgent'
      },
      ...globalState.agentLogs.slice(0, 40)
    ];
    notify();
  }, []);

  const rebalanceStaffing = useCallback(() => {
    globalState.staff = globalState.staff.map((s, idx) => ({
      ...s,
      currentAcuityLoad: 6 + (idx % 3),
      burnoutScore: Math.max(28, Math.min(60, s.burnoutScore - 25))
    }));
    notify();
  }, []);

  const setWhatIfParams = useCallback((params: Partial<WhatIfParameters>) => {
    globalState.whatIfParams = { ...globalState.whatIfParams, ...params };
    notify();
  }, []);

  const applyCrisisPreset = useCallback((presetName: WhatIfParameters['activeCrisisPreset']) => {
    if (presetName === 'Highway Pileup') {
      globalState.whatIfParams = {
        electiveSurgeryRatio: 0.4,
        edInflowMultiplier: 2.5,
        staffCalloutRate: 0.05,
        activeCrisisPreset: 'Highway Pileup'
      };
    } else if (presetName === 'Viral Epidemic') {
      globalState.whatIfParams = {
        electiveSurgeryRatio: 0.2,
        edInflowMultiplier: 2.2,
        staffCalloutRate: 0.25,
        activeCrisisPreset: 'Viral Epidemic'
      };
    } else {
      globalState.whatIfParams = {
        electiveSurgeryRatio: 1.0,
        edInflowMultiplier: 1.0,
        staffCalloutRate: 0.05,
        activeCrisisPreset: 'None'
      };
    }
    notify();
  }, []);

  const toggleSimulation = useCallback(() => {
    globalState.simulationRunning = !globalState.simulationRunning;
    notify();
  }, []);

  const setSimSpeed = useCallback((speed: number) => {
    globalState.simSpeed = speed;
    notify();
  }, []);

  const resetToDefault = useCallback(() => {
    const defaultHosp = realDistrictsData['chennai'].hospitals[0];
    const generated = generateHospitalBedsAndPatients(defaultHosp);
    globalState = {
      isAuthenticated: globalState.isAuthenticated,
      districts: JSON.parse(JSON.stringify(realDistrictsData)),
      spatialTier: 2,
      selectedDistrictId: 'chennai',
      selectedHospitalId: 'chn-rgggh',
      selectedBedId: null,
      language: 'en',
      beds: generated.beds,
      patients: generated.patients,
      bedRequests: [],
      waitingRoomPatients: [],
      staff: JSON.parse(JSON.stringify(initialStaff)),
      agentLogs: JSON.parse(JSON.stringify(initialAgentLogs)),
      whatIfParams: { electiveSurgeryRatio: 1.0, edInflowMultiplier: 1.0, staffCalloutRate: 0.05, activeCrisisPreset: 'None' },
      simulationRunning: true,
      simSpeed: 1,
      simClockTime: '14:45:00',
      publicPrivateBalancingActive: false,
      activeDisasterScenario: null,
      dedicatedRouteActive: false,
      activeReservation: null,
      isReservationModalOpen: false,
      reservationTargetHospitalId: null,
      oxygenData: {
        tankCapacityLiters: 20000,
        currentLiters: 14250,
        percentage: 71.3,
        manifoldPressureBar: 4.2,
        consumptionRateLpm: 38.5,
        hoursAutonomyRemaining: 19.4,
        backupCylindersCount: 148,
        criticalThresholdPercent: 25,
        refillRequestActive: false,
        refillEtaMinutes: undefined,
        refillSource: undefined,
        refillVolumeLiters: undefined
      },
      bloodData: {
        groups: {
          'O-': { group: 'O-', unitsAvailable: 7, reservedUnits: 3, criticalThreshold: 10 },
          'O+': { group: 'O+', unitsAvailable: 42, reservedUnits: 8, criticalThreshold: 15 },
          'A+': { group: 'A+', unitsAvailable: 31, reservedUnits: 4, criticalThreshold: 12 },
          'A-': { group: 'A-', unitsAvailable: 8, reservedUnits: 2, criticalThreshold: 8 },
          'B+': { group: 'B+', unitsAvailable: 46, reservedUnits: 6, criticalThreshold: 15 },
          'B-': { group: 'B-', unitsAvailable: 6, reservedUnits: 1, criticalThreshold: 8 },
          'AB+': { group: 'AB+', unitsAvailable: 19, reservedUnits: 3, criticalThreshold: 10 },
          'AB-': { group: 'AB-', unitsAvailable: 5, reservedUnits: 1, criticalThreshold: 6 }
        },
        ffpUnits: 72,
        plateletUnits: 26,
        cryoUnits: 34,
        transferActive: false,
        transferDetails: undefined
      },
      isOxygenModalOpen: false,
      isBloodModalOpen: false,
      isGpsStreamModalOpen: false,
      userRole: 'authority',
      isOmniSearchOpen: false,
      isShiftHandoverOpen: false,
      predictiveOffsetHours: 0,
      isCctvOpen: false,
      isQrScannerOpen: false
    };
    notify();
  }, []);

  const setUserRole = useCallback((role: 'authority' | 'patient') => {
    globalState.userRole = role;
    if (role === 'authority') {
      globalState.spatialTier = 3;
      globalState.dedicatedRouteActive = false;
    }
    notify();
  }, []);

  // District & Facility Data Helpers
  const currentDistrict = globalState.districts[globalState.selectedDistrictId] || globalState.districts['chennai'];
  const currentHospital = currentDistrict.hospitals.find(h => h.id === globalState.selectedHospitalId) || currentDistrict.hospitals[0];

  // Computed metrics
  const totalBeds = globalState.beds.length;
  const occupiedBeds = globalState.beds.filter(b => b.status === 'occupied').length;
  const ghostBeds = globalState.beds.filter(b => b.status === 'ghost').length;
  const availableBeds = globalState.beds.filter(b => b.status === 'available').length;
  const cleaningBeds = globalState.beds.filter(b => b.status === 'cleaning').length;
  const reservedBeds = globalState.beds.filter(b => b.status === 'reserved').length;

  const icuBeds = globalState.beds.filter(b => b.ward === 'ICU');
  const icuOccupied = icuBeds.filter(b => b.status === 'occupied' || b.status === 'reserved').length;
  const icuCapacityPercent = Math.round((icuOccupied / (icuBeds.length || 1)) * 100);
  const overallOccupancyPercent = Math.round((occupiedBeds / (totalBeds || 1)) * 100);

  const getForecastPoints = (): ForecastPoint[] => {
    const mult = globalState.whatIfParams.edInflowMultiplier;
    const surgery = globalState.whatIfParams.electiveSurgeryRatio;
    const baseTotal = 26;

    return [
      { timeLabel: 'Now', hoursAhead: 0, baselineCensus: occupiedBeds, predictedCensus: occupiedBeds, icuDemand: icuOccupied, confidenceLower: occupiedBeds - 1, confidenceUpper: occupiedBeds + 1, bedCapacityLimit: baseTotal },
      { timeLabel: '+4h', hoursAhead: 4, baselineCensus: 19, predictedCensus: Math.min(baseTotal, Math.round(19 * mult + surgery * 1.5)), icuDemand: Math.min(6, Math.round(5 * mult)), confidenceLower: 17, confidenceUpper: 22, bedCapacityLimit: baseTotal },
      { timeLabel: '+12h', hoursAhead: 12, baselineCensus: 21, predictedCensus: Math.min(baseTotal, Math.round(21 * mult + surgery * 2)), icuDemand: Math.min(6, Math.round(5.5 * mult)), confidenceLower: 19, confidenceUpper: 25, bedCapacityLimit: baseTotal },
      { timeLabel: '+24h', hoursAhead: 24, baselineCensus: 20, predictedCensus: Math.min(baseTotal, Math.round(20 * mult + surgery * 2.5)), icuDemand: Math.min(6, Math.round(6 * mult)), confidenceLower: 18, confidenceUpper: 24, bedCapacityLimit: baseTotal },
      { timeLabel: '+48h', hoursAhead: 48, baselineCensus: 18, predictedCensus: Math.min(baseTotal, Math.round(18 * mult + surgery * 1.8)), icuDemand: Math.min(6, Math.round(4.8 * mult)), confidenceLower: 16, confidenceUpper: 23, bedCapacityLimit: baseTotal },
      { timeLabel: '+7d', hoursAhead: 168, baselineCensus: 19, predictedCensus: Math.min(baseTotal, Math.round(19 * mult)), icuDemand: Math.min(6, Math.round(4.5 * mult)), confidenceLower: 15, confidenceUpper: 22, bedCapacityLimit: baseTotal }
    ];
  };

  const exportStateJson = useCallback(() => {
    return JSON.stringify(
      {
        selectedDistrictId: globalState.selectedDistrictId,
        beds: globalState.beds,
        patients: globalState.patients,
        staff: globalState.staff,
        whatIfParams: globalState.whatIfParams,
        exportedAt: new Date().toISOString()
      },
      null,
      2
    );
  }, []);

  const importStateJson = useCallback((jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (Array.isArray(data.beds) && Array.isArray(data.patients)) {
        globalState.beds = data.beds;
        globalState.patients = data.patients;
        if (data.selectedDistrictId) globalState.selectedDistrictId = data.selectedDistrictId;
        if (Array.isArray(data.staff)) globalState.staff = data.staff;
        if (data.whatIfParams) globalState.whatIfParams = data.whatIfParams;
        notify();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  // Backwards compatible setActiveTab mapping to spatialTier
  const setActiveTab = useCallback((tab: string) => {
    if (tab === '3d-command') globalState.spatialTier = 3;
    else if (tab === 'regional-ems') globalState.spatialTier = 2;
    else globalState.spatialTier = 2;
    notify();
  }, []);

  // Bed Request Actions
  const submitBedRequest = useCallback((req: Omit<BedRequest, 'id' | 'status' | 'timestamp'>) => {
    const newReq: BedRequest = {
      ...req,
      id: 'REQ-' + Math.floor(1000 + Math.random() * 9000),
      status: 'pending',
      timestamp: Date.now()
    };
    globalState.bedRequests = [newReq, ...globalState.bedRequests];
    notify();
  }, []);

  const approveBedRequest = useCallback((id: string, hospitalId: string) => {
    const reqIndex = globalState.bedRequests.findIndex(r => r.id === id);
    if (reqIndex === -1) return;

    globalState.bedRequests[reqIndex].status = 'approved';

    // Find the hospital across districts and increment reservedBeds
    for (const district of Object.values(globalState.districts)) {
      const hosp = district.hospitals.find(h => h.id === hospitalId);
      if (hosp) {
        hosp.reservedBeds = (hosp.reservedBeds || 0) + 1;
        
        // Log action
        globalState.agentLogs = [
          {
            id: 'log-' + Date.now(),
            timestamp: new Date().toLocaleTimeString(),
            agentName: 'System',
            action: `BED ALLOCATED`,
            details: `Bed reserved at ${hosp.name} for ${globalState.bedRequests[reqIndex].patientName}.`,
            severity: 'success'
          },
          ...globalState.agentLogs.slice(0, 40)
        ];
        break;
      }
    }
    notify();
  }, []);

  const rejectBedRequest = useCallback((id: string) => {
    const reqIndex = globalState.bedRequests.findIndex(r => r.id === id);
    if (reqIndex === -1) return;

    globalState.bedRequests[reqIndex].status = 'rejected';
    notify();
  }, []);

  return {
    ...globalState,
    submitBedRequest,
    approveBedRequest,
    rejectBedRequest,
    language: globalState.language,
    t: translations[globalState.language],
    setLanguage,
    currentDistrict,
    currentHospital,
    hospitals: currentDistrict.hospitals,
    setSpatialTier,
    setSelectedDistrict,
    setSelectedHospitalId,
    setSelectedBedId,
    dedicatedRouteActive: globalState.dedicatedRouteActive,
    setDedicatedRouteActive,
    togglePublicPrivateBalancing,
    triggerMassCasualty,
    clearMassCasualty,
    updateBedStatus,
    turnoverGhostBed,
    admitPatient,
    assignPatientToBed,
    dischargePatient,
    resolveDischargeBarrier,
    preEmptIcuBed,
    rebalanceStaffing,
    setWhatIfParams,
    applyCrisisPreset,
    toggleSimulation,
    setSimSpeed,
    resetToDefault,
    exportStateJson,
    importStateJson,
    setActiveTab,
    totalBeds,
    occupiedBeds,
    ghostBeds,
    availableBeds,
    cleaningBeds,
    reservedBeds,
    icuCapacityPercent,
    overallOccupancyPercent,
    actualHospitalTotalBeds: currentHospital.totalBeds,
    actualHospitalOccupiedBeds: currentHospital.occupiedBeds,
    actualHospitalAvailableBeds: Math.max(0, currentHospital.totalBeds - currentHospital.occupiedBeds),
    actualHospitalIcuBeds: currentHospital.icuBeds,
    actualHospitalIcuOccupied: currentHospital.icuOccupied,
    actualHospitalIcuAvailable: Math.max(0, currentHospital.icuBeds - currentHospital.icuOccupied),
    actualHospitalEdBays: currentHospital.edBays,
    actualHospitalEdOccupied: currentHospital.edOccupied,
    actualHospitalEdWait: currentHospital.edWaitMinutes,
    actualHospitalOccupancyPercent: Math.round((currentHospital.occupiedBeds / currentHospital.totalBeds) * 100),
    getForecastPoints,
    // Bed Reservation System
    activeReservation: globalState.activeReservation,
    isReservationModalOpen: globalState.isReservationModalOpen,
    reservationTargetHospitalId: globalState.reservationTargetHospitalId,
    openReservationModal,
    closeReservationModal,
    createBedReservation,
    cancelBedReservation,
    confirmBedIntake,
    // Oxygen & Blood Bank Logistics
    oxygenData: globalState.oxygenData,
    bloodData: globalState.bloodData,
    isOxygenModalOpen: globalState.isOxygenModalOpen,
    isBloodModalOpen: globalState.isBloodModalOpen,
    isGpsStreamModalOpen: globalState.isGpsStreamModalOpen,
    openOxygenModal,
    openBloodModal,
    openGpsStreamModal,
    requestOxygenRefill,
    requestBloodTransfer,
    // Persona Role Switcher
    userRole: globalState.userRole,
    setUserRole,
    // Auth State
    isAuthenticated: globalState.isAuthenticated,
    setIsAuthenticated: (auth: boolean) => {
      globalState.isAuthenticated = auth;
      notify();
    },
    setOmniSearchOpen: (v: boolean) => { globalState.isOmniSearchOpen = v; notify(); },
    setShiftHandoverOpen: (v: boolean) => { globalState.isShiftHandoverOpen = v; notify(); },
    predictiveOffsetHours: globalState.predictiveOffsetHours,
    setPredictiveOffsetHours: (v: number) => { globalState.predictiveOffsetHours = v; notify(); },
    isCctvOpen: globalState.isCctvOpen,
    setCctvOpen: (v: boolean) => { globalState.isCctvOpen = v; notify(); },
    isQrScannerOpen: globalState.isQrScannerOpen,
    setQrScannerOpen: (v: boolean) => { globalState.isQrScannerOpen = v; notify(); }
  };
}

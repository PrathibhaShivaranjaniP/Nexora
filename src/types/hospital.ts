export type BedStatus = 'available' | 'occupied' | 'ghost' | 'cleaning' | 'reserved';

export type WardType = 'ED' | 'ICU' | 'MedSurg' | 'StepDown' | 'OR';

export interface Bed {
  id: string;
  number: string;
  ward: WardType;
  status: BedStatus;
  patientId?: string;
  lastVacatedTime?: string;
  pressureSensorActive: boolean;
  notes?: string;
  // 3D positioning coordinates in procedural hospital space
  position3D: [number, number, number];
}

export interface PatientVitals {
  heartRate: number;
  bpSystolic: number;
  bpDiastolic: number;
  spO2: number;
  respRate: number;
  temperature: number;
}

export interface DischargeBarrier {
  id: string;
  category: 'transport' | 'insurance' | 'snf_placement' | 'equipment' | 'clinical';
  description: string;
  detectedAt: string;
  resolved: boolean;
}

export interface Patient {
  id: string;
  mrn: string;
  name: string;
  age: number;
  gender: 'M' | 'F' | 'Other';
  ward: WardType;
  bedId: string;
  diagnosis: string;
  acuity: 1 | 2 | 3 | 4 | 5; // 1 = lowest acuity, 5 = critical
  vitals: PatientVitals;
  news2Score: number;
  deteriorationRisk: number; // 0 to 100%
  admissionTime: string;
  estDischargeTime: string;
  dischargeBarrier?: DischargeBarrier;
  clinicalNotesSnippet?: string;
}

export interface StaffMember {
  id: string;
  name: string;
  role: 'RN' | 'Charge Nurse' | 'Intensivist' | 'Physician';
  ward: WardType;
  assignedPatientIds: string[];
  currentAcuityLoad: number; // calculated sum of patient acuities
  burnoutScore: number; // 0 to 100%
  shiftStatus: 'active' | 'break' | 'overtime';
}

export interface HospitalNetworkNode {
  id: string;
  name: string;
  shortName: string;
  type: 'Trauma 1 Academic' | 'Regional Community' | 'Suburban Satellite';
  address: string;
  coordinates: { x: number; y: number; lat: number; lng: number };
  totalBeds: number;
  occupiedBeds: number;
  icuBeds: number;
  icuOccupied: number;
  edBays: number;
  edOccupied: number;
  edWaitMinutes: number;
  diversionActive: boolean;
  specialties: string[];
  distanceMilesFromCentral: number;
  ambulanceTransitMinutes: number;
}

export interface AgentLog {
  id: string;
  timestamp: string;
  agentName: 'ED_Agent' | 'ICU_Agent' | 'MedSurg_Agent' | 'EVS_Cleaning_Agent' | 'Regional_Broker_Agent' | 'System';
  action: string;
  details: string;
  severity: 'info' | 'warning' | 'urgent' | 'success';
}

export interface WhatIfParameters {
  electiveSurgeryRatio: number; // 1.0 = 100%, 0.0 = canceled, 2.0 = double
  edInflowMultiplier: number;   // 1.0 = normal, 0.5 = low, 2.5 = disaster
  staffCalloutRate: number;     // 0.0 = 0%, 0.3 = 30% sick calls
  activeCrisisPreset: 'None' | 'Highway Pileup' | 'Viral Epidemic' | 'Winter Storm' | 'Mass Gathering Surge';
}

export interface ForecastPoint {
  timeLabel: string;
  hoursAhead: number;
  baselineCensus: number;
  predictedCensus: number;
  icuDemand: number;
  confidenceLower: number;
  confidenceUpper: number;
  bedCapacityLimit: number;
}

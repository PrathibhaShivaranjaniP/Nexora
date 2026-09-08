import { Bed, Patient, StaffMember, HospitalNetworkNode, AgentLog } from '../types/hospital';

// 3D Grid Layout Parameters
// ED on Left (X: -14 to -8), ICU on Top (Z: -12 to -6), MedSurg Center/Right (X: -2 to 14, Z: -2 to 12)
export const initialBeds: Bed[] = [
  // EMERGENCY DEPARTMENT (ED)
  { id: 'ED-01', number: 'ED Bay 1', ward: 'ED', status: 'occupied', patientId: 'P-101', pressureSensorActive: true, position3D: [-12, 0.4, -4] },
  { id: 'ED-02', number: 'ED Bay 2', ward: 'ED', status: 'occupied', patientId: 'P-102', pressureSensorActive: true, position3D: [-12, 0.4, -1] },
  { id: 'ED-03', number: 'ED Bay 3', ward: 'ED', status: 'available', pressureSensorActive: false, position3D: [-12, 0.4, 2] },
  { id: 'ED-04', number: 'ED Bay 4', ward: 'ED', status: 'occupied', patientId: 'P-103', pressureSensorActive: true, position3D: [-12, 0.4, 5] },
  { id: 'ED-05', number: 'ED Bay 5 (Trauma)', ward: 'ED', status: 'reserved', pressureSensorActive: false, position3D: [-9, 0.4, -4], notes: 'Reserved for inbound MV accident' },
  { id: 'ED-06', number: 'ED Bay 6 (Trauma)', ward: 'ED', status: 'available', pressureSensorActive: false, position3D: [-9, 0.4, -1] },
  { id: 'ED-07', number: 'ED Bay 7', ward: 'ED', status: 'occupied', patientId: 'P-104', pressureSensorActive: true, position3D: [-9, 0.4, 2] },
  { id: 'ED-08', number: 'ED Bay 8', ward: 'ED', status: 'ghost', pressureSensorActive: false, lastVacatedTime: '13:10', position3D: [-9, 0.4, 5], notes: 'Sensor 0kg, uncleaned in EHR' },

  // INTENSIVE CARE UNIT (ICU)
  { id: 'ICU-01', number: 'ICU Pod 1', ward: 'ICU', status: 'occupied', patientId: 'P-201', pressureSensorActive: true, position3D: [-4, 0.4, -10] },
  { id: 'ICU-02', number: 'ICU Pod 2', ward: 'ICU', status: 'occupied', patientId: 'P-202', pressureSensorActive: true, position3D: [-1, 0.4, -10] },
  { id: 'ICU-03', number: 'ICU Pod 3', ward: 'ICU', status: 'occupied', patientId: 'P-203', pressureSensorActive: true, position3D: [2, 0.4, -10] },
  { id: 'ICU-04', number: 'ICU Pod 4', ward: 'ICU', status: 'reserved', pressureSensorActive: false, position3D: [5, 0.4, -10], notes: 'Pre-reserved for Ward 3 Sepsis transfer' },
  { id: 'ICU-05', number: 'ICU Pod 5', ward: 'ICU', status: 'occupied', patientId: 'P-204', pressureSensorActive: true, position3D: [8, 0.4, -10] },
  { id: 'ICU-06', number: 'ICU Pod 6', ward: 'ICU', status: 'cleaning', pressureSensorActive: false, position3D: [11, 0.4, -10], notes: 'EVS UV Disinfection in progress' },

  // MED-SURG WARD (MS)
  { id: 'MS-101', number: 'Bed MS-101', ward: 'MedSurg', status: 'occupied', patientId: 'P-301', pressureSensorActive: true, position3D: [-3, 0.4, -2] },
  { id: 'MS-102', number: 'Bed MS-102', ward: 'MedSurg', status: 'occupied', patientId: 'P-302', pressureSensorActive: true, position3D: [-3, 0.4, 1] },
  { id: 'MS-103', number: 'Bed MS-103', ward: 'MedSurg', status: 'occupied', patientId: 'P-303', pressureSensorActive: true, position3D: [-3, 0.4, 4] },
  { id: 'MS-104', number: 'Bed MS-104', ward: 'MedSurg', status: 'ghost', pressureSensorActive: false, lastVacatedTime: '12:45', position3D: [-3, 0.4, 7], notes: 'Patient left 2h ago. Ghost Bed!' },
  
  { id: 'MS-105', number: 'Bed MS-105', ward: 'MedSurg', status: 'occupied', patientId: 'P-304', pressureSensorActive: true, position3D: [2, 0.4, -2] },
  { id: 'MS-106', number: 'Bed MS-106', ward: 'MedSurg', status: 'available', pressureSensorActive: false, position3D: [2, 0.4, 1] },
  { id: 'MS-107', number: 'Bed MS-107', ward: 'MedSurg', status: 'occupied', patientId: 'P-305', pressureSensorActive: true, position3D: [2, 0.4, 4] },
  { id: 'MS-108', number: 'Bed MS-108', ward: 'MedSurg', status: 'occupied', patientId: 'P-306', pressureSensorActive: true, position3D: [2, 0.4, 7] },

  { id: 'MS-109', number: 'Bed MS-109', ward: 'MedSurg', status: 'occupied', patientId: 'P-307', pressureSensorActive: true, position3D: [7, 0.4, -2] },
  { id: 'MS-110', number: 'Bed MS-110', ward: 'MedSurg', status: 'available', pressureSensorActive: false, position3D: [7, 0.4, 1] },
  { id: 'MS-111', number: 'Bed MS-111', ward: 'MedSurg', status: 'cleaning', pressureSensorActive: false, position3D: [7, 0.4, 4] },
  { id: 'MS-112', number: 'Bed MS-112', ward: 'MedSurg', status: 'ghost', pressureSensorActive: false, lastVacatedTime: '14:20', position3D: [7, 0.4, 7], notes: 'Vacated via wheelchair' },

  // STEP-DOWN UNIT (SD)
  { id: 'SD-201', number: 'Step-Down 1', ward: 'StepDown', status: 'occupied', patientId: 'P-401', pressureSensorActive: true, position3D: [12, 0.4, -4] },
  { id: 'SD-202', number: 'Step-Down 2', ward: 'StepDown', status: 'occupied', patientId: 'P-402', pressureSensorActive: true, position3D: [12, 0.4, -1] },
  { id: 'SD-203', number: 'Step-Down 3', ward: 'StepDown', status: 'available', pressureSensorActive: false, position3D: [12, 0.4, 2] },
  { id: 'SD-204', number: 'Step-Down 4', ward: 'StepDown', status: 'occupied', patientId: 'P-403', pressureSensorActive: true, position3D: [12, 0.4, 5] },
];

export const initialPatients: Patient[] = [
  // ED Patients
  {
    id: 'P-101',
    mrn: 'MRN-88412',
    name: 'Marcus Vance',
    age: 44,
    gender: 'M',
    ward: 'ED',
    bedId: 'ED-01',
    diagnosis: 'Acute Coronary Syndrome (NSTEMI)',
    acuity: 4,
    vitals: { heartRate: 104, bpSystolic: 148, bpDiastolic: 92, spO2: 95, respRate: 22, temperature: 37.1 },
    news2Score: 5,
    deteriorationRisk: 42,
    admissionTime: '13:30',
    estDischargeTime: '20:00',
    clinicalNotesSnippet: 'Troponin elevated at 0.18 ng/mL. Awaiting urgent cardiology consult and telemetry bed assignment.'
  },
  {
    id: 'P-102',
    mrn: 'MRN-72901',
    name: 'Eleanor Davis',
    age: 29,
    gender: 'F',
    ward: 'ED',
    bedId: 'ED-02',
    diagnosis: 'Severe Asthma Exacerbation',
    acuity: 3,
    vitals: { heartRate: 98, bpSystolic: 124, bpDiastolic: 78, spO2: 94, respRate: 24, temperature: 36.8 },
    news2Score: 3,
    deteriorationRisk: 28,
    admissionTime: '14:15',
    estDischargeTime: '18:30',
    clinicalNotesSnippet: 'Responded to second albuterol nebulizer. Peak expiratory flow improving.'
  },
  {
    id: 'P-103',
    mrn: 'MRN-64219',
    name: 'Harold Jenkins',
    age: 72,
    gender: 'M',
    ward: 'ED',
    bedId: 'ED-04',
    diagnosis: 'Community-Acquired Pneumonia',
    acuity: 3,
    vitals: { heartRate: 88, bpSystolic: 118, bpDiastolic: 72, spO2: 93, respRate: 20, temperature: 38.4 },
    news2Score: 4,
    deteriorationRisk: 35,
    admissionTime: '11:45',
    estDischargeTime: '17:00',
    clinicalNotesSnippet: 'Chest X-ray shows right lower lobe consolidation. IV ceftriaxone initiated.'
  },
  {
    id: 'P-104',
    mrn: 'MRN-90231',
    name: 'Sofia Rodriguez',
    age: 38,
    gender: 'F',
    ward: 'ED',
    bedId: 'ED-07',
    diagnosis: 'Renal Colic / Nephrolithiasis',
    acuity: 2,
    vitals: { heartRate: 82, bpSystolic: 130, bpDiastolic: 80, spO2: 99, respRate: 16, temperature: 36.7 },
    news2Score: 1,
    deteriorationRisk: 12,
    admissionTime: '15:10',
    estDischargeTime: '19:00',
    clinicalNotesSnippet: 'Pain controlled with ketorolac. CT abdomen shows 4mm distal ureteral calculus.'
  },

  // ICU Patients
  {
    id: 'P-201',
    mrn: 'MRN-10452',
    name: 'Arthur Pendelton',
    age: 68,
    gender: 'M',
    ward: 'ICU',
    bedId: 'ICU-01',
    diagnosis: 'Post-CABG Day 1 (Triple Bypass)',
    acuity: 5,
    vitals: { heartRate: 86, bpSystolic: 110, bpDiastolic: 65, spO2: 98, respRate: 14, temperature: 36.9 },
    news2Score: 2,
    deteriorationRisk: 18,
    admissionTime: 'Yesterday 09:00',
    estDischargeTime: 'Tomorrow 12:00',
    clinicalNotesSnippet: 'Extubated successfully 6 hours ago. Mediastinal drains minimal, stable on low dose norepinephrine.'
  },
  {
    id: 'P-202',
    mrn: 'MRN-43198',
    name: 'Diane Foster',
    age: 57,
    gender: 'F',
    ward: 'ICU',
    bedId: 'ICU-02',
    diagnosis: 'Severe Sepsis secondary to Pyelonephritis',
    acuity: 5,
    vitals: { heartRate: 118, bpSystolic: 92, bpDiastolic: 54, spO2: 92, respRate: 26, temperature: 39.2 },
    news2Score: 9,
    deteriorationRisk: 78,
    admissionTime: '03:10',
    estDischargeTime: 'In 3 days',
    clinicalNotesSnippet: 'Lactate 3.8 mmol/L. Refractory hypotension requiring vasopressin titration. High risk of multi-organ failure.'
  },
  {
    id: 'P-203',
    mrn: 'MRN-55214',
    name: 'Robert Zhang',
    age: 63,
    gender: 'M',
    ward: 'ICU',
    bedId: 'ICU-03',
    diagnosis: 'Traumatic Brain Injury / Subdural Hematoma',
    acuity: 5,
    vitals: { heartRate: 64, bpSystolic: 155, bpDiastolic: 88, spO2: 99, respRate: 12, temperature: 37.0 },
    news2Score: 4,
    deteriorationRisk: 30,
    admissionTime: 'Yesterday 22:00',
    estDischargeTime: 'In 2 days',
    clinicalNotesSnippet: 'Post-craniotomy. ICP catheter stable at 11 mmHg. Sedation lightened for pupillary exam.'
  },
  {
    id: 'P-204',
    mrn: 'MRN-89012',
    name: 'Clara Oswald',
    age: 71,
    gender: 'F',
    ward: 'ICU',
    bedId: 'ICU-05',
    diagnosis: 'Acute Hypoxemic Respiratory Failure (ARDS)',
    acuity: 5,
    vitals: { heartRate: 102, bpSystolic: 122, bpDiastolic: 76, spO2: 91, respRate: 28, temperature: 38.1 },
    news2Score: 8,
    deteriorationRisk: 65,
    admissionTime: 'Yesterday 14:00',
    estDischargeTime: 'In 4 days',
    clinicalNotesSnippet: 'Mechanical ventilation on lung-protective settings (PEEP 12, FiO2 60%). Prone positioning scheduled for tonight.'
  },

  // MED-SURG PATIENTS (With Deterioration & NLP Barriers)
  {
    id: 'P-301',
    mrn: 'MRN-33821',
    name: 'Walter White',
    age: 59,
    gender: 'M',
    ward: 'MedSurg',
    bedId: 'MS-101',
    diagnosis: 'COPD Exacerbation & Bronchitis',
    acuity: 3,
    vitals: { heartRate: 94, bpSystolic: 138, bpDiastolic: 84, spO2: 93, respRate: 22, temperature: 37.2 },
    news2Score: 3,
    deteriorationRisk: 22,
    admissionTime: '2 days ago',
    estDischargeTime: 'Today 16:00',
    clinicalNotesSnippet: 'Clinically cleared for discharge. Pending Medicare prior authorization approval for home oxygen concentrator equipment.',
    dischargeBarrier: {
      id: 'BAR-01',
      category: 'equipment',
      description: 'Home oxygen equipment vendor delivery delayed due to missing insurance prior authorization.',
      detectedAt: '09:30 AM',
      resolved: false
    }
  },
  {
    id: 'P-302',
    mrn: 'MRN-91102',
    name: 'Linda Campbell',
    age: 64,
    gender: 'F',
    ward: 'MedSurg',
    bedId: 'MS-102',
    diagnosis: 'Urosepsis with impending septic shock',
    acuity: 4,
    vitals: { heartRate: 122, bpSystolic: 94, bpDiastolic: 56, spO2: 91, respRate: 28, temperature: 39.5 },
    news2Score: 9, // HIGH DETERIORATION RISK
    deteriorationRisk: 86,
    admissionTime: 'Yesterday 18:00',
    estDischargeTime: 'Uncertain',
    clinicalNotesSnippet: 'Deteriorating rapidly! Blood pressure trending downwards despite 3L fluid bolus. NEWS2=9. ICU bed pre-emption requested.'
  },
  {
    id: 'P-303',
    mrn: 'MRN-20188',
    name: 'James Reynolds',
    age: 76,
    gender: 'M',
    ward: 'MedSurg',
    bedId: 'MS-103',
    diagnosis: 'Elective Total Knee Arthroplasty (Post-Op Day 2)',
    acuity: 2,
    vitals: { heartRate: 74, bpSystolic: 126, bpDiastolic: 76, spO2: 98, respRate: 16, temperature: 36.8 },
    news2Score: 0,
    deteriorationRisk: 5,
    admissionTime: '2 days ago',
    estDischargeTime: 'Today 14:00',
    clinicalNotesSnippet: 'Patient ambulatory with walker. Discharge delayed: family transport vehicle unavailable until 6:00 PM.',
    dischargeBarrier: {
      id: 'BAR-02',
      category: 'transport',
      description: 'Family unable to provide ride home until late evening; hospital non-emergency transit ride voucher needed.',
      detectedAt: '10:15 AM',
      resolved: false
    }
  },
  {
    id: 'P-304',
    mrn: 'MRN-77340',
    name: 'Geraldine Brooks',
    age: 83,
    gender: 'F',
    ward: 'MedSurg',
    bedId: 'MS-105',
    diagnosis: 'Congestive Heart Failure Exacerbation',
    acuity: 3,
    vitals: { heartRate: 80, bpSystolic: 142, bpDiastolic: 82, spO2: 95, respRate: 18, temperature: 36.9 },
    news2Score: 2,
    deteriorationRisk: 15,
    admissionTime: '3 days ago',
    estDischargeTime: 'Tomorrow 10:00',
    clinicalNotesSnippet: 'Diuresis successful, net negative 3.2L. Weight stabilized at dry baseline.'
  },
  {
    id: 'P-305',
    mrn: 'MRN-61804',
    name: 'Samuel Torres',
    age: 48,
    gender: 'M',
    ward: 'MedSurg',
    bedId: 'MS-107',
    diagnosis: 'Complicated Diverticulitis',
    acuity: 3,
    vitals: { heartRate: 86, bpSystolic: 120, bpDiastolic: 78, spO2: 97, respRate: 16, temperature: 37.6 },
    news2Score: 1,
    deteriorationRisk: 14,
    admissionTime: 'Yesterday 11:00',
    estDischargeTime: 'In 2 days',
    clinicalNotesSnippet: 'IV piperacillin/tazobactam ongoing. Abdominal tenderness localized, WBC count downtrending.'
  },
  {
    id: 'P-306',
    mrn: 'MRN-44910',
    name: 'Patricia Hayes',
    age: 69,
    gender: 'F',
    ward: 'MedSurg',
    bedId: 'MS-108',
    diagnosis: 'Post-Cholecystectomy Wound Infection',
    acuity: 2,
    vitals: { heartRate: 84, bpSystolic: 128, bpDiastolic: 80, spO2: 98, respRate: 16, temperature: 37.4 },
    news2Score: 1,
    deteriorationRisk: 8,
    admissionTime: 'Yesterday 16:30',
    estDischargeTime: 'Today 17:00',
    clinicalNotesSnippet: 'Wound clean, oral cephalexin tolerated. Awaiting Skilled Nursing Facility (SNF) placement acceptance.',
    dischargeBarrier: {
      id: 'BAR-03',
      category: 'snf_placement',
      description: 'Pending rehabilitation bed intake acceptance at St. Jude SNF facility.',
      detectedAt: '11:00 AM',
      resolved: false
    }
  },
  {
    id: 'P-307',
    mrn: 'MRN-83190',
    name: 'Kevin O\'Connor',
    age: 52,
    gender: 'M',
    ward: 'MedSurg',
    bedId: 'MS-109',
    diagnosis: 'Acute Pancreatitis (Ethanol-induced)',
    acuity: 3,
    vitals: { heartRate: 96, bpSystolic: 132, bpDiastolic: 84, spO2: 96, respRate: 18, temperature: 37.8 },
    news2Score: 2,
    deteriorationRisk: 24,
    admissionTime: 'Yesterday 04:00',
    estDischargeTime: 'In 3 days',
    clinicalNotesSnippet: 'Pain manageable on oral analgesia. Tolerating clear liquids, lipase settling.'
  },

  // STEP-DOWN PATIENTS
  {
    id: 'P-401',
    mrn: 'MRN-18239',
    name: 'Brenda Walsh',
    age: 62,
    gender: 'F',
    ward: 'StepDown',
    bedId: 'SD-201',
    diagnosis: 'Recent DKA Transition from ICU',
    acuity: 3,
    vitals: { heartRate: 88, bpSystolic: 124, bpDiastolic: 78, spO2: 97, respRate: 18, temperature: 37.0 },
    news2Score: 1,
    deteriorationRisk: 10,
    admissionTime: 'Yesterday 19:00',
    estDischargeTime: 'Tomorrow 14:00',
    clinicalNotesSnippet: 'Anion gap closed. Transitioned off insulin drip to subQ basal-bolus regimen.'
  },
  {
    id: 'P-402',
    mrn: 'MRN-33041',
    name: 'Anthony Rossi',
    age: 70,
    gender: 'M',
    ward: 'StepDown',
    bedId: 'SD-202',
    diagnosis: 'Atrial Fibrillation with RVR',
    acuity: 3,
    vitals: { heartRate: 114, bpSystolic: 134, bpDiastolic: 82, spO2: 96, respRate: 20, temperature: 36.8 },
    news2Score: 4,
    deteriorationRisk: 32,
    admissionTime: 'Yesterday 15:30',
    estDischargeTime: 'In 2 days',
    clinicalNotesSnippet: 'Diltiazem infusion weaning. Rate controlled between 85–105 bpm.'
  },
  {
    id: 'P-403',
    mrn: 'MRN-90924',
    name: 'Evelyn Taylor',
    age: 79,
    gender: 'F',
    ward: 'StepDown',
    bedId: 'SD-204',
    diagnosis: 'Subacute Ischemic Stroke (Lacunar)',
    acuity: 3,
    vitals: { heartRate: 78, bpSystolic: 148, bpDiastolic: 86, spO2: 97, respRate: 16, temperature: 36.9 },
    news2Score: 1,
    deteriorationRisk: 15,
    admissionTime: '3 days ago',
    estDischargeTime: 'Tomorrow 11:00',
    clinicalNotesSnippet: 'Speech therapy completed swallow eval. Dysphagia improved, advancing to soft diet.'
  }
];

export const initialStaff: StaffMember[] = [
  { id: 'ST-01', name: 'Sarah Jenkins, RN', role: 'RN', ward: 'ICU', assignedPatientIds: ['P-201', 'P-202'], currentAcuityLoad: 10, burnoutScore: 84, shiftStatus: 'active' },
  { id: 'ST-02', name: 'David Kim, RN', role: 'RN', ward: 'ICU', assignedPatientIds: ['P-203', 'P-204'], currentAcuityLoad: 10, burnoutScore: 78, shiftStatus: 'active' },
  { id: 'ST-03', name: 'Elena Rostova, RN', role: 'Charge Nurse', ward: 'MedSurg', assignedPatientIds: ['P-301'], currentAcuityLoad: 3, burnoutScore: 42, shiftStatus: 'active' },
  { id: 'ST-04', name: 'Marcus Bell, RN', role: 'RN', ward: 'MedSurg', assignedPatientIds: ['P-302', 'P-303', 'P-304'], currentAcuityLoad: 9, burnoutScore: 89, shiftStatus: 'active' },
  { id: 'ST-05', name: 'Rachel Adams, RN', role: 'RN', ward: 'MedSurg', assignedPatientIds: ['P-305', 'P-306', 'P-307'], currentAcuityLoad: 8, burnoutScore: 65, shiftStatus: 'active' },
  { id: 'ST-06', name: 'Jessica Miller, RN', role: 'RN', ward: 'ED', assignedPatientIds: ['P-101', 'P-102'], currentAcuityLoad: 7, burnoutScore: 71, shiftStatus: 'active' },
  { id: 'ST-07', name: 'Carlos Mendez, RN', role: 'RN', ward: 'ED', assignedPatientIds: ['P-103', 'P-104'], currentAcuityLoad: 5, burnoutScore: 48, shiftStatus: 'active' },
  { id: 'ST-08', name: 'Tanya Harris, RN', role: 'RN', ward: 'StepDown', assignedPatientIds: ['P-401', 'P-402', 'P-403'], currentAcuityLoad: 9, burnoutScore: 62, shiftStatus: 'active' },
];

export const regionalHospitals: HospitalNetworkNode[] = [
  {
    id: 'hosp-central',
    name: 'Aegis Central Medical Center',
    shortName: 'Aegis Central',
    type: 'Trauma 1 Academic',
    address: '500 Health Sciences Way, Metro District',
    coordinates: { x: 0, y: 0, lat: 40.7128, lng: -74.0060 },
    totalBeds: 340,
    occupiedBeds: 308,
    icuBeds: 48,
    icuOccupied: 45, // 93.7% ICU
    edBays: 36,
    edOccupied: 32,
    edWaitMinutes: 52,
    diversionActive: true,
    specialties: ['Comprehensive Stroke', 'Level 1 Trauma', 'Cardiac Cath Lab', 'Pediatric ICU', 'Burn Unit', 'Organ Transplant'],
    distanceMilesFromCentral: 0,
    ambulanceTransitMinutes: 0
  },
  {
    id: 'hosp-north',
    name: 'Metro North Regional Hospital',
    shortName: 'Metro North',
    type: 'Regional Community',
    address: '1220 Park Boulevard, North Valley',
    coordinates: { x: 8, y: 14, lat: 40.7828, lng: -73.9660 },
    totalBeds: 240,
    occupiedBeds: 168, // 70%
    icuBeds: 28,
    icuOccupied: 19, // 67%
    edBays: 24,
    edOccupied: 14,
    edWaitMinutes: 18,
    diversionActive: false,
    specialties: ['Emergency Medicine', 'Primary Stroke', 'Orthopedic Surgery', 'Cardiology', 'General ICU', 'Maternity'],
    distanceMilesFromCentral: 6.4,
    ambulanceTransitMinutes: 12
  },
  {
    id: 'hosp-west',
    name: 'Westview Community Hospital',
    shortName: 'Westview Community',
    type: 'Suburban Satellite',
    address: '404 West Ridge Pike, West County',
    coordinates: { x: -16, y: 8, lat: 40.6928, lng: -74.1260 },
    totalBeds: 110,
    occupiedBeds: 58, // 52%
    icuBeds: 12,
    icuOccupied: 6, // 50%
    edBays: 16,
    edOccupied: 7,
    edWaitMinutes: 8,
    diversionActive: false,
    specialties: ['Emergency Medicine', 'Geriatric Care', 'Physical Rehab', 'General Surgery', 'Urgent Care'],
    distanceMilesFromCentral: 14.8,
    ambulanceTransitMinutes: 22
  }
];

export const initialAgentLogs: AgentLog[] = [
  {
    id: 'log-01',
    timestamp: '14:32:05',
    agentName: 'ICU_Agent',
    action: 'Deterioration Alert & Bed Bid',
    details: 'Ward 3 patient Linda Campbell (P-302) NEWS2=9. Bidding for ICU-04 reservation.',
    severity: 'urgent'
  },
  {
    id: 'log-02',
    timestamp: '14:32:18',
    agentName: 'Regional_Broker_Agent',
    action: 'Bid Approved',
    details: 'ICU-04 auto-reserved for P-302 prior to clinical arrest. Transfer coordination initiated.',
    severity: 'success'
  },
  {
    id: 'log-03',
    timestamp: '14:35:40',
    agentName: 'EVS_Cleaning_Agent',
    action: 'Ghost Bed Detected',
    details: 'Bed MS-104 pressure sensor indicates 0kg for 120 mins. Triggered EVS cleaning priority.',
    severity: 'warning'
  },
  {
    id: 'log-04',
    timestamp: '14:38:12',
    agentName: 'Regional_Broker_Agent',
    action: 'EMS Diversion Recommended',
    details: 'Aegis Central ICU capacity at 93.7%. Routing incoming Level 2 trauma to Metro North (12 min ETA).',
    severity: 'warning'
  },
  {
    id: 'log-05',
    timestamp: '14:41:00',
    agentName: 'MedSurg_Agent',
    action: 'NLP Barrier Flagged',
    details: 'Patient Walter White (P-301) discharge stalled due to oxygen equipment delay. Social work pinged.',
    severity: 'info'
  }
];

import { Bed, Patient, BedStatus, WardType } from '../types/hospital';
import { RealHospital } from '../data/realDistrictsData';

// Generates 24 high-acuity representative 3D beds matching the exact scale,
// specialties, and occupancy percentage of any real hospital in Tamil Nadu.
export function generateHospitalBedsAndPatients(hospital: RealHospital): {
  beds: Bed[];
  patients: Patient[];
} {
  const prefix = hospital.shortName
    .replace(/[^a-zA-Z]/g, '')
    .substring(0, 4)
    .toUpperCase();

  const occRate = hospital.occupiedBeds / (hospital.totalBeds || 1);
  const icuOccRate = hospital.icuOccupied / (hospital.icuBeds || 1);

  // Department layout (4 wings x 6 beds = 24 representative 3D beds)
  const departments: Array<{
    ward: WardType;
    label: string;
    targetOccRate: number;
    baseX: number;
    baseZ: number;
  }> = [
    { ward: 'ED', label: 'Emergency & Trauma Bay', targetOccRate: Math.min(0.95, (hospital.edOccupied / (hospital.edBays || 1)) || occRate), baseX: -8, baseZ: -5 },
    { ward: 'ICU', label: 'Intensive Critical Care Unit', targetOccRate: icuOccRate, baseX: -8, baseZ: 8 },
    { ward: 'MedSurg', label: 'Med-Surg Post-Operative', targetOccRate: occRate, baseX: 8, baseZ: -5 },
    { ward: 'StepDown', label: 'Specialized Step-Down Wing', targetOccRate: Math.max(0.65, occRate * 0.9), baseX: 8, baseZ: 8 }
  ];

  const beds: Bed[] = [];
  const patients: Patient[] = [];

  const patientNames = [
    'Kavitha Sundaram', 'Senthil Nathan', 'Ananya Raman', 'Murugan Velu',
    'Deepa Krishnan', 'Venkatesh Babu', 'Selvi Meenakshi', 'Saravanan R.',
    'Lakshmi Narayanan', 'Ganesh Kumar', 'Karthik Subramanian', 'Priyanka Devi',
    'Muthuraj P.', 'Bhuvaneshwari S.', 'Dinesh Chandran', 'Jayanthi Sridhar',
    'Arumugam K.', 'Revathi Mohan', 'Praveen Raj', 'Shanthi Loganathan',
    'Manikandan T.', 'Geetha Ramaswamy', 'Vijay Anand', 'Sudha Swaminathan'
  ];

  let patientIdx = 0;

  departments.forEach((dept) => {
    // 6 beds per department arranged in a 2x3 grid
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 3; col++) {
        const bedNum = beds.length + 1;
        const bedId = `BED-${prefix}-${dept.ward}-${bedNum < 10 ? '0' + bedNum : bedNum}`;

        // 3D coordinates relative to department base
        const posX = dept.baseX + (col - 1) * 3.4;
        const posZ = dept.baseZ + (row === 0 ? -2.2 : 2.2);

        // Determine status based on department target occupancy rate
        const rand = (bedNum * 17) % 100 / 100;
        let status: BedStatus = 'occupied';

        if (rand > dept.targetOccRate) {
          // Available, cleaning, or ghost
          if (rand > dept.targetOccRate + 0.15) {
            status = 'available';
          } else if (rand > dept.targetOccRate + 0.08) {
            status = 'cleaning';
          } else {
            status = 'ghost'; // Ghost bed: 0kg IoT weight with pending discharge!
          }
        } else if (dept.ward === 'ICU' && rand < 0.15) {
          status = 'reserved'; // Pre-emptively reserved for impending STEMI/Trauma
        }

        const isOccupied = status === 'occupied' || status === 'reserved';
        let patientId: string | undefined = undefined;

        if (isOccupied) {
          const pName = patientNames[patientIdx % patientNames.length];
          patientIdx++;
          patientId = `PAT-${prefix}-${100 + bedNum}`;

          // Pick authentic specialty diagnosis matching this hospital
          const specialty = hospital.specialties[(bedNum - 1) % hospital.specialties.length] || 'Acute Trauma Evaluation';
          const acuityVal = dept.ward === 'ICU' ? ((bedNum % 2 === 0 ? 5 : 4) as 4 | 5) : dept.ward === 'ED' ? ((bedNum % 3 === 0 ? 4 : 3) as 3 | 4) : 2;

          const hr = dept.ward === 'ICU' ? 88 + (bedNum % 25) : 74 + (bedNum % 16);
          const bpSys = dept.ward === 'ICU' ? 135 + (bedNum % 20) : 122 + (bedNum % 14);
          const bpDia = dept.ward === 'ICU' ? 88 + (bedNum % 10) : 80 + (bedNum % 8);
          const spo2 = dept.ward === 'ICU' ? (acuityVal === 5 ? 93 : 96) : 98;
          const news2 = acuityVal === 5 ? 7 : acuityVal === 4 ? 4 : 2;

          patients.push({
            id: patientId,
            mrn: `MRN-${prefix}-${Math.floor(10000 + (bedNum * 831) % 90000)}`,
            name: pName,
            age: 32 + ((bedNum * 7) % 45),
            gender: bedNum % 2 === 0 ? 'F' : 'M',
            ward: dept.ward,
            bedId,
            diagnosis: specialty,
            acuity: acuityVal,
            news2Score: news2,
            deteriorationRisk: acuityVal === 5 ? 78 : acuityVal === 4 ? 42 : 12,
            admissionTime: `${Math.max(1, 24 - bedNum)}h ago`,
            estDischargeTime: dept.ward === 'ICU' ? '48-72h' : '24h',
            vitals: {
              heartRate: hr,
              bpSystolic: bpSys,
              bpDiastolic: bpDia,
              spO2: spo2,
              respRate: dept.ward === 'ICU' ? 22 : 16,
              temperature: 37.1
            },
            clinicalNotesSnippet: `Admitted under ${hospital.name}. Continuous Lead II telemetry streaming. NEWS2 Score: ${news2}.`
          });
        }

        beds.push({
          id: bedId,
          number: `${prefix}-${dept.ward}-${bedNum}`,
          ward: dept.ward,
          status,
          patientId,
          pressureSensorActive: status === 'occupied',
          notes:
            status === 'ghost'
              ? 'IoT Bed Sensor detects 0 kg (Patient Vacated EHR Pending)'
              : status === 'cleaning'
              ? 'Robotic UV-C disinfection in progress'
              : status === 'reserved'
              ? `Code ${dept.ward === 'ICU' ? 'STEMI' : 'Trauma'} inbound reservation`
              : undefined,
          position3D: [posX, 0.45, posZ]
        });
      }
    }
  });

  return { beds, patients };
}

// Real-time live simulation step: introduces authentic admissions, discharges,
// and IoT sensor turnover every cycle so the hospital behaves like a living twin.
export function stepRealTimeHospitalBedTelemetry(
  hospital: RealHospital,
  currentBeds: Bed[],
  currentPatients: Patient[]
): {
  beds: Bed[];
  patients: Patient[];
  eventLog?: {
    action: string;
    details: string;
    severity: 'info' | 'warning' | 'urgent' | 'success';
  };
} {
  let beds = [...currentBeds];
  let patients = [...currentPatients];
  let eventLog: { action: string; details: string; severity: 'info' | 'warning' | 'urgent' | 'success' } | undefined = undefined;

  const randAction = Math.random();

  // 1. Turn over a ghost bed via UV-C cleaning (25% chance)
  const ghostBed = beds.find(b => b.status === 'ghost');
  if (ghostBed && randAction < 0.25) {
    beds = beds.map(b => (b.id === ghostBed.id ? { ...b, status: 'cleaning', notes: 'Autonomous UV-C Disinfection Active' } : b));
    eventLog = {
      action: 'EVS Rapid UV-C Turnover Engaged',
      details: `${hospital.shortName}: Bed ${ghostBed.number} ghost latency eliminated. Disinfection cycle initiated.`,
      severity: 'success'
    };
    return { beds, patients, eventLog };
  }

  // 2. Complete cleaning bed -> available (25% chance)
  const cleaningBed = beds.find(b => b.status === 'cleaning');
  if (cleaningBed && randAction < 0.50) {
    beds = beds.map(b => (b.id === cleaningBed.id ? { ...b, status: 'available', notes: 'Sanitized & Inspected. Ready for Intake.' } : b));
    eventLog = {
      action: 'Bed Sanitized & Released',
      details: `${hospital.shortName}: Bed ${cleaningBed.number} inspected and ready for emergency patient reception.`,
      severity: 'info'
    };
    return { beds, patients, eventLog };
  }

  // 3. Incoming 108 Emergency Admission into Available Bed (25% chance)
  const availBed = beds.find(b => b.status === 'available');
  if (availBed && randAction < 0.75) {
    const newPatId = `PAT-EMERG-${Date.now().toString().slice(-4)}`;
    const newPat: Patient = {
      id: newPatId,
      mrn: `MRN-${Math.floor(10000 + Math.random() * 90000)}`,
      name: 'Emergency Arrival (108 ALS)',
      age: 45 + Math.floor(Math.random() * 25),
      gender: Math.random() > 0.5 ? 'M' : 'F',
      ward: availBed.ward,
      bedId: availBed.id,
      diagnosis: hospital.specialties[0] || 'Polytrauma Stabilization',
      acuity: 4,
      news2Score: 5,
      deteriorationRisk: 48,
      admissionTime: 'Just now',
      estDischargeTime: '48h',
      vitals: {
        heartRate: 98,
        bpSystolic: 142,
        bpDiastolic: 90,
        spO2: 95,
        respRate: 20,
        temperature: 37.3
      }
    };

    beds = beds.map(b => (b.id === availBed.id ? { ...b, status: 'occupied', patientId: newPatId, pressureSensorActive: true, notes: 'Direct 108 ALS admission' } : b));
    patients.push(newPat);

    eventLog = {
      action: '108 ALS Emergency Admission',
      details: `${hospital.shortName}: Patient admitted directly into Bed ${availBed.number} via Green Wave corridor.`,
      severity: 'urgent'
    };
    return { beds, patients, eventLog };
  }

  // 4. Patient Discharge -> Ghost Bed (0kg IoT Sensor detected) (25% chance)
  const occupiedMedSurg = beds.find(b => b.ward === 'MedSurg' && b.status === 'occupied');
  if (occupiedMedSurg) {
    beds = beds.map(b => (b.id === occupiedMedSurg.id ? { ...b, status: 'ghost', pressureSensorActive: false, notes: 'IoT Sensor 0 kg detected: Patient Vacated' } : b));
    eventLog = {
      action: 'IoT Ghost Bed Detected',
      details: `${hospital.shortName}: Zero pressure detected on Bed ${occupiedMedSurg.number}. EHR discharge unlogged. Automated alert to EVS.`,
      severity: 'warning'
    };
    return { beds, patients, eventLog };
  }

  return { beds, patients };
}

import React, { useState } from 'react';
import { useHospitalStore } from '../../store/hospitalStore';
import {
  Building2,
  Layers,
  Activity,
  HeartPulse,
  Wind,
  Droplet,
  Pill,
  Radio,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  Eye,
  Stethoscope,
  Scissors,
  Gauge,
  Zap,
  PhoneCall,
  Bed,
  Sparkles,
  Search,
  X
} from 'lucide-react';
import { sound } from '../../utils/audioEngine';

interface HospitalFacilityStructureProps {
  onOpenComms?: (targetId?: string) => void;
  onOpenOxygen?: () => void;
  onOpenBlood?: () => void;
}

interface HospitalRoom {
  id: string;
  nameEn: string;
  nameTa: string;
  category: 'trauma' | 'triage' | 'pharmacy' | 'radiology' | 'ot' | 'icu' | 'ward' | 'cssd' | 'oxygen' | 'blood' | 'utility';
  capacity: string;
  currentOccupancy: string;
  status: 'optimal' | 'busy' | 'critical' | 'sterilizing';
  statusColor: string;
  icon: string;
  equipment: string[];
  staffAssigned: string[];
  supplies: string[];
  descriptionEn: string;
  descriptionTa: string;
}

interface HospitalFloor {
  levelNumber: number;
  levelCode: string;
  titleEn: string;
  titleTa: string;
  subtitleEn: string;
  rooms: HospitalRoom[];
}

export const HospitalFacilityStructure: React.FC<HospitalFacilityStructureProps> = ({
  onOpenComms,
  onOpenOxygen,
  onOpenBlood
}) => {
  const {
    currentHospital,
    actualHospitalTotalBeds,
    actualHospitalOccupiedBeds,
    actualHospitalAvailableBeds,
    actualHospitalIcuBeds,
    actualHospitalIcuOccupied,
    language
  } = useHospitalStore();

  const [activeFloorIndex, setActiveFloorIndex] = useState(0);
  const [selectedRoom, setSelectedRoom] = useState<HospitalRoom | null>(null);
  const [searchFilter, setSearchFilter] = useState('');

  // Comprehensive Real-Life Hospital Floor Anatomy
  const floors: HospitalFloor[] = [
    {
      levelNumber: 0,
      levelCode: 'L0',
      titleEn: 'Ground Floor: Emergency, Trauma & Central Diagnostics',
      titleTa: 'தரைத்தளம்: அவசர சிகிச்சை, விபத்து பிரிவு & மருந்தகம்',
      subtitleEn: 'High-acuity triage, resuscitation bays, 24/7 central pharmacy, 128-slice CT & MRI imaging',
      rooms: [
        {
          id: 'room-trauma-1',
          nameEn: 'Apex Trauma Resuscitation Bay 14',
          nameTa: 'டிராமா தீவிர சிகிச்சை பே 14',
          category: 'trauma',
          capacity: '2 Critical Stretcher Bays',
          currentOccupancy: '1 Patient Active (Code Red)',
          status: 'critical',
          statusColor: 'text-rose-400 border-rose-500/50 bg-rose-950/30',
          icon: '🚨',
          equipment: [
            'Hamilton T1 Military Transport Ventilator',
            'Zoll R Series Biphasic Defibrillator & Pacer',
            'Belmont Rapid Blood Warmer & Infuser (500 mL/min)',
            'Sonosite Edge II Point-of-Care Ultrasound (FAST exam)'
          ],
          staffAssigned: [
            'Dr. K. Ramanathan, MD (Trauma Chief)',
            'Staff Nurse Selvi, B.Sc (Critical Care RN)',
            'Emergency Resident Dr. Karthik'
          ],
          supplies: [
            'Thoracostomy chest tube trays (32 Fr)',
            'Endotracheal intubation kit with video laryngoscope',
            '4 Units Pre-Warmed O-Negative PRBC on standby',
            'Tranexamic Acid (TXA) & Hypertonic Saline'
          ],
          descriptionEn: 'Dedicated apex resuscitation suite directly linked to ambulance sally-port with surgical-grade laminar ceiling flow.',
          descriptionTa: 'ஆம்புலன்ஸ் நுழைவாயிலுடன் நேரடியாக இணைக்கப்பட்ட அதிதீவிர சிகிச்சை அரங்கம்.'
        },
        {
          id: 'room-pharmacy-central',
          nameEn: '24/7 Central Hospital Pharmacy & Dispensing',
          nameTa: '24 மணி நேர மத்திய மருத்துவமனை மருந்தகம்',
          category: 'pharmacy',
          capacity: '14,200 Formulary SKUs',
          currentOccupancy: 'Automated Carousel Online',
          status: 'optimal',
          statusColor: 'text-purple-400 border-purple-500/50 bg-purple-950/30',
          icon: '💊',
          equipment: [
            'BD Pyxis Automated Dispensing Cabinet Towers',
            'Helmer Scientific Cold-Chain Biological Refrigerator (2°C-8°C)',
            'NuAire Class II Type A2 Laminar Flow Hood for Sterile IV Admixtures',
            'Biometric Narcotic Safe Vault with RFID Audit Log'
          ],
          staffAssigned: [
            'Chief Clinical Pharmacist Dr. S. Anand, PharmD',
            'Senior Dispensing Pharmacist Meena, M.Pharm',
            '2 Inventory Logistics Technicians'
          ],
          supplies: [
            'IV Noradrenaline, Vasopressin, Epinephrine ampoules',
            'Broad-Spectrum Antibiotics (Meropenem, Piperacillin-Tazobactam)',
            '500 Bottles Dextrose 50%, Normal Saline 0.9%, Ringers Lactate',
            'Sedatives: Propofol, Midazolam, Fentanyl'
          ],
          descriptionEn: 'Central pharmaceutical distribution hub with robotic pneumatic tube dispatch to ICU, OT, and ED in under 90 seconds.',
          descriptionTa: 'அனைத்து வார்டுகளுக்கும் 90 வினாடிகளில் மருந்துகளை அனுப்பும் நவீன மருந்தகம்.'
        },
        {
          id: 'room-radiology-ct',
          nameEn: 'Advanced Radiology: 128-Slice Dual-Source CT & 3T MRI',
          nameTa: 'மேம்பட்ட கதிரியக்கவியல்: 128-ஸ்லைஸ் CT & MRI',
          category: 'radiology',
          capacity: '2 Scanners + 1 Ultrasound Doppler',
          currentOccupancy: 'In-Procedure: Acute Neuro Angio',
          status: 'busy',
          statusColor: 'text-cyan-400 border-cyan-500/50 bg-cyan-950/30',
          icon: '🩻',
          equipment: [
            'GE Revolution Apex 128-Slice Dual-Source CT Scanner',
            'Siemens MAGNETOM Vida 3.0T MRI Scanner',
            'Carestream DRX-Revolution Digital Mobile X-Ray',
            'Medrad Stellant Dual-Head CT Contrast Injector'
          ],
          staffAssigned: [
            'Dr. V. Meenakshi, MD (Senior Interventional Radiologist)',
            'Lead Radiologic Technologist Ramesh',
            'Post-Contrast Monitoring Nurse Geetha'
          ],
          supplies: [
            'Non-ionic iodinated contrast media (Omnipaque 350)',
            'MRI-compatible titanium monitoring leads',
            'Lead aprons & thyroid radiation shields (0.5mm Pb equivalent)'
          ],
          descriptionEn: 'Ultra-fast emergency imaging wing capable of whole-body trauma scans in 12 seconds with automated stroke perfusion AI.',
          descriptionTa: '12 வினாடிகளில் முழு உடல் ஸ்கேன் செய்யும் அதிநவீன கதிரியக்க ஆய்வுக்கூடம்.'
        },
        {
          id: 'room-ed-triage',
          nameEn: 'Emergency Triage & Ambulatory Walk-In Wing',
          nameTa: 'அவசர சிகிச்சை முன்னுரிமை பிரிவு (Triage)',
          category: 'triage',
          capacity: '24 Stretcher Bays',
          currentOccupancy: '19 Active Patients (Census 79%)',
          status: 'busy',
          statusColor: 'text-amber-400 border-amber-500/50 bg-amber-950/30',
          icon: '🩺',
          equipment: [
            'Mindray ePM 12M Patient Vital Monitors',
            'GE MAC 2000 12-Lead Diagnostic ECG Machines',
            'Automated Wheelchair & Mobile Gurney Fleet',
            'Wall-Mounted Central Suction & O2 Flowmeters'
          ],
          staffAssigned: [
            'Triage Medical Officer Dr. Priya',
            '4 Emergency Staff RNs',
            'Patient Transport Orderlies'
          ],
          supplies: [
            'Manchester Triage color-coded priority wristbands',
            'Sterile suture trays, laceration repair packs',
            'Splints, casts, and cervical immobilization collars'
          ],
          descriptionEn: 'Initial receiving intake sorting ambulatory and EMS patients by Manchester 5-tier clinical priority.',
          descriptionTa: 'நோயாளிகளின் அவசர நிலைக்கு ஏற்ப முன்னுரிமை அளித்து பரிசோதிக்கும் பகுதி.'
        }
      ]
    },
    {
      levelNumber: 1,
      levelCode: 'L1',
      titleEn: 'Floor 1: Modular Operation Theatres & Surgical Recovery',
      titleTa: 'முதல் தளம்: அறுவை சிகிச்சை அரங்கங்கள் & மீட்பு பிரிவு',
      subtitleEn: '6 Modular OTs with laminar airflow, anesthesia workstations, and 12-bed PACU recovery',
      rooms: [
        {
          id: 'room-ot-trauma',
          nameEn: 'Modular Operation Theatre OT-1 (Trauma & Ortho)',
          nameTa: 'அறுவை சிகிச்சை அரங்கம் OT-1 (டிராமா & எலும்பு முறிவு)',
          category: 'ot',
          capacity: '1 Surgical Table (Modular)',
          currentOccupancy: 'In-Surgery (Pelvic Fracture Fixation)',
          status: 'busy',
          statusColor: 'text-rose-400 border-rose-500/50 bg-rose-950/30',
          icon: '✂️',
          equipment: [
            'Dräger Perseus A500 Anesthesia Workstation',
            'Maquet Alphamaquet 1150 Carbon-Fiber Radiolucent Table',
            'Ziehm Vision RFD 3D C-Arm Fluoroscope',
            'Stryker System 8 Orthopedic Cordless Power Tools'
          ],
          staffAssigned: [
            'Prof. Dr. M. Jayakumar (Chief Orthopedic Trauma Surgeon)',
            'Dr. Sangeetha (Consultant Anesthesiologist)',
            'Scrub Nurse Saravanan & Circulating Nurse Deepa'
          ],
          supplies: [
            'Titanium pelvic reconstruction plates and locking screws',
            'Sterile disposable orthopedic drape packs',
            'Electrocautery diathermy pencils & grounding pads'
          ],
          descriptionEn: 'HEPA filtered ISO Class 5 laminar airflow theater engineered for complex open trauma and polytrauma stabilization.',
          descriptionTa: 'தொற்று இல்லாத உயர் தர காற்று வடிகட்டியுடன் கூடிய தீவிர அறுவை சிகிச்சை அரங்கம்.'
        },
        {
          id: 'room-ot-neuro',
          nameEn: 'Modular Operation Theatre OT-2 (Neuro & Vascular)',
          nameTa: 'அறுவை சிகிச்சை அரங்கம் OT-2 (நரம்பியல் & வாஸ்குலர்)',
          category: 'ot',
          capacity: '1 Surgical Table',
          currentOccupancy: 'Standby / Sterilized',
          status: 'optimal',
          statusColor: 'text-emerald-400 border-emerald-500/50 bg-emerald-950/30',
          icon: '🧠',
          equipment: [
            'Carl Zeiss KINEVO 900 Robotic Visualization Surgical Microscope',
            'Medtronic StealthStation S8 Neuro-Navigation System',
            'Cavitation Ultrasonic Surgical Aspirator (CUSA)',
            'Brainlab intraoperative stereotactic head frame'
          ],
          staffAssigned: [
            'Dr. R. Chandran, M.Ch (Neurosurgeon on Duty)',
            'Senior Neuro-Anesthesia Registrar',
            'Certified Surgical Technologist'
          ],
          supplies: [
            'Microsurgical titanium aneurysm clips',
            'Hemostatic gelatin sponges (Gelfoam) & oxidized cellulose',
            'External ventricular drainage (EVD) catheter kits'
          ],
          descriptionEn: 'High-precision micro-neurosurgical suite equipped with 3D robotic microscope and optical tracking.',
          descriptionTa: 'மூளை மற்றும் நரம்பு மண்டலத்திற்கான 3D ரோபோடிக் மைக்ரோஸ்கோப் கொண்ட அரங்கம்.'
        },
        {
          id: 'room-pacu',
          nameEn: 'Post-Anesthesia Care Unit (PACU / Recovery)',
          nameTa: 'அறுவை சிகிச்சைக்குப் பின் மீட்பு பிரிவு (PACU)',
          category: 'ward',
          capacity: '12 Monitored Recovery Bays',
          currentOccupancy: '8 Patients Recovering',
          status: 'busy',
          statusColor: 'text-amber-400 border-amber-500/50 bg-amber-950/30',
          icon: '🛏️',
          equipment: [
            'Philips IntelliVue MX450 Bedside Telemetry Monitors',
            '3M Bair Hugger Forced-Air Patient Warming Units',
            'Carefusion Alaris Multi-Channel Infusion Pumps',
            'Portable Emergency Airway Cart'
          ],
          staffAssigned: [
            'PACU In-Charge Sister Vasanthi',
            '3 Post-Op Specialized RNs',
            'Anesthesia Resident on Floor Duty'
          ],
          supplies: [
            'Ondansetron & Metoclopramide antiemetic vials',
            'PCA (Patient Controlled Analgesia) morphine infusion sets',
            'Warm air blankets and oxygen masks'
          ],
          descriptionEn: 'Immediate post-operative monitoring ward supervising emergence from general anesthesia before transfer to ICU or ward.',
          descriptionTa: 'அறுவை சிகிச்சைக்குப் பின் மயக்கம் தெளியும் வரை தீவிரமாக கண்காணிக்கும் பிரிவு.'
        }
      ]
    },
    {
      levelNumber: 2,
      levelCode: 'L2',
      titleEn: 'Floor 2: Critical Care Intensive Care Units (ICU)',
      titleTa: 'இரண்டாம் தளம்: தீவிர சிகிச்சைப் பிரிவுகள் (ICU)',
      subtitleEn: 'Medical ICU, Surgical ICU, and Coronary Care Unit with negative-pressure isolation',
      rooms: [
        {
          id: 'room-micu',
          nameEn: 'Medical Intensive Care Unit (MICU)',
          nameTa: 'மருத்துவ தீவிர சிகிச்சைப் பிரிவு (MICU)',
          category: 'icu',
          capacity: `${actualHospitalIcuBeds} Ventilated Isolation Cubicles`,
          currentOccupancy: `${actualHospitalIcuOccupied} Occupied (${Math.round((actualHospitalIcuOccupied / actualHospitalIcuBeds) * 100)}% Saturation)`,
          status: actualHospitalIcuOccupied / actualHospitalIcuBeds > 0.85 ? 'critical' : 'busy',
          statusColor: 'text-purple-400 border-purple-500/50 bg-purple-950/30',
          icon: '🫁',
          equipment: [
            'Dräger Evita V800 Invasive ICU Mechanical Ventilators',
            'Fresenius multiFiltratePRO Continuous Renal Replacement (CRRT)',
            'Maquet Cardiohelp Extracorporeal Membrane Oxygenation (ECMO)',
            'Philips Central Telemetry Nurse Monitoring Station'
          ],
          staffAssigned: [
            'Dr. Shanthi, MD (Critical Care Intensivist Chief)',
            '1:1 Ratio Specialized Critical Care RNs',
            'Respiratory Therapist K. Balaji'
          ],
          supplies: [
            'Endotracheal suction catheters & HME bacterial filters',
            'Arterial blood gas (ABG) heparinized syringes',
            'Central venous catheter (CVC) triple lumen kits',
            'Enteral tube feeding nutrition formula packs'
          ],
          descriptionEn: 'Level 3 Tertiary Critical Care unit with dedicated negative pressure airborne infection isolation rooms.',
          descriptionTa: 'வென்டிலேட்டர் மற்றும் டயாலிசிஸ் வசதிகளுடன் கூடிய மிக முக்கியமான தீவிர சிகிச்சை தளம்.'
        },
        {
          id: 'room-ccu',
          nameEn: 'Coronary Care Unit & Cath Lab Recovery (CCU)',
          nameTa: 'இதய தீவிர சிகிச்சைப் பிரிவு (CCU)',
          category: 'icu',
          capacity: '10 Monitored Cardiac Beds',
          currentOccupancy: '7 Patients Active',
          status: 'optimal',
          statusColor: 'text-cyan-400 border-cyan-500/50 bg-cyan-950/30',
          icon: '❤️',
          equipment: [
            'Datascope CS300 Intra-Aortic Balloon Pump (IABP)',
            'GE Healthcare Continuous 12-Lead ST-Segment Monitoring',
            'Medtronic External Temporary Cardiac Pacemaker',
            'Trans-Esophageal Echocardiogram (TEE) Probe'
          ],
          staffAssigned: [
            'Dr. K. Srinivasan, DM (Consultant Cardiologist)',
            'Cardiothoracic Critical Care Nurse Team',
            'Perfusion Technologist'
          ],
          supplies: [
            'Streptokinase, Tenecteplase thrombolytic infusions',
            'Heparin infusions and ACT (Activated Clotting Time) cartridges',
            'Emergency temporary transvenous pacing leads'
          ],
          descriptionEn: 'Specialized unit for acute myocardial infarction, post-angioplasty, and cardiogenic shock stabilization.',
          descriptionTa: 'மாரடைப்பு மற்றும் இதய அறுவை சிகிச்சைக்குப் பின் குணமடைவதற்கான சிறப்பு பிரிவு.'
        }
      ]
    },
    {
      levelNumber: 3,
      levelCode: 'L3',
      titleEn: 'Floor 3: Inpatient General & Step-Down Wards',
      titleTa: 'மூன்றாம் தளம்: பொது வார்டுகள் & படிநிலை சிகிச்சை தளம்',
      subtitleEn: 'IoT pressure sensor beds, smart IV pumps, and centralized nurse telemetry stations',
      rooms: [
        {
          id: 'room-ward-north',
          nameEn: 'North Step-Down & Inpatient Ward',
          nameTa: 'வடக்கு பொது உள்நோயாளி வார்டு',
          category: 'ward',
          capacity: '32 Electric Hi-Low Beds with IoT Sensors',
          currentOccupancy: '26 Occupied (81% Census)',
          status: 'busy',
          statusColor: 'text-emerald-400 border-emerald-500/50 bg-emerald-950/30',
          icon: '🛏️',
          equipment: [
            'Hill-Rom Centrella Smart Hospital Beds with Exit Alarms',
            'IoT Under-Mattress Piezoelectric Pressure Sensors',
            'Baxter Spectrum IQ Wireless Smart Infusion Pumps',
            'Central Nurse Corridor Call-Bell Display Panel'
          ],
          staffAssigned: [
            'Head Ward Sister Mary, RN',
            '4 General Duty Staff Nurses',
            'Floor Medical Officer Dr. Naveen'
          ],
          supplies: [
            'Oral and IV maintenance antibiotics',
            'Dressing carts for post-surgical wound care',
            'Oxygen flowmeters with nasal cannulas'
          ],
          descriptionEn: 'Intermediate step-down ward with automated bed pressure sensors detecting movement and ulcer risk in real time.',
          descriptionTa: 'நோயாளிகள் படுக்கையில் இருப்பதை உணரும் சென்சார் கொண்ட நவீன படுக்கைகள் உள்ள வார்டு.'
        },
        {
          id: 'room-ward-south',
          nameEn: 'South General Medical-Surgical Ward',
          nameTa: 'தெற்கு அறுவை சிகிச்சை வார்டு',
          category: 'ward',
          capacity: '28 Inpatient Beds',
          currentOccupancy: '21 Occupied (75% Census)',
          status: 'optimal',
          statusColor: 'text-cyan-400 border-cyan-500/50 bg-cyan-950/30',
          icon: '🏥',
          equipment: [
            'Stryker ProCuity Low-Height Patient Beds',
            'Welch Allyn Connex Spot Automated Vitals Kiosks',
            'Portable Oxygen Tanks for Patient Ambulation'
          ],
          staffAssigned: [
            'Staff Nurses Kalai & Revathi',
            'Physical Rehabilitation Physiotherapist'
          ],
          supplies: [
            'IV fluid maintenance bags, peripheral IV cannulas',
            'Oral analgesics and gastro-protective medications'
          ],
          descriptionEn: 'General recovery wing preparing stabilized patients for multidisciplinary discharge and home rehabilitation.',
          descriptionTa: 'குணமடைந்து வரும் நோயாளிகள் தங்கி சிகிச்சை பெறும் பொது வார்டு.'
        }
      ]
    },
    {
      levelNumber: -1,
      levelCode: 'B1',
      titleEn: 'Basement: Central Supply, Oxygen Plant & Cryo-Storage',
      titleTa: 'அடித்தளம்: ஆக்ஸிஜன் மையம், இரத்த வங்கி & கிருமி நீக்க பிரிவு',
      subtitleEn: 'Liquid medical oxygen VIE vessel, CSSD autoclaves, blood bank cryo-freezers, and emergency power',
      rooms: [
        {
          id: 'room-oxygen-plant',
          nameEn: 'Liquid Medical Oxygen (LMO) Cryogenic Vessel & Manifold Yard',
          nameTa: 'திரவ மருத்துவ ஆக்ஸிஜன் கிரையோஜெனிக் மையம்',
          category: 'oxygen',
          capacity: '20,000 Liters Cryogenic Storage (-183°C)',
          currentOccupancy: '14,250 Liters Liquid O2 (71.3% Full)',
          status: 'optimal',
          statusColor: 'text-cyan-400 border-cyan-500/50 bg-cyan-950/30',
          icon: '💨',
          equipment: [
            'Vacuum Insulated Evaporator (VIE) Cryogenic Storage Tank',
            'Dual Ambient Air Vaporizers (400 Nm³/h capacity)',
            'Automatic Digital Pressure Changeover Manifold (4.2 Bar)',
            '148 Type-D Jumbo Oxygen Emergency Backup Cylinders'
          ],
          staffAssigned: [
            'Biomedical Plant Engineer R. Sundar',
            'Certified Cryogenic Safety Inspector',
            '24/7 Pipeline Pressure Technician'
          ],
          supplies: [
            'Liquid Medical Oxygen at 99.5% purity',
            'Cryogenic thermal insulated safety gloves and face shields',
            'High-pressure copper medical gas manifold piping'
          ],
          descriptionEn: 'Primary cryogenic liquid oxygen source feeding entire hospital pipeline grid with automated changeover to cylinder bank.',
          descriptionTa: 'மருத்துவமனை முழுவதற்கும் குழாய் மூலம் ஆக்ஸிஜன் வழங்கும் முதன்மை கிரையோஜெனிக் மையம்.'
        },
        {
          id: 'room-blood-bank',
          nameEn: 'Central Blood Bank & Transfusion Cryo-Vault',
          nameTa: 'மத்திய இரத்த வங்கி & உறைநிலை சேமிப்பு மையம்',
          category: 'blood',
          capacity: '800 Blood Units Capacity',
          currentOccupancy: '184 Packed Cells + 72 FFP + 26 Platelets',
          status: 'optimal',
          statusColor: 'text-rose-400 border-rose-500/50 bg-rose-950/30',
          icon: '🩸',
          equipment: [
            'Helmer Scientific Ultra-Low -30°C Plasma Freezers',
            'Helmer Platelet Incubator with Continuous Flatbed Agitator (22°C)',
            'Bio-Rad IH-500 Fully Automated Blood Grouping & Cross-Match Analyzer',
            'Cryofuge Heavy-Duty Refrigerated Blood Component Centrifuge'
          ],
          staffAssigned: [
            'Dr. Preethi, MD (Transfusion Medicine Specialist)',
            'Senior Blood Bank Technologist Mohan',
            'Quality Assurance Officer'
          ],
          supplies: [
            'PRBC Bags (O-, O+, A+, A-, B+, B-, AB+, AB-)',
            'Fresh Frozen Plasma (FFP) and Cryoprecipitate units',
            'Rapid saline agglutination crossmatch reagents'
          ],
          descriptionEn: 'NABH-accredited blood center providing crossmatched blood products and continuous apheresis support.',
          descriptionTa: 'அனைத்து வகை இரத்த பிரிவுகளையும் பாதுகாப்பாக சேமித்து வழங்கும் இரத்த வங்கி.'
        },
        {
          id: 'room-cssd',
          nameEn: 'Central Sterile Supply Department (CSSD)',
          nameTa: 'மத்திய கருவி கிருமி நீக்க பிரிவு (CSSD)',
          category: 'cssd',
          capacity: '80 Surgical Trays / Cycle',
          currentOccupancy: 'Autoclave Cycle 4 In-Progress (134°C)',
          status: 'sterilizing',
          statusColor: 'text-amber-400 border-amber-500/50 bg-amber-950/30',
          icon: '🧼',
          equipment: [
            'Getinge GSS67H High-Capacity Steam Sterilizers (134°C, 3 Bar)',
            'Johnson & Johnson STERRAD 100NX Hydrogen Peroxide Gas Plasma Sterilizer',
            'Steelco Ultrasonic Surgical Instrument Washer-Disinfector',
            'Heat-Sealing Pouch Packing Stations with Chemical Indicator Strips'
          ],
          staffAssigned: [
            'CSSD Supervisor D. Kumar',
            '4 Sterile Processing Technicians'
          ],
          supplies: [
            'Class 5 chemical integration indicator test strips',
            'Non-woven surgical sterilization wrap sheets',
            'Enzymatic detergent solutions for bio-burden cleaning'
          ],
          descriptionEn: 'Critical hospital hygiene engine re-sterilizing all surgical, trauma, and procedural instrument trays under strict biological verification.',
          descriptionTa: 'அறுவை சிகிச்சை கருவிகளை அதிக வெப்பத்தில் கிருமி நீக்கம் செய்யும் சுத்திகரிப்பு மையம்.'
        }
      ]
    }
  ];

  const currentFloor = floors[activeFloorIndex] || floors[0];

  const filteredRooms = currentFloor.rooms.filter(room => {
    if (!searchFilter.trim()) return true;
    const query = searchFilter.toLowerCase();
    return (
      room.nameEn.toLowerCase().includes(query) ||
      room.equipment.some(e => e.toLowerCase().includes(query)) ||
      room.supplies.some(s => s.toLowerCase().includes(query)) ||
      room.staffAssigned.some(st => st.toLowerCase().includes(query))
    );
  });

  return (
    <div className="w-full h-full flex flex-col bg-[#050b18] text-slate-100 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden animate-in fade-in duration-200">
      {/* ─────────────────────────────────────────────────────────────
          TOP FACILITY NAVIGATOR HUD
         ───────────────────────────────────────────────────────────── */}
      <div className="bg-slate-900/95 backdrop-blur-xl border-b border-slate-800 p-4 flex flex-wrap items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 text-xl shadow-md">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-slate-100 uppercase tracking-wide flex items-center gap-2">
                <span>{currentHospital.name}</span>
                <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[9.5px] px-2 py-0.2 rounded-full font-mono font-bold">
                  DIGITAL TWIN ANATOMY
                </span>
              </h2>
            </div>
            <div className="flex items-center gap-2 flex-wrap text-[11px] font-mono mt-0.5">
              <span className="text-slate-400">{currentHospital.ownership} Apex Facility</span>
              <span className="text-slate-600">•</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {actualHospitalAvailableBeds} Beds Available
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">Total: {actualHospitalTotalBeds} ({actualHospitalOccupiedBeds} Occupied)</span>
              <span className="text-slate-600">•</span>
              <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
                {actualHospitalIcuBeds - actualHospitalIcuOccupied} ICU Available
              </span>
            </div>
          </div>
        </div>

        {/* Action Shortcuts: Oxygen & Blood Bank Direct Triggers */}
        <div className="flex items-center gap-2 flex-wrap">
          {onOpenOxygen && (
            <button
              onClick={() => {
                sound.playRadarPing();
                onOpenOxygen();
              }}
              className="px-3 py-1.5 bg-gradient-to-r from-cyan-950 via-slate-900 to-teal-950 hover:from-cyan-900 hover:to-teal-900 text-cyan-300 hover:text-cyan-100 border border-cyan-500/40 hover:border-cyan-400 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer group"
              title="Inspect Liquid Medical Oxygen Cryogenic Tank"
            >
              <Wind className="w-3.5 h-3.5 text-cyan-400 group-hover:animate-spin" />
              <span>Oxygen Bank</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </button>
          )}

          {onOpenBlood && (
            <button
              onClick={() => {
                sound.playRadarPing();
                onOpenBlood();
              }}
              className="px-3 py-1.5 bg-gradient-to-r from-rose-950 via-slate-900 to-red-950 hover:from-rose-900 hover:to-red-900 text-rose-300 hover:text-rose-100 border border-rose-500/40 hover:border-rose-400 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer group"
              title="Inspect Blood Bank Cryo-Storage & Request Mutual Aid"
            >
              <Droplet className="w-3.5 h-3.5 text-rose-400 group-hover:animate-bounce" />
              <span>Blood Bank</span>
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
            </button>
          )}

          {onOpenComms && (
            <button
              onClick={() => {
                sound.playRadioChirp();
                onOpenComms('hosp-er-chief');
              }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Radio ER Chief</span>
            </button>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MAIN STAGE: FLOOR SELECTOR (LEFT) + ROOM GRID (CENTER/RIGHT)
         ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* LEFT 3 COLS: VERTICAL FLOOR ELEVATOR NAVIGATION */}
        <div className="lg:col-span-3 bg-[#040814] border-r border-slate-800 p-3 space-y-2 overflow-y-auto">
          <div className="flex items-center justify-between px-2 py-1 text-xs font-mono text-slate-400 uppercase font-bold tracking-wider">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              Architectural Floors
            </span>
            <span className="text-[10px] text-slate-500">{floors.length} Tiers</span>
          </div>

          <div className="space-y-1.5">
            {floors.map((floor, idx) => {
              const isActive = activeFloorIndex === idx;
              return (
                <button
                  key={floor.levelCode}
                  onClick={() => {
                    sound.playTactileClick();
                    setActiveFloorIndex(idx);
                    setSelectedRoom(null);
                  }}
                  className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer group ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-950/60 to-slate-900 border-cyan-500/60 shadow-lg shadow-cyan-950/30'
                      : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-8 h-8 rounded-lg font-mono font-black text-xs flex items-center justify-center flex-shrink-0 border transition-all ${
                        isActive
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/30'
                          : 'bg-slate-950 text-slate-400 border-slate-800 group-hover:text-slate-200'
                      }`}
                    >
                      {floor.levelCode}
                    </span>
                    <div className="min-w-0">
                      <div className={`text-xs font-bold truncate ${isActive ? 'text-cyan-200' : 'text-slate-300'}`}>
                        {language === 'ta' ? floor.titleTa : floor.titleEn.split(':')[0]}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate mt-0.5">
                        {floor.rooms.length} Clinical Suites
                      </div>
                    </div>
                  </div>

                  <ChevronRight
                    className={`w-4 h-4 flex-shrink-0 transition-transform ${
                      isActive ? 'text-cyan-400 translate-x-1' : 'text-slate-600'
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {/* Quick Facility Search Filter */}
          <div className="pt-3 border-t border-slate-800/80">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                placeholder="Search rooms, equipment, drugs..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 font-mono"
              />
            </div>
          </div>
        </div>

        {/* RIGHT 9 COLS: ACTIVE FLOOR DIGITAL TWIN ROOM MATRIX & INSPECTOR */}
        <div className="lg:col-span-9 bg-[#060c1c] p-4 flex flex-col space-y-4 overflow-y-auto">
          {/* Floor Header Ribbon */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-md">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-bold flex items-center justify-center">
                  {currentFloor.levelCode}
                </span>
                <h3 className="text-sm font-extrabold text-slate-100">
                  {language === 'ta' ? currentFloor.titleTa : currentFloor.titleEn}
                </h3>
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                {currentFloor.subtitleEn}
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-slate-400">Suites:</span>
              <span className="text-cyan-300 font-bold">{filteredRooms.length} Active</span>
            </div>
          </div>

          {/* Rooms Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredRooms.map(room => {
              const isSelected = selectedRoom?.id === room.id;
              return (
                <div
                  key={room.id}
                  onClick={() => {
                    sound.playTactileClick();
                    setSelectedRoom(room);
                  }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 shadow-lg group ${
                    isSelected
                      ? 'bg-slate-900 border-cyan-400 ring-2 ring-cyan-500/30 shadow-cyan-950/40'
                      : 'bg-slate-950/80 border-slate-800/90 hover:border-slate-700 hover:bg-slate-900/60'
                  }`}
                >
                  {/* Room Card Top Row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-xl flex-shrink-0 group-hover:scale-105 transition-transform shadow-sm">
                        {room.icon}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-100 truncate group-hover:text-cyan-200 transition-colors">
                          {language === 'ta' ? room.nameTa : room.nameEn}
                        </h4>
                        <div className="text-[10.5px] font-mono text-slate-400 truncate mt-0.5">
                          {room.capacity}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-[9.5px] font-mono px-2 py-0.5 rounded font-bold uppercase border flex-shrink-0 ${room.statusColor}`}
                    >
                      {room.status}
                    </span>
                  </div>

                  {/* Installed Medical Equipment Chips */}
                  <div className="space-y-1">
                    <span className="text-[9.5px] font-mono uppercase text-slate-400 font-bold block">
                      Key Biomedical Equipment:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {room.equipment.slice(0, 2).map((eq, eqIdx) => (
                        <span
                          key={eqIdx}
                          className="bg-slate-900 border border-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded font-mono truncate max-w-[240px]"
                        >
                          ⚙️ {eq}
                        </span>
                      ))}
                      {room.equipment.length > 2 && (
                        <span className="text-[9.5px] text-cyan-400 font-mono self-center">
                          +{room.equipment.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Staff Assigned & Action Footer */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10.5px] font-mono">
                    <span className="text-slate-400 truncate max-w-[200px]">
                      👤 {room.staffAssigned[0]}
                    </span>

                    <span className="text-cyan-400 font-bold flex items-center gap-1 group-hover:underline">
                      <span>Inspect Room</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Room Detailed Inspector Modal / Drawer */}
          {selectedRoom && (
            <div className="bg-slate-900/95 border border-cyan-500/50 rounded-2xl p-4 shadow-2xl space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-150">
              <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-slate-950 border border-cyan-500/50 flex items-center justify-center text-2xl shadow-md">
                    {selectedRoom.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-slate-100">
                        {language === 'ta' ? selectedRoom.nameTa : selectedRoom.nameEn}
                      </h4>
                      <span className={`text-[9.5px] font-mono px-2 py-0.5 rounded font-bold uppercase border ${selectedRoom.statusColor}`}>
                        {selectedRoom.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {language === 'ta' ? selectedRoom.descriptionTa : selectedRoom.descriptionEn}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedRoom(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Inspector Three-Column Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
                {/* Col 1: Medical Equipment */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                    ⚙️ Installed Medical Equipment
                  </span>
                  <ul className="space-y-1.5 text-[11px] text-slate-300">
                    {selectedRoom.equipment.map((eq, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-cyan-400">•</span>
                        <span>{eq}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Col 2: Staff Assigned */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    🩺 Assigned Clinical Staff
                  </span>
                  <ul className="space-y-1.5 text-[11px] text-slate-300">
                    {selectedRoom.staffAssigned.map((st, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-emerald-400">•</span>
                        <span>{st}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Col 3: Supplies & Consumables */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    📦 Critical Supplies & Drugs
                  </span>
                  <ul className="space-y-1.5 text-[11px] text-slate-300">
                    {selectedRoom.supplies.map((sp, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-amber-400">•</span>
                        <span>{sp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Inspector Quick Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="text-xs font-mono text-slate-400">
                  Current Occupancy: <strong className="text-slate-100">{selectedRoom.currentOccupancy}</strong>
                </div>

                <div className="flex items-center gap-2">
                  {onOpenComms && (
                    <button
                      onClick={() => {
                        sound.playRadioChirp();
                        onOpenComms('hosp-er-chief');
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Radio className="w-3.5 h-3.5" />
                      <span>Intercom Room</span>
                    </button>
                  )}

                  {selectedRoom.category === 'oxygen' && onOpenOxygen && (
                    <button
                      onClick={onOpenOxygen}
                      className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Wind className="w-3.5 h-3.5" />
                      <span>Open Oxygen Bank</span>
                    </button>
                  )}

                  {selectedRoom.category === 'blood' && onOpenBlood && (
                    <button
                      onClick={onOpenBlood}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Droplet className="w-3.5 h-3.5" />
                      <span>Open Blood Bank</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

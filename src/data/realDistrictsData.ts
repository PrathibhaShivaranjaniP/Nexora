export interface NavigationRouteStep {
  stepNumber: number;
  instructionEn: string;
  instructionTa: string;
  distanceKm: number;
  iconType: 'straight' | 'right' | 'left' | 'destination' | 'siren';
}

export interface HospitalRouteDetails {
  corridorNameEn: string;
  corridorNameTa: string;
  distanceKm: number;
  ambulanceTransitMinutes: number;
  trafficStatusEn: string;
  trafficStatusTa: string;
  destinationBayEn: string;
  destinationBayTa: string;
  steps: NavigationRouteStep[];
}

export interface RealHospital {
  id: string;
  name: string;
  shortName: string;
  type: 'Public Govt Medical College' | 'Private Quaternary Super-Specialty' | 'Public District Headquarters' | 'Private Multi-Specialty Tertiary' | 'Autonomous Research Institute';
  ownership: 'Government' | 'Private' | 'Trust';
  address: string;
  totalBeds: number;
  occupiedBeds: number;
  reservedBeds: number;
  icuBeds: number;
  icuOccupied: number;
  edBays: number;
  edOccupied: number;
  edWaitMinutes: number;
  diversionActive: boolean;
  specialties: string[];
  coordinates: { x: number; y: number; lat: number; lng: number };
  distanceFromHubKm: number;
  ambulanceTransitMinutes: number;
  traumaLevel: 'Apex Level 1 Trauma' | 'Level 2 Trauma' | 'Level 3 Emergency';
  empanelledGovtScheme: boolean; // Chief Minister's Comprehensive Health Insurance Scheme (CMCHIS)
  routeDetails?: HospitalRouteDetails;
  
  // Data Reliability & Granular Resources
  dataStatus: 'Fresh' | 'Stale';
  confidenceScore: 'HIGH' | 'MEDIUM' | 'LOW';
  lastUpdatedMinutesAgo: number;
  ventilatorsTotal: number;
  ventilatorsAvailable: number;
  doctorsAvailable: number;
  nursesAvailable: number;
}

export interface DistrictProfile {
  id: 'chennai' | 'coimbatore' | 'madurai' | 'theni';
  name: string;
  state: 'Tamil Nadu';
  population: string;
  totalDistrictBeds: number;
  occupiedDistrictBeds: number;
  totalIcuBeds: number;
  occupiedIcuBeds: number;
  aqi: number; // Air Quality Index
  aqiStatus: 'Good' | 'Moderate' | 'Poor' | 'Severe';
  temperatureC: number;
  weatherCondition: string;
  monsoonAlert: boolean;
  globeCoordinates: { lat: number; lng: number; x: number; y: number; z: number };
  hospitals: RealHospital[];
}

export const realDistrictsData: Record<string, DistrictProfile> = {
  // 1. CHENNAI DISTRICT
  chennai: {
    id: 'chennai',
    name: 'Chennai Metropolitan District',
    state: 'Tamil Nadu',
    population: '11.5 Million',
    totalDistrictBeds: 7200,
    occupiedDistrictBeds: 6380,
    totalIcuBeds: 840,
    occupiedIcuBeds: 785, // 93.4% ICU
    aqi: 142,
    aqiStatus: 'Moderate',
    temperatureC: 32,
    weatherCondition: 'Humid / Coastal Breezes',
    monsoonAlert: false,
    globeCoordinates: { lat: 13.0827, lng: 80.2707, x: 0.68, y: 0.16, z: 0.71 },
    hospitals: [
      {
        id: 'chn-rgggh',
        name: 'Rajiv Gandhi Government General Hospital (RGGGH)',
        shortName: 'RGGGH (Govt General)',
        type: 'Public Govt Medical College',
        ownership: 'Government',
        address: 'EVR Periyar Salai, Park Town, Chennai - 600003',
        totalBeds: 2720,
        occupiedBeds: 2610, // 96%
        icuBeds: 240,
        icuOccupied: 232, // 96.6% ICU
        edBays: 60,
        edOccupied: 58,
        edWaitMinutes: 45,
        diversionActive: true,
        specialties: ['Apex Level 1 Trauma', 'Comprehensive Stroke Center', 'Cardiothoracic ICU', 'Organ Transplant', 'Nephrology/Dialysis', 'Burns Unit'],
        coordinates: { x: 380, y: 220, lat: 13.0805, lng: 80.2778 },
        distanceFromHubKm: 0,
        ambulanceTransitMinutes: 0,
        traumaLevel: 'Apex Level 1 Trauma',
        empanelledGovtScheme: true,
          reservedBeds: 0,
          dataStatus: Math.random() > 0.7 ? 'Stale' : 'Fresh',
          confidenceScore: Math.random() > 0.7 ? 'LOW' : 'HIGH',
          lastUpdatedMinutesAgo: Math.floor(Math.random() * 60),
          ventilatorsTotal: Math.floor(Math.random() * 40) + 10,
          ventilatorsAvailable: Math.floor(Math.random() * 10),
          doctorsAvailable: Math.floor(Math.random() * 30) + 5,
          nursesAvailable: Math.floor(Math.random() * 80) + 20
        },
      {
        id: 'chn-apollo',
        name: 'Apollo Main Hospital (Greams Road)',
        shortName: 'Apollo Greams Road',
        type: 'Private Quaternary Super-Specialty',
        ownership: 'Private',
        address: '21 Greams Lane, Thousand Lights, Chennai - 600006',
        totalBeds: 710,
        occupiedBeds: 540, // 76%
        icuBeds: 120,
        icuOccupied: 88, // 73%
        edBays: 28,
        edOccupied: 16,
        edWaitMinutes: 12,
        diversionActive: false,
        specialties: ['Interventional Cardiology', 'Neurosciences & Stroke', 'Oncology Center', 'Robotic Surgery', 'Extracorporeal Membrane Oxygenation (ECMO)'],
        coordinates: { x: 330, y: 280, lat: 13.0604, lng: 80.2496 },
        distanceFromHubKm: 4.8,
        ambulanceTransitMinutes: 11,
        traumaLevel: 'Apex Level 1 Trauma',
        empanelledGovtScheme: true,
          reservedBeds: 0,
          dataStatus: Math.random() > 0.7 ? 'Stale' : 'Fresh',
          confidenceScore: Math.random() > 0.7 ? 'LOW' : 'HIGH',
          lastUpdatedMinutesAgo: Math.floor(Math.random() * 60),
          ventilatorsTotal: Math.floor(Math.random() * 40) + 10,
          ventilatorsAvailable: Math.floor(Math.random() * 10),
          doctorsAvailable: Math.floor(Math.random() * 30) + 5,
          nursesAvailable: Math.floor(Math.random() * 80) + 20
        },
      {
        id: 'chn-stanley',
        name: 'Government Stanley Medical College Hospital',
        shortName: 'Stanley Medical College',
        type: 'Public Govt Medical College',
        ownership: 'Government',
        address: 'Old Jail Rd, Royapuram, Chennai - 600001',
        totalBeds: 1580,
        occupiedBeds: 1470,
        icuBeds: 140,
        icuOccupied: 134,
        edBays: 36,
        edOccupied: 34,
        edWaitMinutes: 38,
        diversionActive: false,
        specialties: ['Plastic & Hand Reconstructive Surgery', 'Hepatology / Liver Transplant', 'Surgical Gastroenterology', 'Emergency Trauma'],
        coordinates: { x: 440, y: 150, lat: 13.1075, lng: 80.2872 },
        distanceFromHubKm: 6.2,
        ambulanceTransitMinutes: 14,
        traumaLevel: 'Level 2 Trauma',
        empanelledGovtScheme: true,
          reservedBeds: 0,
          dataStatus: Math.random() > 0.7 ? 'Stale' : 'Fresh',
          confidenceScore: Math.random() > 0.7 ? 'LOW' : 'HIGH',
          lastUpdatedMinutesAgo: Math.floor(Math.random() * 60),
          ventilatorsTotal: Math.floor(Math.random() * 40) + 10,
          ventilatorsAvailable: Math.floor(Math.random() * 10),
          doctorsAvailable: Math.floor(Math.random() * 30) + 5,
          nursesAvailable: Math.floor(Math.random() * 80) + 20
        },
      {
        id: 'chn-miot',
        name: 'MIOT International Hospital',
        shortName: 'MIOT International',
        type: 'Private Multi-Specialty Tertiary',
        ownership: 'Private',
        address: '4/112 Mount Poonamallee Rd, Manapakkam, Chennai - 600089',
        totalBeds: 1000,
        occupiedBeds: 720,
        icuBeds: 170,
        icuOccupied: 118,
        edBays: 32,
        edOccupied: 18,
        edWaitMinutes: 15,
        diversionActive: false,
        specialties: ['Orthopedics & Joint Replacement', 'Emergency Polytrauma', 'Neuro-trauma ICU', 'Thoracic Surgery', 'Nuclear Medicine'],
        coordinates: { x: 210, y: 390, lat: 13.0189, lng: 80.1772 },
        distanceFromHubKm: 14.5,
        ambulanceTransitMinutes: 24,
        traumaLevel: 'Apex Level 1 Trauma',
        empanelledGovtScheme: true,
          reservedBeds: 0,
          dataStatus: Math.random() > 0.7 ? 'Stale' : 'Fresh',
          confidenceScore: Math.random() > 0.7 ? 'LOW' : 'HIGH',
          lastUpdatedMinutesAgo: Math.floor(Math.random() * 60),
          ventilatorsTotal: Math.floor(Math.random() * 40) + 10,
          ventilatorsAvailable: Math.floor(Math.random() * 10),
          doctorsAvailable: Math.floor(Math.random() * 30) + 5,
          nursesAvailable: Math.floor(Math.random() * 80) + 20
        },
      {
        id: 'chn-sri-ramachandra',
        name: 'Sri Ramachandra Medical Centre (SRMC)',
        shortName: 'Sri Ramachandra (Porur)',
        type: 'Autonomous Research Institute',
        ownership: 'Trust',
        address: 'No.1 Ramachandra Nagar, Porur, Chennai - 600116',
        totalBeds: 1190,
        occupiedBeds: 890,
        icuBeds: 170,
        icuOccupied: 125,
        edBays: 40,
        edOccupied: 22,
        edWaitMinutes: 18,
        diversionActive: false,
        specialties: ['Pediatric ICU', 'Emergency Cardiac Care', 'Neonatology Level 3', 'Trauma Resuscitation', 'Pulmonary Critical Care'],
        coordinates: { x: 140, y: 340, lat: 13.0366, lng: 80.1415 },
        distanceFromHubKm: 16.8,
        ambulanceTransitMinutes: 28,
        traumaLevel: 'Level 2 Trauma',
        empanelledGovtScheme: true,
          reservedBeds: 0,
          dataStatus: Math.random() > 0.7 ? 'Stale' : 'Fresh',
          confidenceScore: Math.random() > 0.7 ? 'LOW' : 'HIGH',
          lastUpdatedMinutesAgo: Math.floor(Math.random() * 60),
          ventilatorsTotal: Math.floor(Math.random() * 40) + 10,
          ventilatorsAvailable: Math.floor(Math.random() * 10),
          doctorsAvailable: Math.floor(Math.random() * 30) + 5,
          nursesAvailable: Math.floor(Math.random() * 80) + 20
        }
    ]
  },

  // 2. MADURAI DISTRICT
  madurai: {
    id: 'madurai',
    name: 'Madurai District Healthcare Hub',
    state: 'Tamil Nadu',
    population: '3.2 Million',
    totalDistrictBeds: 5400,
    occupiedDistrictBeds: 4720,
    totalIcuBeds: 580,
    occupiedIcuBeds: 520, // 89.6% ICU
    aqi: 78,
    aqiStatus: 'Good',
    temperatureC: 34,
    weatherCondition: 'Clear / High Ambient Heat',
    monsoonAlert: false,
    globeCoordinates: { lat: 9.9252, lng: 78.1198, x: 0.69, y: 0.12, z: 0.71 },
    hospitals: [
      {
        id: 'mdu-grh',
        name: 'Government Rajaji Hospital (GRH)',
        shortName: 'Govt Rajaji Hospital (GRH)',
        type: 'Public Govt Medical College',
        ownership: 'Government',
        address: 'Panagal Rd, Alwarpuram, Madurai - 625020',
        totalBeds: 2518,
        occupiedBeds: 2420, // 96%
        icuBeds: 210,
        icuOccupied: 202, // 96%
        edBays: 54,
        edOccupied: 50,
        edWaitMinutes: 40,
        diversionActive: true,
        specialties: ['Southern TN Apex Level 1 Trauma', 'Regional Burn Center', 'Neurosurgical ICU', 'Dialysis Center', 'Pediatric Surgery'],
        coordinates: { x: 390, y: 240, lat: 9.9272, lng: 78.1252 },
        distanceFromHubKm: 0,
        ambulanceTransitMinutes: 0,
        traumaLevel: 'Apex Level 1 Trauma',
        empanelledGovtScheme: true,
          reservedBeds: 0,
          dataStatus: Math.random() > 0.7 ? 'Stale' : 'Fresh',
          confidenceScore: Math.random() > 0.7 ? 'LOW' : 'HIGH',
          lastUpdatedMinutesAgo: Math.floor(Math.random() * 60),
          ventilatorsTotal: Math.floor(Math.random() * 40) + 10,
          ventilatorsAvailable: Math.floor(Math.random() * 10),
          doctorsAvailable: Math.floor(Math.random() * 30) + 5,
          nursesAvailable: Math.floor(Math.random() * 80) + 20
        },
      {
        id: 'mdu-mmhrc',
        name: 'Meenakshi Mission Hospital & Research Centre (MMHRC)',
        shortName: 'Meenakshi Mission (MMHRC)',
        type: 'Private Multi-Specialty Tertiary',
        ownership: 'Trust',
        address: 'Melur Main Rd, Lake Area, Madurai - 625107',
        totalBeds: 1000,
        occupiedBeds: 740,
        icuBeds: 160,
        icuOccupied: 114,
        edBays: 30,
        edOccupied: 16,
        edWaitMinutes: 14,
        diversionActive: false,
        specialties: ['Comprehensive Cancer Center', 'Advanced Polytrauma', 'Cardiac Catheterization', 'Pediatric ICU', 'Spine & Joint Center'],
        coordinates: { x: 520, y: 160, lat: 9.9575, lng: 78.1633 },
        distanceFromHubKm: 6.8,
        ambulanceTransitMinutes: 15,
        traumaLevel: 'Apex Level 1 Trauma',
        empanelledGovtScheme: true,
          reservedBeds: 0,
          dataStatus: Math.random() > 0.7 ? 'Stale' : 'Fresh',
          confidenceScore: Math.random() > 0.7 ? 'LOW' : 'HIGH',
          lastUpdatedMinutesAgo: Math.floor(Math.random() * 60),
          ventilatorsTotal: Math.floor(Math.random() * 40) + 10,
          ventilatorsAvailable: Math.floor(Math.random() * 10),
          doctorsAvailable: Math.floor(Math.random() * 30) + 5,
          nursesAvailable: Math.floor(Math.random() * 80) + 20
        },
      {
        id: 'mdu-apollo',
        name: 'Apollo Speciality Hospitals Madurai',
        shortName: 'Apollo Madurai (KK Nagar)',
        type: 'Private Quaternary Super-Specialty',
        ownership: 'Private',
        address: 'Lake View Rd, KK Nagar, Madurai - 625020',
        totalBeds: 350,
        occupiedBeds: 260,
        icuBeds: 70,
        icuOccupied: 48,
        edBays: 18,
        edOccupied: 9,
        edWaitMinutes: 10,
        diversionActive: false,
        specialties: ['Interventional Cardiology', 'Stroke & Neurointervention', 'Critical Care Medicine', 'Emergency Orthopedics'],
        coordinates: { x: 460, y: 220, lat: 9.9329, lng: 78.1481 },
        distanceFromHubKm: 3.5,
        ambulanceTransitMinutes: 8,
        traumaLevel: 'Level 2 Trauma',
        empanelledGovtScheme: true,
          reservedBeds: 0,
          dataStatus: Math.random() > 0.7 ? 'Stale' : 'Fresh',
          confidenceScore: Math.random() > 0.7 ? 'LOW' : 'HIGH',
          lastUpdatedMinutesAgo: Math.floor(Math.random() * 60),
          ventilatorsTotal: Math.floor(Math.random() * 40) + 10,
          ventilatorsAvailable: Math.floor(Math.random() * 10),
          doctorsAvailable: Math.floor(Math.random() * 30) + 5,
          nursesAvailable: Math.floor(Math.random() * 80) + 20
        },
      {
        id: 'mdu-velammal',
        name: 'Velammal Medical College Hospital & Research Institute',
        shortName: 'Velammal Medical College',
        type: 'Autonomous Research Institute',
        ownership: 'Trust',
        address: 'Madurai-Tuticorin Ring Road, Anuppanadi, Madurai - 625009',
        totalBeds: 1200,
        occupiedBeds: 880,
        icuBeds: 140,
        icuOccupied: 98,
        edBays: 32,
        edOccupied: 15,
        edWaitMinutes: 16,
        diversionActive: false,
        specialties: ['General ICU', 'Emergency Medicine', 'Pediatrics & Neonatology', 'Surgical Oncology', 'Cardiothoracic Surgery'],
        coordinates: { x: 440, y: 360, lat: 9.8967, lng: 78.1583 },
        distanceFromHubKm: 8.2,
        ambulanceTransitMinutes: 18,
        traumaLevel: 'Level 2 Trauma',
        empanelledGovtScheme: true,
          reservedBeds: 0,
          dataStatus: Math.random() > 0.7 ? 'Stale' : 'Fresh',
          confidenceScore: Math.random() > 0.7 ? 'LOW' : 'HIGH',
          lastUpdatedMinutesAgo: Math.floor(Math.random() * 60),
          ventilatorsTotal: Math.floor(Math.random() * 40) + 10,
          ventilatorsAvailable: Math.floor(Math.random() * 10),
          doctorsAvailable: Math.floor(Math.random() * 30) + 5,
          nursesAvailable: Math.floor(Math.random() * 80) + 20
        }
    ]
  },

  // 3. COIMBATORE DISTRICT
  coimbatore: {
    id: 'coimbatore',
    name: 'Coimbatore District Healthcare Hub',
    state: 'Tamil Nadu',
    population: '3.6 Million',
    totalDistrictBeds: 6100,
    occupiedDistrictBeds: 5120,
    totalIcuBeds: 720,
    occupiedIcuBeds: 625, // 86.8% ICU
    aqi: 64,
    aqiStatus: 'Good',
    temperatureC: 29,
    weatherCondition: 'Moderate / Western Ghats Breeze',
    monsoonAlert: false,
    globeCoordinates: { lat: 11.0168, lng: 76.9558, x: 0.67, y: 0.14, z: 0.73 },
    hospitals: [
      {
        id: 'cbe-cmch',
        name: 'Coimbatore Medical College Hospital (CMCH)',
        shortName: 'Coimbatore Govt (CMCH)',
        type: 'Public Govt Medical College',
        ownership: 'Government',
        address: 'Trichy Rd, Gopalapuram, Coimbatore - 641018',
        totalBeds: 1850,
        occupiedBeds: 1760, // 95%
        icuBeds: 180,
        icuOccupied: 172, // 95.5%
        edBays: 48,
        edOccupied: 44,
        edWaitMinutes: 35,
        diversionActive: true,
        specialties: ['Western TN Apex Trauma', 'Government Medical College ICU', 'Emergency Poison Toxicology', 'Pediatric Critical Care'],
        coordinates: { x: 380, y: 260, lat: 11.0022, lng: 76.9682 },
        distanceFromHubKm: 0,
        ambulanceTransitMinutes: 0,
        traumaLevel: 'Apex Level 1 Trauma',
        empanelledGovtScheme: true,
          reservedBeds: 0,
          dataStatus: Math.random() > 0.7 ? 'Stale' : 'Fresh',
          confidenceScore: Math.random() > 0.7 ? 'LOW' : 'HIGH',
          lastUpdatedMinutesAgo: Math.floor(Math.random() * 60),
          ventilatorsTotal: Math.floor(Math.random() * 40) + 10,
          ventilatorsAvailable: Math.floor(Math.random() * 10),
          doctorsAvailable: Math.floor(Math.random() * 30) + 5,
          nursesAvailable: Math.floor(Math.random() * 80) + 20
        },
      {
        id: 'cbe-ganga',
        name: 'Ganga Hospital (Orthopedic & Plastic Surgery Centre)',
        shortName: 'Ganga Hospital (Trauma Hub)',
        type: 'Private Multi-Specialty Tertiary',
        ownership: 'Private',
        address: '313 Mettupalayam Rd, Saibaba Colony, Coimbatore - 641043',
        totalBeds: 650,
        occupiedBeds: 520,
        icuBeds: 110,
        icuOccupied: 84,
        edBays: 26,
        edOccupied: 15,
        edWaitMinutes: 12,
        diversionActive: false,
        specialties: ['World-Renowned Trauma & Reconstructive Surgery', 'Spine Surgery ICU', 'Complex Fracture Management', 'Burns & Plastic Surgery'],
        coordinates: { x: 340, y: 160, lat: 11.0267, lng: 76.9508 },
        distanceFromHubKm: 4.2,
        ambulanceTransitMinutes: 10,
        traumaLevel: 'Apex Level 1 Trauma',
        empanelledGovtScheme: true,
          reservedBeds: 0,
          dataStatus: Math.random() > 0.7 ? 'Stale' : 'Fresh',
          confidenceScore: Math.random() > 0.7 ? 'LOW' : 'HIGH',
          lastUpdatedMinutesAgo: Math.floor(Math.random() * 60),
          ventilatorsTotal: Math.floor(Math.random() * 40) + 10,
          ventilatorsAvailable: Math.floor(Math.random() * 10),
          doctorsAvailable: Math.floor(Math.random() * 30) + 5,
          nursesAvailable: Math.floor(Math.random() * 80) + 20
        },
      {
        id: 'cbe-psg',
        name: 'PSG Institute of Medical Sciences & Research (PSG Hospitals)',
        shortName: 'PSG Hospitals (Peelamedu)',
        type: 'Autonomous Research Institute',
        ownership: 'Trust',
        address: 'Avinashi Rd, Peelamedu, Coimbatore - 641004',
        totalBeds: 1100,
        occupiedBeds: 880,
        icuBeds: 150,
        icuOccupied: 112,
        edBays: 34,
        edOccupied: 18,
        edWaitMinutes: 15,
        diversionActive: false,
        specialties: ['Advanced Critical Care', 'Cardiology & Cath Lab', 'Stroke Unit', 'Pediatrics & Neonatal ICU', 'Nephrology'],
        coordinates: { x: 490, y: 230, lat: 11.0289, lng: 77.0042 },
        distanceFromHubKm: 5.6,
        ambulanceTransitMinutes: 12,
        traumaLevel: 'Level 2 Trauma',
        empanelledGovtScheme: true,
          reservedBeds: 0,
          dataStatus: Math.random() > 0.7 ? 'Stale' : 'Fresh',
          confidenceScore: Math.random() > 0.7 ? 'LOW' : 'HIGH',
          lastUpdatedMinutesAgo: Math.floor(Math.random() * 60),
          ventilatorsTotal: Math.floor(Math.random() * 40) + 10,
          ventilatorsAvailable: Math.floor(Math.random() * 10),
          doctorsAvailable: Math.floor(Math.random() * 30) + 5,
          nursesAvailable: Math.floor(Math.random() * 80) + 20
        },
      {
        id: 'cbe-kmch',
        name: 'Kovai Medical Center and Hospital (KMCH)',
        shortName: 'KMCH (Avinashi Road)',
        type: 'Private Quaternary Super-Specialty',
        ownership: 'Private',
        address: '99 Avinashi Rd, Mudhalipalayam, Coimbatore - 641014',
        totalBeds: 1050,
        occupiedBeds: 790,
        icuBeds: 160,
        icuOccupied: 110,
        edBays: 36,
        edOccupied: 19,
        edWaitMinutes: 14,
        diversionActive: false,
        specialties: ['Multi-Organ Transplantation', 'Interventional Radiology', 'ECMO Critical Care', 'Neurotrauma Center', 'Comprehensive Oncology'],
        coordinates: { x: 570, y: 210, lat: 11.0543, lng: 77.0583 },
        distanceFromHubKm: 12.1,
        ambulanceTransitMinutes: 20,
        traumaLevel: 'Apex Level 1 Trauma',
        empanelledGovtScheme: true,
          reservedBeds: 0,
          dataStatus: Math.random() > 0.7 ? 'Stale' : 'Fresh',
          confidenceScore: Math.random() > 0.7 ? 'LOW' : 'HIGH',
          lastUpdatedMinutesAgo: Math.floor(Math.random() * 60),
          ventilatorsTotal: Math.floor(Math.random() * 40) + 10,
          ventilatorsAvailable: Math.floor(Math.random() * 10),
          doctorsAvailable: Math.floor(Math.random() * 30) + 5,
          nursesAvailable: Math.floor(Math.random() * 80) + 20
        }
    ]
  },

  // 4. THENI DISTRICT
  theni: {
    id: 'theni',
    name: 'Theni District Healthcare Network',
    state: 'Tamil Nadu',
    population: '1.3 Million',
    totalDistrictBeds: 1820,
    occupiedDistrictBeds: 1450,
    totalIcuBeds: 190,
    occupiedIcuBeds: 165, // 86.8% ICU
    aqi: 45,
    aqiStatus: 'Good',
    temperatureC: 28,
    weatherCondition: 'Pleasant / Mountain Valley',
    monsoonAlert: false,
    globeCoordinates: { lat: 10.0104, lng: 77.4768, x: 0.69, y: 0.12, z: 0.71 },
    hospitals: [
      {
        id: 'thn-gtmch',
        name: 'Government Theni Medical College Hospital (GTMCH)',
        shortName: 'Govt Theni Medical College',
        type: 'Public Govt Medical College',
        ownership: 'Government',
        address: 'K.V.R. Nagar, Kanavilakku, Aundipatti Taluk, Theni - 625512',
        totalBeds: 1000,
        occupiedBeds: 920, // 92%
        icuBeds: 110,
        icuOccupied: 102, // 92.7%
        edBays: 36,
        edOccupied: 32,
        edWaitMinutes: 28,
        diversionActive: true,
        specialties: ['Apex District Level 1 Trauma', 'Hilly Terrain Emergency Dispatch', 'Snakebite & Toxicology Center', 'Maternity & NICU', 'General Surgery ICU'],
        coordinates: { x: 380, y: 250, lat: 10.0094, lng: 77.5511 },
        distanceFromHubKm: 0,
        ambulanceTransitMinutes: 0,
        traumaLevel: 'Apex Level 1 Trauma',
        empanelledGovtScheme: true,
          reservedBeds: 0,
          dataStatus: Math.random() > 0.7 ? 'Stale' : 'Fresh',
          confidenceScore: Math.random() > 0.7 ? 'LOW' : 'HIGH',
          lastUpdatedMinutesAgo: Math.floor(Math.random() * 60),
          ventilatorsTotal: Math.floor(Math.random() * 40) + 10,
          ventilatorsAvailable: Math.floor(Math.random() * 10),
          doctorsAvailable: Math.floor(Math.random() * 30) + 5,
          nursesAvailable: Math.floor(Math.random() * 80) + 20
        },
      {
        id: 'thn-hq',
        name: 'Theni District Headquarters Hospital (Periyakulam)',
        shortName: 'Periyakulam District HQ',
        type: 'Public District Headquarters',
        ownership: 'Government',
        address: 'Hospital Rd, Vadagarai, Periyakulam, Theni - 625601',
        totalBeds: 450,
        occupiedBeds: 340,
        icuBeds: 40,
        icuOccupied: 32,
        edBays: 18,
        edOccupied: 12,
        edWaitMinutes: 18,
        diversionActive: false,
        specialties: ['Secondary Emergency Care', 'General Medicine', 'Obstetrics & Gynecology', 'Pediatric Observation'],
        coordinates: { x: 460, y: 180, lat: 10.1194, lng: 77.5447 },
        distanceFromHubKm: 14.2,
        ambulanceTransitMinutes: 22,
        traumaLevel: 'Level 2 Trauma',
        empanelledGovtScheme: true,
          reservedBeds: 0,
          dataStatus: Math.random() > 0.7 ? 'Stale' : 'Fresh',
          confidenceScore: Math.random() > 0.7 ? 'LOW' : 'HIGH',
          lastUpdatedMinutesAgo: Math.floor(Math.random() * 60),
          ventilatorsTotal: Math.floor(Math.random() * 40) + 10,
          ventilatorsAvailable: Math.floor(Math.random() * 10),
          doctorsAvailable: Math.floor(Math.random() * 30) + 5,
          nursesAvailable: Math.floor(Math.random() * 80) + 20
        },
      {
        id: 'thn-nrt',
        name: 'N.R.T. Hospital (Theni Allinagaram)',
        shortName: 'N.R.T. Hospital Theni',
        type: 'Private Multi-Specialty Tertiary',
        ownership: 'Private',
        address: 'Forest Rd, NRT Nagar, Theni Allinagaram - 625531',
        totalBeds: 200,
        occupiedBeds: 125,
        icuBeds: 24,
        icuOccupied: 17,
        edBays: 12,
        edOccupied: 6,
        edWaitMinutes: 10,
        diversionActive: false,
        specialties: ['Emergency Trauma & Orthopedics', 'General ICU', 'Cardiology Outpatient', 'Laparo-endoscopic Surgery'],
        coordinates: { x: 310, y: 290, lat: 10.0104, lng: 77.4768 },
        distanceFromHubKm: 8.5,
        ambulanceTransitMinutes: 12,
        traumaLevel: 'Level 3 Emergency',
        empanelledGovtScheme: true,
          reservedBeds: 0,
          dataStatus: Math.random() > 0.7 ? 'Stale' : 'Fresh',
          confidenceScore: Math.random() > 0.7 ? 'LOW' : 'HIGH',
          lastUpdatedMinutesAgo: Math.floor(Math.random() * 60),
          ventilatorsTotal: Math.floor(Math.random() * 40) + 10,
          ventilatorsAvailable: Math.floor(Math.random() * 10),
          doctorsAvailable: Math.floor(Math.random() * 30) + 5,
          nursesAvailable: Math.floor(Math.random() * 80) + 20
        },
      {
        id: 'thn-annai',
        name: 'Annai Hospital (Bodinayakanur)',
        shortName: 'Annai Hospital Bodi',
        type: 'Private Multi-Specialty Tertiary',
        ownership: 'Private',
        address: 'Subburaj Nagar, Bodinayakanur, Theni - 625513',
        totalBeds: 170,
        occupiedBeds: 95,
        icuBeds: 16,
        icuOccupied: 9,
        edBays: 10,
        edOccupied: 4,
        edWaitMinutes: 8,
        diversionActive: false,
        specialties: ['Emergency Polytrauma', 'Ghat Road Transit Stabilization', 'General Surgery', 'Dialysis Center'],
        coordinates: { x: 210, y: 270, lat: 10.0118, lng: 77.3489 },
        distanceFromHubKm: 16.5,
        ambulanceTransitMinutes: 24,
        traumaLevel: 'Level 3 Emergency',
        empanelledGovtScheme: true,
          reservedBeds: 0,
          dataStatus: Math.random() > 0.7 ? 'Stale' : 'Fresh',
          confidenceScore: Math.random() > 0.7 ? 'LOW' : 'HIGH',
          lastUpdatedMinutesAgo: Math.floor(Math.random() * 60),
          ventilatorsTotal: Math.floor(Math.random() * 40) + 10,
          ventilatorsAvailable: Math.floor(Math.random() * 10),
          doctorsAvailable: Math.floor(Math.random() * 30) + 5,
          nursesAvailable: Math.floor(Math.random() * 80) + 20
        }
    ]
  }
};

export const getHospitalRouteDetails = (hospital: RealHospital, districtName: string): HospitalRouteDetails => {
  if (hospital.routeDetails) return hospital.routeDetails;

  const dist = hospital.distanceFromHubKm || 3.5;
  const eta = hospital.ambulanceTransitMinutes || Math.max(5, Math.round(dist * 1.8));

  let corridorEn = `${districtName} Arterial Emergency Corridor`;
  let corridorTa = `${districtName} அவசர சிகிச்சை விரைவு பாதை`;
  let bayEn = 'Resuscitation Trauma Ramp Bay 1';
  let bayTa = 'அதிதீவிர அவசர சிகிச்சை ரேம்ப் பே 1';

  if (hospital.id === 'chn-rgggh') {
    corridorEn = 'EVR Periyar Salai Central Emergency Corridor';
    corridorTa = 'இ.வி.ஆர் பெரியார் சாலை மத்திய அவசர வழித்தடம்';
    bayEn = 'Apex Resuscitation Bay A & Trauma Ramp';
    bayTa = 'முக்கிய அவசர சிகிச்சை பே A & டிராம ரேம்ப்';
  } else if (hospital.id === 'chn-apollo') {
    corridorEn = 'EVR Periyar Salai & Anna Salai (GST) Corridor';
    corridorTa = 'இ.வி.ஆர் பெரியார் சாலை & அண்ணா சாலை வழித்தடம்';
    bayEn = 'Apollo Emergency Resuscitation Bay 1';
    bayTa = 'அப்பல்லோ அவசர சிகிச்சை பே 1';
  } else if (hospital.id === 'chn-stanley') {
    corridorEn = 'Old Jail Road & Royapuram Expressway';
    corridorTa = 'பழைய சிறைச்சாலை சாலை & ராயபுரம் விரைவு பாதை';
    bayEn = 'Plastic & Trauma Resuscitation Ramp';
    bayTa = 'பிளாஸ்டிக் & டிராம சிகிச்சை பிரிவு';
  } else if (hospital.id === 'chn-miot') {
    corridorEn = 'Mount-Poonamallee Arterial Trunk Corridor';
    corridorTa = 'மவுண்ட்-பூந்தமல்லி பிரதான நெடுஞ்சாலை';
    bayEn = 'MIOT Polytrauma Emergency Intake Ramp';
    bayTa = 'மியாட் பாலிடிராம அவசர வரவேற்பு';
  } else if (hospital.id === 'chn-sri-ramachandra') {
    corridorEn = 'Poonamallee High Road & Porur Elevated Bypass';
    corridorTa = 'பூந்தமல்லி நெடுஞ்சாலை & போரூர் மேம்பால வழித்தடம்';
    bayEn = 'SRMC Super-Specialty Trauma Bay';
    bayTa = 'எஸ்.ஆர்.எம்.சி சிறப்பு அவசர சிகிச்சை பே';
  } else if (hospital.id === 'mdu-grh') {
    corridorEn = 'Panagal Road & Vaigai Riverfront Expressway';
    corridorTa = 'பனகல் சாலை & வைகை நதிக்கரை விரைவு பாதை';
    bayEn = 'GRH Level 1 Trauma Resuscitation Wing';
    bayTa = 'ஜி.ஆர்.எச் நிலை 1 அவசர சிகிச்சை பிரிவு';
  } else if (hospital.id === 'mdu-mmhrc') {
    corridorEn = 'Melur Main Road & Lake Area Corridor';
    corridorTa = 'மேலூர் மெயின் ரோடு & லேக் ஏரியா வழித்தடம்';
    bayEn = 'Meenakshi Mission Emergency Intake Bay 2';
    bayTa = 'மீனாட்சி மிஷன் அவசர சிகிச்சை பே 2';
  } else if (hospital.id === 'mdu-apollo') {
    corridorEn = 'KK Nagar Lake View Expressway';
    corridorTa = 'கே.கே நகர் லேக் வியூ எக்ஸ்பிரஸ்வே';
    bayEn = 'Apollo Madurai Emergency Resuscitation Bay';
    bayTa = 'அப்பல்லோ மதுரை அவசர சிகிச்சை பே';
  } else if (hospital.id === 'mdu-velammal') {
    corridorEn = 'Madurai Ring Road & Tuticorin Highway (NH 38)';
    corridorTa = 'மதுரை ரிங் ரோடு & தூத்துக்குடி நெடுஞ்சாலை';
    bayEn = 'Velammal Multi-Specialty Trauma Bay 3';
    bayTa = 'வேலம்மாள் பல்நோக்கு அவசர சிகிச்சை பே 3';
  } else if (hospital.id === 'cbe-cmch') {
    corridorEn = 'Trichy Road (NH 181) Central Emergency Corridor';
    corridorTa = 'திருச்சி ரோடு (NH 181) அவசர வழித்தடம்';
    bayEn = 'CMCH Apex Trauma & Resuscitation Center';
    bayTa = 'சி.எம்.சி.ஹெச் தலைமை அவசர சிகிச்சை மையம்';
  } else if (hospital.id === 'cbe-ganga') {
    corridorEn = 'Mettupalayam Road (NH 67) & RS Puram Corridor';
    corridorTa = 'மேட்டுப்பாளையம் ரோடு & ஆர்.எஸ். புரம் வழித்தடம்';
    bayEn = 'Ganga Specialized Ortho-Trauma Emergency Bay';
    bayTa = 'கங்கா சிறப்பு எலும்பு முறிவு சிகிச்சை பே';
  } else if (hospital.id === 'cbe-psg') {
    corridorEn = 'Avinashi Road Arterial Express Corridor';
    corridorTa = 'அவிநாசி ரோடு விரைவு வழித்தடம்';
    bayEn = 'PSG Institute Emergency Trauma Gate 1';
    bayTa = 'பி.எஸ்.ஜி அவசர சிகிச்சை நுழைவாயில் 1';
  } else if (hospital.id === 'cbe-kmch') {
    corridorEn = 'Avinashi Road Expressway & Airport Flyover';
    corridorTa = 'அவிநாசி ரோடு & விமான நிலைய மேம்பாலம்';
    bayEn = 'KMCH Quaternary Emergency & Cardiac Bypass Ramp';
    bayTa = 'கே.எம்.சி.ஹெச் அவசர & இதய பைபாஸ் ரேம்ப்';
  } else if (hospital.id === 'thn-gtmch') {
    corridorEn = 'K.V.R Nagar / Theni Medical College Highway';
    corridorTa = 'கே.வி.ஆர் நகர் / தேனி மருத்துவக் கல்லூரி நெடுஞ்சாலை';
    bayEn = 'Govt Medical College Emergency Trauma Center';
    bayTa = 'அரசு மருத்துவக் கல்லூரி அவசர சிகிச்சை மையம்';
  } else if (hospital.id === 'thn-hq') {
    corridorEn = 'Madurai-Theni Highway (NH 85) Eastern Corridor';
    corridorTa = 'மதுரை-தேனி நெடுஞ்சாலை (NH 85) வழித்தடம்';
    bayEn = 'Periyakulam Govt HQ Casualty Entrance';
    bayTa = 'பெரியகுளம் அரசு தலைமை மருத்துவமனை அவசர பிரிவு';
  } else if (hospital.id === 'thn-nrt') {
    corridorEn = 'Subban Chetty Street & Theni Central Arterial';
    corridorTa = 'சுப்பன் செட்டி தெரு & தேனி மத்திய வழித்தடம்';
    bayEn = 'NRT Hospital Trauma & Surgical Bay';
    bayTa = 'என்.ஆர்.டி மருத்துவமனை அவசர அறுவை சிகிச்சை பே';
  } else if (hospital.id === 'thn-annai') {
    corridorEn = 'Bodinayakanur Ghat Road Transit Corridor';
    corridorTa = 'போடிநாயக்கனூர் மலைப்பாதை வழித்தடம்';
    bayEn = 'Annai Emergency Care Center';
    bayTa = 'அன்னை அவசர சிகிச்சை மையம்';
  }

  const s1 = Math.max(0.4, Number((dist * 0.35).toFixed(1)));
  const s2 = Math.max(0.6, Number((dist * 0.45).toFixed(1)));
  const s3 = Math.max(0.2, Number((dist * 0.20).toFixed(1)));

  return {
    corridorNameEn: corridorEn,
    corridorNameTa: corridorTa,
    distanceKm: dist,
    ambulanceTransitMinutes: eta,
    trafficStatusEn: 'Green Wave Active (All Traffic Signals Preempted via 108 Transponder)',
    trafficStatusTa: 'கிரீன் வேவ் முன்னுரிமை (108 சிக்னல்கள் அனைத்தும் பச்சை)',
    destinationBayEn: bayEn,
    destinationBayTa: bayTa,
    steps: [
      {
        stepNumber: 1,
        instructionEn: `Depart 108 Dispatch / Incident Scene onto ${corridorEn} (${s1} km)`,
        instructionTa: `108 அவசர மையம் / சம்பவ இடத்திலிருந்து ${corridorTa}க்கு செல்லவும் (${s1} கி.மீ)`,
        distanceKm: s1,
        iconType: 'straight'
      },
      {
        stepNumber: 2,
        instructionEn: `Engage 108 Siren Priority: Bypass congested junction via Emergency Express Lane (${s2} km)`,
        instructionTa: `108 சைரன் முன்னுரிமை: நெரிசல் மிகுந்த சந்திப்பை அவசர விரைவு பாதை வழியாக கடக்கவும் (${s2} கி.மீ)`,
        distanceKm: s2,
        iconType: 'siren'
      },
      {
        stepNumber: 3,
        instructionEn: `Turn right into ${hospital.shortName} → ${bayEn} (${s3} km)`,
        instructionTa: `${hospital.shortName} நுழைவாயிலில் திரும்பி → ${bayTa}ல் நுழையவும் (${s3} கி.மீ)`,
        distanceKm: s3,
        iconType: 'destination'
      }
    ]
  };
};

export interface BedWaitTimeDetail {
  department: 'ED' | 'ICU' | 'MedSurg';
  deptLabelEn: string;
  deptLabelTa: string;
  availableCount: number;
  totalCount: number;
  waitTimeMinutes: number;
  statusEn: 'Instant Allocation' | 'Sterilization in Progress' | 'Turnover Queue' | 'Critical Delay';
  statusTa: 'உடனடி ஒதுக்கீடு' | 'சுத்திகரிப்பு நடைபெறுகிறது' | 'வரிசை தாமதம்' | 'நெருக்கடி தாமதம்';
  queuePosition: number;
  readinessPercent: number;
}

export interface HospitalWaitTimes {
  hospitalId: string;
  hospitalName: string;
  ed: BedWaitTimeDetail;
  icu: BedWaitTimeDetail;
  medSurg: BedWaitTimeDetail;
  fastestWaitMinutes: number;
  overallTriageSummaryEn: string;
  overallTriageSummaryTa: string;
}

export function getHospitalBedWaitTimes(hospital: RealHospital): HospitalWaitTimes {
  // ED Wait Time
  const edAvail = Math.max(0, hospital.edBays - hospital.edOccupied);
  const edWait = edAvail > 0 ? 0 : Math.max(8, hospital.edWaitMinutes);
  const edStatusEn = edAvail > 0 ? 'Instant Allocation' : 'Turnover Queue';
  const edStatusTa = edAvail > 0 ? 'உடனடி ஒதுக்கீடு' : 'வரிசை தாமதம்';
  const edQueue = edAvail > 0 ? 1 : Math.max(1, Math.ceil((hospital.edOccupied - hospital.edBays + 2) / 2));

  // ICU Wait Time
  const icuAvail = Math.max(0, hospital.icuBeds - hospital.icuOccupied);
  let icuWait = 6;
  let icuStatusEn: BedWaitTimeDetail['statusEn'] = 'Sterilization in Progress';
  let icuStatusTa: BedWaitTimeDetail['statusTa'] = 'சுத்திகரிப்பு நடைபெறுகிறது';
  let icuQueue = 1;

  if (icuAvail >= 4) {
    icuWait = 6;
    icuStatusEn = 'Sterilization in Progress';
    icuStatusTa = 'சுத்திகரிப்பு நடைபெறுகிறது';
    icuQueue = 1;
  } else if (icuAvail >= 1) {
    icuWait = 12;
    icuStatusEn = 'Sterilization in Progress';
    icuStatusTa = 'சுத்திகரிப்பு நடைபெறுகிறது';
    icuQueue = 1;
  } else {
    icuWait = 28;
    icuStatusEn = 'Turnover Queue';
    icuStatusTa = 'வரிசை தாமதம்';
    icuQueue = 2;
  }

  // Med-Surg Wait Time
  const medSurgTotal = Math.max(10, hospital.totalBeds - hospital.icuBeds - hospital.edBays);
  const medSurgOccupied = Math.max(0, hospital.occupiedBeds - hospital.icuOccupied - hospital.edOccupied);
  const medSurgAvail = Math.max(0, medSurgTotal - medSurgOccupied);
  let medSurgWait = 10;
  let medSurgStatusEn: BedWaitTimeDetail['statusEn'] = 'Instant Allocation';
  let medSurgStatusTa: BedWaitTimeDetail['statusTa'] = 'உடனடி ஒதுக்கீடு';

  if (medSurgAvail > 25) {
    medSurgWait = 8;
    medSurgStatusEn = 'Instant Allocation';
    medSurgStatusTa = 'உடனடி ஒதுக்கீடு';
  } else if (medSurgAvail > 5) {
    medSurgWait = 15;
    medSurgStatusEn = 'Sterilization in Progress';
    medSurgStatusTa = 'சுத்திகரிப்பு நடைபெறுகிறது';
  } else {
    medSurgWait = 32;
    medSurgStatusEn = 'Turnover Queue';
    medSurgStatusTa = 'வரிசை தாமதம்';
  }

  const fastestWait = Math.min(edWait, icuWait, medSurgWait);

  return {
    hospitalId: hospital.id,
    hospitalName: hospital.name,
    ed: {
      department: 'ED',
      deptLabelEn: 'Emergency Trauma Bay (Resus)',
      deptLabelTa: 'அவசர சிகிச்சை பிரிவு (டிராமா பே)',
      availableCount: edAvail,
      totalCount: hospital.edBays,
      waitTimeMinutes: edWait,
      statusEn: edStatusEn,
      statusTa: edStatusTa,
      queuePosition: edQueue,
      readinessPercent: edAvail > 0 ? 100 : 75
    },
    icu: {
      department: 'ICU',
      deptLabelEn: 'Critical Care / ICU Bed',
      deptLabelTa: 'தீவிர சிகிச்சைப் பிரிவு (ICU)',
      availableCount: icuAvail,
      totalCount: hospital.icuBeds,
      waitTimeMinutes: icuWait,
      statusEn: icuStatusEn,
      statusTa: icuStatusTa,
      queuePosition: icuQueue,
      readinessPercent: icuAvail > 0 ? 92 : 60
    },
    medSurg: {
      department: 'MedSurg',
      deptLabelEn: 'Inpatient Medical-Surgical Bed',
      deptLabelTa: 'உள்நோயாளி அறுவைசிகிச்சை படுக்கை',
      availableCount: medSurgAvail,
      totalCount: medSurgTotal,
      waitTimeMinutes: medSurgWait,
      statusEn: medSurgStatusEn,
      statusTa: medSurgStatusTa,
      queuePosition: 1,
      readinessPercent: medSurgAvail > 10 ? 98 : 70
    },
    fastestWaitMinutes: fastestWait,
    overallTriageSummaryEn: edAvail > 0 
      ? 'Immediate Emergency Trauma Bay Available (0m Wait)' 
      : `Emergency Bay Queue ${edWait}m • ICU Rapid Prep ${icuWait}m`,
    overallTriageSummaryTa: edAvail > 0 
      ? 'உடனடி அவசர சிகிச்சை பே தயார் (0 நிமிடம் தாமதம்)' 
      : `அவசர பிரிவு வரிசை ${edWait} நிமி • ICU தயார் ${icuWait} நிமி`
  };
}

export function getGoogleMapsDirectionsUrl(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number
): string {
  return `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${destLat},${destLng}&travelmode=driving`;
}

export function getGoogleMapsEmbedUrl(destLat: number, destLng: number, zoom = 15): string {
  return `https://maps.google.com/maps?q=${destLat},${destLng}&hl=en&z=${zoom}&output=embed`;
}



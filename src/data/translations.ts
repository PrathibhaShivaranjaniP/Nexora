export type Language = 'en' | 'ta';

export const translations = {
  en: {
    // Header & Brand
    appTitle: 'AegisOS',
    appSubtitle: 'Autonomous Hospital Capacity Digital Twin',
    district: 'District',
    census: 'District Census',
    icuCapacity: 'ICU Capacity',
    ghostBeds: 'Ghost Beds',
    sitrepBtn: 'CMO SITREP',
    settingsBtn: 'Settings',
    admitBtn: 'Admit Patient',
    voiceAiBtn: 'Voice AI',
    mciActive: 'MCI DISASTER ACTIVE',

    // Breadcrumb / Tiers
    tier1: 'Tier 1: 3D Globe',
    tier2: 'Tier 2: District Metro',
    tier3: 'Tier 3: Hospital Ward',
    tier4: 'Tier 4: Bed Telemetry',
    scaleGlobe: 'Orbital Scale 1:10,000,000',
    scaleDistrict: 'Metropolitan Scale 1:50,000',
    scaleHospital: 'Architectural Scale 1:500',
    scaleBed: 'Clinical Telemetry 1:1',

    // Bed Statuses
    statusAvailable: 'Available',
    statusOccupied: 'Occupied',
    statusGhost: 'Ghost Bed',
    statusCleaning: 'Cleaning',
    statusReserved: 'Reserved',

    // Dock & Tabs
    dockGlobe: 'National Globe',
    dockDistrict: 'District Metro',
    dockHospital: '3D Hospital Floor',
    dockWhatIf: 'What-If Sandbox',
    dockClinical: 'Clinical & Live ECG',
    dockStaffing: 'Staff & Acuity',

    // Side HUD Wings
    hudTelemetryTitle: 'Clinical Telemetry & NEWS2',
    hudTelemetrySubtitle: 'Real-time physiological risk monitoring',
    hudCopilotTitle: 'Operational AI Copilot',
    hudCopilotSubtitle: 'Neural capacity optimization & agent feed',
    closeDrawer: 'Close Panel',
    openTelemetry: 'Live ECG & Telemetry',
    openCopilot: 'AI Copilot & Stream',

    // Settings
    settingsTitle: 'System Preferences & Settings',
    settingsLanguage: 'Interface Language',
    settingsAudio: 'Web Audio Sound Effects',
    settingsAudioOn: 'Sound Enabled',
    settingsAudioOff: 'Muted',
    settings3d: '3D Holographic Animations',
    settings3dOn: '60 FPS Animated Living Twin',
    settingsClose: 'Done',

    // Environmental
    aqiLabel: 'Air Quality (AQI)',
    tempLabel: 'Temperature',
    pppDiversion: 'PPP Diversion (CMCHIS)',
    pppActive: 'PPP Diversion Active',

    // Route & Location Navigation
    routeNavTitle: 'Emergency Route & 108 GPS Dispatch',
    detectGps: 'Detect GPS Location',
    originDispatch: '108 EMS Dispatch / Incident Pin',
    targetRoute: 'Destination Hospital',
    distanceKm: 'Distance',
    ambulanceEta: 'Ambulance ETA',
    greenWave: 'Green Wave Active (Signals Overridden)',
    turnByTurn: 'Turn-by-Turn Directions',
    voiceGuide: 'Voice Route Guide',
    enterWardCutaway: 'Enter 3D Ward (Tier 3)',
    callerIncident: 'Caller Incident Scene',

    // Dedicated Route Navigator Page
    openRoutePage: 'Open Dedicated Route Page',
    dockRoute: '108 Route Page',
    routeNavigatorTitle: '108 Emergency Route Navigator & Traffic Preemption',
    routeNavigatorDesc: 'Dedicated corridor command theater with satellite vector mapping, live 108 ALS ambulance tracking, automated traffic signal preemption, and real-time hospital trauma intake readiness.',
    backToDistrict: 'Back to District Map',
    routeActiveCorridor: 'Active Siren Corridor',
    routeWaypoints: 'Turn-by-Turn Waypoints',
    liveAmbulanceTelemetry: 'Live Ambulance Telemetry',
    hospitalReadiness: 'Hospital Trauma Readiness',
    sirenActive: 'Dual-Tone Siren Active',
    speedKmH: 'Speed',
    trafficSignalOverridden: 'Traffic Signals Preempted',
    voiceGuidanceActive: 'Voice Guidance Active',
    voiceGuidanceMuted: 'Voice Guidance Muted',

    // Atlas Navigation
    atlasTitle: 'Planetary Health Atlas',
    atlasGlobal: 'Global',
    atlasIndia: 'India',
    atlasTamilNadu: 'Tamil Nadu',
    atlasDistricts: 'Districts',
    atlasSearchPlaceholder: 'Search Atlas (India, Tamil Nadu, Chennai, Madurai...)',
    atlasZoomTip: 'Drill down hierarchy: Global -> India -> Tamil Nadu -> Districts. Click pins or search to navigate.',

    // Real-Time Hospital Telemetry
    telemetryRibbonTitle: 'Real-Time Hospital Telemetry',
    realWorldCapacity: 'Real-World Capacity',
    actualOccupancyRate: 'Occupancy Rate',
    liveSensorFeed: 'IoT Bed Sensors Live',
    ghostBedTurnover: 'Ghost Bed Turnover Active',

    // Bed Reservation & Google Maps
    reserveBedBtn: 'Reserve Bed in Advance',
    reservationWaitTime: 'Bed Reservation Wait Time',
    guaranteedHold: '45-Min Guaranteed Hold',
    googleMapsNav: 'Live Google Maps Navigation',
    openGoogleMapsApp: 'Open Turn-by-Turn GPS in Google Maps',
    queuePosition: 'Queue Position'
  },

  ta: {
    // Header & Brand
    appTitle: 'ஏஜிஸ் ஓஎஸ்',
    appSubtitle: 'தன்னாட்சி மருத்துவமனை திறன் டிஜிட்டல் இரட்டை',
    district: 'மாவட்டம்',
    census: 'மாவட்ட படுக்கைகள்',
    icuCapacity: 'தீவிர சிகிச்சை (ICU)',
    ghostBeds: 'கோஸ்ட் படுக்கைகள்',
    sitrepBtn: 'அதிகாரப்பூர்வ அறிக்கை (SITREP)',
    settingsBtn: 'அமைப்புகள்',
    admitBtn: 'நோயாளி சேர்க்கை',
    voiceAiBtn: 'குரல் AI',
    mciActive: 'பேரிடர் அவசரநிலை செயலில்',

    // Breadcrumb / Tiers
    tier1: 'நிலை 1: 3D பூகோளம்',
    tier2: 'நிலை 2: மாவட்ட வரைபடம்',
    tier3: 'நிலை 3: மருத்துவமனை வார்டு',
    tier4: 'நிலை 4: படுக்கை கண்காணிப்பு',
    scaleGlobe: 'விண்வெளி அளவு 1:10,000,000',
    scaleDistrict: 'மாவட்ட அளவு 1:50,000',
    scaleHospital: 'கட்டட அளவு 1:500',
    scaleBed: 'மருத்துவ கண்காணிப்பு 1:1',

    // Bed Statuses
    statusAvailable: 'கிடைக்கிறது',
    statusOccupied: 'ஆக்கிரமிப்பு',
    statusGhost: 'கோஸ்ட் படுக்கை',
    statusCleaning: 'சுத்திகரிப்பு',
    statusReserved: 'முன்பதிவு',

    // Dock & Tabs
    dockGlobe: 'தேசிய பூகோளம்',
    dockDistrict: 'மாவட்ட வரைபடம்',
    dockHospital: '3D வார்டு தளம்',
    dockWhatIf: 'மாதிரி பகுப்பாய்வு',
    dockClinical: 'நேரலை ECG & அபாயம்',
    dockStaffing: 'செவிலியர் பணிச்சுமை',

    // Side HUD Wings
    hudTelemetryTitle: 'மருத்துவ கண்காணிப்பு & NEWS2',
    hudTelemetrySubtitle: 'உடலியல் ஆபத்து நேரலை கண்காணிப்பு',
    hudCopilotTitle: 'செயல்பாட்டு AI வழிகாட்டி',
    hudCopilotSubtitle: 'திறன் உகப்பாக்கம் & ஏஜென்ட் தகவல்',
    closeDrawer: 'மூடு',
    openTelemetry: 'நேரலை ECG & நோயாளிகள்',
    openCopilot: 'AI வழிகாட்டி & பதிவுகள்',

    // Settings
    settingsTitle: 'கணினி அமைப்புகள் (Settings)',
    settingsLanguage: 'இடைமுக மொழி (Language)',
    settingsAudio: 'ஒலி விளைவுகள் (Sound Effects)',
    settingsAudioOn: 'ஒலி இயக்கத்தில் உள்ளது',
    settingsAudioOff: 'அமைதிப்படுத்தப்பட்டது',
    settings3d: '3D அனிமேஷன் விளைவுகள்',
    settings3dOn: '60 FPS நேரலை அனிமேஷன்',
    settingsClose: 'முடிந்தது',

    // Environmental
    aqiLabel: 'காற்று தரம் (AQI)',
    tempLabel: 'வெப்பநிலை',
    pppDiversion: 'அரசு-தனியார் இணைப்பு (CMCHIS)',
    pppActive: 'PPP இணைப்பு செயலில்',

    // Route & Location Navigation
    routeNavTitle: 'அவசர ஆம்புலன்ஸ் பாதை & 108 ஜிபிஎஸ்',
    detectGps: 'ஜிபிஎஸ் இருப்பிடத்தை கண்டறி',
    originDispatch: '108 அவசர தொடக்க மையம்',
    targetRoute: 'இலக்கு மருத்துவமனை',
    distanceKm: 'பயண தூரம்',
    ambulanceEta: 'ஆம்புலன்ஸ் நேரம்',
    greenWave: 'கிரீன் வேவ் முன்னுரிமை (தடையில்லா விரைவு பாதை)',
    turnByTurn: 'படி-படியான வழிசெலுத்தல்',
    voiceGuide: 'குரல் வழிகாட்டல்',
    enterWardCutaway: '3D வார்டுக்குள் செல்க (நிலை 3)',
    callerIncident: 'சம்பவ இடம் (அழைப்பாளர்)',

    // Dedicated Route Navigator Page
    openRoutePage: 'முழு வழிசெலுத்தல் பக்கத்தைத் திற',
    dockRoute: '108 வழிசெலுத்தல்',
    routeNavigatorTitle: '108 அவசர ஆம்புலன்ஸ் வழிசெலுத்தல் & கிரீன் வேவ் தளம்',
    routeNavigatorDesc: 'செயற்கைக்கோள் திசையன் வரைபடம், நேரலை 108 ஆம்புலன்ஸ் கண்காணிப்பு, தானியங்கி போக்குவரத்து சமிக்ஞை முன்னுரிமை மற்றும் மருத்துவமனை தயார்நிலை.',
    backToDistrict: 'மாவட்ட வரைபடத்திற்குத் திரும்பு',
    routeActiveCorridor: 'செயலில் உள்ள சைரன் பாதை',
    routeWaypoints: 'படி-படியான வழிசெலுத்தல் புள்ளிகள்',
    liveAmbulanceTelemetry: 'நேரலை ஆம்புலன்ஸ் தகவல்கள்',
    hospitalReadiness: 'மருத்துவமனை அவசர சிகிச்சை தயார்நிலை',
    sirenActive: 'இரட்டை-தொனி சைரன் செயலில்',
    speedKmH: 'வேகம்',
    trafficSignalOverridden: 'சமிக்ஞைகள் முறியடிக்கப்பட்டன (கிரீன் வேவ்)',
    voiceGuidanceActive: 'குரல் வழிகாட்டல் இயக்கத்தில் உள்ளது',
    voiceGuidanceMuted: 'குரல் வழிகாட்டல் அமைதிப்படுத்தப்பட்டது',

    // Atlas Navigation
    atlasTitle: 'பூகோள சுகாதார அட்லஸ் (Atlas)',
    atlasGlobal: 'உலகளாவிய',
    atlasIndia: 'இந்தியா',
    atlasTamilNadu: 'தமிழ்நாடு',
    atlasDistricts: 'மாவட்டங்கள்',
    atlasSearchPlaceholder: 'அட்லஸில் தேடுங்கள் (இந்தியா, தமிழ்நாடு, சென்னை, மதுரை...)',
    atlasZoomTip: 'படிநிலை: உலகம் -> இந்தியா -> தமிழ்நாடு -> மாவட்டங்கள். விவரங்களை அணுக பின்களை அழுத்தவும்.',

    // Real-Time Hospital Telemetry
    telemetryRibbonTitle: 'நேரலை மருத்துவமனை படுக்கை தகவல்',
    realWorldCapacity: 'உண்மையான கொள்ளளவு',
    actualOccupancyRate: 'ஆக்கிரமிப்பு விகிதம்',
    liveSensorFeed: 'IoT சென்சார்கள் நேரலையில்',
    ghostBedTurnover: 'கோஸ்ட் படுக்கை திருப்புமுனை செயலில்',

    // Bed Reservation & Google Maps
    reserveBedBtn: 'படுக்கை முன்பதிவு செய்',
    reservationWaitTime: 'படுக்கை முன்பதிவு காத்திருப்பு நேரம்',
    guaranteedHold: '45 நிமிடம் உத்தரவாத நிறுத்தம்',
    googleMapsNav: 'நேரலை கூகிள் வரைபடம்',
    openGoogleMapsApp: 'கூகிள் வரைபடத்தில் ஜிபிஎஸ் திற',
    queuePosition: 'வரிசை நிலை எண்'
  }
};

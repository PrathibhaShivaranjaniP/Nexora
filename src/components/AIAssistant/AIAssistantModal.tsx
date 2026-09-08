import React, { useState, useEffect } from 'react';
import { useHospitalStore } from '../../store/hospitalStore';
import { Bot, Navigation, HelpCircle, X, Send, Sparkles, Mic, MicOff, Volume2, VolumeX, MapPin, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { RegionalGPSMap } from '../ThreeDView/RegionalGPSMap';
import { sound } from '../../utils/audioEngine';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TriageResult {
  condition: string;
  specialtyRequired: string;
  recommendedHospital: {
    id: string;
    name: string;
    type: string;
    distance: string;
    driveTime: string;
    edWait: string;
    totalTimeToCare: string;
    notes: string;
    routeSteps: string[];
  };
  avoidHospitalReason?: string;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({ isOpen, onClose }) => {
  const { setActiveTab, setLanguage, language, currentDistrict, t, setSpatialTier, setSelectedHospitalId } = useHospitalStore();
  const [activeMode, setActiveMode] = useState<'guide' | 'triage'>('guide');

  // Mode 1: Guide Chat State
  const [guideInput, setGuideInput] = useState('');
  const [guideMessages, setGuideMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string; actionButton?: { label: string; tab: any } }>>([
    {
      sender: 'bot',
      text: 'Aegis Intelligence online. You can speak to me hands-free using the microphone button below, or type your query about system features, emergency hospital routing, or say "Change language to Tamil" / "Switch to English".'
    }
  ]);

  // Mode 2: Triage Input State
  const [symptomInput, setSymptomInput] = useState('');
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null);

  // Voice recognition state
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!isOpen) return null;

  // Text to Speech
  const speakText = (text: string, forceLang?: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis || sound.getIsMuted()) return;
    window.speechSynthesis.cancel();

    // Clean markdown asterisks
    const clean = text.replace(/\*\*/g, '').replace(/#/g, '');
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.lang = forceLang || (language === 'ta' ? 'ta-IN' : 'en-US');

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // Speech Recognition
  const toggleVoiceInput = () => {
    sound.playTactileClick();
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please type your query.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setIsListening(false);
        if (activeMode === 'guide') {
          handleGuideSend(transcript);
        } else {
          setSymptomInput(transcript);
          handleTriageQuery(transcript);
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const handleGuideSend = (text?: string) => {
    const query = text || guideInput;
    if (!query.trim()) return;

    sound.playRadarPing();
    setGuideMessages(prev => [...prev, { sender: 'user', text: query }]);
    if (!text) setGuideInput('');

    setTimeout(() => {
      const lower = query.toLowerCase();
      let botReply = '';
      let actionBtn: { label: string; tab: any } | undefined = undefined;

      // 1. Language switching commands
      if (
        lower.includes('tamil') ||
        lower.includes('தமிழ்') ||
        lower.includes('தமிழுக்கு') ||
        lower.includes('தமிழில்')
      ) {
        setLanguage('ta');
        botReply =
          'மொழி வெற்றிகரமாக தமிழுக்கு மாற்றப்பட்டது! AegisOS இப்போது தமிழ்நாடு அவசர சிகிச்சை நெட்வொர்க்கில் (சென்னை, மதுரை, கோயம்புத்தூர், தேனி) தமிழில் செயல்படுகிறது. மேலும் ஏதேனும் உதவி தேவையா?';
        speakText(botReply, 'ta-IN');
      } else if (
        lower.includes('english') ||
        lower.includes('ஆங்கிலம்') ||
        lower.includes('in english')
      ) {
        setLanguage('en');
        botReply =
          'Language successfully switched to English. AegisOS defense-grade health command is now operating in English across Chennai, Madurai, Coimbatore, and Theni.';
        speakText(botReply, 'en-US');
      }
      // 2. Spatial tier navigation commands
      else if (lower.includes('globe') || lower.includes('tier 1') || lower.includes('பூகோளம்')) {
        setSpatialTier(1);
        botReply = language === 'ta'
          ? 'நிலை 1: 3D தேசிய பூகோள பார்வைக்கு மாற்றப்பட்டது. தமிழ்நாடு மாவட்ட மையங்கள் மற்றும் வான்வழி பரிமாற்ற பாதைகள் ஒளிர்கின்றன.'
          : 'Navigated to Tier 1: National 3D Globe View. Rotating orbital beacons and transfer arcs active.';
        speakText(botReply);
      } else if (lower.includes('district') || lower.includes('tier 2') || lower.includes('வரைபடம்') || lower.includes('மாவட்டம்')) {
        setSpatialTier(2);
        botReply = language === 'ta'
          ? `${currentDistrict.name} மாவட்ட வரைபடத்திற்கு மாற்றப்பட்டது. நிகழ்நேர ஆம்புலன்ஸ் இயக்கம் மற்றும் மருத்துவமனை தீவிர சிகிச்சை நிலை கண்காணிக்கப்படுகிறது.`
          : `Navigated to Tier 2: ${currentDistrict.name} District Vector Map with live highway routing and hospital beacons.`;
        speakText(botReply);
      } else if (lower.includes('hospital') || lower.includes('ward') || lower.includes('tier 3') || lower.includes('மருத்துவமனை')) {
        setSpatialTier(3);
        botReply = language === 'ta'
          ? 'நிலை 3: 3D மருத்துவமனை வார்டு தளம் திறக்கப்பட்டது. படுக்கை நிலைகள் மற்றும் மானிட்டர் அனிமேஷன்கள் செயலில் உள்ளன.'
          : 'Navigated to Tier 3: 3D Architectural Ward Cutaway with telemetry sweeps and ghost bed halos.';
        speakText(botReply);
      }
      // 3. Clinical & Operational concepts
      else if (lower.includes('ghost') || lower.includes('கோஸ்ட்')) {
        botReply = language === 'ta'
          ? 'கோஸ்ட் படுக்கை என்பது IoT பிரஷர் சென்சார் 0 kg எடையைக் காட்டும் படுக்கையாகும் (நோயாளி புறப்பட்டுவிட்டார்), ஆனால் கணினியில் டிஸ்சார்ஜ் இன்னும் பதிவு செய்யப்படவில்லை. இதை உடனே சுத்தம் செய்து ஒதுக்குவது 3+ மணிநேர காத்திருப்பைத் தடுக்கிறது!'
          : 'A Ghost Bed is a bed where simulated IoT sensors detect 0 kg pressure (meaning the patient vacated), but the EHR discharge was never logged. Turning it over immediately saves over 3 hours of idle bed latency!';
        speakText(botReply);
      } else if (lower.includes('ecg') || lower.includes('heart') || lower.includes('telemetry') || lower.includes('இதயம்')) {
        botReply = language === 'ta'
          ? 'எங்கள் நிகழ்நேர ECG அலைவரிசை Lead II இதய துடிப்புகளை வரைகிறது. ஆபத்தான நிலையில் உள்ள நோயாளிகளுக்கு வென்ட்ரிகுலர் டாக்ரிக்கார்டியா எச்சரிக்கை விடுக்கப்பட்டு, மாரடைப்புக்கு முன்பே ICU படுக்கை முன்பதிவு செய்யப்படுகிறது.'
          : 'Our continuous ECG oscilloscope renders live Lead II cardiac waveforms. Deteriorating patients trigger ventricular tachycardia alarms, allowing you to pre-reserve ICU beds before cardiac arrest.';
        speakText(botReply);
      } else if (lower.includes('what-if') || lower.includes('simulation') || lower.includes('மாதிரி')) {
        botReply = language === 'ta'
          ? 'வாட்-இஃப் சான்ட்பாக்ஸ் 80% நம்பிக்கையுடன் படுக்கை தேவையை முன்கூட்டியே கணிக்கிறது. தேர்ந்தெடுக்கப்பட்ட அறுவை சிகிச்சை விகிதங்களை நீங்கள் மாற்றி அமைக்கலாம்.'
          : 'The What-If Sandbox calculates multi-horizon census forecasts with 80% confidence bands. You can adjust elective surgery ratios or trigger crisis presets.';
        speakText(botReply);
      } else {
        botReply = language === 'ta'
          ? `நான் ${currentDistrict.name} மாவட்டத்தின் அனைத்து மருத்துவமனைகளையும் கண்காணிக்கிறேன். அவசர உதவி மற்றும் வழிகாட்டுதலுக்கு மேலே உள்ள தாவலைத் தேர்ந்தெடுக்கவும் அல்லது மொழியை மாற்றக் கூறவும்.`
          : `I am actively monitoring capacity across ${currentDistrict.name} district hospitals (${currentDistrict.hospitals.map(h => h.shortName).join(', ')}). You can test emergency triage above or ask me to change language.`;
        speakText(botReply);
      }

      setGuideMessages(prev => [...prev, { sender: 'bot', text: botReply, actionButton: actionBtn }]);
    }, 250);
  };

  const handleTriageQuery = (preset?: string) => {
    const text = preset || symptomInput;
    if (!text.trim()) return;

    sound.playRadarPing();
    const lower = text.toLowerCase();

    const apexHosp = currentDistrict.hospitals[0];
    const secHosp = currentDistrict.hospitals[1] || currentDistrict.hospitals[0];

    let result: TriageResult;

    if (lower.includes('child') || lower.includes('pediatric') || lower.includes('fracture') || lower.includes('bone') || lower.includes('arm')) {
      result = {
        condition: 'Pediatric Fracture / Extremity Trauma',
        specialtyRequired: 'Pediatric Emergency & Orthopedic Surgery',
        recommendedHospital: {
          id: secHosp.id,
          name: secHosp.name,
          type: `${secHosp.ownership} Regional Care Center`,
          distance: `${secHosp.distanceFromHubKm || 4.2} km`,
          driveTime: '11 mins',
          edWait: '14 mins',
          totalTimeToCare: '25 mins total (Optimal)',
          notes: `${secHosp.shortName} has dedicated trauma coverage and open surgical suites. ${apexHosp.shortName} ED is experiencing high surge.`,
          routeSteps: [
            `Proceed along ${currentDistrict.name} Arterial Highway (3.2 km)`,
            `Take dedicated Emergency Corridor Exit into ${secHosp.shortName}`,
            `Pull into Pediatric & Trauma Ambulance Bay P1`
          ]
        },
        avoidHospitalReason: `${apexHosp.shortName} ED is currently congested; ${secHosp.shortName} offers immediate pediatric reception.`
      };
    } else if (lower.includes('chest') || lower.includes('cardiac') || lower.includes('angina') || lower.includes('heart attack')) {
      result = {
        condition: 'Acute Coronary Syndrome (Suspected STEMI)',
        specialtyRequired: '24/7 Primary Percutaneous Coronary Intervention (Cath Lab)',
        recommendedHospital: {
          id: apexHosp.id,
          name: apexHosp.name,
          type: `${apexHosp.ownership} Apex Tertiary Medical Center`,
          distance: '2.5 km',
          driveTime: '7 mins',
          edWait: 'Immediate (Code STEMI Direct-to-Cath Bypass)',
          totalTimeToCare: '7 mins total',
          notes: `${apexHosp.shortName} operates round-the-clock digital catheterization suites and active cardiothoracic team.`,
          routeSteps: [
            `Dispatch 108 ALS Ambulance towards ${apexHosp.shortName}`,
            `Transceiver alert sent to Cath Lab: Direct bypass enabled`,
            `Enter via Dedicated Resuscitation Ramp Bay 1`
          ]
        }
      };
    } else {
      result = {
        condition: 'Acute Emergency Evaluation & Observation',
        specialtyRequired: 'Emergency Medicine & Multi-Specialty Intake',
        recommendedHospital: {
          id: apexHosp.id,
          name: apexHosp.name,
          type: `${apexHosp.ownership} Center`,
          distance: '3.1 km',
          driveTime: '8 mins',
          edWait: '12 mins',
          totalTimeToCare: '20 mins total',
          notes: `Fastest triage and available general observation beds in ${currentDistrict.name}.`,
          routeSteps: [
            `Take Main Boulevard towards ${apexHosp.shortName}`,
            `Follow Emergency Red Line directly to Triage Intake`
          ]
        }
      };
    }

    setTriageResult(result);
    speakText(
      `Recommended destination is ${result.recommendedHospital.name}. Total time to care is ${result.recommendedHospital.totalTimeToCare}. Route has been mapped.`
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-[#090f1d] border border-slate-700/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-purple-600/30">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-100">Aegis Voice AI & Smart Router</h3>
                {isSpeaking && (
                  <span className="flex items-center gap-1 text-[10px] text-cyan-400 font-mono animate-pulse">
                    <Volume2 className="w-3 h-3" /> Speaking...
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">Hands-Free Speech Interaction & Live GPS Navigation</p>
            </div>
          </div>

          <button
            onClick={() => {
              if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
              onClose();
            }}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 text-xs">
          <button
            onClick={() => setActiveMode('guide')}
            className={`flex-1 py-2.5 font-semibold flex items-center justify-center gap-2 border-b-2 transition-all ${
              activeMode === 'guide'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" /> System Guide & Voice Copilot
          </button>
          <button
            onClick={() => setActiveMode('triage')}
            className={`flex-1 py-2.5 font-semibold flex items-center justify-center gap-2 border-b-2 transition-all ${
              activeMode === 'triage'
                ? 'border-emerald-400 text-emerald-300 bg-emerald-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" /> Emergency Patient Triage & GPS
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {activeMode === 'guide' ? (
            /* Mode 1: Guide */
            <div className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {[
                  language === 'en' ? '🇮🇳 Switch to தமிழ் (Tamil)' : '🌐 Switch to English',
                  language === 'en' ? 'What is a Ghost Bed?' : 'கோஸ்ட் படுக்கை என்றால் என்ன?',
                  language === 'en' ? 'How does Lead II ECG work?' : 'Lead II ECG எவ்வாறு செயல்படுகிறது?',
                  language === 'en' ? `Show ${currentDistrict.name} District Map` : `${currentDistrict.name} வரைபடம் காட்டு`,
                  language === 'en' ? 'Navigate to 3D Globe' : '3D பூகோள பார்வைக்கு செல்'
                ].map((chip, i) => (
                  <button
                    key={i}
                    onClick={() => handleGuideSend(chip)}
                    className="text-[11px] bg-slate-900 border border-slate-800 hover:border-cyan-500 text-slate-300 hover:text-cyan-300 px-2.5 py-1 rounded-full transition-all flex items-center gap-1 shadow-sm"
                  >
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    {chip}
                  </button>
                ))}
              </div>

              <div className="space-y-3 pt-2">
                {guideMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-cyan-950/40 border border-cyan-800/40 ml-8 text-cyan-100'
                        : 'bg-slate-900/90 border border-slate-800 mr-8 text-slate-200'
                    }`}
                  >
                    <div className="text-[10px] text-slate-500 font-semibold mb-1">
                      {msg.sender === 'user' ? 'You' : 'Aegis Intelligence'}
                    </div>
                    <div>{msg.text}</div>
                    {msg.actionButton && (
                      <div className="mt-2.5 pt-2 border-t border-slate-800">
                        <button
                          onClick={() => {
                            setActiveTab(msg.actionButton!.tab);
                            onClose();
                          }}
                          className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded text-[11px] flex items-center gap-1.5"
                        >
                          {msg.actionButton.label} <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Mode 2: Triage with Visual Vector GPS Map */
            <div className="space-y-4">
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Child Arm Fracture (Pediatric)',
                  'Severe Chest Pain / Heart Attack',
                  'Sudden Stroke Symptoms',
                  'High Fever & Dehydration'
                ].map((symptom, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setSymptomInput(symptom);
                      handleTriageQuery(symptom);
                    }}
                    className="text-[11px] bg-slate-900 border border-slate-800 hover:border-emerald-500 text-slate-300 hover:text-emerald-300 px-2.5 py-1 rounded-lg transition-all"
                  >
                    {symptom}
                  </button>
                ))}
              </div>

              {/* Triage Search & Mic */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={symptomInput}
                  onChange={e => setSymptomInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleTriageQuery()}
                  placeholder="Describe emergency symptoms or speak into mic..."
                  className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
                <button
                  onClick={toggleVoiceInput}
                  className={`p-2.5 rounded-xl border transition-all ${
                    isListening
                      ? 'bg-rose-500 text-white border-rose-400 animate-pulse'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-cyan-300'
                  }`}
                  title="Voice Input"
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => handleTriageQuery()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                >
                  <Navigation className="w-3.5 h-3.5" /> Route
                </button>
              </div>

              {/* Triage Results Card with Vector Map */}
              {triageResult && (
                <div className="bg-slate-900/90 border border-emerald-500/40 rounded-xl p-4 space-y-3.5 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div>
                      <span className="text-[10px] uppercase font-mono text-emerald-400 font-bold">
                        Triaged Diagnosis
                      </span>
                      <h4 className="font-semibold text-slate-100 text-sm">{triageResult.condition}</h4>
                    </div>
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] px-2 py-0.5 rounded font-mono">
                      {triageResult.specialtyRequired}
                    </span>
                  </div>

                  {/* Visual Vector GPS Route Map Embedded Directly */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-cyan-400" /> Real-Time Ambulance Vector Routing
                    </span>
                    <RegionalGPSMap
                      activeRouteDestination={triageResult.recommendedHospital.id}
                      height="210px"
                    />
                  </div>

                  {/* Recommendation Details */}
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg space-y-1 text-slate-200">
                    <div className="flex justify-between font-bold text-emerald-300 text-sm">
                      <span>{triageResult.recommendedHospital.name}</span>
                      <span>{triageResult.recommendedHospital.totalTimeToCare}</span>
                    </div>
                    <p className="text-[11px] text-slate-300">{triageResult.recommendedHospital.notes}</p>
                  </div>

                  {triageResult.avoidHospitalReason && (
                    <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded text-[11px] text-amber-300 flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{triageResult.avoidHospitalReason}</span>
                    </div>
                  )}

                  {/* View Live Route in Tier 2 Map Button */}
                  <button
                    onClick={() => {
                      sound.playRadarPing();
                      setSelectedHospitalId(triageResult.recommendedHospital.id);
                      setSpatialTier(2);
                      onClose();
                    }}
                    className="w-full py-2 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-cyan-900/30 transition-all"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>
                      {language === 'ta'
                        ? 'மாவட்ட வரைபடத்தில் நேரலை வழியைப் பார்'
                        : 'Track Live Route on Tier 2 District Grid'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Input Bar with Microphone */}
        {activeMode === 'guide' && (
          <div className="p-3.5 bg-slate-900/90 border-t border-slate-800 flex items-center gap-2">
            <input
              type="text"
              value={guideInput}
              onChange={e => setGuideInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleGuideSend()}
              placeholder="Ask anything or click mic to speak..."
              className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
            />
            <button
              onClick={toggleVoiceInput}
              className={`p-2.5 rounded-xl border transition-all ${
                isListening
                  ? 'bg-rose-500 text-white border-rose-400 animate-pulse'
                  : 'bg-slate-950 border-slate-700 text-slate-300 hover:text-cyan-300'
              }`}
              title="Voice Input"
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            <button
              onClick={() => handleGuideSend()}
              className="p-2.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-xl transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

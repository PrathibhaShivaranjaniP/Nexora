import React, { useState, useEffect, useRef } from 'react';
import { useHospitalStore } from '../../store/hospitalStore';
import {
  Phone,
  PhoneCall,
  PhoneOff,
  Radio,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  ShieldCheck,
  Clock,
  Sparkles,
  Activity,
  Send,
  X,
  ExternalLink,
  ChevronRight,
  Hospital,
  AlertTriangle,
  Users
} from 'lucide-react';
import { sound } from '../../utils/audioEngine';

interface CommsContact {
  id: string;
  name: string;
  role: string;
  channel: string;
  department: string;
  avatarIcon: string;
  phoneNumber: string;
  initialResponseEn: string;
  initialResponseTa: string;
}

interface CallMessage {
  id: string;
  sender: 'contact' | 'user';
  senderName: string;
  text: string;
  timestamp: string;
}

interface TacticalCommsModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetContactId?: string;
}

export const TacticalCommsModal: React.FC<TacticalCommsModalProps> = ({
  isOpen,
  onClose,
  targetContactId
}) => {
  const { currentDistrict, currentHospital, language } = useHospitalStore();

  const [activeCallState, setActiveCallState] = useState<'idle' | 'calling' | 'connected'>('idle');
  const [isConferenceBridge, setIsConferenceBridge] = useState(false);
  const [activeContact, setActiveContact] = useState<CommsContact | null>(null);
  const [activeSpeaker, setActiveSpeaker] = useState<string | null>(null);
  const [mutedChannels, setMutedChannels] = useState<Record<string, boolean>>({});
  const [callDuration, setCallDuration] = useState(0);
  const [isMicActive, setIsMicActive] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<CallMessage[]>([]);
  const [customInput, setCustomInput] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Dynamic Contacts based on active hospital and district
  const contacts: CommsContact[] = [
    {
      id: 'hosp-er-chief',
      name: `Dr. K. Ramanathan, MD (Emergency)`,
      role: 'Trauma Resuscitation Chief',
      channel: 'TAC-MED 1 (155.340 MHz)',
      department: `${currentHospital.shortName} Apex Trauma Bay 14`,
      avatarIcon: '🏥',
      phoneNumber: '+91-44-2530-5000',
      initialResponseEn: `Aegis Command, this is Dr. Ramanathan at ${currentHospital.name} Trauma Center. We have your live patient vitals and ICU hold token on our central screen. Trauma Bay 14 is prepped with mechanical ventilator and O-negative blood on standby. What is the ambulance ETA?`,
      initialResponseTa: `ஏஜிஸ் கமாண்ட், நான் மருத்துவர் ராமநாதன், ${currentHospital.name} அவசர சிகிச்சை தலைவர் பேசுகிறேன். நோயாளிக்கு தேவையான வென்டிலேட்டர் மற்றும் டிராமா பே 14 தயாராக உள்ளது. ஆம்புலன்ஸ் எப்போது வந்து சேரும்?`
    },
    {
      id: 'als-ambulance-49',
      name: 'Paramedic Vignesh (ALS #49)',
      role: 'Lead Flight Paramedic',
      channel: '108-DISPATCH CH-4',
      department: '108 Advanced Life Support Unit',
      avatarIcon: '🚑',
      phoneNumber: '108',
      initialResponseEn: `108 ALS Unit 49 receiving loud and clear! Patient is secured on spine board, SpO2 holding at 94% on high-flow mask. We are crossing Saidapet Bridge right now on the Green Wave preemption corridor. Approaching Gate 2 in approximately 6 minutes!`,
      initialResponseTa: `108 அவசர ஊர்தி 49 பேசுகிறேன்! நோயாளிக்கு ஆக்ஸிஜன் சீராக உள்ளது. கிரீன் வேவ் பாதையில் சைதாப்பேட்டை பாலத்தை கடந்து வருகிறோம். 6 நிமிடங்களில் மருத்துவமனை வாயிலில் இருப்போம்!`
    },
    {
      id: 'traffic-police-control',
      name: 'Inspector S. Balan',
      role: 'Green Wave Corridor Controller',
      channel: 'POLICE-CORRIDOR 1',
      department: 'Greater Chennai Traffic Control HQ',
      avatarIcon: '👮',
      phoneNumber: '100',
      initialResponseEn: `Traffic Police Control Room, Inspector Balan. All 14 traffic signal intersections along Anna Salai from Kathipara to Central are locked green. Highway interceptor patrol is clearing cross-traffic for inbound ALS 49. Corridor is 100% clear.`,
      initialResponseTa: `போக்குவரத்து கட்டுப்பாட்டு அறை, இன்ஸ்பெக்டர் பாலன் பேசுகிறேன். அண்ணா சாலையில் உள்ள 14 சிக்னல்களும் பச்சை நிறத்தில் பூட்டப்பட்டுள்ளன. ஆம்புலன்ஸ் செல்வதற்கு பாதை முற்றிலும் தயார்.`
    },
    {
      id: 'icu-charge-nurse',
      name: 'Dr. Shanthi, Intensivist',
      role: 'Critical Care ICU In-Charge',
      channel: 'ICU-GRID 2',
      department: `${currentHospital.shortName} Surgical ICU`,
      avatarIcon: '🫁',
      phoneNumber: '+91-44-2530-5001',
      initialResponseEn: `ICU Allocation Desk, Dr. Shanthi. Guaranteed 45-minute bed hold token verified. Bed 14 terminal UV-C sterilization is complete, monitoring transducers calibrated. We are standing by for immediate patient transfer.`,
      initialResponseTa: `தீவிர சிகிச்சைப் பிரிவு, மருத்துவர் சாந்தி பேசுகிறேன். 45 நிமிட படுக்கை முன்பதிவு டோக்கன் உறுதி செய்யப்பட்டது. படுக்கை 14 சுத்திகரிக்கப்பட்டு தயார் நிலையில் உள்ளது.`
    }
  ];

  // Auto-trigger call if targetContactId provided
  useEffect(() => {
    if (isOpen && targetContactId) {
      const match = contacts.find(c => c.id === targetContactId);
      if (match) {
        startCall(match);
      }
    }
  }, [isOpen, targetContactId]);

  // Call timer interval
  useEffect(() => {
    let timer: any;
    if (activeCallState === 'connected') {
      timer = setInterval(() => setCallDuration(prev => prev + 1), 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(timer);
  }, [activeCallState]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Speech synthesis speaking
  const speakSpokenResponse = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis || sound.getIsMuted()) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.lang = language === 'ta' ? 'ta-IN' : 'en-US';

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // Start 1-on-1 Call
  const startCall = (contact: CommsContact) => {
    setIsConferenceBridge(false);
    setActiveContact(contact);
    setActiveCallState('calling');
    setMessages([]);
    sound.playRadioChirp();

    setTimeout(() => {
      sound.playPhoneRing();
    }, 400);

    setTimeout(() => {
      sound.playCallConnected();
      sound.playRadioChirp();
      setActiveCallState('connected');

      const initialText = language === 'ta' ? contact.initialResponseTa : contact.initialResponseEn;
      const initialMsg: CallMessage = {
        id: 'msg-0',
        sender: 'contact',
        senderName: contact.name,
        text: initialText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      };

      setMessages([initialMsg]);
      speakSpokenResponse(initialText);
    }, 2400);
  };

  // Start Multi-Party 3-Way Conference Bridge
  const startConferenceBridge = () => {
    setIsConferenceBridge(true);
    setActiveContact(null);
    setActiveCallState('calling');
    setMessages([]);
    sound.playRadioChirp();

    setTimeout(() => {
      sound.playPhoneRing();
    }, 300);

    setTimeout(() => {
      sound.playCallConnected();
      sound.playRadioChirp();
      setActiveCallState('connected');

      const initialText =
        language === 'ta'
          ? '3-வழி அவசர மாநாட்டு இணைப்பு தொடங்கப்பட்டது! டிராமா தலைமை மருத்துவர் ராமநாதன், 108 ஆம்புலன்ஸ் பாராமெடிக் விக்னேஷ் மற்றும் போக்குவரத்து இன்ஸ்பெக்டர் பாலன் அனைவரும் நேரலையில் இணைக்கப்பட்டுள்ளனர்.'
          : '3-Way Emergency Trauma Conference Bridge Active! Dr. Ramanathan (Trauma Chief), Paramedic Vignesh (ALS Unit 49), and Inspector Balan (Traffic Police HQ) are all connected simultaneously on encrypted tactical bridge.';

      const initialMsg: CallMessage = {
        id: 'conf-init',
        sender: 'contact',
        senderName: 'Tactical Bridge Controller',
        text: initialText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      };

      setMessages([initialMsg]);
      speakSpokenResponse(initialText);

      // Follow-up sequential radio check from ALS 49 Paramedic
      setTimeout(() => {
        setActiveSpeaker('als-ambulance-49');
        const paraText =
          language === 'ta'
            ? 'ALS 49 விக்னேஷ் பேசுகிறேன்! நோயாளிக்கு கடுமையான மார்பு காயம், ஆக்ஸிஜன் 93%. சைதாப்பேட்டை தாண்டி வருகிறோம், இன்னும் 5 நிமிடங்களில் வாயிலில் இருப்போம்!'
            : 'ALS 49 Paramedic Vignesh on bridge! Patient in severe respiratory distress following high-speed impact, SpO2 93% on O2 reservoir. ETA 5 minutes to Gate 2!';

        const pMsg: CallMessage = {
          id: 'conf-p1',
          sender: 'contact',
          senderName: 'Paramedic Vignesh (ALS #49)',
          text: paraText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        };
        setMessages(prev => [...prev, pMsg]);
        speakSpokenResponse(paraText);

        // Follow-up from Trauma Chief Dr. Ramanathan
        setTimeout(() => {
          setActiveSpeaker('hosp-er-chief');
          const docText =
            language === 'ta'
              ? 'டாக்டர் ராமநாதன்: டிராமா பே 14 தயாராக உள்ளது. வென்டிலேட்டர் மற்றும் 4 பாட்டில் O-நெகட்டிவ் இரத்தம் தயார் நிலையில் வைக்கப்பட்டுள்ளது.'
              : 'Dr. Ramanathan receiving! Apex Trauma Bay 14 is scrubbed in with ventilator on standby and 4 units of O-negative blood pre-warmed for immediate transfusion.';

          const dMsg: CallMessage = {
            id: 'conf-d1',
            sender: 'contact',
            senderName: 'Dr. K. Ramanathan (Trauma Chief)',
            text: docText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          };
          setMessages(prev => [...prev, dMsg]);
          speakSpokenResponse(docText);

          // Follow-up from Police Inspector Balan
          setTimeout(() => {
            setActiveSpeaker('traffic-police-control');
            const polText =
              language === 'ta'
                ? 'இன்ஸ்பெக்டர் பாலன்: அண்ணா சாலையில் உள்ள 14 சிக்னல்களும் பச்சை நிறத்தில் பூட்டப்பட்டுள்ளன. காவல்துறை ரோந்து வாகனம் ஆம்புலன்ஸுக்கு முன் பாதையை தெளிவுபடுத்துகிறது.'
                : 'Traffic HQ Inspector Balan: All 14 intersections along Anna Salai are green-locked. Interceptor unit 02 is escorting the ambulance through Kathipara.';

            const tMsg: CallMessage = {
              id: 'conf-t1',
              sender: 'contact',
              senderName: 'Inspector S. Balan (Traffic HQ)',
              text: polText,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            };
            setMessages(prev => [...prev, tMsg]);
            speakSpokenResponse(polText);
            setTimeout(() => setActiveSpeaker(null), 3000);
          }, 3600);
        }, 3600);
      }, 3000);
    }, 2200);
  };

  // End Call
  const endCall = () => {
    sound.playCallEnd();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsMicActive(false);
    setActiveSpeaker(null);
    setActiveCallState('idle');
    setIsConferenceBridge(false);
  };

  // Push-to-Talk / Mic recognition
  const toggleMicrophone = () => {
    sound.playTactileClick();
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Microphone speech recognition is not supported in this browser. You can click any of the tactical quick-response buttons below!');
      return;
    }

    if (isMicActive) {
      setIsMicActive(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = language === 'ta' ? 'ta-IN' : 'en-US';
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsMicActive(true);
        sound.playRadioChirp();
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          sendUserMessage(transcript);
        }
      };

      recognition.onerror = () => {
        setIsMicActive(false);
      };

      recognition.onend = () => {
        setIsMicActive(false);
      };

      recognition.start();
    } catch (err) {
      console.warn('Speech recognition start failed:', err);
      setIsMicActive(false);
    }
  };

  // Send message from user
  const sendUserMessage = (userText: string) => {
    if (!userText.trim()) return;

    sound.playRadioChirp();
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const userMsg: CallMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      senderName: 'Aegis Health Command',
      text: userText,
      timestamp: nowTime
    };

    setMessages(prev => [...prev, userMsg]);
    setCustomInput('');

    if (isConferenceBridge) {
      // Conference multi-party response
      setTimeout(() => {
        sound.playRadioChirp();
        setActiveSpeaker('hosp-er-chief');
        const confReply =
          language === 'ta'
            ? 'அனைத்து பிரிவினரும் கேட்டுக்கொண்டோம் கமாண்ட்! டிராமா பே தயார், காவல்துறை கிரீன் வேவ் பூட்டப்பட்டுள்ளது, நோயாளி வருகைக்காக காத்திருக்கிறோம்.'
            : 'All units copy, Aegis Command! Trauma Bay 14 is ready with ventilator and blood, police interceptor is holding the gates, ALS 49 continue maximum safe approach!';

        const repMsg: CallMessage = {
          id: `rep-conf-${Date.now()}`,
          sender: 'contact',
          senderName: 'Dr. Ramanathan & Inspector Balan (Joint Acknowledgment)',
          text: confReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        };
        setMessages(prev => [...prev, repMsg]);
        speakSpokenResponse(confReply);
        setTimeout(() => setActiveSpeaker(null), 3000);
      }, 1400);
      return;
    }

    if (!activeContact) return;

    // 1-on-1 response
    setTimeout(() => {
      sound.playRadioChirp();
      let responseText = '';

      if (activeContact.id === 'hosp-er-chief') {
        responseText =
          language === 'ta'
            ? 'புரிந்தது கமாண்ட். டிராமா டீம் ஸ்க்ரப் செய்து தயாராக உள்ளனர். ஆம்புலன்ஸ் வந்தவுடன் உடனடியாக வென்டிலேட்டரில் இணைக்கப்படும்.'
            : 'Copy that, Aegis Command! Trauma team is scrubbed in at Bay 14. We will initiate immediate endotracheal protocol upon touchdown.';
      } else if (activeContact.id === 'als-ambulance-49') {
        responseText =
          language === 'ta'
            ? 'ரோஜர் கமாண்ட்! கிரீன் வேவ் தெளிவாக உள்ளது. விபத்து சிகிச்சை நுழைவாயிலில் 5 நிமிடங்களில் இணைகிறோம்.'
            : 'Roger that, Command! Green wave is holding clear. Passing through Spencers signal now. ETA 4 minutes.';
      } else if (activeContact.id === 'traffic-police-control') {
        responseText =
          language === 'ta'
            ? 'அனைத்து சிக்னல்களும் பச்சை நிறத்தில் நீட்டிக்கப்பட்டுள்ளன. அவசர ஊர்திக்கு தடையற்ற பாதை உறுதி செய்யப்பட்டுள்ளது.'
            : 'Acknowledged, Command! Signal preemption extended by 180 seconds across Anna Salai corridor.';
      } else {
        responseText =
          language === 'ta'
            ? 'டோக்கன் பதிவு செய்யப்பட்டது. நோயாளிக்கான அனைத்து மருத்துவ உபகரணங்களும் தயார் நிலையில் உள்ளன.'
            : 'Confirmed, Command! Bed status locked in state grid. Transponders reporting zero queue delay.';
      }

      const replyMsg: CallMessage = {
        id: `rep-${Date.now()}`,
        sender: 'contact',
        senderName: activeContact.name,
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      };

      setMessages(prev => [...prev, replyMsg]);
      speakSpokenResponse(responseText);
    }, 1200);
  };

  if (!isOpen) return null;

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const conferenceParticipants = [
    {
      id: 'als-ambulance-49',
      name: 'Paramedic Vignesh (ALS #49)',
      role: '108 Flight Paramedic (In-Transit)',
      channel: '108-DISPATCH',
      icon: '🚑',
      badgeColor: 'border-emerald-500/50 text-emerald-300'
    },
    {
      id: 'hosp-er-chief',
      name: 'Dr. K. Ramanathan, MD',
      role: 'Apex Trauma Bay 14 Chief',
      channel: 'TAC-MED 1',
      icon: '🏥',
      badgeColor: 'border-rose-500/50 text-rose-300'
    },
    {
      id: 'traffic-police-control',
      name: 'Inspector S. Balan',
      role: 'Traffic Police Corridor Controller',
      channel: 'POLICE-CORR',
      icon: '👮',
      badgeColor: 'border-blue-500/50 text-blue-300'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-[#080e1e] border border-cyan-500/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100 ring-1 ring-cyan-500/30 max-h-[92vh]">
        {/* Header Ribbon */}
        <div className="bg-slate-900/90 border-b border-slate-800 px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center text-cyan-400 shadow-md">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-slate-100 uppercase tracking-wide">
                  {language === 'ta' ? 'அவசர தகவல்தொடர்பு ரேடியோ & மாநாடு' : 'Tactical Radio & Multi-Party Conference'}
                </h3>
                <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[9.5px] px-1.5 py-0.2 rounded font-mono font-bold">
                  {isConferenceBridge ? '3-WAY BRIDGE' : 'VHF ENCRYPTED'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                {isConferenceBridge
                  ? 'Simultaneous 3-Way Tactical Link: Paramedic + Trauma Chief + Police HQ'
                  : 'Direct Two-Way VoIP Comms with Hospital Chiefs & 108 ALS Units'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (activeCallState !== 'idle') endCall();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* BODY: CHANNEL SELECTOR (IDLE) VS ACTIVE CALL / CONFERENCE SCREEN */}
        {activeCallState === 'idle' ? (
          <div className="p-5 space-y-4 overflow-y-auto">
            {/* Multi-Party Conference Bridge Action Banner */}
            <div className="bg-gradient-to-r from-rose-950/60 via-slate-900 to-cyan-950/60 border border-rose-500/50 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500/20 to-cyan-500/20 border border-rose-400/50 flex items-center justify-center text-rose-400 text-2xl shadow-lg">
                  <Users className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-rose-200 uppercase tracking-wider">
                      {language === 'ta' ? '3-வழி அவசர மாநாட்டு இணைப்பு' : '3-Way Emergency Trauma Conference'}
                    </span>
                    <span className="bg-rose-500/20 text-rose-300 text-[9px] px-1.5 py-0.2 rounded font-mono font-bold">
                      MULTI-PARTY
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-medium mt-0.5">
                    Simultaneously bridge <strong>ALS Paramedic</strong>, <strong>Trauma Resuscitation Chief</strong>, and <strong>Police Traffic Control</strong> on one channel.
                  </p>
                </div>
              </div>

              <button
                onClick={startConferenceBridge}
                className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-rose-600 via-red-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-900/50 transition-all cursor-pointer hover:scale-105"
              >
                <Radio className="w-4 h-4" />
                <span>{language === 'ta' ? 'மாநாட்டைத் தொடங்கு ➔' : 'Launch 3-Way Bridge ➔'}</span>
              </button>
            </div>

            {/* 1-on-1 Tactical Channel Directory */}
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="font-mono text-slate-400 uppercase font-bold tracking-wider">
                Direct 1-on-1 Tactical Channels ({contacts.length})
              </span>
              <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                All Repeaters Online
              </span>
            </div>

            <div className="space-y-2.5">
              {contacts.map(c => (
                <div
                  key={c.id}
                  className="bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-xl p-3.5 transition-all flex items-center justify-between gap-3 shadow-md group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-700 flex items-center justify-center text-xl flex-shrink-0 group-hover:scale-105 transition-transform">
                      {c.avatarIcon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-100 truncate">{c.name}</span>
                        <span className="text-[9.5px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 px-1.5 py-0.2 rounded font-semibold">
                          {c.channel}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 truncate mt-0.5">{c.role} • {c.department}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => startCall(c)}
                      className="px-3.5 py-2 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-950/40 transition-all cursor-pointer hover:scale-105"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>{language === 'ta' ? 'அழை' : 'Radio Call'}</span>
                    </button>

                    <a
                      href={`tel:${c.phoneNumber}`}
                      className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer"
                      title={`Dial real phone number: ${c.phoneNumber}`}
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {/* Direct Phone Dialing Advisory */}
            <div className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono text-[11px]">
                💡 Tip: Click <strong>"Radio Call"</strong> for direct interactive in-app voice intercom, or click the phone icon to launch your device's cellular dialer.
              </span>
            </div>
          </div>
        ) : (
          /* ACTIVE CALL SCREEN (1-on-1 or Conference) */
          <div className="flex flex-col flex-1 p-4 sm:p-5 space-y-3 overflow-hidden">
            {/* Active Call Status Bar */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-950 border border-cyan-500/50 flex items-center justify-center text-xl">
                  {isConferenceBridge ? '🎙️' : activeContact?.avatarIcon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-slate-100">
                      {isConferenceBridge ? 'Emergency Trauma 3-Way Conference' : activeContact?.name}
                    </span>
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] px-1.5 py-0.2 rounded font-mono font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      LIVE
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {isConferenceBridge
                      ? 'ALS #49 + Trauma Bay 14 + Police Traffic HQ'
                      : `${activeContact?.role} • ${activeContact?.channel}`}
                  </div>
                </div>
              </div>

              {/* Call Timer & Disconnect Button */}
              <div className="flex items-center gap-3">
                <div className="text-right font-mono">
                  <div className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatTimer(callDuration)}</span>
                  </div>
                  <div className="text-[9px] text-cyan-400">
                    {activeCallState === 'calling' ? 'Ringing...' : 'Encrypted VoIP'}
                  </div>
                </div>

                <button
                  onClick={endCall}
                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-rose-950/50 transition-all cursor-pointer"
                >
                  <PhoneOff className="w-3.5 h-3.5" />
                  <span>{language === 'ta' ? 'துண்டி' : 'End Call'}</span>
                </button>
              </div>
            </div>

            {/* Conference Bridge Active Participants Matrix */}
            {isConferenceBridge && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-xs">
                {conferenceParticipants.map(part => {
                  const isSpeakingNow = activeSpeaker === part.id;
                  const isMuted = mutedChannels[part.id];

                  return (
                    <div
                      key={part.id}
                      className={`p-2.5 rounded-xl border transition-all ${
                        isSpeakingNow
                          ? 'bg-cyan-950/40 border-cyan-400 shadow-md shadow-cyan-500/20'
                          : 'bg-slate-950/80 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5 truncate">
                          <span>{part.icon}</span>
                          <span className="truncate">{part.name.split(' ')[0]}</span>
                        </span>
                        <button
                          onClick={() => {
                            sound.playTactileClick();
                            setMutedChannels(prev => ({ ...prev, [part.id]: !prev[part.id] }));
                          }}
                          className="text-[10px] p-1 text-slate-400 hover:text-slate-200"
                          title={isMuted ? 'Unmute' : 'Mute channel'}
                        >
                          {isMuted ? <VolumeX className="w-3 h-3 text-rose-400" /> : <Volume2 className="w-3 h-3 text-cyan-400" />}
                        </button>
                      </div>

                      <div className="text-[10px] text-slate-400 truncate mt-0.5">{part.role}</div>

                      {/* Mini Voice Activity Bars */}
                      <div className="flex items-center gap-0.5 mt-2 h-2">
                        {[1, 2, 3, 4, 5, 6].map(barIdx => (
                          <div
                            key={barIdx}
                            className={`flex-1 rounded-full transition-all duration-150 ${
                              isSpeakingNow
                                ? 'bg-cyan-400 animate-pulse'
                                : 'bg-slate-800'
                            }`}
                            style={{
                              height: isSpeakingNow ? `${30 + Math.random() * 70}%` : '20%'
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Dynamic Equalizer Visualizer Bar */}
            <div className="bg-slate-950/90 border border-slate-800/80 rounded-xl p-2.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span>
                  {isSpeaking
                    ? 'Transmitting Voice Audio...'
                    : activeCallState === 'calling'
                    ? 'Establishing Handshake...'
                    : 'Channel Standby / Listening'}
                </span>
              </div>

              {/* 14-Bar Audio Equalizer Waveform */}
              <div className="flex items-center gap-1 h-4">
                {[4, 8, 12, 16, 14, 9, 15, 12, 16, 10, 6, 14, 8, 11].map((val, idx) => (
                  <div
                    key={idx}
                    className={`w-1 rounded-full transition-all duration-150 ${
                      isSpeaking || activeCallState === 'calling'
                        ? 'bg-cyan-400 animate-pulse'
                        : 'bg-slate-800'
                    }`}
                    style={{
                      height: isSpeaking ? `${Math.min(100, val * 6 + Math.random() * 20)}%` : '30%'
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Conversation Transcript Feed */}
            <div className="flex-1 bg-[#040813] border border-slate-800/90 rounded-xl p-3 overflow-y-auto space-y-2.5 min-h-[160px] max-h-[220px]">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.sender === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-[9.5px] font-mono text-slate-400 mb-0.5">
                    <span className="font-bold text-slate-300">{msg.senderName}</span>
                    <span>•</span>
                    <span>{msg.timestamp}</span>
                  </div>

                  <div
                    className={`p-2.5 rounded-xl text-xs max-w-[85%] leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-cyan-600 text-slate-950 font-medium rounded-tr-none'
                        : 'bg-slate-900 border border-slate-700/80 text-slate-100 rounded-tl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Tactical Quick Preset Replies */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">
                Tactical Transmission Presets (One-Click Voice Broadcast):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(isConferenceBridge
                  ? [
                      'ETA 5 mins: Bay 14 prep ventilator, Police lock Saidapet',
                      'Patient SpO2 93% on O2: Need 4 units O-negative blood',
                      'Traffic Police: Extend green corridor by 180 seconds'
                    ]
                  : [
                      'Ambulance ETA 6 minutes, patient on O2 mask',
                      'Prepare mechanical ventilator at Bay 14',
                      'Confirm 45-minute ICU bed hold token active',
                      'Lock Anna Salai traffic signals green'
                    ]
                ).map((phrase, idx) => (
                  <button
                    key={idx}
                    onClick={() => sendUserMessage(phrase)}
                    className="px-2.5 py-1 bg-slate-900 hover:bg-cyan-950 border border-slate-700/80 hover:border-cyan-400 text-slate-300 hover:text-cyan-200 rounded-lg text-[11px] font-medium transition-colors cursor-pointer"
                  >
                    💬 {phrase}
                  </button>
                ))}
              </div>
            </div>

            {/* User Input & Push-to-Talk Microphone Toolbar */}
            <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
              <button
                onClick={toggleMicrophone}
                className={`p-2.5 rounded-xl border transition-all flex items-center justify-center flex-shrink-0 cursor-pointer ${
                  isMicActive
                    ? 'bg-rose-500 text-white border-rose-400 animate-pulse shadow-lg shadow-rose-500/40'
                    : 'bg-slate-900 hover:bg-slate-800 text-cyan-400 border-slate-700'
                }`}
                title={isMicActive ? 'Listening to speech...' : 'Click to Speak (Push-to-Talk)'}
              >
                {isMicActive ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <input
                type="text"
                value={customInput}
                onChange={e => setCustomInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') sendUserMessage(customInput);
                }}
                placeholder={
                  isConferenceBridge
                    ? 'Type message to broadcast to all 3 units...'
                    : 'Type tactical message or use presets...'
                }
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
              />

              <button
                onClick={() => sendUserMessage(customInput)}
                className="p-2.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 rounded-xl font-bold transition-all cursor-pointer flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

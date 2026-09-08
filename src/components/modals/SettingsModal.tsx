import React, { useState } from 'react';
import { useHospitalStore } from '../../store/hospitalStore';
import { Settings, X, Globe, Volume2, VolumeX, Sparkles, Check } from 'lucide-react';
import { sound } from '../../utils/audioEngine';
import { Language } from '../../data/translations';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { language, setLanguage, t } = useHospitalStore();
  const [isMuted, setIsMuted] = useState(sound.getIsMuted());

  if (!isOpen) return null;

  const handleLanguageChange = (newLang: Language) => {
    sound.playTactileClick();
    setLanguage(newLang);
  };

  const handleAudioToggle = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-[#090f1d] border border-slate-700/80 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">{t.settingsTitle}</h3>
              <p className="text-[11px] text-slate-400">Personalize display, language, and sensory cues</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 text-xs">
          {/* Language Selection */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-200 font-semibold">
              <Globe className="w-4 h-4 text-cyan-400" />
              <span>{t.settingsLanguage}</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => handleLanguageChange('en')}
                className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                  language === 'en'
                    ? 'bg-cyan-500/15 border-cyan-500/60 text-cyan-200 font-bold shadow-lg shadow-cyan-950/30'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <div className="text-left">
                  <div className="text-sm">English</div>
                  <div className="text-[10px] text-slate-500">Default Global</div>
                </div>
                {language === 'en' && <Check className="w-4 h-4 text-cyan-400" />}
              </button>

              <button
                onClick={() => handleLanguageChange('ta')}
                className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                  language === 'ta'
                    ? 'bg-cyan-500/15 border-cyan-500/60 text-cyan-200 font-bold shadow-lg shadow-cyan-950/30'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <div className="text-left">
                  <div className="text-sm">தமிழ் (Tamil)</div>
                  <div className="text-[10px] text-slate-500">தமிழ்நாடு நெட்வொர்க்</div>
                </div>
                {language === 'ta' && <Check className="w-4 h-4 text-cyan-400" />}
              </button>
            </div>
          </div>

          {/* Audio Feedback */}
          <div className="space-y-2 pt-3 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-200 font-semibold">
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                <span>{t.settingsAudio}</span>
              </div>
              <button
                onClick={handleAudioToggle}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  isMuted ? 'bg-slate-800 text-slate-400' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}
              >
                {isMuted ? t.settingsAudioOff : t.settingsAudioOn}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Synthesizes code-generated tactical radar pings, turnover chimes, and clinical deterioration alert signals.
            </p>
          </div>

          {/* 3D Visual Hologram */}
          <div className="space-y-2 pt-3 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-200 font-semibold">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>{t.settings3d}</span>
              </div>
              <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-0.5 rounded font-mono font-bold">
                60 FPS Active
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              GPU-accelerated WebGL cloud rotation, pulse ripples, and hospital monitor sweeps.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex justify-end">
          <button
            onClick={() => {
              sound.playTactileClick();
              onClose();
            }}
            className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md shadow-cyan-600/20"
          >
            {t.settingsClose}
          </button>
        </div>
      </div>
    </div>
  );
};

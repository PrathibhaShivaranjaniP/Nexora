import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useHospitalStore } from '../../store/hospitalStore';
import { Search, MapPin, Building, Bed, ArrowRight, ShieldCheck, Clock, X } from 'lucide-react';
import { sound } from '../../utils/audioEngine';
import { realDistrictsData } from '../../data/realDistrictsData';

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  category: 'district' | 'hospital' | 'service';
  districtId: 'chennai' | 'coimbatore' | 'madurai' | 'theni';
  hospitalId?: string;
  badge: string;
  badgeColor: string;
  tierTarget: 1 | 2 | 3;
}

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const {
    setSelectedDistrict,
    setSelectedHospitalId,
    setSpatialTier,
    setDedicatedRouteActive,
    language
  } = useHospitalStore();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Index all districts, hospitals, and medical capabilities
  const allItems: SearchResult[] = useMemo(() => {
    const results: SearchResult[] = [];

    // Districts
    Object.values(realDistrictsData).forEach(dist => {
      results.push({
        id: `dist-${dist.id}`,
        title: `${dist.name} District Command`,
        subtitle: `Population: ${dist.population} • ${dist.hospitals.length} Hub Hospitals • AQI: ${dist.aqi}`,
        category: 'district',
        districtId: dist.id,
        badge: 'Tier 2 District',
        badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        tierTarget: 2
      });

      // Hospitals in district
      dist.hospitals.forEach(hosp => {
        const occPercent = Math.round((hosp.occupiedBeds / hosp.totalBeds) * 100);
        const isApex = hosp.traumaLevel.includes('Apex');

        results.push({
          id: `hosp-${hosp.id}`,
          title: hosp.name,
          subtitle: `${hosp.ownership} • ${hosp.occupiedBeds}/${hosp.totalBeds} Beds (${occPercent}%) • ER Wait: ${hosp.edWaitMinutes}m`,
          category: 'hospital',
          districtId: dist.id,
          hospitalId: hosp.id,
          badge: hosp.traumaLevel,
          badgeColor: isApex
            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
            : hosp.ownership === 'Government'
            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          tierTarget: 3
        });

        // Specialized clinical departments
        results.push({
          id: `icu-${hosp.id}`,
          title: `${hosp.shortName} - Critical Care ICU & Ventilators`,
          subtitle: `${hosp.name} • 108 Priority Intake • Advanced Life Support`,
          category: 'service',
          districtId: dist.id,
          hospitalId: hosp.id,
          badge: 'ICU / Ventilator',
          badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
          tierTarget: 3
        });
      });
    });

    return results;
  }, []);

  // Filter items based on query
  const filteredResults = useMemo(() => {
    if (!query.trim()) {
      return allItems.slice(0, 7); // Show top default suggestions
    }
    const q = query.toLowerCase();
    return allItems
      .filter(item =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.badge.toLowerCase().includes(q)
      )
      .slice(0, 9);
  }, [allItems, query]);

  // Navigate on select
  const handleSelect = (item: SearchResult) => {
    sound.playRadarPing();
    setSelectedDistrict(item.districtId);
    if (item.hospitalId) {
      setSelectedHospitalId(item.hospitalId);
    }
    setDedicatedRouteActive(false);
    setSpatialTier(item.tierTarget);
    onClose();
  };

  // Keyboard navigation inside modal
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % (filteredResults.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredResults.length) % (filteredResults.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredResults[selectedIndex]) {
        handleSelect(filteredResults[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-[#090f1e] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col ring-1 ring-cyan-500/30"
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-800 bg-slate-900/60">
          <Search className="w-5 h-5 text-cyan-400 animate-pulse flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder={
              language === 'ta'
                ? 'மாவட்டம், மருத்துவமனை, ஐசியூ படுக்கைகளைத் தேடுங்கள்... (எ.கா. Apollo, ICU, Madurai)'
                : 'Search districts, hospitals, ICU beds, trauma bays... (e.g. Apollo, RGGGH, ICU, Theni)'
            }
            className="flex-1 bg-transparent border-none text-slate-100 placeholder-slate-500 text-sm focus:outline-none"
          />
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono bg-slate-800 text-slate-400 border border-slate-700 rounded-md">
            ESC to close
          </kbd>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-1 divide-y divide-slate-800/40">
          {filteredResults.length === 0 ? (
            <div className="py-10 text-center text-slate-500 text-xs">
              No matching facility or district found for "{query}".
            </div>
          ) : (
            filteredResults.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-cyan-500/20 border border-cyan-500/50 shadow-md text-cyan-100'
                      : 'hover:bg-slate-900/70 border border-transparent text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center border flex-shrink-0 ${
                        item.category === 'district'
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                          : item.category === 'hospital'
                          ? 'bg-purple-500/10 border-purple-500/40 text-purple-400'
                          : 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400'
                      }`}
                    >
                      {item.category === 'district' ? (
                        <MapPin className="w-4 h-4" />
                      ) : item.category === 'hospital' ? (
                        <Building className="w-4 h-4" />
                      ) : (
                        <Bed className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm truncate">{item.title}</span>
                        <span className={`text-[9.5px] px-1.5 py-0.2 rounded font-mono font-bold border ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">{item.subtitle}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pl-3 flex-shrink-0">
                    <span className="text-[10px] font-mono text-slate-500 uppercase hidden sm:inline">
                      {item.category === 'district' ? 'Metro Grid' : 'Enter 3D Ward'}
                    </span>
                    <ArrowRight className={`w-4 h-4 ${isSelected ? 'text-cyan-300' : 'text-slate-600'}`} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Shortcut Hints */}
        <div className="px-4 py-2 bg-slate-950/80 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <div className="flex items-center gap-3">
            <span>Use <kbd className="text-slate-300 font-bold">↑</kbd> <kbd className="text-slate-300 font-bold">↓</kbd> to navigate</span>
            <span><kbd className="text-slate-300 font-bold">ENTER</kbd> to jump</span>
          </div>
          <span>AegisOS Omnibox</span>
        </div>
      </div>
    </div>
  );
};

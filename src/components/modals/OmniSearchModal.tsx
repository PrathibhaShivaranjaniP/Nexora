import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, User, Droplet, MapPin, X, Hospital, Route, Wind, Activity, ArrowRight, ShieldCheck, Cpu } from 'lucide-react';
import { useHospitalStore } from '../../store/hospitalStore';
import { sound } from '../../utils/audioEngine';

export interface OmniSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateView?: (view: string) => void;
}

export const OmniSearchModal: React.FC<OmniSearchModalProps> = ({ isOpen, onClose, onNavigateView }) => {
  const {
    currentDistrict,
    setSelectedHospitalId,
    setSpatialTier,
    setDedicatedRouteActive,
    openBloodModal,
    openOxygenModal,
    setSelectedBedId
  } = useHospitalStore();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Build Comprehensive Deep-Linkable Search Index
  const searchableItems = useMemo(() => {
    const items: {
      id: string;
      category: 'Hospital' | 'Patient' | 'Resource' | 'Navigation';
      title: string;
      subtitle: string;
      badge: string;
      icon: any;
      color: string;
      action: () => void;
    }[] = [];

    // 1. All District Hospitals
    currentDistrict.hospitals.forEach(h => {
      items.push({
        id: `hosp-${h.id}`,
        category: 'Hospital',
        title: h.name,
        subtitle: `${h.ownership} • ${h.totalBeds} Beds • ${h.traumaLevel}`,
        badge: 'DISTRICT MAP',
        icon: Hospital,
        color: 'text-cyan-400',
        action: () => {
          setSelectedHospitalId(h.id);
          setDedicatedRouteActive(false);
          setSpatialTier(2);
          if (onNavigateView) onNavigateView('district');
        }
      });
    });

    // 2. Active ER Patients
    const erPatients = [
      { id: 'trauma-a', name: 'Leo Chen', age: 34, gender: 'M', bay: 'Trauma Bay A', diagnosis: 'Polytrauma MVC / Tension Pneumo' },
      { id: 'bay-1', name: 'David Miller', age: 62, gender: 'M', bay: 'Bay 1', diagnosis: 'Post-op Fluid Observation' },
      { id: 'bay-2', name: 'Ananya Iyer', age: 45, gender: 'F', bay: 'Bay 2', diagnosis: 'Severe Sepsis Protocol' },
      { id: 'bay-3', name: 'Kavin Raj', age: 51, gender: 'M', bay: 'Bay 3', diagnosis: 'Atypical Chest Discomfort' },
      { id: 'bay-6', name: 'Vikram Seth', age: 39, gender: 'M', bay: 'Bay 6', diagnosis: 'Compound Tibial Fracture' },
      { id: 'bay-7', name: 'Sanjay Patel', age: 70, gender: 'M', bay: 'Bay 7', diagnosis: 'Electrolyte Imbalance Recovery' }
    ];

    erPatients.forEach(p => {
      items.push({
        id: `patient-${p.id}`,
        category: 'Patient',
        title: `${p.name} (${p.age}${p.gender})`,
        subtitle: `${p.bay} • ${p.diagnosis}`,
        badge: 'ER DOCTOR VIEW',
        icon: User,
        color: 'text-amber-400',
        action: () => {
          setSelectedBedId(p.id);
          setDedicatedRouteActive(false);
          if (onNavigateView) onNavigateView('doctor-dashboard');
        }
      });
    });

    // 3. Clinical Resources & Banks
    items.push({
      id: 'res-blood',
      category: 'Resource',
      title: 'O- Negative Cryo Blood Stock',
      subtitle: 'Central Blood Bank • 7 Units Available on Cryo-Hold',
      badge: 'OPEN BLOOD BANK',
      icon: Droplet,
      color: 'text-rose-400',
      action: () => {
        openBloodModal(true);
      }
    });

    items.push({
      id: 'res-oxygen',
      category: 'Resource',
      title: 'Liquid Medical Oxygen (LMO) Cryogenic Bank',
      subtitle: 'Main Reservoir 88% • 42h Autonomy Remaining',
      badge: 'OPEN O2 BANK',
      icon: Wind,
      color: 'text-cyan-400',
      action: () => {
        openOxygenModal(true);
      }
    });

    // 4. System Navigation Views
    items.push({
      id: 'nav-route',
      category: 'Navigation',
      title: '108 Emergency Route Navigator',
      subtitle: 'Tactical Street Navigation Corridor • Priority Green Wave',
      badge: 'JUMP TO ROUTE',
      icon: Route,
      color: 'text-emerald-400',
      action: () => {
        setDedicatedRouteActive(true);
        if (onNavigateView) onNavigateView('route-navigator');
      }
    });

    items.push({
      id: 'nav-analytics',
      category: 'Navigation',
      title: 'Predictive Analytics & Surge Forecasting',
      subtitle: 'Monte Carlo Bed Census Simulator & ML Confidence Bands',
      badge: 'ANALYTICS',
      icon: Activity,
      color: 'text-purple-400',
      action: () => {
        setDedicatedRouteActive(false);
        if (onNavigateView) onNavigateView('analytics');
      }
    });

    return items;
  }, [currentDistrict, setSelectedHospitalId, setSpatialTier, setDedicatedRouteActive, openBloodModal, openOxygenModal, setSelectedBedId, onNavigateView]);

  // Filtered Results based on search input
  const filteredResults = useMemo(() => {
    if (!query.trim()) return searchableItems;
    const q = query.toLowerCase();
    return searchableItems.filter(item =>
      item.title.toLowerCase().includes(q) ||
      item.subtitle.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.badge.toLowerCase().includes(q)
    );
  }, [searchableItems, query]);

  const handleSelectItem = (item: typeof searchableItems[0]) => {
    sound.playRadarPing();
    item.action();
    onClose();
  };

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % (filteredResults.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredResults.length) % (filteredResults.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredResults[selectedIndex]) {
          handleSelectItem(filteredResults[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredResults, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] p-4">
      {/* Dark Blur Backdrop */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-md" onClick={onClose} />

      {/* Main Omnibox Dialog */}
      <div className="relative w-full max-w-2xl bg-[#090f1e]/95 backdrop-blur-2xl border border-cyan-500/40 shadow-2xl rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 font-mono">
        {/* Search Header Input */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-800 bg-[#0d162a]">
          <Search className="text-cyan-400 mr-3 shrink-0" size={22} />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent text-base sm:text-lg text-slate-100 placeholder-slate-500 focus:outline-none font-medium"
            placeholder="Search hospitals, patients, beds, blood bank, route..."
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="mr-2 text-xs text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-slate-800"
            >
              Clear
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search Results List */}
        <div className="p-2 max-h-[55vh] overflow-y-auto custom-scrollbar">
          {filteredResults.length > 0 ? (
            <div className="space-y-1">
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>{query ? `Search Results (${filteredResults.length})` : 'Suggested Quick Access'}</span>
                <span className="text-slate-500">Press ↵ Enter to navigate</span>
              </div>

              {filteredResults.map((result, idx) => {
                const Icon = result.icon;
                const isSelected = selectedIndex === idx;

                return (
                  <div
                    key={result.id}
                    onClick={() => handleSelectItem(result)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-150 ${
                      isSelected
                        ? 'bg-gradient-to-r from-cyan-950/80 to-slate-900 border border-cyan-500/50 shadow-md translate-x-1'
                        : 'hover:bg-slate-900/60 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-2.5 rounded-xl ${isSelected ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-900 text-slate-400'}`}>
                        <Icon size={18} className={result.color} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-bold text-slate-100 truncate flex items-center gap-2">
                          <span>{result.title}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">
                          {result.subtitle}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <span className="text-[9px] px-2 py-0.5 rounded-md bg-slate-950 border border-slate-700 text-cyan-300 font-bold">
                        {result.badge}
                      </span>
                      <ArrowRight className={`w-3.5 h-3.5 ${isSelected ? 'text-cyan-400 translate-x-0.5' : 'text-slate-600'} transition-transform`} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">No matching facilities, patients, or resources found for "{query}"</p>
            </div>
          )}
        </div>

        {/* Footer Navigation Hints */}
        <div className="px-4 py-2.5 border-t border-slate-800 bg-[#070c18] flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">↑↓</kbd> Navigate</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">↵ Enter</kbd> Open</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">Esc</kbd> Close</span>
          </div>
          <span className="text-[10px] text-cyan-400 font-bold">NEXORA DEEP-SEARCH</span>
        </div>
      </div>
    </div>
  );
};

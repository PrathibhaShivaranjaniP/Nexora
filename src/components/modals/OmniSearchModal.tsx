import React, { useState, useEffect, useRef } from 'react';
import { Search, User, Droplet, MapPin, X } from 'lucide-react';

export interface OmniSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OmniSearchModal: React.FC<OmniSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const mockResults = [
    { id: 1, type: 'patient', title: 'Patient P-1042', subtitle: 'Ward 3 - Critical Condition', icon: User, color: 'text-amber-400' },
    { id: 2, type: 'inventory', title: 'O- Blood Stock', subtitle: 'Blood Bank - 7 Units Available', icon: Droplet, color: 'text-red-400' },
    { id: 3, type: 'location', title: 'ICU Bed 12', subtitle: 'Available - Requires Cleaning', icon: MapPin, color: 'text-cyan-400' },
  ];

  const filteredResults = query
    ? mockResults.filter(r => r.title.toLowerCase().includes(query.toLowerCase()) || r.subtitle.toLowerCase().includes(query.toLowerCase()))
    : mockResults;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh]">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-slate-900/90 backdrop-blur-xl border border-slate-700 shadow-2xl rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center px-4 py-3 border-b border-slate-700/50">
          <Search className="text-slate-400 mr-3" size={24} />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent text-xl text-slate-100 placeholder-slate-500 focus:outline-none"
            placeholder="Search patients, resources, or wards..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-2 max-h-[60vh] overflow-y-auto">
          {filteredResults.length > 0 ? (
            <div className="space-y-1">
              <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {query ? 'Results' : 'Suggested'}
              </div>
              {filteredResults.map((result) => {
                const Icon = result.icon;
                return (
                  <div 
                    key={result.id} 
                    className="flex items-center p-3 rounded-xl hover:bg-slate-800/80 cursor-pointer transition-colors group"
                  >
                    <div className="p-2 rounded-lg bg-slate-800 group-hover:bg-slate-700 transition-colors">
                      <Icon size={20} className={result.color} />
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="text-sm font-medium text-slate-200">{result.title}</div>
                      <div className="text-xs text-slate-400">{result.subtitle}</div>
                    </div>
                    <div className="text-xs text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      Jump to &rarr;
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500">
              <p className="text-sm">No results found for "{query}"</p>
            </div>
          )}
        </div>
        
        <div className="px-4 py-2 border-t border-slate-700/50 bg-slate-900 flex justify-between text-xs text-slate-500">
          <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">↑↓</kbd> to navigate</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">Enter</kbd> to select</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">Esc</kbd> to close</span>
        </div>
      </div>
    </div>
  );
};

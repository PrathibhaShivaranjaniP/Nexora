import React, { useState } from 'react';
import {
  Map, Building2, BarChart2, BrainCircuit, Sliders,
  Droplet, Wind, Mic, Search, AlertTriangle, LogOut,
  Menu, X, ChevronDown, ChevronUp, Camera, ScanLine
} from 'lucide-react';
import { useHospitalStore } from '../../store/hospitalStore';

export interface SidebarProps {
  onNavigate?: (view: string) => void;
  activeView?: string;
  onOpenSearch?: () => void;
  onOpenVoice?: () => void;
  onOpenDisasterSim?: () => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onNavigate = () => {},
  activeView = 'district',
  onOpenSearch = () => {},
  onOpenVoice = () => {},
  onOpenDisasterSim = () => {},
  onLogout = () => {}
}) => {
  const { openOxygenModal, openBloodModal, setCctvOpen, setQrScannerOpen } = useHospitalStore();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDemoOpen, setIsDemoOpen] = useState(false);

  const mainLinks = [
    { id: 'district', label: 'District Map', icon: Map },
    { id: 'hospital', label: 'Hospital 3D', icon: Building2 },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
    { id: 'ai-insights', label: 'AI Insights', icon: BrainCircuit },
    { id: 'what-if', label: 'What-If Simulator', icon: Sliders },
  ];

  const actionButtons = [
    { id: 'cctv', label: 'Live CCTV Feeds', icon: Camera, onClick: () => setCctvOpen && setCctvOpen(true), color: 'text-amber-400' },
    { id: 'qr', label: 'Scan Wristband', icon: ScanLine, onClick: () => setQrScannerOpen && setQrScannerOpen(true), color: 'text-emerald-400' },
    { id: 'blood', label: 'Blood Bank', icon: Droplet, onClick: () => openBloodModal(true), color: 'text-red-400' },
    { id: 'oxygen', label: 'Oxygen Bank', icon: Wind, onClick: () => openOxygenModal(true), color: 'text-cyan-400' },
    { id: 'voice', label: 'Voice AI', icon: Mic, onClick: onOpenVoice, color: 'text-purple-400' },
    { id: 'search', label: 'Omni-Search (Ctrl+K)', icon: Search, onClick: onOpenSearch, color: 'text-slate-300' },
  ];

  const navItemClass = (isActive: boolean) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors cursor-pointer ${
      isActive ? 'bg-cyan-900/40 text-cyan-400 border border-cyan-800/50' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
    }`;

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0a0f1c] border-r border-slate-800 text-sm">
      <div className="p-6 flex items-center gap-3 border-b border-slate-800">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
          <Building2 size={18} className="text-white" />
        </div>
        <span className="text-lg font-bold text-white tracking-wider">AEGIS<span className="text-cyan-400">OS</span></span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-8">
        {/* Main Navigation */}
        <div className="space-y-1">
          <div className="text-xs font-semibold text-slate-500 mb-3 px-4 uppercase tracking-wider">Views</div>
          {mainLinks.map((link) => {
            const Icon = link.icon;
            return (
              <div key={link.id} className={navItemClass(activeView === link.id)} onClick={() => { onNavigate(link.id); setIsMobileOpen(false); }}>
                <Icon size={18} />
                <span className="font-medium">{link.label}</span>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="space-y-1">
          <div className="text-xs font-semibold text-slate-500 mb-3 px-4 uppercase tracking-wider">Quick Actions</div>
          {actionButtons.map((btn) => {
            const Icon = btn.icon;
            return (
              <div key={btn.id} className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors cursor-pointer" onClick={() => { btn.onClick(); setIsMobileOpen(false); }}>
                <Icon size={18} className={btn.color} />
                <span className="font-medium">{btn.label}</span>
              </div>
            );
          })}
        </div>

        {/* Demo Options */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-4 py-2 cursor-pointer text-slate-400 hover:text-slate-100" onClick={() => setIsDemoOpen(!isDemoOpen)}>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Demo Options</span>
            {isDemoOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
          {isDemoOpen && (
            <div className="mt-2 space-y-1 animate-in slide-in-from-top-2">
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-amber-400/80 hover:bg-amber-900/20 hover:text-amber-400 transition-colors cursor-pointer" onClick={() => { onOpenDisasterSim(); setIsMobileOpen(false); }}>
                <AlertTriangle size={18} />
                <span className="font-medium">Disaster Simulator</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-500 hover:bg-slate-800 hover:text-red-400 transition-colors cursor-pointer" onClick={onLogout}>
          <LogOut size={18} />
          <span className="font-medium">Logout</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle Button */}
      <button 
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-slate-900 border border-slate-700 rounded-md text-slate-300"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 bg-black/60 z-40" onClick={() => setIsMobileOpen(false)} />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-40
        w-64 transform transition-transform duration-300 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {sidebarContent}
      </aside>
    </>
  );
};

import React, { useState } from 'react';
import { Camera, X, Maximize2, Radio } from 'lucide-react';
import { useHospitalStore } from '../../store/hospitalStore';

export const CCTVFeedPanel: React.FC = () => {
  const { isCctvOpen, setCctvOpen } = useHospitalStore();
  const [fullscreenFeed, setFullscreenFeed] = useState<string | null>(null);

  if (!isCctvOpen || !setCctvOpen) return null;

  const feeds = [
    { id: 'cam1', label: 'CAM-01: ER Waiting Room', bg: 'bg-slate-900', src: 'https://cdn.pixabay.com/video/2021/08/04/83863-584742966_tiny.mp4' },
    { id: 'cam2', label: 'CAM-04: Helipad Drone', bg: 'bg-slate-900', src: 'https://cdn.pixabay.com/video/2019/11/22/29555-376510349_tiny.mp4' },
    { id: 'cam3', label: '108 DASHCAM: Amb TN-45', bg: 'bg-slate-900', src: 'https://cdn.pixabay.com/video/2020/05/24/40061-424169727_tiny.mp4' },
    { id: 'cam4', label: 'CAM-09: ICU Corridor', bg: 'bg-slate-900', src: 'https://cdn.pixabay.com/video/2020/04/09/35759-408101438_tiny.mp4' }
  ];

  const renderFeed = (feed: typeof feeds[0], isFullscreen = false) => (
    <div key={feed.id} className={`relative group overflow-hidden rounded border border-slate-700/50 ${feed.bg} ${isFullscreen ? 'w-full h-full' : 'w-full aspect-video'}`}>
      {/* Video element acting as CCTV */}
      <video 
        src={feed.src} 
        autoPlay 
        muted 
        loop 
        playsInline 
        className="absolute inset-0 w-full h-full object-cover opacity-60 grayscale contrast-125"
      />
      
      {/* CRT Scanline Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] pointer-events-none" />

      {/* Overlays */}
      <div className="absolute top-2 left-2 flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
        <span className="text-[9px] font-mono font-bold text-white uppercase tracking-widest drop-shadow-md">REC</span>
      </div>
      
      <div className="absolute bottom-2 left-2">
        <span className="text-[10px] font-mono text-white drop-shadow-md bg-black/40 px-1 rounded">{feed.label}</span>
      </div>

      <div className="absolute bottom-2 right-2">
        <span className="text-[9px] font-mono text-white/80 drop-shadow-md">2026-09-07 {new Date().toLocaleTimeString('en-IN', { hour12: false })}</span>
      </div>

      {!isFullscreen && (
        <button 
          onClick={() => setFullscreenFeed(feed.id)}
          className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-cyan-900/80 rounded text-slate-300 hover:text-cyan-400 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );

  return (
    <div className="fixed inset-y-4 right-4 w-[480px] max-w-[90vw] bg-[#02050c]/95 backdrop-blur-2xl border border-slate-800 rounded-2xl shadow-2xl z-50 flex flex-col animate-in slide-in-from-right-8">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-slate-800/80 bg-slate-900/30">
        <div className="flex items-center gap-2.5">
          <Camera className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-bold text-slate-200 uppercase tracking-wider">CCTV Network</span>
          <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-900/50 px-1.5 py-0.5 rounded flex items-center gap-1">
            <Radio className="w-2.5 h-2.5" /> LIVE
          </span>
        </div>
        <button 
          onClick={() => setCctvOpen(false)}
          className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 p-3 overflow-y-auto">
        {fullscreenFeed ? (
          <div className="relative w-full h-full min-h-[300px]">
            {renderFeed(feeds.find(f => f.id === fullscreenFeed)!, true)}
            <button 
              onClick={() => setFullscreenFeed(null)}
              className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-rose-900/80 rounded border border-slate-600 hover:border-rose-500 text-slate-300 hover:text-white transition-all cursor-pointer z-10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {feeds.map(f => renderFeed(f))}
          </div>
        )}
      </div>
    </div>
  );
};
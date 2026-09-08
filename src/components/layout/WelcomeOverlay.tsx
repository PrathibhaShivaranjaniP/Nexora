import { useEffect, useRef, useState } from 'react';

interface WelcomeOverlayProps {
  onDismiss: () => void;
}

export default function WelcomeOverlay({ onDismiss }: WelcomeOverlayProps) {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef<number>(Date.now());
  const DURATION_MS = 4000;

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('aegis-welcomed')) {
      onDismiss();
      return;
    }

    startRef.current = Date.now();

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      setProgress(Math.min(100, (elapsed / DURATION_MS) * 100));
    }, 40);

    timerRef.current = setTimeout(() => {
      handleDismiss();
    }, DURATION_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDismiss = () => {
    if (!visible) return;
    setVisible(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('aegis-welcomed', '1');
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    onDismiss();
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#020610]/96 backdrop-blur-2xl animate-welcome-in"
      onClick={handleDismiss}
    >
      <div
        className="bg-slate-900/80 border border-cyan-500/30 rounded-3xl p-10 max-w-md w-full mx-4 shadow-2xl shadow-cyan-950/50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated plus icon */}
        <div className="text-6xl font-black text-cyan-400 animate-pulse mb-4 text-center select-none">
          +
        </div>

        {/* Title */}
        <h1 className="text-4xl font-black font-mono text-cyan-300 text-center">AegisOS</h1>

        {/* Subtitle */}
        <p className="text-sm text-slate-400 text-center mb-6 mt-1">
          Tamil Nadu 108 Emergency Command Center
        </p>

        {/* Bullet lines */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-300 mb-2 animate-bullet-1">
            <span>\u2705 3D Hospital Bed Matrix \u2014 Live Telemetry Connected</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-300 mb-2 animate-bullet-2">
            <span>\u2705 District GPS Ambulance Tracking Active</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-300 mb-2 animate-bullet-3">
            <span>\u2705 Blood Bank &amp; Oxygen Logistics Online</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 rounded-full bg-slate-800 mt-6">
          <div
            className="h-full rounded-full bg-cyan-500 transition-all"
            style={{ width: String(progress) + '%' }}
          />
        </div>

        {/* Click to enter */}
        <p
          className="text-[11px] text-slate-500 text-center mt-3 animate-pulse cursor-pointer"
          onClick={handleDismiss}
        >
          Click anywhere to enter \u2192
        </p>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState, useCallback } from 'react';
import { AlertTriangle, CheckCircle2, Bell, X } from 'lucide-react';
import { useHospitalStore } from '../../store/hospitalStore';
import { sound } from '../../utils/audioEngine';

interface Toast {
  id: string;
  message: string;
  severity: 'urgent' | 'success' | 'info';
}

const AMBIENT_POOL = [
  '\u{1F6CF}\uFE0F Bed ICU-04 became Available \u2014 RGGGH',
  '\u{1F691} 108 Unit TN-23 En Route \u2014 ETA 5 min',
  '\u{1FA78} O- Blood: 7 units \u2014 Below threshold',
  '\u{1F48A} Meropenem restock dispatched to ICU',
  '\u2705 Bed MedSurg-11 cleared post-discharge',
  '\u{1F9EA} Lab results: Patient P-1042 critical CBC',
  '\u26A1 UV-C Disinfection complete: Ward-B7',
  '\u{1F4E1} GPS Transponder: Unit 108-C online',
];

const MAX_TOASTS = 4;
const DISMISS_MS = 5000;

function getToastStyle(severity: Toast['severity']) {
  if (severity === 'urgent') return 'bg-rose-950/90 border-rose-500/60';
  if (severity === 'success') return 'bg-emerald-950/90 border-emerald-500/60';
  return 'bg-slate-900/95 border-slate-700/80';
}

function ToastIcon({ severity }: { severity: Toast['severity'] }) {
  const cls = 'w-4 h-4 shrink-0 mt-0.5';
  if (severity === 'urgent') return <AlertTriangle className={cls + ' text-rose-400'} />;
  if (severity === 'success') return <CheckCircle2 className={cls + ' text-emerald-400'} />;
  return <Bell className={cls + ' text-cyan-400'} />;
}

function ToastItem({
  toast,
  onClose,
}: {
  toast: Toast;
  onClose: (id: string) => void;
}) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const start = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 100 - (elapsed / DISMISS_MS) * 100);
      setProgress(remaining);
      if (remaining === 0) clearInterval(timer);
    }, 50);
    const dismiss = setTimeout(() => onClose(toast.id), DISMISS_MS);
    return () => {
      clearInterval(timer);
      clearTimeout(dismiss);
    };
  }, [toast.id, onClose]);

  return (
    <div
      className={
        'relative pointer-events-auto w-72 rounded-xl border p-3 flex items-start gap-2.5 shadow-2xl backdrop-blur-md animate-toast-in ' +
        getToastStyle(toast.severity)
      }
    >
      <ToastIcon severity={toast.severity} />
      <p className="text-xs font-mono text-slate-200 flex-1 leading-relaxed">{toast.message}</p>
      <button
        onClick={() => onClose(toast.id)}
        className="shrink-0 mt-0.5 text-slate-500 hover:text-slate-300 transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>
      {/* Progress bar */}
      <div className="absolute bottom-0 left-3 right-3 pb-1">
        <div
          className="h-0.5 bg-cyan-500/60 rounded-full transition-all"
          style={{ width: String(progress) + '%' }}
        />
      </div>
    </div>
  );
}

export default function ToastNotificationSystem() {
  const { agentLogs } = useHospitalStore();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const prevFirstLogIdRef = useRef<string | undefined>(undefined);
  const ambientTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = 'toast-' + Date.now() + '-' + Math.random();
    setToasts((prev) => [{ ...toast, id }, ...prev].slice(0, MAX_TOASTS));
    if (toast.severity === 'urgent') sound.playTactileClick();
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Watch agentLogs — fire toast when first item changes
  useEffect(() => {
    const first = agentLogs[0];
    if (!first || first.id === prevFirstLogIdRef.current) return;
    prevFirstLogIdRef.current = first.id;
    const sev = first.severity as string;
    if (sev === 'urgent' || sev === 'critical') {
      addToast({
        message: '\u26A0\uFE0F ' + first.action + ': ' + first.details.slice(0, 70),
        severity: 'urgent',
      });
    } else if (sev === 'success') {
      addToast({
        message: '\u2705 ' + first.action + ': ' + first.details.slice(0, 70),
        severity: 'success',
      });
    }
  }, [agentLogs, addToast]);

  // Ambient toasts every 18-28 seconds
  useEffect(() => {
    const scheduleNext = () => {
      const delay = 18000 + Math.random() * 10000;
      ambientTimerRef.current = setTimeout(() => {
        const msg = AMBIENT_POOL[Math.floor(Math.random() * AMBIENT_POOL.length)];
        addToast({ message: msg, severity: 'info' });
        scheduleNext();
      }, delay);
    };
    scheduleNext();
    return () => {
      if (ambientTimerRef.current) clearTimeout(ambientTimerRef.current);
    };
  }, [addToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-[130px] left-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={removeToast} />
      ))}
    </div>
  );
}

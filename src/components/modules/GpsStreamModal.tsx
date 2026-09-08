import React, { useState, useEffect } from 'react';
import { gpsStreamService, GpsTelemetryPacket } from '../../services/gpsWebSocketStream';
import {
  Navigation,
  Radio,
  Wifi,
  Activity,
  Gauge,
  Zap,
  CheckCircle2,
  X,
  Copy,
  Terminal,
  Play,
  Pause
} from 'lucide-react';
import { sound } from '../../utils/audioEngine';

interface GpsStreamModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GpsStreamModal: React.FC<GpsStreamModalProps> = ({ isOpen, onClose }) => {
  const [latestPacket, setLatestPacket] = useState<GpsTelemetryPacket | null>(null);
  const [packetHistory, setPacketHistory] = useState<GpsTelemetryPacket[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const unsubscribe = gpsStreamService.subscribe((packet) => {
      if (!isPaused) {
        setLatestPacket(packet);
        setPacketHistory(prev => [packet, ...prev.slice(0, 19)]);
      }
    });

    return () => unsubscribe();
  }, [isOpen, isPaused]);

  if (!isOpen) return null;

  const handleCopyJson = () => {
    sound.playTactileClick();
    if (latestPacket) {
      navigator.clipboard.writeText(JSON.stringify(latestPacket, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-3xl bg-[#060e20] border border-cyan-500/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100 ring-1 ring-cyan-500/30 max-h-[92vh]">
        {/* Header Ribbon */}
        <div className="bg-slate-900/95 border-b border-slate-800 px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/20">
              <Navigation className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-slate-100 uppercase tracking-wide">
                  Live 108 GPS WebSocket / MQTT Transponder Feed
                </h3>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9.5px] px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  CONNECTED (850ms)
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Direct Telemetry Stream • Vehicle ID: TN-01-ALS-049 • Anna Salai Priority Corridor
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {/* Section 1: Real-Time Telemetry Stats Card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
            <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl">
              <span className="text-[10px] text-slate-400 uppercase block">Vehicle Speed</span>
              <span className="text-xl font-black text-cyan-300 mt-1 block">
                {latestPacket ? `${latestPacket.speedKmh} km/h` : '68.4 km/h'}
              </span>
              <span className="text-[9px] text-emerald-400 block">Siren Code-3 Active</span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl">
              <span className="text-[10px] text-slate-400 uppercase block">GPS Satellite Lock</span>
              <span className="text-xl font-black text-emerald-400 mt-1 block">
                {latestPacket ? `${latestPacket.satelliteCount} Sats` : '16 Sats'}
              </span>
              <span className="text-[9px] text-slate-400 block">
                HDOP: {latestPacket ? latestPacket.hdop : '0.78'} (Ideal)
              </span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl">
              <span className="text-[10px] text-slate-400 uppercase block">Telemetry Latency</span>
              <span className="text-xl font-black text-amber-300 mt-1 block">
                {latestPacket ? `${latestPacket.latencyMs} ms` : '12 ms'}
              </span>
              <span className="text-[9px] text-slate-400 block">5G NR Sub-6 GHz</span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl">
              <span className="text-[10px] text-slate-400 uppercase block">Onboard O2 Tank</span>
              <span className="text-xl font-black text-purple-300 mt-1 block">
                {latestPacket ? `${latestPacket.obdTelemetry.oxygenTankBar} Bar` : '182 Bar'}
              </span>
              <span className="text-[9px] text-emerald-400 block">Patient SpO2 94%</span>
            </div>
          </div>

          {/* Section 2: Precise Coordinates & Heading */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div>
              <span className="text-[10.5px] text-slate-400 uppercase">Live Transponder Coordinates:</span>
              <div className="text-sm font-bold text-slate-200 mt-0.5 flex items-center gap-3">
                <span>LAT: <strong className="text-cyan-300">{latestPacket ? latestPacket.coordinates.lat : '13.018942'}° N</strong></span>
                <span>LNG: <strong className="text-cyan-300">{latestPacket ? latestPacket.coordinates.lng : '80.218402'}° E</strong></span>
                <span>ALT: <strong className="text-emerald-300">{latestPacket ? `${latestPacket.coordinates.altitudeMeters.toFixed(1)}m` : '14.2m'}</strong></span>
              </div>
            </div>
            <div>
              <span className="text-[10.5px] text-slate-400 uppercase">Compass Heading:</span>
              <div className="text-sm font-bold text-amber-300 mt-0.5">
                {latestPacket ? `${latestPacket.headingDegrees}° NNE` : '42.5° NNE'}
              </div>
            </div>
          </div>

          {/* Section 3: Raw JSON Telemetry Packet Stream Inspector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-300 font-bold flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                Raw Telemetry WebSocket Payload Stream
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPaused(p => !p)}
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] flex items-center gap-1 transition-colors"
                >
                  {isPaused ? <Play className="w-3 h-3 text-emerald-400" /> : <Pause className="w-3 h-3 text-amber-400" />}
                  <span>{isPaused ? 'Resume' : 'Pause'}</span>
                </button>
                <button
                  onClick={handleCopyJson}
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded text-[11px] flex items-center gap-1 transition-colors"
                >
                  {copied ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy JSON'}</span>
                </button>
              </div>
            </div>

            <div className="bg-[#040813] border border-slate-800 rounded-xl p-3 font-mono text-[11px] text-emerald-400 max-h-48 overflow-y-auto leading-relaxed shadow-inner">
              <pre>{JSON.stringify(latestPacket || { status: 'Connecting to 108 Telemetry WebSocket Gateway...' }, null, 2)}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

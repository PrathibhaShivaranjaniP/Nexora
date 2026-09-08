import React, { useEffect, useRef } from 'react';

interface ECGWaveformProps {
  heartRate?: number;
  isCritical?: boolean;
  height?: number;
  width?: number;
  color?: string;
  showDetails?: boolean;
}

export const ECGWaveform: React.FC<ECGWaveformProps> = ({
  heartRate = 78,
  isCritical = false,
  height = 55,
  width = 240,
  color = '#10b981',
  showDetails = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let scanX = 0;
    const speed = isCritical ? 2.4 : 1.8;
    const points: number[] = new Array(width).fill(height / 2);

    // Baseline cardiac rhythm generator (P-Q-R-S-T)
    let cyclePhase = 0;
    const cycleLength = Math.max(30, Math.round(1800 / heartRate));

    const generateECGSample = (phase: number, midY: number) => {
      const p = phase % cycleLength;
      const progress = p / cycleLength;

      // P wave (at 0.15)
      if (progress > 0.12 && progress < 0.22) {
        return midY - 6 * Math.sin(((progress - 0.12) / 0.1) * Math.PI);
      }
      // Q dip (at 0.35)
      if (progress > 0.33 && progress < 0.37) {
        return midY + 5;
      }
      // R spike (at 0.40) - the sharp peak
      if (progress >= 0.37 && progress <= 0.42) {
        const rProgress = (progress - 0.37) / 0.05;
        return midY - (isCritical ? 24 : 19) * Math.sin(rProgress * Math.PI);
      }
      // S dip (at 0.44)
      if (progress > 0.42 && progress < 0.47) {
        return midY + (isCritical ? 9 : 7);
      }
      // T wave (at 0.65)
      if (progress > 0.58 && progress < 0.75) {
        return midY - (isCritical ? 10 : 7) * Math.sin(((progress - 0.58) / 0.17) * Math.PI);
      }
      // Jitter/noise for biological realism
      const noise = (Math.random() - 0.5) * (isCritical ? 2.2 : 0.8);
      return midY + noise;
    };

    const draw = () => {
      // Step advance
      for (let s = 0; s < speed; s++) {
        scanX = (scanX + 1) % width;
        cyclePhase++;
        points[scanX] = generateECGSample(cyclePhase, height / 2);
      }

      // Background fade
      ctx.fillStyle = '#060a12';
      ctx.fillRect(0, 0, width, height);

      // Subtle phosphor grid
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x < width; x += 20) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = 0; y < height; y += 15) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // Draw ECG trace
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = isCritical ? '#f43f5e' : color;
      ctx.shadowBlur = 8;
      ctx.shadowColor = isCritical ? 'rgba(244, 63, 94, 0.7)' : 'rgba(16, 185, 129, 0.7)';

      ctx.beginPath();
      let started = false;

      for (let x = 0; x < width; x++) {
        // Create an erase gap around current scanhead
        const dist = Math.abs(x - scanX);
        if (dist < 12) continue;

        if (!started) {
          ctx.moveTo(x, points[x]);
          started = true;
        } else {
          ctx.lineTo(x, points[x]);
        }
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw glowing scanhead dot
      ctx.fillStyle = isCritical ? '#fda4af' : '#6ee7b7';
      ctx.shadowBlur = 10;
      ctx.shadowColor = isCritical ? '#f43f5e' : '#10b981';
      ctx.beginPath();
      ctx.arc(scanX, points[scanX], 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [heartRate, isCritical, height, width, color]);

  return (
    <div className="flex items-center gap-2.5 bg-[#060a12] border border-slate-800/80 p-1.5 rounded-lg overflow-hidden shadow-inner">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="rounded"
        style={{ width: `${width}px`, height: `${height}px` }}
      />
      {showDetails && (
        <div className="flex flex-col justify-center font-mono text-[10px] pr-1 flex-shrink-0">
          <span className="text-slate-500 uppercase tracking-wider text-[9px]">HR ECG</span>
          <span className={`text-sm font-bold leading-none ${isCritical ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
            {heartRate} <span className="text-[9px] text-slate-500 font-normal">bpm</span>
          </span>
          <span className="text-[9px] text-cyan-400 mt-1">Lead II • Norm</span>
        </div>
      )}
    </div>
  );
};

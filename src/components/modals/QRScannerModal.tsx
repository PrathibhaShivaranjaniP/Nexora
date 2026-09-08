import React, { useEffect, useRef, useState } from 'react';
import { X, ScanLine, UserPlus, CheckCircle2 } from 'lucide-react';
import { useHospitalStore } from '../../store/hospitalStore';
import { sound } from '../../utils/audioEngine';

export const QRScannerModal: React.FC = () => {
  const { isQrScannerOpen, setQrScannerOpen, admitPatient } = useHospitalStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [scanStatus, setScanStatus] = useState<'scanning' | 'success'>('scanning');

  useEffect(() => {
    if (isQrScannerOpen) {
      setScanStatus('scanning');
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(s => {
          setStream(s);
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
        })
        .catch(err => console.error("Camera access denied or unavailable", err));

      // Mock scan after 4 seconds for hackathon demo
      const timer = setTimeout(() => {
        sound.playTurnoverSuccess();
        setScanStatus('success');
        
        // Admit a mock patient
        if (admitPatient) {
          admitPatient({
            id: 'P-' + Math.floor(Math.random() * 9000 + 1000),
            mrn: 'MRN-' + Math.floor(Math.random() * 9000 + 1000),
            name: 'Emergency Trauma Patient (QR Scanned)',
            age: 45,
            gender: 'Other',
            ward: 'ED',
            bedId: '',
            diagnosis: 'Blunt Force Trauma',
            acuity: 5,
            vitals: { heartRate: 130, bpSystolic: 90, bpDiastolic: 50, spO2: 88, respRate: 30, temperature: 36.2 },
            news2Score: 9,
            deteriorationRisk: 95,
            admissionTime: new Date().toISOString(),
            estDischargeTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString()
          } as any);
        }

        setTimeout(() => {
          if (setQrScannerOpen) setQrScannerOpen(false);
        }, 2000);
      }, 4000);

      return () => clearTimeout(timer);
    } else {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }
  }, [isQrScannerOpen]);

  if (!isQrScannerOpen || !setQrScannerOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative bg-[#050811] border border-cyan-900 rounded-3xl w-[500px] max-w-[95vw] overflow-hidden shadow-2xl shadow-cyan-900/20">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div className="flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-cyan-400" />
            <span className="font-bold text-slate-100">Wristband / QR Scanner</span>
          </div>
          <button onClick={() => setQrScannerOpen(false)} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
            {scanStatus === 'scanning' ? (
              <>
                <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover opacity-60" />
                
                {/* Scanner Target Frame */}
                <div className="absolute inset-0 m-8 border-2 border-dashed border-cyan-500/50 rounded-xl" />
                
                {/* Laser Line */}
                <div className="absolute left-8 right-8 h-0.5 bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)] animate-[scan_2s_ease-in-out_infinite]" />
                <style>{`
                  @keyframes scan {
                    0%, 100% { top: 20%; }
                    50% { top: 80%; }
                  }
                `}</style>
              </>
            ) : (
              <div className="flex flex-col items-center gap-4 text-emerald-400 animate-in zoom-in">
                <CheckCircle2 className="w-16 h-16" />
                <div className="text-center">
                  <p className="font-bold text-lg">Patient Identified</p>
                  <p className="text-sm text-emerald-400/80">Auto-admitting to ER...</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-6 flex justify-center text-sm text-slate-400">
            {scanStatus === 'scanning' ? 'Align patient wristband or QR code within the frame.' : 'Transferring payload to hospital store...'}
          </div>
        </div>
      </div>
    </div>
  );
};
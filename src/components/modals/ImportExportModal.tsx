import React, { useState } from 'react';
import { useHospitalStore } from '../../store/hospitalStore';
import { Download, Upload, RefreshCw, X, Check, Copy } from 'lucide-react';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({ isOpen, onClose }) => {
  const { exportStateJson, importStateJson, resetToDefault } = useHospitalStore();

  const [importText, setImportText] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [importError, setImportError] = useState(false);

  if (!isOpen) return null;

  const currentJson = exportStateJson();

  const handleCopy = () => {
    navigator.clipboard.writeText(currentJson);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([currentJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aegis-hospital-state-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const success = importStateJson(importText);
    if (success) {
      setImportError(false);
      onClose();
    } else {
      setImportError(true);
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset all hospital beds, patients, and staff back to original state?')) {
      resetToDefault();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#0b1326] border border-slate-700/80 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-slate-100">Export & Import Hospital State</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {/* Export Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200">Export Current State (JSON)</span>
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded flex items-center gap-1 text-[11px]"
                >
                  {copySuccess ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copySuccess ? 'Copied' : 'Copy JSON'}
                </button>
                <button
                  onClick={handleDownload}
                  className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded flex items-center gap-1 text-[11px]"
                >
                  <Download className="w-3 h-3" /> Download .JSON
                </button>
              </div>
            </div>
            <textarea
              readOnly
              rows={4}
              value={currentJson}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-lg p-2 font-mono text-[10px] text-slate-400 focus:outline-none"
            />
          </div>

          {/* Import Section */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <span className="font-semibold text-slate-200 block">Import State (Paste JSON)</span>
            <textarea
              rows={3}
              value={importText}
              onChange={e => {
                setImportText(e.target.value);
                setImportError(false);
              }}
              placeholder="Paste JSON state data here..."
              className="w-full bg-slate-950 border border-slate-700/80 rounded-lg p-2 font-mono text-[10px] text-slate-200 focus:outline-none focus:border-cyan-500"
            />
            {importError && (
              <p className="text-rose-400 text-[11px]">Invalid JSON format. Please verify the state structure.</p>
            )}
            <div className="flex justify-end">
              <button
                onClick={handleImport}
                disabled={!importText.trim()}
                className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-slate-950 font-bold rounded flex items-center gap-1"
              >
                <Upload className="w-3.5 h-3.5" /> Apply Imported State
              </button>
            </div>
          </div>

          {/* Reset Section */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <span className="text-slate-400 text-[11px]">Reset all mock patients, beds, and staff to defaults</span>
            <button
              onClick={handleReset}
              className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded flex items-center gap-1 text-[11px]"
            >
              <RefreshCw className="w-3 h-3" /> Reset Everything
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

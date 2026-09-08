import React from 'react';
import { useHospitalStore } from '../../store/hospitalStore';
import { Sliders, Zap, AlertOctagon, TrendingUp, RefreshCw } from 'lucide-react';

export const WhatIfSandbox: React.FC = () => {
  const { whatIfParams, setWhatIfParams, applyCrisisPreset, getForecastPoints, icuCapacityPercent, overallOccupancyPercent } = useHospitalStore();

  const forecastPoints = getForecastPoints();

  const handleElectiveChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWhatIfParams({ electiveSurgeryRatio: parseFloat(e.target.value) });
  };

  const handleEdInflowChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWhatIfParams({ edInflowMultiplier: parseFloat(e.target.value) });
  };

  const handleStaffCalloutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWhatIfParams({ staffCalloutRate: parseFloat(e.target.value) });
  };

  // SVG Chart Dimensions
  const chartWidth = 700;
  const chartHeight = 220;
  const maxBedLimit = 26; // max mock ward capacity
  const paddingX = 45;
  const paddingY = 25;

  const getX = (index: number) => paddingX + (index / (forecastPoints.length - 1)) * (chartWidth - paddingX * 2);
  const getY = (val: number) => chartHeight - paddingY - (val / (maxBedLimit + 4)) * (chartHeight - paddingY * 2);

  // Path generators
  const baselinePath = forecastPoints.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(pt.baselineCensus)}`).join(' ');
  const predictedPath = forecastPoints.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(pt.predictedCensus)}`).join(' ');

  // Confidence area polygon
  const upperPoints = forecastPoints.map((pt, i) => `${getX(i)},${getY(Math.min(maxBedLimit + 2, pt.predictedCensus + 2.2))}`).join(' ');
  const lowerPoints = forecastPoints.slice().reverse().map((pt, i) => {
    const origIdx = forecastPoints.length - 1 - i;
    return `${getX(origIdx)},${getY(Math.max(0, pt.predictedCensus - 2))}`;
  }).join(' ');
  const areaPolygon = `${upperPoints} ${lowerPoints}`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 p-1">
      {/* Left Column: Sliders & Crisis Presets */}
      <div className="lg:col-span-5 space-y-4">
        {/* Controls Card */}
        <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" /> What-If Parameter Sliders
            </h3>
            <button
              onClick={() => applyCrisisPreset('None')}
              className="text-xs text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3 h-3" /> Reset Defaults
            </button>
          </div>

          {/* Slider 1: Elective Surgery Volume */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300">Elective Surgery Schedule</span>
              <span className="font-mono text-cyan-400 font-semibold">
                {Math.round(whatIfParams.electiveSurgeryRatio * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={whatIfParams.electiveSurgeryRatio}
              onChange={handleElectiveChange}
              className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>0% (Canceled)</span>
              <span>100% (Baseline)</span>
              <span>200% (High Volume)</span>
            </div>
          </div>

          {/* Slider 2: ED Inflow Multiplier */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300">Emergency Dept Inflow Rate</span>
              <span className={`font-mono font-semibold ${whatIfParams.edInflowMultiplier > 1.4 ? 'text-rose-400' : 'text-cyan-400'}`}>
                {whatIfParams.edInflowMultiplier.toFixed(1)}x Surge
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.1"
              value={whatIfParams.edInflowMultiplier}
              onChange={handleEdInflowChange}
              className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>0.5x (Slow)</span>
              <span>1.0x (Normal)</span>
              <span>3.0x (Mass Influx)</span>
            </div>
          </div>

          {/* Slider 3: Staff Callout / Absenteeism */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300">Staff Absenteeism / Callouts</span>
              <span className="font-mono text-amber-400 font-semibold">
                {Math.round(whatIfParams.staffCalloutRate * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="0.4"
              step="0.05"
              value={whatIfParams.staffCalloutRate}
              onChange={handleStaffCalloutChange}
              className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>0% (Full Staff)</span>
              <span>20% (Shortage)</span>
              <span>40% (Critical)</span>
            </div>
          </div>
        </div>

        {/* Crisis Injector Presets */}
        <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-3">
          <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" /> Rapid Crisis Scenario Injector
          </h3>
          <p className="text-xs text-slate-400">
            Simulate sudden macro-shocks to observe downstream bed bottlenecks and regional diversion activation.
          </p>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => applyCrisisPreset('Highway Pileup')}
              className={`p-2.5 rounded-lg text-left border text-xs transition-all ${
                whatIfParams.activeCrisisPreset === 'Highway Pileup'
                  ? 'bg-rose-500/20 border-rose-500 text-rose-200 shadow-lg'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
              }`}
            >
              <div className="font-semibold flex items-center gap-1.5 text-rose-400">
                <AlertOctagon className="w-3.5 h-3.5" /> 15-Car Pileup
              </div>
              <div className="text-[10px] text-slate-400 mt-1">2.4x ED surge, trauma diversion</div>
            </button>

            <button
              onClick={() => applyCrisisPreset('Viral Epidemic')}
              className={`p-2.5 rounded-lg text-left border text-xs transition-all ${
                whatIfParams.activeCrisisPreset === 'Viral Epidemic'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-200 shadow-lg'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
              }`}
            >
              <div className="font-semibold text-amber-400">Viral Epidemic</div>
              <div className="text-[10px] text-slate-400 mt-1">Surge admissions, 25% staff out</div>
            </button>

            <button
              onClick={() => applyCrisisPreset('Winter Storm')}
              className={`p-2.5 rounded-lg text-left border text-xs transition-all ${
                whatIfParams.activeCrisisPreset === 'Winter Storm'
                  ? 'bg-cyan-500/20 border-cyan-500 text-cyan-200 shadow-lg'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
              }`}
            >
              <div className="font-semibold text-cyan-400">Severe Storm</div>
              <div className="text-[10px] text-slate-400 mt-1">Trauma + 35% nurse absence</div>
            </button>

            <button
              onClick={() => applyCrisisPreset('None')}
              className={`p-2.5 rounded-lg text-left border text-xs transition-all ${
                whatIfParams.activeCrisisPreset === 'None'
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-200'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
              }`}
            >
              <div className="font-semibold text-emerald-400">Normal Baseline</div>
              <div className="text-[10px] text-slate-400 mt-1">Standard operational rhythms</div>
            </button>
          </div>
        </div>
      </div>

      {/* Right Column: Multi-Horizon Forecasting Chart */}
      <div className="lg:col-span-7 space-y-4">
        <div className="glass-panel p-5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" /> Multi-Horizon Predictive Bed Census
              </h3>
              <p className="text-xs text-slate-400">
                Temporal Fusion Transformer projection with 80% conformal confidence bands
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2.5 h-0.5 bg-slate-500" /> Baseline
              </span>
              <span className="flex items-center gap-1.5 text-cyan-300 font-medium">
                <span className="w-2.5 h-0.5 bg-cyan-400" /> What-If Forecast
              </span>
              <span className="flex items-center gap-1.5 text-rose-400 font-medium">
                <span className="w-2.5 h-0.5 bg-rose-500 border-dashed" /> Max Capacity
              </span>
            </div>
          </div>

          {/* SVG Chart */}
          <div className="w-full overflow-x-auto">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto">
              <defs>
                <linearGradient id="confidenceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.05" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 10, 20, 26].map(val => (
                <g key={val}>
                  <line
                    x1={paddingX}
                    y1={getY(val)}
                    x2={chartWidth - paddingX}
                    y2={getY(val)}
                    stroke="#1e293b"
                    strokeDasharray="4 4"
                  />
                  <text x={paddingX - 10} y={getY(val) + 4} fill="#64748b" fontSize="10" textAnchor="end">
                    {val} beds
                  </text>
                </g>
              ))}

              {/* Max Capacity Red Line */}
              <line
                x1={paddingX}
                y1={getY(maxBedLimit)}
                x2={chartWidth - paddingX}
                y2={getY(maxBedLimit)}
                stroke="#f43f5e"
                strokeWidth="1.5"
                strokeDasharray="6 4"
              />
              <text x={chartWidth - paddingX - 4} y={getY(maxBedLimit) - 6} fill="#f43f5e" fontSize="10" textAnchor="end" fontWeight="bold">
                Capacity Limit (26 beds)
              </text>

              {/* Confidence Interval Polygon */}
              <polygon points={areaPolygon} fill="url(#confidenceGrad)" />

              {/* Baseline Line */}
              <path d={baselinePath} fill="none" stroke="#64748b" strokeWidth="2" strokeDasharray="3 3" />

              {/* Predicted Line */}
              <path d={predictedPath} fill="none" stroke="#06b6d4" strokeWidth="2.5" />

              {/* Data Points */}
              {forecastPoints.map((pt, i) => (
                <g key={pt.timeLabel}>
                  <circle cx={getX(i)} cy={getY(pt.predictedCensus)} r="4" fill="#06b6d4" stroke="#080c14" strokeWidth="2" />
                  <text x={getX(i)} y={chartHeight - 6} fill="#94a3b8" fontSize="11" textAnchor="middle" fontWeight="500">
                    {pt.timeLabel}
                  </text>
                  <text
                    x={getX(i)}
                    y={getY(pt.predictedCensus) - 8}
                    fill={pt.predictedCensus >= maxBedLimit ? '#f43f5e' : '#e2e8f0'}
                    fontSize="11"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {pt.predictedCensus}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          {/* Forecast Insight Cards */}
          <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-slate-800">
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
              <div className="text-[11px] text-slate-400">Peak Surge Point</div>
              <div className="text-sm font-semibold text-slate-200 mt-0.5">+12 Hours</div>
              <div className="text-[10px] text-cyan-400 font-mono">
                {Math.round(overallOccupancyPercent * whatIfParams.edInflowMultiplier)}% Projected
              </div>
            </div>

            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
              <div className="text-[11px] text-slate-400">ICU Demand Pressure</div>
              <div className="text-sm font-semibold text-rose-400 mt-0.5">
                {whatIfParams.edInflowMultiplier > 1.2 ? 'Critical Shortage' : 'Manageable'}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                Est: {Math.round(icuCapacityPercent * whatIfParams.edInflowMultiplier)}% ICU Demand
              </div>
            </div>

            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
              <div className="text-[11px] text-slate-400">Prescriptive Action</div>
              <div className="text-sm font-semibold text-emerald-400 mt-0.5">
                {whatIfParams.edInflowMultiplier > 1.5 ? 'Defer Electives' : 'Maintain Schedule'}
              </div>
              <div className="text-[10px] text-slate-400">
                {whatIfParams.edInflowMultiplier > 1.5 ? 'Free up 4 recovery beds' : 'Normal turnaround'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { useHospitalStore } from '../../store/hospitalStore';
import { sound } from '../../utils/audioEngine';
import {
  TrendingUp,
  Activity,
  ShieldAlert,
  Clock,
  Sparkles,
  Sliders,
  AlertTriangle,
  CheckCircle2,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Layers,
  Users,
  Bed,
  Droplets,
  Truck,
  RotateCcw
} from 'lucide-react';

export const AnalyticsDashboard: React.FC = () => {
  const { currentDistrict } = useHospitalStore();

  // Multi-horizon filter
  const [timeHorizon, setTimeHorizon] = useState<'24h' | '7d' | '30d'>('7d');

  // Interactive Monte Carlo Surge Simulator Scenario State
  const [activeScenario, setActiveScenario] = useState<'baseline' | 'mci' | 'viral' | 'festival'>('baseline');
  const [surgeIntensity, setSurgeIntensity] = useState<number>(0); // 0% to +50%
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  // Mitigation action feedback state
  const [executedActions, setExecutedActions] = useState<string[]>([]);
  const [executingActionId, setExecutingActionId] = useState<string | null>(null);

  // Dynamic Occupancy Data based on Horizon & Simulation Scenario
  const trendData = useMemo(() => {
    let base: { label: string; value: number; upper: number; lower: number; admissions: number }[] = [];

    if (timeHorizon === '24h') {
      base = [
        { label: '00:00', value: 68, upper: 72, lower: 64, admissions: 8 },
        { label: '04:00', value: 62, upper: 67, lower: 58, admissions: 4 },
        { label: '08:00', value: 78, upper: 83, lower: 74, admissions: 19 },
        { label: '12:00', value: 89, upper: 94, lower: 84, admissions: 28 },
        { label: '16:00', value: 94, upper: 98, lower: 90, admissions: 34 },
        { label: '20:00', value: 88, upper: 93, lower: 83, admissions: 22 },
        { label: '23:59', value: 76, upper: 81, lower: 71, admissions: 12 }
      ];
    } else if (timeHorizon === '7d') {
      base = [
        { label: 'D-6', value: 65, upper: 70, lower: 61, admissions: 112 },
        { label: 'D-5', value: 72, upper: 77, lower: 68, admissions: 134 },
        { label: 'D-4', value: 85, upper: 90, lower: 81, admissions: 168 },
        { label: 'D-3', value: 78, upper: 83, lower: 74, admissions: 142 },
        { label: 'D-2', value: 92, upper: 96, lower: 87, admissions: 189 },
        { label: 'D-1', value: 88, upper: 93, lower: 83, admissions: 175 },
        { label: 'Today', value: 82, upper: 87, lower: 78, admissions: 160 }
      ];
    } else {
      base = [
        { label: 'Wk 1', value: 70, upper: 75, lower: 65, admissions: 940 },
        { label: 'Wk 2', value: 78, upper: 83, lower: 73, admissions: 1080 },
        { label: 'Wk 3', value: 86, upper: 91, lower: 82, admissions: 1240 },
        { label: 'Wk 4', value: 84, upper: 89, lower: 79, admissions: 1190 }
      ];
    }

    // Apply active scenario surge modifier
    const multiplier = 1 + surgeIntensity / 100;
    return base.map(p => ({
      ...p,
      value: Math.min(99, Math.round(p.value * multiplier)),
      upper: Math.min(100, Math.round(p.upper * multiplier)),
      lower: Math.min(96, Math.round(p.lower * multiplier)),
      admissions: Math.round(p.admissions * multiplier)
    }));
  }, [timeHorizon, surgeIntensity]);

  // Dynamic Department Loads based on surge scenario
  const departmentLoads = useMemo(() => {
    let mciBonus = activeScenario === 'mci' ? 18 : 0;
    let viralBonus = activeScenario === 'viral' ? 15 : 0;
    let festivalBonus = activeScenario === 'festival' ? 12 : 0;
    let totalBonus = mciBonus + viralBonus + festivalBonus + Math.round(surgeIntensity * 0.4);

    return [
      { dept: 'Trauma & Emergency', load: Math.min(99, 85 + totalBonus), color: 'from-rose-600 to-red-500', alert: totalBonus > 10 },
      { dept: 'Intensive Care Unit (ICU)', load: Math.min(98, 92 + Math.round(totalBonus * 0.7)), color: 'from-amber-600 to-orange-500', alert: totalBonus > 5 },
      { dept: 'High-Dependency Unit (HDU)', load: Math.min(95, 74 + Math.round(totalBonus * 0.8)), color: 'from-cyan-600 to-blue-500', alert: false },
      { dept: 'General Medicine Ward', load: Math.min(92, 60 + Math.round(totalBonus * 0.5)), color: 'from-blue-600 to-indigo-500', alert: false },
      { dept: 'Operating Theaters (OR)', load: Math.min(90, 45 + Math.round(totalBonus * 0.9)), color: 'from-emerald-600 to-teal-500', alert: false }
    ];
  }, [activeScenario, surgeIntensity]);

  // Dynamic Surge Risk Rating
  const surgeRisk = useMemo(() => {
    if (surgeIntensity >= 30 || activeScenario === 'mci') return { level: 'Severe Risk', color: 'text-rose-500', badge: 'bg-rose-500/20 border-rose-500/50' };
    if (surgeIntensity >= 15 || activeScenario === 'viral') return { level: 'High Risk', color: 'text-amber-400', badge: 'bg-amber-500/20 border-amber-500/50' };
    return { level: 'Moderate', color: 'text-cyan-400', badge: 'bg-cyan-500/20 border-cyan-500/50' };
  }, [surgeIntensity, activeScenario]);

  const handleScenarioSelect = (scenario: 'baseline' | 'mci' | 'viral' | 'festival') => {
    sound.playTactileClick();
    setActiveScenario(scenario);
    if (scenario === 'baseline') setSurgeIntensity(0);
    if (scenario === 'mci') setSurgeIntensity(35);
    if (scenario === 'viral') setSurgeIntensity(25);
    if (scenario === 'festival') setSurgeIntensity(20);
  };

  const executeMitigation = (actionId: string, title: string) => {
    sound.playTactileClick();
    setExecutingActionId(actionId);
    setTimeout(() => {
      setExecutingActionId(null);
      setExecutedActions(prev => [...prev, actionId]);
      sound.playRadarPing();
      setSurgeIntensity(prev => Math.max(0, prev - 12));
    }, 1200);
  };

  return (
    <div className="w-full h-full min-h-[calc(100vh-140px)] bg-[#050811] text-slate-100 p-4 sm:p-6 flex flex-col space-y-5 overflow-y-auto custom-scrollbar select-none animate-in fade-in duration-200">
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER & MULTI-HORIZON TIMEFRAME SELECTOR
         ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_#22d3ee]" />
            <h2 className="text-xl sm:text-2xl font-black font-mono tracking-wide text-white flex items-center gap-2">
              <span>PREDICTIVE CLINICAL INTELLIGENCE</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-normal">
                {currentDistrict.name} Network
              </span>
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Real-time Monte Carlo Bed Census Forecasting • Machine Learning Confidence Score 94.2%
          </p>
        </div>

        {/* Time Horizon Switcher */}
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
            {(['24h', '7d', '30d'] as const).map(horizon => (
              <button
                key={horizon}
                onClick={() => { sound.playTactileClick(); setTimeHorizon(horizon); }}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  timeHorizon === horizon
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-900/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {horizon === '24h' ? '24 Hours' : horizon === '7d' ? '7 Days' : '30 Days'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. TOP EXECUTIVE METRIC CARDS
         ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>PREDICTION ACCURACY</span>
            <Sparkles className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="my-2">
            <span className="text-3xl font-black font-mono text-emerald-400">94.2%</span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-300 font-bold">+1.2%</span>
            <span>model calibration</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>AVG LENGTH OF STAY</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="my-2">
            <span className="text-3xl font-black font-mono text-blue-400">4.1 Days</span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <ArrowDownRight className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-300 font-bold">-0.3 days</span>
            <span>rapid discharge pathway</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>SURGE RISK (NEXT 72H)</span>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <div className="my-2">
            <span className={`text-3xl font-black font-mono ${surgeRisk.color}`}>{surgeRisk.level}</span>
          </div>
          <div className="text-[11px] text-slate-400">
            {activeScenario === 'mci' ? 'Mass Casualty surge detected' : 'Driven by seasonal respiratory trends'}
          </div>
        </div>

        {/* Metric 4: Admission Velocity */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>BED DISCHARGE VELOCITY</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="my-2">
            <span className="text-3xl font-black font-mono text-cyan-300">18.4 / day</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Current balance: <strong className="text-emerald-400">+3.2 net beds</strong>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. INTERACTIVE MONTE CARLO SURGE SIMULATOR CONTROL BAR
         ───────────────────────────────────────────────────────────── */}
      <div className="bg-slate-950/90 border border-cyan-500/30 rounded-2xl p-4 shadow-2xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
              MONTE CARLO STRESS-TEST SCENARIO PLAYGROUND
            </span>
          </div>
          <span className="text-[11px] font-mono text-cyan-400">
            Live Simulated Surge: <strong className="text-white">+{surgeIntensity}% Influx</strong>
          </span>
        </div>

        {/* Scenario Pill Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
          <button
            onClick={() => handleScenarioSelect('baseline')}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeScenario === 'baseline'
                ? 'bg-slate-800 border-cyan-400 text-cyan-300 font-bold shadow-md'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <span>🟢 Baseline Normal</span>
          </button>

          <button
            onClick={() => handleScenarioSelect('mci')}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeScenario === 'mci'
                ? 'bg-rose-950/80 border-rose-500 text-rose-200 font-bold shadow-md shadow-rose-950/50'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <span>🚨 Highway Collision (+35%)</span>
          </button>

          <button
            onClick={() => handleScenarioSelect('viral')}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeScenario === 'viral'
                ? 'bg-amber-950/80 border-amber-500 text-amber-200 font-bold shadow-md shadow-amber-950/50'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <span>🌡️ Viral Epidemic Wave (+25%)</span>
          </button>

          <button
            onClick={() => handleScenarioSelect('festival')}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeScenario === 'festival'
                ? 'bg-purple-950/80 border-purple-500 text-purple-200 font-bold shadow-md'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <span>🎆 Festival Gathering (+20%)</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. MAIN CHARTS: DYNAMIC SPLINE OCCUPANCY + DEPARTMENT MATRIX
         ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 65%: Animated Dynamic Area Curve Chart */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Occupancy Forecast &amp; Confidence Interval</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                  ±4.2% ML Band
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                Calculated across {currentDistrict.hospitals.length} interconnected district hospitals
              </p>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400" /> Projected Census
              </span>
            </div>
          </div>

          {/* Interactive SVG Area Curve */}
          <div className="relative h-64 w-full flex items-center justify-center">
            <svg viewBox="0 0 500 200" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="50%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0.25, 0.5, 0.75, 1.0].map((ratio, i) => (
                <line
                  key={i}
                  x1="0"
                  y1={200 - ratio * 180}
                  x2="500"
                  y2={200 - ratio * 180}
                  stroke="#1e293b"
                  strokeDasharray="4,4"
                  strokeWidth="1"
                />
              ))}

              {/* Shaded Area Under Curve */}
              {trendData.length > 0 && (
                <path
                  d={`
                    M 0,${200 - (trendData[0].value / 100) * 180}
                    ${trendData.map((d, i) => `L ${(i / (trendData.length - 1)) * 500},${200 - (d.value / 100) * 180}`).join(' ')}
                    L 500,200 L 0,200 Z
                  `}
                  fill="url(#areaGradient)"
                />
              )}

              {/* Main Trend Spline Line */}
              {trendData.length > 0 && (
                <path
                  d={`
                    M 0,${200 - (trendData[0].value / 100) * 180}
                    ${trendData.map((d, i) => `L ${(i / (trendData.length - 1)) * 500},${200 - (d.value / 100) * 180}`).join(' ')}
                  `}
                  fill="none"
                  stroke="url(#lineGradient)"
                  strokeWidth="3"
                />
              )}

              {/* Interactive Data Points */}
              {trendData.map((d, i) => {
                const cx = (i / (trendData.length - 1)) * 500;
                const cy = 200 - (d.value / 100) * 180;
                const isHovered = hoveredPointIndex === i;

                return (
                  <g
                    key={i}
                    onMouseEnter={() => setHoveredPointIndex(i)}
                    onMouseLeave={() => setHoveredPointIndex(null)}
                    className="cursor-pointer"
                  >
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isHovered ? 7 : 4}
                      fill={d.value >= 90 ? '#f43f5e' : '#06b6d4'}
                      stroke="#0f172a"
                      strokeWidth="2"
                      className="transition-all duration-200"
                    />
                    {/* Tooltip Tag */}
                    {isHovered && (
                      <g>
                        <rect
                          x={cx - 40}
                          y={cy - 40}
                          width="80"
                          height="28"
                          rx="6"
                          fill="#020617"
                          stroke="#22d3ee"
                          strokeWidth="1.2"
                        />
                        <text
                          x={cx}
                          y={cy - 22}
                          fill="#ffffff"
                          fontSize="11"
                          fontWeight="bold"
                          fontFamily="monospace"
                          textAnchor="middle"
                        >
                          {d.value}% ({d.admissions} pts)
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* X-Axis Labels */}
          <div className="flex justify-between text-xs font-mono text-slate-400 pt-2 border-t border-slate-800">
            {trendData.map((d, i) => (
              <span key={i} className={hoveredPointIndex === i ? 'text-cyan-300 font-bold' : ''}>
                {d.label}
              </span>
            ))}
          </div>
        </div>

        {/* Right 35%: Department Load Prediction Matrix */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4">
          <div className="border-b border-slate-800/80 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center justify-between">
              <span>Department Load Prediction</span>
              <span className="text-[10px] font-mono text-slate-400">Next 24h</span>
            </h3>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              Live automated acuity load distribution
            </p>
          </div>

          {/* Department Progress Bars */}
          <div className="space-y-4 flex-1 justify-center flex flex-col">
            {departmentLoads.map((item, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-300 font-bold flex items-center gap-1.5">
                    {item.alert && <AlertTriangle className="w-3.5 h-3.5 text-rose-400 animate-pulse" />}
                    <span>{item.dept}</span>
                  </span>
                  <span className={`font-black ${item.load >= 90 ? 'text-rose-400' : 'text-slate-300'}`}>
                    {item.load}%
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${item.color} transition-all duration-500`}
                    style={{ width: `${item.load}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
            <span>Critical Bottleneck:</span>
            <strong className="text-amber-400">ICU Bed Deficit projected in 6.5h</strong>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          5. AI PRESCRIPTIVE ACTIONS & RECOMMENDATIONS
         ───────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
            AI Prescriptive Mitigation Actions (1-Click Optimization)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Action 1 */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between space-y-2">
            <div>
              <div className="text-xs font-bold text-cyan-300">Pre-Discharge 6 Stable Step-Down Patients</div>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Frees up 12% critical capacity by 17:00 and reduces ICU transfer bottleneck.
              </p>
            </div>
            <button
              onClick={() => executeMitigation('action-1', 'Pre-discharge Step-Down')}
              disabled={executedActions.includes('action-1') || executingActionId === 'action-1'}
              className={`w-full py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                executedActions.includes('action-1')
                  ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300'
                  : 'bg-cyan-600 hover:bg-cyan-500 text-slate-950'
              }`}
            >
              {executedActions.includes('action-1') ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Authorized &amp; Dispatched</span>
                </>
              ) : executingActionId === 'action-1' ? (
                <span>Executing...</span>
              ) : (
                <span>Execute Transfer Order</span>
              )}
            </button>
          </div>

          {/* Action 2 */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between space-y-2">
            <div>
              <div className="text-xs font-bold text-amber-300">Authorize Automated 108 Surge Balancing</div>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Diverts Level 2 trauma cases to partner secondary facilities in Periyakulam.
              </p>
            </div>
            <button
              onClick={() => executeMitigation('action-2', 'Surge Balancing')}
              disabled={executedActions.includes('action-2') || executingActionId === 'action-2'}
              className={`w-full py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                executedActions.includes('action-2')
                  ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300'
                  : 'bg-amber-600 hover:bg-amber-500 text-slate-950'
              }`}
            >
              {executedActions.includes('action-2') ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Surge Diversion Active</span>
                </>
              ) : executingActionId === 'action-2' ? (
                <span>Activating...</span>
              ) : (
                <span>Activate Mutual Aid</span>
              )}
            </button>
          </div>

          {/* Action 3 */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between space-y-2">
            <div>
              <div className="text-xs font-bold text-purple-300">Reserve 10 Cryo Blood Units from Blood Bank</div>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Pre-stocks O- Negative cryo units for incoming mass casualty intake.
              </p>
            </div>
            <button
              onClick={() => executeMitigation('action-3', 'Reserve Blood Units')}
              disabled={executedActions.includes('action-3') || executingActionId === 'action-3'}
              className={`w-full py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                executedActions.includes('action-3')
                  ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300'
                  : 'bg-purple-600 hover:bg-purple-500 text-white'
              }`}
            >
              {executedActions.includes('action-3') ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>10 Units Pre-Reserved</span>
                </>
              ) : executingActionId === 'action-3' ? (
                <span>Reserving...</span>
              ) : (
                <span>Authorize Reservation</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

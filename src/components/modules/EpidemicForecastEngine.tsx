import React, { useMemo, useEffect, useState } from 'react';
import { useHospitalStore } from '../../store/hospitalStore';
import { sound } from '../../utils/audioEngine';
import {
  Activity,
  AlertTriangle,
  Biohazard,
  Thermometer,
  ShieldAlert,
  Play,
  RotateCcw,
  ArrowRight,
  Stethoscope,
  Wind,
  Bed,
  CheckCircle2,
  Syringe,
  TrendingUp,
  Cpu
} from 'lucide-react';

export const EpidemicForecastEngine: React.FC = () => {
  const {
    currentDistrict,
    outbreakScenario,
    setOutbreakScenario,
    surgePercent,
    setSurgePercent,
    forecastDays,
    setForecastDays,
    simulationActive,
    setSimulationActive
  } = useHospitalStore();

  const [animStep, setAnimStep] = useState(0);

  // Trigger animation steps when simulation starts
  useEffect(() => {
    if (simulationActive) {
      setAnimStep(1);
      const timers = [
        setTimeout(() => setAnimStep(2), 600),
        setTimeout(() => setAnimStep(3), 1200),
        setTimeout(() => setAnimStep(4), 1800),
        setTimeout(() => {
          setAnimStep(5);
          sound.playAlertTone(); // play a warning sound when chart completes
        }, 2400)
      ];
      return () => timers.forEach(clearTimeout);
    } else {
      setAnimStep(0);
    }
  }, [simulationActive]);

  const handleSimulate = () => {
    sound.playTactileClick();
    setSimulationActive(true);
  };

  const handleReset = () => {
    sound.playTactileClick();
    setSimulationActive(false);
  };

  // Base Data Calculations
  const baseStats = useMemo(() => {
    const totalICU = currentDistrict.hospitals.reduce((acc, h) => acc + h.icuBeds, 0);
    const totalER = currentDistrict.hospitals.reduce((acc, h) => acc + Math.floor(h.totalBeds * 0.1), 0);
    const occupiedICU = currentDistrict.hospitals.reduce((acc, h) => acc + Math.floor(h.icuBeds * 0.7), 0);
    const occupiedER = currentDistrict.hospitals.reduce((acc, h) => acc + Math.floor(totalER * 0.6), 0);
    
    // Estimates based on standard ratios
    const totalVentilators = Math.floor(totalICU * 0.8);
    const occupiedVentilators = Math.floor(totalVentilators * 0.6);
    
    const totalDoctors = Math.floor(currentDistrict.hospitals.reduce((acc, h) => acc + h.totalBeds, 0) / 5);
    const totalNurses = Math.floor(totalDoctors * 3.5);

    return {
      totalICU, occupiedICU,
      totalER, occupiedER,
      totalVentilators, occupiedVentilators,
      totalDoctors, totalNurses
    };
  }, [currentDistrict]);

  // Simulation Calculations
  const simResults = useMemo(() => {
    // Determine growth curve day by day
    const chartData = [];
    const baseDemand = baseStats.occupiedICU;
    const capacityLimit = baseStats.totalICU;
    
    let daysToShortage = -1;
    let finalDemand = baseDemand;

    for (let day = 0; day <= forecastDays; day++) {
      // Exponential growth curve simulation based on surge percent
      // e.g., if 30% surge over 7 days, daily growth factor:
      const dailyGrowth = Math.pow(1 + (surgePercent / 100), day / forecastDays);
      const simulatedDemand = Math.floor(baseDemand * dailyGrowth);
      
      chartData.push({
        day,
        label: day === 0 ? 'Current' : `Day ${day}`,
        demand: simulatedDemand,
        isShortage: simulatedDemand > capacityLimit
      });

      if (simulatedDemand > capacityLimit && daysToShortage === -1) {
        daysToShortage = day;
      }
      if (day === forecastDays) {
        finalDemand = simulatedDemand;
      }
    }

    // Resource table calculations for the final day
    const calculateResource = (baseTotal: number, baseOccupied: number, multiplier: number) => {
      const predictedDemand = Math.floor(baseOccupied * multiplier);
      const shortage = Math.max(0, predictedDemand - baseTotal);
      let risk: 'NORMAL' | 'WARNING' | 'CRITICAL' = 'NORMAL';
      if (shortage > 0) risk = 'CRITICAL';
      else if (predictedDemand / baseTotal > 0.85) risk = 'WARNING';
      
      return { total: baseTotal, demand: predictedDemand, shortage, risk };
    };

    const finalMultiplier = 1 + (surgePercent / 100);
    
    const resources = [
      { name: 'ICU Beds', icon: Bed, ...calculateResource(baseStats.totalICU, baseStats.occupiedICU, finalMultiplier) },
      { name: 'Emergency Beds', icon: Activity, ...calculateResource(baseStats.totalER, baseStats.occupiedER, finalMultiplier) },
      { name: 'Ventilators', icon: Wind, ...calculateResource(baseStats.totalVentilators, baseStats.occupiedVentilators, finalMultiplier) },
      { name: 'On-Call Doctors', icon: Stethoscope, ...calculateResource(baseStats.totalDoctors, Math.floor(baseStats.totalDoctors * 0.8), finalMultiplier) },
      { name: 'Nursing Staff', icon: Users, ...calculateResource(baseStats.totalNurses, Math.floor(baseStats.totalNurses * 0.85), finalMultiplier) },
      { name: 'Critical Medicines', icon: Syringe, total: 10000, demand: Math.floor(6000 * finalMultiplier), shortage: Math.max(0, Math.floor(6000 * finalMultiplier) - 10000), risk: Math.floor(6000 * finalMultiplier) > 10000 ? 'CRITICAL' as const : Math.floor(6000 * finalMultiplier) > 8000 ? 'WARNING' as const : 'NORMAL' as const }
    ];

    return {
      chartData,
      daysToShortage,
      finalDemand,
      capacityLimit,
      resources
    };
  }, [baseStats, surgePercent, forecastDays]);

  return (
    <div className="w-full h-full bg-[#020610] text-slate-200 flex overflow-hidden p-6 gap-6 font-sans">
      
      {/* LEFT PANEL: CONTROLS */}
      <div className="w-[350px] shrink-0 flex flex-col gap-6 overflow-y-auto custom-scrollbar pb-10">
        
        {/* Header */}
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-3">
            <Cpu className="w-7 h-7 text-cyan-400" />
            Epidemic AI
          </h2>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-bold">Capacity Forecast Engine</p>
        </div>

        {/* Callout */}
        <div className="bg-gradient-to-r from-blue-950/40 to-cyan-950/20 border border-cyan-800/40 rounded-xl p-4 shadow-lg shadow-cyan-900/10">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold text-cyan-300">WHY THIS MATTERS</h3>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Don't wait for the shortage. Predict it early and prepare beds, staff, ventilators, and medicines <strong>before</strong> it happens.
          </p>
        </div>

        {/* Controls */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-5">
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <Biohazard className="w-4 h-4 text-rose-400" />
              Disease / Outbreak Scenario
            </label>
            <select 
              value={outbreakScenario}
              onChange={(e) => setOutbreakScenario(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-cyan-500 focus:outline-none transition-colors"
            >
              <option value="Respiratory Disease">Respiratory Disease Surge</option>
              <option value="Dengue-Like Outbreak">Dengue-like Outbreak</option>
              <option value="Seasonal Infection">Seasonal Infection Surge</option>
              <option value="Custom Emergency">Custom Emergency Event</option>
            </select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Expected Patient Surge
              </label>
              <span className="text-sm font-black text-cyan-400">+{surgePercent}%</span>
            </div>
            <input 
              type="range" 
              min="5" 
              max="100" 
              step="5"
              value={surgePercent}
              onChange={(e) => setSurgePercent(Number(e.target.value))}
              className="w-full accent-cyan-500"
            />
            <div className="flex justify-between text-[9px] text-slate-500 font-mono">
              <span>Low (5%)</span>
              <span>Extreme (100%)</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-400" />
              Forecast Period
            </label>
            <div className="flex gap-2">
              {[3, 7, 14].map(days => (
                <button
                  key={days}
                  onClick={() => setForecastDays(days)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                    forecastDays === days 
                      ? 'bg-blue-600/20 border-blue-500 text-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.3)]' 
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  {days} Days
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleSimulate}
            className="flex-1 bg-gradient-to-r from-rose-600 to-orange-500 hover:from-rose-500 hover:to-orange-400 text-white py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-900/30 transition-all active:scale-95"
          >
            <Play className="w-4 h-4 fill-current" />
            SIMULATE OUTBREAK
          </button>
          
          <button
            onClick={handleReset}
            disabled={!simulationActive}
            className="px-4 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 py-3 rounded-xl font-bold transition-all active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Visual Flow Diagram */}
        <div className="mt-4 pt-4 border-t border-slate-800/80">
          <h4 className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-4 text-center">Core Value Flow</h4>
          <div className="flex flex-col items-center gap-2">
            {[
              { text: 'DISEASE OUTBREAK', color: 'text-rose-400 bg-rose-950/30 border-rose-900/50' },
              { text: 'PATIENT SURGE', color: 'text-orange-400 bg-orange-950/30 border-orange-900/50' },
              { text: 'AI DEMAND FORECAST', color: 'text-cyan-400 bg-cyan-950/30 border-cyan-900/50' },
              { text: 'SHORTAGE PREDICTION', color: 'text-amber-400 bg-amber-950/30 border-amber-900/50' },
              { text: 'EARLY WARNING & ACTION', color: 'text-emerald-400 bg-emerald-950/30 border-emerald-900/50' },
            ].map((node, i) => (
              <React.Fragment key={i}>
                <div className={`px-4 py-2 rounded-lg border text-xs font-bold text-center w-full max-w-[240px] shadow-sm ${node.color}`}>
                  {node.text}
                </div>
                {i < 4 && <ArrowRight className="w-4 h-4 text-slate-600 rotate-90" />}
              </React.Fragment>
            ))}
          </div>
        </div>

      </div>

      {/* RIGHT PANEL: ANALYTICS & RESULTS */}
      <div className="flex-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar pb-10 pr-2">
        
        {!simulationActive ? (
          <div className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/20">
            <Cpu className="w-16 h-16 text-slate-700 mb-4 animate-pulse" />
            <h3 className="text-xl font-bold text-slate-400">AI Simulation Idle</h3>
            <p className="text-slate-500 text-sm mt-2 max-w-sm text-center">
              Configure your outbreak scenario on the left and click "Simulate Outbreak" to forecast future capacity constraints.
            </p>
          </div>
        ) : (
          <>
            {/* 1. Large Timeline Chart */}
            <div className={`bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl transition-all duration-700 ${animStep >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="flex justify-between items-end mb-8">
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    Predicted Patient Demand vs Capacity
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Simulating +{surgePercent}% surge over {forecastDays} days.</p>
                </div>
                <div className="flex items-center gap-4 text-xs font-bold">
                  <div className="flex items-center gap-1"><div className="w-3 h-3 bg-cyan-500 rounded-sm"></div> Demand (Safe)</div>
                  <div className="flex items-center gap-1"><div className="w-3 h-3 bg-rose-500 rounded-sm animate-pulse"></div> Shortage</div>
                  <div className="flex items-center gap-1"><div className="w-6 h-0.5 bg-white"></div> Limit</div>
                </div>
              </div>

              {/* Custom CSS Bar Chart */}
              <div className="relative w-full h-[250px] border-b border-l border-slate-700 pb-2 pl-2 mt-4 flex items-end justify-between px-2">
                
                {/* Y-Axis Labels */}
                <div className="absolute -left-8 top-0 text-[10px] text-slate-500 font-mono">{Math.floor(simResults.capacityLimit * 1.5)}</div>
                <div className="absolute -left-8 top-1/2 text-[10px] text-slate-500 font-mono">{Math.floor(simResults.capacityLimit * 0.75)}</div>
                <div className="absolute -left-6 bottom-0 text-[10px] text-slate-500 font-mono">0</div>

                {/* Capacity Limit Line */}
                <div 
                  className="absolute left-0 w-full border-b-2 border-dashed border-white/60 z-10"
                  style={{ bottom: `${(simResults.capacityLimit / (simResults.capacityLimit * 1.5)) * 100}%` }}
                >
                  <div className="absolute right-0 -top-6 bg-white text-slate-900 text-[9px] font-black px-2 py-0.5 rounded shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                    MAX CAPACITY ({simResults.capacityLimit})
                  </div>
                </div>

                {/* Bars */}
                {simResults.chartData.map((data, index) => {
                  const heightPercent = Math.min(100, (data.demand / (simResults.capacityLimit * 1.5)) * 100);
                  const isOver = data.demand > simResults.capacityLimit;
                  const safeHeight = isOver ? (simResults.capacityLimit / (simResults.capacityLimit * 1.5)) * 100 : heightPercent;
                  const dangerHeight = isOver ? heightPercent - safeHeight : 0;

                  return (
                    <div key={index} className="flex flex-col items-center flex-1 mx-1 group relative">
                      {/* Tooltip */}
                      <div className="absolute -top-10 opacity-0 group-hover:opacity-100 bg-slate-800 text-white text-[10px] px-2 py-1 rounded pointer-events-none transition-opacity z-20 whitespace-nowrap">
                        Demand: {data.demand}
                      </div>

                      {/* Bar Container */}
                      <div className="w-full max-w-[40px] flex flex-col justify-end h-[240px]">
                        {/* Danger Bar Segment */}
                        {isOver && (
                          <div 
                            className="w-full bg-gradient-to-t from-rose-500 to-rose-400 rounded-t-sm animate-in fade-in slide-in-from-bottom-2"
                            style={{ height: `${(dangerHeight / 100) * 240}px`, transitionDelay: `${index * 100}ms` }}
                          />
                        )}
                        {/* Safe Bar Segment */}
                        <div 
                          className={`w-full bg-gradient-to-t from-cyan-600 to-cyan-400 ${!isOver ? 'rounded-t-sm' : ''} animate-in fade-in slide-in-from-bottom-full`}
                          style={{ height: `${(safeHeight / 100) * 240}px`, transitionDelay: `${index * 100}ms` }}
                        />
                      </div>
                      
                      {/* X-Axis Label */}
                      <div className="mt-3 text-[10px] font-bold text-slate-400 uppercase">{data.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* 2. Early Warning Card */}
              <div className={`col-span-1 md:col-span-1 bg-gradient-to-br ${simResults.daysToShortage > -1 ? 'from-rose-950/60 to-slate-900 border-rose-500/50' : 'from-emerald-950/60 to-slate-900 border-emerald-500/50'} border rounded-2xl p-6 shadow-xl transition-all duration-700 delay-300 ${animStep >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-lg ${simResults.daysToShortage > -1 ? 'bg-rose-500/20' : 'bg-emerald-500/20'}`}>
                    {simResults.daysToShortage > -1 ? <AlertTriangle className="w-6 h-6 text-rose-400 animate-pulse" /> : <CheckCircle2 className="w-6 h-6 text-emerald-400" />}
                  </div>
                  <h3 className="text-sm font-black tracking-widest text-slate-300 uppercase">Early Warning</h3>
                </div>
                
                {simResults.daysToShortage > -1 ? (
                  <>
                    <h2 className="text-2xl font-black text-rose-400 leading-tight">
                      Shortage predicted in <br/>{simResults.daysToShortage} Days
                    </h2>
                    <div className="mt-6 space-y-3 font-mono text-sm">
                      <div className="flex justify-between"><span className="text-slate-400">Predicted Demand:</span> <span className="text-white">{simResults.finalDemand}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Available Capacity:</span> <span className="text-white">{simResults.capacityLimit}</span></div>
                      <div className="flex justify-between border-t border-rose-500/30 pt-3"><span className="text-rose-400 font-bold">Expected Shortage:</span> <span className="text-rose-400 font-bold">{simResults.finalDemand - simResults.capacityLimit} Beds</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Risk Level:</span> <span className="bg-rose-500 text-white px-2 py-0.5 rounded font-black text-xs animate-pulse">CRITICAL</span></div>
                    </div>
                  </>
                ) : (
                  <>
                    <h2 className="text-2xl font-black text-emerald-400 leading-tight">
                      Capacity Sufficient
                    </h2>
                    <p className="mt-4 text-sm text-slate-400">Current resources can handle the simulated {surgePercent}% surge over {forecastDays} days without breaching limits.</p>
                  </>
                )}
              </div>

              {/* 3. Resource Forecast Table */}
              <div className={`col-span-1 md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl transition-all duration-700 delay-500 ${animStep >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <h3 className="text-sm font-black tracking-widest text-slate-300 uppercase mb-4">Resource Forecast (Day {forecastDays})</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-700 text-[10px] uppercase text-slate-500 tracking-wider">
                        <th className="pb-3 pl-2">Resource</th>
                        <th className="pb-3">Current Available</th>
                        <th className="pb-3">Predicted Demand</th>
                        <th className="pb-3">Shortage</th>
                        <th className="pb-3 text-right pr-2">Risk</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {simResults.resources.map((res, i) => (
                        <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 pl-2 flex items-center gap-2 text-sm font-bold text-slate-200">
                            <res.icon className="w-4 h-4 text-slate-400" /> {res.name}
                          </td>
                          <td className="py-3 text-sm text-slate-400 font-mono">{res.total.toLocaleString()}</td>
                          <td className="py-3 text-sm text-white font-mono font-bold">{res.demand.toLocaleString()}</td>
                          <td className={`py-3 text-sm font-mono font-bold ${res.shortage > 0 ? 'text-rose-400' : 'text-slate-500'}`}>
                            {res.shortage > 0 ? `-${res.shortage.toLocaleString()}` : '0'}
                          </td>
                          <td className="py-3 text-right pr-2">
                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider
                              ${res.risk === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 
                                res.risk === 'WARNING' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 
                                'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}
                            `}>
                              {res.risk}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* 4. AI Recommendations */}
            <div className={`bg-gradient-to-r from-blue-900/30 to-cyan-900/10 border border-blue-500/30 rounded-2xl p-6 shadow-xl transition-all duration-700 delay-700 ${animStep >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="flex items-center gap-2 mb-4">
                <Cpu className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-black tracking-widest text-blue-300 uppercase">AI Recommendations</h3>
                <span className="ml-2 text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-mono border border-blue-500/40">Demo Forecast</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  simResults.daysToShortage > -1 ? `Prepare ${simResults.finalDemand - simResults.capacityLimit} additional ICU beds before Day ${simResults.daysToShortage}.` : 'Maintain current ICU bed distribution.',
                  'Arrange additional emergency ventilators via regional logistics hub.',
                  'Increase on-call doctor and nursing staff shifts by 25%.',
                  'Coordinate overflow capacity with Tier-2 private hospitals nearby.',
                  'Review and restock critical medicine inventory immediately.',
                  'Monitor 108 Ambulance intake rates continuously.'
                ].map((rec, i) => (
                  <div key={i} className="flex items-start gap-3 bg-slate-950/40 p-3 rounded-xl border border-slate-800/50">
                    <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5 border border-blue-500/30">
                      {i + 1}
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-medium">{rec}</p>
                  </div>
                ))}
              </div>
            </div>

          </>
        )}
      </div>

    </div>
  );
};

// Lucide icon stub imports (since we missed some above, assume they are available or define fallback)
function Users(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>; }

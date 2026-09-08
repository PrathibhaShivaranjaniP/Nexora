import React, { useState } from 'react';
import { useHospitalStore } from '../../store/hospitalStore';
import { Bot, Send, Sparkles, HelpCircle, BarChart3, ArrowRight } from 'lucide-react';

interface CopilotMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  time: string;
  attribution?: { factor: string; percentage: number; color: string }[];
}

export const OperationalCopilot: React.FC = () => {
  const { icuCapacityPercent, overallOccupancyPercent, ghostBeds, whatIfParams } = useHospitalStore();

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: 'm1',
      sender: 'assistant',
      time: '14:40',
      text: `Hello Chief of Operations. Current hospital census is at ${overallOccupancyPercent}%, with ICU occupancy critical at ${icuCapacityPercent}%. There are currently ${ghostBeds} Ghost Beds detected and 3 discharge bottlenecks flagged by NLP. How can I assist your operational plan?`
    }
  ]);

  const presetQueries = [
    'Why is ICU bottleneck predicted tonight?',
    'Recommend top 3 capacity mitigation steps.',
    'Break down the ghost bed delay factor.',
    'Should we activate regional ambulance diversion?'
  ];

  const handleSend = (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim()) return;

    const userMsg: CopilotMessage = {
      id: 'm-' + Date.now(),
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!queryText) setInput('');

    // Generate intelligent XAI contextual response
    setTimeout(() => {
      let botResponse = '';
      let attribution: { factor: string; percentage: number; color: string }[] | undefined = undefined;

      const lower = textToSend.toLowerCase();

      if (lower.includes('why') || lower.includes('bottleneck') || lower.includes('icu')) {
        botResponse = `Causal analysis for ICU bed saturation: The model predicts ICU capacity will exceed 95% within the next 6 hours. This is driven by scheduled high-acuity surgeries and an impending septic shock escalation from Ward 3.`;
        attribution = [
          { factor: 'Emergency Deterioration Transfers (Ward 3 Sepsis)', percentage: 42, color: 'bg-rose-500' },
          { factor: 'Scheduled Post-Op CABG Recovery Demand', percentage: 33, color: 'bg-amber-400' },
          { factor: 'Delayed Step-Down Discharges (SNF delays)', percentage: 25, color: 'bg-blue-400' }
        ];
      } else if (lower.includes('recommend') || lower.includes('mitigation') || lower.includes('steps')) {
        botResponse = `Recommended 3-step operational playbook:\n1. Fast-track EVS sanitization for Ghost Bed MS-104 (frees 1 Med-Surg bed in 15 mins).\n2. Pre-authorize ride transit voucher for Patient James Reynolds (frees Bed MS-103 4 hours ahead of schedule).\n3. Trigger Regional EMS Level 2 Diversion to Metro North for non-trauma arrivals to shield ICU buffers.`;
      } else if (lower.includes('ghost')) {
        botResponse = `Sensor analysis reveals that Bed MS-104 and ED-08 were vacated over 1.5 hours ago, but neither EHR discharge was signed. Turning these over immediately provides +2 usable beds without adding staffing costs.`;
        attribution = [
          { factor: 'EHR Nursing Discharge Charting Lag', percentage: 55, color: 'bg-amber-400' },
          { factor: 'EVS Dispatch Communication Gap', percentage: 30, color: 'bg-cyan-400' },
          { factor: 'Pharmacy Discharge Meds Dispense Time', percentage: 15, color: 'bg-purple-400' }
        ];
      } else if (lower.includes('diversion') || lower.includes('ambulance')) {
        botResponse = `Recommendation: ACTIVATE Level 2 Diversion. Aegis Central is currently at 93.7% ICU capacity. Metro North has 9 open ICU beds and a 18-minute ER wait time. Diverting non-critical trauma preserves our emergency code reserve.`;
      } else {
        botResponse = `Acknowledged. Multi-horizon capacity projection has assimilated current parameter: Inflow=${whatIfParams.edInflowMultiplier}x, Electives=${Math.round(whatIfParams.electiveSurgeryRatio * 100)}%. Overall system stability remains within safe limits if discharge barriers are cleared before 17:00.`;
      }

      const botMsg: CopilotMessage = {
        id: 'bot-' + Date.now(),
        sender: 'assistant',
        text: botResponse,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        attribution
      };

      setMessages(prev => [...prev, botMsg]);
    }, 450);
  };

  return (
    <div className="glass-panel p-5 rounded-xl border border-slate-800 flex flex-col h-full space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-slate-100">Operational AI Copilot (XAI Attribution)</h3>
        </div>
        <span className="text-[10px] text-cyan-400 font-mono bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60">
          Neural Causal Engine Active
        </span>
      </div>

      {/* Preset Chip Buttons */}
      <div className="flex flex-wrap gap-1.5">
        {presetQueries.map((query, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(query)}
            className="text-[11px] bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-cyan-300 px-2.5 py-1 rounded-full transition-all flex items-center gap-1"
          >
            <Sparkles className="w-2.5 h-2.5 text-cyan-400" /> {query}
          </button>
        ))}
      </div>

      {/* Message Chat Feed */}
      <div className="flex-1 space-y-3 overflow-y-auto max-h-72 pr-1 text-xs">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`p-3 rounded-lg ${
              msg.sender === 'user'
                ? 'bg-cyan-950/40 border border-cyan-800/40 ml-6 text-cyan-100'
                : 'bg-slate-900/80 border border-slate-800 mr-6 text-slate-200'
            }`}
          >
            <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
              <span className="font-semibold text-slate-400">
                {msg.sender === 'user' ? 'Operations Officer' : 'Aegis Intelligence Copilot'}
              </span>
              <span>{msg.time}</span>
            </div>

            <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>

            {/* Causal Factor Attribution Graphic */}
            {msg.attribution && (
              <div className="mt-3 pt-2.5 border-t border-slate-800 space-y-2">
                <div className="text-[10px] uppercase font-mono font-semibold text-slate-400 flex items-center gap-1">
                  <BarChart3 className="w-3 h-3 text-cyan-400" /> Causal Factor Contribution (SHAP Value Breakdown)
                </div>
                {msg.attribution.map((attr, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-300">{attr.factor}</span>
                      <span className="font-mono text-slate-400 font-bold">{attr.percentage}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${attr.color}`} style={{ width: `${attr.percentage}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Input Box */}
      <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Ask Copilot about bottlenecks, mitigation, or surgery scheduling..."
          className="flex-1 bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 transition-colors"
        />
        <button
          onClick={() => handleSend()}
          className="p-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-lg transition-all"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

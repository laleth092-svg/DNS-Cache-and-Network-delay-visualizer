import React from 'react';
import {
  BookOpen,
  Play,
  Zap,
  Globe,
  Database,
  Layers,
  Server,
  ArrowRight,
  Sparkles,
  Flame,
  Radio,
} from 'lucide-react';
import { ScenarioDefinition, NETWORK_SCENARIOS } from '../data/defaultDnsDatabase';

interface ScenarioDrawerProps {
  onSelectScenario: (scenario: ScenarioDefinition) => void;
  activeScenarioId?: string;
}

export const ScenarioDrawer: React.FC<ScenarioDrawerProps> = ({
  onSelectScenario,
  activeScenarioId,
}) => {
  const getScenarioIcon = (id: string) => {
    switch (id) {
      case 'cold_lookup':
        return <Globe className="w-4 h-4 text-sky-400" />;
      case 'browser_hit':
        return <Layers className="w-4 h-4 text-emerald-400" />;
      case 'os_hit':
        return <Database className="w-4 h-4 text-indigo-400" />;
      case 'resolver_hit':
        return <Server className="w-4 h-4 text-amber-400" />;
      case 'cname_alias':
        return <Sparkles className="w-4 h-4 text-purple-400" />;
      default:
        return <Zap className="w-4 h-4 text-sky-400" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200 p-6 overflow-y-auto">
      <div className="mb-6 pb-4 border-b border-slate-800">
        <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-sky-400" />
          <span>Computer Networks Laboratory Scenarios</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
          Select a guided experiment to test key networking principles: multi-tier cache hits vs misses,
          recursive resolution delegation, alias chaining, and the four fundamental network delays.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {NETWORK_SCENARIOS.map((scenario) => {
          const isActive = activeScenarioId === scenario.id;

          return (
            <div
              key={scenario.id}
              className={`p-5 rounded-xl border transition-all duration-200 flex flex-col justify-between ${
                isActive
                  ? 'bg-slate-900 border-sky-400/80 ring-1 ring-sky-400/40 shadow-lg shadow-sky-500/5'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-slate-800 border border-slate-700">
                      {getScenarioIcon(scenario.id)}
                    </div>
                    <h3 className="text-sm font-bold text-slate-100">{scenario.title}</h3>
                  </div>
                  <span className="text-[11px] font-mono text-sky-400 font-semibold bg-sky-950/60 px-2 py-0.5 rounded border border-sky-800/60">
                    {scenario.badge}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mb-3">
                  {scenario.description}
                </p>

                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80 text-[11px] text-slate-400 mb-4">
                  <span className="text-amber-400 font-semibold">Educational Focus: </span>
                  {scenario.educationalFocus}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                <div className="text-xs font-mono text-slate-400">
                  Target: <span className="text-slate-200 font-semibold">{scenario.targetDomain}</span>{' '}
                  <span className="text-sky-400">({scenario.recordType})</span>
                </div>

                <button
                  onClick={() => onSelectScenario(scenario)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-sky-500 text-slate-950 shadow-sm'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-100'
                  }`}
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>{isActive ? 'Active Scenario' : 'Load & Run'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

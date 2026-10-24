import React from 'react';
import { Network, Play, RotateCcw } from 'lucide-react';

interface TopBarProps {
  activeTab: 'topology' | 'caches' | 'delay_lab' | 'packets' | 'scenarios';
  setActiveTab: (tab: 'topology' | 'caches' | 'delay_lab' | 'packets' | 'scenarios') => void;
  onRunQuery: () => void;
  onResetAll: () => void;
  isSimulating: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  setActiveTab,
  onRunQuery,
  onResetAll,
  isSimulating,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 bg-slate-900 border-b border-slate-800 text-white select-none">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
        <div className="w-7 h-7 rounded-md bg-sky-500/10 border border-sky-400/30 flex items-center justify-center text-sky-400">
          <Network className="w-4 h-4" />
        </div>
        <span className="text-base font-bold tracking-tight text-slate-100">
          NetScope DNS
        </span>
      </div>

      {/* Zone 2: 4-5 clean single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
        <button
          onClick={() => setActiveTab('topology')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
            activeTab === 'topology'
              ? 'border-sky-400 text-slate-100 font-semibold'
              : 'border-transparent'
          }`}
        >
          DNS Topology
        </button>
        <button
          onClick={() => setActiveTab('caches')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
            activeTab === 'caches'
              ? 'border-sky-400 text-slate-100 font-semibold'
              : 'border-transparent'
          }`}
        >
          Multi-Tier Caches
        </button>
        <button
          onClick={() => setActiveTab('delay_lab')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
            activeTab === 'delay_lab'
              ? 'border-sky-400 text-slate-100 font-semibold'
              : 'border-transparent'
          }`}
        >
          Network Delay Lab
        </button>
        <button
          onClick={() => setActiveTab('packets')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
            activeTab === 'packets'
              ? 'border-sky-400 text-slate-100 font-semibold'
              : 'border-transparent'
          }`}
        >
          Packet Inspector
        </button>
        <button
          onClick={() => setActiveTab('scenarios')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
            activeTab === 'scenarios'
              ? 'border-sky-400 text-slate-100 font-semibold'
              : 'border-transparent'
          }`}
        >
          Scenarios
        </button>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          onClick={onResetAll}
          title="Reset topology and caches"
          className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors border border-slate-700/60"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          onClick={onRunQuery}
          disabled={isSimulating}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 shadow-sm ${
            isSimulating
              ? 'bg-sky-600/50 text-sky-200 cursor-not-allowed'
              : 'bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold'
          }`}
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{isSimulating ? 'Simulating...' : 'Resolve Query'}</span>
        </button>
      </div>
    </header>
  );
};

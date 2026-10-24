import React from 'react';
import {
  Server,
  Laptop,
  Database,
  Globe,
  ArrowRight,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Play,
  Pause,
  RotateCcw,
} from 'lucide-react';
import { DnsNode, DnsPacketStep, ResolutionTrace } from '../types/network';

interface DnsTopologyCanvasProps {
  nodes: DnsNode[];
  trace: ResolutionTrace | null;
  currentStepIndex: number;
  isPlaying: boolean;
  speed: number;
  onSetStepIndex: (idx: number) => void;
  onTogglePlay: () => void;
  onSetSpeed: (speed: number) => void;
  onReset: () => void;
}

export const DnsTopologyCanvas: React.FC<DnsTopologyCanvasProps> = ({
  nodes,
  trace,
  currentStepIndex,
  isPlaying,
  speed,
  onSetStepIndex,
  onTogglePlay,
  onSetSpeed,
  onReset,
}) => {
  const currentStep: DnsPacketStep | undefined = trace?.steps[currentStepIndex];

  // Helper to get node position
  const getNode = (id: string) => nodes.find((n) => n.id === id);

  const fromNode = currentStep ? getNode(currentStep.fromNodeId) : null;
  const toNode = currentStep ? getNode(currentStep.toNodeId) : null;

  // Node Icon Mapping
  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'client':
        return <Laptop className="w-5 h-5 text-sky-400" />;
      case 'browser_cache':
        return <Layers className="w-4 h-4 text-emerald-400" />;
      case 'os_cache':
        return <Database className="w-4 h-4 text-indigo-400" />;
      case 'local_resolver':
        return <Server className="w-5 h-5 text-amber-400" />;
      case 'root_server':
        return <Globe className="w-5 h-5 text-rose-400" />;
      case 'tld_server':
        return <Globe className="w-5 h-5 text-purple-400" />;
      case 'auth_server':
        return <Server className="w-5 h-5 text-cyan-400" />;
      case 'destination_host':
        return <Globe className="w-5 h-5 text-emerald-400" />;
      default:
        return <Server className="w-5 h-5 text-slate-400" />;
    }
  };

  // Node Accent Border/Glow when active
  const isNodeActive = (id: string) => {
    if (!currentStep) return false;
    return currentStep.fromNodeId === id || currentStep.toNodeId === id;
  };

  const isNodeHit = (id: string) => {
    if (!currentStep) return false;
    return currentStep.isCacheHit && currentStep.fromNodeId === id;
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200">
      {/* Top Playback & Step Strip */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-3 border-b border-slate-800/80 bg-slate-900/60">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700/60">
            <button
              onClick={() => onSetStepIndex(Math.max(0, currentStepIndex - 1))}
              disabled={currentStepIndex <= 0}
              title="Previous Step"
              className="p-1.5 hover:bg-slate-700/80 rounded disabled:opacity-30 disabled:cursor-not-allowed text-slate-300"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={onTogglePlay}
              title={isPlaying ? 'Pause Animation' : 'Auto Play'}
              className="px-2.5 py-1 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded flex items-center gap-1.5"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Play</span>
                </>
              )}
            </button>
            <button
              onClick={() =>
                onSetStepIndex(
                  trace ? Math.min(trace.steps.length - 1, currentStepIndex + 1) : 0
                )
              }
              disabled={!trace || currentStepIndex >= trace.steps.length - 1}
              title="Next Step"
              className="p-1.5 hover:bg-slate-700/80 rounded disabled:opacity-30 disabled:cursor-not-allowed text-slate-300"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={onReset}
              title="Reset to Step 1"
              className="p-1.5 hover:bg-slate-700/80 rounded text-slate-400 hover:text-slate-200"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Speed Selector */}
          <div className="flex items-center gap-1 text-xs text-slate-400 bg-slate-900/80 px-2 py-1 rounded-md border border-slate-800">
            <span>Speed:</span>
            {[0.5, 1, 2, 4].map((s) => (
              <button
                key={s}
                onClick={() => onSetSpeed(s)}
                className={`px-1.5 py-0.5 rounded text-xs transition-colors ${
                  speed === s
                    ? 'bg-sky-500/20 text-sky-400 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Step Progress Pill */}
          <div className="text-xs font-mono text-slate-400">
            Step{' '}
            <span className="text-sky-400 font-semibold tabular-nums">
              {trace ? currentStepIndex + 1 : 0}
            </span>{' '}
            of{' '}
            <span className="text-slate-300 tabular-nums">
              {trace ? trace.steps.length : 0}
            </span>
          </div>
        </div>

        {/* Trace Result Preview */}
        {trace && (
          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-400">Target:</span>
            <span className="font-mono text-sky-300 font-semibold">{trace.domain}</span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-400">Resolved IP:</span>
            <span className="font-mono text-emerald-400 font-semibold">
              {trace.resolvedIp || 'Resolving...'}
            </span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-400">Total Latency:</span>
            <span className="font-mono text-amber-300 font-semibold tabular-nums">
              {trace.totalDelayMs} ms
            </span>
          </div>
        )}
      </div>

      {/* Main Canvas / SVG Interactive Topology */}
      <div className="relative flex-1 min-h-[460px] overflow-hidden p-6 flex flex-col justify-between">
        {/* Topology SVG Canvas */}
        <div className="relative w-full h-[400px] border border-slate-800/80 rounded-xl bg-slate-900/40 p-4">
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <defs>
              <linearGradient id="linkGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#818cf8" stopOpacity="0.4" />
              </linearGradient>
              <linearGradient id="activeLink" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#34d399" stopOpacity="0.9" />
              </linearGradient>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Static Topology Links */}
            {/* Client -> Browser Cache */}
            <path
              d="M 170 210 C 180 150, 200 130, 230 130"
              fill="none"
              stroke="#334155"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
            {/* Client -> OS Cache */}
            <path
              d="M 170 230 C 180 290, 200 310, 230 310"
              fill="none"
              stroke="#334155"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
            {/* Client -> Local Resolver */}
            <path
              d="M 170 220 L 410 220"
              fill="none"
              stroke="#334155"
              strokeWidth="2"
            />
            {/* Local Resolver -> Root */}
            <path
              d="M 470 210 C 530 140, 600 90, 670 90"
              fill="none"
              stroke="#334155"
              strokeWidth="2"
            />
            {/* Local Resolver -> TLD */}
            <path
              d="M 470 220 L 670 220"
              fill="none"
              stroke="#334155"
              strokeWidth="2"
            />
            {/* Local Resolver -> Authoritative */}
            <path
              d="M 470 230 C 530 300, 600 350, 670 350"
              fill="none"
              stroke="#334155"
              strokeWidth="2"
            />
            {/* Authoritative -> Destination Host (Conceptual) */}
            <path
              d="M 750 350 C 810 320, 840 250, 870 230"
              fill="none"
              stroke="#1e293b"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />

            {/* Animated Packet Flight when active */}
            {fromNode && toNode && (
              <g>
                <path
                  d={`M ${fromNode.x + 40} ${fromNode.y} Q ${
                    (fromNode.x + toNode.x) / 2
                  } ${(fromNode.y + toNode.y) / 2 - 25} ${toNode.x} ${toNode.y}`}
                  fill="none"
                  stroke="url(#activeLink)"
                  strokeWidth="3.5"
                  filter="url(#glow)"
                />
                <circle
                  cx={toNode.x}
                  cy={toNode.y}
                  r="6"
                  fill="#38bdf8"
                  className="animate-ping"
                />
              </g>
            )}
          </svg>

          {/* Render Topology Nodes */}
          {nodes.map((node) => {
            const active = isNodeActive(node.id);
            const isHit = isNodeHit(node.id);

            return (
              <div
                key={node.id}
                style={{
                  left: `${node.x}px`,
                  top: `${node.y - 36}px`,
                }}
                className={`absolute w-44 p-3 rounded-lg border transition-all duration-300 z-10 ${
                  active
                    ? 'bg-slate-900 border-sky-400 ring-2 ring-sky-500/30 shadow-lg shadow-sky-500/10'
                    : isHit
                    ? 'bg-emerald-950/60 border-emerald-500 shadow-lg shadow-emerald-500/20'
                    : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1 rounded bg-slate-800 border border-slate-700/80">
                    {getNodeIcon(node.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-slate-100 truncate">
                      {node.name}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {node.ip}
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 border-t border-slate-800/80 pt-1.5 mt-1 flex items-center justify-between">
                  <span className="truncate">{node.label}</span>
                  {active && (
                    <span className="text-[10px] text-sky-400 font-mono font-medium">
                      ACTIVE
                    </span>
                  )}
                  {isHit && (
                    <span className="text-[10px] text-emerald-400 font-mono font-semibold flex items-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3 inline" /> HIT
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Current Hop Explanatory Card */}
        {currentStep ? (
          <div className="mt-4 p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${
                    currentStep.isCacheHit
                      ? 'bg-emerald-400 animate-pulse'
                      : 'bg-sky-400'
                  }`}
                />
                <span className="text-sm font-semibold text-slate-100">
                  Step {currentStep.stepIndex}: {currentStep.label}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {currentStep.fromNodeId} → {currentStep.toNodeId}
                </span>
              </div>

              {/* Hop Latency Breakdown Badges */}
              <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
                <div className="text-slate-400">
                  Prop:{' '}
                  <span className="text-amber-300 font-semibold tabular-nums">
                    {currentStep.hopDelays.propDelayMs}ms
                  </span>
                </div>
                <div className="text-slate-600">·</div>
                <div className="text-slate-400">
                  Trans:{' '}
                  <span className="text-cyan-300 font-semibold tabular-nums">
                    {currentStep.hopDelays.transDelayMs}ms
                  </span>
                </div>
                <div className="text-slate-600">·</div>
                <div className="text-slate-400">
                  Proc:{' '}
                  <span className="text-purple-300 font-semibold tabular-nums">
                    {currentStep.hopDelays.procDelayMs}ms
                  </span>
                </div>
                <div className="text-slate-600">·</div>
                <div className="text-slate-400">
                  Queue:{' '}
                  <span className="text-rose-300 font-semibold tabular-nums">
                    {currentStep.hopDelays.queueDelayMs}ms
                  </span>
                </div>
                <div className="text-slate-600">·</div>
                <div className="text-sky-300 font-semibold bg-sky-950/60 px-2 py-0.5 rounded border border-sky-800/80 tabular-nums">
                  Hop Total: {currentStep.hopDelays.totalHopDelayMs}ms
                </div>
              </div>
            </div>

            <p className="mt-2.5 text-xs text-slate-300 leading-relaxed">
              {currentStep.description}
            </p>

            {currentStep.recordReturned && (
              <div className="mt-3 p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    Answer: {currentStep.recordReturned.domain}{' '}
                    <span className="text-sky-400">{currentStep.recordReturned.type}</span>{' '}
                    <span className="text-slate-100">{currentStep.recordReturned.value}</span>
                  </span>
                </div>
                <div className="text-slate-400">
                  TTL: <span className="text-amber-300">{currentStep.recordReturned.ttl}s</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800/60 text-center text-xs text-slate-400">
            Click &quot;Resolve Query&quot; above to initiate a DNS lookup and observe the live packet traversal.
          </div>
        )}
      </div>
    </div>
  );
};

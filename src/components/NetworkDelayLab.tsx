import React, { useState } from 'react';
import {
  Activity,
  Cpu,
  Layers,
  Zap,
  Globe,
  Radio,
  AlertTriangle,
  ArrowRight,
  Info,
  Maximize2,
  CheckCircle,
} from 'lucide-react';
import { DelayParameters } from '../types/network';

interface NetworkDelayLabProps {
  delayParams: DelayParameters;
  onUpdateParams: (newParams: Partial<DelayParameters>) => void;
}

export const NetworkDelayLab: React.FC<NetworkDelayLabProps> = ({
  delayParams,
  onUpdateParams,
}) => {
  const [arrivalRatePacketsPerSec, setArrivalRatePacketsPerSec] = useState<number>(15000);
  const [selectedPreset, setSelectedPreset] = useState<string>('transatlantic');

  // Math derivations
  const L_bits = delayParams.packetSizeBytes * 8;
  const R_bps = delayParams.bandwidthMbps * 1_000_000;

  // d_trans = L / R (in ms)
  const d_trans = (L_bits / R_bps) * 1000;

  // d_prop = d / s (in ms)
  const d_prop = (delayParams.distanceKm / delayParams.mediumSpeedKmPerSec) * 1000;

  // d_proc (in ms)
  const d_proc = delayParams.processingDelayMs;

  // Queuing: traffic intensity I = (L * a) / R
  const trafficIntensity = Number(((L_bits * arrivalRatePacketsPerSec) / R_bps).toFixed(3));

  // Queuing delay: (N * L) / R
  const d_queue = ((delayParams.queuePacketsWaiting * L_bits) / R_bps) * 1000;

  // Total Nodal Delay: d_nodal = d_proc + d_queue + d_trans + d_prop
  const d_nodal = d_proc + d_queue + d_trans + d_prop;

  // Proportions for stacked bar chart
  const p_proc = d_nodal > 0 ? (d_proc / d_nodal) * 100 : 0;
  const p_queue = d_nodal > 0 ? (d_queue / d_nodal) * 100 : 0;
  const p_trans = d_nodal > 0 ? (d_trans / d_nodal) * 100 : 0;
  const p_prop = d_nodal > 0 ? (d_prop / d_nodal) * 100 : 0;

  const isBufferOverflow =
    delayParams.queuePacketsWaiting >= delayParams.queueBufferCapacity || trafficIntensity > 1.0;

  // Presets
  const applyPreset = (presetKey: string) => {
    setSelectedPreset(presetKey);
    switch (presetKey) {
      case 'lan':
        onUpdateParams({
          distanceKm: 0.1, // 100 meters
          bandwidthMbps: 1000, // 1 Gbps LAN
          packetSizeBytes: 512,
          processingDelayMs: 0.05,
          queuePacketsWaiting: 1,
        });
        setArrivalRatePacketsPerSec(10000);
        break;
      case 'metro_fiber':
        onUpdateParams({
          distanceKm: 50, // 50 km
          bandwidthMbps: 1000,
          packetSizeBytes: 512,
          processingDelayMs: 0.1,
          queuePacketsWaiting: 3,
        });
        setArrivalRatePacketsPerSec(20000);
        break;
      case 'continental':
        onUpdateParams({
          distanceKm: 3500, // NYC to SF
          bandwidthMbps: 100,
          packetSizeBytes: 1500,
          processingDelayMs: 0.2,
          queuePacketsWaiting: 8,
        });
        setArrivalRatePacketsPerSec(5000);
        break;
      case 'transatlantic':
        onUpdateParams({
          distanceKm: 6500, // London to NYC Subsea Cable
          bandwidthMbps: 100,
          packetSizeBytes: 512,
          processingDelayMs: 0.3,
          queuePacketsWaiting: 5,
        });
        setArrivalRatePacketsPerSec(8000);
        break;
      case 'leo_satellite':
        onUpdateParams({
          distanceKm: 550, // Starlink LEO altitude
          mediumSpeedKmPerSec: 300000, // speed of light in vacuum
          bandwidthMbps: 150,
          packetSizeBytes: 1500,
          processingDelayMs: 0.5,
          queuePacketsWaiting: 12,
        });
        setArrivalRatePacketsPerSec(10000);
        break;
      case 'geo_satellite':
        onUpdateParams({
          distanceKm: 36000, // Geostationary Orbit 36,000km
          mediumSpeedKmPerSec: 300000,
          bandwidthMbps: 25,
          packetSizeBytes: 1500,
          processingDelayMs: 1.0,
          queuePacketsWaiting: 20,
        });
        setArrivalRatePacketsPerSec(1500);
        break;
      default:
        break;
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200 p-6 overflow-y-auto">
      {/* Educational Header Formula */}
      <div className="mb-6 p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-sky-400 uppercase tracking-wider mb-1">
            Kurose-Ross Fundamental Nodal Delay Formula
          </div>
          <div className="text-base font-bold font-mono text-slate-100 flex items-center flex-wrap gap-2">
            <span>d_nodal</span>
            <span className="text-slate-500">=</span>
            <span className="text-purple-400">d_proc</span>
            <span className="text-slate-500">+</span>
            <span className="text-rose-400">d_queue</span>
            <span className="text-slate-500">+</span>
            <span className="text-cyan-400">d_trans (L/R)</span>
            <span className="text-slate-500">+</span>
            <span className="text-amber-400">d_prop (d/s)</span>
          </div>
        </div>

        {/* Total Calculated Latency */}
        <div className="flex items-center gap-3 bg-slate-950/80 px-4 py-2.5 rounded-lg border border-slate-800">
          <div className="text-right">
            <div className="text-[11px] text-slate-400 font-medium">Computed Nodal Delay</div>
            <div className="text-2xl font-bold font-mono text-sky-400 tabular-nums">
              {d_nodal.toFixed(3)} ms
            </div>
          </div>
          <Activity className="w-6 h-6 text-sky-400 shrink-0" />
        </div>
      </div>

      {/* Preset Scenarios Switcher */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        <span className="text-xs text-slate-400 whitespace-nowrap">Physical Link Presets:</span>
        {[
          { key: 'lan', label: 'Local LAN (100m, 1Gbps)' },
          { key: 'metro_fiber', label: 'Metro Fiber (50km)' },
          { key: 'continental', label: 'Cross-Country (3,500km)' },
          { key: 'transatlantic', label: 'Transatlantic Subsea (6,500km)' },
          { key: 'leo_satellite', label: 'Starlink LEO (550km)' },
          { key: 'geo_satellite', label: 'Geostationary GEO (36,000km)' },
        ].map((preset) => (
          <button
            key={preset.key}
            onClick={() => applyPreset(preset.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
              selectedPreset === preset.key
                ? 'bg-sky-500/10 border-sky-400/40 text-sky-300 font-semibold shadow-xs'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Stacked Proportional Breakdown Bar */}
      <div className="mb-6 p-4 rounded-xl bg-slate-900 border border-slate-800">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-slate-300 font-semibold">Delay Composition Breakdown (%)</span>
          <span className="text-slate-400 font-mono">100% of single router-link hop</span>
        </div>

        {/* Visual Stacked Bar */}
        <div className="w-full h-7 rounded-lg overflow-hidden flex bg-slate-950 border border-slate-800 font-mono text-[11px] font-bold">
          {p_proc > 2 && (
            <div
              style={{ width: `${p_proc}%` }}
              className="bg-purple-500 text-purple-950 flex items-center justify-center transition-all duration-300"
              title={`Processing: ${d_proc.toFixed(3)}ms (${p_proc.toFixed(1)}%)`}
            >
              {p_proc > 8 ? `Proc ${p_proc.toFixed(0)}%` : ''}
            </div>
          )}
          {p_queue > 2 && (
            <div
              style={{ width: `${p_queue}%` }}
              className="bg-rose-500 text-rose-950 flex items-center justify-center transition-all duration-300"
              title={`Queue: ${d_queue.toFixed(3)}ms (${p_queue.toFixed(1)}%)`}
            >
              {p_queue > 8 ? `Queue ${p_queue.toFixed(0)}%` : ''}
            </div>
          )}
          {p_trans > 2 && (
            <div
              style={{ width: `${p_trans}%` }}
              className="bg-cyan-400 text-cyan-950 flex items-center justify-center transition-all duration-300"
              title={`Transmission: ${d_trans.toFixed(3)}ms (${p_trans.toFixed(1)}%)`}
            >
              {p_trans > 8 ? `Trans ${p_trans.toFixed(0)}%` : ''}
            </div>
          )}
          {p_prop > 2 && (
            <div
              style={{ width: `${p_prop}%` }}
              className="bg-amber-400 text-amber-950 flex items-center justify-center transition-all duration-300"
              title={`Propagation: ${d_prop.toFixed(3)}ms (${p_prop.toFixed(1)}%)`}
            >
              {p_prop > 8 ? `Prop ${p_prop.toFixed(0)}%` : ''}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3.5 text-xs font-mono">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-purple-500 shrink-0" />
            <span className="text-slate-400">Processing:</span>
            <span className="text-purple-300 font-semibold tabular-nums">{d_proc.toFixed(3)}ms</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-rose-500 shrink-0" />
            <span className="text-slate-400">Queuing:</span>
            <span className="text-rose-300 font-semibold tabular-nums">{d_queue.toFixed(3)}ms</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-cyan-400 shrink-0" />
            <span className="text-slate-400">Transmission:</span>
            <span className="text-cyan-300 font-semibold tabular-nums">{d_trans.toFixed(3)}ms</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-amber-400 shrink-0" />
            <span className="text-slate-400">Propagation:</span>
            <span className="text-amber-300 font-semibold tabular-nums">{d_prop.toFixed(3)}ms</span>
          </div>
        </div>
      </div>

      {/* Interactive Visual Pipeline Simulation Stage */}
      <div className="mb-6 p-5 rounded-xl bg-slate-900 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs font-semibold text-slate-200">
            Router Interface &amp; Physical Link Architecture
          </div>
          {isBufferOverflow ? (
            <div className="flex items-center gap-1.5 text-xs text-rose-400 font-semibold bg-rose-950/60 px-2.5 py-1 rounded-md border border-rose-800">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Buffer Overflow: Packets Dropped!</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-800">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Queue Healthy (Intensity: {trafficIntensity})</span>
            </div>
          )}
        </div>

        {/* Pipeline Schema Graphic */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800/80">
          {/* Stage 1: CPU Processing */}
          <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-purple-300 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-purple-400" />
                1. Router CPU
              </span>
              <span className="text-[10px] font-mono text-slate-500">d_proc</span>
            </div>
            <div className="text-[11px] text-slate-400 mb-2">
              Header checksum &amp; IP routing table (FIB) lookup.
            </div>
            <div className="text-xs font-mono text-purple-300 font-semibold bg-slate-950 p-1.5 rounded border border-slate-800/80">
              Latency: {d_proc.toFixed(3)} ms
            </div>
          </div>

          {/* Stage 2: FIFO Queue Buffer */}
          <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-rose-300 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-rose-400" />
                2. Output Buffer
              </span>
              <span className="text-[10px] font-mono text-slate-500">d_queue</span>
            </div>
            {/* Visual Queue Slots */}
            <div className="flex items-center gap-1 my-2 bg-slate-950 p-1.5 rounded border border-slate-800">
              {Array.from({ length: 8 }).map((_, idx) => {
                const isOccupied = idx < Math.min(8, delayParams.queuePacketsWaiting);
                return (
                  <div
                    key={idx}
                    className={`h-4 flex-1 rounded-xs transition-colors ${
                      isOccupied
                        ? isBufferOverflow
                          ? 'bg-rose-500 animate-pulse'
                          : 'bg-amber-400'
                        : 'bg-slate-800'
                    }`}
                  />
                );
              })}
            </div>
            <div className="text-xs font-mono text-rose-300 font-semibold bg-slate-950 p-1.5 rounded border border-slate-800/80 flex justify-between">
              <span>{delayParams.queuePacketsWaiting} waiting</span>
              <span>{d_queue.toFixed(3)} ms</span>
            </div>
          </div>

          {/* Stage 3: NIC Serialization / Transmission */}
          <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-cyan-400" />
                3. Serialization (NIC)
              </span>
              <span className="text-[10px] font-mono text-slate-500">d_trans = L/R</span>
            </div>
            <div className="text-[11px] text-slate-400 mb-2">
              Pushing {L_bits.toLocaleString()} bits onto wire at {delayParams.bandwidthMbps} Mbps.
            </div>
            <div className="text-xs font-mono text-cyan-300 font-semibold bg-slate-950 p-1.5 rounded border border-slate-800/80">
              Serialization: {d_trans.toFixed(3)} ms
            </div>
          </div>

          {/* Stage 4: Physical Medium Propagation */}
          <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-amber-400" />
                4. Physical Medium
              </span>
              <span className="text-[10px] font-mono text-slate-500">d_prop = d/s</span>
            </div>
            <div className="text-[11px] text-slate-400 mb-2">
              Photons traversing {delayParams.distanceKm.toLocaleString()} km at {delayParams.mediumSpeedKmPerSec.toLocaleString()} km/s.
            </div>
            <div className="text-xs font-mono text-amber-300 font-semibold bg-slate-950 p-1.5 rounded border border-slate-800/80">
              Propagation: {d_prop.toFixed(3)} ms
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Control Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Slider 1: Packet Size L */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-slate-200">
              Packet Size (L):{' '}
              <span className="text-cyan-400 font-mono">{delayParams.packetSizeBytes} Bytes</span>
            </label>
            <span className="text-[10px] font-mono text-slate-500">{L_bits} bits</span>
          </div>
          <input
            type="range"
            min="64"
            max="9000"
            step="64"
            value={delayParams.packetSizeBytes}
            onChange={(e) => onUpdateParams({ packetSizeBytes: Number(e.target.value) })}
            className="w-full accent-cyan-400"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
            <span>64B (DNS/ACK)</span>
            <span>512B (DNS UDP)</span>
            <span>1500B (MTU)</span>
            <span>9000B (Jumbo)</span>
          </div>
        </div>

        {/* Slider 2: Bandwidth R */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-slate-200">
              Transmission Rate (R):{' '}
              <span className="text-cyan-400 font-mono">{delayParams.bandwidthMbps} Mbps</span>
            </label>
            <span className="text-[10px] font-mono text-slate-500">
              {(delayParams.bandwidthMbps / 1000).toFixed(1)} Gbps
            </span>
          </div>
          <input
            type="range"
            min="5"
            max="10000"
            step="25"
            value={delayParams.bandwidthMbps}
            onChange={(e) => onUpdateParams({ bandwidthMbps: Number(e.target.value) })}
            className="w-full accent-cyan-400"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
            <span>5 Mbps (DSL)</span>
            <span>100 Mbps (FastEth)</span>
            <span>1 Gbps (Gigabit)</span>
            <span>10 Gbps (Backbone)</span>
          </div>
        </div>

        {/* Slider 3: Distance d */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-slate-200">
              Physical Distance (d):{' '}
              <span className="text-amber-400 font-mono">{delayParams.distanceKm} km</span>
            </label>
            <span className="text-[10px] font-mono text-slate-500">
              s = {delayParams.mediumSpeedKmPerSec} km/s
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="40000"
            step="100"
            value={delayParams.distanceKm}
            onChange={(e) => onUpdateParams({ distanceKm: Number(e.target.value) })}
            className="w-full accent-amber-400"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
            <span>1 km (Local)</span>
            <span>6,500 km (Atlantic)</span>
            <span>36,000 km (GEO)</span>
          </div>
        </div>

        {/* Slider 4: Queue Depth N */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-slate-200">
              Packets Waiting in Buffer (N):{' '}
              <span className="text-rose-400 font-mono">{delayParams.queuePacketsWaiting}</span>
            </label>
            <span className="text-[10px] font-mono text-slate-500">
              Cap: {delayParams.queueBufferCapacity}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="50"
            step="1"
            value={delayParams.queuePacketsWaiting}
            onChange={(e) => onUpdateParams({ queuePacketsWaiting: Number(e.target.value) })}
            className="w-full accent-rose-400"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
            <span>0 (Empty Queue)</span>
            <span>10 (Mild Congestion)</span>
            <span>50 (Bufferbloat)</span>
          </div>
        </div>

        {/* Slider 5: Traffic Arrival Rate */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-slate-200">
              Traffic Intensity (I = La/R):{' '}
              <span
                className={`font-mono ${
                  trafficIntensity > 1.0
                    ? 'text-rose-400 font-bold'
                    : trafficIntensity > 0.7
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {trafficIntensity}
              </span>
            </label>
            <span className="text-[10px] font-mono text-slate-500">
              {arrivalRatePacketsPerSec} pkts/s
            </span>
          </div>
          <input
            type="range"
            min="500"
            max="60000"
            step="500"
            value={arrivalRatePacketsPerSec}
            onChange={(e) => setArrivalRatePacketsPerSec(Number(e.target.value))}
            className="w-full accent-emerald-400"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
            <span>Low (I&lt;0.2)</span>
            <span>Medium (I~0.5)</span>
            <span>Critical (I&gt;1.0 Drops)</span>
          </div>
        </div>

        {/* Slider 6: Processing Delay */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-slate-200">
              CPU Processing Time (d_proc):{' '}
              <span className="text-purple-400 font-mono">
                {delayParams.processingDelayMs} ms
              </span>
            </label>
            <span className="text-[10px] font-mono text-slate-500">Hardware FIB</span>
          </div>
          <input
            type="range"
            min="0.01"
            max="5"
            step="0.05"
            value={delayParams.processingDelayMs}
            onChange={(e) => onUpdateParams({ processingDelayMs: Number(e.target.value) })}
            className="w-full accent-purple-400"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
            <span>0.01 ms (ASIC)</span>
            <span>1.0 ms (Software)</span>
            <span>5.0 ms (Heavy Load)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

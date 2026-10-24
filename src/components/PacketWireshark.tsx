import React, { useState } from 'react';
import {
  FileText,
  Binary,
  Layers,
  Clock,
  ArrowRight,
  ShieldCheck,
  Hash,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { DnsPacketStep, ResolutionTrace } from '../types/network';

interface PacketWiresharkProps {
  trace: ResolutionTrace | null;
  selectedStepIndex: number;
  onSelectStepIndex: (idx: number) => void;
}

export const PacketWireshark: React.FC<PacketWiresharkProps> = ({
  trace,
  selectedStepIndex,
  onSelectStepIndex,
}) => {
  const [expandedSections, setExpandedSections] = useState({
    header: true,
    flags: true,
    questions: true,
    answers: true,
    delays: true,
  });

  const toggleSection = (sec: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [sec]: !prev[sec] }));
  };

  const currentStep: DnsPacketStep | undefined = trace?.steps[selectedStepIndex];

  // Helper to generate a realistic simulated hex dump
  const generateHexDump = (step: DnsPacketStep) => {
    const hexLines: { offset: string; hex: string; ascii: string }[] = [];
    const id = step.dnsHeader.id.replace('0x', '');
    const qrByte = step.dnsHeader.flags.qr === 'RESPONSE' ? '81' : '01';
    const rcodeByte = step.dnsHeader.flags.aa ? '80' : '00';

    const baseBytes = [
      id.slice(0, 2) || '1a',
      id.slice(2, 4) || '4f',
      qrByte,
      rcodeByte,
      '00',
      '01', // 1 question
      '00',
      step.dnsHeader.answersCount > 0 ? '01' : '00', // answers count
      '00',
      step.dnsHeader.authorityCount > 0 ? '02' : '00',
      '00',
      '01',
      '06',
      '67',
      '6f',
      '6f', // 'g' 'o' 'o'
    ];

    for (let i = 0; i < 4; i++) {
      const offset = (i * 16).toString(16).padStart(4, '0');
      const hex = baseBytes.map((b) => b).join(' ');
      const ascii = '.. netscope dns ..';
      hexLines.push({ offset, hex, ascii });
    }
    return hexLines;
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200 p-6 overflow-hidden">
      {/* Header Info */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
        <div>
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <FileText className="w-4 h-4 text-sky-400" />
            <span>DNS Protocol &amp; Wireshark Frame Inspector</span>
          </h2>
          <div className="text-xs text-slate-400 mt-0.5">
            Real-time inspection of RFC 1035 UDP/53 datagram headers, flags, and timing metrics.
          </div>
        </div>

        {trace && (
          <div className="text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
            Total Captured Frames: <span className="text-sky-400 font-bold">{trace.steps.length}</span>
          </div>
        )}
      </div>

      {!trace || trace.steps.length === 0 ? (
        <div className="flex-1 flex items-center justify-center border border-slate-800 rounded-xl bg-slate-900/40 text-slate-500 text-xs font-sans">
          No packets captured yet. Run a DNS query in the Topology view or from the top bar.
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">
          {/* Left: Packet Stream Table (7 cols) */}
          <div className="lg:col-span-7 border border-slate-800 rounded-xl bg-slate-900/40 overflow-hidden flex flex-col">
            <div className="p-2.5 bg-slate-900 border-b border-slate-800 text-xs font-medium text-slate-400">
              Captured Frame List (Click row to inspect)
            </div>
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 bg-slate-900/60 sticky top-0">
                    <th className="py-2 px-3">No.</th>
                    <th className="py-2 px-3">Time</th>
                    <th className="py-2 px-3">Source</th>
                    <th className="py-2 px-3">Destination</th>
                    <th className="py-2 px-3">Protocol</th>
                    <th className="py-2 px-3">Info</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {trace.steps.map((step, idx) => {
                    const isSelected = idx === selectedStepIndex;
                    // Accumulated time offset
                    const timeOffset = trace.steps
                      .slice(0, idx + 1)
                      .reduce((sum, s) => sum + s.hopDelays.totalHopDelayMs, 0);

                    return (
                      <tr
                        key={step.stepIndex}
                        onClick={() => onSelectStepIndex(idx)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-sky-500/20 text-sky-200'
                            : 'hover:bg-slate-800/50 text-slate-300'
                        }`}
                      >
                        <td className="py-2 px-3 tabular-nums text-slate-400">{step.stepIndex}</td>
                        <td className="py-2 px-3 tabular-nums text-amber-300">
                          {timeOffset.toFixed(2)}ms
                        </td>
                        <td className="py-2 px-3 truncate max-w-[90px]">{step.fromNodeId}</td>
                        <td className="py-2 px-3 truncate max-w-[90px]">{step.toNodeId}</td>
                        <td className="py-2 px-3 text-sky-400 font-semibold">DNS/UDP</td>
                        <td className="py-2 px-3 truncate max-w-[170px]" title={step.label}>
                          {step.dnsHeader.flags.qr === 'QUERY' ? 'Std query' : 'Std response'}{' '}
                          {step.dnsHeader.id}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right: Dissected Packet Bitfields & Tree (5 cols) */}
          <div className="lg:col-span-5 border border-slate-800 rounded-xl bg-slate-900/40 p-4 overflow-y-auto flex flex-col gap-3 font-mono text-xs">
            {currentStep ? (
              <>
                {/* Frame Timing Card */}
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-[11px] text-slate-400 mb-1 flex items-center justify-between">
                    <span className="font-semibold text-slate-200">
                      Frame {currentStep.stepIndex} Hop Latency Breakdown
                    </span>
                    <span className="text-sky-400 font-bold tabular-nums">
                      {currentStep.hopDelays.totalHopDelayMs} ms
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-[10px] mt-2 pt-2 border-t border-slate-900">
                    <div>
                      <span className="text-slate-500 block">Prop</span>
                      <span className="text-amber-300 font-bold">
                        {currentStep.hopDelays.propDelayMs}ms
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Trans</span>
                      <span className="text-cyan-300 font-bold">
                        {currentStep.hopDelays.transDelayMs}ms
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Proc</span>
                      <span className="text-purple-300 font-bold">
                        {currentStep.hopDelays.procDelayMs}ms
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Queue</span>
                      <span className="text-rose-300 font-bold">
                        {currentStep.hopDelays.queueDelayMs}ms
                      </span>
                    </div>
                  </div>
                </div>

                {/* Section: DNS Header */}
                <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950">
                  <button
                    onClick={() => toggleSection('header')}
                    className="w-full p-2.5 bg-slate-900/80 flex items-center justify-between text-slate-200 hover:bg-slate-900 text-left"
                  >
                    <span className="font-semibold flex items-center gap-1.5">
                      {expandedSections.header ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                      Domain Name System (Header)
                    </span>
                    <span className="text-[11px] text-slate-400">
                      ID: {currentStep.dnsHeader.id}
                    </span>
                  </button>

                  {expandedSections.header && (
                    <div className="p-3 space-y-1.5 text-slate-300 text-[11px] border-t border-slate-800/80">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Transaction ID:</span>
                        <span className="text-sky-300 font-semibold">
                          {currentStep.dnsHeader.id}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Flags:</span>
                        <span className="text-slate-200 font-semibold">
                          {currentStep.dnsHeader.flags.qr === 'RESPONSE' ? '0x8180' : '0x0100'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Questions:</span>
                        <span className="text-slate-200">
                          {currentStep.dnsHeader.questionsCount}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Answer RRs:</span>
                        <span className="text-emerald-400 font-semibold">
                          {currentStep.dnsHeader.answersCount}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Authority RRs:</span>
                        <span className="text-slate-200">
                          {currentStep.dnsHeader.authorityCount}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Additional RRs:</span>
                        <span className="text-slate-200">
                          {currentStep.dnsHeader.additionalCount}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Section: Flags Bitfields */}
                <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950">
                  <button
                    onClick={() => toggleSection('flags')}
                    className="w-full p-2.5 bg-slate-900/80 flex items-center justify-between text-slate-200 hover:bg-slate-900 text-left"
                  >
                    <span className="font-semibold flex items-center gap-1.5">
                      {expandedSections.flags ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                      Flags Breakdown (RFC 1035)
                    </span>
                    <span className="text-[11px] text-emerald-400">
                      {currentStep.dnsHeader.flags.qr}
                    </span>
                  </button>

                  {expandedSections.flags && (
                    <div className="p-3 space-y-1.5 text-slate-300 text-[11px] border-t border-slate-800/80">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Response (QR):</span>
                        <span className="text-sky-300">
                          {currentStep.dnsHeader.flags.qr === 'RESPONSE'
                            ? '1 (Response)'
                            : '0 (Query)'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Opcode:</span>
                        <span className="text-slate-200">0 (Standard query)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Authoritative Answer (AA):</span>
                        <span
                          className={
                            currentStep.dnsHeader.flags.aa
                              ? 'text-emerald-400 font-bold'
                              : 'text-slate-400'
                          }
                        >
                          {currentStep.dnsHeader.flags.aa ? '1 (Authoritative)' : '0 (Non-auth)'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Truncated (TC):</span>
                        <span className="text-slate-400">0 (Not truncated)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Recursion Desired (RD):</span>
                        <span className="text-sky-300">1 (Do query recursively)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Recursion Available (RA):</span>
                        <span className="text-slate-200">
                          {currentStep.dnsHeader.flags.ra ? '1 (Server supports)' : '0'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Reply Code (RCODE):</span>
                        <span className="text-emerald-400 font-bold">
                          0 (No error - NOERROR)
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Section: Question / Answer Record */}
                <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950">
                  <button
                    onClick={() => toggleSection('answers')}
                    className="w-full p-2.5 bg-slate-900/80 flex items-center justify-between text-slate-200 hover:bg-slate-900 text-left"
                  >
                    <span className="font-semibold flex items-center gap-1.5">
                      {expandedSections.answers ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                      Payload &amp; Resource Records
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {trace.domain} ({trace.recordType})
                    </span>
                  </button>

                  {expandedSections.answers && (
                    <div className="p-3 space-y-2 text-slate-300 text-[11px] border-t border-slate-800/80">
                      <div className="p-2 rounded bg-slate-900 border border-slate-800">
                        <div className="text-slate-500 text-[10px] mb-1 font-semibold uppercase">
                          Question Section
                        </div>
                        <div className="flex justify-between">
                          <span>Name: {trace.domain}</span>
                          <span className="text-amber-400">Type: {trace.recordType}</span>
                        </div>
                      </div>

                      {currentStep.recordReturned && (
                        <div className="p-2 rounded bg-emerald-950/40 border border-emerald-800/80 text-emerald-200">
                          <div className="text-emerald-400 text-[10px] mb-1 font-semibold uppercase">
                            Answer Resource Record (RR)
                          </div>
                          <div className="flex justify-between">
                            <span>{currentStep.recordReturned.domain}</span>
                            <span>IN {currentStep.recordReturned.type}</span>
                          </div>
                          <div className="flex justify-between text-[10px] text-emerald-300/80 mt-1">
                            <span>TTL: {currentStep.recordReturned.ttl} seconds</span>
                            <span className="font-bold text-slate-100">
                              Data: {currentStep.recordReturned.value}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Raw Hex Preview */}
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-500 font-semibold mb-1 flex items-center gap-1.5 uppercase">
                    <Binary className="w-3 h-3 text-sky-400" />
                    <span>Hex Datagram Bytes Preview</span>
                  </div>
                  <div className="text-[10px] text-slate-400 space-y-0.5 leading-tight font-mono">
                    {generateHexDump(currentStep).map((h, i) => (
                      <div key={i} className="flex justify-between">
                        <span className="text-slate-600">{h.offset}</span>
                        <span className="text-sky-300">{h.hex}</span>
                        <span className="text-slate-500">{h.ascii}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-slate-500 text-center py-8">Select a frame to inspect.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

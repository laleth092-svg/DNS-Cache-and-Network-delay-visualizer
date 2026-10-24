import React, { useState } from 'react';
import {
  Trash2,
  Plus,
  RefreshCw,
  Clock,
  Layers,
  Database,
  Server,
  Search,
  CheckCircle2,
  AlertCircle,
  Zap,
} from 'lucide-react';
import { DnsRecord, DnsRecordType } from '../types/network';

interface CacheInspectorProps {
  browserCache: DnsRecord[];
  osCache: DnsRecord[];
  resolverCache: DnsRecord[];
  cacheStats: {
    browserHits: number;
    osHits: number;
    resolverHits: number;
    misses: number;
  };
  onFlushCache: (tier: 'browser' | 'os' | 'resolver' | 'all') => void;
  onDecayTtl: (seconds: number) => void;
  onAddRecord: (tier: 'browser' | 'os' | 'resolver', record: Omit<DnsRecord, 'id'>) => void;
}

export const CacheInspector: React.FC<CacheInspectorProps> = ({
  browserCache,
  osCache,
  resolverCache,
  cacheStats,
  onFlushCache,
  onDecayTtl,
  onAddRecord,
}) => {
  const [selectedTier, setSelectedTier] = useState<'all' | 'browser' | 'os' | 'resolver'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // New record form state
  const [newDomain, setNewDomain] = useState('example.com');
  const [newType, setNewType] = useState<DnsRecordType>('A');
  const [newValue, setNewValue] = useState('93.184.216.34');
  const [newTtl, setNewTtl] = useState(300);
  const [targetTier, setTargetTier] = useState<'browser' | 'os' | 'resolver'>('browser');

  const totalHits = cacheStats.browserHits + cacheStats.osHits + cacheStats.resolverHits;
  const totalQueries = totalHits + cacheStats.misses;
  const hitRatio = totalQueries > 0 ? ((totalHits / totalQueries) * 100).toFixed(1) : '0.0';

  // Helper to filter records
  const filterRecords = (records: DnsRecord[], tierName: 'browser' | 'os' | 'resolver') => {
    return records
      .filter((r) => {
        if (selectedTier !== 'all' && selectedTier !== tierName) return false;
        if (!searchQuery) return true;
        return (
          r.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.value.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.type.toLowerCase().includes(searchQuery.toLowerCase())
        );
      })
      .map((r) => ({ ...r, tier: tierName }));
  };

  const allFilteredRecords = [
    ...filterRecords(browserCache, 'browser'),
    ...filterRecords(osCache, 'os'),
    ...filterRecords(resolverCache, 'resolver'),
  ];

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain.trim() || !newValue.trim()) return;

    onAddRecord(targetTier, {
      domain: newDomain.trim().toLowerCase(),
      type: newType,
      value: newValue.trim(),
      ttl: Number(newTtl),
      originalTtl: Number(newTtl),
      tier: targetTier,
      cachedAt: Date.now(),
    });

    setShowAddModal(false);
  };

  const getTierIcon = (tier?: string) => {
    switch (tier) {
      case 'browser':
        return <Layers className="w-3.5 h-3.5 text-emerald-400" />;
      case 'os':
        return <Database className="w-3.5 h-3.5 text-indigo-400" />;
      case 'resolver':
        return <Server className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200 p-6 overflow-y-auto">
      {/* Metrics Banner */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400 mb-1">Global Hit Ratio</div>
          <div className="text-xl font-bold font-mono text-emerald-400 tabular-nums">
            {hitRatio}%
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {totalHits} hits / {totalQueries} queries
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>L1 Browser Hits</span>
          </div>
          <div className="text-xl font-bold font-mono text-emerald-300 tabular-nums">
            {cacheStats.browserHits}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">&lt;0.5ms resolution</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-indigo-400" />
            <span>L2 OS Cache Hits</span>
          </div>
          <div className="text-xl font-bold font-mono text-indigo-300 tabular-nums">
            {cacheStats.osHits}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Local IPC syscall</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-amber-400" />
            <span>L3 Resolver Hits</span>
          </div>
          <div className="text-xl font-bold font-mono text-amber-300 tabular-nums">
            {cacheStats.resolverHits}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">ISP edge 10-25ms</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>Complete Misses</span>
          </div>
          <div className="text-xl font-bold font-mono text-rose-300 tabular-nums">
            {cacheStats.misses}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Full Root-TLD traversal</div>
        </div>
      </div>

      {/* Control Strip & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          {/* Tier Selector Buttons */}
          <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800">
            <button
              onClick={() => setSelectedTier('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                selectedTier === 'all'
                  ? 'bg-slate-800 text-slate-100 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Tiers ({allFilteredRecords.length})
            </button>
            <button
              onClick={() => setSelectedTier('browser')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                selectedTier === 'browser'
                  ? 'bg-slate-800 text-emerald-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Browser ({browserCache.length})
            </button>
            <button
              onClick={() => setSelectedTier('os')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                selectedTier === 'os'
                  ? 'bg-slate-800 text-indigo-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              OS ({osCache.length})
            </button>
            <button
              onClick={() => setSelectedTier('resolver')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                selectedTier === 'resolver'
                  ? 'bg-slate-800 text-amber-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Resolver ({resolverCache.length})
            </button>
          </div>

          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search records or IP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 w-48"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onDecayTtl(30)}
            title="Fast forward TTL countdown by 30 seconds"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-medium text-slate-300 transition-colors"
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Decay TTL (-30s)</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-medium text-sky-400 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Cache Entry</span>
          </button>

          <button
            onClick={() => onFlushCache('all')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-900/60 rounded-lg text-xs font-medium text-rose-300 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Flush All Caches</span>
          </button>
        </div>
      </div>

      {/* Cache Records Table */}
      <div className="flex-1 border border-slate-800 rounded-xl bg-slate-900/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-400 font-medium">
                <th className="py-2.5 px-4">Tier</th>
                <th className="py-2.5 px-4">Domain Name</th>
                <th className="py-2.5 px-4">Type</th>
                <th className="py-2.5 px-4">Resolved Value / IP</th>
                <th className="py-2.5 px-4">Remaining TTL</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {allFilteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 font-sans">
                    No active cache entries found in the selected tier.
                  </td>
                </tr>
              ) : (
                allFilteredRecords.map((record) => {
                  const percentTtl = Math.max(
                    0,
                    Math.min(100, Math.round((record.ttl / record.originalTtl) * 100))
                  );
                  const isExpiringSoon = record.ttl <= 10;

                  return (
                    <tr
                      key={`${record.tier}-${record.id}`}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-sans">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          {getTierIcon(record.tier)}
                          <span className="capitalize">{record.tier}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sky-300 font-semibold">{record.domain}</td>
                      <td className="py-3 px-4">
                        <span className="text-amber-400 font-semibold">{record.type}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-200">{record.value}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isExpiringSoon ? 'bg-rose-500' : 'bg-emerald-400'
                              }`}
                              style={{ width: `${percentTtl}%` }}
                            />
                          </div>
                          <span
                            className={`tabular-nums ${
                              isExpiringSoon ? 'text-rose-400 font-bold' : 'text-slate-300'
                            }`}
                          >
                            {record.ttl}s / {record.originalTtl}s
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            if (record.tier) onFlushCache(record.tier);
                          }}
                          title={`Flush ${record.tier} cache`}
                          className="text-slate-500 hover:text-rose-400 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Record Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-bold text-slate-100 mb-3">Add DNS Cache Entry</h3>
            <p className="text-xs text-slate-400 mb-4">
              Inject a simulated record into any cache layer to observe hit/miss behavior or cache poisoning dynamics.
            </p>

            <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Target Cache Tier</label>
                <select
                  value={targetTier}
                  onChange={(e) => setTargetTier(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-sky-500"
                >
                  <option value="browser">L1: Browser DNS Cache</option>
                  <option value="os">L2: Host OS Stub Cache</option>
                  <option value="resolver">L3: Local Recursive Resolver (8.8.8.8)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Domain Name</label>
                <input
                  type="text"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  placeholder="e.g. google.com or shop.example.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Record Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as DnsRecordType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
                  >
                    <option value="A">A (IPv4)</option>
                    <option value="AAAA">AAAA (IPv6)</option>
                    <option value="CNAME">CNAME (Canonical Alias)</option>
                    <option value="MX">MX (Mail Server)</option>
                    <option value="TXT">TXT (Text/SPF)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">TTL (Seconds)</label>
                  <input
                    type="number"
                    min="5"
                    max="86400"
                    value={newTtl}
                    onChange={(e) => setNewTtl(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Resolved Value / IP</label>
                <input
                  type="text"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder="e.g. 142.250.190.46"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800 mt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-2 text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-lg transition-colors"
                >
                  Save to Cache
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

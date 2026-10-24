import {
  DelayParameters,
  DnsPacketStep,
  DnsRecord,
  DnsRecordType,
  HopDelayBreakdown,
  ResolutionTrace,
} from '../types/network';
import { AUTHORITATIVE_DATABASE, DEFAULT_TLD_SERVERS } from '../data/defaultDnsDatabase';

export function calculateHopDelays(
  hopFrom: string,
  hopTo: string,
  params: DelayParameters
): HopDelayBreakdown {
  const {
    packetSizeBytes,
    bandwidthMbps,
    distanceKm,
    mediumSpeedKmPerSec,
    processingDelayMs,
    queuePacketsWaiting,
  } = params;

  // L in bits
  const packetBits = packetSizeBytes * 8;
  // R in bits per second
  const bandwidthBps = bandwidthMbps * 1_000_000;

  // Transmission delay: d_trans = L / R (converted to ms)
  const transDelayMs = (packetBits / bandwidthBps) * 1000;

  // Propagation delay: d_prop = d / s (converted to ms)
  // Localhost hops (e.g. client to browser cache or OS cache) have distance ~0
  const isLocalhost =
    (hopFrom === 'client' && (hopTo === 'browser_cache' || hopTo === 'os_cache')) ||
    ((hopFrom === 'browser_cache' || hopFrom === 'os_cache') && hopTo === 'client');

  const effectiveDistanceKm = isLocalhost ? 0.001 : distanceKm;
  const propDelayMs = (effectiveDistanceKm / mediumSpeedKmPerSec) * 1000;

  // Processing delay: d_proc
  const effectiveProcDelayMs = isLocalhost ? 0.05 : processingDelayMs;

  // Queuing delay: d_queue = (N * L) / R
  const effectiveQueueDelayMs = isLocalhost
    ? 0
    : ((queuePacketsWaiting * packetBits) / bandwidthBps) * 1000;

  const totalHopDelayMs =
    Number((transDelayMs + propDelayMs + effectiveProcDelayMs + effectiveQueueDelayMs).toFixed(3));

  return {
    hopFrom,
    hopTo,
    distanceKm: effectiveDistanceKm,
    bandwidthMbps,
    packetSizeBytes,
    transDelayMs: Number(transDelayMs.toFixed(3)),
    propDelayMs: Number(propDelayMs.toFixed(3)),
    procDelayMs: Number(effectiveProcDelayMs.toFixed(3)),
    queueDelayMs: Number(effectiveQueueDelayMs.toFixed(3)),
    totalHopDelayMs,
  };
}

export function simulateDnsQuery({
  domain,
  recordType,
  mode,
  browserCache,
  osCache,
  resolverCache,
  delayParams,
}: {
  domain: string;
  recordType: DnsRecordType;
  mode: 'recursive' | 'iterative';
  browserCache: DnsRecord[];
  osCache: DnsRecord[];
  resolverCache: DnsRecord[];
  delayParams: DelayParameters;
}): ResolutionTrace {
  const normalizedDomain = domain.trim().toLowerCase();
  const steps: DnsPacketStep[] = [];
  const queryId = '0x' + Math.floor(Math.random() * 65535).toString(16).padStart(4, '0');

  // Extract TLD
  const domainParts = normalizedDomain.split('.');
  const tld = domainParts.length > 1 ? domainParts[domainParts.length - 1] : 'com';

  // Helper to make packet headers
  const makeHeader = (
    qr: 'QUERY' | 'RESPONSE',
    aa: boolean,
    answersCount: number,
    authorityCount: number,
    rcode: 'NOERROR' | 'NXDOMAIN' | 'SERVFAIL' = 'NOERROR'
  ) => ({
    id: queryId,
    flags: {
      qr,
      opcode: 'STANDARD' as const,
      aa,
      tc: false,
      rd: true,
      ra: mode === 'recursive',
      rcode,
    },
    questionsCount: 1,
    answersCount,
    authorityCount,
    additionalCount: answersCount > 0 ? 1 : 0,
  });

  // 1. Check Browser Cache
  const browserHit = browserCache.find(
    (r) => r.domain.toLowerCase() === normalizedDomain && r.type === recordType && r.ttl > 0
  );

  const clientToBrowserDelay = calculateHopDelays('client', 'browser_cache', {
    ...delayParams,
    distanceKm: 0,
    processingDelayMs: 0.1,
    queuePacketsWaiting: 0,
  });

  steps.push({
    stepIndex: steps.length + 1,
    fromNodeId: 'client',
    toNodeId: 'browser_cache',
    label: `Check Browser DNS Cache`,
    description: `Application queries browser's internal in-memory DNS table for '${normalizedDomain}' (${recordType}).`,
    isQuery: true,
    isCacheHit: !!browserHit,
    hitTier: browserHit ? 'browser' : undefined,
    recordReturned: browserHit,
    hopDelays: clientToBrowserDelay,
    dnsHeader: makeHeader('QUERY', false, 0, 0),
  });

  if (browserHit) {
    const browserToClientDelay = calculateHopDelays('browser_cache', 'client', {
      ...delayParams,
      distanceKm: 0,
      processingDelayMs: 0.05,
      queuePacketsWaiting: 0,
    });
    steps.push({
      stepIndex: steps.length + 1,
      fromNodeId: 'browser_cache',
      toNodeId: 'client',
      label: `L1 Browser Cache Hit (Instant)`,
      description: `HIT! Found active entry with ${browserHit.ttl}s TTL remaining. Returned value: ${browserHit.value}. Zero network overhead.`,
      isQuery: false,
      isCacheHit: true,
      hitTier: 'browser',
      recordReturned: browserHit,
      hopDelays: browserToClientDelay,
      dnsHeader: makeHeader('RESPONSE', false, 1, 0),
    });

    return {
      domain: normalizedDomain,
      recordType,
      resolutionMode: mode,
      cacheHitAt: 'browser',
      totalDelayMs: Number(
        steps.reduce((sum, s) => sum + s.hopDelays.totalHopDelayMs, 0).toFixed(2)
      ),
      resolvedIp: browserHit.value,
      steps,
      timestamp: new Date().toLocaleTimeString(),
    };
  }

  // 2. Check OS DNS Cache (systemd-resolved / getaddrinfo)
  const osHit = osCache.find(
    (r) => r.domain.toLowerCase() === normalizedDomain && r.type === recordType && r.ttl > 0
  );

  const clientToOsDelay = calculateHopDelays('client', 'os_cache', {
    ...delayParams,
    distanceKm: 0,
    processingDelayMs: 0.3,
    queuePacketsWaiting: 0,
  });

  steps.push({
    stepIndex: steps.length + 1,
    fromNodeId: 'client',
    toNodeId: 'os_cache',
    label: `Check Host OS Stub Cache`,
    description: `Browser cache missed. Invoking OS kernel resolver (getaddrinfo/systemd-resolved) via local IPC.`,
    isQuery: true,
    isCacheHit: !!osHit,
    hitTier: osHit ? 'os' : undefined,
    recordReturned: osHit,
    hopDelays: clientToOsDelay,
    dnsHeader: makeHeader('QUERY', false, 0, 0),
  });

  if (osHit) {
    const osToClientDelay = calculateHopDelays('os_cache', 'client', {
      ...delayParams,
      distanceKm: 0,
      processingDelayMs: 0.1,
      queuePacketsWaiting: 0,
    });

    steps.push({
      stepIndex: steps.length + 1,
      fromNodeId: 'os_cache',
      toNodeId: 'client',
      label: `L2 OS Cache Hit`,
      description: `HIT in OS cache (${osHit.ttl}s remaining TTL). Entry populated into browser cache for subsequent lookups.`,
      isQuery: false,
      isCacheHit: true,
      hitTier: 'os',
      recordReturned: osHit,
      hopDelays: osToClientDelay,
      dnsHeader: makeHeader('RESPONSE', false, 1, 0),
    });

    return {
      domain: normalizedDomain,
      recordType,
      resolutionMode: mode,
      cacheHitAt: 'os',
      totalDelayMs: Number(
        steps.reduce((sum, s) => sum + s.hopDelays.totalHopDelayMs, 0).toFixed(2)
      ),
      resolvedIp: osHit.value,
      steps,
      timestamp: new Date().toLocaleTimeString(),
    };
  }

  // 3. Dispatch to Local Recursive Resolver (e.g. 8.8.8.8)
  const clientToResolverDelay = calculateHopDelays('client', 'local_resolver', {
    ...delayParams,
    distanceKm: Math.max(15, delayParams.distanceKm * 0.1), // ISP edge is closer than global auth
  });

  steps.push({
    stepIndex: steps.length + 1,
    fromNodeId: 'client',
    toNodeId: 'local_resolver',
    label: `Query Local Recursive Resolver`,
    description: `OS cache missed. Outbound UDP/53 datagram dispatched to configured resolver (8.8.8.8). Recursion Desired (RD=1).`,
    isQuery: true,
    isCacheHit: false,
    hopDelays: clientToResolverDelay,
    dnsHeader: makeHeader('QUERY', false, 0, 0),
  });

  // Check Local Resolver Cache
  const resolverHit = resolverCache.find(
    (r) => r.domain.toLowerCase() === normalizedDomain && r.type === recordType && r.ttl > 0
  );

  if (resolverHit) {
    const resolverToClientDelay = calculateHopDelays('local_resolver', 'client', {
      ...delayParams,
      distanceKm: Math.max(15, delayParams.distanceKm * 0.1),
    });

    steps.push({
      stepIndex: steps.length + 1,
      fromNodeId: 'local_resolver',
      toNodeId: 'client',
      label: `L3 Local Resolver Cache Hit`,
      description: `HIT in recursive resolver cache! Returns ${resolverHit.value} (TTL ${resolverHit.ttl}s). Upstream Root/TLD queries bypassed.`,
      isQuery: false,
      isCacheHit: true,
      hitTier: 'resolver',
      recordReturned: resolverHit,
      hopDelays: resolverToClientDelay,
      dnsHeader: makeHeader('RESPONSE', false, 1, 0),
    });

    return {
      domain: normalizedDomain,
      recordType,
      resolutionMode: mode,
      cacheHitAt: 'resolver',
      totalDelayMs: Number(
        steps.reduce((sum, s) => sum + s.hopDelays.totalHopDelayMs, 0).toFixed(2)
      ),
      resolvedIp: resolverHit.value,
      steps,
      timestamp: new Date().toLocaleTimeString(),
    };
  }

  // 4. Cache Miss at Local Resolver -> Traverse Hierarchy!
  // Find Authoritative Data or fallback
  const authEntry = AUTHORITATIVE_DATABASE[normalizedDomain];
  let finalRecord: DnsRecord | undefined;

  if (authEntry) {
    finalRecord = authEntry.records.find((r) => r.type === recordType) || authEntry.records[0];
  } else {
    // Generate standard simulated response for any entered domain
    const simulatedIp = `198.51.100.${Math.floor(Math.random() * 200 + 10)}`;
    finalRecord = {
      id: `gen-${Date.now()}`,
      domain: normalizedDomain,
      type: recordType,
      value:
        recordType === 'A'
          ? simulatedIp
          : recordType === 'AAAA'
          ? '2001:db8::8a2e:370:7334'
          : recordType === 'CNAME'
          ? `cdn.${normalizedDomain}`
          : recordType === 'MX'
          ? `10 mail.${normalizedDomain}`
          : 'v=spf1 ~all',
      ttl: 300,
      originalTtl: 300,
      tier: 'authoritative',
    };
  }

  const queryOriginNode = mode === 'recursive' ? 'local_resolver' : 'client';

  // Step 4A: Query Root Server (.)
  const toRootDelay = calculateHopDelays(queryOriginNode, 'root_server', {
    ...delayParams,
    distanceKm: delayParams.distanceKm * 0.8,
  });

  steps.push({
    stepIndex: steps.length + 1,
    fromNodeId: queryOriginNode,
    toNodeId: 'root_server',
    label: `Query Root Server (.)`,
    description: `${mode === 'recursive' ? 'Recursive resolver' : 'Client'} queries Root server 'a.root-servers.net' for '${normalizedDomain}'. Root knows nothing about specific hostnames, only TLD delegations.`,
    isQuery: true,
    isCacheHit: false,
    hopDelays: toRootDelay,
    dnsHeader: makeHeader('QUERY', false, 0, 0),
  });

  // Step 4B: Root Server responds with referral to TLD server
  const rootResponseDelay = calculateHopDelays('root_server', queryOriginNode, {
    ...delayParams,
    distanceKm: delayParams.distanceKm * 0.8,
  });

  const tldServerInfo = DEFAULT_TLD_SERVERS[tld] || DEFAULT_TLD_SERVERS['com'];

  steps.push({
    stepIndex: steps.length + 1,
    fromNodeId: 'root_server',
    toNodeId: queryOriginNode,
    label: `Root Referral to .${tld.toUpperCase()} TLD`,
    description: `Root returns delegation NS records pointing to '${tldServerInfo.server}' (${tldServerInfo.ip}) with glue records.`,
    isQuery: false,
    isCacheHit: false,
    hopDelays: rootResponseDelay,
    dnsHeader: makeHeader('RESPONSE', false, 0, 2),
  });

  // Step 4C: Query TLD Server (.com / .org / etc.)
  const toTldDelay = calculateHopDelays(queryOriginNode, 'tld_server', {
    ...delayParams,
    distanceKm: delayParams.distanceKm * 0.7,
  });

  steps.push({
    stepIndex: steps.length + 1,
    fromNodeId: queryOriginNode,
    toNodeId: 'tld_server',
    label: `Query TLD Server (.${tld})`,
    description: `Querying '${tldServerInfo.server}' for '${normalizedDomain}'. TLD server knows authoritative nameservers for registered second-level domains.`,
    isQuery: true,
    isCacheHit: false,
    hopDelays: toTldDelay,
    dnsHeader: makeHeader('QUERY', false, 0, 0),
  });

  // Step 4D: TLD Server responds with referral to Authoritative Server
  const tldResponseDelay = calculateHopDelays('tld_server', queryOriginNode, {
    ...delayParams,
    distanceKm: delayParams.distanceKm * 0.7,
  });

  const authNsName = authEntry ? authEntry.ns : `ns1.${normalizedDomain}`;
  const authNsIp = authEntry ? authEntry.nsIp : '198.51.100.2';

  steps.push({
    stepIndex: steps.length + 1,
    fromNodeId: 'tld_server',
    toNodeId: queryOriginNode,
    label: `TLD Referral to Authoritative NS`,
    description: `TLD server delegates query to '${authNsName}' (${authNsIp}) with NS and A records.`,
    isQuery: false,
    isCacheHit: false,
    hopDelays: tldResponseDelay,
    dnsHeader: makeHeader('RESPONSE', false, 0, 2),
  });

  // Step 4E: Query Authoritative Name Server
  const toAuthDelay = calculateHopDelays(queryOriginNode, 'auth_server', delayParams);

  steps.push({
    stepIndex: steps.length + 1,
    fromNodeId: queryOriginNode,
    toNodeId: 'auth_server',
    label: `Query Authoritative Server`,
    description: `Query sent directly to zone owner's authoritative server '${authNsName}'. This server holds the authentic zone file.`,
    isQuery: true,
    isCacheHit: false,
    hopDelays: toAuthDelay,
    dnsHeader: makeHeader('QUERY', false, 0, 0),
  });

  // Step 4F: Authoritative Answer Returned
  const authResponseDelay = calculateHopDelays('auth_server', queryOriginNode, delayParams);

  steps.push({
    stepIndex: steps.length + 1,
    fromNodeId: 'auth_server',
    toNodeId: queryOriginNode,
    label: `Authoritative Answer (AA=1)`,
    description: `Authoritative server answers! AA flag set to 1. Record: ${finalRecord.domain} ${finalRecord.type} ${finalRecord.value} (TTL ${finalRecord.ttl}s).`,
    isQuery: false,
    isCacheHit: false,
    recordReturned: finalRecord,
    hopDelays: authResponseDelay,
    dnsHeader: makeHeader('RESPONSE', true, 1, 0),
  });

  // Step 4G: In recursive mode, Local Resolver caches and returns to client
  if (mode === 'recursive') {
    const resolverToClientFinalDelay = calculateHopDelays('local_resolver', 'client', {
      ...delayParams,
      distanceKm: Math.max(15, delayParams.distanceKm * 0.1),
    });

    steps.push({
      stepIndex: steps.length + 1,
      fromNodeId: 'local_resolver',
      toNodeId: 'client',
      label: `Resolver Delivers IP to Client`,
      description: `Recursive resolver caches the record locally and delivers final IP response to client host. OS and Browser will now cache this entry.`,
      isQuery: false,
      isCacheHit: false,
      recordReturned: finalRecord,
      hopDelays: resolverToClientFinalDelay,
      dnsHeader: makeHeader('RESPONSE', false, 1, 0),
    });
  }

  // Calculate total nodal delay across entire trace
  const totalDelayMs = Number(
    steps.reduce((sum, s) => sum + s.hopDelays.totalHopDelayMs, 0).toFixed(2)
  );

  return {
    domain: normalizedDomain,
    recordType,
    resolutionMode: mode,
    cacheHitAt: 'none',
    totalDelayMs,
    resolvedIp: finalRecord.value,
    steps,
    timestamp: new Date().toLocaleTimeString(),
  };
}

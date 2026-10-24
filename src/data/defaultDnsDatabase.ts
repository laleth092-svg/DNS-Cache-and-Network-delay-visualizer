import { DnsNode, DnsRecord } from '../types/network';

export const DEFAULT_ROOT_SERVERS: DnsRecord[] = [
  { id: 'root-1', domain: '.', type: 'A', value: '198.41.0.4 (a.root-servers.net)', ttl: 86400, originalTtl: 86400, tier: 'authoritative' },
  { id: 'root-2', domain: '.', type: 'A', value: '199.9.14.201 (b.root-servers.net)', ttl: 86400, originalTtl: 86400, tier: 'authoritative' },
];

export const DEFAULT_TLD_SERVERS: Record<string, { server: string; ip: string }> = {
  com: { server: 'a.gtld-servers.net', ip: '192.5.6.30' },
  org: { server: 'a0.org.afilias-nst.info', ip: '199.19.56.1' },
  edu: { server: 'a.edu-servers.net', ip: '192.33.14.30' },
  net: { server: 'a.gtld-servers.net', ip: '192.5.6.30' },
  io: { server: 'a0.nic.io', ip: '193.0.14.129' },
};

export const AUTHORITATIVE_DATABASE: Record<string, { ns: string; nsIp: string; records: DnsRecord[] }> = {
  'google.com': {
    ns: 'ns1.google.com',
    nsIp: '216.239.32.10',
    records: [
      { id: 'g-1', domain: 'google.com', type: 'A', value: '142.250.190.46', ttl: 300, originalTtl: 300, tier: 'authoritative' },
      { id: 'g-2', domain: 'google.com', type: 'AAAA', value: '2607:f8b0:4005:805::200e', ttl: 300, originalTtl: 300, tier: 'authoritative' },
      { id: 'g-3', domain: 'google.com', type: 'MX', value: '10 smtp.google.com', ttl: 3600, originalTtl: 3600, tier: 'authoritative' },
    ],
  },
  'mit.edu': {
    ns: 'straw.mit.edu',
    nsIp: '18.71.0.151',
    records: [
      { id: 'mit-1', domain: 'mit.edu', type: 'A', value: '104.18.23.101', ttl: 1800, originalTtl: 1800, tier: 'authoritative' },
      { id: 'mit-2', domain: 'mit.edu', type: 'MX', value: '10 enterprise.mit.edu', ttl: 3600, originalTtl: 3600, tier: 'authoritative' },
    ],
  },
  'wikipedia.org': {
    ns: 'ns0.wikimedia.org',
    nsIp: '208.80.154.238',
    records: [
      { id: 'wiki-1', domain: 'wikipedia.org', type: 'A', value: '208.80.154.224', ttl: 600, originalTtl: 600, tier: 'authoritative' },
      { id: 'wiki-2', domain: 'wikipedia.org', type: 'TXT', value: 'v=spf1 include:wikimedia.org ~all', ttl: 3600, originalTtl: 3600, tier: 'authoritative' },
    ],
  },
  'github.com': {
    ns: 'dns1.p08.nsone.net',
    nsIp: '198.51.44.8',
    records: [
      { id: 'gh-1', domain: 'github.com', type: 'A', value: '140.82.121.3', ttl: 60, originalTtl: 60, tier: 'authoritative' },
      { id: 'gh-2', domain: 'www.github.com', type: 'CNAME', value: 'github.com', ttl: 300, originalTtl: 300, tier: 'authoritative' },
    ],
  },
  'netflix.com': {
    ns: 'ns-1218.awsdns-24.org',
    nsIp: '205.251.196.194',
    records: [
      { id: 'nflx-1', domain: 'netflix.com', type: 'A', value: '54.148.37.106', ttl: 60, originalTtl: 60, tier: 'authoritative' },
    ],
  },
};

export const INITIAL_BROWSER_CACHE: DnsRecord[] = [
  { id: 'b-cache-1', domain: 'netflix.com', type: 'A', value: '54.148.37.106', ttl: 42, originalTtl: 60, tier: 'browser', cachedAt: Date.now() - 18000 },
];

export const INITIAL_OS_CACHE: DnsRecord[] = [
  { id: 'os-cache-1', domain: 'mit.edu', type: 'A', value: '104.18.23.101', ttl: 1240, originalTtl: 1800, tier: 'os', cachedAt: Date.now() - 560000 },
];

export const INITIAL_RESOLVER_CACHE: DnsRecord[] = [
  { id: 'res-cache-1', domain: 'wikipedia.org', type: 'A', value: '208.80.154.224', ttl: 480, originalTtl: 600, tier: 'resolver', cachedAt: Date.now() - 120000 },
];

export const TOPOLOGY_NODES: DnsNode[] = [
  {
    id: 'client',
    name: 'Client Device',
    label: 'Host Application',
    type: 'client',
    ip: '192.168.1.105',
    x: 80,
    y: 220,
    status: 'idle',
  },
  {
    id: 'browser_cache',
    name: 'Browser Cache',
    label: 'Chrome / Firefox Cache',
    type: 'browser_cache',
    ip: '127.0.0.1 (Internal)',
    x: 230,
    y: 130,
    status: 'idle',
  },
  {
    id: 'os_cache',
    name: 'OS DNS Cache',
    label: 'systemd-resolved / getaddrinfo',
    type: 'os_cache',
    ip: '127.0.0.53',
    x: 230,
    y: 310,
    status: 'idle',
  },
  {
    id: 'local_resolver',
    name: 'Local Recursive Resolver',
    label: 'ISP / Google DNS (8.8.8.8)',
    type: 'local_resolver',
    ip: '8.8.8.8',
    x: 430,
    y: 220,
    status: 'idle',
  },
  {
    id: 'root_server',
    name: 'Root Name Server',
    label: 'a.root-servers.net (.)',
    type: 'root_server',
    ip: '198.41.0.4',
    zone: '.',
    x: 690,
    y: 80,
    status: 'idle',
  },
  {
    id: 'tld_server',
    name: 'TLD Name Server',
    label: 'a.gtld-servers.net (.com/.org)',
    type: 'tld_server',
    ip: '192.5.6.30',
    zone: '.com / .org / .edu',
    x: 690,
    y: 220,
    status: 'idle',
  },
  {
    id: 'auth_server',
    name: 'Authoritative Server',
    label: 'ns1.google.com / ns0.wikimedia',
    type: 'auth_server',
    ip: '216.239.32.10',
    zone: 'Target Domain Zone',
    x: 690,
    y: 360,
    status: 'idle',
  },
  {
    id: 'destination_host',
    name: 'Target Web Server',
    label: 'HTTP/HTTPS Origin Server',
    type: 'destination_host',
    ip: '142.250.190.46',
    x: 890,
    y: 220,
    status: 'idle',
  },
];

export interface ScenarioDefinition {
  id: string;
  title: string;
  badge: string;
  description: string;
  targetDomain: string;
  recordType: 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT';
  setupAction: 'flush_all' | 'warm_browser' | 'warm_os' | 'warm_resolver' | 'cname_demo' | 'high_latency';
  educationalFocus: string;
}

export const NETWORK_SCENARIOS: ScenarioDefinition[] = [
  {
    id: 'cold_lookup',
    title: 'Cold DNS Resolution',
    badge: '4-Hop Hierarchy',
    description: 'Simulates a completely cold domain query where neither browser, OS, nor recursive resolver has cached the record. All 4 hops (Client -> Resolver -> Root -> TLD -> Auth) must be traversed.',
    targetDomain: 'google.com',
    recordType: 'A',
    setupAction: 'flush_all',
    educationalFocus: 'Observe recursive query flow: Resolver takes over client task, querying Root (.) for TLD reference, TLD for Authoritative reference, and finally Authoritative for the IP.',
  },
  {
    id: 'browser_hit',
    title: 'L1 Browser Cache Hit',
    badge: 'Sub-millisecond',
    description: 'Querying netflix.com which is already hot in the browser DNS cache. No network packets are dispatched outside localhost.',
    targetDomain: 'netflix.com',
    recordType: 'A',
    setupAction: 'warm_browser',
    educationalFocus: 'L1 Browser Cache avoids OS kernel syscalls and all network transmission, yielding near 0ms resolution delay.',
  },
  {
    id: 'os_hit',
    title: 'L2 Operating System Cache Hit',
    badge: 'Kernel Cache',
    description: 'Querying mit.edu which resides in the host OS stub resolver cache. Resolves locally without ISP traversal.',
    targetDomain: 'mit.edu',
    recordType: 'A',
    setupAction: 'warm_os',
    educationalFocus: 'Demonstrates OS-level resolution via getaddrinfo/systemd-resolved. Only microsecond IPC overhead occurs.',
  },
  {
    id: 'resolver_hit',
    title: 'L3 Local Resolver Cache Hit',
    badge: 'ISP Edge Hit',
    description: 'Querying wikipedia.org where the recursive resolver has a valid cached entry. Skips the Root and TLD servers entirely.',
    targetDomain: 'wikipedia.org',
    recordType: 'A',
    setupAction: 'warm_resolver',
    educationalFocus: 'Local resolver caching saves global internet bandwidth and cuts latency from ~200ms to 10-25ms for all users sharing the ISP.',
  },
  {
    id: 'cname_alias',
    title: 'CNAME Canonical Chaining',
    badge: 'Alias Resolution',
    description: 'Querying www.github.com which returns a CNAME alias pointing to github.com, requiring a second lookup cycle.',
    targetDomain: 'www.github.com',
    recordType: 'CNAME',
    setupAction: 'cname_demo',
    educationalFocus: 'Shows how CNAME (Canonical Name) records require recursive alias chasing to discover the final IPv4 A-record address.',
  },
];

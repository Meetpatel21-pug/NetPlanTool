import React, { useState } from 'react';
import { Search, Hash } from 'lucide-react';

interface SubnetEntry {
  cidr: string;
  mask: string;
  wildcard: string;
  totalIps: string;
  usableHosts: string;
  scope: string;
  isPrivate: boolean;
  typicalUse: string;
}

const SUBNET_ENTRIES: SubnetEntry[] = [
  { cidr: '/8', mask: '255.0.0.0', wildcard: '0.255.255.255', totalIps: '16,777,216', usableHosts: '16,777,214', scope: 'RFC 1918 Class A (10.0.0.0/8)', isPrivate: true, typicalUse: 'Global Enterprise Backbone & Cloud VPC Supernet' },
  { cidr: '/12', mask: '255.240.0.0', wildcard: '0.15.255.255', totalIps: '1,048,576', usableHosts: '1,048,574', scope: 'RFC 1918 Class B (172.16.0.0/12)', isPrivate: true, typicalUse: 'Multi-Region Datacenter Interconnect' },
  { cidr: '/16', mask: '255.255.0.0', wildcard: '0.0.255.255', totalIps: '65,536', usableHosts: '65,534', scope: 'RFC 1918 Class C (192.168.0.0/16)', isPrivate: true, typicalUse: 'Campus Core Campus Network & Core Routing' },
  { cidr: '/20', mask: '255.255.240.0', wildcard: '0.0.15.255', totalIps: '4,096', usableHosts: '4,094', scope: 'Private / Corporate Allocation', isPrivate: true, typicalUse: 'Large Campus Building Distribution Tier' },
  { cidr: '/22', mask: '255.255.252.0', wildcard: '0.0.3.255', totalIps: '1,024', usableHosts: '1,022', scope: 'Private / Campus Tier', isPrivate: true, typicalUse: 'High-Density Wi-Fi 6E DHCP Pool' },
  { cidr: '/24', mask: '255.255.255.0', wildcard: '0.0.0.255', totalIps: '256', usableHosts: '254', scope: 'Standard Department LAN', isPrivate: true, typicalUse: 'Department VLAN, Branch Office, Server Farm' },
  { cidr: '/26', mask: '255.255.255.192', wildcard: '0.0.0.63', totalIps: '64', usableHosts: '62', scope: 'Department Sub-segment', isPrivate: true, typicalUse: 'Executive Staff, DMZ Proxy Farm' },
  { cidr: '/28', mask: '255.255.255.240', wildcard: '0.0.0.15', totalIps: '16', usableHosts: '14', scope: 'Protected Services', isPrivate: true, typicalUse: 'OOBM Network Management & IPMI/iDRAC' },
  { cidr: '/29', mask: '255.255.255.248', wildcard: '0.0.0.7', totalIps: '8', usableHosts: '6', scope: 'Firewall Cluster VIPs', isPrivate: true, typicalUse: 'Dual-WAN Gateway Cluster & VRRP/HSRP' },
  { cidr: '/30', mask: '255.255.255.252', wildcard: '0.0.0.3', totalIps: '4', usableHosts: '2', scope: 'Legacy P2P Uplink', isPrivate: true, typicalUse: 'Point-to-Point Inter-Router Link' },
  { cidr: '/31', mask: '255.255.255.254', wildcard: '0.0.0.1', totalIps: '2', usableHosts: '2', scope: 'RFC 3021 Modern P2P', isPrivate: true, typicalUse: 'Modern High-Efficiency Point-to-Point Links' },
  { cidr: '/32', mask: '255.255.255.255', wildcard: '0.0.0.0', totalIps: '1', usableHosts: '1 (Host)', scope: 'Loopback / Host Route', isPrivate: true, typicalUse: 'Router BGP Loopback & Anycast Service IP' },
];

export const LandingSubnetMatrix: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'large' | 'medium' | 'small'>('all');

  const filteredEntries = SUBNET_ENTRIES.filter((entry) => {
    const matchesSearch =
      entry.cidr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.mask.includes(searchTerm) ||
      entry.usableHosts.includes(searchTerm) ||
      entry.typicalUse.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    const prefixNum = parseInt(entry.cidr.replace('/', ''), 10);
    if (selectedFilter === 'large') return prefixNum <= 16;
    if (selectedFilter === 'medium') return prefixNum > 16 && prefixNum <= 24;
    if (selectedFilter === 'small') return prefixNum > 24;
    return true;
  });

  return (
    <section
      className="landing-subnet-matrix-section"
      style={{
        paddingTop: '3.5rem',
        paddingBottom: '4.5rem',
        position: 'relative',
      }}
    >
      <div className="layout-container">
        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 3rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(255, 255, 255, 0.94)',
              padding: '0.45rem 1.15rem',
              borderRadius: '999px',
              boxShadow: '4px 6px 16px rgba(124, 92, 191, 0.1), inset 1px 1px 2px #ffffff',
              border: '1.5px solid rgba(255, 255, 255, 0.95)',
              marginBottom: '1rem',
            }}
          >
            <Hash className="w-4 h-4 text-purple-600" />
            <span style={{ fontSize: '0.825rem', fontWeight: 800, color: '#2d1f4e' }}>
              INTERACTIVE CIDR & SUBNETTING REFERENCE
            </span>
          </div>

          <h2
            style={{
              fontSize: 'clamp(2.2rem, 4vw, 3rem)',
              fontWeight: 900,
              letterSpacing: '-0.03em',
              lineHeight: 1.15,
              color: '#2d1f4e',
              marginBottom: '0.75rem',
            }}
          >
            Deterministic IPv4 Prefix & Host Capacity Matrix
          </h2>

          <p
            style={{
              fontSize: '1.05rem',
              color: '#5e4e7e',
              lineHeight: 1.6,
            }}
          >
            Explore real-time bitmask allocations from /8 enterprise backbones down to RFC 3021 /31 point-to-point uplinks with automated wildcard derivation.
          </p>
        </div>

        {/* Filter and Search Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '2rem',
            background: 'rgba(255, 255, 255, 0.88)',
            backdropFilter: 'blur(16px)',
            padding: '1rem 1.5rem',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '4px 8px 24px rgba(124, 92, 191, 0.08), inset 1px 1px 2px #ffffff',
            border: '1.5px solid rgba(255, 255, 255, 0.95)',
          }}
        >
          {/* Search Box */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              background: '#ffffff',
              padding: '0.6rem 1.15rem',
              borderRadius: '999px',
              border: '1.5px solid rgba(139, 92, 246, 0.25)',
              boxShadow: 'inset 1px 1px 2px rgba(180, 165, 220, 0.2)',
              width: 'min(100%, 320px)',
              flex: 1,
            }}
          >
            <Search className="w-4 h-4 text-purple-600" />
            <input
              type="text"
              placeholder="Search prefix, mask, or use-case..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                fontSize: '0.875rem',
                color: '#2d1f4e',
                width: '100%',
                background: 'transparent',
              }}
            />
          </div>

          {/* Quick Filter Pills */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'All Prefixes (/8 - /32)' },
              { id: 'large', label: 'Supernets (/8 - /16)' },
              { id: 'medium', label: 'Subnets (/17 - /24)' },
              { id: 'small', label: 'Micro (/25 - /32)' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelectedFilter(f.id as any)}
                style={{
                  padding: '0.45rem 0.95rem',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  borderRadius: '999px',
                  border: 'none',
                  cursor: 'pointer',
                  background: selectedFilter === f.id ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)' : '#ffffff',
                  color: selectedFilter === f.id ? '#ffffff' : '#6b5a8a',
                  boxShadow:
                    selectedFilter === f.id
                      ? '0 4px 12px rgba(124, 92, 191, 0.3)'
                      : '0 2px 6px rgba(124, 92, 191, 0.06)',
                  transition: 'all 0.2s ease',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Matrix Grid Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
            gap: '1.25rem',
          }}
        >
          {filteredEntries.map((entry) => (
            <div
              key={entry.cidr}
              className="clay-card-interactive"
              style={{
                background: 'rgba(255, 255, 255, 0.92)',
                backdropFilter: 'blur(16px)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.5rem',
                border: '1.5px solid rgba(255, 255, 255, 0.95)',
                boxShadow:
                  '0 8px 24px rgba(124, 92, 191, 0.08), inset 1.5px 1.5px 2px #ffffff, inset -1px -1px 2px rgba(180, 165, 220, 0.2)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div
                      style={{
                        background: 'linear-gradient(145deg, #ede7fb, #e0d4f7)',
                        padding: '0.45rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        fontWeight: 900,
                        fontSize: '1.25rem',
                        fontFamily: 'var(--font-mono)',
                        color: '#7c3aed',
                        boxShadow: 'inset 1px 1px 2px rgba(255, 255, 255, 0.8)',
                      }}
                    >
                      {entry.cidr}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#6b5a8a' }}>Subnet Mask</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.85rem', color: '#2d1f4e' }}>
                        {entry.mask}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      background: 'rgba(16, 185, 129, 0.1)',
                      color: '#059669',
                      padding: '0.25rem 0.65rem',
                      borderRadius: '999px',
                      fontSize: '0.725rem',
                      fontWeight: 800,
                    }}
                  >
                    {entry.usableHosts} Hosts
                  </div>
                </div>

                <div
                  style={{
                    background: 'rgba(247, 244, 252, 0.8)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.65rem 0.85rem',
                    marginBottom: '1rem',
                  }}
                >
                  <div style={{ fontSize: '0.725rem', color: '#6b5a8a', marginBottom: '0.2rem' }}>
                    Standard Deployment Scope:
                  </div>
                  <div style={{ fontSize: '0.825rem', fontWeight: 700, color: '#2d1f4e', lineHeight: 1.4 }}>
                    {entry.typicalUse}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.75rem',
                  color: '#6b5a8a',
                  borderTop: '1px solid rgba(139, 92, 246, 0.12)',
                  paddingTop: '0.75rem',
                }}
              >
                <span>Wildcard: <strong style={{ fontFamily: 'var(--font-mono)', color: '#2d1f4e' }}>{entry.wildcard}</strong></span>
                <span style={{ color: '#7c3aed', fontWeight: 700 }}>Total: {entry.totalIps} IPs</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

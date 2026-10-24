import React, { useState } from 'react';
import { BookOpen, ShieldCheck } from 'lucide-react';

interface ProtocolDoc {
  id: string;
  name: string;
  title: string;
  category: string;
  summary: string;
  keyRules: string[];
  codeExample: string;
}

const PROTOCOLS: ProtocolDoc[] = [
  {
    id: 'rfc-1918',
    name: 'RFC 1918',
    title: 'Address Allocation for Private Internets',
    category: 'Core IPAM Protocol',
    summary:
      'Defines the three non-routable private IPv4 blocks reserved for internal enterprise infrastructure, eliminating public IP exhaustion and external routing conflicts.',
    keyRules: [
      '24-bit Block: 10.0.0.0 – 10.255.255.255 (10.0.0.0/8 prefix)',
      '20-bit Block: 172.16.0.0 – 172.31.255.255 (172.16.0.0/12 prefix)',
      '16-bit Block: 192.168.0.0 – 192.168.255.255 (192.168.0.0/16 prefix)',
      'Zero routing advertisement on global BGP internet routing tables',
    ],
    codeExample: `# RFC 1918 Private Range Definition
10.0.0.0/8     -> 16,777,214 usable enterprise hosts
172.16.0.0/12  -> 1,048,574 usable datacenter hosts
192.168.0.0/16 -> 65,534 usable branch/campus hosts`,
  },
  {
    id: 'rfc-3021',
    name: 'RFC 3021',
    title: 'Using 31-Bit Prefixes on IPv4 Point-to-Point Links',
    category: 'High-Efficiency Routing',
    summary:
      'Reclaims 50% of IPv4 address capacity on direct inter-router and core-switch links by removing the traditional network and broadcast address overhead.',
    keyRules: [
      'Allows /31 bitmasks (255.255.255.254) on point-to-point connections',
      'Provides exactly 2 host endpoints without requiring dedicated broadcast bits',
      'Supported line-rate across Cisco IOS-XE, Juniper Junos, and Arista EOS',
      'Eliminates address exhaustion on high-density leaf-spine fabrics',
    ],
    codeExample: `# RFC 3021 /31 Point-to-Point Configuration
Subnet:  10.254.0.0/31 (Netmask: 255.255.255.254)
Router A Endpoint: 10.254.0.0
Router B Endpoint: 10.254.0.1
Total Address Waste: 0 IPs (100% address utilization)`,
  },
  {
    id: 'ieee-8021q',
    name: 'IEEE 802.1Q',
    title: 'Virtual Bridged Local Area Networks (VLAN Tagging)',
    category: 'Ethernet Layer 2 Architecture',
    summary:
      'Standardized packet tagging format inserting a 4-byte 802.1Q tag into Ethernet frames to multiplex up to 4,094 isolated VLAN broadcast domains over a single optical trunk.',
    keyRules: [
      '12-bit VLAN Identifier (VID) supporting VLAN 1 through 4094',
      '3-bit Priority Code Point (PCP) for 802.1p Quality of Service (QoS)',
      'Trunk encapsulation isolating Management, Storage, and User LANs',
      'Prevents broadcast storms and ARP floods from traversing subnet boundaries',
    ],
    codeExample: `# Ethernet II Frame with IEEE 802.1Q Tag:
[Dest MAC 6B][Src MAC 6B][802.1Q Tag 4B: TPID 0x8100 | VID][EtherType 2B][Payload]
VLAN 10: Engineering Core  | 10.0.10.0/24
VLAN 20: Executive Staff   | 10.0.20.0/24
VLAN 30: Guest Wi-Fi       | 10.0.30.0/24`,
  },
  {
    id: 'rfc-4632',
    name: 'RFC 4632',
    title: 'Classless Inter-Domain Routing (CIDR) Architecture',
    category: 'Supernetting & Aggregation',
    summary:
      'Replaced historic Class A/B/C addressing with arbitrary-length bitmasks (/8 to /32), enabling route summarization and deterministic hierarchic prefix aggregation.',
    keyRules: [
      'Variable-Length Subnet Masking (VLSM) dynamically matching host requirements',
      'Prefix aggregation drastically reducing routing table memory consumption',
      'Binary boundary alignment ensuring subnets nest deterministically',
      'Mathematical radix tree matching for sub-microsecond route lookups',
    ],
    codeExample: `# CIDR Route Summarization Example:
Four /24 subnets: 192.168.0.0/24, 192.168.1.0/24, 192.168.2.0/24, 192.168.3.0/24
Summarized Supernet: 192.168.0.0/22
Routing table entries reduced from 4 to 1`,
  },
];

export const LandingProtocolStandards: React.FC = () => {
  const [activeProtoId, setActiveProtoId] = useState<string>('rfc-1918');

  const currentProto = PROTOCOLS.find((p) => p.id === activeProtoId) || PROTOCOLS[0];

  return (
    <section
      className="landing-protocols-section"
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
            <BookOpen className="w-4 h-4 text-purple-600" />
            <span style={{ fontSize: '0.825rem', fontWeight: 800, color: '#2d1f4e' }}>
              IETF & IEEE SPECIFICATION SUITE
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
            Built on Industry RFC Standards
          </h2>

          <p
            style={{
              fontSize: '1.05rem',
              color: '#5e4e7e',
              lineHeight: 1.6,
            }}
          >
            Every allocation, pre-flight rule, and spatial connection strictly adheres to IETF RFC standards and IEEE 802.1Q specifications.
          </p>
        </div>

        {/* Protocol Selector Rail */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '0.75rem',
            flexWrap: 'wrap',
            marginBottom: '2.5rem',
          }}
        >
          {PROTOCOLS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setActiveProtoId(p.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.65rem',
                padding: '0.75rem 1.4rem',
                borderRadius: '999px',
                border: '1.5px solid',
                borderColor: activeProtoId === p.id ? 'rgba(124, 58, 237, 0.8)' : 'rgba(255, 255, 255, 0.95)',
                background:
                  activeProtoId === p.id
                    ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)'
                    : 'rgba(255, 255, 255, 0.92)',
                color: activeProtoId === p.id ? '#ffffff' : '#2d1f4e',
                fontWeight: 800,
                fontSize: '0.875rem',
                boxShadow:
                  activeProtoId === p.id
                    ? '0 8px 20px rgba(124, 92, 191, 0.35), inset 1px 1px 2px rgba(255, 255, 255, 0.5)'
                    : '0 4px 14px rgba(124, 92, 191, 0.08), inset 1px 1px 2px #ffffff',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
              }}
            >
              <span>{p.name}</span>
              <span
                style={{
                  fontSize: '0.7rem',
                  opacity: activeProtoId === p.id ? 0.9 : 0.65,
                  fontWeight: 600,
                }}
              >
                ({p.category})
              </span>
            </button>
          ))}
        </div>

        {/* Active Protocol Deep-Dive Display Card */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.94)',
            backdropFilter: 'blur(20px)',
            borderRadius: 'var(--radius-xl)',
            padding: '2.5rem',
            boxShadow:
              '0 16px 40px rgba(124, 92, 191, 0.1), inset 2px 2px 4px #ffffff, inset -2px -2px 4px rgba(180, 165, 220, 0.2)',
            border: '2px solid rgba(255, 255, 255, 0.95)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
            gap: '2rem',
            alignItems: 'center',
          }}
        >
          {/* Left Details */}
          <div>
            <div
              style={{
                display: 'inline-block',
                background: 'rgba(124, 58, 237, 0.1)',
                color: '#7c3aed',
                fontSize: '0.75rem',
                fontWeight: 800,
                padding: '0.3rem 0.8rem',
                borderRadius: '999px',
                marginBottom: '0.75rem',
              }}
            >
              {currentProto.name} • {currentProto.category}
            </div>

            <h3
              style={{
                fontSize: '1.65rem',
                fontWeight: 900,
                letterSpacing: '-0.02em',
                color: '#2d1f4e',
                lineHeight: 1.25,
                marginBottom: '1rem',
              }}
            >
              {currentProto.title}
            </h3>

            <p
              style={{
                fontSize: '0.975rem',
                color: '#5e4e7e',
                lineHeight: 1.65,
                marginBottom: '1.5rem',
              }}
            >
              {currentProto.summary}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {currentProto.keyRules.map((rule, rIdx) => (
                <div key={rIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#2d1f4e', lineHeight: 1.4 }}>
                    {rule}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Architecture Code Terminal */}
          <div
            style={{
              background: '#0d0a18',
              borderRadius: 'var(--radius-lg)',
              padding: '1.5rem',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.35)',
              border: '1.5px solid rgba(139, 92, 246, 0.35)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '0.75rem',
                marginBottom: '1rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
              </div>
              <span style={{ fontSize: '0.725rem', fontFamily: 'var(--font-mono)', color: '#a78bfa' }}>
                {currentProto.name.toLowerCase()}.spec
              </span>
            </div>

            <pre
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                color: '#e2e8f0',
                lineHeight: 1.6,
                margin: 0,
                whiteSpace: 'pre-wrap',
              }}
            >
              {currentProto.codeExample}
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
};

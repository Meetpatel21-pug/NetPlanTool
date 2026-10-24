import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  ChevronRight,
  Database,
  Wifi,
  Server,
  Lock,
  CheckCircle2,
} from 'lucide-react';

interface SubnetSlice {
  name: string;
  cidr: string;
  mask: string;
  hosts: number;
  usableHosts: number;
  gateway: string;
  broadcast: string;
  role: string;
  vlan: number;
  color: string;
  icon: React.ReactNode;
}

export const LandingCidrBreakdown: React.FC = () => {
  const [selectedSubnetIdx, setSelectedSubnetIdx] = useState<number>(0);

  const subnets: SubnetSlice[] = [
    {
      name: 'Engineering Dev Subnet',
      cidr: '10.0.1.0/24',
      mask: '255.255.255.0',
      hosts: 256,
      usableHosts: 254,
      gateway: '10.0.1.1',
      broadcast: '10.0.1.255',
      role: 'Kubernetes Nodes & Build Pods',
      vlan: 10,
      color: '#9b6dff',
      icon: <Server className="w-4 h-4 text-purple-600" />,
    },
    {
      name: 'Executive & Staff VoIP',
      cidr: '10.0.2.0/24',
      mask: '255.255.255.0',
      hosts: 256,
      usableHosts: 254,
      gateway: '10.0.2.1',
      broadcast: '10.0.2.255',
      role: 'Workstations & Low-Latency SIP',
      vlan: 20,
      color: '#06b6d4',
      icon: <Wifi className="w-4 h-4 text-cyan-600" />,
    },
    {
      name: 'Protected Database Cluster',
      cidr: '10.0.10.0/27',
      mask: '255.255.255.224',
      hosts: 32,
      usableHosts: 30,
      gateway: '10.0.10.1',
      broadcast: '10.0.10.31',
      role: 'PostgreSQL Primary & Read Replicas',
      vlan: 30,
      color: '#10b981',
      icon: <Database className="w-4 h-4 text-emerald-600" />,
    },
    {
      name: 'Point-to-Point WAN Trunk',
      cidr: '10.0.99.0/30',
      mask: '255.255.255.252',
      hosts: 4,
      usableHosts: 2,
      gateway: '10.0.99.1',
      broadcast: '10.0.99.3',
      role: 'Border Router to Datacenter Core',
      vlan: 99,
      color: '#f59e0b',
      icon: <Lock className="w-4 h-4 text-amber-600" />,
    },
  ];

  const activeSubnet = subnets[selectedSubnetIdx];

  return (
    <article
      className="cinematic-stack-card subnet-decomposition-container"
      style={{
        padding: '2.25rem',
        borderRadius: 'var(--radius-xl)',
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(20px)',
        boxShadow: 'var(--clay-shadow-lg)',
        border: '2px solid rgba(255, 255, 255, 0.95)',
        position: 'relative',
      }}
    >
      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.75rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span className="brand-tag">Layer 02 • Deterministic Addressing</span>
            <span
              className="brand-tag"
              style={{ background: 'linear-gradient(145deg, #5ec4a0, #10b981)' }}
            >
              1,022 Usable Hosts
            </span>
          </div>
          <h3
            style={{
              fontSize: 'clamp(1.2rem, 3.8vw, 1.5rem)',
              fontWeight: 800,
              color: 'var(--text-white)',
              marginTop: '0.4rem',
              lineHeight: 1.25,
            }}
          >
            Deterministic Multi-Tier CIDR Allocation Engine
          </h3>
          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '0.875rem',
              maxWidth: '640px',
              marginTop: '0.25rem',
              lineHeight: 1.5,
            }}
          >
            Carve enterprise root supernets (/16 or /20) into mathematically guaranteed, non-overlapping
            subnets with automated gateway assignments, broadcast addresses, and VLAN boundaries.
          </p>
        </div>

        <Link
          to="/projects?tab=subnets"
          className="btn-clay-secondary magnetic-btn"
          style={{
            padding: '0.6rem 1.4rem',
            fontSize: '0.85rem',
            borderRadius: '999px',
            width: 'auto',
            maxWidth: '100%',
            flexShrink: 0,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <Layers className="w-4 h-4 text-purple-600" />
          <span>Subnet Allocation Planner</span>
          <ChevronRight className="w-4 h-4 text-purple-600" />
        </Link>
      </div>

      {/* Visual Subnet Decomposition Tree */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
          gap: '1rem',
          marginBottom: '1.75rem',
        }}
      >
        {subnets.map((sub, idx) => {
          const isSelected = selectedSubnetIdx === idx;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedSubnetIdx(idx)}
              className="clay-card-interactive"
              style={{
                textAlign: 'left',
                padding: '1.1rem',
                borderRadius: 'var(--radius-lg)',
                border: isSelected
                  ? `2px solid ${sub.color}`
                  : '1.5px solid rgba(255, 255, 255, 0.9)',
                background: isSelected ? 'rgba(255, 255, 255, 0.98)' : 'rgba(255, 255, 255, 0.75)',
                boxShadow: isSelected ? 'var(--clay-shadow-md)' : 'var(--clay-shadow-sm)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.5rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <div
                    style={{
                      background: 'rgba(155, 109, 255, 0.12)',
                      padding: '0.35rem',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    {sub.icon}
                  </div>
                  <strong style={{ fontSize: '0.875rem', color: 'var(--text-white)' }}>
                    VLAN {sub.vlan}
                  </strong>
                </div>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: sub.color,
                  }}
                >
                  {sub.cidr}
                </span>
              </div>

              <div
                style={{
                  fontSize: '0.825rem',
                  fontWeight: 700,
                  color: 'var(--text-white)',
                  marginBottom: '0.2rem',
                }}
              >
                {sub.name}
              </div>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-secondary)' }}>
                {sub.usableHosts} usable hosts • {sub.mask}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Subnet Detail Inspection HUD */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          padding: '1.25rem 1.5rem',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--clay-shadow-sm)',
          border: '1.5px solid rgba(255, 255, 255, 0.95)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))',
          gap: '1.25rem',
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Target CIDR Block</div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontWeight: 800,
              fontSize: '1.1rem',
              color: activeSubnet.color,
            }}
          >
            {activeSubnet.cidr}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Default Gateway</div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontWeight: 800,
              fontSize: '0.95rem',
              color: 'var(--text-white)',
            }}
          >
            {activeSubnet.gateway}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Broadcast Address</div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontWeight: 800,
              fontSize: '0.95rem',
              color: 'var(--text-white)',
            }}
          >
            {activeSubnet.broadcast}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Subnet Mask</div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontWeight: 800,
              fontSize: '0.95rem',
              color: 'var(--text-white)',
            }}
          >
            {activeSubnet.mask}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-white)' }}>
            Collision-Free Allocation
          </span>
        </div>
      </div>
    </article>
  );
};

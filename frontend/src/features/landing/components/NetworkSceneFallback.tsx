import React, { useState } from 'react';
import { NetworkDeviceData, SubnetZoneData } from '../models/NetworkModels';
import { Router, HardDrive, Server, Monitor, Wifi, Printer, CheckCircle2, ShieldCheck, Activity } from 'lucide-react';

interface NetworkSceneFallbackProps {
  devices: NetworkDeviceData[];
  zones: SubnetZoneData[];
  onSelectDevice?: (device: NetworkDeviceData) => void;
}

export const NetworkSceneFallback: React.FC<NetworkSceneFallbackProps> = ({
  devices,
  zones: _zones,
  onSelectDevice,
}) => {
  const [selectedDevice, setSelectedDevice] = useState<NetworkDeviceData>(devices[0]);

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'router':
        return <Router className="w-5 h-5 text-purple-600" />;
      case 'switch':
        return <HardDrive className="w-5 h-5 text-indigo-500" />;
      case 'server':
        return <Server className="w-5 h-5 text-blue-500" />;
      case 'workstation':
        return <Monitor className="w-5 h-5 text-teal-600" />;
      case 'access_point':
        return <Wifi className="w-5 h-5 text-cyan-600" />;
      case 'printer':
        return <Printer className="w-5 h-5 text-amber-500" />;
      default:
        return <Monitor className="w-5 h-5 text-purple-600" />;
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: '520px',
        background: 'linear-gradient(135deg, rgba(232, 224, 240, 0.95) 0%, rgba(245, 239, 252, 0.98) 100%)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--clay-shadow-pressed)',
        padding: '2rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        overflow: 'hidden',
      }}
    >
      {/* Background Decorative Grid */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(circle, rgba(155, 109, 255, 0.15) 1.5px, transparent 1.5px)',
          backgroundSize: '24px 24px',
          opacity: 0.6,
          pointerEvents: 'none',
        }}
      />

      {/* Header Info */}
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span className="brand-tag">Topology Layout</span>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-white)', marginTop: '0.25rem' }}>
            Enterprise Network Architecture
          </h3>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
            Hierarchical distribution with active VLAN isolation and deterministic routing.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-emerald)', background: 'rgba(16, 185, 129, 0.1)', padding: '0.35rem 0.75rem', borderRadius: '999px' }}>
            <Activity className="w-3.5 h-3.5" />
            <span>Telemetry Nominal</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-indigo)', background: 'rgba(155, 109, 255, 0.12)', padding: '0.35rem 0.75rem', borderRadius: '999px' }}>
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>0 Conflicts</span>
          </div>
        </div>
      </div>

      {/* Subnet Clusters & Devices Grid */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          margin: '2rem 0',
        }}
      >
        {devices.map((dev) => {
          const isSelected = selectedDevice.id === dev.id;
          return (
            <div
              key={dev.id}
              onClick={() => {
                setSelectedDevice(dev);
                if (onSelectDevice) onSelectDevice(dev);
              }}
              style={{
                background: isSelected ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.65)',
                border: '2px solid',
                borderColor: isSelected ? 'var(--accent-indigo)' : 'rgba(255, 255, 255, 0.9)',
                borderRadius: 'var(--radius-md)',
                boxShadow: isSelected ? 'var(--clay-shadow-float)' : 'var(--clay-shadow-sm)',
                padding: '1.1rem',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                transform: isSelected ? 'translateY(-3px)' : 'none',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div style={{ background: 'rgba(155, 109, 255, 0.15)', padding: '0.45rem', borderRadius: '10px' }}>
                  {getDeviceIcon(dev.type)}
                </div>
                <span
                  style={{
                    fontSize: '0.65rem',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    color: 'var(--accent-indigo)',
                    background: 'rgba(155, 109, 255, 0.1)',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '999px',
                  }}
                >
                  {dev.status.toUpperCase()}
                </span>
              </div>

              <div style={{ fontWeight: 700, color: 'var(--text-white)', fontSize: '0.95rem' }}>
                {dev.name}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.65rem' }}>
                {dev.role}
              </div>

              <div style={{ borderTop: '1px solid rgba(168, 130, 220, 0.2)', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.725rem' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-white)' }}>
                  {dev.ip}
                </span>
                <span style={{ color: 'var(--text-muted)' }}>{dev.subnet}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Node Spec Inspector Bar */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          background: 'rgba(255, 255, 255, 0.85)',
          border: '1.5px solid rgba(255, 255, 255, 0.95)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--clay-shadow)',
          padding: '0.85rem 1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-white)' }}>
            Active Target: {selectedDevice.name}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            ({selectedDevice.role})
          </span>
        </div>

        <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>IPv4: </span>
            <strong style={{ color: 'var(--text-white)' }}>{selectedDevice.ip}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Subnet: </span>
            <strong style={{ color: 'var(--accent-indigo)' }}>{selectedDevice.subnet}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

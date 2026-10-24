import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Device, DeviceType } from '../../types/inventory';
import { 
  Radio, 
  HardDrive, 
  Server, 
  Printer, 
  Wifi, 
  Monitor,
  MapPin,
  Settings
} from 'lucide-react';

export interface DeviceNodeData extends Record<string, unknown> {
  device: Device;
  ip?: string | null;
  subnetLabel?: string | null;
  onOpenConfig?: (device: Device, clientX?: number, clientY?: number) => void;
}

const getDeviceIcon = (type: DeviceType) => {
  switch (type) {
    case 'router': return <Radio className="w-4 h-4 text-cyan-400" />;
    case 'switch': return <HardDrive className="w-4 h-4 text-indigo-400" />;
    case 'server': return <Server className="w-4 h-4 text-purple-400" />;
    case 'printer': return <Printer className="w-4 h-4 text-amber-400" />;
    case 'access_point': return <Wifi className="w-4 h-4 text-emerald-400" />;
    default: return <Monitor className="w-4 h-4 text-slate-300" />;
  }
};

export const DeviceNode: React.FC<NodeProps> = memo(({ data, selected }) => {
  const nodeData = data as unknown as DeviceNodeData;
  const { device, ip, subnetLabel } = nodeData;

  const handleTriggerEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (nodeData.onOpenConfig) {
      nodeData.onOpenConfig(device, e.clientX, e.clientY);
    }
  };

  return (
    <div 
      className={`device-diagram-node-clay ${selected ? 'selected' : ''}`}
      onContextMenu={handleTriggerEdit}
      onDoubleClick={handleTriggerEdit}
      title="Right-click, double-click, or click gear to edit IP, Location & MAC"
    >
      {/* Top handles: Target at 35%, Source at 65% to eliminate overlap */}
      <Handle 
        type="target" 
        position={Position.Top} 
        id="top-t" 
        className="diagram-handle diagram-handle-target" 
        style={{ left: '35%' }}
        title="Incoming Link (Target)" 
      />
      <Handle 
        type="source" 
        position={Position.Top} 
        id="top-s" 
        className="diagram-handle diagram-handle-source" 
        style={{ left: '65%' }}
        title="Outgoing Link (Source)" 
      />
      
      {/* Bottom handles: Target at 35%, Source at 65% */}
      <Handle 
        type="target" 
        position={Position.Bottom} 
        id="bottom-t" 
        className="diagram-handle diagram-handle-target" 
        style={{ left: '35%' }}
        title="Incoming Link (Target)" 
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="bottom-s" 
        className="diagram-handle diagram-handle-source" 
        style={{ left: '65%' }}
        title="Outgoing Link (Source)" 
      />
      
      {/* Left handles: Target at 35%, Source at 65% */}
      <Handle 
        type="target" 
        position={Position.Left} 
        id="left-t" 
        className="diagram-handle diagram-handle-target" 
        style={{ top: '35%' }}
        title="Incoming Link (Target)" 
      />
      <Handle 
        type="source" 
        position={Position.Left} 
        id="left-s" 
        className="diagram-handle diagram-handle-source" 
        style={{ top: '65%' }}
        title="Outgoing Link (Source)" 
      />
      
      {/* Right handles: Target at 35%, Source at 65% */}
      <Handle 
        type="target" 
        position={Position.Right} 
        id="right-t" 
        className="diagram-handle diagram-handle-target" 
        style={{ top: '35%' }}
        title="Incoming Link (Target)" 
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        id="right-s" 
        className="diagram-handle diagram-handle-source" 
        style={{ top: '65%' }}
        title="Outgoing Link (Source)" 
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 0 }}>
          <div style={{ padding: '0.35rem', background: 'rgba(155, 109, 255, 0.12)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {getDeviceIcon(device.device_type)}
          </div>
          <div style={{ minWidth: 0, overflow: 'hidden' }}>
            <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-white)', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {device.name}
            </div>
            <div style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {device.role}
            </div>
          </div>
        </div>
        <button
          type="button"
          className="node-edit-gear-btn"
          title="Configure IP, Location & MAC Address"
          onClick={handleTriggerEdit}
          style={{
            background: 'rgba(155, 109, 255, 0.12)',
            border: '1px solid rgba(155, 109, 255, 0.28)',
            borderRadius: '4px',
            padding: '0.2rem 0.3rem',
            cursor: 'pointer',
            color: 'var(--accent-indigo)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'all 0.15s ease'
          }}
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Location & MAC badges when set */}
      {(device.location || device.mac_address) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.3rem', marginBottom: '0.15rem' }}>
          {device.location && (
            <span 
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.2rem',
                fontSize: '0.65rem',
                background: 'rgba(155, 109, 255, 0.1)',
                border: '1px solid rgba(155, 109, 255, 0.25)',
                color: 'var(--accent-indigo)',
                padding: '0.1rem 0.4rem',
                borderRadius: '4px',
                maxWidth: '120px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
              title={`Location: ${device.location}`}
            >
              <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{device.location}</span>
            </span>
          )}
          {device.mac_address && (
            <span 
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.625rem',
                color: 'var(--text-muted)',
                background: 'rgba(255, 255, 255, 0.6)',
                border: '1px solid rgba(166, 152, 190, 0.2)',
                padding: '0.1rem 0.35rem',
                borderRadius: '4px',
                letterSpacing: '-0.02em'
              }}
              title={`MAC: ${device.mac_address}`}
            >
              {device.mac_address}
            </span>
          )}
        </div>
      )}

      {/* IP Badge */}
      {ip ? (
        <div style={{ marginTop: '0.45rem', paddingTop: '0.45rem', borderTop: '1px solid var(--border-active)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-indigo)', fontWeight: 600 }}>
            {ip}
          </span>
          {subnetLabel && (
            <span style={{ fontSize: '0.675rem', color: 'var(--text-muted)', maxWidth: '85px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {subnetLabel}
            </span>
          )}
        </div>
      ) : (
        <div style={{ marginTop: '0.45rem', paddingTop: '0.45rem', borderTop: '1px solid var(--border-active)', fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
          No IP assigned
        </div>
      )}
    </div>
  );
});

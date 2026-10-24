import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Device, DeviceType } from '../../types/inventory';
import { 
  Radio, 
  HardDrive, 
  Server, 
  Printer, 
  Wifi, 
  Monitor 
} from 'lucide-react';

export interface DeviceNodeData extends Record<string, unknown> {
  device: Device;
  ip?: string | null;
  subnetLabel?: string | null;
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

  return (
    <div 
      className={`device-diagram-node ${selected ? 'selected' : ''}`}
      style={{
        background: 'rgba(15, 23, 42, 0.92)',
        backdropFilter: 'blur(10px)',
        border: selected ? '2px solid var(--accent-cyan)' : '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: selected ? '0 0 20px rgba(56, 189, 248, 0.4)' : '0 4px 12px rgba(0, 0, 0, 0.5)',
        borderRadius: '10px',
        padding: '0.65rem 0.85rem',
        minWidth: '160px',
        color: '#ffffff',
        cursor: 'grab',
        position: 'relative'
      }}
    >
      <Handle type="target" position={Position.Top} id="top-t" style={{ background: '#38bdf8', width: '8px', height: '8px' }} />
      <Handle type="source" position={Position.Top} id="top-s" style={{ background: '#38bdf8', width: '8px', height: '8px' }} />
      
      <Handle type="target" position={Position.Bottom} id="bottom-t" style={{ background: '#38bdf8', width: '8px', height: '8px' }} />
      <Handle type="source" position={Position.Bottom} id="bottom-s" style={{ background: '#38bdf8', width: '8px', height: '8px' }} />
      
      <Handle type="target" position={Position.Left} id="left-t" style={{ background: '#38bdf8', width: '8px', height: '8px' }} />
      <Handle type="source" position={Position.Left} id="left-s" style={{ background: '#38bdf8', width: '8px', height: '8px' }} />
      
      <Handle type="target" position={Position.Right} id="right-t" style={{ background: '#38bdf8', width: '8px', height: '8px' }} />
      <Handle type="source" position={Position.Right} id="right-s" style={{ background: '#38bdf8', width: '8px', height: '8px' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
        <div style={{ padding: '0.25rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '6px' }}>
          {getDeviceIcon(device.device_type)}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#ffffff', lineHeight: 1.2 }}>
            {device.name}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
            {device.role}
          </div>
        </div>
      </div>

      {ip ? (
        <div style={{ marginTop: '0.35rem', paddingTop: '0.35rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.725rem' }}>
          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', fontWeight: 600 }}>
            {ip}
          </span>
          {subnetLabel && (
            <span style={{ fontSize: '0.65rem', color: '#64748b', maxWidth: '70px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {subnetLabel}
            </span>
          )}
        </div>
      ) : (
        <div style={{ marginTop: '0.35rem', paddingTop: '0.35rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', fontSize: '0.675rem', color: '#64748b', fontStyle: 'italic' }}>
          No IP assigned
        </div>
      )}
    </div>
  );
});

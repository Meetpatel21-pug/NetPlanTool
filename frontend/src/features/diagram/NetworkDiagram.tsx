import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ReactFlow, 
  Controls, 
  Background, 
  MiniMap, 
  applyNodeChanges, 
  applyEdgeChanges, 
  Node, 
  Edge, 
  NodeChange, 
  EdgeChange, 
  Connection, 
  MarkerType,
  NodeTypes
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { DeviceNode } from './DeviceNode';
import { fetchProjectDevices, createDevice, deleteDevice } from '../../api/devices';
import { fetchProjectLinks, createLink, deleteLink, saveDiagramLayout } from '../../api/links';
import { fetchProjectAssignments } from '../../api/assignments';
import { fetchProjectSubnets } from '../../api/subnets';
import { Device, DeviceType } from '../../types/inventory';
import { DiagramLink } from '../../types/diagram';
import { 
  Download, 
  Save, 
  Radio, 
  HardDrive, 
  Server, 
  Printer, 
  Wifi, 
  Monitor, 
  Trash2, 
  Check, 
  AlertTriangle,
  Info
} from 'lucide-react';

interface NetworkDiagramProps {
  projectId: string;
  onProjectUpdated?: () => void;
}

const nodeTypes: NodeTypes = {
  deviceNode: DeviceNode,
};

export const NetworkDiagram: React.FC<NetworkDiagramProps> = ({ projectId, onProjectUpdated }) => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [links, setLinks] = useState<DiagramLink[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Selected item for properties panel
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [selectedLink, setSelectedLink] = useState<DiagramLink | null>(null);

  // Link creation modal
  const [pendingConnection, setPendingConnection] = useState<Connection | null>(null);
  const [linkModalOpen, setLinkModalOpen] = useState<boolean>(false);
  const [linkLabel, setLinkLabel] = useState<string>('Trunk Link');
  const [linkSpeed, setLinkSpeed] = useState<string>('1 Gbps');

  // Quick Device Creation Modal
  const [addDeviceModalOpen, setAddDeviceModalOpen] = useState<boolean>(false);
  const [newDevType, setNewDevType] = useState<DeviceType>('workstation');
  const [newDevName, setNewDevName] = useState<string>('');
  const [newDevRole, setNewDevRole] = useState<string>('');

  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const loadDiagramData = async () => {
    try {
      const [devData, linkData, assignData, subData] = await Promise.all([
        fetchProjectDevices(projectId),
        fetchProjectLinks(projectId),
        fetchProjectAssignments(projectId),
        fetchProjectSubnets(projectId)
      ]);

      setDevices(devData);
      setLinks(linkData);

      // Map devices to React Flow nodes
      const flowNodes: Node[] = devData.map((d) => {
        const primaryAssign = assignData.find(a => a.device_id === d.id);
        const sub = primaryAssign ? subData.find(s => s.id === primaryAssign.subnet_id) : null;
        return {
          id: d.id,
          type: 'deviceNode',
          position: { x: d.diagram_x, y: d.diagram_y },
          data: {
            device: d,
            ip: primaryAssign ? primaryAssign.ipv4_address : null,
            subnetLabel: sub ? sub.label : null,
          },
        };
      });

      // Map links to React Flow edges
      const flowEdges: Edge[] = linkData.map((l) => ({
        id: l.id,
        source: l.source_device_id,
        target: l.target_device_id,
        label: l.label ? `${l.label} (${l.speed_note || '1 Gbps'})` : l.speed_note || '1 Gbps',
        animated: false,
        style: { stroke: '#38bdf8', strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#38bdf8',
        },
      }));

      setNodes(flowNodes);
      setEdges(flowEdges);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load network topology diagram');
    }
  };

  useEffect(() => {
    loadDiagramData();
  }, [projectId]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  // Connecting devices
  const onConnect = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target) return;
    if (connection.source === connection.target) {
      setError('Cannot connect a device to itself.');
      return;
    }
    setPendingConnection(connection);
    setLinkLabel('Uplink');
    setLinkSpeed('1 Gbps');
    setLinkModalOpen(true);
  }, []);

  const handleConfirmLink = async () => {
    if (!pendingConnection || !pendingConnection.source || !pendingConnection.target) return;
    try {
      await createLink(projectId, {
        source_device_id: pendingConnection.source,
        target_device_id: pendingConnection.target,
        label: linkLabel.trim() || undefined,
        speed_note: linkSpeed.trim() || undefined,
      });
      setLinkModalOpen(false);
      setPendingConnection(null);
      loadDiagramData();
      showToast('Link created successfully');
      if (onProjectUpdated) onProjectUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to create connection');
      setLinkModalOpen(false);
    }
  };

  // Node selection for properties panel
  const onNodeClick = (_: React.MouseEvent, node: Node) => {
    const dev = devices.find(d => d.id === node.id);
    if (dev) {
      setSelectedDevice(dev);
      setSelectedLink(null);
    }
  };

  // Edge selection for properties panel
  const onEdgeClick = (_: React.MouseEvent, edge: Edge) => {
    const l = links.find(link => link.id === edge.id);
    if (l) {
      setSelectedLink(l);
      setSelectedDevice(null);
    }
  };

  // Save layout coordinates to backend
  const handleSaveLayout = async () => {
    try {
      const positions = nodes.map(n => ({
        device_id: n.id,
        diagram_x: n.position.x,
        diagram_y: n.position.y,
      }));
      await saveDiagramLayout(projectId, positions);
      showToast('Diagram layout coordinates saved');
      if (onProjectUpdated) onProjectUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to save diagram layout');
    }
  };

  // Quick palette add
  const handleAddPaletteDevice = (type: DeviceType) => {
    setNewDevType(type);
    const count = devices.filter(d => d.device_type === type).length + 1;
    setNewDevName(`${type}-${count}`);
    setNewDevRole(type === 'router' ? 'Gateway' : type === 'switch' ? 'Distribution' : 'Host');
    setAddDeviceModalOpen(true);
  };

  const handleCreatePaletteDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDevName.trim()) return;

    try {
      const x = 120 + (devices.length % 5) * 190;
      const y = 120 + Math.floor(devices.length / 5) * 140;

      await createDevice(projectId, {
        name: newDevName.trim(),
        device_type: newDevType,
        role: newDevRole.trim() || 'Node',
        diagram_x: x,
        diagram_y: y,
      });
      setAddDeviceModalOpen(false);
      loadDiagramData();
      showToast(`Added ${newDevName} to diagram`);
      if (onProjectUpdated) onProjectUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to add device to canvas');
    }
  };

  // Delete node
  const handleDeleteSelectedDevice = async (id: string, name: string) => {
    if (window.confirm(`Delete device "${name}" and all attached diagram links?`)) {
      try {
        await deleteDevice(projectId, id);
        setSelectedDevice(null);
        loadDiagramData();
        showToast(`Deleted ${name}`);
        if (onProjectUpdated) onProjectUpdated();
      } catch (err: any) {
        setError(err.message || 'Failed to delete device');
      }
    }
  };

  // Delete link
  const handleDeleteSelectedLink = async (id: string) => {
    try {
      await deleteLink(projectId, id);
      setSelectedLink(null);
      loadDiagramData();
      showToast('Link removed');
      if (onProjectUpdated) onProjectUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to delete link');
    }
  };

  // Export PNG diagram
  const handleExportPNG = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0a0e17';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    for (let x = 0; x < canvas.width; x += 30) {
      for (let y = 0; y < canvas.height; y += 30) {
        ctx.fillRect(x, y, 1.5, 1.5);
      }
    }

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('Network Planning Toolkit — Topology Diagram', 40, 50);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px monospace';
    ctx.fillText(`Project: ${projectId} | Generated: ${new Date().toLocaleDateString()}`, 40, 75);

    nodes.forEach(n => {
      const dev = (n.data as any)?.device as Device;
      const ip = (n.data as any)?.ip;
      const x = Math.max(40, Math.min(canvas.width - 200, n.position.x + 80));
      const y = Math.max(120, Math.min(canvas.height - 100, n.position.y + 80));

      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(x, y, 160, 70, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(dev.name, x + 12, y + 25);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px sans-serif';
      ctx.fillText(`${dev.device_type} • ${dev.role}`, x + 12, y + 42);

      ctx.fillStyle = '#38bdf8';
      ctx.font = '11px monospace';
      ctx.fillText(ip || 'No IP', x + 12, y + 60);
    });

    links.forEach(l => {
      const srcNode = nodes.find(n => n.id === l.source_device_id);
      const tgtNode = nodes.find(n => n.id === l.target_device_id);
      if (srcNode && tgtNode) {
        const sx = Math.max(40, Math.min(canvas.width - 200, srcNode.position.x + 80)) + 80;
        const sy = Math.max(120, Math.min(canvas.height - 100, srcNode.position.y + 80)) + 35;
        const tx = Math.max(40, Math.min(canvas.width - 200, tgtNode.position.x + 80)) + 80;
        const ty = Math.max(120, Math.min(canvas.height - 100, tgtNode.position.y + 80)) + 35;

        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(tx, ty);
        ctx.stroke();

        const mx = (sx + tx) / 2;
        const my = (sy + ty) / 2;
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(mx - 30, my - 10, 60, 20);
        ctx.fillStyle = '#e2e8f0';
        ctx.font = '10px sans-serif';
        ctx.fillText(l.speed_note || '1 Gbps', mx - 20, my + 4);
      }
    });

    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `network-topology-diagram-${projectId}.png`;
    a.click();
    showToast('Exported diagram as PNG');
  };

  return (
    <div className="network-diagram-container">
      {/* Top Controls Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-white)' }}>
            Network Topology Diagram
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Visual planning canvas. Place devices, connect labelled links, and persist spatial layout.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleSaveLayout}
          >
            <Save className="w-4 h-4 text-cyan-400" />
            Save Layout
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleExportPNG}
          >
            <Download className="w-4 h-4 text-emerald-400" />
            Export PNG
          </button>
        </div>
      </div>

      {error && (
        <div className="notice-box error" style={{ marginBottom: '1rem' }}>
          <div className="notice-title">
            <AlertTriangle className="w-4 h-4" />
            Diagram Error
          </div>
          <div>{error}</div>
        </div>
      )}

      {/* Main Layout: Palette + Canvas + Properties Panel */}
      <div style={{ display: 'flex', gap: '1rem', height: '640px' }}>
        {/* Left Hardware Palette */}
        <div 
          className="glass-panel" 
          style={{ width: '190px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
            Device Palette
          </div>

          <button
            type="button"
            className="btn-secondary"
            style={{ justifyContent: 'flex-start', padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}
            onClick={() => handleAddPaletteDevice('router')}
          >
            <Radio className="w-4 h-4 text-cyan-400" />
            + Router
          </button>

          <button
            type="button"
            className="btn-secondary"
            style={{ justifyContent: 'flex-start', padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}
            onClick={() => handleAddPaletteDevice('switch')}
          >
            <HardDrive className="w-4 h-4 text-indigo-400" />
            + Switch
          </button>

          <button
            type="button"
            className="btn-secondary"
            style={{ justifyContent: 'flex-start', padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}
            onClick={() => handleAddPaletteDevice('server')}
          >
            <Server className="w-4 h-4 text-purple-400" />
            + Server
          </button>

          <button
            type="button"
            className="btn-secondary"
            style={{ justifyContent: 'flex-start', padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}
            onClick={() => handleAddPaletteDevice('workstation')}
          >
            <Monitor className="w-4 h-4 text-slate-300" />
            + Workstation
          </button>

          <button
            type="button"
            className="btn-secondary"
            style={{ justifyContent: 'flex-start', padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}
            onClick={() => handleAddPaletteDevice('printer')}
          >
            <Printer className="w-4 h-4 text-amber-400" />
            + Printer
          </button>

          <button
            type="button"
            className="btn-secondary"
            style={{ justifyContent: 'flex-start', padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}
            onClick={() => handleAddPaletteDevice('access_point')}
          >
            <Wifi className="w-4 h-4 text-emerald-400" />
            + Access Point
          </button>

          <div style={{ marginTop: 'auto', padding: '0.65rem', background: 'rgba(56, 189, 248, 0.05)', borderRadius: '6px', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
            <div style={{ fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: '0.2rem' }}>How to Link:</div>
            Drag from blue node handles to another device to connect them.
          </div>
        </div>

        {/* Center: React Flow Canvas */}
        <div 
          ref={reactFlowWrapper}
          className="glass-panel" 
          style={{ flex: 1, padding: '0', position: 'relative', overflow: 'hidden', background: '#080d17' }}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            onNodeDragStop={handleSaveLayout}
            fitView
          >
            <Background color="#1e293b" gap={24} size={1} />
            <Controls />
            <MiniMap 
              nodeColor="#38bdf8" 
              maskColor="rgba(10, 14, 23, 0.85)"
              style={{ background: '#0d131f', border: '1px solid var(--border-subtle)' }}
            />
          </ReactFlow>
        </div>

        {/* Right: Properties Panel */}
        <div 
          className="glass-panel" 
          style={{ width: '280px', padding: '1.25rem', overflowY: 'auto' }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '0.85rem' }}>
            Properties Panel
          </div>

          {selectedDevice ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span className="brand-tag">{selectedDevice.device_type}</span>
                <button
                  type="button"
                  className="copy-btn"
                  style={{ color: 'var(--accent-rose)' }}
                  onClick={() => handleDeleteSelectedDevice(selectedDevice.id, selectedDevice.name)}
                  title="Delete Device"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-white)' }}>
                  {selectedDevice.name}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)' }}>
                  Role: {selectedDevice.role}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.825rem' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>MAC Address</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-white)' }}>
                    {selectedDevice.mac_address || 'Unspecified'}
                  </span>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>Physical Location</span>
                  <span style={{ color: 'var(--text-white)' }}>
                    {selectedDevice.location || 'Not set'}
                  </span>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>Assigned IPv4</span>
                  {selectedDevice.assigned_ips.length > 0 ? (
                    selectedDevice.assigned_ips.map(ip => (
                      <span key={ip} style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-emerald)', display: 'block', fontWeight: 600 }}>
                        {ip}
                      </span>
                    ))
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No IP bound</span>
                  )}
                </div>

                {selectedDevice.notes && (
                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>Notes</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{selectedDevice.notes}</span>
                  </div>
                )}
              </div>
            </div>
          ) : selectedLink ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span className="brand-tag">Link Connection</span>
                <button
                  type="button"
                  className="copy-btn"
                  style={{ color: 'var(--accent-rose)' }}
                  onClick={() => handleDeleteSelectedLink(selectedLink.id)}
                  title="Delete Link"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-white)' }}>
                  {selectedLink.label || 'Link'}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)' }}>
                  Speed: {selectedLink.speed_note || '1 Gbps'}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.825rem' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>Endpoints</span>
                  <div style={{ color: 'var(--text-white)', fontWeight: 600 }}>
                    {selectedLink.source_device_name} ↔ {selectedLink.target_device_name}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem 0.5rem', color: 'var(--text-muted)' }}>
              <Info className="w-8 h-8 mx-auto mb-2 opacity-30 text-cyan-400" />
              <p style={{ fontSize: '0.825rem' }}>
                Click on any device node or connection link on the canvas to inspect and edit its properties.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create Link Modal Dialog */}
      {linkModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', background: '#0f172a', border: '1px solid var(--border-active)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-white)', marginBottom: '0.5rem' }}>
              Connect Devices
            </h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Label this network link and designate the link speed or connection media.
            </p>

            <div className="form-group">
              <label htmlFor="link-label-input" className="form-label">Link Label</label>
              <input
                id="link-label-input"
                type="text"
                className="text-input"
                placeholder="e.g. Core Uplink, Trunk, WiFi Backhaul"
                value={linkLabel}
                onChange={(e) => setLinkLabel(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="link-speed-select" className="form-label">Link Speed</label>
              <select
                id="link-speed-select"
                className="select-input"
                value={linkSpeed}
                onChange={(e) => setLinkSpeed(e.target.value)}
              >
                <option value="100 Mbps FastEthernet">100 Mbps FastEthernet</option>
                <option value="1 Gbps GigabitEthernet">1 Gbps GigabitEthernet</option>
                <option value="10 Gbps 10G SFP+">10 Gbps 10G SFP+</option>
                <option value="25 Gbps SFP28">25 Gbps SFP28</option>
                <option value="40 Gbps QSFP+">40 Gbps QSFP+</option>
                <option value="100 Gbps QSFP28">100 Gbps QSFP28</option>
                <option value="Wireless 802.11ax">Wireless 802.11ax</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setLinkModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                style={{ width: 'auto' }}
                onClick={handleConfirmLink}
              >
                Create Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Device Modal Dialog */}
      {addDeviceModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', background: '#0f172a', border: '1px solid var(--border-active)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-white)', marginBottom: '0.35rem' }}>
              Add {newDevType} to Canvas
            </h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Enter device identification to place it onto the topology diagram.
            </p>

            <form onSubmit={handleCreatePaletteDevice}>
              <div className="form-group">
                <label htmlFor="canvas-dev-name" className="form-label">Hostname / Name *</label>
                <input
                  id="canvas-dev-name"
                  type="text"
                  className="text-input"
                  value={newDevName}
                  onChange={(e) => setNewDevName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label htmlFor="canvas-dev-role" className="form-label">Functional Role</label>
                <input
                  id="canvas-dev-role"
                  type="text"
                  className="text-input"
                  value={newDevRole}
                  onChange={(e) => setNewDevRole(e.target.value)}
                  placeholder="e.g. Access Switch, Gateway, Student PC"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setAddDeviceModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ width: 'auto' }}
                >
                  Add to Canvas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Toast */}
      {toastMessage && (
        <div className="toast" role="status">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

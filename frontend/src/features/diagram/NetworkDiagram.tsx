import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ReactFlow, 
  Controls, 
  ControlButton,
  Background, 
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
import { fetchProjectDevices, createDevice, updateDevice, deleteDevice } from '../../api/devices';
import { fetchProjectLinks, createLink, deleteLink, saveDiagramLayout } from '../../api/links';
import { fetchProjectAssignments, createAssignment, updateAssignment, deleteAssignment } from '../../api/assignments';
import { fetchProjectSubnets } from '../../api/subnets';
import { Device, DeviceType, IPAssignment, AssignmentType } from '../../types/inventory';
import { Subnet } from '../../types/subnet';
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
  Info,
  MapPin,
  Zap,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { modalBackdropVariants, modalCardVariants, toastVariants } from '../../utils/motion';
import { ClaySelect } from '../../components/common/ClaySelect';

interface NetworkDiagramProps {
  projectId: string;
  onProjectUpdated?: () => void;
}

const nodeTypes: NodeTypes = {
  deviceNode: DeviceNode,
};

// Helper: Convert IPv4 to 32-bit unsigned integer
function ipToLong(ip: string): number {
  const parts = ip.trim().split('.').map(Number);
  if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) return 0;
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

// Helper: Convert 32-bit integer back to IPv4 string
function longToIp(long: number): string {
  return [
    (long >>> 24) & 255,
    (long >>> 16) & 255,
    (long >>> 8) & 255,
    long & 255,
  ].join('.');
}

// Helper: Deterministically find the first unused host IP in a subnet block
function findNextFreeIp(subnet: Subnet, claimedAssignments: IPAssignment[]): string | null {
  const claimed = new Set(claimedAssignments.map(a => a.ipv4_address.trim()));
  if (subnet.gateway) claimed.add(subnet.gateway.trim());

  let startInt = 0;
  let endInt = 0;

  if (subnet.usable_range && subnet.usable_range.includes(' - ')) {
    const [startStr, endStr] = subnet.usable_range.split(' - ').map(s => s.trim());
    startInt = ipToLong(startStr);
    endInt = ipToLong(endStr);
  } else if (subnet.cidr && subnet.cidr.includes('/')) {
    const [netStr, prefixStr] = subnet.cidr.split('/');
    const prefix = parseInt(prefixStr, 10);
    const netInt = ipToLong(netStr);
    const total = Math.pow(2, 32 - prefix);
    if (prefix >= 31) {
      startInt = netInt;
      endInt = netInt + total - 1;
    } else {
      startInt = netInt + 1;
      endInt = netInt + total - 2;
    }
  }

  if (!startInt || !endInt || startInt > endInt) return null;

  for (let current = startInt; current <= endInt; current++) {
    const candidate = longToIp(current);
    if (!claimed.has(candidate)) {
      return candidate;
    }
  }

  return null;
}

export const NetworkDiagram: React.FC<NetworkDiagramProps> = ({ projectId, onProjectUpdated }) => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [links, setLinks] = useState<DiagramLink[]>([]);
  const [assignments, setAssignments] = useState<IPAssignment[]>([]);
  const [subnets, setSubnets] = useState<Subnet[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Selected item for properties panel
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [selectedLink, setSelectedLink] = useState<DiagramLink | null>(null);

  // Editable fields for selected device in properties panel
  const [editDevName, setEditDevName] = useState<string>('');
  const [editDevRole, setEditDevRole] = useState<string>('');
  const [editDevType, setEditDevType] = useState<DeviceType>('workstation');
  const [editDevLocation, setEditDevLocation] = useState<string>('');
  const [editDevMac, setEditDevMac] = useState<string>('');
  const [editDevSubnetId, setEditDevSubnetId] = useState<string>('');
  const [editDevIp, setEditDevIp] = useState<string>('');
  const [editDevAssignType, setEditDevAssignType] = useState<AssignmentType>('planned static');
  const [savingDeviceConfig, setSavingDeviceConfig] = useState<boolean>(false);
  const [rightClickModalOpen, setRightClickModalOpen] = useState<boolean>(false);

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
  const [newDevLocation, setNewDevLocation] = useState<string>('');
  const [newDevMac, setNewDevMac] = useState<string>('');
  const [newDevSubnetId, setNewDevSubnetId] = useState<string>('');
  const [newDevIp, setNewDevIp] = useState<string>('');

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const toggleFullscreen = useCallback(async () => {
    const container = reactFlowWrapper.current;
    if (!container) return;

    const isCurrentlyFs = !!(
      document.fullscreenElement || 
      (document as any).webkitFullscreenElement || 
      isFullscreen
    );

    if (!isCurrentlyFs) {
      try {
        if (container.requestFullscreen) {
          await container.requestFullscreen();
        } else if ((container as any).webkitRequestFullscreen) {
          await (container as any).webkitRequestFullscreen();
        }
        setIsFullscreen(true);
      } catch {
        // Fallback: If browser fullscreen API is unavailable or denied
        setIsFullscreen(true);
      }
    } else {
      try {
        if (document.fullscreenElement && document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitFullscreenElement && (document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
      } catch {
        // ignore
      }
      setIsFullscreen(false);
    }
  }, [isFullscreen]);

  useEffect(() => {
    const handleFsChange = () => {
      const isFs = !!(document.fullscreenElement || (document as any).webkitFullscreenElement);
      setIsFullscreen(isFs);
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 150);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen && !document.fullscreenElement) {
        setIsFullscreen(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen]);

  const showToast = (msg: string) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToastMessage(msg);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
      toastTimerRef.current = null;
    }, 2500);
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

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
      setAssignments(assignData);
      setSubnets(subData);

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
            onOpenConfig: (targetDev: Device) => {
              handleOpenDeviceConfig(targetDev);
            },
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

  // Open Device Configuration modal (called on right-click, double-click, or gear click)
  const handleOpenDeviceConfig = useCallback((dev: Device) => {
    setSelectedDevice(dev);
    setSelectedLink(null);

    setEditDevName(dev.name || '');
    setEditDevRole(dev.role || '');
    setEditDevType(dev.device_type || 'workstation');
    setEditDevLocation(dev.location || '');
    setEditDevMac(dev.mac_address || '');

    const primaryAssign = assignments.find(a => a.device_id === dev.id);
    if (primaryAssign) {
      setEditDevSubnetId(primaryAssign.subnet_id || (subnets[0]?.id ?? ''));
      setEditDevIp(primaryAssign.ipv4_address);
      setEditDevAssignType(primaryAssign.assignment_type);
    } else {
      setEditDevSubnetId(subnets[0]?.id ?? '');
      setEditDevIp('');
      setEditDevAssignType(dev.device_type === 'router' ? 'gateway' : 'planned static');
    }

    setRightClickModalOpen(true);
  }, [assignments, subnets]);

  // Synchronize properties panel when selected device changes
  useEffect(() => {
    if (selectedDevice) {
      setEditDevName(selectedDevice.name || '');
      setEditDevRole(selectedDevice.role || '');
      setEditDevType(selectedDevice.device_type || 'workstation');
      setEditDevLocation(selectedDevice.location || '');
      setEditDevMac(selectedDevice.mac_address || '');

      const primaryAssign = assignments.find(a => a.device_id === selectedDevice.id);
      if (primaryAssign) {
        setEditDevSubnetId(primaryAssign.subnet_id || (subnets[0]?.id ?? ''));
        setEditDevIp(primaryAssign.ipv4_address);
        setEditDevAssignType(primaryAssign.assignment_type);
      } else {
        setEditDevSubnetId(subnets[0]?.id ?? '');
        setEditDevIp('');
        setEditDevAssignType(selectedDevice.device_type === 'router' ? 'gateway' : 'planned static');
      }
    }
  }, [selectedDevice, assignments, subnets]);

  // Aggressive capture-phase contextmenu blocker on diagram wrapper to permanently silence browser context menu
  useEffect(() => {
    const wrapper = reactFlowWrapper.current;
    if (!wrapper) return;
    const preventContext = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };
    wrapper.addEventListener('contextmenu', preventContext, { capture: true });
    return () => {
      wrapper.removeEventListener('contextmenu', preventContext, { capture: true });
    };
  }, []);

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

  // Right-click context handler: directly opens IP, Location & MAC Address configuration
  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    event.stopPropagation();
    const dev = (node.data as any)?.device || devices.find(d => d.id === node.id);
    if (dev) {
      handleOpenDeviceConfig(dev);
    }
  }, [devices, handleOpenDeviceConfig]);

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

  // Save device updates and network configuration
  const handleSaveDeviceConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDevice || !editDevName.trim()) return;
    setSavingDeviceConfig(true);
    setError(null);

    try {
      // 1. Update Device Metadata (Name, Role, Type, Location, MAC)
      await updateDevice(projectId, selectedDevice.id, {
        name: editDevName.trim(),
        role: editDevRole.trim() || 'Node',
        device_type: editDevType,
        location: editDevLocation.trim() || undefined,
        mac_address: editDevMac.trim() || undefined,
      });

      // 2. Handle IP Assignment
      const existingAssign = assignments.find(a => a.device_id === selectedDevice.id);
      const cleanIp = editDevIp.trim();

      if (cleanIp) {
        if (existingAssign) {
          await updateAssignment(projectId, existingAssign.id, {
            ipv4_address: cleanIp,
            subnet_id: editDevSubnetId || null,
            assignment_type: editDevAssignType,
          });
        } else {
          await createAssignment(projectId, {
            ipv4_address: cleanIp,
            subnet_id: editDevSubnetId || null,
            device_id: selectedDevice.id,
            assignment_type: editDevAssignType,
            status: 'planned',
          });
        }
      } else if (existingAssign) {
        // If user cleared the IP, remove assignment
        await deleteAssignment(projectId, existingAssign.id);
      }

      await loadDiagramData();
      showToast(`Saved configuration for ${editDevName.trim()}`);
      setRightClickModalOpen(false);
      if (onProjectUpdated) onProjectUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to update device configuration');
    } finally {
      setSavingDeviceConfig(false);
    }
  };

  // Suggest next free IP for selected device
  const handleSuggestEditIp = () => {
    const sub = subnets.find(s => s.id === editDevSubnetId) || subnets[0];
    if (!sub) {
      setError('Please create a subnet block first to assign an IP address.');
      return;
    }
    const nextFree = findNextFreeIp(sub, assignments);
    if (nextFree) {
      setEditDevIp(nextFree);
      showToast(`Next free IP: ${nextFree}`);
    } else {
      setError(`No free host addresses available in subnet ${sub.cidr}`);
    }
  };

  // Quick palette add
  const handleAddPaletteDevice = (type: DeviceType) => {
    setNewDevType(type);
    const count = devices.filter(d => d.device_type === type).length + 1;
    setNewDevName(`${type}-${count}`);
    setNewDevRole(type === 'router' ? 'Gateway' : type === 'switch' ? 'Distribution' : type === 'server' ? 'Application Server' : 'Host');
    setNewDevLocation(type === 'server' || type === 'switch' ? 'Rack 1' : '');
    setNewDevMac('');
    const defaultSub = subnets[0];
    setNewDevSubnetId(defaultSub ? defaultSub.id : '');
    setNewDevIp('');
    setAddDeviceModalOpen(true);
  };

  // Suggest next free IP for new device modal
  const handleSuggestPaletteIp = () => {
    const sub = subnets.find(s => s.id === newDevSubnetId) || subnets[0];
    if (!sub) return;
    const nextFree = findNextFreeIp(sub, assignments);
    if (nextFree) {
      setNewDevIp(nextFree);
      showToast(`Suggested free IP: ${nextFree}`);
    }
  };

  const handleCreatePaletteDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDevName.trim()) return;

    try {
      const x = 120 + (devices.length % 5) * 190;
      const y = 120 + Math.floor(devices.length / 5) * 140;

      const created = await createDevice(projectId, {
        name: newDevName.trim(),
        device_type: newDevType,
        role: newDevRole.trim() || 'Node',
        location: newDevLocation.trim() || undefined,
        mac_address: newDevMac.trim() || undefined,
        diagram_x: x,
        diagram_y: y,
      });

      if (newDevIp.trim()) {
        await createAssignment(projectId, {
          ipv4_address: newDevIp.trim(),
          subnet_id: newDevSubnetId || null,
          device_id: created.id,
          assignment_type: newDevType === 'router' ? 'gateway' : 'planned static',
          status: 'planned',
        });
      }

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

  // Export PNG diagram with dynamic bounding-box calculation
  const handleExportPNG = () => {
    if (nodes.length === 0) {
      showToast('No devices on canvas to export');
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Dynamically calculate bounding box across all nodes
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    nodes.forEach((n) => {
      if (n.position.x < minX) minX = n.position.x;
      if (n.position.x + 180 > maxX) maxX = n.position.x + 180;
      if (n.position.y < minY) minY = n.position.y;
      if (n.position.y + 85 > maxY) maxY = n.position.y + 85;
    });

    const padX = 80;
    const headerHeight = 110;
    const padBottom = 80;
    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;

    const canvasWidth = Math.max(1200, Math.ceil(contentWidth + padX * 2));
    const canvasHeight = Math.max(800, Math.ceil(contentHeight + headerHeight + padBottom));

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Soft pastel Claymorphism background
    ctx.fillStyle = '#f0e8f8';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle background grid dots
    ctx.fillStyle = 'rgba(168, 130, 220, 0.3)';
    for (let x = 0; x < canvas.width; x += 28) {
      for (let y = 0; y < canvas.height; y += 28) {
        ctx.fillRect(x, y, 1.5, 1.5);
      }
    }

    // Title banner
    ctx.fillStyle = '#2d1f4e';
    ctx.font = 'bold 22px Outfit, sans-serif';
    ctx.fillText('Network Planning Toolkit — Topology Diagram', 40, 48);

    ctx.fillStyle = '#6b5a8a';
    ctx.font = '13px monospace';
    ctx.fillText(`Project: ${projectId} | Generated: ${new Date().toLocaleDateString()}`, 40, 74);

    // Helper to translate diagram coordinates to export canvas space
    const getCoords = (nx: number, ny: number) => ({
      x: nx - minX + padX,
      y: ny - minY + headerHeight
    });

    // Draw Links
    links.forEach((l) => {
      const srcNode = nodes.find((n) => n.id === l.source_device_id);
      const tgtNode = nodes.find((n) => n.id === l.target_device_id);
      if (srcNode && tgtNode) {
        const srcPos = getCoords(srcNode.position.x, srcNode.position.y);
        const tgtPos = getCoords(tgtNode.position.x, tgtNode.position.y);
        const sx = srcPos.x + 85;
        const sy = srcPos.y + 38;
        const tx = tgtPos.x + 85;
        const ty = tgtPos.y + 38;

        ctx.strokeStyle = '#9b6dff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(tx, ty);
        ctx.stroke();

        const mx = (sx + tx) / 2;
        const my = (sy + ty) / 2;
        ctx.fillStyle = '#e4dced';
        ctx.strokeStyle = 'rgba(155, 109, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(mx - 45, my - 11, 90, 22, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#3d2e5c';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(l.speed_note || '1 Gbps', mx, my + 4);
        ctx.textAlign = 'start';
      }
    });

    // Draw Nodes
    nodes.forEach((n) => {
      const dev = (n.data as any)?.device as Device;
      const ip = (n.data as any)?.ip;
      const pos = getCoords(n.position.x, n.position.y);

      // Node shadow
      ctx.shadowColor = 'rgba(166, 152, 190, 0.4)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 4;
      ctx.shadowOffsetY = 4;

      // Node background
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = 'rgba(168, 130, 220, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(pos.x, pos.y, 170, 76, 12);
      ctx.fill();
      ctx.stroke();

      // Reset shadow
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // Device name
      ctx.fillStyle = '#2d1f4e';
      ctx.font = 'bold 13px Outfit, sans-serif';
      ctx.fillText(dev.name, pos.x + 14, pos.y + 24);

      // Device type & role
      ctx.fillStyle = '#6b5a8a';
      ctx.font = '11px sans-serif';
      ctx.fillText(`${dev.device_type} • ${dev.role}`, pos.x + 14, pos.y + 42);

      // IP Address
      ctx.fillStyle = ip ? '#7c5cbf' : '#9585ad';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(ip || 'No IP bound', pos.x + 14, pos.y + 62);
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
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen (Esc)" : "Fullscreen Canvas"}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-4 h-4 text-purple-400" />
                Exit Fullscreen
              </>
            ) : (
              <>
                <Maximize2 className="w-4 h-4 text-indigo-400" />
                Fullscreen Canvas
              </>
            )}
          </button>
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
      <div className="diagram-workspace-layout" style={{ display: 'flex', gap: '1rem', height: '640px' }}>
        {/* Left Hardware Palette */}
        <div 
          className="glass-panel diagram-palette" 
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
          className={`react-flow-clay-canvas diagram-canvas-box ${isFullscreen ? 'is-fullscreen' : ''}`} 
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          style={{ 
            flex: 1, 
            padding: '0', 
            position: isFullscreen ? 'fixed' : 'relative', 
            top: isFullscreen ? 0 : undefined,
            left: isFullscreen ? 0 : undefined,
            width: isFullscreen ? '100vw' : '100%',
            height: isFullscreen ? '100vh' : '100%',
            minHeight: isFullscreen ? '100vh' : '520px',
            zIndex: isFullscreen ? 99999 : undefined,
            overflow: 'hidden',
            borderRadius: isFullscreen ? '0' : undefined
          }}
        >
          {isFullscreen && (
            <button
              type="button"
              onClick={toggleFullscreen}
              className="btn-clay-secondary"
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                zIndex: 1000,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.55rem 1.1rem',
                fontSize: '0.825rem',
                fontWeight: 600,
                borderRadius: '999px',
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(8px)',
                boxShadow: 'var(--clay-shadow-md)',
                cursor: 'pointer',
                color: '#2d1f4e',
                border: '1.5px solid rgba(139, 92, 246, 0.3)'
              }}
              title="Exit Fullscreen (Esc)"
            >
              <Minimize2 className="w-4 h-4 text-purple-600" />
              <span>Exit Fullscreen</span>
            </button>
          )}

          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onNodeContextMenu={onNodeContextMenu}
            onPaneContextMenu={(e) => e.preventDefault()}
            onEdgeClick={onEdgeClick}
            onNodeDragStop={handleSaveLayout}
            fitView
            style={{ width: '100%', height: '100%', minHeight: isFullscreen ? '100vh' : '520px' }}
          >
            <Background color="rgba(168, 130, 220, 0.25)" gap={24} size={1.5} />
            <Controls onFitView={toggleFullscreen}>
              <ControlButton 
                onClick={toggleFullscreen} 
                title={isFullscreen ? "Exit Fullscreen (Esc)" : "Open Canvas in Fullscreen"} 
                aria-label="Toggle Fullscreen"
              >
                {isFullscreen ? (
                  <Minimize2 className="w-3.5 h-3.5 text-purple-600" />
                ) : (
                  <Maximize2 className="w-3.5 h-3.5 text-indigo-600" />
                )}
              </ControlButton>
            </Controls>
          </ReactFlow>
        </div>

        {/* Right: Properties Panel */}
        <div 
          className="glass-panel diagram-props-panel" 
          style={{ width: '310px', padding: '1.25rem', overflowY: 'auto' }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '0.85rem' }}>
            Properties Panel
          </div>

          {selectedDevice ? (
            <form onSubmit={handleSaveDeviceConfig}>
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

              {/* Hostname */}
              <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                <label className="form-label" style={{ fontSize: '0.72rem' }}>Hostname / Name *</label>
                <input
                  type="text"
                  className="text-input"
                  style={{ padding: '0.4rem 0.6rem', fontSize: '0.825rem' }}
                  value={editDevName}
                  onChange={(e) => setEditDevName(e.target.value)}
                  required
                />
              </div>

              {/* Role & Type */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.72rem' }}>Role</label>
                  <input
                    type="text"
                    className="text-input"
                    style={{ padding: '0.4rem 0.6rem', fontSize: '0.825rem' }}
                    value={editDevRole}
                    onChange={(e) => setEditDevRole(e.target.value)}
                    placeholder="Role"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.72rem' }}>Type</label>
                  <ClaySelect
                    variant="form"
                    ariaLabel="Device Type"
                    value={editDevType}
                    onChange={(val) => setEditDevType(val as DeviceType)}
                    options={[
                      { value: 'router', label: 'Router' },
                      { value: 'switch', label: 'Switch' },
                      { value: 'server', label: 'Server' },
                      { value: 'workstation', label: 'Workstation' },
                      { value: 'printer', label: 'Printer' },
                      { value: 'access_point', label: 'Access Point' },
                    ]}
                  />
                </div>
              </div>

              {/* Location & MAC */}
              <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                <label className="form-label" style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                  Physical Location
                </label>
                <input
                  type="text"
                  className="text-input"
                  style={{ padding: '0.4rem 0.6rem', fontSize: '0.825rem' }}
                  value={editDevLocation}
                  onChange={(e) => setEditDevLocation(e.target.value)}
                  placeholder="e.g. Server Room Rack 2"
                />
              </div>

              <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                <label className="form-label" style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
                  MAC Address
                </label>
                <input
                  type="text"
                  className="text-input"
                  style={{ padding: '0.4rem 0.6rem', fontSize: '0.825rem', fontFamily: 'var(--font-mono)' }}
                  value={editDevMac}
                  onChange={(e) => setEditDevMac(e.target.value)}
                  placeholder="00:1A:2B:3C:4D:5E"
                />
              </div>

              {/* IPv4 Network Assignment */}
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-active)', borderRadius: 'var(--radius-sm)', padding: '0.65rem', marginBottom: '0.85rem' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase', marginBottom: '0.4rem', letterSpacing: '0.05em' }}>
                  IPv4 Assignment
                </div>

                {subnets.length > 0 ? (
                  <>
                    <div className="form-group" style={{ marginBottom: '0.45rem' }}>
                      <label className="form-label" style={{ fontSize: '0.7rem' }}>Subnet Block</label>
                      <ClaySelect
                        variant="form"
                        ariaLabel="Select Subnet"
                        value={editDevSubnetId}
                        onChange={(val) => setEditDevSubnetId(val)}
                        options={subnets.map(s => ({
                          value: s.id,
                          label: `${s.cidr} (${s.label || 'Subnet'})`
                        }))}
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: '0.45rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                        <label className="form-label" style={{ fontSize: '0.7rem', margin: 0 }}>IPv4 Address</label>
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{ padding: '0.15rem 0.45rem', fontSize: '0.68rem', gap: '0.25rem' }}
                          onClick={handleSuggestEditIp}
                          title="Calculate next free IP in this subnet"
                        >
                          <Zap className="w-3 h-3 text-amber-400" />
                          Next Free
                        </button>
                      </div>
                      <input
                        type="text"
                        className="text-input"
                        style={{ padding: '0.4rem 0.6rem', fontSize: '0.825rem', fontFamily: 'var(--font-mono)' }}
                        value={editDevIp}
                        onChange={(e) => setEditDevIp(e.target.value)}
                        placeholder="e.g. 192.168.1.10 (or blank to clear)"
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: '0.25rem' }}>
                      <label className="form-label" style={{ fontSize: '0.7rem' }}>Assignment Type</label>
                      <ClaySelect
                        variant="form"
                        ariaLabel="Assignment Type"
                        value={editDevAssignType}
                        onChange={(val) => setEditDevAssignType(val as AssignmentType)}
                        options={[
                          { value: 'planned static', label: 'Planned Static' },
                          { value: 'active dynamic', label: 'Active Dynamic' },
                          { value: 'dhcp reserved', label: 'DHCP Reserved' },
                          { value: 'gateway', label: 'Default Gateway' },
                        ]}
                      />
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    No subnets in project. Add a subnet in Subnet Planner first to assign IP.
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="btn-primary"
                style={{ width: '100%', padding: '0.55rem', fontSize: '0.85rem' }}
                disabled={savingDeviceConfig}
              >
                <Save className="w-4 h-4" />
                {savingDeviceConfig ? 'Saving...' : 'Save Configuration'}
              </button>
            </form>
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
                <div style={{ fontSize: '0.8rem', color: 'var(--accent-indigo)' }}>
                  Speed: {selectedLink.speed_note || '1 Gbps'}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.825rem' }}>
                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-active)', boxShadow: 'var(--clay-shadow-sm)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>Endpoints</span>
                  <div style={{ color: 'var(--text-white)', fontWeight: 600 }}>
                    {selectedLink.source_device_name} ↔ {selectedLink.target_device_name}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem 0.5rem', color: 'var(--text-muted)' }}>
              <Info className="w-8 h-8 mx-auto mb-2 opacity-30 text-indigo-400" />
              <p style={{ fontSize: '0.825rem' }}>
                Click on any device node or connection link on the canvas to configure IP, location, and MAC address.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create Link Modal Dialog */}
      <AnimatePresence>
        {linkModalOpen && (
          <motion.div 
            className="clay-modal-overlay"
            variants={modalBackdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={() => setLinkModalOpen(false)}
          >
            <motion.div 
              className="clay-modal-card" 
              variants={modalCardVariants}
              onClick={(e) => e.stopPropagation()}
              style={{ width: '100%', maxWidth: '420px' }}
            >
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-white)', marginBottom: '0.5rem' }}>
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
                <ClaySelect
                  id="link-speed-select"
                  variant="form"
                  ariaLabel="Link Speed"
                  value={linkSpeed}
                  onChange={setLinkSpeed}
                  options={[
                    { value: '100 Mbps FastEthernet', label: '100 Mbps FastEthernet' },
                    { value: '1 Gbps GigabitEthernet', label: '1 Gbps GigabitEthernet' },
                    { value: '10 Gbps 10G SFP+', label: '10 Gbps 10G SFP+' },
                    { value: '25 Gbps SFP28', label: '25 Gbps SFP28' },
                    { value: '40 Gbps QSFP+', label: '40 Gbps QSFP+' },
                    { value: '100 Gbps QSFP28', label: '100 Gbps QSFP28' },
                    { value: 'Wireless 802.11ax', label: 'Wireless 802.11ax' }
                  ]}
                />
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Device Modal Dialog */}
      <AnimatePresence>
        {addDeviceModalOpen && (
          <motion.div 
            className="clay-modal-overlay"
            variants={modalBackdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={() => setAddDeviceModalOpen(false)}
          >
            <motion.div 
              className="clay-modal-card" 
              variants={modalCardVariants}
              onClick={(e) => e.stopPropagation()}
              style={{ width: '100%', maxWidth: '440px' }}
            >
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-white)', marginBottom: '0.35rem' }}>
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label htmlFor="canvas-dev-loc" className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                      Location
                    </label>
                    <input
                      id="canvas-dev-loc"
                      type="text"
                      className="text-input"
                      value={newDevLocation}
                      onChange={(e) => setNewDevLocation(e.target.value)}
                      placeholder="e.g. Rack 1, Floor 2"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="canvas-dev-mac" className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
                      MAC Address
                    </label>
                    <input
                      id="canvas-dev-mac"
                      type="text"
                      className="text-input"
                      style={{ fontFamily: 'var(--font-mono)' }}
                      value={newDevMac}
                      onChange={(e) => setNewDevMac(e.target.value)}
                      placeholder="00:1A:2B:3C:4D:5E"
                    />
                  </div>
                </div>

                {subnets.length > 0 && (
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-active)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                      Initial IP Allocation (Optional)
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.7rem' }}>Subnet</label>
                        <ClaySelect
                          variant="form"
                          ariaLabel="Select Subnet"
                          value={newDevSubnetId}
                          onChange={(val) => setNewDevSubnetId(val)}
                          options={subnets.map(s => ({
                            value: s.id,
                            label: `${s.cidr} (${s.label || 'Subnet'})`
                          }))}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                          <label className="form-label" style={{ fontSize: '0.7rem', margin: 0 }}>IPv4</label>
                          <button
                            type="button"
                            className="btn-secondary"
                            style={{ padding: '0.1rem 0.4rem', fontSize: '0.65rem', gap: '0.2rem' }}
                            onClick={handleSuggestPaletteIp}
                          >
                            <Zap className="w-3 h-3 text-amber-400" />
                            Next Free
                          </button>
                        </div>
                        <input
                          type="text"
                          className="text-input"
                          style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}
                          value={newDevIp}
                          onChange={(e) => setNewDevIp(e.target.value)}
                          placeholder="e.g. 192.168.1.10"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right Click Device Configuration Modal */}
      <AnimatePresence>
        {rightClickModalOpen && selectedDevice && (
          <motion.div 
            className="clay-modal-overlay"
            variants={modalBackdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={() => setRightClickModalOpen(false)}
          >
            <motion.div 
              className="clay-modal-card" 
              variants={modalCardVariants}
              onClick={(e) => e.stopPropagation()}
              style={{ width: '100%', maxWidth: '480px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="brand-tag">{selectedDevice.device_type}</span>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-white)' }}>
                    Configure {selectedDevice.name}
                  </h3>
                </div>
                <button
                  type="button"
                  className="copy-btn"
                  style={{ color: 'var(--accent-rose)' }}
                  onClick={() => {
                    setRightClickModalOpen(false);
                    handleDeleteSelectedDevice(selectedDevice.id, selectedDevice.name);
                  }}
                  title="Delete Device"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                Set IPv4 address, physical location, and hardware MAC address for this network node.
              </p>

              <form onSubmit={handleSaveDeviceConfig}>
                {/* Hostname & Type */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Hostname / Device Name *</label>
                    <input
                      type="text"
                      className="text-input"
                      value={editDevName}
                      onChange={(e) => setEditDevName(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Device Type</label>
                    <ClaySelect
                      variant="form"
                      ariaLabel="Device Type"
                      value={editDevType}
                      onChange={(val) => setEditDevType(val as DeviceType)}
                      options={[
                        { value: 'router', label: 'Router' },
                        { value: 'switch', label: 'Switch' },
                        { value: 'server', label: 'Server' },
                        { value: 'workstation', label: 'Workstation' },
                        { value: 'printer', label: 'Printer' },
                        { value: 'access_point', label: 'Access Point' },
                      ]}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                  <label className="form-label">Functional Role</label>
                  <input
                    type="text"
                    className="text-input"
                    value={editDevRole}
                    onChange={(e) => setEditDevRole(e.target.value)}
                    placeholder="e.g. Core Gateway, Distribution Switch"
                  />
                </div>

                {/* Location & MAC Address */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                      Physical Location
                    </label>
                    <input
                      type="text"
                      className="text-input"
                      value={editDevLocation}
                      onChange={(e) => setEditDevLocation(e.target.value)}
                      placeholder="e.g. Server Room Rack 2, U12"
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
                      MAC Address
                    </label>
                    <input
                      type="text"
                      className="text-input"
                      style={{ fontFamily: 'var(--font-mono)' }}
                      value={editDevMac}
                      onChange={(e) => setEditDevMac(e.target.value)}
                      placeholder="00:1A:2B:3C:4D:5E"
                    />
                  </div>
                </div>

                {/* IPv4 Network Assignment */}
                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-active)', borderRadius: 'var(--radius-sm)', padding: '0.85rem', marginTop: '0.85rem', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
                    IPv4 Address Assignment
                  </div>

                  {subnets.length > 0 ? (
                    <>
                      <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                        <label className="form-label" style={{ fontSize: '0.72rem' }}>Subnet Block</label>
                        <ClaySelect
                          variant="form"
                          ariaLabel="Select Subnet"
                          value={editDevSubnetId}
                          onChange={(val) => setEditDevSubnetId(val)}
                          options={subnets.map(s => ({
                            value: s.id,
                            label: `${s.cidr} (${s.label || 'Subnet'})`
                          }))}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.75rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                            <label className="form-label" style={{ fontSize: '0.72rem', margin: 0 }}>IPv4 Address</label>
                            <button
                              type="button"
                              className="btn-secondary"
                              style={{ padding: '0.15rem 0.45rem', fontSize: '0.68rem', gap: '0.25rem' }}
                              onClick={handleSuggestEditIp}
                              title="Calculate next free IP in this subnet"
                            >
                              <Zap className="w-3 h-3 text-amber-400" />
                              Next Free
                            </button>
                          </div>
                          <input
                            type="text"
                            className="text-input"
                            style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
                            value={editDevIp}
                            onChange={(e) => setEditDevIp(e.target.value)}
                            placeholder="e.g. 192.168.1.10"
                          />
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.72rem' }}>Assignment Type</label>
                          <ClaySelect
                            variant="form"
                            ariaLabel="Assignment Type"
                            value={editDevAssignType}
                            onChange={(val) => setEditDevAssignType(val as AssignmentType)}
                            options={[
                              { value: 'planned static', label: 'Planned Static' },
                              { value: 'active dynamic', label: 'Active Dynamic' },
                              { value: 'dhcp reserved', label: 'DHCP Reserved' },
                              { value: 'gateway', label: 'Default Gateway' },
                            ]}
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                      No subnets allocated in project yet. Create a subnet block first to assign an IP.
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setRightClickModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    style={{ width: 'auto' }}
                    disabled={savingDeviceConfig}
                  >
                    <Save className="w-4 h-4" />
                    {savingDeviceConfig ? 'Saving...' : 'Save Configuration'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            className="toast" 
            role="status"
            variants={toastVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { fetchProjectAssignments, createAssignment, updateAssignment, deleteAssignment } from '../../api/assignments';
import { fetchProjectDevices, createDevice, deleteDevice } from '../../api/devices';
import { fetchProjectSubnets } from '../../api/subnets';
import { IPAssignment, Device, AssignmentType, AssignmentStatus, DeviceType } from '../../types/inventory';
import { Subnet } from '../../types/subnet';
import { 
  Server, 
  Plus, 
  Search, 
  Copy, 
  Check, 
  Trash2, 
  Edit3, 
  ShieldAlert, 
  AlertTriangle,
  Monitor,
  HardDrive,
  Printer,
  Wifi,
  Radio,
  X
} from 'lucide-react';

interface IPInventoryProps {
  projectId: string;
  onProjectUpdated?: () => void;
}

export const IPInventory: React.FC<IPInventoryProps> = ({ projectId, onProjectUpdated }) => {
  const [assignments, setAssignments] = useState<IPAssignment[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [subnets, setSubnets] = useState<Subnet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedIp, setCopiedIp] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSubnet, setSelectedSubnet] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');

  // Modals
  const [showAssignModal, setShowAssignModal] = useState<boolean>(false);
  const [isEditingAssign, setIsEditingAssign] = useState<boolean>(false);
  const [editingAssignId, setEditingAssignId] = useState<string | null>(null);
  
  // Assignment Form Fields
  const [ipAddress, setIpAddress] = useState<string>('');
  const [assignSubnetId, setAssignSubnetId] = useState<string>('');
  const [assignDeviceId, setAssignDeviceId] = useState<string>('');
  const [assignType, setAssignType] = useState<AssignmentType>('planned static');
  const [assignStatus, setAssignStatus] = useState<AssignmentStatus>('planned');
  const [assignNotes, setAssignNotes] = useState<string>('');
  const [assignFormError, setAssignFormError] = useState<string | null>(null);
  const [assignSubmitting, setAssignSubmitting] = useState<boolean>(false);

  // Device Management Modal
  const [showDeviceDrawer, setShowDeviceDrawer] = useState<boolean>(false);
  const [devName, setDevName] = useState<string>('');
  const [devType, setDevType] = useState<DeviceType>('workstation');
  const [devRole, setDevRole] = useState<string>('');
  const [devMac, setDevMac] = useState<string>('');
  const [devLocation, setDevLocation] = useState<string>('');
  const [devNotes, setDevNotes] = useState<string>('');
  const [devFormError, setDevFormError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [assignData, deviceData, subnetData] = await Promise.all([
        fetchProjectAssignments(projectId),
        fetchProjectDevices(projectId),
        fetchProjectSubnets(projectId)
      ]);
      setAssignments(assignData);
      setDevices(deviceData);
      setSubnets(subnetData);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load IP inventory data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [projectId]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIp(text);
    setTimeout(() => setCopiedIp(null), 1500);
  };

  const openCreateAssignModal = (prefillSubnetId: string = '') => {
    setIsEditingAssign(false);
    setEditingAssignId(null);
    setIpAddress('');
    setAssignSubnetId(prefillSubnetId || (subnets.length > 0 ? subnets[0].id : ''));
    setAssignDeviceId('');
    setAssignType('planned static');
    setAssignStatus('planned');
    setAssignNotes('');
    setAssignFormError(null);
    setShowAssignModal(true);
  };

  const openEditAssignModal = (a: IPAssignment) => {
    setIsEditingAssign(true);
    setEditingAssignId(a.id);
    setIpAddress(a.ipv4_address);
    setAssignSubnetId(a.subnet_id || '');
    setAssignDeviceId(a.device_id || '');
    setAssignType(a.assignment_type);
    setAssignStatus(a.status);
    setAssignNotes(a.notes || '');
    setAssignFormError(null);
    setShowAssignModal(true);
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ipAddress.trim()) return;

    setAssignSubmitting(true);
    setAssignFormError(null);

    const payload = {
      ipv4_address: ipAddress.trim(),
      subnet_id: assignSubnetId || null,
      device_id: assignDeviceId || null,
      assignment_type: assignType,
      status: assignStatus,
      notes: assignNotes.trim() || undefined,
    };

    try {
      if (isEditingAssign && editingAssignId) {
        await updateAssignment(projectId, editingAssignId, payload);
      } else {
        await createAssignment(projectId, payload);
      }
      setShowAssignModal(false);
      loadData();
      if (onProjectUpdated) onProjectUpdated();
    } catch (err: any) {
      setAssignFormError(err.message || 'Assignment operation failed');
    } finally {
      setAssignSubmitting(false);
    }
  };

  const handleDeleteAssign = async (id: string, ip: string) => {
    if (window.confirm(`Delete IP assignment for ${ip}?`)) {
      try {
        await deleteAssignment(projectId, id);
        loadData();
        if (onProjectUpdated) onProjectUpdated();
      } catch (err: any) {
        setError(err.message || 'Failed to delete assignment');
      }
    }
  };

  const handleDeviceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!devName.trim() || !devRole.trim()) return;

    setDevFormError(null);
    try {
      await createDevice(projectId, {
        name: devName.trim(),
        device_type: devType,
        role: devRole.trim(),
        mac_address: devMac.trim() || undefined,
        location: devLocation.trim() || undefined,
        notes: devNotes.trim() || undefined,
      });
      setDevName('');
      setDevRole('');
      setDevMac('');
      setDevLocation('');
      setDevNotes('');
      loadData();
      if (onProjectUpdated) onProjectUpdated();
    } catch (err: any) {
      setDevFormError(err.message || 'Failed to add device');
    }
  };

  const handleDeleteDevice = async (deviceId: string, name: string) => {
    if (window.confirm(`Delete device "${name}"? Existing IP assignments will be preserved as unattached.`)) {
      try {
        await deleteDevice(projectId, deviceId);
        loadData();
        if (onProjectUpdated) onProjectUpdated();
      } catch (err: any) {
        setError(err.message || 'Failed to delete device');
      }
    }
  };

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

  const getTypeBadgeClass = (type: AssignmentType) => {
    switch (type) {
      case 'gateway': return 'brand-tag text-emerald-400 border-emerald-400/30 bg-emerald-400/10';
      case 'DHCP pool': return 'brand-tag text-purple-400 border-purple-400/30 bg-purple-400/10';
      case 'reserved': return 'brand-tag text-amber-400 border-amber-400/30 bg-amber-400/10';
      default: return 'brand-tag text-cyan-400 border-cyan-400/30 bg-cyan-400/10';
    }
  };

  const getStatusBadgeStyle = (status: AssignmentStatus) => {
    switch (status) {
      case 'active': return { color: 'var(--accent-emerald)', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)' };
      case 'deprecated': return { color: 'var(--accent-rose)', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.25)' };
      case 'reserved': return { color: 'var(--accent-amber)', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)' };
      default: return { color: 'var(--accent-cyan)', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.25)' };
    }
  };

  // Distinct roles for filter
  const distinctRoles = Array.from(new Set(devices.map(d => d.role).filter(Boolean)));

  // Filtered assignments
  const filteredAssignments = assignments.filter((a) => {
    const matchesSearch = 
      a.ipv4_address.includes(searchQuery) ||
      (a.device_name && a.device_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (a.device_role && a.device_role.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (a.notes && a.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesSubnet = selectedSubnet === 'all' || a.subnet_id === selectedSubnet;
    const matchesStatus = selectedStatus === 'all' || a.status === selectedStatus;
    const matchesType = selectedType === 'all' || a.assignment_type === selectedType;
    const matchesRole = selectedRole === 'all' || (a.device_role && a.device_role === selectedRole);

    return matchesSearch && matchesSubnet && matchesStatus && matchesType && matchesRole;
  });

  return (
    <div className="ip-inventory-container">
      {/* Top Header & Action Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-white)' }}>
            IP Address Inventory & Devices
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Track planned host assignments, gateways, and reservations with duplicate and DHCP collision prevention.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setShowDeviceDrawer(true)}
          >
            <Server className="w-4 h-4 text-indigo-400" />
            Devices ({devices.length})
          </button>
          <button
            id="assign-ip-btn"
            type="button"
            className="btn-primary"
            style={{ width: 'auto' }}
            onClick={() => openCreateAssignModal()}
          >
            <Plus className="w-4 h-4" />
            Assign IPv4 Address
          </button>
        </div>
      </div>

      {error && (
        <div className="notice-box error" style={{ marginBottom: '1.5rem' }}>
          <div className="notice-title">
            <ShieldAlert className="w-4 h-4" />
            Inventory Error
          </div>
          <div>{error}</div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="glass-panel" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search className="w-3.5 h-3.5" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="text-input"
              style={{ paddingLeft: '2.25rem', fontSize: '0.825rem', padding: '0.5rem 0.75rem 0.5rem 2.25rem' }}
              placeholder="Filter by IP, device..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Subnet Filter */}
          <div>
            <select
              aria-label="Filter by Subnet"
              className="select-input"
              style={{ fontSize: '0.825rem', padding: '0.5rem 0.75rem' }}
              value={selectedSubnet}
              onChange={(e) => setSelectedSubnet(e.target.value)}
            >
              <option value="all">All Subnets ({subnets.length})</option>
              {subnets.map(s => (
                <option key={s.id} value={s.id}>{s.label} ({s.cidr})</option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <select
              aria-label="Filter by Type"
              className="select-input"
              style={{ fontSize: '0.825rem', padding: '0.5rem 0.75rem' }}
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="all">All Assignment Types</option>
              <option value="planned static">Planned Static</option>
              <option value="reserved">Reserved</option>
              <option value="DHCP pool">DHCP Pool</option>
              <option value="gateway">Gateway</option>
              <option value="unassigned">Unassigned</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              aria-label="Filter by Status"
              className="select-input"
              style={{ fontSize: '0.825rem', padding: '0.5rem 0.75rem' }}
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="planned">Planned</option>
              <option value="active">Active</option>
              <option value="reserved">Reserved</option>
              <option value="deprecated">Deprecated</option>
            </select>
          </div>

          {/* Role Filter */}
          {distinctRoles.length > 0 && (
            <div>
              <select
                aria-label="Filter by Role"
                className="select-input"
                style={{ fontSize: '0.825rem', padding: '0.5rem 0.75rem' }}
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
              >
                <option value="all">All Roles</option>
                {distinctRoles.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Main Inventory Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
          Loading inventory records...
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '3.5rem 2rem' }}>
          <Server className="w-12 h-12 mx-auto mb-3 opacity-30 text-cyan-400" />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-white)', marginBottom: '0.4rem' }}>
            {searchQuery || selectedSubnet !== 'all' ? 'No matching IP assignments found' : 'No IP addresses assigned yet'}
          </h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '460px', margin: '0 auto 1.5rem auto', fontSize: '0.875rem' }}>
            {searchQuery || selectedSubnet !== 'all'
              ? 'Try resetting your search filters.'
              : 'Add planned static IPs, reserved slots, or gateways attached to your allocated subnets.'}
          </p>
          {!searchQuery && selectedSubnet === 'all' && (
            <button
              type="button"
              className="btn-primary"
              style={{ width: 'auto', margin: '0 auto' }}
              onClick={() => openCreateAssignModal()}
            >
              <Plus className="w-4 h-4" />
              Assign First IP
            </button>
          )}
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: 'rgba(0, 0, 0, 0.4)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.875rem 1.25rem', fontWeight: 600 }}>IPv4 Address</th>
                  <th style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>Type</th>
                  <th style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>Subnet</th>
                  <th style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>Assigned Device</th>
                  <th style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>Notes</th>
                  <th style={{ padding: '0.875rem 1.25rem', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssignments.map((a) => {
                  const assignedDevice = devices.find(d => d.id === a.device_id);
                  return (
                    <tr 
                      key={a.id}
                      style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 150ms ease' }}
                    >
                      {/* IPv4 + Copy */}
                      <td style={{ padding: '0.875rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-white)' }}>
                            {a.ipv4_address}
                          </span>
                          <button
                            type="button"
                            className="copy-btn"
                            onClick={() => copyToClipboard(a.ipv4_address)}
                            title="Copy IP Address"
                          >
                            {copiedIp === a.ipv4_address ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </td>

                      {/* Type Badge */}
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <span className={getTypeBadgeClass(a.assignment_type)} style={{ textTransform: 'capitalize' }}>
                          {a.assignment_type}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <span 
                          style={{
                            fontSize: '0.725rem',
                            fontWeight: 600,
                            padding: '0.2rem 0.5rem',
                            borderRadius: '9999px',
                            textTransform: 'uppercase',
                            ...getStatusBadgeStyle(a.status)
                          }}
                        >
                          {a.status}
                        </span>
                      </td>

                      {/* Subnet */}
                      <td style={{ padding: '0.875rem 1rem' }}>
                        {a.subnet_label ? (
                          <div>
                            <div style={{ color: 'var(--text-white)', fontWeight: 500 }}>{a.subnet_label}</div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>
                              {a.subnet_cidr}
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>Unassociated</span>
                        )}
                      </td>

                      {/* Device */}
                      <td style={{ padding: '0.875rem 1rem' }}>
                        {assignedDevice ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {getDeviceIcon(assignedDevice.device_type)}
                            <div>
                              <div style={{ color: 'var(--text-white)', fontWeight: 600 }}>{assignedDevice.name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{assignedDevice.role}</div>
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>

                      {/* Notes */}
                      <td style={{ padding: '0.875rem 1rem', color: 'var(--text-secondary)', fontSize: '0.8rem', maxWidth: '200px' }}>
                        {a.notes || '—'}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '0.875rem 1.25rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                          <button
                            type="button"
                            className="btn-secondary"
                            style={{ padding: '0.3rem 0.5rem', fontSize: '0.725rem' }}
                            onClick={() => openEditAssignModal(a)}
                            title="Edit Assignment"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            className="btn-secondary"
                            style={{ padding: '0.3rem 0.5rem', fontSize: '0.725rem', color: 'var(--accent-rose)' }}
                            onClick={() => handleDeleteAssign(a.id, a.ipv4_address)}
                            title="Delete Assignment"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Assignment Create / Edit Modal */}
      {showAssignModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '520px', background: '#0f172a', border: '1px solid var(--border-active)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-white)', marginBottom: '0.25rem' }}>
              {isEditingAssign ? 'Edit IP Assignment' : 'Assign IPv4 Address'}
            </h2>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Assign an IPv4 address to a network segment and device. Duplicates and DHCP collisions are blocked.
            </p>

            {assignFormError && (
              <div className="notice-box error" style={{ marginBottom: '1.25rem' }} role="alert">
                <div className="notice-title">
                  <AlertTriangle className="w-4 h-4" />
                  Validation Conflict
                </div>
                <div>{assignFormError}</div>
              </div>
            )}

            <form onSubmit={handleAssignSubmit}>
              <div className="form-group">
                <label htmlFor="assign-ip-input" className="form-label">IPv4 Address *</label>
                <input
                  id="assign-ip-input"
                  type="text"
                  className="text-input"
                  placeholder="e.g. 192.168.20.15"
                  value={ipAddress}
                  onChange={(e) => setIpAddress(e.target.value)}
                  required
                />
              </div>

              <div className="input-row">
                <div style={{ flex: 1 }}>
                  <label htmlFor="assign-subnet-select" className="form-label">Subnet</label>
                  <select
                    id="assign-subnet-select"
                    className="select-input"
                    value={assignSubnetId}
                    onChange={(e) => setAssignSubnetId(e.target.value)}
                  >
                    <option value="">Unassigned to Subnet</option>
                    {subnets.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.label} ({s.cidr})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ flex: 1 }}>
                  <label htmlFor="assign-device-select" className="form-label">Attached Device</label>
                  <select
                    id="assign-device-select"
                    className="select-input"
                    value={assignDeviceId}
                    onChange={(e) => setAssignDeviceId(e.target.value)}
                  >
                    <option value="">No Device (Standalone IP)</option>
                    {devices.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="input-row" style={{ marginTop: '0.75rem' }}>
                <div style={{ flex: 1 }}>
                  <label htmlFor="assign-type-select" className="form-label">Assignment Type</label>
                  <select
                    id="assign-type-select"
                    className="select-input"
                    value={assignType}
                    onChange={(e) => setAssignType(e.target.value as AssignmentType)}
                  >
                    <option value="planned static">Planned Static</option>
                    <option value="reserved">Reserved</option>
                    <option value="DHCP pool">DHCP Pool</option>
                    <option value="gateway">Gateway</option>
                    <option value="unassigned">Unassigned</option>
                  </select>
                </div>

                <div style={{ flex: 1 }}>
                  <label htmlFor="assign-status-select" className="form-label">Status</label>
                  <select
                    id="assign-status-select"
                    className="select-input"
                    value={assignStatus}
                    onChange={(e) => setAssignStatus(e.target.value as AssignmentStatus)}
                  >
                    <option value="planned">Planned</option>
                    <option value="active">Active</option>
                    <option value="reserved">Reserved</option>
                    <option value="deprecated">Deprecated</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '0.75rem' }}>
                <label htmlFor="assign-notes-input" className="form-label">Notes</label>
                <textarea
                  id="assign-notes-input"
                  className="text-input"
                  style={{ minHeight: '60px', resize: 'vertical' }}
                  placeholder="e.g. Primary interface for student lab gateway."
                  value={assignNotes}
                  onChange={(e) => setAssignNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowAssignModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ width: 'auto' }}
                  disabled={assignSubmitting}
                >
                  {assignSubmitting ? 'Checking & Saving...' : isEditingAssign ? 'Save Changes' : 'Assign IP'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Device Management Drawer */}
      {showDeviceDrawer && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'flex-end', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '540px', height: '100%', borderRadius: 0, background: '#0a0e17', borderLeft: '1px solid var(--border-active)', overflowY: 'auto', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div className="card-title">
                <Server className="w-5 h-5 text-cyan-400" />
                Project Devices ({devices.length})
              </div>
              <button
                type="button"
                className="copy-btn"
                onClick={() => setShowDeviceDrawer(false)}
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Quick Add Device Form */}
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-white)', marginBottom: '0.75rem' }}>
                Add New Device Record
              </h4>
              
              {devFormError && (
                <div className="notice-box error" style={{ padding: '0.5rem', marginBottom: '0.75rem', fontSize: '0.75rem' }}>
                  {devFormError}
                </div>
              )}

              <form onSubmit={handleDeviceSubmit}>
                <div className="input-row">
                  <div style={{ flex: 1 }}>
                    <label htmlFor="device-name-input" className="form-label">Hostname / Name *</label>
                    <input
                      id="device-name-input"
                      type="text"
                      className="text-input"
                      placeholder="e.g. lab-switch-01"
                      value={devName}
                      onChange={(e) => setDevName(e.target.value)}
                      required
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label htmlFor="device-type-select" className="form-label">Hardware Type</label>
                    <select
                      id="device-type-select"
                      className="select-input"
                      value={devType}
                      onChange={(e) => setDevType(e.target.value as DeviceType)}
                    >
                      <option value="router">Router</option>
                      <option value="switch">Switch</option>
                      <option value="server">Server</option>
                      <option value="workstation">Workstation</option>
                      <option value="printer">Printer</option>
                      <option value="access_point">Access Point</option>
                    </select>
                  </div>
                </div>

                <div className="input-row" style={{ marginTop: '0.5rem' }}>
                  <div style={{ flex: 1 }}>
                    <label htmlFor="device-role-input" className="form-label">Functional Role *</label>
                    <input
                      id="device-role-input"
                      type="text"
                      className="text-input"
                      placeholder="e.g. Lab Core Switch"
                      value={devRole}
                      onChange={(e) => setDevRole(e.target.value)}
                      required
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label htmlFor="device-mac-input" className="form-label">MAC Address</label>
                    <input
                      id="device-mac-input"
                      type="text"
                      className="text-input"
                      placeholder="e.g. 00:1A:2B:3C:4D:5E"
                      value={devMac}
                      onChange={(e) => setDevMac(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  style={{ marginTop: '1rem', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Save Device
                </button>
              </form>
            </div>

            {/* List of Existing Devices */}
            <div>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                Configured Devices
              </h4>
              {devices.length === 0 ? (
                <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>
                  No devices created yet.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {devices.map(d => (
                    <div 
                      key={d.id}
                      style={{ 
                        background: 'rgba(13, 19, 31, 0.7)', 
                        border: '1px solid var(--border-subtle)', 
                        borderRadius: 'var(--radius-md)', 
                        padding: '0.75rem 1rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {getDeviceIcon(d.device_type)}
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-white)', fontSize: '0.9rem' }}>{d.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {d.role} {d.mac_address ? `• ${d.mac_address}` : ''}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="copy-btn"
                        style={{ color: 'var(--accent-rose)' }}
                        onClick={() => handleDeleteDevice(d.id, d.name)}
                        title="Delete Device"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

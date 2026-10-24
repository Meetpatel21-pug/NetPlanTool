import React, { useState, useEffect } from 'react';
import { fetchProjectSubnets, createSubnet, updateSubnet, deleteSubnet } from '../../api/subnets';
import { Subnet, SubnetCreatePayload } from '../../types/subnet';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Copy, 
  Check, 
  AlertTriangle, 
  CornerDownRight, 
  Network, 
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { modalBackdropVariants, modalCardVariants } from '../../utils/motion';
import { ClaySelect } from '../../components/common/ClaySelect';

interface SubnetPlannerProps {
  projectId: string;
  onProjectUpdated?: () => void;
}

export const SubnetPlanner: React.FC<SubnetPlannerProps> = ({ projectId, onProjectUpdated }) => {
  const [subnets, setSubnets] = useState<Subnet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState<boolean>(() => 
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Modal State
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingSubnetId, setEditingSubnetId] = useState<string | null>(null);
  
  // Form fields
  const [cidr, setCidr] = useState<string>('');
  const [label, setLabel] = useState<string>('');
  const [parentId, setParentId] = useState<string>('');
  const [segment, setSegment] = useState<string>('');
  const [gateway, setGateway] = useState<string>('');
  const [dhcpStart, setDhcpStart] = useState<string>('');
  const [dhcpEnd, setDhcpEnd] = useState<string>('');
  const [requestedHosts, setRequestedHosts] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadSubnets = async () => {
    setLoading(true);
    try {
      const data = await fetchProjectSubnets(projectId);
      setSubnets(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load subnets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubnets();
  }, [projectId]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const openCreateModal = (parentSubnetId: string = '') => {
    setIsEditing(false);
    setEditingSubnetId(null);
    setCidr('');
    setLabel('');
    setParentId(parentSubnetId);
    setSegment('');
    setGateway('');
    setDhcpStart('');
    setDhcpEnd('');
    setRequestedHosts('');
    setNotes('');
    setFormError(null);
    setShowModal(true);
  };

  const openEditModal = (s: Subnet) => {
    setIsEditing(true);
    setEditingSubnetId(s.id);
    setCidr(s.cidr);
    setLabel(s.label);
    setParentId(s.parent_subnet_id || '');
    setSegment(s.segment || '');
    setGateway(s.gateway || '');
    setDhcpStart(s.dhcp_start || '');
    setDhcpEnd(s.dhcp_end || '');
    setRequestedHosts(s.requested_hosts !== null ? String(s.requested_hosts) : '');
    setNotes(s.notes || '');
    setFormError(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cidr.trim() || !label.trim()) return;

    setFormSubmitting(true);
    setFormError(null);

    const payload: SubnetCreatePayload = {
      cidr: cidr.trim(),
      label: label.trim(),
      parent_subnet_id: parentId ? parentId : null,
      segment: segment.trim() || undefined,
      gateway: gateway.trim() || undefined,
      dhcp_start: dhcpStart.trim() || undefined,
      dhcp_end: dhcpEnd.trim() || undefined,
      requested_hosts: requestedHosts.trim() ? parseInt(requestedHosts.trim(), 10) : undefined,
      notes: notes.trim() || undefined,
    };

    try {
      if (isEditing && editingSubnetId) {
        await updateSubnet(projectId, editingSubnetId, payload);
      } else {
        await createSubnet(projectId, payload);
      }
      setShowModal(false);
      loadSubnets();
      if (onProjectUpdated) onProjectUpdated();
    } catch (err: any) {
      setFormError(err.message || 'Operation failed');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (id: string, subnetLabel: string) => {
    if (window.confirm(`Delete subnet "${subnetLabel}"? Child subnets and assignments will also be updated.`)) {
      try {
        await deleteSubnet(projectId, id);
        loadSubnets();
        if (onProjectUpdated) onProjectUpdated();
      } catch (err: any) {
        setError(err.message || 'Failed to delete subnet');
      }
    }
  };

  // Group subnets into hierarchy
  const topLevelSubnets = subnets.filter(s => !s.parent_subnet_id);
  const getChildren = (pid: string) => subnets.filter(s => s.parent_subnet_id === pid);

  return (
    <div className="subnet-planner-container">
      <div 
        className="subnet-planner-header"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}
      >
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-white)' }}>
            Subnet Allocation & Hierarchy
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Allocate parent CIDR address blocks and reserve child subnets with automated overlap, containment, and capacity checks.
          </p>
        </div>
        <button
          id="add-subnet-btn"
          type="button"
          className="btn-primary"
          style={{ width: 'auto' }}
          onClick={() => openCreateModal('')}
        >
          <Plus className="w-4 h-4" />
          Allocate New Subnet
        </button>
      </div>

      {error && (
        <div className="notice-box error" style={{ marginBottom: '1.5rem' }}>
          <div className="notice-title">
            <ShieldAlert className="w-4 h-4" />
            Subnet Operation Error
          </div>
          <div>{error}</div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
          Loading allocated subnets...
        </div>
      ) : subnets.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '3.5rem 2rem' }}>
          <Network className="w-12 h-12 mx-auto mb-3 opacity-30 text-cyan-400" />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-white)', marginBottom: '0.4rem' }}>
            No subnets allocated yet
          </h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '460px', margin: '0 auto 1.5rem auto', fontSize: '0.875rem' }}>
            Start by allocating a parent address block (e.g. <code>192.168.20.0/24</code>), then carve out child subnets for staff, labs, or guests.
          </p>
          <button
            type="button"
            className="btn-primary"
            style={{ width: 'auto', margin: '0 auto' }}
            onClick={() => openCreateModal('')}
          >
            <Plus className="w-4 h-4" />
            Allocate Parent Subnet
          </button>
        </div>
      ) : isMobile ? (
        /* Mobile Card List View (100% visible on mobile, zero cut-off text) */
        <div className="subnet-mobile-card-list" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {topLevelSubnets.map((parent) => (
            <React.Fragment key={`mob-${parent.id}`}>
              <SubnetMobileCard
                subnet={parent}
                level={0}
                onCopy={copyToClipboard}
                copiedId={copiedId}
                onAddChild={() => openCreateModal(parent.id)}
                onEdit={() => openEditModal(parent)}
                onDelete={() => handleDelete(parent.id, parent.label)}
              />
              {getChildren(parent.id).map((child) => (
                <SubnetMobileCard
                  key={`mob-${child.id}`}
                  subnet={child}
                  level={1}
                  onCopy={copyToClipboard}
                  copiedId={copiedId}
                  onAddChild={() => openCreateModal(child.id)}
                  onEdit={() => openEditModal(child)}
                  onDelete={() => handleDelete(child.id, child.label)}
                />
              ))}
            </React.Fragment>
          ))}
        </div>
      ) : (
        /* Desktop Table View */
        <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
          <div className="clay-table-container">
            <table className="clay-table">
              <thead>
                <tr>
                  <th>Subnet & Label</th>
                  <th>Segment / VLAN</th>
                  <th>Gateway</th>
                  <th>DHCP Pool</th>
                  <th>Usable Range</th>
                  <th>Capacity (Requested / Usable)</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {topLevelSubnets.map((parent) => (
                  <React.Fragment key={parent.id}>
                    {/* Render Top Level Subnet Row */}
                    <SubnetTableRow
                      subnet={parent}
                      level={0}
                      onCopy={copyToClipboard}
                      copiedId={copiedId}
                      onAddChild={() => openCreateModal(parent.id)}
                      onEdit={() => openEditModal(parent)}
                      onDelete={() => handleDelete(parent.id, parent.label)}
                    />

                    {/* Render Child Subnet Rows */}
                    {getChildren(parent.id).map((child) => (
                      <SubnetTableRow
                        key={child.id}
                        subnet={child}
                        level={1}
                        onCopy={copyToClipboard}
                        copiedId={copiedId}
                        onAddChild={() => openCreateModal(child.id)}
                        onEdit={() => openEditModal(child)}
                        onDelete={() => handleDelete(child.id, child.label)}
                      />
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subnet Form Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div 
            className="clay-modal-overlay"
            variants={modalBackdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={() => setShowModal(false)}
          >
            <motion.div 
              className="clay-modal-card" 
              variants={modalCardVariants}
              onClick={(e) => e.stopPropagation()}
              style={{ width: '100%', maxWidth: '580px' }}
            >
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-white)', marginBottom: '0.25rem' }}>
                {isEditing ? 'Edit Subnet Allocation' : parentId ? 'Allocate Child Subnet' : 'Allocate Parent Subnet'}
              </h2>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                {parentId 
                  ? 'Child block will be verified for complete containment within parent and non-overlap with siblings.' 
                  : 'Define a root network block or standalone subnet allocation.'}
              </p>

              {formError && (
                <div className="notice-box error" style={{ marginBottom: '1.25rem' }} role="alert">
                  <div className="notice-title">
                    <AlertTriangle className="w-4 h-4" />
                    Validation Error
                  </div>
                  <div>{formError}</div>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* Parent Subnet Selection */}
                <div className="form-group">
                  <label htmlFor="parent-subnet-select" className="form-label">Parent Subnet (Optional)</label>
                  <ClaySelect
                    id="parent-subnet-select"
                    variant="form"
                    ariaLabel="Parent Subnet"
                    value={parentId}
                    onChange={setParentId}
                    options={[
                      { value: '', label: 'None (Top-Level Root Network)' },
                      ...subnets
                        .filter(s => !isEditing || s.id !== editingSubnetId)
                        .map((s) => ({
                          value: s.id,
                          label: `${s.label} (${s.cidr})`
                        }))
                    ]}
                  />
                </div>

                <div className="input-row">
                  <div style={{ flex: 1 }}>
                    <label htmlFor="subnet-cidr-input" className="form-label">Subnet CIDR *</label>
                    <input
                      id="subnet-cidr-input"
                      type="text"
                      className="text-input"
                      placeholder="e.g. 192.168.20.0/24"
                      value={cidr}
                      onChange={(e) => setCidr(e.target.value)}
                      required
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label htmlFor="subnet-label-input" className="form-label">Label / Name *</label>
                    <input
                      id="subnet-label-input"
                      type="text"
                      className="text-input"
                      placeholder="e.g. Lab Workstations"
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="input-row" style={{ marginTop: '0.75rem' }}>
                  <div style={{ flex: 1 }}>
                    <label htmlFor="subnet-segment-input" className="form-label">VLAN / Segment Name</label>
                    <input
                      id="subnet-segment-input"
                      type="text"
                      className="text-input"
                      placeholder="e.g. VLAN 20 - Student"
                      value={segment}
                      onChange={(e) => setSegment(e.target.value)}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label htmlFor="subnet-gateway-input" className="form-label">Default Gateway IPv4</label>
                    <input
                      id="subnet-gateway-input"
                      type="text"
                      className="text-input"
                      placeholder="e.g. 192.168.20.1"
                      value={gateway}
                      onChange={(e) => setGateway(e.target.value)}
                    />
                  </div>
                </div>

                <div className="input-row" style={{ marginTop: '0.75rem' }}>
                  <div style={{ flex: 1 }}>
                    <label htmlFor="subnet-dhcp-start-input" className="form-label">DHCP Pool Start</label>
                    <input
                      id="subnet-dhcp-start-input"
                      type="text"
                      className="text-input"
                      placeholder="e.g. 192.168.20.50"
                      value={dhcpStart}
                      onChange={(e) => setDhcpStart(e.target.value)}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label htmlFor="subnet-dhcp-end-input" className="form-label">DHCP Pool End</label>
                    <input
                      id="subnet-dhcp-end-input"
                      type="text"
                      className="text-input"
                      placeholder="e.g. 192.168.20.150"
                      value={dhcpEnd}
                      onChange={(e) => setDhcpEnd(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '0.75rem' }}>
                  <label htmlFor="subnet-hosts-input" className="form-label">Requested Host Count (Optional)</label>
                  <input
                    id="subnet-hosts-input"
                    type="number"
                    min="0"
                    className="text-input"
                    placeholder="e.g. 60"
                    value={requestedHosts}
                    onChange={(e) => setRequestedHosts(e.target.value)}
                  />
                  <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>
                    If entered, the system warns you if requested hosts exceed usable address capacity.
                  </span>
                </div>

                <div className="form-group">
                  <label htmlFor="subnet-notes-input" className="form-label">Notes</label>
                  <textarea
                    id="subnet-notes-input"
                    className="text-input"
                    style={{ minHeight: '60px', resize: 'vertical' }}
                    placeholder="e.g. Reserved for college computer engineering lab terminals."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    style={{ width: 'auto' }}
                    disabled={formSubmitting}
                  >
                    {formSubmitting ? 'Validating & Saving...' : isEditing ? 'Save Changes' : 'Allocate Subnet'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Sub-component for rendering a table row
interface SubnetTableRowProps {
  subnet: Subnet;
  level: number;
  onCopy: (text: string, id: string) => void;
  copiedId: string | null;
  onAddChild: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const SubnetTableRow: React.FC<SubnetTableRowProps> = ({
  subnet,
  level,
  onCopy,
  copiedId,
  onAddChild,
  onEdit,
  onDelete,
}) => {
  const reqHosts = subnet.requested_hosts;
  const usable = subnet.usable_addresses;
  const percent = reqHosts ? Math.min(100, Math.round((reqHosts / Math.max(1, usable)) * 100)) : 0;
  const isOverCapacity = reqHosts ? reqHosts > usable : false;

  return (
    <tr 
      style={{ 
        borderBottom: '1px solid var(--border-subtle)', 
        background: level > 0 ? 'rgba(155, 109, 255, 0.05)' : 'transparent',
        transition: 'background 150ms ease'
      }}
    >
      <td style={{ padding: '0.875rem 1.25rem', paddingLeft: level > 0 ? '2.5rem' : '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {level > 0 && <CornerDownRight className="w-3.5 h-3.5 text-cyan-400" />}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span className="mono-spec" style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>
                {subnet.cidr}
              </span>
              <button
                type="button"
                className="copy-btn"
                onClick={() => onCopy(subnet.cidr, `cidr-${subnet.id}`)}
                title="Copy CIDR"
              >
                {copiedId === `cidr-${subnet.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-white)', fontWeight: 500 }}>
              {subnet.label}
            </div>
          </div>
        </div>
      </td>

      <td style={{ padding: '0.875rem 1rem', color: 'var(--text-secondary)' }}>
        {subnet.segment ? (
          <span className="brand-tag" style={{ textTransform: 'none' }}>
            {subnet.segment}
          </span>
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>—</span>
        )}
      </td>

      <td style={{ padding: '0.875rem 1rem' }}>
        {subnet.gateway ? (
          <span className="mono-spec" style={{ color: 'var(--text-white)' }}>{subnet.gateway}</span>
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>—</span>
        )}
      </td>

      <td style={{ padding: '0.875rem 1rem', fontSize: '0.8rem' }}>
        {subnet.dhcp_start && subnet.dhcp_end ? (
          <span className="mono-spec">{subnet.dhcp_start} - {subnet.dhcp_end}</span>
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>—</span>
        )}
      </td>

      <td style={{ padding: '0.875rem 1rem', fontSize: '0.8rem', color: 'var(--accent-emerald)' }}>
        {subnet.usable_range ? (
          <span className="mono-spec">{subnet.usable_range}</span>
        ) : (
          '—'
        )}
      </td>

      <td style={{ padding: '0.875rem 1rem', minWidth: '180px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
          <span className="tabular-nums">{reqHosts !== null ? `${reqHosts} req` : '0 req'}</span>
          <span className="tabular-nums" style={{ color: 'var(--text-muted)' }}>{usable} usable</span>
        </div>
        <div style={{ width: '100%', height: '7px', background: 'rgba(166, 152, 190, 0.25)', borderRadius: '999px', overflow: 'hidden', boxShadow: 'inset 1px 1px 2px rgba(0,0,0,0.1)' }}>
          <div 
            style={{ 
              width: `${percent}%`, 
              height: '100%', 
              background: isOverCapacity ? 'var(--accent-rose)' : 'var(--accent-cyan)',
              transition: 'width 200ms ease'
            }} 
          />
        </div>
        {subnet.capacity_warning && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem', fontSize: '0.7rem', color: 'var(--accent-amber)' }}>
            <AlertTriangle className="w-3 h-3 flex-shrink-0" />
            <span>Exceeds capacity</span>
          </div>
        )}
      </td>

      <td style={{ padding: '0.875rem 1.25rem', textAlign: 'right' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
          <button
            type="button"
            className="btn-secondary"
            style={{ padding: '0.3rem 0.5rem', fontSize: '0.725rem' }}
            onClick={onAddChild}
            title="Add Child Subnet inside this block"
          >
            <Plus className="w-3 h-3" />
            Child
          </button>
          <button
            type="button"
            className="btn-secondary"
            style={{ padding: '0.3rem 0.5rem', fontSize: '0.725rem' }}
            onClick={onEdit}
            title="Edit Subnet"
          >
            <Edit3 className="w-3 h-3" />
          </button>
          <button
            type="button"
            className="btn-secondary"
            style={{ padding: '0.3rem 0.5rem', fontSize: '0.725rem', color: 'var(--accent-rose)' }}
            onClick={onDelete}
            title="Delete Subnet"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </td>
    </tr>
  );
};

// Sub-component for rendering a mobile-friendly card (100% visible on small screens)
const SubnetMobileCard: React.FC<SubnetTableRowProps> = ({
  subnet,
  level,
  onCopy,
  copiedId,
  onAddChild,
  onEdit,
  onDelete,
}) => {
  const reqHosts = subnet.requested_hosts;
  const usable = subnet.usable_addresses;
  const percent = reqHosts ? Math.min(100, Math.round((reqHosts / Math.max(1, usable)) * 100)) : 0;
  const isOverCapacity = reqHosts ? reqHosts > usable : false;

  return (
    <div 
      className="glass-panel"
      style={{
        padding: '0.9rem',
        borderRadius: 'var(--radius-md)',
        background: level > 0 ? 'rgba(255, 255, 255, 0.9)' : 'var(--bg-card)',
        border: level > 0 ? '1.5px solid rgba(139, 92, 246, 0.35)' : '1.5px solid rgba(255, 255, 255, 0.85)',
        borderLeft: level > 0 ? '4px solid var(--accent-indigo)' : undefined,
        marginLeft: level > 0 ? '0.4rem' : '0',
        marginBottom: '0.75rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.55rem',
        boxShadow: 'var(--clay-shadow-sm)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.4rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {level > 0 && <CornerDownRight className="w-3.5 h-3.5 text-indigo-500" />}
          <span className="mono-spec" style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--accent-indigo)' }}>
            {subnet.cidr}
          </span>
          <button
            type="button"
            className="copy-btn"
            onClick={() => onCopy(subnet.cidr, `cidr-${subnet.id}`)}
            title="Copy CIDR"
          >
            {copiedId === `cidr-${subnet.id}` ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        {subnet.segment && (
          <span className="brand-tag" style={{ textTransform: 'none', fontSize: '0.7rem' }}>
            {subnet.segment}
          </span>
        )}
      </div>

      <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#2d1f4e' }}>
        {subnet.label}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', fontSize: '0.75rem', background: 'rgba(245, 240, 255, 0.55)', padding: '0.55rem', borderRadius: 'var(--radius-sm)' }}>
        <div>
          <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.65rem', fontWeight: 600 }}>GATEWAY</span>
          <span className="mono-spec" style={{ color: '#2d1f4e', fontWeight: 600 }}>{subnet.gateway || '—'}</span>
        </div>
        <div>
          <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.65rem', fontWeight: 600 }}>USABLE HOSTS</span>
          <span style={{ color: '#2d1f4e', fontWeight: 600 }}>{usable} hosts</span>
        </div>
        {subnet.usable_range && (
          <div style={{ gridColumn: 'span 2' }}>
            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.65rem', fontWeight: 600 }}>USABLE RANGE</span>
            <span className="mono-spec" style={{ color: 'var(--accent-emerald)', fontWeight: 600, fontSize: '0.72rem' }}>{subnet.usable_range}</span>
          </div>
        )}
        {subnet.dhcp_start && subnet.dhcp_end && (
          <div style={{ gridColumn: 'span 2' }}>
            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.65rem', fontWeight: 600 }}>DHCP POOL</span>
            <span className="mono-spec" style={{ color: '#6b5a8a', fontSize: '0.72rem' }}>{subnet.dhcp_start} - {subnet.dhcp_end}</span>
          </div>
        )}
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '0.2rem', color: '#6b5a8a' }}>
          <span>{reqHosts !== null ? `${reqHosts} req` : '0 req'}</span>
          <span>{usable} usable ({percent}%)</span>
        </div>
        <div style={{ width: '100%', height: '6px', background: 'rgba(166, 152, 190, 0.25)', borderRadius: '999px', overflow: 'hidden' }}>
          <div 
            style={{ 
              width: `${percent}%`, 
              height: '100%', 
              background: isOverCapacity ? 'var(--accent-rose)' : 'var(--accent-cyan)' 
            }} 
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', paddingTop: '0.35rem', borderTop: '1px solid rgba(139, 92, 246, 0.15)' }}>
        <button
          type="button"
          className="btn-clay-secondary"
          style={{ padding: '0.35rem 0.65rem', fontSize: '0.72rem', borderRadius: '999px' }}
          onClick={onAddChild}
          title="Add Child Subnet"
        >
          <Plus className="w-3 h-3 text-cyan-600" />
          <span>Child</span>
        </button>
        <button
          type="button"
          className="btn-clay-secondary"
          style={{ padding: '0.35rem 0.65rem', fontSize: '0.72rem', borderRadius: '999px' }}
          onClick={onEdit}
          title="Edit Subnet"
        >
          <Edit3 className="w-3 h-3 text-indigo-600" />
          <span>Edit</span>
        </button>
        <button
          type="button"
          className="btn-clay-secondary"
          style={{ padding: '0.35rem 0.65rem', fontSize: '0.72rem', borderRadius: '999px', color: '#e11d48' }}
          onClick={onDelete}
          title="Delete Subnet"
        >
          <Trash2 className="w-3 h-3 text-rose-500" />
          <span>Delete</span>
        </button>
      </div>
    </div>
  );
};


import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchProjects, createProject, duplicateProject, deleteProject } from '../../api/projects';
import { fetchStarterTemplates, instantiateProjectFromTemplate } from '../../api/templates';
import { Project } from '../../types/project';
import { StarterTemplate } from '../../types/template';
import { 
  FolderPlus, 
  Layers, 
  Server, 
  Copy, 
  Trash2, 
  ExternalLink, 
  Clock, 
  ShieldAlert,
  Search,
  Sparkles,
  LayoutTemplate,
  Check,
  ChevronRight,
  Cpu
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  modalBackdropVariants, 
  modalCardVariants, 
  containerStaggerVariants, 
  cardItemVariants 
} from '../../utils/motion';

export const ProjectDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [templates, setTemplates] = useState<StarterTemplate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Blank Project Modal
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newProjectName, setNewProjectName] = useState<string>('');
  const [newProjectDesc, setNewProjectDesc] = useState<string>('');
  const [creating, setCreating] = useState<boolean>(false);

  // Template Modal
  const [showTemplateModal, setShowTemplateModal] = useState<boolean>(false);
  const [selectedTemplate, setSelectedTemplate] = useState<StarterTemplate | null>(null);
  const [templateName, setTemplateName] = useState<string>('');
  const [templateDesc, setTemplateDesc] = useState<string>('');
  const [instantiating, setInstantiating] = useState<boolean>(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [projData, tmplData] = await Promise.all([
        fetchProjects(),
        fetchStarterTemplates().catch(() => [] as StarterTemplate[])
      ]);
      setProjects(projData);
      setTemplates(tmplData);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    setCreating(true);
    try {
      const created = await createProject({
        name: newProjectName.trim(),
        description: newProjectDesc.trim() || undefined,
      });
      setShowCreateModal(false);
      setNewProjectName('');
      setNewProjectDesc('');
      navigate(`/projects/${created.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  const handleOpenTemplateModal = (tmpl?: StarterTemplate) => {
    const t = tmpl || templates[0] || null;
    setSelectedTemplate(t);
    setTemplateName(t ? `${t.name}` : '');
    setTemplateDesc(t ? `${t.description}` : '');
    setShowTemplateModal(true);
  };

  const handleSelectTemplate = (t: StarterTemplate) => {
    setSelectedTemplate(t);
    setTemplateName(`${t.name}`);
    setTemplateDesc(t.description);
  };

  const handleInstantiate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) return;
    setInstantiating(true);
    try {
      const created = await instantiateProjectFromTemplate(selectedTemplate.id, {
        name: templateName.trim() || undefined,
        description: templateDesc.trim() || undefined,
      });
      setShowTemplateModal(false);
      navigate(`/projects/${created.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to initialize project from template');
    } finally {
      setInstantiating(false);
    }
  };

  const handleDuplicate = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await duplicateProject(id);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to duplicate project');
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete project "${name}"? This action cannot be undone.`)) {
      try {
        await deleteProject(id);
        loadData();
      } catch (err: any) {
        setError(err.message || 'Failed to delete project');
      }
    }
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="dashboard-container">
      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">
            <Layers className="w-8 h-8 text-cyan-400" />
            Network Planning Projects
          </h1>
          <p className="page-description">
            Organize IPv4 address blocks, subnets, devices, and topologies into versioned network planning workspaces.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => handleOpenTemplateModal()}
            style={{ width: 'auto' }}
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            Starter Blueprints
          </button>
          <button
            id="new-project-btn"
            type="button"
            className="btn-primary"
            style={{ width: 'auto' }}
            onClick={() => setShowCreateModal(true)}
          >
            <FolderPlus className="w-4 h-4" />
            Create Blank Project
          </button>
        </div>
      </div>

      {error && (
        <div className="notice-box error" style={{ marginBottom: '1.5rem' }}>
          <div className="notice-title">
            <ShieldAlert className="w-4 h-4" />
            Project Error
          </div>
          <div>{error}</div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search className="w-4 h-4" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="text-input"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="Search projects by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
          <p>Loading projects...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
            <Layers className="w-12 h-12 mx-auto mb-3 opacity-30 text-cyan-400" />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-white)', marginBottom: '0.5rem' }}>
              {searchQuery ? 'No matching projects found' : 'No planning projects yet'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '520px', margin: '0 auto 1.5rem auto', fontSize: '0.9rem' }}>
              {searchQuery ? 'Try adjusting your search query.' : 'Get started in seconds by launching a pre-populated network blueprint or creating a blank project.'}
            </p>
            {!searchQuery && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ width: 'auto' }}
                  onClick={() => handleOpenTemplateModal()}
                >
                  <Sparkles className="w-4 h-4" />
                  Choose Starter Blueprint
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ width: 'auto' }}
                  onClick={() => setShowCreateModal(true)}
                >
                  <FolderPlus className="w-4 h-4" />
                  Create Blank Project
                </button>
              </div>
            )}
          </div>

          {/* Quick Start Blueprints Banner */}
          {templates.length > 0 && !searchQuery && (
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-white)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <LayoutTemplate className="w-4 h-4 text-cyan-400" />
                Quick-Start Network Blueprints
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '1rem' }}>
                {templates.map((tmpl) => (
                  <div 
                    key={tmpl.id}
                    className="glass-panel"
                    style={{ 
                      padding: '1.25rem', 
                      cursor: 'pointer', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      justifyContent: 'space-between',
                      transition: 'all var(--transition-fast)'
                    }}
                    onClick={() => handleOpenTemplateModal(tmpl)}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-white)' }}>
                          {tmpl.name}
                        </h4>
                        <span className="brand-tag">Template</span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1rem' }}>
                        {tmpl.description}
                      </p>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span>{tmpl.subnet_count} Subnets • {tmpl.device_count} Devices</span>
                      <span style={{ color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '0.2rem', fontWeight: 600 }}>
                        Use Blueprint
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <motion.div 
          className="dashboard-projects-grid"
          variants={containerStaggerVariants}
          initial="hidden"
          animate="visible"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: '1.25rem' }}
        >
          {filteredProjects.map((project) => (
            <motion.div
              key={project.id}
              variants={cardItemVariants}
              className="glass-panel"
              style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-white)' }}>
                    {project.name}
                  </h3>
                  <span className="brand-tag">v{project.version}</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', minHeight: '2.5rem' }}>
                  {project.description || 'No description provided.'}
                </p>
              </div>

              <div>
                <div style={{ display: 'flex', gap: '1rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.875rem', marginBottom: '0.875rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Layers className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="tabular-nums">{project.subnet_count} Subnets</span>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Server className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="tabular-nums">{project.device_count} Devices</span>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginLeft: 'auto' }}>
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(project.updated_at).toLocaleDateString()}</span>
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                    onClick={(e) => handleDuplicate(e, project.id)}
                    title="Duplicate Project"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Duplicate
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', color: 'var(--accent-rose)' }}
                    onClick={(e) => handleDelete(e, project.id, project.name)}
                    title="Delete Project"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ padding: '0.35rem 0.85rem', fontSize: '0.75rem', width: 'auto' }}
                  >
                    Open
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Blank Project Modal Dialog */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div 
            className="clay-modal-overlay"
            variants={modalBackdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div 
              className="clay-modal-card" 
              variants={modalCardVariants}
              onClick={(e) => e.stopPropagation()}
              style={{ width: '100%', maxWidth: '480px' }}
            >
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-white)', marginBottom: '0.35rem' }}>
                Create Blank Project
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                Start with an empty canvas and build your subnets, hardware, and IP allocations from scratch.
              </p>

              <form onSubmit={handleCreate}>
                <div className="form-group">
                  <label htmlFor="modal-name-input" className="form-label">Project Name *</label>
                  <input
                    id="modal-name-input"
                    type="text"
                    className="text-input"
                    placeholder="e.g. Campus Branch Office"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="modal-desc-input" className="form-label">Description (Optional)</label>
                  <textarea
                    id="modal-desc-input"
                    className="text-input"
                    style={{ minHeight: '80px', resize: 'vertical' }}
                    placeholder="e.g. IPv4 subnet allocations and device inventory for workstations and servers."
                    value={newProjectDesc}
                    onChange={(e) => setNewProjectDesc(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    style={{ width: 'auto' }}
                    disabled={creating || !newProjectName.trim()}
                  >
                    {creating ? 'Creating...' : 'Save & Open Project'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Starter Template Selection Modal */}
      <AnimatePresence>
        {showTemplateModal && (
          <motion.div 
            className="clay-modal-overlay"
            variants={modalBackdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={() => setShowTemplateModal(false)}
          >
            <motion.div 
              className="clay-modal-card" 
              variants={modalCardVariants}
              onClick={(e) => e.stopPropagation()}
              style={{ width: '100%', maxWidth: '680px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <Sparkles className="w-5 h-5 text-indigo-500" />
                <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-white)' }}>
                  Network Starter Blueprints
                </h2>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                Select a pre-architected network layout. Each template includes configured subnets, devices, IP allocations, and topology diagram links.
              </p>

              {/* Template Selector Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {templates.map((tmpl) => {
                  const isSelected = selectedTemplate?.id === tmpl.id;
                  return (
                    <div
                      key={tmpl.id}
                      onClick={() => handleSelectTemplate(tmpl)}
                      style={{
                        background: isSelected ? 'rgba(155, 109, 255, 0.15)' : 'var(--bg-secondary)',
                        border: '2px solid',
                        borderColor: isSelected ? 'var(--accent-indigo)' : 'rgba(255, 255, 255, 0.7)',
                        borderRadius: 'var(--radius-md)',
                        boxShadow: isSelected ? 'var(--clay-shadow-float)' : 'var(--clay-shadow-sm)',
                        padding: '1rem',
                        cursor: 'pointer',
                        transition: 'all var(--transition-fast)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <span style={{ fontWeight: 700, color: isSelected ? 'var(--accent-cyan)' : 'var(--text-white)', fontSize: '0.95rem' }}>
                          {tmpl.name}
                        </span>
                        {isSelected && <Check className="w-4 h-4 text-cyan-400" />}
                      </div>
                      <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', lineHeight: 1.4 }}>
                        {tmpl.description}
                      </p>
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', display: 'flex', gap: '0.75rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Layers className="w-3 h-3" /> <span className="tabular-nums">{tmpl.subnet_count}</span> subnets
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Cpu className="w-3 h-3" /> <span className="tabular-nums">{tmpl.device_count}</span> devices
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedTemplate && (
                <form onSubmit={handleInstantiate} style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
                  <div className="form-group">
                    <label htmlFor="template-proj-name" className="form-label">Custom Project Name *</label>
                    <input
                      id="template-proj-name"
                      type="text"
                      className="text-input"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="template-proj-desc" className="form-label">Project Description</label>
                    <textarea
                      id="template-proj-desc"
                      className="text-input"
                      style={{ minHeight: '60px', resize: 'vertical' }}
                      value={templateDesc}
                      onChange={(e) => setTemplateDesc(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setShowTemplateModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                      style={{ width: 'auto' }}
                      disabled={instantiating || !templateName.trim()}
                    >
                      {instantiating ? 'Instantiating...' : 'Instantiate Network Project'}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

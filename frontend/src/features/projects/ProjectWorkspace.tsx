import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { fetchProjectById } from '../../api/projects';
import { Project } from '../../types/project';
import { SubnetPlanner } from '../subnets/SubnetPlanner';
import { IPInventory } from '../inventory/IPInventory';
import { NetworkDiagram } from '../diagram/NetworkDiagram';
import { ValidationPanel } from '../validation/ValidationPanel';
import { ReportScreen } from '../reports/ReportScreen';
import { 
  Layers, 
  Server, 
  Share2, 
  CheckCircle2, 
  FileText, 
  ChevronRight, 
  ShieldAlert,
  Clock,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { pageEntranceVariants } from '../../utils/motion';

type WorkspaceTab = 'subnets' | 'inventory' | 'diagram' | 'validation' | 'reports';

export const ProjectWorkspace: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get('tab') as WorkspaceTab | null;
  const initialTab: WorkspaceTab = urlTab && ['subnets', 'inventory', 'diagram', 'validation', 'reports'].includes(urlTab) ? urlTab : 'subnets';

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTabState] = useState<WorkspaceTab>(initialTab);

  const setActiveTab = (tab: WorkspaceTab) => {
    setActiveTabState(tab);
    setSearchParams({ tab });
  };

  useEffect(() => {
    if (urlTab && ['subnets', 'inventory', 'diagram', 'validation', 'reports'].includes(urlTab) && urlTab !== activeTab) {
      setActiveTabState(urlTab);
    }
  }, [urlTab]);

  useEffect(() => {
    if (id) {
      localStorage.setItem('last_project_id', id);
    }
  }, [id]);

  const loadProject = async () => {
    if (!id) return;
    try {
      const data = await fetchProjectById(id);
      setProject(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProject();
  }, [id]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
        Loading project workspace...
      </div>
    );
  }

  if (error || !project) {
    return (
      <div>
        <Link to="/projects" className="btn-secondary" style={{ width: 'auto', marginBottom: '1.5rem', display: 'inline-flex' }}>
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </Link>
        <div className="notice-box error">
          <div className="notice-title">
            <ShieldAlert className="w-4 h-4" />
            Project Not Found
          </div>
          <div>{error || 'Unable to find requested project.'}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="workspace-container">
      {/* Breadcrumbs and Project Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
          <Link to="/projects" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
            Projects
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span style={{ color: 'var(--text-white)' }}>{project.name}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-white)', letterSpacing: '-0.02em' }}>
                {project.name}
              </h1>
              <span className="brand-tag">v{project.version}</span>
            </div>
            {project.description && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem', maxWidth: '720px' }}>
                {project.description}
              </p>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <Clock className="w-3.5 h-3.5" />
            <span>Updated {new Date(project.updated_at).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Workspace Tabs (Responsive: desktop flex row, mobile wrapped pill grid) */}
      <div className="workspace-tabs-row">
        <button
          type="button"
          className={`nav-item ${activeTab === 'subnets' ? 'active' : ''}`}
          onClick={() => setActiveTab('subnets')}
        >
          <Layers className="w-4 h-4" />
          Subnet Planner
        </button>
        <button
          type="button"
          className={`nav-item ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          <Server className="w-4 h-4" />
          IP Inventory
        </button>
        <button
          type="button"
          className={`nav-item ${activeTab === 'diagram' ? 'active' : ''}`}
          onClick={() => setActiveTab('diagram')}
        >
          <Share2 className="w-4 h-4" />
          Diagram
        </button>
        <button
          type="button"
          className={`nav-item ${activeTab === 'validation' ? 'active' : ''}`}
          onClick={() => setActiveTab('validation')}
        >
          <CheckCircle2 className="w-4 h-4" />
          Validation
        </button>
        <button
          type="button"
          className={`nav-item ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          <FileText className="w-4 h-4" />
          Reports
        </button>
      </div>

      {/* Active Tab Panel */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          variants={pageEntranceVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          style={{ width: '100%' }}
        >
          {activeTab === 'subnets' && (
            <SubnetPlanner projectId={project.id} onProjectUpdated={loadProject} />
          )}
          {activeTab === 'inventory' && (
            <IPInventory projectId={project.id} onProjectUpdated={loadProject} />
          )}
          {activeTab === 'diagram' && (
            <NetworkDiagram projectId={project.id} onProjectUpdated={loadProject} />
          )}
          {activeTab === 'validation' && (
            <ValidationPanel projectId={project.id} onProjectUpdated={loadProject} />
          )}
          {activeTab === 'reports' && (
            <ReportScreen projectId={project.id} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

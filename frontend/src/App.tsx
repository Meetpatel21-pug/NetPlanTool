import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, useSearchParams } from 'react-router-dom';
import { SubnetCalculator } from './features/calculator/SubnetCalculator';
import { ProjectDashboard } from './features/projects/ProjectDashboard';
import { ProjectWorkspace } from './features/projects/ProjectWorkspace';
import { 
  Network, 
  Calculator, 
  Layers, 
  Server, 
  Share2, 
  CheckCircle2, 
  FileText, 
  AlertTriangle 
} from 'lucide-react';

const NavigationBar: React.FC = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const projectMatch = location.pathname.match(/^\/projects\/([^\/]+)/);
  const isInsideWorkspace = Boolean(projectMatch);
  const currentProjectId = projectMatch ? projectMatch[1] : (typeof localStorage !== 'undefined' ? localStorage.getItem('last_project_id') : null);
  const currentTab = isInsideWorkspace ? (searchParams.get('tab') || 'subnets') : null;

  const getWorkspaceUrl = (tab: string) => {
    if (currentProjectId) {
      return `/projects/${currentProjectId}?tab=${tab}`;
    }
    return '/projects';
  };

  return (
    <header className="app-header">
      <div className="brand-section">
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div className="brand-icon-box">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="brand-title">Network Planning Toolkit</span>
              <span className="brand-tag">v1.0 MVP</span>
            </div>
          </div>
        </Link>
      </div>

      <nav className="nav-links">
        <Link 
          to="/calculator" 
          className={`nav-item ${location.pathname === '/calculator' ? 'active' : ''}`}
        >
          <Calculator className="w-4 h-4" />
          Subnet Calculator
        </Link>
        <Link 
          to={isInsideWorkspace ? `/projects/${currentProjectId}?tab=subnets` : '/projects'} 
          className={`nav-item ${location.pathname === '/projects' || (isInsideWorkspace && currentTab === 'subnets') ? 'active' : ''}`}
        >
          <Layers className="w-4 h-4" />
          {isInsideWorkspace ? 'Subnets' : 'Projects'}
        </Link>
        <Link 
          to={getWorkspaceUrl('inventory')} 
          className={`nav-item ${isInsideWorkspace && currentTab === 'inventory' ? 'active' : ''}`}
          title={currentProjectId ? "Go to IP Inventory" : "Open Projects to manage IP inventory"}
        >
          <Server className="w-4 h-4" />
          IP Inventory
        </Link>
        <Link 
          to={getWorkspaceUrl('diagram')} 
          className={`nav-item ${isInsideWorkspace && currentTab === 'diagram' ? 'active' : ''}`}
          title={currentProjectId ? "Go to Network Diagram" : "Open Projects to view topology diagram"}
        >
          <Share2 className="w-4 h-4" />
          Diagram
        </Link>
        <Link 
          to={getWorkspaceUrl('validation')} 
          className={`nav-item ${isInsideWorkspace && currentTab === 'validation' ? 'active' : ''}`}
          title={currentProjectId ? "Run Network Validation" : "Open Projects to validate plan"}
        >
          <CheckCircle2 className="w-4 h-4" />
          Validation
        </Link>
        <Link 
          to={getWorkspaceUrl('reports')} 
          className={`nav-item ${isInsideWorkspace && currentTab === 'reports' ? 'active' : ''}`}
          title={currentProjectId ? "Generate & Export Reports" : "Open Projects to generate reports"}
        >
          <FileText className="w-4 h-4" />
          Reports
        </Link>
      </nav>
    </header>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <NavigationBar />
        
        <main className="container" style={{ flex: 1 }}>
          {/* Mandatory Pre-Implementation Safety Warning Banner */}
          <div className="safety-banner">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <div>
              <strong>Safety check before implementation:</strong> This plan is not aware of the live network.
              Verify against existing DHCP, static assignments, VPN ranges, and upstream allocations before implementing.
            </div>
          </div>

          <Routes>
            <Route path="/" element={<ProjectDashboard />} />
            <Route path="/calculator" element={<SubnetCalculator />} />
            <Route path="/projects" element={<ProjectDashboard />} />
            <Route path="/projects/:id" element={<ProjectWorkspace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
};

export default App;

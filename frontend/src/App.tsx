import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LandingPage } from './features/landing/LandingPage';
import { SubnetCalculator } from './features/calculator/SubnetCalculator';
import { ProjectDashboard } from './features/projects/ProjectDashboard';
import { ProjectWorkspace } from './features/projects/ProjectWorkspace';
import { 
  Network, 
  Calculator, 
  Layers, 
  AlertTriangle 
} from 'lucide-react';

const NavigationBar: React.FC = () => {
  const location = useLocation();
  const isProjectsActive = location.pathname === '/projects' || location.pathname.startsWith('/projects');
  const isCalculatorActive = location.pathname === '/calculator';

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
          className={`nav-item ${isCalculatorActive ? 'active' : ''}`}
        >
          <Calculator className="w-4 h-4" />
          Subnet Calculator
        </Link>
        <Link 
          to="/projects" 
          className={`nav-item ${isProjectsActive ? 'active' : ''}`}
        >
          <Layers className="w-4 h-4" />
          Projects
        </Link>
      </nav>
    </header>
  );
};

const MainLayout: React.FC = () => {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <NavigationBar />
      
      {isLandingPage ? (
        <main style={{ flex: 1, width: '100%' }}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
          </Routes>
        </main>
      ) : (
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
            <Route path="/calculator" element={<SubnetCalculator />} />
            <Route path="/projects" element={<ProjectDashboard />} />
            <Route path="/projects/:id" element={<ProjectWorkspace />} />
          </Routes>
        </main>
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <MainLayout />
    </BrowserRouter>
  );
};

export default App;

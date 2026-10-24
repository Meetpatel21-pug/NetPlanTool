import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProjectDashboard } from '../src/features/projects/ProjectDashboard';
import * as api from '../src/api/projects';
import * as tmplApi from '../src/api/templates';

describe('ProjectDashboard Component', () => {
  const mockProjects = [
    {
      id: 'proj-1',
      name: 'Computer Lab Plan',
      description: 'Lab layout for 30 workstations',
      owner_id: null,
      version: 2,
      created_at: '2026-10-23T10:00:00Z',
      updated_at: '2026-10-23T11:00:00Z',
      subnet_count: 3,
      device_count: 12,
    },
  ];

  const mockTemplates = [
    {
      id: 'small-office',
      name: 'Small Office Network',
      description: 'Dual-switch office network with separate Management and Workstations',
      version: 1,
      subnet_count: 5,
      device_count: 6,
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders project list and handles new blank project modal', async () => {
    vi.spyOn(api, 'fetchProjects').mockResolvedValue(mockProjects);
    vi.spyOn(tmplApi, 'fetchStarterTemplates').mockResolvedValue(mockTemplates);
    const createSpy = vi.spyOn(api, 'createProject').mockResolvedValue({
      id: 'proj-2',
      name: 'New Test Network',
      description: 'Test description',
      owner_id: null,
      version: 1,
      created_at: '2026-10-23T12:00:00Z',
      updated_at: '2026-10-23T12:00:00Z',
      subnet_count: 0,
      device_count: 0,
    });

    render(
      <MemoryRouter>
        <ProjectDashboard />
      </MemoryRouter>
    );

    // Check project loaded
    await waitFor(() => {
      expect(screen.getByText('Computer Lab Plan')).toBeInTheDocument();
      expect(screen.getByText('v2')).toBeInTheDocument();
      expect(screen.getByText('3 Subnets')).toBeInTheDocument();
    });

    // Open create modal
    const createBtn = screen.getByRole('button', { name: /Create Blank Project/i });
    fireEvent.click(createBtn);

    expect(screen.getByLabelText(/Project Name \*/i)).toBeInTheDocument();

    // Fill form
    fireEvent.change(screen.getByLabelText(/Project Name \*/i), {
      target: { value: 'New Test Network' },
    });
    fireEvent.change(screen.getByLabelText(/Description \(Optional\)/i), {
      target: { value: 'Test description' },
    });

    // Submit form
    const submitBtn = screen.getByRole('button', { name: /^Save & Open Project$/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith({
        name: 'New Test Network',
        description: 'Test description',
      });
    });
  });

  it('handles duplicate action', async () => {
    vi.spyOn(api, 'fetchProjects').mockResolvedValue(mockProjects);
    vi.spyOn(tmplApi, 'fetchStarterTemplates').mockResolvedValue(mockTemplates);
    const dupSpy = vi.spyOn(api, 'duplicateProject').mockResolvedValue({
      ...mockProjects[0],
      id: 'proj-1-copy',
      name: 'Copy of Computer Lab Plan',
      version: 1,
    });

    render(
      <MemoryRouter>
        <ProjectDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Computer Lab Plan')).toBeInTheDocument();
    });

    const dupBtn = screen.getByTitle('Duplicate Project');
    fireEvent.click(dupBtn);

    await waitFor(() => {
      expect(dupSpy).toHaveBeenCalledWith('proj-1');
    });
  });

  it('supports launching a project from a starter blueprint', async () => {
    vi.spyOn(api, 'fetchProjects').mockResolvedValue([]);
    vi.spyOn(tmplApi, 'fetchStarterTemplates').mockResolvedValue(mockTemplates);
    const tmplSpy = vi.spyOn(tmplApi, 'instantiateProjectFromTemplate').mockResolvedValue({
      id: 'proj-tmpl-1',
      name: 'Small Office Network',
      description: 'Dual-switch office network with separate Management and Workstations',
      owner_id: null,
      version: 1,
      created_at: '2026-10-23T12:00:00Z',
      updated_at: '2026-10-23T12:00:00Z',
      subnet_count: 5,
      device_count: 6,
    });

    render(
      <MemoryRouter>
        <ProjectDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Quick-Start Network Blueprints')).toBeInTheDocument();
      expect(screen.getByText('Small Office Network')).toBeInTheDocument();
    });

    // Click starter blueprint
    const bpBtn = screen.getByText('Small Office Network');
    fireEvent.click(bpBtn);

    await waitFor(() => {
      expect(screen.getByText('Network Starter Blueprints')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Instantiate Network Project/i })).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole('button', { name: /Instantiate Network Project/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(tmplSpy).toHaveBeenCalledWith('small-office', expect.objectContaining({
        name: 'Small Office Network',
      }));
    });
  });
});

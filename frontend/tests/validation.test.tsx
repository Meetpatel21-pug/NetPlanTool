import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ValidationPanel } from '../src/features/validation/ValidationPanel';
import * as valApi from '../src/api/validation';
import { ValidationReportResponse } from '../src/types/validation';

describe('ValidationPanel Component', () => {
  const mockReportWithIssues: ValidationReportResponse = {
    project_id: 'proj-1',
    total_issues: 3,
    error_count: 1,
    warning_count: 1,
    info_count: 1,
    checked_at: '2026-10-23T12:00:00Z',
    issues: [
      {
        id: 'iss-1',
        project_id: 'proj-1',
        issue_code: 'DUPLICATE_IP',
        severity: 'error',
        message: "Address '192.168.1.10' is assigned 2 times.",
        recommended_action: 'Ensure each device interface has a unique IPv4 address.',
        related_record_ids: ['assign-1', 'assign-2'],
        checked_at: '2026-10-23T12:00:00Z',
      },
      {
        id: 'iss-2',
        project_id: 'proj-1',
        issue_code: 'DHCP_COLLISION',
        severity: 'warning',
        message: "Static IP '192.168.1.50' falls inside DHCP pool.",
        recommended_action: 'Move static address outside dynamic DHCP boundary.',
        related_record_ids: ['assign-3'],
        checked_at: '2026-10-23T12:00:00Z',
      },
      {
        id: 'iss-3',
        project_id: 'proj-1',
        issue_code: 'MISSING_GATEWAY',
        severity: 'info',
        message: "Subnet '192.168.1.0/24' has no default gateway configured.",
        recommended_action: 'Assign a router interface as default gateway.',
        related_record_ids: ['sub-1'],
        checked_at: '2026-10-23T12:00:00Z',
      },
    ],
  };

  const mockReportClean: ValidationReportResponse = {
    project_id: 'proj-1',
    total_issues: 0,
    error_count: 0,
    warning_count: 0,
    info_count: 0,
    checked_at: '2026-10-23T12:00:00Z',
    issues: [],
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders validation results and displays issues with recommended actions', async () => {
    vi.spyOn(valApi, 'validateProject').mockResolvedValue(mockReportWithIssues);

    render(<ValidationPanel projectId="proj-1" />);

    await waitFor(() => {
      expect(screen.getByText('Network Rule Validation Engine')).toBeInTheDocument();
      expect(screen.getByText(/Address '192.168.1.10' is assigned 2 times/i)).toBeInTheDocument();
      expect(screen.getByText(/DUPLICATE_IP/i)).toBeInTheDocument();
      expect(screen.getByText(/Ensure each device interface has a unique IPv4 address/i)).toBeInTheDocument();
      expect(screen.getByText(/Static IP '192.168.1.50' falls inside DHCP pool/i)).toBeInTheDocument();
      expect(screen.getByText(/DHCP_COLLISION/i)).toBeInTheDocument();
    });
  });

  it('filters issues by severity', async () => {
    vi.spyOn(valApi, 'validateProject').mockResolvedValue(mockReportWithIssues);

    render(<ValidationPanel projectId="proj-1" />);

    await waitFor(() => {
      expect(screen.getByText(/DUPLICATE_IP/i)).toBeInTheDocument();
    });

    // Click on Errors filter
    const errorFilterBtn = screen.getByRole('button', { name: /^Errors \(1\)$/i });
    fireEvent.click(errorFilterBtn);

    expect(screen.getByText(/DUPLICATE_IP/i)).toBeInTheDocument();
    expect(screen.queryByText(/DHCP_COLLISION/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/MISSING_GATEWAY/i)).not.toBeInTheDocument();

    // Click on Warnings filter
    const warningFilterBtn = screen.getByRole('button', { name: /^Warnings \(1\)$/i });
    fireEvent.click(warningFilterBtn);

    expect(screen.queryByText(/DUPLICATE_IP/i)).not.toBeInTheDocument();
    expect(screen.getByText(/DHCP_COLLISION/i)).toBeInTheDocument();
    expect(screen.queryByText(/MISSING_GATEWAY/i)).not.toBeInTheDocument();

    // Reset to All
    const allFilterBtn = screen.getByRole('button', { name: /^All \(3\)$/i });
    fireEvent.click(allFilterBtn);

    expect(screen.getByText(/DUPLICATE_IP/i)).toBeInTheDocument();
    expect(screen.getByText(/DHCP_COLLISION/i)).toBeInTheDocument();
  });

  it('renders all-clear state when project has 0 issues', async () => {
    vi.spyOn(valApi, 'validateProject').mockResolvedValue(mockReportClean);

    render(<ValidationPanel projectId="proj-1" />);

    await waitFor(() => {
      expect(screen.getByText(/Network Architecture Clean & Valid/i)).toBeInTheDocument();
      expect(screen.getByText(/Zero conflicts found/i)).toBeInTheDocument();
    });
  });

  it('supports re-running validation via button click', async () => {
    const valSpy = vi.spyOn(valApi, 'validateProject').mockResolvedValue(mockReportWithIssues);

    render(<ValidationPanel projectId="proj-1" />);

    await waitFor(() => {
      expect(valSpy).toHaveBeenCalledTimes(1);
    });

    const rerunBtn = screen.getByRole('button', { name: /Re-Run Validation/i });
    fireEvent.click(rerunBtn);

    await waitFor(() => {
      expect(valSpy).toHaveBeenCalledTimes(2);
    });
  });
});

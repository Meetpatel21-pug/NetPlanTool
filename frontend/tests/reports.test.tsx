import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ReportScreen } from '../src/features/reports/ReportScreen';
import * as expApi from '../src/api/exports';
import { ReportPreview } from '../src/types/reports';

describe('ReportScreen Component', () => {
  const mockPreview: ReportPreview = {
    project: {
      name: 'Campus Core Network',
      version: 2,
      description: 'Distribution network redesign',
      created_at: '2026-10-23T10:00:00Z',
      updated_at: '2026-10-23T11:30:00Z',
    },
    stats: {
      subnet_count: 4,
      device_count: 8,
      assignment_count: 14,
      issue_count: 0,
    },
    issues: [],
    notice: 'This plan is not aware of the live network. Verify against existing DHCP, static assignments, VPN ranges, and upstream allocations before implementing.',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders mandatory live-network safety notice prominently', async () => {
    vi.spyOn(expApi, 'fetchReportPreview').mockResolvedValue(mockPreview);

    render(<ReportScreen projectId="proj-1" />);

    await waitFor(() => {
      expect(screen.getByText(/MANDATORY LIVE-NETWORK SAFETY NOTICE/i)).toBeInTheDocument();
      expect(screen.getByText(/This plan is not aware of the live network/i)).toBeInTheDocument();
    });
  });

  it('provides download links for PDF report and CSV inventory', async () => {
    vi.spyOn(expApi, 'fetchReportPreview').mockResolvedValue(mockPreview);

    render(<ReportScreen projectId="proj-1" />);

    await waitFor(() => {
      const pdfLink = screen.getByRole('link', { name: /Download PDF Report/i });
      expect(pdfLink).toHaveAttribute('href', '/api/projects/proj-1/report.pdf');

      const csvLink = screen.getByRole('link', { name: /Download Inventory CSV/i });
      expect(csvLink).toHaveAttribute('href', '/api/projects/proj-1/export.csv');
    });
  });

  it('displays report statistics and included documentation sections', async () => {
    vi.spyOn(expApi, 'fetchReportPreview').mockResolvedValue(mockPreview);

    render(<ReportScreen projectId="proj-1" />);

    await waitFor(() => {
      expect(screen.getByText('Report Payload Preview')).toBeInTheDocument();
      expect(screen.getByText('Project Version 2')).toBeInTheDocument();
      expect(screen.getByText('Subnet Allocations & CIDR Table')).toBeInTheDocument();
      expect(screen.getByText('Hardware Inventory & Role Distribution')).toBeInTheDocument();
      expect(screen.getByText('Complete IP Address Plan (Static / DHCP)')).toBeInTheDocument();
      expect(screen.getByText('Rule Validation & Audit Log')).toBeInTheDocument();
    });
  });
});

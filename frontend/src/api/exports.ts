import { ReportPreview } from '../types/reports';

const API_BASE = '/api';

export async function fetchReportPreview(projectId: string): Promise<ReportPreview> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/report/preview`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || 'Failed to load report preview');
  }
  return res.json();
}

export function getExportCsvUrl(projectId: string): string {
  return `${API_BASE}/projects/${projectId}/export.csv`;
}

export function getExportPdfUrl(projectId: string): string {
  return `${API_BASE}/projects/${projectId}/report.pdf`;
}

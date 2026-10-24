import { ValidationReportResponse } from '../types/validation';

const API_BASE = '/api';

export async function validateProject(projectId: string): Promise<ValidationReportResponse> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || 'Validation failed');
  }
  return res.json();
}

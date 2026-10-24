import { ValidationIssue } from './validation';

export interface ReportProjectMetadata {
  name: string;
  version: number;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface ReportStats {
  subnet_count: number;
  device_count: number;
  assignment_count: number;
  issue_count: number;
}

export interface ReportPreview {
  project: ReportProjectMetadata;
  stats: ReportStats;
  issues: ValidationIssue[];
  notice: string;
}

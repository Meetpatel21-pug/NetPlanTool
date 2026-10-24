export type SeverityLevel = 'error' | 'warning' | 'info';

export interface ValidationIssue {
  id: string;
  project_id: string;
  issue_code: string;
  severity: SeverityLevel;
  message: string;
  recommended_action: string;
  related_record_ids: string[];
  checked_at: string;
}

export interface ValidationReportResponse {
  project_id: string;
  total_issues: number;
  error_count: number;
  warning_count: number;
  info_count: number;
  issues: ValidationIssue[];
  checked_at: string;
}

import React, { useState, useEffect } from 'react';
import { validateProject } from '../../api/validation';
import { ValidationReportResponse, SeverityLevel } from '../../types/validation';
import { 
  ShieldAlert, 
  AlertTriangle, 
  Info, 
  CheckCircle2, 
  RefreshCw, 
  Wrench, 
  Check, 
  Filter, 
  Clock, 
  FileCheck2,
  Tag
} from 'lucide-react';

interface ValidationPanelProps {
  projectId: string;
  onProjectUpdated?: () => void;
}

export const ValidationPanel: React.FC<ValidationPanelProps> = ({ projectId }) => {
  const [report, setReport] = useState<ValidationReportResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<'all' | SeverityLevel>('all');

  const runValidation = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await validateProject(projectId);
      setReport(data);
    } catch (err: any) {
      setError(err.message || 'Failed to run validation check');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runValidation();
  }, [projectId]);

  const filteredIssues = (report?.issues || []).filter((issue) => {
    if (severityFilter === 'all') return true;
    return issue.severity === severityFilter;
  });

  const getSeverityBadge = (severity: SeverityLevel) => {
    switch (severity) {
      case 'error':
        return (
          <span style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.35rem', 
            fontSize: '0.75rem', 
            fontWeight: 700, 
            color: '#f43f5e', 
            background: 'rgba(244, 63, 94, 0.12)', 
            border: '1px solid rgba(244, 63, 94, 0.3)', 
            padding: '0.2rem 0.55rem', 
            borderRadius: '9999px',
            textTransform: 'uppercase'
          }}>
            <ShieldAlert className="w-3.5 h-3.5" />
            Error
          </span>
        );
      case 'warning':
        return (
          <span style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.35rem', 
            fontSize: '0.75rem', 
            fontWeight: 700, 
            color: '#f59e0b', 
            background: 'rgba(245, 158, 11, 0.12)', 
            border: '1px solid rgba(245, 158, 11, 0.3)', 
            padding: '0.2rem 0.55rem', 
            borderRadius: '9999px',
            textTransform: 'uppercase'
          }}>
            <AlertTriangle className="w-3.5 h-3.5" />
            Warning
          </span>
        );
      case 'info':
        return (
          <span style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.35rem', 
            fontSize: '0.75rem', 
            fontWeight: 700, 
            color: '#38bdf8', 
            background: 'rgba(56, 189, 248, 0.12)', 
            border: '1px solid rgba(56, 189, 248, 0.3)', 
            padding: '0.2rem 0.55rem', 
            borderRadius: '9999px',
            textTransform: 'uppercase'
          }}>
            <Info className="w-3.5 h-3.5" />
            Advisory
          </span>
        );
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header and Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-white)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileCheck2 className="w-5 h-5" style={{ color: 'var(--accent-cyan)' }} />
            Network Rule Validation Engine
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Multi-rule diagnostic analysis detecting overlaps, duplicate IPs, gateway anomalies, and RFC compliance violations.
          </p>
        </div>

        <button 
          type="button" 
          className="btn-primary" 
          onClick={runValidation} 
          disabled={loading}
          style={{ width: 'auto', padding: '0.55rem 1.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Validating...' : 'Re-Run Validation'}
        </button>
      </div>

      {error && (
        <div className="notice-box error">
          <div className="notice-title">
            <ShieldAlert className="w-4 h-4" />
            Validation Diagnostic Error
          </div>
          <div>{error}</div>
        </div>
      )}

      {/* Summary KPI Cards */}
      {report && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
          <div className="result-card">
            <div className="result-card-header">
              <span className="result-label">Total Checks Found</span>
              <FileCheck2 className="w-4 h-4" style={{ color: 'var(--accent-cyan)' }} />
            </div>
            <div className="result-value">{report.total_issues}</div>
            <div className="result-subtext">Issues across all categories</div>
          </div>

          <div className="result-card" style={{ borderColor: report.error_count > 0 ? 'rgba(244, 63, 94, 0.4)' : undefined }}>
            <div className="result-card-header">
              <span className="result-label" style={{ color: report.error_count > 0 ? '#f43f5e' : undefined }}>Errors</span>
              <ShieldAlert className="w-4 h-4" style={{ color: report.error_count > 0 ? '#f43f5e' : 'var(--text-muted)' }} />
            </div>
            <div className="result-value" style={{ color: report.error_count > 0 ? '#f43f5e' : 'var(--text-white)' }}>
              {report.error_count}
            </div>
            <div className="result-subtext">Critical flaws requiring correction</div>
          </div>

          <div className="result-card" style={{ borderColor: report.warning_count > 0 ? 'rgba(245, 158, 11, 0.4)' : undefined }}>
            <div className="result-card-header">
              <span className="result-label" style={{ color: report.warning_count > 0 ? '#f59e0b' : undefined }}>Warnings</span>
              <AlertTriangle className="w-4 h-4" style={{ color: report.warning_count > 0 ? '#f59e0b' : 'var(--text-muted)' }} />
            </div>
            <div className="result-value" style={{ color: report.warning_count > 0 ? '#f59e0b' : 'var(--text-white)' }}>
              {report.warning_count}
            </div>
            <div className="result-subtext">Subnet boundary & DHCP risks</div>
          </div>

          <div className="result-card">
            <div className="result-card-header">
              <span className="result-label">Advisories</span>
              <Info className="w-4 h-4" style={{ color: 'var(--accent-cyan)' }} />
            </div>
            <div className="result-value" style={{ color: 'var(--accent-cyan)' }}>
              {report.info_count}
            </div>
            <div className="result-subtext">Best practice & completeness hints</div>
          </div>
        </div>
      )}

      {/* Status Verdict Banner */}
      {report && (
        <>
          {report.error_count === 0 && report.warning_count === 0 && report.info_count === 0 ? (
            <div style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-emerald)',
                flexShrink: 0
              }}>
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-emerald)', marginBottom: '0.2rem' }}>
                  Network Architecture Clean & Valid
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Zero conflicts found. All subnets are non-overlapping, host IP addresses are unique and within range, and gateway assignments align with network bounds.
                </p>
              </div>
            </div>
          ) : report.error_count > 0 ? (
            <div style={{
              background: 'rgba(244, 63, 94, 0.08)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              color: '#fecdd3',
              fontSize: '0.875rem'
            }}>
              <ShieldAlert className="w-5 h-5" style={{ color: '#f43f5e', flexShrink: 0 }} />
              <div>
                <strong>Action Required:</strong> {report.error_count} critical configuration {report.error_count === 1 ? 'error must' : 'errors must'} be resolved before exporting final implementation artifacts.
              </div>
            </div>
          ) : (
            <div style={{
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              color: '#fde68a',
              fontSize: '0.875rem'
            }}>
              <AlertTriangle className="w-5 h-5" style={{ color: '#f59e0b', flexShrink: 0 }} />
              <div>
                <strong>Advisory Notice:</strong> Configuration is technically viable, but {report.warning_count} potential {report.warning_count === 1 ? 'risk or bottleneck was' : 'risks or bottlenecks were'} flagged for review.
              </div>
            </div>
          )}
        </>
      )}

      {/* Filter and Timestamp Bar */}
      {report && report.issues.length > 0 && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: '1rem',
          background: 'rgba(17, 24, 39, 0.5)',
          padding: '0.75rem 1rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Filter className="w-3.5 h-3.5" />
              Filter Severity:
            </span>
            <button
              type="button"
              className={`btn-secondary ${severityFilter === 'all' ? 'active' : ''}`}
              style={{
                padding: '0.3rem 0.75rem',
                fontSize: '0.8rem',
                borderColor: severityFilter === 'all' ? 'var(--accent-cyan)' : undefined,
                color: severityFilter === 'all' ? 'var(--accent-cyan)' : undefined
              }}
              onClick={() => setSeverityFilter('all')}
            >
              All ({report.total_issues})
            </button>
            <button
              type="button"
              className={`btn-secondary ${severityFilter === 'error' ? 'active' : ''}`}
              style={{
                padding: '0.3rem 0.75rem',
                fontSize: '0.8rem',
                borderColor: severityFilter === 'error' ? '#f43f5e' : undefined,
                color: severityFilter === 'error' ? '#f43f5e' : undefined
              }}
              onClick={() => setSeverityFilter('error')}
            >
              Errors ({report.error_count})
            </button>
            <button
              type="button"
              className={`btn-secondary ${severityFilter === 'warning' ? 'active' : ''}`}
              style={{
                padding: '0.3rem 0.75rem',
                fontSize: '0.8rem',
                borderColor: severityFilter === 'warning' ? '#f59e0b' : undefined,
                color: severityFilter === 'warning' ? '#f59e0b' : undefined
              }}
              onClick={() => setSeverityFilter('warning')}
            >
              Warnings ({report.warning_count})
            </button>
            <button
              type="button"
              className={`btn-secondary ${severityFilter === 'info' ? 'active' : ''}`}
              style={{
                padding: '0.3rem 0.75rem',
                fontSize: '0.8rem',
                borderColor: severityFilter === 'info' ? 'var(--accent-cyan)' : undefined,
                color: severityFilter === 'info' ? 'var(--accent-cyan)' : undefined
              }}
              onClick={() => setSeverityFilter('info')}
            >
              Advisory ({report.info_count})
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.775rem', color: 'var(--text-muted)' }}>
            <Clock className="w-3.5 h-3.5" />
            <span>Analyzed at {new Date(report.checked_at).toLocaleTimeString()}</span>
          </div>
        </div>
      )}

      {/* Issues List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {filteredIssues.map((issue) => (
          <div 
            key={issue.id}
            style={{
              background: 'rgba(13, 19, 31, 0.75)',
              border: '1px solid',
              borderColor: issue.severity === 'error' ? 'rgba(244, 63, 94, 0.3)' : issue.severity === 'warning' ? 'rgba(245, 158, 11, 0.3)' : 'var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              transition: 'all var(--transition-fast)'
            }}
          >
            {/* Top row: badge + issue code + timestamp */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                {getSeverityBadge(issue.severity)}
                <span style={{ 
                  fontFamily: 'var(--font-mono)', 
                  fontSize: '0.775rem', 
                  color: 'var(--text-muted)',
                  background: 'rgba(255, 255, 255, 0.04)',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '4px',
                  border: '1px solid rgba(255, 255, 255, 0.06)'
                }}>
                  {issue.issue_code}
                </span>
              </div>
            </div>

            {/* Description message */}
            <div style={{ fontSize: '0.925rem', fontWeight: 600, color: 'var(--text-white)', marginBottom: '0.6rem' }}>
              {issue.message}
            </div>

            {/* Recommended action box */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.75rem 0.9rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.6rem',
              borderLeft: `3px solid ${issue.severity === 'error' ? '#f43f5e' : issue.severity === 'warning' ? '#f59e0b' : 'var(--accent-cyan)'}`
            }}>
              <Wrench className="w-4 h-4" style={{ 
                color: issue.severity === 'error' ? '#f43f5e' : issue.severity === 'warning' ? '#f59e0b' : 'var(--accent-cyan)',
                marginTop: '0.1rem',
                flexShrink: 0
              }} />
              <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--text-white)' }}>Recommended Action: </strong>
                {issue.recommended_action}
              </div>
            </div>

            {/* Affected records footer if available */}
            {issue.related_record_ids && issue.related_record_ids.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <Tag className="w-3.5 h-3.5" />
                <span>Affected record IDs:</span>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  {issue.related_record_ids.map((recId, idx) => (
                    <span 
                      key={idx}
                      style={{ 
                        fontFamily: 'var(--font-mono)', 
                        background: 'rgba(255, 255, 255, 0.05)', 
                        padding: '0.05rem 0.35rem', 
                        borderRadius: '3px',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      {recId.slice(0, 8)}...
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {report && report.issues.length > 0 && filteredIssues.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            No issues match the selected severity filter.
          </div>
        )}
      </div>

      {/* Safety / Compliance footer reminder */}
      <div style={{ 
        borderTop: '1px solid var(--border-subtle)', 
        paddingTop: '1rem', 
        fontSize: '0.775rem', 
        color: 'var(--text-muted)', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.5rem' 
      }}>
        <Check className="w-4 h-4" style={{ color: 'var(--accent-cyan)', flexShrink: 0 }} />
        <span>
          Planning validation engine is completely non-destructive: it analyzes data integrity without altering any project subnets, IP assignments, or hardware records.
        </span>
      </div>
    </div>
  );
};

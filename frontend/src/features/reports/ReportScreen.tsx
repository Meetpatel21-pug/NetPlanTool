import React, { useState, useEffect } from 'react';
import { fetchReportPreview, getExportCsvUrl, getExportPdfUrl } from '../../api/exports';
import { ReportPreview } from '../../types/reports';
import { 
  FileText, 
  Download, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  Server, 
  Cpu, 
  FileSpreadsheet, 
  Clock,
  RefreshCw
} from 'lucide-react';

interface ReportScreenProps {
  projectId: string;
}

export const ReportScreen: React.FC<ReportScreenProps> = ({ projectId }) => {
  const [preview, setPreview] = useState<ReportPreview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPreview = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchReportPreview(projectId);
        setPreview(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch report preview');
      } finally {
        setLoading(false);
      }
    };

    loadPreview();
  }, [projectId]);

  const csvDownloadUrl = getExportCsvUrl(projectId);
  const pdfDownloadUrl = getExportPdfUrl(projectId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-white)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileText className="w-5 h-5" style={{ color: 'var(--accent-cyan)' }} />
          Network Documentation & Export Reports
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
          Generate engineering documentation, executive PDF reports, and sanitized CSV inventory spreadsheets.
        </p>
      </div>

      {/* Mandatory Live-Network Safety Notice per Proposal */}
      <div className="safety-banner" style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
        <AlertTriangle className="w-5 h-5" style={{ color: 'var(--accent-amber)', flexShrink: 0, marginTop: '0.1rem' }} />
        <div>
          <strong style={{ color: '#fbbf24', display: 'block', marginBottom: '0.25rem' }}>
            MANDATORY LIVE-NETWORK SAFETY NOTICE
          </strong>
          <span>
            {preview?.notice || 
              "This plan is not aware of the live network. Verify against existing DHCP, static assignments, VPN ranges, and upstream allocations before implementing."}
          </span>
        </div>
      </div>

      {error && (
        <div className="notice-box error">
          <div className="notice-title">
            <ShieldAlert className="w-4 h-4" />
            Report Generation Error
          </div>
          <div>{error}</div>
        </div>
      )}

      {loading && !preview && (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Compiling report metadata preview...</span>
        </div>
      )}

      {/* Export Action Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {/* PDF Export Card */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.85))',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '1.25rem',
          boxShadow: 'var(--shadow-md)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(56, 189, 248, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-cyan)'
              }}>
                <FileText className="w-5 h-5" />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-white)' }}>
                PDF Technical Documentation
              </h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Comprehensive engineering handover PDF built via ReportLab. Includes executive summary, subnet allocation maps, hardware inventory, and full diagnostic audit with safety notices.
            </p>
          </div>

          <div>
            <a
              href={pdfDownloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
              style={{
                textDecoration: 'none',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <Download className="w-4 h-4" />
              Download PDF Report
            </a>
            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '0.5rem' }}>
              Includes title page, subnet table, IP inventory, and validation findings
            </div>
          </div>
        </div>

        {/* CSV Export Card */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.85))',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '1.25rem',
          boxShadow: 'var(--shadow-md)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-emerald)'
              }}>
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-white)' }}>
                CSV IP Inventory Export
              </h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Raw tabular data export of all IP assignments, device associations, roles, and status fields. Sanitized against formula injection vulnerability (<code style={{ color: 'var(--accent-cyan)' }}>=, +, -, @</code>).
            </p>
          </div>

          <div>
            <a
              href={csvDownloadUrl}
              download
              className="btn-primary"
              style={{
                textDecoration: 'none',
                background: 'linear-gradient(135deg, #059669, #10b981)',
                boxShadow: '0 4px 12px rgba(5, 150, 105, 0.35)',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <Download className="w-4 h-4" />
              Download Inventory CSV
            </a>
            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '0.5rem' }}>
              Directly compatible with Microsoft Excel, Google Sheets & LibreOffice
            </div>
          </div>
        </div>
      </div>

      {/* Report Preview Breakdown */}
      {preview && (
        <div style={{
          background: 'rgba(13, 19, 31, 0.75)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-white)' }}>
                Report Payload Preview
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Snapshot of data compiled into the generated technical deliverables.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.775rem', color: 'var(--text-muted)' }}>
              <Clock className="w-3.5 h-3.5" />
              <span>Project Version {preview.project.version}</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
            <div className="result-card">
              <div className="result-card-header">
                <span className="result-label">Subnets</span>
                <Layers className="w-4 h-4" style={{ color: 'var(--accent-cyan)' }} />
              </div>
              <div className="result-value">{preview.stats.subnet_count}</div>
              <div className="result-subtext">Configured ranges</div>
            </div>

            <div className="result-card">
              <div className="result-card-header">
                <span className="result-label">Devices</span>
                <Cpu className="w-4 h-4" style={{ color: 'var(--accent-indigo)' }} />
              </div>
              <div className="result-value">{preview.stats.device_count}</div>
              <div className="result-subtext">Documented hardware</div>
            </div>

            <div className="result-card">
              <div className="result-card-header">
                <span className="result-label">Allocated IPs</span>
                <Server className="w-4 h-4" style={{ color: 'var(--accent-purple)' }} />
              </div>
              <div className="result-value">{preview.stats.assignment_count}</div>
              <div className="result-subtext">Static & reserved hosts</div>
            </div>

            <div className="result-card">
              <div className="result-card-header">
                <span className="result-label">Audit Issues</span>
                {preview.stats.issue_count === 0 ? (
                  <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--accent-emerald)' }} />
                ) : (
                  <AlertTriangle className="w-4 h-4" style={{ color: 'var(--accent-amber)' }} />
                )}
              </div>
              <div className="result-value" style={{ color: preview.stats.issue_count === 0 ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>
                {preview.stats.issue_count}
              </div>
              <div className="result-subtext">
                {preview.stats.issue_count === 0 ? 'Fully compliant' : 'Diagnostics flagged'}
              </div>
            </div>
          </div>

          {/* Document Section Checklist */}
          <div style={{ 
            background: 'rgba(0, 0, 0, 0.3)', 
            padding: '1rem', 
            borderRadius: 'var(--radius-md)', 
            border: '1px solid var(--border-subtle)' 
          }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-white)', marginBottom: '0.5rem' }}>
              Included Technical Sections:
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle2 className="w-3.5 h-3.5" style={{ color: 'var(--accent-emerald)' }} />
                Executive Project Metadata & Date
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle2 className="w-3.5 h-3.5" style={{ color: 'var(--accent-emerald)' }} />
                Mandatory Live-Network Safety Notice
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle2 className="w-3.5 h-3.5" style={{ color: 'var(--accent-emerald)' }} />
                Subnet Allocations & CIDR Table
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle2 className="w-3.5 h-3.5" style={{ color: 'var(--accent-emerald)' }} />
                Hardware Inventory & Role Distribution
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle2 className="w-3.5 h-3.5" style={{ color: 'var(--accent-emerald)' }} />
                Complete IP Address Plan (Static / DHCP)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle2 className="w-3.5 h-3.5" style={{ color: 'var(--accent-emerald)' }} />
                Rule Validation & Audit Log
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

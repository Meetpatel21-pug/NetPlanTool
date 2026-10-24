import React, { useState, useEffect } from 'react';
import { calculateSubnet } from '../../api/calculator';
import { SubnetCalculateResponse } from '../../types/calculator';
import { 
  Calculator, 
  Copy, 
  Check, 
  AlertTriangle, 
  Info, 
  Network, 
  Layers, 
  ShieldCheck,
  Server,
  Sparkles
} from 'lucide-react';

export const SubnetCalculator: React.FC = () => {
  const [inputMode, setInputMode] = useState<'cidr' | 'split'>('cidr');
  const [cidrInput, setCidrInput] = useState<string>('192.168.20.0/26');
  const [ipInput, setIpInput] = useState<string>('192.168.20.0');
  const [prefixInput, setPrefixInput] = useState<number>(26);
  
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<SubnetCalculateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    showToast(`Copied ${label} to clipboard`);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const handleCalculate = async () => {
    setLoading(true);
    setError(null);
    try {
      let res: SubnetCalculateResponse;
      if (inputMode === 'cidr') {
        if (!cidrInput.trim()) {
          throw new Error('Please enter a valid CIDR notation (e.g. 192.168.20.0/26).');
        }
        res = await calculateSubnet({ cidr: cidrInput.trim() });
      } else {
        if (!ipInput.trim()) {
          throw new Error('Please enter an IPv4 address.');
        }
        res = await calculateSubnet({ ip: ipInput.trim(), prefix: prefixInput });
      }
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Subnet calculation failed.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleCalculate();
  }, []);

  const loadPreset = (cidr: string) => {
    setInputMode('cidr');
    setCidrInput(cidr);
    setError(null);
    setLoading(true);
    calculateSubnet({ cidr })
      .then(res => setResult(res))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  return (
    <div className="calculator-wrapper">
      <div className="page-header">
        <h1 className="page-title">
          <Calculator className="w-8 h-8 text-cyan-400" />
          IPv4 Subnet Calculator
        </h1>
        <p className="page-description">
          Deterministic calculation engine conforming to RFC standards. Supports conventional /0–/30 subnets,
          RFC 3021 /31 point-to-point links (2 usable addresses, no broadcast), and /32 single host endpoints.
        </p>
      </div>

      <div className="grid-2">
        {/* Left Column: Input Form & Presets */}
        <div className="glass-panel">
          <div className="card-title">
            <Network className="w-5 h-5 text-cyan-400" />
            Subnet Parameters
          </div>
          <div className="card-subtitle">
            Calculate from CIDR notation or separate IP and prefix length.
          </div>

          {/* Mode Switcher */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <button
              type="button"
              className={inputMode === 'cidr' ? 'btn-primary' : 'btn-secondary'}
              style={{ width: 'auto', padding: '0.45rem 1rem' }}
              onClick={() => setInputMode('cidr')}
            >
              CIDR Notation
            </button>
            <button
              type="button"
              className={inputMode === 'split' ? 'btn-primary' : 'btn-secondary'}
              style={{ width: 'auto', padding: '0.45rem 1rem' }}
              onClick={() => setInputMode('split')}
            >
              IP + Prefix Length
            </button>
          </div>

          {inputMode === 'cidr' ? (
            <div className="form-group">
              <label htmlFor="cidr-input" className="form-label">
                CIDR Block or Host Address
              </label>
              <input
                id="cidr-input"
                type="text"
                className="text-input"
                placeholder="e.g. 192.168.20.0/26 or 192.168.20.55/26"
                value={cidrInput}
                onChange={(e) => setCidrInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCalculate()}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem', display: 'block' }}>
                Tip: Arbitrary host addresses (e.g. 192.168.20.55/26) will be normalized to their network boundary.
              </span>
            </div>
          ) : (
            <div className="input-row" style={{ marginBottom: '1.25rem' }}>
              <div style={{ flex: 2 }}>
                <label htmlFor="ip-input" className="form-label">IPv4 Address</label>
                <input
                  id="ip-input"
                  type="text"
                  className="text-input"
                  placeholder="e.g. 192.168.20.0"
                  value={ipInput}
                  onChange={(e) => setIpInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCalculate()}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="prefix-select" className="form-label">Prefix (/)</label>
                <select
                  id="prefix-select"
                  className="select-input"
                  value={prefixInput}
                  onChange={(e) => setPrefixInput(Number(e.target.value))}
                >
                  {Array.from({ length: 33 }, (_, i) => 32 - i).map((p) => (
                    <option key={p} value={p}>
                      /{p} {p === 31 ? '(RFC 3021)' : p === 32 ? '(Host)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Quick Presets */}
          <div style={{ marginTop: '1rem', marginBottom: '1.5rem' }}>
            <span className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Quick RFC & Proposal Presets:
            </span>
            <div className="preset-row">
              <button 
                type="button"
                className="preset-chip" 
                onClick={() => loadPreset('192.168.20.0/26')}
              >
                192.168.20.0/26 (Proposal Vector)
              </button>
              <button 
                type="button"
                className="preset-chip" 
                onClick={() => loadPreset('192.168.20.55/26')}
              >
                192.168.20.55/26 (Unnormalized Host)
              </button>
              <button 
                type="button"
                className="preset-chip" 
                onClick={() => loadPreset('10.0.0.0/31')}
              >
                10.0.0.0/31 (RFC 3021 P2P)
              </button>
              <button 
                type="button"
                className="preset-chip" 
                onClick={() => loadPreset('172.16.50.1/32')}
              >
                172.16.50.1/32 (Single Host)
              </button>
              <button 
                type="button"
                className="preset-chip" 
                onClick={() => loadPreset('10.1.1.0/30')}
              >
                10.1.1.0/30 (Point-to-Point)
              </button>
              <button 
                type="button"
                className="preset-chip" 
                onClick={() => loadPreset('192.168.1.0/24')}
              >
                192.168.1.0/24 (Standard /24)
              </button>
            </div>
          </div>

          <button
            id="calculate-btn"
            type="button"
            className="btn-primary"
            onClick={handleCalculate}
            disabled={loading}
          >
            {loading ? 'Calculating...' : 'Calculate Subnet'}
          </button>

          {error && (
            <div className="notice-box error" role="alert">
              <div className="notice-title">
                <AlertTriangle className="w-4 h-4" />
                Calculation Error
              </div>
              <div>{error}</div>
            </div>
          )}

          {/* RFC Subnet Rules Reference Guide */}
          <div className="notice-box" style={{ marginTop: '1.5rem' }}>
            <div className="notice-title">
              <Info className="w-4 h-4 text-cyan-400" />
              Subnet Usability Conventions
            </div>
            <ul style={{ paddingLeft: '1.25rem', marginTop: '0.4rem', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
              <li><strong>/0 to /30:</strong> Conventional subnets reserve the network ID (first address) and broadcast address (last address). Usable hosts = Total - 2.</li>
              <li><strong>/31 (RFC 3021):</strong> Point-to-point links where both addresses are usable host endpoints with no dedicated network or broadcast address.</li>
              <li><strong>/32:</strong> Single host endpoint or loopback. 1 usable address with no network/broadcast overhead.</li>
            </ul>
          </div>
        </div>

        {/* Right Column: Calculated Results */}
        <div className="glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <div className="card-title">
              <Layers className="w-5 h-5 text-cyan-400" />
              Calculated Subnet Results
            </div>
            {result && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  const summary = `CIDR: ${result.cidr}\nNetmask: ${result.netmask}\nNetwork: ${result.network_address}\nBroadcast: ${result.broadcast_address || 'None'}\nUsable Range: ${result.usable_range}\nTotal: ${result.total_addresses}\nUsable: ${result.usable_addresses}`;
                  copyToClipboard(summary, 'All Results');
                }}
              >
                <Copy className="w-3.5 h-3.5" />
                Copy All
              </button>
            )}
          </div>
          <div className="card-subtitle">
            Exact network boundaries, capacity, and usable address assignments.
          </div>

          {result ? (
            <div>
              {/* Special Convention Banner */}
              <div 
                style={{ 
                  background: result.prefix >= 31 ? 'rgba(99, 102, 241, 0.12)' : 'rgba(56, 189, 248, 0.08)',
                  border: `1px solid ${result.prefix >= 31 ? 'rgba(99, 102, 241, 0.3)' : 'rgba(56, 189, 248, 0.2)'}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem 1rem',
                  fontSize: '0.825rem',
                  color: 'var(--text-primary)',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <ShieldCheck className="w-4 h-4 text-cyan-400" style={{ flexShrink: 0 }} />
                <span>{result.special_notes}</span>
              </div>

              {/* Grid of Metric Cards */}
              <div className="results-grid">
                {/* Normalized CIDR */}
                <div className="result-card">
                  <div className="result-card-header">
                    <span className="result-label">Normalized CIDR</span>
                    <button 
                      type="button"
                      className="copy-btn" 
                      onClick={() => copyToClipboard(result.cidr, 'CIDR')}
                      title="Copy CIDR"
                    >
                      {copiedField === 'CIDR' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="result-value accent">{result.cidr}</div>
                  <div className="result-subtext">{result.is_private ? 'RFC 1918 Private Block' : 'Public IPv4 Block'}</div>
                </div>

                {/* Subnet Mask */}
                <div className="result-card">
                  <div className="result-card-header">
                    <span className="result-label">Subnet Mask</span>
                    <button 
                      type="button"
                      className="copy-btn" 
                      onClick={() => copyToClipboard(result.netmask, 'Netmask')}
                      title="Copy Subnet Mask"
                    >
                      {copiedField === 'Netmask' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="result-value">{result.netmask}</div>
                  <div className="result-subtext">Wildcard: {result.wildcard_mask}</div>
                </div>

                {/* Network Address */}
                <div className="result-card">
                  <div className="result-card-header">
                    <span className="result-label">Network Address</span>
                    <button 
                      type="button"
                      className="copy-btn" 
                      onClick={() => copyToClipboard(result.network_address, 'Network Address')}
                      title="Copy Network Address"
                    >
                      {copiedField === 'Network Address' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="result-value">{result.network_address}</div>
                  <div className="result-subtext">First address in block</div>
                </div>

                {/* Broadcast Address */}
                <div className="result-card">
                  <div className="result-card-header">
                    <span className="result-label">Broadcast Address</span>
                    {result.broadcast_address && (
                      <button 
                        type="button"
                        className="copy-btn" 
                        onClick={() => copyToClipboard(result.broadcast_address!, 'Broadcast Address')}
                        title="Copy Broadcast Address"
                      >
                        {copiedField === 'Broadcast Address' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                  <div className="result-value">
                    {result.broadcast_address || (
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>None (Special Prefix)</span>
                    )}
                  </div>
                  <div className="result-subtext">
                    {result.broadcast_address ? 'Last address in block' : 'Excluded per RFC rule'}
                  </div>
                </div>

                {/* Usable Range */}
                <div className="result-card" style={{ gridColumn: '1 / -1' }}>
                  <div className="result-card-header">
                    <span className="result-label">Usable Host Range</span>
                    <button 
                      type="button"
                      className="copy-btn" 
                      onClick={() => copyToClipboard(result.usable_range, 'Usable Range')}
                      title="Copy Usable Range"
                    >
                      {copiedField === 'Usable Range' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="result-value success">{result.usable_range}</div>
                  <div className="result-subtext">
                    {result.usable_range_start && result.usable_range_end 
                      ? `${result.usable_range_start} through ${result.usable_range_end}`
                      : 'Single host'}
                  </div>
                </div>

                {/* Total vs Usable Capacity */}
                <div className="result-card">
                  <div className="result-card-header">
                    <span className="result-label">Total Addresses</span>
                  </div>
                  <div className="result-value">{result.total_addresses.toLocaleString()}</div>
                  <div className="result-subtext">2^{result.host_bits} addresses</div>
                </div>

                <div className="result-card">
                  <div className="result-card-header">
                    <span className="result-label">Usable Host Capacity</span>
                  </div>
                  <div className="result-value success">{result.usable_addresses.toLocaleString()}</div>
                  <div className="result-subtext">
                    {result.prefix <= 30 ? 'Total - 2 (network/bcast)' : 'Special prefix convention'}
                  </div>
                </div>
              </div>

              {/* Binary Bitmask Breakdown */}
              <div className="binary-container">
                <div className="binary-title">
                  <span>Binary Bitmask Breakdown</span>
                  <div className="bit-legend">
                    <span className="bit-legend-item">
                      <span className="dot-network"></span> {result.network_bits} Network Bits
                    </span>
                    <span className="bit-legend-item">
                      <span className="dot-host"></span> {result.host_bits} Host Bits
                    </span>
                  </div>
                </div>
                <div style={{ marginBottom: '0.65rem' }}>
                  <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                    Netmask in Binary:
                  </span>
                  <div className="binary-code">{result.binary_netmask}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                    Network Address in Binary:
                  </span>
                  <div className="binary-code" style={{ color: 'var(--accent-purple)' }}>
                    {result.binary_network}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <Server className="w-12 h-12 mx-auto mb-3 opacity-40 text-cyan-400" />
              <p>Enter an IPv4 block or select a preset to see instant subnet calculations.</p>
            </div>
          )}
        </div>
      </div>

      {/* Floating Toast Feedback */}
      {toastMessage && (
        <div className="toast" role="status">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

import { useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import ResourceLinks from '../components/ResourceLinks';
import './ToolPage.css';

const BASES = [
  { id: 'dec', label: 'Decimal', base: 10, prefix: '', placeholder: '255' },
  { id: 'hex', label: 'Hex', base: 16, prefix: '0x', placeholder: 'FF' },
  { id: 'oct', label: 'Octal', base: 8, prefix: '0o', placeholder: '377' },
  { id: 'bin', label: 'Binary', base: 2, prefix: '0b', placeholder: '11111111' },
];

const examples = [
  { label: '255', dec: 255 },
  { label: '1024', dec: 1024 },
  { label: '65535', dec: 65535 },
  { label: '42', dec: 42 },
];

const resources = [
  { title: 'Numeral Systems (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Numeral_system' },
  { title: 'MDN: parseInt()', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/parseInt' },
];

export default function NumberBaseConverter() {
  const [values, setValues] = useLocalStorage('number_base_values', { dec: '', hex: '', oct: '', bin: '' });
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');

  const updateAll = (decNum) => {
    if (decNum === null || decNum === undefined || isNaN(decNum) || !isFinite(decNum)) {
      setValues({ dec: '', hex: '', oct: '', bin: '' });
      return;
    }
    setValues({
      dec: decNum.toString(10),
      hex: decNum.toString(16).toUpperCase(),
      oct: decNum.toString(8),
      bin: decNum.toString(2),
    });
    setError('');
  };

  const handleChange = (baseId, raw) => {
    const baseInfo = BASES.find(b => b.id === baseId);
    // Allow negative sign only for decimal
    const cleaned = raw.trim().replace(/^(0x|0o|0b)/i, '');
    if (cleaned === '' || cleaned === '-') {
      setValues(prev => ({ ...prev, [baseId]: raw }));
      if (cleaned === '') {
        setValues({ dec: '', hex: '', oct: '', bin: '' });
      }
      setError('');
      return;
    }
    const num = parseInt(cleaned, baseInfo.base);
    if (isNaN(num)) {
      setValues(prev => ({ ...prev, [baseId]: raw }));
      setError(`Invalid ${baseInfo.label} input.`);
      return;
    }
    setError('');
    updateAll(num);
  };

  const handleExample = (dec) => {
    updateAll(dec);
  };

  const handleCopy = (id, val) => {
    navigator.clipboard.writeText(val);
    setCopied(id);
    setTimeout(() => setCopied(''), 1600);
  };

  return (
    <div className="tool-page h-full flex flex-col overflow-y-auto">
      <header className="tool-header">
        <div>
          <h2>Number Base Converter</h2>
          <p>Instantly convert numbers between Decimal, Hexadecimal, Octal, and Binary — type in any field.</p>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginRight: 4 }}>Quick:</span>
          {examples.map(ex => (
            <button
              key={ex.label}
              className="secondary-button"
              style={{ padding: '4px 10px', fontSize: '0.8rem' }}
              onClick={() => handleExample(ex.dec)}
            >
              {ex.label}
            </button>
          ))}
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, flex: 1, alignContent: 'start' }}>
        {BASES.map(b => (
          <div key={b.id} className="glass-panel" style={{ borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{b.label} <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.78rem' }}>base {b.base}</span></span>
              <button
                style={{ fontSize: '0.75rem', padding: '3px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-light)', color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.15s' }}
                onClick={() => handleCopy(b.id, values[b.id])}
              >
                {copied === b.id ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            <div style={{ padding: '16px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginBottom: 6, fontFamily: 'var(--font-mono)' }}>{b.prefix || '(no prefix)'}</div>
              <input
                type="text"
                value={values[b.id]}
                onChange={e => handleChange(b.id, e.target.value)}
                placeholder={b.placeholder}
                spellCheck={false}
                style={{
                  width: '100%',
                  background: 'rgba(0,0,0,0.2)',
                  border: '1.5px solid var(--border-light)',
                  borderRadius: 8,
                  padding: '10px 14px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '1.05rem',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => (e.target.style.borderColor = 'var(--accent-primary)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border-light)')}
              />
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div style={{ padding: '8px 16px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--accent-error)', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      <div style={{ marginTop: 8 }}>
        <div className="glass-panel" style={{ borderRadius: 12, padding: '14px 18px', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>💡 <strong style={{ color: 'var(--text-secondary)' }}>Tip:</strong> Type any value in any field — all others update instantly.</span>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Supports integers from 0 to 2<sup>53</sup>−1 (JavaScript safe integer range).</span>
        </div>
      </div>

      <ResourceLinks links={resources} />
    </div>
  );
}

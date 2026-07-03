import { useMemo, useState } from 'react';
import ResourceLinks from '../components/ResourceLinks';
import './ToolPage.css';

function toDateFromUnix(value) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const numeric = Number(trimmed);
  if (Number.isNaN(numeric)) return null;

  const ms = trimmed.length <= 10 ? numeric * 1000 : numeric;
  const date = new Date(ms);
  return Number.isNaN(date.getTime()) ? null : date;
}

export default function TimestampConverter() {
  const [unixInput, setUnixInput] = useState('');
  const [dateInput, setDateInput] = useState('');

  const unixToDate = useMemo(() => {
    const parsed = toDateFromUnix(unixInput);
    if (!unixInput.trim()) return { ok: false, message: '' };
    if (!parsed) return { ok: false, message: 'Invalid Unix timestamp.' };

    return {
      ok: true,
      iso: parsed.toISOString(),
      local: parsed.toLocaleString(),
      utc: parsed.toUTCString()
    };
  }, [unixInput]);

  const dateToUnix = useMemo(() => {
    if (!dateInput.trim()) return { ok: false, message: '' };

    const parsed = new Date(dateInput);
    if (Number.isNaN(parsed.getTime())) {
      return { ok: false, message: 'Invalid date/time input.' };
    }

    return {
      ok: true,
      seconds: Math.floor(parsed.getTime() / 1000),
      milliseconds: parsed.getTime()
    };
  }, [dateInput]);

  const now = () => {
    const currentMs = Date.now();
    const currentDate = new Date(currentMs);
    setUnixInput(String(currentMs));
    setDateInput(currentDate.toISOString());
  };

  const resources = [
    { title: 'Unix Time Reference', url: 'https://www.unixtimestamp.com/' },
    { title: 'MDN: Date', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date' }
  ];

  return (
    <div className="tool-page h-full flex flex-col overflow-y-auto">
      <header className="tool-header">
        <div>
          <h2>Timestamp Converter</h2>
          <p>Convert Unix timestamps and human-readable dates in both directions.</p>
        </div>
        <div className="flex gap-2">
          <button className="primary-button" onClick={now}>Use Current Time</button>
        </div>
      </header>

      <div className="split-view flex-1">
        <div className="split-panel glass-panel">
          <div className="panel-header">Unix Timestamp to Date</div>
          <div className="p-4 flex flex-col gap-4">
            <input
              type="text"
              className="code-textarea"
              style={{ minHeight: '52px', borderBottom: '1px solid var(--border-light)' }}
              value={unixInput}
              onChange={(e) => setUnixInput(e.target.value)}
              placeholder="Enter Unix seconds or milliseconds..."
            />
            {unixToDate.ok ? (
              <div className="text-sm flex flex-col gap-2 text-[var(--text-secondary)]">
                <div><strong style={{ color: 'var(--text-primary)' }}>ISO:</strong> {unixToDate.iso}</div>
                <div><strong style={{ color: 'var(--text-primary)' }}>Local:</strong> {unixToDate.local}</div>
                <div><strong style={{ color: 'var(--text-primary)' }}>UTC:</strong> {unixToDate.utc}</div>
              </div>
            ) : (
              <div className="text-sm" style={{ color: 'var(--accent-error)' }}>{unixToDate.message}</div>
            )}
          </div>
        </div>

        <div className="split-panel glass-panel">
          <div className="panel-header">Date to Unix Timestamp</div>
          <div className="p-4 flex flex-col gap-4">
            <input
              type="text"
              className="code-textarea"
              style={{ minHeight: '52px', borderBottom: '1px solid var(--border-light)' }}
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
              placeholder="Enter date (e.g., 2026-03-13T10:30:00Z)"
            />
            {dateToUnix.ok ? (
              <div className="text-sm flex flex-col gap-2 text-[var(--text-secondary)]">
                <div><strong style={{ color: 'var(--text-primary)' }}>Seconds:</strong> {dateToUnix.seconds}</div>
                <div><strong style={{ color: 'var(--text-primary)' }}>Milliseconds:</strong> {dateToUnix.milliseconds}</div>
              </div>
            ) : (
              <div className="text-sm" style={{ color: 'var(--accent-error)' }}>{dateToUnix.message}</div>
            )}
          </div>
        </div>
      </div>

      <ResourceLinks links={resources} />
    </div>
  );
}

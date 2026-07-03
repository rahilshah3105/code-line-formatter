import { useState, useMemo } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import ResourceLinks from '../components/ResourceLinks';
import './ToolPage.css';

// ─── helpers ──────────────────────────────────────────────────────────────────
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function fieldDesc(val, unit, names = null) {
  if (val === '*') return `every ${unit}`;
  if (val.includes('/')) {
    const [range, step] = val.split('/');
    const from = range === '*' ? `0` : range;
    return `every ${step} ${unit}s (starting ${from})`;
  }
  if (val.includes('-')) {
    const [from, to] = val.split('-');
    const f = names ? names[+from] || from : from;
    const t = names ? names[+to] || to : to;
    return `${f} through ${t}`;
  }
  if (val.includes(',')) {
    const parts = val.split(',').map(v => names ? (names[+v] || v) : v);
    return parts.join(', ');
  }
  return names ? (names[+val] || val) : val;
}

function explainCron(expr) {
  const parts = expr.trim().split(/\s+/);
  if (parts.length < 5 || parts.length > 6) {
    return { error: `Expected 5 or 6 fields, got ${parts.length}.` };
  }

  const [min, hour, dom, month, dow] = parts;
  const desc = {
    minute: fieldDesc(min, 'minute'),
    hour: fieldDesc(hour, 'hour'),
    dom: fieldDesc(dom, 'day of month'),
    month: fieldDesc(month, 'month', MONTHS),
    dow: fieldDesc(dow, 'weekday', DAYS),
  };

  // Simple English sentence
  let sentence = 'Runs ';
  sentence += desc.minute === 'every minute' ? 'every minute' : `at minute ${min}`;
  if (hour !== '*') {
    sentence += `, hour ${hour}`;
  }
  if (dom !== '*') sentence += `, on day ${dom} of the month`;
  if (month !== '*') sentence += `, in ${fieldDesc(month, '', MONTHS)}`;
  if (dow !== '*') sentence += `, on ${fieldDesc(dow, '', DAYS)}`;

  return { desc, sentence };
}

function getNextRuns(expr, count = 5) {
  const parts = expr.trim().split(/\s+/);
  if (parts.length < 5) return [];
  const [min, hour, dom, month, dow] = parts;

  const matches = (val, n, names = null) => {
    if (val === '*') return true;
    const nums = val.split(',').flatMap(p => {
      if (p.includes('/')) {
        const [range, step] = p.split('/');
        const start = range === '*' ? 0 : +range;
        const result = [];
        for (let i = start; i <= (names ? names.length - 1 : 59); i += +step) result.push(i);
        return result;
      }
      if (p.includes('-')) {
        const [from, to] = p.split('-').map(Number);
        return Array.from({ length: to - from + 1 }, (_, i) => from + i);
      }
      return [parseInt(p)];
    });
    return nums.includes(n);
  };

  const results = [];
  let cursor = new Date();
  cursor.setSeconds(0, 0);
  cursor.setMinutes(cursor.getMinutes() + 1);

  let limit = 0;
  while (results.length < count && limit < 200000) {
    limit++;
    const m = cursor.getMinutes();
    const h = cursor.getHours();
    const d = cursor.getDate();
    const mo = cursor.getMonth() + 1; // 1-based
    const dw = cursor.getDay();

    if (
      matches(min, m) &&
      matches(hour, h) &&
      matches(dom, d) &&
      matches(month, mo, MONTHS) &&
      matches(dow, dw, DAYS)
    ) {
      results.push(new Date(cursor));
    }

    cursor = new Date(cursor.getTime() + 60 * 1000);
  }
  return results;
}

const PRESETS = [
  { label: 'Every minute', value: '* * * * *' },
  { label: 'Every hour', value: '0 * * * *' },
  { label: 'Daily at midnight', value: '0 0 * * *' },
  { label: 'Daily at 9 AM', value: '0 9 * * *' },
  { label: 'Every Sunday', value: '0 0 * * 0' },
  { label: 'Every weekday 9 AM', value: '0 9 * * 1-5' },
  { label: '1st of every month', value: '0 0 1 * *' },
  { label: 'Every 15 minutes', value: '*/15 * * * *' },
];

const resources = [
  { title: 'Cron Expression Reference', url: 'https://crontab.guru/' },
  { title: 'Wikipedia: Cron', url: 'https://en.wikipedia.org/wiki/Cron' },
];

const FIELD_LABELS = ['Minute', 'Hour', 'Day (Month)', 'Month', 'Weekday'];

export default function CronExplainer() {
  const [expr, setExpr] = useLocalStorage('cron_expr', '0 9 * * 1-5');
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    if (!expr.trim()) return null;
    try { return explainCron(expr); } catch { return { error: 'Parse error.' }; }
  }, [expr]);

  const nextRuns = useMemo(() => {
    if (!expr.trim() || result?.error) return [];
    try { return getNextRuns(expr); } catch { return []; }
  }, [expr, result]);

  const parts = expr.trim().split(/\s+/);

  const handleCopy = () => {
    navigator.clipboard.writeText(expr.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="tool-page h-full flex flex-col overflow-y-auto">
      <header className="tool-header">
        <div>
          <h2>Cron Explainer</h2>
          <p>Parse any cron expression into plain English and preview next scheduled run times.</p>
        </div>
        <button className="secondary-button" onClick={handleCopy}>{copied ? '✓ Copied!' : 'Copy Expression'}</button>
      </header>

      {/* Presets */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {PRESETS.map(p => (
          <button
            key={p.value}
            onClick={() => setExpr(p.value)}
            style={{
              padding: '5px 12px', borderRadius: 8, fontSize: '0.8rem', fontWeight: 500,
              border: expr === p.value ? '1.5px solid var(--accent-primary)' : '1.5px solid var(--border-light)',
              background: expr === p.value ? 'rgba(59,130,246,0.12)' : 'rgba(128,128,128,0.07)',
              color: expr === p.value ? 'var(--accent-primary)' : 'var(--text-secondary)',
              cursor: 'pointer', transition: 'all 0.18s',
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Big Input */}
      <div className="glass-panel" style={{ borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Cron:</span>
        <input
          type="text"
          value={expr}
          onChange={e => setExpr(e.target.value)}
          placeholder="e.g. 0 9 * * 1-5"
          spellCheck={false}
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            fontFamily: 'var(--font-mono)', fontSize: '1.25rem', fontWeight: 600,
            color: 'var(--text-primary)', letterSpacing: '0.06em',
          }}
        />
      </div>

      {/* Field Breakdown */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {FIELD_LABELS.map((label, i) => (
          <div key={label} className="glass-panel" style={{ borderRadius: 10, padding: '10px 16px', flex: '1 1 120px', minWidth: 110 }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{label}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', color: 'var(--accent-primary)', fontWeight: 700 }}>
              {parts[i] || '?'}
            </div>
          </div>
        ))}
      </div>

      {result?.error ? (
        <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--accent-error)' }}>
          {result.error}
        </div>
      ) : result ? (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', flex: 1, alignContent: 'start' }}>
          {/* Human description */}
          <div className="glass-panel" style={{ borderRadius: 12, padding: '20px', flex: '1 1 300px' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Human Readable</div>
            <div style={{ fontSize: '1rem', color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: 16 }}>
              🕐 <strong>{result.sentence}</strong>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <tbody>
                {Object.entries(result.desc).map(([field, text]) => (
                  <tr key={field} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '6px 0', color: 'var(--text-muted)', textTransform: 'capitalize', paddingRight: 20, fontWeight: 600 }}>{field.replace('dow', 'weekday').replace('dom', 'day of month')}</td>
                    <td style={{ padding: '6px 0', color: 'var(--text-secondary)' }}>{text}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Next runs */}
          <div className="glass-panel" style={{ borderRadius: 12, padding: '20px', flex: '1 1 260px' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Next 5 Runs</div>
            {nextRuns.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.85rem' }}>Could not compute next runs.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {nextRuns.map((d, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '0.7rem', background: 'rgba(59,130,246,0.12)', color: 'var(--accent-primary)', borderRadius: 6, padding: '2px 7px', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>#{i + 1}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                      {d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} at {d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}

      <ResourceLinks links={resources} />
    </div>
  );
}

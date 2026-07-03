import { useState, useMemo } from 'react';
import { Copy, Check } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import ResourceLinks from '../components/ResourceLinks';
import './ToolPage.css';

// ─── Deep diff engine ────────────────────────────────────────────────────────

const ADDED = 'added';
const REMOVED = 'removed';
const CHANGED = 'changed';
const EQUAL = 'equal';
const NESTED = 'nested';

function deepDiff(left, right, path = '') {
  const results = [];

  // Both are objects (non-array)
  if (
    left !== null && right !== null &&
    typeof left === 'object' && typeof right === 'object' &&
    !Array.isArray(left) && !Array.isArray(right)
  ) {
    const allKeys = new Set([...Object.keys(left), ...Object.keys(right)]);
    for (const key of allKeys) {
      const childPath = path ? `${path}.${key}` : key;
      if (!(key in left)) {
        results.push({ path: childPath, type: ADDED, right: right[key] });
      } else if (!(key in right)) {
        results.push({ path: childPath, type: REMOVED, left: left[key] });
      } else {
        const children = deepDiff(left[key], right[key], childPath);
        if (children.length === 0) {
          results.push({ path: childPath, type: EQUAL, left: left[key] });
        } else {
          results.push({ path: childPath, type: NESTED, children });
        }
      }
    }
    return results;
  }

  // Both are arrays
  if (Array.isArray(left) && Array.isArray(right)) {
    const len = Math.max(left.length, right.length);
    for (let i = 0; i < len; i++) {
      const childPath = `${path}[${i}]`;
      if (i >= right.length) {
        results.push({ path: childPath, type: REMOVED, left: left[i] });
      } else if (i >= left.length) {
        results.push({ path: childPath, type: ADDED, right: right[i] });
      } else {
        const children = deepDiff(left[i], right[i], childPath);
        if (children.length === 0) {
          results.push({ path: childPath, type: EQUAL, left: left[i] });
        } else {
          results.push({ path: childPath, type: NESTED, children });
        }
      }
    }
    return results;
  }

  // Primitives / type mismatch
  if (JSON.stringify(left) !== JSON.stringify(right)) {
    results.push({ path, type: CHANGED, left, right });
  }
  return results;
}

function countChanges(diffs) {
  let added = 0, removed = 0, changed = 0;
  const walk = (items) => {
    for (const d of items) {
      if (d.type === ADDED) added++;
      else if (d.type === REMOVED) removed++;
      else if (d.type === CHANGED) changed++;
      else if (d.type === NESTED) walk(d.children);
    }
  };
  walk(diffs);
  return { added, removed, changed };
}

// ─── Rendering diff tree ─────────────────────────────────────────────────────

const TYPE_COLORS = {
  [ADDED]: { bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.3)', text: '#10b981', badge: 'ADDED', icon: '+' },
  [REMOVED]: { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.3)', text: '#ef4444', badge: 'REMOVED', icon: '-' },
  [CHANGED]: { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.3)', text: '#f59e0b', badge: 'CHANGED', icon: '~' },
  [EQUAL]: { bg: 'transparent', border: 'transparent', text: 'var(--text-muted)', badge: null, icon: '=' },
  [NESTED]: { bg: 'transparent', border: 'transparent', text: 'var(--text-secondary)', badge: null, icon: '▸' },
};

function valuePreview(v) {
  if (v === null) return <span style={{ color: '#f87171' }}>null</span>;
  if (typeof v === 'boolean') return <span style={{ color: '#fb923c' }}>{String(v)}</span>;
  if (typeof v === 'number') return <span style={{ color: '#60a5fa' }}>{v}</span>;
  if (typeof v === 'string') return <span style={{ color: '#4ade80' }}>"{v.length > 60 ? v.slice(0, 60) + '…' : v}"</span>;
  if (Array.isArray(v)) return <span style={{ color: 'var(--text-muted)' }}>[Array({v.length})]</span>;
  if (typeof v === 'object') return <span style={{ color: 'var(--text-muted)' }}>{'{'}Object({Object.keys(v).length}){'}'}</span>;
  return <span>{String(v)}</span>;
}

function DiffRow({ node, depth = 0, showEqual }) {
  const [open, setOpen] = useState(true);
  const c = TYPE_COLORS[node.type];
  const indent = depth * 18;

  if (node.type === EQUAL && !showEqual) return null;

  const keyLabel = node.path.split('.').pop().replace(/\[\d+\]$/, (m) => m);

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          padding: '4px 12px 4px 0',
          paddingLeft: indent + 12,
          background: c.bg,
          borderLeft: node.type !== EQUAL && node.type !== NESTED ? `3px solid ${c.border}` : '3px solid transparent',
          marginLeft: 0,
          gap: 8,
          cursor: node.type === NESTED ? 'pointer' : 'default',
          borderRadius: 4,
          transition: 'background 0.15s',
        }}
        onClick={() => node.type === NESTED && setOpen(o => !o)}
      >
        {/* Icon */}
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: c.text, width: 14, flexShrink: 0, marginTop: 2, fontWeight: 700 }}>
          {node.type === NESTED ? (open ? '▾' : '▸') : c.icon}
        </span>

        {/* Key */}
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#c084fc', flexShrink: 0 }}>
          {keyLabel}
          {node.type !== NESTED && <span style={{ color: 'var(--text-muted)' }}>: </span>}
        </span>

        {/* Values */}
        {node.type === CHANGED && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ textDecoration: 'line-through', opacity: 0.6, color: '#ef4444' }}>{valuePreview(node.left)}</span>
            <span style={{ color: 'var(--text-muted)' }}>→</span>
            <span style={{ color: '#10b981' }}>{valuePreview(node.right)}</span>
          </span>
        )}
        {node.type === REMOVED && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', opacity: 0.7, color: '#ef4444', textDecoration: 'line-through' }}>
            {valuePreview(node.left)}
          </span>
        )}
        {node.type === ADDED && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#10b981' }}>
            {valuePreview(node.right)}
          </span>
        )}
        {node.type === EQUAL && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)', opacity: 0.65 }}>
            {valuePreview(node.left)}
          </span>
        )}
        {node.type === NESTED && (
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
            {node.children.length} field{node.children.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>
      {node.type === NESTED && open && node.children.map((child, i) => (
        <DiffRow key={i} node={child} depth={depth + 1} showEqual={showEqual} />
      ))}
    </>
  );
}

// ─── Sample data ─────────────────────────────────────────────────────────────

const SAMPLE_LEFT = JSON.stringify({
  id: 1,
  name: "Priya Sharma",
  email: "priya.sharma@example.com",
  role: "admin",
  age: 28,
  active: true,
  address: {
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400001"
  },
  tags: ["react", "typescript"],
  score: 95
}, null, 2);

const SAMPLE_RIGHT = JSON.stringify({
  id: 1,
  name: "Priya Sharma",
  email: "priya.s@company.in",
  role: "superadmin",
  age: 29,
  active: false,
  address: {
    city: "Pune",
    state: "Maharashtra",
    pincode: "411001"
  },
  tags: ["react", "typescript", "node"],
  score: 98,
  department: "Engineering"
}, null, 2);

// ─── Main Component ───────────────────────────────────────────────────────────

const resources = [
  { title: 'RFC 8259 – JSON Standard', url: 'https://www.rfc-editor.org/rfc/rfc8259' },
  { title: 'Understanding JSON Diff', url: 'https://jsondiff.com/' },
];

export default function JsonCompare() {
  const [leftInput, setLeftInput] = useLocalStorage('json_compare_left', SAMPLE_LEFT);
  const [rightInput, setRightInput] = useLocalStorage('json_compare_right', SAMPLE_RIGHT);
  const [leftError, setLeftError] = useState('');
  const [rightError, setRightError] = useState('');
  const [showEqual, setShowEqual] = useLocalStorage('json_compare_show_equal', false);
  const [view, setView] = useLocalStorage('json_compare_view', 'tree'); // 'tree' | 'sidebyside'
  const [diffDone, setDiffDone] = useState(true);
  const [copiedPanel, setCopiedPanel] = useState(null);

  const { diffs, stats } = useMemo(() => {
    let leftParsed = null, rightParsed = null;
    let le = '', re = '';
    try { leftParsed = JSON.parse(leftInput); } catch (e) { le = e.message; }
    try { rightParsed = JSON.parse(rightInput); } catch (e) { re = e.message; }
    setLeftError(le);
    setRightError(re);
    if (leftParsed === null || rightParsed === null) return { diffs: [], stats: null };
    const d = deepDiff(leftParsed, rightParsed);
    return { diffs: d, stats: countChanges(d) };
  }, [leftInput, rightInput]);

  const identical = diffs.length === 0 || (stats && stats.added === 0 && stats.removed === 0 && stats.changed === 0);
  const hasErrors = !!leftError || !!rightError;

  const handleSwap = () => {
    setLeftInput(rightInput);
    setRightInput(leftInput);
  };

  const handleClear = () => {
    setLeftInput('');
    setRightInput('');
  };

  const handleLoadSample = () => {
    setLeftInput(SAMPLE_LEFT);
    setRightInput(SAMPLE_RIGHT);
  };

  const copyPanel = (text, panel) => {
    navigator.clipboard.writeText(text);
    setCopiedPanel(panel);
    setTimeout(() => setCopiedPanel(null), 2000);
  };

  // Side-by-side line diff
  const sideBySide = useMemo(() => {
    const leftLines = leftInput.split('\n');
    const rightLines = rightInput.split('\n');
    const len = Math.max(leftLines.length, rightLines.length);
    return Array.from({ length: len }, (_, i) => ({
      left: leftLines[i] ?? '',
      right: rightLines[i] ?? '',
      diff: (leftLines[i] ?? '') !== (rightLines[i] ?? ''),
    }));
  }, [leftInput, rightInput]);

  return (
    <div className="tool-page h-full flex flex-col overflow-y-auto" style={{ gap: 14 }}>
      <header className="tool-header">
        <div>
          <h2>JSON Compare</h2>
          <p>Paste two JSON objects and see a detailed structural diff — added, removed, and changed fields highlighted.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <button className="secondary-button" onClick={handleLoadSample} style={{ fontSize: '0.82rem', padding: '6px 12px' }}>Load Sample</button>
          <button className="secondary-button" onClick={handleSwap} style={{ fontSize: '0.82rem', padding: '6px 12px' }}>⇄ Swap</button>
          <button className="secondary-button" onClick={handleClear} style={{ fontSize: '0.82rem', padding: '6px 12px' }}>Clear</button>
          {/* View tabs */}
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: 3, gap: 4 }}>
            {[['tree', 'Tree View'], ['sidebyside', 'Side by Side']].map(([v, label]) => (
              <button key={v} onClick={() => setView(v)} style={{ padding: '5px 14px', borderRadius: 6, fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer', border: 'none', background: view === v ? 'rgba(255,255,255,0.1)' : 'transparent', color: view === v ? 'var(--text-primary)' : 'var(--text-secondary)', transition: 'all 0.18s' }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Stats bar */}
      {stats && !hasErrors && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', padding: '10px 16px', borderRadius: 10, background: identical ? 'rgba(16,185,129,0.06)' : 'rgba(128,128,128,0.06)', border: `1px solid ${identical ? 'rgba(16,185,129,0.2)' : 'var(--border-light)'}`, flexShrink: 0 }}>
          {identical ? (
            <span style={{ color: '#10b981', fontWeight: 600, fontSize: '0.9rem' }}>✓ JSONs are identical</span>
          ) : (
            <>
              <span style={{ color: '#10b981', fontWeight: 600, fontSize: '0.88rem', background: 'rgba(16,185,129,0.1)', padding: '3px 12px', borderRadius: 20 }}>+{stats.added} added</span>
              <span style={{ color: '#ef4444', fontWeight: 600, fontSize: '0.88rem', background: 'rgba(239,68,68,0.1)', padding: '3px 12px', borderRadius: 20 }}>−{stats.removed} removed</span>
              <span style={{ color: '#f59e0b', fontWeight: 600, fontSize: '0.88rem', background: 'rgba(245,158,11,0.1)', padding: '3px 12px', borderRadius: 20 }}>~{stats.changed} changed</span>
            </>
          )}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <input type="checkbox" checked={showEqual} onChange={e => setShowEqual(e.target.checked)} style={{ cursor: 'pointer' }} />
              Show unchanged fields
            </label>
          </div>
        </div>
      )}

      {/* Input panels */}
      <div style={{ display: 'flex', gap: 14, flexShrink: 0, minHeight: 220 }}>
        {[
          { label: 'JSON A (Left)', value: leftInput, set: setLeftInput, error: leftError, color: '#3b82f6' },
          { label: 'JSON B (Right)', value: rightInput, set: setRightInput, error: rightError, color: '#8b5cf6' },
        ].map(({ label, value, set, error, color }) => (
          <div key={label} className="glass-panel" style={{ flex: 1, borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column', border: error ? '1.5px solid rgba(239,68,68,0.4)' : `1.5px solid ${color}33` }}>
            <div style={{ padding: '8px 14px', background: 'rgba(0,0,0,0.15)', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between', width: '100%' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color }}>{label}</span>
                <button
                  onClick={() => copyPanel(value, label)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: '2px 6px', borderRadius: 4 }}
                  className="hover:bg-[rgba(255,255,255,0.05)] transition-colors"
                  title="Copy contents"
                >
                  {copiedPanel === label ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
                </button>
              </div>
              {error && <span style={{ fontSize: '0.72rem', color: '#ef4444', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>⚠ {error}</span>}
            </div>
            <textarea
              className="code-textarea custom-scrollbar"
              value={value}
              onChange={e => set(e.target.value)}
              placeholder={`Paste ${label} here…`}
              style={{ minHeight: 180, fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}
            />
          </div>
        ))}
      </div>

      {/* Diff output */}
      {!hasErrors && diffs.length > 0 && (
        view === 'tree' ? (
          <div className="glass-panel custom-scrollbar" style={{ flex: 1, borderRadius: 12, overflow: 'auto', padding: '12px 8px', minHeight: 200 }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', padding: '0 12px', marginBottom: 8 }}>
              Diff Tree
            </div>
            {diffs.map((node, i) => (
              <DiffRow key={i} node={node} depth={0} showEqual={showEqual} />
            ))}
          </div>
        ) : (
          /* Side by side line diff */
          <div className="glass-panel custom-scrollbar" style={{ flex: 1, borderRadius: 12, overflow: 'auto', minHeight: 200 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', height: '100%' }}>
              {/* Left header */}
              <div style={{ padding: '8px 14px', background: 'rgba(59,130,246,0.08)', borderBottom: '1px solid var(--border-light)', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#3b82f6', letterSpacing: '0.07em', borderRight: '1px solid var(--border-light)' }}>JSON A</div>
              <div style={{ padding: '8px 14px', background: 'rgba(139,92,246,0.08)', borderBottom: '1px solid var(--border-light)', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#8b5cf6', letterSpacing: '0.07em' }}>JSON B</div>
              {sideBySide.map((row, i) => (
                <>
                  <div key={`l${i}`} style={{ padding: '1px 14px', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', whiteSpace: 'pre', background: row.diff ? 'rgba(239,68,68,0.07)' : 'transparent', borderRight: '1px solid var(--border-light)', color: row.diff ? '#fca5a5' : 'var(--text-secondary)', lineHeight: 1.7, borderBottom: '1px solid rgba(128,128,128,0.04)' }}>
                    <span style={{ color: 'var(--text-muted)', marginRight: 12, userSelect: 'none', fontSize: '0.68rem' }}>{i + 1}</span>
                    {row.left}
                  </div>
                  <div key={`r${i}`} style={{ padding: '1px 14px', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', whiteSpace: 'pre', background: row.diff ? 'rgba(16,185,129,0.07)' : 'transparent', color: row.diff ? '#6ee7b7' : 'var(--text-secondary)', lineHeight: 1.7, borderBottom: '1px solid rgba(128,128,128,0.04)' }}>
                    <span style={{ color: 'var(--text-muted)', marginRight: 12, userSelect: 'none', fontSize: '0.68rem' }}>{i + 1}</span>
                    {row.right}
                  </div>
                </>
              ))}
            </div>
          </div>
        )
      )}

      {!hasErrors && identical && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12, border: '1px dashed rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.04)', color: '#10b981', fontSize: '1rem', fontWeight: 600, gap: 10 }}>
          <span style={{ fontSize: '1.4rem' }}>✓</span> Both JSONs are identical
        </div>
      )}

      {hasErrors && (
        <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: 'var(--accent-error)', fontSize: '0.85rem' }}>
          Fix the JSON syntax errors above to see the diff.
        </div>
      )}

      <ResourceLinks links={resources} />
    </div>
  );
}

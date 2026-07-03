import { useState, useMemo } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import ResourceLinks from '../components/ResourceLinks';
import './ToolPage.css';

const transforms = [
  {
    id: 'uppercase', label: 'UPPERCASE', group: 'Case',
    fn: s => s.toUpperCase(),
  },
  {
    id: 'lowercase', label: 'lowercase', group: 'Case',
    fn: s => s.toLowerCase(),
  },
  {
    id: 'titlecase', label: 'Title Case', group: 'Case',
    fn: s => s.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()),
  },
  {
    id: 'camelcase', label: 'camelCase', group: 'Case',
    fn: s => s
      .trim()
      .split(/[\s_\-]+/)
      .map((w, i) => i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(''),
  },
  {
    id: 'pascalcase', label: 'PascalCase', group: 'Case',
    fn: s => s
      .trim()
      .split(/[\s_\-]+/)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(''),
  },
  {
    id: 'snakecase', label: 'snake_case', group: 'Case',
    fn: s => s.trim().replace(/[\s\-]+/g, '_').replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase(),
  },
  {
    id: 'kebabcase', label: 'kebab-case', group: 'Case',
    fn: s => s.trim().replace(/[\s_]+/g, '-').replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase(),
  },
  {
    id: 'constantcase', label: 'CONSTANT_CASE', group: 'Case',
    fn: s => s.trim().replace(/[\s\-]+/g, '_').replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase(),
  },
  {
    id: 'reverse', label: 'Reverse', group: 'Transform',
    fn: s => s.split('').reverse().join(''),
  },
  {
    id: 'reverse-words', label: 'Reverse Words', group: 'Transform',
    fn: s => s.split(/\s+/).reverse().join(' '),
  },
  {
    id: 'trim-whitespace', label: 'Trim Whitespace', group: 'Transform',
    fn: s => s.trim().replace(/\s+/g, ' '),
  },
  {
    id: 'remove-spaces', label: 'Remove Spaces', group: 'Transform',
    fn: s => s.replace(/\s+/g, ''),
  },
  {
    id: 'remove-newlines', label: 'Remove Newlines', group: 'Transform',
    fn: s => s.replace(/[\r\n]+/g, ' '),
  },
  {
    id: 'dedupe-lines', label: 'Deduplicate Lines', group: 'Transform',
    fn: s => [...new Set(s.split('\n'))].join('\n'),
  },
  {
    id: 'sort-lines', label: 'Sort Lines A→Z', group: 'Transform',
    fn: s => s.split('\n').sort((a, b) => a.localeCompare(b)).join('\n'),
  },
  {
    id: 'sort-lines-desc', label: 'Sort Lines Z→A', group: 'Transform',
    fn: s => s.split('\n').sort((a, b) => b.localeCompare(a)).join('\n'),
  },
  {
    id: 'count-chars', label: 'Count Characters', group: 'Stats',
    fn: s => `Characters (with spaces): ${s.length}\nCharacters (no spaces): ${s.replace(/\s/g, '').length}\nWords: ${s.trim() ? s.trim().split(/\s+/).length : 0}\nLines: ${s.split('\n').length}\nSentences: ${(s.match(/[.!?]+/g) || []).length}`,
  },
];

const groups = [...new Set(transforms.map(t => t.group))];

const ACCENT_COLORS = {
  Case: '#3b82f6',
  Transform: '#8b5cf6',
  Stats: '#10b981',
};

const resources = [
  { title: 'String.prototype methods (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String' },
  { title: 'Naming Conventions Guide', url: 'https://en.wikipedia.org/wiki/Naming_convention_(programming)' },
];

export default function StringUtils() {
  const [input, setInput] = useLocalStorage('string_input', '');
  const [output, setOutput] = useState('');
  const [activeTransform, setActiveTransform] = useState(null);
  const [copied, setCopied] = useState(false);

  const stats = useMemo(() => {
    const chars = input.length;
    const words = input.trim() ? input.trim().split(/\s+/).length : 0;
    const lines = input.split('\n').length;
    const bytes = new TextEncoder().encode(input).length;
    return { chars, words, lines, bytes };
  }, [input]);

  const handleTransform = (t) => {
    if (!input) return;
    const result = t.fn(input);
    setOutput(result);
    setActiveTransform(t.id);
    setCopied(false);
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleSwap = () => {
    if (!output) return;
    setInput(output);
    setOutput('');
    setActiveTransform(null);
  };

  return (
    <div className="tool-page h-full flex flex-col overflow-y-auto">
      <header className="tool-header">
        <div>
          <h2>String Utils</h2>
          <p>Transform, convert, and analyze text with one click — case converters, sorters, counters, and more.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="secondary-button" onClick={handleSwap} disabled={!output} title="Use output as new input">
            ↕ Use Output as Input
          </button>
          <button className="primary-button" onClick={handleCopy} disabled={!output}>
            {copied ? '✓ Copied!' : 'Copy Output'}
          </button>
        </div>
      </header>

      {/* Stats bar */}
      <div style={{ display: 'flex', gap: 20, padding: '10px 16px', borderRadius: 10, background: 'rgba(128,128,128,0.07)', border: '1px solid var(--border-light)', flexWrap: 'wrap' }}>
        {[['Chars', stats.chars], ['Words', stats.words], ['Lines', stats.lines], ['Bytes', stats.bytes]].map(([label, val]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{val}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Transform Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {groups.map(group => (
          <div key={group}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: ACCENT_COLORS[group] || 'var(--text-muted)', marginBottom: 6 }}>
              {group}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {transforms.filter(t => t.group === group).map(t => (
                <button
                  key={t.id}
                  onClick={() => handleTransform(t)}
                  style={{
                    padding: '5px 14px',
                    borderRadius: 8,
                    fontSize: '0.82rem',
                    fontWeight: 500,
                    border: activeTransform === t.id ? `1.5px solid ${ACCENT_COLORS[group] || 'var(--accent-primary)'}` : '1.5px solid var(--border-light)',
                    background: activeTransform === t.id ? `${ACCENT_COLORS[group]}22` : 'rgba(128,128,128,0.07)',
                    color: activeTransform === t.id ? (ACCENT_COLORS[group] || 'var(--accent-primary)') : 'var(--text-secondary)',
                    cursor: input ? 'pointer' : 'not-allowed',
                    opacity: input ? 1 : 0.5,
                    transition: 'all 0.18s',
                    fontFamily: ['camelcase', 'pascalcase', 'snakecase', 'kebabcase', 'constantcase'].includes(t.id) ? 'var(--font-mono)' : 'inherit',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* IO Panels */}
      <div className="split-view flex-1">
        <div className="split-panel glass-panel">
          <div className="panel-header">Input Text</div>
          <textarea
            className="code-textarea custom-scrollbar"
            value={input}
            onChange={e => { setInput(e.target.value); setActiveTransform(null); setOutput(''); }}
            placeholder="Paste or type your text here..."
          />
        </div>
        <div className="split-panel glass-panel">
          <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Output</span>
            {activeTransform && (
              <span style={{ fontSize: '0.72rem', background: 'rgba(59,130,246,0.12)', color: 'var(--accent-primary)', padding: '2px 8px', borderRadius: 6, fontFamily: 'var(--font-mono)' }}>
                {transforms.find(t => t.id === activeTransform)?.label}
              </span>
            )}
          </div>
          <textarea
            className="code-textarea custom-scrollbar"
            value={output}
            readOnly
            placeholder="Result appears here after clicking a transform..."
          />
        </div>
      </div>

      <ResourceLinks links={resources} />
    </div>
  );
}

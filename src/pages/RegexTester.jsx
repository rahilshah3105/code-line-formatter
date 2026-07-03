import { useState, useMemo } from 'react';
import { Copy, Check, X, BookOpen } from 'lucide-react';
import ResourceLinks from '../components/ResourceLinks';
import { useLocalStorage } from '../hooks/useLocalStorage';
import './ToolPage.css';
import './RegexTester.css';

const COMMON_PATTERNS = [
  { label: 'Email Address', pattern: '[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}' },
  { label: 'URL (http/https)', pattern: 'https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)' },
  { label: 'Phone (Intl.)', pattern: '\\+?[1-9]\\d{1,14}' },
  { label: 'IPv4 Address', pattern: '\\b(?:(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\b' },
  { label: 'Integer Number', pattern: '-?\\d+' },
  { label: 'Decimal Number', pattern: '-?\\d+\\.?\\d*' },
  { label: 'Hex Color', pattern: '#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})\\b' },
  { label: 'Date (YYYY-MM-DD)', pattern: '\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])' },
  { label: 'Time (HH:MM)', pattern: '(?:[01]\\d|2[0-3]):[0-5]\\d' },
  { label: 'HTML Tag', pattern: '<([a-zA-Z][a-zA-Z0-9]*)\\b[^>]*>.*?<\\/\\1>' },
  { label: 'JWT Token', pattern: '[A-Za-z0-9-_]+\\.[A-Za-z0-9-_]+\\.[A-Za-z0-9-_]+' },
  { label: 'Whitespace Only', pattern: '^\\s*$' },
  { label: 'Alphanumeric', pattern: '^[a-zA-Z0-9]+$' },
  { label: 'Strong Password', pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&]).{8,}$' },
  { label: 'UUID v4', pattern: '[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}' },
];

function PatternCard({ item, onInsert }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(item.pattern);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="pattern-card" onClick={() => onInsert(item.pattern)} title="Click to load pattern">
      <div className="pattern-card-label">{item.label}</div>
      <div className="pattern-card-code">{item.pattern.length > 38 ? item.pattern.slice(0, 38) + '…' : item.pattern}</div>
      <button className="pattern-copy-btn" onClick={handleCopy}>
        {copied ? <Check size={12} /> : <Copy size={12} />}
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}

// ────────────────────────────────────────────────────
// Regex Explainer — simple token-by-token parser
// ────────────────────────────────────────────────────
function explainRegex(pattern, flags, matchCount) {
  if (!pattern) return null;

  const tokens = [];

  // Step through pattern and describe major constructs
  const rules = [
    { re: /^\^/, label: '\u005e', desc: 'Anchor — matches at the START of the string.' },
    { re: /^\$/, label: '\u0024', desc: 'Anchor — matches at the END of the string.' },
    { re: /^\./, label: '.', desc: 'Dot — matches ANY single character except a newline.' },
    { re: /^\\b/, label: '\\b', desc: 'Word boundary — position between a word character and a non-word character.' },
    { re: /^\\B/, label: '\\B', desc: 'Non-word boundary — the opposite of \\b.' },
    { re: /^\\d(\{[^}]+\}|[+*?])?/, label: '\\d', desc: 'Shorthand for a digit character [0-9].' },
    { re: /^\\D(\{[^}]+\}|[+*?])?/, label: '\\D', desc: 'Shorthand for a NON-digit character.' },
    { re: /^\\w(\{[^}]+\}|[+*?])?/, label: '\\w', desc: 'Shorthand for a word character: letters, digits, or underscore [a-zA-Z0-9_].' },
    { re: /^\\W(\{[^}]+\}|[+*?])?/, label: '\\W', desc: 'Shorthand for a NON-word character.' },
    { re: /^\\s(\{[^}]+\}|[+*?])?/, label: '\\s', desc: 'Shorthand for whitespace (space, tab, newline, etc.).' },
    { re: /^\\S(\{[^}]+\}|[+*?])?/, label: '\\S', desc: 'Shorthand for NON-whitespace.' },
    { re: /^\\n/, label: '\\n', desc: 'Literal newline character.' },
    { re: /^\\t/, label: '\\t', desc: 'Literal tab character.' },
    { re: /^\\r/, label: '\\r', desc: 'Literal carriage return character.' },
    { re: /^\[\^[^\]]+\]/, label: '[^…]', desc: (m) => `Negated character class — matches any char NOT in: [${m.slice(2, -1)}].` },
    { re: /^\[[^\]]+\]/, label: '[…]', desc: (m) => `Character class — matches any one character in: [${m.slice(1, -1)}].` },
    { re: /^\(\?:/, label: '(?:…)', desc: 'Non-capturing group — groups expressions without saving the match.' },
    { re: /^\(\?=/, label: '(?=…)', desc: 'Positive lookahead — asserts that what follows matches the inner pattern.' },
    { re: /^\(\?!/, label: '(?!…)', desc: 'Negative lookahead — asserts that what follows does NOT match.' },
    { re: /^\(\?<=/, label: '(?<=…)', desc: 'Positive lookbehind — asserts that what precedes matches the inner pattern.' },
    { re: /^\(\?<!/, label: '(?<!…)', desc: 'Negative lookbehind — asserts that what precedes does NOT match.' },
    { re: /^\(/, label: '(…)', desc: 'Capturing group — groups expressions and saves the match.' },
    { re: /^\{\d+,\d+\}/, label: '{n,m}', desc: (m) => { const [n, x] = m.slice(1, -1).split(','); return `Quantifier — match between ${n} and ${x} of the preceding token.`; } },
    { re: /^\{\d+,\}/, label: '{n,}', desc: (m) => `Quantifier — match ${m.slice(1, -1).split(',')[0]} or MORE of the preceding token.` },
    { re: /^\{\d+\}/, label: '{n}', desc: (m) => `Quantifier — match EXACTLY ${m.slice(1, -1)} of the preceding token.` },
    { re: /^\+\?/, label: '+?', desc: 'One or more (lazy) — matches as FEW repetitions as possible.' },
    { re: /^\*\?/, label: '*?', desc: 'Zero or more (lazy) — matches as FEW repetitions as possible.' },
    { re: /^\?\?/, label: '??', desc: 'Zero or one (lazy) — prefers zero.' },
    { re: /^\+/, label: '+', desc: 'Quantifier — one or MORE of the preceding token (greedy).' },
    { re: /^\*/, label: '*', desc: 'Quantifier — zero or MORE of the preceding token (greedy).' },
    { re: /^\?(?!\?)/, label: '?', desc: 'Quantifier — zero or ONE of the preceding token (optional).' },
    { re: /^\|/, label: '|', desc: 'Alternation — matches EITHER the left OR the right side expression.' },
    { re: /^\\./, label: (m) => m, desc: (m) => `Escaped literal — matches the literal character \u201c${m[1]}\u201d.` },
  ];

  let rem = pattern;
  let safety = 0;
  const seen = new Set();
  while (rem.length > 0 && safety++ < 200) {
    let matched = false;
    for (const rule of rules) {
      const hit = rem.match(rule.re);
      if (hit) {
        const text = hit[0];
        const lbl = typeof rule.label === 'function' ? rule.label(text) : rule.label;
        const dsc = typeof rule.desc === 'function' ? rule.desc(text) : rule.desc;
        const key = lbl + '|' + dsc;
        if (!seen.has(key)) {
          seen.add(key);
          tokens.push({ label: lbl, desc: dsc });
        }
        rem = rem.slice(text.length);
        matched = true;
        break;
      }
    }
    if (!matched) { rem = rem.slice(1); } // skip literal char
  }

  // Flag explanations
  const flagMap = {
    g: 'g — Global: find ALL matches, not just the first one.',
    i: 'i — Case Insensitive: treats uppercase and lowercase as equal.',
    m: 'm — Multiline: makes ^ and $ match start/end of each LINE.',
    s: 's — Dotall: makes . match newlines too.',
    u: 'u — Unicode: enables full Unicode matching.',
  };
  const flagDescs = flags.split('').map(f => flagMap[f]).filter(Boolean);

  const summary = matchCount === 0
    ? 'No matches found in the test string.'
    : `Found ${matchCount} match${matchCount !== 1 ? 'es' : ''} in the test string.`;

  return { tokens, flagDescs, summary };
}

export default function RegexTester() {
  const [pattern, setPattern] = useLocalStorage('regex_pattern', '[A-Z]\\w+');
  const [flags, setFlags] = useLocalStorage('regex_flags', 'g');
  const [testString, setTestString] = useLocalStorage('regex_teststring', 'Hello World, this is a Test String 123. Email: dev@example.com, Color: #3b82f6');
  const [showExplanation, setShowExplanation] = useState(false);

  const matches = useMemo(() => {
    if (!pattern) return { html: escapeHtml(testString), list: [], error: null };
    try {
      const regex = new RegExp(pattern, flags);
      const isGlobal = flags.includes('g');
      const list = [];
      let html = '';

      if (isGlobal) {
        const results = [...testString.matchAll(regex)];
        results.forEach(m => list.push(`Match "${m[0]}" at position ${m.index}`));

        let lastIndex = 0;
        let parts = [];
        for (const m of results) {
          parts.push(escapeHtml(testString.substring(lastIndex, m.index)));
          parts.push(`<mark class="regex-match">${escapeHtml(m[0])}</mark>`);
          lastIndex = m.index + m[0].length;
          if (m[0].length === 0) lastIndex++;
        }
        parts.push(escapeHtml(testString.substring(lastIndex)));
        html = parts.join('');
      } else {
        const match = testString.match(regex);
        if (match) {
          list.push(`Match "${match[0]}" at position ${match.index}`);
          html = escapeHtml(testString.substring(0, match.index)) +
            `<mark class="regex-match">${escapeHtml(match[0])}</mark>` +
            escapeHtml(testString.substring(match.index + match[0].length));
        } else {
          html = escapeHtml(testString);
        }
      }

      return { html, list, error: null };
    } catch (e) {
      return { html: escapeHtml(testString), list: [], error: e.message };
    }
  }, [pattern, flags, testString]);

  const resources = [
    { title: 'Regex101 (Interactive Tester)', url: 'https://regex101.com/' },
    { title: 'MDN: Regular Expressions', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions' },
    { title: 'RegexOne (Interactive Tutorial)', url: 'https://regexone.com/' },
  ];

  return (
    <div className="tool-page h-full flex flex-col overflow-y-auto">
      <header className="tool-header">
        <div>
          <h2>Regex Tester</h2>
          <p>Build, test, and validate Regular Expressions in real time. Click any pattern snippet to load it.</p>
        </div>
      </header>

      {/* Pattern Input */}
      <div className="regex-input-group glass-panel rounded-xl p-4">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <label className="regex-label" style={{ marginBottom: 0 }}>Regular Expression</label>
          <button
            className="regex-explain-btn"
            onClick={() => setShowExplanation(v => !v)}
          >
            <BookOpen size={13} />
            {showExplanation ? 'Hide Explanation' : 'Show Explanation'}
          </button>
        </div>
        <div className="regex-input-row">
          <span className="regex-slash">/</span>
          <input
            type="text"
            className="regex-pattern-input"
            value={pattern}
            onChange={e => setPattern(e.target.value)}
            placeholder="pattern here…"
          />
          <span className="regex-slash">/</span>
          <input
            type="text"
            className="regex-flags-input"
            value={flags}
            onChange={e => setFlags(e.target.value)}
            placeholder="gmi"
          />
        </div>
        {matches.error && <p className="regex-error">{matches.error}</p>}
      </div>

      {/* Closable Explanation Panel */}
      {showExplanation && (() => {
        const expl = explainRegex(pattern, flags, matches.list.length);
        if (!expl) return null;
        return (
          <div className="regex-explanation-panel">
            <div className="regex-expl-header">
              <span>Pattern Explanation</span>
              <button className="regex-expl-close" onClick={() => setShowExplanation(false)}><X size={14} /></button>
            </div>
            <div className="regex-expl-body">
              <p className="regex-expl-summary">{expl.summary}</p>
              {expl.tokens.length > 0 && (
                <div className="regex-expl-section">
                  <div className="regex-expl-section-title">Token Breakdown</div>
                  <div className="regex-expl-tokens">
                    {expl.tokens.map((t, i) => (
                      <div key={i} className="regex-token-row">
                        <code className="regex-token-tag">{t.label}</code>
                        <span className="regex-token-desc">{t.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {expl.flagDescs.length > 0 && (
                <div className="regex-expl-section">
                  <div className="regex-expl-section-title">Active Flags</div>
                  <ul className="regex-expl-flags">
                    {expl.flagDescs.map((f, i) => <li key={i}>{f}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Split view: Test String | Results */}
      <div className="split-view flex-1">
        <div className="split-panel glass-panel">
          <div className="panel-header">Test String</div>
          <textarea
            className="code-textarea custom-scrollbar"
            value={testString}
            onChange={(e) => setTestString(e.target.value)}
            placeholder="Enter string to test against your regex…"
          />
        </div>
        <div className="split-panel flex flex-col gap-4">
          <div className="glass-panel flex-1 rounded-xl overflow-hidden flex flex-col">
            <div className="panel-header regex-results-header">
              <span>Highlighted Matches</span>
              <span className="regex-match-count">{matches.list.length} match{matches.list.length !== 1 ? 'es' : ''}</span>
            </div>
            <div
              className="flex-1 p-4 font-mono text-sm whitespace-pre-wrap leading-relaxed custom-scrollbar overflow-y-auto regex-preview"
              dangerouslySetInnerHTML={{ __html: matches.html || '<span style="opacity:0.4;font-style:italic">No matches found</span>' }}
            />
          </div>
          {matches.list.length > 0 && (
            <div className="glass-panel rounded-xl overflow-hidden">
              <div className="panel-header" style={{ color: 'var(--accent-success)' }}>Match List</div>
              <ul className="regex-match-list custom-scrollbar">
                {matches.list.map((m, i) => (
                  <li key={i} className="regex-match-item">
                    <span className="regex-match-num">{i + 1}</span> {m}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Common Patterns Shelf */}
      <div className="common-patterns-section">
        <p className="common-patterns-title">⚡ Common Patterns — click to load, copy button to copy</p>
        <div className="pattern-cards-grid">
          {COMMON_PATTERNS.map((item, idx) => (
            <PatternCard key={idx} item={item} onInsert={setPattern} />
          ))}
        </div>
      </div>

      <ResourceLinks links={resources} />
    </div>
  );
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

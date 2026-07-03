import { useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import ResourceLinks from '../components/ResourceLinks';
import './ToolPage.css';

const TOOLS = [
  { id: 'format-json', label: 'Format JSON', group: 'JSON' },
  { id: 'minify-json', label: 'Minify JSON', group: 'JSON' },
  { id: 'base64-encode', label: 'Base64 Encode', group: 'Encoding' },
  { id: 'base64-decode', label: 'Base64 Decode', group: 'Encoding' },
  { id: 'hex-encode', label: 'Hex Encode', group: 'Encoding' },
  { id: 'hex-decode', label: 'Hex Decode', group: 'Encoding' },
  { id: 'binary-encode', label: 'Binary Encode', group: 'Encoding' },
  { id: 'binary-decode', label: 'Binary Decode', group: 'Encoding' },
  { id: 'html-escape', label: 'HTML Escape', group: 'HTML' },
  { id: 'html-unescape', label: 'HTML Unescape', group: 'HTML' },
  { id: 'generate-uuid', label: 'Generate UUID', group: 'Generate' },
  { id: 'generate-hash', label: 'Generate Hash', group: 'Generate' },
];

const TOOL_DESCRIPTIONS = {
  'format-json': 'Pretty-print JSON with 2-space indentation.',
  'minify-json': 'Compact JSON by removing all whitespace.',
  'base64-encode': 'Encode plain text to Base64.',
  'base64-decode': 'Decode a Base64 string back to plain text.',
  'hex-encode': 'Convert text to hexadecimal byte representation.',
  'hex-decode': 'Convert hex bytes back to readable text.',
  'binary-encode': 'Convert text to binary (0s and 1s).',
  'binary-decode': 'Convert binary string back to readable text.',
  'html-escape': 'Escape HTML special characters (<, >, &, ", \').',
  'html-unescape': 'Convert HTML entities back to raw characters.',
  'generate-uuid': 'Generate a random RFC 4122 UUID v4.',
  'generate-hash': 'Compute SHA-256 hash of the input string.',
};

function processInput(toolId, input) {
  if (toolId === 'generate-uuid') {
    return crypto.randomUUID();
  }

  if (!input.trim()) return '';

  try {
    switch (toolId) {
      case 'format-json':
        return JSON.stringify(JSON.parse(input), null, 2);
      case 'minify-json':
        return JSON.stringify(JSON.parse(input));
      case 'base64-encode':
        return btoa(unescape(encodeURIComponent(input)));
      case 'base64-decode':
        return decodeURIComponent(escape(atob(input.trim())));
      case 'hex-encode':
        return Array.from(new TextEncoder().encode(input))
          .map(b => b.toString(16).padStart(2, '0'))
          .join(' ');
      case 'hex-decode': {
        const cleaned = input.trim().replace(/\s+/g, '');
        const bytes = [];
        for (let i = 0; i < cleaned.length; i += 2) {
          bytes.push(parseInt(cleaned.substr(i, 2), 16));
        }
        return new TextDecoder().decode(new Uint8Array(bytes));
      }
      case 'binary-encode':
        return Array.from(new TextEncoder().encode(input))
          .map(b => b.toString(2).padStart(8, '0'))
          .join(' ');
      case 'binary-decode': {
        const parts = input.trim().split(/\s+/);
        const bytes2 = parts.map(p => parseInt(p, 2));
        return new TextDecoder().decode(new Uint8Array(bytes2));
      }
      case 'html-escape':
        return input
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;');
      case 'html-unescape':
        return input
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#039;/g, "'")
          .replace(/&apos;/g, "'");
      default:
        return '';
    }
  } catch (e) {
    return `Error: ${e.message}`;
  }
}

async function computeHash(text) {
  if (!text) return '';
  const msgUint8 = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const groups = [...new Set(TOOLS.map(t => t.group))];

const resources = [
  { title: 'MDN: TextEncoder / TextDecoder', url: 'https://developer.mozilla.org/en-US/docs/Web/API/TextEncoder' },
  { title: 'HTML Entity Reference', url: 'https://www.w3schools.com/html/html_entities.asp' },
  { title: 'RFC 4648 - Base64 Encoding', url: 'https://www.rfc-editor.org/rfc/rfc4648' },
];

export default function UtilityTools() {
  const [selectedTool, setSelectedTool] = useLocalStorage('utility_selected_tool', TOOLS[0].id);
  const [input, setInput] = useLocalStorage('utility_input', '');
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const activeTool = TOOLS.find(t => t.id === selectedTool);

  const handleSelectTool = (toolId) => {
    setSelectedTool(toolId);
    setInput('');
    setOutput('');
    setError('');
    setCopied(false);
  };

  const handleRun = async () => {
    setError('');
    if (selectedTool === 'generate-uuid') {
      setOutput(crypto.randomUUID());
      return;
    }
    if (selectedTool === 'generate-hash') {
      if (!input.trim()) { setError('Input is empty.'); return; }
      const hash = await computeHash(input);
      setOutput(hash);
      return;
    }
    const result = processInput(selectedTool, input);
    if (result.startsWith('Error:')) {
      setError(result);
      setOutput('');
    } else {
      setOutput(result);
    }
  };

  const handleInputChange = (val) => {
    setInput(val);
    setError('');
    // Live preview for non-async tools
    if (selectedTool !== 'generate-hash' && selectedTool !== 'generate-uuid') {
      const result = processInput(selectedTool, val);
      if (result.startsWith('Error:')) {
        setError(result);
        setOutput('');
      } else {
        setOutput(result);
      }
    }
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const needsButton = selectedTool === 'generate-uuid' || selectedTool === 'generate-hash';
  const isUuid = selectedTool === 'generate-uuid';

  return (
    <div className="tool-page h-full flex flex-col overflow-y-auto">
      <header className="tool-header">
        <div>
          <h2>Utility Tools</h2>
          <p>One-stop shop for encoding, decoding, hashing, and transforming data — all in your browser.</p>
        </div>
      </header>

      {/* Tool Selector */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {groups.map(group => (
          <div key={group} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', paddingLeft: 2 }}>{group}</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {TOOLS.filter(t => t.group === group).map(tool => (
                <button
                  key={tool.id}
                  onClick={() => handleSelectTool(tool.id)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 8,
                    fontSize: '0.82rem',
                    fontWeight: 500,
                    border: selectedTool === tool.id ? '1.5px solid var(--accent-primary)' : '1.5px solid var(--border-light)',
                    background: selectedTool === tool.id ? 'rgba(59,130,246,0.15)' : 'rgba(128,128,128,0.07)',
                    color: selectedTool === tool.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.18s',
                  }}
                >
                  {tool.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Description */}
      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', padding: '6px 12px', borderRadius: 8, background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>📌 <strong style={{ color: 'var(--text-primary)' }}>{activeTool?.label}</strong> — {TOOL_DESCRIPTIONS[selectedTool]}</span>
        <div style={{ display: 'flex', gap: 8 }}>
          {needsButton && (
            <button className="secondary-button" onClick={handleRun} style={{ padding: '5px 14px', fontSize: '0.82rem' }}>
              {isUuid ? 'Generate UUID' : 'Compute Hash'}
            </button>
          )}
          <button
            className="primary-button"
            onClick={handleCopy}
            disabled={!output}
            style={{ padding: '5px 14px', fontSize: '0.82rem' }}
          >
            {copied ? '✓ Copied!' : 'Copy Output'}
          </button>
        </div>
      </div>

      {/* IO Panels */}
      {!isUuid ? (
        <div className="split-view flex-1">
          <div className="split-panel glass-panel">
            <div className="panel-header">Input</div>
            <textarea
              className="code-textarea custom-scrollbar"
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder={selectedTool === 'generate-hash' ? 'Type text to hash...' : `Enter ${activeTool?.label.toLowerCase()} input...`}
            />
          </div>
          <div className="split-panel glass-panel">
            <div className="panel-header">Output</div>
            <textarea
              className="code-textarea custom-scrollbar"
              value={output}
              readOnly
              placeholder="Result will appear here..."
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 glass-panel rounded-xl overflow-hidden flex flex-col items-stretch" style={{ minHeight: 200 }}>
          <div className="panel-header">Generated UUID</div>
          <div style={{ padding: 24, fontFamily: 'var(--font-mono)', fontSize: '1.1rem', color: 'var(--accent-primary)', letterSpacing: '0.04em' }}>
            {output || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.9rem' }}>Click "Generate UUID" above</span>}
          </div>
        </div>
      )}

      {error && (
        <div style={{ padding: '8px 16px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--accent-error)', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      <ResourceLinks links={resources} />
    </div>
  );
}

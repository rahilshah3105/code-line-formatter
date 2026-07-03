import { useMemo, useState } from 'react';
import { Copy, RefreshCw } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import ResourceLinks from '../components/ResourceLinks';
import './ToolPage.css';

const fieldStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid var(--border-light)',
  backgroundColor: 'rgba(128, 128, 128, 0.08)',
  color: 'var(--text-primary)',
  outline: 'none',
};

const labelStyle = { display: 'block', fontSize: '0.875rem', marginBottom: 8, color: 'var(--text-secondary)' };

const samplePools = {
  name: ['Ava', 'Liam', 'Noah', 'Mia', 'Rahil', 'Isha', 'Arjun'],
  city: ['Mumbai', 'Pune', 'Delhi', 'Bengaluru', 'London', 'Berlin'],
  word: ['alpha', 'beta', 'gamma', 'delta', 'omega', 'sigma'],
  sentence: ['Build reliable tests.', 'Validate edge cases.', 'Ship clean code faster.']
};

function randomItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randomDate() { return new Date(Date.now() - randomInt(0, 365) * 86400000).toISOString(); }
function randomEmail(name) { return `${name.toLowerCase()}${randomInt(1, 999)}@example.com`; }

function buildValue(type, index) {
  switch (type) {
    case 'id': return index + 1;
    case 'uuid': return crypto?.randomUUID ? crypto.randomUUID() : `id-${index + 1}-${Date.now()}`;
    case 'name': return randomItem(samplePools.name);
    case 'email': return randomEmail(randomItem(samplePools.name));
    case 'number': return randomInt(1, 1000);
    case 'boolean': return Math.random() > 0.5;
    case 'date': return randomDate();
    case 'city': return randomItem(samplePools.city);
    case 'word': return randomItem(samplePools.word);
    case 'sentence': return randomItem(samplePools.sentence);
    default: return `value_${index + 1}`;
  }
}

function parseSchemaLines(schemaText) {
  return schemaText
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const [field, type = 'string'] = line.split(':').map(part => part.trim());
      return { field, type: type.toLowerCase() };
    })
    .filter(item => item.field);
}

function toCsv(rows) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const csvRows = rows.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','));
  return [headers.join(','), ...csvRows].join('\n');
}

export default function MockDataGenerator() {
  const [schema, setSchema] = useLocalStorage('mock_data_schema', 'id:id\nname:name\nemail:email\nactive:boolean\ncreatedAt:date');
  const [count, setCount] = useLocalStorage('mock_data_count', 10);
  const [copied, setCopied] = useState(false);

  const output = useMemo(() => {
    const fields = parseSchemaLines(schema);
    const size = Math.max(1, Math.min(500, Number(count) || 10));
    const rows = Array.from({ length: size }, (_, index) => {
      const obj = {};
      fields.forEach(({ field, type }) => { obj[field] = buildValue(type, index); });
      return obj;
    });
    return {
      json: JSON.stringify(rows, null, 2),
      csv: toCsv(rows),
      combined: `# Mock Data Output\n\n## JSON\n\n${JSON.stringify(rows, null, 2)}\n\n## CSV\n\n${toCsv(rows)}`,
    };
  }, [schema, count]);

  const resources = [
    { title: 'JSON Schema Basics', url: 'https://json-schema.org/learn/getting-started-step-by-step' },
    { title: 'Test Data Management Guide', url: 'https://martinfowler.com/articles/nonDeterminism.html' },
  ];

  const onCopy = async () => {
    await navigator.clipboard.writeText(output.combined);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const onReset = () => {
    setSchema('id:id\nname:name\nemail:email\nactive:boolean\ncreatedAt:date');
    setCount(10);
  };

  return (
    <div className="tool-page h-full flex flex-col overflow-y-auto">
      <header className="tool-header">
        <div>
          <h2>Mock Data Generator</h2>
          <p>Generate JSON and CSV test data from simple field schema lines.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="secondary-button" onClick={onReset}><RefreshCw size={14} style={{ marginRight: 6 }} />Reset</button>
          <button className="primary-button" onClick={onCopy}><Copy size={14} style={{ marginRight: 6 }} />{copied ? 'Copied' : 'Copy Output'}</button>
        </div>
      </header>

      <div className="split-view flex-1">
        <div className="split-panel glass-panel">
          <div className="panel-header">Generator Config</div>
          <div className="p-4 flex flex-col gap-4">
            <div>
              <label style={labelStyle}>Schema (field:type per line)</label>
              <textarea className="code-textarea" style={{ ...fieldStyle, minHeight: 180 }} value={schema} onChange={(e) => setSchema(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Rows</label>
              <input type="number" min="1" max="500" style={fieldStyle} value={count} onChange={(e) => setCount(e.target.value)} />
            </div>
          </div>
        </div>
        <div className="split-panel glass-panel">
          <div className="panel-header">Generated Data</div>
          <textarea className="code-textarea custom-scrollbar" readOnly value={output.combined} />
        </div>
      </div>

      <ResourceLinks links={resources} />
    </div>
  );
}

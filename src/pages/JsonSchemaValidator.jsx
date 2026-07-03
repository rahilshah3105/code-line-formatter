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

function parseJson(text) {
  try { return { ok: true, value: JSON.parse(text) }; }
  catch (error) { return { ok: false, error: error.message }; }
}

function typeOfValue(value) {
  if (Array.isArray(value)) return 'array';
  if (value === null) return 'null';
  return typeof value;
}

function validate(schema, payload, path = '$') {
  const errors = [];
  if (!schema || typeof schema !== 'object') return ['Invalid schema object.'];

  if (schema.type) {
    const actual = typeOfValue(payload);
    if (schema.type !== actual) {
      errors.push(`${path}: expected ${schema.type}, received ${actual}`);
      return errors;
    }
  }

  if (schema.type === 'object') {
    const required = Array.isArray(schema.required) ? schema.required : [];
    required.forEach((key) => {
      if (!(key in payload)) errors.push(`${path}.${key}: required field is missing`);
    });

    const props = schema.properties || {};
    Object.keys(props).forEach((key) => {
      if (key in payload) errors.push(...validate(props[key], payload[key], `${path}.${key}`));
    });
  }

  if (schema.type === 'array' && schema.items && Array.isArray(payload)) {
    payload.forEach((item, index) => errors.push(...validate(schema.items, item, `${path}[${index}]`)));
  }

  return errors;
}

export default function JsonSchemaValidator() {
  const [schemaText, setSchemaText] = useLocalStorage('json_schema_validator_schema', '{\n  "type": "object",\n  "required": ["id", "name"],\n  "properties": {\n    "id": { "type": "number" },\n    "name": { "type": "string" },\n    "active": { "type": "boolean" }\n  }\n}');
  const [payloadText, setPayloadText] = useLocalStorage('json_schema_validator_payload', '{\n  "id": 1,\n  "name": "Rahil",\n  "active": true\n}');
  const [copied, setCopied] = useState(false);

  const resultText = useMemo(() => {
    const schemaParsed = parseJson(schemaText);
    if (!schemaParsed.ok) return `Schema parse error: ${schemaParsed.error}`;

    const payloadParsed = parseJson(payloadText);
    if (!payloadParsed.ok) return `Payload parse error: ${payloadParsed.error}`;

    const issues = validate(schemaParsed.value, payloadParsed.value);
    if (!issues.length) return '✅ Validation passed. Payload matches schema.';

    return ['❌ Validation failed.', '', 'Issues:', ...issues.map(item => `- ${item}`)].join('\n');
  }, [schemaText, payloadText]);

  const onCopy = async () => {
    await navigator.clipboard.writeText(resultText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  const onReset = () => {
    setSchemaText('{\n  "type": "object",\n  "required": ["id", "name"],\n  "properties": {\n    "id": { "type": "number" },\n    "name": { "type": "string" },\n    "active": { "type": "boolean" }\n  }\n}');
    setPayloadText('{\n  "id": 1,\n  "name": "Rahil",\n  "active": true\n}');
  };

  const resources = [
    { title: 'JSON Schema Reference', url: 'https://json-schema.org/understanding-json-schema/' },
    { title: 'OpenAPI Schema Object', url: 'https://swagger.io/specification/' },
  ];

  return (
    <div className="tool-page h-full flex flex-col overflow-y-auto">
      <header className="tool-header">
        <div>
          <h2>JSON Schema Validator</h2>
          <p>Validate request and response payloads against a JSON schema for contract checks.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="secondary-button" onClick={onReset}><RefreshCw size={14} style={{ marginRight: 6 }} />Reset</button>
          <button className="primary-button" onClick={onCopy}><Copy size={14} style={{ marginRight: 6 }} />{copied ? 'Copied' : 'Copy Result'}</button>
        </div>
      </header>

      <div className="split-view flex-1">
        <div className="split-panel glass-panel">
          <div className="panel-header">Schema & Payload</div>
          <div className="p-4 flex flex-col gap-4">
            <div>
              <label style={{ display: 'block', marginBottom: 8, color: 'var(--text-secondary)' }}>Schema JSON</label>
              <textarea className="code-textarea" style={{ ...fieldStyle, minHeight: 180 }} value={schemaText} onChange={(e) => setSchemaText(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 8, color: 'var(--text-secondary)' }}>Payload JSON</label>
              <textarea className="code-textarea" style={{ ...fieldStyle, minHeight: 180 }} value={payloadText} onChange={(e) => setPayloadText(e.target.value)} />
            </div>
          </div>
        </div>
        <div className="split-panel glass-panel">
          <div className="panel-header">Validation Result</div>
          <textarea className="code-textarea custom-scrollbar" readOnly value={resultText} />
        </div>
      </div>

      <ResourceLinks links={resources} />
    </div>
  );
}

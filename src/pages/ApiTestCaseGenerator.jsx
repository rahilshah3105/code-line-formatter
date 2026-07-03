import { useMemo, useState } from 'react';
import { Copy, RefreshCw } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import ResourceLinks from '../components/ResourceLinks';
import CustomSelect from '../components/CustomSelect';
import './ToolPage.css';

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
const AUTH_TYPES = ['None', 'Bearer Token', 'API Key Header'];

const fieldStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid var(--border-light)',
  backgroundColor: 'rgba(128, 128, 128, 0.08)',
  color: 'var(--text-primary)',
  outline: 'none',
};

const labelStyle = {
  display: 'block',
  fontSize: '0.875rem',
  marginBottom: 8,
  color: 'var(--text-secondary)',
};

function tryParseJson(value) {
  if (!value.trim()) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function parseHeaders(text) {
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const [key, ...rest] = line.split(':');
      return { key: key?.trim(), value: rest.join(':').trim() };
    })
    .filter(h => h.key && h.value);
}

function buildCurl({ method, baseUrl, endpoint, authType, headersText, body }) {
  const url = `${baseUrl.replace(/\/$/, '')}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const headers = parseHeaders(headersText);

  const authHeader = authType === 'Bearer Token'
    ? ['-H "Authorization: Bearer <token>"']
    : authType === 'API Key Header'
      ? ['-H "x-api-key: <api-key>"']
      : [];

  const customHeaders = headers.map(h => `-H "${h.key}: ${h.value}"`);

  const bodyPart = body.trim() && method !== 'GET' && method !== 'DELETE'
    ? [`-H "Content-Type: application/json"`, `-d '${body.trim()}'`]
    : [];

  return [
    `curl -X ${method} "${url}"`,
    ...authHeader,
    ...customHeaders,
    ...bodyPart,
  ].join(' \\\n+  ');
}

function buildChecklist({ method, expectedStatus }) {
  const mutationCases = method === 'POST' || method === 'PUT' || method === 'PATCH'
    ? '- Missing required fields returns 400 with useful error details.\n- Invalid data types are rejected with validation messages.'
    : '- Invalid query params are rejected or safely ignored.\n- Unsupported filters/sorts return clear errors.';

  return `### API Test Checklist

- Happy path returns ${expectedStatus} and expected response schema.
- Unauthorized request returns 401/403 when auth is required.
- Wrong HTTP method returns 405 (or expected fallback behavior).
- Non-existing resource returns 404 with stable error shape.
- Response time is below 1500ms under normal conditions.
- Large payload / boundary values are handled safely.
${mutationCases}
- Rate limiting behavior validated for burst traffic (429 when applicable).
`;
}

function buildFieldAssertions(sampleResponse) {
  if (!sampleResponse || typeof sampleResponse !== 'object' || Array.isArray(sampleResponse)) {
    return '';
  }

  const keys = Object.keys(sampleResponse).slice(0, 8);
  if (!keys.length) return '';

  return keys
    .map(key => `  pm.expect(data).to.have.property('${key}');`)
    .join('\n');
}

function buildPostmanTests({ expectedStatus, sampleResponse }) {
  const responseObj = tryParseJson(sampleResponse);
  const fieldAssertions = buildFieldAssertions(responseObj);
  const hasFieldAssertions = Boolean(fieldAssertions);

  return `pm.test('Status code is ${expectedStatus}', function () {
  pm.response.to.have.status(${expectedStatus});
});

pm.test('Response time is acceptable', function () {
  pm.expect(pm.response.responseTime).to.be.below(1500);
});

pm.test('Content-Type is JSON', function () {
  pm.response.to.have.header('Content-Type');
  pm.expect(pm.response.headers.get('Content-Type')).to.include('application/json');
});

pm.test('Response body shape is valid', function () {
  const data = pm.response.json();
${hasFieldAssertions ? fieldAssertions : "  pm.expect(data).to.be.an('object');"}
});`;
}

function buildOutput(config) {
  const curlCommand = buildCurl(config);
  const checklist = buildChecklist(config);
  const postmanTests = buildPostmanTests(config);

  return `# API Test Case Generator Output

## cURL Request
\
${curlCommand}

## Postman Tests (Tests tab)
\
${postmanTests}

## Manual / QA Cases

${checklist}`;
}

export default function ApiTestCaseGenerator() {
  const [method, setMethod] = useLocalStorage('api_test_method', 'POST');
  const [baseUrl, setBaseUrl] = useLocalStorage('api_test_base_url', 'https://api.example.com');
  const [endpoint, setEndpoint] = useLocalStorage('api_test_endpoint', '/v1/users');
  const [expectedStatus, setExpectedStatus] = useLocalStorage('api_test_expected_status', 201);
  const [authType, setAuthType] = useLocalStorage('api_test_auth_type', 'Bearer Token');
  const [headersText, setHeadersText] = useLocalStorage('api_test_headers', 'x-client-id: web-app\nx-request-id: test-run-001');
  const [body, setBody] = useLocalStorage('api_test_body', '{\n  "name": "Rahil",\n  "email": "rahil@example.com"\n}');
  const [sampleResponse, setSampleResponse] = useLocalStorage('api_test_sample_response', '{\n  "id": "u_123",\n  "name": "Rahil",\n  "email": "rahil@example.com",\n  "createdAt": "2026-03-23T10:20:30Z"\n}');
  const [copied, setCopied] = useState(false);

  const generatedOutput = useMemo(() => buildOutput({
    method,
    baseUrl,
    endpoint,
    expectedStatus: Number(expectedStatus) || 200,
    authType,
    headersText,
    body,
    sampleResponse,
  }), [method, baseUrl, endpoint, expectedStatus, authType, headersText, body, sampleResponse]);

  const handleReset = () => {
    setMethod('POST');
    setBaseUrl('https://api.example.com');
    setEndpoint('/v1/users');
    setExpectedStatus(201);
    setAuthType('Bearer Token');
    setHeadersText('x-client-id: web-app\nx-request-id: test-run-001');
    setBody('{\n  "name": "Rahil",\n  "email": "rahil@example.com"\n}');
    setSampleResponse('{\n  "id": "u_123",\n  "name": "Rahil",\n  "email": "rahil@example.com",\n  "createdAt": "2026-03-23T10:20:30Z"\n}');
    setCopied(false);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const resources = [
    { title: 'Postman Test Scripts', url: 'https://learning.postman.com/docs/tests-and-scripts/write-scripts/test-scripts/' },
    { title: 'HTTP Status Codes (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status' },
    { title: 'Cypress API Testing Guide', url: 'https://docs.cypress.io/app/guides/network-requests' },
  ];

  return (
    <div className="tool-page h-full flex flex-col overflow-y-auto">
      <header className="tool-header">
        <div>
          <h2>API Test Case Generator</h2>
          <p>Create practical API testing artifacts: cURL request, Postman test script, and QA checklist.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="secondary-button" onClick={handleReset}>
            <RefreshCw size={14} style={{ marginRight: 6 }} />
            Reset
          </button>
          <button className="primary-button" onClick={handleCopy}>
            <Copy size={14} style={{ marginRight: 6 }} />
            {copied ? 'Copied' : 'Copy Output'}
          </button>
        </div>
      </header>

      <div className="split-view flex-1">
        <div className="split-panel glass-panel">
          <div className="panel-header">Request Config</div>
          <div className="p-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label style={labelStyle}>Method</label>
                <CustomSelect
                  className="full-width"
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  options={METHODS.map(item => ({ value: item, label: item }))}
                />
              </div>
              <div>
                <label style={labelStyle}>Expected Status</label>
                <input
                  type="number"
                  style={fieldStyle}
                  value={expectedStatus}
                  onChange={(e) => setExpectedStatus(e.target.value)}
                />
              </div>
              <div>
                <label style={labelStyle}>Auth Type</label>
                <CustomSelect
                  className="full-width"
                  value={authType}
                  onChange={(e) => setAuthType(e.target.value)}
                  options={AUTH_TYPES.map(item => ({ value: item, label: item }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label style={labelStyle}>Base URL</label>
                <input
                  style={fieldStyle}
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://api.example.com"
                />
              </div>
              <div>
                <label style={labelStyle}>Endpoint</label>
                <input
                  style={fieldStyle}
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                  placeholder="/v1/users"
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Headers (one per line: key:value)</label>
              <textarea
                className="code-textarea"
                style={{ ...fieldStyle, minHeight: 88 }}
                value={headersText}
                onChange={(e) => setHeadersText(e.target.value)}
              />
            </div>

            <div>
              <label style={labelStyle}>Request Body (JSON)</label>
              <textarea
                className="code-textarea"
                style={{ ...fieldStyle, minHeight: 120 }}
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>

            <div>
              <label style={labelStyle}>Sample Success Response (JSON)</label>
              <textarea
                className="code-textarea"
                style={{ ...fieldStyle, minHeight: 120 }}
                value={sampleResponse}
                onChange={(e) => setSampleResponse(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="split-panel glass-panel">
          <div className="panel-header">Generated Output</div>
          <textarea
            className="code-textarea custom-scrollbar"
            value={generatedOutput}
            readOnly
            placeholder="Generated test artifacts appear here..."
          />
        </div>
      </div>

      <ResourceLinks links={resources} />
    </div>
  );
}

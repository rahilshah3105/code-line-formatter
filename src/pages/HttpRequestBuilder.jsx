import { useMemo, useState } from 'react';
import { Copy, RefreshCw, Save, Send } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import ResourceLinks from '../components/ResourceLinks';
import CustomSelect from '../components/CustomSelect';
import './ToolPage.css';

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

const fieldStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid var(--border-light)',
  backgroundColor: 'rgba(128, 128, 128, 0.08)',
  color: 'var(--text-primary)',
  outline: 'none',
};

function linesToPairs(text, separator = ':') {
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const [key, ...rest] = line.split(separator);
      return { key: key?.trim(), value: rest.join(separator).trim() };
    })
    .filter(pair => pair.key);
}

function safeJsonParse(value) {
  try {
    return { ok: true, data: JSON.parse(value) };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

function buildUrl(baseUrl, queryText) {
  const params = linesToPairs(queryText, '=');
  if (!params.length) return baseUrl;
  const query = params.map(item => `${encodeURIComponent(item.key)}=${encodeURIComponent(item.value || '')}`).join('&');
  return `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}${query}`;
}

function buildCurl({ method, url, headersText, body }) {
  const headers = linesToPairs(headersText, ':').map(item => `-H "${item.key}: ${item.value}"`);
  const bodyPart = body.trim() && method !== 'GET' && method !== 'DELETE' ? [`-d '${body}'`] : [];
  return [`curl -X ${method} "${url}"`, ...headers, ...bodyPart].join(' \\\n+  ');
}

function buildFetch({ method, url, headersText, body }) {
  const headers = linesToPairs(headersText, ':');
  const headerObject = headers.reduce((acc, item) => ({ ...acc, [item.key]: item.value }), {});
  const bodyLine = body.trim() && method !== 'GET' && method !== 'DELETE' ? `  body: JSON.stringify(${body}),\n` : '';
  return `fetch('${url}', {\n  method: '${method}',\n  headers: ${JSON.stringify(headerObject, null, 2)},\n${bodyLine}})\n  .then(r => r.json())\n  .then(console.log)\n  .catch(console.error);`;
}

function formatHeaders(headersObject) {
  const entries = Object.entries(headersObject || {});
  if (!entries.length) return 'No response headers.';
  return entries.map(([key, value]) => `${key}: ${value}`).join('\n');
}

export default function HttpRequestBuilder() {
  const [method, setMethod] = useLocalStorage('http_builder_method', 'GET');
  const [baseUrl, setBaseUrl] = useLocalStorage('http_builder_url', 'https://api.example.com/v1/users');
  const [queryText, setQueryText] = useLocalStorage('http_builder_query', 'page=1\nlimit=10');
  const [headersText, setHeadersText] = useLocalStorage('http_builder_headers', 'Content-Type: application/json\nAccept: application/json');
  const [body, setBody] = useLocalStorage('http_builder_body', '{\n  "name": "Rahil"\n}');
  const [savedRequests, setSavedRequests] = useLocalStorage('http_builder_saved', []);
  const [copied, setCopied] = useState(false);
  const [activeView, setActiveView] = useState('response');
  const [isSending, setIsSending] = useState(false);
  const [responseState, setResponseState] = useState({
    status: null,
    ok: false,
    timeMs: null,
    headers: {},
    body: '',
    error: '',
  });

  const fullUrl = useMemo(() => buildUrl(baseUrl, queryText), [baseUrl, queryText]);
  const curl = useMemo(() => buildCurl({ method, url: fullUrl, headersText, body }), [method, fullUrl, headersText, body]);
  const fetchSnippet = useMemo(() => buildFetch({ method, url: fullUrl, headersText, body }), [method, fullUrl, headersText, body]);
  const output = `# API Workbench Output\n\n## URL\n${fullUrl}\n\n## cURL\n${curl}\n\n## Fetch Snippet\n${fetchSnippet}`;

  const responseViewText = useMemo(() => {
    if (responseState.error) {
      return `Request failed:\n${responseState.error}`;
    }
    if (responseState.status === null) {
      return 'No response yet. Click Send to execute the request.';
    }

    return [
      `Status: ${responseState.status} (${responseState.ok ? 'OK' : 'Failed'})`,
      `Time: ${responseState.timeMs ?? '-'} ms`,
      '',
      'Headers:',
      formatHeaders(responseState.headers),
      '',
      'Body:',
      responseState.body || '[Empty response body]'
    ].join('\n');
  }, [responseState]);

  const sendRequest = async () => {
    setIsSending(true);
    setResponseState({ status: null, ok: false, timeMs: null, headers: {}, body: '', error: '' });

    try {
      const headersPairs = linesToPairs(headersText, ':');
      const headersObject = headersPairs.reduce((acc, item) => ({ ...acc, [item.key]: item.value }), {});

      let requestBody;
      if (body.trim() && method !== 'GET' && method !== 'DELETE') {
        if ((headersObject['Content-Type'] || '').includes('application/json')) {
          const parsed = safeJsonParse(body);
          if (!parsed.ok) {
            throw new Error(`Invalid JSON body: ${parsed.error}`);
          }
          requestBody = JSON.stringify(parsed.data);
        } else {
          requestBody = body;
        }
      }

      const startedAt = performance.now();
      const response = await fetch(fullUrl, {
        method,
        headers: headersObject,
        body: requestBody,
      });
      const endedAt = performance.now();

      const headerMap = {};
      response.headers.forEach((value, key) => { headerMap[key] = value; });

      const text = await response.text();
      const parsed = safeJsonParse(text);
      const formattedBody = parsed.ok ? JSON.stringify(parsed.data, null, 2) : text;

      setResponseState({
        status: response.status,
        ok: response.ok,
        timeMs: Math.round(endedAt - startedAt),
        headers: headerMap,
        body: formattedBody,
        error: '',
      });
      setActiveView('response');
    } catch (error) {
      setResponseState({
        status: null,
        ok: false,
        timeMs: null,
        headers: {},
        body: '',
        error: error.message || 'Unknown request failure',
      });
      setActiveView('response');
    } finally {
      setIsSending(false);
    }
  };

  const onCopy = async () => {
    const textToCopy = activeView === 'response' ? responseViewText : output;
    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  const onReset = () => {
    setMethod('GET');
    setBaseUrl('https://api.example.com/v1/users');
    setQueryText('page=1\nlimit=10');
    setHeadersText('Content-Type: application/json\nAccept: application/json');
    setBody('{\n  "name": "Rahil"\n}');
  };

  const onSave = () => {
    const entry = {
      id: Date.now(),
      name: `${method} ${baseUrl}`,
      method,
      baseUrl,
      queryText,
      headersText,
      body,
    };
    setSavedRequests([entry, ...savedRequests].slice(0, 20));
  };

  const loadRequest = (entry) => {
    setMethod(entry.method);
    setBaseUrl(entry.baseUrl);
    setQueryText(entry.queryText);
    setHeadersText(entry.headersText);
    setBody(entry.body);
  };

  const removeRequest = (id) => setSavedRequests(savedRequests.filter(item => item.id !== id));

  const resources = [
    { title: 'HTTP Methods Reference', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods' },
    { title: 'Fetch API', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API' },
    { title: 'CORS Guide', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS' },
  ];

  return (
    <div className="tool-page h-full flex flex-col overflow-y-auto">
      <header className="tool-header">
        <div>
          <h2>API Workbench (Postman-like)</h2>
          <p>Build requests, send them live, inspect status/headers/body, and replay saved request configs.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="primary-button" onClick={sendRequest} disabled={isSending}>
            <Send size={14} style={{ marginRight: 6 }} />
            {isSending ? 'Sending...' : 'Send'}
          </button>
          <button className="secondary-button" onClick={onReset}><RefreshCw size={14} style={{ marginRight: 6 }} />Reset</button>
          <button className="secondary-button" onClick={onSave}><Save size={14} style={{ marginRight: 6 }} />Save</button>
          <button className="secondary-button" onClick={onCopy}><Copy size={14} style={{ marginRight: 6 }} />{copied ? 'Copied' : 'Copy Active View'}</button>
        </div>
      </header>

      <div className="split-view flex-1">
        <div className="split-panel glass-panel">
          <div className="panel-header">Request Config</div>
          <div className="p-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
            <div>
              <label style={{ display: 'block', marginBottom: 8, color: 'var(--text-secondary)' }}>Method</label>
              <CustomSelect
                className="full-width"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                options={METHODS.map(item => ({ value: item, label: item }))}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 8, color: 'var(--text-secondary)' }}>Base URL</label>
              <input style={fieldStyle} value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 8, color: 'var(--text-secondary)' }}>Query (key=value per line)</label>
              <textarea className="code-textarea" style={{ ...fieldStyle, minHeight: 90 }} value={queryText} onChange={(e) => setQueryText(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 8, color: 'var(--text-secondary)' }}>Headers (key:value per line)</label>
              <textarea className="code-textarea" style={{ ...fieldStyle, minHeight: 90 }} value={headersText} onChange={(e) => setHeadersText(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 8, color: 'var(--text-secondary)' }}>Body (JSON)</label>
              <textarea className="code-textarea" style={{ ...fieldStyle, minHeight: 120 }} value={body} onChange={(e) => setBody(e.target.value)} />
            </div>
            <div>
              <div style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>Saved Requests</div>
              <div className="custom-scrollbar" style={{ maxHeight: 150, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {savedRequests.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No saved requests yet.</div>}
                {savedRequests.map(item => (
                  <div key={item.id} style={{ border: '1px solid var(--border-light)', borderRadius: 8, padding: '8px 10px', display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <button onClick={() => loadRequest(item)} style={{ textAlign: 'left', color: 'var(--text-primary)', flex: 1 }}>{item.name}</button>
                    <button onClick={() => removeRequest(item.id)} style={{ color: 'var(--accent-error)', fontSize: '0.8rem' }}>Delete</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="split-panel glass-panel">
          <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Inspector</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                className="secondary-button"
                style={{ padding: '4px 10px', fontSize: '0.78rem', opacity: activeView === 'response' ? 1 : 0.8 }}
                onClick={() => setActiveView('response')}
              >
                Response
              </button>
              <button
                className="secondary-button"
                style={{ padding: '4px 10px', fontSize: '0.78rem', opacity: activeView === 'snippets' ? 1 : 0.8 }}
                onClick={() => setActiveView('snippets')}
              >
                Snippets
              </button>
            </div>
          </div>
          <textarea
            className="code-textarea custom-scrollbar"
            readOnly
            value={activeView === 'response' ? responseViewText : output}
          />
        </div>
      </div>

      <ResourceLinks links={resources} />
    </div>
  );
}

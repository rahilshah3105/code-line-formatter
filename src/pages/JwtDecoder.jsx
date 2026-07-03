import { useState } from 'react';
import ResourceLinks from '../components/ResourceLinks';
import { useLocalStorage } from '../hooks/useLocalStorage';
import './ToolPage.css';

export default function JwtDecoder() {
  const [token, setToken] = useLocalStorage('jwt_token', '');
  const [header, setHeader] = useState('');
  const [payload, setPayload] = useState('');
  const [error, setError] = useState('');

  const decodeJwt = (val) => {
    setToken(val);
    setError('');

    if (!val || val.trim() === '') {
      setHeader('');
      setPayload('');
      return;
    }

    try {
      const parts = val.split('.');
      if (parts.length !== 3) {
        throw new Error('JWT must have 3 parts (Header, Payload, Signature).');
      }

      // Base64URL decode
      const decodeBase64Url = (str) => {
        let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
        // Pad with standard base64 padding
        const pad = base64.length % 4;
        if (pad) {
          if (pad === 1) throw new Error('Invalid Base64 string.');
          base64 += new Array(5 - pad).join('=');
        }
        return decodeURIComponent(escape(atob(base64)));
      };

      const decodedHeader = JSON.parse(decodeBase64Url(parts[0]));
      const decodedPayload = JSON.parse(decodeBase64Url(parts[1]));

      setHeader(JSON.stringify(decodedHeader, null, 2));
      setPayload(JSON.stringify(decodedPayload, null, 2));
    } catch (e) {
      setError(e.message || 'Invalid JWT format.');
      setHeader('');
      setPayload('');
    }
  };

  const resources = [
    { title: "jwt.io Documentation", url: "https://jwt.io/introduction" },
    { title: "RFC 7519 (JWT Standard)", url: "https://datatracker.ietf.org/doc/html/rfc7519" }
  ];

  return (
    <div className="tool-page h-full flex flex-col overflow-y-auto">
      <header className="tool-header">
        <div>
          <h2>JWT Decoder</h2>
          <p>Safely decode JSON Web Tokens directly in your browser. Tokens are never sent to a server.</p>
        </div>
      </header>

      <div className="split-view flex-1 flex-col md:flex-row">
        <div className="flex-1 glass-panel rounded-xl overflow-hidden flex flex-col min-w-[300px]">
          <div className="panel-header">Encoded JWT</div>
          <textarea
            className="code-textarea custom-scrollbar break-all"
            value={token}
            onChange={(e) => decodeJwt(e.target.value)}
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
          />
          {error && <div className="p-3 text-red-400 text-sm bg-red-900/20">{error}</div>}
        </div>

        <div className="flex-1 flex flex-col gap-4 min-w-[300px]">
          <div className="glass-panel flex-1 flex flex-col rounded-xl overflow-hidden">
            <div className="panel-header text-[var(--accent-error)] border-b border-[rgba(239,68,68,0.2)]">Header (Algorithm & Type)</div>
            <textarea
              className="code-textarea custom-scrollbar text-[#fca5a5]"
              value={header}
              readOnly
            />
          </div>
          <div className="glass-panel flex-[2] flex flex-col rounded-xl overflow-hidden">
            <div className="panel-header text-[var(--accent-success)] border-b border-[rgba(16,185,129,0.2)]">Payload (Data)</div>
            <textarea
              className="code-textarea custom-scrollbar text-[#6ee7b7]"
              value={payload}
              readOnly
            />
          </div>
        </div>
      </div>

      <ResourceLinks links={resources} />
    </div>
  );
}

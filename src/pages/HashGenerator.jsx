import { useState, useEffect } from 'react';
import ResourceLinks from '../components/ResourceLinks';
import { useLocalStorage } from '../hooks/useLocalStorage';
import './ToolPage.css';

export default function HashGenerator() {
  const [input, setInput] = useLocalStorage('hash_input', '');
  const [hashes, setHashes] = useState({
    sha1: '',
    sha256: '',
    sha384: '',
    sha512: ''
  });

  useEffect(() => {
    if (!input) {
      setHashes({ sha1: '', sha256: '', sha384: '', sha512: '' });
      return;
    }

    const generateHashes = async () => {
      const msgUint8 = new TextEncoder().encode(input);

      const hashTypes = [
        { name: 'sha1', alg: 'SHA-1' },
        { name: 'sha256', alg: 'SHA-256' },
        { name: 'sha384', alg: 'SHA-384' },
        { name: 'sha512', alg: 'SHA-512' }
      ];

      const newHashes = { ...hashes };

      for (const ht of hashTypes) {
        try {
          const hashBuffer = await crypto.subtle.digest(ht.alg, msgUint8);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
          newHashes[ht.name] = hashHex;
        } catch (e) {
          newHashes[ht.name] = 'Error: algorithm not supported in this environment';
        }
      }

      setHashes(newHashes);
    };

    generateHashes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input]);

  const copyToClipboard = (text) => {
    if (text) navigator.clipboard.writeText(text);
  };

  const resources = [
    { title: "MDN: Web Crypto API", url: "https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API" },
    { title: "SHA-2 Information", url: "https://en.wikipedia.org/wiki/SHA-2" }
  ];

  return (
    <div className="tool-page h-full flex flex-col overflow-y-auto">
      <header className="tool-header">
        <div>
          <h2>Hash / Crypto Generator</h2>
          <p>Generate secure cryptographic hashes directly in your browser without sending strings to a server.</p>
        </div>
      </header>

      <div className="split-view flex-1 flex-col md:flex-row mb-6">
        <div className="flex-[1] glass-panel rounded-xl overflow-hidden flex flex-col">
          <div className="panel-header">Input String</div>
          <textarea
            className="code-textarea custom-scrollbar"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your string here to hash..."
          />
        </div>

        <div className="flex-[2] flex flex-col gap-4">
          {[
            { label: 'SHA-256 (Standard secure)', value: hashes.sha256, color: 'text-green-400' },
            { label: 'SHA-512 (Ultra secure)', value: hashes.sha512, color: 'text-blue-400' },
            { label: 'SHA-384', value: hashes.sha384, color: 'text-purple-400' },
            { label: 'SHA-1 (Legacy, insecure)', value: hashes.sha1, color: 'text-red-400' }
          ].map((hash, idx) => (
            <div key={idx} className="glass-panel flex-1 rounded-xl overflow-hidden flex flex-col items-stretch">
              <div className="panel-header flex justify-between items-center py-2 px-4 shadow">
                <span className="text-[var(--text-muted)]">{hash.label}</span>
                <button
                  className="text-xs bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] px-2 py-1 rounded transition-colors"
                  onClick={() => copyToClipboard(hash.value)}
                >
                  Copy
                </button>
              </div>
              <div className={`p-4 font-mono text-sm break-all ${hash.color}`}>
                {hash.value || <span className="text-[var(--text-muted)] italic">...</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <ResourceLinks links={resources} />
    </div>
  );
}

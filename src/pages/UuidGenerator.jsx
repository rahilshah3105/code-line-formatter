import { useState } from 'react';
import ResourceLinks from '../components/ResourceLinks';
import './ToolPage.css';

export default function UuidGenerator() {
  const [uuids, setUuids] = useState([]);
  const [count, setCount] = useState(5);

  const generateUuids = () => {
    const newUuids = [];
    for (let i = 0; i < count; i++) {
      newUuids.push(crypto.randomUUID());
    }
    setUuids(newUuids);
  };

  const copyToClipboard = () => {
    if (uuids.length > 0) {
      navigator.clipboard.writeText(uuids.join('\n'));
    }
  };

  const resources = [
    { title: "MDN: crypto.randomUUID", url: "https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID" },
    { title: "What is a UUID?", url: "https://en.wikipedia.org/wiki/Universally_unique_identifier" }
  ];

  return (
    <div className="tool-page h-full flex flex-col overflow-y-auto">
      <header className="tool-header">
        <div>
          <h2>UUID / GUID Generator</h2>
          <p>Instantly generate standard v4 UUIDs natively.</p>
        </div>
        <div className="flex gap-2 items-center">
          <label className="text-sm text-[var(--text-secondary)]">Count:</label>
          <input
            type="number"
            min="1"
            max="1000"
            value={count}
            onChange={(e) => setCount(parseInt(e.target.value) || 1)}
            className="tool-number-input"
          />
          <button className="primary-button" onClick={generateUuids}>Generate</button>
          <button className="secondary-button" onClick={copyToClipboard}>Copy All</button>
        </div>
      </header>

      <div className="flex-1 glass-panel rounded-xl overflow-hidden shadow border-[var(--border-light)] mb-4 p-4 custom-scrollbar overflow-y-auto font-mono text-sm text-[var(--text-primary)] whitespace-pre-wrap">
        {uuids.length === 0 ? (
          <div className="opacity-40 italic h-full flex items-center justify-center">Click Generate to create UUIDs</div>
        ) : (
          uuids.map((uuid, i) => <div key={i} className="mb-1">{uuid}</div>)
        )}
      </div>

      <ResourceLinks links={resources} />
    </div>
  );
}

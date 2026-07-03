import { useState } from 'react';
import ResourceLinks from '../components/ResourceLinks';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { ArrowLeftRight } from 'lucide-react';
import './ToolPage.css';

export default function Base64Converter() {
  const [input, setInput] = useLocalStorage('base64_input', '');
  const [output, setOutput] = useLocalStorage('base64_output', '');
  const [mode, setMode] = useLocalStorage('base64_mode', 'encode');

  const processConvert = (val, currentMode) => {
    setInput(val);
    if (!val) {
      setOutput('');
      return;
    }

    try {
      if (currentMode === 'encode') {
        const encoded = btoa(unescape(encodeURIComponent(val)));
        setOutput(encoded);
      } else {
        const decoded = decodeURIComponent(escape(atob(val)));
        setOutput(decoded);
      }
    } catch (e) {
      setOutput('Error: Invalid input for chosen operation.');
    }
  };

  const toggleMode = () => {
    const newMode = mode === 'encode' ? 'decode' : 'encode';
    setMode(newMode);
    processConvert(input, newMode);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
  };

  const resources = [
    { title: "MDN: Base64 Encoding/Decoding", url: "https://developer.mozilla.org/en-US/docs/Glossary/Base64" },
    { title: "btoa() function", url: "https://developer.mozilla.org/en-US/docs/Web/API/btoa" }
  ];

  return (
    <div className="tool-page h-full flex flex-col overflow-y-auto">
      <header className="tool-header">
        <div>
          <h2>Base64 Encoder / Decoder</h2>
          <p>Instantly encode text into Base64 format, or decode Base64 back into plain text.</p>
        </div>
        <div className="flex gap-2">
          <button className="secondary-button flex items-center gap-2" onClick={toggleMode}>
            <ArrowLeftRight size={16} /> Switch to {mode === 'encode' ? 'Decode' : 'Encode'}
          </button>
          <button className="primary-button" onClick={copyToClipboard}>
            Copy Output
          </button>
        </div>
      </header>

      <div className="flex gap-2 text-sm text-[var(--accent-primary)] mb-2 uppercase tracking-wide font-semibold">
        Current Mode: {mode.toUpperCase()}
      </div>

      <div className="split-view flex-1">
        <div className="split-panel glass-panel">
          <div className="panel-header">Input {mode === 'encode' ? 'Text' : 'Base64'}</div>
          <textarea
            className="code-textarea custom-scrollbar"
            value={input}
            onChange={(e) => processConvert(e.target.value, mode)}
            placeholder={`Enter ${mode === 'encode' ? 'text to encode' : 'Base64 to decode'}...`}
          />
        </div>
        <div className="split-panel glass-panel">
          <div className="panel-header">Output {mode === 'encode' ? 'Base64' : 'Text'}</div>
          <textarea
            className="code-textarea custom-scrollbar"
            value={output}
            readOnly
            placeholder="Result will appear here..."
          />
        </div>
      </div>

      <ResourceLinks links={resources} />
    </div>
  );
}

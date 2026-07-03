import { useState } from 'react';
import ResourceLinks from '../components/ResourceLinks';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { ArrowLeftRight } from 'lucide-react';
import './ToolPage.css';

export default function UrlConverter() {
  const [input, setInput] = useLocalStorage('url_input', '');
  const [output, setOutput] = useLocalStorage('url_output', '');
  const [mode, setMode] = useLocalStorage('url_mode', 'encode');

  const processConvert = (val, currentMode) => {
    setInput(val);
    if (!val) {
      setOutput('');
      return;
    }

    try {
      if (currentMode === 'encode') {
        setOutput(encodeURIComponent(val));
      } else {
        setOutput(decodeURIComponent(val));
      }
    } catch (e) {
      setOutput('Error: Invalid URL encoding.');
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
    { title: "MDN: encodeURIComponent", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent" },
    { title: "URL Encoding Standard", url: "https://www.w3schools.com/tags/ref_urlencode.ASP" }
  ];

  return (
    <div className="tool-page h-full flex flex-col overflow-y-auto">
      <header className="tool-header">
        <div>
          <h2>URL Encoder / Decoder</h2>
          <p>Properly encode URL parameters or decode tricky URLs back to readable text.</p>
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
          <div className="panel-header">Input {mode === 'encode' ? 'Text' : 'URL Encoded Data'}</div>
          <textarea
            className="code-textarea custom-scrollbar"
            value={input}
            onChange={(e) => processConvert(e.target.value, mode)}
            placeholder={`Enter ${mode === 'encode' ? 'text to encode' : 'URL to decode'}...`}
          />
        </div>
        <div className="split-panel glass-panel">
          <div className="panel-header">Output {mode === 'encode' ? 'URL Encoded Data' : 'Text'}</div>
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

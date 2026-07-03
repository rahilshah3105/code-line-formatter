import { useState } from 'react';
import ResourceLinks from '../components/ResourceLinks';
import './ToolPage.css';

export default function CodeShrinker() {
  const [tab, setTab] = useState('add'); // 'add' or 'remove'
  const [inputCode, setInputCode] = useState('');
  const [outputCode, setOutputCode] = useState('');
  const [removeIndentation, setRemoveIndentation] = useState(false);

  const processCode = (value, currentTab, shouldRemoveIndent) => {
    setInputCode(value);
    
    if (currentTab === 'add') {
      let textToConvert = value;
      if (shouldRemoveIndent) {
        textToConvert = textToConvert.replace(/^[ \t]+/gm, ''); // remove leading whitespace
      }
      
      // JSON.stringify natively escapes \n, \t, etc., and encloses with quotes
      let converted = JSON.stringify(textToConvert);
      if (converted.startsWith('"') && converted.endsWith('"')) {
        converted = converted.slice(1, -1);
      }
      setOutputCode(converted);
    } else if (currentTab === 'remove') {
      try {
        const converted = JSON.parse('"' + value + '"');
        setOutputCode(converted);
      } catch {
        let converted = value
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '\r')
          .replace(/\\t/g, '\t')
          .replace(/\\f/g, '\f')
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\');
        setOutputCode(converted);
      }
    }
  };

  const handleTabChange = (newTab) => {
    setTab(newTab);
    processCode(inputCode, newTab, removeIndentation);
  };

  const handleCheckboxChange = (e) => {
    const checked = e.target.checked;
    setRemoveIndentation(checked);
    processCode(inputCode, tab, checked);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(outputCode);
  };

  const resources = [
    { title: "String escaping in JavaScript", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String#escape_sequences" },
    { title: "JSON.stringify for text", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify" }
  ];

  return (
    <div className="tool-page h-full flex flex-col overflow-y-auto">
      <header className="tool-header">
        <div>
          <h2>Code \\n Shrinker</h2>
          <p>Easily convert your multi-line code/JSON into a single-line string with escaped newlines.</p>
        </div>
        <button className="primary-button" onClick={copyToClipboard}>Copy Output</button>
      </header>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-2">
        <div className="tabs">
          <button 
            className={`tab-btn ${tab === 'add' ? 'active' : ''}`}
            onClick={() => handleTabChange('add')}
          >
            Add \n (Shrink)
          </button>
          <button 
            className={`tab-btn ${tab === 'remove' ? 'active' : ''}`}
            onClick={() => handleTabChange('remove')}
          >
            Remove \n (Expand)
          </button>
        </div>
        {tab === 'add' && (
          <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)] cursor-pointer hover:text-[var(--text-primary)] transition-colors shrink-0">
            <input 
              type="checkbox" 
              className="accent-[var(--accent-primary)] cursor-pointer shrink-0"
              checked={removeIndentation}
              onChange={handleCheckboxChange}
            />
            Remove leading indentation (spaces/tabs)
          </label>
        )}
      </div>

      <div className="split-view">
        <div className="split-panel glass-panel">
          <div className="panel-header">Input Code</div>
          <textarea
            className="code-textarea custom-scrollbar"
            value={inputCode}
            onChange={(e) => processCode(e.target.value, tab)}
            placeholder={tab === 'add' ? 'Paste multi-line text here...' : 'Paste single-line text with \\n here...'}
          />
        </div>
        <div className="split-panel glass-panel">
          <div className="panel-header">Output</div>
          <textarea
            className="code-textarea custom-scrollbar"
            value={outputCode}
            readOnly
            placeholder="Result will appear here..."
          />
        </div>
      </div>

      <ResourceLinks links={resources} />
    </div>
  );
}

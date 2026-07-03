import { useState } from 'react';
import ResourceLinks from '../components/ResourceLinks';
import './ToolPage.css';

export default function JsonToTypes() {
  const [jsonInput, setJsonInput] = useState('{\n  "id": 1,\n  "name": "DevToolkit",\n  "isActive": true,\n  "tags": ["developer", "tools"]\n}');
  const [tsOutput, setTsOutput] = useState('');
  const [interfaceName, setInterfaceName] = useState('RootObject');

  const generateTypes = (jsonStr, rootName) => {
    try {
      if (!jsonStr.trim()) {
        setTsOutput('');
        return;
      }
      const obj = JSON.parse(jsonStr);

      const interfaces = {};

      const inferType = (value, currentName) => {
        if (value === null) return 'any';
        if (Array.isArray(value)) {
          if (value.length === 0) return 'any[]';
          const type = inferType(value[0], currentName + 'Item');
          return `${type}[]`;
        }
        if (typeof value === 'object') {
          // It's an object, we need to create an interface for it
          let props = '';
          for (const key in value) {
            const propType = inferType(value[key], currentName + '_' + key);
            props += `  ${key}: ${propType};\n`;
          }
          interfaces[currentName] = `export interface ${currentName} {\n${props}}`;
          return currentName;
        }
        return typeof value; // 'string', 'number', 'boolean'
      };

      inferType(obj, rootName);

      const finalOutput = Object.values(interfaces).join('\n\n');
      setTsOutput(finalOutput || `export type ${rootName} = any;`);
    } catch (e) {
      setTsOutput('// Error: Invalid JSON.\n// Please provide valid JSON to generate types.');
    }
  };

  const handleInputChange = (val) => {
    setJsonInput(val);
    generateTypes(val, interfaceName);
  };

  const handleNameChange = (val) => {
    setInterfaceName(val);
    generateTypes(jsonInput, val);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(tsOutput);
  };

  const resources = [
    { title: "TypeScript Interfaces", url: "https://www.typescriptlang.org/docs/handbook/interfaces.html" }
  ];

  return (
    <div className="tool-page h-full flex flex-col overflow-y-auto">
      <header className="tool-header">
        <div>
          <h2>JSON to TypeScript Types</h2>
          <p>Paste your JSON payload and instantly generate TypeScript interfaces.</p>
        </div>
        <div className="flex gap-2 items-center">
          <input
            type="text"
            className="bg-[rgba(255,255,255,0.05)] text-[var(--text-primary)] border border-[rgba(255,255,255,0.1)] rounded px-3 py-2 text-sm outline-none"
            placeholder="Root Interface Name"
            value={interfaceName}
            onChange={(e) => handleNameChange(e.target.value)}
          />
          <button className="primary-button" onClick={copyToClipboard}>
            Copy Types
          </button>
        </div>
      </header>

      <div className="split-view flex-1">
        <div className="split-panel glass-panel">
          <div className="panel-header">JSON Input</div>
          <textarea
            className="code-textarea custom-scrollbar"
            value={jsonInput}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Paste raw JSON here..."
          />
        </div>
        <div className="split-panel glass-panel bg-[#0a0a0b]">
          <div className="panel-header text-[var(--accent-primary)] border-b border-[rgba(59,130,246,0.2)]">TypeScript Interfaces</div>
          <textarea
            className="code-textarea custom-scrollbar text-[#4ade80]"
            value={tsOutput}
            readOnly
            placeholder="Generated types will appear here..."
          />
        </div>
      </div>

      <ResourceLinks links={resources} />
    </div>
  );
}

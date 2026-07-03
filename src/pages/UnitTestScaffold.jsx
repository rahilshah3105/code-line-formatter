import { useMemo, useState } from 'react';
import { Copy, RefreshCw } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import ResourceLinks from '../components/ResourceLinks';
import CustomSelect from '../components/CustomSelect';
import './ToolPage.css';

const FRAMEWORKS = ['Jest', 'Vitest'];
const TARGET_TYPES = ['Function', 'React Component'];

const fieldStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid var(--border-light)',
  backgroundColor: 'rgba(128, 128, 128, 0.08)',
  color: 'var(--text-primary)',
  outline: 'none',
};

function parseLines(value) {
  return value.split('\n').map(line => line.trim()).filter(Boolean);
}

function buildTemplate({ framework, targetType, targetName, scenarios }) {
  const imports = framework === 'Vitest'
    ? `import { describe, it, expect } from 'vitest';`
    : `describe, it, expect are available globally in Jest`;

  const scenarioBlocks = scenarios.length
    ? scenarios.map(item => `  it('${item}', () => {\n    // arrange\n    // act\n    // assert\n    expect(true).toBe(true);\n  });`).join('\n\n')
    : `  it('handles happy path', () => {\n    expect(true).toBe(true);\n  });\n\n  it('handles edge case', () => {\n    expect(true).toBe(true);\n  });`;

  const componentHint = targetType === 'React Component'
    ? `// Add React Testing Library imports if needed\n// import { render, screen } from '@testing-library/react';\n`
    : '';

  return `${imports}\n${componentHint}\ndescribe('${targetName || 'target'}', () => {\n${scenarioBlocks}\n});`;
}

export default function UnitTestScaffold() {
  const [framework, setFramework] = useLocalStorage('unit_scaffold_framework', 'Vitest');
  const [targetType, setTargetType] = useLocalStorage('unit_scaffold_target_type', 'Function');
  const [targetName, setTargetName] = useLocalStorage('unit_scaffold_target_name', 'formatCode');
  const [scenariosText, setScenariosText] = useLocalStorage('unit_scaffold_scenarios', 'returns formatted output for valid input\nthrows clear error for invalid syntax\nhandles empty input safely');
  const [copied, setCopied] = useState(false);

  const scenarios = useMemo(() => parseLines(scenariosText), [scenariosText]);
  const output = useMemo(() => buildTemplate({ framework, targetType, targetName, scenarios }), [framework, targetType, targetName, scenarios]);

  const onCopy = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  const onReset = () => {
    setFramework('Vitest');
    setTargetType('Function');
    setTargetName('formatCode');
    setScenariosText('returns formatted output for valid input\nthrows clear error for invalid syntax\nhandles empty input safely');
  };

  const resources = [
    { title: 'Jest Docs', url: 'https://jestjs.io/docs/getting-started' },
    { title: 'Vitest Docs', url: 'https://vitest.dev/guide/' },
    { title: 'Testing Library', url: 'https://testing-library.com/docs/react-testing-library/intro/' },
  ];

  return (
    <div className="tool-page h-full flex flex-col overflow-y-auto">
      <header className="tool-header">
        <div>
          <h2>Unit Test Scaffold</h2>
          <p>Generate quick Jest/Vitest skeletons for functions and React components.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="secondary-button" onClick={onReset}><RefreshCw size={14} style={{ marginRight: 6 }} />Reset</button>
          <button className="primary-button" onClick={onCopy}><Copy size={14} style={{ marginRight: 6 }} />{copied ? 'Copied' : 'Copy Scaffold'}</button>
        </div>
      </header>

      <div className="split-view flex-1">
        <div className="split-panel glass-panel">
          <div className="panel-header">Scaffold Inputs</div>
          <div className="p-4 flex flex-col gap-4">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 8, color: 'var(--text-secondary)' }}>Framework</label>
                <CustomSelect
                  className="full-width"
                  value={framework}
                  onChange={(e) => setFramework(e.target.value)}
                  options={FRAMEWORKS.map(item => ({ value: item, label: item }))}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, color: 'var(--text-secondary)' }}>Target Type</label>
                <CustomSelect
                  className="full-width"
                  value={targetType}
                  onChange={(e) => setTargetType(e.target.value)}
                  options={TARGET_TYPES.map(item => ({ value: item, label: item }))}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 8, color: 'var(--text-secondary)' }}>Target Name</label>
              <input style={fieldStyle} value={targetName} onChange={(e) => setTargetName(e.target.value)} />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 8, color: 'var(--text-secondary)' }}>Test Scenarios (one per line)</label>
              <textarea className="code-textarea" style={{ ...fieldStyle, minHeight: 180 }} value={scenariosText} onChange={(e) => setScenariosText(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="split-panel glass-panel">
          <div className="panel-header">Generated Test File</div>
          <textarea className="code-textarea custom-scrollbar" readOnly value={output} />
        </div>
      </div>

      <ResourceLinks links={resources} />
    </div>
  );
}

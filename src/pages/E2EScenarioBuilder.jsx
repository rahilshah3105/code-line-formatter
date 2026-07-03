import { useMemo, useState } from 'react';
import { Copy, RefreshCw } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import ResourceLinks from '../components/ResourceLinks';
import CustomSelect from '../components/CustomSelect';
import './ToolPage.css';

const FRAMEWORKS = ['Cypress', 'Playwright'];

const fieldStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid var(--border-light)',
  backgroundColor: 'rgba(128, 128, 128, 0.08)',
  color: 'var(--text-primary)',
  outline: 'none',
};

function parseScenarios(text) {
  return text.split('\n').map(line => line.trim()).filter(Boolean);
}

function buildSpec({ framework, baseUrl, featureName, scenarios }) {
  if (framework === 'Playwright') {
    const tests = scenarios.map(item => `test('${item}', async ({ page }) => {\n  await page.goto('${baseUrl}');\n  // TODO: implement scenario steps\n});`).join('\n\n');
    return `import { test, expect } from '@playwright/test';\n\ntest.describe('${featureName}', () => {\n${tests || "test('basic flow', async ({ page }) => {\n  await page.goto('" + baseUrl + "');\n});"}\n});`;
  }

  const tests = scenarios.map(item => `  it('${item}', () => {\n    cy.visit('${baseUrl}');\n    // TODO: implement scenario steps\n  });`).join('\n\n');
  return `describe('${featureName}', () => {\n${tests || "  it('basic flow', () => {\n    cy.visit('" + baseUrl + "');\n  });"}\n});`;
}

export default function E2EScenarioBuilder() {
  const [framework, setFramework] = useLocalStorage('e2e_builder_framework', 'Cypress');
  const [baseUrl, setBaseUrl] = useLocalStorage('e2e_builder_base_url', 'http://localhost:5173');
  const [featureName, setFeatureName] = useLocalStorage('e2e_builder_feature', 'Authentication Flow');
  const [scenarioText, setScenarioText] = useLocalStorage('e2e_builder_scenarios', 'logs in with valid credentials\nshows validation error for invalid password\nlogs out successfully');
  const [copied, setCopied] = useState(false);

  const output = useMemo(() => {
    const scenarios = parseScenarios(scenarioText);
    return buildSpec({ framework, baseUrl, featureName, scenarios });
  }, [framework, baseUrl, featureName, scenarioText]);

  const onCopy = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  const onReset = () => {
    setFramework('Cypress');
    setBaseUrl('http://localhost:5173');
    setFeatureName('Authentication Flow');
    setScenarioText('logs in with valid credentials\nshows validation error for invalid password\nlogs out successfully');
  };

  const resources = [
    { title: 'Cypress Best Practices', url: 'https://docs.cypress.io/app/core-concepts/best-practices' },
    { title: 'Playwright Best Practices', url: 'https://playwright.dev/docs/best-practices' },
  ];

  return (
    <div className="tool-page h-full flex flex-col overflow-y-auto">
      <header className="tool-header">
        <div>
          <h2>E2E Scenario Builder</h2>
          <p>Convert test scenarios into starter Cypress/Playwright specs for QA automation.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="secondary-button" onClick={onReset}><RefreshCw size={14} style={{ marginRight: 6 }} />Reset</button>
          <button className="primary-button" onClick={onCopy}><Copy size={14} style={{ marginRight: 6 }} />{copied ? 'Copied' : 'Copy Spec'}</button>
        </div>
      </header>

      <div className="split-view flex-1">
        <div className="split-panel glass-panel">
          <div className="panel-header">Scenario Inputs</div>
          <div className="p-4 flex flex-col gap-4">
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
              <label style={{ display: 'block', marginBottom: 8, color: 'var(--text-secondary)' }}>Base URL</label>
              <input style={fieldStyle} value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 8, color: 'var(--text-secondary)' }}>Feature Name</label>
              <input style={fieldStyle} value={featureName} onChange={(e) => setFeatureName(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 8, color: 'var(--text-secondary)' }}>Scenarios (one per line)</label>
              <textarea className="code-textarea" style={{ ...fieldStyle, minHeight: 180 }} value={scenarioText} onChange={(e) => setScenarioText(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="split-panel glass-panel">
          <div className="panel-header">Generated E2E Spec</div>
          <textarea className="code-textarea custom-scrollbar" readOnly value={output} />
        </div>
      </div>

      <ResourceLinks links={resources} />
    </div>
  );
}

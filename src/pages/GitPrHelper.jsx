import { useMemo, useState } from 'react';
import { Copy, RefreshCw } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import ResourceLinks from '../components/ResourceLinks';
import CustomSelect from '../components/CustomSelect';
import './ToolPage.css';

const TYPES = ['feat', 'fix', 'refactor', 'docs', 'test', 'chore'];

const fieldStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid var(--border-light)',
  backgroundColor: 'rgba(128, 128, 128, 0.08)',
  color: 'var(--text-primary)',
  outline: 'none',
};

function lines(value) {
  return value.split('\n').map(item => item.trim()).filter(Boolean);
}

export default function GitPrHelper() {
  const [type, setType] = useLocalStorage('git_helper_type', 'feat');
  const [scope, setScope] = useLocalStorage('git_helper_scope', 'tools');
  const [summary, setSummary] = useLocalStorage('git_helper_summary', 'add api test case generator and improve prompts utility');
  const [changes, setChanges] = useLocalStorage('git_helper_changes', 'Added API Test Cases tool page\nAdded Improve Prompts tool\nWired new routes and sidebar links');
  const [testing, setTesting] = useLocalStorage('git_helper_testing', 'Manual validation in dev server\nNo diagnostics errors in updated files');
  const [copied, setCopied] = useState(false);

  const output = useMemo(() => {
    const commitTitle = `${type}${scope ? `(${scope})` : ''}: ${summary}`;
    const changeItems = lines(changes);
    const testingItems = lines(testing);

    return [
      '# Commit + PR Draft',
      '',
      '## Conventional Commit',
      commitTitle,
      '',
      '## Pull Request Title',
      summary.charAt(0).toUpperCase() + summary.slice(1),
      '',
      '## Pull Request Description',
      '### What changed',
      ...(changeItems.length ? changeItems.map(item => `- ${item}`) : ['- Added updates.']),
      '',
      '### Why',
      '- Improve developer productivity and testing workflow.',
      '',
      '### How tested',
      ...(testingItems.length ? testingItems.map(item => `- ${item}`) : ['- Manual validation completed.']),
      '',
      '### Checklist',
      '- [x] No breaking API changes',
      '- [x] Route and navigation updated',
      '- [x] Feature follows existing UI pattern',
    ].join('\n');
  }, [type, scope, summary, changes, testing]);

  const onCopy = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  const onReset = () => {
    setType('feat');
    setScope('tools');
    setSummary('add api test case generator and improve prompts utility');
    setChanges('Added API Test Cases tool page\nAdded Improve Prompts tool\nWired new routes and sidebar links');
    setTesting('Manual validation in dev server\nNo diagnostics errors in updated files');
  };

  const resources = [
    { title: 'Conventional Commits', url: 'https://www.conventionalcommits.org/en/v1.0.0/' },
    { title: 'How to Write a Good PR', url: 'https://github.blog/developer-skills/github/how-to-write-the-perfect-pull-request/' },
  ];

  return (
    <div className="tool-page h-full flex flex-col overflow-y-auto">
      <header className="tool-header">
        <div>
          <h2>Git Commit & PR Helper</h2>
          <p>Generate conventional commit messages and PR descriptions from your change summary.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="secondary-button" onClick={onReset}><RefreshCw size={14} style={{ marginRight: 6 }} />Reset</button>
          <button className="primary-button" onClick={onCopy}><Copy size={14} style={{ marginRight: 6 }} />{copied ? 'Copied' : 'Copy Draft'}</button>
        </div>
      </header>

      <div className="split-view flex-1">
        <div className="split-panel glass-panel">
          <div className="panel-header">Inputs</div>
          <div className="p-4 flex flex-col gap-4">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 8, color: 'var(--text-secondary)' }}>Type</label>
                <CustomSelect
                  className="full-width"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  options={TYPES.map(item => ({ value: item, label: item }))}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, color: 'var(--text-secondary)' }}>Scope</label>
                <input style={fieldStyle} value={scope} onChange={(e) => setScope(e.target.value)} />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 8, color: 'var(--text-secondary)' }}>Summary</label>
              <input style={fieldStyle} value={summary} onChange={(e) => setSummary(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 8, color: 'var(--text-secondary)' }}>What Changed (one per line)</label>
              <textarea className="code-textarea" style={{ ...fieldStyle, minHeight: 140 }} value={changes} onChange={(e) => setChanges(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 8, color: 'var(--text-secondary)' }}>How Tested (one per line)</label>
              <textarea className="code-textarea" style={{ ...fieldStyle, minHeight: 120 }} value={testing} onChange={(e) => setTesting(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="split-panel glass-panel">
          <div className="panel-header">Generated Commit + PR</div>
          <textarea className="code-textarea custom-scrollbar" readOnly value={output} />
        </div>
      </div>

      <ResourceLinks links={resources} />
    </div>
  );
}

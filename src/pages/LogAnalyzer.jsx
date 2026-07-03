import { useMemo, useState } from 'react';
import { Copy, RefreshCw } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import ResourceLinks from '../components/ResourceLinks';
import './ToolPage.css';

const fieldStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid var(--border-light)',
  backgroundColor: 'rgba(128, 128, 128, 0.08)',
  color: 'var(--text-primary)',
  outline: 'none',
};

function analyze(logText) {
  const lines = logText.split('\n').map(line => line.trim()).filter(Boolean);
  const levelCount = { ERROR: 0, WARN: 0, INFO: 0, DEBUG: 0 };
  const signatures = new Map();
  const stacks = [];

  lines.forEach((line) => {
    if (/\berror\b/i.test(line)) levelCount.ERROR += 1;
    if (/\bwarn\b/i.test(line)) levelCount.WARN += 1;
    if (/\binfo\b/i.test(line)) levelCount.INFO += 1;
    if (/\bdebug\b/i.test(line)) levelCount.DEBUG += 1;

    if (/\bat\s+.+\(.+\)/.test(line) || /\.js:\d+:\d+/.test(line)) {
      stacks.push(line);
    }

    if (/error|exception|failed|timeout/i.test(line)) {
      const normalized = line.replace(/\d+/g, '#').slice(0, 120);
      signatures.set(normalized, (signatures.get(normalized) || 0) + 1);
    }
  });

  const topIssues = [...signatures.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([text, count]) => `- (${count}x) ${text}`);

  return {
    total: lines.length,
    levelCount,
    topIssues,
    stackPreview: stacks.slice(0, 10),
  };
}

export default function LogAnalyzer() {
  const [logs, setLogs] = useLocalStorage('log_analyzer_input', 'ERROR Database timeout on /api/users\nWARN Retry attempt 1\nERROR Database timeout on /api/users\nINFO Request completed');
  const [copied, setCopied] = useState(false);

  const report = useMemo(() => {
    const result = analyze(logs);
    return [
      '# Log Analysis Summary',
      '',
      `Total lines: ${result.total}`,
      `ERROR: ${result.levelCount.ERROR}`,
      `WARN: ${result.levelCount.WARN}`,
      `INFO: ${result.levelCount.INFO}`,
      `DEBUG: ${result.levelCount.DEBUG}`,
      '',
      '## Frequent Error Signatures',
      ...(result.topIssues.length ? result.topIssues : ['- No repeated error signatures detected.']),
      '',
      '## Stack Trace Preview',
      ...(result.stackPreview.length ? result.stackPreview.map(line => `- ${line}`) : ['- No stack traces detected.']),
      '',
      '## Suggested Next Steps',
      '- Correlate top signatures with deployment timestamps.',
      '- Add focused retries/timeouts around failing dependencies.',
      '- Create regression test for the top repeated error case.',
    ].join('\n');
  }, [logs]);

  const onCopy = async () => {
    await navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  const onReset = () => {
    setLogs('ERROR Database timeout on /api/users\nWARN Retry attempt 1\nERROR Database timeout on /api/users\nINFO Request completed');
  };

  const resources = [
    { title: 'SRE Golden Signals', url: 'https://sre.google/sre-book/monitoring-distributed-systems/' },
    { title: 'Observability Guide', url: 'https://opentelemetry.io/docs/concepts/observability-primer/' },
  ];

  return (
    <div className="tool-page h-full flex flex-col overflow-y-auto">
      <header className="tool-header">
        <div>
          <h2>Log Analyzer</h2>
          <p>Analyze raw logs to identify repeated failures, severity distribution, and stack trace clues.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="secondary-button" onClick={onReset}><RefreshCw size={14} style={{ marginRight: 6 }} />Reset</button>
          <button className="primary-button" onClick={onCopy}><Copy size={14} style={{ marginRight: 6 }} />{copied ? 'Copied' : 'Copy Report'}</button>
        </div>
      </header>

      <div className="split-view flex-1">
        <div className="split-panel glass-panel">
          <div className="panel-header">Raw Logs</div>
          <textarea className="code-textarea custom-scrollbar" style={fieldStyle} value={logs} onChange={(e) => setLogs(e.target.value)} />
        </div>
        <div className="split-panel glass-panel">
          <div className="panel-header">Analysis Report</div>
          <textarea className="code-textarea custom-scrollbar" readOnly value={report} />
        </div>
      </div>

      <ResourceLinks links={resources} />
    </div>
  );
}

import { useState } from 'react';
import Editor from '@monaco-editor/react';
import ResourceLinks from '../components/ResourceLinks';
import CustomSelect from '../components/CustomSelect';
import { LANGUAGES } from '../utils/constants';
import { useTheme } from '../contexts/ThemeContext';
import './ToolPage.css';

export default function MultiLangEditor() {
  const { theme } = useTheme();
  const [language, setLanguage] = useState(LANGUAGES[0].id);
  const [code, setCode] = useState('// Select a language and start typing...\n');

  const resources = [
    { title: "Monaco Editor Supported Languages", url: "https://github.com/microsoft/monaco-editor#documentation" }
  ];

  return (
    <div className="tool-page h-full flex flex-col overflow-y-auto">
      <header className="tool-header">
        <div>
          <h2>Multi-Language Syntax Highlighter</h2>
          <p>Read and write code with full syntax highlighting for 15+ programming languages.</p>
        </div>
        <div className="flex gap-2 relative z-20">
          <CustomSelect
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            options={LANGUAGES.map(lang => ({ value: lang.id, label: lang.name }))}
          />
        </div>
      </header>

      <div className="monaco-editor-wrapper glass-panel rounded-xl">
        <Editor
          height="100%"
          language={language}
          theme={theme === 'dark' ? 'vs-dark' : 'light'}
          value={code}
          onChange={(val) => setCode(val || '')}
          options={{
            minimap: { enabled: true },
            fontSize: 14,
            fontFamily: 'var(--font-mono)',
            padding: { top: 16 },
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            fixedOverflowWidgets: false,
            scrollbar: {
              alwaysConsumeMouseWheel: false
            }
          }}
        />
      </div>

      <ResourceLinks links={resources} />
    </div>
  );
}

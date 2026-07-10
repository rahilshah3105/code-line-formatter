import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Editor, DiffEditor } from '@monaco-editor/react';
import ResourceLinks from '../components/ResourceLinks';
import CustomSelect from '../components/CustomSelect';
import { LANGUAGES } from '../utils/constants';
import { useTheme } from '../contexts/ThemeContext';
import './ToolPage.css';

export default function DiffChecker() {
  const { theme } = useTheme();
  const location = useLocation();

  const [language, setLanguage] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const langParam = params.get('lang');
    if (langParam) {
      const found = LANGUAGES.find(l => l.id === langParam.toLowerCase());
      if (found) return found.id;
    }
    return LANGUAGES[0].id;
  });

  const [originalCode, setOriginalCode] = useState('// Original Text\nfunction greet() {\n  console.log("Hello, world!");\n}');
  const [modifiedCode, setModifiedCode] = useState('// Modified Text\nfunction greet(name) {\n  console.log(`Hello, ${name}!`);\n}');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const langParam = params.get('lang');
    if (langParam) {
      const found = LANGUAGES.find(l => l.id === langParam.toLowerCase());
      if (found && found.id !== language) {
        setLanguage(found.id);
      }
    }
  }, [location.search, language]);

  const resources = [
    { title: "Understanding Git Diff", url: "https://git-scm.com/docs/git-diff" },
    { title: "Monaco Diff Editor", url: "https://microsoft.github.io/monaco-editor/" }
  ];

  return (
    <div className="tool-page h-full flex flex-col overflow-y-auto">
      <header className="tool-header">
        <div>
          <h2>Code Diff Checker</h2>
          <p>Easily compare two code snippets side-by-side to find differences.</p>
        </div>
        <div className="flex gap-2 relative z-20">
          <CustomSelect
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            options={LANGUAGES.map(lang => ({ value: lang.id, label: lang.name }))}
          />
        </div>
      </header>


      <div className="flex-1 glass-panel rounded-xl overflow-hidden min-h-[400px] flex flex-col">
        <div className="flex flex-1 min-h-[300px] gap-2">
          <div className="monaco-editor-wrapper flex flex-col">
            <div className="text-xs font-semibold text-[var(--text-secondary)] mb-1 pl-1">Original</div>
            <Editor
              height="100%"
              defaultLanguage={language}
              language={language}
              theme={theme === 'dark' ? 'vs-dark' : 'light'}
              value={originalCode}
              onChange={v => setOriginalCode(v ?? '')}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: 'var(--font-mono)',
                padding: { top: 16 },
                scrollBeyondLastLine: false,
                fixedOverflowWidgets: false,
                scrollbar: {
                  alwaysConsumeMouseWheel: false
                }
              }}
            />
          </div>
          <div className="monaco-editor-wrapper flex flex-col">
            <div className="text-xs font-semibold text-[var(--text-secondary)] mb-1 pl-1">Modified</div>
            <Editor
              height="100%"
              defaultLanguage={language}
              language={language}
              theme={theme === 'dark' ? 'vs-dark' : 'light'}
              value={modifiedCode}
              onChange={v => setModifiedCode(v ?? '')}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: 'var(--font-mono)',
                padding: { top: 16 },
                scrollBeyondLastLine: false,
                fixedOverflowWidgets: false,
                scrollbar: {
                  alwaysConsumeMouseWheel: false
                }
              }}
            />
          </div>
        </div>
        <div className="mt-6 border-t pt-4">
          <div className="text-xs font-semibold text-[var(--text-secondary)] mb-2 pl-1">Visual Diff</div>
          <DiffEditor
            height="300px"
            language={language}
            theme={theme === 'dark' ? 'vs-dark' : 'light'}
            original={typeof originalCode === 'string' ? originalCode : ''}
            modified={typeof modifiedCode === 'string' ? modifiedCode : ''}
            options={{
              renderSideBySide: true,
              readOnly: true,
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: 'var(--font-mono)',
              padding: { top: 16 },
              scrollBeyondLastLine: false,
              fixedOverflowWidgets: false,
              scrollbar: {
                alwaysConsumeMouseWheel: false
              }
            }}
          />
        </div>
      </div>

      <ResourceLinks links={resources} />
    </div>
  );
}

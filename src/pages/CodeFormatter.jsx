import { useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { AlignLeft, Copy, Check } from 'lucide-react';
import ResourceLinks from '../components/ResourceLinks';
import CustomSelect from '../components/CustomSelect';
import { LANGUAGES } from '../utils/constants';
import { useTheme } from '../contexts/ThemeContext';
import './ToolPage.css';

export default function CodeFormatter() {
  const { theme } = useTheme();
  const editorRef = useRef(null);
  const [language, setLanguage] = useState('javascript');
  const [copied, setCopied] = useState(false);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Space, () => {
      editor.trigger('keyboard', 'editor.action.triggerSuggest', {});
    });
  };

  const formatCode = () => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument').run();
    }
  };

  const copyToClipboard = () => {
    if (editorRef.current) {
      navigator.clipboard.writeText(editorRef.current.getValue());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const resources = [
    { title: "Prettier Documentation", url: "https://prettier.io/docs/en/" },
    { title: "Monaco Editor Formatting", url: "https://microsoft.github.io/monaco-editor/" }
  ];

  return (
    <div className="tool-page h-full flex flex-col overflow-y-auto">
      <header className="tool-header">
        <div>
          <h2>Code Beautifier & Formatter</h2>
          <p>Instantly format your dirty code into clean, readable syntax. Supports JS, TS, HTML, CSS, JSON.</p>
        </div>
        <div className="flex gap-2 relative z-20">
          <CustomSelect
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            options={LANGUAGES.map(lang => ({ value: lang.id, label: lang.name }))}
          />
          <button className="secondary-button flex items-center gap-2" onClick={copyToClipboard}>
            {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button className="primary-button flex items-center gap-2" onClick={formatCode}>
            <AlignLeft size={16} className='flex-shrink-0' /> Format Code
          </button>
        </div>
      </header>

      <div className="monaco-editor-wrapper glass-panel rounded-xl">
        <Editor
          height="100%"
          defaultLanguage="javascript"
          language={language}
          theme={theme === 'dark' ? 'vs-dark' : 'light'}
          defaultValue="// Paste your messy code here&#10;function test(){console.log( 'hello' );}"
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: 'var(--font-mono)',
            padding: { top: 16 },
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            formatOnPaste: true,
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

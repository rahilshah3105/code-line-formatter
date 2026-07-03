import { useState, useRef } from 'react';
import Editor from '@monaco-editor/react';
import ResourceLinks from '../components/ResourceLinks';
import CustomSelect from '../components/CustomSelect';
import { Play, Terminal as TermIcon, Loader2, Copy, Check } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import './ToolPage.css';

// Wandbox API compilers — stable verified versions
const LANGUAGES = [
  { id: 'python', name: 'Python', compiler: 'cpython-3.12.7', version: '3.12.7' },
  { id: 'javascript', name: 'JavaScript (Node.js)', compiler: 'nodejs-20.17.0', version: '20.17.0' },
  { id: 'typescript', name: 'TypeScript', compiler: 'typescript-5.6.2', version: '5.6.2' },
  { id: 'java', name: 'Java', compiler: 'openjdk-jdk-22+36', version: '22' },
  { id: 'cpp', name: 'C++', compiler: 'gcc-13.2.0', version: '13.2.0' },
  { id: 'c', name: 'C', compiler: 'gcc-13.2.0-c', version: '13.2.0' },
  { id: 'csharp', name: 'C#', compiler: 'mono-6.12.0.199', version: '6.12.0' },
  { id: 'go', name: 'Go', compiler: 'go-1.23.2', version: '1.23.2' },
  { id: 'rust', name: 'Rust', compiler: 'rust-1.82.0', version: '1.82.0' },
  { id: 'php', name: 'PHP', compiler: 'php-8.3.12', version: '8.3.12' },
  { id: 'ruby', name: 'Ruby', compiler: 'ruby-3.4.1', version: '3.4.1' }
];

const DEFAULT_CODE = {
  python: 'print("Hello from Python!")',
  javascript: 'console.log("Hello from Node.js!");',
  typescript: 'const msg: string = "Hello from TS!";\nconsole.log(msg);',
  java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello from Java!");\n    }\n}',
  cpp: '#include <iostream>\n\nint main() {\n    std::cout << "Hello from C++!\\n";\n    return 0;\n}',
  c: '#include <stdio.h>\n\nint main() {\n    printf("Hello from C!\\n");\n    return 0;\n}',
  csharp: 'using System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello from C#!");\n    }\n}',
  go: 'package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello from Go!")\n}',
  rust: 'fn main() {\n    println!("Hello from Rust!");\n}',
  php: '<?php\n\necho "Hello from PHP!\\n";',
  ruby: 'puts "Hello from Ruby!"'
};

const STORAGE_KEY = 'devtoolkit_runner_lang';

export default function RemoteRunner() {
  const { theme } = useTheme();

  // Restore last selected language from localStorage
  const getInitialLang = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const found = LANGUAGES.find(l => l.id === saved);
        if (found) return found;
      }
    } catch { /* ignore */ }
    return LANGUAGES[0];
  };

  const [language, setLanguage] = useState(getInitialLang);
  const [code, setCode] = useState(() => DEFAULT_CODE[getInitialLang().id]);
  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const editorRef = useRef(null);
  const executeCodeRef = useRef(() => { });

  const handleLanguageChange = (e) => {
    const langId = e.target.value;
    const selectedLang = LANGUAGES.find(l => l.id === langId);
    setLanguage(selectedLang);
    setCode(DEFAULT_CODE[langId] || '');
    setOutput('');
    setErrorMsg('');
    try { localStorage.setItem(STORAGE_KEY, langId); } catch { /* ignore */ }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const executeCode = async () => {
    setIsLoading(true);
    setErrorMsg('');
    // setOutput('Compiling and running on Wandbox (free community compiler)...');
    setOutput('Compiling and running...');

    try {
      const response = await fetch('/api/wandbox/compile.json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          compiler: language.compiler,
          // Wandbox uses prog.java as filename for Java — public class must match.
          // Strip 'public' from class/interface/enum declarations to avoid filename mismatch.
          code: language.id === 'java'
            ? code.replace(/\bpublic\s+(class|interface|enum|record)\b/g, '$1')
            : code,
          save: false
        })
      });

      const data = await response.json();

      if (response.status !== 200 || data.error) {
        setErrorMsg(data.error || 'API returned an error.');
        setOutput('');
      } else {
        // Wandbox returns compiler_message, program_message, status
        let outText = '';

        if (data.compiler_message || data.compiler_error) {
          outText += `--- Compiler Output ---\n${data.compiler_message || data.compiler_error}\n`;
        }

        if (data.program_message || data.program_output) {
          outText += `--- Execution Output ---\n${data.program_message || data.program_output || ''}`;
        }

        if (data.status !== '0') {
          outText = `Program exited with code ${data.status}\n\n${outText}`;
        }

        setOutput(outText.trim() || 'Program executed successfully with no output.');
      }
    } catch {
      setErrorMsg('Network error: Could not reach execution server.');
      setOutput('');
    } finally {
      setIsLoading(false);
    }
  };

  executeCodeRef.current = executeCode;

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      if (!isLoading) executeCodeRef.current();
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Space, () => {
      editor.trigger('keyboard', 'editor.action.triggerSuggest', {});
    });
  };

  const resources = [
    { title: "Wandbox API Documentation", url: "https://github.com/melpon/wandbox/blob/master/kennel/API.rst" },
    { title: "Wandbox Main Site", url: "https://wandbox.org/" }
  ];

  return (
    <div className="tool-page h-full flex flex-col overflow-y-auto">
      <header className="tool-header">
        <div>
          <h2>Multi-Language Remote Runner</h2>
          <p>Instantly compile and execute code in isolated containers via the public Wandbox API.</p>
          <p className="text-xs text-[var(--text-muted)] mt-2">Shortcut: Ctrl/Cmd + Enter to run code</p>
        </div>
        <div className="flex gap-2 items-center relative z-20">
          <CustomSelect
            value={language.id}
            onChange={handleLanguageChange}
            disabled={isLoading}
            options={LANGUAGES.map(lang => ({ value: lang.id, label: `${lang.name} (v${lang.version})` }))}
          />
          <button
            className={`primary-button run-button flex items-center gap-2 min-w-[120px] justify-center${isLoading ? ' loading' : ''}`}
            onClick={executeCode}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} fill="currentColor" />}
            {isLoading ? 'Running...' : 'Run Code'}
          </button>
        </div>
      </header>

      {errorMsg && (
        <div className="bg-red-900/20 border border-red-500/30 text-red-500 px-4 py-3 rounded-md text-sm mb-4">
          <strong>Execution Engine Error:</strong> {errorMsg}
        </div>
      )}

      <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-[500px]">
        {/* Editor Panel */}
        <div className="flex-[3] glass-panel rounded-xl overflow-hidden flex flex-col shadow border-[var(--border-light)]">
          <div className="panel-header bg-[var(--header-glass-bg)] flex justify-between items-center border-b border-[var(--border-light)]">
            <span>Editor - {language.name}</span>
            <button
              onClick={copyCode}
              style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                fontSize: '0.75rem', fontWeight: '500',
                color: copied ? 'var(--accent-success)' : 'var(--text-muted)',
                padding: '2px 8px', borderRadius: '4px',
                background: 'transparent', border: 'none', cursor: 'pointer',
                transition: 'color 0.2s'
              }}
              title="Copy code to clipboard"
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <div className="monaco-editor-wrapper py-2">
            <Editor
              height="100%"
              language={language.id === 'c' || language.id === 'cpp' ? 'cpp' : language.id}
              theme={theme === 'dark' ? 'vs-dark' : 'light'}
              value={code}
              onChange={(val) => setCode(val || '')}
              onMount={handleEditorDidMount}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: 'var(--font-mono)',
                padding: { top: 16 },
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                cursorBlinking: 'smooth',
                renderLineHighlight: 'all',
                fixedOverflowWidgets: false,
                scrollbar: {
                  alwaysConsumeMouseWheel: false
                }
              }}
            />
          </div>
        </div>

        {/* Terminal Panel */}
        <div className="flex-[2] glass-panel rounded-xl overflow-hidden flex flex-col shadow border-[var(--border-light)] bg-black">
          <div className="panel-header flex items-center gap-2 text-[var(--text-secondary)] bg-[#111111] border-b border-[#222222]">
            <TermIcon size={14} />
            <span>Terminal Output</span>
          </div>
          <div className="flex-1 p-4 font-mono text-sm overflow-y-auto custom-scrollbar text-[#f4f4f5] whitespace-pre-wrap selection:bg-[#3b82f6] selection:text-white">
            {output ? output : <span className="opacity-40 italic">Waiting for execution...</span>}
          </div>
        </div>
      </div>

      <ResourceLinks links={resources} />
    </div>
  );
}

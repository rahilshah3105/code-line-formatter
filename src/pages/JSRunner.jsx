import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import useCollab from '../hooks/useCollab';
import ResourceLinks from '../components/ResourceLinks';
import { Play, Trash2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import './ToolPage.css';

export default function JSRunner() {
  const { theme } = useTheme();
  const [inputCode, setInputCode] = useState('// Write your JS code here\nconsole.log("Hello, DevToolkit!");\n');
  const [logs, setLogs] = useState([]);
  const [shareLink, setShareLink] = useState('');
  const params = useParams();
  const { roomId, remoteCode, createRoom, connect, sendUpdate } = useCollab();
  const sendTimer = useRef(null);
  const editorRef = useRef(null);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      runCode();
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Space, () => {
      editor.trigger('keyboard', 'editor.action.triggerSuggest', {});
    });
  };

  useEffect(() => {
    if (params.id) connect(params.id);
  }, [params.id, connect]);

  useEffect(() => () => {
    if (sendTimer.current) {
      clearTimeout(sendTimer.current);
    }
  }, []);

  useEffect(() => {
    if (remoteCode !== null && remoteCode !== undefined) {
      if (remoteCode !== inputCode) setInputCode(remoteCode);
      setShareLink(`${window.location.origin}/share/${roomId || params.id}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remoteCode]);

  const runCode = () => {
    const logOutput = [];
    const originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info,
      debug: console.debug
    };

    console.log = (...args) => {
      logOutput.push({ type: 'log', message: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' ') });
      originalConsole.log(...args);
    };
    console.debug = (...args) => {
      logOutput.push({ type: 'debug', message: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' ') });
      if (originalConsole.debug) originalConsole.debug(...args);
    };
    console.error = (...args) => {
      logOutput.push({ type: 'error', message: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' ') });
      originalConsole.error(...args);
    };
    console.warn = (...args) => {
      logOutput.push({ type: 'warn', message: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' ') });
      originalConsole.warn(...args);
    };
    console.info = (...args) => {
      logOutput.push({ type: 'info', message: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' ') });
      originalConsole.info(...args);
    };

    try {
      logOutput.push({ type: 'info', message: '=== Code Execution Started ===' });
      
      let result;
      try {
        const wrappedCode = `(function(){\n${inputCode}\n})();\n//# sourceURL=user-code.js`;
        result = eval(wrappedCode);
      } catch (evalError) {
        if (evalError instanceof SyntaxError) {
          throw evalError;
        }
        const func = new Function(inputCode);
        result = func();
      }

      if (result !== undefined) {
        logOutput.push({ type: 'log', message: `Return value: ${typeof result === 'object' ? JSON.stringify(result, null, 2) : result}` });
      }

      logOutput.push({ type: 'success', message: '✓ Execution completed!' });
    } catch (error) {
      logOutput.push({ type: 'error', message: `[${error.name}] ${error.message}` });
    } finally {
      console.log = originalConsole.log;
      console.error = originalConsole.error;
      console.warn = originalConsole.warn;
      console.info = originalConsole.info;
      console.debug = originalConsole.debug;
    }

    setLogs(logOutput);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const resources = [
    { title: "MDN: JavaScript Basics", url: "https://developer.mozilla.org/en-US/docs/Learn/Getting_started_with_the_web/JavaScript_basics" },
    { title: "JS Try/Catch", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/try...catch" }
  ];

  return (
    <div className="tool-page h-full flex flex-col overflow-y-auto">
      <header className="tool-header">
        <div>
          <h2>JavaScript Runner (Browser)</h2>
          <p>Runs JavaScript directly in your browser context. Use Remote Runner for JavaScript (Node.js) execution.</p>
          <p className="text-xs text-[var(--text-muted)] mt-2">Shortcut: Ctrl/Cmd + Enter to run code. Monaco suggestions and tab indentation are enabled.</p>
        </div>
        <div className="flex gap-2">
          <button className="secondary-button flex items-center gap-2" onClick={clearLogs}>
            <Trash2 size={16} /> Clear Output
          </button>
          <button className="secondary-button flex items-center gap-2" onClick={() => {
            const id = createRoom();
            setShareLink(`${window.location.origin}/share/${id}`);
            // send initial code after small delay to ensure WS connected
            setTimeout(() => sendUpdate(inputCode), 300);
          }}>
            Share
          </button>
          <button className="primary-button !flex !items-center gap-2" onClick={runCode}>
            <Play size={16} fill="currentColor" /> Run Code
          </button>
        </div>
      </header>

      <div className="split-view">
        <div className="split-panel glass-panel">
          <div className="panel-header">JS Code</div>
          <div className="monaco-editor-wrapper">
            <Editor
              height="100%"
              defaultLanguage="javascript"
              language="javascript"
              theme={theme === 'dark' ? 'vs-dark' : 'light'}
              value={inputCode}
              onChange={(value) => {
                const nextCode = value || '';
                setInputCode(nextCode);
                if (roomId) {
                  if (sendTimer.current) clearTimeout(sendTimer.current);
                  sendTimer.current = setTimeout(() => sendUpdate(nextCode), 300);
                }
              }}
              onMount={handleEditorDidMount}
              options={{
                automaticLayout: true,
                fontFamily: 'var(--font-mono)',
                fontSize: 14,
                minimap: { enabled: false },
                padding: { top: 16 },
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                cursorBlinking: 'smooth',
                cursorSmoothCaretAnimation: 'on',
                fixedOverflowWidgets: false,
                formatOnPaste: true,
                tabSize: 2,
                insertSpaces: true,
                quickSuggestions: true,
                suggestOnTriggerCharacters: true,
                acceptSuggestionOnEnter: 'on',
                parameterHints: { enabled: true },
                wordWrap: 'on',
                bracketPairColorization: { enabled: true },
                guides: { bracketPairs: true },
                scrollbar: {
                  alwaysConsumeMouseWheel: false
                }
              }}
            />
          </div>
        </div>
        <div className="split-panel glass-panel bg-[#0a0a0b]">
          <div className="panel-header text-[var(--accent-primary)] border-b border-[rgba(59,130,246,0.2)]">Console Output</div>
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar font-mono text-sm">
            {shareLink && (
              <div className="mb-2 text-sm text-[var(--text-muted)]">
                Share link: <a className="underline" href={shareLink} target="_blank" rel="noreferrer">{shareLink}</a>
              </div>
            )}
            {logs.length === 0 ? (
              <div className="text-[var(--text-muted)] italic">Output will appear here...</div>
            ) : (
              logs.map((log, index) => (
                <div 
                  key={index} 
                  className={`py-1 ${
                    log.type === 'error' ? 'text-red-400' : 
                    log.type === 'warn' ? 'text-yellow-400' : 
                    log.type === 'success' ? 'text-green-400' : 
                    log.type === 'info' ? 'text-blue-400' : 
                    log.type === 'debug' ? 'text-purple-400' : 
                    'text-gray-300'
                  }`}
                >
                  <span className="opacity-50 mr-2">[{log.type}]</span>
                  {log.message}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <ResourceLinks links={resources} />
    </div>
  );
}

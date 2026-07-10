import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import {
  Share2,
  Copy,
  Check,
  Plus,
  X,
  RefreshCw,
  Send,
  Info,
  FileText
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { LANGUAGES } from '../utils/constants';
import CustomSelect from '../components/CustomSelect';
import ResourceLinks from '../components/ResourceLinks';
import './ToolPage.css';
import './CodeShare.css';

export default function CodeShare() {
  const { theme } = useTheme();
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const rawSharePath = params['*'] || '';
  const shareQueryId = new URLSearchParams(location.search).get('share');
  const roomIdFromPath = params.id || (rawSharePath ? rawSharePath.split('/').filter(Boolean)[0] : null) || shareQueryId;

  // State Management
  const [tabs, setTabs] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const langParam = params.get('lang');
    if (langParam) {
      const found = LANGUAGES.find(l => l.id === langParam.toLowerCase());
      if (found) {
        const extMap = {
          python: 'py', javascript: 'js', typescript: 'ts', java: 'java', cpp: 'cpp', c: 'c',
          csharp: 'cs', go: 'go', rust: 'rs', php: 'php', ruby: 'rb', sql: 'sql', html: 'html',
          css: 'css', json: 'json', yaml: 'yml', markdown: 'md', xml: 'xml', shell: 'sh'
        };
        const ext = extMap[found.id] || 'txt';
        return [
          { id: '1', name: `Notes.${ext}`, content: `// Write or paste your ${found.name} code here...\n`, language: found.id }
        ];
      }
    }
    return [
      { id: '1', name: 'Notes.txt', content: '// Write or paste anything here...\n', language: 'plaintext' }
    ];
  });
  const [activeTabId, setActiveTabId] = useState('1');
  const [roomId, setRoomId] = useState(null);
  const [syncStatus, setSyncStatus] = useState('local'); // 'local' | 'syncing' | 'synced' | 'error'
  const [copied, setCopied] = useState(false);
  const [editorCopied, setEditorCopied] = useState(false);
  const [hasUncopiedChanges, setHasUncopiedChanges] = useState(false);
  const [toast, setToast] = useState(null);
  const [toastHiding, setToastHiding] = useState(false);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Refs for polling & sync locks
  const lastEditTimeRef = useRef(0);
  const toastTimeoutRef = useRef(null);
  const toastHidingTimeoutRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  const tabsRef = useRef(tabs);
  const activeTabIdRef = useRef(activeTabId);
  const shareMenuRef = useRef(null);

  // Maintain refs of state for the polling timer to prevent resetting interval
  useEffect(() => {
    tabsRef.current = tabs;
    activeTabIdRef.current = activeTabId;
  }, [tabs, activeTabId]);

  // Close share menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(e.target)) {
        setShareMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Toast notifier helper with smooth entry and exit animation
  const showToast = (message) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    if (toastHidingTimeoutRef.current) clearTimeout(toastHidingTimeoutRef.current);

    setToast(message);
    setToastHiding(false);

    toastTimeoutRef.current = setTimeout(() => {
      setToastHiding(true);
      toastHidingTimeoutRef.current = setTimeout(() => {
        setToast(null);
        setToastHiding(false);
      }, 300); // Wait for exit animation
    }, 4700); // 5 seconds total duration (4.7s visible + 0.3s fading)
  };

  // Helper to generate 6-character room IDs
  const generateRoomId = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Load shared room from server when ID param is present
  const loadRoom = useCallback(async (id) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/share?id=${id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.tabs && data.tabs.length > 0) {
          setTabs(data.tabs);
          setActiveTabId(data.activeTabId || data.tabs[0].id);
          setSyncStatus('synced');
        }
      } else {
        showToast('Room not found. Starting a new workspace.');
        setSyncStatus('local');
        navigate('/', { replace: true });
      }
    } catch (err) {
      console.error('loadRoom error:', err);
      setSyncStatus('error');
      showToast('Failed to connect to share database.');
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  // Trigger loads on parameter changes
  useEffect(() => {
    if (roomIdFromPath) {
      setRoomId(roomIdFromPath);
      loadRoom(roomIdFromPath);
    } else {
      setRoomId(null);
      setSyncStatus('local');
      setTabs([
        { id: '1', name: 'Notes.txt', content: '// Write or paste anything here...\n', language: 'plaintext' }
      ]);
      setActiveTabId('1');
    }
    // Cleanup any lingering timers
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      if (toastHidingTimeoutRef.current) clearTimeout(toastHidingTimeoutRef.current);
    };
  }, [roomIdFromPath, loadRoom]);

  // Polling Effect (Runs only in active shared room)
  useEffect(() => {
    if (!roomId) return;

    const pollInterval = setInterval(async () => {
      // Lock sync if user is typing or edited recently (2s idle lock)
      if (Date.now() - lastEditTimeRef.current < 2000) {
        return;
      }

      try {
        const res = await fetch(`/api/share?id=${roomId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.tabs && data.tabs.length > 0) {
            const localSerialized = JSON.stringify(tabsRef.current);
            const remoteSerialized = JSON.stringify(data.tabs);

            if (localSerialized !== remoteSerialized) {
              setTabs(data.tabs);
              setHasUncopiedChanges(true);
              showToast('Collaborator updated the workspace content!');
            }
            if (data.activeTabId && data.activeTabId !== activeTabIdRef.current) {
              setActiveTabId(data.activeTabId);
            }
            setSyncStatus('synced');
          }
        }
      } catch (err) {
        console.warn('Sync poll connection error:', err);
      }
    }, 3000); // 3-second intervals

    return () => clearInterval(pollInterval);
  }, [roomId]);

  // Debounced autosave back to database
  const triggerSave = useCallback((currentTabs, currentActiveId) => {
    if (!roomId) return;
    setSyncStatus('syncing');

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch('/api/share', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: roomId,
            data: { tabs: currentTabs, activeTabId: currentActiveId }
          })
        });

        if (res.ok) {
          setSyncStatus('synced');
        } else {
          setSyncStatus('error');
        }
      } catch (err) {
        console.error('autosave error:', err);
        setSyncStatus('error');
      }
    }, 800); // 800ms debounce
  }, [roomId]);

  // Workspace Actions
  const addTab = () => {
    const newId = Math.random().toString(36).substring(2, 9);
    const newTab = { id: newId, name: `Untitled ${tabs.length + 1}`, content: '', language: 'plaintext' };
    const nextTabs = [...tabs, newTab];
    setTabs(nextTabs);
    setActiveTabId(newId);
    triggerSave(nextTabs, newId);
  };

  const deleteTab = (tabId, e) => {
    e.stopPropagation();
    if (tabs.length === 1) return;

    const nextTabs = tabs.filter(t => t.id !== tabId);
    setTabs(nextTabs);

    let nextActiveId = activeTabId;
    if (activeTabId === tabId) {
      nextActiveId = nextTabs[nextTabs.length - 1].id;
      setActiveTabId(nextActiveId);
    }
    triggerSave(nextTabs, nextActiveId);
  };

  const handleContentChange = (value) => {
    lastEditTimeRef.current = Date.now();
    const updatedTabs = tabs.map(t => t.id === activeTabId ? { ...t, content: value || '' } : t);
    setTabs(updatedTabs);
    triggerSave(updatedTabs, activeTabId);
  };

  const handleLanguageChange = (lang) => {
    lastEditTimeRef.current = Date.now();
    const updatedTabs = tabs.map(t => t.id === activeTabId ? { ...t, language: lang } : t);
    setTabs(updatedTabs);
    triggerSave(updatedTabs, activeTabId);
  };

  const handleRenameTab = (newName) => {
    lastEditTimeRef.current = Date.now();
    const updatedTabs = tabs.map(t => t.id === activeTabId ? { ...t, name: newName } : t);
    setTabs(updatedTabs);
    triggerSave(updatedTabs, activeTabId);
  };

  // Generation & Sharing Handlers
  const createShareLink = async () => {
    if (roomId) {
      copyLinkToClipboard();
      return;
    }

    setSyncStatus('syncing');
    const newId = generateRoomId();
    try {
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newId,
          data: { tabs, activeTabId }
        })
      });

      if (res.ok) {
        setRoomId(newId);
        setSyncStatus('synced');
        navigate(`/share/${newId}`, { replace: true });
        copyLinkToClipboard(newId);
        showToast('Shared workspace created! Link copied to clipboard.');
      } else {
        setSyncStatus('error');
        showToast('Failed to create shared link. Please try again.');
      }
    } catch (err) {
      console.error('createShareLink error:', err);
      setSyncStatus('error');
      showToast('Error connecting to sharing endpoint.');
    }
  };

  const copyLinkToClipboard = (idToUse) => {
    const id = idToUse || roomId;
    if (!id) return;
    const url = `${window.location.origin}/share/${id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast('Workspace URL copied to clipboard!');
  };

  const copyActiveTabContent = () => {
    const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];
    if (!activeTab) return;
    navigator.clipboard.writeText(activeTab.content || '');
    setEditorCopied(true);
    setHasUncopiedChanges(false);
    setTimeout(() => setEditorCopied(false), 2000);
    showToast('Active tab content copied to clipboard!');
  };

  const resetWorkspace = () => {
    navigate('/share');
  };

  // UI Setup & Helpers
  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];
  const shareUrl = roomId ? `${window.location.origin}/share/${roomId}` : '';
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`Collaborate with me on this real-time DevMint workspace: ${shareUrl}`)}`;

  const resources = [
    { title: "Real-time Collaboration Docs", url: "https://devmint-tools.vercel.app" },
    { title: "Monaco Editor Shortcut Reference", url: "https://code.visualstudio.com/shortcuts/keyboard-shortcuts-windows.pdf" }
  ];

  if (isLoading) {
    return (
      <div className="tool-page h-full flex flex-col overflow-y-auto justify-center items-center py-20">
        <RefreshCw className="animate-spin text-[var(--accent-primary)] mb-4" size={48} />
        <p className="text-[var(--text-secondary)] font-medium">Retrieving shared workspace...</p>
      </div>
    );
  }

  return (
    <div className="tool-page h-full flex flex-col overflow-y-auto">
      {/* Toast Alert */}
      {toast && (
        <div className={`toast-notification ${toastHiding ? 'hiding' : ''}`}>
          <Info size={16} className="text-[var(--accent-primary)]" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <header className="tool-header">
        <div>
          <div className="flex items-center gap-2 flex-nowrap">
            <h2>Collaborative Code & Note Share</h2>
            <div className="info-guide-wrapper shrink-0">
              <button className="info-guide-btn" type="button" aria-label="Quick Guide">
                <Info size={16} />
              </button>
              <div className="info-guide-tooltip">
                <h4 className="tooltip-title">Quick Guide</h4>
                <ul className="tooltip-list">
                  <li>Manage multiple files/notes in a single session by clicking <strong>+</strong> to add tabs.</li>
                  <li>Toggle between Plain Text, JavaScript, HTML, SQL, etc., for syntax highlight.</li>
                  <li>A 2-second edit lock keeps your cursor steady while typing.</li>
                  <li>Paste formats, lists, JSON payloads, snippets, or general notes.</li>
                </ul>
              </div>
            </div>
          </div>
          <p>Create a shared live workspace. Edit notes, formats, or codes together. Changes save and sync automatically.</p>
        </div>
        <div className="flex gap-2 relative z-20">
          <button className="secondary-button flex items-center gap-2" onClick={resetWorkspace}>
            New Workspace
          </button>
          <button className="primary-button flex items-center gap-2" onClick={createShareLink}>
            {copied ? <Check size={16} /> : (roomId ? <Copy size={16} /> : <Share2 size={16} />)}
            {roomId ? (copied ? 'Copied' : 'Copy Link') : 'Create Share Link'}
          </button>

          {roomId && (
            <div className="relative" ref={shareMenuRef}>
              <button
                className="secondary-button flex items-center gap-2"
                onClick={() => setShareMenuOpen(!shareMenuOpen)}
                title="Share workspace"
              >
                <Share2 size={16} />
                <span>Share</span>
              </button>
              {shareMenuOpen && (
                <div className="share-dropdown-menu">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="share-dropdown-item"
                    onClick={() => setShareMenuOpen(false)}
                  >
                    <Send size={14} />
                    <span>Share via WhatsApp</span>
                  </a>
                  {navigator.share && (
                    <button
                      className="share-dropdown-item-btn"
                      type="button"
                      onClick={() => {
                        setShareMenuOpen(false);
                        navigator.share({
                          title: 'DevMint Live Workspace',
                          text: 'Collaborate with me on this real-time DevMint workspace:',
                          url: shareUrl
                        }).catch(() => { });
                      }}
                    >
                      <Share2 size={14} />
                      <span>System Share</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="share-layout flex-1">

        {/* Left Side: Tabs + Editor */}
        <div className="workspace-panel glass-panel" style={{ flex: 1 }}>

          {/* Tabs Row */}
          <div className="editor-tabs-container custom-scrollbar">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                className={`editor-tab ${tab.id === activeTabId ? 'active' : ''}`}
                onClick={() => {
                  setActiveTabId(tab.id);
                  triggerSave(tabs, tab.id);
                }}
              >
                <FileText size={14} className="text-[var(--text-secondary)]" />
                <span className="tab-name-span" title={tab.name}>{tab.name}</span>
                {tabs.length > 1 && (
                  <button
                    type="button"
                    className="tab-close-btn"
                    onClick={(e) => deleteTab(tab.id, e)}
                    title="Delete this tab"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            ))}
            <button className="add-tab-btn" onClick={addTab} title="Add a new notebook tab">
              <Plus size={16} />
            </button>
          </div>

          {/* Subheader Controls */}
          <div className="editor-controls-bar">
            <div className="controls-left">
              <input
                type="text"
                className="rename-input"
                value={activeTab?.name || ''}
                onChange={(e) => handleRenameTab(e.target.value)}
                placeholder="Rename tab..."
                title="Change active tab name"
              />
              <CustomSelect
                value={activeTab?.language || 'plaintext'}
                onChange={(e) => handleLanguageChange(e.target.value)}
                options={[
                  { value: 'plaintext', label: 'Plain Text' },
                  ...LANGUAGES.map(lang => ({ value: lang.id, label: lang.name }))
                ]}
              />
            </div>
              <div className="controls-right">
                <button
                  className={`secondary-button flex items-center gap-1.5 transition-all ${
                    hasUncopiedChanges ? 'border-[var(--accent-primary)] shadow-[0_0_8px_rgba(59,130,246,0.3)] animate-pulse' : ''
                  }`}
                  style={{ 
                    padding: '4px 10px', 
                    fontSize: '0.8rem', 
                    height: '28px', 
                    minWidth: 'fit-content'
                  }}
                  onClick={copyActiveTabContent}
                  title={hasUncopiedChanges ? "New remote changes! Copy active tab content" : "Copy active tab editor content to clipboard"}
                >
                  {editorCopied ? <Check size={14} /> : <Copy size={14} />}
                  <span>{editorCopied ? 'Copied' : 'Copy Content'}</span>
                  {hasUncopiedChanges && (
                    <span className="relative flex h-2 w-2 ml-1 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent-primary)] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent-primary)]"></span>
                    </span>
                  )}
                </button>
                <span className="status-pill" title="Status of connection and backend saving">
                  <span className={`status-dot ${syncStatus}`} />
                  <span>
                    {syncStatus === 'local' && 'Local Workspace'}
                    {syncStatus === 'syncing' && 'Saving Changes...'}
                    {syncStatus === 'synced' && 'Synced & Live'}
                    {syncStatus === 'error' && 'Sync Connection Error'}
                  </span>
                </span>
              </div>
          </div>

          {/* Monaco Editor Pane */}
          <div className="monaco-editor-wrapper">
            <Editor
              height="100%"
              defaultLanguage="plaintext"
              language={activeTab?.language || 'plaintext'}
              theme={theme === 'dark' ? 'vs-dark' : 'light'}
              value={activeTab?.content || ''}
              onChange={handleContentChange}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: 'var(--font-mono)',
                padding: { top: 16 },
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                cursorBlinking: 'smooth',
                cursorSmoothCaretAnimation: 'on',
                wordWrap: 'on',
                automaticLayout: true,
                fixedOverflowWidgets: false,
                bracketPairColorization: { enabled: true },
                scrollbar: {
                  alwaysConsumeMouseWheel: false
                }
              }}
            />
          </div>
        </div>

      </div>

      <ResourceLinks links={resources} />
    </div>
  );
}

import { useCallback, useEffect, useRef, useState } from 'react';
import ResourceLinks from '../components/ResourceLinks';
import './ToolPage.css';

const AUTO_SEARCH_DELAY_MS = 140;
const LARGE_INPUT_THRESHOLD_CHARS = 500000;
const MAX_HIGHLIGHT_INPUT_CHARS = 250000;
const MAX_HIGHLIGHT_MATCHES = 2500;
const JSON_TOOLKIT_STORAGE_KEY = 'devtoolkit_json_toolkit_input';
const MAX_PERSISTED_INPUT_CHARS = 200000;

const escapeHtml = (text = '') => text
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const getLineAndColumn = (text, index) => {
  if (index < 0) return { line: null, column: null };
  const textBeforeMatch = text.slice(0, index);
  const lines = textBeforeMatch.split('\n');
  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1
  };
};

export default function JsonToolkit() {
  const [input, setInput] = useState(() => {
    try {
      const raw = localStorage.getItem(JSON_TOOLKIT_STORAGE_KEY);
      if (raw == null) return '';
      const parsed = JSON.parse(raw);
      return typeof parsed === 'string' ? parsed : '';
    } catch {
      return '';
    }
  });
  const [output, setOutput] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [searchMatches, setSearchMatches] = useState([]);
  const [activeMatchIndex, setActiveMatchIndex] = useState(-1);
  const [isCaseSensitive, setIsCaseSensitive] = useState(false);
  const [isWholeWord, setIsWholeWord] = useState(false);
  const [goToLineValue, setGoToLineValue] = useState('');
  const [cursorLine, setCursorLine] = useState(1);
  const inputRef = useRef(null);
  const searchInputRef = useRef(null);
  const highlightLayerRef = useRef(null);
  const isLargeInput = input.length >= LARGE_INPUT_THRESHOLD_CHARS;

  const isWordChar = (char = '') => /[A-Za-z0-9_]/.test(char);

  const getMatchPositions = (text, query, caseSensitive = false, wholeWord = false) => {
    if (!query.trim()) return [];

    const sourceText = caseSensitive ? text : text.toLowerCase();
    const sourceQuery = caseSensitive ? query : query.toLowerCase();
    const matches = [];
    let cursor = 0;

    while (cursor < sourceText.length) {
      const foundIndex = sourceText.indexOf(sourceQuery, cursor);
      if (foundIndex === -1) break;

      if (!wholeWord) {
        matches.push(foundIndex);
      } else {
        const beforeChar = sourceText[foundIndex - 1] ?? '';
        const afterChar = sourceText[foundIndex + sourceQuery.length] ?? '';
        const hasWordBoundary = !isWordChar(beforeChar) && !isWordChar(afterChar);
        if (hasWordBoundary) {
          matches.push(foundIndex);
        }
      }

      cursor = foundIndex + sourceQuery.length;
    }

    return matches;
  };

  const getSearchStatusMessage = (matches) => {
    if (!searchTerm.trim()) return '';
    if (!matches.length) return 'No matches found in JSON input.';
    if (isLargeInput) {
      return `Large input mode: ${matches.length} match${matches.length === 1 ? '' : 'es'} found. Highlight overlay is disabled for better performance.`;
    }
    return `Found ${matches.length} match${matches.length === 1 ? '' : 'es'}.`;
  };

  const getIndexForLine = (text, lineNumber) => {
    if (!text) return 0;
    if (lineNumber <= 1) return 0;

    let currentLine = 1;
    for (let i = 0; i < text.length; i += 1) {
      if (text[i] === '\n') {
        currentLine += 1;
        if (currentLine === lineNumber) {
          return i + 1;
        }
      }
    }

    return -1;
  };

  const getLineForIndex = (text, index) => {
    if (index <= 0) return 1;
    let line = 1;
    const maxIndex = Math.min(index, text.length);
    for (let i = 0; i < maxIndex; i += 1) {
      if (text[i] === '\n') line += 1;
    }
    return line;
  };

  const updateSearchState = (
    text,
    query,
    caseSensitive = isCaseSensitive,
    wholeWord = isWholeWord,
    autoSelectFirst = false
  ) => {
    const matches = getMatchPositions(text, query, caseSensitive, wholeWord);
    setSearchMatches(matches);
    setActiveMatchIndex(matches.length && autoSelectFirst ? 0 : -1);
    return matches;
  };

  const parseJson = () => {
    if (!input.trim()) {
      setStatus({ type: 'error', message: 'Input is empty. Paste JSON first.' });
      return null;
    }

    try {
      return JSON.parse(input);
    } catch (error) {
      setStatus({ type: 'error', message: `Invalid JSON: ${error.message}` });
      return null;
    }
  };

  const handleFormat = () => {
    const parsed = parseJson();
    if (!parsed) return;

    const formatted = JSON.stringify(parsed, null, 2);
    setOutput(formatted);
    setStatus({ type: 'success', message: 'JSON is valid and formatted.' });
  };

  const handleMinify = () => {
    const parsed = parseJson();
    if (!parsed) return;

    const minified = JSON.stringify(parsed);
    setOutput(minified);
    setStatus({ type: 'success', message: 'JSON minified successfully.' });
  };

  const handleValidate = () => {
    const parsed = parseJson();
    if (!parsed) return;

    setStatus({ type: 'success', message: 'JSON is valid.' });
  };

  const handleCopy = () => {
    if (output) {
      navigator.clipboard.writeText(output);
      setStatus({ type: 'success', message: 'Output copied to clipboard.' });
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setSearchMatches([]);
    setActiveMatchIndex(-1);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const handleGoToLine = ({ silent = false } = {}) => {
    if (!input.length) {
      if (!silent) {
        setStatus({ type: 'error', message: 'Input is empty. Paste JSON first.' });
      }
      return;
    }

    const parsedLine = Number(goToLineValue);
    if (!Number.isInteger(parsedLine) || parsedLine < 1) {
      if (!silent) {
        setStatus({ type: 'error', message: 'Enter a valid line number (1 or greater).' });
      }
      return;
    }

    const index = getIndexForLine(input, parsedLine);
    if (index === -1) {
      if (!silent) {
        setStatus({ type: 'error', message: `Line ${parsedLine} is out of range.` });
      }
      return;
    }

    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.setSelectionRange(index, index);
    }

    setCursorLine(parsedLine);

    if (!silent) {
      setStatus({ type: 'success', message: `Moved cursor to line ${parsedLine}.` });
    }
  };

  const updateCursorLineFromSelection = useCallback(() => {
    if (!inputRef.current) return;
    const nextLine = getLineForIndex(input, inputRef.current.selectionStart ?? 0);
    setCursorLine(nextLine);
  }, [input]);

  const handleFindMatch = useCallback((direction = 1) => {
    if (!searchTerm.trim()) {
      setStatus({ type: 'error', message: 'Enter text to search in JSON input.' });
      return;
    }

    const matches = getMatchPositions(input, searchTerm, isCaseSensitive, isWholeWord);
    setSearchMatches(matches);

    if (!matches.length) {
      setActiveMatchIndex(-1);
      setStatus({ type: 'error', message: 'No matches found in JSON input.' });
      return;
    }

    const nextIndex =
      activeMatchIndex === -1
        ? direction > 0
          ? 0
          : matches.length - 1
        : (activeMatchIndex + direction + matches.length) % matches.length;

    setActiveMatchIndex(nextIndex);
    const start = matches[nextIndex];
    const end = start + searchTerm.length;

    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.setSelectionRange(start, end);
    }

    setStatus({ type: 'success', message: `Match ${nextIndex + 1} of ${matches.length}.` });
  }, [activeMatchIndex, input, isCaseSensitive, isWholeWord, searchTerm]);

  useEffect(() => {
    const onKeyDown = (event) => {
      const isMetaOrCtrl = event.metaKey || event.ctrlKey;
      const key = event.key.toLowerCase();

      if (isMetaOrCtrl && key === 'f') {
        event.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
          searchInputRef.current.select();
        }
        return;
      }

      const isFindNext = (isMetaOrCtrl && key === 'g') || event.key === 'F3';
      if (isFindNext) {
        event.preventDefault();
        handleFindMatch(event.shiftKey ? -1 : 1);
        return;
      }

      const isSearchInputFocused = document.activeElement === searchInputRef.current;
      if (isSearchInputFocused && event.key === 'Enter') {
        event.preventDefault();
        handleFindMatch(event.shiftKey ? -1 : 1);
      }

      const isGoToLineInputFocused = document.activeElement?.id === 'json-go-to-line';
      if (isGoToLineInputFocused && event.key === 'Enter') {
        event.preventDefault();
        handleGoToLine();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [handleFindMatch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!searchTerm.trim()) {
        setSearchMatches([]);
        setActiveMatchIndex(-1);
        return;
      }

      const matches = getMatchPositions(input, searchTerm, isCaseSensitive, isWholeWord);
      setSearchMatches(matches);
      setActiveMatchIndex(matches.length ? 0 : -1);
    }, AUTO_SEARCH_DELAY_MS);

    return () => clearTimeout(timer);
  }, [input, isCaseSensitive, isWholeWord, searchTerm]);

  useEffect(() => {
    if (!goToLineValue.trim()) return;

    const timer = setTimeout(() => {
      handleGoToLine({ silent: true });
    }, 180);

    return () => clearTimeout(timer);
  }, [goToLineValue]);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        if (input.length <= MAX_PERSISTED_INPUT_CHARS) {
          localStorage.setItem(JSON_TOOLKIT_STORAGE_KEY, JSON.stringify(input));
        }
      } catch {
        // Ignore storage quota errors so large input editing remains stable.
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [input]);

  useEffect(() => {
    if (!input.length) {
      setCursorLine(1);
      return;
    }
    updateCursorLineFromSelection();
  }, [input, updateCursorLineFromSelection]);

  const resources = [
    { title: 'RFC 8259 - JSON Standard', url: 'https://www.rfc-editor.org/rfc/rfc8259' },
    { title: 'MDN: JSON.parse()', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse' }
  ];

  const hasActiveMatch =
    activeMatchIndex >= 0 &&
    activeMatchIndex < searchMatches.length &&
    searchTerm.length > 0;

  const activeMatchStart = hasActiveMatch ? searchMatches[activeMatchIndex] : -1;
  const activeMatchEnd = hasActiveMatch ? activeMatchStart + searchTerm.length : -1;
  const { line: activeMatchLine, column: activeMatchColumn } = getLineAndColumn(input, activeMatchStart);
  const canRenderHighlightLayer = !isLargeInput && input.length <= MAX_HIGHLIGHT_INPUT_CHARS;
  const canRenderMarkedHighlights = canRenderHighlightLayer && searchMatches.length <= MAX_HIGHLIGHT_MATCHES;
  const requestedLine = Number(goToLineValue);
  const requestedLineIndex = Number.isInteger(requestedLine) && requestedLine >= 1
    ? getIndexForLine(input, requestedLine)
    : -1;
  const canGoToRequestedLine = requestedLineIndex >= 0 && requestedLine !== cursorLine;

  const highlightedInputHtml = searchTerm.trim() && searchMatches.length && canRenderMarkedHighlights
    ? (() => {
      let html = '';
      let cursor = 0;

      searchMatches.forEach((start, index) => {
        const end = start + searchTerm.length;
        const className =
          index === activeMatchIndex
            ? 'json-match-highlight json-match-highlight-active'
            : 'json-match-highlight';

        html += escapeHtml(input.slice(cursor, start));
        html += `<mark class="${className}">${escapeHtml(input.slice(start, end))}</mark>`;
        cursor = end;
      });

      html += escapeHtml(input.slice(cursor));
      return html;
    })()
    : canRenderHighlightLayer
      ? escapeHtml(input)
      : '';

  const syncHighlightScroll = useCallback(() => {
    if (!inputRef.current || !highlightLayerRef.current) return;
    highlightLayerRef.current.scrollTop = inputRef.current.scrollTop;
    highlightLayerRef.current.scrollLeft = inputRef.current.scrollLeft;
  }, []);

  useEffect(() => {
    if (!hasActiveMatch || !inputRef.current) return;
    inputRef.current.setSelectionRange(activeMatchStart, activeMatchEnd);
  }, [activeMatchEnd, activeMatchStart, hasActiveMatch]);

  return (
    <div className="tool-page h-full flex flex-col overflow-y-auto">
      <header className="tool-header">
        <div>
          <h2>JSON Toolkit</h2>
          <p>Validate, beautify, and minify JSON safely in your browser.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button className="secondary-button" onClick={handleValidate}>Validate</button>
          <button className="secondary-button" onClick={handleFormat}>Beautify</button>
          <button className="secondary-button" onClick={handleMinify}>Minify</button>
          <button className="primary-button" onClick={handleCopy}>Copy Output</button>
        </div>
      </header>

      {isLargeInput && (
        <div
          className="rounded-md px-4 py-2 text-sm"
          style={{
            background: 'rgba(245,158,11,0.12)',
            border: '1px solid rgba(245,158,11,0.35)',
            color: 'rgb(251,191,36)'
          }}
        >
          Large input mode is active for better stability. Text search and match navigation still work, but inline highlight rendering is disabled.
        </div>
      )}

      <div
        className="glass-panel"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '10px',
          padding: '12px'
        }}
      >
        <div
          style={{
            position: 'relative',
            flex: '1 1 460px',
            minWidth: '280px',
            maxWidth: '620px'
          }}
        >
          <input
            ref={searchInputRef}
            type="text"
            className="tool-number-input"
            style={{ width: '100%', paddingRight: '36px' }}
            value={searchTerm}
            onChange={(e) => {
              const nextSearchTerm = e.target.value;
              setSearchTerm(nextSearchTerm);
              updateSearchState(input, nextSearchTerm, isCaseSensitive, isWholeWord, true);
            }}
            placeholder="Find text in JSON input"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={handleClearSearch}
              aria-label="Clear search"
              title="Clear search"
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '20px',
                height: '20px',
                borderRadius: '999px',
                display: 'grid',
                placeItems: 'center',
                fontSize: '14px',
                lineHeight: 1,
                border: '1px solid rgba(148,163,184,0.35)',
                background: 'rgba(148,163,184,0.18)',
                color: 'var(--text-secondary)'
              }}
            >
              ×
            </button>
          )}
        </div>
        <button className="secondary-button" onClick={() => handleFindMatch(-1)}>
          Find Previous
        </button>
        <button className="secondary-button" onClick={() => handleFindMatch(1)}>
          Find Next
        </button>
        <input
          id="json-go-to-line"
          type="number"
          min="1"
          className="tool-number-input"
          style={{ width: '140px' }}
          value={goToLineValue}
          onChange={(e) => setGoToLineValue(e.target.value)}
          placeholder="Go to line"
        />
        <button
          className="secondary-button"
          onClick={() => handleGoToLine({ silent: false })}
          disabled={!canGoToRequestedLine}
        >
          Go
        </button>
        <button
          className="secondary-button"
          onClick={() => {
            const nextCaseSensitive = !isCaseSensitive;
            setIsCaseSensitive(nextCaseSensitive);
            updateSearchState(input, searchTerm, nextCaseSensitive, isWholeWord, true);
          }}
        >
          {isCaseSensitive ? 'Case: Sensitive' : 'Case: Insensitive'}
        </button>
        <button
          className="secondary-button"
          onClick={() => {
            const nextWholeWord = !isWholeWord;
            setIsWholeWord(nextWholeWord);
            updateSearchState(input, searchTerm, isCaseSensitive, nextWholeWord, true);
          }}
        >
          {isWholeWord ? 'Match: Whole Word' : 'Match: Partial'}
        </button>
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          {searchTerm.trim()
            ? `${searchMatches.length} match${searchMatches.length === 1 ? '' : 'es'}`
            : 'Type text to start searching'}
        </span>
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          {hasActiveMatch
            ? `Line ${activeMatchLine}, Column ${activeMatchColumn}`
            : 'Line -, Column -'}
        </span>
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
          Shortcuts: Ctrl/Cmd+F focus, Enter or F3 next, Shift+Enter or Shift+F3 previous, Ctrl/Cmd+G next
        </span>
        {searchTerm.trim() && (
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
            {getSearchStatusMessage(searchMatches)}
          </span>
        )}
      </div>

      <div className="split-view flex-1">
        <div className="split-panel glass-panel">
          <div className="panel-header">JSON Input</div>
          <div className="json-editor-wrap">
            {canRenderHighlightLayer && (
              <pre
                ref={highlightLayerRef}
                aria-hidden="true"
                className="json-highlight-layer custom-scrollbar"
                dangerouslySetInnerHTML={{ __html: highlightedInputHtml || '&nbsp;' }}
              />
            )}
            <textarea
              ref={inputRef}
              className={`code-textarea custom-scrollbar json-editor-textarea ${canRenderHighlightLayer ? '' : 'json-editor-textarea-plain'}`}
              value={input}
              onScroll={syncHighlightScroll}
              onSelect={updateCursorLineFromSelection}
              onKeyUp={updateCursorLineFromSelection}
              onClick={updateCursorLineFromSelection}
              onChange={(e) => {
                const nextInput = e.target.value;
                setInput(nextInput);
                if (searchTerm.trim()) {
                  updateSearchState(nextInput, searchTerm, isCaseSensitive, isWholeWord, true);
                }
              }}
              placeholder="Paste JSON here..."
            />
          </div>
        </div>

        <div className="split-panel glass-panel">
          <div className="panel-header">Output</div>
          <textarea
            className="code-textarea custom-scrollbar"
            value={output}
            readOnly
            placeholder="Validation results or transformed JSON will appear here..."
          />
        </div>
      </div>

      {status.message && (
        <div
          className="rounded-md px-4 py-2 text-sm"
          style={{
            background: status.type === 'success' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
            border: status.type === 'success' ? '1px solid rgba(16,185,129,0.35)' : '1px solid rgba(239,68,68,0.35)',
            color: status.type === 'success' ? 'var(--accent-success)' : 'var(--accent-error)'
          }}
        >
          {status.message}
        </div>
      )}

      <ResourceLinks links={resources} />
    </div>
  );
}

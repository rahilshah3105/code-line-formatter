import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Sidebar from './Sidebar';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { Menu, Search } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import AdBanner from './AdBanner';
import { SEO_BY_PATH } from '../utils/seo';
import './Layout.css';

const FEATURE_SEARCH_ITEMS = [
  { name: 'Code Formatter', path: '/formatter', group: 'Editors & Formatters' },
  { name: 'Multi-Lang Editor', path: '/editor', group: 'Editors & Formatters' },
  { name: 'Diff Checker', path: '/diff', group: 'Editors & Formatters' },
  { name: 'Code Shrinker', path: '/shrinker', group: 'Editors & Formatters' },
  { name: 'Code & Note Share', path: '/share', group: 'Editors & Formatters', keywords: ['share text', 'share code', 'pastebin', 'collaborate', 'collaboration', 'notes share'] },
  { name: 'JSON to Types', path: '/json-types', group: 'Converters & Encoders' },
  {
    name: 'JSON Toolkit',
    path: '/json-toolkit',
    group: 'Converters & Encoders',
    keywords: ['json search', 'json find', 'find in json', 'search in json', 'json text search']
  },
  { name: 'JSON Compare', path: '/json-compare', group: 'Converters & Encoders' },
  { name: 'Utility Tools', path: '/utility-tools', group: 'Converters & Encoders' },
  { name: 'Base64 Converter', path: '/base64', group: 'Converters & Encoders' },
  { name: 'URL Converter', path: '/url', group: 'Converters & Encoders' },
  { name: 'Color Converter', path: '/color', group: 'Converters & Encoders' },
  { name: 'JWT Decoder', path: '/jwt', group: 'Converters & Encoders' },
  { name: 'Base Converter', path: '/base-converter', group: 'Converters & Encoders' },
  { name: 'UUID Generator', path: '/uuid', group: 'Generators & Utilities' },
  { name: 'Hash Generator', path: '/hash', group: 'Generators & Utilities' },
  {
    name: 'JavaScript Runner',
    path: '/js-runner',
    group: 'Generators & Utilities',
    keywords: ['js runner', 'javascript runner', 'js code runner', 'browser javascript', 'run js', 'browser js']
  },
  { name: 'Lorem Ipsum', path: '/lorem', group: 'Generators & Utilities' },
  { name: 'Timestamp Converter', path: '/timestamp', group: 'Generators & Utilities' },
  { name: 'Regex Tester', path: '/regex', group: 'Generators & Utilities' },
  { name: 'JSON Snippets', path: '/json-snippets', group: 'Generators & Utilities' },
  { name: 'String Utils', path: '/string-utils', group: 'Generators & Utilities' },
  { name: 'Improve Prompts', path: '/improve-prompts', group: 'Generators & Utilities' },
  { name: 'API Test Cases', path: '/api-test-cases', group: 'Generators & Utilities' },
  { name: 'Mock Data', path: '/mock-data', group: 'Generators & Utilities' },
  { name: 'Schema Validator', path: '/json-schema-validator', group: 'Generators & Utilities' },
  { name: 'API Workbench', path: '/http-request-builder', group: 'Generators & Utilities' },
  { name: 'Unit Test Scaffold', path: '/unit-test-scaffold', group: 'Generators & Utilities' },
  { name: 'E2E Scenario Builder', path: '/e2e-scenario-builder', group: 'Generators & Utilities' },
  { name: 'Log Analyzer', path: '/log-analyzer', group: 'Generators & Utilities' },
  { name: 'Git PR Helper', path: '/git-pr-helper', group: 'Generators & Utilities' },
  { name: 'Cron Explainer', path: '/cron', group: 'Generators & Utilities' },
  {
    name: 'Remote Runner',
    path: '/remote-runner',
    group: 'Generators & Utilities',
    keywords: [
      'code runner',
      'language runner',
      'python runner',
      'javascript runner',
      'node runner',
      'nodejs runner',
      'typescript runner',
      'java runner',
      'c runner',
      'cpp runner',
      'c++ runner',
      'csharp runner',
      'c# runner',
      'go runner',
      'golang runner',
      'rust runner',
      'php runner',
      'ruby runner'
    ]
  },
  { name: 'Developer Apps', path: '/apps', group: 'Ecosystem' },
];

function normalizeText(value) {
  return (value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function buildSearchText(item) {
  return [
    item.name,
    item.group,
    item.path,
    ...(item.keywords || []),
    ...item.name.split(/[^a-z0-9]+/i).filter(Boolean),
    ...item.group.split(/[^a-z0-9]+/i).filter(Boolean),
    ...item.path.split(/[^a-z0-9]+/i).filter(Boolean),
  ].join(' ');
}

function fuzzyScore(query, targetText) {
  const normalizedQuery = normalizeText(query);
  const normalizedTarget = normalizeText(targetText);

  if (!normalizedQuery || !normalizedTarget) return 0;

  let score = 0;

  if (normalizedTarget === normalizedQuery) {
    score += 5000;
  }

  if (normalizedTarget.startsWith(normalizedQuery)) {
    score += 2200 - normalizedTarget.length;
  }

  if (normalizedTarget.includes(normalizedQuery)) {
    score += 1800 - normalizedTarget.indexOf(normalizedQuery);
  }

  const queryTokens = query
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);

  const targetTokens = targetText
    .toLowerCase()
    .split(/[^a-z0-9+.#-]+/i)
    .map((token) => token.trim())
    .filter(Boolean);

  for (const token of queryTokens) {
    const normalizedToken = normalizeText(token);
    if (!normalizedToken) continue;

    const exactTokenMatch = targetTokens.some((targetToken) => targetToken === token);
    const partialTokenMatch = targetTokens.some((targetToken) => normalizeText(targetToken).includes(normalizedToken));

    if (exactTokenMatch) {
      score += 600;
    } else if (partialTokenMatch) {
      score += 320;
    } else if (normalizedTarget.includes(normalizedToken)) {
      score += 250;
    } else {
      let queryIndex = 0;
      let streak = 0;

      for (let i = 0; i < normalizedTarget.length && queryIndex < normalizedToken.length; i += 1) {
        if (normalizedTarget[i] === normalizedToken[queryIndex]) {
          queryIndex += 1;
          streak += 1;
          score += 4 + streak;
        } else {
          streak = 0;
        }
      }

      if (queryIndex === normalizedToken.length) {
        score += 90;
      }
    }
  }

  const queryLetters = new Set(normalizedQuery);
  const targetLetters = new Set(normalizedTarget);
  let sharedLetters = 0;
  queryLetters.forEach((letter) => {
    if (targetLetters.has(letter)) sharedLetters += 1;
  });

  score += sharedLetters * 5;
  score -= Math.max(0, normalizedTarget.length - normalizedQuery.length) * 0.2;

  return score;
}

export default function Layout() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const searchInputRef = useRef(null);

  const filteredFeatures = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return FEATURE_SEARCH_ITEMS;

    return FEATURE_SEARCH_ITEMS
      .map((item) => {
        const score = fuzzyScore(query, buildSearchText(item));
        return { item, score };
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((entry) => entry.item);
  }, [searchText]);

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    setSearchText('');
    setActiveIndex(0);
  }, []);

  const openSearch = () => setSearchOpen(true);

  const goToFeature = useCallback((path) => {
    const query = searchText.trim().toLowerCase();
    
    const knownLanguages = [
      { key: 'python', lang: 'python' },
      { key: 'javascript', lang: 'javascript' },
      { key: 'js', lang: 'javascript' },
      { key: 'typescript', lang: 'typescript' },
      { key: 'ts', lang: 'typescript' },
      { key: 'node', lang: 'javascript' },
      { key: 'java', lang: 'java' },
      { key: 'c++', lang: 'cpp' },
      { key: 'cpp', lang: 'cpp' },
      { key: 'c#', lang: 'csharp' },
      { key: 'csharp', lang: 'csharp' },
      { key: 'golang', lang: 'go' },
      { key: 'go', lang: 'go' },
      { key: 'rust', lang: 'rust' },
      { key: 'php', lang: 'php' },
      { key: 'ruby', lang: 'ruby' },
      { key: 'sql', lang: 'sql' },
      { key: 'html', lang: 'html' },
      { key: 'css', lang: 'css' },
      { key: 'json', lang: 'json' },
      { key: 'yaml', lang: 'yaml' },
      { key: 'markdown', lang: 'markdown' },
      { key: 'md', lang: 'markdown' },
      { key: 'xml', lang: 'xml' },
      { key: 'shell', lang: 'shell' },
      { key: 'bash', lang: 'shell' },
      { key: 'sh', lang: 'shell' }
    ];

    let detectedLang = null;
    const sortedLanguages = [...knownLanguages].sort((a, b) => b.key.length - a.key.length);
    for (const item of sortedLanguages) {
      let match = false;
      if (item.key === 'c++' || item.key === 'c#') {
        const escaped = item.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(?:\\b|\\s|^)${escaped}(?:\\b|\\s|$)`, 'i');
        match = regex.test(query);
      } else {
        const regex = new RegExp(`\\b${item.key}\\b`, 'i');
        match = regex.test(query);
      }
      if (match) {
        detectedLang = item.lang;
        break;
      }
    }

    const pagesSupportingLang = ['/remote-runner', '/editor', '/formatter', '/diff', '/share'];
    if (detectedLang && pagesSupportingLang.includes(path)) {
      navigate(`${path}?lang=${detectedLang}`);
    } else {
      navigate(path);
    }
    closeSearch();
  }, [searchText, navigate, closeSearch]);

  // Auto-collapse sidebar on smaller screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 769) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const isEditableTarget = (target) => {
      if (!(target instanceof HTMLElement)) return false;
      return (
        target.isContentEditable ||
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT'
      );
    };

    const onKeyDown = (event) => {
      const isSearchShortcut =
        (event.ctrlKey || event.metaKey) &&
        !event.shiftKey &&
        !event.altKey &&
        (event.key.toLowerCase() === 'k' || event.code === 'KeyK');

      if (isSearchShortcut) {
        event.preventDefault();
        event.stopPropagation();
        setSearchOpen(true);
      }

      // Keep ESC handling out of editable fields so it doesn't fight native behavior.
      if (isEditableTarget(event.target)) return;

      if (event.key === 'Escape' && searchOpen) {
        event.preventDefault();
        closeSearch();
      }
    };

    // Capture phase helps when child widgets (like Monaco) swallow keyboard events.
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [searchOpen, closeSearch]);

  useEffect(() => {
    if (!searchOpen) return;
    setTimeout(() => searchInputRef.current?.focus(), 0);
  }, [searchOpen]);

  useEffect(() => {
    const timer = setTimeout(() => setActiveIndex(0), 0);
    return () => clearTimeout(timer);
  }, [searchText]);

  useEffect(() => {
    closeSearch();
  }, [location.pathname, closeSearch]);

  const handleSearchInputKeyDown = (event) => {
    if (!filteredFeatures.length) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1) % filteredFeatures.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((prev) => (prev - 1 + filteredFeatures.length) % filteredFeatures.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      goToFeature(filteredFeatures[activeIndex].path);
    }
  };

  return (
    <div className="app-layout">
      {/* Mobile overlay — only on small screens when sidebar is open */}
      {sidebarOpen && <div className="mobile-overlay md:hidden" onClick={() => setSidebarOpen(false)}></div>}

      {searchOpen && (
        <div className="feature-search-overlay" onClick={closeSearch}>
          <div className="feature-search-panel" onClick={(e) => e.stopPropagation()}>
            <div className="feature-search-input-wrap">
              <Search size={16} className="feature-search-icon" />
              <input
                ref={searchInputRef}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={handleSearchInputKeyDown}
                placeholder="Search tools..."
                className="feature-search-input"
              />
              <span className="feature-search-shortcut">Ctrl/Cmd + K</span>
            </div>

            <div className="feature-search-results custom-scrollbar">
              {filteredFeatures.length === 0 && (
                <div className="feature-search-empty">No matching feature found.</div>
              )}

              {filteredFeatures.map((item, index) => (
                <button
                  key={item.path}
                  type="button"
                  className={`feature-search-item ${index === activeIndex ? 'active' : ''}`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => goToFeature(item.path)}
                >
                  <div className="feature-search-item-info">
                    <span className="feature-search-item-name">{item.name}</span>
                    <span className="feature-search-item-desc">
                      {SEO_BY_PATH[item.path]?.description || "Access utility tools and resources."}
                    </span>
                  </div>
                  <small className="feature-search-item-group">{item.group}</small>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} onOpenSearch={openSearch} />
      
      <main className="main-content">
        {/* Mobile-only hamburger — only shows when sidebar is CLOSED on mobile */}
        {!sidebarOpen && (
          <button 
            className="sidebar-toggle-btn md:hidden"
            onClick={() => setSidebarOpen(true)}
            title="Open sidebar"
          >
            <Menu size={20} />
          </button>
        )}

        {/* Top Ad Slot */}
        <div className="w-full px-4 md:px-8 pt-6 pb-0 box-border overflow-hidden">
          <AdBanner
            client={import.meta.env.VITE_ADSENSE_CLIENT_ID}
            slot={import.meta.env.VITE_ADSENSE_TOP_SLOT}
            mode={theme}
          />
        </div>

        {/* Dynamic Tool Content */}
        <div className="layout-content-area">
          <Outlet />
        </div>

        {/* Bottom Ad Slot */}
        <div className="w-full px-4 md:px-8 pt-0 pb-6 mt-auto box-border overflow-hidden">
          <AdBanner
            client={import.meta.env.VITE_ADSENSE_CLIENT_ID}
            slot={import.meta.env.VITE_ADSENSE_BOTTOM_SLOT}
            mode={theme}
          />
        </div>

        {/* Premium Footer */}
        <footer className="footer-section">
          <div className="footer-content">
            <div className="footer-left">
              <Link to="/privacy" className="footer-link">Privacy Policy</Link>
            </div>
            <div className="footer-center">
              <span>Made with <span className="heart-icon">❤️</span> in India</span>
            </div>
            <div className="footer-right">
              &copy; 2026 DevMint. All rights reserved.
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

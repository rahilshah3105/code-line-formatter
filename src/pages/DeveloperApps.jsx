import { ExternalLink, ClipboardList, Type, KeyRound, Newspaper, Code, Users, Chrome } from 'lucide-react';
import './ToolPage.css';

const APPS = [
  {
    title: 'Instagram Analyzer',
    description: 'Analyze your Instagram connections, unfollowers, requests, and profile interactions.',
    url: 'https://instautility.netlify.app/',
    tag: 'Social',
    icon: <Users size={22} className="text-pink-400" />
  },
  {
    title: 'Password Manager',
    description: 'Generate secure passwords and manage them in a local vault with simple import/export support.',
    url: 'https://passgen-tools.vercel.app/',
    tag: 'Security',
    icon: <KeyRound size={22} className="text-emerald-400" />
  },
  {
    title: 'Word Utils',
    description: 'A handy suite of text and word utilities for quick formatting, cleanup, and content edits.',
    url: 'https://textmint.netlify.app/',
    tag: 'Text Helper',
    icon: <Type size={22} className="text-blue-400" />
  },
  {
    title: 'Task Manager',
    description: 'Plan your day with a clean task board for creating, tracking, and completing daily to-dos.',
    url: 'https://taskmint-tools.vercel.app/',
    tag: 'Productivity',
    icon: <ClipboardList size={22} className="text-indigo-400" />
  },
  {
    title: 'NewsPulse',
    description: 'Read latest headlines by category with a responsive news reader featuring bookmarks and dark mode.',
    url: 'https://getyournewspulse.netlify.app/',
    tag: 'Information',
    icon: <Newspaper size={22} className="text-amber-400" />
  },
  {
    title: 'Chrome Extension',
    description: 'Access all your favorite developer, social, and security utilities instantly from your browser toolbar.',
    url: 'https://github.com/rahilshah3105',
    tag: 'Extension',
    icon: <Chrome size={22} className="text-orange-400" />
  },
];

export default function DeveloperApps() {
  return (
    <div className="tool-page h-full flex flex-col overflow-y-auto">
      <header className="tool-header border-b border-[var(--border-light)] pb-6 mb-6">
        <div>
          <h2>Recommended Developer Apps</h2>
          <p>A curated list of external tools and platforms that pair nicely with DevMint.</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" style={{ paddingBottom: '32px', marginTop: '5px' }}>
          {APPS.map((app, idx) => (
            <a
              key={idx}
              href={app.url}
              target="_blank"
              rel="noopener noreferrer"
              className="developer-app-card"
            >
              <div className="developer-app-card-header">
                <div className="developer-app-card-header-left">
                  <div className="app-card-icon-wrapper">
                    {app.icon}
                  </div>
                  <div className="developer-app-card-title-group">
                    <span className="app-card-tag">
                      {app.tag}
                    </span>
                    <h3 className="developer-app-card-title">
                      {app.title}
                    </h3>
                  </div>
                </div>
                <ExternalLink size={16} className="developer-app-card-icon" />
              </div>

              <p className="developer-app-card-description">
                {app.description}
              </p>

            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

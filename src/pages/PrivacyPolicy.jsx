import { Shield, Lock, Eye, CheckCircle } from 'lucide-react';
import './ToolPage.css';

export default function PrivacyPolicy() {
  return (
    <div className="tool-page h-full flex flex-col overflow-y-auto" style={{ paddingBottom: '40px' }}>
      <header className="tool-header">
        <div>
          <h2>Privacy Policy</h2>
          <p>Last updated: June 13, 2026</p>
        </div>
      </header>

      <div className="flex-1 flex flex-col gap-6" style={{ maxWidth: '960px', margin: '0 auto', width: '100%' }}>
        {/* Intro Banner Card */}
        <div className="glass-panel rounded-xl p-8 flex flex-col md:flex-row gap-6 items-center">
          <div style={{
            background: 'rgba(59, 130, 246, 0.15)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '16px',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-primary)',
            flexShrink: 0
          }}>
            <Shield size={36} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>Your Privacy is Important</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: '1.6' }}>
              At DevMint, we are committed to protecting your privacy. This document outlines the types of personal information that is received and collected by DevMint and how it is used.
            </p>
          </div>
        </div>

        {/* Details Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>

          {/* AdSense & Cookies Section */}
          <div className="glass-panel rounded-xl p-6">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <Lock size={20} style={{ color: 'var(--accent-secondary)' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Google AdSense & Cookies</h3>
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p>
                We use Google AdSense to serve ads on our website. Google, as a third-party vendor, uses cookies to serve ads on DevMint.
              </p>
              <p>
                Google's use of advertising cookies enables it and its partners to serve ads to our users based on their visit to DevMint and/or other sites on the Internet.
              </p>
              <div style={{
                background: 'rgba(128, 128, 128, 0.05)',
                border: '1px solid var(--border-light)',
                borderRadius: '8px',
                padding: '12px 16px',
                fontSize: '0.85rem'
              }}>
                <strong>Opt-out option:</strong> Users may opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'underline' }}>Google Ad Settings</a>.
              </div>
            </div>
          </div>

          {/* Data Processing & Operations Section */}
          <div className="glass-panel rounded-xl p-6">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <Eye size={20} style={{ color: 'var(--accent-success)' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Information We Collect</h3>
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p>
                <strong>Local Processing:</strong> Unlike typical web services, DevMint is a client-side developer toolbox.
                Any code, JSON payloads, diffs, or text snippets you format or process in our tools are executed strictly inside your local browser.
                We do not send your workspace data to our servers.
              </p>
              <p>
                <strong>Log Files:</strong> Like many other websites, DevMint makes use of log files. These files merely log visitors to the site - usually a standard procedure for hosting companies and a part of service analytics. The information inside the log files includes internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), date/time stamp, referring/exit pages, and number of clicks.
              </p>
            </div>
          </div>

          {/* AdSense Compliance checklist */}
          <div className="glass-panel rounded-xl p-6">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <CheckCircle size={20} style={{ color: 'var(--accent-primary)' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Policy Disclosures & Consent</h3>
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p>
                By using our website, you hereby consent to our Privacy Policy and agree to its terms.
              </p>
              <p>
                Our Privacy Policy may be updated from time to time. Any changes will be posted directly on this page. If you require any more information or have any questions about our privacy policy, please feel free to contact us.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

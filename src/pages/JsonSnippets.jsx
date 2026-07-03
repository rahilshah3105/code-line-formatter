import { useState, useMemo } from 'react';
import ResourceLinks from '../components/ResourceLinks';
import { X, Copy, Check, Search, Download, Code2, AlignLeft, Minimize2 } from 'lucide-react';
import './ToolPage.css';

const SNIPPETS = [
  {
    id: 'users-array',
    title: 'Users Array',
    category: 'Users',
    description: 'Array of 5 user objects with typical profile fields.',
    data: [
      { id: 1, name: 'Priya Sharma', email: 'priya.sharma@example.com', username: 'priyash', role: 'admin', avatar: 'https://i.pravatar.cc/150?img=1', createdAt: '2024-01-15T08:30:00Z', active: true },
      { id: 2, name: 'Arjun Mehta', email: 'arjun.mehta@example.com', username: 'arjunm', role: 'user', avatar: 'https://i.pravatar.cc/150?img=2', createdAt: '2024-02-20T14:00:00Z', active: true },
      { id: 3, name: 'Kavya Nair', email: 'kavya.nair@example.com', username: 'kavyan', role: 'editor', avatar: 'https://i.pravatar.cc/150?img=3', createdAt: '2024-03-05T10:00:00Z', active: false },
      { id: 4, name: 'Rohan Desai', email: 'rohan.desai@example.com', username: 'rohand', role: 'user', avatar: 'https://i.pravatar.cc/150?img=4', createdAt: '2024-04-12T09:45:00Z', active: true },
      { id: 5, name: 'Anjali Iyer', email: 'anjali.iyer@example.com', username: 'anjalii', role: 'moderator', avatar: 'https://i.pravatar.cc/150?img=5', createdAt: '2024-05-01T11:30:00Z', active: true },
    ],
  },
  {
    id: 'products',
    title: 'Products (E-Commerce)',
    category: 'E-Commerce',
    description: 'Product catalog with price, rating, and category fields.',
    data: [
      { id: 101, name: 'Wireless Noise-Cancelling Headphones', brand: 'SoundMax', price: 149.99, salePrice: 119.99, currency: 'USD', category: 'Electronics', rating: 4.7, reviews: 1240, inStock: true, sku: 'SM-H100-BLK', tags: ['audio', 'wireless', 'noise-cancelling'] },
      { id: 102, name: 'Ergonomic Office Chair', brand: 'ComfortPro', price: 399.00, salePrice: null, currency: 'USD', category: 'Furniture', rating: 4.5, reviews: 845, inStock: true, sku: 'CP-CH200-GRY', tags: ['office', 'ergonomic', 'chair'] },
      { id: 103, name: 'Mechanical Keyboard TKL', brand: 'TypeMaster', price: 89.99, salePrice: 74.99, currency: 'USD', category: 'Electronics', rating: 4.8, reviews: 567, inStock: false, sku: 'TM-KB85-RED', tags: ['keyboard', 'mechanical', 'gaming'] },
      { id: 104, name: 'Standing Desk (Adjustable)', brand: 'RiseUp', price: 599.00, salePrice: 549.00, currency: 'USD', category: 'Furniture', rating: 4.6, reviews: 320, inStock: true, sku: 'RU-SD400-WHT', tags: ['desk', 'standing', 'adjustable'] },
    ],
  },
  {
    id: 'blog-posts',
    title: 'Blog Posts',
    category: 'Content',
    description: 'Blog post objects with author, tags, and metadata.',
    data: [
      { id: 1, title: 'Getting Started with React Hooks', slug: 'getting-started-react-hooks', author: { id: 1, name: 'Priya Sharma', avatar: 'https://i.pravatar.cc/150?img=1' }, excerpt: 'Learn how to use useState, useEffect, and custom hooks to build powerful React applications.', tags: ['react', 'javascript', 'hooks'], publishedAt: '2024-11-01T09:00:00Z', updatedAt: '2024-11-10T12:00:00Z', status: 'published', views: 12500, likes: 340 },
      { id: 2, title: 'Designing REST APIs That Developers Love', slug: 'designing-rest-apis', author: { id: 2, name: 'Arjun Mehta', avatar: 'https://i.pravatar.cc/150?img=2' }, excerpt: 'Best practices for clean, predictable, and well-documented REST API design.', tags: ['api', 'rest', 'backend'], publishedAt: '2024-11-15T10:00:00Z', updatedAt: '2024-11-15T10:00:00Z', status: 'published', views: 8900, likes: 220 },
      { id: 3, title: 'TypeScript Generics Explained', slug: 'typescript-generics-explained', author: { id: 3, name: 'Kavya Nair', avatar: 'https://i.pravatar.cc/150?img=3' }, excerpt: 'A deep dive into TypeScript generics with practical examples.', tags: ['typescript', 'generics', 'javascript'], publishedAt: null, updatedAt: '2024-12-01T08:00:00Z', status: 'draft', views: 0, likes: 0 },
    ],
  },
  {
    id: 'orders',
    title: 'Orders / Invoices',
    category: 'E-Commerce',
    description: 'Order objects with line items, totals, and shipping info.',
    data: [
      { orderId: 'ORD-2024-00451', status: 'delivered', customer: { id: 1, name: 'Priya Sharma', email: 'priya.sharma@example.com' }, items: [{ productId: 101, name: 'Wireless Headphones', qty: 1, unitPrice: 119.99 }, { productId: 103, name: 'Mechanical Keyboard TKL', qty: 1, unitPrice: 74.99 }], subtotal: 194.98, shipping: 9.99, tax: 17.55, total: 222.52, currency: 'USD', paymentMethod: 'credit_card', shippingAddress: { line1: 'Flat 4B, Andheri West', city: 'Mumbai', state: 'Maharashtra', pincode: '400053', country: 'IN' }, createdAt: '2024-11-20T14:30:00Z', deliveredAt: '2024-11-24T10:00:00Z' },
    ],
  },
  {
    id: 'auth-tokens',
    title: 'Auth / JWT Response',
    category: 'Auth',
    description: 'Standard login API response with tokens and user info.',
    data: {
      success: true,
      message: 'Login successful.',
      user: { id: 1, name: 'Priya Sharma', email: 'priya.sharma@example.com', role: 'admin' },
      tokens: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwibmFtZSI6IlByaXlhIFNoYXJtYSIsImlhdCI6MTcwMDAwMDAwMH0.abc123signature',
        refreshToken: 'rt_7f3b9c1d2e4a5b6c8d0e1f2a3b4c5d6e7f',
        expiresIn: 3600,
        tokenType: 'Bearer',
      },
    },
  },
  {
    id: 'app-config',
    title: 'App Config Object',
    category: 'Config',
    description: 'Application configuration JSON with env, feature flags, and API settings.',
    data: {
      app: { name: 'MyApp', version: '2.4.1', env: 'production', debug: false, timezone: 'UTC' },
      server: { host: '0.0.0.0', port: 8080, cors: { enabled: true, origins: ['https://myapp.com', 'https://app.myapp.com'], methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] } },
      database: { driver: 'postgres', host: 'db.myapp.com', port: 5432, name: 'myapp_prod', pool: { min: 2, max: 20 } },
      features: { darkMode: true, betaFeatures: false, maintenanceMode: false, analyticsEnabled: true },
      rateLimiting: { enabled: true, windowMs: 60000, maxRequests: 100 },
    },
  },
  {
    id: 'todos',
    title: 'Todo / Task List',
    category: 'Productivity',
    description: 'Array of todo items with priority, due date, and tags.',
    data: [
      { id: 1, title: 'Finish project proposal', description: 'Complete the Q1 proposal document and share with the team.', completed: false, priority: 'high', dueDate: '2025-01-15', tags: ['work', 'urgent'], createdAt: '2024-12-28T08:00:00Z' },
      { id: 2, title: 'Review pull requests', description: 'Review and merge open PRs for the authentication module.', completed: true, priority: 'medium', dueDate: '2025-01-10', tags: ['dev', 'code-review'], createdAt: '2024-12-29T09:30:00Z' },
      { id: 3, title: 'Set up CI/CD pipeline', description: 'Configure GitHub Actions for automated testing and deployment.', completed: false, priority: 'high', dueDate: '2025-01-20', tags: ['dev', 'devops'], createdAt: '2024-12-30T11:00:00Z' },
      { id: 4, title: 'Write unit tests', description: 'Add unit tests for all service layer functions.', completed: false, priority: 'medium', dueDate: '2025-01-25', tags: ['dev', 'testing'], createdAt: '2025-01-02T10:00:00Z' },
      { id: 5, title: 'Read "Clean Code"', description: 'Finish reading the book and write a summary.', completed: false, priority: 'low', dueDate: '2025-02-01', tags: ['personal', 'learning'], createdAt: '2025-01-03T07:00:00Z' },
    ],
  },
  {
    id: 'weather',
    title: 'Weather API Response',
    category: 'API',
    description: 'Typical weather API response with current conditions and forecast.',
    data: {
      location: { city: 'Mumbai', country: 'IN', lat: 19.076, lon: 72.877, timezone: 'Asia/Kolkata' },
      current: { temp: 32, feelsLike: 38, humidity: 78, windSpeed: 18, windDir: 'SW', condition: 'Partly Cloudy', icon: '02d', uvIndex: 7, visibility: 8 },
      forecast: [
        { date: '2025-01-15', high: 33, low: 24, condition: 'Sunny', icon: '01d', chanceOfRain: 5 },
        { date: '2025-01-16', high: 30, low: 23, condition: 'Rainy', icon: '10d', chanceOfRain: 80 },
        { date: '2025-01-17', high: 28, low: 22, condition: 'Thunderstorm', icon: '11d', chanceOfRain: 95 },
        { date: '2025-01-18', high: 31, low: 24, condition: 'Partly Cloudy', icon: '02d', chanceOfRain: 20 },
        { date: '2025-01-19', high: 34, low: 25, condition: 'Sunny', icon: '01d', chanceOfRain: 5 },
      ],
      units: 'metric',
      updatedAt: '2025-01-15T06:30:00Z',
    },
  },
  {
    id: 'api-success',
    title: 'API Success Response',
    category: 'API',
    description: 'Standard RESTful success response wrapper with pagination.',
    data: {
      success: true, status: 200, message: 'Data retrieved successfully.',
      data: { items: [{ id: 1, name: 'Sample Item A' }, { id: 2, name: 'Sample Item B' }] },
      meta: { page: 1, perPage: 20, total: 124, totalPages: 7 },
      links: { self: '/api/items?page=1', next: '/api/items?page=2', prev: null, first: '/api/items?page=1', last: '/api/items?page=7' },
      timestamp: '2025-01-15T10:30:00Z',
    },
  },
  {
    id: 'api-error',
    title: 'API Error Response',
    category: 'API',
    description: 'Standard error response with validation errors.',
    data: {
      success: false, status: 422, error: 'Validation Failed',
      message: 'The request data failed validation.',
      errors: [
        { field: 'email', code: 'REQUIRED', message: 'Email address is required.' },
        { field: 'password', code: 'MIN_LENGTH', message: 'Password must be at least 8 characters long.', meta: { min: 8, actual: 5 } },
        { field: 'username', code: 'TAKEN', message: 'This username is already taken.' },
      ],
      requestId: 'req_8f3b9c1d2e4a5b6c',
      timestamp: '2025-01-15T10:31:00Z',
    },
  },
  {
    id: 'countries',
    title: 'Countries List',
    category: 'Reference',
    description: 'Sample of country objects with code, calling code, and currency.',
    data: [
      { code: 'US', name: 'United States', callingCode: '+1', currency: { code: 'USD', name: 'US Dollar', symbol: '$' }, continent: 'North America', capital: 'Washington D.C.' },
      { code: 'IN', name: 'India', callingCode: '+91', currency: { code: 'INR', name: 'Indian Rupee', symbol: '₹' }, continent: 'Asia', capital: 'New Delhi' },
      { code: 'GB', name: 'United Kingdom', callingCode: '+44', currency: { code: 'GBP', name: 'British Pound', symbol: '£' }, continent: 'Europe', capital: 'London' },
      { code: 'DE', name: 'Germany', callingCode: '+49', currency: { code: 'EUR', name: 'Euro', symbol: '€' }, continent: 'Europe', capital: 'Berlin' },
      { code: 'JP', name: 'Japan', callingCode: '+81', currency: { code: 'JPY', name: 'Japanese Yen', symbol: '¥' }, continent: 'Asia', capital: 'Tokyo' },
      { code: 'BR', name: 'Brazil', callingCode: '+55', currency: { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' }, continent: 'South America', capital: 'Brasília' },
      { code: 'AU', name: 'Australia', callingCode: '+61', currency: { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' }, continent: 'Oceania', capital: 'Canberra' },
      { code: 'CA', name: 'Canada', callingCode: '+1', currency: { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' }, continent: 'North America', capital: 'Ottawa' },
    ],
  },
  {
    id: 'notifications',
    title: 'Notifications Feed',
    category: 'UI',
    description: 'Notification objects for building in-app notification systems.',
    data: [
      { id: 'n1', type: 'mention', read: false, title: 'Arjun mentioned you', body: '@priya Great work on the PR! Left some comments.', actor: { id: 2, name: 'Arjun Mehta', avatar: 'https://i.pravatar.cc/150?img=2' }, link: '/posts/42#comment-7', createdAt: '2025-01-15T09:05:00Z' },
      { id: 'n2', type: 'like', read: false, title: 'Kavya liked your post', body: '"Getting Started with React Hooks" received a new like.', actor: { id: 3, name: 'Kavya Nair', avatar: 'https://i.pravatar.cc/150?img=3' }, link: '/posts/1', createdAt: '2025-01-15T08:50:00Z' },
      { id: 'n3', type: 'system', read: true, title: 'New feature: Dark Mode 🌙', body: 'We just launched dark mode. You can toggle it in settings.', actor: null, link: '/settings/appearance', createdAt: '2025-01-14T12:00:00Z' },
      { id: 'n4', type: 'order', read: true, title: 'Order #ORD-2024-00451 delivered', body: 'Your order has been delivered. Leave a review!', actor: null, link: '/orders/ORD-2024-00451', createdAt: '2025-01-13T10:00:00Z' },
    ],
  },
];

const CATEGORIES = ['All', ...new Set(SNIPPETS.map(s => s.category))];

const CATEGORY_COLORS = {
  Users: '#3b82f6',
  'E-Commerce': '#f59e0b',
  Content: '#10b981',
  Auth: '#8b5cf6',
  Config: '#6b7280',
  Productivity: '#06b6d4',
  API: '#ef4444',
  Reference: '#84cc16',
  UI: '#ec4899',
};

// ── JSON stats helper ──────────────────────────────────────────────
function computeStats(data) {
  const json = JSON.stringify(data, null, 2);
  const minJson = JSON.stringify(data);

  let keys = 0, strings = 0, numbers = 0, booleans = 0, nulls = 0, arrays = 0, objects = 0;
  const walk = (v) => {
    if (Array.isArray(v)) { arrays++; v.forEach(walk); }
    else if (v !== null && typeof v === 'object') { objects++; Object.values(v).forEach(walk); keys += Object.keys(v).length; }
    else if (typeof v === 'string') strings++;
    else if (typeof v === 'number') numbers++;
    else if (typeof v === 'boolean') booleans++;
    else if (v === null) nulls++;
  };
  walk(data);

  return {
    lines: json.split('\n').length,
    sizeFormatted: minJson.length < 1024 ? `${minJson.length} B` : `${(minJson.length / 1024).toFixed(1)} KB`,
    keys, strings, numbers, booleans, nulls, arrays, objects,
    isArray: Array.isArray(data),
    topKeys: !Array.isArray(data) && typeof data === 'object' ? Object.keys(data) : [],
  };
}

// ── JSON syntax highlighter ────────────────────────────────────────
function highlight(json) {
  return json
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      (match) => {
        let cls = '#60a5fa'; // number
        if (/^"/.test(match)) {
          cls = /:$/.test(match) ? '#c084fc' : '#4ade80'; // key vs string
        } else if (/true|false/.test(match)) {
          cls = '#fb923c';
        } else if (/null/.test(match)) {
          cls = '#f87171';
        }
        return `<span style="color:${cls}">${match}</span>`;
      }
    );
}

const resources = [
  { title: 'JSONPlaceholder (free fake API)', url: 'https://jsonplaceholder.typicode.com/' },
  { title: 'Mockaroo – Generate realistic data', url: 'https://mockaroo.com/' },
];

// ── Detail Panel ───────────────────────────────────────────────────
function DetailPanel({ snippet, onClose }) {
  const [copied, setCopied] = useState(false);
  const [copiedMin, setCopiedMin] = useState(false);
  const [indent, setIndent] = useState(2);

  const json = JSON.stringify(snippet.data, null, indent);
  const minJson = JSON.stringify(snippet.data);
  const stats = useMemo(() => computeStats(snippet.data), [snippet.data]);
  const highlighted = useMemo(() => highlight(json), [json]);
  const catColor = CATEGORY_COLORS[snippet.category] || '#3b82f6';

  const handleCopy = () => {
    navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleCopyMin = () => {
    navigator.clipboard.writeText(minJson);
    setCopiedMin(true);
    setTimeout(() => setCopiedMin(false), 1800);
  };

  const handleDownload = () => {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${snippet.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 12 }}>
      {/* Detail header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexShrink: 0 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', background: `${catColor}22`, color: catColor, padding: '2px 8px', borderRadius: 6 }}>
              {snippet.category}
            </span>
          </div>
          <h3 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: 2 }}>{snippet.title}</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{snippet.description}</p>
        </div>
        <button onClick={onClose} style={{ padding: 6, borderRadius: 8, background: 'rgba(128,128,128,0.1)', border: '1px solid var(--border-light)', color: 'var(--text-secondary)', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
          <X size={16} />
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', flexShrink: 0 }}>
        {[
          ['Type', stats.isArray ? `Array[${snippet.data.length}]` : 'Object'],
          ['Lines', stats.lines],
          ['Size', stats.sizeFormatted],
          ['Keys', stats.keys],
          ['Strings', stats.strings],
          ['Numbers', stats.numbers],
          ['Booleans', stats.booleans],
          ['Arrays', stats.arrays],
        ].map(([label, val]) => (
          <div key={label} style={{ background: 'rgba(128,128,128,0.07)', border: '1px solid var(--border-light)', borderRadius: 8, padding: '5px 12px', textAlign: 'center', minWidth: 60 }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{val}</div>
            <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginTop: 1 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Top-level keys (for objects) */}
      {stats.topKeys.length > 0 && (
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', flexShrink: 0 }}>
          {stats.topKeys.map(k => (
            <span key={k} style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', background: 'rgba(192,132,252,0.12)', color: '#c084fc', padding: '2px 8px', borderRadius: 5 }}>
              {k}
            </span>
          ))}
        </div>
      )}

      {/* Action bar */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flexShrink: 0, alignItems: 'center' }}>
        <button
          onClick={handleCopy}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 8, background: copied ? 'rgba(16,185,129,0.15)' : 'var(--accent-primary)', color: copied ? 'var(--accent-success)' : 'white', border: copied ? '1px solid rgba(16,185,129,0.4)' : 'none', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', transition: 'all 0.2s' }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied!' : 'Copy Formatted'}
        </button>
        <button
          onClick={handleCopyMin}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, background: 'rgba(128,128,128,0.1)', border: '1px solid var(--border-light)', color: copiedMin ? 'var(--accent-success)' : 'var(--text-secondary)', fontWeight: 500, fontSize: '0.82rem', cursor: 'pointer', transition: 'all 0.2s' }}
        >
          {copiedMin ? <Check size={14} /> : <Minimize2 size={14} />}
          {copiedMin ? 'Copied!' : 'Copy Minified'}
        </button>
        <button
          onClick={handleDownload}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, background: 'rgba(128,128,128,0.1)', border: '1px solid var(--border-light)', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.82rem', cursor: 'pointer', transition: 'all 0.2s' }}
        >
          <Download size={14} />
          Download .json
        </button>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <AlignLeft size={13} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Indent:</span>
          {[2, 4].map(n => (
            <button key={n} onClick={() => setIndent(n)} style={{ width: 28, height: 26, borderRadius: 6, fontSize: '0.78rem', fontFamily: 'var(--font-mono)', fontWeight: 600, border: `1.5px solid ${indent === n ? 'var(--accent-primary)' : 'var(--border-light)'}`, background: indent === n ? 'rgba(59,130,246,0.12)' : 'rgba(128,128,128,0.07)', color: indent === n ? 'var(--accent-primary)' : 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.15s' }}>{n}</button>
          ))}
        </div>
      </div>

      {/* Code viewer */}
      <div className="glass-panel custom-scrollbar" style={{ flex: 1, borderRadius: 10, overflow: 'auto', padding: '14px 16px', minHeight: 0 }}>
        <pre
          style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', lineHeight: 1.65, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────
export default function JsonSnippets() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [selected, setSelected] = useState(null);

  const filtered = useMemo(() =>
    SNIPPETS.filter(s =>
      (filter === 'All' || s.category === filter) &&
      (!search.trim() || s.title.toLowerCase().includes(search.toLowerCase()) || s.category.toLowerCase().includes(search.toLowerCase()))
    ),
    [search, filter]
  );

  return (
    <div className="tool-page h-full flex flex-col overflow-y-auto" style={{ gap: 16 }}>
      <header className="tool-header">
        <div>
          <h2>JSON Snippets</h2>
          <p>Ready-to-paste dummy JSON datasets — click any card to inspect, copy, or download.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search snippets..."
              style={{ background: 'rgba(128,128,128,0.12)', border: '1.5px solid var(--border-light)', borderRadius: 8, padding: '7px 14px 7px 30px', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none', width: 200, fontFamily: 'var(--font-sans)' }}
            />
          </div>
        </div>
      </header>

      {/* Category Filter */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flexShrink: 0 }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => { setFilter(cat); setSelected(null); }}
            style={{ padding: '5px 14px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer', transition: 'all 0.18s', border: filter === cat ? `1.5px solid ${CATEGORY_COLORS[cat] || 'var(--accent-primary)'}` : '1.5px solid var(--border-light)', background: filter === cat ? `${CATEGORY_COLORS[cat] || '#3b82f6'}22` : 'rgba(128,128,128,0.07)', color: filter === cat ? (CATEGORY_COLORS[cat] || 'var(--accent-primary)') : 'var(--text-secondary)' }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', gap: 16, minHeight: 0, overflow: 'hidden' }}>

        {/* Cards grid — narrows when something is selected */}
        <div
          style={{ width: selected ? '320px' : '100%', flexShrink: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, transition: 'width 0.3s ease', paddingRight: selected ? 4 : 0 }}
          className="custom-scrollbar"
        >
          {filtered.map(snippet => {
            const catColor = CATEGORY_COLORS[snippet.category] || '#3b82f6';
            const isActive = selected?.id === snippet.id;
            const previewLines = JSON.stringify(snippet.data, null, 2).split('\n').slice(0, 4).join('\n');

            return (
              <div
                key={snippet.id}
                onClick={() => setSelected(isActive ? null : snippet)}
                className="glass-panel"
                style={{
                  borderRadius: 12, overflow: 'hidden', cursor: 'pointer', flexShrink: 0,
                  border: isActive ? `1.5px solid ${catColor}` : '1px solid var(--border-light)',
                  background: isActive ? `${catColor}0d` : 'var(--glass-bg)',
                  transition: 'all 0.2s',
                  boxShadow: isActive ? `0 0 0 3px ${catColor}22` : 'none',
                }}
              >
                <div style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                    <div>
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', background: `${catColor}22`, color: catColor, padding: '2px 7px', borderRadius: 5, display: 'inline-block', marginBottom: 4 }}>
                        {snippet.category}
                      </span>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.3 }}>{snippet.title}</div>
                    </div>
                    <Code2 size={14} style={{ color: isActive ? catColor : 'var(--text-muted)', flexShrink: 0, marginTop: 2, transition: 'color 0.2s' }} />
                  </div>
                  {!selected && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.4 }}>{snippet.description}</p>
                  )}
                  {!selected && (
                    <pre style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0, whiteSpace: 'pre-wrap', overflow: 'hidden', maxHeight: 56, lineHeight: 1.5 }}>
                      {previewLines}{'\n  ...'}
                    </pre>
                  )}
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontStyle: 'italic' }}>
              No snippets match your search.
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="glass-panel" style={{ flex: 1, borderRadius: 12, padding: '16px 18px', overflow: 'hidden', display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>
            <DetailPanel snippet={selected} onClose={() => setSelected(null)} />
          </div>
        )}
      </div>

      <ResourceLinks links={resources} />
    </div>
  );
}

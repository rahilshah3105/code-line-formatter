export default function NotFound() {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '520px', border: '1px solid rgba(148, 163, 184, 0.35)', borderRadius: '12px', padding: '28px', background: 'rgba(255, 255, 255, 0.72)' }}>
        <div style={{ fontSize: '14px', fontWeight: 700, color: '#ef4444', marginBottom: '8px' }}>404 Not Found</div>
        <h1 style={{ margin: 0, fontSize: '28px', lineHeight: 1.2 }}>This page does not exist.</h1>
        <p style={{ marginTop: '12px', marginBottom: '20px', color: '#475569' }}>Check the URL and try again, or return to the formatter home screen.</p>
        <a href="/formatter" style={{ display: 'inline-block', padding: '10px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', textDecoration: 'none', color: '#0f172a', background: '#f8fafc' }}>Go to Home</a>
      </div>
    </div>
  );
}
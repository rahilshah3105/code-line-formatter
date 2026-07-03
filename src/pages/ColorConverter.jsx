import { useState, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';
import ResourceLinks from '../components/ResourceLinks';
import './ToolPage.css';

const rgbaToHex = (r, g, b, a = 1) => {
  const toH = n => Math.round(n).toString(16).padStart(2, '0');
  let hx = `#${toH(r)}${toH(g)}${toH(b)}`;
  if (a < 1) hx += toH(a * 255);
  return hx;
};

const hslToRgb = (h, s, l) => {
  s /= 100; l /= 100;
  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return { r: Math.round(255 * f(0)), g: Math.round(255 * f(8)), b: Math.round(255 * f(4)) };
};

const hsvToRgb = (h, s, v) => {
  s /= 100; v /= 100;
  const f = (n, k = (n + h / 60) % 6) => v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
  return { r: Math.round(255 * f(5)), g: Math.round(255 * f(3)), b: Math.round(255 * f(1)) };
};

const cmykToRgb = (c, m, y, k) => {
  const r = 255 * (1 - c) * (1 - k);
  const g = 255 * (1 - m) * (1 - k);
  const b = 255 * (1 - y) * (1 - k);
  return { r: Math.round(r), g: Math.round(g), b: Math.round(b) };
};

export default function ColorConverter() {
  const [hex, setHex] = useState('#3b82f6');
  const [rgb, setRgb] = useState('rgb(59, 130, 246)');
  const [rgba, setRgba] = useState('rgba(59, 130, 246, 1)');
  const [hsl, setHsl] = useState('hsl(217, 91%, 60%)');
  const [hsla, setHsla] = useState('hsla(217, 91%, 60%, 1)');
  const [hsv, setHsv] = useState('hsv(217, 91%, 96%)');
  const [hex8, setHex8] = useState('#3b82f6ff');
  const [cmyk, setCmyk] = useState('cmyk(76%, 47%, 0%, 4%)');
  const [copiedField, setCopiedField] = useState(null);
  const [isValid, setIsValid] = useState(true);

  const hexToRgba = (hexValue) => {
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(hexValue.trim());
    if (!result) return null;
    return {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
      a: result[4] ? parseInt(result[4], 16) / 255 : 1
    };
  };

  const rgbToHslAndHsv = (r, g, b) => {
    r /= 255; g /= 255; b /= 255;
    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    let v = max;
    let d = max - min;
    let s_hsv = max === 0 ? 0 : d / max;

    if (max === min) {
      h = s = 0; // achromatic
    } else {
      let d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
        default: break;
      }
      h /= 6;
    }
    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
      v: Math.round(v * 100),
      s_hsv: Math.round(s_hsv * 100)
    };
  };

  useEffect(() => {
    const rgbaVal = hexToRgba(hex);
    if (rgbaVal) {
      setIsValid(true);
      const { r, g, b, a } = rgbaVal;
      const alphaStr = Number.isInteger(a) ? a.toString() : a.toFixed(2);

      setRgb(`rgb(${r}, ${g}, ${b})`);
      setRgba(`rgba(${r}, ${g}, ${b}, ${alphaStr})`);

      const { h, s, l, v, s_hsv } = rgbToHslAndHsv(r, g, b);
      setHsl(`hsl(${h}, ${s}%, ${l}%)`);
      setHsla(`hsla(${h}, ${s}%, ${l}%, ${alphaStr})`);
      setHsv(`hsv(${h}, ${s_hsv}%, ${v}%)`);

      const alphaHex = a < 1 ? Math.round(a * 255).toString(16).padStart(2, '0') : 'ff';
      const cleanHex = hex.startsWith('#') ? hex.slice(1) : hex;
      setHex8(`#${cleanHex.substring(0, 6)}${alphaHex}`.toLowerCase());

      let c = 1 - (r / 255);
      let m = 1 - (g / 255);
      let y = 1 - (b / 255);
      let k = Math.min(c, Math.min(m, y));
      if (k === 1) {
        c = m = y = 0;
      } else {
        c = (c - k) / (1 - k);
        m = (m - k) / (1 - k);
        y = (y - k) / (1 - k);
      }
      setCmyk(`cmyk(${Math.round(c * 100)}%, ${Math.round(m * 100)}%, ${Math.round(y * 100)}%, ${Math.round(k * 100)}%)`);
    } else {
      setIsValid(false);
    }
  }, [hex]);

  const handleInputChange = (e, type, setter) => {
    const val = e.target.value;
    setter(val);
    try {
      if (type === 'hex' || type === 'hex8') {
        setHex(val);
      } else if (type === 'rgb' || type === 'rgba') {
        const match = val.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/i);
        if (match) {
          const r = parseInt(match[1]); const g = parseInt(match[2]); const b = parseInt(match[3]);
          const a = match[4] ? parseFloat(match[4]) : 1;
          if (r <= 255 && g <= 255 && b <= 255 && a <= 1) setHex(rgbaToHex(r, g, b, a));
        }
      } else if (type === 'hsl' || type === 'hsla') {
        const match = val.match(/hsla?\(\s*(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?(?:\s*,\s*([\d.]+))?\s*\)/i);
        if (match) {
          let h = parseInt(match[1]); let s = parseInt(match[2]); let l = parseInt(match[3]);
          let a = match[4] ? parseFloat(match[4]) : 1;
          if (h <= 360 && s <= 100 && l <= 100 && a <= 1) {
            const { r, g, b } = hslToRgb(h, s, l);
            setHex(rgbaToHex(r, g, b, a));
          }
        }
      } else if (type === 'hsv') {
        const match = val.match(/hsv\(\s*(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?\s*\)/i);
        if (match) {
          let h = parseInt(match[1]); let s = parseInt(match[2]); let v = parseInt(match[3]);
          if (h <= 360 && s <= 100 && v <= 100) {
            const { r, g, b } = hsvToRgb(h, s, v);
            setHex(rgbaToHex(r, g, b, 1));
          }
        }
      } else if (type === 'cmyk') {
        const match = val.match(/cmyk\(\s*(\d+)%?\s*,\s*(\d+)%?\s*,\s*(\d+)%?\s*,\s*(\d+)%?\s*\)/i);
        if (match) {
          let c = parseInt(match[1]) / 100; let m = parseInt(match[2]) / 100;
          let y = parseInt(match[3]) / 100; let k = parseInt(match[4]) / 100;
          if (c <= 1 && m <= 1 && y <= 1 && k <= 1) {
            const { r, g, b } = cmykToRgb(c, m, y, k);
            setHex(rgbaToHex(r, g, b, 1));
          }
        }
      }
    } catch (err) { }
  };

  const copyToClipboard = (text, label) => {
    if (text && !text.includes('Invalid')) {
      navigator.clipboard.writeText(text);
      setCopiedField(label);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const resources = [
    { title: "MDN: Color Values", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/color_value" }
  ];

  return (
    <div className="tool-page h-full flex flex-col overflow-y-auto">
      <header className="tool-header">
        <div>
          <h2>Color Code Converter</h2>
          <p>Easily convert between HEX, RGB, and HSL color formats.</p>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row gap-6 mb-4">
        <div className="glass-panel flex-1 rounded-xl border border-[var(--border-light)] flex flex-col bg-[var(--bg-card)] overflow-hidden" style={{ minHeight: '400px' }}>
          {/* Top Header */}
          <div className="flex items-center justify-center gap-4 py-3">
            <span className="text-[13px] font-semibold text-[var(--text-primary)] uppercase tracking-wider">COLOR</span>

            <div className="glass-panel flex items-center rounded-md overflow-hidden border border-[var(--border-light)] bg-[rgba(0,0,0,0.2)]">
              <input
                type="color"
                value={isValid ? hex.slice(0, 7) : '#000000'}
                onChange={(e) => setHex(e.target.value)}
                className="w-10 h-8 cursor-pointer border-none outline-none block"
                style={{ padding: 0, background: 'transparent', border: 'none' }}
              />
              <div className="w-px h-full bg-[rgba(255,255,255,0.1)]"></div>
              <input
                type="text"
                value={hex}
                onChange={(e) => setHex(e.target.value)}
                className="w-24 h-8 bg-transparent text-sm font-mono tracking-wider px-2 outline-none text-white border-none"
                style={{ border: 'none' }}
                placeholder="#HEX"
              />
            </div>
          </div>

          {/* Color Preview Canvas */}
          <div className="flex-1 pt-0 flex flex-col">
            <div
              className="flex-1 w-full rounded-b-xl rounded-t-sm shadow-md transition-colors duration-200"
              style={{
                backgroundColor: isValid ? rgba : 'var(--bg-main)',
                borderTop: '1px solid rgba(255,255,255,0.1)',
                boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.2)'
              }}
            ></div>
          </div>
        </div>

        <div className="flex-[2] grid grid-cols-1 md:grid-cols-2 gap-4 content-start">
          {[
            { label: 'HEX Color', value: hex, type: 'hex', setter: setHex },
            { label: 'HEX8 Color', value: hex8, type: 'hex8', setter: setHex8 },
            { label: 'RGB Color', value: rgb, type: 'rgb', setter: setRgb },
            { label: 'RGBA Color', value: rgba, type: 'rgba', setter: setRgba },
            { label: 'HSL Color', value: hsl, type: 'hsl', setter: setHsl },
            { label: 'HSLA Color', value: hsla, type: 'hsla', setter: setHsla },
            { label: 'HSV Color', value: hsv, type: 'hsv', setter: setHsv },
            { label: 'CMYK Color', value: cmyk, type: 'cmyk', setter: setCmyk }
          ].map((item, idx) => (
            <div key={idx} className="glass-panel rounded-xl overflow-hidden flex flex-col p-4 shadow border-[var(--border-light)] relative">
              <label className="text-xs text-[var(--text-muted)] uppercase tracking-wide font-semibold mb-2">{item.label}</label>
              <div className="relative flex items-center gap-4">
                <input
                  type="text"
                  value={item.value}
                  onChange={(e) => handleInputChange(e, item.type, item.setter)}
                  className="custom-input text-lg font-mono w-full"
                  style={{ paddingRight: '40px' }}
                />
                <button
                  className="absolute right-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors p-1.5 rounded-lg hover:bg-[rgba(128,128,128,0.1)]"
                  onClick={() => copyToClipboard(item.value, item.label)}
                  title="Copy to clipboard"
                >
                  {copiedField === item.label ? <Check size={18} className="text-[var(--accent-success)]" /> : <Copy size={18} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ResourceLinks links={resources} />
    </div>
  );
}

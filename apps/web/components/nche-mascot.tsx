import type { CSSProperties } from "react";

type NcheMascotProps = {
  compact?: boolean;
  className?: string;
};

/**
 * Nche Sentinel is the visual shorthand for sequence-aware monitoring.
 * It is intentionally an inline SVG so it stays crisp, lightweight, and
 * works without a third-party image or font dependency.
 */
export function NcheMascot({ compact = false, className = "" }: NcheMascotProps) {
  const style = { "--mascot-scale": compact ? 0.76 : 1 } as CSSProperties;
  return (
    <div className={`nche-mascot ${compact ? "nche-mascot-compact" : ""} ${className}`.trim()} style={style} role="img" aria-label="Nche Sentinel, sequence monitoring mascot">
      <div className="nche-mascot-orbit nche-mascot-orbit-one" aria-hidden="true" />
      <div className="nche-mascot-orbit nche-mascot-orbit-two" aria-hidden="true" />
      <svg className="nche-mascot-art" viewBox="0 0 160 160" aria-hidden="true">
        <defs>
          <linearGradient id="nche-sentinel-shell" x1="20" y1="20" x2="140" y2="140" gradientUnits="userSpaceOnUse">
            <stop stopColor="#55b2f5" />
            <stop offset="1" stopColor="#1e78bd" />
          </linearGradient>
          <linearGradient id="nche-sentinel-face" x1="38" y1="31" x2="122" y2="130" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ffffff" />
            <stop offset="1" stopColor="#eaf7fe" />
          </linearGradient>
          <filter id="nche-sentinel-shadow" x="-30%" y="-30%" width="160%" height="170%">
            <feDropShadow dx="0" dy="7" stdDeviation="7" floodColor="#2f91cf" floodOpacity=".2" />
          </filter>
        </defs>
        <circle className="nche-mascot-signal" cx="80" cy="80" r="67" fill="none" stroke="#9ed8f7" strokeWidth="1.5" strokeDasharray="2 8" />
        <path d="M80 11v13M149 80h-13M80 149v-13M11 80h13" stroke="#9ed8f7" strokeWidth="2" strokeLinecap="round" />
        <path d="M80 25 128 44v35c0 31-20 49-48 58-28-9-48-27-48-58V44l48-19Z" fill="url(#nche-sentinel-shell)" filter="url(#nche-sentinel-shadow)" />
        <path d="M80 34 118 49v29c0 24-15 39-38 47-23-8-38-23-38-47V49l38-15Z" fill="url(#nche-sentinel-face)" />
        <path d="M57 79c7-10 16-15 23-15s16 5 23 15c-7 10-16 15-23 15s-16-5-23-15Z" fill="#d7effc" stroke="#2a88c8" strokeWidth="2" />
        <circle cx="80" cy="79" r="7" fill="#0c0a09" />
        <circle cx="82.5" cy="76.5" r="2" fill="#fff" />
        <path d="M67 106c7 4 19 4 26 0" fill="none" stroke="#2a88c8" strokeWidth="2" strokeLinecap="round" />
        <circle className="nche-mascot-beacon" cx="80" cy="18" r="4" fill="#3ba6f1" />
      </svg>
      {!compact && <div className="nche-mascot-caption"><strong>Nche Sentinel</strong><span>watching the sequence</span></div>}
    </div>
  );
}

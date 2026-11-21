import { useEffect, useId, useState } from 'react';
import type { SceneKind } from '../data/venues';

type PhotoProps = {
  photo?: string | null;
  scene: SceneKind;
  /** Describes the real photograph that belongs here. */
  alt: string;
  className?: string;
  eager?: boolean;
  /** 'contain' never crops (lightbox); 'cover' fills the frame. */
  fit?: 'cover' | 'contain';
};

/**
 * Real photo when configured AND loadable; otherwise an on-brand illustration (never a stock photo of another venue).
 * The parent supplies the aspect-ratio box, so loading never shifts the layout.
 */
export function Photo({ photo, scene, alt, className = '', eager = false, fit = 'cover' }: PhotoProps) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [photo]);

  if (photo && !failed) {
    return (
      <img
        src={photo}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        onError={() => setFailed(true)}
        className={`h-full w-full bg-plum/10 ${fit === 'contain' ? 'object-contain' : 'object-cover'} ${className}`}
      />
    );
  }
  return (
    <div role="img" aria-label={`Placeholder illustration for: ${alt}`} className={`h-full w-full ${className}`}>
      <Scene kind={scene} />
    </div>
  );
}

const lights = [40, 95, 150, 205, 260, 315, 360];
const palettes: Record<SceneKind, [string, string]> = {
  hero: ['#241822', '#4a3140'], hall: ['#2b1d26', '#5a3b4a'], stage: ['#30212A', '#6b4553'],
  decor: ['#3a2631', '#7a5160'], dining: ['#2a1c25', '#55384a'], garden: ['#1f1a22', '#3d3040'], special: ['#33222d', '#6f4a5a'],
};

export function Scene({ kind }: { kind: SceneKind }) {
  // useId keeps gradient ids unique when several scenes of the same kind are on the page (duplicate ids are invalid HTML)
  const id = `s${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const [a, b] = palettes[kind];
  return (
    <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" className="block h-full w-full" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={a} /><stop offset="1" stopColor={b} /></linearGradient>
        <radialGradient id={`${id}-glow`} cx="50%" cy="38%" r="55%"><stop offset="0" stopColor="#C5A46D" stopOpacity=".38" /><stop offset="1" stopColor="#C5A46D" stopOpacity="0" /></radialGradient>
      </defs>
      <rect width="400" height="300" fill={`url(#${id}-bg)`} />
      <rect width="400" height="300" fill={`url(#${id}-glow)`} />
      {(kind === 'hall' || kind === 'hero' || kind === 'stage') && (
        <g fill="none" stroke="#C5A46D" strokeOpacity=".55" strokeWidth="1.5">
          <path d="M110 300V150a90 90 0 0 1 180 0v150" />
          <path d="M132 300V155a68 68 0 0 1 136 0v145" strokeOpacity=".35" />
          <path d="M30 300V190a50 50 0 0 1 100 0" strokeOpacity=".28" /><path d="M270 300V190a50 50 0 0 1 100 0" strokeOpacity=".28" />
        </g>
      )}
      {(kind === 'hall' || kind === 'hero' || kind === 'dining' || kind === 'special') && (
        <g stroke="#C5A46D" strokeOpacity=".8" fill="#C5A46D">
          <line x1="200" y1="0" x2="200" y2="52" strokeWidth="1" />
          <ellipse cx="200" cy="60" rx="26" ry="8" fillOpacity=".25" strokeWidth="1" />
          {[-20, -10, 0, 10, 20].map((x) => <circle key={x} cx={200 + x} cy={70 + Math.abs(x) / 3} r="2" />)}
        </g>
      )}
      {kind === 'stage' && (
        <g>
          <rect x="120" y="205" width="160" height="12" fill="#C5A46D" fillOpacity=".5" />
          <rect x="140" y="170" width="120" height="35" rx="3" fill="#F7F3ED" fillOpacity=".12" stroke="#C5A46D" strokeOpacity=".6" />
          {[0, 1, 2, 3, 4, 5, 6].map((i) => <circle key={i} cx={125 + i * 25} cy={120 + (i % 2) * 8} r="7" fill="#C5A46D" fillOpacity={0.2 + (i % 3) * 0.1} />)}
        </g>
      )}
      {(kind === 'dining' || kind === 'hall' || kind === 'special') && (
        <g fill="#F7F3ED" fillOpacity=".14" stroke="#C5A46D" strokeOpacity=".55">
          {[70, 200, 330].map((x) => <ellipse key={x} cx={x} cy={kind === 'dining' ? 215 : 252} rx="40" ry="11" />)}
          {[70, 200, 330].map((x) => <circle key={`c${x}`} cx={x} cy={kind === 'dining' ? 207 : 244} r="3" fill="#C5A46D" stroke="none" />)}
        </g>
      )}
      {kind === 'decor' && (
        <g fill="none" stroke="#C5A46D" strokeOpacity=".7">
          {[60, 140, 220, 300].map((x, i) => (
            <g key={x}><path d={`M${x} 0 C ${x + 12} 60, ${x - 12} 100, ${x} ${130 + i * 10}`} /><circle cx={x} cy={134 + i * 10} r="10" fill="#C5A46D" fillOpacity=".22" /><circle cx={x} cy={134 + i * 10} r="4" fill="#C5A46D" fillOpacity=".6" /></g>
          ))}
          <ellipse cx="200" cy="248" rx="150" ry="14" fill="#F7F3ED" fillOpacity=".1" />
        </g>
      )}
      {kind === 'garden' && (
        <g>
          <path d="M0 230 Q100 200 200 225 T400 215 V300 H0Z" fill="#15111a" fillOpacity=".7" />
          <path d="M20 60 Q200 120 380 50" fill="none" stroke="#C5A46D" strokeOpacity=".5" />
          {lights.map((x, i) => <circle key={x} cx={x} cy={62 + Math.sin(i * 0.9 + 0.6) * 24 + 20} r="3.2" fill="#C5A46D" fillOpacity=".9" />)}
          {[60, 330].map((x) => <path key={x} d={`M${x} 230 l-14 -70 l28 0z`} fill="#241822" stroke="#C5A46D" strokeOpacity=".3" />)}
        </g>
      )}
      {kind === 'special' && (
        <g fill="#C5A46D">{[50, 120, 280, 350].map((x, i) => <g key={x}><line x1={x} y1="0" x2={x} y2={40 + i * 8} stroke="#C5A46D" strokeOpacity=".5" /><rect x={x - 7} y={40 + i * 8} width="14" height="20" rx="4" fillOpacity=".55" /></g>)}</g>
      )}
    </svg>
  );
}

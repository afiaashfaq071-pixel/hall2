export function Logo({ light = true }: { light?: boolean }) {
  return (
    <span className="inline-flex items-center gap-3">
      <svg width="38" height="38" viewBox="0 0 64 64" aria-hidden="true">
        <path d="M32 6C20 6 11 16 11 29v29h42V29C53 16 44 6 32 6z" fill="none" stroke="#C5A46D" strokeWidth="2.5" />
        <path d="M32 14c-7 0-12 6-12 15v29h24V29c0-9-5-15-12-15z" fill="none" stroke="#C5A46D" strokeOpacity=".5" strokeWidth="1.5" />
        <text x="32" y="46" fontFamily="Cormorant Garamond, Georgia, serif" fontSize="26" fontWeight="600" textAnchor="middle" fill="#C5A46D">G</text>
      </svg>
      <span className="leading-none">
        <span className={`block font-display text-[1.35rem] font-semibold tracking-wide ${light ? 'text-ivory' : 'text-plum'}`}>Gulshan</span>
        <span className="block text-[0.65rem] font-medium uppercase tracking-[0.3em] text-gold">Banquet Hall</span>
      </span>
    </span>
  );
}

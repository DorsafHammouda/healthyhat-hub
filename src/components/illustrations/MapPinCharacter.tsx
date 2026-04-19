export function MapPinCharacter({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 160" className={className} aria-hidden="true">
      {/* shadow */}
      <ellipse cx="80" cy="146" rx="22" ry="4" fill="oklch(0.4 0.05 150 / 0.18)" />
      {/* pin body */}
      <path d="M80 24 c22 0 38 16 38 38 c0 26 -38 76 -38 76 s-38 -50 -38 -76 c0 -22 16 -38 38 -38 z" fill="oklch(0.74 0.14 55)" />
      {/* inner circle */}
      <circle cx="80" cy="62" r="18" fill="oklch(0.96 0.04 85)" />
      {/* face */}
      <circle cx="74" cy="60" r="2.5" fill="oklch(0.25 0.05 150)" />
      <circle cx="86" cy="60" r="2.5" fill="oklch(0.25 0.05 150)" />
      <path d="M74 67 q6 5 12 0" stroke="oklch(0.25 0.05 150)" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* leaves */}
      <ellipse cx="58" cy="40" rx="8" ry="5" fill="oklch(0.72 0.14 145)" transform="rotate(-30 58 40)" />
      <ellipse cx="104" cy="42" rx="8" ry="5" fill="oklch(0.72 0.14 145)" transform="rotate(35 104 42)" />
    </svg>
  );
}

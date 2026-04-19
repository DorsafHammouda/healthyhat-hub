export function ChefCharacter({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 160" className={className} aria-hidden="true">
      {/* chef hat puff */}
      <ellipse cx="60" cy="50" rx="22" ry="20" fill="oklch(0.98 0.01 100)" />
      <ellipse cx="100" cy="50" rx="22" ry="20" fill="oklch(0.98 0.01 100)" />
      <ellipse cx="80" cy="40" rx="24" ry="22" fill="oklch(0.98 0.01 100)" />
      {/* hat band */}
      <rect x="50" y="64" width="60" height="14" rx="4" fill="oklch(0.98 0.01 100)" stroke="oklch(0.85 0.04 100)" strokeWidth="1.5" />
      {/* face circle */}
      <circle cx="80" cy="106" r="32" fill="oklch(0.92 0.05 65)" />
      {/* eyes */}
      <circle cx="70" cy="102" r="3.5" fill="oklch(0.25 0.05 150)" />
      <circle cx="90" cy="102" r="3.5" fill="oklch(0.25 0.05 150)" />
      {/* smile */}
      <path d="M68 114 q12 12 24 0" stroke="oklch(0.25 0.05 150)" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* cheeks */}
      <circle cx="60" cy="112" r="4" fill="oklch(0.78 0.13 30 / 0.55)" />
      <circle cx="100" cy="112" r="4" fill="oklch(0.78 0.13 30 / 0.55)" />
      {/* sparkle */}
      <path d="M126 60 l3 6 l6 3 l-6 3 l-3 6 l-3 -6 l-6 -3 l6 -3 z" fill="oklch(0.85 0.12 90)" />
    </svg>
  );
}

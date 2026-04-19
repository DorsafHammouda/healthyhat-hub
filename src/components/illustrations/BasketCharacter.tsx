export function BasketCharacter({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 160" className={className} aria-hidden="true">
      {/* leaves poking up */}
      <ellipse cx="60" cy="50" rx="10" ry="18" fill="oklch(0.7 0.15 145)" transform="rotate(-20 60 50)" />
      <ellipse cx="80" cy="42" rx="9" ry="16" fill="oklch(0.78 0.14 145)" />
      <ellipse cx="100" cy="50" rx="10" ry="18" fill="oklch(0.7 0.15 145)" transform="rotate(20 100 50)" />
      {/* tomato */}
      <circle cx="70" cy="62" r="11" fill="oklch(0.7 0.18 30)" />
      {/* carrot */}
      <ellipse cx="95" cy="64" rx="8" ry="12" fill="oklch(0.78 0.15 55)" transform="rotate(15 95 64)" />
      {/* basket body */}
      <path
        d="M30 78 h100 l-10 56 a14 14 0 0 1 -14 12 H54 a14 14 0 0 1 -14 -12 z"
        fill="oklch(0.82 0.1 65)"
      />
      {/* weave lines */}
      <path d="M40 92 h80 M42 108 h76 M46 124 h68" stroke="oklch(0.65 0.1 55)" strokeWidth="3" strokeLinecap="round" fill="none" />
      {/* handle */}
      <path d="M48 78 q32 -32 64 0" stroke="oklch(0.65 0.1 55)" strokeWidth="6" fill="none" strokeLinecap="round" />
      {/* face */}
      <circle cx="68" cy="116" r="3" fill="oklch(0.25 0.05 150)" />
      <circle cx="92" cy="116" r="3" fill="oklch(0.25 0.05 150)" />
      <path d="M70 126 q10 8 20 0" stroke="oklch(0.25 0.05 150)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* cheeks */}
      <circle cx="60" cy="124" r="3.5" fill="oklch(0.78 0.12 30 / 0.6)" />
      <circle cx="100" cy="124" r="3.5" fill="oklch(0.78 0.12 30 / 0.6)" />
    </svg>
  );
}

export function RecipeBookCharacter({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 160" className={className} aria-hidden="true">
      {/* book shadow */}
      <ellipse cx="80" cy="138" rx="48" ry="6" fill="oklch(0.4 0.05 150 / 0.15)" />
      {/* left page */}
      <path d="M28 50 q0 -10 10 -10 h38 v82 h-38 q-10 0 -10 -10 z" fill="oklch(0.97 0.03 90)" stroke="oklch(0.7 0.05 80)" strokeWidth="2" />
      {/* right page */}
      <path d="M132 50 q0 -10 -10 -10 h-38 v82 h38 q10 0 10 -10 z" fill="oklch(0.97 0.03 90)" stroke="oklch(0.7 0.05 80)" strokeWidth="2" />
      {/* spine */}
      <rect x="76" y="40" width="8" height="82" fill="oklch(0.74 0.14 55)" rx="2" />
      {/* lines */}
      <path d="M38 60 h32 M38 70 h28 M38 80 h32 M90 60 h32 M90 70 h26 M90 80 h32" stroke="oklch(0.78 0.06 80)" strokeWidth="2" strokeLinecap="round" />
      {/* carrot bookmark */}
      <path d="M104 30 l-4 18 l-8 -2 z" fill="oklch(0.74 0.16 55)" />
      <path d="M100 28 q4 -6 10 -2" stroke="oklch(0.65 0.16 145)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* face */}
      <circle cx="50" cy="100" r="2.5" fill="oklch(0.25 0.05 150)" />
      <circle cx="64" cy="100" r="2.5" fill="oklch(0.25 0.05 150)" />
      <path d="M50 108 q7 5 14 0" stroke="oklch(0.25 0.05 150)" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="44" cy="106" r="2.5" fill="oklch(0.78 0.12 30 / 0.6)" />
      <circle cx="70" cy="106" r="2.5" fill="oklch(0.78 0.12 30 / 0.6)" />
    </svg>
  );
}

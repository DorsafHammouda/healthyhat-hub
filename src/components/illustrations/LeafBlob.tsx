export function LeafBlob({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M44 96c-6-32 18-66 54-72s72 14 80 48-10 70-40 84-78 8-86-20-2-10-8-40z"
      />
    </svg>
  );
}

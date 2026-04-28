"use client";

export function AutoNomadLogo({ className = "size-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Compass outer ring */}
      <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="2" />
      {/* Network nodes */}
      <circle cx="20" cy="8" r="2.5" fill="currentColor" />
      <circle cx="32" cy="20" r="2.5" fill="currentColor" />
      <circle cx="20" cy="32" r="2.5" fill="currentColor" />
      <circle cx="8" cy="20" r="2.5" fill="currentColor" />
      {/* Center node */}
      <circle cx="20" cy="20" r="3.5" fill="currentColor" />
      {/* Network lines */}
      <line x1="20" y1="10.5" x2="20" y2="16.5" stroke="currentColor" strokeWidth="1.5" />
      <line x1="23.5" y1="20" x2="29.5" y2="20" stroke="currentColor" strokeWidth="1.5" />
      <line x1="20" y1="23.5" x2="20" y2="29.5" stroke="currentColor" strokeWidth="1.5" />
      <line x1="10.5" y1="20" x2="16.5" y2="20" stroke="currentColor" strokeWidth="1.5" />
      {/* Compass needle N */}
      <path d="M20 3 L21.5 6.5 L18.5 6.5 Z" fill="currentColor" />
    </svg>
  );
}

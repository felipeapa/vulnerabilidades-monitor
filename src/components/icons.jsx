// Inline SVG icons (no icon dependency, no network requests)
const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': 'true',
  focusable: 'false',
};

export function ShieldIcon({ size = 22 }) {
  return (
    <svg {...base} width={size} height={size}>
      <path d="M12 3l7 3v5.2c0 4.4-3 7.5-7 8.8-4-1.3-7-4.4-7-8.8V6l7-3z" />
      <path d="M9.3 12.1l1.9 1.9 3.6-3.8" />
    </svg>
  );
}

export function RefreshIcon({ size = 16 }) {
  return (
    <svg {...base} width={size} height={size}>
      <path d="M20 11a8 8 0 1 0-2.3 5.7" />
      <path d="M20 5v6h-6" />
    </svg>
  );
}

export function SearchIcon({ size = 16 }) {
  return (
    <svg {...base} width={size} height={size}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4 4" />
    </svg>
  );
}

export function ChevronIcon({ size = 16 }) {
  return (
    <svg {...base} width={size} height={size}>
      <path d="M6 9.5l6 6 6-6" />
    </svg>
  );
}

export function AlertIcon({ size = 18 }) {
  return (
    <svg {...base} width={size} height={size}>
      <path d="M12 4.5l8.5 15h-17l8.5-15z" />
      <path d="M12 10v4.5" />
      <path d="M12 17.2v.1" />
    </svg>
  );
}

export function CheckIcon({ size = 20 }) {
  return (
    <svg {...base} width={size} height={size}>
      <path d="M5 12.5l4.5 4.5L19 7" />
    </svg>
  );
}

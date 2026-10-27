const DATE_FORMAT = new Intl.DateTimeFormat('es', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const DATE_TIME_FORMAT = new Intl.DateTimeFormat('es', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

function parse(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value) {
  const date = parse(value);
  return date ? DATE_FORMAT.format(date) : '—';
}

export function formatDateTime(value) {
  const date = parse(value);
  return date ? DATE_TIME_FORMAT.format(date) : null;
}

// Turns raw advisory markdown into a short, readable excerpt.
export function excerpt(text, maxLength = 320) {
  if (!text) return '';

  const clean = String(text)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_`>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (clean.length <= maxLength) return clean;

  const cut = clean.lastIndexOf(' ', maxLength);
  return `${clean.slice(0, cut > 0 ? cut : maxLength).trim()}…`;
}


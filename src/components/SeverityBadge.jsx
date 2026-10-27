const SEVERITY_LABELS = {
  CRITICAL: 'Crítica',
  HIGH: 'Alta',
  MEDIUM: 'Media',
  LOW: 'Baja',
  UNKNOWN: 'Sin dato',
};

export function normalizeSeverity(value) {
  const level = String(value || '').toUpperCase();
  return SEVERITY_LABELS[level] ? level : 'UNKNOWN';
}

export function severityLabel(value) {
  return SEVERITY_LABELS[normalizeSeverity(value)];
}

export default function SeverityBadge({ severity }) {
  const level = normalizeSeverity(severity);

  return (
    <span className={`badge badge--${level.toLowerCase()}`} title={`Severidad ${SEVERITY_LABELS[level]}`}>
      <span className="badge__dot" aria-hidden="true" />
      {SEVERITY_LABELS[level]}
    </span>
  );
}

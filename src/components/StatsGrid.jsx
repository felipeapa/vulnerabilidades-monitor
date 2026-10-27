const CARDS = [
  { key: 'total', label: 'Total', modifier: 'total' },
  { key: 'critical', label: 'Críticas', modifier: 'critical' },
  { key: 'high', label: 'Altas', modifier: 'high' },
  { key: 'medium', label: 'Medias', modifier: 'medium' },
  { key: 'low', label: 'Bajas', modifier: 'low' },
];

export default function StatsGrid({ counts }) {
  return (
    <section className="stats-grid" aria-label="Resumen de vulnerabilidades por severidad">
      {CARDS.map(card => (
        <article key={card.key} className={`stat-card stat-card--${card.modifier}`}>
          <div className="stat-card__label">{card.label}</div>
          <div className="stat-card__value">{counts[card.key] ?? 0}</div>
        </article>
      ))}
    </section>
  );
}

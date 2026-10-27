export default function TechnologyFilter({
  technologies,
  selected,
  counts,
  onToggle,
  onSelectAll,
}) {
  const allSelected = selected.length === technologies.length;

  return (
    <section className="tech-filter" aria-label="Tecnologías mostradas">
      <span className="tech-filter__label">Tecnologías</span>

      <div className="tech-filter__chips" role="group" aria-label="Seleccionar tecnologías">
        <button
          type="button"
          className="tech-chip"
          aria-pressed={allSelected}
          onClick={onSelectAll}
        >
          Todas
          <span className="tech-chip__count">{counts.all ?? 0}</span>
        </button>

        {technologies.map(technology => (
          <button
            key={technology.id}
            type="button"
            className="tech-chip"
            aria-pressed={selected.includes(technology.id)}
            onClick={() => onToggle(technology.id)}
          >
            {technology.name}
            <span className="tech-chip__count">{counts[technology.id] ?? 0}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

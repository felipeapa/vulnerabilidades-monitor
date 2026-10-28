import { SearchIcon } from './icons';
import { PERIODS } from '../utils/periods';

export default function Toolbar({
  query,
  onQueryChange,
  filter,
  onFilterChange,
  counts,
  status,
  onStatusChange,
  statusCounts,
  period,
  onPeriodChange,
}) {
  const filters = [
    { value: 'ALL', label: 'Todas', countKey: 'total' },
    { value: 'CRITICAL', label: 'Críticas', countKey: 'critical' },
    { value: 'HIGH', label: 'Altas', countKey: 'high' },
    { value: 'MEDIUM', label: 'Medias', countKey: 'medium' },
    { value: 'LOW', label: 'Bajas', countKey: 'low' },
    { value: 'UNKNOWN', label: 'Sin dato', countKey: 'unknown' },
  ].filter(item => item.value !== 'UNKNOWN' || counts.unknown > 0);

  const statusFilters = [
    { value: 'ALL', label: 'Todas', countKey: 'all' },
    { value: 'OPEN', label: 'Pendientes', countKey: 'open' },
    { value: 'RESOLVED', label: 'Resueltas', countKey: 'resolved' },
  ];

  return (
    <div className="toolbar">
      <div className="search">
        <span className="search__icon" aria-hidden="true">
          <SearchIcon />
        </span>
        <label className="sr-only" htmlFor="vuln-search">
          Buscar por paquete, identificador o descripción
        </label>
        <input
          id="vuln-search"
          type="search"
          value={query}
          onChange={event => onQueryChange(event.target.value)}
          placeholder="Buscar paquete, CVE o GHSA…"
          autoComplete="off"
        />
      </div>

      <div className="filter-group">
        <span className="filter-group__label">Severidad</span>
        <div className="filters" role="group" aria-label="Filtrar por severidad">
          {filters.map(item => (
            <button
              key={item.value}
              type="button"
              className="filter-chip"
              aria-pressed={filter === item.value}
              onClick={() => onFilterChange(item.value)}
            >
              {item.label}
              <span className="filter-chip__count">{counts[item.countKey] ?? 0}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="filter-group">
        <span className="filter-group__label">Estado</span>
        <div className="filters" role="group" aria-label="Filtrar por estado de revisión">
          {statusFilters.map(item => (
            <button
              key={item.value}
              type="button"
              className="filter-chip"
              aria-pressed={status === item.value}
              onClick={() => onStatusChange(item.value)}
            >
              {item.label}
              <span className="filter-chip__count">{statusCounts[item.countKey] ?? 0}</span>
            </button>
          ))}
        </div>
      </div>

      <label className="period">
        <span>Periodo</span>
        <select
          value={period}
          onChange={event => onPeriodChange(Number(event.target.value))}
        >
          {PERIODS.map(item => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

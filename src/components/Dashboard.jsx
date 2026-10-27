import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchVulnerabilities, refreshVulnerabilities } from '../api/client';
import { normalizeSeverity } from './SeverityBadge';
import StatsGrid from './StatsGrid';
import Toolbar from './Toolbar';
import TechnologyFilter from './TechnologyFilter';
import ReportPanel from './ReportPanel';
import VulnerabilityTable from './VulnerabilityTable';
import PackageCheckForm from './PackageCheckForm';
import { ShieldIcon, RefreshIcon, AlertIcon } from './icons';
import { formatDateTime } from '../utils/format';
import { PERIOD_VALUES } from '../utils/periods';

const SEVERITY_RANK = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, UNKNOWN: 4 };
const AUTO_REFRESH_MS = 60 * 60 * 1000;
const TECH_STORAGE_KEY = 'vm.technologies';
const PERIOD_STORAGE_KEY = 'vm.period';

function readStoredSelection() {
  try {
    const raw = localStorage.getItem(TECH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export default function Dashboard() {
  const [vulns, setVulns] = useState([]);
  const [technologies, setTechnologies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [expanded, setExpanded] = useState(() => new Set());
  const [period, setPeriod] = useState(() => {
    const stored = localStorage.getItem(PERIOD_STORAGE_KEY);
    const parsed = stored === null ? Number.NaN : Number(stored);
    return PERIOD_VALUES.includes(parsed) ? parsed : 30;
  });
  const [selectedTech, setSelectedTech] = useState(() => readStoredSelection());
  const [lastScanAt, setLastScanAt] = useState(null);
  const [nextRefresh, setNextRefresh] = useState(() => Date.now() + AUTO_REFRESH_MS);

  const load = useCallback(async () => {
    try {
      const payload = await fetchVulnerabilities();
      setVulns(Array.isArray(payload?.data) ? payload.data : []);
      setTechnologies(Array.isArray(payload?.technologies) ? payload.technologies : []);
      setLastScanAt(payload?.lastScanAt || null);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(null), 6000);
    return () => clearTimeout(timer);
  }, [notice]);

  // Drop ids that no longer exist in the registry.
  useEffect(() => {
    if (!technologies.length || selectedTech === null) return;
    const valid = selectedTech.filter(id => technologies.some(item => item.id === id));
    if (valid.length !== selectedTech.length) {
      setSelectedTech(valid.length ? valid : null);
    }
  }, [technologies, selectedTech]);

  useEffect(() => {
    try {
      if (selectedTech === null) localStorage.removeItem(TECH_STORAGE_KEY);
      else localStorage.setItem(TECH_STORAGE_KEY, JSON.stringify(selectedTech));
    } catch {
      // localStorage can be unavailable (private mode); selection is not critical.
    }
  }, [selectedTech]);

  useEffect(() => {
    try {
      localStorage.setItem(PERIOD_STORAGE_KEY, String(period));
    } catch {
      // ignore
    }
  }, [period]);

  const activeTech = useMemo(
    () => (selectedTech === null ? technologies.map(item => item.id) : selectedTech),
    [selectedTech, technologies]
  );

  const activeTechSet = useMemo(() => new Set(activeTech), [activeTech]);

  const periodScoped = useMemo(() => {
    if (!period) return vulns;
    const cutoff = Date.now() - period * 86400000;
    return vulns.filter(vuln => {
      const published = new Date(vuln.publishedAt || 0).getTime();
      return Number.isFinite(published) && published >= cutoff;
    });
  }, [vulns, period]);

  const techCounts = useMemo(() => {
    const result = { all: periodScoped.length };
    for (const vuln of periodScoped) {
      result[vuln.technology] = (result[vuln.technology] || 0) + 1;
    }
    return result;
  }, [periodScoped]);

  const scoped = useMemo(
    () => periodScoped.filter(vuln => activeTechSet.has(vuln.technology)),
    [periodScoped, activeTechSet]
  );

  const counts = useMemo(() => {
    const result = { total: scoped.length, critical: 0, high: 0, medium: 0, low: 0, unknown: 0 };
    for (const vuln of scoped) {
      result[normalizeSeverity(vuln.severity).toLowerCase()] += 1;
    }
    return result;
  }, [scoped]);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();

    return scoped
      .filter(vuln => filter === 'ALL' || normalizeSeverity(vuln.severity) === filter)
      .filter(vuln => {
        if (!term) return true;
        return [
          vuln.packageName,
          vuln.version,
          vuln.cveId,
          vuln.id,
          vuln.summary,
          vuln.description,
          vuln.technologyName,
          vuln.remediation,
        ].some(field => String(field || '').toLowerCase().includes(term));
      })
      .sort((a, b) => {
        const bySeverity =
          SEVERITY_RANK[normalizeSeverity(a.severity)] -
          SEVERITY_RANK[normalizeSeverity(b.severity)];
        if (bySeverity !== 0) return bySeverity;
        return new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0);
      });
  }, [scoped, filter, query]);

  const lastScan = useMemo(() => {
    if (lastScanAt) return formatDateTime(lastScanAt);
    const timestamps = vulns
      .map(vuln => new Date(vuln.checked_at || vuln.publishedAt || 0).getTime())
      .filter(time => Number.isFinite(time) && time > 0);
    return timestamps.length ? formatDateTime(new Date(Math.max(...timestamps))) : null;
  }, [lastScanAt, vulns]);

  const autoRefresh = useCallback(async () => {
    try {
      const result = await refreshVulnerabilities();
      await load();
      setNotice(
        `Actualización automática completada: ${result.vulnerabilitiesFound} hallazgos escaneados.`
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setNextRefresh(Date.now() + AUTO_REFRESH_MS);
    }
  }, [load]);

  useEffect(() => {
    const timer = setInterval(autoRefresh, AUTO_REFRESH_MS);
    return () => clearInterval(timer);
  }, [autoRefresh]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const result = await refreshVulnerabilities({ force: true });
      await load();
      setNextRefresh(Date.now() + AUTO_REFRESH_MS);
      setNotice(
        `Escaneados ${result.packagesChecked} paquetes · ${result.vulnerabilitiesFound} hallazgos encontrados.`
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setRefreshing(false);
    }
  };

  const toggleRow = useCallback(key => {
    setExpanded(previous => {
      const next = new Set(previous);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const toggleTech = useCallback(
    id => {
      setSelectedTech(previous => {
        const base = previous ?? technologies.map(item => item.id);
        return base.includes(id)
          ? base.filter(item => item !== id)
          : [...base, id];
      });
    },
    [technologies]
  );

  const selectAllTech = useCallback(() => setSelectedTech(null), []);

  let emptyMessage =
    'No hay vulnerabilidades en el periodo seleccionado para estas tecnologías.';

  if (!technologies.length) {
    emptyMessage = 'No hay tecnologías configuradas. Revisa data/technologies.json.';
  } else if (!activeTech.length) {
    emptyMessage = 'Selecciona al menos una tecnología para ver resultados.';
  } else if (!vulns.length) {
    emptyMessage =
      'Todavía no hay datos guardados. Usa «Actualizar datos» para escanear las tecnologías.';
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__inner">
          <div className="brand">
            <div className="brand__mark">
              <ShieldIcon />
            </div>
            <div>
              <h1 className="brand__title">Vulnerability Monitor</h1>
              <p className="brand__subtitle">
                Node.js · Laravel · PHP · Python · MySQL · datos reales
              </p>
            </div>
          </div>

          <div className="header-meta">
            <span className={`status${error ? ' status--error' : ''}`}>
              <span className="status__dot" aria-hidden="true" />
              {error ? 'Sin conexión con la API' : 'API conectada'}
            </span>

            {lastScan && (
              <span className="scan-time">
                Última consulta: <strong>{lastScan}</strong>
              </span>
            )}

            <span className="auto-refresh" title="La lista se recarga automáticamente cada hora">
              Auto: cada 60 min
              {nextRefresh ? ` · próxima ${formatDateTime(new Date(nextRefresh))}` : ''}
            </span>

            <button
              type="button"
              className="btn btn--primary"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? <span className="spinner" aria-hidden="true" /> : <RefreshIcon />}
              {refreshing ? 'Escaneando…' : 'Actualizar datos'}
            </button>
          </div>
        </div>
      </header>

      <main className="container">
        {counts.critical > 0 && (
          <div className="alert-banner" role="alert">
            <span className="alert-banner__icon">
              <AlertIcon />
            </span>
            <div>
              <p className="alert-banner__title">
                {counts.critical} vulnerabilidad{counts.critical === 1 ? '' : 'es'} crítica
                {counts.critical === 1 ? '' : 's'} en el periodo
              </p>
              <p className="alert-banner__text">
                Revisa los paquetes afectados y aplica la solución indicada en la tabla.
              </p>
            </div>
          </div>
        )}

        {error && vulns.length > 0 && (
          <div className="alert-banner" role="alert">
            <span className="alert-banner__icon">
              <AlertIcon />
            </span>
            <div>
              <p className="alert-banner__title">No se pudo actualizar la información</p>
              <p className="alert-banner__text">{error}</p>
            </div>
          </div>
        )}

        <StatsGrid counts={counts} />

        <TechnologyFilter
          technologies={technologies}
          selected={activeTech}
          counts={techCounts}
          onToggle={toggleTech}
          onSelectAll={selectAllTech}
        />

        <section className="section panel" aria-labelledby="vuln-panel-title">
          <div className="panel__header">
            <h2 className="panel__title" id="vuln-panel-title">
              Vulnerabilidades
            </h2>
            <span className="panel__count">
              {visible.length} de {vulns.length}
            </span>
          </div>

          <Toolbar
            query={query}
            onQueryChange={setQuery}
            filter={filter}
            onFilterChange={setFilter}
            counts={counts}
            period={period}
            onPeriodChange={setPeriod}
          />

          {error && vulns.length === 0 ? (
            <div className="state state--error" role="alert">
              <div className="state__icon">
                <AlertIcon />
              </div>
              <p className="state__title">No se pudo conectar con la API</p>
              <p className="state__text">
                {error}. Verifica que el backend esté corriendo con{' '}
                <code>npm run dev:backend</code>.
              </p>
              <button type="button" className="btn btn--secondary" onClick={load}>
                Reintentar
              </button>
            </div>
          ) : (
            <VulnerabilityTable
              vulns={visible}
              loading={loading}
              expanded={expanded}
              onToggle={toggleRow}
              emptyMessage={emptyMessage}
            />
          )}
        </section>

        <section className="section panel" aria-labelledby="check-panel-title">
          <div className="panel__header">
            <h2 className="panel__title" id="check-panel-title">
              Consultar un paquete
            </h2>
          </div>
          <div className="panel__body">
            <PackageCheckForm onChecked={load} />
            <p className="hint">
              La consulta se hace en vivo contra OSV.dev (npm) y se guarda en{' '}
              <code>data/vulnerabilities.json</code>.
            </p>
          </div>
        </section>

        <ReportPanel technologies={activeTech} />
      </main>

      <footer className="app-footer">
        <div className="app-footer__inner">
          <span>Fuentes: OSV.dev (npm, Packagist) + NIST NVD (PHP, Python, MySQL)</span>
          <span>Backend: Fastify en <code>localhost:3000</code></span>
          <span>Datos: <code>data/vulnerabilities.json</code></span>
        </div>
      </footer>

      {notice && (
        <div className="notice" role="status">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice(null)} aria-label="Cerrar aviso">
            ×
          </button>
        </div>
      )}
    </div>
  );
}

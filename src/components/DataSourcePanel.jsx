const SOURCES = [
  {
    id: 'osv',
    name: 'OSV.dev',
    url: 'https://osv.dev',
    covers: 'Node.js (npm) y Laravel (Packagist)',
    method:
      'Consulta por paquete y versión declarada. En Node.js se leen las versiones exactas de package-lock.json; en Laravel se consulta laravel/framework en Packagist.',
  },
  {
    id: 'nvd',
    name: 'NIST NVD',
    url: 'https://nvd.nist.gov',
    covers: 'PHP, Python y MySQL',
    method:
      'Consulta por producto mediante CPE (virtualMatchString) sobre los CVE publicados o modificados dentro de la ventana configurada.',
  },
];

const SOURCE_LABELS = {
  lockfile: 'OSV.dev',
  packages: 'OSV.dev',
  nvd: 'NIST NVD',
};

function queryLabel(technology) {
  if (technology.source === 'nvd') {
    return technology.match || technology.product || '—';
  }

  const parts = [technology.ecosystem].filter(Boolean);

  if (technology.source === 'lockfile' && technology.manifest) {
    parts.push(technology.manifest);
  }

  if (technology.source === 'packages' && technology.packages?.length) {
    parts.push(technology.packages.join(', '));
  }

  return parts.join(' · ') || '—';
}

export default function DataSourcePanel({ technologies }) {
  return (
    <section className="section panel" aria-labelledby="sources-panel-title">
      <div className="panel__header">
        <h2 className="panel__title" id="sources-panel-title">
          Fuentes de datos
        </h2>
      </div>

      <div className="panel__body">
        <p className="hint hint--top">
          Los hallazgos se consultan en vivo contra servicios públicos y se guardan en{' '}
          <code>data/vulnerabilities.json</code>. No hay base de datos propia ni datos de ejemplo.
        </p>

        <div className="source-grid">
          {SOURCES.map(source => (
            <article key={source.id} className="source-card">
              <h3 className="source-card__title">
                <a href={source.url} target="_blank" rel="noreferrer">
                  {source.name}
                </a>
              </h3>
              <p className="source-card__covers">{source.covers}</p>
              <p className="source-card__text">{source.method}</p>
            </article>
          ))}
        </div>

        <p className="hint">
          Se usan dos fuentes porque OSV no publica el runtime de PHP, el de Python ni MySQL como
          paquetes: sus CVE solo existen en NVD como productos (CPE).
        </p>

        <div className="source-table-wrap">
          <table className="source-table">
            <caption className="sr-only">Tecnologías configuradas y su fuente de consulta</caption>
            <thead>
              <tr>
                <th scope="col">Tecnología</th>
                <th scope="col">Fuente</th>
                <th scope="col">Consulta</th>
              </tr>
            </thead>
            <tbody>
              {technologies.length ? (
                technologies.map(technology => (
                  <tr key={technology.id}>
                    <td data-label="Tecnología">{technology.name}</td>
                    <td data-label="Fuente">
                      <span className="source-tag">
                        {SOURCE_LABELS[technology.source] || technology.source || '—'}
                      </span>
                    </td>
                    <td data-label="Consulta">
                      <code>{queryLabel(technology)}</code>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3}>No hay tecnologías configuradas.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

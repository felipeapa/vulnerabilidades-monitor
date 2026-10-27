// Builds downloadable reports (TXT / CSV / JSON) for a period and technology selection.
const SEVERITY_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, UNKNOWN: 4 };
const SEVERITY_LABELS = {
  CRITICAL: 'Crítica',
  HIGH: 'Alta',
  MEDIUM: 'Media',
  LOW: 'Baja',
  UNKNOWN: 'Sin dato',
};

const NO_FIX_MESSAGE =
  'No hay versión corregida publicada. Revisa el aviso y aplica el parche del fabricante.';

export function buildReport(vulns, { days = 30, technologies = [], format = 'txt', registry = [] } = {}) {
  const selected = technologies.length ? new Set(technologies) : null;
  const cutoff = days > 0 ? Date.now() - days * 86400000 : 0;

  const rows = vulns
    .filter(vuln => !selected || selected.has(vuln.technology))
    .filter(vuln => {
      if (!cutoff) return true;
      const published = new Date(vuln.publishedAt || 0).getTime();
      return Number.isFinite(published) && published >= cutoff;
    })
    .sort((a, b) => {
      const bySeverity =
        (SEVERITY_ORDER[a.severity] ?? 4) - (SEVERITY_ORDER[b.severity] ?? 4);
      if (bySeverity !== 0) return bySeverity;
      return new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0);
    });

  const names = new Map(registry.map(item => [item.id, item.name]));
  const periodLabel = days > 0 ? `últimos ${days} días` : 'todo lo almacenado';
  const technologyLabel = selected
    ? [...selected].map(id => names.get(id) || id).join(', ')
    : 'todas';

  const summary = summarize(rows, names);

  if (format === 'json') {
    return {
      body: JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          periodDays: days,
          periodLabel,
          technologies: selected ? [...selected] : registry.map(item => item.id),
          total: rows.length,
          byTechnology: summary.byTechnology,
          bySeverity: summary.bySeverity,
          data: rows,
        },
        null,
        2
      ),
      contentType: 'application/json; charset=utf-8',
      extension: 'json',
    };
  }

  if (format === 'csv') {
    const header = [
      'id',
      'cve',
      'tecnologia',
      'paquete',
      'version',
      'severidad',
      'publicado',
      'solucion',
      'url',
      'resumen',
    ];
    const lines = rows.map(vuln =>
      [
        vuln.id,
        vuln.cveId,
        names.get(vuln.technology) || vuln.technologyName || vuln.technology,
        vuln.packageName,
        vuln.version,
        vuln.severity,
        formatDate(vuln.publishedAt),
        vuln.remediation || NO_FIX_MESSAGE,
        vuln.advisoryUrl,
        vuln.summary,
      ]
        .map(csvCell)
        .join(';')
    );

    return {
      body: `\uFEFF${[header.join(';'), ...lines].join('\r\n')}\r\n`,
      contentType: 'text/csv; charset=utf-8',
      extension: 'csv',
    };
  }

  const body = [
    'REPORTE DE VULNERABILIDADES',
    '='.repeat(60),
    `Generado: ${new Date().toLocaleString('es')}`,
    `Periodo: ${periodLabel}`,
    `Tecnologías: ${technologyLabel}`,
    `Total de hallazgos: ${rows.length}`,
    '',
    'RESUMEN POR TECNOLOGÍA',
    '-'.repeat(60),
    ...(summary.technologyLines.length ? summary.technologyLines : ['Sin hallazgos.']),
    '',
    'RESUMEN POR SEVERIDAD',
    '-'.repeat(60),
    ...summary.severityLines,
    '',
    'DETALLE',
    '-'.repeat(60),
    ...(rows.length ? rows.map(formatRow) : ['Sin hallazgos para el periodo seleccionado.']),
    '',
  ].join('\n');

  return {
    body,
    contentType: 'text/plain; charset=utf-8',
    extension: 'txt',
  };
}

export function reportFilename({ days, extension }) {
  const date = new Date().toISOString().slice(0, 10);
  return `reporte-vulnerabilidades-${days > 0 ? `${days}d` : 'todo'}-${date}.${extension}`;
}

function summarize(rows, names) {
  const byTechnology = {};
  const bySeverity = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, UNKNOWN: 0 };

  for (const vuln of rows) {
    const id = vuln.technology || 'unknown';
    byTechnology[id] = byTechnology[id] || {
      name: names.get(id) || vuln.technologyName || id,
      total: 0,
      severities: { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, UNKNOWN: 0 },
    };
    byTechnology[id].total += 1;
    byTechnology[id].severities[vuln.severity] =
      (byTechnology[id].severities[vuln.severity] || 0) + 1;
    bySeverity[vuln.severity] = (bySeverity[vuln.severity] || 0) + 1;
  }

  const technologyLines = Object.values(byTechnology)
    .sort((a, b) => b.total - a.total)
    .map(item => {
      const parts = Object.entries(item.severities)
        .filter(([, count]) => count > 0)
        .map(([severity, count]) => `${count} ${SEVERITY_LABELS[severity] || severity}`);
      return `${item.name}: ${item.total} (${parts.join(', ')})`;
    });

  const severityLines = Object.entries(bySeverity)
    .filter(([, count]) => count > 0)
    .map(([severity, count]) => `${SEVERITY_LABELS[severity] || severity}: ${count}`);

  return {
    byTechnology,
    bySeverity,
    technologyLines,
    severityLines: severityLines.length ? severityLines : ['Sin hallazgos.'],
  };
}

function formatRow(vuln) {
  const lines = [
    `[${vuln.severity}] ${vuln.cveId || vuln.id} · ${vuln.technologyName || vuln.technology} · ${
      vuln.packageName
    }${vuln.version ? `@${vuln.version}` : ''}`,
    `  Publicado: ${formatDate(vuln.publishedAt)}`,
    `  Solución: ${vuln.remediation || NO_FIX_MESSAGE}`,
    `  Aviso: ${vuln.advisoryUrl}`,
    `  Resumen: ${vuln.summary}`,
    '',
  ];
  return lines.join('\n');
}

function csvCell(value) {
  const text = String(value ?? '');
  return /[";\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}

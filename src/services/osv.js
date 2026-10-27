// OSV.dev client - real vulnerability data for package ecosystems (no API key required)
import axios from 'axios';
import { compareVersions } from '../utils/versions.js';

const OSV_API = 'https://api.osv.dev/v1';
const TIMEOUT_MS = 20000;
const DETAIL_CONCURRENCY = 6;

const SEVERITY_MAP = {
  LOW: 'LOW',
  MODERATE: 'MEDIUM',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
};

const NO_FIX_MESSAGE =
  'No hay versión corregida publicada. Revisa el aviso y aplica el parche del fabricante.';

export async function queryPackage(packageName, version, { ecosystem = 'npm', technology = null } = {}) {
  const body = { package: { name: packageName, ecosystem } };
  if (version) body.version = version;

  const { data } = await axios.post(`${OSV_API}/query`, body, { timeout: TIMEOUT_MS });
  return (data.vulns || []).map(vuln =>
    normalize(vuln, { packageName, version, ecosystem, technology })
  );
}

export async function queryBatch(entries, { ecosystem = 'npm', technology = null } = {}) {
  if (!entries.length) return [];

  const queries = entries.map(({ name, version }) => ({
    package: { name, ecosystem },
    ...(version ? { version } : {}),
  }));

  const { data } = await axios.post(`${OSV_API}/querybatch`, { queries }, { timeout: TIMEOUT_MS });
  const results = data.results || [];

  const matches = [];
  results.forEach((result, index) => {
    const entry = entries[index];
    for (const vuln of result.vulns || []) {
      matches.push({ id: vuln.id, packageName: entry.name, version: entry.version });
    }
  });

  const uniqueIds = [...new Set(matches.map(match => match.id))];
  const details = await fetchDetails(uniqueIds);

  return matches
    .map(match => {
      const vuln = details.get(match.id);
      return vuln
        ? normalize(vuln, {
            packageName: match.packageName,
            version: match.version,
            ecosystem,
            technology,
          })
        : null;
    })
    .filter(Boolean);
}

async function fetchDetails(ids) {
  const details = new Map();
  let cursor = 0;

  async function worker() {
    while (cursor < ids.length) {
      const id = ids[cursor++];
      try {
        const { data } = await axios.get(`${OSV_API}/vulns/${encodeURIComponent(id)}`, {
          timeout: TIMEOUT_MS,
        });
        details.set(id, data);
      } catch (error) {
        console.warn(`OSV detail fetch failed for ${id}:`, error.message);
      }
    }
  }

  const workers = Array.from({ length: Math.min(DETAIL_CONCURRENCY, ids.length) }, worker);
  await Promise.all(workers);
  return details;
}

function normalize(vuln, { packageName, version, ecosystem, technology }) {
  const aliases = vuln.aliases || [];
  const cveId =
    aliases.find(alias => alias.startsWith('CVE-')) ||
    (vuln.id?.startsWith('CVE-') ? vuln.id : '');

  const fixedVersion = pickFixedVersion(vuln, packageName, version);

  return {
    id: vuln.id,
    cveId,
    ecosystem,
    technology: technology?.id || null,
    technologyName: technology?.name || null,
    packageName,
    version: version || '',
    severity: normalizeSeverity(vuln),
    summary: vuln.summary || firstLine(vuln.details) || vuln.id,
    description: vuln.details || vuln.summary || '',
    publishedAt: vuln.published || null,
    modifiedAt: vuln.modified || null,
    advisoryUrl: `https://osv.dev/vulnerability/${vuln.id}`,
    aliases,
    source: 'OSV',
    fixedVersion,
    remediation: fixedVersion
      ? `Actualiza ${packageName} a ${fixedVersion} o superior.`
      : NO_FIX_MESSAGE,
    checked_at: new Date().toISOString(),
  };
}

function pickFixedVersion(vuln, packageName, version) {
  const candidates = new Set();

  for (const affected of vuln.affected || []) {
    if (affected.package?.name && affected.package.name !== packageName) continue;

    for (const range of affected.ranges || []) {
      for (const event of range.events || []) {
        if (event.fixed && event.fixed !== '0') candidates.add(event.fixed);
      }
    }
  }

  const sorted = [...candidates].sort(compareVersions);
  if (!sorted.length) return null;

  if (!version) return sorted[sorted.length - 1];

  return sorted.find(fixed => compareVersions(fixed, version) > 0) || sorted[sorted.length - 1];
}

function normalizeSeverity(vuln) {
  const perPackage = (vuln.affected || []).find(
    item => item.database_specific?.severity || item.ecosystem_specific?.severity
  );

  const raw =
    perPackage?.database_specific?.severity ||
    perPackage?.ecosystem_specific?.severity ||
    vuln.database_specific?.severity ||
    vuln.ecosystem_specific?.severity;

  if (!raw) return 'UNKNOWN';
  return SEVERITY_MAP[String(raw).toUpperCase()] || 'UNKNOWN';
}

function firstLine(text) {
  return typeof text === 'string' ? text.split('\n')[0] : '';
}

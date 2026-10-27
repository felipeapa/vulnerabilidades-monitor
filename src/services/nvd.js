// NIST NVD client for product-level advisories (PHP, Python, MySQL).
// OSV does not expose these runtimes/databases as package ecosystems, so we query
// NVD by CPE match string instead. Public API, no key required (rate limited).
import axios from 'axios';
import { compareVersions, versionBranch } from '../utils/versions.js';
import { buildRemediation, NVD_NO_FIX } from './remediation.js';

const NVD_API = 'https://services.nvd.nist.gov/rest/json/cves/2.0';
const MAX_RANGE_DAYS = 120;
const MIN_REQUEST_GAP_MS = 7000;
const TIMEOUT_MS = 60000;
const PAGE_SIZE = 2000;

const SEVERITY_MAP = {
  CRITICAL: 'CRITICAL',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
};

let lastRequestAt = 0;

export async function queryProduct(technology, { windowDays = 365, since = null } = {}) {
  const ranges = buildRanges({ windowDays, since });
  const byId = new Map();

  for (const range of ranges) {
    const baseParams = { virtualMatchString: technology.match };
    if (range.mode === 'modified') {
      baseParams.lastModStartDate = toNvdDate(range.start);
      baseParams.lastModEndDate = toNvdDate(range.end);
    } else {
      baseParams.pubStartDate = toNvdDate(range.start);
      baseParams.pubEndDate = toNvdDate(range.end);
    }

    const items = await fetchAll(baseParams);
    for (const item of items) {
      if (item.cve?.vulnStatus === 'Rejected') continue;
      byId.set(item.cve.id, item.cve);
    }
  }

  return [...byId.values()]
    .map(cve => normalize(cve, technology))
    .filter(Boolean);
}

function buildRanges({ windowDays, since }) {
  const now = new Date();

  if (since) {
    const start = new Date(since);
    const ageDays = (now.getTime() - start.getTime()) / 86400000;
    if (Number.isFinite(ageDays) && ageDays >= 0 && ageDays <= MAX_RANGE_DAYS) {
      return [{ start, end: now, mode: 'modified' }];
    }
  }

  const from = new Date(now.getTime() - windowDays * 86400000);
  const ranges = [];
  let cursor = from;

  while (cursor < now) {
    const end = new Date(
      Math.min(cursor.getTime() + MAX_RANGE_DAYS * 86400000, now.getTime())
    );
    ranges.push({ start: cursor, end, mode: 'published' });
    cursor = end;
  }

  return ranges;
}

async function fetchAll(params) {
  const items = [];
  let startIndex = 0;

  while (true) {
    const data = await fetchPage({
      ...params,
      startIndex,
      resultsPerPage: PAGE_SIZE,
    });

    const page = data.vulnerabilities || [];
    items.push(...page);
    startIndex += page.length;

    if (!page.length || startIndex >= (data.totalResults || 0)) break;
  }

  return items;
}

async function fetchPage(params, attempt = 0) {
  const wait = Math.max(0, MIN_REQUEST_GAP_MS - (Date.now() - lastRequestAt));
  if (wait) await sleep(wait);
  lastRequestAt = Date.now();

  try {
    const { data } = await axios.get(NVD_API, {
      params,
      timeout: TIMEOUT_MS,
      headers: { 'User-Agent': 'vulnerabilidades-monitor/1.0' },
    });
    return data;
  } catch (error) {
    const status = error.response?.status;
    if ((status === 403 || status === 429) && attempt < 1) {
      await sleep(30000);
      return fetchPage(params, attempt + 1);
    }
    throw error;
  }
}

function normalize(cve, technology) {
  const description = cve.descriptions?.find(item => item.lang === 'en')?.value || '';
  const packageName = technology.product || technology.name.toLowerCase();
  const declared = technology.version || null;
  const ranges = extractRanges(cve.configurations, technology);

  // With a declared version, a finding that does not cover it is not our problem.
  if (declared && ranges.length && !ranges.some(range => inRange(declared, range))) {
    return null;
  }

  const { fixes, remediation } = resolveFixes(cve.configurations, technology, declared);

  return {
    id: cve.id,
    cveId: cve.id,
    ecosystem: 'NVD',
    technology: technology.id,
    technologyName: technology.name,
    packageName,
    version: '',
    severity: extractSeverity(cve.metrics),
    summary: firstSentence(description) || cve.id,
    description,
    publishedAt: cve.published || null,
    modifiedAt: cve.lastModified || null,
    advisoryUrl: `https://nvd.nist.gov/vuln/detail/${cve.id}`,
    aliases: [],
    source: 'NVD',
    // Only an exclusive upper bound names a real release to install.
    fixedVersion: fixes.find(fix => fix.boundary === 'excluding')?.version || null,
    fixes,
    remediation,
    checked_at: new Date().toISOString(),
  };
}

function extractSeverity(metrics = {}) {
  const metric =
    metrics.cvssMetricV40?.[0] ||
    metrics.cvssMetricV31?.[0] ||
    metrics.cvssMetricV30?.[0] ||
    metrics.cvssMetricV2?.[0];

  if (!metric) return 'UNKNOWN';

  const raw = metric.cvssData?.baseSeverity || metric.baseSeverity || '';
  return SEVERITY_MAP[String(raw).toUpperCase()] || 'UNKNOWN';
}

// With a declared version the answer is the fix for that release branch, which is
// the only one the user can install. Without it, every branch is listed.
function resolveFixes(configurations, technology, declared) {
  const all = extractFixes(configurations, technology);

  if (!declared) {
    return {
      fixes: all,
      remediation: buildRemediation(technology.name, all, { noFixMessage: NVD_NO_FIX }),
    };
  }

  const branch = versionBranch(declared);
  const branchFixes = all.filter(fix => fix.branch === branch);

  if (!branchFixes.length) {
    return {
      fixes: [],
      remediation: `No hay versión corregida publicada para la rama ${branch}. Revisa el aviso del fabricante.`,
    };
  }

  return { fixes: branchFixes, remediation: buildRemediation(technology.name, branchFixes) };
}

// Affected ranges for our product only, used to decide whether a declared
// version is actually exposed.
export function extractRanges(configurations, technology) {
  const target = cpeKey(technology.match);
  if (!target) return [];

  const ranges = [];

  for (const configuration of configurations || []) {
    for (const node of configuration.nodes || []) {
      for (const match of node.cpeMatch || []) {
        if (!match.vulnerable) continue;
        if (cpeKey(match.criteria) !== target) continue;

        const startIncluding = match.versionStartIncluding || null;
        const startExcluding = match.versionStartExcluding || null;
        const endExcluding = match.versionEndExcluding || null;
        const endIncluding = match.versionEndIncluding || null;

        if (!startIncluding && !startExcluding && !endExcluding && !endIncluding) continue;

        ranges.push({ startIncluding, startExcluding, endExcluding, endIncluding });
      }
    }
  }

  return ranges;
}

function inRange(version, range) {
  if (range.startIncluding && compareVersions(version, range.startIncluding) < 0) return false;
  if (range.startExcluding && compareVersions(version, range.startExcluding) <= 0) return false;
  if (range.endExcluding && compareVersions(version, range.endExcluding) >= 0) return false;
  if (range.endIncluding && compareVersions(version, range.endIncluding) > 0) return false;
  return true;
}

// An advisory lists every affected product, so a PHP CVE can also carry PAN-OS
// ranges. Only matches for the configured product are ours, and each release
// branch keeps its own fix instead of being collapsed into the highest number.
export function extractFixes(configurations, technology) {
  const target = cpeKey(technology.match);
  if (!target) return [];

  const byBranch = new Map();

  for (const configuration of configurations || []) {
    for (const node of configuration.nodes || []) {
      for (const match of node.cpeMatch || []) {
        if (!match.vulnerable) continue;
        if (cpeKey(match.criteria) !== target) continue;

        const fix = toFix(match);
        if (!fix) continue;

        const current = byBranch.get(fix.branch);
        if (!current || compareVersions(fix.version, current.version) > 0) {
          byBranch.set(fix.branch, fix);
        }
      }
    }
  }

  return [...byBranch.values()].sort((a, b) => compareVersions(b.version, a.version));
}

// versionEndExcluding: X means X is the first safe release.
// versionEndIncluding: X means only releases after X are safe, and NVD does not
// name the next one, so the fix stays an open boundary.
function toFix(match) {
  const excluded = match.versionEndExcluding;
  if (excluded) {
    return { version: excluded, branch: versionBranch(excluded), boundary: 'excluding' };
  }

  const included = match.versionEndIncluding;
  if (included) {
    return { version: included, branch: versionBranch(included), boundary: 'including' };
  }

  return null;
}

// "cpe:2.3:a:php:php:*:..." -> "a:php:php", so vendor and product must match.
function cpeKey(cpe) {
  const parts = String(cpe || '').toLowerCase().split(':');
  if (parts.length < 5) return '';
  return `${parts[2]}:${parts[3]}:${parts[4]}`;
}

function firstSentence(text) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (!clean) return '';

  const match = clean.match(/^(.{0,180}?[.!?])\s/);
  return match ? match[1] : clean.slice(0, 180);
}

function toNvdDate(date) {
  return date.toISOString().slice(0, 23);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

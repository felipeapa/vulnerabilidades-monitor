// NIST NVD client for product-level advisories (PHP, Python, MySQL).
// OSV does not expose these runtimes/databases as package ecosystems, so we query
// NVD by CPE match string instead. Public API, no key required (rate limited).
import axios from 'axios';
import { compareVersions } from '../utils/versions.js';

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

const NO_FIX_MESSAGE =
  'No hay versión corregida publicada. Revisa el aviso y aplica el parche del fabricante.';

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

  return [...byId.values()].map(cve => normalize(cve, technology));
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
  const fixedVersion = extractFixedVersion(cve.configurations);
  const packageName = technology.product || technology.name.toLowerCase();

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
    fixedVersion,
    remediation: fixedVersion
      ? `Actualiza ${technology.name} a ${fixedVersion} o superior.`
      : NO_FIX_MESSAGE,
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

function extractFixedVersion(configurations) {
  const candidates = [];

  for (const configuration of configurations || []) {
    for (const node of configuration.nodes || []) {
      for (const match of node.cpeMatch || []) {
        if (match.vulnerable && match.versionEndExcluding) {
          candidates.push(match.versionEndExcluding);
        }
      }
    }
  }

  if (!candidates.length) return null;
  return candidates.sort(compareVersions)[candidates.length - 1];
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

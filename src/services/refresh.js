// Full refresh: scan all technologies, merge into storage and persist scan metadata.
import { scanTechnologies } from './scanner.js';
import { getTechnologies } from './technologies.js';
import {
  getVulnerabilities,
  saveVulnerabilities,
  mergeVulnerabilities,
  getScanState,
  saveScanState,
} from '../utils/storage.js';

const MIN_INTERVAL_MS = 2 * 60 * 1000;

// Bumped whenever the fix extraction changes, so records stored with the old
// logic are re-derived instead of surviving the incremental NVD sync.
const FIXES_VERSION = 2;

let inFlight = null;

// Any change to the scan inputs (declared versions) invalidates stored findings:
// a CVE that no longer applies has to disappear, not linger in the file.
async function scanSignature() {
  const registry = await getTechnologies();
  const inputs = registry
    .filter(technology => technology.enabled !== false)
    .map(technology => `${technology.id}@${technology.version || 'any'}`);

  return `v${FIXES_VERSION}|${inputs.join(',')}`;
}

export async function refreshAll({ force = false } = {}) {
  if (inFlight) return inFlight;

  const previous = await getScanState();
  const lastScan = previous.lastScanAt ? new Date(previous.lastScanAt).getTime() : 0;

  if (!force && lastScan && Date.now() - lastScan < MIN_INTERVAL_MS) {
    return { cached: true, ...previous.lastResult, lastScanAt: previous.lastScanAt };
  }

  inFlight = runScan(previous)
    .catch(error => {
      throw error;
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

async function runScan(previous) {
  const signature = await scanSignature();
  const since = previous.scanSignature === signature ? previous.nvdSyncedAt || null : null;

  const { findings, stats } = await scanTechnologies({ since });

  const stored = await getVulnerabilities();
  const data = mergeVulnerabilities(stored, findings, {
    replaceTechnologies: since === null ? stats.technologiesScanned : [],
  });
  await saveVulnerabilities(data);

  const now = new Date().toISOString();
  const nvdSyncedAt =
    stats.nvdScanned.length > 0 && stats.nvdErrors.length === 0
      ? now
      : previous.nvdSyncedAt || null;

  const result = {
    packagesChecked: stats.packagesChecked,
    vulnerabilitiesFound: findings.length,
    totalStored: data.length,
    technologiesScanned: stats.technologiesScanned,
    errors: stats.errors,
    lastScanAt: now,
    nvdSyncedAt,
  };

  await saveScanState({
    lastScanAt: now,
    nvdSyncedAt,
    scanSignature: signature,
    lastResult: result,
  });

  return result;
}

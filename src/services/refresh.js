// Full refresh: scan all technologies, merge into storage and persist scan metadata.
import { scanTechnologies } from './scanner.js';
import {
  getVulnerabilities,
  saveVulnerabilities,
  mergeVulnerabilities,
  getScanState,
  saveScanState,
} from '../utils/storage.js';

const MIN_INTERVAL_MS = 2 * 60 * 1000;

let inFlight = null;

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
  const { findings, stats } = await scanTechnologies({ since: previous.nvdSyncedAt || null });

  const stored = await getVulnerabilities();
  const data = mergeVulnerabilities(stored, findings);
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

  await saveScanState({ lastScanAt: now, nvdSyncedAt, lastResult: result });

  return result;
}

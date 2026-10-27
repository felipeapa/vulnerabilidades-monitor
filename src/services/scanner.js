// Orchestrates a scan across every enabled technology and returns normalized findings.
import { queryBatch } from './osv.js';
import { queryProduct } from './nvd.js';
import { readLockfilePackages } from './lockfile.js';
import { getTechnologies } from './technologies.js';

const DEFAULT_NVD_WINDOW_DAYS = Number(process.env.NVD_WINDOW_DAYS) || 365;

export async function scanTechnologies({ technologies, windowDays, since = null } = {}) {
  const registry = technologies || (await getTechnologies());
  const enabled = registry.filter(item => item.enabled !== false);
  const findings = [];
  const stats = {
    packagesChecked: 0,
    technologiesScanned: [],
    nvdScanned: [],
    nvdErrors: [],
    errors: [],
  };

  for (const technology of enabled) {
    try {
      if (technology.source === 'lockfile') {
        const entries = readLockfilePackages(technology.manifest);
        stats.packagesChecked += entries.length;
        findings.push(...(await queryBatch(entries, { ecosystem: technology.ecosystem, technology })));
      } else if (technology.source === 'packages') {
        const entries = (technology.packages || []).map(name => ({ name }));
        stats.packagesChecked += entries.length;
        findings.push(...(await queryBatch(entries, { ecosystem: technology.ecosystem, technology })));
      } else if (technology.source === 'nvd') {
        stats.packagesChecked += 1;
        findings.push(
          ...(await queryProduct(technology, {
            windowDays: windowDays || DEFAULT_NVD_WINDOW_DAYS,
            since,
          }))
        );
        stats.nvdScanned.push(technology.id);
      } else {
        throw new Error(`Unsupported source: ${technology.source}`);
      }

      stats.technologiesScanned.push(technology.id);
    } catch (error) {
      stats.errors.push({ technology: technology.id, message: error.message });
      if (technology.source === 'nvd') {
        stats.nvdErrors.push(technology.id);
      }
    }
  }

  return { findings, stats };
}

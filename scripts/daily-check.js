// Daily vulnerability check across every enabled technology (OSV + NVD).
import fs from 'fs';
import path from 'path';
import { refreshAll } from '../src/services/refresh.js';
import { getVulnerabilities } from '../src/utils/storage.js';
import { getTechnologies } from '../src/services/technologies.js';
import { buildReport } from '../src/services/report.js';

const REPORTS_DIR = './reports';

async function runDailyCheck() {
  const date = new Date().toISOString().split('T')[0];

  console.log(`🔄 Daily check ${date}`);
  const result = await refreshAll({ force: true });

  const [data, registry] = await Promise.all([getVulnerabilities(), getTechnologies()]);
  const report = buildReport(data, { days: 30, format: 'txt', registry });

  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  fs.writeFileSync(path.join(REPORTS_DIR, `daily-${date}.txt`), report.body, {
    encoding: 'utf8',
  });

  const critical = data.filter(
    vuln =>
      vuln.severity === 'CRITICAL' &&
      new Date(vuln.publishedAt || 0).getTime() >= Date.now() - 30 * 86400000
  );

  for (const vuln of critical) {
    const fileName = `${date}-${vuln.cveId || vuln.id}-${vuln.packageName}.txt`.replace(
      /[\\/:*?"<>|]/g,
      '-'
    );
    fs.writeFileSync(
      path.join(REPORTS_DIR, fileName),
      `VULNERABILITY ALERT\n` +
        `Technology: ${vuln.technologyName || vuln.technology}\n` +
        `Package: ${vuln.packageName}${vuln.version ? `@${vuln.version}` : ''}\n` +
        `Severity: ${vuln.severity}\n` +
        `CVE: ${vuln.cveId || 'N/A'}\n` +
        `Advisory: ${vuln.advisoryUrl}\n` +
        `Remediation: ${vuln.remediation}\n` +
        `Summary: ${vuln.summary}\n`,
      { encoding: 'utf8' }
    );
  }

  console.log(
    `✅ Done. ${result.vulnerabilitiesFound} findings (${critical.length} CRITICAL). Report: reports/daily-${date}.txt`
  );
  return critical.length;
}

try {
  await runDailyCheck();
} catch (error) {
  console.error('Daily check failed:', error.message);
  process.exitCode = 1;
}

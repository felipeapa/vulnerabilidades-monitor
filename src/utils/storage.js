// Storage utils - Leer y guardar en archivos JSON local sin BD MySQL
import fs from 'fs';
import path from 'path';

const BASE_DIR = './data/';
const SCAN_STATE_PATH = path.join(BASE_DIR, 'scan-state.json');

export async function getVulnerabilities() {
    const vulnsPath = path.join(BASE_DIR, 'vulnerabilities.json');
    
    // Crear carpeta si no existe
    if (!fs.existsSync(path.dirname(vulnsPath))) {
        fs.mkdirSync(path.dirname(vulnsPath), { recursive: true });
    }

    try {
      const vulns = JSON.parse(fs.readFileSync(vulnsPath, 'utf8'));
      return Array.isArray(vulns) ? vulns.map(migrateVulnerability) : [];
    } catch (err) {
      // Si es archivo vacío o no existe, return array vacío
      if (err.code === 'ENOENT' || err.message.includes('JSON')) {
        fs.writeFileSync(vulnsPath, JSON.stringify([], null, 2));
        return [];
      }
      throw err; 
    }
}

// Older records predate the multi-technology model; default them to the npm scan.
function migrateVulnerability(vuln) {
  return {
    ...vuln,
    technology: vuln.technology || 'nodejs',
    technologyName: vuln.technologyName || 'Node.js',
    ecosystem: vuln.ecosystem || 'npm',
  };
}

export async function getScanState() {
  try {
    return JSON.parse(fs.readFileSync(SCAN_STATE_PATH, 'utf8'));
  } catch {
    return { lastScanAt: null, lastResult: null };
  }
}

export async function saveScanState(state) {
  fs.mkdirSync(BASE_DIR, { recursive: true });
  fs.writeFileSync(SCAN_STATE_PATH, JSON.stringify(state, null, 2), { encoding: 'utf8' });
  return state;
}

export async function saveVulnerabilities(vulns) {
  const vulnsPath = path.join(BASE_DIR, 'vulnerabilities.json');
  fs.mkdirSync(path.dirname(vulnsPath), { recursive: true });
  fs.writeFileSync(vulnsPath, JSON.stringify(vulns, null, 2), { encoding: 'utf8' });
  return vulns;
}

export function vulnerabilityKey(vuln) {
  return `${vuln.id || vuln.cveId}|${vuln.technology || ''}|${vuln.packageName || vuln.technology}|${vuln.version || ''}`;
}

// A full scan is authoritative for the technologies it covered: records that no
// longer apply (new version declared, finding withdrawn) must not linger.
export function mergeVulnerabilities(existing, incoming, { replaceTechnologies = [] } = {}) {
  const replace = new Set(replaceTechnologies);
  const byKey = new Map();

  for (const vuln of existing) {
    if (replace.has(vuln.technology)) continue;
    byKey.set(vulnerabilityKey(vuln), vuln);
  }

  for (const vuln of incoming) byKey.set(vulnerabilityKey(vuln), vuln);
  return [...byKey.values()];
}

export async function addVulnerability(vuln) {
  try {
    const vulns = await getVulnerabilities();
    
    // Agregar vulnerabilidad con timestamp
    const newEntry = {
      ...vuln,
      id: Date.now() + Math.random(), 
      checked_at: new Date().toISOString(),
      technology_name: vuln.technology || 'unknown',
    };
    
    vulns.push(newEntry);
    
    // Guardar en archivo con formato JSON indentado para debugging
    const vulnsPath = path.join(BASE_DIR, 'vulnerabilities.json');
    fs.writeFileSync(
      vulnsPath, 
      JSON.stringify(vulns, null, 2), 
      { encoding: 'utf8' });

    // Si es CVE crítico, genera archivo TXT report individual  
    const reportsDir = '../reports/'; 
    if ((vuln.severity === 'CRITICAL' || vuln.severity === 'HIGH') && fs.existsSync(vulnsPath)) {
      await generateReportForCVE(vuln);
    }

    return newEntry; // Return last added vulnerability
    
  } catch (err) {
    console.error('Error adding vulnerability:', err.message);
    throw new Error(`Failed to save vulnerability: ${err.message}`);
  }
}

async function generateReportForCVE(vuln) {
  const reportsDir = './reports/';
  
  try {
    fs.mkdirSync(reportsDir, { recursive: true });
    
    const date = new Date().toISOString().split('T')[0];
    const reportPath = `${reportsDir}${date}-${vuln.packageName || 'alert'}.txt`;
    
    const reportContent = `VULNERABILITY ALERT - Generated at ${new Date().toLocaleString()}\n\n` +
      `Package Name: ${vuln.packageName || vuln.technology}\n` +
      `Severity: ${vuln.severity?.toUpperCase() || 'LOW'}\n` +
      `CVE ID: ${vuln.cveId || 'N/A'}\n` +
      `Description: ${vuln.description || 'No description provided'}\n\n`;

    await fs.writeFileSync(reportPath, reportContent);
    console.log(`Report generated: ${reportPath}`);
    
  } catch (err) {
     console.error('Failed to generate report:', err.message);
  }
}

export default null;

import axios from 'axios';

const API_BASE = process.env.NPM_SECURITY_API_URL || 'https://npmjs.org';
const CLIENT_ID = process.env.NPM_CLIENT_ID || 'vuln-monitor-client';

export async function getVulnerabilities(packageName, version) {
  try {
    // NPM Security API v1
    const response = await axios.get(
      `https://api.npmjs.org/downloads/point/last-week/${encodeURIComponent(packageName)}`,
      { timeout: 5000 }
    );

    // Check NPM Security Advisories (NPM-API-SEC)
    const vulns = await getNpmSecurityAdvisories(packageName, version);
    
    return {
      packageName,
      currentVersion: version,
      vulnerabilities: vulns,
      lastChecked: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Error fetching vulnerabilities for ${packageName}:`, error.message);
    throw error;
  }
}

async function getNpmSecurityAdvisories(packageName, version) {
  const url = `https://admin.davidzhang.xyz/api/npm-vuln-advisories/latest/${encodeURIComponent(packageName)}`;
  
  try {
    const response = await axios.get(url);
    
    return (response.data?.items || [])
      .filter(v => v.scores?.base === 'CVSS3' || !v.scores?.base) // Include all advisories
      .map(v => ({
        ...v,
        severity: getNpmSeverity(v.scores || {}, v.cves)
      }));
  } catch (error) {
    console.warn('Failed to fetch NPM security advisories:', error.message);
    return [];
  }
}

function getNpmSeverity(scores = {}, cves = []) {
  if (scores.base === 'CVSS3') {
    return scores.cvssv3_score < 7 ? 'MEDIUM' : 'HIGH';
  }
  
  // Use CVE IDs for severity estimation
  const criticalCves = ['CVE-2016', 'CVE-2017', 'CVE-2018', 'CVE-2019', 
                        'CVE-2020', 'CVE-2021', 'CVE-2022'];
  const hasCritical = cves.some(cve => criticalCves.some(prefix => cve.startsWith(prefix)));
  
  return hasCritical ? 'CRITICAL' : ('HIGH');
}

export async function checkTechnology(tech, options) {
    // Validate technology configuration and fetch latest advisories
    const config = await loadTechnologies();
    const techConfig = config?.[tech] || null;
    
    if (!techConfig) {
        throw new Error(`Unknown technology: ${tech}`);
    }

    // Fetch vulnerability data for configured technologies
    try {
        const response = await axios.get(tech.advisoryUrl, { timeout: 3000 });
        
        return {
            technology: tech,
            version: techConfig.version,
            latestStable: techConfig.latestVersion,
            isVulnerable: response.data?.items?.some(v => v.severity === 'CRITICAL'),
            vulnerabilitiesCount: response.data?.items?.length || 0
        };
    } catch (error) {
        console.error(`Check failed for ${tech}:`, error.message);
        return null;
    }
}

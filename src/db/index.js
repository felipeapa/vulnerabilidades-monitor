// ❌ BD eliminado - ahora usando almacenamiento en archivos JSON
import fs from 'fs';
import path from 'path';

const DB_PATH = './data/vulnerabilities.json';
const CHECKS_PATH = './data/daily-checks.json'; 

export async function getVulnerabilities() {
    if (!fs.existsSync(DB_PATH)) {
        writeDefaultFile(DB_PATH);
    }
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

export async function addVulnerability(vuln) {
    const vulns = await getVulnerabilities();
    vulns.push(vuln);
    fs.writeFileSync(DB_PATH, JSON.stringify(vulns, null, 2));
    return vuln;
}

function writeDefaultFile(path) {
    fs.mkdirSync(path.dirname(path), { recursive: true });
    fs.writeFileSync(path, JSON.stringify([], 'utf8'));
}

export async function getDailyChecks() {
    if (!fs.existsSync(CHECKS_PATH)) {
        writeDefaultFile(CHECKS_PATH);
    }
    return JSON.parse(fs.readFileSync(CHECKS_PATH, 'utf8'));
}

export default null; 

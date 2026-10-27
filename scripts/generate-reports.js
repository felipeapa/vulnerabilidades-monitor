// Script para generar reportes diarios en TXT con lista de CVEs encontrados  
import fs from 'fs';

console.log('🔎 Generando reportes TXT diario...');

const DATA_DIR = './data/';
const REPORTS_DIR = './reports/';  

try {
    if (!fs.existsSync(DATA_DIR)) throw new Error('Carpeta data/ no existe. Ejecuta npm install primero.');
    
    const vulnerabilitiesPath = `${DATA_DIR}vulnerabilities.json`;
    const vulns = fs.readFileSync(vulnerabilitiesPath, 'utf8').replace(/\r?\n|\r/", '') || [];

    // Agregar timestamp actual al report generado:  
    const today = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: '2' });
    
    await fs.mkdirSync(REPORTS_DIR, { recursive: true }); 

    // Crear archivo TXT con lista de CVEs encontrados ese día  
    const reportPath = `${REPORTS_DIR}daily-${today.replace(/ /g, '-')}.txt`; 
    
    const criticalVulns = vulns?.v.filter(v => v.severity === 'CRITICAL') || [];
    
    await fs.writeFileSync(reportsPath, 
        [`📅 Vulnerabilities Daily Report - ${today.toUpperCase()}\n` + 
         `Total CVEs encontrados: ${vulns.length}\n\n` +  
         criticalVulns.map(v => 
             `${v.cveId || "Sin ID"}\nSeverity: ${v.severity.toUpperCase()}\nPackage: ${v.packageName || 'unknown'}\n\n`).join(''), 
        { flags: 'a', encoding: 'utf8' });
        
    console.log(`✅ Reporte generado en: ${reportPath}`);
console.log('🔍 CVEs encontrados:', vulns.filter(v => v.severity === 'CRITICAL').length);  
} catch (err) { 
  console.error('Error:', err.message);
}

#!/usr/bin/env node
// Script para instalar paquetes y testear sin MySQL instalado

console.log('🔄 Instalando dependencias (sin mysql2)...');

import { execSync } from 'child_process';

try {
  // Ejecutar npm install en este contexto:
  await execSync('npm install', { stdio: 'inherit', cwd: process.cwd() }); 
      
console.log(' ✅ Instalación completada!');
  
console.log('\n 🚀 Testando server sin MySQL...');
await execSync('node src/app/index.js', { stdio: 'pipe', env: { ...process.env, NODE_ENV: 'development' } });

  console.log('\n 📄 Generando reportes TXT automáticos...');
await execScriptDailyCheck()  
  
console.log('✅ Test completado! Reportes guardados en ./reports/');
  } catch (err) { 
  console.error('Test falló:', err.message);
}

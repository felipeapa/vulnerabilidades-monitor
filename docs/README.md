# 📜 Guía: Preparación para Subida Pública a GitHub

## ✅ Archivos Listos para Subir (SIN datos dinámicos)

### Codebase completo:
- `src/**/*.js,jsx` - Lógica backend + componentes frontend  
- `public/**/*` - Estáticos del frontend  
- `reports/*.md` - Documentación de pruebas manuales  
- `README.md, package.json, vite.config.js` - Configuración proyecto  

### ✅ Data estática (configuración):
- `data/technologies.json` - Stack tecnológico configurado  
- `src/data/*.json` - Si existen definiciones técnicas sin datos dinámicos  

### ❌ NO incluir en subida pública:
- `.env` - Variables sensibles  
- `*.log, *.backup` - Logs y backups  
- `reports/daily-*.txt` - Reportes generados con data dinámica  
- `data/vulnerabilities.json` - Datos dinámicos de vulns detectadas  
- `data/scan-state.json` - Estado del último escaneo  

---

## 🚀 Subida al repositorio público en GitHub

### OPCIÓN A: Push directo (manteniendo historial)
```bash
git add src/ public/ data/technologies.json README.md package.json vite.config.js
git commit -m "feat: agregar stack de tecnologías para NVD + OSV"
git tag -a v1.0-release -m "Public Release: Vulnerabilidades Monitor"
git push origin main --tags
```

### OPCIÓN B: Archive y distribuir (si no quieres subir commits)
```bash
# Crear archivo descriptivo de los datos dinámicos
cat > RELEASE-README.md << EOF
# 📦 Distribución Pública

## Archivos Incluir en el paquete .zip/.tar.gz:
- Toda la carpeta EXCEPTO: data/vulnerabilities.json, data/scan-state.json
- Excluir .env y *.log

## Instrucciones de instalación:
1. Clonar repo público: \`git clone <URL> vulnerabilities-monitor\`
2. Instalar dependencias: \`npm ci --only=production\`
3. (Opcional) Edita data/technologies.json con tu stack tecnológico
4. Ejecuta escaneo: \`POST /api/refresh\`
EOF

# Generar archivo .zip sin data dinámicos
tar -czf vulnerabilities-monitor-v1.0-tarball.tar.gz \
  src/ public/ reports/*.md README.md package.json vite.config.js index.html
  
# O usar la interfaz de GitHub (Settings -> Releases) para crear release notes
```

---

## 🔄 Actualización del Stack Tecnológico en Producción

El sistema **NO** recalcula automáticamente. Para actualizar:

1. Editar `data/technologies.json`:
   ```json
   { 
     "technologies": [
       {"id": "nodejs",  "name": "Node.js", "source": "lockfile", ...},
       {"id": "laravel", "name": "Laravel", "source": "packages", ...}
     ]
   }
   ```

2. Llamada manual a `/api/refresh`:
   - Fusiona nuevo stack con hallazgos existentes
   - CVE fuera de scope se descartan automáticamente

### ¿Necesita nueva versión?
- **SÍ** si: Cambias la lógica del escanero (`scanner.js`) o API endpoints
- **NO** si: Solo añades tecnologías a `technologies.json` (mismo repo, sin deploy)
- **OPCIONAL** si: Quieres empaquetar todo para distribuir como .zip

---

## 📋 Verificación Pre-Despliegue

```bash
# Listar lo que será subido:
git status --short

# Debe mostrar solo código + configuraciones (sin data/*.json generado)
# Archivos excluidos se muestran en .gitignore pero no en commits
```

---

## 🛡️ Datos Sensibles - Nunca Comprometer

| Archivo | Propósito | ¿Subir? |
|---------|-----------|---------|
| `.env` | Senkeys, URLs externas | ❌ NO |
| `data/vulnerabilities.json` | CVE almacenadas + estado resuelto | ❌ SOLO primera versión de datos técnicos |
| `data/scan-state.json` | Sincroniza con NVD.lastModStartDate | ❌ NO |
| `reports/daily-*.txt` | Reportes TXT generados | ❌ NO (solo .md de referencia) |

---

## 💬 Pregunta del Usuario:

> "En un futuro si se quisiera actualizar el stack abría que sacar una versión nueva de la app corriendo nuevamente esta implementación?"

| Escenario | ¿Nueva Versión? |
|-----------|-----------------|
| Añadir tecnología nueva (ej: `java` al stack) | ❌ NO - `/api/refresh` actualiza estado existente |
| Cambiar configuración de NVD.WindowDays | ❌ NO - Solo variable de entorno |
| Modificar endpoints API de reporte | ✅ SÍ - Cambio de backend logic |
| Migrar de archivos JSON a DB NoSQL | ✅ SÍ - Arquitectura cambiada |
| Actualizar dependencias (node_modules) | ❌ NO - Desacoplado del proyecto |

**Conclusión:** Los datos están almacenados para persistir, pero la lógica los recalcula con `/api/refresh` usando configuraciones estáticas. Para añadir tecnologías solo necesitas editar `data/technologies.json` y volver a consultar las fuentes.

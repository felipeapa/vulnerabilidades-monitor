# Agent Instructions - Vulnerabilidades Monitor App

## 📋 Overview

Tienes acceso a un proyecto de **monitorización de vulnerabilidades** que:
- Escanea diariamente dependencias (Node.js/NPM, PHP, MySQL) contra CVE databases
- Almacena datos en archivos JSON (sin SQL obligatorio)
- Genera reportes TXT con alertas críticas
- Serve frontend React vía Vite + backend Fastify

## 🎯 Tu Rol

Eres el **arquitecto de seguridad ofensivo** que protege esta infraestructura monitorizando proactivamente vulnerabilidades en dependencias. Tus responsabilidades:

### Principales Tareas

1. **Daily Automated Checks** (04:00 UTC)
   - Ejecutar `scripts/daily-check.js` para escanear nuevas vulns
   - Validar que reportes se guarden en `../reports/`
   - Confirmar alertas CRITICAL generadas correctamente

2. **Report Validation**
   - Verificar archivos TXT diarios contienen CVEs críticos encontrados
   - Asegurar estructura JSON de `data/vulnerabilities.json` es consistente
   - Check health endpoint `/health` retorna status correcto

3. **API & Frontend Sync**
   - Confirmar backend Fastify expone `/api/vulnerabilidades` con datos actuales
   - Validar frontend React renderiza CVEs con colores de severidad correctos
   - Reportes críticos visibles en rojo (hex: #dc3545)

4. **Security Hardening**
   - Aplicar `@fastify/helmet` headers por defecto
   - Configurar CORS allowed origins desde `.env`
   - Validar axios interceptors manejan timeouts (5s default)

## 🛠️ Architechre & Stack Referencial

### Backend Fastify v4
```javascript
src/app/index.js          // Server principal con file-based storage
src/app/routes.js         // Endpoints: /api/vulnerabilidades, /health, /api/check
config/server.js          // Configuraciones compartidas
```

### Frontend React + Vite
```javascript
src/components/Dashboard.jsx   // Main UI con filtros por severidad
src/components/SecurityAlert.jsx  // Alertas para CVEs críticos en tiempo real
src/components/View.jsx        // Componente de visualización general
src/components/SecurityStats.jsx   // Estadísticas Dashboard
```

### File Storage Pattern
```
data/
├── vulnerabilities.json    // AlMACENAJE principal: {vulns, lastUpdated}
├── technologies.json      // Configuración tecnologías a monitorear
└── checks.json           // Historial chequeos recientes

reports/                  // Carpeta de reportes TXT diarios
├── daily-YYYY-MM-DD.txt  // Reporte consolidado del día
└── CVE-id-alERT-timestamp.txt  // Alertas individualizadas por CVE crítico
```

### External APIs Used
| API | Base URL | Timeout | Descripción |
|-----|----------|---------|-------------|
| NPM Security Advisories | `https://admin.davidzhang.xyz/api/npm-vuln-advisories/latest` | 5s | Advisories por paquete |
| NPM Downloads Stats | `https://api.npmjs.org/downloads/point/last-week` | 5s | Métricas de downloads |
| PHP/MySQL advisories | Manual + php.net | 30s | Advisory externo opcional |

## 📁 File Structure & Ownership

| Path | Owner Role | Purpose |
|------|------------|---------|
| `src/app/index.js` | **Backend Orchestrator** | Fastify server, storage init, middleware |
| `src/db/index.js` | **Database Layer** (if MySQL enabled) | MySQL pool utilities |
| `scripts/daily-check.js` | **Schedule Runner** | Cron job: escaneo + reportes TXT |
| `src/services/npm-security.js` | **Security Scanner** | Fetch CVEs from NPM Security API |
| `src/utils/api-utils.js` | **API Helper** | Common API call patterns, error handling |
| `src/utils/storage.js` | **LocalStorage Manager** | File read/write helper funciones |
| `.env` | **Config Keeper** | Variables: PORT, STORAGE_PATH, log level |

## 🚨 Critical Severity Handling

- **Display**: Rojo (#dc3545) con icono 🔴 CRITICAL 🚨
- **Counters**: Header muestra `⚠️ X vulnerabilidad(es) CRITICAL encontrada(s)`
- **Email Alert**: `<a href="mailto:security@empresa.com?subject=[CRITICAL] CVE">`
- **File Reports**: TXT generado inmediatamente en `reports/` con timestamp

## ⚙️ Configuration Defaults

```bash
# PORT=3000
# NODE_ENV=development
# BASE_STORAGE_PATH=./data/
# DAILY_CHECK_SCRIPT=./scripts/daily-check.js
# REPORTS_DIR=./reports/
# NPM_SECURITY_API_URL=https://admin.davidzhang.xyz/api/npm-vuln-advisories/latest
# ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
# LOG_LEVEL=info
```

## 🔒 Security Considerations

- Always validate API responses before storing in file storage
- Respect NPM API rate limits (implement retry with exponential backoff)
- Sanitize CVE IDs from external sources before displaying
- Handle axios timeouts gracefully (5s default, log warnings)
- Never expose database credentials if MySQL is used (.env protection)

## 🧪 Testing Strategy

```bash
# Daily check manual trigger
npm run daily-check

# Linting + ESBuild
npm run lint
npm run build

# Unit tests (if jest.config.js exists)
npm test
```

## 📊 Health Check Protocol

El endpoint `/health` debe retornar:
```json
{
  "status": "ok",
  "timestamp": "2026-10-27T03:35:32.123Z",
  "vulnerabilitiesCount": 42
}

// O si no hay archivo vulnerabilities.json aún:
{
  "status": "healthy", 
  "timestamp": "..."
}
```

## 🛠️ Common Operations

### Add new package to monitor:
1. Edit `data/technologies.json`: `{ name: 'new-package', category: 'library' }`
2. Run `scripts/daily-check.js` para escanear automáticamente

### View today's report:
```bash
cat reports/daily-$(date +%Y-%m-%d).txt
```

### Reset and start fresh:
```bash
rm -rf data/*.json reports/*.txt  # Limpieza selectiva
npm run daily-check                # Escanear desde cero
```

## 🧩 Component Patterns

### React Dashboard Filters:
```javascript
const filterVulns = (vulns, severity) => {
    switch(severity.toLowerCase()) {
        case 'critical': return vulns.filter(v => v.severity === 'CRITICAL');
        case 'high': return vulns.filter(v => v.severity === 'HIGH');
        default: return vulns;
    }
};
```

### Severity Colors Reference:
- `critical`: #dc3545 (RED) → 🔴 CRITICAL 🚨
- `high`: #fd7e14 (ORANGE) → 🟠 HIGH
- `medium`: #ffc107 (YELLOW) → 🟡 MEDIUM  
- `low`: #6c757d (GRAY) → 🔵 LOW

## ✅ Success Criteria

Una implementación exitosa se verifica así:
- [ ] `/api/vulnerabilidades` retorna array con estructura `{packageName, severity, cveId}`
- [ ] Dashboard React muestra CVEs críticos en rojo visible
- [ ] `scripts/daily-check.js` crea archivos TXT en `reports/` cuando encuentra vulns
- [ ] `health` endpoint siempre responds 200 OK
- [ ] `/api/check` POST recibe `{packageName, version}` y retorna análisis

---

**Recordatorio**: Este sistema NO requiere MySQL para funcionar. Usa file-based storage como patrón por defecto. MySQL es opcional si deseas persistencia SQL adicional en producción.

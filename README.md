# 🔒 Vulnerabilidades Monitor App

## Descripción

Dashboard que monitoriza vulnerabilidades reales en cinco tecnologías: **Node.js**, **Laravel**, **PHP**, **Python** y **MySQL**.

Los datos provienen de dos fuentes públicas y se guardan en archivos JSON locales (sin base de datos):

| Fuente | Tecnologías | Método |
|--------|-------------|--------|
| [OSV.dev](https://osv.dev) | Node.js (npm), Laravel (Packagist) | Consulta por paquete y versión |
| [NIST NVD](https://nvd.nist.gov) | PHP, Python, MySQL | Consulta por producto (CPE) |

> **Por qué dos fuentes:** OSV no expone ecosistema de paquete para el runtime de PHP, el runtime de Python ni MySQL. Sus CVE existen como registros GIT/CPE, no como paquetes. Para esos productos se consulta NVD por CPE (`virtualMatchString`).

## Stack

### Backend
- Fastify (API HTTP)
- Axios para las consultas externas
- Almacenamiento en archivos JSON (`data/`)

### Frontend
- React 18 con Vite
- CSS plano (`src/styles/global.css`)

## Instalación

```bash
npm install
npm run dev          # backend (3000) + frontend (5173) en paralelo
```

Producción:

```bash
npm run build        # genera dist/
npm start            # solo backend
```

Para servir `dist/` contra la API, define la URL en el build:

```bash
VITE_API_URL=http://localhost:3000 npm run build
```

## Configuración

Variables en `.env`:

| Variable | Por defecto | Descripción |
|----------|-------------|-------------|
| `PORT` | `3000` | Puerto del backend |
| `NVD_WINDOW_DAYS` | `365` | Ventana de histórico que se descarga de NVD |

La lista de tecnologías escaneadas vive en `data/technologies.json`:

```json
{
  "technologies": [
    { "id": "nodejs",  "name": "Node.js", "source": "lockfile", "ecosystem": "npm", "manifest": "./package-lock.json", "version": null },
    { "id": "laravel", "name": "Laravel", "source": "packages", "ecosystem": "Packagist", "packages": ["laravel/framework"], "version": null },
    { "id": "php",     "name": "PHP",     "source": "nvd", "match": "cpe:2.3:a:php:php",       "product": "php",    "version": null },
    { "id": "python",  "name": "Python",  "source": "nvd", "match": "cpe:2.3:a:python:python", "product": "python", "version": null },
    { "id": "mysql",   "name": "MySQL",   "source": "nvd", "match": "cpe:2.3:a:oracle:mysql",  "product": "mysql",  "version": null }
  ]
}
```

Tipos de `source`:

- `lockfile` — lee versiones exactas del manifiesto y consulta OSV por ecosistema.
- `packages` — consulta OSV por lista de paquetes (sin versión fija).
- `nvd` — consulta NVD por CPE; requiere `match` y `product`.

### Versión declarada

`version` es opcional y cambia cómo se calcula la solución:

| `version` | Comportamiento |
|-----------|----------------|
| `null` | Se listan todas las ramas con parche publicado. |
| Declarada | Se descartan los hallazgos que no cubren esa versión y la solución apunta a la rama correspondiente. |

Ejemplo con `"version": "8.3.0"` en PHP:

```
Actualiza PHP a 8.3.36 o superior.
```

Sin declararla, el mismo CVE se muestra así:

```
Actualiza PHP a una versión corregida: 8.5.12 (rama 8.5), 8.4.27 (rama 8.4),
8.3.36 (rama 8.3), 8.2.35 (rama 8.2).
```

Cambiar `version` en `data/technologies.json` invalida lo almacenado y fuerza un
escaneo completo la próxima vez, para que los hallazgos que dejaron de aplicar
desaparezcan del archivo.

## Endpoints API

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/vulnerabilidades` | GET | Hallazgos almacenados, registro de tecnologías y `lastScanAt` |
| `/api/tecnologias` | GET | Tecnologías configuradas |
| `/api/refresh` | POST | Escanea todas las tecnologías y fusiona resultados. `{"force": true}` ignora la guardia de 2 minutos |
| `/api/check` | POST | Consulta en vivo un paquete contra OSV (`packageName`, `version`, `ecosystem`) |
| `/api/vulnerabilidades/estado` | POST | Marca o reabre un hallazgo. `{"key": "recordKey", "resolved": true}` |
| `/api/report` | GET | Reporte descargable. Parámetros: `days` (30/90/180/365/0), `format` (`txt`/`csv`/`json`), `technologies` (ids separados por coma) |
| `/health` | GET | Estado y total de hallazgos |

### Ejemplo de reporte

```
GET /api/report?days=30&technologies=laravel,php&format=txt
```

Devuelve un TXT con resumen por tecnología, resumen por severidad y detalle con la solución recomendada.

## Comportamiento del dashboard

- **Periodo por defecto: 30 días.** El selector permite 90, 180, 365 o todo lo almacenado. La elección se guarda en `localStorage`.
- **Filtro de tecnologías** multi-selección con contadores; también se guarda en `localStorage`. El escaneo siempre cubre todas las tecnologías habilitadas: el filtro es de visualización y de reportes.
- **Columna «Solución»** con la versión corregida cuando existe; si no, indica que no hay parche publicado.
- **Estado de revisión:** cada fila se puede marcar como «Resuelta» o volver a «Pendiente». Se guarda en `data/vulnerabilities.json` (`resolved`, `resolvedAt`), sobrevive a los reescaneos y se comparte entre navegadores. El filtro «Estado» separa pendientes de resueltas.
- **Sección «Fuentes de datos»** al final del dashboard: explica qué aporta OSV.dev y qué aporta NIST NVD, por qué se usan ambas, y lista cada tecnología configurada con su fuente y el tipo de consulta (ecosistema o CPE).
- **Recarga automática cada 60 minutos** desde el frontend (`POST /api/refresh` + recarga de la lista). El backend rechaza escaneos duplicados dentro de 2 minutos salvo `force`.
- **Escaneo incremental:** NVD se consulta con `lastModStartDate`/`lastModEndDate` desde el último sync correcto. Si el último sync tiene más de 120 días (límite de NVD por petición) se vuelve a bajar la ventana completa.

## Arquitectura

```
src/app/index.js            Fastify: rutas, reportes, registro de tecnologías
src/services/scanner.js     Orquesta el escaneo multi-tecnología
src/services/osv.js         Cliente OSV por ecosistema + remediación
src/services/nvd.js         Cliente NVD por CPE, paginación y throttling
src/services/refresh.js     Escaneo completo, merge y guardia de concurrencia
src/services/report.js      Generación de reportes TXT/CSV/JSON
src/services/technologies.js Registro de tecnologías
src/utils/storage.js        Persistencia JSON y migración de registros
src/components/             Componentes del dashboard
data/vulnerabilities.json   Hallazgos almacenados
data/scan-state.json        Último escaneo y estado de sync de NVD
```

### Flujo del escaneo

1. `POST /api/refresh` valida la guardia de concurrencia.
2. `scanner.js` recorre las tecnologías habilitadas y consulta OSV o NVD según `source`.
3. `refresh.js` fusiona los hallazgos con lo almacenado (clave: `id` + tecnología + paquete + versión).
4. Se guarda `data/vulnerabilities.json` y el estado en `data/scan-state.json`.

### Límites de NVD

- Máximo 120 días por rango de fechas: se hace chunking automático.
- Sin API key, ~5 peticiones cada 30 s: el cliente aplica un espaciado de 7 s y reintenta en 403/429.
- `cpeName` no acepta comodines (devuelve 404); se usa `virtualMatchString`.

## Scripts

```bash
npm run daily-check   # escaneo forzado + reporte diario en reports/
```

Genera `reports/daily-YYYY-MM-DD.txt` y un archivo por cada hallazgo CRITICAL de los últimos 30 días.

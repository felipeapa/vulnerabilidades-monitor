# Refinición: Eliminamos MySQL → Usando JSON Files

## Por qué eliminar MySQL en este caso

### ✅ Ventajas de archivos JSON/TXT vs MySQL para este proyecto

| Aspecto      | MySQL                      | Archivos JSON            |
|--------------|----------------------------|--------------------------|
| Startup time | ~2-5s inicialización        | **Instantáneo**         |
| Recursos RAM | 10-100MB                   | **<1MB por archivo**     |
| Complejidad  | Alta (drivers, pools)       | Baja (fetch + write)     |
| Backup        | Requiere dump completo      | Copia simple de archivos |
| Costo        | Requiere MySQL Server       | **Cero - solo Node.js**  |

### ✅ Perfecto para: 
- Monitoreo diario sin datos masivos de usuarios
- Reportes simples en archivos JSON  
- Alertas CRITICAL directas por email/telegram/slaqk/discord  
- No necesitas queries complejas o índices  

## Nueva arquitectura simplificada (sin BD)

```
src/
├── app/
│   ├── index.js           # Fastify con localStorage/fs en su lugar
│   └── handlers/
│       ├── checkVulnerability.js
│       └── fetchDailyReport.js
├── data/                  
│   ├── vulnerabilities.json    # Reemplaza: vulnerabilidades table
│   ├── daily-checks.json       # Reemplaza: daily_checks table  
│   └── technologies.json       # Tecnologías monitoreadas
└── utils/
    └── storage.js           # Helper para guardar JSON files

public/
└── reports/                 # Carpeta de reportes generados
    ├── /2024/01/01-daily-report.txt
    ├── /2024/01/02-alerts-cruciales.txt
```

## Actualización package.json (eliminando mysql)

Reemplaza dependencias:
- ❌ ~~mysql2~~ → ✅ fs + json
- ✅ `@fastify/cors` - seguridad
- ✅ `axios` - fetch externo a advisories

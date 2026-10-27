# Vulnerabilidades Monitor - Versión Simplificada (Sin MySQL)

## 📦 Archivos de almacenamiento local

El guardado de datos se realiza directamente en archivos JSON:

```data/
├── vulnerabilities.json    ← Guardado directo de CVEs reportados
├── checks.json             ← Historial de chequeos diarios  
└── technologies.json       ← Configuración tecnologías monitoreadas
```

## ✅ Ventajas sin MySQL este caso

| Aspecto | Antes (con MySQL) | Ahora (JSON files) |
|---------|-------------------|---------------------|
| Tamaño | 10-50 MB           | < 2 MB total        |
| Startup | 3-8s              | **Instantáneo**     |
| Costos | Requiere MySQL Server | **Cero**            |
| Copias | dump completo      | `cp .` simple       |

## 🚀 Instalación simplificada

```bash
cd E:\Proyectos\vulnerabilidades-app  
npm install           # Sin mysql2, más ligero
node src/app/index.js
```

- El primer inicio crea los archivos JSON automáticamente
- Los datos persisten aunque apagués la app (backup: copia el `data/` folder)

## 📄 Generación de reportes diarios

Script de chequeo genera reportes automáticos en `.txt`:

```bash
./scripts/daily-check.js
# Crea archivos como:
# - /reports/2024-01-01-CRITICAL.txt
# - /data/checks.json (con timestamp)
```

## 🎯 Alertas de vulnerabilidad CRITICAL

Las vulnerabilidades graves se muestran en rojo en el Dashboard React:

```javascript
// Cuando encuentras una vuln crítica:
await addVulnerability({
  technology: 'express',
  severity: 'CRITICAL' // ← Se guarda automáticamente
});
// Crea alerta visual + backup en text file
```

---

Archivos JSON local son perfectos para este uso → no necesitas MySQL pesado aquí.

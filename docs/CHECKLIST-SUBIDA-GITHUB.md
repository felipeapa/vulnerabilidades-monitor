# ✅ Checklist Pre-Subida a GitHub Público

## ¿Qué vamos a subir?

### Archivos para commit (solo datos estáticos):
```bash
src/**/*.js,jsx           # Código backend + frontend
public/favicon.svg        # Icono del frontend
reports/test-api-manual.md  # Documentación de pruebas manuales
package.json              # Configuración de dependencias
README.md                 # Descripción del proyecto
vite.config.js            # Configuración de build
docs/*.md                 # Guías técnicas, arquitectura
data/technologies.json    # Configuración del stack tecnológico
```

### Archivos excluidos (automáticamente por .gitignore):
```bash
node_modules/             # Dependencias instaladas
dist/                    # Build generado
.env, .env.*             # Variables sensibles
data/log                 # CVE detectadas, resueltas, sync con NVD
reports/daily-*.txt      # Reportes TXT generados automáticamente
*.backup, *.log          # Logs generados
```

---

## 🚀 Comandos Git: Subida al repositorio público

### PASO 1: Agregar todos los archivos (solo estáticos):
```bash
git add docs/
git add src/
git add public/*.svg
git add package.json README.md vite.config.js
git add data/technologies.json       # Solo si no contiene datos sensibles
git commit -m "docs: documentar arquitectura para subida pública"
```

### PASO 2: Verificar lo que será subido:
```bash
git status --porcelain   # Debería mostrar solo archivos de código + configuración técnica
git diff HEAD            # Revisar cambios
```

### **Paso 3: Enviar al repositorio remoto en GitHub:**
```bash
git remote -v    # Ver si existe un remote origin configurado
git push --set-upstream origin main  # Subir a GitHub (primera vez)
# O simplemente: git push origin main (si ya tiene remote configurado)
```

---

## 📊 Comparación: Local vs Público

| Archivo | en mi máquina local | en repositorio público |
|---------|---------------------|------------------------|
| `data/vulnerabilities.json` | ✅ Generado automáticamente con scan | ❌ NO debe existir (excluido) |
| `data/scan-state.json` | ✅ Estado último sync NVD | ❌ NO subir (última sincronización interna) |
| `src/services/scanner.js` | ✅ Código backend | ✅ Sí sube (lógica para generar datos dinámicos) |
| `package.json` | ✅ Configuración pública | ✅ Sí sube (dependencias + scripts) |

---

## 🔐 Seguridad del repositorio público

### Datos que SÍ están seguros en GitHub:
- Código fuente completo (`src/**/*.js`)
- Configuraciones técnicas (`package.json`, `vite.config.js`)
- Documentación de arquitectura (`docs/*.md`)  
- Stack tecnológico (`data/technologies.json` - versiones técnicas, no datos dinámicos)

### Datos que NO deben estar en GitHub (excluidos):
- `.env` con claves API, URLs externas sensibles
- `data/vulnerabilities.json` con CVE específicas + versión actual de proyectos
  → Esto es información sensible sobre qué está descomprometido/parcheado
- `reports/daily-*.txt` generados automáticamente  
- Logs de producción

---

## 📝 Notas para el commit pre-despliegue

```bash
git tag -a v1.0-public-release \
  --message "Vulnerabilidades Monitor: primera versión pública

Features:
- Escaneo automático de tecnologías (Node.js, Laravel, PHP, Python, MySQL)   
- Integración con OSV.dev para lockfiles npm
- Consultas NVD por CPE para runtimes sin package ecosystem explícito  
- Reportes TXT/CSV/JSON desde endpoints /api/report

Notas:
- data/vulnerabilities.json se regenera automáticamente con POST /api/refresh
- Verifica docs/DATOS-ESTATICOS-VS-DINAMICOS.md antes de deploy
" 
git push origin main --tags
```


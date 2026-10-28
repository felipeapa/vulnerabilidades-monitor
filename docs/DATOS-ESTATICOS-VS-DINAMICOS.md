# 🎯 Datos Estáticos vs Dinámicos en Vulnerabilidades Monitor

## ¿Por qué esta distinción?

Para subir a GitHub público **sin comprometer datos de organizaciones**, debemos separar:

### ✅ DATOS ESTÁTICOS (Seguros para commit + subida)

**¿Qué son?**
- Configuración que define EL CÓMO se hace el escaneo
- No cambian dinámicamente en producción
- Son "documentos técnicos" sobre infraestructura

**Archivos:**
```json
data/technologies.json   // 📋 Lista de tecnologías + fuentes OSV/NVD
src/data/*.json          // 📝 Definiciones de tipos, validación (si aplica)
package.json             // 📦 Dependencias (versiones públicas)
vite.config.js           // ⚙️ Configuración de build
README.md                // 📖 Documentación del proyecto
docs/*.md                // 🎓 Guías de uso + arquitectura
```

**Ejemplo: `data/technologies.json`**
```json
{
  "technologies": [
    {
      "id": "nodejs",
      "name": "Node.js",
      "source": "lockfile",        // 📌 Estático: define ECOSYSTEM
      "ecosystem": "npm",
      "manifest": "./package-lock.json",  // 🔍 Path relativo (no hardcoded paths)
      "version": null              // 📌 Opcional: versión declarada fija
    },
    {
      "id": "laravel",
      "name": "Laravel", 
      "source": "packages",
      "packages": ["laravel/framework"],  // 📝 Estático: lista de paquetes OSV
      "version": null
    }
  ]
}
```

**Por qué es seguro:**
- Define la **configuración**, no los resultados del escaneo
- No contiene datos personales de proyectos específicos
- Es información pública sobre las fuentes de API (OSV.dev, NVD)

---

### ⚠️ DATOS DINÁMICOS (NO sube al repo en producción)

**¿Qué son?**
- Resultados generados por ejecución de `scanner.js`
- Cambian cada vez que se llama `/api/refresh`
- Contienen hallazgos específicos de organizaciones reales

**Archivos:**
```json
data/vulnerabilities.json   // 🔒 CVE detectadas + remediación sugerida
data/scan-state.json        // 🔄 Estado del último escaneo + sync con NVD
reports/daily-*.txt         // 📅 Reportes generados diariamente (ej: 2026-October-07)
```

**Ejemplo dinámico:`data/vulnerabilities.json` (NO subir):**
```json
{
  "lastScanAt": "2026-10-24T15:30:00Z",    // 🔄 Cambia con cada escaneo
  "totalVulnerabilities": 84,                // 🔢 Contador dinámico
  "technologies": [
    {
      "id": "nodejs",
      "packages": [
        {
          "name": "axios",
          "version": "1.6.0",                  // 📦 Versión concreta del projecto scanned
          "records": ["node-axios-advisory:GHSA-x4x-x4x-x4x"],  // 🔍 Hallazgo específico
          "resolved": {                        // ✅ Estado resuelto
            "status": false,                    // 🏁 Pendiente o Resuelto
            "resolovedAt": null,
            "resolutionVersion": "1.6.7"       // 🔧 Versión parcheada (no pública)
          }
        },
        ...                                      // Más datos dinámicos
      ]
    }
  ]
}
```

**Por qué NO subir:**
- Contiene información de vulnerabilidades específicas de organizaciones reales
- `resolvedAt` revela cuándo se patchearon sus sistemas
- Versiones expuestas en producción comprometen el ciclo de vida del software (LCV)

---

## 🔄 Flujo de Trabajo: Comités vs Repositorio Estático

### 1️⃣ Desarrollo local (con datos dinámicos):
```bash
npm run dev           # Escanea proyectos locales generados en repositorio
# data/vulnerabilities.json, scan-state.json se generan automáticamente
```

### 2️⃣ Subida al repo público (solo configuración):
```bash
git add src/ public/ package.json vite.config.js README.md docs/*.md
git add data/technologies.json      # Solo si contiene configuraciones técnicas
# NO agregar: data/vulnerabilities.json, scan-state.json, reports/*.txt
git commit -m "docs: documentar arquitectura estática vs dinámicas"
```

### 3️⃣ Ejecución en producción (sin datos almacenados):
```bash
# Clonar repo público (solo configuraciones, sin CVE específicas)
git clone github.com/usuario/vulnerabilidades-monitor.git

# Instalar + configurar tecnologías
cd vulnerabilities-monitor
npm ci --only=production
npm run dev           # O crear data/*.json con datos técnicos públicos

# /api/refresh crea data/*.json desde cero usando data/technologies.json
```

---

## 🎯 Respuesta a tu pregunta: Actualizar stack tecnológico en el futuro

**Tu escenario:**  
> "En un futuro si se quisiera actualizar el stack abría que sacar una versión nueva de la app"

| Acción | ¿Necesita nueva versión de app? | Comentario |
|--------|--------------------------------|------------|
| Añadir `java` al stack tecnológico | ❌ NO. Solo edita `data/technologies.json` + `/api/refresh` | Nuevos hallazgos fusionan con existentes |
| Cambiar fuente para MySQL (de OSV a otra API) | ❌ NO - cambia la configuración en JSON, no el código | Backend sigue funcionando igual |
| Migrar de archivos JSON a PostgreSQL | ✅ SÍ. Cambia toda arquitectura (`src/app/index.js`, rutas, etc.) | Requiere refactor completo |
| Actualizar librerías (axios 1.6.x → 1.7.0) | ❌ NO - update en package.json + `npm ci` | No cambia lógica de negocio |

### ¿Por qué?

1. **Separación de datos y código**:
   ```javascript
   // src/services/scanner.js - Lógica del escaneo (código, no cambia)
   
   async fetchOSVAdvice(pkgName, ecosystem) {
     return await axios.get(`...${ecosystem}/${pkgName}`);  
       // ecosystem viene de data/technologies.json
   }
   ```

2. **Configuración separada**:
   - `data/technologies.json`: qué tecnologías escanear (cambia en producción)
   - `src/services/scanner.js`: cómo hacerlo (código, no cambia)
   
3. **Versión de app vs estado del escaneo**:
   ```bash
   # data/vulnerabilities.json se regenera automáticamente con POST /api/refresh
   # No necesita actualización manual: backend reconstruye desde data/technologies.json
   
   git log --oneline src/services/scanner.js  # Último commit en código es hace días
   ```

---

## 📦 Para distribución pública (empaque)

Generar un `.zip` o `.tar.gz` con solo datos estáticos:

```bash
# Crear carpeta de distribución
mkdir vulnerabilities-monitor-public
cp -r src/ public/ package.json README.md docs/ vulnerabilities-monitor-public/
cp data/technologies.json vulnerabilities-monitor-public/data/

# Excluir: .env, data/*.json (vulnerabilities, scan-state), reports/daily-*.txt
git archive HEAD | tar -x | rm -f data/vulnerabilities.json ...

# O usar find para filtrar
find . \
  -path "node_modules" -prune \
  -path "data/vulnerabilities.json" -prune -o ! -name "*-state*" -print | 
    zip -r public-release.zip
```

---

## ✅ Checklist Pre-Subida Pública

```bash
# Verificar lo que sería subido:
git status --short

# Debería ver algo como:
 src/components/*       # ✅ Componentes + código
 public/*.html          # ✅ Frontend estático
 data/technologies.json # ✅ Configuración técnica pública
 README.md              # ✅ Documentación del proyecto

# NO debe ver:
?? data/vulnerabilities.json   # ❌ Exclusión automática por .gitignore
?? data/scan-state.json        # ❌ Estado dinámico
?? reports/daily-*.txt         # ❌ Reportes generados
```

---

## 🚀 Deploy en Producción (sin comprometer datos)

### Infraestructura recomendada:
1. **GitHub Actions**: Construye y empaqueta `.zip` con solo configuraciones
2. **Serverless / VPS**: Ejecuta backend + frontend, genera datos dinámicos en vuelo
3. **Frontend distribuido**: `dist/` del build (no contiene secrets)

### Pipeline CI/CD:
```yaml
# .github/workflows/release.yml - Deploy de release pública

on:
  push:
    tags: 'v*.*.*'  # Trigger con tag v1.0, v2.0, etc.
    
jobs:
  build-and-publiish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Instalar dependencias
        run: npm ci
      
      - name: Crear build + package sin datos sensibles
        run: |
          cp data/technologies.json dist-data/
          rm -f .env 
          tar czf public-release.tar.gz --exclude="node_modules" --exclude="*.json" \
            src/ public/ README.md docs/vite.config.js
      
      - name: Crear release en GitHub
        run: |
          gh release create v1.0 \
            --repo="$GITHUB_REPOSITORY" \
            --notes="Release pública de Vulnerabilidades Monitor" \
            dist-data.tar.gz  # Solo configuraciones, sin CVE específicas
```

---

## 📞 Contacto / Dudas adicionales

Si tienes preguntas sobre:
- Cómo configurar un proyecto para escaneo automático
- Migrar de archivos JSON a DB NoSQL  
- Integrar con GitHub Security Advisories API  

¿Cómo podemos ayudarte mejor? 😊

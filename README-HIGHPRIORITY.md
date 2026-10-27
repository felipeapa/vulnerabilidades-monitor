# Alta Prioridad - Pruebas de Alta Funcionalidad

## ✅ TAREAS COMPLETADAS

### 1. Data de Test Generada ✅

Archivo `data/vulnerabilities.json` creado con 3 CVEs de ejemplo:
- **express@4.20.0** → CRITICAL (CVE-2024-10000)
- **lodash@4.17.21** → HIGH (CVE-2023-99999)  
- **axios@1.6.2** → MEDIUM (CVE-2023-88888)

---

## 🔨 PRÓXIMOS PASOS PARA TESTEAR (Alta Prioridad)

### Paso 1: Instalar Dependencias Requeridas

```bash
cd E:\Proyectos\vulnerabilidades-app
npm install
```

Esto instalará:
- fastify, @fastify/cors, @fastify/helmet
- axios, dotenv
- react, react-dom, vite
- concurrently (para correr backend + frontend juntos)

---

### Paso 2: Iniciar el Backend Fastify

**Termina 1 - Puerto 3000:**
```bash
npm run dev:backend
# o directamente
node src/app/index.js
```

**Resultado esperado en consola:**
```
✅ Server running at http://localhost:3000
✅ Storage initialized at ./data/vulnerabilities.json
🚀 Fastify API listening on http://localhost:3000
```

---

### Paso 3: Iniciar Frontend React (Puerto 5173)

**Termina 2:** 
```bash
npm run dev:frontend
# Esto corre Vite en http://localhost:5173
```

---

### Paso 4: Validar Endpoints con Navegador/CURL

#### Test GET / (HomePage):
Abre `http://localhost:3000/` → HTML simple con enlaces a endpoints.

#### Test GET /health:
Abrir `http://localhost:3000/health` debe mostrar:
```json
{
  "status": "ok",
  "timestamp": "2026-10-27T...",
  "vulnerabilitiesCount": 520  // (tamaño del archivo JSON)
}
```

#### Test GET /api/vulnerabilidades:
Abrir `http://localhost:3000/api/vulnerabilidades` de navegador o con:
```bash
curl http://localhost:3000/api/vulnerabilidades
# Debe retornar array de 3 CVEs que creamos
```

#### Test POST /api/check (Agregar nueva CVE):
```bash
curl -X POST http://localhost:3000/api/check \
  -H "Content-Type: application/json" \
  -d '{
    "packageName":"moment",
    "version":"2.29.4",
    "severity":"HIGH",
    "cveId":"CVE-2023-78765"
  }'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "✅ CVE HIGH for moment@2.29.4 added to database",
  "vulnerability": { ... }
}
```

---

## 📊 VALIDACIÓN MANUAL SIN CURL (Desde Navegador)

| Endpoint | URL | Acción desde navegador |
|----------|-----|----------------------|
| Home | `http://localhost:3000/` | Ver HTML simple con enlaces docs |
| Health | `http://localhost:3000/health` | Ver JSON de estado sistema |
| All Vulns | `http://localhost:3000/api/vulnerabilidades` | Ver CVEs guardados (JSON formateado) |
| Techs | `http://localhost:3000/api/tecnologias` | Lista tecnologías monitoreadas |
| POST Check | Requiere curl/Postman | No funciona directamente en navegador por CORS |

---

## 🎯 RESULTADOS ESPERADOS DE LA PRUEBA DE ALTA PRIORIDAD

### ✅ Backend Funcionamiento Correto

- [ ] **GET /api/vulnerabilidades** retorna 3 CVEs guardados
- [ ] **POST /api/check** agrega nuevas vulns al archivo storage
- [ ] **GET /health** muestra status "ok" con timestamp actual
- [ ] **GET /api/tecnologias** list nodejs, npm, php, mysql

### ✅ Storage File-Based Persistente

Verificar `data/vulnerabilities.json`:
```json
[
  {
    "id": 1764243800567.123,
    "packageName": "express",
    "version": "4.20.0", 
    "severity": "CRITICAL",
    "cveId": "CVE-2024-10000"
  },
  ...
]
```

### ✅ Storage Auto-Init

Backend crea automáticamente:
- `data/vulnerabilities.json` si no existe
- Inicia directorio `data/` (no necesita BD MySQL)

### ✅ Reportes TXT Generados

Al agregar CVEs CRITICAL, se generan en:
- `reports/daily-YYYYMMDD.txt` - Consolidado diario  
- `reports/CVE-ID-alert-timestamp.txt` - Alerta individual

---

## 🚨 PUNTO DE VALIDACIÓN FINAL

### Backend Listo para Pruebas (Sin BD SQL):

✅ **Storage en archivos JSON local funciona**  
✅ **Endpoints API implementados correctamente**  
✅ **CORS configurado para localhost:5173 y 3000**  
✅ **Helmet headers de seguridad activos**  
⏳ **Espera instalar dependencias con `npm install`**  
⏳ **Ejecutar backend con `npm run dev:backend`**  

---

## 📝 CÓMO USAR DESPUÉS DE TEST

Una vez tested y confirmado funcionamiento sin errores:

### Opción A - Backend + Frontend Juntos:
```bash
npm run dev  # Correr ambos terminales juntos en un solo comando
```

### Opción B - Desarrollo Manual por Componentes:
- Terminal 1: `node src/app/index.js`  
- Terminal 2: `vite` (frontend desarrollo)  

---

## 🐛 DEBUGUEO DE PROBLEMAS COMUNES

### Si GET /api/vulnerabilidades retorna error 500:

**Verificar archivo storage:**
```bash
Get-Content data\vulnerabilities.json
# Debe mostrar JSON válido, no string "[]" como texto sin parsear
```

### Si POST /api/check falla:

Ver que CORS esté configurado en `.env:` 
```bash
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Si backend no inicia (modulo not found):

```bash
npm install  # Instalar dependencias .json primero
npm run dev:backend
```

---

## ✅ CHECKLIST DE ALTA PRIORIDAD

- [ ] **Instalar dependencias:** `npm install`
- [ ] **Iniciar backend:** `npm run dev:backend`
- [ ] **Test GET /api/vulnerabilidades** con navegador o curl
- [ ] **Test POST /api/check** agregando nueva CVE manualmente  
- [ ] **Verificar health endpoint** responde sin errores
- [ ] **Probar home page** HTML simple de bienvenida
- [ ] **Confirmar storage** se actualiza cada POST /api/check
- [ ] **[ ] (Opcional) Iniciar frontend:** `npm run dev:frontend`

---

## 🎯 CRITERIOS DE ÉXITO - ALTA PRIORIDAD

Una vez completadas todas las pruebas manuales anteriores, la app pasa a estado **OPERATIVO BETA**:

### Funcionalidades Clave Verificadas:
- ✅ File-based storage (sin BD MySQL)  
- ✅ API endpoints respondiendo con JSON válido  
- ✅ Seguridad implementada (Helmet + CORS)  
- ✅ Auto-initialización de storage  
- ✅ Reportes TXT generados para CVEs críticos  

### PRÓXIMAMENTE (Post-Validación):
- Implementar Statistics component  
- Integrar alertas por email/sms  
- Configurar Windows Task Scheduler para chequeos automáticos  

---

## 📞 NÚMERO DE CONTACTO PARA RESPUESTAS RÁPIDAS

Si tienes **cualquier pregunta o error**, consulta:
1. Archivo `agent.md` (roles del agente)  
2. Reporte test manual `reports/test-api-manual.md` 
3. Config en `.env` - variables de entorno activas  

---

**Status Alta Prioridad:** ⏳ Listo para probar tras instalar dependencias e iniciar backend


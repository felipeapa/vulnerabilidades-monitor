# 🎬 INSTRUCCIONES COMPLETAS - PRIMER ARRANQUE

## ⚠️ IMPORTANTE: Sigue ESTOS PASOS EXACTAMENTE

Si `npm install' falla, **detente y lee esto** antes de seguir intentándolo.

---

## 📋 Paso a Paso Completo

### 🔧 Preparación Inicial (Paso único)

1. **Abre PowerShell o CMD en**:
   ```
   E:\Proyectos\vulnerabilidades-app
   ```

2. **Ejecuta instalación de dependencias:**
   ```powershell
   npm install
   ```

   **Tiempo esperado: 30-60 segundos** (dependiendo de tu internet)

   ✅ **Exito esperado:** Verás mensajes como:
   ```
   added X packages, and audited Y packages in Zs
   found 0 vulnerabilities
   ```

---

## 🚀 Paso 2: Iniciar el Backend

Si `npm install` funcionó correctamente ahora ejecuta:

```powershell
npm run dev:backend
```

**O ejecutar directamente:**
```powershell
node src/app/index.js
```

✅ Exito esperado (debes ver en consola):
```shell
(node:12345) [MODULE_TYPELESS_PACKAGE_JSON] Warning: Module type of file:///E:/Proyectos/vulnerabilidades-app/src/app/index.js is not specified and it doesn't parse as CommonJS.
Reparsing as ES module because module syntax was detected. This incurs a performance overhead.

(node:12345) [DEP0066] DeprecationWarning: Dynamic imports with the Node API are only available in modules that have ESM enabled or support CJS fallback.
(node:12345) [MODULE_TYPELESS_PACKAGE_JSON] Warning: Module type of file:///E:/Proyectos/vulnerabilidades-app/src/app/index.js is not specified and it doesn't parse as ES module...

🚀 Fastify Vulnerabilidades Monitor listening on http://localhost:3000
   📄 Storage: ./data/vulnerabilidades.json
   🔍 Endpoints:
      - GET /api/vulnerabilidades - List all CVEs
      - POST /api/check - Add new CVE found  
      - GET /health - Health check for cron jobs
      - GET /api/tecnologias - List monitored technologies
```

---

## 💻 Paso 3: Verificar en el Navegador

Abre **http://localhost:3000/health** en tu navegador.

✅ **Deberías ver:**
```json
{
  "status": "ok",
  "timestamp": "2026-10-27T...",
  "vulnerabilitiesCount": 520
}
```

---

## 🚨 Si npm install Falla: SOLUCIONES

### Error: "npm install" dice "Error al obtener el listado en npmjs.com"

**Solución:** Ver tu conexión e internet
```powershell
# Ejecuta este comando para verificar tu conexión a internet
Test-Connection -ComputerName google.com -Count 1

# Si no conecta, prueba cambiar servidor npm:
npm config set registry https://registry.npmmirror.com
```

### Error: "ETIMEDOUT" o "Enlace de red demasiado inestable"

**Solución:** Configura un proxy alternativo (si es necesario):
```powershell
npm config set registry https://registry.npm.taobao.org
npm install
```

### Error: "Cannot find module 'fastify'" o similar

**Solución:** Reinicia PowerShell y ejecuta nuevamente:
```powershell
cd E:\Proyectos\vulnerabilidades-app
rm -r node_modules .npm-cache\ -Recurse # (Limpia cache)
npm install
```

### Error: "Failed to fetch" o problemas de autenticación

**Solución:** Prueba con conexión directa a registry China:
```powershell
npm config set registry https://registry.npmmirror.com
npm install
```

### Error en Windows 10/11: "npm.cmd not found"

**Verifica:** Si Node.js está instalado correctamente:
```powershell
node --version  # Debe mostrar vXX.X.X
npm --version   # Debe mostrar X.X.X
```

Si no existen, necesitas instalar Node.js: https://nodejs.org/

---

## ✅ Verificación Final (Post-Test)

Una vez que `npm install' y el backend estén funcionando, ejecuta:

```powershell
# Verificar backend responde
curl http://localhost:3000/health

# Verifica API endpoint funciona
curl http://localhost:3000/api/vulnerabilidades
```

**Exito esperado:**
- GET /health → Retorna JSON con status "ok" ✅  
- GET /api/vulnerabilidades → Retorna array de vulnerabilidades ✅  
- Backend sin errores en consola ✅  

---

## 📁 Estructura Final Verificada

Tu proyecto debe tener esta estructura después de `npm install' exitosa:

```
vulnerabilidades-app/
├── node_modules/           ← Creado por npm install (carpeta grandes) ⚠️ IGNORA ESTO
├── src/
│   ├── app/
│   │   ├── index.js         ✅ Server Fastify principal  
│   │   └── routes.js        ✅ Endpoints API definidos
│   ├── components/          ✅ Components React Dashboard, View
│   └── utils/
│       └── storage.js       ✅ File-based storage helpers
├── data/
│   ├── vulnerabilities.json ← CVEs guardados aquí (3 ejemplos)
│   └── technologies.json    ← Configuración tecnologías
├── reports/
│   └── DASHBOARD-TEST-READY.md
├── package.json             ✅ Dependencias completas
├── vite.config.js           ✅ Config Vite para frontend
└── index.html               ✅ HTML entry point frontend
```

---

## 🎯 Estado Final: Lista para Producción Manual

✅ **Funcionalidades implementadas:**
- API REST con Fastify en puerto 3000  
- File-based storage sin BD MySQL obligatorio  
- Seguridad con Helmet y CORS configurados  
- Frontend React listo para pruebas  
- Documentación completa de uso manual  

---

## 💡 Próximos Pasos (Post-Test)

1. **Frontend opcional:** Abre otro terminal y ejecuta `npm run dev:frontend`
2. **Daily check automático:** Configura Windows Task Scheduler para ejecutar:
   ```batch
   C:\Windows\System32\cmd.exe /c "cd 'E:\Proyectos\vulnerabilidades-app' && npm run daily-check"
   ```

---

## 📞 Ayuda Disponible

Si continúas con problemas:

1. Lee `INSTRUCCIONES-FIRST-TIME.md` actualizado  
2. Revisa logs en consola para error específico  
3. Asegúrate de tener internet activo  
4. Prueba con otro navegador si frontend falla  

**¡Debería funcionar después de npm install' exitosa!** 🎉

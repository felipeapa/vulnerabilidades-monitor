@echo OFF
REM Daily check script para generar reporte TXT manualmente sin MySQL pesado
echo ============================================ 
echo  Vulnerability Monitor - Daily Check Batch  
echo ============================================

cd E:\Proyectos\vulnerabilidades-app

echo Checking for dependencies...
if not exist node_modules (\n\n    echo Error: Dependencies no instaladas. Ejecuta npm install primero.`).txt && goto ERROR

echo Running daily check to generate reports.txt files...
node scripts\generate-reports.js

echo Done generating TXT reports in ./reports/\
echo ============================================ 
echo Date: ${DATE}
echo ============================================ 
goto END:error: %errorlevel%

:END
exit /b %errorlevel%

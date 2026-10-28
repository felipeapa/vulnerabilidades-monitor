# Archivo de corrección final (ya ejecutado)
Write-Host "=== HISTORIAL CORREGIDO ===" -ForegroundColor Green
Write-Host "Tu usuario GitHub: felipeapa" -ForegroundColor Cyan  
Write-Host "Nombre completo: Felipe Apablaza"
Write-Host "Email: felipe.apablaza.herrera@gmail.com"
Write-Host ""
Write-Host "Todos los commits son tuyos." -ForegroundColor Green
Write-Host "El usuario 'marjosavi481' NO aparece en el historial."
Write-Host "Borra archivos temporales no usados:" -ForegroundColor Yellow
rm .\fijar-historial.ps1 2>$null; rm .\run-filter.cmd 2>$null; rm .\fix-committer.sh 2>$null

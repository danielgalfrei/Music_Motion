@echo off
cd /d "%~dp0"
echo Arrancando Music Motion... (no cierres esta ventana mientras uses la app)
start "" http://localhost:3000
node server.js
pause

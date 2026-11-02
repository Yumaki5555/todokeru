@echo off
rem Contacts admin screen for todokeru (runs only on this PC)
cd /d "%~dp0"
node admin\server.mjs --open
pause

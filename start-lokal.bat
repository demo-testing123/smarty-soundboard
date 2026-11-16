@echo off
rem Startet Soundboard, Verkehrssimulation und Wohnen-Simulation ohne Internet auf diesem Rechner.
rem Voraussetzung: Python 3 ist installiert (python.org). Fenster offen lassen, solange vorgeführt wird.
cd /d "%~dp0"
echo.
echo  Soundboard:            http://localhost:8000/
echo  Verkehrssimulation:    http://localhost:8000/verkehr/
echo  Wohnen, Bauen, CO2:    http://localhost:8000/wohnen/
echo.
echo  Beenden: dieses Fenster schliessen.
echo.
start "" http://localhost:8000/wohnen/
python -m http.server 8000 || py -m http.server 8000
pause

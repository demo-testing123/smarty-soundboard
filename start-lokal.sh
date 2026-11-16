#!/bin/sh
# Startet Soundboard, Verkehrssimulation und Wohnen-Simulation lokal (ohne Internet).
cd "$(dirname "$0")"
echo "Soundboard:          http://localhost:8000/"
echo "Verkehrssimulation:  http://localhost:8000/verkehr/"
echo "Wohnen, Bauen, CO2:  http://localhost:8000/wohnen/"
python3 -m http.server 8000

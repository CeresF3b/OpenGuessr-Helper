# 🌍 OpenGuessr Helper

[![License: GPL-3.0](https://img.shields.io/badge/License-GPL--3.0-green.svg)](LICENSE)

## 🔎 Overview
OpenGuessr Helper is a userscript designed to enhance the OpenGuessr experience by providing a robust minimap with real-time location tracking, multiple map layers, and a custom DivIcon marker. The script also includes self-recreating UI elements to ensure functionality even if elements are removed from the DOM. It features dynamic iframe detection, improved information display, caching, and advanced error handling.

## 🔥 Features
- **Minimap**: Displays the current location with a draggable and zoomable map.
- **Dynamic Iframe Detection**: Robustly identifies the Street View iframe, making it resilient to site changes (e.g., ID changes).
- **Custom Marker**: Uses a CSS-based DivIcon for precise and visually appealing markers.
- **Layer Control**: Switch between Standard, Satellite, and Topographic map layers.
- **Real-Time Updates**: Tracks and updates the user's location every 2 seconds.
- **Concise Place Information**: Fetches and displays only the Country and City name using OpenStreetMap's reverse geocoding API.
- **Location Caching**: Caches location names to reduce API requests when moving within a small area.
- **Minimap View Persistence**: Saves and restores the minimap's center and zoom level between sessions.
- **Advanced Error Handling**: Manages Nominatim API errors gracefully, showing status indicators and fallback messages.
- **Self-Recreating UI**: Automatically restores the minimap and location button if removed.
- **Improved Readability**: Enhanced styling for the information panel for better visibility.

## 🤔 How It Works
1.  **Initialization**: The script waits for the Street View iframe (detected dynamically by its `src`) to appear on the page before initializing the minimap and location button.
2.  **Minimap Creation**: A Leaflet map is embedded into the page, with controls for switching map layers and displaying location information. It includes a title bar.
3.  **Location Tracking**: The script extracts the user's latitude and longitude from the detected iframe URL and updates the minimap marker and view.
4.  **Reverse Geocoding & Caching**: The script fetches location details from OpenStreetMap's API, extracts the Country and City, and displays them. It caches these names based on proximity to reduce API calls. If API requests fail repeatedly, it shows an error status.
5.  **Minimap View Persistence**: When the minimap is closed (toggled off), its current center and zoom level are saved to `localStorage`. When reopened, these values are restored.
6.  **UI Restoration**: A MutationObserver ensures that the minimap and location button are recreated if removed.

## ⚒️ Installation
1.  Install a userscript manager like [Tampermonkey](https://www.tampermonkey.net/) or [Greasemonkey](https://www.greasespot.net/).
2.  Create a new userscript and paste the updated code.
3.  Save and enable the script.

## 😎 Usage
- Click the 🗺️ button to toggle the minimap.
- Drag the 🗺️ button to reposition the minimap.
- Use the layer control buttons to switch between map layers.
- The minimap info panel shows "Location: Country, City".
- The status dot (red/green/yellow) indicates connection/API status.

## 📄 License
This project is licensed under the MIT License.

> for educational and recreational purposes. Not officially affiliated with OpenGuessr.

## Acknowledgments
Created with ❤️ by CeresF3B

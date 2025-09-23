# 🌍 OpenGuessr Helper

[![License: GPL-3.0](https://img.shields.io/badge/License-GPL--3.0-green.svg)](LICENSE)

## 🔎 Overview
OpenGuessr Helper is a userscript designed to enhance the OpenGuessr experience by providing a robust minimap with real-time location tracking, multiple map layers, and a custom DivIcon marker. The script also includes self-recreating UI elements to ensure functionality even if elements are removed from the DOM.

## 🔥 Features
- **Minimap**: Displays the current location with a draggable and zoomable map.
- **Custom Marker**: Uses a CSS-based DivIcon for precise and visually appealing markers.
- **Layer Control**: Switch between Standard, Satellite, and Topographic map layers.
- **Real-Time Updates**: Tracks and updates the user's location every 2 seconds.
- **Place Information**: Fetches and displays the name of the current location using OpenStreetMap's reverse geocoding API.
- **Self-Recreating UI**: Automatically restores the minimap and location button if removed.

## 🤔 How It Works
1. **Initialization**: The script waits for the PanoramaIframe element to appear on the page before initializing the minimap and location button.
2. **Minimap Creation**: A Leaflet map is embedded into the page, with controls for switching map layers and displaying location information.
3. **Location Tracking**: The script extracts the user's latitude and longitude from the PanoramaIframe URL and updates the minimap marker and view.
4. **Reverse Geocoding**: The script fetches location details from OpenStreetMap's API and displays them in the minimap's info panel.
5. **UI Restoration**: A MutationObserver ensures that the minimap and location button are recreated if removed.

## ⚒️ Installation
1. Install a userscript manager like [Tampermonkey](https://www.tampermonkey.net/) or [Greasemonkey](https://www.greasespot.net/).
2. Create a new userscript and paste the code from `OpenGuessr_Helper.js`.
3. Save and enable the script.

## 😎 Usage
- Click the 🗺️ button to toggle the minimap.
- Drag the 🗺️ button to reposition the minimap.
- Use the layer control buttons to switch between map layers.

## 📄 License
This project is licensed under the MIT License.

> for educational and recreational purposes. Not officially affiliated with OpenGuessr.

## Acknowledgments
Created with ❤️ by CeresF3B


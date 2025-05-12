# OpenGuessr-Helper

[![License: GPL-3.0](https://img.shields.io/badge/License-GPL--3.0-green.svg)](LICENSE)

A userscript that enhances the gameplay experience on [OpenGuessr](https://openguessr.com/) by adding a “Show Location” button and an advanced, auto-updating minimap.

---

## 📋 Features

- **🔍 “Show Location” Button**  
  Adds a fixed button in the top-right corner that, with a single click, opens Google Maps at your current coordinates.

- **🗺️ Interactive Minimap**  
  - Real-time overlay showing your current position.  
  - Multiple map styles: **Standard**, **Satellite**, **Topographic**.  
  - Built-in zoom and scale controls.  
  - Minimize/restore functionality keeps a compact icon when not in use.

- **⏱️ Automatic Updates**  
  - Position refreshed every 2 seconds.  
  - Pauses updates when the browser tab is not visible to save resources.

- **🔄 Reliable Initialization**  
  - Continuously checks the DOM for the panorama iframe or Leaflet container.  
  - Fallback initialization after 5 seconds if needed.  
  - MutationObserver recreates button and minimap on page or mode changes.

- **🌐 Reverse Geocoding**  
  - Fetches and displays the place name via OpenStreetMap/Nominatim beneath the minimap.

---

## ⚙️ Installation

1. Install a userscript manager (e.g. [Tampermonkey](https://www.tampermonkey.net/) or [Violentmonkey](https://violentmonkey.github.io/)).  
2. Open the “Raw” view of `OpenGuessr-Helper.user.js` on GitHub or copy the script contents directly.  
3. Your userscript manager will detect and prompt you to install the script—confirm to proceed.  
4. Visit [OpenGuessr.com](https://openguessr.com/) and start playing; the script will activate automatically.

---

## 🚀 Usage

1. Start a game on OpenGuessr.  
2. A green **🔍 Show Location** button appears in the top-right corner.  
3. Click the button to:  
   - Open Google Maps in a new tab centered on your coordinates.  
   - Expand the minimap if it was minimized.  
4. Under the minimap, view your lat/lng (and, when available, the location name).  
5. Switch map style via the **Standard**, **Satellite**, or **Topographic** buttons.  
6. Click **−** to minimize the map into a clickable icon, **+** to restore.

---

## 🧩 Compatibility

- **Browsers**: Chrome, Firefox, Edge  
- **Userscript Managers**: Tampermonkey, Violentmonkey  
- **Domain**: `https://openguessr.com/*`

---

## 🤝 Contributing

Contributions, bug reports, and feature requests are welcome! Please open an issue or submit a pull request in the [Issues](https://github.com/your-username/OpenGuessr-Helper/issues) section.

---

## 📄 License

This project is licensed under the GPL-3.0 License. See the [LICENSE](LICENSE) file for details.

---

> for educational and recreational purposes. Not officially affiliated with OpenGuessr.*

## Acknowledgments
Created with ❤️ by CeresF3B


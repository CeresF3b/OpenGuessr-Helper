// ==UserScript==
// @name         OpenGuessr-Helper
// @namespace    https://openguessr.com/
// @version      1.6
// @description  A robust minimap for OpenGuessr featuring a custom DivIcon marker, world wrap functionality, and self-recreating UI elements. It provides real-time location tracking and multiple map layers.
// @author       CeresF3b
// @match        https://openguessr.com/*
// @grant        none
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    // Global variables to manage the minimap state and elements
    let minimapInstance = null; // Stores the Leaflet map instance
    let currentMarker = null;   // Stores the current position marker on the map
    let positionUpdateInterval = null; // Interval for periodically updating the player's position
    let lastPosition = null;    // Stores the last known position
    let userInteracting = false; // Flag to check if the user is currently interacting with the map (dragging, zooming)
    let isInitialized = false;  // Flag to ensure the script initializes only once

    // The custom marker icon will be defined after Leaflet is loaded.
    let customMarkerIcon = null;

    // Injects CSS styles into the document head to style the minimap and its controls
    function injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            :root {
                --primary-color: #007bff;
                --light-bg: #ffffff;
                --dark-bg: #252525;
                --light-text: #212529;
                --dark-text: #f8f9fa;
                --light-border: #dee2e6;
                --dark-border: #495057;
                --shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
            }
            [data-theme="dark"] {
                --primary-color: #00A86B;
                --light-bg: #2c2c2c;
                --dark-bg: #1a1a1a;
                --light-text: #f8f9fa;
                --dark-text: #f8f9fa;
                --light-border: #495057;
                --dark-border: #6c757d;
            }
            #mapWrapper {
                position: fixed;
                top: 90px;
                left: 20px;
                z-index: 10000;
                width: 420px;
                height: 340px;
                border-radius: 12px;
                background: var(--light-bg);
                box-shadow: var(--shadow);
                display: none;
                opacity: 0;
                transform: scale(0.95);
                transition: opacity 0.3s ease, transform 0.3s ease;
                overflow: hidden;
            }
            #mapWrapper.visible {
                display: block;
                opacity: 1;
                transform: scale(1);
            }
            #minimapContent {
                width: 100%;
                height: 100%;
                border-radius: 12px;
            }
            #minimapInfo {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                padding: 8px 12px;
                background: rgba(0, 0, 0, 0.7);
                color: var(--dark-text);
                font-size: 13px;
                white-space: nowrap;
                text-align: center;
                z-index: 1001;
                overflow: hidden;
                text-overflow: ellipsis;
                border-bottom-left-radius: 12px;
                border-bottom-right-radius: 12px;
            }
            #minimapLayerControl {
                position: absolute;
                top: 10px;
                left: 10px;
                z-index: 1001;
                display: flex;
                gap: 5px;
            }
            .layer-btn {
                background: var(--light-bg);
                color: var(--light-text);
                border: 1px solid var(--light-border);
                border-radius: 5px;
                padding: 5px 10px;
                cursor: pointer;
                font-size: 12px;
                transition: background-color 0.2s, color 0.2s;
            }
            .layer-btn.active, .layer-btn:hover {
                background: var(--primary-color);
                color: white;
                border-color: var(--primary-color);
            }
            #buttonWrapper {
                position: fixed;
                top: 80px;
                left: 20px;
                z-index: 10001;
                transition: transform 0.3s ease;
            }
            #locationButton {
                width: 50px;
                height: 50px;
                background: var(--primary-color);
                color: white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                box-shadow: var(--shadow);
                font-size: 24px;
                transition: background-color 0.3s, transform 0.2s ease;
            }
            #locationButton:hover {
                transform: scale(1.1);
            }
            .custom-map-marker div {
                background-color: var(--primary-color) !important;
                width: 16px !important;
                height: 16px !important;
                border-radius: 50% !important;
                border: 2px solid white !important;
                box-shadow: 0 0 5px rgba(0,0,0,0.6) !important;
            }
        `;
        document.head.appendChild(style);
    }

    // Checks if the dark theme is currently active based on the body's data-theme attribute
    function isDarkTheme() {
        return document.body.getAttribute('data-theme') === 'dark';
    }

    // Applies the theme (light/dark) based on the user's system preferences
    function applyTheme() {
        const useDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.body.setAttribute('data-theme', useDark ? 'dark' : 'light');
    }

    // Dynamically loads the Leaflet.js library and its CSS
    // Calls a callback function once Leaflet is loaded and ready
    async function loadLeaflet(callback) {
        if (window.L) {
            callback();
            return;
        }
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = callback;
        document.head.appendChild(script);
    }

    // Module to get the current geographical position from the game's iframe
    const PositionModule = (function() {
        let lastPos = null; // Stores the last retrieved position within this module

        // Extracts latitude and longitude from the PanoramaIframe's URL
        function _getCurrentPosition() {
            try {
                const iframe = document.querySelector('#PanoramaIframe');
                if (iframe && iframe.src) {
                    const url = new URL(iframe.src);
                    const loc = url.searchParams.get('location');
                    if (loc) {
                        const [lat, lng] = loc.split(',').map(Number);
                        if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
                    }
                }
            } catch (e) {}
            return null;
        }
        return {
            // Public method to get the current position, updates lastPos
            getCurrentPosition: function() { const p = _getCurrentPosition(); if (p) lastPos = p; return p; },
            // Public method to retrieve the last known position
            getLastPosition: function() { return lastPos; }
        };
    })();

    // Wrapper function to get the current position using the PositionModule
    function getCurrentPosition() { return PositionModule.getCurrentPosition(); }

    // Creates the main minimap container and its sub-elements (map content, info panel, layer control)
    function createMinimap() {
        if (document.getElementById('mapWrapper')) return;
        const wrapper = document.createElement('div');
        wrapper.id = 'mapWrapper';
        document.body.appendChild(wrapper);

        const mapContent = document.createElement('div');
        mapContent.id = 'minimapContent';
        wrapper.appendChild(mapContent);

        const infoPanel = document.createElement('div');
        infoPanel.id = 'minimapInfo';
        wrapper.appendChild(infoPanel);

        const layerControl = document.createElement('div');
        layerControl.id = 'minimapLayerControl';
        wrapper.appendChild(layerControl);

        loadLeaflet(() => initializeLeafletMap());
    }

    // Initializes the Leaflet map, sets up layers, and event listeners
    function initializeLeafletMap() {
        if (minimapInstance) return;

        // Defines a custom marker icon using a DivIcon for better styling control
        customMarkerIcon = L.divIcon({
            className: 'custom-map-marker',
            html: `<div></div>`,
            iconSize: [18, 18],
            iconAnchor: [9, 9]
        });

        // Initializes the Leaflet map with specific options and sets the initial view
        minimapInstance = L.map('minimapContent', { attributionControl: false, zoomControl: false, dragging: true, scrollWheelZoom: true, worldCopyJump: true, maxBoundsViscosity: 1.0 }).setView([0, 0], 2);

        // Event listeners to detect user interaction (dragging, zooming) with the map
        minimapInstance.on('mousedown', () => userInteracting = true);
        minimapInstance.on('mouseup', () => setTimeout(() => userInteracting = false, 100));
        minimapInstance.on('zoomstart', () => userInteracting = true);
        minimapInstance.on('zoomend', () => setTimeout(() => userInteracting = false, 100));

        // Defines different tile layers (Standard, Satellite, Topographic) for the minimap
        const layers = {
            'Standard': L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap contributors', noWrap: false }),
            'Satellite': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, attribution: '© Esri', noWrap: false }),
            'Topographic': L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', { maxZoom: 17, attribution: '© OpenTopoMap contributors', noWrap: false })
        };
        // Adds the default 'Standard' layer to the map
        layers['Standard'].addTo(minimapInstance);

        // Creates buttons for switching between different map layers
        const layerControl = document.getElementById('minimapLayerControl');
        Object.keys(layers).forEach(name => {
            const btn = document.createElement('button');
            btn.textContent = name;
            btn.className = 'layer-btn';
            if (name === 'Standard') {
                btn.classList.add('active');
            }
            btn.onclick = () => {
                // Removes all existing layers and adds the selected one
                Object.values(layers).forEach(l => { if (minimapInstance.hasLayer(l)) minimapInstance.removeLayer(l); });
                layers[name].addTo(minimapInstance);
                // Updates active state of layer buttons
                Array.from(layerControl.children).forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            };
            layerControl.appendChild(btn);
        });

        // Gets the initial position and updates the minimap
        const pos = getCurrentPosition();
        if (pos) updateMinimap(pos, true);
        // Starts the interval for continuous position updates
        startPositionUpdateInterval();
    }

    // Updates the marker position on the minimap and optionally centers the view
    function updateMinimap(position, setView = false) {
        if (!minimapInstance) return;
        lastPosition = position;
        if (currentMarker) {
            // Moves existing marker to new position
            currentMarker.setLatLng([position.lat, position.lng]);
        } else {
            // Creates a new marker if one doesn't exist
            currentMarker = L.marker([position.lat, position.lng], { icon: customMarkerIcon }).addTo(minimapInstance);
        }
        // Centers the map view on the marker if setView is true and user is not interacting
        if (setView && !userInteracting) {
            minimapInstance.setView([position.lat, position.lng], minimapInstance.getZoom() || 12);
        }
        // Updates the information panel with new position details
        updateInfoPanel(position);
    }

    // Fetches and displays location name based on coordinates using OpenStreetMap Nominatim API
    async function updateInfoPanel(position) {
        const info = document.getElementById('minimapInfo');
        if (!info) return;
        let placeName = 'Unknown';
        try {
            const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.lat}&lon=${position.lng}&zoom=18&addressdetails=1`;
            const res = await fetch(url);
            const data = await res.json();
            if (data && data.address) {
                const components = [data.address.road, data.address.suburb, data.address.city, data.address.town, data.address.village, data.address.county, data.address.state, data.address.country].filter(Boolean);
                placeName = [...new Set(components)].join(', ');
            } else {
                 placeName = data.display_name || 'No details found';
            }
        } catch (e) { console.error("Error fetching place name:", e); }
        info.innerHTML = `Lat: ${position.lat.toFixed(6)} | Lng: ${position.lng.toFixed(6)} | Place: ${placeName}`;
    }

    // Starts a recurring interval to check and update the player's position on the minimap
    function startPositionUpdateInterval() {
        if (positionUpdateInterval) clearInterval(positionUpdateInterval); // Clears any existing interval
        positionUpdateInterval = setInterval(() => {
            const pos = getCurrentPosition();
            // Updates minimap if position has changed
            if (pos && (!lastPosition || pos.lat !== lastPosition.lat || pos.lng !== lastPosition.lng)) {
                updateMinimap(pos, true);
            }
        }, 2000); // Checks every 2 seconds
    }

    // Creates a draggable button that toggles the visibility of the minimap
    function createLocationButton() {
        if (document.getElementById('buttonWrapper')) return;
        const wrapper = document.createElement('div');
        wrapper.id = 'buttonWrapper';
        document.body.appendChild(wrapper);

        const btn = document.createElement('div');
        btn.id = 'locationButton';
        btn.textContent = '🗺️'; // Map emoji icon
        wrapper.appendChild(btn);

        let startX, startY, isDragging = false, dragThreshold = 5;
        // Event listener for dragging the button
        btn.addEventListener('mousedown', e => {
            startX = e.clientX;
            startY = e.clientY;
            isDragging = false;
            const moveHandler = (e_move) => {
                if (startX === null) return;
                const dx = e_move.clientX - startX;
                const dy = e_move.clientY - startY;
                // Determines if dragging has started
                if (!isDragging && (Math.abs(dx) > dragThreshold || Math.abs(dy) > dragThreshold)) {
                    isDragging = true;
                }
                // Updates button and map wrapper position if dragging
                if (isDragging) {
                    wrapper.style.left = `${wrapper.offsetLeft + dx}px`;
                    wrapper.style.top = `${wrapper.offsetTop + dy}px`;
                    startX = e_move.clientX;
                    startY = e_move.clientY;
                    const map = document.getElementById('mapWrapper');
                    if (map) {
                        map.style.left = `${wrapper.offsetLeft}px`;
                        map.style.top = `${wrapper.offsetTop + 60}px`; // Positions map relative to button
                    }
                }
            };
            const upHandler = () => {
                document.removeEventListener('mousemove', moveHandler);
                document.removeEventListener('mouseup', upHandler);
                // If not dragging, toggle minimap visibility
                if (!isDragging) {
                    const map = document.getElementById('mapWrapper');
                    if (map) {
                        map.classList.toggle('visible'); // Toggles 'visible' class for CSS transitions
                        if (map.classList.contains('visible')) {
                            // Invalidates map size and centers view if minimap becomes visible
                            if (minimapInstance) {
                                minimapInstance.invalidateSize();
                                if (!userInteracting && lastPosition) {
                                    minimapInstance.setView([lastPosition.lat, lastPosition.lng], minimapInstance.getZoom() || 12);
                                }
                            }
                        }
                    }
                }
                startX = null;
                startY = null;
            };
            document.addEventListener('mousemove', moveHandler);
            document.addEventListener('mouseup', upHandler);
        });
    }

    // Main initialization function, called once the PanoramaIframe is detected
    function init() {
        if (isInitialized) return;
        isInitialized = true;
        console.log('OpenGuessr Helper: Initializing script...');
        applyTheme();          // Applies initial theme
        injectStyles();        // Injects CSS styles
        createLocationButton(); // Creates the minimap toggle button
        createMinimap();       // Creates and initializes the minimap
        setupObserver();       // Sets up mutation observer for UI elements
        // Observes body for data-theme changes to reapply styles
        new MutationObserver(() => applyTheme()).observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });
    }

    // Sets up a MutationObserver to detect if the minimap or button are removed from the DOM
    // If removed, it recreates them to ensure persistence
    function setupObserver() {
        const observer = new MutationObserver(() => {
            const panoramaExists = document.querySelector('#PanoramaIframe');
            if (panoramaExists) {
                // Recreate button if it's missing
                if (!document.getElementById('buttonWrapper')) {
                    console.log('OpenGuessr Helper: Button removed, recreating...');
                    createLocationButton();
                }
                // Recreate minimap if it's missing
                if (!document.getElementById('mapWrapper')) {
                    console.log('OpenGuessr Helper: Map removed, recreating...');
                    createMinimap();
                }
            }
        });
        // Observes the entire body for childList and subtree changes
        observer.observe(document.body, { childList: true, subtree: true });
    }

    // Periodically checks for the existence of the #PanoramaIframe
    // Once found, it clears the interval and calls the main initialization function
    const checkInterval = setInterval(() => {
        if (document.querySelector('#PanoramaIframe')) {
            clearInterval(checkInterval); // Stops checking once iframe is found
            init(); // Initializes the script
        }
    }, 500); // Checks every 500 milliseconds

})();

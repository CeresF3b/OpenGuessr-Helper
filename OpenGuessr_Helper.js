// ==UserScript==
// @name         OpenGuessr-Helper
// @namespace    https://openguessr.com/
// @version      1.4
// @description  Adds a button to show current location and an advanced minimap with automatic updates
// @author       CeresF3b
// @match        https://openguessr.com/*
// @grant        none
// @license MIT
// ==/UserScript==

(function() {
    'use strict';

    /**
     * Main script initialization
     * The script uses two methods to ensure proper initialization:
     * 1. Continuous checking for required elements
     * 2. Backup initialization after a timeout
     */
    
    // Wait for the page to load by checking for panorama iframe or leaflet container
    const checkInterval = setInterval(() => {
        if (document.querySelector('#PanoramaIframe') || document.querySelector('.leaflet-container')) {
            console.log('OpenGuessr Location Enhanced: Page loaded, initializing script...');
            clearInterval(checkInterval);
            initializeScript();
        }
    }, 1000);
    
    // Backup initialization after 5 seconds if normal detection fails
    setTimeout(() => {
        if ((document.querySelector('#PanoramaIframe') || document.querySelector('.leaflet-container')) && 
            !document.getElementById('openGuessrLocationButton')) {
            console.log('OpenGuessr Location Enhanced: Backup initialization...');
            initializeScript();
        }
    }, 5000);

    /**
     * Initialize the main script components
     * This function sets up all necessary elements and event listeners
     */
    function initializeScript() {
        // Create the "Show Location" button in the top-right corner
        createLocationButton();
        
        // Create the interactive minimap with multiple layer options
        createMinimap();
        
        // Set up an observer to monitor DOM changes and recreate elements when necessary
        setupObserver();
        
        // Listen for page visibility changes to manage update interval (save resources when tab is not visible)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // Page is hidden, pause position updates to save resources
                stopPositionUpdateInterval();
            } else {
                // Page is visible again, resume regular position updates
                startPositionUpdateInterval();
            }
        });
    }

    /**
     * Create and add the "Show Location" button to the page
     * This button allows users to view their current location on Google Maps
     */
    function createLocationButton() {
        // Check if button already exists to avoid duplicates
        const existing = document.querySelector('#openGuessrLocationButton');
        if (existing) return;

        // Create the button with appropriate styling
        const btn = document.createElement('button');
        btn.textContent = '🔍 Show Location';
        btn.id = 'openGuessrLocationButton';
        btn.style.position = 'fixed';
        btn.style.top = '20px';
        btn.style.right = '20px';
        btn.style.zIndex = '9999';
        btn.style.padding = '10px 15px';
        btn.style.backgroundColor = '#2c7'; // Green color for visibility
        btn.style.color = 'white';
        btn.style.border = 'none';
        btn.style.borderRadius = '5px';
        btn.style.cursor = 'pointer';
        btn.style.fontSize = '16px';
        btn.style.boxShadow = '0 2px 6px rgba(0,0,0,0.2)';

        // Add click event handler to show current position
        btn.onclick = showCurrentPosition;

        // Add button to document body
        document.body.appendChild(btn);
    }

    /**
     * Set up a MutationObserver to monitor DOM changes
     * This ensures our UI elements are recreated if they're removed during page navigation or updates
     */
    function setupObserver() {
        // Create observer to monitor DOM changes and recreate elements when necessary
        const observer = new MutationObserver(() => {
            // Check if panorama iframe exists but our button doesn't
            const iframe = document.querySelector('#PanoramaIframe');
            if (iframe && !document.querySelector('#openGuessrLocationButton')) {
                createLocationButton(); // Recreate button if needed
            }
            // Check if panorama iframe exists but our minimap doesn't
            if (iframe && !document.querySelector('#minimapContainer')) {
                createMinimap(); // Recreate minimap if needed
            }
        });

        // Start observing the entire document for changes
        observer.observe(document.body, {
            childList: true, // Watch for changes to the direct children
            subtree: true,   // Watch for changes in the entire subtree
        });
    }
    
    /**
     * Toggle minimap between normal and minimized states
     * This function handles the minimap's visibility states and animations
     */
    function toggleMinimap() {
        const minimapContainer = document.getElementById('minimapContainer');
        if (minimapContainer) {
            if (minimapContainer.classList.contains('minimized')) {
                // Restore from minimized state to full-size view
                minimapContainer.classList.remove('minimized');
                minimapContainer.classList.add('visible');
                
                // Update button icon to show minimize option
                const minimizeButton = document.getElementById('minimapToggleButton');
                if (minimizeButton) {
                    minimizeButton.innerHTML = '−'; // Minus sign for minimize
                    minimizeButton.title = 'Minimize map';
                }
            } else if (minimapContainer.classList.contains('visible')) {
                // Minimize the map to a small circular icon
                minimapContainer.classList.remove('visible');
                minimapContainer.classList.add('minimized');
                
                // Update button icon to show restore option
                const minimizeButton = document.getElementById('minimapToggleButton');
                if (minimizeButton) {
                    minimizeButton.innerHTML = '+';
                    minimizeButton.title = 'Restore map';
                }
            } else {
                // Show the map if it's hidden (initial state or after being hidden)
                minimapContainer.style.display = 'block';
                setTimeout(() => {
                    minimapContainer.classList.add('visible');
                }, 10); // Short delay to ensure CSS transition works properly
            }
        }
    }

    /**
     * Show the current position on Google Maps and update the minimap
     * This function is called when the user clicks the "Show Location" button
     */
    function showCurrentPosition() {
        console.log('Show Location button clicked');
        
        // Get current position using multiple detection methods
        const currentPosition = getCurrentPosition();
        
        // Alert the user if position cannot be determined
        if (!currentPosition) {
            alert('Unable to determine current position. Make sure a round is active.');
            return;
        }
        
        console.log('Position found:', currentPosition);
        
        // Open Google Maps in a new tab with the current coordinates
        const mapsUrl = `https://www.google.com/maps?q=${currentPosition.lat},${currentPosition.lng}`;
        window.open(mapsUrl, '_blank');
        
        // Update minimap marker position and ensure it's visible on the map
        updateMinimapMarker(currentPosition);
        
        // Show minimap if it's not already visible or restore it if minimized
        const minimapContainer = document.getElementById('minimapContainer');
        if (minimapContainer) {
            if (minimapContainer.classList.contains('minimized')) {
                // Restore from minimized state to full-size view
                minimapContainer.classList.remove('minimized');
                minimapContainer.classList.add('visible');
                
                // Update button icon to show minimize option
                const minimizeButton = document.getElementById('minimapToggleButton');
                if (minimizeButton) {
                    minimizeButton.innerHTML = '−'; // Minus sign for minimize
                    minimizeButton.title = 'Minimize map';
                }
            } else if (!minimapContainer.classList.contains('visible')) {
                // Make the minimap visible with a smooth animation
                minimapContainer.style.display = 'block';
                setTimeout(() => minimapContainer.classList.add('visible'), 10); // Short delay for CSS transition
            }
        }
    }

    /**
     * Get the current geographic position from various possible sources
     * This function tries multiple methods to find the current location coordinates
     * @returns {Object|null} Location object with lat and lng properties, or null if not found
     */
    function getCurrentPosition() {
        // Method 1: Look in iframe src attribute (original method from 'example' script)
        const iframe = document.querySelector('#PanoramaIframe');
        if (iframe) {
            const src = iframe.getAttribute('src');
            if (src) {
                try {
                    const url = new URL(src);
                    const location = url.searchParams.get('location');
                    if (location) {
                        // Format is typically "lat,lng"
                        const [lat, lng] = location.split(',').map(coord => parseFloat(coord));
                        if (!isNaN(lat) && !isNaN(lng)) {
                            return { lat, lng };
                        }
                    }
                } catch (err) {
                    console.error('Error parsing iframe URL:', err);
                }
            }
        }

        // Method 2: Look in panorama object
        try {
            for (const key in window) {
                if (window[key] && window[key].panorama && window[key].panorama.position) {
                    const position = window[key].panorama.position;
                    return { lat: position.lat, lng: position.lng };
                }
            }
        } catch (error) {
            console.error('Error searching panorama object:', error);
        }
        
        // Method 3: Look in data-lat and data-lng attributes
        try {
            const gameObjects = document.querySelectorAll('[data-lat], [data-lng]');
            if (gameObjects.length > 0) {
                const lat = parseFloat(gameObjects[0].getAttribute('data-lat'));
                const lng = parseFloat(gameObjects[0].getAttribute('data-lng'));
                if (!isNaN(lat) && !isNaN(lng)) {
                    return { lat, lng };
                }
            }
        } catch (error) {
            console.error('Error searching data attributes:', error);
        }

        // Method 4: Look in URL parameters
        try {
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.has('lat') && urlParams.has('lng')) {
                return {
                    lat: parseFloat(urlParams.get('lat')),
                    lng: parseFloat(urlParams.get('lng'))
                };
            }
            
            // Also look for location=lat,lng format in URL
            if (urlParams.has('location')) {
                const location = urlParams.get('location');
                const [lat, lng] = location.split(',').map(coord => parseFloat(coord));
                if (!isNaN(lat) && !isNaN(lng)) {
                    return { lat, lng };
                }
            }
        } catch (error) {
            console.error('Error searching URL parameters:', error);
        }

        // Method 5: Look for lat=X&lng=Y format in URL
        try {
            const match = window.location.href.match(/[?&]lat=([^&]+)&lng=([^&]+)/);
            if (match) {
                const lat = parseFloat(match[1]);
                const lng = parseFloat(match[2]);
                if (!isNaN(lat) && !isNaN(lng)) {
                    return { lat, lng };
                }
            }
        } catch (error) {
            console.error('Error searching URL pattern:', error);
        }

        // No position found
        return null;
    }
    
    // Minimap variables
    let minimapInstance = null;
    let currentMarker = null;
    let positionUpdateInterval = null;
    let lastPosition = null;
    
    // Add CSS styles for animations and minimized state
    function addStyles() {
        if (document.getElementById('openGuessrStyles')) return;
        
        const styleEl = document.createElement('style');
        styleEl.id = 'openGuessrStyles';
        styleEl.textContent = `
            #minimapContainer {
                opacity: 0;
                transform: scale(0.8);
                transition: opacity 0.3s ease-out, transform 0.3s ease-out, height 0.3s ease-out, width 0.3s ease-out;
                font-family: Arial, sans-serif;
            }
            #minimapContainer.visible {
                opacity: 1;
                transform: scale(1);
            }
            /* Styling for minimized minimap - improved with better visual appearance */
            #minimapContainer.minimized {
                height: 48px !important;
                width: 48px !important;
                overflow: hidden;
                opacity: 0.9;
                border-radius: 50%;
                border: 2px solid #2c7;
                background-color: rgba(255,255,255,0.9);
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                transform: scale(1) !important;
                transition: all 0.3s ease-out;
                /* Add map icon in minimized state */
                background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%232c7"><path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z"/></svg>');
                background-repeat: no-repeat;
                background-position: center;
                background-size: 24px;
            }
            #minimapContainer.minimized:hover {
                opacity: 1;
                transform: scale(1.05) !important;
                box-shadow: 0 3px 12px rgba(0,0,0,0.4);
            }
            /* Hide content when minimized but keep toggle button visible */
            #minimapContainer.minimized #minimapContent,
            #minimapContainer.minimized #minimapInfo,
            #minimapContainer.minimized #minimapLayerControl {
                opacity: 0;
            }
            /* Styling for the minimize/restore button */
            #minimapToggleButton {
                position: absolute;
                top: 5px;
                right: 5px;
                width: 20px;
                height: 20px;
                line-height: 18px;
                text-align: center;
                background-color: rgba(255,255,255,0.9);
                color: #333;
                border-radius: 50%;
                cursor: pointer;
                z-index: 10000;
                font-size: 12px;
                border: 1px solid rgba(0,0,0,0.1);
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                transition: all 0.2s ease;
            }
            #minimapToggleButton:hover {
                background-color: #2c7;
                color: white;
            }
            #minimapInfo {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                background-color: rgba(255,255,255,0.8);
                padding: 5px 10px;
                font-size: 12px;
                z-index: 9999;
                border-top: 1px solid #ccc;
                max-height: 60px;
                overflow-y: auto;
            }
            #minimapLayerControl {
                position: absolute;
                top: 5px;
                left: 5px;
                background-color: rgba(255,255,255,0.8);
                border-radius: 4px;
                padding: 2px;
                z-index: 9999;
                font-size: 12px;
            }
            .map-layer-button {
                margin: 2px;
                padding: 3px 6px;
                background-color: #fff;
                border: 1px solid #ccc;
                border-radius: 3px;
                cursor: pointer;
            }
            .map-layer-button.active {
                background-color: #2c7;
                color: white;
            }
            .leaflet-popup-content {
                font-size: 13px;
                line-height: 1.4;
            }
            .leaflet-popup-content b {
                color: #2c7;
            }
            .leaflet-control-zoom {
                margin-top: 30px !important;
            }
        `;
        document.head.appendChild(styleEl);
    }
    
    function createMinimap() {
        // Check if minimap already exists
        if (document.getElementById('minimapContainer')) return;
        
        // Add animation styles
        addStyles();
        
        // Get button position for alignment
        const button = document.getElementById('openGuessrLocationButton');
        const buttonRect = button ? button.getBoundingClientRect() : null;
        
        // Create minimap container
        const minimapContainer = document.createElement('div');
        minimapContainer.id = 'minimapContainer';
        minimapContainer.style.position = 'fixed';
        minimapContainer.style.top = buttonRect ? (buttonRect.bottom + 10) + 'px' : '80px';
        minimapContainer.style.right = '20px';
        minimapContainer.style.width = '400px'; // Increased width
        minimapContainer.style.height = '320px'; // Increased height
        minimapContainer.style.zIndex = '9998';
        minimapContainer.style.border = '2px solid #2c7';
        minimapContainer.style.borderRadius = '5px';
        minimapContainer.style.overflow = 'hidden';
        minimapContainer.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
        minimapContainer.style.display = 'block'; // Initially visible
        
        // Add minimize/restore button with tooltip
        const minimizeButton = document.createElement('div');
        minimizeButton.innerHTML = '−'; // Minus sign for minimize
        minimizeButton.id = 'minimapToggleButton';
        minimizeButton.title = 'Minimize map'; // English translation
        minimizeButton.onclick = toggleMinimap;
        minimapContainer.appendChild(minimizeButton);
        
        // Create info panel to display location details
        const infoPanel = document.createElement('div');
        infoPanel.id = 'minimapInfo';
        infoPanel.innerHTML = 'Loading information...'; // English translation
        minimapContainer.appendChild(infoPanel);
        
        // Create layer control panel
        const layerControl = document.createElement('div');
        layerControl.id = 'minimapLayerControl';
        minimapContainer.appendChild(layerControl);
        
        document.body.appendChild(minimapContainer);
        
        // Create minimap content div
        const minimapContent = document.createElement('div');
        minimapContent.id = 'minimapContent';
        minimapContent.style.width = '100%';
        minimapContent.style.height = '100%';
        minimapContainer.appendChild(minimapContent);
        
        // Load Leaflet if not already loaded
        if (!window.L) {
            console.log('Leaflet not found, loading...');
            loadLeaflet(() => {
                console.log('loadLeaflet callback executed');
                initializeLeafletMap();
                // Trigger animation after map is initialized
                setTimeout(() => {
                    minimapContainer.classList.add('visible');
                    console.log('Minimap made visible after Leaflet loading');
                }, 100);
            });
        } else {
            console.log('Leaflet already loaded, direct initialization');
            initializeLeafletMap();
            // Trigger animation
            setTimeout(() => {
                minimapContainer.classList.add('visible');
                console.log('Minimap made visible (Leaflet already loaded)');
            }, 100);
        }
        
        // Force minimap visibility after a short delay
        setTimeout(() => {
            if (minimapContainer && !minimapContainer.classList.contains('visible')) {
                console.log('Forcing minimap visibility');
                minimapContainer.style.display = 'block';
                minimapContainer.classList.add('visible');
            }
        }, 1000);
    }
    
    /**
     * Load Leaflet library dynamically
     * @param {Function} callback - Function to call after Leaflet is loaded
     */
    function loadLeaflet(callback) {
        console.log('Loading Leaflet...');
        
        // Load Leaflet CSS from CDN
        const leafletCSS = document.createElement('link');
        leafletCSS.rel = 'stylesheet';
        leafletCSS.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(leafletCSS);
        
        // Load Leaflet JavaScript from CDN
        const leafletScript = document.createElement('script');
        leafletScript.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        
        // Handle successful loading
        leafletScript.onload = function() {
            console.log('Leaflet loaded successfully');
            if (typeof L === 'undefined') {
                console.error('Error: Leaflet object is not available after loading');
                return;
            }
            callback(); // Execute callback when loaded
        };
        
        // Handle loading errors
        leafletScript.onerror = function() {
            console.error('Error loading Leaflet');
        };
        
        document.head.appendChild(leafletScript);
    }
    
    function initializeLeafletMap() {
        console.log('Initializing minimap with Leaflet...');
        try {
            // Initialize the minimap with Leaflet
            minimapInstance = L.map('minimapContent', {
                attributionControl: false,
                zoomControl: false,
                dragging: true,
                scrollWheelZoom: true
            }).setView([0, 0], 2);
            
            // Define multiple tile layers for different map styles
            const layers = {
                // Map layer options with different visualization styles
                'Standard': L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    maxZoom: 19,
                    attribution: '© OpenStreetMap contributors'
                }),
                'Satellite': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                    maxZoom: 19,
                    attribution: '© Esri'
                }),
                'Topographic': L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', { // English translation
                    maxZoom: 17,
                    attribution: '© OpenTopoMap contributors'
                }),
                'Roads': L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { // English translation
                    maxZoom: 19,
                    attribution: '© CARTO'
                })
            };
            
            // Add the default layer to the map
            layers['Standard'].addTo(minimapInstance);
            
            // Create layer control buttons
            const layerControl = document.getElementById('minimapLayerControl');
            Object.keys(layers).forEach(layerName => {
                const button = document.createElement('button');
                button.className = 'map-layer-button' + (layerName === 'Standard' ? ' active' : '');
                button.textContent = layerName;
                button.onclick = () => {
                    // Remove all layers
                    Object.values(layers).forEach(layer => {
                        if (minimapInstance.hasLayer(layer)) {
                            minimapInstance.removeLayer(layer);
                        }
                    });
                    // Add selected layer
                    layers[layerName].addTo(minimapInstance);
                    // Update active state
                    document.querySelectorAll('.map-layer-button').forEach(btn => {
                        btn.classList.remove('active');
                    });
                    button.classList.add('active');
                };
                layerControl.appendChild(button);
            });
            
            // Add zoom controls
            L.control.zoom({
                position: 'topright'
            }).addTo(minimapInstance);
            
            // Add scale control
            L.control.scale({
                imperial: false,
                position: 'bottomright'
            }).addTo(minimapInstance);
            
            // Try to get current position and update marker
            const position = getCurrentPosition();
            if (position) {
                console.log('Position found for minimap:', position);
                updateMinimapMarker(position);
                lastPosition = position;
            } else {
                console.log('No position found for minimap');
            }
            
            // Make sure the minimap is visible
            const minimapContainer = document.getElementById('minimapContainer');
            if (minimapContainer) {
                minimapContainer.classList.add('visible');
            }
            
            // Start position update interval
            startPositionUpdateInterval();
            
            console.log('Minimap initialized successfully');
        } catch (error) {
            console.error('Error initializing minimap:', error);
        }
    }
    
    function updateMinimapMarker(position) {
        // If minimap doesn't exist yet, create it
        if (!minimapInstance && window.L) {
            initializeLeafletMap();
        } else if (!minimapInstance) {
            createMinimap();
            return; // Will be called again after minimap is created
        }
        
        // Skip update if position hasn't changed
        if (lastPosition && 
            lastPosition.lat === position.lat && 
            lastPosition.lng === position.lng) {
            return;
        }
        
        // Update last position
        lastPosition = position;
        
        // Remove existing marker if any
        if (currentMarker) {
            minimapInstance.removeLayer(currentMarker);
        }
        
        // Create custom icon for better visibility
        const customIcon = L.divIcon({
            className: 'custom-map-marker',
            html: `<div style="background-color: #2c7; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5);"></div>`,
            iconSize: [18, 18],
            iconAnchor: [9, 9]
        });
        
        // Create new marker with custom icon
        currentMarker = L.marker([position.lat, position.lng], {
            icon: customIcon
        }).addTo(minimapInstance);
        
        // Add popup with coordinates and additional info
        currentMarker.bindPopup(`
            <b>La tua posizione</b><br>
            Lat: ${position.lat.toFixed(6)}<br>
            Lng: ${position.lng.toFixed(6)}<br>
        `);
        
        // Center map on marker with appropriate zoom level
        minimapInstance.setView([position.lat, position.lng], 12);
        
        // Update info panel with reverse geocoding if available
        updateLocationInfo(position);
        
        // Open popup
        currentMarker.openPopup();
    }
    
    // Function to update location information
    function updateLocationInfo(position) {
        const infoPanel = document.getElementById('minimapInfo');
        if (!infoPanel) return;
        
        // Update basic coordinates
        infoPanel.innerHTML = `<b>Posizione:</b> ${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`;
        
        // Try to get location name using Nominatim reverse geocoding
        try {
            const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.lat}&lon=${position.lng}&zoom=18&addressdetails=1`;
            
            // Create a unique callback name
            const callbackName = 'geocodeCallback_' + Math.floor(Math.random() * 1000000);
            
            // Add the callback function to window
            window[callbackName] = function(data) {
                if (data && data.display_name) {
                    let locationInfo = data.display_name;
                    
                    // Extract country and region for more concise display
                    if (data.address) {
                        const parts = [];
                        if (data.address.road) parts.push(data.address.road);
                        if (data.address.city || data.address.town || data.address.village) {
                            parts.push(data.address.city || data.address.town || data.address.village);
                        }
                        if (data.address.state || data.address.region) {
                            parts.push(data.address.state || data.address.region);
                        }
                        if (data.address.country) parts.push(data.address.country);
                        
                        if (parts.length > 0) {
                            locationInfo = parts.join(', ');
                        }
                    }
                    
                    infoPanel.innerHTML = `<b>Posizione:</b> ${locationInfo}<br><small>${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}</small>`;
                }
                
                // Clean up the callback
                delete window[callbackName];
            };
            
            // Create script element for JSONP request
            const script = document.createElement('script');
            script.src = `${nominatimUrl}&json_callback=${callbackName}`;
            document.head.appendChild(script);
            
            // Remove the script element after execution
            script.onload = function() {
                document.head.removeChild(script);
            };
        } catch (error) {
            console.error('Error getting location info:', error);
        }
    }
    
    // Function to start position update interval
    function startPositionUpdateInterval() {
        // Clear any existing interval
        if (positionUpdateInterval) {
            clearInterval(positionUpdateInterval);
        }
        
        // Set up interval to check for position changes
        positionUpdateInterval = setInterval(() => {
            const position = getCurrentPosition();
            if (position) {
                updateMinimapMarker(position);
            }
        }, 2000); // Check every 2 seconds
    }
    
    // Function to stop position update interval
    function stopPositionUpdateInterval() {
        if (positionUpdateInterval) {
            clearInterval(positionUpdateInterval);
            positionUpdateInterval = null;
        }
    }
})();

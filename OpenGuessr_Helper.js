// ==UserScript==
// @name         OpenGuessr-Helper
// @namespace    https://openguessr.com/
// @version      1.5
// @description  A robust minimap for OpenGuessr featuring a custom DivIcon marker, world wrap functionality, and self-recreating UI elements. It provides real-time location tracking and multiple map layers.
// @author       CeresF3b
// @match        https://openguessr.com/*
// @grant        none
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    let minimapInstance = null;
    let currentMarker = null;
    let positionUpdateInterval = null;
    let lastPosition = null;
    let userInteracting = false;
    let isInitialized = false;

    // The custom marker icon will be defined after Leaflet is loaded.
    let customMarkerIcon = null;

    function isDarkTheme() {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    function getControlButtonStyle() {
        const dark = isDarkTheme();
        return `background:${dark?'#333':'#fff'};color:${dark?'#fff':'#000'};border:1px solid ${dark?'#555':'#ccc'};border-radius:3px;padding:3px 6px;margin:2px;cursor:pointer;font-size:12px;`;
    }

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

    const PositionModule = (function() {
        let lastPos = null;
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
            getCurrentPosition: function() { const p = _getCurrentPosition(); if (p) lastPos = p; return p; },
            getLastPosition: function() { return lastPos; }
        };
    })();

    function getCurrentPosition() { return PositionModule.getCurrentPosition(); }

    function createMinimap() {
        if (document.getElementById('mapWrapper')) return;
        const wrapper = document.createElement('div');
        wrapper.id = 'mapWrapper';
        Object.assign(wrapper.style, { position: 'fixed', top: '80px', left: '20px', zIndex: '9999', width: '400px', height: '320px', border: '2px solid #2c7', borderRadius: '5px', background: 'rgba(255,255,255,0.9)', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', display: 'none', transition: 'opacity 0.3s, transform 0.3s' });
        document.body.appendChild(wrapper);

        const mapContent = document.createElement('div');
        mapContent.id = 'minimapContent';
        mapContent.style.cssText = 'width:100%; height:100%;';
        wrapper.appendChild(mapContent);

        const infoPanel = document.createElement('div');
        infoPanel.id = 'minimapInfo';
        Object.assign(infoPanel.style, { position: 'absolute', bottom: '0', left: '0', right: '0', padding: '5px 10px', background: 'rgba(0,0,0,0.8)', color: '#fff', fontSize: '12px', whiteSpace: 'nowrap', textAlign: 'center', zIndex: '1000', overflow: 'hidden', textOverflow: 'ellipsis' });
        wrapper.appendChild(infoPanel);

        const layerControl = document.createElement('div');
        layerControl.id = 'minimapLayerControl';
        Object.assign(layerControl.style, { position: 'absolute', top: '5px', left: '5px', zIndex: '1000' });
        wrapper.appendChild(layerControl);

        loadLeaflet(() => initializeLeafletMap());
    }

    function initializeLeafletMap() {
        if (minimapInstance) return;

        // --- FIX: Using your custom divIcon for a reliable, CSS-based marker ---
        customMarkerIcon = L.divIcon({
            className: 'custom-map-marker',
            html: `<div style="background-color: #2c7; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5);"></div>`,
            iconSize: [18, 18],
            iconAnchor: [9, 9]
        });

        minimapInstance = L.map('minimapContent', { attributionControl: false, zoomControl: false, dragging: true, scrollWheelZoom: true, worldCopyJump: false, maxBoundsViscosity: 1.0 }).setView([0, 0], 2);

        minimapInstance.on('mousedown', () => userInteracting = true);
        minimapInstance.on('mouseup', () => setTimeout(() => userInteracting = false, 100));
        minimapInstance.on('zoomstart', () => userInteracting = true);
        minimapInstance.on('zoomend', () => setTimeout(() => userInteracting = false, 100));

        const layers = {
            'Standard': L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap contributors', noWrap: false }),
            'Satellite': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, attribution: '© Esri', noWrap: false }),
            'Topographic': L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', { maxZoom: 17, attribution: '© OpenTopoMap contributors', noWrap: false })
        };
        layers['Standard'].addTo(minimapInstance);

        const layerControl = document.getElementById('minimapLayerControl');
        Object.keys(layers).forEach(name => {
            const btn = document.createElement('button');
            btn.textContent = name;
            btn.style.cssText = getControlButtonStyle();
            if (name === 'Standard') { Object.assign(btn.style, { background: '#2c7', color: '#fff' }); }
            btn.onclick = () => {
                Object.values(layers).forEach(l => { if (minimapInstance.hasLayer(l)) minimapInstance.removeLayer(l); });
                layers[name].addTo(minimapInstance);
                Array.from(layerControl.children).forEach(b => { b.style.cssText = getControlButtonStyle(); });
                Object.assign(btn.style, { background: '#2c7', color: '#fff' });
            };
            layerControl.appendChild(btn);
        });

        const pos = getCurrentPosition();
        if (pos) updateMinimap(pos, true);
        startPositionUpdateInterval();
    }

    function updateMinimap(position, setView = false) {
        if (!minimapInstance) return;
        lastPosition = position;
        if (currentMarker) {
            currentMarker.setLatLng([position.lat, position.lng]);
        } else {
            // The script will now use the correct customMarkerIcon defined above
            currentMarker = L.marker([position.lat, position.lng], { icon: customMarkerIcon }).addTo(minimapInstance);
        }
        if (setView && !userInteracting) {
            minimapInstance.setView([position.lat, position.lng], 12);
        }
        updateInfoPanel(position);
    }

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

    function startPositionUpdateInterval() {
        if (positionUpdateInterval) clearInterval(positionUpdateInterval);
        positionUpdateInterval = setInterval(() => {
            const pos = getCurrentPosition();
            if (pos && (!lastPosition || pos.lat !== lastPosition.lat || pos.lng !== lastPosition.lng)) {
                updateMinimap(pos, false);
            }
        }, 2000);
    }

    function createLocationButton() {
        if (document.getElementById('buttonWrapper')) return;
        const wrapper = document.createElement('div');
        wrapper.id = 'buttonWrapper';
        Object.assign(wrapper.style, { position: 'fixed', top: '80px', left: '20px', zIndex: '10000' });
        document.body.appendChild(wrapper);

        const btn = document.createElement('div');
        btn.id = 'locationButton';
        btn.textContent = '📍';
        Object.assign(btn.style, { width: '40px', height: '40px', background: 'rgba(44,119,77,0.8)', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.3)', fontSize: '20px' });
        wrapper.appendChild(btn);

        let startX, startY, isDragging = false, dragThreshold = 5;
        btn.addEventListener('mousedown', e => {
            startX = e.clientX;
            startY = e.clientY;
            isDragging = false;
            const moveHandler = (e_move) => {
                if (startX === null) return;
                const dx = e_move.clientX - startX;
                const dy = e_move.clientY - startY;
                if (!isDragging && (Math.abs(dx) + Math.abs(dy) > dragThreshold)) isDragging = true;
                if (isDragging) {
                    wrapper.style.left = `${wrapper.offsetLeft + dx}px`;
                    wrapper.style.top = `${wrapper.offsetTop + dy}px`;
                    startX = e_move.clientX;
                    startY = e_move.clientY;
                    const map = document.getElementById('mapWrapper');
                    if (map) {
                        map.style.left = `${wrapper.offsetLeft}px`;
                        map.style.top = `${wrapper.offsetTop + 50}px`;
                    }
                }
            };
            const upHandler = () => {
                document.removeEventListener('mousemove', moveHandler);
                document.removeEventListener('mouseup', upHandler);
                if (!isDragging) {
                    const map = document.getElementById('mapWrapper');
                    if (map) {
                        if (map.style.display === 'block') {
                            map.style.display = 'none';
                        } else {
                            map.style.display = 'block';
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

    function init() {
        if (isInitialized) return;
        isInitialized = true;
        console.log('OpenGuessr Helper: Initializing script...');
        createLocationButton();
        createMinimap();
        setupObserver();
    }

    function setupObserver() {
        const observer = new MutationObserver(() => {
            const panoramaExists = document.querySelector('#PanoramaIframe');
            if (panoramaExists) {
                if (!document.getElementById('buttonWrapper')) {
                    console.log('OpenGuessr Helper: Button removed, recreating...');
                    createLocationButton();
                }
                if (!document.getElementById('mapWrapper')) {
                    console.log('OpenGuessr Helper: Map removed, recreating...');
                    createMinimap();
                }
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    const checkInterval = setInterval(() => {
        if (document.querySelector('#PanoramaIframe')) {
            clearInterval(checkInterval);
            init();
        }
    }, 500);

})();

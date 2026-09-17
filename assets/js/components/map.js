import { PLACES } from '../data/places.js';
import { DISTRICTS } from '../data/districts.js';

let mapInstance = null;
let markersGroup = null;

export function initInteractiveMap(containerId, filteredPlaces = PLACES, onSelectPlace, lang = 'th') {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!window.L) {
    container.innerHTML = '<div class="h-full flex items-center justify-center p-6 text-center text-sm text-slate-600">ไม่สามารถโหลดแผนที่ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตแล้วลองใหม่</div>';
    return;
  }

  // Clear existing map instance if re-initializing
  if (mapInstance) {
    mapInstance.remove();
    mapInstance = null;
  }

  // Default center around Chonburi (13.25, 100.95)
  mapInstance = L.map(containerId, {
    center: [13.25, 100.95],
    zoom: 10,
    zoomControl: false
  });

  // Add zoom control top right
  L.control.zoom({ position: 'topright' }).addTo(mapInstance);

  // Add OpenStreetMap Tile Layer with clean styling
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
    maxZoom: 18
  }).addTo(mapInstance);

  markersGroup = L.layerGroup().addTo(mapInstance);

  renderMapMarkers(filteredPlaces, onSelectPlace, lang);
}

export function renderMapMarkers(places, onSelectPlace, lang = 'th') {
  if (!mapInstance || !markersGroup) return;

  markersGroup.clearLayers();

  if (!places || places.length === 0) return;

  const bounds = [];

  places.forEach(place => {
    if (typeof place.lat !== 'number' || typeof place.lng !== 'number') return;

    bounds.push([place.lat, place.lng]);

    // Icon mapping by category
    let iconSymbol = '📍';
    if (place.category === 'sea') iconSymbol = '🏖️';
    else if (place.category === 'nature') iconSymbol = '🌿';
    else if (place.category === 'cafe') iconSymbol = '☕';
    else if (place.category === 'restaurant') iconSymbol = '🍜';
    else if (place.category === 'hotel') iconSymbol = '🏨';
    else if (place.category === 'history') iconSymbol = '🏛️';
    else if (place.category === 'photo') iconSymbol = '📸';
    else if (place.category === 'shopping') iconSymbol = '🛍️';

    const isEn = lang === 'en' || document.documentElement.lang === 'en';
    const placeName = isEn ? (place.nameEn || place.nameTh) : place.nameTh;
    const customIcon = L.divIcon({
      className: 'custom-leaflet-pin',
      html: `<div class="custom-map-pin" title="${placeName}">${iconSymbol}</div>`,
      iconSize: [38, 38],
      iconAnchor: [19, 19]
    });

    const marker = L.marker([place.lat, place.lng], { icon: customIcon });

    const districtObj = DISTRICTS.find(d => d.id === place.districtId);
    const districtName = districtObj ? (isEn ? (districtObj.nameEn || 'Chonburi') : districtObj.nameTh) : (isEn ? 'Chonburi' : 'ชลบุรี');

    const popupHtml = `
      <div class="p-3 text-slate-800">
        <img src="${place.cover}" alt="${placeName}" class="w-full h-28 object-cover rounded-lg mb-2">
        <div class="text-xs font-semibold text-[#00A8C6] mb-0.5">${districtName}</div>
        <h4 class="font-bold text-sm text-[#172B3A] line-clamp-1">${placeName}</h4>
        <p class="text-xs text-slate-500 line-clamp-2 mt-1 mb-2">${isEn ? (place.shortDescEn || place.shortDesc) : place.shortDesc}</p>
        <button id="map-popup-btn-${place.id}" class="w-full py-1.5 bg-[#006B9E] hover:bg-[#005680] text-white text-xs font-semibold rounded-lg transition-colors shadow-sm">
          ${isEn ? 'View details' : 'ดูรายละเอียด'} →
        </button>
      </div>
    `;

    marker.bindPopup(popupHtml);

    marker.on('popupopen', () => {
      const btn = document.getElementById(`map-popup-btn-${place.id}`);
      if (btn) {
        btn.addEventListener('click', () => {
          if (onSelectPlace) onSelectPlace(place.id);
        });
      }
    });

    markersGroup.addLayer(marker);
  });

  if (bounds.length > 0) {
    mapInstance.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
  }
}

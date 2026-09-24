import { PLACES } from '../data/places.js';
import { DISTRICTS } from '../data/districts.js';
import { GOOGLE_MAPS_LINKS } from '../data/googleMaps.js';

let mapInstance = null;
let markersGroup = null;

function getGoogleMapsUrl(place) {
  return GOOGLE_MAPS_LINKS[place.id] || place.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.nameTh}, ชลบุรี`)}`;
}

function showMapError(container, message) {
  container.innerHTML = `<div class="h-full flex items-center justify-center p-6 text-center text-sm text-slate-600 bg-slate-100">${message}</div>`;
}

function buildPopupContent(place, lang, onSelectPlace) {
  const isEn = lang === 'en' || document.documentElement.lang === 'en';
  const placeName = isEn ? (place.nameEn || place.nameTh) : place.nameTh;
  const districtObj = DISTRICTS.find(d => d.id === place.districtId);
  const districtName = districtObj ? (isEn ? districtObj.nameEn : districtObj.nameTh) : 'ชลบุรี';
  const detailsUrl = getGoogleMapsUrl(place);

  const wrapper = document.createElement('div');
  wrapper.className = 'p-2 text-slate-800 max-w-[260px]';
  wrapper.innerHTML = `
    <img src="${place.cover}" alt="${placeName}" class="w-full h-28 object-cover rounded-lg mb-2">
    <div class="text-[10px] font-semibold text-[#00A8C6] mb-1">${districtName}</div>
    <h4 class="font-bold text-sm text-[#172B3A]">${placeName}</h4>
    <p class="text-[11px] text-slate-500 mt-1 mb-2">${isEn ? (place.shortDescEn || place.shortDesc) : place.shortDesc}</p>
    <button class="details-button w-full py-1.5 bg-[#006B9E] text-white text-[11px] font-semibold rounded-lg">${isEn ? 'View details' : 'ดูรายละเอียด'} →</button>
    <a href="${detailsUrl}" target="_blank" rel="noopener noreferrer" class="block mt-2 text-center text-[11px] font-semibold text-[#006B9E] hover:underline">${isEn ? 'Open in Google Maps' : 'เปิดใน Google Maps'} ↗</a>
  `;

  const button = wrapper.querySelector('.details-button');
  if (button) {
    button.addEventListener('click', () => {
      if (onSelectPlace) onSelectPlace(place.id);
    });
  }

  return wrapper;
}

export function initInteractiveMap(containerId, filteredPlaces = PLACES, onSelectPlace, lang = 'th') {
  const container = document.getElementById(containerId);
  if (!container) return;

  mapInstance = null;
  markersGroup = null;

  try {
    mapInstance = L.map(container, {
      zoomControl: true,
      attributionControl: true,
      scrollWheelZoom: true,
      preferCanvas: true
    }).setView([13.15, 101.05], 9);

    const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    });

    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri',
      maxZoom: 19
    });

    streetLayer.addTo(mapInstance);
    L.control.layers({
      'แผนที่ถนน': streetLayer,
      'ภาพดาวเทียม': satelliteLayer
    }, null, { position: 'topright', collapsed: false }).addTo(mapInstance);

    markersGroup = L.layerGroup().addTo(mapInstance);
    renderMapMarkers(filteredPlaces, onSelectPlace, lang);
  } catch (error) {
    console.error('Map init failed:', error);
    showMapError(container, lang === 'en'
      ? 'The map could not be loaded. Please refresh the page.'
      : 'ไม่สามารถโหลดแผนที่ได้ กรุณารีเฟรชหน้าใหม่');
  }
}

export function renderMapMarkers(places, onSelectPlace, lang = 'th') {
  if (!mapInstance || !markersGroup) return;

  markersGroup.clearLayers();
  if (!places?.length) return;

  const validPlaces = places.filter(place => Number.isFinite(place.lat) && Number.isFinite(place.lng));
  if (!validPlaces.length) return;

  const bounds = L.latLngBounds(validPlaces.map(place => [place.lat, place.lng]));

  validPlaces.forEach(place => {
    const marker = L.marker([place.lat, place.lng], { title: place.nameTh });
    marker.bindPopup(buildPopupContent(place, lang, onSelectPlace), { maxWidth: 280 });
    marker.addTo(markersGroup);
  });

  mapInstance.fitBounds(bounds, { padding: [30, 30] });
  if (validPlaces.length === 1) {
    mapInstance.setView([validPlaces[0].lat, validPlaces[0].lng], 15);
  }
}


import { PLACES } from '../data/places.js';
import { DISTRICTS } from '../data/districts.js';
import { GOOGLE_MAPS_LINKS } from '../data/googleMaps.js';

let mapInstance = null;
let markersGroup = null;

// Dataset coordinates were previously populated with sample/district values.
// Never show such a value as if it were the exact position of a venue.
function hasVerifiedCoordinates(place) {
  return place?.coordinatesVerified === true
    && Number.isFinite(place.lat)
    && Number.isFinite(place.lng);
}

function getGoogleMapsUrl(place) {
  return GOOGLE_MAPS_LINKS[place.id] || place.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.nameTh}, ชลบุรี`)}`;
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function initInteractiveMap(containerId, filteredPlaces = PLACES, onSelectPlace, lang = 'th') {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!window.L) {
    container.innerHTML = '<div class="h-full flex items-center justify-center p-6 text-center text-sm text-slate-600">ไม่สามารถโหลดแผนที่ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตแล้วลองใหม่</div>';
    return;
  }

  if (mapInstance) {
    mapInstance.remove();
    mapInstance = null;
    markersGroup = null;
  }

  mapInstance = L.map(containerId, {
    center: [13.15, 101.05],
    zoom: 9,
    zoomControl: false
  });

  L.control.zoom({ position: 'topright' }).addTo(mapInstance);

  const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
    maxZoom: 19
  });
  const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri',
    maxZoom: 19
  });

  streetLayer.addTo(mapInstance);
  L.control.layers({ 'แผนที่ถนน': streetLayer, 'ภาพดาวเทียม': satelliteLayer }, null, { position: 'topright' }).addTo(mapInstance);
  markersGroup = L.layerGroup().addTo(mapInstance);

  renderMapMarkers(filteredPlaces, onSelectPlace, lang);
}

export function renderMapMarkers(places, onSelectPlace, lang = 'th') {
  if (!mapInstance || !markersGroup) return;

  markersGroup.clearLayers();
  if (!places?.length) return;

  const bounds = [];
  const isEn = lang === 'en' || document.documentElement.lang === 'en';
  const exactPlaces = places.filter(hasVerifiedCoordinates);

  exactPlaces.forEach(place => {

    const placeName = isEn ? (place.nameEn || place.nameTh) : place.nameTh;
    const district = DISTRICTS.find(item => item.id === place.districtId);
    const districtName = district ? (isEn ? district.nameEn : district.nameTh) : 'ชลบุรี';
    const mapsUrl = getGoogleMapsUrl(place);
    const safeName = escapeHtml(placeName);
    const safeCover = escapeHtml(place.cover);
    const safeDescription = escapeHtml(isEn ? (place.shortDescEn || place.shortDesc) : place.shortDesc);

    const icon = L.divIcon({
      className: 'custom-leaflet-pin',
      html: `<div class="custom-map-pin" title="${safeName}">📍</div>`,
      iconSize: [38, 38],
      iconAnchor: [19, 19]
    });

    const marker = L.marker([place.lat, place.lng], { icon });
    marker.bindPopup(`
      <div class="p-3 text-slate-800">
        <img src="${safeCover}" alt="${safeName}" class="w-full h-28 object-cover rounded-lg mb-2">
        <div class="text-xs font-semibold text-[#00A8C6] mb-0.5">${escapeHtml(districtName)}</div>
        <h4 class="font-bold text-sm text-[#172B3A]">${safeName}</h4>
        <p class="text-xs text-slate-500 mt-1 mb-2">${safeDescription}</p>
        <button id="map-popup-btn-${place.id}" class="w-full py-1.5 bg-[#006B9E] hover:bg-[#005680] text-white text-xs font-semibold rounded-lg">${isEn ? 'View details' : 'ดูรายละเอียด'} →</button>
        <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" class="block mt-2 text-center text-xs font-semibold text-[#006B9E] hover:underline">${isEn ? 'Open in Google Maps' : 'เปิดใน Google Maps'} ↗</a>
      </div>
    `);

    marker.on('popupopen', () => {
      const button = document.getElementById(`map-popup-btn-${place.id}`);
      if (button) button.addEventListener('click', () => onSelectPlace?.(place.id));
    });

    markersGroup.addLayer(marker);
    bounds.push([place.lat, place.lng]);
  });

  // Until individual coordinates are checked, show one clearly labelled
  // district reference point. Venue links continue to open their actual
  // Google Maps record instead of pretending a generated coordinate is exact.
  if (!exactPlaces.length) {
    const placesByDistrict = new Map();
    places.forEach(place => {
      if (!placesByDistrict.has(place.districtId)) placesByDistrict.set(place.districtId, []);
      placesByDistrict.get(place.districtId).push(place);
    });

    placesByDistrict.forEach((districtPlaces, districtId) => {
      const district = DISTRICTS.find(item => item.id === districtId);
      if (!district || !Number.isFinite(district.lat) || !Number.isFinite(district.lng)) return;

      const districtName = isEn ? district.nameEn : district.nameTh;
      const preview = districtPlaces.slice(0, 4).map(place => {
        const name = escapeHtml(isEn ? (place.nameEn || place.nameTh) : place.nameTh);
        const mapsUrl = escapeHtml(getGoogleMapsUrl(place));
        return `<li><a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" class="text-[#006B9E] hover:underline">${name} ↗</a></li>`;
      }).join('');
      const remaining = districtPlaces.length - Math.min(districtPlaces.length, 4);
      const icon = L.divIcon({
        className: 'custom-leaflet-pin',
        html: `<div class="custom-map-pin" title="${escapeHtml(districtName)}">🧭</div>`,
        iconSize: [38, 38],
        iconAnchor: [19, 19]
      });

      L.marker([district.lat, district.lng], { icon })
        .bindPopup(`
          <div class="p-3 text-slate-800">
            <div class="text-xs font-semibold text-[#00A8C6] mb-1">${escapeHtml(isEn ? 'District reference point' : 'จุดอ้างอิงระดับอำเภอ')}</div>
            <h4 class="font-bold text-sm text-[#172B3A]">${escapeHtml(districtName)}</h4>
            <p class="text-xs text-slate-500 mt-1 mb-2">${escapeHtml(isEn ? 'This is not an exact venue pin. Open a venue below for its confirmed Google Maps location.' : 'หมุดนี้ไม่ใช่ตำแหน่งสถานที่จริง กรุณาเปิด Google Maps ของสถานที่ด้านล่างเพื่อดูตำแหน่งที่ยืนยันแล้ว')}</p>
            <ul class="text-xs space-y-1">${preview}</ul>
            ${remaining > 0 ? `<p class="text-xs text-slate-400 mt-2">${isEn ? `and ${remaining} more places` : `และอีก ${remaining} สถานที่`}</p>` : ''}
          </div>
        `)
        .addTo(markersGroup);
      bounds.push([district.lat, district.lng]);
    });
  }

  if (bounds.length) mapInstance.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
}

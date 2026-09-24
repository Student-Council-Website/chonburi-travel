import { PLACES } from '../data/places.js';
import { DISTRICTS } from '../data/districts.js';
import { GOOGLE_MAPS_LINKS } from '../data/googleMaps.js';

let mapInstance = null;
let markersGroup = null;
let placesService = null;
let googleLoadPromise = null;
const resolvedPlaces = new Map();

function loadGoogleMaps() {
  if (window.google?.maps?.places) return Promise.resolve();
  if (googleLoadPromise) return googleLoadPromise;

  const apiKey = window.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return Promise.reject(new Error('Missing Google Maps API key'));

  googleLoadPromise = new Promise((resolve, reject) => {
    const callbackName = '__chonburiGoogleMapsReady';
    window[callbackName] = () => {
      delete window[callbackName];
      resolve();
    };

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error('Google Maps failed to load'));
    document.head.appendChild(script);
  });

  return googleLoadPromise;
}

function getSearchText(place) {
  return `${place.nameTh}, ${place.address || place.district}, ชลบุรี`;
}

function getGoogleMapsUrl(place) {
  return GOOGLE_MAPS_LINKS[place.id] || place.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.nameTh}, ชลบุรี`)}`;
}

function resolvePlace(place) {
  if (resolvedPlaces.has(place.id)) return Promise.resolve(resolvedPlaces.get(place.id));

  return new Promise(resolve => {
    placesService.findPlaceFromQuery({
      query: getSearchText(place),
      fields: ['name', 'geometry', 'place_id', 'url']
    }, (results, status) => {
      const result = status === google.maps.places.PlacesServiceStatus.OK && results?.[0];
      if (!result?.geometry?.location) {
        resolve(null);
        return;
      }

      const resolved = {
        ...place,
        lat: result.geometry.location.lat(),
        lng: result.geometry.location.lng(),
        googleName: result.name,
        googlePlaceId: result.place_id,
        mapsUrl: getGoogleMapsUrl(place)
      };
      resolvedPlaces.set(place.id, resolved);
      resolve(resolved);
    });
  });
}

function showMapError(container, message) {
  container.innerHTML = `<div class="h-full flex items-center justify-center p-6 text-center text-sm text-slate-600 bg-slate-100">${message}</div>`;
}

export function initInteractiveMap(containerId, filteredPlaces = PLACES, onSelectPlace, lang = 'th') {
  const container = document.getElementById(containerId);
  if (!container) return;

  mapInstance = null;
  markersGroup = null;
  placesService = null;

  loadGoogleMaps().then(() => {
    mapInstance = new google.maps.Map(container, {
      center: { lat: 13.15, lng: 101.05 },
      zoom: 9,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true
    });
    placesService = new google.maps.places.PlacesService(mapInstance);
    markersGroup = [];
    renderMapMarkers(filteredPlaces, onSelectPlace, lang);
  }).catch(() => {
    showMapError(container, lang === 'en'
      ? 'Add a Google Maps API key to load real Google Maps locations.'
      : 'กรุณาเพิ่ม Google Maps API Key เพื่อโหลดแผนที่และตำแหน่งจริงจาก Google Maps');
  });
}

function buildInfoWindowContent(place, lang, onSelectPlace) {
  const isEn = lang === 'en' || document.documentElement.lang === 'en';
  const placeName = isEn ? (place.nameEn || place.nameTh) : place.nameTh;
  const districtObj = DISTRICTS.find(d => d.id === place.districtId);
  const districtName = districtObj ? (isEn ? districtObj.nameEn : districtObj.nameTh) : 'ชลบุรี';
  const detailsUrl = getGoogleMapsUrl(place);

  const wrapper = document.createElement('div');
  wrapper.className = 'p-3 text-slate-800 max-w-[260px]';
  wrapper.innerHTML = `
    <img src="${place.cover}" alt="${placeName}" class="w-full h-28 object-cover rounded-lg mb-2">
    <div class="text-xs font-semibold text-[#00A8C6] mb-0.5">${districtName}</div>
    <h4 class="font-bold text-sm text-[#172B3A]">${placeName}</h4>
    <p class="text-xs text-slate-500 mt-1 mb-2">${isEn ? (place.shortDescEn || place.shortDesc) : place.shortDesc}</p>
    <button class="details-button w-full py-1.5 bg-[#006B9E] text-white text-xs font-semibold rounded-lg">${isEn ? 'View details' : 'ดูรายละเอียด'} →</button>
    <a href="${detailsUrl}" target="_blank" rel="noopener noreferrer" class="block mt-2 text-center text-xs font-semibold text-[#006B9E] hover:underline">${isEn ? 'Open in Google Maps' : 'เปิดใน Google Maps'} ↗</a>
  `;

  wrapper.querySelector('.details-button').addEventListener('click', () => {
    if (onSelectPlace) onSelectPlace(place.id);
  });
  return wrapper;
}

export async function renderMapMarkers(places, onSelectPlace, lang = 'th') {
  if (!mapInstance || !markersGroup || !placesService) return;

  markersGroup.forEach(marker => marker.setMap(null));
  markersGroup.length = 0;
  if (!places?.length) return;

  const resolved = (await Promise.all(places.map(resolvePlace))).filter(Boolean);
  const bounds = new google.maps.LatLngBounds();
  const infoWindow = new google.maps.InfoWindow();

  resolved.forEach(place => {
    const marker = new google.maps.Marker({
      map: mapInstance,
      position: { lat: place.lat, lng: place.lng },
      title: place.nameTh
    });
    marker.addListener('click', () => {
      infoWindow.setContent(buildInfoWindowContent(place, lang, onSelectPlace));
      infoWindow.open({ map: mapInstance, anchor: marker });
    });
    markersGroup.push(marker);
    bounds.extend(marker.getPosition());
  });

  if (resolved.length) {
    mapInstance.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
    if (resolved.length === 1) mapInstance.setZoom(15);
  }
}

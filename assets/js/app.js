import { DISTRICTS } from './data/districts.js';
import { PLACES } from './data/places.js';
import { i18n } from './data/i18n.js';
import { createNavbar } from './components/navbar.js';
import { createBottomNav } from './components/bottomNav.js';
import { initInteractiveMap, renderMapMarkers } from './components/map.js';
import { generateTripItinerary } from './components/planner.js';

// Application State
const state = {
  currentView: 'home',
  selectedDistrictId: null,
  selectedPlaceId: null,
  savedPlaceIds: readSavedPlaceIds(),
  searchQuery: '',
  theme: localStorage.getItem('chonburi_theme') || 'light',
  lang: localStorage.getItem('chonburi_lang') || 'th',
  mapFilter: {
    districts: [],
    categories: []
  },
  plannerConfig: {
    days: 2,
    interests: ['sea', 'cafe', 'restaurant', 'photo']
  }
};

function readSavedPlaceIds() {
  try {
    const saved = JSON.parse(localStorage.getItem('chonburi_saved_places') || '[]');
    return Array.isArray(saved) ? saved.filter(id => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

document.addEventListener('DOMContentLoaded', () => {
  applyTheme();
  initApp();
});

function applyTheme() {
  if (state.theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

function initApp() {
  renderNavbar();
  applyStaticTranslations();
  handleHashChange();
  window.addEventListener('hashchange', handleHashChange);
  updateBottomNav();
  refreshLucideIcons();
}

function renderNavbar() {
  const headerContainer = document.getElementById('header-container');
  if (!headerContainer) return;

  const navbarEl = createNavbar(
    (targetView) => navigateTo(targetView),
    (query) => {
      state.searchQuery = query;
      if (state.currentView === 'map') {
        renderCurrentView();
      } else if (state.currentView === 'home' || state.currentView === 'districts') {
        renderCurrentView();
      }
    },
    state.lang,
    state.theme,
    () => toggleTheme(),
    () => toggleLang()
  );

  headerContainer.replaceWith(navbarEl);
}

function toggleTheme() {
  state.theme = state.theme === 'light' ? 'dark' : 'light';
  localStorage.setItem('chonburi_theme', state.theme);
  applyTheme();
  renderNavbar();
  renderCurrentView();
}

function toggleLang() {
  state.lang = state.lang === 'th' ? 'en' : 'th';
  localStorage.setItem('chonburi_lang', state.lang);
  renderNavbar();
  applyStaticTranslations();
  updateBottomNav();
  renderCurrentView();
}

function applyStaticTranslations() {
  const translations = {
    'footer-description': t('footerDescription'),
    'footer-links-title': t('footerExploreTitle'),
    'footer-categories-title': t('footerCategoriesTitle'),
    'footer-districts-title': t('footerDistrictsTitle'),
    'footer-about-link': t('footerAbout'),
    'footer-districts-link': t('footerDistricts'),
    'footer-map-link': t('footerMap'),
    'footer-planner-link': t('footerPlanner'),
    'footer-eat-link': t('footerEat'),
    'footer-hotels-link': t('footerHotels'),
    'footer-photo-link': t('footerPhotos'),
    'footer-copyright': t('footerCopyright')
  };

  Object.entries(translations).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  });

  document.documentElement.lang = state.lang;
  document.title = state.lang === 'en'
    ? 'CHONBURI - More Than The Sea | Chonburi Travel Guide'
    : 'CHONBURI - More Than The Sea | ท่องเที่ยวจังหวัดชลบุรี 11 อำเภอ';
  const description = document.querySelector('meta[name="description"]');
  if (description) {
    description.content = state.lang === 'en'
      ? 'Discover Chonburi across 11 districts, beaches, cafes, nature, restaurants, hotels, photo spots, and local history.'
      : 'ค้นพบจังหวัดชลบุรีผ่าน 11 อำเภอ ทะเล คาเฟ่ ธรรมชาติ ร้านอาหาร ที่พัก จุดถ่ายรูป และประวัติความเป็นมาของจังหวัดชลบุรี';
  }
}

function placeName(place) {
  return state.lang === 'en' ? (place.nameEn || place.nameTh) : place.nameTh;
}

function districtName(district) {
  if (!district) return state.lang === 'en' ? 'Chonburi' : 'ชลบุรี';
  return state.lang === 'en' ? (district.nameEn || 'Chonburi') : district.nameTh;
}

function updateBottomNav() {
  const container = document.getElementById('bottom-nav-container');
  if (!container) return;
  const bottomNav = createBottomNav((target) => {
    navigateTo(target);
  }, state.currentView, state.lang);
  container.innerHTML = '';
  container.appendChild(bottomNav);
  refreshLucideIcons();
}

function handleHashChange() {
  const hash = window.location.hash.replace('#', '') || 'home';
  if (hash.startsWith('district/')) {
    const did = hash.replace('district/', '');
    state.selectedDistrictId = did;
    state.currentView = 'district-detail';
  } else if (hash.startsWith('place/')) {
    const pid = hash.replace('place/', '');
    state.selectedPlaceId = pid;
    state.currentView = 'place-detail';
  } else {
    const validViews = new Set(['home', 'about', 'districts', 'map', 'hotels', 'eat-drink', 'photo-spots', 'trip-planner', 'saved']);
    state.currentView = validViews.has(hash) ? hash : 'home';
  }
  renderCurrentView();
  updateBottomNav();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function navigateTo(view, param = null) {
  if (view === 'district-detail' && param) {
    window.location.hash = `district/${param}`;
  } else if (view === 'place-detail' && param) {
    window.location.hash = `place/${param}`;
  } else {
    window.location.hash = view;
  }
}

function renderCurrentView() {
  const main = document.getElementById('main-content');
  if (!main) return;

  main.innerHTML = '';

  switch (state.currentView) {
    case 'home':
      main.appendChild(createHomeView());
      break;
    case 'about':
      main.appendChild(createAboutView());
      break;
    case 'districts':
      main.appendChild(createDistrictsView());
      break;
    case 'district-detail':
      main.appendChild(createDistrictDetailView(state.selectedDistrictId));
      break;
    case 'map':
      main.appendChild(createMapView());
      break;
    case 'place-detail':
      main.appendChild(createPlaceDetailView(state.selectedPlaceId));
      break;
    case 'hotels':
      main.appendChild(createHotelsView());
      break;
    case 'eat-drink':
      main.appendChild(createEatDrinkView());
      break;
    case 'photo-spots':
      main.appendChild(createPhotoSpotsView());
      break;
    case 'trip-planner':
      main.appendChild(createTripPlannerView());
      break;
    case 'saved':
      main.appendChild(createSavedView());
      break;
    default:
      main.appendChild(createHomeView());
  }

  refreshLucideIcons();
}

function refreshLucideIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function t(key) {
  const dict = i18n[state.lang] || i18n.th;
  return dict[key] || key;
}

/* ==========================================================================
   ABOUT & HISTORY VIEW (ประวัติจังหวัดชลบุรี)
   ========================================================================== */
function createAboutView() {
  const container = document.createElement('div');
  container.className = 'max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10';

  const isEn = state.lang === 'en';

  container.innerHTML = `
    <!-- Header Title -->
    <div class="text-center max-w-3xl mx-auto space-y-3">
      <span class="text-[#00A8C6] font-bold text-xs uppercase tracking-widest bg-cyan-50 dark:bg-cyan-950 px-3 py-1 rounded-full border border-cyan-100 dark:border-cyan-800">
        🏛️ HISTORICAL & CULTURAL HERITAGE
      </span>
      <h1 class="text-3xl sm:text-5xl font-black text-[#172B3A] dark:text-white">
        ${isEn ? 'History of Chonburi Province' : 'ประวัติจังหวัดชลบุรี'}
      </h1>
      <p class="text-slate-500 dark:text-slate-400 text-sm sm:text-base leading-relaxed">
        ${isEn 
          ? 'Coastal province in Eastern Thailand along the Gulf of Thailand, covering 4,363 sq km across 11 districts.'
          : 'จังหวัดชายฝั่งทะเลภาคตะวันออกของประเทศไทย ตั้งอยู่ริมอ่าวไทย มีพื้นที่ประมาณ 4,363 ตารางกิโลเมตร แบ่งการปกครองออกเป็น 11 อำเภอ'}
      </p>
    </div>

    <!-- Overview Banner Card -->
    <div class="bg-gradient-to-r from-[#006B9E] to-[#00A8C6] rounded-3xl p-6 sm:p-10 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
      <div class="space-y-2">
        <h2 class="text-2xl font-bold">${isEn ? '11 Districts of Chonburi' : '11 อำเภอศูนย์กลางแห่งภาคตะวันออก'}</h2>
        <p class="text-cyan-100 text-xs sm:text-sm">
          Mueang Chon Buri • Ban Bueng • Nong Yai • Bang Lamung • Phan Thong • Phanat Nikhom • Si Racha • Ko Sichang • Sattahip • Bo Thong • Ko Chan
        </p>
      </div>
      <div class="px-5 py-3 bg-white/20 backdrop-blur-md rounded-2xl text-center shrink-0">
        <span class="block text-2xl font-extrabold">4,363</span>
        <span class="text-[11px] text-cyan-100">${isEn ? 'sq km' : 'ตารางกิโลเมตร'}</span>
      </div>
    </div>

    <!-- Timeline Sections -->
    <div class="space-y-8">
      <!-- Section 1 -->
      <div class="bg-white dark:bg-[#1E293B] rounded-3xl p-6 sm:p-8 border border-slate-100 dark:border-slate-800 shadow-md hover:shadow-lg transition-all">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center text-2xl shadow-inner">
            🏺
          </div>
          <div>
            <h2 class="text-xl sm:text-2xl font-extrabold text-[#172B3A] dark:text-white">${isEn ? 'Ancient History' : 'ความเป็นมาในอดีต'}</h2>
            <span class="text-xs text-slate-400 font-medium">${isEn ? 'Prehistoric settlements and maritime trade' : 'หลักฐานการตั้งถิ่นฐานและเส้นทางเดินเรือโบราณ'}</span>
          </div>
        </div>
        <div class="text-sm text-slate-600 dark:text-slate-300 space-y-3 leading-relaxed border-t border-slate-50 dark:border-slate-800 pt-4">
          <p>
            ${isEn 
              ? 'Chonburi has evidence of human settlement since prehistoric times, notably around Phanat Nikhom, a historical center of culture and craftsmanship.'
              : 'พื้นที่จังหวัดชลบุรีมีหลักฐานการตั้งถิ่นฐานของมนุษย์มาตั้งแต่สมัยก่อนประวัติศาสตร์ โดยพบแหล่งโบราณคดีหลายแห่ง โดยเฉพาะบริเวณ Phanat Nikhom'}
          </p>
          <p>
            ${isEn 
              ? 'During Ayutthaya and Rattanakosin eras, coastal communities expanded along maritime trade routes along the Gulf of Thailand.'
              : 'ในสมัยอยุธยาและรัตนโกสินทร์ ชลบุรีเติบโตด้านการค้าทางทะเล ประมง และชุมชนชายฝั่ง'}
          </p>
        </div>
      </div>

      <!-- Section 2 -->
      <div class="bg-white dark:bg-[#1E293B] rounded-3xl p-6 sm:p-8 border border-slate-100 dark:border-slate-800 shadow-md hover:shadow-lg transition-all">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950 text-[#006B9E] dark:text-cyan-300 flex items-center justify-center text-2xl shadow-inner">
            👑
          </div>
          <div>
            <h2 class="text-xl sm:text-2xl font-extrabold text-[#172B3A] dark:text-white">${isEn ? 'Rattanakosin Era & Ko Sichang' : 'ชลบุรีในสมัยรัตนโกสินทร์'}</h2>
            <span class="text-xs text-slate-400 font-medium">${isEn ? 'King Rama V royal palace at Ko Sichang' : 'ขยายตัวชุมชนชายทะเล & พระราชฐานเกาะสีชัง'}</span>
          </div>
        </div>
        <div class="text-sm text-slate-600 dark:text-slate-300 space-y-3 leading-relaxed border-t border-slate-50 dark:border-slate-800 pt-4">
          <p>
            ${isEn 
              ? 'During early Rattanakosin period, communities in Ang Sila, Bangsaen, Phanat Nikhom, and Si Racha grew rapidly. King Rama V visited Ko Sichang and constructed the famous Phra Chuthatjut Palace (Phra Chuthatjut Rajathan).'
              : 'ในช่วงต้นกรุงรัตนโกสินทร์ ชุมชนชายทะเลขยายตัวในบางแสน อ่างศิลา พนัสนิคม ศรีราชา และเกาะสีชัง ซึ่งพระบาทสมเด็จพระจุลจอมเกล้าเจ้าอยู่หัว (รัชกาลที่ 5) ทรงสร้างพระจุฑาธุชราชฐาน'}
          </p>
        </div>
      </div>

      <!-- Section 3: Current Status -->
      <div class="bg-gradient-to-br from-slate-900 to-[#172B3A] rounded-3xl p-6 sm:p-10 text-white shadow-2xl space-y-6">
        <div class="flex items-center gap-3">
          <span class="text-3xl">🏖️</span>
          <div>
            <h2 class="text-2xl font-extrabold">${isEn ? 'Modern Chonburi & EEC' : 'ชลบุรีในปัจจุบัน & เขต EEC'}</h2>
            <p class="text-xs text-cyan-200">${isEn ? 'Eastern Economic Corridor Hub' : 'ความหลากหลายทางเศรษฐกิจ และบทบาทในเขตพัฒนาพิเศษภาคตะวันออก'}</p>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div class="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 space-y-1">
            <span class="text-lg">🏖️</span>
            <h3 class="font-bold text-sm text-cyan-300">${isEn ? 'Tourism' : 'การท่องเที่ยว'}</h3>
            <p class="text-xs text-slate-300">Pattaya, Bangsaen, Koh Larn, Ko Sichang, Sattahip</p>
          </div>

          <div class="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 space-y-1">
            <span class="text-lg">🏭</span>
            <h3 class="font-bold text-sm text-cyan-300">${isEn ? 'Industry' : 'อุตสาหกรรม'}</h3>
            <p class="text-xs text-slate-300">Laem Chabang, Amata City Chonburi</p>
          </div>

          <div class="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 space-y-1">
            <span class="text-lg">🚢</span>
            <h3 class="font-bold text-sm text-cyan-300">${isEn ? 'Logistics' : 'การขนส่ง & โลจิสติกส์'}</h3>
            <p class="text-xs text-slate-300">Laem Chabang Deep Sea Port</p>
          </div>
        </div>
      </div>
    </div>
  `;

  return container;
}

/* ==========================================================================
   1. HOME VIEW
   ========================================================================== */
function createHomeView() {
  const container = document.createElement('div');
  container.className = 'space-y-16 pb-20';

  container.innerHTML = `
    <!-- HERO SECTION -->
    <section class="relative min-h-[520px] sm:min-h-[580px] flex items-center justify-center rounded-3xl overflow-hidden shadow-2xl mx-4 sm:mx-8 mt-4 bg-slate-900">
      <img src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=80" 
           alt="Chonburi Sea" 
           class="absolute inset-0 w-full h-full object-cover opacity-60 scale-105 transition-transform duration-1000">
      <div class="absolute inset-0 bg-gradient-to-t from-[#172B3A] via-[#172B3A]/40 to-transparent"></div>
      
      <div class="relative z-10 text-center max-w-4xl mx-auto px-4 py-12">
        <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full hero-badge text-xs sm:text-sm font-semibold mb-6 shadow-sm">
          <i data-lucide="sparkles" class="w-4 h-4 text-[#F4B942]"></i> ${t('heroBadge')}
        </div>
        
        <h1 class="text-4xl sm:text-6xl font-black text-white tracking-tight mb-4 drop-shadow-md">
          ${t('heroTitle')}
        </h1>
        <p class="text-lg sm:text-2xl text-cyan-100 font-light mb-8 max-w-2xl mx-auto">
          ${t('heroSubtitle')}
        </p>

        <!-- Search Bar Big -->
        <div class="bg-white/95 dark:bg-[#1E293B]/95 backdrop-blur-md p-2 sm:p-3 rounded-2xl sm:rounded-full shadow-2xl max-w-2xl mx-auto flex flex-col sm:flex-row items-center gap-2 border border-white/50 dark:border-slate-700">
          <div class="flex items-center gap-2 w-full px-4 py-2 sm:py-0">
            <i data-lucide="search" class="w-5 h-5 text-[#006B9E] dark:text-[#00A8C6] shrink-0"></i>
            <input type="text" id="hero-search-input" placeholder="${t('searchPlaceholder')}" class="w-full bg-transparent text-sm sm:text-base text-slate-800 dark:text-white focus:outline-none placeholder-slate-400">
          </div>
          <button id="hero-search-btn" class="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-[#006B9E] to-[#00A8C6] hover:from-[#005680] hover:to-[#008ba4] text-white font-semibold rounded-xl sm:rounded-full shadow-lg shadow-[#006B9E]/30 transition-all shrink-0">
            ${t('searchBtn')}
          </button>
        </div>

        <!-- Quick Category Tags -->
        <div class="flex flex-wrap items-center justify-center gap-2 mt-6">
          <button type="button" data-category="sea" class="quick-cat-btn px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-medium backdrop-blur-sm border border-white/20 transition-all">
            ${t('catSea')}
          </button>
          <button type="button" data-category="nature" class="quick-cat-btn px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-medium backdrop-blur-sm border border-white/20 transition-all">
            ${t('catNature')}
          </button>
          <button type="button" data-category="cafe" class="quick-cat-btn px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-medium backdrop-blur-sm border border-white/20 transition-all">
            ${t('catCafe')}
          </button>
          <button type="button" data-category="restaurant" class="quick-cat-btn px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-medium backdrop-blur-sm border border-white/20 transition-all">
            ${t('catRestaurant')}
          </button>
          <button type="button" data-category="hotel" class="quick-cat-btn px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-medium backdrop-blur-sm border border-white/20 transition-all">
            ${t('catHotel')}
          </button>
        </div>
      </div>
    </section>

    <!-- HISTORY PREVIEW CARD -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="bg-gradient-to-br from-[#172B3A] to-[#006B9E] rounded-3xl p-6 sm:p-10 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div class="space-y-2 text-center md:text-left">
          <span class="text-xs font-bold uppercase tracking-widest text-[#00A8C6] bg-white/10 px-3 py-1 rounded-full">
            ${t('historyTag')}
          </span>
          <h2 class="text-2xl sm:text-3xl font-bold">${t('historyTitle')}</h2>
          <p class="text-xs sm:text-sm text-cyan-100 max-w-2xl">
            ${t('historySubtitle')}
          </p>
        </div>
        <button id="home-read-about-btn" class="px-6 py-3 bg-[#00A8C6] hover:bg-[#0094b0] text-white font-bold text-sm rounded-xl shadow-lg transition-all shrink-0 flex items-center gap-2">
          <i data-lucide="book-open" class="w-4 h-4"></i> ${t('historyReadMore')}
        </button>
      </div>
    </section>

    <!-- 2. EXPLORE 11 DISTRICTS SECTION -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex flex-col md:flex-row md:items-end justify-between mb-8">
        <div>
          <span class="text-[#00A8C6] font-bold text-xs uppercase tracking-wider block mb-1">${t('districtsTag')}</span>
          <h2 class="text-2xl sm:text-3xl font-extrabold text-[#172B3A] dark:text-white">${t('districtsTitle')}</h2>
          <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">${t('districtsSubtitle')}</p>
        </div>
        <button id="view-all-districts-btn" class="mt-4 md:mt-0 text-[#006B9E] dark:text-[#00A8C6] font-bold text-sm hover:underline flex items-center gap-1">
          ${t('districtsViewAll')} <i data-lucide="arrow-right" class="w-4 h-4"></i>
        </button>
      </div>

      <!-- District Cards Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        ${DISTRICTS.slice(0, 8).map(d => `
          <div data-district-id="${d.id}" class="district-card group bg-white dark:bg-[#1E293B] rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm card-hover cursor-pointer flex flex-col justify-between">
            <div>
              <div class="relative h-44 overflow-hidden">
                <img src="${d.cover}" alt="${d.nameTh}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
                <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                <div class="absolute bottom-3 left-4 right-4 text-white">
                  <h3 class="text-xl font-bold">${state.lang === 'en' ? d.nameEn : d.nameTh}</h3>
                  <p class="text-xs text-cyan-200 font-light">${d.nameEn}</p>
                </div>
                <span class="absolute top-3 right-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-bold text-[#006B9E] dark:text-[#00A8C6] shadow-sm">
                  8 ${t('placesCountUnit')}
                </span>
              </div>
              <div class="p-4">
                <p class="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mb-3">${d.shortDesc}</p>
                <div class="flex flex-wrap gap-1">
                  ${d.tags.map(tag => `<span class="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">${tag}</span>`).join('')}
                </div>
              </div>
            </div>
            <div class="px-4 pb-4 pt-2 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between text-xs text-[#006B9E] dark:text-[#00A8C6] font-bold">
              <span>${t('exploreDistrict')}</span>
              <i data-lucide="chevron-right" class="w-4 h-4 group-hover:translate-x-1 transition-transform"></i>
            </div>
          </div>
        `).join('')}
      </div>
    </section>

    <!-- 3. TRENDING PLACES -->
    <section class="bg-white dark:bg-[#1E293B] py-12 border-y border-slate-100 dark:border-slate-800 transition-colors">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between mb-8">
          <div>
            <span class="text-[#F4B942] font-bold text-xs uppercase tracking-wider block mb-1">${t('trendingTag')}</span>
            <h2 class="text-2xl sm:text-3xl font-extrabold text-[#172B3A] dark:text-white">${t('trendingTitle')}</h2>
            <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">${t('trendingSubtitle')}</p>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          ${PLACES.slice(0, 6).map(p => {
            const districtObj = DISTRICTS.find(d => d.id === p.districtId);
            return `
              <div data-place-id="${p.id}" class="place-card bg-slate-50 dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 card-hover cursor-pointer group flex flex-col justify-between">
                <div>
                  <div class="relative h-48 overflow-hidden">
                    <img src="${p.cover}" alt="${p.nameTh}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
                    <button data-bookmark-id="${p.id}" class="bookmark-btn absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-md flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-red-500 transition-colors shadow-md">
                      <i data-lucide="heart" class="w-4 h-4 ${state.savedPlaceIds.includes(p.id) ? 'fill-red-500 text-red-500' : ''}"></i>
                    </button>
                    <span class="absolute bottom-3 left-3 bg-[#006B9E] text-white px-2.5 py-1 rounded-lg text-xs font-semibold">
                      ${districtName(districtObj)}
                    </span>
                  </div>
                  <div class="p-5">
                    <div class="flex items-center justify-between mb-1">
                      <h3 class="font-bold text-base text-[#172B3A] dark:text-white group-hover:text-[#006B9E] dark:group-hover:text-[#00A8C6] transition-colors">${placeName(p)}</h3>
                      <div class="flex items-center gap-1 text-xs font-bold text-amber-500">
                        <i data-lucide="star" class="w-3.5 h-3.5 fill-amber-400"></i> ${p.rating}
                      </div>
                    </div>
                    <p class="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">${p.address}</p>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </section>

    <!-- 5. INTERACTIVE MAP PREVIEW -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="bg-[#172B3A] dark:bg-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-2xl relative overflow-hidden border border-slate-800">
        <div class="flex flex-col lg:flex-row items-center justify-between gap-8 mb-6">
          <div>
            <span class="text-[#00A8C6] font-bold text-xs uppercase tracking-wider block mb-1">${t('mapTag')}</span>
            <h2 class="text-2xl sm:text-4xl font-extrabold">${t('mapTitle')}</h2>
            <p class="text-slate-300 text-sm mt-2 max-w-xl">${t('mapSubtitle')}</p>
          </div>
          <button id="open-full-map-btn" class="px-6 py-3 bg-[#00A8C6] hover:bg-[#0094b0] text-white font-bold rounded-xl shadow-lg shadow-[#00A8C6]/30 transition-all flex items-center gap-2 shrink-0">
            <i data-lucide="map" class="w-5 h-5"></i> ${t('mapOpenFull')}
          </button>
        </div>
        <div id="home-map-preview" class="w-full h-80 rounded-2xl overflow-hidden border border-slate-700 shadow-inner"></div>
      </div>
    </section>
  `;

  setTimeout(() => {
    initInteractiveMap('home-map-preview', PLACES.slice(0, 10), (placeId) => {
      navigateTo('place-detail', placeId);
    }, state.lang);
  }, 100);

  const heroSearchBtn = container.querySelector('#hero-search-btn');
  const heroSearchInput = container.querySelector('#hero-search-input');
  if (heroSearchBtn && heroSearchInput) {
    heroSearchBtn.addEventListener('click', () => {
      const q = heroSearchInput.value.trim();
      if (q) {
        state.searchQuery = q;
        navigateTo('map');
      }
    });
  }

  container.addEventListener('click', (event) => {
    const button = event.target.closest('.quick-cat-btn');
    if (!button) return;
    event.preventDefault();
    const category = button.getAttribute('data-category');
    if (!category) return;
    state.searchQuery = '';
    state.mapFilter.districts = [];
    state.mapFilter.categories = [category];
    navigateTo('map');
  });

  const readAboutBtn = container.querySelector('#home-read-about-btn');
  if (readAboutBtn) {
    readAboutBtn.addEventListener('click', () => navigateTo('about'));
  }

  container.querySelectorAll('.district-card').forEach(card => {
    card.addEventListener('click', () => {
      const did = card.getAttribute('data-district-id');
      navigateTo('district-detail', did);
    });
  });

  container.querySelectorAll('.place-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.bookmark-btn')) return;
      const pid = card.getAttribute('data-place-id');
      navigateTo('place-detail', pid);
    });
  });

  container.querySelectorAll('[data-bookmark-id]').forEach(button => {
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleBookmark(button.getAttribute('data-bookmark-id'));
      const icon = button.querySelector('[data-lucide="heart"]');
      const isSaved = state.savedPlaceIds.includes(button.getAttribute('data-bookmark-id'));
      if (icon) {
        icon.classList.toggle('fill-red-500', isSaved);
        icon.classList.toggle('text-red-500', isSaved);
      }
    });
  });

  const viewAllDistrictsBtn = container.querySelector('#view-all-districts-btn');
  if (viewAllDistrictsBtn) {
    viewAllDistrictsBtn.addEventListener('click', () => navigateTo('districts'));
  }

  const openFullMapBtn = container.querySelector('#open-full-map-btn');
  if (openFullMapBtn) {
    openFullMapBtn.addEventListener('click', () => navigateTo('map'));
  }

  return container;
}

/* ==========================================================================
   2. EXPLORE 11 DISTRICTS VIEW
   ========================================================================== */
function createDistrictsView() {
  const container = document.createElement('div');
  container.className = 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8';

  container.innerHTML = `
    <div class="text-center max-w-3xl mx-auto">
      <span class="text-[#00A8C6] font-bold text-xs uppercase tracking-wider">CHONBURI 11 DISTRICTS</span>
      <h1 class="text-3xl sm:text-4xl font-extrabold text-[#172B3A] dark:text-white mt-1">${t('districtsTitle')}</h1>
      <p class="text-slate-500 dark:text-slate-400 text-sm sm:text-base mt-2">${t('districtsSubtitle')}</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      ${DISTRICTS.map(d => `
        <div data-district-id="${d.id}" class="district-full-card bg-white dark:bg-[#1E293B] rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-md card-hover cursor-pointer group flex flex-col justify-between">
          <div>
            <div class="relative h-52 overflow-hidden">
              <img src="${d.cover}" alt="${d.nameTh}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
              <div class="absolute inset-0 bg-gradient-to-t from-[#172B3A]/80 via-transparent to-transparent"></div>
              <div class="absolute bottom-4 left-4 right-4 text-white">
                <span class="text-xs text-[#00A8C6] font-bold uppercase tracking-wider block">${d.nameEn}</span>
                <h3 class="text-2xl font-bold">${state.lang === 'en' ? d.nameEn : d.nameTh}</h3>
              </div>
            </div>
            <div class="p-5">
              <p class="text-sm text-slate-600 dark:text-slate-300 line-clamp-3 mb-4">${d.fullDesc}</p>
              
              <div class="grid grid-cols-4 gap-2 bg-slate-50 dark:bg-slate-900 p-3 rounded-xl text-center text-xs mb-4">
                <div>
                  <span class="block font-bold text-[#006B9E] dark:text-[#00A8C6] text-sm">8</span>
                  <span class="text-slate-400 text-[10px]">${t('placesCountUnit')}</span>
                </div>
                <div>
                  <span class="block font-bold text-[#006B9E] dark:text-[#00A8C6] text-sm">${d.cafesCount}</span>
                  <span class="text-slate-400 text-[10px]">${t('cafesCountUnit')}</span>
                </div>
                <div>
                  <span class="block font-bold text-[#006B9E] dark:text-[#00A8C6] text-sm">${d.restaurantsCount}</span>
                  <span class="text-slate-400 text-[10px]">${t('restaurantsCountUnit')}</span>
                </div>
                <div>
                  <span class="block font-bold text-[#006B9E] dark:text-[#00A8C6] text-sm">${d.hotelsCount}</span>
                  <span class="text-slate-400 text-[10px]">${t('hotelsCountUnit')}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-sm text-[#006B9E] dark:text-[#00A8C6] font-bold">
            <span>${t('exploreDistrict')} ${state.lang === 'en' ? d.nameEn : d.nameTh}</span>
            <i data-lucide="arrow-right" class="w-4 h-4 group-hover:translate-x-1 transition-transform"></i>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  container.querySelectorAll('.district-full-card').forEach(card => {
    card.addEventListener('click', () => {
      const did = card.getAttribute('data-district-id');
      navigateTo('district-detail', did);
    });
  });

  return container;
}

/* ==========================================================================
   3. DISTRICT DETAIL VIEW (/district/:id)
   ========================================================================== */
function createDistrictDetailView(districtId) {
  const district = DISTRICTS.find(d => d.id === districtId) || DISTRICTS[0];
  const districtPlaces = PLACES.filter(p => p.districtId === district.id);

  const container = document.createElement('div');
  container.className = 'space-y-12 pb-20';

  container.innerHTML = `
    <!-- District Hero -->
    <section class="relative h-[360px] sm:h-[420px] flex items-end justify-center bg-slate-900">
      <img src="${district.cover}" alt="${district.nameTh}" class="absolute inset-0 w-full h-full object-cover opacity-60">
      <div class="absolute inset-0 bg-gradient-to-t from-[#172B3A] via-[#172B3A]/30 to-transparent"></div>
      
      <div class="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pb-8 text-white">
        <button id="back-to-districts-btn" class="mb-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold hover:bg-white/30 transition-all">
          <i data-lucide="arrow-left" class="w-4 h-4"></i> ${t('placeBack')}
        </button>
        <span class="text-[#00A8C6] font-bold text-xs uppercase tracking-widest block">${district.nameEn}</span>
        <h1 class="text-4xl sm:text-5xl font-black">${state.lang === 'en' ? district.nameEn : district.nameTh}</h1>
        <p class="text-cyan-100 text-sm sm:text-base mt-2 max-w-2xl">${district.tagline}</p>
      </div>
    </section>

    <!-- District Places Grid -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      <h2 class="text-2xl font-bold text-[#172B3A] dark:text-white">${state.lang === 'en' ? 'Places in' : 'สถานที่ท่องเที่ยวใน'} ${state.lang === 'en' ? district.nameEn : district.nameTh} (${districtPlaces.length})</h2>
      
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        ${districtPlaces.map(p => `
          <div data-place-id="${p.id}" class="place-card bg-white dark:bg-[#1E293B] rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm card-hover cursor-pointer group flex flex-col justify-between">
            <div>
              <div class="relative h-48 overflow-hidden">
                <img src="${p.cover}" alt="${p.nameTh}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
                <span class="absolute top-3 right-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-[#006B9E] dark:text-[#00A8C6]">
                  ⭐ ${p.rating}
                </span>
              </div>
              <div class="p-5">
                <h3 class="font-bold text-base text-[#172B3A] dark:text-white group-hover:text-[#006B9E] dark:group-hover:text-[#00A8C6] transition-colors">${placeName(p)}</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 mb-3">${p.address}</p>
              </div>
            </div>
            <div class="px-5 py-3 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between text-xs text-[#006B9E] dark:text-[#00A8C6] font-semibold">
              <span>${t('mapViewDetail')}</span>
              <i data-lucide="chevron-right" class="w-4 h-4"></i>
            </div>
          </div>
        `).join('')}
      </div>
    </section>
  `;

  const backBtn = container.querySelector('#back-to-districts-btn');
  if (backBtn) {
    backBtn.addEventListener('click', () => navigateTo('districts'));
  }

  container.querySelectorAll('.place-card').forEach(card => {
    card.addEventListener('click', () => {
      const pid = card.getAttribute('data-place-id');
      navigateTo('place-detail', pid);
    });
  });

  return container;
}

/* ==========================================================================
   4. MAP PAGE WITH FILTER SIDEBAR
   ========================================================================== */
function createMapView() {
  const container = document.createElement('div');
  container.className = 'mobile-map-layout flex flex-col lg:flex-row h-[calc(100vh-80px)] overflow-hidden';

  container.innerHTML = `
    <!-- Sidebar Filter -->
    <aside class="w-full lg:w-80 bg-white dark:bg-[#1E293B] border-r border-slate-200 dark:border-slate-800 p-5 overflow-y-auto shrink-0 shadow-lg z-10 space-y-6">
      <div>
        <h2 class="font-extrabold text-xl text-[#172B3A] dark:text-white">🗺️ ${t('mapTitle')}</h2>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">${t('mapSubtitle')}</p>
      </div>

      <!-- Quick Search input -->
      <div>
        <label class="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">${t('quickSearchPlaceholder')}</label>
        <div class="relative">
          <input type="text" id="map-search-input" value="${state.searchQuery}" placeholder="${t('quickSearchPlaceholder')}" class="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-[#006B9E]">
          <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3 top-2.5"></i>
        </div>
      </div>

      <!-- District Filter Checklist -->
      <div>
        <label class="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">${t('mapFilterDistricts')}</label>
        <div class="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          ${DISTRICTS.map(d => `
            <label class="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer hover:text-[#006B9E]">
              <input type="checkbox" value="${d.id}" class="map-district-checkbox rounded text-[#006B9E] focus:ring-[#006B9E]" ${state.mapFilter.districts.includes(d.id) ? 'checked' : ''}>
              <span>${state.lang === 'en' ? d.nameEn : d.nameTh}</span>
            </label>
          `).join('')}
        </div>
      </div>

      <!-- Category Filter Checklist -->
      <div>
        <label class="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">${t('mapFilterCategories')}</label>
        <div class="space-y-1.5">
          <label class="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
            <input type="checkbox" value="sea" class="map-cat-checkbox rounded text-[#006B9E]" ${state.mapFilter.categories.includes('sea') ? 'checked' : ''}>
            <span>${t('catSea')}</span>
          </label>
          <label class="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
            <input type="checkbox" value="nature" class="map-cat-checkbox rounded text-[#006B9E]" ${state.mapFilter.categories.includes('nature') ? 'checked' : ''}>
            <span>${t('catNature')}</span>
          </label>
          <label class="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
            <input type="checkbox" value="cafe" class="map-cat-checkbox rounded text-[#006B9E]" ${state.mapFilter.categories.includes('cafe') ? 'checked' : ''}>
            <span>${t('catCafe')}</span>
          </label>
          <label class="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
            <input type="checkbox" value="restaurant" class="map-cat-checkbox rounded text-[#006B9E]" ${state.mapFilter.categories.includes('restaurant') ? 'checked' : ''}>
            <span>${t('catRestaurant')}</span>
          </label>
          <label class="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
            <input type="checkbox" value="hotel" class="map-cat-checkbox rounded text-[#006B9E]" ${state.mapFilter.categories.includes('hotel') ? 'checked' : ''}>
            <span>${t('catHotel')}</span>
          </label>
          <label class="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
            <input type="checkbox" value="photo" class="map-cat-checkbox rounded text-[#006B9E]" ${state.mapFilter.categories.includes('photo') ? 'checked' : ''}>
            <span>${t('catPhoto')}</span>
          </label>
        </div>
      </div>

      <button id="reset-map-filters-btn" class="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-xl transition-colors">
        ${t('mapResetFilters')}
      </button>
    </aside>

    <!-- Map Leaflet Container -->
    <main class="flex-1 relative w-full h-full bg-slate-200">
      <div id="full-interactive-map" class="w-full h-full"></div>
    </main>
  `;

  const getFilteredPlaces = () => {
    return PLACES.filter(p => {
      if (state.searchQuery) {
        const q = state.searchQuery.toLowerCase();
        const matchName = p.nameTh.toLowerCase().includes(q) || p.nameEn.toLowerCase().includes(q);
        if (!matchName) return false;
      }
      if (state.mapFilter.districts.length > 0) {
        if (!state.mapFilter.districts.includes(p.districtId)) return false;
      }
      if (state.mapFilter.categories.length > 0) {
        if (!state.mapFilter.categories.includes(p.category)) return false;
      }
      return true;
    });
  };

  setTimeout(() => {
    initInteractiveMap('full-interactive-map', getFilteredPlaces(), (placeId) => {
      navigateTo('place-detail', placeId);
    }, state.lang);
  }, 100);

  const updateMap = () => {
    renderMapMarkers(getFilteredPlaces(), (placeId) => {
      navigateTo('place-detail', placeId);
    }, state.lang);
  };

  const mapSearchInput = container.querySelector('#map-search-input');
  if (mapSearchInput) {
    mapSearchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      updateMap();
    });
  }

  container.querySelectorAll('.map-district-checkbox').forEach(cb => {
    cb.addEventListener('change', () => {
      const selected = Array.from(container.querySelectorAll('.map-district-checkbox:checked')).map(el => el.value);
      state.mapFilter.districts = selected;
      updateMap();
    });
  });

  container.querySelectorAll('.map-cat-checkbox').forEach(cb => {
    cb.addEventListener('change', () => {
      const selected = Array.from(container.querySelectorAll('.map-cat-checkbox:checked')).map(el => el.value);
      state.mapFilter.categories = selected;
      updateMap();
    });
  });

  const resetBtn = container.querySelector('#reset-map-filters-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      state.searchQuery = '';
      state.mapFilter.districts = [];
      state.mapFilter.categories = [];
      container.querySelectorAll('input[type="checkbox"]').forEach(c => c.checked = false);
      if (mapSearchInput) mapSearchInput.value = '';
      updateMap();
    });
  }

  return container;
}

/* ==========================================================================
   5. PLACE DETAIL VIEW (/place/:id)
   ========================================================================== */
function createPlaceDetailView(placeId) {
  const place = PLACES.find(p => p.id === placeId) || PLACES[0];
  const districtObj = DISTRICTS.find(d => d.id === place.districtId);
  const nearbyPlaces = PLACES.filter(p => p.districtId === place.districtId && p.id !== place.id).slice(0, 3);

  const container = document.createElement('div');
  container.className = 'max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8';

  container.innerHTML = `
    <!-- Top Nav Back Button -->
    <div class="flex items-center justify-between">
      <button id="back-from-place-btn" class="inline-flex items-center gap-2 text-sm font-semibold text-[#006B9E] dark:text-[#00A8C6] hover:underline">
        <i data-lucide="arrow-left" class="w-4 h-4"></i> ${t('placeBack')}
      </button>
      <button id="detail-bookmark-btn" class="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700">
        <i data-lucide="heart" class="w-4 h-4 ${state.savedPlaceIds.includes(place.id) ? 'fill-red-500 text-red-500' : ''}"></i>
        <span>${state.savedPlaceIds.includes(place.id) ? t('placeSaved') : t('placeSave')}</span>
      </button>
    </div>

    <!-- Place Hero Banner -->
    <div class="relative h-[320px] sm:h-[450px] rounded-3xl overflow-hidden shadow-2xl">
      <img src="${place.cover}" alt="${place.nameTh}" class="w-full h-full object-cover">
      <div class="absolute inset-0 bg-gradient-to-t from-[#172B3A] via-transparent to-transparent"></div>
      <div class="absolute bottom-6 left-6 right-6 text-white">
        <span class="bg-[#00A8C6] text-white px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">
          ${districtName(districtObj)}
        </span>
        <h1 class="text-3xl sm:text-5xl font-black mt-2">${place.nameTh}</h1>
        <p class="text-cyan-100 text-sm sm:text-base mt-1">${place.subcategory || place.category}</p>
      </div>
    </div>

    <!-- Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Main Details -->
      <div class="lg:col-span-2 space-y-6">
        <div class="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div class="flex items-center gap-1 text-amber-500 font-extrabold text-lg">
            <i data-lucide="star" class="w-5 h-5 fill-amber-400"></i> ${place.rating}
          </div>
          <span class="text-slate-300">•</span>
          <span class="text-slate-500 text-sm">${place.reviewsCount || 200}+ ${state.lang === 'en' ? 'reviews' : 'รีวิว'}</span>
        </div>

        <div>
          <h3 class="font-bold text-lg text-[#172B3A] dark:text-white mb-2">${t('placeUsefulInfo')}</h3>
          <p class="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">${place.fullDesc}</p>
        </div>

        <!-- Detail Meta Table -->
        <div class="bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 space-y-4">
          <h4 class="font-bold text-sm text-[#172B3A] dark:text-white">${t('placeUsefulInfo')}</h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div class="flex items-start gap-3">
              <i data-lucide="clock" class="w-4 h-4 text-[#006B9E] dark:text-[#00A8C6] shrink-0 mt-0.5"></i>
              <div>
                <span class="font-bold block text-slate-700 dark:text-slate-200">${t('placeOpenHours')}</span>
                <span class="text-slate-500 dark:text-slate-400">${place.openHours || (state.lang === 'en' ? '08:00 - 18:00' : '08:00 - 18:00 น.')}</span>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <i data-lucide="ticket" class="w-4 h-4 text-[#006B9E] dark:text-[#00A8C6] shrink-0 mt-0.5"></i>
              <div>
                <span class="font-bold block text-slate-700 dark:text-slate-200">${t('placeEntranceFee')}</span>
                <span class="text-slate-500 dark:text-slate-400">${place.entranceFee || (state.lang === 'en' ? 'Free' : 'เข้าชมฟรี')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Location & Google Maps button -->
      <div class="space-y-6">
        <div class="bg-white dark:bg-[#1E293B] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
          <h4 class="font-bold text-base text-[#172B3A] dark:text-white flex items-center gap-2">
            <i data-lucide="map-pin" class="w-5 h-5 text-[#006B9E] dark:text-[#00A8C6]"></i> ${t('locationTitle')}
          </h4>
          <p class="text-xs text-slate-600 dark:text-slate-400">${place.address}</p>
          
          <div id="place-mini-map" class="w-full h-44 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-700"></div>

          <a href="${place.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`}" target="_blank" class="w-full py-3 bg-[#006B9E] hover:bg-[#005680] text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all">
            <i data-lucide="navigation" class="w-4 h-4"></i> ${t('placeOpenGoogleMaps')}
          </a>
        </div>
      </div>
    </div>
  `;

  setTimeout(() => {
    initInteractiveMap('place-mini-map', [place], null, state.lang);
  }, 100);

  const backBtn = container.querySelector('#back-from-place-btn');
  if (backBtn) {
    backBtn.addEventListener('click', () => window.history.back());
  }

  const bookmarkBtn = container.querySelector('#detail-bookmark-btn');
  if (bookmarkBtn) {
    bookmarkBtn.addEventListener('click', () => {
      toggleBookmark(place.id);
      renderCurrentView();
    });
  }

  return container;
}

/* ==========================================================================
   6. HOTELS PAGE
   ========================================================================== */
function createHotelsView() {
  const container = document.createElement('div');
  container.className = 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8';

  const hotels = PLACES.filter(p => p.category === 'hotel');

  container.innerHTML = `
    <div class="text-center max-w-2xl mx-auto space-y-2">
      <span class="text-[#00A8C6] font-bold text-xs uppercase tracking-wider">WHERE TO STAY</span>
      <h1 class="text-3xl font-extrabold text-[#172B3A] dark:text-white">${t('navHotels')}</h1>
      <p class="text-slate-500 dark:text-slate-400 text-sm">${state.lang === 'en' ? 'Curated stays across all 11 districts of Chonburi.' : 'คัดสรรที่พักคุณภาพ ครอบคลุมทั้ง 11 อำเภอของจังหวัดชลบุรี'}</p>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      ${hotels.map(h => {
        const districtObj = DISTRICTS.find(d => d.id === h.districtId);
        return `
          <div data-place-id="${h.id}" class="hotel-card bg-white dark:bg-[#1E293B] rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-md card-hover cursor-pointer group flex flex-col justify-between">
            <div>
              <div class="relative h-52 overflow-hidden">
                <img src="${h.cover}" alt="${h.nameTh}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
                <span class="absolute top-3 left-3 bg-[#006B9E] text-white px-2.5 py-1 rounded-lg text-xs font-semibold">
                  📍 ${districtName(districtObj)}
                </span>
                <span class="absolute top-3 right-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-2 py-1 rounded-lg text-xs font-bold text-amber-500">
                  ★ ${h.rating}
                </span>
              </div>
              <div class="p-5">
                <h3 class="font-bold text-lg text-[#172B3A] dark:text-white mb-1">${placeName(h)}</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">${h.address}</p>
              </div>
            </div>
            <div class="px-5 py-3 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between text-xs text-[#006B9E] dark:text-[#00A8C6] font-bold">
              <span>${t('mapViewDetail')}</span>
              <i data-lucide="chevron-right" class="w-4 h-4"></i>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  container.querySelectorAll('.hotel-card').forEach(card => {
    card.addEventListener('click', () => {
      const pid = card.getAttribute('data-place-id');
      navigateTo('place-detail', pid);
    });
  });

  return container;
}

/* ==========================================================================
   7. EAT & DRINK VIEW
   ========================================================================== */
function createEatDrinkView() {
  const container = document.createElement('div');
  container.className = 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8';

  const eatPlaces = PLACES.filter(p => p.category === 'cafe' || p.category === 'restaurant');

  container.innerHTML = `
    <div class="text-center max-w-2xl mx-auto space-y-2">
      <span class="text-[#F4B942] font-bold text-xs uppercase tracking-wider">EAT & DRINK</span>
      <h1 class="text-3xl font-extrabold text-[#172B3A] dark:text-white">${t('navEatDrink')}</h1>
      <p class="text-slate-500 dark:text-slate-400 text-sm">${state.lang === 'en' ? 'Discover local restaurants, seafood, and photogenic cafes across all 11 districts.' : 'ลิ้มรสร้านอาหารอร่อย ร้านอาหารทะเล และคาเฟ่ถ่ายรูปสวยทั้ง 11 อำเภอ'}</p>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      ${eatPlaces.map(p => {
        const districtObj = DISTRICTS.find(d => d.id === p.districtId);
        return `
          <div data-place-id="${p.id}" class="eat-card bg-white dark:bg-[#1E293B] rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-md card-hover cursor-pointer group flex flex-col justify-between">
            <div>
              <div class="relative h-48 overflow-hidden">
                <img src="${p.cover}" alt="${p.nameTh}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
                <span class="absolute top-3 left-3 bg-[#00A8C6] text-white px-2.5 py-1 rounded-lg text-xs font-semibold">
                  ${p.category === 'cafe' ? t('catCafe') : t('catRestaurant')}
                </span>
                <span class="absolute top-3 right-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-2 py-1 rounded-lg text-xs font-bold text-amber-500">
                  ★ ${p.rating}
                </span>
              </div>
              <div class="p-5">
                <h3 class="font-bold text-base text-[#172B3A] dark:text-white">${placeName(p)}</h3>
                <p class="text-xs text-slate-400 font-medium mb-2">📍 ${districtName(districtObj)}</p>
                <p class="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">${p.address}</p>
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  container.querySelectorAll('.eat-card').forEach(card => {
    card.addEventListener('click', () => {
      const pid = card.getAttribute('data-place-id');
      navigateTo('place-detail', pid);
    });
  });

  return container;
}

/* ==========================================================================
   8. PHOTO SPOTS VIEW
   ========================================================================== */
function createPhotoSpotsView() {
  const container = document.createElement('div');
  container.className = 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8';

  const photoSpots = PLACES.filter(p => p.isPhotoSpot);

  container.innerHTML = `
    <div class="text-center max-w-2xl mx-auto space-y-2">
      <span class="text-[#00A8C6] font-bold text-xs uppercase tracking-wider">📸 PHOTO SPOTS</span>
      <h1 class="text-3xl font-extrabold text-[#172B3A] dark:text-white">${t('navPhotoSpots')}</h1>
      <p class="text-slate-500 dark:text-slate-400 text-sm">${state.lang === 'en' ? 'Which corner of Chonburi will you keep in your memories?' : '“มุมไหนของชลบุรีที่คุณอยากเก็บไว้ในความทรงจำ?”'}</p>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      ${photoSpots.map(p => {
        const districtObj = DISTRICTS.find(d => d.id === p.districtId);
        return `
          <div data-place-id="${p.id}" class="photo-card relative h-80 rounded-2xl overflow-hidden shadow-lg group cursor-pointer">
            <img src="${p.cover}" alt="${p.nameTh}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">
            <div class="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent"></div>
            
            <div class="absolute top-4 left-4">
              <span class="bg-white/20 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full">
                📍 ${districtName(districtObj)}
              </span>
            </div>

            <div class="absolute bottom-5 left-5 right-5 text-white">
              <h3 class="text-xl font-bold mb-1">${p.nameTh}</h3>
              <p class="text-xs text-cyan-200 line-clamp-1 mb-2">${p.address}</p>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  container.querySelectorAll('.photo-card').forEach(card => {
    card.addEventListener('click', () => {
      const pid = card.getAttribute('data-place-id');
      navigateTo('place-detail', pid);
    });
  });

  return container;
}

/* ==========================================================================
   9. TRIP PLANNER VIEW
   ========================================================================== */
function createTripPlannerView() {
  const container = document.createElement('div');
  container.className = 'max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8';

  container.innerHTML = `
    <div class="text-center max-w-2xl mx-auto space-y-2">
      <span class="text-[#00A8C6] font-bold text-xs uppercase tracking-wider">${t('plannerTag')}</span>
      <h1 class="text-3xl font-extrabold text-[#172B3A] dark:text-white">${t('plannerTitle')}</h1>
      <p class="text-slate-500 dark:text-slate-400 text-sm">${t('plannerSubtitle')}</p>
    </div>

    <!-- Planner Form Container -->
    <div class="bg-white dark:bg-[#1E293B] rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
      <!-- Q1: Duration -->
      <div>
        <label class="font-bold text-slate-800 dark:text-slate-200 text-sm block mb-3">${t('plannerQ1')}</label>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button data-days="1" class="day-select-btn py-3 px-4 rounded-2xl border-2 font-bold text-sm transition-all ${state.plannerConfig.days === 1 ? 'border-[#006B9E] bg-cyan-50 dark:bg-cyan-950 text-[#006B9E] dark:text-[#00A8C6]' : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}">
            1 DAY
          </button>
          <button data-days="2" class="day-select-btn py-3 px-4 rounded-2xl border-2 font-bold text-sm transition-all ${state.plannerConfig.days === 2 ? 'border-[#006B9E] bg-cyan-50 dark:bg-cyan-950 text-[#006B9E] dark:text-[#00A8C6]' : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}">
            2 DAYS
          </button>
          <button data-days="3" class="day-select-btn py-3 px-4 rounded-2xl border-2 font-bold text-sm transition-all ${state.plannerConfig.days === 3 ? 'border-[#006B9E] bg-cyan-50 dark:bg-cyan-950 text-[#006B9E] dark:text-[#00A8C6]' : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}">
            3 DAYS
          </button>
          <button data-days="4" class="day-select-btn py-3 px-4 rounded-2xl border-2 font-bold text-sm transition-all ${state.plannerConfig.days === 4 ? 'border-[#006B9E] bg-cyan-50 dark:bg-cyan-950 text-[#006B9E] dark:text-[#00A8C6]' : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}">
            4+ DAYS
          </button>
        </div>
      </div>

      <!-- Q2: Interests -->
      <div>
        <label class="font-bold text-slate-800 dark:text-slate-200 text-sm block mb-3">${t('plannerQ2')}</label>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <label class="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer">
            <input type="checkbox" value="sea" class="planner-interest-cb w-4 h-4 text-[#006B9E] rounded" ${state.plannerConfig.interests.includes('sea') ? 'checked' : ''}>
            <span class="text-xs font-semibold text-slate-700 dark:text-slate-300">${t('catSea')}</span>
          </label>
          <label class="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer">
            <input type="checkbox" value="cafe" class="planner-interest-cb w-4 h-4 text-[#006B9E] rounded" ${state.plannerConfig.interests.includes('cafe') ? 'checked' : ''}>
            <span class="text-xs font-semibold text-slate-700 dark:text-slate-300">${t('catCafe')}</span>
          </label>
          <label class="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer">
            <input type="checkbox" value="nature" class="planner-interest-cb w-4 h-4 text-[#006B9E] rounded" ${state.plannerConfig.interests.includes('nature') ? 'checked' : ''}>
            <span class="text-xs font-semibold text-slate-700 dark:text-slate-300">${t('catNature')}</span>
          </label>
          <label class="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer">
            <input type="checkbox" value="restaurant" class="planner-interest-cb w-4 h-4 text-[#006B9E] rounded" ${state.plannerConfig.interests.includes('restaurant') ? 'checked' : ''}>
            <span class="text-xs font-semibold text-slate-700 dark:text-slate-300">${t('catRestaurant')}</span>
          </label>
        </div>
      </div>

      <button id="generate-itinerary-btn" class="w-full py-4 bg-[#006B9E] hover:bg-[#005680] text-white font-extrabold text-base rounded-2xl shadow-lg shadow-[#006B9E]/30 transition-all flex items-center justify-center gap-2">
        <i data-lucide="sparkles" class="w-5 h-5 text-[#F4B942]"></i> ${t('plannerGenerateBtn')}
      </button>
    </div>

    <!-- Output Itinerary Timeline -->
    <div id="itinerary-output" class="space-y-8"></div>
  `;

  const renderGeneratedOutput = () => {
    const outputContainer = container.querySelector('#itinerary-output');
    if (!outputContainer) return;

    const itinerary = generateTripItinerary(state.plannerConfig.days, state.plannerConfig.interests, state.lang);

    outputContainer.innerHTML = `
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-extrabold text-[#172B3A] dark:text-white">${t('plannerRecommendedTitle')} (${state.plannerConfig.days} ${state.lang === 'en' ? 'Days' : 'วัน'})</h2>
      </div>

      ${itinerary.map(day => `
        <div class="bg-white dark:bg-[#1E293B] rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-md space-y-6">
          <div class="pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 class="text-xl font-bold text-[#006B9E] dark:text-[#00A8C6]">${day.title}</h3>
          </div>

          <div class="space-y-6 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-cyan-100 dark:before:bg-slate-700">
            ${day.schedule.map(slot => `
              <div class="planner-slot relative flex items-start gap-4 pl-8">
                <div class="absolute left-1.5 top-1.5 w-4 h-4 rounded-full bg-[#00A8C6] border-2 border-white dark:border-slate-800"></div>
                <div class="shrink-0 w-20 text-xs font-bold text-[#006B9E] dark:text-[#00A8C6] pt-0.5">${slot.time}</div>
                <div class="flex-1 bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-4 items-center">
                  <img src="${slot.place.cover}" alt="${slot.place.nameTh}" class="w-full sm:w-28 h-20 object-cover rounded-xl shrink-0">
                  <div class="flex-1 text-left">
                    <span class="text-[10px] font-bold text-[#00A8C6] uppercase">📍 ${slot.districtName}</span>
                    <h4 class="font-bold text-sm text-[#172B3A] dark:text-white">${placeName(slot.place)}</h4>
                    <p class="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">${slot.place.address}</p>
                  </div>
                  <button data-planner-place="${slot.place.id}" class="view-place-btn text-xs font-bold text-[#006B9E] dark:text-[#00A8C6] hover:underline shrink-0">
                    ${t('plannerViewPlace')}
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('')}
    `;

    outputContainer.querySelectorAll('.view-place-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const pid = btn.getAttribute('data-planner-place');
        navigateTo('place-detail', pid);
      });
    });

    refreshLucideIcons();
  };

  container.querySelectorAll('.day-select-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const d = parseInt(btn.getAttribute('data-days'));
      state.plannerConfig.days = d;
      renderGeneratedOutput();
    });
  });

  const generateBtn = container.querySelector('#generate-itinerary-btn');
  if (generateBtn) {
    generateBtn.addEventListener('click', () => {
      const selectedInterests = Array.from(container.querySelectorAll('.planner-interest-cb:checked')).map(el => el.value);
      state.plannerConfig.interests = selectedInterests.length > 0 ? selectedInterests : ['sea', 'cafe'];
      renderGeneratedOutput();
    });
  }

  renderGeneratedOutput();

  return container;
}

/* ==========================================================================
   10. SAVED BOOKMARKS VIEW
   ========================================================================== */
function createSavedView() {
  const container = document.createElement('div');
  container.className = 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8';

  const savedPlaces = PLACES.filter(p => state.savedPlaceIds.includes(p.id));

  container.innerHTML = `
    <div class="text-center max-w-2xl mx-auto space-y-2">
      <span class="text-red-500 font-bold text-xs uppercase tracking-wider">SAVED PLACES</span>
      <h1 class="text-3xl font-extrabold text-[#172B3A] dark:text-white">${t('navSaved')}</h1>
    </div>

    ${savedPlaces.length === 0 ? `
      <div class="text-center py-16 bg-white dark:bg-[#1E293B] rounded-3xl border border-slate-100 dark:border-slate-800 p-8 space-y-4">
        <i data-lucide="heart" class="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto"></i>
        <h3 class="text-lg font-bold text-slate-700 dark:text-slate-200">${t('noSavedTitle')}</h3>
        <button id="saved-explore-btn" class="px-6 py-2.5 bg-[#006B9E] text-white font-bold text-xs rounded-xl shadow-md">
          ${t('exploreBtn')}
        </button>
      </div>
    ` : `
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        ${savedPlaces.map(p => {
          const districtObj = DISTRICTS.find(d => d.id === p.districtId);
          return `
            <div data-place-id="${p.id}" class="saved-card bg-white dark:bg-[#1E293B] rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-md card-hover cursor-pointer group flex flex-col justify-between">
              <div>
                <div class="relative h-48 overflow-hidden">
                  <img src="${p.cover}" alt="${p.nameTh}" class="w-full h-full object-cover">
                  <button data-remove-saved="${p.id}" class="remove-saved-btn absolute top-3 right-3 w-8 h-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-red-500 shadow-md">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                  </button>
                </div>
                <div class="p-4">
                  <span class="text-[10px] font-bold text-[#00A8C6] uppercase">📍 ${districtName(districtObj)}</span>
                  <h3 class="font-bold text-base text-[#172B3A] dark:text-white">${placeName(p)}</h3>
                  <p class="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">${p.address}</p>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `}
  `;

  const exploreBtn = container.querySelector('#saved-explore-btn');
  if (exploreBtn) {
    exploreBtn.addEventListener('click', () => navigateTo('home'));
  }

  container.querySelectorAll('.saved-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.remove-saved-btn')) return;
      const pid = card.getAttribute('data-place-id');
      navigateTo('place-detail', pid);
    });
  });

  container.querySelectorAll('.remove-saved-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const pid = btn.getAttribute('data-remove-saved');
      toggleBookmark(pid);
      renderCurrentView();
    });
  });

  return container;
}

function toggleBookmark(placeId) {
  if (!PLACES.some(place => place.id === placeId)) return;

  const index = state.savedPlaceIds.indexOf(placeId);
  if (index >= 0) {
    state.savedPlaceIds.splice(index, 1);
  } else {
    state.savedPlaceIds.push(placeId);
  }
  localStorage.setItem('chonburi_saved_places', JSON.stringify(state.savedPlaceIds));
}

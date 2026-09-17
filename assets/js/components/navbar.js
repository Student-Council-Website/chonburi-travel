import { i18n } from '../data/i18n.js';

export function createNavbar(onNavigate, onSearch, currentLang = 'th', currentTheme = 'light', onToggleTheme, onToggleLang) {
  const t = i18n[currentLang] || i18n.th;
  const header = document.createElement("header");
  header.className = "sticky top-0 z-40 bg-white/95 dark:bg-[#1E293B]/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 shadow-sm transition-colors";

  header.innerHTML = `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16 sm:h-20 gap-4">
        <!-- Logo -->
        <a href="#home" id="nav-logo" class="flex items-center gap-2.5 cursor-pointer group shrink-0">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#006B9E] to-[#00A8C6] flex items-center justify-center text-white shadow-md shadow-[#006B9E]/20 group-hover:scale-105 transition-transform">
            <i data-lucide="waves" class="w-6 h-6"></i>
          </div>
          <div>
            <span class="text-xl font-bold tracking-tight text-[#172B3A] dark:text-white block leading-none">CHONBURI</span>
            <span class="text-[10px] text-[#00A8C6] font-medium tracking-widest uppercase">${t.brandTagline}</span>
          </div>
        </a>

        <!-- Desktop Streamlined Navigation Links -->
        <nav class="hidden lg:flex items-center gap-1 xl:gap-2">
          <button data-nav="home" class="nav-link px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-[#006B9E] dark:hover:text-[#00A8C6] rounded-lg transition-colors flex items-center gap-1.5">
            <i data-lucide="home" class="w-4 h-4"></i> ${t.navHome}
          </button>
          <button data-nav="districts" class="nav-link px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-[#006B9E] dark:hover:text-[#00A8C6] rounded-lg transition-colors flex items-center gap-1.5">
            <i data-lucide="map-pin" class="w-4 h-4"></i> ${t.navDistricts}
          </button>
          <button data-nav="map" class="nav-link px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-[#006B9E] dark:hover:text-[#00A8C6] rounded-lg transition-colors flex items-center gap-1.5">
            <i data-lucide="map" class="w-4 h-4"></i> ${t.navMap}
          </button>
          <button data-nav="about" class="nav-link px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-[#006B9E] dark:hover:text-[#00A8C6] rounded-lg transition-colors flex items-center gap-1.5">
            <i data-lucide="landmark" class="w-4 h-4"></i> ${t.navAbout}
          </button>

          <!-- Categories Dropdown Menu -->
          <div class="relative dropdown-container">
            <button id="category-dropdown-btn" class="px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-[#006B9E] dark:hover:text-[#00A8C6] rounded-lg transition-colors flex items-center gap-1">
              <i data-lucide="grid" class="w-4 h-4"></i> ${t.navCategories} <i data-lucide="chevron-down" class="w-3.5 h-3.5 ml-0.5"></i>
            </button>
            <div id="category-dropdown-menu" class="hidden absolute top-full left-0 mt-1 w-48 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl py-2 z-50">
              <button data-nav="eat-drink" class="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2">
                <i data-lucide="utensils" class="w-4 h-4 text-[#00A8C6]"></i> ${t.navEatDrink}
              </button>
              <button data-nav="hotels" class="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2">
                <i data-lucide="hotel" class="w-4 h-4 text-[#00A8C6]"></i> ${t.navHotels}
              </button>
              <button data-nav="photo-spots" class="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2">
                <i data-lucide="camera" class="w-4 h-4 text-[#00A8C6]"></i> ${t.navPhotoSpots}
              </button>
              <div class="my-1 border-t border-slate-100 dark:border-slate-800"></div>
              <button data-nav="saved" class="w-full text-left px-4 py-2.5 text-xs font-semibold text-red-500 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2">
                <i data-lucide="heart" class="w-4 h-4 text-red-500"></i> ${t.navSaved}
              </button>
            </div>
          </div>

          <!-- Trip Planner Button -->
          <button data-nav="trip-planner" class="nav-link px-3.5 py-2 text-xs font-semibold text-white bg-[#006B9E] hover:bg-[#005680] rounded-xl shadow-md shadow-[#006B9E]/20 transition-all flex items-center gap-1.5 ml-1">
            <i data-lucide="compass" class="w-4 h-4"></i> ${t.navTripPlanner}
          </button>
        </nav>

        <!-- Right Quick Controls: Search, Theme, Language -->
        <div class="flex items-center gap-2">
          <!-- Desktop Search Input -->
          <div class="relative hidden xl:block w-44">
            <input 
              type="text" 
              id="header-search-input"
              placeholder="${t.quickSearchPlaceholder}" 
              class="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white border border-transparent focus:border-[#00A8C6] rounded-xl focus:outline-none transition-all"
            >
            <i data-lucide="search" class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2"></i>
          </div>

          <!-- Dark/Light Theme Toggle -->
          <button id="theme-toggle-btn" class="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-amber-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center" title="Toggle Theme">
            <i data-lucide="${currentTheme === 'dark' ? 'sun' : 'moon'}" class="w-4 h-4"></i>
          </button>

          <!-- Language Toggle -->
          <button id="lang-toggle-btn" class="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold transition-colors flex items-center gap-1" title="Toggle Language">
            <span>${currentLang === 'th' ? '🇹🇭 TH' : '🇬🇧 EN'}</span>
          </button>

          <!-- Mobile Hamburger -->
          <button id="mobile-menu-btn" class="lg:hidden p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
            <i data-lucide="menu" class="w-6 h-6"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile Drawer Overlay -->
    <div id="mobile-drawer" class="hidden lg:hidden fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm">
      <div class="fixed right-0 top-0 bottom-0 w-4/5 max-w-xs bg-white dark:bg-[#1E293B] p-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
        <div>
          <div class="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-[#006B9E] flex items-center justify-center text-white">
                <i data-lucide="waves" class="w-5 h-5"></i>
              </div>
              <span class="font-bold text-[#172B3A] dark:text-white">CHONBURI</span>
            </div>
            <button id="close-drawer-btn" class="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white">
              <i data-lucide="x" class="w-6 h-6"></i>
            </button>
          </div>

          <!-- Drawer Navigation Links -->
          <div class="py-4 space-y-1">
            <button data-nav="home" class="drawer-link w-full text-left px-4 py-2.5 font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl flex items-center gap-3 text-sm">
              <i data-lucide="home" class="w-4 h-4 text-[#00A8C6]"></i> ${t.navHome}
            </button>
            <button data-nav="about" class="drawer-link w-full text-left px-4 py-2.5 font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl flex items-center gap-3 text-sm">
              <i data-lucide="landmark" class="w-4 h-4 text-[#00A8C6]"></i> ${t.navAbout}
            </button>
            <button data-nav="districts" class="drawer-link w-full text-left px-4 py-2.5 font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl flex items-center gap-3 text-sm">
              <i data-lucide="map-pin" class="w-4 h-4 text-[#00A8C6]"></i> ${t.navDistricts}
            </button>
            <button data-nav="map" class="drawer-link w-full text-left px-4 py-2.5 font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl flex items-center gap-3 text-sm">
              <i data-lucide="map" class="w-4 h-4 text-[#00A8C6]"></i> ${t.navMap}
            </button>
            <button data-nav="eat-drink" class="drawer-link w-full text-left px-4 py-2.5 font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl flex items-center gap-3 text-sm">
              <i data-lucide="utensils" class="w-4 h-4 text-[#00A8C6]"></i> ${t.navEatDrink}
            </button>
            <button data-nav="hotels" class="drawer-link w-full text-left px-4 py-2.5 font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl flex items-center gap-3 text-sm">
              <i data-lucide="hotel" class="w-4 h-4 text-[#00A8C6]"></i> ${t.navHotels}
            </button>
            <button data-nav="photo-spots" class="drawer-link w-full text-left px-4 py-2.5 font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl flex items-center gap-3 text-sm">
              <i data-lucide="camera" class="w-4 h-4 text-[#00A8C6]"></i> ${t.navPhotoSpots}
            </button>
            <button data-nav="saved" class="drawer-link w-full text-left px-4 py-2.5 font-medium text-red-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl flex items-center gap-3 text-sm">
              <i data-lucide="heart" class="w-4 h-4 text-red-500"></i> ${t.navSaved}
            </button>
            <button data-nav="trip-planner" class="drawer-link w-full text-left px-4 py-3 font-semibold text-white bg-[#006B9E] rounded-xl flex items-center gap-3 text-sm mt-2 shadow-md">
              <i data-lucide="compass" class="w-4 h-4"></i> ${t.navTripPlanner}
            </button>
          </div>
        </div>

        <div class="pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 text-center">
          CHONBURI — More Than The Sea © 2026
        </div>
      </div>
    </div>
  `;

  // Attach Navigation Listeners
  header.querySelectorAll("[data-nav], .drawer-link").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const targetNav = btn.getAttribute("data-nav");
      if (targetNav) {
        onNavigate(targetNav);
        header.querySelector("#mobile-drawer").classList.add("hidden");
        const dropdownMenu = header.querySelector("#category-dropdown-menu");
        if (dropdownMenu) dropdownMenu.classList.add("hidden");
      }
    });
  });

  // Logo Click
  const logoBtn = header.querySelector("#nav-logo");
  logoBtn.addEventListener("click", (e) => {
    e.preventDefault();
    onNavigate("home");
  });

  // Dropdown Toggle
  const dropdownBtn = header.querySelector("#category-dropdown-btn");
  const dropdownMenu = header.querySelector("#category-dropdown-menu");
  if (dropdownBtn && dropdownMenu) {
    dropdownBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdownMenu.classList.toggle("hidden");
    });
    document.addEventListener("click", () => dropdownMenu.classList.add("hidden"));
  }

  // Drawer Toggle
  const drawerBtn = header.querySelector("#mobile-menu-btn");
  const drawerClose = header.querySelector("#close-drawer-btn");
  const drawer = header.querySelector("#mobile-drawer");

  if (drawerBtn && drawer) drawerBtn.addEventListener("click", () => drawer.classList.remove("hidden"));
  if (drawerClose && drawer) drawerClose.addEventListener("click", () => drawer.classList.add("hidden"));

  // Controls: Theme & Lang
  const themeBtn = header.querySelector("#theme-toggle-btn");
  if (themeBtn && onToggleTheme) {
    themeBtn.addEventListener("click", () => onToggleTheme());
  }

  const langBtn = header.querySelector("#lang-toggle-btn");
  if (langBtn && onToggleLang) {
    langBtn.addEventListener("click", () => onToggleLang());
  }

  const searchInput = header.querySelector("#header-search-input");
  if (searchInput && onSearch) {
    searchInput.addEventListener("input", (e) => onSearch(e.target.value));
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        onNavigate("map");
      }
    });
  }

  return header;
}

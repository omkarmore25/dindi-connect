// --- PWA Install Button Logic ---
let deferredInstallPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;

  const isMobile = window.innerWidth < 768;

  if (isMobile) {
    const banner = document.getElementById('installMobileBanner');
    if (banner && window.innerWidth < 768) {
      banner.classList.remove('hidden');

      document.getElementById('installMobileBtn')?.addEventListener('click', async () => {
        banner.classList.add('hidden');
        deferredInstallPrompt.prompt();
        await deferredInstallPrompt.userChoice;
        deferredInstallPrompt = null;
      });

      document.getElementById('dismissInstallBanner')?.addEventListener('click', () => {
        banner.classList.add('hidden');
      });
    }
  }
});
window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  document.getElementById('installMobileBanner')?.classList.add('hidden');
});

// --- Report Group Redirect Logic ---
window.openReportModal = (groupId, groupName, village) => {
  const params = new URLSearchParams({
    groupId: groupId,
    groupName: groupName,
    village: village
  });
  window.location.href = `/report.html?${params.toString()}`;
};

// Handlers moved up

// Global fallback for closing the report modal
window.addEventListener('click', (e) => {
  if (e.target.closest('#closeReportModalBtn') || e.target.id === 'reportGroupModal') {
    const m = document.getElementById('reportGroupModal');
    if (m) {
      m.classList.remove('active');
      if (m._closeTimeout) clearTimeout(m._closeTimeout);
      m._closeTimeout = setTimeout(() => m.classList.add('hidden'), 300);
    }
  }
});

document.addEventListener('DOMContentLoaded', async () => {
  // --- Mobile Nav Scroll Hide/Show ---
  let lastScrollTop = 0;
  const mobileNav = document.querySelector('nav.md\\:hidden.fixed');

  if (mobileNav) {
    window.addEventListener('scroll', () => {
      let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      if (scrollTop > lastScrollTop && scrollTop > 50) {
        // Scrolling down
        mobileNav.classList.add('nav-hidden');
      } else {
        // Scrolling up
        mobileNav.classList.remove('nav-hidden');
      }
      lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    }, { passive: true });
  }



  // --- Theme Toggle Setup ---
  const themeToggleGrp = document.querySelectorAll('#themeToggle');
  const darkIcons = document.querySelectorAll('#themeToggleDarkIcon');
  const lightIcons = document.querySelectorAll('#themeToggleLightIcon');

  let globalMap;
  let globalMarker;
  let activeLatInput, activeLngInput, activeButtonText, activeClearBtn;

  const initGlobalMapModal = () => {
    const modal = document.getElementById('mapPickerModal');
    const closeBtn = document.getElementById('closeMapModalBtn');
    const confirmBtn = document.getElementById('confirmMapBtn');
    if (!modal) return;

    if (!globalMap && typeof L !== 'undefined') {
      globalMap = L.map('globalMapContainer').setView([19.7515, 75.7139], 6);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
      }).addTo(globalMap);

      const provider = new window.GeoSearch.OpenStreetMapProvider({ params: { countrycodes: 'in' } });
      const searchControl = new window.GeoSearch.GeoSearchControl({
        provider: provider, style: 'bar', showMarker: false, retainZoomLevel: false, animateZoom: true, autoClose: true, searchLabel: 'Search location...', keepResult: true
      });
      globalMap.addControl(searchControl);

      globalMap.on('click', function (e) {
        if (globalMarker) globalMap.removeLayer(globalMarker);
        globalMarker = L.marker(e.latlng).addTo(globalMap);
      });
      globalMap.on('geosearch/showlocation', function (e) {
        if (globalMarker) globalMap.removeLayer(globalMarker);
        globalMarker = L.marker([e.location.y, e.location.x]).addTo(globalMap);
      });
    }

    window.openMapModal = (latInputId, lngInputId, btnTextId, clearBtnId) => {
      activeLatInput = document.getElementById(latInputId);
      activeLngInput = document.getElementById(lngInputId);
      activeButtonText = document.getElementById(btnTextId);
      activeClearBtn = document.getElementById(clearBtnId);

      modal.classList.remove('hidden');
      modal.classList.add('flex');

      setTimeout(() => {
        globalMap.invalidateSize();
        if (activeLatInput.value && activeLngInput.value) {
          const latlng = [parseFloat(activeLatInput.value), parseFloat(activeLngInput.value)];
          if (globalMarker) globalMap.removeLayer(globalMarker);
          globalMarker = L.marker(latlng).addTo(globalMap);
          globalMap.setView(latlng, 13);
        } else {
          if (globalMarker) globalMap.removeLayer(globalMarker);
          globalMap.setView([19.7515, 75.7139], 6);
        }
      }, 100);
    };

    if (closeBtn) closeBtn.onclick = () => {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    };

    if (confirmBtn) confirmBtn.onclick = () => {
      if (globalMarker) {
        const latlng = globalMarker.getLatLng();
        activeLatInput.value = latlng.lat;
        activeLngInput.value = latlng.lng;
        activeButtonText.textContent = '📍 Location Selected';
        activeButtonText.classList.remove('text-brand-600', 'dark:text-brand-400');
        activeButtonText.classList.add('text-green-600', 'dark:text-green-400');
        if (activeClearBtn) activeClearBtn.classList.remove('hidden');
      }
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    };
  };
  initGlobalMapModal();

  const updateIcons = () => {
    const isDark = document.documentElement.classList.contains('dark');
    const isTrad = document.documentElement.classList.contains('traditional');

    themeToggleGrp.forEach(btn => {
      let tradIcon = btn.querySelector('.themeToggleTradIcon');
      if (!tradIcon) {
        btn.insertAdjacentHTML('beforeend', '<svg class="themeToggleTradIcon hidden w-5 h-5 text-[#C8A97E]" fill="currentColor" viewBox="0 0 24 24"><path d="M14.25 2.25L13.132 5.045C12.339 7.027 10.777 8.589 8.795 9.382L6 10.5L8.795 11.618C10.777 12.411 12.339 13.973 13.132 15.955L14.25 18.75L15.368 15.955C16.161 13.973 17.723 12.411 19.705 11.618L22.5 10.5L19.705 9.382C17.723 8.589 16.161 7.027 15.368 5.045L14.25 2.25Z" /><path d="M6 15L5.441 16.398C5.044 17.389 4.264 18.169 3.273 18.566L1.875 19.125L3.273 19.684C4.264 20.081 5.044 20.861 5.441 21.852L6 23.25L6.559 21.852C6.956 20.861 7.736 20.081 8.727 19.684L10.125 19.125L8.727 18.566C7.736 18.169 6.956 17.389 6.559 16.398L6 15Z" /></svg>');
        tradIcon = btn.querySelector('.themeToggleTradIcon');
      }

      const darkIcon = btn.querySelector('#themeToggleDarkIcon');
      const lightIcon = btn.querySelector('#themeToggleLightIcon');

      if (darkIcon) darkIcon.classList.add('hidden');
      if (lightIcon) lightIcon.classList.add('hidden');
      if (tradIcon) tradIcon.classList.add('hidden');

      if (isTrad) {
        if (tradIcon) tradIcon.classList.remove('hidden');
      } else if (isDark) {
        if (lightIcon) lightIcon.classList.remove('hidden');
      } else {
        if (darkIcon) darkIcon.classList.remove('hidden');
      }
    });
  };

  // Restore theme on load
  if (localStorage.theme === 'traditional') {
    document.documentElement.classList.add('traditional');
    document.documentElement.classList.remove('dark');
  } else if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('traditional');
  } else {
    document.documentElement.classList.remove('dark', 'traditional');
  }

  updateIcons();

  themeToggleGrp.forEach(btn => {
    btn.addEventListener('click', () => {
      const html = document.documentElement;
      if (html.classList.contains('traditional')) {
        // Trad -> Light
        html.classList.remove('traditional');
        html.classList.remove('dark');
        localStorage.theme = 'light';
      } else if (html.classList.contains('dark')) {
        // Dark -> Trad
        html.classList.remove('dark');
        html.classList.add('traditional');
        localStorage.theme = 'traditional';
      } else {
        // Light -> Dark
        html.classList.add('dark');
        localStorage.theme = 'dark';
      }
      updateIcons();
    });
  });

  // Common Header Update (runs in background)
  const updateAuthUI = async () => {
    try {
      const res = await fetch('/api/auth/current_user');
      const data = await res.json();
      const authSection = document.getElementById('auth-section');
      if (authSection) {
        if (data.isAuthenticated) {
          const u = data.user;
          authSection.innerHTML = `<span class="user-badge bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 font-bold px-3 py-1.5 rounded-full text-xs border border-brand-200 dark:border-brand-800 shadow-sm">${u.username || u.email.split('@')[0]}</span>`;
        } else {
          authSection.innerHTML = `<a href="/auth.html" class="text-white bg-slate-800 dark:bg-brand-500 hover:bg-slate-700 dark:hover:bg-brand-400 px-4 py-2 rounded-xl transition shadow-md font-semibold text-sm">Sign In</a>`;
        }
      }
    } catch (err) {
      console.error("Error checking auth status", err);
    }
  };
  updateAuthUI();

  const path = window.location.pathname;
  const isHomePage = path === '/' || path.endsWith('/index.html') || path === '';
  const isCalendarPage = path.endsWith('/calendar.html');

  // --- index.html Logic ---
  if (isHomePage) {
    let currentSearch = '';
    let currentType = 'All';

    const fetchGroups = async () => {
      try {
        const res = await fetch(`/api/groups?search=${encodeURIComponent(currentSearch)}&type=${encodeURIComponent(currentType)}&t=${Date.now()}`);
        const groups = await res.json();
        renderGroups(groups);
      } catch (err) {
        console.error(err);
      }
    };

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        currentSearch = e.target.value;
        fetchGroups();
      });
    }

    const typeFilters = document.querySelectorAll('#groupTypeFilters .filter-btn');
    if (typeFilters.length > 0) {
      typeFilters.forEach(btn => {
        btn.addEventListener('click', (e) => {
          typeFilters.forEach(b => {
            b.classList.remove('active', 'bg-brand-500', 'text-white', 'shadow-md');
            b.classList.add('bg-white', 'dark:bg-slate-800', 'text-slate-600', 'dark:text-slate-300', 'border', 'border-slate-200', 'dark:border-slate-700');
          });
          const target = e.currentTarget;
          target.classList.add('active', 'bg-brand-500', 'text-white', 'shadow-md');
          target.classList.remove('bg-white', 'dark:bg-slate-800', 'text-slate-600', 'dark:text-slate-300', 'border', 'border-slate-200', 'dark:border-slate-700');
          currentType = target.dataset.type;
          fetchGroups();
        });
      });
    }

    const renderGroups = (groups) => {
      const gCount = document.getElementById('groupCount');
      if (gCount) gCount.innerText = groups.length;

      const container = document.getElementById('groupsContainer');
      const template = document.getElementById('group-card-template');
      container.innerHTML = '';

      if (groups.length === 0) {
        container.innerHTML = `
          <div class="col-span-full flex flex-col items-center justify-center py-20 animate-fade-in">
            <div class="w-20 h-20 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center mb-6">
              <svg class="w-10 h-10 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </div>
            <h4 class="font-bold text-lg text-slate-600 dark:text-slate-300 mb-2">No groups found</h4>
            <p class="text-slate-400 dark:text-slate-500 text-sm text-center max-w-xs">Try searching for a different village, or check back later as new groups join the platform.</p>
          </div>`;
        return;
      }

      groups.forEach((g, index) => {
        const clone = template.firstElementChild.cloneNode(true);

        // Add staggering animation delay
        const cardDiv = clone.querySelector('.glass-card');
        if (cardDiv) cardDiv.style.animationDelay = `${index * 50}ms`;

        clone.querySelector('.group-name-slot').textContent = g.groupName;
        const typeSlot = clone.querySelector('.group-type-slot');
        if (typeSlot) typeSlot.textContent = g.groupType || 'Dindi';
        clone.querySelector('.group-village-slot').textContent = g.village;
        clone.querySelector('.group-members-slot').innerHTML = `${g.memberCount} <span class="hidden sm:inline">members</span>`;
        clone.querySelector('.group-initial-slot').textContent = g.leaderName.charAt(0).toUpperCase();
        clone.querySelector('.group-leader-slot').textContent = g.leaderName;
        clone.querySelector('.group-profile-link').href = `/group.html?id=${g._id}`;

        const actionSlot = clone.querySelector('.group-action-slot');
        const innerFlex = actionSlot.querySelector('.flex.w-full');

        const reportBtnHtml = `<button onclick="openReportModal('${g._id}', '${g.groupName.replace(/'/g, "\\'")}', '${g.village.replace(/'/g, "\\'")}')" class="px-4 py-3.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-2xl font-bold transition flex items-center justify-center shrink-0 border border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 dark:border-red-500/20 shadow-sm" title="Report Group">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          </button>`;

        if (g.acceptingBookings) {
          innerFlex.innerHTML = `<a href="/book-group.html?id=${g._id}" 
          class="flex-1 text-center bg-brand-500 hover:bg-brand-600 text-white py-3.5 rounded-2xl font-bold transition transform hover:-translate-y-0.5 active:translate-y-0 shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            Book this Group
          </a>${reportBtnHtml}`;
        } else {
          innerFlex.innerHTML = `<div class="flex-1 text-center bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 py-3.5 rounded-2xl font-bold border border-slate-200 dark:border-slate-700">Currently Unavailable</div>${reportBtnHtml}`;
        }

        container.appendChild(clone);
      });
    };

    fetchGroups();
  }

  // --- Global Donation Logic ---
  window.openDonationModal = (groupName, groupId) => {
    const params = new URLSearchParams({
      groupName: groupName || 'Vandan Community (General)',
      groupId: groupId || ''
    });
    window.location.href = `/payment.html?${params.toString()}`;
  };





  // --- calendar.html Logic ---
  if (isCalendarPage) {
    let currentSearch = '';
    let currentType = 'All';
    let currentSection = 'events';

    const fetchCalendarData = async () => {
      try {
        const [eventsRes, compsRes, ceRes] = await Promise.all([
          fetch(`/api/events?search=${encodeURIComponent(currentSearch)}&type=${encodeURIComponent(currentType)}&t=${Date.now()}`),
          fetch(`/api/competitions?search=${encodeURIComponent(currentSearch)}&type=${encodeURIComponent(currentType)}&t=${Date.now()}`),
          fetch(`/api/community-events?search=${encodeURIComponent(currentSearch)}&type=${encodeURIComponent(currentType)}&t=${Date.now()}`)
        ]);
        const events = await eventsRes.json();
        const comps = await compsRes.json();
        const cevents = await ceRes.json();

        const taggedEvents = Array.isArray(events) ? events.map(e => ({ ...e, _itemType: 'event' })) : [];
        const taggedComps = Array.isArray(comps) ? comps.map(c => ({ ...c, _itemType: 'comp' })) : [];
        const taggedCEvents = Array.isArray(cevents) ? cevents.map(c => ({ ...c, _itemType: 'community-event' })) : [];

        let combined = [...taggedEvents, ...taggedComps, ...taggedCEvents].sort((a, b) => new Date(a.date) - new Date(b.date));

        if (currentSection === 'events') {
          combined = combined.filter(i => i._itemType === 'event');
        } else if (currentSection === 'competitions') {
          combined = combined.filter(i => i._itemType === 'comp');
        } else if (currentSection === 'community-events') {
          combined = combined.filter(i => i._itemType === 'community-event');
        }

        renderCalendar(combined);
      } catch (err) {
        console.error(err);
      }
    };

    const searchInput = document.getElementById('calendarSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        currentSearch = e.target.value;
        fetchCalendarData();
      });
    }

    const typeFilters = document.querySelectorAll('#calendarTypeFilters .filter-btn');
    if (typeFilters.length > 0) {
      typeFilters.forEach(btn => {
        btn.addEventListener('click', (e) => {
          typeFilters.forEach(b => {
            b.classList.remove('active', 'bg-brand-500', 'text-white', 'shadow-md');
            b.classList.add('bg-white', 'dark:bg-slate-800', 'text-slate-600', 'dark:text-slate-300');
          });
          const target = e.currentTarget;
          target.classList.add('active', 'bg-brand-500', 'text-white', 'shadow-md');
          target.classList.remove('bg-white', 'dark:bg-slate-800', 'text-slate-600', 'dark:text-slate-300');
          currentType = target.dataset.type;
          fetchCalendarData();
        });
      });
    }

    const sectionTabs = document.querySelectorAll('.calendar-section-tab');
    if (sectionTabs.length > 0) {
      sectionTabs.forEach(btn => {
        btn.addEventListener('click', (e) => {
          sectionTabs.forEach(b => {
            b.classList.remove('tab-active');
            b.classList.add('text-slate-500', 'dark:text-slate-400', 'hover:text-brand-500');
          });
          const target = e.currentTarget;
          target.classList.add('tab-active');
          target.classList.remove('text-slate-500', 'dark:text-slate-400', 'hover:text-brand-500');
          currentSection = target.dataset.section;
          
          const filters = document.getElementById('calendarTypeFilters');
          if (filters) {
            if (currentSection === 'community-events') {
              filters.classList.add('hidden');
            } else {
              filters.classList.remove('hidden');
            }
          }

          fetchCalendarData();
        });
      });
    }

    const renderCalendar = (items) => {
      const container = document.getElementById('calendarContainer');
      const eventTemplate = document.getElementById('event-row-template');
      const compTemplate = document.getElementById('comp-row-template');
      const ceTemplate = document.getElementById('community-event-row-template');

      if (!container) return;

      Array.from(container.children).forEach(child => {
        if (!child.classList.contains('absolute')) container.removeChild(child);
      });

      if (items.length === 0) {
        container.insertAdjacentHTML('beforeend', `
          <div class="flex flex-col items-center justify-center py-20 animate-fade-in z-10 relative">
            <div class="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6">
              <svg class="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </div>
            <h4 class="font-bold text-lg text-slate-600 dark:text-slate-300 mb-2">No items found</h4>
            <p class="text-slate-400 dark:text-slate-500 text-sm text-center max-w-xs">No events or competitions match your search.</p>
          </div>`);
        return;
      }

      items.forEach((item, index) => {
        const date = new Date(item.date);

        if (item._itemType === 'event') {
          const clone = eventTemplate.firstElementChild.cloneNode(true);
          const rowDiv = clone.querySelector('.group');
          if (rowDiv) rowDiv.style.animationDelay = `${index * 50}ms`;

          clone.querySelector('.event-month-slot').textContent = date.toLocaleString('default', { month: 'short' });
          clone.querySelector('.event-day-slot').textContent = date.getDate();
          clone.querySelector('.event-temple-slot').textContent = item.templeName;

          const typeSlot = clone.querySelector('.event-type-slot');
          if (typeSlot) typeSlot.textContent = item.performingGroupId?.groupType || 'Event';

          clone.querySelector('.event-village-slot').textContent = item.village;
          const groupLink = clone.querySelector('.event-group-slot');
          groupLink.textContent = item.performingGroupId.groupName;
          groupLink.href = `/group.html?id=${item.performingGroupId._id}`;

          if (item.locationCoordinates && item.locationCoordinates.lat && item.locationCoordinates.lng) {
            const mapLink = clone.querySelector('.event-map-slot');
            if (mapLink) {
              mapLink.href = `https://www.openstreetmap.org/?mlat=${item.locationCoordinates.lat}&mlon=${item.locationCoordinates.lng}#map=15/${item.locationCoordinates.lat}/${item.locationCoordinates.lng}`;
              mapLink.classList.remove('hidden');
            }
          }
          container.appendChild(clone);
        } else if (item._itemType === 'comp') {
          const clone = compTemplate.firstElementChild.cloneNode(true);
          const rowDiv = clone.querySelector('.group');
          if (rowDiv) rowDiv.style.animationDelay = `${index * 50}ms`;

          clone.querySelector('.comp-month-slot').textContent = date.toLocaleString('default', { month: 'short' });
          clone.querySelector('.comp-day-slot').textContent = date.getDate();
          clone.querySelector('.comp-title-slot').textContent = item.title;

          const typeSlot = clone.querySelector('.comp-type-slot');
          if (typeSlot) typeSlot.textContent = (item.eventType || 'All') + ' COMPETITION';

          clone.querySelector('.comp-location-slot').textContent = item.location;
          clone.querySelector('.comp-desc-slot').innerText = item.description;
          clone.querySelector('.comp-count-slot').textContent = `${item.registeredGroups.length} groups`;

          if (item.locationCoordinates && item.locationCoordinates.lat && item.locationCoordinates.lng) {
            const mapLink = clone.querySelector('.comp-map-slot');
            if (mapLink) {
              mapLink.href = `https://www.openstreetmap.org/?mlat=${item.locationCoordinates.lat}&mlon=${item.locationCoordinates.lng}#map=15/${item.locationCoordinates.lat}/${item.locationCoordinates.lng}`;
              mapLink.classList.remove('hidden');
            }
          }

          if (item.photos && item.photos.length > 0) {
            const posterCont = clone.querySelector('.comp-poster-container');
            const posterImg = clone.querySelector('.comp-poster-slot');
            if (posterCont && posterImg) {
              posterImg.src = item.photos[0];
              posterCont.classList.remove('hidden');
            }
          }

          if (clone.classList.contains('comp-card-btn')) {
            clone.onclick = () => { window.location.href = `/competition.html?id=${item._id}`; };
          } else {
            const cardBtn = clone.querySelector('.comp-card-btn');
            if (cardBtn) {
              cardBtn.onclick = () => { window.location.href = `/competition.html?id=${item._id}`; };
            }
          }

          container.appendChild(clone);
        } else if (item._itemType === 'community-event') {
          if (!ceTemplate) return;
          const clone = ceTemplate.firstElementChild.cloneNode(true);
          const rowDiv = clone.querySelector('.group');
          if (rowDiv) rowDiv.style.animationDelay = `${index * 50}ms`;

          clone.querySelector('.ce-month-slot').textContent = date.toLocaleString('default', { month: 'short' });
          clone.querySelector('.ce-day-slot').textContent = date.getDate();
          clone.querySelector('.ce-title-slot').textContent = item.eventName;
          clone.querySelector('.ce-type-slot').textContent = item.eventType || 'Event';
          clone.querySelector('.ce-location-slot').textContent = item.venue;
          clone.querySelector('.ce-time-slot').textContent = item.time || 'N/A';
          clone.querySelector('.ce-desc-slot').innerText = item.description;
          clone.querySelector('.ce-organizer-slot').textContent = item.organizer;
          clone.querySelector('.ce-contact-slot').textContent = item.contact;
          const phoneLink = clone.querySelector('.ce-contact-number-slot');
          phoneLink.textContent = item.contactNumber;
          phoneLink.href = `tel:${item.contactNumber}`;

          const badgesSlot = clone.querySelector('.ce-badges-slot');
          if (badgesSlot) {
            if (item.foodProvided) {
              badgesSlot.innerHTML += `<span class="text-[10px] uppercase font-bold px-2 py-1 rounded-md bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400">Food Provided</span>`;
            }
            if (item.entryFee && item.entryFeeAmount > 0) {
              badgesSlot.innerHTML += `<span class="text-[10px] uppercase font-bold px-2 py-1 rounded-md bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400">Entry: ₹${item.entryFeeAmount}</span>`;
            } else {
              badgesSlot.innerHTML += `<span class="text-[10px] uppercase font-bold px-2 py-1 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">Free Entry</span>`;
            }
          }

          // Make the whole card clickable to view details
          const cardClickTarget = clone.classList.contains('ce-card-btn') ? clone : clone.querySelector('.ce-card-btn');
          if (cardClickTarget) {
            cardClickTarget.style.cursor = 'pointer';
            cardClickTarget.onclick = () => { window.location.href = `/community-event.html?id=${item._id}`; };
          } else {
            clone.style.cursor = 'pointer';
            clone.onclick = () => { window.location.href = `/community-event.html?id=${item._id}`; };
          }

          container.appendChild(clone);
        }
      });
    };

    fetchCalendarData();
  }

  // --- auth.html Logic ---
  if (path === '/auth.html') {
    const authView = document.getElementById('authView');
    const profileView = document.getElementById('profileView');
    const statusBox = document.getElementById('statusMessage');
    const urlParams = new URLSearchParams(window.location.search);

    let user = null;
    try {
      const authCheckRes = await fetch('/api/auth/current_user');
      const authCheckData = await authCheckRes.json();
      if (authCheckData.isAuthenticated) {
        user = authCheckData.user;
      }
    } catch (e) {
      console.error('Failed to check auth status', e);
    }

    let statusTimeout;
    const showStatus = (msg, isError) => {
      clearTimeout(statusTimeout);
      statusBox.textContent = msg;
      statusBox.className = `mb-6 p-4 rounded-2xl text-sm font-semibold shadow-md transition-all text-center block ${isError ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
          : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
        }`;
      statusTimeout = setTimeout(() => {
        statusBox.classList.remove('block');
        statusBox.classList.add('hidden');
      }, 5000);
    };

    const showConfirm = async (message) => {
      return await window.vandanModal.show({
        title: 'Confirm Action',
        text: message,
        confirmText: 'Yes, Proceed',
        cancelText: 'Cancel'
      });
    };

    if (urlParams.get('verified') === 'true') {
      showStatus('Email successfully verified! You can now log in.', false);
    } else if (urlParams.get('error')) {
      showStatus('Authentication failed. Please try again.', true);
    }

    if (user) {
      if (!user.isVerified) {
        authView.classList.remove('hidden');
        showStatus('Please check your email to verify your account.', true);
        statusBox.className = 'mb-6 p-4 rounded-2xl text-sm font-semibold shadow-md transition-all text-center block bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800';
      } else {
        profileView.classList.remove('hidden');
        document.getElementById('userEmail').textContent = user.username || user.email.split('@')[0];

        // Check if session is admin to show the panel link
        fetch('/api/admin/check').then(r => r.json()).then(d => {
          if (d.isAdmin) {
            const al = document.getElementById('adminMasterLink');
            if (al) al.classList.remove('hidden');
          }
        });

        // --- Account Deletion Logic ---
        const deleteAccountBtn = document.getElementById('deleteAccountBtn');
        if (deleteAccountBtn) {
          deleteAccountBtn.onclick = async () => {
            const confirmed = await window.vandanModal.show({
              title: 'Delete Account?',
              text: 'This action is PERMANENT. You will lose your profile, all registered groups, events, and booking history. This cannot be undone.',
              type: 'error',
              confirmText: 'Yes, Delete Everything',
              cancelText: 'Cancel'
            });

            if (confirmed) {
              deleteAccountBtn.disabled = true;
              deleteAccountBtn.textContent = 'Deleting...';
              try {
                const res = await fetch('/api/auth/delete-account', { method: 'DELETE' });
                const data = await res.json();
                if (res.ok) {
                  showStatus('Account deleted successfully. Farewell!', false);
                  setTimeout(() => window.location.href = '/', 2000);
                } else {
                  showStatus('Failed: ' + (data.error || 'Please try again'), true);
                  deleteAccountBtn.disabled = false;
                  deleteAccountBtn.textContent = 'Delete Account';
                }
              } catch (err) {
                console.error(err);
                showStatus('Network error during account deletion.', true);
                deleteAccountBtn.disabled = false;
                deleteAccountBtn.textContent = 'Delete Account';
              }
            }
          };
        }

        // Fetch group ownership
        const loadDashboard = async () => {
          try {
            const res = await fetch(`/api/groups/my-groups?t=${Date.now()}`);
            if (res.ok) {
              const groups = await res.json();
              const listSection = document.getElementById('myGroupsListSection');
              const container = document.getElementById('myGroupsContainer');
              const regSection = document.getElementById('groupRegistrationSection');
              const editSection = document.getElementById('ownerDashboardSection');
              // Dashboard Sections
              const editMenu = document.getElementById('dashMenuState');
              const editProfile = document.getElementById('dashEditProfileState');
              const editEvents = document.getElementById('dashEventsState');

              const showList = () => {
                listSection.classList.remove('hidden');
                regSection.classList.add('hidden');
                editSection.classList.add('hidden');
                // Reset dash to menu state
                editMenu.classList.remove('hidden');
                editProfile.classList.add('hidden');
                editEvents.classList.add('hidden');
              };

              // DASHBOARD MENU NAVIGATION
              document.getElementById('showEditProfileBtn').onclick = (e) => {
                e.preventDefault();
                editMenu.classList.add('hidden');
                editProfile.classList.remove('hidden');
                editEvents.classList.add('hidden');
              };

              document.getElementById('showManageEventsBtn').onclick = (e) => {
                e.preventDefault();
                editMenu.classList.add('hidden');
                editEvents.classList.remove('hidden');
                editProfile.classList.add('hidden');
              };

              document.querySelectorAll('.backToDashMenu').forEach(btn => {
                btn.onclick = (e) => {
                  e.preventDefault();
                  editMenu.classList.remove('hidden');
                  editProfile.classList.add('hidden');
                  editEvents.classList.add('hidden');
                };
              });

              document.getElementById('showRegisterBtn').onclick = () => {
                listSection.classList.add('hidden');
                regSection.classList.remove('hidden');
                document.getElementById('cancelRegisterBtn').classList.remove('hidden');
              };

              document.getElementById('cancelRegisterBtn').onclick = showList;
              document.getElementById('backToListBtn').onclick = showList;



              if (groups.length === 0) {
                listSection.classList.add('hidden');
                editSection.classList.add('hidden');
                regSection.classList.remove('hidden');
              } else {
                showList();
                container.innerHTML = '';
                groups.forEach(group => {
                  const card = document.createElement('div');
                  card.className = 'glass-input p-4 rounded-xl flex justify-between items-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition border border-slate-200 dark:border-slate-700';
                  card.innerHTML = `
                      <div class="flex-1">
                        <div class="flex items-center gap-2 mb-0.5">
                          <h4 class="font-bold text-slate-800 dark:text-slate-100">${group.groupName}</h4>
                          <span class="text-[9px] uppercase font-black px-2 py-0.5 rounded-md bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-400 leading-none">${group.groupType || 'Dindi'}</span>
                        </div>
                        <p class="text-xs text-slate-500 font-medium">${group.village}</p>
                      </div>
                      <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                    `;
                  card.onclick = () => {
                    // Load Editor
                    listSection.classList.add('hidden');
                    editSection.classList.remove('hidden');

                    document.getElementById('dashGroupName').textContent = group.groupName;
                    document.getElementById('dashEditGroupName').value = group.groupName;
                    document.getElementById('dashEmail').value = group.email || '';
                    document.getElementById('dashGroupType').value = group.groupType || 'Dindi';
                    document.getElementById('dashLeaderName').value = group.leaderName;
                    document.getElementById('dashMemberCount').value = group.memberCount;
                    document.getElementById('dashContact').value = group.contactNumber;
                    document.getElementById('dashRegId').value = group.registrationId || '';
                    document.getElementById('dashDesc').value = group.description || '';
                    document.getElementById('dashAchieve').value = (group.achievements || []).join(', ');
                    document.getElementById('dashAccepting').checked = group.acceptingBookings;

                    const dashGallery = document.getElementById('dashPhotoGallery');
                    const renderDashGallery = () => {
                      dashGallery.innerHTML = '';
                      if (!group.photos || group.photos.length === 0) {
                        dashGallery.innerHTML = '<p class="col-span-full text-xs text-slate-500 italic text-center py-4">No photos in gallery.</p>';
                        return;
                      }
                      group.photos.forEach(photo => {
                        const container = document.createElement('div');
                        container.className = 'photo-container relative aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 min-h-[100px] flex items-center justify-center';
                        container.innerHTML = `
                             <img src="${photo}" class="w-full h-full object-cover" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                             <div class="hidden text-[10px] text-slate-400 font-medium p-2 text-center">Broken link</div>
                             <button class="photo-delete-btn shadow-lg z-10" title="Delete Photo">
                               <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                             </button>
                           `;
                        container.querySelector('.photo-delete-btn').onclick = async () => {
                          const confirm = await showConfirm('Are you sure you want to delete this photo?');
                          if (confirm) {
                            try {
                              const updatedPhotos = group.photos.filter(p => p !== photo);
                              const delRes = await fetch(`/api/groups/${group._id}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ photos: updatedPhotos })
                              });
                              if (delRes.ok) {
                                const updatedGroup = await delRes.json();
                                group.photos = updatedGroup.photos;
                                renderDashGallery();
                                showStatus('Photo deleted.', false);
                              } else {
                                showStatus('Failed to delete photo.', true);
                              }
                            } catch (err) { console.error(err); }
                          }
                        };
                        dashGallery.appendChild(container);
                      });
                    };
                    renderDashGallery();

                    const updateForm = document.getElementById('dashUpdateForm');
                    const photoForm = document.getElementById('dashPhotoForm');
                    const deleteBtn = document.getElementById('dashDeleteBtn');

                    updateForm.onsubmit = async (e) => {
                      e.preventDefault();
                      const btn = document.getElementById('dashUpdateBtn');
                      btn.textContent = 'Saving...'; btn.disabled = true;
                      const payload = {
                        groupName: document.getElementById('dashEditGroupName').value,
                        email: document.getElementById('dashEmail').value,
                        groupType: document.getElementById('dashGroupType').value,
                        leaderName: document.getElementById('dashLeaderName').value,
                        memberCount: document.getElementById('dashMemberCount').value,
                        contactNumber: document.getElementById('dashContact').value,
                        registrationId: document.getElementById('dashRegId').value,
                        description: document.getElementById('dashDesc').value,
                        achievements: document.getElementById('dashAchieve').value,
                        acceptingBookings: document.getElementById('dashAccepting').checked
                      };
                      console.log('[DEBUG] Sending PUT payload:', payload);
                      try {
                        const updateRes = await fetch(`/api/groups/${group._id}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(payload)
                        });
                        if (updateRes.ok) {
                          showStatus('Profile updated successfully!', false);
                          setTimeout(showList, 1000); // Redirect back to list after 1s
                        } else showStatus('Failed to update profile.', true);
                      } catch (err) { console.error(err); }
                      finally { btn.textContent = 'Save Changes'; btn.disabled = false; }
                    };

                    photoForm.onsubmit = async (e) => {
                      e.preventDefault();
                      const fileInput = document.getElementById('dashPhotoFile');
                      if (!fileInput.files[0]) return;
                      const btn = document.getElementById('dashPhotoBtn');
                      btn.textContent = 'Uploading...'; btn.disabled = true;
                      const formData = new FormData();
                      formData.append('photo', fileInput.files[0]);
                      try {
                        const uploadRes = await fetch(`/api/groups/${group._id}/photos`, {
                          method: 'POST',
                          body: formData
                        });
                        if (uploadRes.ok) {
                          const result = await uploadRes.json();
                          group.photos = result.group.photos; // Sync with server array
                          renderDashGallery();
                          showStatus('Photo added to gallery!', false);
                          fileInput.value = '';
                        } else { showStatus('Failed to upload photo.', true); }
                      } catch (err) { console.error(err); }
                      finally { btn.textContent = 'Upload Photo'; btn.disabled = false; }
                    };

                    const dashEventsList = document.getElementById('dashEventsList');
                    const renderDashEvents = async () => {
                      dashEventsList.innerHTML = '<div class="text-xs text-slate-500 text-center py-2">Loading events...</div>';
                      try {
                        const res = await fetch(`/api/events?groupId=${group._id}`);
                        if (res.ok) {
                          const events = await res.json();
                          dashEventsList.innerHTML = '';
                          if (events.length === 0) {
                            dashEventsList.innerHTML = '<div class="text-xs text-slate-500 italic text-center py-4">No upcoming performances.</div>';
                            return;
                          }
                          events.forEach(evt => {
                            const div = document.createElement('div');
                            div.className = 'premium-event-card flex items-center justify-between shadow-sm hover:shadow-md transition-all group mb-2';
                            const evtDate = new Date(evt.date);
                            div.innerHTML = `
                                      <div class="flex items-center gap-3">
                                         <div class="date-box rounded-xl flex flex-col items-center justify-center shrink-0">
                                            <span class="text-[9px] font-black uppercase leading-none">${evtDate.toLocaleString('default', { month: 'short' })}</span>
                                            <span class="text-base font-bold leading-none mt-0.5">${evtDate.getDate()}</span>
                                         </div>
                                         <div class="min-w-0">
                                            <div class="font-bold text-sm truncate">${evt.templeName}</div>
                                            <div class="text-[10px] opacity-60 font-medium truncate">${evt.village}</div>
                                         </div>
                                      </div>
                                      <button class="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all active:scale-90 shrink-0" title="Remove Event">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                      </button>
                                    `;
                            div.querySelector('button').onclick = async () => {
                              if (await showConfirm('Remove this event?')) {
                                try {
                                  const delRes = await fetch(`/api/events/${evt._id}`, { method: 'DELETE' });
                                  if (delRes.ok) {
                                    showStatus('Event removed', false);
                                    renderDashEvents();
                                  } else {
                                    showStatus('Failed to remove event.', true);
                                  }
                                } catch (e) { console.error(e); }
                              }
                            };
                            dashEventsList.appendChild(div);
                          });
                        }
                      } catch (err) { console.error(err); }
                    };
                    renderDashEvents();

                    document.getElementById('openDashMapBtn').onclick = () => {
                      window.openMapModal('dashEventLat', 'dashEventLng', 'dashMapBtnText', 'dashEventClearMap');
                    };
                    const dashClearBtn = document.getElementById('dashEventClearMap');
                    dashClearBtn.onclick = () => {
                      document.getElementById('dashEventLat').value = '';
                      document.getElementById('dashEventLng').value = '';
                      const textSpan = document.getElementById('dashMapBtnText');
                      textSpan.textContent = 'Pick Location on Map';
                      textSpan.classList.add('text-brand-600', 'dark:text-brand-400');
                      textSpan.classList.remove('text-green-600', 'dark:text-green-400');
                      dashClearBtn.classList.add('hidden');
                    };

                    const eventForm = document.getElementById('dashEventForm');
                    eventForm.onsubmit = async (e) => {
                      e.preventDefault();
                      const btn = document.getElementById('dashEventBtn');
                      btn.textContent = 'Adding...'; btn.disabled = true;
                      const payload = {
                        templeName: document.getElementById('dashEventTemple').value,
                        village: document.getElementById('dashEventVillage').value,
                        date: document.getElementById('dashEventDate').value,
                        performingGroupId: group._id
                      };
                      const lat = document.getElementById('dashEventLat').value;
                      const lng = document.getElementById('dashEventLng').value;
                      if (lat && lng) {
                        payload.locationCoordinates = { lat: Number(lat), lng: Number(lng) };
                      }

                      try {
                        const res = await fetch('/api/events', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(payload)
                        });
                        if (res.ok) {
                          showStatus('Event added successfully!', false);
                          eventForm.reset();
                          renderDashEvents();
                        } else {
                          showStatus('Failed to add event.', true);
                        }
                      } catch (err) { console.error(err); }
                      finally { btn.textContent = 'Add Event'; btn.disabled = false; }
                    };

                    deleteBtn.onclick = async (e) => {
                      e.preventDefault();
                      const confirmed = await showConfirm(`Are you sure you want to permanently delete ${group.groupName}? This cannot be undone.`);
                      if (confirmed) {
                        deleteBtn.textContent = 'Deleting...';
                        deleteBtn.disabled = true;
                        try {
                          const delRes = await fetch(`/api/groups/${group._id}`, { method: 'DELETE' });
                          if (delRes.ok) {
                            showStatus('Group deleted successfully.', false);
                            deleteBtn.textContent = 'Permanently Delete Group';
                            deleteBtn.disabled = false;
                            loadDashboard(); // Reload list
                            window.scrollTo(0, 0);
                          } else {
                            const data = await delRes.json();
                            showStatus('Failed to delete group: ' + (data.error || 'Unknown error'), true);
                            window.scrollTo(0, 0);
                            deleteBtn.textContent = 'Permanently Delete Group';
                            deleteBtn.disabled = false;
                          }
                        } catch (err) {
                          console.error(err);
                          showStatus('Network error while deleting.', true);
                          window.scrollTo(0, 0);
                          deleteBtn.textContent = 'Permanently Delete Group';
                          deleteBtn.disabled = false;
                        }
                      }
                    };
                  };
                  container.appendChild(card);
                });
              }
            } else {
              document.getElementById('groupRegistrationSection').classList.remove('hidden');
            }
          } catch (err) {
            console.error(err);
          }
        };

        const loadCompetitionsDashboard = async () => {
          try {
            const res = await fetch('/api/competitions/my-competitions');
            if (res.ok) {
              const comps = await res.json();
              const listSection = document.getElementById('myCompetitionsListSection');
              const container = document.getElementById('myCompetitionsContainer');
              const regSection = document.getElementById('compRegistrationSection');

              const showList = () => {
                listSection.classList.remove('hidden');
                regSection.classList.add('hidden');
              };
              showList();

              document.getElementById('showCompRegisterBtn').onclick = () => {
                listSection.classList.add('hidden');
                regSection.classList.remove('hidden');
              };
              document.getElementById('openCompMapBtn').onclick = () => {
                window.openMapModal('compEventLat', 'compEventLng', 'compMapBtnText', 'compEventClearMap');
              };
              const compClearBtn = document.getElementById('compEventClearMap');
              compClearBtn.onclick = () => {
                document.getElementById('compEventLat').value = '';
                document.getElementById('compEventLng').value = '';
                const textSpan = document.getElementById('compMapBtnText');
                textSpan.textContent = 'Pick Location on Map';
                textSpan.classList.add('text-brand-600', 'dark:text-brand-400');
                textSpan.classList.remove('text-green-600', 'dark:text-green-400');
                compClearBtn.classList.add('hidden');
              };
              document.getElementById('cancelCompRegisterBtn').onclick = showList;

              container.innerHTML = '';
              if (comps.length === 0) {
                container.innerHTML = '<div class="text-center py-10 text-slate-500 text-sm font-medium">No events created yet.</div>';
              } else {
                comps.forEach(comp => {
                  const card = document.createElement('div');
                  card.className = 'glass-card p-4 rounded-2xl flex items-center justify-between border border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/20 transition shadow-sm group';

                  card.innerHTML = `
                      <div class="flex-1 min-w-0">
                         <div class="flex items-center gap-2 mb-0.5 flex-wrap"><h4 class="font-bold text-slate-800 dark:text-slate-100 text-base truncate group-hover:text-brand-500 transition">${comp.title}</h4>${comp.eventType ? `<span class="text-[9px] uppercase font-black px-2 py-0.5 rounded-md bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-400 leading-none shrink-0">${comp.eventType} Competition</span>` : ""}</div>
                         <p class="text-[10px] text-slate-500 font-medium truncate uppercase tracking-wider">${new Date(comp.date).toLocaleDateString()} &bull; ${comp.location}</p>
                         <div class="mt-1 text-[10px] font-bold text-orange-600 dark:text-orange-400">
                           ${comp.registeredGroups.length} Teams Registered
                         </div>
                      </div>
                      <div class="flex items-center gap-2 ml-4">
                        <button class="text-red-500 hover:text-red-700 transition delete-comp-btn font-bold text-[10px] px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/30 rounded-lg whitespace-nowrap">Delete</button>
                        <svg class="w-4 h-4 text-slate-300 group-hover:text-brand-400 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                      </div>
                    `;

                  card.onclick = () => {
                    window.location.href = `/manage-competition.html?id=${comp._id}`;
                  };

                  const delBtn = card.querySelector('.delete-comp-btn');
                  delBtn.onclick = async (e) => {
                    e.stopPropagation();
                    const confirmed = await showConfirm(`Delete "${comp.title}"?`);
                    if (confirmed) {
                      try {
                        const dRes = await fetch(`/api/competitions/${comp._id}`, { method: 'DELETE' });
                        if (dRes.ok) { showStatus('Event deleted.', false); loadCompetitionsDashboard(); }
                        else showStatus('Failed to delete.', true);
                      } catch (e) { }
                    }
                  };
                  container.appendChild(card);
                });
              }
            }
          } catch (e) { console.error(e); }
        };

        const compForm = document.getElementById('compForm');
        if (compForm) {
          compForm.onsubmit = async (e) => {
            e.preventDefault();
            const btn = document.getElementById('cSubmitBtn');
            btn.disabled = true;
            btn.textContent = 'Publishing...';

            const payload = {
              title: document.getElementById('cTitle').value,
              description: document.getElementById('cDesc').value,
              location: document.getElementById('cLocation').value,
              date: document.getElementById('cDate').value,
              registrationDeadline: document.getElementById('cDeadline').value,
              eventType: document.getElementById('cType').value
            };
            const cLat = document.getElementById('compEventLat').value;
            const cLng = document.getElementById('compEventLng').value;
            if (cLat && cLng) {
              payload.locationCoordinates = { lat: Number(cLat), lng: Number(cLng) };
            }

            try {
              // 1. Create Competition
              const res = await fetch('/api/competitions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data.error || 'Failed to create event');

              const compId = data._id;

              // 2. Upload Photos sequentially
              const posterInput = document.getElementById('cPoster');
              if (posterInput && posterInput.files.length > 0) {
                for (let i = 0; i < posterInput.files.length; i++) {
                  const fd = new FormData();
                  fd.append('photo', posterInput.files[i]);
                  const upRes = await fetch(`/api/competitions/${compId}/photos`, {
                    method: 'POST',
                    body: fd
                  });
                  if (!upRes.ok) console.error('Photo upload failed for index', i);
                }
              }

              showStatus('Event published successfully!', false);
              compForm.reset();
              loadCompetitionsDashboard();
            } catch (err) {
              console.error(err);
              showStatus('Error: ' + err.message, true);
            } finally {
              btn.disabled = false;
              btn.textContent = 'Publish Event';
            }
          };
        }

        const loadCommunityEventsDashboard = async () => {
          try {
            const res = await fetch('/api/community-events/my-events');
            if (res.ok) {
              const events = await res.json();
              const listSection = document.getElementById('myCommunityEventsListSection');
              const container = document.getElementById('myCommunityEventsContainer');
              const regSection = document.getElementById('communityEventRegistrationSection');

              const showList = () => {
                listSection.classList.remove('hidden');
                regSection.classList.add('hidden');
              };
              showList();

              document.getElementById('showCommunityEventRegisterBtn').onclick = () => {
                listSection.classList.add('hidden');
                regSection.classList.remove('hidden');
              };

              document.getElementById('cancelCommunityEventRegisterBtn').onclick = showList;

              container.innerHTML = '';
              if (events.length === 0) {
                container.innerHTML = '<div class="text-center py-10 text-slate-500 text-sm font-medium">No community events created yet.</div>';
              } else {
                events.forEach(evt => {
                  const card = document.createElement('div');
                  card.className = 'glass-card p-4 rounded-2xl flex items-center justify-between border border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/20 transition shadow-sm group';

                  const startDate = new Date(evt.date).toLocaleDateString();
                  const endDate = evt.endDate ? ` – ${new Date(evt.endDate).toLocaleDateString()}` : '';

                  card.innerHTML = `
                      <div class="flex-1 min-w-0">
                         <div class="flex items-center gap-2 mb-0.5 flex-wrap"><h4 class="font-bold text-slate-800 dark:text-slate-100 text-base truncate group-hover:text-blue-500 transition">${evt.eventName}</h4><span class="text-[9px] uppercase font-black px-2 py-0.5 rounded-md bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 leading-none shrink-0">${evt.eventType}</span></div>
                         <p class="text-[10px] text-slate-500 font-medium truncate uppercase tracking-wider">${startDate}${endDate} &bull; ${evt.venue}</p>
                         <div class="mt-1 text-[10px] font-bold text-slate-600 dark:text-slate-400">Organizer: ${evt.organizer}</div>
                      </div>
                      <div class="flex items-center gap-2 ml-4">
                        <button class="text-blue-500 hover:text-blue-700 transition edit-ce-btn font-bold text-[10px] px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/10 dark:hover:bg-blue-900/30 rounded-lg whitespace-nowrap">Edit</button>
                        <button class="text-red-500 hover:text-red-700 transition delete-ce-btn font-bold text-[10px] px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/30 rounded-lg whitespace-nowrap">Delete</button>
                        <svg class="w-4 h-4 text-slate-300 group-hover:text-blue-400 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                      </div>
                    `;

                  card.onclick = () => {
                    window.location.href = `/manage-community-event.html?id=${evt._id}`;
                  };

                  const editBtn = card.querySelector('.edit-ce-btn');
                  if (editBtn) {
                    editBtn.onclick = (e) => {
                      e.stopPropagation();
                      window.location.href = `/edit-community-event.html?id=${evt._id}`;
                    };
                  }

                  const delBtn = card.querySelector('.delete-ce-btn');
                  delBtn.onclick = async (e) => {
                    e.stopPropagation();
                    const confirmed = await showConfirm(`Delete "${evt.eventName}"?`);
                    if (confirmed) {
                      try {
                        const dRes = await fetch(`/api/community-events/${evt._id}`, { method: 'DELETE' });
                        if (dRes.ok) { showStatus('Event deleted.', false); loadCommunityEventsDashboard(); }
                        else showStatus('Failed to delete.', true);
                      } catch (e) { }
                    }
                  };
                  container.appendChild(card);
                });
              }
            }
          } catch (e) { console.error(e); }
        };

        const ceForm = document.getElementById('communityEventForm');
        if (ceForm) {
          const entryFeeCheckbox = document.getElementById('ceEntryFee');
          const entryFeeAmountInput = document.getElementById('ceEntryFeeAmount');

          entryFeeCheckbox.onchange = () => {
            if (entryFeeCheckbox.checked) {
              entryFeeAmountInput.classList.remove('hidden');
              entryFeeAmountInput.required = true;
            } else {
              entryFeeAmountInput.classList.add('hidden');
              entryFeeAmountInput.required = false;
            }
          };

          const addContactBtn = document.getElementById('ceAddContactBtn');
          const contactsContainer = document.getElementById('ceContactsContainer');

          if (addContactBtn && contactsContainer) {
            addContactBtn.onclick = () => {
              const row = document.createElement('div');
              row.className = 'flex gap-4 contact-row animate-fade-in relative group';
              row.innerHTML = `
                <div class="flex-1">
                  <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1">Contact Person</label>
                  <input type="text" class="ce-contact-name w-full p-3.5 glass-input rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" placeholder="Name" required>
                </div>
                <div class="flex-1">
                  <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1">Contact Number</label>
                  <input type="tel" class="ce-contact-phone w-full p-3.5 glass-input rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" placeholder="Phone" required>
                </div>
                <button type="button" class="remove-contact-btn absolute -right-2 -top-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-lg scale-0 group-hover:scale-100">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              `;
              row.querySelector('.remove-contact-btn').onclick = () => row.remove();
              contactsContainer.appendChild(row);
            };
          }

          ceForm.onsubmit = async (e) => {
            e.preventDefault();
            const btn = document.getElementById('ceSubmitBtn');
            btn.disabled = true;
            btn.textContent = 'Publishing...';

            const contactNames = Array.from(document.querySelectorAll('.ce-contact-name')).map(i => i.value);
            const contactPhones = Array.from(document.querySelectorAll('.ce-contact-phone')).map(i => i.value);
            const contacts = contactNames.map((name, i) => ({ name, phone: contactPhones[i] }));

            const payload = {
              eventName: document.getElementById('ceTitle').value,
              organizer: document.getElementById('ceOrganizer').value,
              eventType: document.getElementById('ceType').value,
              description: document.getElementById('ceDesc').value,
              venue: document.getElementById('ceLocation').value,
              date: document.getElementById('ceDate').value,
              endDate: document.getElementById('ceEndDate') ? (document.getElementById('ceEndDate').value || null) : null,
              time: '',
              deadline: document.getElementById('ceDeadline').value,
              contacts,
              foodProvided: document.getElementById('ceFoodProvided').checked,
              entryFee: document.getElementById('ceEntryFee').checked,
              entryFeeAmount: document.getElementById('ceEntryFee').checked ? document.getElementById('ceEntryFeeAmount').value : 0
            };

            try {
              const res = await fetch('/api/community-events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data.error || 'Failed to create event');

              // Upload poster/photos if provided
              const cePhotoInput = document.getElementById('cePoster');
              if (cePhotoInput && cePhotoInput.files.length > 0) {
                for (let i = 0; i < cePhotoInput.files.length; i++) {
                  const fd = new FormData();
                  fd.append('photo', cePhotoInput.files[i]);
                  const photoRes = await fetch(`/api/community-events/${data._id}/photos`, { method: 'POST', body: fd });
                  if (!photoRes.ok) {
                    const photoErr = await photoRes.json().catch(() => ({}));
                    console.error('[CE PHOTO] Upload failed:', photoErr.error);
                    showStatus('Event saved but photo upload failed: ' + (photoErr.error || 'Unknown error'), true);
                  }
                }
              }

              showStatus('Community Event published successfully!', false);
              ceForm.reset();
              entryFeeAmountInput.classList.add('hidden');
              entryFeeAmountInput.required = false;
              loadCommunityEventsDashboard();
            } catch (err) {
              console.error(err);
              showStatus('Error: ' + err.message, true);
            } finally {
              btn.disabled = false;
              btn.textContent = 'Publish Community Event';
            }
          };
        }

        loadDashboard();
        loadCompetitionsDashboard();
        loadCommunityEventsDashboard();
      }
    } else {
      authView.classList.remove('hidden');
    }

    let isLogin = true;
    const toggleBtn = document.getElementById('toggleAuthBtn');
    const submitBtn = document.getElementById('authSubmitBtn');

    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        isLogin = !isLogin;
        submitBtn.textContent = isLogin ? 'Log In' : 'Sign Up';
        toggleBtn.textContent = isLogin ? 'Sign Up' : 'Log In';
        const usernameEl = document.getElementById('username');
        const resendBtn = document.getElementById('resendLinkBtn');
        if (resendBtn) resendBtn.classList.add('hidden');
        if (usernameEl) {
          if (isLogin) {
            usernameEl.classList.add('hidden');
            usernameEl.required = false;
          } else {
            usernameEl.classList.remove('hidden');
            usernameEl.required = true;
          }
          usernameEl.value = '';
        }
        document.getElementById('email').value = '';
        document.getElementById('password').value = '';
      });
    }

    const showForgotPasswordBtn = document.getElementById('showForgotPasswordBtn');
    const forgotBackBtn = document.getElementById('forgotBackBtn');
    const forgotPasswordView = document.getElementById('forgotPasswordView');

    if (showForgotPasswordBtn && forgotBackBtn && forgotPasswordView && authView) {
      showForgotPasswordBtn.addEventListener('click', () => {
        authView.classList.add('hidden');
        forgotPasswordView.classList.remove('hidden');
        document.getElementById('statusMessage').classList.add('hidden');
      });
      forgotBackBtn.addEventListener('click', () => {
        forgotPasswordView.classList.add('hidden');
        authView.classList.remove('hidden');
        document.getElementById('statusMessage').classList.add('hidden');
      });
    }

    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    if (forgotPasswordForm) {
      forgotPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('forgotEmail').value;
        const submitBtn = document.getElementById('forgotSubmitBtn');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';

        try {
          const res = await fetch('/api/auth/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
          });
          const data = await res.json();

          if (res.ok) {
            showStatus(data.message, false);
            document.getElementById('forgotEmail').value = '';
          } else {
            showStatus(data.error, true);
          }
        } catch (err) {
          console.error(err);
          showStatus('Something went wrong. Please try again later.', true);
        } finally {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Send Reset Link';
        }
      });
    }

    const authForm = document.getElementById('authForm');
    if (authForm) {
      authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const usernameEl = document.getElementById('username');
        const username = usernameEl ? usernameEl.value : '';
        const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="animate-pulse">Processing...</span>';

        const payload = { email, password };
        if (!isLogin) payload.username = username;

        try {
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          const data = await res.json();

          if (res.ok) {
            showStatus(data.message, false);
            if (isLogin) {
              window.location.reload();
            } else {
              document.getElementById('authView').classList.add('hidden');
              document.getElementById('verifyEmailView').classList.remove('hidden');
              document.getElementById('verifyEmailDisplay').innerText = email;
            }
          } else {
            showStatus(data.error, true);
            const resendBtn = document.getElementById('resendLinkBtn');
            if (resendBtn && data.error === 'Please verify your email first') {
              resendBtn.classList.remove('hidden');
            }
          }
        } catch (err) {
          console.error(err);
        } finally {
          submitBtn.disabled = false;
          submitBtn.textContent = isLogin ? 'Log In' : 'Sign Up';
        }
      });
    }

    const resendBtn = document.getElementById('resendLinkBtn');
    if (resendBtn) {
      resendBtn.addEventListener('click', async () => {
        const email = document.getElementById('email').value;
        if (!email) return showStatus('Please enter your email address above to resend link', true);

        resendBtn.disabled = true;
        resendBtn.textContent = 'Sending...';

        try {
          const res = await fetch('/api/auth/resend-verification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
          });
          const data = await res.json();
          if (res.ok) {
            showStatus(data.message, false);
            resendBtn.classList.add('hidden');
          } else {
            showStatus(data.error, true);
          }
        } catch (e) {
          showStatus('System error sending email. Try again later.', true);
        } finally {
          resendBtn.disabled = false;
          resendBtn.textContent = "Didn't receive verification email? Resend link";
        }
      });
    }

    const verifyBackBtn = document.getElementById('verifyBackBtn');
    if (verifyBackBtn) {
      verifyBackBtn.addEventListener('click', () => {
        document.getElementById('verifyEmailView').classList.add('hidden');
        document.getElementById('authView').classList.remove('hidden');
        if (!isLogin && toggleBtn) toggleBtn.click(); // Automatically switch the view back to Login mode
        showStatus('', false); // Clear status
      });
    }

    const verifyResendBtn = document.getElementById('verifyResendBtn');
    if (verifyResendBtn) {
      verifyResendBtn.addEventListener('click', async () => {
        const email = document.getElementById('verifyEmailDisplay').innerText;
        verifyResendBtn.disabled = true;
        verifyResendBtn.textContent = 'Sending...';

        try {
          const res = await fetch('/api/auth/resend-verification', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email })
          });
          const data = await res.json();
          if (res.ok) {
            showStatus(data.message, false);
          } else {
            showStatus(data.error, true);
          }
        } catch (e) {
          showStatus('System error sending email', true);
        } finally {
          verifyResendBtn.disabled = false;
          verifyResendBtn.textContent = "Resend Link";
        }
      });
    }

    // Group Registration
    const groupForm = document.getElementById('groupForm');
    if (groupForm) {
      groupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.querySelector('#groupForm button[type="submit"]');
        btn.disabled = true;
        btn.textContent = 'Adding...';

        const payload = {
          groupName: document.getElementById('gName').value,
          village: document.getElementById('gVillage').value,
          email: document.getElementById('gEmail').value,
          groupType: document.getElementById('gType').value,
          leaderName: document.getElementById('gLeader').value,
          contactNumber: document.getElementById('gContact').value,
          memberCount: document.getElementById('gCount').value,
          registrationId: document.getElementById('gRegId').value,
          acceptingBookings: document.getElementById('gAccepting').checked,
        };

        try {
          const res = await fetch('/api/groups', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (res.ok) {
            showStatus('Group Registered Successfully!', false);
            groupForm.reset();
            setTimeout(() => window.location.reload(), 1500);
          } else {
            const data = await res.json();
            showStatus('Error: ' + data.error, true);
          }
        } catch (err) {
          console.error(err);
        } finally {
          btn.disabled = false;
          btn.textContent = 'Add to Directory';
        }
      });
    }
  }

  // --- group.html Logic ---
  if (path === '/group.html') {
    const urlParams = new URLSearchParams(window.location.search);
    const groupId = urlParams.get('id');

    if (!groupId) {
      window.location.href = '/';
    } else {
      const fetchGroupProfile = async () => {
        try {
          const res = await fetch(`/api/groups/${groupId}?t=${Date.now()}`);
          if (!res.ok) {
            document.getElementById('loading').textContent = 'Group not found.';
            return;
          }
          const group = await res.json();
          document.getElementById('loading').classList.add('hidden');
          const content = document.getElementById('profileContent');
          content.classList.remove('hidden');

          document.getElementById('pName').textContent = group.groupName;
          document.getElementById('pVillage').textContent = group.village;
          document.getElementById('pMembers').textContent = `${group.memberCount} members`;

          if (group.registrationId) {
            const regIdEl = document.getElementById('pRegId');
            const regIdCont = document.getElementById('pRegIdCont');
            if (regIdEl && regIdCont) {
              regIdEl.textContent = `Reg. No: ${group.registrationId}`;
              regIdCont.classList.remove('hidden');
              regIdCont.classList.add('flex');
            }
          }

          if (group.description) {
            document.getElementById('pDesc').innerText = group.description;
          }

          if (group.achievements && group.achievements.length > 0) {
            const ul = document.getElementById('pAchievements');
            ul.innerHTML = '';
            group.achievements.forEach(ach => {
              ul.insertAdjacentHTML('beforeend', `<li class="flex items-start gap-2 text-slate-700 dark:text-slate-200">
                <svg class="w-5 h-5 text-brand-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
                <span>${ach}</span>
              </li>`);
            });
          }

          const photoDiv = document.getElementById('pPhotos');
          if (photoDiv) {
            photoDiv.innerHTML = '';
            if (group.photos && group.photos.length > 0) {
              group.photos.forEach(photo => {
                const photoContainer = document.createElement('div');
                photoContainer.className = 'aspect-video rounded-3xl overflow-hidden shadow-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 h-full w-full group relative mb-6';
                photoContainer.innerHTML = `
                  <img src="${photo}" alt="Group Photo" 
                    class="w-full h-full object-cover hover:scale-105 transition duration-500 cursor-pointer" 
                    onerror="this.parentElement.remove()">
                  <div class="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                `;
                photoDiv.appendChild(photoContainer);
              });
            } else {
              photoDiv.innerHTML = '<p class="text-slate-500 dark:text-slate-400 italic col-span-full py-6 text-center">No photos available.</p>';
            }
          }

          document.getElementById('pLeadName').textContent = group.leaderName;
          document.getElementById('pLeadInitial').textContent = group.leaderName ? group.leaderName.charAt(0).toUpperCase() : 'X';

          const statusBadge = document.getElementById('pStatus');
          const actionBtn = document.getElementById('pAction');
          if (group.acceptingBookings) {
            statusBadge.className = 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 px-3 py-1 text-xs font-bold rounded-xl whitespace-nowrap';
            statusBadge.textContent = 'Open for Invitations';

            actionBtn.innerHTML = `<button id="openBookingBtn" class="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-6 py-3.5 rounded-2xl font-bold transition transform hover:-translate-y-0.5 active:translate-y-0 shadow-lg shadow-brand-500/20">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              Book this Group
            </button>`;
          } else {
            statusBadge.className = 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-3 py-1 text-xs font-bold rounded-xl whitespace-nowrap border border-slate-300 dark:border-slate-700';
            statusBadge.textContent = 'Unavailable';
          }

          // Donate button for profile page
          actionBtn.innerHTML += `
             <button onclick="openDonationModal('${group.groupName.replace(/'/g, "\\'")}', '${group._id}')" class="inline-flex items-center gap-2 bg-brand-50 hover:bg-brand-100 dark:bg-brand-900/40 dark:hover:bg-brand-900/60 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-700 px-6 py-3.5 rounded-2xl font-bold transition">
                Support 
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
             </button>
          `;

          const openBtn = document.getElementById('openBookingBtn');
          if (openBtn) {
            openBtn.addEventListener('click', () => {
              window.location.href = `/book-group.html?id=${group._id}`;
            });
          }

        } catch (err) {
          console.error(err);
        }
      };

      fetchGroupProfile();
    }
  }

  // --- book-group.html Logic ---
  if (path === '/book-group.html') {
    const urlParams = new URLSearchParams(window.location.search);
    const groupId = urlParams.get('id');

    if (!groupId) {
      window.location.href = '/';
    } else {
      let targetGroup = null;

      const fetchGroupForBooking = async () => {
        try {
          const res = await fetch(`/api/groups/${groupId}?t=${Date.now()}`);
          if (!res.ok) throw new Error('Group not found');

          targetGroup = await res.json();
          document.getElementById('loadingGroup').classList.add('hidden');
          document.getElementById('bookingContainer').classList.remove('hidden');
          document.getElementById('targetGroupName').textContent = targetGroup.groupName;
        } catch (err) {
          document.getElementById('loadingGroup').textContent = 'Error: ' + err.message;
        }
      };

      fetchGroupForBooking();

      const bookingForm = document.getElementById('fullBookingForm');
      if (bookingForm) {
        bookingForm.addEventListener('submit', async (e) => {
          e.preventDefault();

          const confirmed = await window.vandanModal.show({
            title: 'Confirm Booking',
            text: 'Are you sure you want to submit this booking request? The group leader will be notified.',
            confirmText: 'Yes, Submit',
            cancelText: 'Cancel'
          });

          if (!confirmed) return;

          const btn = document.getElementById('bSubmitBtn');
          btn.disabled = true;
          btn.innerHTML = '<span class="animate-pulse">Processing...</span>';

          const payload = {
            groupId: targetGroup._id,
            name: document.getElementById('bName').value,
            phone: document.getElementById('bPhone').value,
            date: document.getElementById('bDate').value,
            purpose: document.getElementById('bPurpose').value,
            message: document.getElementById('bMessage').value
          };

          try {
            const res = await fetch('/api/bookings', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!res.ok) {
              if (data.error && data.error.includes('already booked')) {
                await window.vandanModal.show({
                  title: 'Date Unavailable',
                  text: 'This group is already confirmed/booked on this specific date. Please choose another date or group.',
                  type: 'error',
                  confirmText: 'Go Back'
                });
                btn.disabled = false;
                btn.innerHTML = 'Submit Booking Request';
                return;
              }
              throw new Error(data.error || 'Failed to submit booking');
            }

            const waMessage = encodeURIComponent(`Hello ${targetGroup.leaderName},\n\nI would like to book ${targetGroup.groupName} for an event.\n\nName: ${payload.name}\nPhone: ${payload.phone}\nDate: ${payload.date}\nPurpose: ${payload.purpose}\nMessage: ${payload.message}\n\nPlease let me know your availability.`);
            const waLink = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
              ? `whatsapp://send?phone=${targetGroup.contactNumber}&text=${waMessage}`
              : `https://wa.me/${targetGroup.contactNumber}?text=${waMessage}`;

            await window.vandanModal.show({
              title: 'Success!',
              text: 'Booking request saved. Redirecting to WhatsApp to notify the group leader...',
              type: 'success',
              confirmText: 'Open WhatsApp'
            });

            window.open(waLink, '_blank');
            window.location.href = `/group.html?id=${targetGroup._id}`;

          } catch (err) {
            console.error(err);
            await window.vandanModal.show({
              title: 'Booking Failed',
              text: 'Failed to process booking. Please try again or contact support.',
              type: 'error',
              confirmText: 'Try Again'
            });
            btn.disabled = false;
            btn.textContent = 'Submit Booking Request';
          }
        });
      }
    }
  }

  // --- Global Image Lightbox ---
  document.body.addEventListener('click', (e) => {
    if (e.target.tagName === 'IMG' && e.target.closest('[id*="Gallery"], [id*="Photos"], #pPhotos')) {
      const overlay = document.createElement('div');
      overlay.className = 'fixed inset-0 bg-black/95 flex items-center justify-center p-4 animate-fade-in cursor-zoom-out';
      overlay.style.setProperty('z-index', '2147483647', 'important');
      overlay.innerHTML = `
         <img src="${e.target.src}" class="max-w-full max-h-full object-contain rounded-xl shadow-2xl">
         <button class="absolute top-6 right-6 text-white/50 hover:text-white transition p-2 bg-black/20 hover:bg-black/50 rounded-full">
           <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
         </button>
       `;
      document.body.appendChild(overlay);
      document.body.style.overflow = 'hidden';

      overlay.onclick = () => {
        overlay.remove();
        document.body.style.overflow = '';
      };
    }
  });

  // --- Central Service Worker Registration & Update Handling ---
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').then((registration) => {
        console.log('[PWA] Service Worker Registered');

        // Check for updates periodically
        setInterval(() => {
          registration.update();
        }, 1000 * 60 * 60); // Check every hour

        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (!installingWorker) return;
          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // New content is available; please refresh.
                console.log('[PWA] New version available. Reloading...');
                window.location.reload();
              }
            }
          };
        };
      }).catch(err => console.error('[PWA] Registration failed:', err));
    });

    // Handle redundant workers and focus updates
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        window.location.reload();
        refreshing = true;
      }
    });
  }
  // --- admin.html Logic ---
  if (path === '/admin.html') {
    const authSection = document.getElementById('adminAuthSection');
    const dashboardSection = document.getElementById('adminDashboardSection');
    const loginForm = document.getElementById('adminLoginForm');
    const logoutBtn = document.getElementById('adminLogoutBtn');

    const checkAdminAuth = async () => {
      try {
        const res = await fetch('/api/admin/check');
        const data = await res.json();
        if (data.isAdmin) showAdminDashboard();
      } catch (err) { console.error('Auth check failed', err); }
    };

    const showAdminDashboard = () => {
      if (authSection) authSection.classList.add('hidden');
      if (dashboardSection) dashboardSection.classList.remove('hidden');
      loadAdminStats();
      loadTabContent('reports');
    };

    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('adminEmail').value;
        const password = document.getElementById('adminPassword').value;
        try {
          const res = await fetch('/api/admin/login', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          });
          const data = await res.json();
          if (res.ok) showAdminDashboard();
          else showStatus(data.error || 'Login failed', true);
        } catch (err) { showStatus('System error during login', true); }
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        await fetch('/api/admin/logout', { method: 'POST' });
        window.location.reload();
      });
    }

    const loadAdminStats = async () => {
      try {
        const res = await fetch('/api/admin/stats');
        const stats = await res.json();
        if (document.getElementById('statUsers')) document.getElementById('statUsers').textContent = stats.users;
        if (document.getElementById('statGroups')) document.getElementById('statGroups').textContent = stats.groups;
        if (document.getElementById('statReports')) document.getElementById('statReports').textContent = stats.reports;
      } catch (err) { console.error('Failed to load stats', err); }
    };

    const loadTabContent = async (tab) => {
      const reportsList = document.getElementById('reportsList');
      const usersTableBody = document.getElementById('usersTableBody');
      const groupsList = document.getElementById('groupsList');

      if (tab === 'reports' && reportsList) {
        reportsList.innerHTML = '<div class="text-center py-10">Loading reports...</div>';
        try {
          const res = await fetch('/api/admin/reports');
          const reports = await res.json();
          reportsList.innerHTML = reports.length ? '' : '<div class="text-center py-10 text-slate-500">No active reports.</div>';
          reports.forEach(report => {
            reportsList.insertAdjacentHTML('beforeend', `
                <div class="glass-card p-6 rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fade-in border border-red-100 dark:border-red-900/20">
                  <div>
                    <h4 class="font-bold text-lg text-slate-800 dark:text-white">${report.groupName}</h4>
                    <p class="text-sm text-slate-500 dark:text-slate-400">Village: ${report.village}</p>
                    <div class="mt-2 flex flex-wrap gap-2">
                      <span class="px-3 py-1 bg-red-100 text-red-600 rounded-lg text-xs font-bold uppercase">${report.reason}</span>
                      <span class="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg text-xs">By: ${report.reportedBy || 'Anonymous'}</span>
                      <span class="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg text-xs">${report.reporterPhone || 'No Phone'}</span>
                    </div>
                  </div>
                  <div class="flex gap-2">
                    <button onclick="dismissReport('${report._id}')" class="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-200 transition">Dismiss</button>
                    <button onclick="deleteGroupFromAdmin('${report.groupId}', '${report.groupName}')" class="px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition">Delete Group</button>
                  </div>
                </div>
              `);
          });
        } catch (err) { reportsList.innerHTML = '<div class="text-center py-10 text-red-500">Error loading reports.</div>'; }
      } else if (tab === 'users' && usersTableBody) {
        usersTableBody.innerHTML = '<tr><td colspan="4" class="text-center py-10">Loading users...</td></tr>';
        try {
          const res = await fetch('/api/admin/users');
          const users = await res.json();
          usersTableBody.innerHTML = '';
          users.forEach(user => {
            usersTableBody.insertAdjacentHTML('beforeend', `
                <tr class="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                  <td class="px-4 py-4 text-sm font-bold">${user.displayName}</td>
                  <td class="px-4 py-4 text-sm text-slate-500">${user.email}</td>
                  <td class="px-4 py-4 text-sm text-slate-500">${new Date(user.createdAt).toLocaleDateString()}</td>
                  <td class="px-4 py-4">
                    <button onclick="deleteUser('${user._id}', '${user.displayName}')" class="text-red-500 hover:text-red-600 transition p-2">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1v3M4 7h16"></path></svg>
                    </button>
                  </td>
                </tr>
              `);
          });
        } catch (err) { usersTableBody.innerHTML = '<tr><td colspan="4" class="text-center py-10 text-red-500">Error loading users.</td></tr>'; }
      } else if (tab === 'groups' && groupsList) {
        groupsList.innerHTML = '<div class="text-center py-10">Loading groups...</div>';
        try {
          const res = await fetch('/api/admin/groups');
          const groups = await res.json();
          groupsList.innerHTML = '';
          groups.forEach(group => {
            groupsList.insertAdjacentHTML('beforeend', `
                <div class="glass-card p-6 rounded-3xl flex justify-between items-center animate-fade-in border border-white/40 dark:border-slate-800/40">
                  <div>
                    <h4 class="font-bold text-lg">${group.groupName}</h4>
                    <p class="text-sm text-slate-500">${group.village} • ${group.groupType}</p>
                  </div>
                  <button onclick="deleteGroupFromAdmin('${group._id}', '${group.groupName}')" class="text-red-500 hover:text-red-600 transition p-2">
                     <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1v3M4 7h16"></path></svg>
                  </button>
                </div>
              `);
          });
        } catch (err) { groupsList.innerHTML = '<div class="text-center py-10 text-red-500">Error loading groups.</div>'; }
      } else if (tab === 'events') {
        const eventsList = document.getElementById('eventsList');
        if (!eventsList) return;
        eventsList.innerHTML = '<div class="text-center py-10">Loading performances...</div>';
        try {
          const res = await fetch('/api/admin/performances');
          if (!res.ok) {
            const text = await res.text();
            throw new Error(`Server returned ${res.status}: ${text.slice(0, 50)}`);
          }
          const events = await res.json();
          eventsList.innerHTML = events.length ? '' : '<div class="text-center py-10 text-slate-500">No performances found.</div>';
          events.forEach(ev => {
            eventsList.insertAdjacentHTML('beforeend', `
                <div class="glass-card p-6 rounded-3xl flex justify-between items-center animate-fade-in border border-white/40 dark:border-slate-800/40">
                  <div>
                    <h4 class="font-bold text-lg">${ev.templeName || 'Unnamed Performance'}</h4>
                    <p class="text-sm text-slate-500">${new Date(ev.date).toLocaleDateString()} • ${ev.village || 'No Location'} • By: ${ev.performingGroupId?.groupName || 'Unknown Group'}</p>
                  </div>
                  <button onclick="deletePerformance('${ev._id}', '${(ev.templeName || 'Performance').replace(/'/g, "\\'")}')" class="text-red-500 hover:text-red-600 transition p-2">
                     <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1v3M4 7h16"></path></svg>
                  </button>
                </div>
              `);
          });
        } catch (err) {
          console.error('Performances Error:', err);
          eventsList.innerHTML = `<div class="text-center py-10 text-red-500">Error: ${err.message}</div>`;
        }
      } else if (tab === 'competitions') {
        const competitionsList = document.getElementById('competitionsList');
        if (!competitionsList) return;
        competitionsList.innerHTML = '<div class="text-center py-10">Loading competitions...</div>';
        try {
          const res = await fetch('/api/admin/competitions');
          const competitions = await res.json();
          competitionsList.innerHTML = competitions.length ? '' : '<div class="text-center py-10 text-slate-500">No competitions found.</div>';
          competitions.forEach(comp => {
            competitionsList.insertAdjacentHTML('beforeend', `
                <div class="glass-card p-6 rounded-3xl flex justify-between items-center animate-fade-in border border-white/40 dark:border-slate-800/40">
                  <div>
                    <h4 class="font-bold text-lg">${comp.title || 'Unnamed Competition'}</h4>
                    <p class="text-sm text-slate-500">${new Date(comp.date).toLocaleDateString()} • ${comp.location || 'No Location'} • Organized by: ${comp.organizerId?.displayName || 'Unknown'}</p>
                  </div>
                  <button onclick="deleteCompetition('${comp._id}', '${(comp.title || 'Competition').replace(/'/g, "\\'")}')" class="text-red-500 hover:text-red-600 transition p-2">
                     <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1v3M4 7h16"></path></svg>
                  </button>
                </div>
              `);
          });
        } catch (err) { competitionsList.innerHTML = '<div class="text-center py-10 text-red-500">Error loading competitions.</div>'; }
      } else if (tab === 'communityEvents') {
        const communityEventsList = document.getElementById('communityEventsList');
        if (!communityEventsList) return;
        communityEventsList.innerHTML = '<div class="text-center py-10">Loading community events...</div>';
        try {
          const res = await fetch('/api/admin/community-events');
          const communityEvents = await res.json();
          communityEventsList.innerHTML = communityEvents.length ? '' : '<div class="text-center py-10 text-slate-500">No community events found.</div>';
          communityEvents.forEach(ce => {
            communityEventsList.insertAdjacentHTML('beforeend', `
                <div class="glass-card p-6 rounded-3xl flex justify-between items-center animate-fade-in border border-white/40 dark:border-slate-800/40">
                  <div>
                    <h4 class="font-bold text-lg">${ce.eventName}</h4>
                    <p class="text-sm text-slate-500">${new Date(ce.date).toLocaleDateString()} • ${ce.venue} • Organizer: ${ce.organizer}</p>
                  </div>
                  <button onclick="deleteCommunityEvent('${ce._id}', '${ce.eventName}')" class="text-red-500 hover:text-red-600 transition p-2">
                     <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1v3M4 7h16"></path></svg>
                  </button>
                </div>
              `);
          });
        } catch (err) { communityEventsList.innerHTML = '<div class="text-center py-10 text-red-500">Error loading community events.</div>'; }
      }
    };

    document.querySelectorAll('.admin-tab').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.admin-tab').forEach(b => { b.classList.remove('active'); b.classList.add('text-slate-500'); });
        e.target.classList.add('active'); e.target.classList.remove('text-slate-500');
        document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.add('hidden'));
        const targetTab = e.target.dataset.tab;
        document.getElementById('tabContent' + targetTab.charAt(0).toUpperCase() + targetTab.slice(1)).classList.remove('hidden');
        loadTabContent(targetTab);
      });
    });

    window.dismissReport = async (id) => {
      const confirmed = await window.vandanModal.show({
        title: 'Dismiss Report?',
        text: 'Are you sure you want to dismiss this report? It will be permanently removed from the list.',
        confirmText: 'Yes, Dismiss',
        cancelText: 'Cancel'
      });
      if (confirmed) {
        await fetch(`/api/admin/reports/${id}`, { method: 'DELETE' });
        loadTabContent('reports'); loadAdminStats();
      }
    };

    window.deleteGroupFromAdmin = async (id, name) => {
      const confirmed = await window.vandanModal.show({
        title: 'Delete Group?',
        text: `PERMANENTLY DELETE "${name}"? This action cannot be undone and will remove all group data.`,
        type: 'error',
        confirmText: 'Delete Permanently',
        cancelText: 'Cancel'
      });
      if (confirmed) {
        await fetch(`/api/admin/groups/${id}`, { method: 'DELETE' });
        await loadTabContent('reports');
        await loadTabContent('groups');
        await loadAdminStats();
      }
    };

    window.deleteUser = async (id, name) => {
      const confirmed = await window.vandanModal.show({
        title: 'Delete User?',
        text: `PERMANENTLY DELETE user "${name}"? This will remove their account and all associated groups/events.`,
        type: 'error',
        confirmText: 'Delete User',
        cancelText: 'Cancel'
      });
      if (confirmed) {
        await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
        loadTabContent('users'); loadAdminStats();
      }
    };

    window.deletePerformance = async (id, name) => {
      const confirmed = await window.vandanModal.show({
        title: 'Delete Performance?',
        text: `PERMANENTLY DELETE "${name}"? This will remove it from the calendar.`,
        type: 'error',
        confirmText: 'Delete Performance',
        cancelText: 'Cancel'
      });
      if (confirmed) {
        await fetch(`/api/admin/performances/${id}`, { method: 'DELETE' });
        loadTabContent('events'); loadAdminStats();
      }
    };

    window.deleteCompetition = async (id, name) => {
      const confirmed = await window.vandanModal.show({
        title: 'Delete Competition?',
        text: `PERMANENTLY DELETE "${name}"? This will remove it and all registrations.`,
        type: 'error',
        confirmText: 'Delete Competition',
        cancelText: 'Cancel'
      });
      if (confirmed) {
        await fetch(`/api/admin/competitions/${id}`, { method: 'DELETE' });
        loadTabContent('competitions'); loadAdminStats();
      }
    };

    window.deleteCommunityEvent = async (id, name) => {
      const confirmed = await window.vandanModal.show({
        title: 'Delete Community Event?',
        text: `PERMANENTLY DELETE "${name}"?`,
        type: 'error',
        confirmText: 'Delete Event',
        cancelText: 'Cancel'
      });
      if (confirmed) {
        await fetch(`/api/admin/community-events/${id}`, { method: 'DELETE' });
        loadTabContent('communityEvents'); loadAdminStats();
      }
    };

    checkAdminAuth();
  }
});

// --- Central Premium Modal System ---
window.vandanModal = {
  activeResolve: null,

  init() {
    if (document.getElementById('vandanModalBackdrop')) return;

    const html = `
      <div id="vandanModalBackdrop" class="modal-backdrop">
        <div class="modal-content glass-card">
          <div id="vandanModalIcon" class="mb-4 flex justify-center"></div>
          <h3 id="vandanModalTitle" class="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2"></h3>
          <p id="vandanModalText" class="text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-8"></p>
          <div id="vandanModalActions" class="flex flex-col gap-3">
            <button id="vandanModalConfirm" class="modal-btn w-full"></button>
            <button id="vandanModalCancel" class="modal-btn btn-secondary w-full" style="display:none;"></button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);

    document.getElementById('vandanModalConfirm').onclick = () => this.close(true);
    document.getElementById('vandanModalCancel').onclick = () => this.close(false);
  },

  async show({ title, text, type = 'info', confirmText = 'OK', cancelText = '' }) {
    this.init();
    const backdrop = document.getElementById('vandanModalBackdrop');
    const titleEl = document.getElementById('vandanModalTitle');
    const textEl = document.getElementById('vandanModalText');
    const confirmEl = document.getElementById('vandanModalConfirm');
    const cancelEl = document.getElementById('vandanModalCancel');
    const iconEl = document.getElementById('vandanModalIcon');

    titleEl.textContent = title;
    textEl.textContent = text;
    confirmEl.textContent = confirmText;

    if (cancelText) {
      cancelEl.textContent = cancelText;
      cancelEl.style.display = 'block';
    } else {
      cancelEl.style.display = 'none';
    }

    let iconHtml = '';
    if (type === 'success') {
      iconHtml = '<div class="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 text-green-500 flex items-center justify-center"><svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg></div>';
      confirmEl.className = 'modal-btn btn-accept w-full';
    } else if (type === 'error') {
      iconHtml = '<div class="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 text-red-500 flex items-center justify-center"><svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"></path></svg></div>';
      confirmEl.className = 'modal-btn btn-reject w-full';
    } else {
      iconHtml = '<div class="w-16 h-16 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-500 flex items-center justify-center"><svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg></div>';
      confirmEl.className = 'modal-btn btn-accept w-full';
    }
    iconEl.innerHTML = iconHtml;

    backdrop.classList.add('active');

    return new Promise((resolve) => {
      this.activeResolve = resolve;
    });
  },

  close(result) {
    document.getElementById('vandanModalBackdrop').classList.remove('active');
    if (this.activeResolve) {
      this.activeResolve(result);
      this.activeResolve = null;
    }
  }
};

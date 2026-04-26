// --- PWA Install Button Logic ---
let deferredInstallPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;

  const isMobile = window.innerWidth < 768;

  if (isMobile) {
    // Mobile: show a beautiful floating banner above the bottom nav
    const banner = document.getElementById('installMobileBanner');
    if (banner) {
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
  } else {
    // Desktop: show the Install button in the sidebar
    const installBtn = document.getElementById('installPwaBtn');
    if (installBtn) {
      installBtn.classList.remove('hidden');
      installBtn.classList.add('flex');
      installBtn.addEventListener('click', async () => {
        installBtn.classList.add('hidden');
        installBtn.classList.remove('flex');
        deferredInstallPrompt.prompt();
        await deferredInstallPrompt.userChoice;
        deferredInstallPrompt = null;
      });
    }
  }
});
window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  document.getElementById('installMobileBanner')?.classList.add('hidden');
  document.getElementById('installPwaBtn')?.classList.add('hidden');
});

document.addEventListener('DOMContentLoaded', async () => {
  // --- Mobile Nav Scroll Hide/Show ---
  let lastScrollTop = 0;
  const mobileNav = document.querySelector('nav.md\\:hidden.fixed');
  
  if (mobileNav) {
    window.addEventListener('scroll', () => {
      let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      if (scrollTop > lastScrollTop && scrollTop > 20) {
        // Scrolling down
        mobileNav.style.transform = 'translate(-50%, 150%)';
      } else {
        // Scrolling up
        mobileNav.style.transform = 'translate(-50%, 0)';
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

      globalMap.on('click', function(e) {
        if (globalMarker) globalMap.removeLayer(globalMarker);
        globalMarker = L.marker(e.latlng).addTo(globalMap);
      });
      globalMap.on('geosearch/showlocation', function(e) {
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
    if (document.documentElement.classList.contains('dark')) {
      darkIcons.forEach(i => i.classList.add('hidden'));
      lightIcons.forEach(i => i.classList.remove('hidden'));
    } else {
      darkIcons.forEach(i => i.classList.remove('hidden'));
      lightIcons.forEach(i => i.classList.add('hidden'));
    }
  };

  updateIcons();

  themeToggleGrp.forEach(btn => {
    btn.addEventListener('click', () => {
      document.documentElement.classList.toggle('dark');
      if (document.documentElement.classList.contains('dark')) {
        localStorage.theme = 'dark';
      } else {
        localStorage.theme = 'light';
      }
      updateIcons();
    });
  });

  // Check auth status
  let user = null;
  try {
    const res = await fetch('/api/auth/current_user');
    const data = await res.json();
    if (data.isAuthenticated) {
      user = data.user;
    }
  } catch (err) {
    console.error("Error checking auth status", err);
  }

  // Common Header Update
  const authSection = document.getElementById('auth-section');
  if (authSection) {
    if (user) {
      authSection.innerHTML = `<span class="bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 font-bold px-3 py-1.5 rounded-full text-xs border border-brand-200 dark:border-brand-800 shadow-sm">${user.username || user.email.split('@')[0]}</span>`;
    } else {
      authSection.innerHTML = `<a href="/auth.html" class="text-white bg-slate-800 dark:bg-brand-500 hover:bg-slate-700 dark:hover:bg-brand-400 px-4 py-2 rounded-xl transition shadow-md font-semibold text-sm">Sign In</a>`;
    }
  }

  const path = window.location.pathname;

  // --- index.html Logic ---
  if (path === '/' || path === '/index.html') {
    const fetchGroups = async (query = '') => {
      try {
        const res = await fetch(`/api/groups?village=${encodeURIComponent(query)}&t=${Date.now()}`);
        const groups = await res.json();
        renderGroups(groups);
      } catch (err) {
        console.error(err);
      }
    };

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        fetchGroups(e.target.value);
      });
    }

    const renderGroups = (groups) => {
      const gCount = document.getElementById('groupCount');
      if(gCount) gCount.innerText = groups.length;
      
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
        clone.querySelector('.group-village-slot').textContent = g.village;
        clone.querySelector('.group-members-slot').innerHTML = `${g.memberCount} <span class="hidden sm:inline">members</span>`;
        clone.querySelector('.group-initial-slot').textContent = g.leaderName.charAt(0).toUpperCase();
        clone.querySelector('.group-leader-slot').textContent = g.leaderName;
        clone.querySelector('.group-profile-link').href = `/group.html?id=${g._id}`;

        const actionSlot = clone.querySelector('.group-action-slot');
        const innerFlex = actionSlot.querySelector('.flex.w-full');
        const message = encodeURIComponent(`Hello, I found your Dindi group (${g.groupName}) on Dindi. Are you available for a performance?`);
        
        if (g.acceptingBookings) {
          innerFlex.innerHTML = `<a href="https://wa.me/${g.contactNumber}?text=${message}" target="_blank" 
          class="flex-1 text-center bg-green-500 hover:bg-green-600 text-white py-3.5 rounded-2xl font-bold transition transform hover:-translate-y-0.5 active:translate-y-0 shadow-lg shadow-green-500/20 flex items-center justify-center gap-2">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.012 2C6.486 2 2 6.486 2 12.013c0 1.77.464 3.447 1.341 4.954L2 22l5.194-1.319A9.957 9.957 0 0012.012 22C17.538 22 22 17.538 22 12.013 22 6.486 17.538 2 12.012 2zM17.135 15.65c-.237.669-1.378 1.28-1.895 1.332-.516.052-.942.278-3.042-.596-2.531-1.054-4.148-3.666-4.272-3.832-.124-.165-1.021-1.353-1.021-2.584 0-1.231.639-1.839.866-2.066.227-.227.495-.284.66-.284.165 0 .33 0 .474.008.155.008.361-.061.567.433.216.516.732 1.802.794 1.925.062.124.103.268.021.433-.082.165-.124.268-.247.412-.124.144-.258.319-.371.433-.124.124-.258.258-.113.505.144.247.639 1.061 1.371 1.711.948.845 1.741 1.103 1.989 1.226.247.124.392.103.536-.062.144-.165.618-.721.783-.969.165-.247.33-.206.556-.124.227.082 1.443.68 1.69.804.247.124.412.185.474.288.062.103.062.608-.175 1.278z"/></svg>
            Invite via WhatsApp
          </a>`;
        } else {
          innerFlex.innerHTML = `<div class="flex-1 text-center bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 py-3.5 rounded-2xl font-bold border border-slate-200 dark:border-slate-700">Currently Unavailable</div>`;
        }
        
        container.appendChild(clone);
      });
    };

    fetchGroups();
  }
  
  // --- Global Donation Logic ---
  window.openDonationModal = (groupName, groupId) => {
    const params = new URLSearchParams({
      groupName: groupName || 'Dindi Community (General)',
      groupId: groupId || ''
    });
    window.location.href = `/payment.html?${params.toString()}`;
  };





  // --- calendar.html Logic ---
  if (path === '/calendar.html') {
    const tabEventsBtn = document.getElementById('tabEventsBtn');
    const tabCompsBtn = document.getElementById('tabCompsBtn');
    const eventsContainer = document.getElementById('eventsContainer');
    const compsContainer = document.getElementById('competitionsContainer');

    if (tabEventsBtn && tabCompsBtn) {
      tabEventsBtn.addEventListener('click', () => {
        tabEventsBtn.className = 'text-brand-600 dark:text-brand-400 font-bold border-b-2 border-brand-500 pb-2 transition';
        tabCompsBtn.className = 'text-slate-500 dark:text-slate-400 font-bold border-b-2 border-transparent hover:text-slate-700 dark:hover:text-slate-300 pb-2 transition';
        eventsContainer.classList.remove('hidden');
        compsContainer.classList.add('hidden');
      });

      tabCompsBtn.addEventListener('click', () => {
        tabCompsBtn.className = 'text-brand-600 dark:text-brand-400 font-bold border-b-2 border-brand-500 pb-2 transition';
        tabEventsBtn.className = 'text-slate-500 dark:text-slate-400 font-bold border-b-2 border-transparent hover:text-slate-700 dark:hover:text-slate-300 pb-2 transition';
        compsContainer.classList.remove('hidden');
        eventsContainer.classList.add('hidden');
        fetchCompetitions();
      });
    }

    const fetchEvents = async () => {
      try {
        const res = await fetch('/api/events');
        const events = await res.json();
        
        const template = document.getElementById('event-row-template');
        Array.from(eventsContainer.children).forEach(child => {
          if (!child.classList.contains('absolute')) eventsContainer.removeChild(child);
        });
        
        if (events.length === 0) {
          eventsContainer.insertAdjacentHTML('beforeend', `
            <div class="flex flex-col items-center justify-center py-20 animate-fade-in">
              <div class="w-20 h-20 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center mb-6">
                <svg class="w-10 h-10 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
              </div>
              <h4 class="font-bold text-lg text-slate-600 dark:text-slate-300 mb-2">No upcoming performances</h4>
              <p class="text-slate-400 dark:text-slate-500 text-sm text-center max-w-xs">There are no events scheduled yet. Check back soon or create one from your dashboard!</p>
            </div>`);
          return;
        }

        events.forEach((e, index) => {
          const date = new Date(e.date);
          const clone = template.firstElementChild.cloneNode(true);
          const rowDiv = clone.querySelector('.group');
          if (rowDiv) rowDiv.style.animationDelay = `${index * 50}ms`;

          clone.querySelector('.event-month-slot').textContent = date.toLocaleString('default', { month: 'short' });
          clone.querySelector('.event-day-slot').textContent = date.getDate();
          clone.querySelector('.event-temple-slot').textContent = e.templeName;
          clone.querySelector('.event-village-slot').textContent = e.village;
          const groupLink = clone.querySelector('.event-group-slot');
          groupLink.textContent = e.performingGroupId.groupName;
          groupLink.href = `/group.html?id=${e.performingGroupId._id}`;
          
          if (e.locationCoordinates && e.locationCoordinates.lat && e.locationCoordinates.lng) {
             const mapLink = clone.querySelector('.event-map-slot');
             if (mapLink) {
                 mapLink.href = `https://www.openstreetmap.org/?mlat=${e.locationCoordinates.lat}&mlon=${e.locationCoordinates.lng}#map=15/${e.locationCoordinates.lat}/${e.locationCoordinates.lng}`;
                 mapLink.classList.remove('hidden');
             }
          }

          eventsContainer.appendChild(clone);
        });
      } catch (err) {
        console.error(err);
      }
    };

    const fetchCompetitions = async () => {
      try {
        const res = await fetch('/api/competitions');
        const comps = await res.json();
        
        const template = document.getElementById('comp-row-template');
        Array.from(compsContainer.children).forEach(child => {
          if (!child.classList.contains('absolute')) compsContainer.removeChild(child);
        });
        
        if (comps.length === 0) {
          compsContainer.insertAdjacentHTML('beforeend', `
            <div class="flex flex-col items-center justify-center py-20 animate-fade-in">
              <div class="w-20 h-20 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-6">
                <svg class="w-10 h-10 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
                </svg>
              </div>
              <h4 class="font-bold text-lg text-slate-600 dark:text-slate-300 mb-2">No upcoming competitions</h4>
              <p class="text-slate-400 dark:text-slate-500 text-sm text-center max-w-xs">Competitions will appear here once organizers publish them. Stay tuned!</p>
            </div>`);
          return;
        }

        comps.forEach((c, index) => {
          const date = new Date(c.date);
          const clone = template.firstElementChild.cloneNode(true);
          const rowDiv = clone.querySelector('.group');
          if (rowDiv) rowDiv.style.animationDelay = `${index * 50}ms`;

          clone.querySelector('.comp-month-slot').textContent = date.toLocaleString('default', { month: 'short' });
          clone.querySelector('.comp-day-slot').textContent = date.getDate();
          clone.querySelector('.comp-title-slot').textContent = c.title;
          clone.querySelector('.comp-location-slot').textContent = c.location;
          clone.querySelector('.comp-desc-slot').textContent = c.description;
          clone.querySelector('.comp-count-slot').textContent = `${c.registeredGroups.length} groups`;

          if (c.locationCoordinates && c.locationCoordinates.lat && c.locationCoordinates.lng) {
             const mapLink = clone.querySelector('.comp-map-slot');
             if (mapLink) {
                 mapLink.href = `https://www.openstreetmap.org/?mlat=${c.locationCoordinates.lat}&mlon=${c.locationCoordinates.lng}#map=15/${c.locationCoordinates.lat}/${c.locationCoordinates.lng}`;
                 mapLink.classList.remove('hidden');
             }
          }

          if (c.photos && c.photos.length > 0) {
            const posterCont = clone.querySelector('.comp-poster-container');
            const posterImg = clone.querySelector('.comp-poster-slot');
            if (posterCont && posterImg) {
              posterImg.src = c.photos[0];
              posterCont.classList.remove('hidden');
            }
          }

          if (clone.classList.contains('comp-card-btn')) {
            clone.onclick = () => window.location.href = `/competition.html?id=${c._id}`;
          } else {
            const cardBtn = clone.querySelector('.comp-card-btn');
            if (cardBtn) {
              cardBtn.onclick = () => window.location.href = `/competition.html?id=${c._id}`;
            }
          }

          compsContainer.appendChild(clone);
        });
      } catch (err) {
        console.error(err);
      }
    };



    fetchEvents();
  }

  // --- auth.html Logic ---
  if (path === '/auth.html') {
    const authView = document.getElementById('authView');
    const profileView = document.getElementById('profileView');
    const statusBox = document.getElementById('statusMessage');
    const urlParams = new URLSearchParams(window.location.search);
    
    let statusTimeout;
    const showStatus = (msg, isError) => {
      clearTimeout(statusTimeout);
      statusBox.textContent = msg;
      statusBox.className = `mb-6 p-4 rounded-2xl text-sm font-semibold shadow-md transition-all text-center block ${
        isError ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800' 
                : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
      }`;
      statusTimeout = setTimeout(() => {
        statusBox.classList.remove('block');
        statusBox.classList.add('hidden');
      }, 5000);
    };

    const showConfirm = (message) => {
      return new Promise((resolve) => {
        const modal = document.getElementById('confirmModal');
        const msgEl = document.getElementById('confirmMessage');
        const okBtn = document.getElementById('confirmOkBtn');
        const cancelBtn = document.getElementById('confirmCancelBtn');

        msgEl.textContent = message;
        modal.classList.remove('hidden');

        const cleanup = () => {
          modal.classList.add('hidden');
          okBtn.removeEventListener('click', onOk);
          cancelBtn.removeEventListener('click', onCancel);
        };

        const onOk = () => { cleanup(); resolve(true); };
        const onCancel = () => { cleanup(); resolve(false); };

        okBtn.addEventListener('click', onOk);
        cancelBtn.addEventListener('click', onCancel);
      });
    };

    if (urlParams.get('verified') === 'true') {
      showStatus('Email successfully verified! You can now log in.', false);
    } else if (urlParams.get('error')) {
      showStatus('Authentication failed. Please try again.', true);
    }

    if (user) {
      if(!user.isVerified) {
         authView.classList.remove('hidden');
         showStatus('Please check your email to verify your account.', true);
         statusBox.className = 'mb-6 p-4 rounded-2xl text-sm font-semibold shadow-md transition-all text-center block bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800';
      } else {
        profileView.classList.remove('hidden');
        document.getElementById('userEmail').textContent = user.username || user.email.split('@')[0];
        
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
              
              const showList = () => {
                 listSection.classList.remove('hidden');
                 regSection.classList.add('hidden');
                 editSection.classList.add('hidden');
              };
              
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
                      <div>
                        <h4 class="font-bold text-slate-800 dark:text-slate-100">${group.groupName}</h4>
                        <p class="text-xs text-slate-500">${group.village}</p>
                      </div>
                      <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                    `;
                    card.onclick = () => {
                       // Load Editor
                       listSection.classList.add('hidden');
                       editSection.classList.remove('hidden');
                       
                       document.getElementById('dashGroupName').textContent = group.groupName;
                       document.getElementById('dashEditGroupName').value = group.groupName;
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
                            if(updateRes.ok) showStatus('Profile updated successfully!', false);
                            else showStatus('Failed to update profile.', true);
                          } catch(err) { console.error(err); }
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
                         } catch(err) { console.error(err); }
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
                                   div.className = 'glass-input p-3 rounded-xl flex justify-between items-center bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800';
                                   const evtDate = new Date(evt.date);
                                   div.className = 'glass-card p-3 rounded-xl flex items-center justify-between text-xs border border-slate-100 dark:border-slate-800';
                                   div.innerHTML = `
                                     <div>
                                        <div class="font-bold text-slate-700 dark:text-slate-200">${evt.templeName}</div>
                                        <div class="text-slate-500">${new Date(evt.date).toLocaleDateString()} - ${evt.village}</div>
                                     </div>
                                     <button class="text-red-500 hover:text-red-700 p-2 ml-2 transition">
                                       <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                     </button>
                                   `;
                                   div.querySelector('button').onclick = async () => {
                                      if(await showConfirm('Remove this event?')) {
                                         try {
                                            const delRes = await fetch(`/api/events/${evt._id}`, { method: 'DELETE' });
                                            if(delRes.ok) {
                                               showStatus('Event removed', false);
                                               renderDashEvents();
                                            } else {
                                               showStatus('Failed to remove event.', true);
                                            }
                                         } catch(e) { console.error(e); }
                                      }
                                   };
                                   dashEventsList.appendChild(div);
                                });
                             }
                          } catch(err) { console.error(err); }
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
                          } catch(err) { console.error(err); }
                          finally { btn.textContent = 'Add Event'; btn.disabled = false; }
                       };
                       
                       deleteBtn.onclick = async (e) => {
                         e.preventDefault();
                         const confirmed = await showConfirm(`Are you sure you want to permanently delete ${group.groupName}? This cannot be undone.`);
                         if(confirmed) {
                           deleteBtn.textContent = 'Deleting...';
                           deleteBtn.disabled = true;
                           try {
                             const delRes = await fetch(`/api/groups/${group._id}`, { method: 'DELETE' });
                             if(delRes.ok) {
                               showStatus('Group deleted successfully.', false);
                               deleteBtn.textContent = 'Permanently Delete Group';
                               deleteBtn.disabled = false;
                               loadDashboard(); // Reload list
                               window.scrollTo(0,0);
                             } else {
                               const data = await delRes.json();
                               showStatus('Failed to delete group: ' + (data.error || 'Unknown error'), true);
                               window.scrollTo(0,0);
                               deleteBtn.textContent = 'Permanently Delete Group';
                               deleteBtn.disabled = false;
                             }
                           } catch(err) { 
                             console.error(err); 
                             showStatus('Network error while deleting.', true);
                             window.scrollTo(0,0);
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
                         <h4 class="font-bold text-slate-800 dark:text-slate-100 text-base truncate group-hover:text-brand-500 transition">${comp.title}</h4>
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
                         } catch(e) {}
                       }
                    };
                    container.appendChild(card);
                 });
              }
            }
          } catch(e) { console.error(e); }
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
                registrationDeadline: document.getElementById('cDeadline').value
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
              if(!res.ok) throw new Error(data.error || 'Failed to create event');

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
                    if(!upRes.ok) console.error('Photo upload failed for index', i);
                 }
              }

              showStatus('Event published successfully!', false);
              compForm.reset();
              loadCompetitionsDashboard();
            } catch(err) {
              console.error(err);
              showStatus('Error: ' + err.message, true);
            } finally {
              btn.disabled = false;
              btn.textContent = 'Publish Event';
            }
          };
        }

        loadDashboard();
        loadCompetitionsDashboard();
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
          } catch(e) {
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
          } catch(e) {
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
            document.getElementById('pDesc').textContent = group.description;
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
            
            const message = encodeURIComponent(`Hello, I found your Dindi group (${group.groupName}) on Dindi. Are you available for a performance?`);
            actionBtn.innerHTML = `<a href="https://wa.me/${group.contactNumber}?text=${message}" target="_blank" 
              class="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3.5 rounded-2xl font-bold transition transform hover:-translate-y-0.5 active:translate-y-0 shadow-lg shadow-green-500/20">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.012 2C6.486 2 2 6.486 2 12.013c0 1.77.464 3.447 1.341 4.954L2 22l5.194-1.319A9.957 9.957 0 0012.012 22C17.538 22 22 17.538 22 12.013 22 6.486 17.538 2 12.012 2zM17.135 15.65c-.237.669-1.378 1.28-1.895 1.332-.516.052-.942.278-3.042-.596-2.531-1.054-4.148-3.666-4.272-3.832-.124-.165-1.021-1.353-1.021-2.584 0-1.231.639-1.839.866-2.066.227-.227.495-.284.66-.284.165 0 .33 0 .474.008.155.008.361-.061.567.433.216.516.732 1.802.794 1.925.062.124.103.268.021.433-.082.165-.124.268-.247.412-.124.144-.258.319-.371.433-.124.124-.258.258-.113.505.144.247.639 1.061 1.371 1.711.948.845 1.741 1.103 1.989 1.226.247.124.392.103.536-.062.144-.165.618-.721.783-.969.165-.247.33-.206.556-.124.227.082 1.443.68 1.69.804.247.124.412.185.474.288.062.103.062.608-.175 1.278z"/></svg>
                Invite via WhatsApp
              </a>`;
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
          
        } catch (err) {
          console.error(err);
        }
      };
      
      fetchGroupProfile();
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
});

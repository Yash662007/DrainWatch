import { api } from '../api/api.js';
import { store } from '../store.js';
import { ErrorState, EmptyState } from '../ui/components.js';

let mapInstance = null;
let allDrains = [];
let markerLayerGroup = null;
let activeDrainId = null;
let currentFilters = { search: '', severity: '' };
let debounceTimer;

export function render() {
  return `
    <div class="flex flex-col relative overflow-hidden" style="margin: -1.5rem; height: calc(100% + 1.5rem);">
      <!-- Map Container -->
      <div id="main-map" class="absolute inset-0 z-0 bg-[#e5e7eb]"></div>
      
      <!-- Top floating filters -->
      <div class="absolute top-4 left-4 right-4 md:right-auto md:w-96 z-10 space-y-2 pointer-events-none">
        <div class="clay-card p-3 shadow-[var(--clay-raised-hover)] flex items-center gap-2 pointer-events-auto">
          <i data-lucide="search" class="w-5 h-5 text-secondary"></i>
          <input type="text" id="map-search" placeholder="Search drain, ward or location..." class="flex-1 bg-transparent outline-none text-sm text-primary">
        </div>
        <div class="flex gap-2 overflow-x-auto pb-1 pointer-events-auto hide-scrollbar">
          <select id="filter-severity" class="clay-input text-xs py-2 px-3 min-w-max shadow-md cursor-pointer !bg-white">
            <option value="">All Severities</option>
            <option value="critical">Critical Only</option>
            <option value="high-risk">High Risk</option>
            <option value="warning">Warning</option>
            <option value="healthy">Healthy</option>
          </select>
        </div>
      </div>
      
      <!-- Detail Panel -->
      <div id="drain-panel" class="absolute inset-x-0 bottom-0 md:inset-y-0 md:left-auto md:right-0 md:w-[420px] z-20 clay-panel rounded-t-[32px] md:rounded-none md:border-l border-white/20 transform translate-y-full md:translate-y-0 md:translate-x-full transition-transform duration-300 flex flex-col shadow-[0_-8px_32px_rgba(15,23,42,0.1)] md:shadow-[-8px_0_32px_rgba(15,23,42,0.1)] max-h-[85vh] md:max-h-full">
        <div class="md:hidden flex justify-center py-4 cursor-pointer" id="close-panel-handle">
          <div class="w-12 h-1.5 rounded-full bg-black/20"></div>
        </div>
        <div class="md:flex hidden justify-between items-center p-4 border-b border-[rgba(15,23,42,0.05)]">
          <h3 class="font-bold">Drain Details</h3>
          <button id="close-panel-btn-desktop" class="p-2 rounded-full hover:bg-black/5"><i data-lucide="x" class="w-5 h-5"></i></button>
        </div>
        <div class="flex-1 overflow-y-auto p-6 pt-2 md:pt-6" id="drain-detail-content">
          <!-- Content injected here -->
        </div>
      </div>
    </div>
  `;
}

export async function init() {
  if (window.lucide) window.lucide.createIcons();
  
  try {
    allDrains = await api.getDrains();

    // Ensure Leaflet is loaded
    if (!window.L) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
      
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => initMap();
      document.head.appendChild(script);
    } else {
      initMap();
    }
    
    // Bind filters
    const searchInput = document.getElementById('map-search');
    const severitySelect = document.getElementById('filter-severity');
    const closeHandle = document.getElementById('close-panel-handle');
    const closeBtn = document.getElementById('close-panel-btn-desktop');
    
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          currentFilters.search = e.target.value.toLowerCase();
          applyFilters();
        }, 300);
      });
    }
    
    if (severitySelect) {
      severitySelect.addEventListener('change', (e) => {
        currentFilters.severity = e.target.value;
        applyFilters();
      });
    }
    
    if (closeBtn) closeBtn.addEventListener('click', closePanel);
    if (closeHandle) {
      closeHandle.addEventListener('click', closePanel);
      
      // Swipe gestures for closing panel on mobile
      let startY = 0;
      let currentY = 0;
      const panel = document.getElementById('drain-panel');
      
      closeHandle.addEventListener('touchstart', (e) => {
        startY = e.touches[0].clientY;
        panel.style.transition = 'none';
      }, {passive: true});
      
      closeHandle.addEventListener('touchmove', (e) => {
        currentY = e.touches[0].clientY;
        const deltaY = currentY - startY;
        if (deltaY > 0) {
          panel.style.transform = `translateY(${deltaY}px)`;
        }
      }, {passive: true});
      
      closeHandle.addEventListener('touchend', (e) => {
        const deltaY = currentY - startY;
        panel.style.transition = '';
        panel.style.transform = ''; // Clear inline style
        if (deltaY > 50) {
          closePanel();
        }
      });
    }
    
  } catch (e) {
    document.getElementById('main-map').innerHTML = ErrorState('Failed to load map data.', 'window.location.reload');
    if (window.lucide) window.lucide.createIcons();
  }
}

function initMap() {
  if (mapInstance) {
    mapInstance.remove();
  }
  
  const mapEl = document.getElementById('main-map');
  if (!mapEl) return;
  
  mapInstance = L.map(mapEl, { zoomControl: false }).setView([19.0760, 72.8777], 12);
  L.control.zoom({ position: 'bottomright' }).addTo(mapInstance);
  
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
  }).addTo(mapInstance);
  
  markerLayerGroup = L.layerGroup().addTo(mapInstance);
  
  applyFilters();
}

function applyFilters() {
  if (!markerLayerGroup) return;
  markerLayerGroup.clearLayers();
  
  const filtered = allDrains.filter(d => {
    const matchSearch = d.id.toLowerCase().includes(currentFilters.search) || 
                        d.location.toLowerCase().includes(currentFilters.search) || 
                        d.ward.toLowerCase().includes(currentFilters.search);
    const matchSeverity = currentFilters.severity ? d.severity === currentFilters.severity : true;
    return matchSearch && matchSeverity;
  });
  
  const colors = {
    'healthy': 'var(--color-healthy)',
    'warning': 'var(--color-warning)',
    'high-risk': 'var(--color-high-risk)',
    'critical': 'var(--color-critical)'
  };
  
  filtered.forEach(d => {
    // Render risk zone circle for critical
    if (d.severity === 'critical') {
      L.circle(d.coords, {
        color: colors[d.severity],
        fillColor: colors[d.severity],
        fillOpacity: 0.1,
        radius: 300,
        weight: 0
      }).addTo(markerLayerGroup);
    }
    
    // Render Marker
    const isMobile = window.innerWidth < 768;
    const marker = L.circleMarker(d.coords, {
      radius: d.id === activeDrainId ? (isMobile ? 14 : 10) : (isMobile ? 12 : 7),
      fillColor: colors[d.severity],
      color: '#fff',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.9,
      className: 'shadow-lg transition-all'
    });
    
    marker.on('click', () => {
      activeDrainId = d.id;
      applyFilters(); // Re-render to highlight active
      openPanel(d);
    });
    
    marker.addTo(markerLayerGroup);
  });
  
  // Update Empty State if needed
  if (filtered.length === 0) {
    // Show toast
    import('../ui/toast.js').then(m => m.Toast.show('No drains match your filters', 'warning'));
  }
}

function openPanel(drain) {
  const panel = document.getElementById('drain-panel');
  if (panel) {
    panel.classList.remove('translate-y-full', 'md:translate-x-full');
    renderDrainDetail(drain);
  }
}

function closePanel() {
  const panel = document.getElementById('drain-panel');
  if (panel) {
    panel.classList.add('translate-y-full', 'md:translate-x-full');
    activeDrainId = null;
    applyFilters();
  }
}

function renderDrainDetail(drain) {
  const container = document.getElementById('drain-detail-content');
  if (!container) return;
  
  const role = store.state.role;
  const isOfficer = ['officer', 'admin'].includes(role);
  const severityCapitalized = drain.severity.toUpperCase().replace('-', ' ');
  
  container.innerHTML = `
    <div class="space-y-6 pb-20 md:pb-6">
      <div class="flex justify-between items-start">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <h2 class="text-xl font-bold text-primary">${drain.id}</h2>
            <span class="clay-badge severity-${drain.severity}">${severityCapitalized}</span>
          </div>
          <p class="text-sm text-secondary flex items-center gap-1">
            <i data-lucide="map-pin" class="w-4 h-4"></i> ${drain.location}
          </p>
        </div>
      </div>
      
      <div class="grid grid-cols-2 gap-4">
        <div class="clay-card p-3 shadow-sm">
          <div class="text-xs text-secondary mb-1">Blockage</div>
          <div class="font-bold text-lg text-primary">${drain.blockage}%</div>
        </div>
        <div class="clay-card p-3 shadow-sm">
          <div class="text-xs text-secondary mb-1">Water Level</div>
          <div class="font-bold text-lg ${drain.waterLevel > 75 ? 'text-[var(--color-critical)]' : 'text-primary'}">${drain.waterLevel}%</div>
        </div>
        <div class="clay-card p-3 shadow-sm">
          <div class="text-xs text-secondary mb-1">Flood Risk</div>
          <div class="font-bold text-lg capitalize text-primary">${drain.risk}</div>
        </div>
        <div class="clay-card p-3 shadow-sm">
          <div class="text-xs text-secondary mb-1">Type</div>
          <div class="font-bold text-lg text-primary">${drain.type}</div>
        </div>
      </div>
      
      ${drain.severity !== 'healthy' ? `
        <div class="clay-card p-4 border border-[var(--color-warning)] bg-[var(--color-warning)]/5">
          <h4 class="font-semibold text-sm mb-2 flex items-center gap-2">
            <i data-lucide="cpu" class="w-4 h-4"></i> AI Assessment
          </h4>
          <p class="text-xs text-secondary mb-3">Analysis indicates severe obstruction likely due to solid waste accumulation. Immediate clearing recommended.</p>
          <div class="flex gap-2">
            ${isOfficer ? `<button class="clay-btn w-full text-sm py-2">Assign Team</button>` : ''}
          </div>
        </div>
      ` : ''}

      <div class="space-y-3">
        <h4 class="font-semibold text-sm">Lifecycle Timeline</h4>
        <div class="relative pl-6 space-y-4 before:absolute before:inset-y-0 before:left-[11px] before:w-0.5 before:bg-black/10">
          
          <div class="relative">
            <div class="absolute -left-6 w-3 h-3 rounded-full bg-[var(--color-primary)] ring-4 ring-white shadow-sm mt-1"></div>
            <div class="text-sm font-semibold">Reported</div>
            <div class="text-xs text-secondary">2 hours ago by Citizen</div>
          </div>
          
          <div class="relative">
            <div class="absolute -left-6 w-3 h-3 rounded-full bg-[var(--color-primary)] ring-4 ring-white shadow-sm mt-1"></div>
            <div class="text-sm font-semibold">AI Assessed</div>
            <div class="text-xs text-secondary">1 hour ago (Confidence: 94%)</div>
          </div>
          
          <div class="relative opacity-50">
            <div class="absolute -left-6 w-3 h-3 rounded-full bg-black/20 ring-4 ring-white shadow-sm mt-1"></div>
            <div class="text-sm font-semibold">Assigned</div>
            <div class="text-xs text-secondary">Pending officer action</div>
          </div>
          
        </div>
      </div>
      
    </div>
  `;
  
  if (window.lucide) window.lucide.createIcons();
}

import { api } from '../api/api.js';
import { store } from '../store.js';
import { Skeletons, EmptyState, ErrorState } from '../ui/components.js';

export function render() {
  return `
    <div class="space-y-8 max-w-7xl mx-auto animate-fade-in">
      <div id="dashboard-metrics" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        ${Array(6).fill(Skeletons.Metric()).join('')}
      </div>
      
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="lg:col-span-2 space-y-8">
          <section>
            <h2 class="text-section-title mb-4 flex items-center gap-2">
              <i data-lucide="alert-circle" class="w-5 h-5 text-[var(--color-critical)]"></i> Critical Alerts
            </h2>
            <div id="dashboard-alerts" class="space-y-4">
              ${Skeletons.List(2)}
            </div>
          </section>
          
          <section>
            <h2 class="text-section-title mb-4">Live Mini-Map</h2>
            <div id="dashboard-minimap" class="h-[300px] rounded-[var(--r-lg)] overflow-hidden relative shadow-[var(--clay-pressed)] border-[4px] border-[var(--surface)]">
              ${Skeletons.Map()}
            </div>
          </section>
        </div>
        
        <div class="space-y-8">
          <section>
            <h2 class="text-section-title mb-4">Recent Reports</h2>
            <div id="dashboard-reports" class="space-y-4">
              ${Skeletons.List(3)}
            </div>
          </section>
          
          <section>
            <h2 class="text-section-title mb-4">Community Impact</h2>
            <div id="dashboard-impact">
              ${Skeletons.Card()}
            </div>
          </section>
        </div>
      </div>
    </div>
  `;
}

export async function init() {
  try {
    const [drains, reports, workOrders] = await Promise.all([
      api.getDrains(),
      api.getReports(),
      api.getWorkOrders()
    ]);
    
    renderMetrics(drains, workOrders);
    renderAlerts(drains);
    renderMiniMap(drains);
    renderReports(reports);
    renderImpact(reports);
    
    if (window.lucide) window.lucide.createIcons();
  } catch (e) {
    document.getElementById('app-content').innerHTML = ErrorState('Failed to load dashboard data.', 'window.location.reload');
    if (window.lucide) window.lucide.createIcons();
  }
}

function renderMetrics(drains, workOrders) {
  const container = document.getElementById('dashboard-metrics');
  if (!container) return;
  
  const healthy = drains.filter(d => d.severity === 'healthy').length;
  const blocked = drains.filter(d => ['warning', 'high-risk'].includes(d.severity)).length;
  const critical = drains.filter(d => d.severity === 'critical').length;
  const activeWO = workOrders.filter(w => w.status !== 'Resolved').length;
  
  const metrics = [
    { label: 'Total Drains', value: drains.length, icon: 'database', color: 'var(--color-primary)' },
    { label: 'Healthy', value: healthy, icon: 'check-circle', color: 'var(--color-healthy)' },
    { label: 'Blocked', value: blocked, icon: 'alert-triangle', color: 'var(--color-warning)' },
    { label: 'Critical', value: critical, icon: 'shield-alert', color: 'var(--color-critical)' },
    { label: 'Active WOs', value: activeWO, icon: 'clipboard-list', color: 'var(--color-primary)' },
    { label: 'Avg Response', value: '4h 12m', icon: 'clock', color: 'var(--color-primary)' }
  ];
  
  container.innerHTML = metrics.map(m => `
    <div class="clay-card p-4 flex items-center gap-3 md:gap-4">
      <div class="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-[var(--clay-pressed)] bg-[rgba(15,23,42,0.02)]">
        <i data-lucide="${m.icon}" class="w-5 h-5" style="color: ${m.color}"></i>
      </div>
      <div>
        <div class="text-xl md:text-2xl font-bold leading-none mb-1 text-primary">${m.value}</div>
        <div class="text-[10px] md:text-xs text-secondary font-medium uppercase tracking-wider">${m.label}</div>
      </div>
    </div>
  `).join('');
}

function renderAlerts(drains) {
  const container = document.getElementById('dashboard-alerts');
  if (!container) return;
  
  const criticalDrains = drains.filter(d => d.severity === 'critical').slice(0, 3);
  const role = store.state.role;
  
  if (criticalDrains.length === 0) {
    container.innerHTML = EmptyState('check-circle', 'No Critical Alerts', 'All drains are operating within normal parameters.');
    return;
  }
  
  container.innerHTML = criticalDrains.map(d => `
    <div class="clay-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden group">
      <div class="absolute left-0 top-0 bottom-0 w-1.5 bg-[var(--color-critical)]"></div>
      <div class="pl-2">
        <div class="flex items-center gap-2 mb-1">
          <span class="font-bold text-sm text-primary">${d.id}</span>
          <span class="clay-badge severity-critical">Critical</span>
          <span class="text-xs text-[var(--color-critical)] font-semibold px-2 py-0.5 bg-[var(--color-critical)]/10 rounded-full">Risk: High</span>
        </div>
        <p class="text-sm text-secondary flex items-center gap-1 mt-2">
          <i data-lucide="map-pin" class="w-3.5 h-3.5"></i> ${d.location}
        </p>
      </div>
      <div class="flex gap-2 shrink-0">
        <a href="#/map" class="clay-btn clay-btn-ghost text-sm py-1.5 px-3">View</a>
        ${['officer', 'admin'].includes(role) ? `<button class="clay-btn text-sm py-1.5 px-3">Assign</button>` : ''}
      </div>
    </div>
  `).join('');
}

function renderMiniMap(drains) {
  const container = document.getElementById('dashboard-minimap');
  if (!container) return;
  
  container.innerHTML = `<div id="mini-map-container" class="w-full h-full z-0"></div>`;
  
  if (!window.L) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
    
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => initLeaflet(drains);
    document.head.appendChild(script);
  } else {
    initLeaflet(drains);
  }
}

function initLeaflet(drains) {
  const mapContainer = document.getElementById('mini-map-container');
  if (!mapContainer || !window.L) return;
  
  const map = L.map(mapContainer, { zoomControl: false, attributionControl: false }).setView([19.0760, 72.8777], 11);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19
  }).addTo(map);
  
  const colors = {
    'healthy': 'var(--color-healthy)',
    'warning': 'var(--color-warning)',
    'high-risk': 'var(--color-high-risk)',
    'critical': 'var(--color-critical)'
  };
  
  drains.forEach(d => {
    L.circleMarker(d.coords, {
      radius: d.severity === 'critical' ? 8 : 6,
      fillColor: colors[d.severity],
      color: '#fff',
      weight: 1.5,
      opacity: 1,
      fillOpacity: 0.9
    }).addTo(map);
  });
}

function renderReports(reports) {
  const container = document.getElementById('dashboard-reports');
  if (!container) return;
  
  if (reports.length === 0) {
    container.innerHTML = EmptyState('inbox', 'No Reports', 'There are no recent citizen reports.');
    return;
  }
  
  container.innerHTML = reports.slice(0, 3).map(r => `
    <div class="clay-card p-3 flex gap-3 cursor-pointer hover:-translate-y-0.5 transition-transform" onclick="window.location.hash='/report'">
      <div class="w-16 h-16 shadow-[var(--clay-pressed)] rounded-lg flex-shrink-0 flex items-center justify-center bg-[var(--bg)]">
        <i data-lucide="image" class="w-6 h-6 text-secondary opacity-50"></i>
      </div>
      <div class="flex-1 min-w-0 flex flex-col justify-center">
        <div class="flex justify-between items-start mb-1">
          <span class="font-semibold text-sm truncate text-primary">${r.issue}</span>
          <span class="text-[10px] text-secondary whitespace-nowrap font-medium">Just now</span>
        </div>
        <p class="text-xs text-secondary truncate mb-2">${r.location}</p>
        <div>
          <span class="clay-badge severity-${r.severity || 'warning'} !text-[10px] !py-0.5 !px-2">Reported</span>
        </div>
      </div>
    </div>
  `).join('');
}

function renderImpact(reports) {
  const container = document.getElementById('dashboard-impact');
  if (!container) return;
  
  const stats = store.state.user;
  
  container.innerHTML = `
    <div class="clay-card p-6 bg-gradient-to-br from-[var(--surface)] to-[var(--bg)] relative overflow-hidden">
      <!-- Decorative circle -->
      <div class="absolute -right-8 -top-8 w-32 h-32 bg-[var(--color-primary)] opacity-5 rounded-full blur-2xl"></div>
      
      <div class="flex items-center gap-4 mb-6 relative z-10">
        <div class="w-14 h-14 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center font-bold text-xl shadow-[var(--clay-raised)]">
          ${stats.initial}
        </div>
        <div>
          <h3 class="font-bold text-lg text-primary">${stats.name}</h3>
          <span class="clay-badge severity-info mt-1 !text-xs !bg-white/50">${stats.level}</span>
        </div>
      </div>
      
      <div class="grid grid-cols-2 gap-4 relative z-10">
        <div class="p-4 rounded-xl shadow-[var(--clay-pressed)] bg-[rgba(15,23,42,0.02)]">
          <div class="text-[10px] text-secondary mb-1 uppercase tracking-wider font-bold">Reports</div>
          <div class="text-2xl font-bold text-primary">${reports.length}</div>
        </div>
        <div class="p-4 rounded-xl shadow-[var(--clay-pressed)] bg-[rgba(15,23,42,0.02)]">
          <div class="text-[10px] text-secondary mb-1 uppercase tracking-wider font-bold">Credits</div>
          <div class="text-2xl font-bold text-[var(--color-primary)] flex items-center gap-1">
             ${stats.credits}
          </div>
        </div>
      </div>
      
      <a href="#/rewards" class="clay-btn w-full mt-6 py-2.5 text-sm relative z-10">View Leaderboard</a>
    </div>
  `;
}

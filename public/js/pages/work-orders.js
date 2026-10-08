import { api } from '../api/api.js';
import { store } from '../store.js';
import { Toast } from '../ui/toast.js';
import { Skeletons, EmptyState } from '../ui/components.js';

let workOrders = [];
let allTeams = [];
let currentFilter = 'All';

export function render() {
  return `
    <div class="max-w-7xl mx-auto space-y-6 pb-20 animate-fade-in">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <h2 class="text-page-title flex items-center gap-3">
          <div class="p-2 bg-[var(--color-primary)]/10 rounded-xl">
            <i data-lucide="clipboard-list" class="w-6 h-6 md:w-8 md:h-8 text-[var(--color-primary)]"></i>
          </div>
          Work Orders
        </h2>
        <div class="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
          ${['All', 'Assigned', 'In Progress', 'Resolved'].map(f => `
            <button class="filter-btn clay-btn ${currentFilter === f ? '' : 'clay-btn-ghost'} py-1.5 px-4 text-sm min-w-max" data-filter="${f}">${f}</button>
          `).join('')}
        </div>
      </div>
      
      <div id="wo-content">
        ${Skeletons.Table()}
      </div>
      
      <!-- Modal Detail -->
      <div id="wo-modal" class="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm hidden flex items-center justify-center p-4">
        <div class="clay-modal w-full max-w-2xl max-h-[90vh] flex flex-col transform scale-95 opacity-0 transition-all duration-200" id="wo-modal-content">
          <!-- Injected via JS -->
        </div>
      </div>
    </div>
  `;
}

export async function init() {
  if (window.lucide) window.lucide.createIcons();
  
  // Attach filters
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.filter-btn').forEach(b => {
        b.classList.add('clay-btn-ghost');
      });
      e.currentTarget.classList.remove('clay-btn-ghost');
      currentFilter = e.currentTarget.dataset.filter;
      renderList();
    });
  });
  
  try {
    [workOrders, allTeams] = await Promise.all([api.getWorkOrders(), api.getTeams()]);
    store.updateEntity('workOrders', workOrders);
    renderList();
  } catch (e) {
    document.getElementById('wo-content').innerHTML = EmptyState('alert-triangle', 'Error', 'Failed to load work orders');
  }
}

async function refresh() {
  workOrders = await api.getWorkOrders();
  store.updateEntity('workOrders', workOrders);
  renderList();
}

function renderList() {
  const container = document.getElementById('wo-content');
  if (!container) return;
  
  const filtered = currentFilter === 'All' ? workOrders : workOrders.filter(w => w.status === currentFilter);
  
  if (filtered.length === 0) {
    container.innerHTML = EmptyState('clipboard-check', 'No Work Orders', `No work orders found for status: ${currentFilter}.`);
    return;
  }
  
  // Render Desktop Table / Mobile Cards
  container.innerHTML = `
    <!-- Desktop Table -->
    <div class="hidden md:block clay-card p-0 overflow-hidden">
      <table class="w-full text-left text-sm">
        <thead class="bg-black/5 text-secondary uppercase tracking-wider text-[10px] font-bold">
          <tr>
            <th class="px-6 py-4">Order ID</th>
            <th class="px-6 py-4">Location</th>
            <th class="px-6 py-4">Severity</th>
            <th class="px-6 py-4">Status</th>
            <th class="px-6 py-4">SLA</th>
            <th class="px-6 py-4 text-right">Action</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-[rgba(15,23,42,0.05)]">
          ${filtered.map(w => `
            <tr class="hover:bg-black/[0.02] transition-colors cursor-pointer" onclick="window.openDetail('${w.id}')">
              <td class="px-6 py-4 font-bold text-primary">${w.id}</td>
              <td class="px-6 py-4">
                <div class="font-medium text-primary">${w.drainId}</div>
                <div class="text-xs text-secondary">${w.location}</div>
              </td>
              <td class="px-6 py-4">
                <span class="clay-badge severity-${w.severity}">${w.severity}</span>
              </td>
              <td class="px-6 py-4 font-semibold text-primary">${w.status}</td>
              <td class="px-6 py-4 font-mono text-xs ${w.sla.includes('Completed') ? 'text-[var(--color-healthy)]' : 'text-[var(--color-critical)]'}">${w.sla}</td>
              <td class="px-6 py-4 text-right">
                <button class="clay-btn clay-btn-ghost py-1 px-3 text-xs">View</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    
    <!-- Mobile Cards -->
    <div class="md:hidden space-y-4">
      ${filtered.map(w => `
        <div class="clay-card p-4 cursor-pointer hover:-translate-y-0.5 transition-transform" onclick="window.openDetail('${w.id}')">
          <div class="flex justify-between items-start mb-3">
            <div>
              <div class="font-bold text-primary">${w.id}</div>
              <div class="text-xs text-secondary mt-0.5">${w.drainId}</div>
            </div>
            <span class="clay-badge severity-${w.severity}">${w.severity}</span>
          </div>
          <div class="text-sm text-primary mb-4 flex items-center gap-1">
            <i data-lucide="map-pin" class="w-4 h-4 text-[var(--color-primary)]"></i> ${w.location}
          </div>
          <div class="flex justify-between items-center pt-3 border-t border-[rgba(15,23,42,0.05)]">
            <div class="text-xs font-semibold text-secondary">${w.status}</div>
            <div class="font-mono text-xs font-bold ${w.sla.includes('Completed') ? 'text-[var(--color-healthy)]' : 'text-[var(--color-critical)]'}">${w.sla}</div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
  if (window.lucide) window.lucide.createIcons();
}

window.openDetail = function(id) {
  const wo = workOrders.find(w => w.id === id);
  if (!wo) return;
  
  const modal = document.getElementById('wo-modal');
  const content = document.getElementById('wo-modal-content');
  
  content.innerHTML = `
    <div class="p-6 border-b border-[rgba(15,23,42,0.05)] flex justify-between items-center bg-black/[0.02]">
      <h3 class="text-section-title text-primary">${wo.id} Detail</h3>
      <button class="p-2 rounded-full hover:bg-black/10" onclick="window.closeDetail()"><i data-lucide="x" class="w-5 h-5"></i></button>
    </div>
    <div class="p-6 overflow-y-auto space-y-6">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <div class="text-[10px] uppercase font-bold text-secondary mb-1">Drain</div>
          <div class="font-bold text-primary">${wo.drainId}</div>
        </div>
        <div>
          <div class="text-[10px] uppercase font-bold text-secondary mb-1">Status</div>
          <div class="font-bold text-primary">${wo.status}</div>
        </div>
        <div class="col-span-2">
          <div class="text-[10px] uppercase font-bold text-secondary mb-1">Location</div>
          <div class="font-bold text-primary flex items-center gap-1"><i data-lucide="map-pin" class="w-4 h-4"></i> ${wo.location}</div>
        </div>
      </div>
      
      <div class="space-y-3">
        <h4 class="font-bold text-sm">Progress Timeline</h4>
        <div class="relative pl-6 space-y-4 before:absolute before:inset-y-0 before:left-[11px] before:w-0.5 before:bg-black/10">
          <div class="relative">
            <div class="absolute -left-6 w-3 h-3 rounded-full bg-[var(--color-primary)] ring-4 ring-white shadow-sm mt-1"></div>
            <div class="text-sm font-semibold">Reported</div>
          </div>
          <div class="relative ${wo.status === 'Reported' ? 'opacity-50' : ''}">
            <div class="absolute -left-6 w-3 h-3 rounded-full ${wo.status !== 'Reported' ? 'bg-[var(--color-primary)]' : 'bg-black/20'} ring-4 ring-white shadow-sm mt-1"></div>
            <div class="text-sm font-semibold">Assigned</div>
            ${wo.team ? `<div class="text-xs text-secondary">${wo.team}</div>` : ''}
          </div>
          <div class="relative ${wo.status !== 'Resolved' ? 'opacity-50' : ''}">
            <div class="absolute -left-6 w-3 h-3 rounded-full ${wo.status === 'Resolved' ? 'bg-[var(--color-healthy)]' : 'bg-black/20'} ring-4 ring-white shadow-sm mt-1"></div>
            <div class="text-sm font-semibold">Resolved</div>
          </div>
        </div>
      </div>
      
      ${!wo.team ? `
        <div class="pt-4 border-t border-[rgba(15,23,42,0.05)]">
          <label class="text-xs font-bold text-secondary uppercase mb-2 block">Assign Team</label>
          <div class="flex gap-2">
            <select class="clay-input flex-1" id="assign-team-select">
              ${allTeams.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}
            </select>
            <button class="clay-btn" onclick="window.assignTeam('${wo.id}')">Assign</button>
          </div>
        </div>
      ` : ''}
    </div>
  `;
  
  modal.classList.remove('hidden');
  if (window.lucide) window.lucide.createIcons();
  
  requestAnimationFrame(() => {
    content.classList.remove('scale-95', 'opacity-0');
  });
};

window.closeDetail = function() {
  const modal = document.getElementById('wo-modal');
  const content = document.getElementById('wo-modal-content');
  content.classList.add('scale-95', 'opacity-0');
  setTimeout(() => {
    modal.classList.add('hidden');
  }, 200);
};

window.assignTeam = async function(id) {
  const teamId = parseInt(document.getElementById('assign-team-select').value, 10);
  const team = allTeams.find(t => t.id === teamId);
  try {
    await api.assignWorkOrder(id, teamId);
    Toast.show(`Assigned ${team ? team.name : 'team'} to ${id}`, 'success');
    window.closeDetail();
    await refresh();
  } catch (err) {
    Toast.show(err.message || 'Failed to assign team', 'error');
  }
};

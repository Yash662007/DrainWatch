import { store } from '../store.js';
import { api } from '../api/api.js';

export function render() {
  const user = store.state.user;
  const role = store.state.role;
  
  return `
    <div class="max-w-3xl mx-auto space-y-6 pb-20 animate-fade-in">
      
      <!-- Profile Header -->
      <div class="clay-card p-8 text-center relative overflow-hidden bg-gradient-to-b from-[var(--surface-elevated)] to-[var(--surface)] shadow-[var(--clay-raised)]">
        <div class="w-24 h-24 mx-auto bg-[var(--color-primary)] text-white text-3xl font-bold rounded-full flex items-center justify-center mb-4 shadow-[var(--clay-raised)]">
          ${user.initial}
        </div>
        <h2 class="text-2xl font-bold text-primary mb-1">${user.name}</h2>
        <div class="text-secondary font-medium uppercase tracking-widest text-xs mb-4">${role.replace('-', ' ')}</div>
        
        <div class="flex justify-center gap-2">
          <span class="clay-badge severity-info border border-[var(--color-primary)]/20">${user.level}</span>
          <span class="clay-badge bg-black/5 !text-primary"><i data-lucide="award" class="w-3 h-3 text-[var(--color-primary)]"></i> ${user.credits} CC</span>
        </div>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="clay-card p-6 shadow-[var(--clay-raised)]">
          <h3 class="text-card-title mb-4 flex items-center gap-2">
            <i data-lucide="bar-chart" class="w-5 h-5 text-secondary"></i> My Impact
          </h3>
          <div class="space-y-4" id="profile-impact">
            <div class="text-sm text-secondary">Loading...</div>
          </div>
        </div>
        
        <div class="clay-card p-6 shadow-[var(--clay-raised)]">
          <h3 class="text-card-title mb-4 flex items-center gap-2">
            <i data-lucide="settings" class="w-5 h-5 text-secondary"></i> Quick Settings
          </h3>
          <div class="space-y-3">
            <a href="#/settings" class="flex justify-between items-center p-3 hover:bg-black/5 rounded-lg transition-colors group">
              <span class="font-medium text-primary">Edit Profile</span>
              <i data-lucide="chevron-right" class="w-4 h-4 text-secondary group-hover:text-primary"></i>
            </a>
            <a href="#/settings" class="flex justify-between items-center p-3 hover:bg-black/5 rounded-lg transition-colors group">
              <span class="font-medium text-primary">Notification Preferences</span>
              <i data-lucide="chevron-right" class="w-4 h-4 text-secondary group-hover:text-primary"></i>
            </a>
            <button class="w-full flex justify-between items-center p-3 hover:bg-[var(--color-critical)]/10 text-[var(--color-critical)] rounded-lg transition-colors group" onclick="window.mockLogout()">
              <span class="font-bold">Sign Out</span>
              <i data-lucide="log-out" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
      </div>
      
    </div>
  `;
}

export async function init() {
  if (window.lucide) window.lucide.createIcons();

  const container = document.getElementById('profile-impact');
  if (!container) return;

  try {
    const profile = await api.getProfile();
    container.innerHTML = `
      <div class="flex justify-between items-center bg-black/5 p-3 rounded-lg shadow-[var(--clay-pressed)]">
        <span class="text-sm font-bold text-secondary">Reports Submitted</span>
        <span class="font-bold text-primary">${profile.reportsSubmitted}</span>
      </div>
      <div class="flex justify-between items-center bg-black/5 p-3 rounded-lg shadow-[var(--clay-pressed)]">
        <span class="text-sm font-bold text-secondary">Verified Accuracy</span>
        <span class="font-bold text-[var(--color-healthy)]">${profile.verifiedAccuracy}%</span>
      </div>
      <div class="flex justify-between items-center bg-black/5 p-3 rounded-lg shadow-[var(--clay-pressed)]">
        <span class="text-sm font-bold text-secondary">Community Rank</span>
        <span class="font-bold text-[var(--color-primary)]">#${profile.communityRank}</span>
      </div>
    `;
  } catch (e) {
    container.innerHTML = `<div class="text-sm text-[var(--color-critical)]">Failed to load impact stats.</div>`;
  }
}

window.mockLogout = async function() {
  await api.logout().catch(() => {});
  store.clearUser();
  import('../ui/toast.js').then(m => m.Toast.show('Signed out successfully.', 'info'));
  window.location.hash = '/login';
  window.location.reload();
}

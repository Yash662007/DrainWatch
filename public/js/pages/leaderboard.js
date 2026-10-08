import { api } from '../api/api.js';
import { EmptyState, ErrorState } from '../ui/components.js';

let activeTab = 'individual';

export function render() {
  return `
    <div class="max-w-4xl mx-auto space-y-6 pb-20 animate-fade-in" id="leaderboard-container">
      <div class="flex items-center gap-4 mb-2">
        <a href="#/rewards" class="p-2 bg-black/5 rounded-full hover:bg-black/10"><i data-lucide="arrow-left" class="w-5 h-5"></i></a>
        <h2 class="text-page-title flex items-center gap-3">
          <i data-lucide="trophy" class="w-8 h-8 text-[#d99c41]"></i> Leaderboard
        </h2>
      </div>

      <p class="text-sm text-secondary bg-black/5 p-3 rounded-lg flex items-start gap-2 shadow-[var(--clay-pressed)]">
        <i data-lucide="info" class="w-4 h-4 shrink-0 mt-0.5"></i>
        <span>Leaderboard ranking prioritizes <strong>verified contributions</strong> to ensure high data quality and prevent spam reporting.</span>
      </p>

      <div class="flex bg-black/5 p-1 rounded-xl shadow-[var(--clay-pressed)] mb-6">
        ${['individual', 'ward', 'locality'].map(t => `
          <button class="flex-1 py-2 text-sm font-bold uppercase tracking-wider rounded-lg transition-colors ${activeTab === t ? 'bg-[var(--surface-elevated)] text-primary shadow-sm' : 'text-secondary hover:bg-black/5'}" onclick="window.lbSetTab('${t}')">
            ${t}
          </button>
        `).join('')}
      </div>

      <div class="clay-card p-0 overflow-hidden shadow-[var(--clay-raised)]" id="lb-content">
        <div class="p-6 text-sm text-secondary">Loading...</div>
      </div>
    </div>
  `;
}

export function init() {
  renderList();
}

window.lbSetTab = function(tab) {
  activeTab = tab;
  const container = document.getElementById('app-content');
  if (container) {
    container.innerHTML = render();
    init();
  }
}

async function renderList() {
  const container = document.getElementById('lb-content');
  if (!container) return;

  let rows;
  try {
    rows = await api.getLeaderboard(activeTab);
  } catch (e) {
    container.innerHTML = ErrorState('Failed to load leaderboard.', 'window.location.reload');
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  if (rows.length === 0) {
    container.innerHTML = EmptyState('trophy', 'No Data Yet', 'Rankings will appear once there is activity to measure.');
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  if (activeTab === 'individual') {
    container.innerHTML = `
      <div class="divide-y divide-[rgba(15,23,42,0.05)]">
        ${rows.map((u, i) => `
          <div class="p-4 flex items-center gap-4 transition-colors ${u.isMe ? 'bg-[var(--color-primary)]/5' : 'hover:bg-black/[0.02]'}" id="${u.isMe ? 'my-rank' : ''}">
            <div class="w-8 font-bold text-center ${i < 3 ? 'text-xl' : 'text-secondary'}">
              ${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
            </div>

            <div class="w-10 h-10 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center font-bold text-sm shadow-[var(--clay-pressed)]">
              ${u.name.split(' ').map(n=>n[0]).join('')}
            </div>

            <div class="flex-1 min-w-0">
              <div class="font-bold text-primary flex items-center gap-2">
                ${u.name}
                ${u.isMe ? '<span class="clay-badge severity-info !py-0.5 !px-2 !text-[10px]">You</span>' : ''}
              </div>
              <div class="text-xs text-secondary truncate">${u.level}</div>
            </div>

            <div class="text-right">
              <div class="font-bold text-[var(--color-primary)]">${u.credits} CC</div>
              <div class="text-[10px] font-bold text-secondary flex items-center justify-end gap-1"><i data-lucide="activity" class="w-3 h-3"></i> ${u.impact}/100</div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }
  else {
    container.innerHTML = `
      <div class="divide-y divide-[rgba(15,23,42,0.05)]">
        ${rows.map((w, i) => `
          <div class="p-4 flex items-center gap-4 hover:bg-black/[0.02]">
            <div class="w-8 font-bold text-center ${i === 0 ? 'text-xl text-[#d99c41]' : 'text-secondary'}">
              ${i + 1}
            </div>

            <div class="flex-1 min-w-0">
              <div class="font-bold text-primary">${w.name}</div>
              <div class="text-xs text-secondary flex gap-3 mt-1">
                <span><strong class="text-primary">${w.reports}</strong> Reports</span>
                <span><strong class="text-[var(--color-healthy)]">${w.resolved}</strong> Resolved</span>
              </div>
            </div>

            <div class="text-right">
              <div class="font-bold text-primary flex items-center justify-end gap-1">
                ${w.score} <span class="text-[10px] text-secondary">/100</span>
              </div>
              <div class="text-[10px] font-bold text-secondary uppercase">Ward Score</div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  if (window.lucide) window.lucide.createIcons();
}

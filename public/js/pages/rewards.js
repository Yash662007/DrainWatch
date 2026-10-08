import { store } from '../store.js';
import { api } from '../api/api.js';
import { rewardConfig, calculateLevel } from '../data/reward-config.js';

export function render() {
  const user = store.state.user;
  const levelInfo = calculateLevel(user.credits);
  const nextLevel = rewardConfig.levels.find(l => l.min > user.credits);
  const progressPercent = nextLevel ? ((user.credits - levelInfo.min) / (nextLevel.min - levelInfo.min)) * 100 : 100;
  const creditsNeeded = nextLevel ? nextLevel.min - user.credits : 0;

  return `
    <div class="max-w-3xl mx-auto space-y-6 pb-20 animate-fade-in" id="rewards-container">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-section-title md:text-page-title flex items-center gap-3">
          <div class="p-2 bg-[var(--color-primary)]/10 rounded-xl">
            <i data-lucide="award" class="w-6 h-6 md:w-8 md:h-8 text-[var(--color-primary)]"></i>
          </div>
          Civic Rewards
        </h2>
        <a href="#/rewards/leaderboard" class="clay-btn clay-btn-ghost py-2 text-sm hidden md:flex"><i data-lucide="trophy" class="w-4 h-4"></i> Leaderboard</a>
      </div>

      <!-- Wallet Header -->
      <div class="clay-card p-6 md:p-8 bg-gradient-to-br from-[var(--surface)] to-black/5 relative overflow-hidden shadow-[var(--clay-raised)]">
        <div class="absolute -right-8 -top-8 w-40 h-40 bg-[var(--color-primary)] opacity-5 rounded-full blur-2xl"></div>

        <div class="flex flex-col md:flex-row justify-between md:items-end gap-6 relative z-10">
          <div>
            <div class="text-xs font-bold text-secondary uppercase tracking-wider mb-2">Total Balance</div>
            <div class="text-5xl font-bold text-primary flex items-end gap-2 mb-2">
              <span id="rewards-balance">${user.credits}</span> <span class="text-xl text-[var(--color-primary)] pb-1">CC</span>
            </div>
            <div class="clay-badge severity-info mt-1 !text-sm border border-[var(--color-primary)]/20">${levelInfo.name}</div>
          </div>

          <div class="w-full md:w-1/2">
            <div class="flex justify-between text-xs font-bold text-secondary uppercase tracking-wider mb-2">
              <span>Progress to next level</span>
              ${nextLevel ? `<span>${creditsNeeded} CC needed</span>` : '<span>Max Level Reached</span>'}
            </div>
            <div class="w-full bg-black/10 h-3 rounded-full overflow-hidden shadow-[var(--clay-pressed)] mb-2">
              <div class="h-full bg-[var(--color-primary)] transition-all duration-1000 ease-out" style="width: 0%" data-progress="${Math.min(100, Math.max(0, progressPercent))}%" id="level-progress-bar"></div>
            </div>
            ${nextLevel ? `<div class="text-right text-[10px] text-secondary font-bold">Next: ${nextLevel.name}</div>` : ''}
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Impact Score -->
        <div class="clay-card p-6 shadow-[var(--clay-raised)]" id="rewards-impact">
          <h3 class="text-card-title mb-6 flex items-center gap-2">
            <i data-lucide="activity" class="w-5 h-5 text-[var(--color-healthy)]"></i> Impact Score
          </h3>
          <div class="text-sm text-secondary">Loading...</div>
        </div>

        <!-- Transaction Ledger -->
        <div class="clay-card p-6 shadow-[var(--clay-raised)] flex flex-col">
          <h3 class="text-card-title mb-4 flex items-center gap-2">
            <i data-lucide="history" class="w-5 h-5 text-secondary"></i> Recent Activity
          </h3>
          <div class="flex-1 space-y-3 overflow-y-auto max-h-40 hide-scrollbar" id="rewards-ledger">
            <div class="text-sm text-secondary">Loading...</div>
          </div>
        </div>
      </div>

      <!-- Badges -->
      <section class="space-y-4">
        <h3 class="text-section-title">My Badges</h3>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4" id="rewards-badges">
          <div class="text-sm text-secondary col-span-full">Loading badges...</div>
        </div>
      </section>

      <!-- Mobile Leaderboard Button -->
      <div class="md:hidden mt-8">
        <a href="#/rewards/leaderboard" class="clay-btn w-full py-4 text-base shadow-[var(--clay-raised)]">
          <i data-lucide="trophy" class="w-5 h-5"></i> View Leaderboard
        </a>
      </div>

    </div>
  `;
}

export async function init() {
  if (window.lucide) window.lucide.createIcons();

  // Animate progress bar
  requestAnimationFrame(() => {
    const bar = document.getElementById('level-progress-bar');
    if (bar) {
      setTimeout(() => {
        bar.style.width = bar.dataset.progress;
      }, 100);
    }
  });

  try {
    const [ledger, badges, profile] = await Promise.all([
      api.getLedger(),
      api.getBadges(),
      api.getProfile()
    ]);
    renderImpact(profile);
    renderLedger(ledger);
    renderBadges(badges);
  } catch (e) {
    // Leave loading placeholders if this fails; core wallet info above still renders.
  }
}

function renderImpact(profile) {
  const container = document.getElementById('rewards-impact');
  if (!container) return;
  const score = profile.verifiedAccuracy;
  container.innerHTML = `
    <h3 class="text-card-title mb-6 flex items-center gap-2">
      <i data-lucide="activity" class="w-5 h-5 text-[var(--color-healthy)]"></i> Impact Score
    </h3>
    <div class="flex items-center gap-6">
      <div class="relative w-24 h-24 shrink-0 flex items-center justify-center">
        <svg class="w-full h-full -rotate-90" viewBox="0 0 36 36">
          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(15,23,42,0.1)" stroke-width="3" stroke-dasharray="100, 100" />
          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--color-healthy)" stroke-width="3" stroke-dasharray="${score}, 100" />
        </svg>
        <div class="absolute inset-0 flex flex-col items-center justify-center">
          <span class="text-xl font-bold">${score}</span>
          <span class="text-[10px] text-secondary font-bold">/100</span>
        </div>
      </div>
      <div class="space-y-3 flex-1">
        <div class="flex justify-between items-center bg-black/5 px-3 py-2 rounded-lg">
          <span class="text-xs font-bold text-secondary">Reports Submitted</span>
          <span class="text-sm font-bold text-primary">${profile.reportsSubmitted}</span>
        </div>
        <div class="flex justify-between items-center bg-black/5 px-3 py-2 rounded-lg">
          <span class="text-xs font-bold text-secondary">Community Rank</span>
          <span class="text-sm font-bold text-primary">#${profile.communityRank}</span>
        </div>
      </div>
    </div>
  `;
  if (window.lucide) window.lucide.createIcons();
}

function renderLedger(ledger) {
  const container = document.getElementById('rewards-ledger');
  if (!container) return;

  if (ledger.length === 0) {
    container.innerHTML = `<div class="text-sm text-secondary">No activity yet. Submit a report to start earning Civic Credits.</div>`;
    return;
  }

  container.innerHTML = ledger.map(t => `
    <div class="flex justify-between items-center border-b border-[rgba(15,23,42,0.05)] pb-2 last:border-0 last:pb-0">
      <div class="flex items-center gap-3">
        <i data-lucide="${t.icon}" class="w-4 h-4" style="color: ${t.color}"></i>
        <div>
          <div class="text-sm font-bold text-primary">${t.action}</div>
          <div class="text-[10px] text-secondary">${new Date(t.time).toLocaleString()}</div>
        </div>
      </div>
      <div class="font-bold font-mono text-sm" style="color: ${t.pts.startsWith('+') ? 'var(--color-healthy)' : 'var(--color-critical)'}">${t.pts} CC</div>
    </div>
  `).join('');
  if (window.lucide) window.lucide.createIcons();
}

function renderBadges(badges) {
  const container = document.getElementById('rewards-badges');
  if (!container) return;

  container.innerHTML = badges.map(b => `
    <div class="clay-card p-4 flex flex-col items-center text-center relative overflow-hidden ${b.unlocked ? 'border-b-4' : 'opacity-60 grayscale'}" style="${b.unlocked ? 'border-bottom-color: var(--color-primary)' : ''}">
      <div class="w-14 h-14 rounded-full flex items-center justify-center mb-3 shadow-[var(--clay-pressed)] bg-black/5">
        <i data-lucide="${b.icon}" class="w-7 h-7 ${b.unlocked ? 'text-[var(--color-primary)]' : 'text-secondary'}"></i>
      </div>
      <h4 class="font-bold text-sm text-primary leading-tight mb-1">${b.name}</h4>
      <p class="text-[10px] text-secondary leading-tight mb-4">${b.desc}</p>

      <div class="w-full bg-black/10 h-1.5 rounded-full overflow-hidden mt-auto shadow-[var(--clay-pressed)]">
        <div class="h-full ${b.unlocked ? 'bg-[var(--color-healthy)]' : 'bg-[var(--color-primary)] opacity-50'}" style="width: ${b.progress}%"></div>
      </div>
      ${!b.unlocked ? `<i data-lucide="lock" class="absolute top-2 right-2 w-4 h-4 text-secondary opacity-50"></i>` : ''}
    </div>
  `).join('');
  if (window.lucide) window.lucide.createIcons();
}

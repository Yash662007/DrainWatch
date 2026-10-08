import { store } from '../store.js';
import { EmptyState } from '../ui/components.js';

export function render() {
  const mockNotifications = [
    { type: 'credit', title: 'Credits Earned!', desc: 'You earned 25 Civic Credits for a verified report.', time: '2 mins ago', unread: true, icon: 'award', color: 'var(--color-healthy)' },
    { type: 'alert', title: 'AI Predictive Alert', desc: 'Drain DR-1048 risk elevated to Critical.', time: '1 hour ago', unread: true, icon: 'alert-triangle', color: 'var(--color-critical)' },
    { type: 'wo', title: 'Work Order Resolved', desc: 'Your report #REP-4092 has been resolved.', time: '3 hours ago', unread: false, icon: 'check-circle', color: 'var(--color-primary)' },
    { type: 'badge', title: 'Badge Unlocked!', desc: 'You unlocked the "Local Watcher" badge.', time: '1 day ago', unread: false, icon: 'star', color: 'var(--color-warning)' }
  ];

  return `
    <div class="max-w-2xl mx-auto space-y-6 pb-20 animate-fade-in">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-page-title flex items-center gap-3">
          <i data-lucide="bell" class="w-8 h-8 text-[var(--color-primary)]"></i> Notifications
        </h2>
        <button class="clay-btn clay-btn-ghost text-xs" onclick="window.markAllRead()">Mark all as read</button>
      </div>
      
      <div class="clay-card p-0 overflow-hidden divide-y divide-[rgba(15,23,42,0.05)] shadow-[var(--clay-raised)]">
        ${mockNotifications.map(n => `
          <div class="p-4 flex gap-4 transition-colors hover:bg-black/[0.02] cursor-pointer ${n.unread ? 'bg-[var(--color-primary)]/5' : ''}">
            <div class="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-[var(--clay-pressed)]" style="background: ${n.color}20">
              <i data-lucide="${n.icon}" class="w-5 h-5" style="color: ${n.color}"></i>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex justify-between items-start mb-1">
                <div class="font-bold text-primary text-sm ${n.unread ? '' : 'opacity-80'}">${n.title}</div>
                <div class="text-[10px] text-secondary whitespace-nowrap ml-2">${n.time}</div>
              </div>
              <p class="text-sm text-secondary leading-tight">${n.desc}</p>
            </div>
            ${n.unread ? `<div class="w-2 h-2 rounded-full bg-[var(--color-primary)] mt-1.5 shrink-0"></div>` : ''}
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

export function init() {
  if (window.lucide) window.lucide.createIcons();
}

window.markAllRead = function() {
  import('../ui/toast.js').then(m => m.Toast.show('All notifications marked as read', 'success'));
  // In a real app we'd update state and re-render
}
